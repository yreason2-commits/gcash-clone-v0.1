# Tidio Chatbot Integration Guide for GCash Clone

## Overview

This guide covers the complete integration of Tidio's AI chatbot and customer support system into the GCash Clone application. The integration provides:

- **AI-powered customer support** with GCash-specific responses
- **Live chat functionality** with human agents
- **Personalized support** based on user authentication status
- **Automated responses** for common queries
- **Webhook integration** for custom backend processing

## 🚀 Quick Setup

### 1. Get Tidio Account and API Key

1. Sign up at [tidio.com](https://www.tidio.com)
2. Go to **Settings** → **Developer** → **Public API**
3. Copy your **Public API Key**
4. Replace `your-public-key-here` in `frontend/index.html`

```html
<!-- Replace this line in frontend/index.html -->
<script src="//code.tidio.co/YOUR_ACTUAL_PUBLIC_KEY.js" async></script>
```

### 2. Environment Configuration

Add these environment variables to your backend `.env` file:

```bash
# Tidio Configuration
TIDIO_API_KEY=your_private_api_key_here
TIDIO_PUBLIC_KEY=your_public_key_here
TIDIO_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Backend Webhook Configuration

In your Tidio dashboard:
1. Go to **Settings** → **Integration** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/tidio/webhook`
3. Enable these events:
   - `message`
   - `conversation_started`
   - `conversation_ended`

## 📁 File Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ChatBot.vue          # Custom chatbot UI component
│   │   └── services/
│   │       └── tidioService.js      # Tidio integration service
│   └── index.html                   # Tidio script integration
├── backend/
│   └── src/
│       └── routes/
│           └── tidio.js             # Webhook endpoints
└── docs/
    └── TIDIO_CHATBOT_SETUP.md      # This documentation
```

## 🔧 Features Implemented

### Frontend Features

#### 1. **Tidio Service** (`tidioService.js`)
- Initializes Tidio when script loads
- Sets user context for personalized support
- Handles GCash-specific commands
- Provides common response templates

#### 2. **ChatBot Component** (`ChatBot.vue`)
- Floating chat button
- Inline chat widget for admin pages
- Custom chat interface (fallback when Tidio unavailable)
- Quick action buttons for common tasks
- Mobile-responsive design

#### 3. **User Context Integration**
After user authentication, the chatbot receives:
```javascript
{
  phoneNumber: "+639123456789",
  isAuthenticated: true,
  userId: "user_639123456789",
  name: "GCash User",
  balance: 1500.00,
  lastTransaction: "Money sent to John Doe"
}
```

### Backend Features

#### 1. **Webhook Handler** (`/api/tidio/webhook`)
- Processes incoming chat messages
- Provides automated responses for GCash queries
- Integrates with user data for personalized responses

#### 2. **Analytics Endpoint** (`/api/tidio/analytics`)
- Tracks chatbot usage
- Monitors common issues
- Measures satisfaction rates

#### 3. **Configuration Endpoint** (`/api/tidio/config`)
- Updates chatbot settings
- Manages auto-responses
- Controls working hours

## 💬 Supported Queries

### Automatic Responses

| User Query | Bot Response | Quick Replies |
|------------|--------------|---------------|
| "balance", "money" | Balance inquiry instructions | "How to log in?", "Account locked" |
| "transfer", "send" | Money transfer guide | "Transaction limits", "MPIN issues" |
| "login", "sign in" | Login step-by-step guide | "No OTP received", "Forgot MPIN" |
| "problem", "issue", "error" | Troubleshooting assistance | "App not working", "Transaction failed" |

### GCash-Specific Commands

- **Balance Check**: Guides users to check their account balance
- **Money Transfer**: Step-by-step transfer instructions
- **Login Help**: Authentication troubleshooting
- **Transaction History**: How to view past transactions
- **Technical Support**: Common issue resolution

## 🎨 Customization

### 1. Styling the Chat Widget

The `ChatBot.vue` component uses GCash brand colors:
- Primary: `#007DBA` (GCash Blue)
- Secondary: `#0056CC` (Darker Blue)
- Success: `#4CAF50` (Green)
- Error: `#FF4444` (Red)

### 2. Adding New Responses

In `tidioService.js`, add to `commonResponses`:

```javascript
this.commonResponses = {
  // Existing responses...
  new_feature: "Information about your new feature here",
  custom_help: "Your custom help message"
};
```

### 3. Custom Quick Actions

In `ChatBot.vue`, modify the `quickActions` array:

```javascript
const quickActions = ref([
  { id: 'balance', label: 'Check Balance', action: 'getBalance' },
  { id: 'new_feature', label: 'New Feature', action: 'getNewFeature' }
]);
```

## 📱 Mobile Responsiveness

The chatbot is fully responsive:
- **Desktop**: 350px width floating widget
- **Mobile**: Full-screen chat interface
- **Tablet**: Optimized for touch interactions

## 🔒 Security Considerations

1. **Webhook Verification**: Validate incoming webhooks with secret
2. **User Data Protection**: Don't expose sensitive information in chat
3. **Rate Limiting**: Backend includes rate limiting for webhook endpoints
4. **CORS Configuration**: Properly configured for frontend domain

## 🧪 Testing

### 1. Test Tidio Integration
```bash
# Check if Tidio loads
console.log(window.tidioChatApi);

# Test user context setting
tidioService.setUserContext({
  phoneNumber: "+639123456789",
  isAuthenticated: true
});
```

### 2. Test Custom Chat (Fallback)
- Disable Tidio script temporarily
- Verify custom chat interface appears
- Test message sending and receiving

### 3. Test Webhook Endpoints
```bash
# Test webhook endpoint
curl -X POST http://localhost:5000/api/tidio/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "message", "message": "balance", "visitor_id": "test123"}'

# Test analytics
curl http://localhost:5000/api/tidio/analytics
```

## 🚨 Troubleshooting

### Common Issues

1. **Tidio Script Not Loading**
   - Check if public key is correct
   - Verify internet connection
   - Check browser console for errors

2. **Webhook Not Receiving Data**
   - Verify webhook URL is accessible
   - Check Tidio dashboard webhook configuration
   - Ensure server is running on correct port

3. **User Context Not Setting**
   - Verify user authentication flow
   - Check tidioService initialization
   - Review browser console logs

### Debug Mode

Enable debug logging in `tidioService.js`:

```javascript
// At the top of tidioService.js
const DEBUG = true;

// Add logging throughout the service
if (DEBUG) console.log('Tidio initialized:', this.tidioApi);
```

## 📈 Analytics & Monitoring

### Available Metrics
- Total conversations
- Resolved queries
- Common issues breakdown
- User satisfaction ratings

### Accessing Analytics
```javascript
// Frontend
fetch('/api/tidio/analytics')
  .then(response => response.json())
  .then(data => console.log(data));
```

## 🔄 Updates & Maintenance

### Regular Tasks
1. **Update Response Templates**: Review and improve bot responses
2. **Monitor Analytics**: Check common issues and satisfaction rates
3. **Test Functionality**: Ensure all features work after updates
4. **Update Documentation**: Keep setup guide current

### Version Updates
- Check Tidio changelog for new features
- Update API endpoints as needed
- Test backward compatibility

## 📞 Support

For issues with this integration:
1. Check this documentation
2. Review browser console logs
3. Test webhook endpoints
4. Contact development team

For Tidio-specific issues:
- Visit [Tidio Help Center](https://help.tidio.com)
- Contact Tidio support

---

## 🎯 Next Steps

1. **Complete Tidio Setup**: Get your API keys and configure webhooks
2. **Customize Responses**: Add GCash-specific responses for your use case
3. **Test Integration**: Verify all features work correctly
4. **Monitor Performance**: Use analytics to improve customer support
5. **Gather Feedback**: Collect user feedback to enhance the chatbot

**Ready to deploy?** Follow the deployment guide in `DEPLOYMENT.md` for production setup.
