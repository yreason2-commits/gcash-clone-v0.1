/**
 * OTP Service with SMS Integration  
 * Handles OTP generation and SMS sending via MSG91 (Primary) and Twilio (Fallback)
 */

const crypto = require('crypto');
const smsService = require('./smsService');

class OTPService {
  constructor() {
    // Initialize MSG91 (Primary SMS provider)
    this.msg91ApiKey = process.env.MSG91_API_KEY;
    
    // Initialize Twilio (Fallback SMS provider)
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '+12345678901';
    
    // Initialize Twilio client if credentials are available
    if (this.accountSid && this.authToken) {
      try {
        const twilio = require('twilio');
        this.twilioClient = twilio(this.accountSid, this.authToken);
        console.log('✅ Twilio SMS service initialized (backup)');
      } catch (error) {
        console.warn('⚠️ Twilio not available:', error.message);
        this.twilioClient = null;
      }
    } else {
      this.twilioClient = null;
    }

    // Check available SMS providers
    if (this.msg91ApiKey) {
      console.log('✅ MSG91 SMS service initialized (primary)');
      this.hasSMSService = true;
    } else if (this.twilioClient) {
      console.log('✅ Using Twilio as primary SMS service');
      this.hasSMSService = true;
    } else {
      console.log('📱 SMS Service: Using simulation mode (no SMS credentials)');
      this.hasSMSService = false;
    }
  }

  /**
   * Generate a 6-digit OTP code
   */
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Format phone number for SMS sending
   * Converts Philippine mobile number to international format
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Handle Philippine numbers
    if (digits.length === 10 && digits.startsWith('9')) {
      return `+63${digits}`; // Add Philippines country code
    }
    
    if (digits.length === 12 && digits.startsWith('63')) {
      return `+${digits}`; // Already has country code
    }
    
    if (digits.length === 13 && digits.startsWith('639')) {
      return `+${digits}`; // Already formatted
    }
    
    throw new Error('Invalid Philippine phone number format');
  }

  /**
   * Create SMS message content - IDENTICAL to real GCash format
   */
  createOTPMessage(otp) {
    return `${otp} is your GCash verification code. Valid for 10 mins. Don't share with anyone for your security. -GCash`;
  }

  /**
   * Send OTP via SMS using MSG91 (primary) or Twilio (fallback)
   */
  async sendOTP(phoneNumber, otp) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const message = this.createOTPMessage(otp);

      // Try MSG91 first (Philippines optimized)
      if (this.msg91ApiKey) {
        console.log('📱 Attempting to send SMS via MSG91...');
        
        try {
          const result = await smsService.sendOTP(formattedPhone, otp);
          
          if (result.success) {
            console.log(`✅ MSG91 SMS sent successfully to ${formattedPhone.substring(0, 7)}***`);
            
            return {
              success: true,
              messageId: result.messageId,
              phone: formattedPhone,
              method: 'msg91'
            };
          } else {
            console.warn('⚠️ MSG91 failed, trying Twilio fallback...');
          }
        } catch (msg91Error) {
          console.warn('⚠️ MSG91 error, trying Twilio fallback:', msg91Error.message);
        }
      }

      // Fallback to Twilio
      if (this.twilioClient) {
        console.log('📱 Sending SMS via Twilio (fallback)...');
        
        const result = await this.twilioClient.messages.create({
          body: message,
          from: this.fromNumber,
          to: formattedPhone
        });

        console.log(`✅ Twilio SMS sent successfully to ${formattedPhone.substring(0, 7)}***`);
        
        return {
          success: true,
          messageId: result.sid,
          phone: formattedPhone,
          method: 'twilio'
        };
      }

      // No SMS providers available - simulation mode
      console.log('📱 SMS SIMULATION MODE');
      console.log(`📞 To: ${formattedPhone}`);
      console.log(`💬 Message: ${message}`);
      console.log(`🔢 OTP: ${otp}`);
      console.log('✅ SMS would be sent in production mode');
      
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
        phone: formattedPhone,
        method: 'simulation'
      };

    } catch (error) {
      console.error('❌ Failed to send SMS:', error.message);
      throw new Error(`SMS sending failed: ${error.message}`);
    }
  }

  /**
   * Generate and send OTP
   */
  async generateAndSendOTP(phoneNumber) {
    const otp = this.generateOTP();
    const result = await this.sendOTP(phoneNumber, otp);
    
    return {
      otp,
      ...result
    };
  }

  /**
   * Validate OTP format
   */
  isValidOTP(otp) {
    return /^\d{6}$/.test(otp);
  }

  /**
   * Check if OTP has expired (10 minutes)
   */
  isOTPExpired(createdAt, minutes = 10) {
    const expiryTime = new Date(createdAt.getTime() + (minutes * 60 * 1000));
    return new Date() > expiryTime;
  }
}

module.exports = new OTPService();
