import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAlerts } from '@/hooks/useAPI';
import { CloudRain, Droplets, Minus, Thermometer, TrendingDown, TrendingUp, Wind } from 'lucide-react';
import { useEffect, useState } from 'react';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

const levelStyles = {
  low: {
    badge: 'bg-green-500/10 text-green-600 border-green-500/20',
    icon: 'bg-green-500/10 text-green-600',
    label: 'Low',
  },
  medium: {
    badge: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    icon: 'bg-yellow-500/10 text-yellow-600',
    label: 'Moderate',
  },
  high: {
    badge: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    icon: 'bg-orange-500/10 text-orange-600',
    label: 'High',
  },
  critical: {
    badge: 'bg-red-500/10 text-red-600 border-red-500/20',
    icon: 'bg-red-500/10 text-red-600',
    label: 'Critical',
  },
};

export function LiveSituationDashboardReal() {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { data: alerts } = useAlerts({ limit: 20 });
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      (error) => console.error('Location error:', error)
    );
  }, []);

  const fetchWeather = async (lat: number, lon: number) => {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    if (!apiKey) return;
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      const data = await response.json();
      setWeather(data);
    } catch (error) {
      console.error('Weather fetch error:', error);
    }
  };

  const calculateRiskLevels = () => {
    const floodAlerts = alerts?.filter((a: any) => a.type === 'flood' && a.status === 'active').length || 0;
    const fireAlerts = alerts?.filter((a: any) => a.type === 'fire' && a.status === 'active').length || 0;
    const cycloneAlerts = alerts?.filter((a: any) => a.type === 'cyclone' && a.status === 'active').length || 0;

    return {
      flood: floodAlerts > 2 ? 'critical' : floodAlerts > 0 ? 'high' : 'low',
      heatwave: weather?.main?.temp > 35 ? 'high' : weather?.main?.temp > 30 ? 'medium' : 'low',
      cyclone: cycloneAlerts > 0 ? 'high' : 'low',
      airquality: 'medium',
    };
  };

  const risks = calculateRiskLevels();

  const riskCards = [
    {
      id: 'flood',
      title: 'Flood Risk',
      icon: Droplets,
      level: risks.flood as RiskLevel,
      value: alerts?.filter((a: any) => a.type === 'flood' && a.status === 'active').length || 0,
      description: risks.flood === 'low' ? 'No significant flood warnings' : 'Flood alerts in your area',
      trend: 'stable',
    },
    {
      id: 'heatwave',
      title: 'Heatwave Risk',
      icon: Thermometer,
      level: risks.heatwave as RiskLevel,
      value: weather?.main?.temp ? `${Math.round(weather.main.temp)}°C` : '--',
      description: weather?.weather?.[0]?.description || 'Loading weather...',
      trend: 'rising',
    },
    {
      id: 'cyclone',
      title: 'Cyclone Risk',
      icon: Wind,
      level: risks.cyclone as RiskLevel,
      value: alerts?.filter((a: any) => a.type === 'cyclone' && a.status === 'active').length || 0,
      description: risks.cyclone === 'low' ? 'No cyclonic activity' : 'Cyclone warnings active',
      trend: 'stable',
    },
    {
      id: 'airquality',
      title: 'Air Quality',
      icon: CloudRain,
      level: 'medium' as RiskLevel,
      value: 'Moderate',
      description: 'Moderate air quality levels',
      trend: 'stable',
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 animate-fade-slide-in">
            Live Situation Dashboard
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-slide-in delay-100">
            Real-time monitoring of climate conditions in your region
          </p>
          {userLocation && (
            <p className="text-sm text-muted-foreground mt-2">
              📍 Tracking: {userLocation.latitude.toFixed(2)}, {userLocation.longitude.toFixed(2)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {riskCards.map((card, index) => {
            const style = levelStyles[card.level];
            const Icon = card.icon;
            const TrendIcon = card.trend === 'rising' ? TrendingUp : card.trend === 'declining' ? TrendingDown : Minus;

            return (
              <GlassCard
                key={card.id}
                hover
                pulse={card.level === 'critical'}
                className="animate-fade-slide-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${style.icon} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className={`${style.badge} border`}>
                    {style.label}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">{card.title}</h3>
                
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold text-foreground">{card.value}</span>
                  <TrendIcon className="w-4 h-4 text-muted-foreground" />
                </div>

                <p className="text-sm text-muted-foreground">{card.description}</p>

                {card.level === 'high' || card.level === 'critical' && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-destructive">⚠️ Action Required</p>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
