import React, { useState } from 'react';
import HeroSection from '@/components/hero/HeroSection';
import VoiceAgent from '@/components/voice/VoiceAgent';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Index = () => {
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);
  
  // Replace with your actual Vapi credentials
  const VAPI_API_KEY = "your_public_api_key_here";
  const ASSISTANT_ID = "your_assistant_id_here";

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
              <span>Volver</span>
            </Button>
            <h1 className="text-2xl font-bold gradient-text">Asistente de Voz</h1>
          </div>

          {VAPI_API_KEY === "your_public_api_key_here" ? (
            <Card className="p-8 text-center space-y-4">
              <h2 className="text-xl font-semibold">Configuración Requerida</h2>
              <p className="text-muted-foreground">
                Para usar el asistente de voz, necesitas configurar tus credenciales de Vapi:
              </p>
              <div className="bg-muted p-4 rounded-lg text-left text-sm font-mono">
                <p>1. Obtén tu API key de <a href="https://vapi.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">vapi.ai</a></p>
                <p>2. Crea un asistente y obtén su ID</p>
                <p>3. Actualiza VAPI_API_KEY y ASSISTANT_ID en el código</p>
              </div>
            </Card>
          ) : (
            <VoiceAgent 
              apiKey={VAPI_API_KEY}
              assistantId={ASSISTANT_ID}
            />
          )}
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
