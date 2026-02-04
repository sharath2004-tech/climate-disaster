import express from 'express';
import { buildRAGPrompt } from '../utils/ragKnowledge.js';

const router = express.Router();

/**
 * AI Chat API with RAG (Retrieval Augmented Generation)
 * Provides weather-aware disaster predictions using LLM
 */

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, location, weatherContext, language = 'en' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build context-aware prompt using RAG
    const systemPrompt = buildRAGPrompt(message, weatherContext || {}, location || 'Unknown');

    // Try multiple LLM providers with fallback chain
    let response;
    
    try {
      // Primary: OpenRouter (Free Llama 3.3 70B)
      response = await callOpenRouter(systemPrompt, message, language);
    } catch (error) {
      console.error('OpenRouter failed, trying Cohere:', error.message);
      try {
        // Fallback 1: Cohere
        response = await callCohere(systemPrompt, message, language);
      } catch (cohereError) {
        console.error('Cohere failed, trying Groq:', cohereError.message);
        try {
          // Fallback 2: Groq (Free Llama)
          response = await callGroq(systemPrompt, message, language);
        } catch (groqError) {
          console.error('All LLM providers failed:', groqError.message);
          // Fallback 3: Rule-based response
          response = generateRuleBasedResponse(message, weatherContext, language);
        }
      }
    }

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

// Call OpenRouter API (Free Llama 3.3 70B)
async function callOpenRouter(systemPrompt, userMessage, language) {
  const apiKey = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('No OpenRouter API key');
  }

  const langInstruction = language !== 'en' 
    ? `IMPORTANT: Respond in ${getLanguageName(language)} language.` 
    : '';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://skynetra.vercel.app',
      'X-Title': 'SKYNETRA Disaster Assistant',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { 
          role: 'system', 
          content: systemPrompt + '\n' + langInstruction 
        },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
}

