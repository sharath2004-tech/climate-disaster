import { AIChat } from "@/components/AIChat";
import { Sparkles } from "lucide-react";

export function AIAssistantSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-muted/30 to-transparent">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 animate-fade-slide-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AI-Powered</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-slide-in delay-100">
            AI Disaster Assistant
          </h2>
          <p className="text-lg text-muted-foreground animate-fade-slide-in delay-200">
            Get instant guidance and answers to your emergency questions
          </p>
        </div>
        <AIChat />
      </div>
    </section>
  );
}
