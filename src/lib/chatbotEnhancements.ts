/**
 * Advanced Chatbot Enhancement Utilities
 * Provides conversation memory, caching, analytics, and NER
 */

// ============================================
// CONVERSATION MEMORY MANAGEMENT
// ============================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    language?: string;
    location?: string;
    context?: string[];
    feedback?: 'positive' | 'negative';
  };
}

export interface ConversationSession {
  id: string;
  messages: ChatMessage[];
  startTime: Date;
  lastActivity: Date;
  userId?: string;
  context: {
    location?: string;
    activeAlerts?: string[];
    weatherRisks?: string[];
    topicHistory?: string[];
  };
}

class ConversationMemory {
  private static instance: ConversationMemory;
  private sessionKey = 'skynetra_chat_session';
  private historyKey = 'skynetra_chat_history';
  private maxHistorySize = 50;
  private maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {}

  static getInstance(): ConversationMemory {
    if (!ConversationMemory.instance) {
      ConversationMemory.instance = new ConversationMemory();
    }
    return ConversationMemory.instance;
  }

  // Get current session or create new one
  getCurrentSession(): ConversationSession {
    const stored = this.getStoredSession();
    
    if (stored && this.isSessionValid(stored)) {
      return stored;
    }

    // Create new session
    const newSession: ConversationSession = {
      id: this.generateSessionId(),
      messages: [],
      startTime: new Date(),
      lastActivity: new Date(),
      context: {},
    };

    this.saveSession(newSession);
    return newSession;
  }

  // Add message to current session
  addMessage(message: ChatMessage): void {
    const session = this.getCurrentSession();
    session.messages.push(message);
    session.lastActivity = new Date();
    
    // Track topics for context
    if (message.role === 'user') {
      this.extractAndTrackTopics(message.content, session);
    }

    this.saveSession(session);
  }

  // Get conversation context (last N messages)
  getConversationContext(limit: number = 10): ChatMessage[] {
    const session = this.getCurrentSession();
    return session.messages.slice(-limit);
  }

  // Build context summary for prompt
  buildContextSummary(): string {
    const session = this.getCurrentSession();
    const context = session.context;
    
    let summary = '';
    
    if (context.location) {
      summary += `Location: ${context.location}\n`;
    }
    
    if (context.topicHistory && context.topicHistory.length > 0) {
      summary += `Previous topics discussed: ${context.topicHistory.join(', ')}\n`;
    }
    
    if (context.activeAlerts && context.activeAlerts.length > 0) {
      summary += `Active alerts: ${context.activeAlerts.join(', ')}\n`;
    }
    
    if (context.weatherRisks && context.weatherRisks.length > 0) {
      summary += `Weather risks: ${context.weatherRisks.join(', ')}\n`;
    }

    return summary;
  }

  // Extract topics using simple keyword matching
  private extractAndTrackTopics(content: string, session: ConversationSession): void {
    const topics = new Set(session.context.topicHistory || []);
    const contentLower = content.toLowerCase();

    const topicKeywords: Record<string, string[]> = {
      'Flood Safety': ['flood', 'flooding', 'water rising', 'drainage'],
      'Earthquake Preparedness': ['earthquake', 'quake', 'tremor', 'seismic'],
      'Cyclone Response': ['cyclone', 'storm', 'hurricane', 'wind'],
      'Heatwave Protection': ['heat', 'heatwave', 'hot weather', 'temperature'],
      'Emergency Kit': ['emergency kit', 'supplies', 'essentials', 'preparation'],
      'Evacuation': ['evacuate', 'evacuation', 'shelter', 'safe place'],
      'First Aid': ['first aid', 'medical', 'injury', 'treatment'],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(kw => contentLower.includes(kw))) {
        topics.add(topic);
      }
    }

