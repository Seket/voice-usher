import React, { useState } from 'react';
import HeroSection from '@/components/hero/HeroSection';
import VoiceAgent from '@/components/voice/VoiceAgent';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Index = () => {
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);
  
  // Your Vapi credentials
  const VAPI_API_KEY = "5fed0108-b1ca-4597-a237-bdf0215e170c";
  const ASSISTANT_ID = "5e24c91f-3830-4e26-812f-51429bf5e662";

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
            <h1 className="text-2xl font-bold gradient-text">Voice Assistant</h1>
          </div>

          <VoiceAgent 
            apiKey={VAPI_API_KEY}
            assistantId={ASSISTANT_ID}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection onStartVoice={handleStartVoice} />
    </div>
  );
};

export default Index;
