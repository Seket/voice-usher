import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { VapiClient } from "@vapi-ai/server-sdk";
type VapiCallsCreateResponse =
  | { id: string }
  | { results?: Array<{ id: string }>; errors?: unknown[] };
import { z } from "zod";

const app = express();

// Load environment variables
dotenv.config();

// Config
const PORT = Number(process.env.PORT || 3001);
const NODE_ENV = process.env.NODE_ENV || "development";
const VAPI_API_KEY = process.env.VAPI_API_KEY;

if (!VAPI_API_KEY) {
  console.error("[server] Missing VAPI_API_KEY in environment");
}

// Initialize Vapi client (lazy for tests could be an option)
const vapi = new VapiClient({ token: VAPI_API_KEY ?? "" });

// Middlewares
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Helpers
function normalizeToE164Like(
  input: string,
  defaultCountryCode = "1"
): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("+")) {
    const digits = raw.replace(/\D/g, "");
    return digits ? `+${digits}` : null;
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+${defaultCountryCode}${digits}`;
  if (digits.length >= 7 && digits.length <= 15) return `+${digits}`;
  return null;
}

// Validation schema for outbound call
const OutboundCallSchema = z.object({
  phoneNumberId: z.string().min(1, "phoneNumberId is required"),
  assistantId: z.string().min(1, "assistantId is required"),
  customer: z.object({
    number: z.string().min(7, "customer.number is required"),
    name: z.string().optional(),
  }),
});

// Create outbound call via Vapi
app.post("/api/vapi/outbound-call", async (req: Request, res: Response) => {
  try {
    if (!VAPI_API_KEY) {
      return res.status(500).json({ error: "Server not configured for Vapi" });
    }

    const parsed = OutboundCallSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const { phoneNumberId, assistantId, customer } = parsed.data;
    const sanitizedNumber = normalizeToE164Like(customer.number);
    if (!sanitizedNumber) {
      return res.status(400).json({ error: "Invalid customer number" });
    }
    const callResponse = (await vapi.calls.create({
      phoneNumberId,
      assistantId,
      customer: { ...customer, number: sanitizedNumber },
    })) as VapiCallsCreateResponse;
    const callId =
      "id" in callResponse ? callResponse.id : callResponse.results?.[0]?.id;
    return res.status(201).json({ id: callId, call: callResponse });
  } catch (error) {
    console.error("[server] Failed to create Vapi call", error);
    return res.status(502).json({ error: "Failed to create call" });
  }
});

// Create outbound campaign via Vapi (single-customer campaign for now)
const OutboundCampaignSchema = z.object({
  phoneNumberId: z.string().min(1, "phoneNumberId is required"),
  assistantId: z.string().min(1, "assistantId is required"),
  name: z.string().min(1, "name is required").default("Web Campaign"),
  customer: z.object({
    number: z.string().min(7, "customer.number is required"),
    name: z.string().optional(),
  }),
});

app.post("/api/vapi/outbound-campaign", async (req: Request, res: Response) => {
  try {
    if (!VAPI_API_KEY) {
      return res.status(500).json({ error: "Server not configured for Vapi" });
    }

    const parsed = OutboundCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const { phoneNumberId, assistantId, name, customer } = parsed.data;
    const sanitizedNumber = normalizeToE164Like(customer.number);
    if (!sanitizedNumber) {
      return res.status(400).json({ error: "Invalid customer number" });
    }

    const campaign = await vapi.campaigns.campaignControllerCreate({
      name,
      phoneNumberId,
      assistantId,
      customers: [{ number: sanitizedNumber, name: customer.name }],
    });

    return res.status(201).json({ id: campaign.id, campaign });
  } catch (error) {
    console.error("[server] Failed to create Vapi campaign", error);
    return res.status(502).json({ error: "Failed to create campaign" });
  }
});

// Healthcheck
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", env: NODE_ENV });
});

// 404 handler for unknown API routes
app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const message =
    NODE_ENV === "development" ? err.message : "Internal Server Error";
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
});
