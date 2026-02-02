import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Shield, MapPin, Bell, Activity, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-12">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float delay-200" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-slide-in">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Real-Time Monitoring Active</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-slide-in delay-100">
            Real-Time Climate Disaster{" "}
            <span className="text-gradient">Intelligence</span>{" "}
            for Citizens
          </h1>

          {/* Subtext */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 animate-fade-slide-in delay-200">
            <span className="font-semibold text-primary">Predict</span> • 
            <span className="font-semibold text-accent mx-2">Prepare</span> • 
            <span className="font-semibold text-success">Protect</span>
          </p>

          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-slide-in delay-300">
            Stay informed with AI-powered disaster predictions, real-time alerts, and emergency resources at your fingertips.
          </p>

          {/* Risk Indicator */}
          <div className="inline-flex items-center gap-3 mb-10 animate-fade-slide-in delay-400">
            <RiskIndicator level="low" />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-slide-in delay-500">
            <Link to="/map">
              <Button size="lg" className="h-14 px-8 text-lg gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                <MapPin className="w-5 h-5" />
                View Live Map
              </Button>
            </Link>
            <Link to="/alerts">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg gap-2 glass border-primary/30 hover:bg-primary/10 transition-all hover:scale-[1.02]">
                <Bell className="w-5 h-5" />
                Get Alerts
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Floating Cards */}
        <div className="hidden lg:block absolute top-1/4 left-8 animate-float">
          <GlassCard className="p-4 w-48">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-semibold text-success">All Clear</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="hidden lg:block absolute bottom-1/4 right-8 animate-float delay-300">
          <GlassCard className="p-4 w-48">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Alerts</p>
                <p className="text-sm font-semibold text-foreground">2 Active</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in delay-500">
        <div className="scroll-indicator" />
      </div>
    </section>
  );
}

function RiskIndicator({ level }: { level: "low" | "medium" | "high" }) {
  const colors = {
    low: { bg: "bg-success/10", text: "text-success", label: "Low Risk" },
    medium: { bg: "bg-warning/10", text: "text-warning", label: "Medium Risk" },
    high: { bg: "bg-destructive/10", text: "text-destructive", label: "High Risk" },
  };

  const { bg, text, label } = colors[level];

  return (
    <div className={`flex items-center gap-3 px-5 py-3 rounded-full ${bg} border border-current/20`}>
      <div className={`w-3 h-3 rounded-full ${level === "high" ? "animate-pulse-alert" : ""}`} 
           style={{ backgroundColor: `hsl(var(--risk-${level}))` }} />
      <span className={`font-semibold ${text}`}>{label}</span>
      <span className="text-muted-foreground">in your area</span>
    </div>
  );
}
