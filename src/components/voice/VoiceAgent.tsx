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

const deduplicateTranscript = (
  messages: TranscriptMessage[]
): TranscriptMessage[] => {
  const seenKeys = new Set<string>();
  const uniqueMessages: TranscriptMessage[] = [];
  for (const message of messages) {
    const key = `${message.role}|${message.text}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    uniqueMessages.push(message);
  }
  return uniqueMessages;
};

const VoiceAgent: React.FC<VoiceAgentProps> = ({
  apiKey,
  assistantId,
  config = {},
}) => {
  const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL as
    | string
    | undefined;
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
        const finalTranscript = deduplicateTranscript(transcriptRef.current);
        if (N8N_WEBHOOK_URL) {
          const payload = {
            transcript: finalTranscript,
            endedAt: Date.now(),
          };
          void fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
        seenTranscriptsRef.current.clear();
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
      setError("Failed to initialize voice assistant.");
      return null;
    }
  }, [apiKey, N8N_WEBHOOK_URL]);

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
      setError("Failed to start voice call. Please check your permissions.");
    }
  };

  const endCall = async () => {
    if (!vapi) return;

    try {
      await vapi.stop();
    } catch (err) {
      // Intentionally swallow
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
    <div className="relative w-32 h-32 mx-auto mb-8">
      {/* Main gradient orb */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-700",
          !isConnected && "gradient-orb",
          isSpeaking && "gradient-orb-speaking",
          isListening && !isSpeaking && "gradient-orb-listening"
        )}
      />

      {/* Inner content */}
      <div className="absolute inset-2 bg-background/90 rounded-full flex items-center justify-center backdrop-blur-sm">
        <div
          className={cn(
            "relative w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center transition-all duration-500",
            isSpeaking && "bg-voice-speaking/30 scale-110",
            isListening && "bg-voice-listening/30 animate-pulse"
          )}
        >
          <Bot className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Outer pulse rings for speaking */}
      {isSpeaking && (
        <>
          <div className="absolute -inset-4 rounded-full border border-primary/30 animate-ping" />
          <div
            className="absolute -inset-8 rounded-full border border-primary/20 animate-ping"
            style={{ animationDelay: "0.5s" }}
          />
        </>
      )}
    </div>
  );

  const CallEndedAnimation = () => (
    <div
      className={cn(
        "fixed inset-0 bg-background/95 backdrop-blur-md z-50",
        "flex items-center justify-center transition-all duration-1000",
        callEnded ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="text-center space-y-8 animate-fade-in">
        {/* Animated ending orb */}
        <div className="relative w-40 h-40 mx-auto">
          <div className="absolute inset-0 bg-gradient-orb rounded-full call-end-animation" />
          <div className="absolute inset-4 bg-background/90 rounded-full flex items-center justify-center backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <PhoneOff className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          {/* Fade out rings */}
          <div className="absolute -inset-8 rounded-full border border-primary/20 animate-ping opacity-30" />
          <div
            className="absolute -inset-16 rounded-full border border-primary/10 animate-ping opacity-20"
            style={{ animationDelay: "0.5s" }}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-bold gradient-text">Call Ended</h2>
          <p className="text-muted-foreground text-lg">
            Thank you for using our AI assistant
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground/80">
            <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" />
            <span>Session completed</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isConnected && !callEnded) {
    return (
      <>
        <div className="flex flex-col items-center space-y-8 min-h-[80vh] justify-center">
          <AgentAvatar />

          <div className="text-center space-y-6 max-w-lg mx-auto">
            <h2 className="text-4xl font-bold gradient-text">
              AI Voice Assistant
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Ready to have a natural conversation. Click the button below to
              start talking.
            </p>
          </div>

          <div className="relative">
            <Button
              onClick={startCall}
              size="lg"
              className={cn(
                "relative overflow-hidden group",
                "bg-background border-2 border-primary/20 hover:border-primary/40",
                "text-primary font-semibold",
                "px-10 py-4 rounded-full transition-all duration-500",
                "hover:shadow-glow hover:scale-105",
                "backdrop-blur-sm"
              )}
              disabled={!vapi}
            >
              <div className="flex items-center space-x-3 relative z-10">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <span className="text-lg">Call AI Agent</span>
              </div>
              <div className="absolute inset-0 bg-gradient-pulse opacity-0 group-hover:opacity-20 transition-all duration-500 rounded-full" />
            </Button>
          </div>

          {error && (
            <Card className="p-4 border-destructive bg-destructive/10 max-w-md">
              <p className="text-destructive text-sm text-center">{error}</p>
            </Card>
          )}
        </div>
        <CallEndedAnimation />
      </>
    );
  }

  return (
    <>
      <div className="w-full max-w-2xl mx-auto space-y-8">
        {/* Main Voice Interface */}
        <div className="flex flex-col items-center space-y-8">
          {/* Agent Avatar */}
          <AgentAvatar />

          {/* Status Header */}
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold gradient-text">
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
          <Button
            onClick={endCall}
            variant="destructive"
            size="lg"
            className="flex items-center space-x-3 px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Call</span>
          </Button>
        </div>

        {/* Transcript Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-card">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg">Conversation</h4>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    isConnected ? "bg-voice-active" : "bg-voice-inactive"
                  )}
                />
                <span>{isConnected ? "Live" : "Disconnected"}</span>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-lg border border-border/30">
              {transcript.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-muted/50 mx-auto flex items-center justify-center">
                    <Bot className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Your conversation will appear here...
                  </p>
                </div>
              ) : (
                transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start space-x-3 animate-fade-in",
                      msg.role === "user"
                        ? "flex-row-reverse space-x-reverse"
                        : ""
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2",
                        msg.role === "user"
                          ? "bg-primary/20 border-primary/30"
                          : "bg-secondary/20 border-secondary/30"
                      )}
                    >
                      {msg.role === "user" ? (
                        <User className="w-4 h-4 text-primary" />
                      ) : (
                        <Bot className="w-4 h-4 text-secondary" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "max-w-[75%] px-4 py-3 rounded-2xl shadow-sm",
                        msg.role === "user"
                          ? "bg-primary/10 border border-primary/20 text-primary-foreground"
                          : "bg-secondary/10 border border-secondary/20 text-secondary-foreground"
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {msg.text}
                      </p>
                      <span className="text-xs opacity-70 block mt-2">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      <CallEndedAnimation />
    </>
  );
};

export default VoiceAgent;
