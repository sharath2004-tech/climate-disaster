/**
 * Enhanced Backend Support for Advanced Chatbot
 * Add this to server/routes/ai.js for optimal performance
 */

// Enhanced chat endpoint with context awareness
router.post('/api/ai/chat-advanced', async (req, res) => {
  const {
    message,
    context = {},
    entities = [],
    previousMessages = [],
    language = 'en',
    sessionId
  } = req.body;

  try {
    // Build enhanced prompt with full context
    const systemPrompt = buildAdvancedRAGPrompt(
      message,
      context,
      entities,
      previousMessages
    );

    // Log analytics (optional)
    if (sessionId) {
      logChatAnalytics({
        sessionId,
        messageLength: message.length,
        entities: entities.map(e => e.type),
        language,
        timestamp: new Date()
      });
    }

    // Try OpenRouter first (free Llama 3.3 70B)
    try {
      const response = await callOpenRouterAdvanced(systemPrompt, message, language, entities);
      
      res.json({
        success: true,
        response,
        metadata: {
          provider: 'openrouter',
          model: 'llama-3.3-70b',
          cached: false,
          entities: entities.slice(0, 5)
        }
      });
      
    } catch (openrouterError) {
      console.error('OpenRouter failed, trying Cohere:', openrouterError);
      
      // Fallback to Cohere
      try {
        const response = await callCohere(systemPrompt, message, language);
        res.json({
          success: true,
          response,
          metadata: { provider: 'cohere', cached: false }
        });
        
      } catch (cohereError) {
        console.error('Cohere failed, trying Groq:', cohereError);
        
        // Fallback to Groq
        try {
          const response = await callGroq(systemPrompt, message, language);
          res.json({
            success: true,
            response,
            metadata: { provider: 'groq', cached: false }
          });
          
        } catch (groqError) {
          console.error('All LLMs failed, using rule-based:', groqError);
          
          // Final fallback: Enhanced rule-based with entities
          const response = generateEnhancedRuleBasedResponse(
            message,
            context.weatherContext,
            entities,
            language
          );
          
          res.json({
            success: true,
            response,
            metadata: { provider: 'rule-based', cached: false }
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Advanced chat error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate response',
      fallback: getEmergencyFallbackResponse(language)
    });
  }
});

// Build advanced RAG prompt with entities and history
function buildAdvancedRAGPrompt(message, context, entities, previousMessages) {
  const { weatherContext, location, activeAlerts, language } = context;
  
  let prompt = `You are SKYNETRA, an advanced AI disaster response assistant for India.

CURRENT SITUATION:
- Location: ${location || 'Unknown'}
- Weather: ${weatherContext?.current_conditions?.temperature || 'N/A'}°C, ${weatherContext?.current_conditions?.condition || 'Unknown'}
- Active Alerts: ${activeAlerts?.length > 0 ? activeAlerts.join('; ') : 'None'}
- Time: ${new Date().toLocaleString('en-IN')}
`;

  // Add detected entities for context
  if (entities.length > 0) {
    prompt += `\nDETECTED CONTEXT:\n`;
    const disasters = entities.filter(e => e.type === 'disaster').map(e => e.value);
    const locations = entities.filter(e => e.type === 'location').map(e => e.value);
    const severities = entities.filter(e => e.type === 'severity').map(e => e.value);
    const times = entities.filter(e => e.type === 'time').map(e => e.value);
    const actions = entities.filter(e => e.type === 'action').map(e => e.value);
    
    if (disasters.length > 0) prompt += `- Disasters mentioned: ${disasters.join(', ')}\n`;
    if (locations.length > 0) prompt += `- Locations: ${locations.join(', ')}\n`;
    if (severities.length > 0) prompt += `- Severity: ${severities[0]} (URGENT)\n`;
    if (times.length > 0) prompt += `- Time sensitivity: ${times[0]}\n`;
    if (actions.length > 0) prompt += `- Actions needed: ${actions.join(', ')}\n`;
  }

  // Add conversation history for context
  if (previousMessages.length > 0) {
    prompt += `\nRECENT CONVERSATION:\n`;
    previousMessages.slice(-3).forEach(msg => {
      const role = msg.role === 'user' ? 'User' : 'SKYNETRA';
      const content = msg.content.substring(0, 150);
      prompt += `${role}: ${content}${msg.content.length > 150 ? '...' : ''}\n`;
    });
    prompt += `\n`;
  }

  // Add RAG knowledge based on entities
  const knowledge = queryKnowledgeBase(message, weatherContext);
  if (knowledge.length > 0) {
    prompt += `SAFETY KNOWLEDGE BASE:\n`;
    knowledge.forEach(k => {
      if (k.knowledge.safety_measures) {
        prompt += `\n${k.type.toUpperCase()} SAFETY:\n`;
        if (k.knowledge.safety_measures.during) {
          prompt += `During: ${k.knowledge.safety_measures.during.slice(0, 3).join('; ')}\n`;
        }
      }
    });
    prompt += `\n`;
  }

  // Add weather predictions if available
  if (weatherContext?.predictions && weatherContext.predictions.length > 0) {
    prompt += `7-DAY FORECAST:\n`;
    weatherContext.predictions.slice(0, 3).forEach((pred, i) => {
      if (pred.risks.length > 0) {
        prompt += `Day ${i + 1}: ${pred.risks.map(r => `${r.type} (${r.severity})`).join(', ')}\n`;
      }
    });
    prompt += `\n`;
  }

  const langInstruction = language !== 'en' 
    ? `CRITICAL: Respond entirely in ${getLanguageName(language)} language.`
    : '';

  prompt += `${langInstruction}

RESPONSE GUIDELINES:
1. **Context-aware**: Use conversation history and detected entities
2. **Specific**: Reference user's location and current conditions
3. **Actionable**: Provide clear, step-by-step safety instructions
4. **Prioritize urgency**: If "severe", "immediate", or "urgent" detected, lead with critical actions
5. **Concise**: 150-250 words, use markdown formatting
6. **Include contacts**: Mention emergency numbers (112, NDRF: 9711077372)
7. **Empathetic**: Acknowledge concerns, provide reassurance with facts

USER QUESTION: ${message}

Provide contextual disaster safety guidance:`;

  return prompt;
}

// Enhanced OpenRouter call with entity awareness
async function callOpenRouterAdvanced(systemPrompt, userMessage, language, entities) {
  const apiKey = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('No OpenRouter API key');
  }

  // Adjust parameters based on urgency
  const hasUrgentEntity = entities.some(e => 
    (e.type === 'severity' && ['severe', 'extreme', 'critical'].includes(e.value)) ||
    (e.type === 'time' && ['now', 'immediately', 'urgent'].includes(e.value))
  );

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
      'X-Title': 'SKYNETRA Disaster Assistant',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: hasUrgentEntity ? 400 : 600, // Shorter for urgent queries
      temperature: hasUrgentEntity ? 0.5 : 0.7, // More focused for urgent
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
}

// Enhanced rule-based response with entity awareness
function generateEnhancedRuleBasedResponse(query, weatherContext, entities, language = 'en') {
  const queryLower = query.toLowerCase();
  
  // Check for urgent entities
  const hasUrgent = entities.some(e => 
    e.type === 'severity' && ['severe', 'extreme', 'critical'].includes(e.value)
  );
  
  const hasImmediateTime = entities.some(e => 
    e.type === 'time' && ['now', 'immediately', 'urgent'].includes(e.value)
  );

  // Extract disaster types from entities (more accurate than keyword matching)
  const disasterEntities = entities.filter(e => e.type === 'disaster');
  
  if (disasterEntities.length > 0) {
    const disaster = disasterEntities[0].value;
    const urgencyPrefix = (hasUrgent || hasImmediateTime) ? '⚠️ URGENT: ' : '';
    
    if (disaster.includes('flood')) {
      return getFloodResponse(language, hasUrgent, urgencyPrefix);
    }
    if (disaster.includes('cyclone') || disaster.includes('storm')) {
      return getCycloneResponse(language, hasUrgent, urgencyPrefix);
    }
    if (disaster.includes('earthquake') || disaster.includes('quake')) {
      return getEarthquakeResponse(language, hasUrgent, urgencyPrefix);
    }
    if (disaster.includes('heat')) {
      return getHeatResponse(language, hasUrgent, urgencyPrefix);
    }
  }

  // Fallback to keyword matching
  if (queryLower.includes('flood') || queryLower.includes('बाढ़')) {
    return getFloodResponse(language, hasUrgent);
  }
  if (queryLower.includes('cyclone') || queryLower.includes('storm')) {
    return getCycloneResponse(language, hasUrgent);
  }
  if (queryLower.includes('earthquake') || queryLower.includes('भूकंप')) {
    return getEarthquakeResponse(language, hasUrgent);
  }
  if (queryLower.includes('heat') || queryLower.includes('गर्मी')) {
    return getHeatResponse(language, hasUrgent);
  }

  return getDefaultResponse(language);
}

// Enhanced disaster-specific responses with urgency awareness
function getFloodResponse(language, isUrgent, prefix = '') {
  if (language === 'hi') {
    return `${prefix}🌊 **बाढ़ सुरक्षा:**\n\n` +
           `${isUrgent ? '**तत्काल कार्रवाई:**\n' : ''}` +
           `1. ${isUrgent ? '**अभी**' : ''} ऊंचे स्थान पर जाएं\n` +
           `2. बाढ़ के पानी में कभी न चलें\n` +
           `3. मुख्य स्विच से बिजली बंद करें\n` +
           `4. आपातकालीन किट तैयार रखें\n\n` +
           `📞 आपातकाल: 112 | NDRF: 9711077372`;
  }
  return `${prefix}🌊 **Flood Safety:**\n\n` +
         `${isUrgent ? '**IMMEDIATE ACTIONS:**\n' : ''}` +
         `1. Move to higher ground ${isUrgent ? '**NOW**' : 'immediately'}\n` +
         `2. Never walk/drive through flood water (6 inches can knock you down)\n` +
         `3. Turn off electricity at main switch\n` +
         `4. Keep emergency kit ready\n` +
         `5. Call for help if trapped\n\n` +
         `📞 Emergency: 112 | NDRF: 9711077372`;
}

function getCycloneResponse(language, isUrgent, prefix = '') {
  if (language === 'hi') {
    return `${prefix}🌪️ **चक्रवात सुरक्षा:**\n\n` +
           `${isUrgent ? '**तत्काल:**\n' : ''}` +
           `1. घर के अंदर रहें\n` +
           `2. ${isUrgent ? '**अभी**' : ''} खिड़कियों से दूर रहें\n` +
           `3. बाहरी वस्तुओं को सुरक्षित करें\n\n` +
           `📞 आपातकाल: 112`;
  }
  return `${prefix}🌪️ **Cyclone Safety:**\n\n` +
         `${isUrgent ? '**URGENT:**\n' : ''}` +
         `1. Stay indoors ${isUrgent ? '**immediately**' : ''}\n` +
         `2. Move away from windows\n` +
         `3. Secure all outdoor objects\n` +
         `4. Keep emergency supplies ready\n\n` +
         `📞 Emergency: 112`;
}

function getEarthquakeResponse(language, isUrgent, prefix = '') {
  if (language === 'hi') {
    return `${prefix}🏠 **भूकंप सुरक्षा:**\n\n` +
           `**${isUrgent ? 'अभी करें' : 'याद रखें'}:**\n` +
           `1. **गिरें** - हाथ और घुटनों पर\n` +
           `2. **छिपें** - मजबूत मेज के नीचे\n` +
           `3. **पकड़ें** - हिलना बंद होने तक\n\n` +
           `${isUrgent ? '⚠️ बाहर न भागें!\n\n' : ''}` +
           `📞 आपातकाल: 112`;
  }
  return `${prefix}🏠 **Earthquake Safety:**\n\n` +
         `**${isUrgent ? 'DO NOW' : 'REMEMBER'}:**\n` +
         `1. **DROP** to hands and knees\n` +
         `2. **COVER** under sturdy desk/table\n` +
         `3. **HOLD ON** until shaking stops\n\n` +
         `${isUrgent ? '⚠️ Don\'t run outside during shaking!\n\n' : ''}` +
         `📞 Emergency: 112 | NDRF: 9711077372`;
}

function getHeatResponse(language, isUrgent, prefix = '') {
  if (language === 'hi') {
    return `${prefix}🌡️ **गर्मी सुरक्षा:**\n\n` +
           `${isUrgent ? '**तत्काल:**\n' : ''}` +
           `1. ${isUrgent ? '**अभी**' : ''} छाया में जाएं\n` +
           `2. हर 15 मिनट में पानी पिएं\n` +
           `3. दोपहर में बाहर न जाएं\n\n` +
           `📞 आपातकाल: 112`;
  }
  return `${prefix}🌡️ **Heat Safety:**\n\n` +
         `${isUrgent ? '**IMMEDIATE:**\n' : ''}` +
         `1. ${isUrgent ? '**Immediately**' : ''} move to shade/AC\n` +
         `2. Drink water every 15 minutes\n` +
         `3. Avoid outdoor activity 11 AM - 4 PM\n` +
         `4. Wear light, loose clothing\n\n` +
         `📞 Emergency: 112`;
}

function getDefaultResponse(language) {
  if (language === 'hi') {
    return `मैं SKYNETRA हूं, आपका आपदा सहायक। मैं बाढ़, चक्रवात, भूकंप और अन्य आपदाओं के बारे में सुरक्षा सलाह दे सकता हूं।\n\n` +
           `📞 आपातकालीन: 112 | NDRF: 9711077372`;
  }
  return `I'm SKYNETRA, your disaster assistant. I can provide safety advice for floods, cyclones, earthquakes, and other emergencies.\n\n` +
         `Ask me about:\n` +
         `• Disaster preparedness\n` +
         `• Emergency procedures\n` +
         `• Safety guidelines\n\n` +
         `📞 Emergency: 112 | NDRF: 9711077372`;
}

function getEmergencyFallbackResponse(language) {
  if (language === 'hi') {
    return `⚠️ सिस्टम त्रुटि। कृपया तुरंत **112** डायल करें यदि यह आपातकाल है।`;
  }
  return `⚠️ System error. Please dial **112** immediately if this is an emergency.`;
}

// Analytics logging (optional - integrate with your system)
function logChatAnalytics(data) {
  // Could save to database, send to analytics service, etc.
  console.log('[Chat Analytics]', data);
  
  // Example: Save to MongoDB
  // await ChatAnalytics.create(data);
  
  // Example: Send to monitoring service
  // monitoring.track('chatbot_interaction', data);
}

// Export for use in main router
export {
    buildAdvancedRAGPrompt,
    callOpenRouterAdvanced,
    generateEnhancedRuleBasedResponse,
    logChatAnalytics
};

module.exports = router;
