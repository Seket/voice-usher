import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  onStartVoice: () => void;
  className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onStartVoice, className }) => {
  return (
    <section className={cn("relative min-h-screen flex items-center justify-center", className)}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-gradient-glow opacity-30" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-glow/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        {/* Main Hero Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Badge */}
          <div className="inline-flex items-center space-x-2 bg-primary/20 border border-primary/30 rounded-full px-6 py-2 text-sm font-medium">
            <Zap className="w-4 h-4 text-primary" />
            <span>AI Voice Assistant</span>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
              <span className="gradient-text">Talk</span>
              <br />
              <span className="text-foreground">to the Future</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Experience natural conversations with our AI-powered voice assistant. 
              Simply speak and get intelligent responses instantly.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-8">
            <Button
              onClick={onStartVoice}
              size="lg"
              className={cn(
                "relative overflow-hidden group",
                "bg-gradient-voice hover:bg-gradient-voice",
                "text-primary-foreground font-bold text-lg",
                "px-12 py-8 rounded-3xl transition-all duration-500",
                "voice-glow hover:scale-110 hover:shadow-glow",
                "border border-primary/20"
              )}
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Mic className="w-8 h-8 transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-primary-glow/30 rounded-full blur-sm group-hover:blur-md transition-all" />
                </div>
                <span>Start Conversation</span>
              </div>
              <div className="absolute inset-0 bg-gradient-radial from-primary-glow/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Button>
          </div>
        </div>

        {/* Bottom Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex flex-col items-center space-y-2 animate-bounce">
            <div className="w-px h-8 bg-gradient-to-b from-primary to-transparent" />
            <div className="w-2 h-2 bg-primary rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;