/**
 * Enhanced AI Chatbot with Real-time Weather & 7-Day Predictions
 * Features:
 * - Real-time weather data integration
 * - 7-day disaster predictions
 * - RAG-powered LLM responses
 * - Multi-language support
 * - Voice input/output
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    AlertTriangle,
    Bot,
    Cloud,
    Loader2,
    MapPin,
    Mic,
    MicOff,
    Send,
    ThermometerSun,
    User,
    Volume2,
    VolumeX,
    Wind
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Language configurations
const LANGUAGES = {
  en: { name: 'English', code: 'en-IN' },
  hi: { name: 'हिंदी', code: 'hi-IN' },
  mr: { name: 'मराठी', code: 'mr-IN' },
  ta: { name: 'தமிழ்', code: 'ta-IN' },
  bn: { name: 'বাংলা', code: 'bn-IN' },
  te: { name: 'తెలుగు', code: 'te-IN' },
};

type LanguageCode = keyof typeof LANGUAGES;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface Risk {
  type: string;
  severity: string;
  actions?: string[];
}

interface Prediction {
  date: string;
  risks: Risk[];
}

interface WeatherContext {
  current_conditions?: {
    temperature: number;
    humidity: number;
    wind_speed: number;
  };
  predictions?: Prediction[];
  overall_risk?: string;
}

// Voice recognition hook
const useVoiceRecognition = (language: LanguageCode) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      toast.error('Voice input is not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = LANGUAGES[language].code;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return { isListening, transcript, startListening, stopListening, setTranscript };
};

// Text-to-speech hook
const useTextToSpeech = (language: LanguageCode) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  const speak = useCallback((text: string) => {
    if (!isEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANGUAGES[language].code;
    utterance.rate = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [language, isEnabled]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, isEnabled, setIsEnabled, speak, stop };
};

export function EnhancedAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [location, setLocation] = useState('Detecting...');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [weatherContext, setWeatherContext] = useState<WeatherContext>({});
  const [weatherLoading, setWeatherLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { isListening, transcript, startListening, stopListening, setTranscript } = useVoiceRecognition(language);
  const { isSpeaking, isEnabled: ttsEnabled, setIsEnabled: setTtsEnabled, speak, stop: stopSpeaking } = useTextToSpeech(language);

  // Detect location and fetch weather
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCoordinates({ lat: latitude, lng: longitude });

          try {
            // Reverse geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown';
            const state = data.address?.state || '';
            setLocation(`${city}, ${state}`);

            // Fetch weather predictions
            fetchWeatherPredictions(latitude, longitude);
          } catch (error) {
            console.error('Location fetch error:', error);
          }
        },
        () => setLocation('Location unavailable')
      );
    }
  }, []);

  // Fetch weather predictions
  const fetchWeatherPredictions = async (lat: number, lon: number) => {
    setWeatherLoading(true);
    try {
      const response = await fetch(`${API_BASE}/weather/disaster-prediction?lat=${lat}&lon=${lon}`);
      const data = await response.json();
      
      if (data.success) {
        setWeatherContext(data);
        
        // Show alert if high risk detected
        if (data.overall_risk === 'high') {
          const highRisks = data.predictions
            .flatMap((p: Prediction) => p.risks)
            .filter((r: Risk) => r.severity === 'high');
          
          if (highRisks.length > 0) {
            toast.error(`⚠️ High ${highRisks[0].type} risk detected in your area!`, {
              duration: 10000,
            });
          }
        }
      }
    } catch (error) {
      console.error('Weather prediction error:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Initialize greeting
  useEffect(() => {
    const greetings = {
      en: 'Hello! I\'m your AI disaster assistant with real-time weather monitoring. Ask me about safety, predictions, or emergency procedures.',
      hi: 'नमस्ते! मैं वास्तविक समय मौसम निगरानी के साथ आपका AI आपदा सहायक हूं।',
      mr: 'नमस्कार! मी वास्तविक वेळ हवामान देखरेखीसह तुमचा AI आपत्ती सहाय्यक आहे.',
      ta: 'வணக்கம்! நான் நேரடி வானிலை கண்காணிப்புடன் உங்கள் AI பேரிடர் உதவியாளர்.',
      bn: 'নমস্কার! আমি রিয়েল-টাইম আবহাওয়া পর্যবেক্ষণ সহ আপনার AI দুর্যোগ সহকারী।',
      te: 'నమస్కారం! నేను రియల్-టైమ్ వాతావరణ పర్యవేక్షణతో మీ AI విపత్తు సహాయకుడిని.',
    };

    setMessages([{
      role: 'assistant',
      content: greetings[language],
      timestamp: new Date(),
    }]);
  }, [language]);

  // Handle voice transcript
  useEffect(() => {
    if (transcript && !isListening) {
      setInput(transcript);
      setTranscript('');
    }
  }, [transcript, isListening, setTranscript]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message to AI
  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          location,
          weatherContext,
          language,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        }]);
      } else {
        throw new Error('AI response failed');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or contact emergency services (112) if urgent.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick actions based on weather predictions
  const quickActions = useMemo(() => {
    const actions: string[] = [];
    const risks = weatherContext.predictions?.flatMap(p => p.risks || []) || [];

    if (risks.some(r => r.type === 'flood')) {
      actions.push('Flood safety tips', 'What to do if water enters home?');
    }
    if (risks.some(r => r.type === 'cyclone' || r.type === 'storm')) {
      actions.push('Cyclone preparation', 'When to evacuate?');
    }
    if (risks.some(r => r.type === 'heatwave')) {
      actions.push('Heat safety measures', 'Signs of heat stroke');
    }

    if (actions.length === 0) {
      actions.push('Emergency kit checklist', 'Family emergency plan', 'First aid basics');
    }

    return actions.slice(0, 4);
  }, [weatherContext]);

  // Weather summary for display
  const weatherSummary = useMemo(() => {
    if (!weatherContext.current_conditions) return 'Loading...';
    const { temperature, humidity, wind_speed } = weatherContext.current_conditions;
    return `${temperature}°C, ${humidity}% humidity, ${wind_speed} km/h wind`;
  }, [weatherContext]);

  // Risk badge
  const getRiskBadge = () => {
    const risk = weatherContext.overall_risk || 'low';
    const colors = {
      low: 'bg-green-500/20 text-green-700 dark:text-green-400',
      medium: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
      high: 'bg-red-500/20 text-red-700 dark:text-red-400',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[risk as keyof typeof colors]}`}>
        {risk.toUpperCase()} RISK
      </span>
    );
  };

  const parseMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
      .replace(/^- (.+)$/gm, '• $1');
  };

  return (
    <div className="flex flex-col h-[700px] bg-background border rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-full">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">SKYNETRA AI - Weather Predictions</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {location}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="text-xs px-2 py-1 rounded border bg-background"
            >
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <option key={code} value={code}>{lang.name}</option>
              ))}
            </select>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setTtsEnabled(!ttsEnabled);
              }}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Weather Info */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-xs">
            <ThermometerSun className="w-4 h-4 text-orange-500" />
            <span>{weatherContext.current_conditions?.temperature || '--'}°C</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Wind className="w-4 h-4 text-blue-500" />
            <span>{weatherContext.current_conditions?.wind_speed || '--'} km/h</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Cloud className="w-4 h-4 text-gray-500" />
            <span>{weatherContext.current_conditions?.humidity || '--'}% humid</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {getRiskBadge()}
          </div>
        </div>

        {/* Risk Alerts */}
        {weatherContext.predictions && weatherContext.predictions.some(p => p.risks.length > 0) && (
          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <strong>Weather Alerts:</strong> {weatherContext.predictions
                .flatMap(p => p.risks)
                .slice(0, 2)
                .map(r => `${r.type} (${r.severity})`)
                .join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`rounded-lg p-3 max-w-[85%] ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <div 
                  className="text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                />
                {msg.role === 'assistant' && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => speak(msg.content)}
                    >
                      <Volume2 className="w-3 h-3 mr-1" /> Listen
                    </Button>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
              <div className="rounded-lg p-3 bg-muted">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t">
        <div className="flex gap-2 flex-wrap">
          {quickActions.map((action, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => sendMessage(action)}
              disabled={isLoading}
            >
              {action}
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex gap-2">
          <Button
            variant={isListening ? 'destructive' : 'outline'}
            size="icon"
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={isListening ? 'Listening...' : 'Ask about weather predictions...'}
            disabled={isLoading}
          />

          <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
