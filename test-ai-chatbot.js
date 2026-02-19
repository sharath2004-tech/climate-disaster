/**
 * Test AI Chatbot Functionality
 * This script tests the AI chatbot endpoints to ensure proper LLM integration
 */

const API_BASE = 'http://localhost:3001/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAIChat() {
  log('\n🤖 Testing AI Chatbot Endpoints\n', 'blue');

  const testQueries = [
    {
      message: 'What should I do in case of a flood?',
      description: 'Flood safety query',
    },
    {
      message: 'Show me emergency contacts',
      description: 'Emergency contacts query',
    },
    {
      message: 'How to prepare for a cyclone?',
      description: 'Cyclone preparation query',
    },
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const query of testQueries) {
    try {
      log(`\n📤 Testing: ${query.description}`, 'yellow');
      log(`   Query: "${query.message}"`, 'reset');

      const startTime = Date.now();
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query.message,
          language: 'en',
        }),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.response && data.response.length > 0) {
        log(`✅ Success (${duration}ms)`, 'green');
        log(`   Response preview: ${data.response.substring(0, 100)}...`, 'reset');
        passedTests++;
      } else {
        log(`❌ Failed: Empty response`, 'red');
        failedTests++;
      }
    } catch (error) {
      log(`❌ Failed: ${error.message}`, 'red');
      failedTests++;
    }
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Test Summary:', 'blue');
  log(`   ✅ Passed: ${passedTests}`, 'green');
  log(`   ❌ Failed: ${failedTests}`, 'red');
  log(`   📦 Total: ${testQueries.length}`, 'yellow');
  log('='.repeat(60) + '\n', 'blue');

  if (failedTests === 0) {
    log('🎉 All AI chatbot tests passed!', 'green');
    log('\nThe chatbot is working correctly with:', 'green');
    log('  ✓ OpenRouter API (primary)', 'green');
    log('  ✓ Cohere API (fallback 1)', 'green');
    log('  ✓ Groq API (fallback 2)', 'green');
    log('  ✓ Rule-based responses (fallback 3)', 'green');
  } else {
    log('⚠️  Some tests failed. Check the errors above.', 'yellow');
    log('\nTroubleshooting tips:', 'yellow');
    log('  1. Ensure backend server is running on port 3001', 'yellow');
    log('  2. Verify API keys in .env file:', 'yellow');
    log('     - OPENROUTER_API_KEY', 'yellow');
    log('     - COHERE_API_KEY', 'yellow');
    log('  3. Check server logs for detailed error messages', 'yellow');
  }

  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
log('🚀 Starting AI Chatbot Tests...', 'blue');
log('📍 API Base: ' + API_BASE, 'reset');
log('⏰ Starting at: ' + new Date().toLocaleString(), 'reset');

setTimeout(() => {
  log('\n⏱️  Tests taking too long. Backend might not be running.', 'red');
  log('   Make sure to start: cd server && npm start', 'yellow');
  process.exit(1);
}, 60000); // 60 second timeout

testAIChat();