    session.context.topicHistory = Array.from(topics).slice(-5); // Keep last 5 topics
  }

  // Update session context
  updateContext(update: Partial<ConversationSession['context']>): void {
    const session = this.getCurrentSession();
    session.context = { ...session.context, ...update };
    this.saveSession(session);
  }

  // Save session to localStorage
  private saveSession(session: ConversationSession): void {
    try {
      // Convert dates to ISO strings for storage
      const serializable = {
        ...session,
        startTime: session.startTime.toISOString(),
        lastActivity: session.lastActivity.toISOString(),
        messages: session.messages.map(m => ({
          ...m,
          timestamp: m.timestamp ? m.timestamp.toISOString() : new Date().toISOString(),
        })),
      };
      localStorage.setItem(this.sessionKey, JSON.stringify(serializable));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  // Get stored session
  private getStoredSession(): ConversationSession | null {
    try {
      const stored = localStorage.getItem(this.sessionKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      
      // Convert ISO strings back to Date objects
      return {
        ...parsed,
        startTime: new Date(parsed.startTime),
        lastActivity: new Date(parsed.lastActivity),
        messages: parsed.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      };
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  // Check if session is still valid
  private isSessionValid(session: ConversationSession): boolean {
    const age = Date.now() - session.lastActivity.getTime();
    return age < this.maxSessionAge;
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export conversation history
  exportConversation(): string {
    const session = this.getCurrentSession();
    let export_text = `SKYNETRA Disaster Assistant - Conversation Export\n`;
    export_text += `Session ID: ${session.id}\n`;
    export_text += `Date: ${session.startTime.toLocaleString()}\n`;
    export_text += `Location: ${session.context.location || 'Not specified'}\n`;
    export_text += `\n${'='.repeat(60)}\n\n`;

    session.messages.forEach((msg, idx) => {
      const role = msg.role === 'user' ? 'You' : 'SKYNETRA';
      const time = msg.timestamp ? msg.timestamp.toLocaleTimeString() : '';
      export_text += `[${time}] ${role}:\n${msg.content}\n\n`;
    });

    return export_text;
  }

  // Clear current session
  clearSession(): void {
    localStorage.removeItem(this.sessionKey);
  }

  // Save to history and start fresh
  archiveSession(): void {
    const session = this.getCurrentSession();
    
    try {
      const history = JSON.parse(localStorage.getItem(this.historyKey) || '[]');
      history.unshift({
        ...session,
        startTime: session.startTime.toISOString(),
        lastActivity: session.lastActivity.toISOString(),
      });

      // Keep only recent history
      const trimmed = history.slice(0, this.maxHistorySize);
      localStorage.setItem(this.historyKey, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to archive session:', error);
    }

    this.clearSession();
  }
}

// ============================================
// RESPONSE CACHING
// ============================================

interface CacheEntry {
  query: string;
  response: string;
  timestamp: number;
  hits: number;
}

class ResponseCache {
  private static instance: ResponseCache;
  private cache: Map<string, CacheEntry>;
  private maxSize = 100;
  private ttl = 60 * 60 * 1000; // 1 hour

  private constructor() {
    this.cache = new Map();
    this.loadFromStorage();
  }

  static getInstance(): ResponseCache {
    if (!ResponseCache.instance) {
      ResponseCache.instance = new ResponseCache();
    }
    return ResponseCache.instance;
  }

  // Generate cache key
  private generateKey(query: string, context?: string): string {
    const normalized = query.toLowerCase().trim();
    return context ? `${normalized}::${context}` : normalized;
  }

  // Get cached response
  get(query: string, context?: string): string | null {
    const key = this.generateKey(query, context);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hits++;
    return entry.response;
  }

  // Store response in cache
  set(query: string, response: string, context?: string): void {
    const key = this.generateKey(query, context);
    
    this.cache.set(key, {
      query,
      response,
      timestamp: Date.now(),
      hits: 0,
    });

    // Evict oldest if cache is full
    if (this.cache.size > this.maxSize) {
      this.evictOldest();
    }

    this.saveToStorage();
  }

  // Evict least recently used
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Save to localStorage
  private saveToStorage(): void {
    try {
      const entries = Array.from(this.cache.entries());
      localStorage.setItem('skynetra_cache', JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  // Load from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('skynetra_cache');
      if (stored) {
        const entries = JSON.parse(stored);
        this.cache = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
  }

  // Clear cache
  clear(): void {
    this.cache.clear();
    localStorage.removeItem('skynetra_cache');
  }
}

// ============================================
// NAMED ENTITY RECOGNITION
// ============================================

export interface ExtractedEntity {
  type: 'disaster' | 'location' | 'severity' | 'action' | 'time';
  value: string;
  confidence: number;
}

class EntityRecognizer {
  private static instance: EntityRecognizer;

  private disasterTypes = [
    'flood', 'flooding', 'cyclone', 'hurricane', 'earthquake', 'quake',
    'heatwave', 'heat wave', 'fire', 'wildfire', 'landslide', 'tsunami',
    'storm', 'tornado', 'drought', 'avalanche'
  ];

  private severityTerms = [
    'severe', 'extreme', 'high', 'moderate', 'low', 'critical', 'emergency',
    'warning', 'alert', 'watch', 'dangerous', 'life-threatening'
  ];

  private actionVerbs = [
    'evacuate', 'shelter', 'prepare', 'stockpile', 'secure', 'board up',
    'move to', 'stay inside', 'avoid', 'check', 'monitor', 'report'
  ];

  private timeIndicators = [
    'now', 'immediately', 'urgent', 'today', 'tonight', 'tomorrow',
    'next 24 hours', 'next 48 hours', 'this week', 'coming days'
  ];

  private constructor() {}

  static getInstance(): EntityRecognizer {
    if (!EntityRecognizer.instance) {
      EntityRecognizer.instance = new EntityRecognizer();
    }
    return EntityRecognizer.instance;
  }

  // Extract entities from text
  extract(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const textLower = text.toLowerCase();
    const matched = new Set<string>(); // Track matched terms to avoid duplicates

    // Sort disaster types by length (descending) to match longer phrases first
    const sortedDisasters = [...this.disasterTypes].sort((a, b) => b.length - a.length);

    // Extract disasters using word boundaries
    sortedDisasters.forEach(disaster => {
      const regex = new RegExp(`\\b${disaster}\\b`, 'i');
      if (regex.test(text) && !matched.has('disaster')) {
        entities.push({
          type: 'disaster',
          value: disaster,
          confidence: 0.9,
        });
        matched.add('disaster'); // Only match first disaster to avoid duplicates
      }
    });

    // Extract severity using word boundaries
    for (const severity of this.severityTerms) {
      const regex = new RegExp(`\\b${severity}\\b`, 'i');
      if (regex.test(text) && !matched.has('severity')) {
        entities.push({
          type: 'severity',
          value: severity,
          confidence: 0.8,
        });
        matched.add('severity');
        break; // Only match first severity
      }
    }

    // Extract actions using word boundaries
    for (const action of this.actionVerbs) {
      const regex = new RegExp(`\\b${action}\\b`, 'i');
      if (regex.test(text)) {
        entities.push({
          type: 'action',
          value: action,
          confidence: 0.7,
        });
      }
    }

    // Extract time indicators (only in disaster-related context)
    // Skip conversational phrases like "How are you today?"
    const hasDisasterContext = entities.some(e => e.type === 'disaster' || e.type === 'severity' || e.type === 'action');
    
    if (hasDisasterContext) {
      for (const time of this.timeIndicators) {
        const regex = new RegExp(`\\b${time}\\b`, 'i');
        if (regex.test(text) && !matched.has('time')) {
          entities.push({
            type: 'time',
            value: time,
            confidence: 0.8,
          });
          matched.add('time');
          break; // Only match first time indicator
        }
      }
    }

    // Extract locations (Indian cities/states - simple pattern)
    const locationPatterns = [
      /in ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
      /at ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
      /near ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    ];

    locationPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        entities.push({
          type: 'location',
          value: match[1],
          confidence: 0.6,
        });
      }
    });

    return entities;
  }

  // Generate context from entities
  generateContext(entities: ExtractedEntity[]): string {
    const disasters = entities.filter(e => e.type === 'disaster').map(e => e.value);
    const locations = entities.filter(e => e.type === 'location').map(e => e.value);
    const severities = entities.filter(e => e.type === 'severity').map(e => e.value);
    const times = entities.filter(e => e.type === 'time').map(e => e.value);

    let context = '';
    
    if (disasters.length > 0) {
      context += `Detected disasters: ${disasters.join(', ')}. `;
    }
    if (locations.length > 0) {
      context += `Locations mentioned: ${locations.join(', ')}. `;
    }
    if (severities.length > 0) {
      context += `Severity: ${severities[0]}. `;
    }
    if (times.length > 0) {
      context += `Time sensitivity: ${times[0]}. `;
    }

    return context;
  }
}

// ============================================
// ANALYTICS TRACKING
// ============================================

interface AnalyticsEvent {
  type: 'message_sent' | 'response_received' | 'error' | 'feedback' | 'voice_used';
  timestamp: Date;
  metadata?: Record<string, any>;
}

class ChatAnalytics {
  private static instance: ChatAnalytics;
  private events: AnalyticsEvent[] = [];

  private constructor() {}

  static getInstance(): ChatAnalytics {
    if (!ChatAnalytics.instance) {
      ChatAnalytics.instance = new ChatAnalytics();
    }
    return ChatAnalytics.instance;
  }

  // Track event
  track(type: AnalyticsEvent['type'], metadata?: Record<string, any>): void {
    this.events.push({
      type,
      timestamp: new Date(),
      metadata,
    });

    // Log to monitoring system if available
    if (window.__MONITORING__) {
      window.__MONITORING__.trackEvent('chatbot_' + type, metadata);
    }
  }

  // Get statistics
  getStats() {
    return {
      totalMessages: this.events.filter(e => e.type === 'message_sent').length,
      totalResponses: this.events.filter(e => e.type === 'response_received').length,
      errors: this.events.filter(e => e.type === 'error').length,
      voiceUsage: this.events.filter(e => e.type === 'voice_used').length,
      positivefeedback: this.events.filter(e => 
        e.type === 'feedback' && e.metadata?.sentiment === 'positive'
      ).length,
      negativeFeedback: this.events.filter(e => 
        e.type === 'feedback' && e.metadata?.sentiment === 'negative'
      ).length,
    };
  }
}

// ============================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// ============================================
// EXPORTS
// ============================================

export const conversationMemory = ConversationMemory.getInstance();
export const responseCache = ResponseCache.getInstance();
export const entityRecognizer = EntityRecognizer.getInstance();
export const chatAnalytics = ChatAnalytics.getInstance();

// Declare global types
declare global {
  interface Window {
    __MONITORING__?: {
      trackEvent: (name: string, properties?: Record<string, any>) => void;
    };
  }
}
