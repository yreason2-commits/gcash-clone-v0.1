const axios = require('axios');
const crypto = require('crypto');

class SMSService {
  constructor() {
    this.msg91ApiKey = process.env.MSG91_API_KEY;
    this.msg91SenderID = process.env.MSG91_SENDER_ID || 'GCASH';
    this.msg91BaseURL = 'https://api.msg91.com/api/v5';
  }

  // Generate 6-digit OTP
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Send OTP using MSG91
  async sendOTP(phoneNumber, otp) {
    try {
      if (!this.msg91ApiKey) {
        throw new Error('MSG91 API key not configured');
      }

      // Format phone number for Philippines (+63XXXXXXXXXX to 63XXXXXXXXXX)
      const formattedPhone = phoneNumber.replace(/^\+/, '');

      const payload = {
        template_id: process.env.MSG91_TEMPLATE_ID,
        short_url: '0',
        realTimeResponse: '1',
        recipients: [
          {
            mobiles: formattedPhone,
            OTP: otp
          }
        ]
      };

      console.log('📱 Sending SMS OTP:', { phone: formattedPhone, otp: otp });

      const response = await axios.post(
        `${this.msg91BaseURL}/flow/`,
        payload,
        {
          headers: {
            'authkey': this.msg91ApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ SMS Response:', response.data);

      return {
        success: true,
        messageId: response.data.request_id,
        response: response.data
      };

    } catch (error) {
      console.error('❌ SMS Error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Alternative simple SMS method
  async sendSimpleSMS(phoneNumber, message) {
    try {
      if (!this.msg91ApiKey) {
        throw new Error('MSG91 API key not configured');
      }

      const formattedPhone = phoneNumber.replace(/^\+/, '');

      const params = new URLSearchParams({
        authkey: this.msg91ApiKey,
        mobiles: formattedPhone,
        message: message,
        sender: this.msg91SenderID,
        route: '4',
        country: '63' // Philippines country code
      });

      const response = await axios.get(
        `${this.msg91BaseURL}/sendSMS?${params.toString()}`
      );

      return {
        success: true,
        messageId: response.data.request_id,
        response: response.data
      };

    } catch (error) {
      console.error('❌ Simple SMS Error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Verify OTP delivery status
  async checkDeliveryStatus(messageId) {
    try {
      const response = await axios.get(
        `${this.msg91BaseURL}/report/${messageId}`,
        {
          headers: {
            'authkey': this.msg91ApiKey
          }
        }
      );

      return {
        success: true,
        status: response.data
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new SMSService();
