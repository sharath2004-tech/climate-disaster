/**
 * Enhanced AI Disaster Assistant
 * 
 * Features:
 * 1. Context-Aware AI - Uses active alerts, location, weather
 * 2. Voice Input/Output - Speech recognition & text-to-speech
 * 3. Smart Quick Actions - Dynamic based on current disasters
 * 4. Multi-Language Support - Hindi, Marathi, Tamil, Bengali, English
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlerts } from '@/hooks/useAPI';
import {
    AlertTriangle,
    Bot,
    Cloud,
    Loader2, MapPin, Mic, MicOff,
    Send, User, Volume2, VolumeX
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// Language configurations
const LANGUAGES = {
  en: { name: 'English', code: 'en-IN', greeting: 'Hello! I\'m your disaster response assistant. How can I help you stay safe?' },
  hi: { name: 'हिंदी', code: 'hi-IN', greeting: 'नमस्ते! मैं आपका आपदा प्रतिक्रिया सहायक हूं। मैं आपकी सुरक्षा में कैसे मदद कर सकता हूं?' },
  mr: { name: 'मराठी', code: 'mr-IN', greeting: 'नमस्कार! मी तुमचा आपत्ती प्रतिसाद सहाय्यक आहे. मी तुम्हाला सुरक्षित राहण्यात कशी मदत करू शकतो?' },
  ta: { name: 'தமிழ்', code: 'ta-IN', greeting: 'வணக்கம்! நான் உங்கள் பேரிடர் பதில் உதவியாளர். நான் உங்களை எப்படி பாதுகாப்பாக வைத்திருக்க உதவ முடியும்?' },
  bn: { name: 'বাংলা', code: 'bn-IN', greeting: 'নমস্কার! আমি আপনার দুর্যোগ প্রতিক্রিয়া সহকারী। আমি কিভাবে আপনাকে নিরাপদ থাকতে সাহায্য করতে পারি?' },
  te: { name: 'తెలుగు', code: 'te-IN', greeting: 'నమస్కారం! నేను మీ విపత్తు స్పందన సహాయకుడిని. మీరు సురక్షితంగా ఉండటానికి నేను ఎలా సహాయం చేయగలను?' },
};

type LanguageCode = keyof typeof LANGUAGES;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface UserContext {
  location: string;
  coordinates: { lat: number; lng: number } | null;
  activeAlerts: string[];
  weather: string;
  language: LanguageCode;
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

// Voice recognition hook
const useVoiceRecognition = (language: LanguageCode) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      toast.error('Voice input is not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognitionAPI() as SpeechRecognitionInstance;
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = LANGUAGES[language].code;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Please allow microphone access');
      }
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
  const [isEnabled, setIsEnabled] = useState(false); // Disabled by default - user must click Listen

  const speak = useCallback((text: string) => {
    if (!isEnabled || !('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANGUAGES[language].code;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
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

// Simple markdown parser for basic formatting
const parseMarkdown = (text: string): string => {
  return text
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br/>')
    // Lists: - item
    .replace(/^- (.+)$/gm, '• $1');
};

export function AIChat() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [userContext, setUserContext] = useState<UserContext>({
    location: 'Detecting...',
    coordinates: null,
    activeAlerts: [],
    weather: 'Unknown',
    language: 'en',
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Fetch active alerts
  const { data: alertsData } = useAlerts({ limit: 10 });
  const activeAlerts = useMemo(() => {
    const alerts = alertsData?.alerts || alertsData || [];
    return Array.isArray(alerts) ? alerts : [];
  }, [alertsData]);

  // Voice hooks
  const { isListening, transcript, startListening, stopListening, setTranscript } = useVoiceRecognition(language);
  const { isSpeaking, isEnabled: ttsEnabled, setIsEnabled: setTtsEnabled, speak, stop: stopSpeaking } = useTextToSpeech(language);

  // Initialize with greeting in selected language
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: LANGUAGES[language].greeting,
      timestamp: new Date(),
    }]);
  }, [language]);

  // Update context with active alerts
  useEffect(() => {
    if (activeAlerts.length > 0) {
      const alertDescriptions = activeAlerts.slice(0, 5).map((a: { severity?: string; type?: string; location?: { city?: string } }) => 
        `${a.severity || 'unknown'} ${a.type || 'alert'} in ${a.location?.city || 'nearby area'}`
      );
      setUserContext(prev => ({ ...prev, activeAlerts: alertDescriptions }));
    }
  }, [activeAlerts]);

  // Detect user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserContext(prev => ({ ...prev, coordinates: { lat: latitude, lng: longitude } }));

          try {
            // Reverse geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown';
            const state = data.address?.state || '';
            setUserContext(prev => ({ ...prev, location: `${city}, ${state}` }));

            // Fetch weather (using Open-Meteo - free, no API key)
            const weatherRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
            );
            const weatherData = await weatherRes.json();
            const temp = weatherData.current?.temperature_2m || 'N/A';
            const weatherCode = weatherData.current?.weather_code || 0;
            const condition = getWeatherCondition(weatherCode);
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

  // Weather code to condition
  const getWeatherCondition = (code: number): string => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 57) return 'Drizzle';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    if (code <= 82) return 'Rain showers';
    if (code <= 86) return 'Snow showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Unknown';
  };

  // Build context-aware prompt
  const buildContextPrompt = (userMessage: string) => {
    const langInstruction = language !== 'en' 
      ? `IMPORTANT: Respond in ${LANGUAGES[language].name} language.`
      : '';

    return `You are SKYNETRA, an AI-powered disaster response assistant. You help people stay safe during emergencies.

CURRENT CONTEXT:
- User Location: ${userContext.location}
- Active Alerts: ${userContext.activeAlerts.length > 0 ? userContext.activeAlerts.join('; ') : 'No active alerts in your area'}
- Weather: ${userContext.weather}
- Current Time: ${new Date().toLocaleString('en-IN')}

${langInstruction}

GUIDELINES:
1. Provide clear, actionable safety advice
2. Prioritize life-saving information
3. Be concise but thorough
4. Include specific local context when relevant
5. If there are active alerts, factor them into your advice
6. Always mention emergency helpline numbers (India: 112, NDRF: 9711077372)

User Question: ${userMessage}

Provide helpful disaster preparedness or emergency response guidance:`;
  };

  // Dynamic quick actions based on context
  const getQuickActions = () => {
    const actions: string[] = [];

    // Add alert-specific actions
    activeAlerts.forEach((alert: { type?: string }) => {
      if (alert.type === 'flood' && !actions.some(a => a.includes('flood'))) {
        actions.push('Flood safety tips');
        actions.push('What to do if water enters home?');
      }
      if ((alert.type === 'cyclone' || alert.type === 'hurricane') && !actions.some(a => a.includes('cyclone'))) {
        actions.push('Cyclone preparation checklist');
        actions.push('When to evacuate for cyclone?');
      }
      if (alert.type === 'earthquake' && !actions.some(a => a.includes('earthquake'))) {
        actions.push('Earthquake safety - Drop, Cover, Hold');
        actions.push('After earthquake checklist');
      }
      if (alert.type === 'fire' && !actions.some(a => a.includes('fire'))) {
        actions.push('Fire evacuation steps');
        actions.push('How to use fire extinguisher?');
      }
    });

    // Default actions if no specific alerts
    if (actions.length === 0) {
      actions.push(
        'Emergency kit essentials',
        'Family emergency plan',
        'Nearest shelter location',
        'First aid basics'
      );
    }

    return actions.slice(0, 4);
  };

  // Send message
  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      // Primary: OpenRouter (Llama 3.3 70B - Free)
      await sendWithOpenRouter(userMessage);
    } catch (error) {
      console.error('AI Error:', error);
      
      // Try fallback chain: Cohere -> Demo mode
      try {
        await sendWithCohere(userMessage);
      } catch (cohereError) {
        console.error('Cohere fallback failed:', cohereError);
        // Final fallback: Demo mode responses
        const demoResponse = getDemoResponse(userMessage, language);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: demoResponse,
          timestamp: new Date(),
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Demo mode responses when all APIs fail
  const getDemoResponse = (query: string, lang: LanguageCode): string => {
    const q = query.toLowerCase();
    
    const responses: Record<string, Record<LanguageCode, string>> = {
      earthquake: {
        en: `🏠 **Earthquake Safety Tips:**

1. **DROP** to your hands and knees
2. **COVER** under a sturdy desk or table
3. **HOLD ON** until shaking stops

**After the earthquake:**
- Check yourself and others for injuries
- Exit building carefully if damaged
- Stay away from damaged structures
- Be prepared for aftershocks

📞 **Emergency:** 112 | **NDRF:** 9711077372`,
        hi: `🏠 **भूकंप सुरक्षा सुझाव:**

1. **गिरें** - अपने हाथों और घुटनों पर
2. **छिपें** - मजबूत मेज के नीचे
3. **पकड़ें** - हिलना बंद होने तक

**भूकंप के बाद:**
- चोटों की जाँच करें
- क्षतिग्रस्त इमारत से सावधानी से बाहर निकलें
- क्षतिग्रस्त संरचनाओं से दूर रहें

📞 **आपातकालीन:** 112 | **NDRF:** 9711077372`,
        mr: `🏠 **भूकंप सुरक्षा टिप्स:**

1. हात आणि गुडघ्यांवर **खाली बसा**
2. मजबूत टेबलखाली **लपा**
3. हलणे थांबेपर्यंत **धरून राहा**

📞 **आपत्कालीन:** 112`,
        ta: `🏠 **நிலநடுக்க பாதுகாப்பு:**

1. கைகள் மற்றும் முழங்கால்களில் **கீழே இறங்குங்கள்**
2. உறுதியான மேசையின் கீழ் **மறைந்து கொள்ளுங்கள்**
3. அசைவு நிற்கும் வரை **பிடித்துக் கொள்ளுங்கள்**

📞 **அவசர:** 112`,
        bn: `🏠 **ভূমিকম্প নিরাপত্তা:**

1. হাত ও হাঁটুতে **নামুন**
2. শক্ত টেবিলের নিচে **আশ্রয় নিন**
3. কাঁপুনি বন্ধ না হওয়া পর্যন্ত **ধরে থাকুন**

📞 **জরুরি:** 112`,
        te: `🏠 **భూకంప భద్రత:**

1. చేతులు మరియు మోకాళ్ల మీద **కిందకు వెళ్ళండి**
2. బలమైన బల్ల కింద **దాక్కోండి**
3. కదలిక ఆగే వరకు **పట్టుకోండి**

📞 **అత్యవసరం:** 112 | **NDRF:** 9711077372`,
      },
      flood: {
        en: `🌊 **Flood Safety Tips:**

1. Move to **higher ground** immediately
2. **Never walk or drive** through flood waters
3. Turn off electricity at main switch
4. Keep emergency kit ready with food, water, medicines

**If trapped:**
- Go to the highest level (NOT the attic)
- Signal for help from window/roof
- Call emergency services: 112

📞 **NDRF Helpline:** 9711077372`,
        hi: `🌊 **बाढ़ सुरक्षा सुझाव:**

1. तुरंत **ऊंचे स्थान** पर जाएं
2. बाढ़ के पानी में **कभी न चलें**
3. मुख्य स्विच से बिजली बंद करें
4. भोजन, पानी, दवाइयों के साथ किट तैयार रखें

📞 **आपातकालीन:** 112 | **NDRF:** 9711077372`,
        mr: `🌊 **पूर सुरक्षा:**

1. ताबडतोब **उंच जागी** जा
2. पुराच्या पाण्यातून **कधीही चालू नका**
3. मुख्य स्विचवरून वीज बंद करा

📞 **आपत्कालीन:** 112`,
        ta: `🌊 **வெள்ள பாதுகாப்பு:**

1. உடனடியாக **உயரமான இடத்திற்கு** செல்லுங்கள்
2. வெள்ள நீரில் **நடக்காதீர்கள்**
3. மெயின் ஸ்விட்சில் மின்சாரத்தை அணைக்கவும்

📞 **அவசர:** 112`,
        bn: `🌊 **বন্যা নিরাপত্তা:**

1. অবিলম্বে **উঁচু জায়গায়** যান
2. বন্যার পানিতে **কখনও হাঁটবেন না**
3. মেইন সুইচ থেকে বিদ্যুৎ বন্ধ করুন

📞 **জরুরি:** 112`,
        te: `🌊 **వరద భద్రత:**

1. వెంటనే **ఎత్తైన ప్రదేశానికి** వెళ్ళండి
2. వరద నీటిలో **ఎప్పుడూ నడవకండి**
3. మెయిన్ స్విచ్ నుండి కరెంట్ ఆపండి

📞 **అత్యవసరం:** 112 | **NDRF:** 9711077372`,
      },
      kit: {
        en: `🎒 **Emergency Kit Essentials:**

**Water & Food:**
- 3-day water supply (1 gallon/person/day)
- Non-perishable food items
- Manual can opener

**Safety Items:**
- First aid kit
- Flashlight & extra batteries
- Whistle to signal for help
- Dust masks, plastic sheets

**Documents:**
- ID proofs, insurance papers (copies)
- Emergency contact list
- Cash in small denominations

**Other:**
- Phone charger / power bank
- Medications (7-day supply)
- Blankets, warm clothing`,
        hi: `🎒 **आपातकालीन किट:**

**पानी और भोजन:**
- 3 दिन का पानी
- सूखा भोजन
- कैन ओपनर

**सुरक्षा सामग्री:**
- प्राथमिक चिकित्सा किट
- टॉर्च और बैटरी
- सीटी
- मास्क

**दस्तावेज:**
- आईडी की कॉपी
- आपातकालीन संपर्क सूची
- नकद`,
        mr: `🎒 **आपत्कालीन किट:**
- 3 दिवसांचे पाणी
- कोरडे अन्न
- प्रथमोपचार किट
- टॉर्च आणि बॅटरी
- महत्त्वाची कागदपत्रे`,
        ta: `🎒 **அவசர கிட்:**
- 3 நாள் தண்ணீர்
- உலர் உணவு
- முதலுதவி பெட்டி
- ஃபிளாஷ்லைட்
- முக்கிய ஆவணங்கள்`,
        bn: `🎒 **জরুরি কিট:**
- 3 দিনের পানি
- শুকনো খাবার
- প্রাথমিক চিকিৎসা কিট
- টর্চলাইট
- গুরুত্বপূর্ণ নথি`,
        te: `🎒 **అత్యవసర కిట్:**
- 3 రోజుల నీరు
- పొడి ఆహారం
- ప్రథమ చికిత్స కిట్
- ఫ్లాష్‌లైట్
- ముఖ్యమైన పత్రాలు`,
      },
      default: {
        en: `I'm SKYNETRA, your disaster response assistant. I can help you with:

🏠 **Earthquake safety** - Drop, Cover, Hold
🌊 **Flood preparedness** - Evacuation routes
🌪️ **Cyclone alerts** - When to shelter
🔥 **Fire safety** - Evacuation steps
🎒 **Emergency kits** - What to pack
🏥 **First aid** - Basic procedures

**Emergency Numbers (India):**
📞 National Emergency: **112**
📞 NDRF Helpline: **9711077372**
📞 Disaster Management: **1078**

Ask me anything about staying safe during disasters!`,
        hi: `मैं SKYNETRA हूं, आपका आपदा प्रतिक्रिया सहायक। मैं इनमें मदद कर सकता हूं:

🏠 भूकंप सुरक्षा
🌊 बाढ़ की तैयारी
🌪️ चक्रवात अलर्ट
🎒 आपातकालीन किट

**आपातकालीन नंबर:**
📞 राष्ट्रीय आपातकालीन: **112**
📞 NDRF: **9711077372**`,
        mr: `मी SKYNETRA आहे, तुमचा आपत्ती प्रतिसाद सहाय्यक।

📞 आपत्कालीन: **112**
📞 NDRF: **9711077372**`,
        ta: `நான் SKYNETRA, உங்கள் பேரிடர் பதில் உதவியாளர்.

📞 அவசர: **112**
📞 NDRF: **9711077372**`,
        bn: `আমি SKYNETRA, আপনার দুর্যোগ সাড়া সহকারী।

📞 জরুরি: **112**
📞 NDRF: **9711077372**`,
        te: `నేను SKYNETRA, మీ విపత్తు స్పందన సహాయకుడిని.

🏠 భూకంప భద్రత
🌊 వరద సంసిద్ధత
🌪️ తుఫాను హెచ్చరికలు
🎒 అత్యవసర కిట్

📞 అత్యవసరం: **112**
📞 NDRF: **9711077372**`,
      },
    };

    // Match query to response
    if (q.includes('earthquake') || q.includes('भूकंप') || q.includes('quake')) {
      return responses.earthquake[lang];
    }
    if (q.includes('flood') || q.includes('बाढ़') || q.includes('water')) {
      return responses.flood[lang];
    }
    if (q.includes('kit') || q.includes('essentials') || q.includes('pack') || q.includes('checklist')) {
      return responses.kit[lang];
    }
    
    return responses.default[lang];
  };

  // Fallback to HuggingFace
  const sendWithHuggingFace = async (userMessage: string) => {
    const HF_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;
    if (!HF_API_KEY || HF_API_KEY === 'your_huggingface_token_here') {
      throw new Error('No API key available');
    }

    const prompt = buildContextPrompt(userMessage);
    
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 400,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      }
    );

    const data = await response.json();
    const text = data[0]?.generated_text || 'Sorry, I could not generate a response.';
    
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: text,
      timestamp: new Date(),
    }]);
  };

  // Fallback to OpenRouter (Free Llama 3.3 70B)
  const sendWithOpenRouter = async (userMessage: string) => {
    const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      throw new Error('No OpenRouter API key available');
    }

    const prompt = buildContextPrompt(userMessage);
    
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
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter error:', errorData);
      throw new Error('OpenRouter API failed');
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: text,
      timestamp: new Date(),
    }]);
  };

  // Fallback to Cohere
  const sendWithCohere = async (userMessage: string) => {
    const COHERE_API_KEY = import.meta.env.VITE_COHERE_API_KEY;
    if (!COHERE_API_KEY) {
      throw new Error('No Cohere API key available');
    }

    const prompt = buildContextPrompt(userMessage);
    
    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command',
        message: userMessage,
        preamble: prompt,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Cohere API failed');
    }

    const data = await response.json();
    const text = data.text || 'Sorry, I could not generate a response.';
    
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: text,
      timestamp: new Date(),
    }]);
  };

  const quickActions = getQuickActions();

  return (
    <div className="flex flex-col h-[650px] bg-background border rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-full">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">SKYNETRA AI Assistant</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {userContext.location}
                <span className="mx-1">•</span>
                <Cloud className="w-3 h-3" /> {userContext.weather}
              </p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="text-xs px-2 py-1 rounded border bg-background"
              title="Select Language"
            >
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <option key={code} value={code}>{lang.name}</option>
              ))}
            </select>

            {/* TTS Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setTtsEnabled(!ttsEnabled);
              }}
              title={ttsEnabled ? 'Disable voice output' : 'Enable voice output'}
            >
              {ttsEnabled ? (
                <Volume2 className="w-4 h-4 text-primary" />
              ) : (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Active Alerts Banner */}
        {userContext.activeAlerts.length > 0 && (
          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <strong>Active Alerts:</strong> {userContext.activeAlerts[0]}
              {userContext.activeAlerts.length > 1 && ` (+${userContext.activeAlerts.length - 1} more)`}
            </p>
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
              <div
                className={`rounded-lg p-3 max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div 
                  className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                />
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(msg.content);
                        toast.success('Copied to clipboard');
                      }}
                    >
                      📋 Copy
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
          {/* Voice Input Button */}
          <Button
            variant={isListening ? 'destructive' : 'outline'}
            size="icon"
            onClick={isListening ? stopListening : startListening}
            className="flex-shrink-0"
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={
              isListening 
                ? 'Listening...' 
                : language === 'hi' 
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
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {isListening && (
          <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">
            🎤 Listening in {LANGUAGES[language].name}...
          </p>
        )}
      </div>
    </div>
  );
}
