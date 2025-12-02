# GCash Clone Dashboard

Standalone administrative dashboard for monitoring GCash Clone user registrations, OTP codes, and MPIN setup progress with real database authentication.

## 🔐 Features

- **Real-time Registration Monitoring** - Track phone registrations, OTP verification, and MPIN setup
- **Search & Filter** - Find specific registrations by phone number, OTP, or MPIN
- **Statistics Dashboard** - View registration counts and daily metrics
- **Database Authentication** - Real MongoDB admin accounts with JWT tokens
- **Password Management** - Built-in password change functionality
- **Responsive Design** - Mobile-friendly interface for admin access anywhere

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:5174
```

### Production Build
```bash
# Build for production
npm run build

# Preview build locally
npm run preview
```

## 🔧 Configuration

### Environment Variables
- `VITE_API_URL` - Backend API endpoint (default: https://gcash-clone-v0-1.onrender.com)

### Admin Authentication
- **Real Database Authentication** with JWT tokens
- Admin accounts stored in MongoDB with encrypted passwords
- Default admin account created automatically on first backend setup
- Session tokens persist in localStorage for convenience

## 📊 Dashboard Features

### Statistics Overview
- Total registrations count
- OTP verification progress
- MPIN setup completion
- Daily registration metrics

### Registration Table
- Phone numbers (Philippine format)
- Real OTP codes for testing
- MPIN values (hashed in backend)
- Registration status workflow
- IP address tracking
- Creation timestamps

### Search Capabilities
- Filter by phone number
- Search OTP codes
- Find MPIN values
- Real-time filtering

## 🔒 Security Features

- Admin key authentication
- No sensitive data exposure in frontend
- Secure API communication
- Session timeout handling
- Input sanitization

## 📱 Mobile Responsive

Optimized for desktop, tablet, and mobile admin access with:
- Responsive grid layouts
- Touch-friendly buttons
- Collapsible navigation
- Optimized table scrolling

## 🚀 Vercel Deployment

This admin dashboard is designed for easy Vercel deployment:

1. **Push to GitHub**
2. **Import to Vercel**
3. **Configure environment variables**
4. **Deploy instantly**

No additional configuration needed - Vite optimizations included.

## 🔧 Technical Stack

- **Vue 3** - Reactive framework with Composition API
- **Vite** - Fast build tool and dev server  
- **Vanilla CSS** - No UI framework dependencies
- **Fetch API** - Simple HTTP requests
- **LocalStorage** - Session persistence

## 📈 API Integration

Connects to GCash Clone backend API endpoints:
- `POST /api/admin/login` - Admin authentication with JWT
- `GET /api/admin/profile` - Get admin profile information  
- `POST /api/admin/change-password` - Update admin password
- `GET /api/admin/registrations` - Fetch registration data (Protected)
- `DELETE /api/admin/registrations/:id` - Remove registrations (Protected)
- `GET /api/admin/stats` - Dashboard statistics (Protected)

## 🔐 Admin Access

**Default Credentials:**
- Username: `admin`
- Password: `admin123456`
- Email: `admin@gcashclone.local`

**Production Setup:**
1. **Create Admin Account**: Run `node src/utils/createAdmin.js` in backend
2. **Change Password**: Use dashboard "Change Password" feature immediately
3. **Secure Deployment**: Deploy admin dashboard on secure domain
4. **Access Control**: Consider IP whitelisting and VPN access

## 📝 Development Notes

- Built with separation of concerns
- Independent from main user frontend  
- Minimal dependencies for security
- Easy customization and branding
- Production-ready optimization

---

**🛡️ Security Notice:** This dashboard contains sensitive user data. Deploy on secure infrastructure with proper access controls.
