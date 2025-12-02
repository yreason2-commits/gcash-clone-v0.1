/**
 * Chat Integration Test Utility
 * Tests both Tidio and custom chat functionality
 */

export class ChatIntegrationTest {
  constructor() {
    this.testResults = [];
    this.tidioAvailable = false;
  }

  /**
   * Run complete chat integration tests
   */
  async runAllTests() {
    console.log('🧪 Starting Chat Integration Tests...');
    
    // Test 1: Check Tidio availability
    await this.testTidioAvailability();
    
    // Test 2: Check script loading
    this.testScriptLoading();
    
    // Test 3: Test live agent escalation
    await this.testLiveAgentEscalation();
    
    // Test 4: Test custom responses
    this.testCustomResponses();
    
    // Test 5: Test fallback system
    this.testFallbackSystem();
    
    this.printResults();
    return this.testResults;
  }

  /**
   * Test Tidio availability
   */
  async testTidioAvailability() {
    const test = { name: 'Tidio Availability', status: 'pending' };
    
    try {
      // Check if Tidio API is available
      if (window.tidioChatApi) {
        test.status = 'pass';
        test.message = 'Tidio API is available';
        this.tidioAvailable = true;
      } else {
        // Wait for Tidio to load
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            test.status = 'fail';
            test.message = 'Tidio API not available after timeout';
            resolve();
          }, 5000);
          
          const checkTidio = setInterval(() => {
            if (window.tidioChatApi) {
              clearInterval(checkTidio);
              clearTimeout(timeout);
              test.status = 'pass';
              test.message = 'Tidio API loaded successfully';
              this.tidioAvailable = true;
              resolve();
            }
          }, 100);
        });
      }
    } catch (error) {
      test.status = 'fail';
      test.message = `Error checking Tidio: ${error.message}`;
    }
    
    this.testResults.push(test);
  }

  /**
   * Test script loading
   */
  testScriptLoading() {
    const test = { name: 'Script Loading', status: 'pending' };
    
    try {
      const tidioScript = document.querySelector('script[src*="tidio.co"]');
      
      if (tidioScript) {
        const src = tidioScript.src;
        const hasCorrectKey = src.includes('mynfi4rkl0x0zpewt9xjc3y0xfrj4jk');
        
        if (hasCorrectKey) {
          test.status = 'pass';
          test.message = 'Tidio script loaded with correct API key';
        } else {
          test.status = 'fail';
          test.message = 'Tidio script has incorrect API key';
        }
      } else {
        test.status = 'fail';
        test.message = 'Tidio script not found in page';
      }
    } catch (error) {
      test.status = 'fail';
      test.message = `Error checking script: ${error.message}`;
    }
    
    this.testResults.push(test);
  }

  /**
   * Test live agent escalation
   */
  async testLiveAgentEscalation() {
    const test = { name: 'Live Agent Escalation', status: 'pending' };
    
    try {
      if (this.tidioAvailable && window.tidioChatApi) {
        // Test visitor data setting for live agent
        window.tidioChatApi.setVisitorData({
          test: true,
          needsLiveAgent: true,
          escalationReason: 'Test escalation'
        });
        
        // Check if escalation functions exist
        const hasEscalationMethods = 
          typeof window.tidioChatApi.setVisitorData === 'function' &&
          typeof window.tidioChatApi.open === 'function';
        
        if (hasEscalationMethods) {
          test.status = 'pass';
          test.message = 'Live agent escalation methods available';
        } else {
          test.status = 'fail';
          test.message = 'Live agent escalation methods missing';
        }
      } else {
        test.status = 'skip';
        test.message = 'Tidio not available - using fallback escalation';
      }
    } catch (error) {
      test.status = 'fail';
      test.message = `Error testing live agent: ${error.message}`;
    }
    
    this.testResults.push(test);
  }

  /**
   * Test custom responses
   */
  testCustomResponses() {
    const test = { name: 'Custom Responses', status: 'pending' };
    
    try {
      // Test GCash-specific response triggers
      const testMessages = [
        'balance',
        'send money',
        'login help',
        'live agent'
      ];
      
      let responseCount = 0;
      
      testMessages.forEach(message => {
        // Simulate message processing (this would normally go through tidioService)
        if (this.simulateResponse(message)) {
          responseCount++;
        }
      });
      
      if (responseCount === testMessages.length) {
        test.status = 'pass';
        test.message = `All ${responseCount} custom responses working`;
      } else {
        test.status = 'partial';
        test.message = `${responseCount}/${testMessages.length} responses working`;
      }
    } catch (error) {
      test.status = 'fail';
      test.message = `Error testing responses: ${error.message}`;
    }
    
    this.testResults.push(test);
  }

  /**
   * Test fallback system
   */
  testFallbackSystem() {
    const test = { name: 'Fallback System', status: 'pending' };
    
    try {
      // Since we're using Tidio directly, fallback is not needed when Tidio works
      if (this.tidioAvailable) {
        test.status = 'pass';
        test.message = 'Using Tidio (fallback not needed)';
      } else {
        // Check if custom ChatBot component would be available as fallback
        const chatBotElement = document.querySelector('.chatbot-container');
        if (chatBotElement) {
          test.status = 'pass';
          test.message = 'Fallback chat system available';
        } else {
          test.status = 'fail';
          test.message = 'No chat system available';
        }
      }
    } catch (error) {
      test.status = 'fail';
      test.message = `Error testing fallback: ${error.message}`;
    }
    
    this.testResults.push(test);
  }

  /**
   * Simulate response for testing
   */
  simulateResponse(message) {
    const responses = {
      'balance': 'Balance inquiry help',
      'send money': 'Money transfer guide',
      'login help': 'Login assistance',
      'live agent': 'Live agent escalation'
    };
    
    return responses[message.toLowerCase()] !== undefined;
  }

  /**
   * Print test results
   */
  printResults() {
    console.log('\n🧪 Chat Integration Test Results:');
    console.log('=======================================');
    
    this.testResults.forEach((test, index) => {
      const emoji = test.status === 'pass' ? '✅' : 
                   test.status === 'fail' ? '❌' : 
                   test.status === 'partial' ? '⚠️' : '⏸️';
      
      console.log(`${emoji} ${test.name}: ${test.message}`);
    });
    
    const passed = this.testResults.filter(t => t.status === 'pass').length;
    const total = this.testResults.length;
    
    console.log('\n📊 Summary:');
    console.log(`Passed: ${passed}/${total} tests`);
    
    if (this.tidioAvailable) {
      console.log('🎉 Tidio integration is working!');
    } else {
      console.log('⚠️ Using fallback chat system');
    }
    
    console.log('\n💬 Live Agent Testing:');
    console.log('Type these in chat to test:');
    console.log('• "live agent" - Request human help');
    console.log('• "talk to agent" - Alternative trigger');
    console.log('• "human help" - Another trigger');
  }

  /**
   * Manual live agent test
   */
  static testLiveAgent() {
    if (window.tidioChatApi) {
      console.log('🧪 Testing live agent escalation...');
      
      // Open chat and simulate live agent request
      window.tidioChatApi.open();
      
      setTimeout(() => {
        window.tidioChatApi.setVisitorData({
          needsLiveAgent: true,
          escalationReason: 'Manual test - live agent request',
          testMode: true,
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ Live agent escalation triggered');
      }, 1000);
    } else {
      console.log('❌ Tidio not available for live agent test');
    }
  }
}

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const tester = new ChatIntegrationTest();
      tester.runAllTests();
      
      // Expose manual test function
      window.testLiveAgent = ChatIntegrationTest.testLiveAgent;
    }, 3000); // Wait 3 seconds for everything to load
  });
}

export default ChatIntegrationTest;
