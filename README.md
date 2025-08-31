
## Project Overview

This project is a Vite + React + TypeScript app with an Express backend. It demonstrates:

- A web voice assistant using `@vapi-ai/web` (client SDK)
- Backend integrations using `@vapi-ai/server-sdk`
- A simple keypad UI to place calls via Vapi using your phone number and assistant
- A dev setup that runs Client (Vite) and Server (Express) concurrently

## Prerequisites

- Node.js 18+ and npm
- Vapi account with:
  - Public Web API Key
  - Server (private) API Key
  - Assistant ID
  - Phone Number ID (for outbound calls/campaigns)

## Quick Start

1) Install dependencies

```
npm i
```

2) Create a `.env` file in the project root (same folder as `package.json`). See the full guide below.

3) Start development (client + server):

```
npm run dev
```

- Frontend: http://localhost:8080
- Backend: http://localhost:3001

## Environment Variables (very important)

You will use two categories of environment variables:

- Backend (private): NEVER expose in client or commit to public repos.
- Frontend (public): Must be prefixed with `VITE_` because Vite injects them into the browser bundle.

Create a `.env` file at the project root with the following content:

```
# Backend (private - used only by Express server)
VAPI_API_KEY=your_private_server_token
PORT=3001

# Frontend (public - safe to expose in browser)
VITE_VAPI_PUBLIC_API_KEY=your_public_web_api_key
VITE_ASSISTANT_ID=your_assistant_id
VITE_DEFAULT_PHONE_NUMBER_ID=your_phone_number_id

```

Where are these used?

- `VAPI_API_KEY` (private)
  - Read by `server/index.ts` via `dotenv` and passed to `new VapiClient({ token: process.env.VAPI_API_KEY })`.
  - Used to create outbound calls/campaigns securely from the server.

- `VITE_VAPI_PUBLIC_API_KEY` (public)
  - Read in `src/pages/Index.tsx` and passed to the client SDK (`@vapi-ai/web`) via the `VoiceAgent` component.

- `VITE_ASSISTANT_ID` (public)
  - Read in `src/pages/Index.tsx` and passed to both `VoiceAgent` and the outbound call form.

- `VITE_DEFAULT_PHONE_NUMBER_ID` (public)
  - Prefills the keypad form so students can quickly test calling from their assigned number.

- `VITE_TRANSCRIPT_WEBHOOK_URL` (public, optional)
  - If set, when the call ends, the app POSTs the final transcript to this webhook from the browser.

Important notes:

- After editing `.env`, restart dev with `npm run dev` (Vite does not reload env automatically).
- Do not put the server token into any `VITE_` variable.
- Add `.env` to `.gitignore` to avoid committing secrets.

## How the app is structured

Key files:

- `server/index.ts` (Express):
  - Health endpoint: `GET /api/health`
  - Outbound call: `POST /api/vapi/outbound-call`
  - Outbound campaign: `POST /api/vapi/outbound-campaign`
  - Validates and normalizes phone numbers to E.164-like format.
  - Uses `@vapi-ai/server-sdk` with your private `VAPI_API_KEY`.

- `vite.config.ts` (Vite dev server):
  - Proxies `/api` from `http://localhost:8080` to `http://localhost:3001`.

- `src/pages/Index.tsx` (React):
  - Reads `VITE_*` variables.
  - Renders the Voice Assistant and the Outbound Call keypad form.

- `src/components/voice/VoiceAgent.tsx`:
  - Uses `@vapi-ai/web` to start/stop calls.
  - Listens to call events and collects transcript.
  - De-duplicates transcripts to avoid repeating the same line twice.
  - Optionally POSTs transcripts at call end to `VITE_TRANSCRIPT_WEBHOOK_URL`.

- `src/components/voice/OutboundCallForm.tsx`:
  - A phone-like keypad UI where users only enter the destination number.
  - Calls `POST /api/vapi/outbound-campaign` with the assistant and phone number IDs.

## Dev scripts

- `npm run dev` — start client (8080) and server (3001) concurrently.
- `npm run dev:client` — start only Vite client.
- `npm run dev:server` — start only the Express server in watch mode.
- `npm run build` — build client assets.
- `npm run build:server` — type-check/emit server to `dist-server`.
- `npm run start:server` — run compiled server.

## API endpoints

- `GET /api/health` — quick status.
- `POST /api/vapi/outbound-call`
  - Body: `{ phoneNumberId, assistantId, customer: { number, name? } }`
  - Returns the call (or batch) result.

- `POST /api/vapi/outbound-campaign`
  - Body: `{ name, phoneNumberId, assistantId, customer: { number, name? } }`
  - Creates a campaign with the provided customer.

## How the proxy works (8080 -> 3001)

The frontend calls relative paths like `/api/vapi/outbound-campaign`. In dev, Vite proxies these requests to the Express server. This avoids CORS issues and keeps your code cleaner.

## Security tips

- Keep `VAPI_API_KEY` on the server only.
- Do not log secrets.
- Prefer server-side integrations for outbound calls; do not expose privileged operations in the browser.

## Troubleshooting

- Missing `VAPI_API_KEY`:
  - The server will log an error and outbound requests will fail. Set it in `.env` and restart.

- Proxy not working:
  - Make sure `npm run dev` is used (starts both servers), and do not hardcode `http://localhost:3001` in the client; use `/api/...`.

- Transcript not received at webhook:
  - Ensure `VITE_TRANSCRIPT_WEBHOOK_URL` is set correctly.
  - Check browser console/network tab for POST errors.

## What students will learn

- How to separate private (server) and public (client) environment variables
- How to send calls via Vapi from a secure backend
- How to build a small dialer UI and integrate it with a backend
- How to handle real-time voice events and transcripts
