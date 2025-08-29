import React, { useState, useEffect, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceAgentProps {
  apiKey: string;
  assistantId: string;
  config?: Record<string, unknown>;
}

interface TranscriptMessage {
  role: string;
  text: string;
  timestamp: number;
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ 
  apiKey, 
  assistantId, 
  config = {} 
}) => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const initializeVapi = useCallback(() => {
    try {
      const vapiInstance = new Vapi(apiKey);
      setVapi(vapiInstance);

      // Event listeners
      vapiInstance.on('call-start', () => {
        console.log('Call started');
        setIsConnected(true);
        setError(null);
      });

      vapiInstance.on('call-end', () => {
        console.log('Call ended');
        setIsConnected(false);
        setIsSpeaking(false);
        setIsListening(false);
      });

      vapiInstance.on('speech-start', () => {
        console.log('Assistant started speaking');
        setIsSpeaking(true);
        setIsListening(false);
      });

      vapiInstance.on('speech-end', () => {
        console.log('Assistant stopped speaking');
        setIsSpeaking(false);
        setIsListening(true);
      });

      vapiInstance.on('message', (message: any) => {
        if (message.type === 'transcript') {
          setTranscript(prev => [...prev, {
            role: message.role,
            text: message.transcript,
            timestamp: Date.now()
          }]);
        }
      });

      vapiInstance.on('error', (error: any) => {
        console.error('Vapi error:', error);
        setError('Error connecting to voice assistant. Please try again.');
      });

      return vapiInstance;
    } catch (err) {
      console.error('Failed to initialize Vapi:', err);
      setError('Failed to initialize voice assistant.');
      return null;
    }
  }, [apiKey]);

  useEffect(() => {
    const vapiInstance = initializeVapi();
    
    return () => {
      if (vapiInstance) {
        vapiInstance.stop();
      }
    };
  }, [initializeVapi]);

  const startCall = async () => {
    if (!vapi) return;
    
    try {
      setError(null);
      await vapi.start(assistantId);
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start call:', err);
      setError('Failed to start voice call. Please check your permissions.');
    }
  };

  const endCall = async () => {
    if (!vapi) return;
    
    try {
      await vapi.stop();
    } catch (err) {
      console.error('Failed to end call:', err);
    }
  };

  const VoiceWave = ({ isActive }: { isActive: boolean }) => (
    <div className="flex items-center space-x-1">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-primary rounded-full transition-all duration-150",
            isActive ? "h-8 voice-wave" : "h-2"
          )}
          style={{
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <Button
          onClick={startCall}
          size="lg"
          className={cn(
            "relative overflow-hidden group",
            "bg-gradient-voice hover:bg-gradient-voice",
            "text-primary-foreground font-semibold",
            "px-8 py-6 rounded-2xl transition-all duration-300",
            "voice-glow hover:scale-105"
          )}
          disabled={!vapi}
        >
          <div className="flex items-center space-x-3">
            <Mic className="w-6 h-6" />
            <span className="text-lg">Hablar con Asistente</span>
          </div>
          <div className="absolute inset-0 bg-gradient-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
        
        {error && (
          <Card className="p-4 border-destructive bg-destructive/10">
            <p className="text-destructive text-sm">{error}</p>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto p-6 space-y-6 bg-card shadow-card border-border/50">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-3 h-3 rounded-full transition-all duration-300",
            isSpeaking ? "bg-voice-speaking voice-pulse" : 
            isListening ? "bg-voice-listening voice-pulse" : "bg-voice-inactive"
          )} />
          <div>
            <p className="font-semibold text-sm">
              {isSpeaking ? 'Asistente hablando...' : 
               isListening ? 'Escuchando...' : 'Conectado'}
            </p>
            {(isSpeaking || isListening) && (
              <VoiceWave isActive={isSpeaking} />
            )}
          </div>
        </div>
        
        <Button
          onClick={endCall}
          variant="destructive"
          size="sm"
          className="flex items-center space-x-2"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Terminar</span>
        </Button>
      </div>

      {/* Transcript */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground">Conversación:</h3>
        <div className="max-h-64 overflow-y-auto space-y-3 p-4 bg-muted/50 rounded-lg">
          {transcript.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              La conversación aparecerá aquí...
            </p>
          ) : (
            transcript.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div className={cn(
                  "max-w-[80%] px-3 py-2 rounded-lg text-sm",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground"
                )}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-xs opacity-70 block mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Footer */}
      <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isConnected ? "bg-voice-active" : "bg-voice-inactive"
        )} />
        <span>Estado: {isConnected ? 'Conectado' : 'Desconectado'}</span>
      </div>
    </Card>
  );
};

export default VoiceAgent;