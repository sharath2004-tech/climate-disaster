#!/usr/bin/env node

/**
 * Test Script for Enhanced AI Chatbot
 * Run: node test-chatbot.js
 */

const API_BASE = process.env.VITE_API_URL || 'http://localhost:3001/api';

// Test colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testWeatherAPI() {
  log('\n📍 Testing Weather API...', 'blue');
  
  try {
    // Mumbai coordinates
    const lat = 19.0760;
    const lon = 72.8777;
    
    log(`  Fetching disaster predictions for Mumbai (${lat}, ${lon})...`);
    
    const response = await fetch(
      `${API_BASE}/weather/disaster-prediction?lat=${lat}&lon=${lon}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      log('  ✅ Weather API working!', 'green');
      log(`  📊 Overall Risk: ${data.overall_risk}`, 'yellow');
      log(`  🌡️  Temperature: ${data.current_conditions?.temperature}°C`);
      log(`  💨 Wind Speed: ${data.current_conditions?.wind_speed} km/h`);
      log(`  💧 Humidity: ${data.current_conditions?.humidity}%`);
      
      const totalRisks = data.predictions?.reduce((sum, p) => sum + p.risks.length, 0) || 0;
      log(`  ⚠️  Detected ${totalRisks} potential risks in next 7 days`);
      
      if (data.predictions && data.predictions.length > 0) {
        const firstRisk = data.predictions.find(p => p.risks.length > 0);
        if (firstRisk && firstRisk.risks.length > 0) {
          log(`  🔴 First Risk: ${firstRisk.risks[0].type} (${firstRisk.risks[0].severity})`, 'red');
        }
      }
      
      return true;
    } else {
      throw new Error('API returned success: false');
    }
  } catch (error) {
    log(`  ❌ Weather API failed: ${error.message}`, 'red');
    return false;
  }
}

async function testAIChatAPI() {
  log('\n🤖 Testing AI Chat API...', 'blue');
  
  try {
    log('  Sending test message to AI...');
    
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What are the basic flood safety tips?',
        location: 'Mumbai, Maharashtra',
        language: 'en',
        weatherContext: {
          overall_risk: 'medium',
          current_conditions: {
            temperature: 28,
            humidity: 75,
            wind_speed: 15,
          },
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.response) {
      log('  ✅ AI Chat API working!', 'green');
      log('  📝 AI Response Preview:', 'yellow');
      const preview = data.response.substring(0, 150) + '...';
      log(`     ${preview.replace(/\n/g, '\n     ')}`);
      return true;
    } else {
      throw new Error('No response from AI');
    }
  } catch (error) {
    log(`  ❌ AI Chat API failed: ${error.message}`, 'red');
    log('  💡 Make sure you have at least one LLM API key configured:', 'yellow');
    log('     - VITE_OPENROUTER_API_KEY (recommended)');
    log('     - VITE_COHERE_API_KEY');
    log('     - VITE_GROQ_API_KEY');
    return false;
  }
}

async function testHealthCheck() {
  log('\n🏥 Testing Server Health...', 'blue');
  
  try {
    const response = await fetch(`http://localhost:3001/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK') {
      log('  ✅ Server is healthy!', 'green');
      log(`  ⏱️  Uptime: ${Math.floor(data.uptime)} seconds`);
      return true;
    } else {
      throw new Error('Server unhealthy');
    }
  } catch (error) {
    log(`  ❌ Server health check failed: ${error.message}`, 'red');
    log('  💡 Make sure the backend server is running:', 'yellow');
    log('     cd server && npm start');
    return false;
  }
}

async function runTests() {
  log('═══════════════════════════════════════════════', 'blue');
  log('  🧪 ENHANCED AI CHATBOT - TEST SUITE', 'blue');
  log('═══════════════════════════════════════════════', 'blue');
  
  const results = {
    health: await testHealthCheck(),
    weather: await testWeatherAPI(),
    ai: await testAIChatAPI(),
  };
  
  log('\n═══════════════════════════════════════════════', 'blue');
  log('  📊 TEST RESULTS', 'blue');
  log('═══════════════════════════════════════════════', 'blue');
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r).length;
  
  log(`\n  Server Health:    ${results.health ? '✅ PASS' : '❌ FAIL'}`, results.health ? 'green' : 'red');
  log(`  Weather API:      ${results.weather ? '✅ PASS' : '❌ FAIL'}`, results.weather ? 'green' : 'red');
  log(`  AI Chat API:      ${results.ai ? '✅ PASS' : '❌ FAIL'}`, results.ai ? 'green' : 'red');
  
  log(`\n  Total: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n  🎉 ALL TESTS PASSED! Chatbot is ready to use.', 'green');
    log('\n  Next steps:', 'blue');
    log('  1. Open http://localhost:5173 in your browser');
    log('  2. Navigate to the AI Assistant page');
    log('  3. Allow location permission when prompted');
    log('  4. Wait for weather data to load');
    log('  5. Start asking questions!');
    log('\n  Try asking:', 'yellow');
    log('  - "Is there any disaster risk this week?"');
    log('  - "What should I do during a flood?"');
    log('  - "Emergency kit essentials"');
  } else {
    log('\n  ⚠️  Some tests failed. Check the errors above.', 'yellow');
    
    if (!results.health) {
      log('\n  🔧 Fix: Start the backend server', 'red');
      log('     cd server && npm start');
    }
    
    if (!results.ai) {
      log('\n  🔧 Fix: Add API key to .env file', 'red');
      log('     VITE_OPENROUTER_API_KEY=your_key_here');
      log('     Get free key at: https://openrouter.ai/keys');
    }
  }
  
  log('\n═══════════════════════════════════════════════\n', 'blue');
  
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
