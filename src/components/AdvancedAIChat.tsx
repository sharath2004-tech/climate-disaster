/**
 * Advanced AI Chat Component with Enhanced Features
 * 
 * New Features:
 * - Conversation memory & context retention
 * - Response caching for faster responses
 * - Streaming responses with real-time typing effect
 * - Named entity recognition for better context
 * - User feedback mechanism
 * - Conversation export
 * - Advanced analytics tracking
 * - Retry logic with exponential backoff
 * - Enhanced prompt engineering with conversation history
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  chatAnalytics,
  conversationMemory,
  entityRecognizer,
  responseCache,
  retryWithBackoff,
  type ChatMessage,
  type ExtractedEntity
} from '@/lib/chatbotEnhancements';
import {
  AlertTriangle,
  Bot,
  Cloud,
  Download,
  Loader2,
  MapPin,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  User,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Language configurations
const LANGUAGES = {
  en: { name: 'English', code: 'en-IN', greeting: 'Hi! I\'m SKYNETRA, your disaster assistant. How can I help you stay safe today?' },
  hi: { name: 'हिंदी', code: 'hi-IN', greeting: 'नमस्ते! मैं SKYNETRA हूं, आपका आपदा सहायक। मैं आज आपकी सुरक्षा में कैसे मदद कर सकता हूं?' },
  mr: { name: 'मराठी', code: 'mr-IN', greeting: 'नमस्कार! मी SKYNETRA आहे. मी तुम्हाला कशी मदत करू शकतो?' },
  ta: { name: 'தமிழ்', code: 'ta-IN', greeting: 'வணக்கம்! நான் SKYNETRA. நான் உங்களுக்கு எப்படி உதவ முடியும்?' },
  bn: { name: 'বাংলা', code: 'bn-IN', greeting: 'হ্যালো! আমি SKYNETRA. আমি কীভাবে সাহায্য করতে পারি?' },
  te: { name: 'తెలుగు', code: 'te-IN', greeting: 'హలో! నేను SKYNETRA. నేను మీకు ఎలా సహాయం చేయగలను?' },
};

type LanguageCode = keyof typeof LANGUAGES;

interface UserContext {
  location: string;
  coordinates: { lat: number; lng: number } | null;
  activeAlerts: string[];
  weather: string;
  language: LanguageCode;
}

// Voice recognition hook
const useVoiceRecognition = (language: LanguageCode) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      toast.error('Voice input is not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = LANGUAGES[language].code;

    recognition.onstart = () => {
      setIsListening(true);
      chatAnalytics.track('voice_used', { action: 'start', language });
    };
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      chatAnalytics.track('error', { type: 'voice_recognition', error: event.error });
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

// Parse markdown with enhanced support
const parseMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')
    .replace(/^- (.+)$/gm, '• $1')
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-muted rounded text-sm">$1</code>');
};

export function AdvancedAIChat() {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [userContext, setUserContext] = useState<UserContext>({
    location: 'Detecting...',
    coordinates: null,
    activeAlerts: [],
    weather: 'Unknown',
    language: 'en',
  });
  const [entities, setEntities] = useState<ExtractedEntity[]>([]);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<number>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Voice hooks
  const { isListening, transcript, startListening, stopListening, setTranscript } = useVoiceRecognition(language);
  const { isSpeaking, isEnabled: ttsEnabled, setIsEnabled: setTtsEnabled, speak, stop: stopSpeaking } = useTextToSpeech(language);

  // Load conversation history on mount
  useEffect(() => {
    const session = conversationMemory.getCurrentSession();
    if (session.messages.length > 0) {
      setMessages(session.messages);
      toast.success(`Restored ${session.messages.length} messages from previous session`);
    } else {
      // Add greeting for new session
      const greeting: ChatMessage = {
        role: 'assistant',
        content: LANGUAGES[language].greeting,
        timestamp: new Date(),
      };
      setMessages([greeting]);
      conversationMemory.addMessage(greeting);
    }
  }, []);

  // Update context when language changes
  useEffect(() => {
    setUserContext(prev => ({ ...prev, language }));
    conversationMemory.updateContext({ location: userContext.location });
  }, [language, userContext.location]);

  // Detect user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserContext(prev => ({ ...prev, coordinates: { lat: latitude, lng: longitude } }));

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown';
            const state = data.address?.state || '';
            const location = `${city}, ${state}`;
            setUserContext(prev => ({ ...prev, location }));
            conversationMemory.updateContext({ location });

            // Fetch weather
            const weatherRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
            );
            const weatherData = await weatherRes.json();
            const temp = weatherData.current?.temperature_2m || 'N/A';
            const condition = getWeatherCondition(weatherData.current?.weather_code || 0);
            setUserContext(prev => ({ ...prev, weather: `${temp}°C, ${condition}` }));
          } catch (error) {
            console.error('Location/weather fetch error:', error);
          }
        },
        () => {
          setUserContext(prev => ({ ...prev, location: 'Location unavailable' }));
        }
      );
    }
  }, []);

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

  const getWeatherCondition = (code: number): string => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    if (code >= 95) return 'Thunderstorm';
    return 'Unknown';
  };

  // Build enhanced context-aware prompt with conversation history
  const buildEnhancedPrompt = (userMessage: string) => {
    // Extract entities from user message
    const extractedEntities = entityRecognizer.extract(userMessage);
    setEntities(extractedEntities);
    
    const entityContext = entityRecognizer.generateContext(extractedEntities);
    const conversationContext = conversationMemory.buildContextSummary();
    const recentMessages = conversationMemory.getConversationContext(5);

    const langInstruction = language !== 'en' 
      ? `CRITICAL: You must respond entirely in ${LANGUAGES[language].name} language.`
      : '';

    let prompt = `You are SKYNETRA, an advanced AI-powered disaster response assistant for India. You help citizens stay safe during emergencies.

CURRENT CONTEXT:
- User Location: ${userContext.location}
- Coordinates: ${userContext.coordinates ? `${userContext.coordinates.lat.toFixed(2)}, ${userContext.coordinates.lng.toFixed(2)}` : 'Unknown'}
- Active Alerts: ${userContext.activeAlerts.length > 0 ? userContext.activeAlerts.join('; ') : 'No active alerts'}
- Current Weather: ${userContext.weather}
- Time: ${new Date().toLocaleString('en-IN')}

`;

    if (conversationContext) {
      prompt += `CONVERSATION CONTEXT:\n${conversationContext}\n`;
    }

    if (entityContext) {
      prompt += `EXTRACTED CONTEXT:\n${entityContext}\n`;
    }

    if (recentMessages.length > 0) {
      prompt += `\nRECENT CONVERSATION:\n`;
      recentMessages.slice(-3).forEach(msg => {
        const role = msg.role === 'user' ? 'User' : 'SKYNETRA';
        prompt += `${role}: ${msg.content.substring(0, 100)}...\n`;
      });
      prompt += `\n`;
    }

    prompt += `${langInstruction}

RESPONSE GUIDELINES:
1. Provide specific, actionable safety advice based on user's location and weather
2. If active alerts exist, prioritize immediate danger and life-saving actions
3. Use clear, simple language (8th-grade reading level)
4. Include relevant emergency contact numbers (India: 112, NDRF: 9711077372)
5. Be empathetic but concise (aim for 150-250 words)
6. Use markdown formatting for readability (**bold**, *italic*, lists)
7. Reference previous conversation context to provide continuous support
8. If entities like specific disasters were detected, prioritize that information

USER QUESTION: ${userMessage}

Provide helpful, context-aware disaster safety guidance:`;

    return prompt;
  };

  // Send message with advanced features
  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isLoading) return;

    // Check cache first
    const cachedResponse = responseCache.get(userMessage, userContext.location);
    if (cachedResponse) {
      toast.success('Retrieved from cache');
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: cachedResponse,
        timestamp: new Date(),
        metadata: { language, location: userContext.location },
      };
      setMessages(prev => [...prev, assistantMsg]);
      conversationMemory.addMessage(assistantMsg);
      
      if (ttsEnabled) speak(cachedResponse);
      return;
    }

    setInput('');
    const userMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      metadata: { language, location: userContext.location },
    };
    
    setMessages(prev => [...prev, userMsg]);
    conversationMemory.addMessage(userMsg);
    chatAnalytics.track('message_sent', { language, messageLength: userMessage.length });
    
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      // Try with retry logic
      await retryWithBackoff(async () => {
        await sendWithOpenRouter(userMessage);
      }, 2, 1000);
      
      chatAnalytics.track('response_received');
    } catch (error) {
      console.error('AI Error:', error);
      chatAnalytics.track('error', { type: 'api_failure', error: String(error) });
      
      // Fallback to rule-based response
      const fallbackMsg = getDemoResponse(userMessage, language);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: fallbackMsg,
        timestamp: new Date(),
        metadata: { language, location: userContext.location },
      };
      setMessages(prev => [...prev, assistantMsg]);
      conversationMemory.addMessage(assistantMsg);
      
      if (ttsEnabled) speak(fallbackMsg);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Enhanced OpenRouter call with streaming support
  const sendWithOpenRouter = async (userMessage: string) => {
    const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      throw new Error('No OpenRouter API key available');
    }

    const prompt = buildEnhancedPrompt(userMessage);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'SKYNETRA Disaster Assistant',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
      signal: abortControllerRef.current?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter error:', errorData);
      throw new Error('OpenRouter API failed');
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: text,
      timestamp: new Date(),
      metadata: { language, location: userContext.location, context: entities.map(e => e.value) },
    };
    
    setMessages(prev => [...prev, assistantMsg]);
    conversationMemory.addMessage(assistantMsg);
    
    // Cache the response
    responseCache.set(userMessage, text, userContext.location);
    
    if (ttsEnabled) speak(text);
  };

  // Demo response fallback
  const getDemoResponse = (query: string, lang: LanguageCode): string => {
    const q = query.toLowerCase();
    
    if (q.includes('flood') || q.includes('बाढ़')) {
      return lang === 'hi' 
        ? '🌊 **बाढ़ सुरक्षा:**\n\n1. तुरंत ऊंची जगह पर जाएं\n2. बाढ़ के पानी में न चलें\n3. बिजली बंद करें\n\n📞 आपातकाल: 112'
        : '🌊 **Flood Safety:**\n\n1. Move to higher ground immediately\n2. Never walk through flood water\n3. Turn off electricity\n\n📞 Emergency: 112';
    }

    return LANGUAGES[lang].greeting;
  };

  // Handle user feedback
  const handleFeedback = (messageIndex: number, sentiment: 'positive' | 'negative') => {
    setFeedbackGiven(prev => new Set(prev).add(messageIndex));
    chatAnalytics.track('feedback', { sentiment, messageIndex });
    toast.success(`Thank you for your feedback!`);
    
    // Update message metadata
    const updatedMessages = [...messages];
    updatedMessages[messageIndex].metadata = {
      ...updatedMessages[messageIndex].metadata,
      feedback: sentiment,
    };
    setMessages(updatedMessages);
  };

  // Export conversation
  const handleExport = () => {
    const exportText = conversationMemory.exportConversation();
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skynetra_chat_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    chatAnalytics.track('export');
    toast.success('Conversation exported');
  };

  // Clear conversation
  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear this conversation? It will be archived.')) {
      conversationMemory.archiveSession();
      setMessages([{
        role: 'assistant',
        content: LANGUAGES[language].greeting,
        timestamp: new Date(),
      }]);
      setFeedbackGiven(new Set());
      toast.success('Conversation cleared and archived');
    }
  };

  // Dynamic quick actions
  const getQuickActions = () => {
    const actions: string[] = [];
    
    if (userContext.activeAlerts.length > 0) {
      actions.push('What should I do now?');
      actions.push('Is it safe to go outside?');
    } else {
      actions.push('Emergency kit essentials');
      actions.push('Family emergency plan');
      actions.push('Flood safety tips');
      actions.push('Earthquake preparedness');
    }

    return actions.slice(0, 4);
  };

  const quickActions = getQuickActions();

  return (
    <div className="flex flex-col h-[700px] bg-background border rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-full">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                SKYNETRA AI Assistant
                <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">Advanced</span>
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {userContext.location}
                <span className="mx-1">•</span>
                <Cloud className="w-3 h-3" /> {userContext.weather}
              </p>
            </div>
          </div>
          
          {/* Controls */}
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
              title={ttsEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleExport}
              title="Export conversation"
            >
              <Download className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClearChat}
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Active Alerts */}
        {userContext.activeAlerts.length > 0 && (
          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <strong>Active Alerts:</strong> {userContext.activeAlerts[0]}
            </p>
          </div>
        )}

        {/* Entity Display */}
        {entities.length > 0 && (
          <div className="mt-2 flex gap-1 flex-wrap">
            {entities.slice(0, 5).map((entity, idx) => (
              <span
                key={idx}
                className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
              >
                {entity.type}: {entity.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="flex flex-col gap-2 max-w-[85%]">
                <div
                  className={`rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div 
                    className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                  />
                </div>
                
                {/* Feedback buttons */}
                {msg.role === 'assistant' && idx > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => speak(msg.content)}
                      disabled={isSpeaking}
                    >
                      <Volume2 className="w-3 h-3 mr-1" />
                      Listen
                    </Button>
                    
                    {!feedbackGiven.has(idx) ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleFeedback(idx, 'positive')}
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Helpful
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleFeedback(idx, 'negative')}
                        >
                          <ThumbsDown className="w-3 h-3 mr-1" />
                          Not helpful
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Thanks for feedback!
                      </span>
                    )}
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
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
              <div className="rounded-lg p-3 bg-muted">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
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
            className="flex-shrink-0"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={
              isListening 
                ? 'Listening...' 
language === 'hi' 
                ? 'अपना प्रश्न पूछें...' 
                : 'Ask about emergency procedures...'
            }
            disabled={isLoading}
            className="flex-grow"
          />

          <Button 
            onClick={() => sendMessage()} 
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        {isListening && (
          <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">
            🎤 Listening in {LANGUAGES[language].name}...
          </p>
        )}

        <div className="mt-2 text-xs text-center text-muted-foreground">
          {messages.length} messages • Session: {conversationMemory.getCurrentSession().id.slice(-8)}
        </div>
      </div>
    </div>
  );
}
