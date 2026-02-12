import PathwayAIChat from "@/components/PathwayAIChat";
import { Sparkles, Zap } from "lucide-react";

export function AIAssistantSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-muted/30 to-transparent">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4 animate-fade-slide-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-foreground">AI-Powered with Real-time Intelligence</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-slide-in delay-100">
            AI Disaster Assistant with Pathway
          </h2>
          <p className="text-lg text-muted-foreground animate-fade-slide-in delay-200">
            Get instant guidance and automatic alerts powered by real-time disaster predictions
          </p>
        </div>
        <PathwayAIChat />
      </div>
    </section>
  );
}
