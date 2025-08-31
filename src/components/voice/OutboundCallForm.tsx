import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Delete } from "lucide-react";

interface OutboundCallFormProps {
  defaultPhoneNumberId?: string;
  defaultAssistantId?: string;
}

function sanitizePhoneInput(input: string): string {
  return (input ?? "").replace(/[^0-9+]/g, "");
}

const OutboundCallForm: React.FC<OutboundCallFormProps> = ({
  defaultPhoneNumberId,
  defaultAssistantId,
}) => {
  const [phoneNumberId] = useState<string>(defaultPhoneNumberId ?? "");
  const [assistantId] = useState<string>(defaultAssistantId ?? "");
  const [customerNumber, setCustomerNumber] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const keypad: string[] = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "+",
    "0",
    "<",
  ];

  function handleKeyPress(key: string) {
    setError("");
    setMessage("");
    if (key === "<") {
      setCustomerNumber((prev) => prev.slice(0, -1));
      return;
    }
    if (key === "+") {
      // Allow + only at the start
      setCustomerNumber((prev) =>
        prev.startsWith("+") || prev.length > 0 ? prev : "+"
      );
      return;
    }
    // Digits
    setCustomerNumber((prev) => {
      const digitsOnly = sanitizePhoneInput(prev + key);
      // Limit to max 16 characters including +
      if (digitsOnly.length > 16) return prev;
      return digitsOnly;
    });
  }

  function handleClear() {
    setCustomerNumber("");
    setError("");
    setMessage("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    const trimmedPhoneNumberId = phoneNumberId.trim();
    const trimmedAssistantId = assistantId.trim();
    const sanitizedCustomerNumber = sanitizePhoneInput(customerNumber).trim();

    if (!trimmedPhoneNumberId) {
      setError("Phone Number ID is required.");
      return;
    }
    if (!trimmedAssistantId) {
      setError("Assistant ID is required.");
      return;
    }
    if (!sanitizedCustomerNumber || sanitizedCustomerNumber.length < 7) {
      setError("Customer phone number is invalid.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/vapi/outbound-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Web Campaign",
          phoneNumberId: trimmedPhoneNumberId,
          assistantId: trimmedAssistantId,
          customer: { number: sanitizedCustomerNumber },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Request failed");
      }
      setMessage(`Campaign created with id: ${data?.id ?? "unknown"}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unexpected error";
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted rounded-xl p-4 text-center">
        <div className="text-xs text-muted-foreground mb-1">Phone Number</div>
        <div className="text-2xl font-mono tracking-wide min-h-[2.25rem]">
          {customerNumber || "Enter number"}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">
          Paste or type number
        </label>
        <Input
          placeholder="e.g. (985) 307-5465"
          value={customerNumber}
          onChange={(e) =>
            setCustomerNumber(sanitizePhoneInput(e.target.value))
          }
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text");
            setCustomerNumber(sanitizePhoneInput(text));
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {keypad.map((key) => (
          <Button
            key={key}
            type="button"
            variant="outline"
            className="h-14 text-xl"
            onClick={() => handleKeyPress(key)}
            disabled={isSubmitting}
          >
            {key === "<" ? <Delete className="w-5 h-5" /> : key}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClear}
          disabled={isSubmitting}
        >
          Clear
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || customerNumber.trim().length < 7}
          className="flex-1 gap-2"
        >
          <Phone className="w-5 h-5" />
          {isSubmitting ? "Calling..." : "Call"}
        </Button>
      </div>

      <div className="min-h-[1.25rem]">
        {message && <span className="text-sm text-green-600">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
};

export default OutboundCallForm;
