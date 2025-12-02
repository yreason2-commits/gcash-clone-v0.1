/**
 * Tidio API Key Validator
 * Validates and tests Tidio integration
 */

export class TidioValidator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://code.tidio.co/';
  }

  /**
   * Validate API key format
   */
  validateKeyFormat() {
    const result = {
      valid: false,
      issues: []
    };

    // Check if key exists
    if (!this.apiKey) {
      result.issues.push('API key is missing');
      return result;
    }

    // Check key length (Tidio keys are typically 32 characters)
    if (this.apiKey.length !== 32) {
      result.issues.push(`Key length is ${this.apiKey.length}, expected 32 characters`);
    }

    // Check key format (should be alphanumeric)
    const keyPattern = /^[a-z0-9]+$/;
    if (!keyPattern.test(this.apiKey)) {
      result.issues.push('Key contains invalid characters (should be lowercase alphanumeric)');
    }

    // Check for common mistakes
    if (this.apiKey.includes('your-public-key-here')) {
      result.issues.push('Key is still placeholder text');
    }

    result.valid = result.issues.length === 0;
    return result;
  }

  /**
   * Test if Tidio script URL is accessible
   */
  async testScriptUrl() {
    const url = `${this.baseUrl}${this.apiKey}.js`;
    
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors' // Avoid CORS issues
      });
      
      return {
        accessible: true,
        url: url,
        status: 'Script URL appears accessible'
      };
    } catch (error) {
      return {
        accessible: false,
        url: url,
        status: `Script URL failed: ${error.message}`,
        suggestion: 'Check if API key is correct and active'
      };
    }
  }

  /**
   * Comprehensive validation
   */
  async validate() {
    console.log('🔍 Validating Tidio API Key...');
    
    const results = {
      keyFormat: this.validateKeyFormat(),
      scriptTest: await this.testScriptUrl(),
      recommendations: []
    };

    // Generate recommendations
    if (!results.keyFormat.valid) {
      results.recommendations.push('Fix API key format issues');
    }

    if (!results.scriptTest.accessible) {
      results.recommendations.push('Verify API key in Tidio dashboard');
      results.recommendations.push('Check domain whitelist settings');
      results.recommendations.push('Ensure Tidio account is active');
    }

    // Log results
    console.log('📊 Validation Results:');
    console.log('API Key Format:', results.keyFormat.valid ? '✅ Valid' : '❌ Invalid');
    
    if (!results.keyFormat.valid) {
      results.keyFormat.issues.forEach(issue => {
        console.log(`  ⚠️ ${issue}`);
      });
    }

    console.log('Script Accessibility:', results.scriptTest.accessible ? '✅ OK' : '❌ Failed');
    console.log('Script URL:', results.scriptTest.url);

    if (results.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      results.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }

    return results;
  }

  /**
   * Quick diagnostic for current setup
   */
  static async diagnoseCurrentSetup() {
    console.log('🔍 Diagnosing Tidio Setup...');

    // Check if script elements exist
    const scripts = document.querySelectorAll('script[src*="tidio.co"]');
    console.log(`Found ${scripts.length} Tidio script(s)`);

    scripts.forEach((script, index) => {
      console.log(`Script ${index + 1}: ${script.src}`);
    });

    // Check for Tidio API
    setTimeout(() => {
      if (window.tidioChatApi) {
        console.log('✅ Tidio API is available');
        console.log('Tidio status:', window.tidioChatApi);
      } else {
        console.log('❌ Tidio API not available');
        console.log('Possible causes:');
        console.log('1. Script failed to load (check Network tab)');
        console.log('2. Domain not whitelisted');
        console.log('3. API key incorrect');
        console.log('4. Tidio account issues');
      }
    }, 3000);

    return {
      scriptsFound: scripts.length,
      apiAvailable: !!window.tidioChatApi
    };
  }
}

// Auto-run diagnostics in development
if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      TidioValidator.diagnoseCurrentSetup();
      
      // Validate the key from our config
      const apiKey = 'mynfi4srkl0x0zpewt9xjc3y0xfji4jk';
      const validator = new TidioValidator(apiKey);
      validator.validate();
    }, 2000);
  });
}

export default TidioValidator;
