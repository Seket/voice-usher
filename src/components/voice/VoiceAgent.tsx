import React, { useState, useEffect, useCallback, useRef } from "react";
import Vapi from "@vapi-ai/web";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, PhoneOff, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

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
  config = {},
}) => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [callEnded, setCallEnded] = useState(false);
  const seenTranscriptsRef = useRef<Set<string>>(new Set());
  const transcriptRef = useRef<TranscriptMessage[]>([]);

  const initializeVapi = useCallback(() => {
    try {
      const vapiInstance = new Vapi(apiKey);
      setVapi(vapiInstance);

      // Event listeners
      vapiInstance.on("call-start", () => {
        setIsConnected(true);
        setError(null);
        setCallEnded(false);
        seenTranscriptsRef.current.clear();
      });

      vapiInstance.on("call-end", () => {
        setIsConnected(false);
        setIsSpeaking(false);
        setIsListening(false);
        setCallEnded(true);
        seenTranscriptsRef.current.clear();

        // Reset call e   vapiInstance.stop();nded state after animation
        setTimeout(() => {
          setCallEnded(false);
          vapiInstance.stop();
        }, 3000);
      });

      vapiInstance.on("speech-start", () => {
        setIsSpeaking(true);
        setIsListening(false);
      });

      vapiInstance.on("speech-end", () => {
        setIsSpeaking(false);
        setIsListening(true);
      });

      type VapiMessage = { type: string; role?: string; transcript?: string };
      vapiInstance.on("message", (message: VapiMessage) => {
        if (message.type === "transcript") {
          const role = String(message.role ?? "");
          const text = String(message.transcript ?? "").trim();
          if (!text) return;

          const key = `${role}|${text}`;
          if (seenTranscriptsRef.current.has(key)) return;
          seenTranscriptsRef.current.add(key);

          setTranscript((prev) => [
            ...prev,
            { role, text, timestamp: Date.now() },
          ]);
        }
      });

      vapiInstance.on("error", () => {
        setError("Error connecting to voice assistant. Please try again.");
      });

      return vapiInstance;
    } catch (err) {
      console.error("Failed to initialize Vapi:", err);
      setError("Failed to initialize voice assistant.");
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

  // Keep a live ref of transcript for webhook payload
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const startCall = async () => {
    if (!vapi) return;

    try {
      setError(null);
      setTranscript([]);
      await vapi.start(assistantId);
      setIsListening(true);
    } catch (err) {
      console.error("Failed to start call:", err);
      setError("Failed to start voice call. Please check your permissions.");
    }
  };

  const endCall = async () => {
    if (!vapi) return;

    try {
      await vapi.stop();
    } catch (err) {
      console.error("Failed to end call:", err);
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
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );

  const AgentAvatar = () => (
    <div
      className={cn(
        "relative w-24 h-24 mx-auto mb-6",
        "bg-gradient-voice rounded-full flex items-center justify-center",
        "transition-all duration-500",
        isSpeaking && "voice-pulse shadow-glow scale-110",
        isListening && "animate-pulse"
      )}
    >
      <Bot className="w-12 h-12 text-primary-foreground" />

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute inset-0 rounded-full border-4 border-voice-speaking animate-ping" />
      )}

      {/* Listening indicator */}
      {isListening && (
        <div className="absolute inset-0 rounded-full border-2 border-voice-listening animate-pulse" />
      )}
    </div>
  );

  const CallEndedAnimation = () => (
    <div
      className={cn(
        "fixed inset-0 bg-background/90 backdrop-blur-sm z-50",
        "flex items-center justify-center transition-all duration-1000",
        callEnded ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="text-center space-y-6 animate-fade-in">
        <div className="w-32 h-32 mx-auto bg-muted rounded-full flex items-center justify-center">
          <PhoneOff className="w-16 h-16 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Call Ended</h2>
          <p className="text-muted-foreground">
            Thank you for using our voice assistant
          </p>
        </div>
      </div>
    </div>
  );

  if (!isConnected && !callEnded) {
    return (
      <>
        <div className="flex flex-col items-center space-y-6">
          <AgentAvatar />

          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">AI Voice Assistant</h2>
            <p className="text-muted-foreground max-w-md">
              Ready to have a natural conversation. Click the button below to
              start talking.
            </p>
          </div>

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
              <span className="text-lg">Start Conversation</span>
            </div>
            <div className="absolute inset-0 bg-gradient-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>

          {error && (
            <Card className="p-4 border-destructive bg-destructive/10">
              <p className="text-destructive text-sm">{error}</p>
            </Card>
          )}
        </div>
        <CallEndedAnimation />
      </>
    );
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto p-6 space-y-6 bg-card shadow-card border-border/50">
        {/* Agent Avatar */}
        <AgentAvatar />

        {/* Status Header */}
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">
            {isSpeaking
              ? "Assistant Speaking..."
              : isListening
              ? "Listening..."
              : "Connected"}
          </h3>
          {(isSpeaking || isListening) && (
            <div className="flex justify-center">
              <VoiceWave isActive={isSpeaking} />
            </div>
          )}
        </div>

        {/* Control Button */}
        <div className="flex justify-center">
          <Button
            onClick={endCall}
            variant="destructive"
            size="lg"
            className="flex items-center space-x-2 px-6 py-3 rounded-full"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Call</span>
          </Button>
        </div>

        {/* Transcript */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground">
            Conversation:
          </h4>
          <div className="max-h-64 overflow-y-auto space-y-3 p-4 bg-muted/50 rounded-lg">
            {transcript.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Your conversation will appear here...
              </p>
            ) : (
              transcript.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start space-x-2",
                    msg.role === "user"
                      ? "flex-row-reverse space-x-reverse"
                      : ""
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                      msg.role === "user" ? "bg-primary" : "bg-secondary"
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="w-3 h-3 text-primary-foreground" />
                    ) : (
                      <Bot className="w-3 h-3 text-secondary-foreground" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] px-3 py-2 rounded-lg text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
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
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-voice-active" : "bg-voice-inactive"
            )}
          />
          <span>Status: {isConnected ? "Connected" : "Disconnected"}</span>
        </div>
      </Card>

      <CallEndedAnimation />
    </>
  );
};

export default VoiceAgent;