// Call Cohere API
async function callCohere(systemPrompt, userMessage, language) {
  const apiKey = process.env.VITE_COHERE_API_KEY || process.env.COHERE_API_KEY;
  
  if (!apiKey) {
    throw new Error('No Cohere API key');
  }

  const langInstruction = language !== 'en' 
    ? `Respond in ${getLanguageName(language)} language.` 
    : '';

  const response = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'command',
      message: userMessage,
      preamble: systemPrompt + '\n' + langInstruction,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Cohere API error: ${response.status}`);
  }

  const data = await response.json();
  return data.text || 'Sorry, I could not generate a response.';
}

// Call Groq API (Free Llama)
async function callGroq(systemPrompt, userMessage, language) {
  const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('No Groq API key');
  }

  const langInstruction = language !== 'en' 
    ? `Respond in ${getLanguageName(language)} language.` 
    : '';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { 
          role: 'system', 
          content: systemPrompt + '\n' + langInstruction 
        },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
}

// Rule-based response (final fallback)
function generateRuleBasedResponse(query, weatherContext, language = 'en') {
  const queryLower = query.toLowerCase();
  
  // Analyze weather risks
  const risks = weatherContext?.predictions?.flatMap(p => p.risks || []) || [];
  const highRisks = risks.filter(r => r.severity === 'high');

  if (highRisks.length > 0) {
    const risk = highRisks[0];
    return getRiskResponse(risk.type, risk.severity, language);
  }

  // Keyword-based responses
  if (queryLower.includes('flood') || queryLower.includes('बाढ़')) {
    return getFloodResponse(language);
  }
  
  if (queryLower.includes('cyclone') || queryLower.includes('storm')) {
    return getCycloneResponse(language);
  }
  
  if (queryLower.includes('heat') || queryLower.includes('गर्मी')) {
    return getHeatResponse(language);
  }
  
  if (queryLower.includes('earthquake') || queryLower.includes('भूकंप')) {
    return getEarthquakeResponse(language);
  }

  return getDefaultResponse(language);
}

function getRiskResponse(riskType, severity, language) {
  const responses = {
    flood: {
      en: `⚠️ **HIGH FLOOD RISK DETECTED**\n\n` +
          `Immediate actions:\n` +
          `1. Move to higher ground NOW\n` +
          `2. Turn off electricity at main switch\n` +
          `3. Never walk/drive through flood water\n` +
          `4. Keep emergency kit ready\n` +
          `5. Call 112 if trapped\n\n` +
          `📞 NDRF: 9711077372`,
      hi: `⚠️ **उच्च बाढ़ जोखिम का पता चला**\n\n` +
          `तत्काल कार्रवाई:\n` +
          `1. अभी ऊंची जगह पर जाएं\n` +
          `2. मुख्य स्विच से बिजली बंद करें\n` +
          `3. पानी में कभी न चलें\n` +
          `4. आपातकालीन किट तैयार रखें\n\n` +
          `📞 आपातकाल: 112 | NDRF: 9711077372`,
    },
    cyclone: {
      en: `⚠️ **SEVERE STORM WARNING**\n\n` +
          `Immediate actions:\n` +
          `1. Stay indoors, away from windows\n` +
          `2. Secure all outdoor objects\n` +
          `3. Keep emergency supplies ready\n` +
          `4. Charge all devices\n` +
          `5. Monitor official updates\n\n` +
          `📞 Emergency: 112`,
      hi: `⚠️ **गंभीर तूफान चेतावनी**\n\n` +
          `तत्काल कार्रवाई:\n` +
          `1. घर के अंदर रहें\n` +
          `2. बाहरी वस्तुओं को सुरक्षित करें\n` +
          `3. आपातकालीन सामग्री तैयार रखें\n\n` +
          `📞 आपातकाल: 112`,
    },
    heatwave: {
      en: `⚠️ **EXTREME HEAT ALERT**\n\n` +
          `Immediate actions:\n` +
          `1. Stay indoors during 11 AM - 4 PM\n` +
          `2. Drink water every 15-20 minutes\n` +
          `3. Wear light, loose cotton clothes\n` +
          `4. Check on elderly neighbors\n` +
          `5. Never leave kids/pets in vehicles\n\n` +
          `📞 Emergency: 112`,
      hi: `⚠️ **अत्यधिक गर्मी चेतावनी**\n\n` +
          `तत्काल कार्रवाई:\n` +
          `1. 11-4 बजे के दौरान घर में रहें\n` +
          `2. हर 15-20 मिनट में पानी पिएं\n` +
          `3. हल्के कपड़े पहनें\n\n` +
          `📞 आपातकाल: 112`,
    },
  };

  return responses[riskType]?.[language] || responses[riskType]?.en || getDefaultResponse(language);
}

function getFloodResponse(language) {
  if (language === 'hi') {
    return `🌊 **बाढ़ सुरक्षा सुझाव:**\n\n` +
           `1. ऊंचे स्थान पर जाएं\n` +
           `2. बाढ़ के पानी में कभी न चलें\n` +
           `3. बिजली बंद करें\n` +
           `4. आपातकालीन किट तैयार रखें\n\n` +
           `📞 आपातकाल: 112 | NDRF: 9711077372`;
  }
  return `🌊 **Flood Safety Tips:**\n\n` +
         `1. Move to higher ground immediately\n` +
         `2. Never walk/drive through flood water\n` +
         `3. Turn off electricity\n` +
         `4. Keep emergency kit ready\n\n` +
         `📞 Emergency: 112 | NDRF: 9711077372`;
}

function getCycloneResponse(language) {
  if (language === 'hi') {
    return `🌪️ **चक्रवात सुरक्षा:**\n\n` +
           `1. घर के अंदर रहें\n` +
           `2. बाहरी वस्तुओं को सुरक्षित करें\n` +
           `3. खिड़कियों से दूर रहें\n\n` +
           `📞 आपातकाल: 112`;
  }
  return `🌪️ **Cyclone Safety:**\n\n` +
         `1. Stay indoors\n` +
         `2. Secure outdoor objects\n` +
         `3. Stay away from windows\n\n` +
         `📞 Emergency: 112`;
}

function getHeatResponse(language) {
  if (language === 'hi') {
    return `🌡️ **गर्मी से बचाव:**\n\n` +
           `1. बार-बार पानी पिएं\n` +
           `2. दोपहर में बाहर न जाएं\n` +
           `3. हल्के कपड़े पहनें\n\n` +
           `📞 आपातकाल: 112`;
  }
  return `🌡️ **Heat Safety:**\n\n` +
         `1. Drink water frequently\n` +
         `2. Avoid outdoor activities 11 AM - 4 PM\n` +
         `3. Wear light clothing\n\n` +
         `📞 Emergency: 112`;
}

function getEarthquakeResponse(language) {
  if (language === 'hi') {
    return `🏠 **भूकंप सुरक्षा:**\n\n` +
           `1. गिरें, छिपें, पकड़ें\n` +
           `2. मजबूत मेज के नीचे छिपें\n` +
           `3. बाहर न भागें\n\n` +
           `📞 आपातकाल: 112`;
  }
  return `🏠 **Earthquake Safety:**\n\n` +
         `1. DROP, COVER, HOLD ON\n` +
         `2. Get under sturdy furniture\n` +
         `3. Don't run outside\n\n` +
         `📞 Emergency: 112`;
}

function getDefaultResponse(language) {
  if (language === 'hi') {
    return `मैं SKYNETRA हूं, आपका आपदा सहायक। मैं मौसम की भविष्यवाणी और सुरक्षा सुझाव दे सकता हूं।\n\n` +
           `📞 आपातकाल: 112 | NDRF: 9711077372`;
  }
  return `I'm SKYNETRA, your disaster assistant. I can provide weather predictions and safety advice.\n\n` +
         `Ask me about:\n` +
         `• Flood safety\n` +
         `• Cyclone preparedness\n` +
         `• Heatwave protection\n` +
         `• Earthquake response\n\n` +
         `📞 Emergency: 112 | NDRF: 9711077372`;
}

function getLanguageName(code) {
  const languages = {
    en: 'English',
    hi: 'Hindi (हिंदी)',
    mr: 'Marathi (मराठी)',
    ta: 'Tamil (தமிழ்)',
    bn: 'Bengali (বাংলা)',
    te: 'Telugu (తెలుగు)',
  };
  return languages[code] || 'English';
}

export default router;
