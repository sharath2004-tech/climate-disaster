import { GlassCard } from "@/components/ui/GlassCard";
import { Droplets, Thermometer, Wind, CloudRain } from "lucide-react";

type RiskLevel = "low" | "medium" | "high";

const riskCards: {
  id: string;
  title: string;
  icon: typeof Droplets;
  level: RiskLevel;
  value: string;
  description: string;
  trend: string;
}[] = [
  {
    id: "flood",
    title: "Flood Risk",
    icon: Droplets,
    level: "low" as const,
    value: "12%",
    description: "No significant flood warnings",
    trend: "stable",
  },
  {
    id: "heatwave",
    title: "Heatwave Risk",
    icon: Thermometer,
    level: "medium" as const,
    value: "34°C",
    description: "Above normal temperatures expected",
    trend: "rising",
  },
  {
    id: "cyclone",
    title: "Cyclone Risk",
    icon: Wind,
    level: "low" as const,
    value: "5%",
    description: "No cyclonic activity detected",
    trend: "stable",
  },
  {
    id: "airquality",
    title: "Air Quality",
    icon: CloudRain,
    level: "medium" as const,
    value: "AQI 145",
    description: "Moderate - Sensitive groups affected",
    trend: "declining",
  },
];

const levelStyles = {
  low: {
    badge: "bg-success/10 text-success border-success/20",
    icon: "bg-success/10 text-success",
    label: "Low",
  },
  medium: {
    badge: "bg-warning/10 text-warning border-warning/20",
    icon: "bg-warning/10 text-warning",
    label: "Moderate",
  },
  high: {
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    icon: "bg-destructive/10 text-destructive",
    label: "High",
  },
};

export function LiveSituationDashboard() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-slide-in">
            Live Situation Dashboard
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-slide-in delay-100">
            Real-time monitoring of climate conditions in your region
          </p>
        </div>

        {/* Risk Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {riskCards.map((card, index) => {
            const style = levelStyles[card.level];
            const Icon = card.icon;
            const isHighRisk = card.level === "high";

            return (
              <GlassCard
                key={card.id}
                hover
                pulse={isHighRisk}
                className={`animate-fade-slide-in`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${style.icon}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${style.badge}`}>
                    {style.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground mb-2">{card.title}</h3>

                {/* Value */}
                <p className="text-3xl font-bold text-foreground mb-2">{card.value}</p>

                {/* Description */}
                <p className="text-sm text-muted-foreground">{card.description}</p>

                {/* Trend */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Trend:</span>
                    <span className={`font-medium capitalize ${
                      card.trend === "rising" ? "text-warning" : 
                      card.trend === "declining" ? "text-destructive" : 
                      "text-success"
                    }`}>
                      {card.trend}
                    </span>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
