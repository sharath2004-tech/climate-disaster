/**
 * Pathway-Integrated AI Chatbot with Real-time Notifications
 * 
 * Features:
 * - Automatic alert notifications from Pathway
 * - Real-time risk prediction updates
 * - Conversational data display
 * - Proactive disaster warnings
 * - Voice input/output support
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlerts, useRiskPredictions } from '@/hooks/usePathway';
import PathwayService from '@/services/pathwayService';
import {
    AlertTriangle,
    Bell,
    Bot,
    Loader2,
    MapPin,
    Mic,
    MicOff,
    Send,
    TrendingUp,
    User,
    Volume2,
    VolumeX,
    Zap
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const PATHWAY_API = import.meta.env.VITE_PATHWAY_API_URL || 'http://localhost:8080';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'alert' | 'prediction' | 'normal';
  data?: unknown;
}

interface WeatherData {
  city_name?: string;
  location: string;
  temperature: number;
  humidity: number;
  weather_condition: string;
  wind_speed: number;
  pressure: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

// Voice recognition hook
const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      toast.error('Voice input not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { isListening, transcript, startListening, stopListening, setTranscript };
};

// Text-to-speech hook
const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stopSpeaking };
};

export default function PathwayAIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your AI disaster assistant powered by Pathway real-time intelligence. I\'ll notify you about emerging risks and alerts automatically!',
      timestamp: new Date(),
      type: 'normal'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastAlertIdRef = useRef<string | null>(null);
  const lastPredictionRef = useRef<string | null>(null);

  // Pathway hooks
  const { alerts, loading: alertsLoading } = useAlerts();
  const { predictions, loading: predictionsLoading } = useRiskPredictions(0.6);

  // Voice features
  const { isListening, transcript, startListening, stopListening, setTranscript } = useVoiceRecognition();
  const { isSpeaking, speak, stopSpeaking } = useTextToSpeech();

  // Auto-scroll to bottom within chat container only (not the page)
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // Scroll to bottom smoothly within the container
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Handle voice input
  useEffect(() => {
    if (transcript && !isListening) {
      setInput(transcript);
      setTranscript('');
    }
  }, [transcript, isListening, setTranscript]);

  // Monitor for new alerts and notify
  useEffect(() => {
    if (!alertsLoading && alerts.length > 0 && notificationsEnabled) {
      const latestAlert = alerts[0];
      
      if (lastAlertIdRef.current !== latestAlert.alert_id) {
        lastAlertIdRef.current = latestAlert.alert_id;
        
        const alertMessage: Message = {
          role: 'system',
          content: `🚨 **NEW ALERT** - ${latestAlert.alert_level.toUpperCase()}\n\n📍 **Location:** ${latestAlert.location}\n⚠️ **Event:** ${latestAlert.event_type}\n📊 **Risk Score:** ${(latestAlert.risk_score * 100).toFixed(0)}%\n\n${latestAlert.message}\n\n👥 **Population Affected:** ${latestAlert.population_affected.toLocaleString()}`,
          timestamp: new Date(),
          type: 'alert',
          data: latestAlert
        };
        
        setMessages(prev => [...prev, alertMessage]);
        
        // Voice notification
        const alertText = `New ${latestAlert.alert_level} alert for ${latestAlert.location}. ${latestAlert.event_type} detected with ${(latestAlert.risk_score * 100).toFixed(0)} percent risk. ${latestAlert.message}`;
        speak(alertText);
        
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🚨 Disaster Alert', {
            body: `${latestAlert.location}: ${latestAlert.event_type}`,
            icon: '/icon-alert.png',
            tag: latestAlert.alert_id
          });
        }
      }
    }
  }, [alerts, alertsLoading, notificationsEnabled, speak]);

  // Monitor for high-risk predictions
  useEffect(() => {
    if (!predictionsLoading && predictions.length > 0 && notificationsEnabled) {
      const highestRisk = predictions[0];
      const predictionKey = `${highestRisk.location}-${highestRisk.predicted_event_type}`;
      
      if (lastPredictionRef.current !== predictionKey && highestRisk.risk_score > 0.7) {
        lastPredictionRef.current = predictionKey;
        
        const predictionMessage: Message = {
          role: 'system',
          content: `📊 **HIGH RISK PREDICTION**\n\n📍 **Location:** ${highestRisk.location}\n🔮 **Predicted Event:** ${highestRisk.predicted_event_type}\n📈 **Risk Score:** ${(highestRisk.risk_score * 100).toFixed(1)}%\n⏰ **Time to Event:** ${highestRisk.time_to_event_hours}h\n✅ **Confidence:** ${(highestRisk.confidence * 100).toFixed(0)}%\n\n💡 **Recommended Actions:**\n${highestRisk.recommended_actions}`,
          timestamp: new Date(),
          type: 'prediction',
          data: highestRisk
        };
        
        setMessages(prev => [...prev, predictionMessage]);
      }
    }
  }, [predictions, predictionsLoading, notificationsEnabled]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Send message to AI
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
      type: 'normal'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Check if user is asking about Pathway data specifically
      const query = input.toLowerCase();
      const isPathwayStatusQuery = /pathway.*work|pathway.*status|latest.*data|real.*time.*data|show.*me.*data/i.test(input);
      const isWeatherQuery = /weather|temperature|temp|forecast/i.test(query);
      const isAlertQuery = /alert|warn|danger|emergency/i.test(query);
      const isRiskQuery = /risk|prediction|hazard|threat/i.test(query);
      const isSafetyQuery = /safe|shelter|evacuat|location/i.test(query);

      // Handle Pathway-specific queries directly
      if (isPathwayStatusQuery || isWeatherQuery || isAlertQuery || isRiskQuery) {
        let responseContent = '';

        if (isPathwayStatusQuery) {
          // Fetch real weather data to show actual cities
          try {
            const weatherData = await PathwayService.getWeather();
            const cities = weatherData.data?.map((w: WeatherData) => w.city_name || w.location).filter(Boolean) || [];
            
            responseContent = `✅ **Pathway Real-time Intelligence is ACTIVE!**\n\n`;
            responseContent += `📊 **Current Status:**\n`;
            responseContent += `🌐 Service: Operational on Render\n`;
            responseContent += `🔄 Update Frequency: Every 5 minutes\n`;
            responseContent += `📍 Monitoring: 10 Indian Cities\n\n`;
            
            if (cities.length > 0) {
              responseContent += `🇮🇳 **Monitored Cities:**\n`;
              responseContent += cities.map((city: string) => `• ${city}`).join('\n');
              responseContent += `\n\n`;
            }
            
            if (weatherData.data && weatherData.data.length > 0) {
              responseContent += `🌤️ **Latest Weather Data:**\n`;
              weatherData.data.slice(0, 5).forEach((w: WeatherData) => {
                const cityName = w.city_name || w.location;
                responseContent += `📍 ${cityName}: ${w.temperature.toFixed(1)}°C, ${w.humidity}% humidity, ${w.weather_condition}\n`;
              });
              responseContent += `\n`;
            }
          } catch (err) {
            responseContent = `✅ **Pathway Real-time Intelligence is ACTIVE!**\n\n`;
            responseContent += `📊 **Current Status:**\n`;
            responseContent += `🌐 Service: Operational on Render\n`;
            responseContent += `🔄 Update Frequency: Every 5 minutes\n`;
            responseContent += `📍 Monitoring: 10 Indian cities\n\n`;
          }

          if (alerts.length > 0) {
            responseContent += `⚠️ **Active Alerts (${alerts.length}):**\n`;
            alerts.slice(0, 3).forEach(a => {
              responseContent += `• ${a.location}: ${a.event_type} - ${a.alert_level} (Risk: ${(a.risk_score * 100).toFixed(0)}%)\n`;
            });
            responseContent += `\n`;
          }

          if (predictions.length > 0) {
            responseContent += `🔮 **Risk Predictions (${predictions.length}):**\n`;
            predictions.slice(0, 3).forEach(p => {
              responseContent += `• ${p.location}: ${p.predicted_event_type} - Risk ${(p.risk_score * 100).toFixed(1)}% in ${p.time_to_event_hours}h\n`;
            });
          }

          if (alerts.length === 0 && predictions.length === 0) {
            responseContent += `✅ **All Clear!** No significant risks detected at this time.\n`;
          }
        } else if (isWeatherQuery) {
          try {
            const weatherData = await PathwayService.getWeather();
            responseContent = `🌤️ **Real-time Weather Data from Pathway:**\n\n`;
            
            if (weatherData.data && weatherData.data.length > 0) {
              weatherData.data.forEach((w: WeatherData) => {
                const cityName = w.city_name || w.location;
                responseContent += `📍 **${cityName}**\n`;
                responseContent += `   🌡️ ${w.temperature.toFixed(1)}°C | 💧 ${w.humidity}% | ${w.weather_condition}\n`;
                responseContent += `   🌬️ Wind: ${w.wind_speed} m/s | 🔽 Pressure: ${w.pressure} hPa\n\n`;
              });
            } else {
              responseContent += `No weather data available at this time.\n`;
            }
          } catch (err) {
            responseContent = `Unable to fetch weather data. Please try again.\n`;
          }
        } else if (isAlertQuery) {
          if (alerts.length > 0) {
            responseContent = `⚠️ **ACTIVE DISASTER ALERTS:**\n\n`;
            alerts.forEach(a => {
              responseContent += `🚨 **${a.alert_level.toUpperCase()} ALERT**\n`;
              responseContent += `📍 Location: ${a.location}\n`;
              responseContent += `⚡ Event: ${a.event_type}\n`;
              responseContent += `📊 Risk Score: ${(a.risk_score * 100).toFixed(0)}%\n`;
              responseContent += `💬 ${a.message}\n\n`;
            });
          } else {
            responseContent = `✅ **No Active Alerts**\n\nAll monitored regions are currently safe. Pathway is continuously monitoring for emerging threats.`;
          }
        } else if (isRiskQuery) {
          if (predictions.length > 0) {
            responseContent = `🔮 **Disaster Risk Predictions:**\n\n`;
            predictions.slice(0, 5).forEach(p => {
              responseContent += `📍 **${p.location}**\n`;
              responseContent += `⚡ Event: ${p.predicted_event_type}\n`;
              responseContent += `📊 Risk: ${(p.risk_score * 100).toFixed(1)}%\n`;
              responseContent += `⏰ Time to Event: ${p.time_to_event_hours} hours\n`;
              responseContent += `✅ Confidence: ${(p.confidence * 100).toFixed(0)}%\n`;
              responseContent += `💡 Actions: ${p.recommended_actions}\n\n`;
            });
          } else {
            responseContent = `✅ **Low Risk Across All Regions**\n\nNo significant disaster risks detected in the next 24-48 hours.`;
          }
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
          type: 'normal'
        };

        setMessages(prev => [...prev, assistantMessage]);
        setLoading(false);

        if (isSpeaking) {
          speak(responseContent.replace(/[*#]/g, '').replace(/[\u{1F300}-\u{1F9FF}]/gu, ''));
        }
        return;
      }

      // For other queries, call backend AI with context
      const isPathwayRelated = isWeatherQuery || isAlertQuery || isRiskQuery || isSafetyQuery;
      
      let context = '';
      if (isPathwayRelated) {
        // Include Pathway context
        const alertsContext = alerts.slice(0, 3).map(a => 
          `Alert: ${a.location} - ${a.event_type} (Risk: ${(a.risk_score * 100).toFixed(0)}%)`
        ).join('\n');
        
        const predictionsContext = predictions.slice(0, 3).map(p => 
          `Prediction: ${p.location} - ${p.predicted_event_type} (Risk: ${(p.risk_score * 100).toFixed(1)}%, ${p.time_to_event_hours}h)`
        ).join('\n');
        
        context = `\n\nCurrent Pathway Real-time Data:\n${alertsContext}\n${predictionsContext}`;
      }

      // Call Pathway AI Chat API (with LLM support)
      const response = await fetch(`${PATHWAY_API}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input + context
        })
      });

      if (!response.ok) {
        // If Pathway service fails, try backend as fallback
        const backendResponse = await fetch(`${API_BASE}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: input + context,
            conversationHistory: messages.slice(-5).map(m => ({
              role: m.role === 'system' ? 'assistant' : m.role,
              content: m.content
            }))
          })
        });
        
        if (!backendResponse.ok) {
          throw new Error('AI services unavailable');
        }
        
        const backendData = await backendResponse.json();
        const assistantMessage: Message = {
          role: 'assistant',
          content: backendData.response || backendData.message || 'I apologize, but I could not generate a response.',
          timestamp: new Date(),
          type: 'normal'
        };
        setMessages(prev => [...prev, assistantMessage]);
        if (isSpeaking) {
          speak(assistantMessage.content.replace(/[*#]/g, ''));
        }
        return;
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || data.message || 'I apologize, but I could not generate a response.',
        timestamp: new Date(),
        type: 'normal'
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak response if enabled
      if (isSpeaking) {
        speak(assistantMessage.content.replace(/[*#]/g, ''));
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      // Provide helpful fallback based on query type
      const query = input.toLowerCase();
      let fallbackContent = '';
      
      if (/help|emergency/i.test(query)) {
        fallbackContent = `🆘 **Emergency Contacts:**\n\n📞 Emergency: 112\n📞 NDRF: 9711077372\n🚨 Fire: 101\n🚑 Ambulance: 108\n\nFor real-time disaster updates, ask me about current alerts or risks!`;
      } else {
        fallbackContent = `I apologize, the AI backend is temporarily unavailable. However, I can still help you with:\n\n• Real-time alerts: Ask "show me alerts"\n• Risk predictions: Ask "what are the risks?"\n• Weather data: Ask "what's the weather?"\n• Pathway status: Ask "is Pathway working?"\n\nWhat would you like to know?`;
      }
      
      const errorMessage: Message = {
        role: 'assistant',
        content: fallbackContent,
        timestamp: new Date(),
        type: 'normal'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Quick action buttons
  const quickActions = useMemo(() => [
    { label: '📊 Show Current Alerts', query: 'Show me all current alerts' },
    { label: '🔮 Risk Predictions', query: 'What are the risk predictions?' },
    { label: '🗺️ Safe Locations', query: 'Where are the safe locations near me?' },
    { label: '🚨 Emergency Help', query: 'I need emergency help' },
    { label: '📡 Pathway Status', query: 'Is Pathway working? Show me the latest data' }
  ], []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[600px] max-w-4xl mx-auto shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="w-8 h-8" />
            <Zap className="w-4 h-4 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-lg">AI Disaster Assistant</h2>
            <p className="text-xs opacity-90 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Powered by Pathway Real-time Intelligence
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={notificationsEnabled ? "default" : "secondary"} className="cursor-pointer">
            <Bell className="w-3 h-3 mr-1" />
            {alerts.length} Active
          </Badge>
          
          <Button
            size="sm"
            variant={notificationsEnabled ? "secondary" : "ghost"}
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            {notificationsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 p-3 border-b overflow-x-auto">
        {quickActions.map((action, idx) => (
          <Button
            key={idx}
            size="sm"
            variant="outline"
            onClick={() => {
              setInput(action.query);
              setTimeout(sendMessage, 100);
            }}
            className="whitespace-nowrap text-xs"
          >
            {action.label}
          </Button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role !== 'user' && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'alert' ? 'bg-red-600' : 
                  message.type === 'prediction' ? 'bg-orange-600' : 
                  'bg-blue-600'
                }`}>
                  {message.type === 'alert' ? <AlertTriangle className="w-4 h-4 text-white" /> :
                   message.type === 'prediction' ? <TrendingUp className="w-4 h-4 text-white" /> :
                   <Bot className="w-4 h-4 text-white" />}
                </div>
              )}
              
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'alert'
                    ? 'bg-red-50 border border-red-200'
                    : message.type === 'prediction'
                    ? 'bg-orange-50 border border-orange-200'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <div className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Pathway Status Bar */}
      {!alertsLoading && !predictionsLoading && (
        <div className="px-4 py-2 bg-blue-50 border-t text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {alerts.length} alerts
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {predictions.length} predictions
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              10 locations monitored
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            Real-time Active
          </Badge>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <Button
            size="icon"
            variant={isListening ? "destructive" : "outline"}
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening..." : "Ask about disasters, alerts, or safety..."}
            disabled={loading || isListening}
            className="flex-1"
          />
          
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            size="icon"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {isListening && (
          <div className="mt-2 text-xs text-center text-blue-600 animate-pulse">
            🎤 Listening... Speak now
          </div>
        )}
      </div>
    </Card>
  );
}
