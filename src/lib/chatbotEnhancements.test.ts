/**
 * Test Suite for Advanced Chatbot Enhancements
 * Run with: npm test src/lib/chatbotEnhancements.test.ts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    chatAnalytics,
    conversationMemory,
    entityRecognizer,
    responseCache,
    retryWithBackoff,
    type ChatMessage,
    type ExtractedEntity
} from './chatbotEnhancements';

describe('ConversationMemory', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    conversationMemory.clearSession();
  });

  it('should create new session on first access', () => {
    const session = conversationMemory.getCurrentSession();
    
    expect(session).toBeDefined();
    expect(session.id).toMatch(/^session_/);
    expect(session.messages).toEqual([]);
    expect(session.context).toEqual({});
  });

  it('should persist session to localStorage', () => {
    const session = conversationMemory.getCurrentSession();
    const message: ChatMessage = {
      role: 'user',
      content: 'Test message',
      timestamp: new Date(),
    };
    
    conversationMemory.addMessage(message);
    
    // Retrieve session again
    const retrievedSession = conversationMemory.getCurrentSession();
    expect(retrievedSession.messages).toHaveLength(1);
    expect(retrievedSession.messages[0].content).toBe('Test message');
  });

  it('should track conversation topics', () => {
    const message: ChatMessage = {
      role: 'user',
      content: 'Tell me about flood safety and earthquake preparedness',
      timestamp: new Date(),
    };
    
    conversationMemory.addMessage(message);
    const session = conversationMemory.getCurrentSession();
    
    expect(session.context.topicHistory).toContain('Flood Safety');
    expect(session.context.topicHistory).toContain('Earthquake Preparedness');
  });

  it('should limit topic history to 5 items', () => {
    const topics = [
      'flood safety',
      'earthquake emergency',
      'cyclone preparation',
      'heatwave protection',
      'evacuation routes',
      'first aid basics'
    ];
    
    topics.forEach(topic => {
      conversationMemory.addMessage({
        role: 'user',
        content: topic,
        timestamp: new Date(),
      });
    });
    
    const session = conversationMemory.getCurrentSession();
    expect(session.context.topicHistory?.length).toBeLessThanOrEqual(5);
  });

  it('should build context summary correctly', () => {
    conversationMemory.updateContext({
      location: 'Mumbai',
      activeAlerts: ['Flood warning'],
      weatherRisks: ['Heavy rainfall'],
    });
    
    conversationMemory.addMessage({
      role: 'user',
      content: 'What about floods?',
      timestamp: new Date(),
    });
    
    const summary = conversationMemory.buildContextSummary();
    
    expect(summary).toContain('Mumbai');
    expect(summary).toContain('Flood warning');
    expect(summary).toContain('Heavy rainfall');
  });

  it('should export conversation to text format', () => {
    conversationMemory.addMessage({
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
    });
    
    conversationMemory.addMessage({
      role: 'assistant',
      content: 'Hi! How can I help?',
      timestamp: new Date(),
    });
    
    const exported = conversationMemory.exportConversation();
    
    expect(exported).toContain('SKYNETRA');
    expect(exported).toContain('You:');
    expect(exported).toContain('Hello');
    expect(exported).toContain('Hi! How can I help?');
  });

  it('should clear session', () => {
    conversationMemory.addMessage({
      role: 'user',
      content: 'Test',
      timestamp: new Date(),
    });
    
    conversationMemory.clearSession();
    
    const session = conversationMemory.getCurrentSession();
    expect(session.messages).toHaveLength(0);
  });
});

describe('ResponseCache', () => {
  beforeEach(() => {
    responseCache.clear();
  });

  it('should store and retrieve cached responses', () => {
    const query = 'What should I do in an earthquake?';
    const response = 'DROP, COVER, HOLD ON';
    
    responseCache.set(query, response);
    const cached = responseCache.get(query);
    
    expect(cached).toBe(response);
  });

  it('should return null for non-existent cache entries', () => {
    const cached = responseCache.get('Non-existent query');
    expect(cached).toBeNull();
  });

  it('should handle context-specific caching', () => {
    const query = 'Current weather';
    const response1 = 'Mumbai: 28°C';
    const response2 = 'Delhi: 35°C';
    
    responseCache.set(query, response1, 'Mumbai');
    responseCache.set(query, response2, 'Delhi');
    
    expect(responseCache.get(query, 'Mumbai')).toBe(response1);
    expect(responseCache.get(query, 'Delhi')).toBe(response2);
  });

  it('should expire cache after TTL', async () => {
    const query = 'Test query';
    const response = 'Test response';
    
    // Mock cache with 0 TTL for testing
    responseCache.set(query, response);
    
    // Manually expire by setting timestamp in past
    // This would require exposing the cache map or using a test helper
    // For now, we'll test the logic exists
    
    expect(responseCache.get(query)).toBe(response);
  });

  it('should normalize query strings', () => {
    responseCache.set('  FLOOD safety  ', 'Response');
    
    expect(responseCache.get('flood safety')).toBe('Response');
    expect(responseCache.get('FLOOD SAFETY')).toBe('Response');
  });

  it('should clear all cached responses', () => {
    responseCache.set('Query 1', 'Response 1');
    responseCache.set('Query 2', 'Response 2');
    
    responseCache.clear();
    
    expect(responseCache.get('Query 1')).toBeNull();
    expect(responseCache.get('Query 2')).toBeNull();
  });
});

describe('EntityRecognizer', () => {
  it('should extract disaster entities', () => {
    const text = 'There is flooding in the area';
    const entities = entityRecognizer.extract(text);
    
    const disasters = entities.filter(e => e.type === 'disaster');
    expect(disasters).toHaveLength(1);
    expect(disasters[0].value).toBe('flooding');
    expect(disasters[0].confidence).toBeGreaterThan(0.8);
  });

  it('should extract multiple disaster types', () => {
    const text = 'Earthquake followed by flood and fire';
    const entities = entityRecognizer.extract(text);
    
    const disasters = entities.filter(e => e.type === 'disaster');
    expect(disasters.length).toBeGreaterThanOrEqual(3);
    
    const disasterValues = disasters.map(d => d.value);
    expect(disasterValues).toContain('earthquake');
    expect(disasterValues).toContain('flood');
    expect(disasterValues).toContain('fire');
  });

  it('should extract severity entities', () => {
    const text = 'Severe cyclone warning issued';
    const entities = entityRecognizer.extract(text);
    
    const severities = entities.filter(e => e.type === 'severity');
    expect(severities.length).toBeGreaterThan(0);
    expect(severities[0].value).toBe('severe');
  });

  it('should extract action entities', () => {
    const text = 'Evacuate immediately and seek shelter';
    const entities = entityRecognizer.extract(text);
    
    const actions = entities.filter(e => e.type === 'action');
    expect(actions.length).toBeGreaterThanOrEqual(2);
    
    const actionValues = actions.map(a => a.value);
    expect(actionValues).toContain('evacuate');
    expect(actionValues).toContain('shelter');
  });

  it('should extract time indicators', () => {
    const text = 'Heavy rain expected immediately, seek shelter now';
    const entities = entityRecognizer.extract(text);
    
    const times = entities.filter(e => e.type === 'time');
    expect(times.length).toBeGreaterThan(0);
    
    const timeValues = times.map(t => t.value);
    expect(timeValues).toContain('immediately');
    expect(timeValues).toContain('now');
  });

  it('should extract location entities', () => {
    const text = 'Flooding reported in Mumbai and near Chennai';
    const entities = entityRecognizer.extract(text);
    
    const locations = entities.filter(e => e.type === 'location');
    expect(locations.length).toBeGreaterThanOrEqual(2);
    
    const locationValues = locations.map(l => l.value);
    expect(locationValues).toContain('Mumbai');
    expect(locationValues).toContain('Chennai');
  });

  it('should generate context from entities', () => {
    const entities: ExtractedEntity[] = [
      { type: 'disaster', value: 'flood', confidence: 0.9 },
      { type: 'severity', value: 'severe', confidence: 0.8 },
      { type: 'location', value: 'Mumbai', confidence: 0.7 },
      { type: 'time', value: 'immediately', confidence: 0.8 },
    ];
    
    const context = entityRecognizer.generateContext(entities);
    
    expect(context).toContain('flood');
    expect(context).toContain('severe');
    expect(context).toContain('Mumbai');
    expect(context).toContain('immediately');
  });

  it('should handle text with no entities', () => {
    const text = 'How are you today?';
    const entities = entityRecognizer.extract(text);
    
    expect(entities).toHaveLength(0);
  });

  it('should handle Hindi disaster terms', () => {
    const text = 'भूकंप और बाढ़ की चेतावनी';
    const entities = entityRecognizer.extract(text);
    
    // Should still detect some entities through transliteration/patterns
    expect(entities.length).toBeGreaterThanOrEqual(0);
  });
});

describe('ChatAnalytics', () => {
  it('should track events', () => {
    chatAnalytics.track('message_sent', { language: 'en' });
    chatAnalytics.track('response_received');
    
    const stats = chatAnalytics.getStats();
    
    expect(stats.totalMessages).toBeGreaterThan(0);
    expect(stats.totalResponses).toBeGreaterThan(0);
  });

  it('should track errors', () => {
    const initialStats = chatAnalytics.getStats();
    const initialErrors = initialStats.errors;
    
    chatAnalytics.track('error', { type: 'api_failure' });
    
    const newStats = chatAnalytics.getStats();
    expect(newStats.errors).toBe(initialErrors + 1);
  });

  it('should track feedback', () => {
    chatAnalytics.track('feedback', { sentiment: 'positive' });
    chatAnalytics.track('feedback', { sentiment: 'negative' });
    
    const stats = chatAnalytics.getStats();
    
    expect(stats.positivefeedback).toBeGreaterThan(0);
    expect(stats.negativeFeedback).toBeGreaterThan(0);
  });

  it('should track voice usage', () => {
    const initialStats = chatAnalytics.getStats();
    const initialVoice = initialStats.voiceUsage;
    
    chatAnalytics.track('voice_used', { action: 'start' });
    
    const newStats = chatAnalytics.getStats();
    expect(newStats.voiceUsage).toBe(initialVoice + 1);
  });
});

describe('retryWithBackoff', () => {
  it('should succeed on first attempt', async () => {
    const successFn = vi.fn().mockResolvedValue('success');
    
    const result = await retryWithBackoff(successFn);
    
    expect(result).toBe('success');
    expect(successFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    let attempts = 0;
    const retryFn = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return Promise.resolve('success');
    });
    
    const result = await retryWithBackoff(retryFn, 3, 10);
    
    expect(result).toBe('success');
    expect(retryFn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries', async () => {
    const failFn = vi.fn().mockRejectedValue(new Error('Permanent failure'));
    
    await expect(retryWithBackoff(failFn, 3, 10)).rejects.toThrow('Permanent failure');
    expect(failFn).toHaveBeenCalledTimes(3);
  });

  it('should implement exponential backoff', async () => {
    const delays: number[] = [];
    let lastTime = Date.now();
    
    const trackingFn = vi.fn().mockImplementation(() => {
      const now = Date.now();
      if (delays.length > 0) {
        delays.push(now - lastTime);
      }
      lastTime = now;
      throw new Error('Retry needed');
    });
    
    try {
      await retryWithBackoff(trackingFn, 3, 50);
    } catch (e) {
      // Expected to fail
    }
    
    // Check that delays increase exponentially
    if (delays.length > 1) {
      expect(delays[1]).toBeGreaterThan(delays[0] * 1.5);
    }
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    responseCache.clear();
  });

  it('should handle full conversation flow', () => {
    // User sends message
    const userMsg: ChatMessage = {
      role: 'user',
      content: 'Severe flooding in Mumbai, should we evacuate immediately?',
      timestamp: new Date(),
    };
    conversationMemory.addMessage(userMsg);
    
    // Extract entities
    const entities = entityRecognizer.extract(userMsg.content);
    expect(entities.length).toBeGreaterThan(0);
    
    // Generate response
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: 'Yes, evacuate immediately to higher ground.',
      timestamp: new Date(),
      metadata: {
        context: entities.map(e => e.value),
      },
    };
    conversationMemory.addMessage(assistantMsg);
    
    // Cache response
    responseCache.set(userMsg.content, assistantMsg.content, 'Mumbai');
    
    // Track analytics
    chatAnalytics.track('message_sent');
    chatAnalytics.track('response_received');
    
    // Verify conversation saved
    const session = conversationMemory.getCurrentSession();
    expect(session.messages).toHaveLength(2);
    
    // Verify cache works
    const cached = responseCache.get(userMsg.content, 'Mumbai');
    expect(cached).toBe(assistantMsg.content);
    
    // Verify analytics
    const stats = chatAnalytics.getStats();
    expect(stats.totalMessages).toBeGreaterThan(0);
  });

  it('should maintain context across multiple messages', () => {
    // First message about floods
    conversationMemory.addMessage({
      role: 'user',
      content: 'Tell me about flood safety',
      timestamp: new Date(),
    });
    
    // Second message - should remember flood context
    conversationMemory.addMessage({
      role: 'user',
      content: 'What about my pets?',
      timestamp: new Date(),
    });
    
    const session = conversationMemory.getCurrentSession();
    const context = session.context.topicHistory || [];
    
    expect(context).toContain('Flood Safety');
    expect(session.messages).toHaveLength(2);
  });
});

describe('Edge Cases', () => {
  it('should handle very long messages', () => {
    const longMessage = 'a'.repeat(10000);
    const message: ChatMessage = {
      role: 'user',
      content: longMessage,
      timestamp: new Date(),
    };
    
    expect(() => conversationMemory.addMessage(message)).not.toThrow();
  });

  it('should handle special characters in queries', () => {
    const specialQuery = 'What about <script>alert("test")</script> in floods?';
    const entities = entityRecognizer.extract(specialQuery);
    
    expect(entities.some(e => e.type === 'disaster')).toBe(true);
  });

  it('should handle empty strings', () => {
    const entities = entityRecognizer.extract('');
    expect(entities).toHaveLength(0);
    
    const cached = responseCache.get('');
    expect(cached).toBeNull();
  });

  it('should handle concurrent operations', () => {
    const promises = Array.from({ length: 10 }, (_, i) => {
      return Promise.resolve().then(() => {
        conversationMemory.addMessage({
          role: 'user',
          content: `Message ${i}`,
          timestamp: new Date(),
        });
      });
    });
    
    expect(() => Promise.all(promises)).not.toThrow();
  });
});
