import { useState } from "react";
import HeroSection from "@/components/hero/HeroSection";
import VoiceAgent from "@/components/voice/VoiceAgent";
import OutboundCallForm from "@/components/voice/OutboundCallForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const DISPLAY_OUTBOUND_CALL_FORM = false;

const Index = () => {
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);
  const VAPI_PUBLIC_API_KEY = import.meta.env.VITE_VAPI_PUBLIC_API_KEY ?? "";
  const ASSISTANT_ID = import.meta.env.VITE_ASSISTANT_ID ?? "";
  const DEFAULT_PHONE_NUMBER_ID =
    import.meta.env.VITE_DEFAULT_PHONE_NUMBER_ID ?? "";

  const handleStartVoice = () => {
    setShowVoiceAgent(true);
  };

  const handleBackToHero = () => {
    setShowVoiceAgent(false);
  };

  if (showVoiceAgent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <Button
              onClick={handleBackToHero}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <h1 className="text-2xl font-bold gradient-text">
              Voice Assistant
            </h1>
          </div>

          <VoiceAgent apiKey={VAPI_PUBLIC_API_KEY} assistantId={ASSISTANT_ID} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection onStartVoice={handleStartVoice} />
      {DISPLAY_OUTBOUND_CALL_FORM && (
        <div className="container mx-auto px-6 py-10">
          <div className="max-w-2xl mx-auto bg-card border rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">Create Outbound Call</h2>
            <OutboundCallForm
              defaultPhoneNumberId={DEFAULT_PHONE_NUMBER_ID}
              defaultAssistantId={ASSISTANT_ID}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
