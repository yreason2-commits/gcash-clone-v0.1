# GCash Clone Backend API

A production-ready backend API for a GCash clone application built with Node.js, Express, and MongoDB.

## Features

- ✅ **Authentication**: Phone number + MPIN based authentication with JWT
- ✅ **User Management**: Registration, login, profile management
- ✅ **Wallet Operations**: Balance inquiries, transaction history
- ✅ **Money Transfer**: Send money between users
- ✅ **Cash In**: Add money to wallet
- ✅ **Security**: Rate limiting, input validation, bcrypt password hashing
- ✅ **Database**: MongoDB with Mongoose ODM
- ✅ **Production Ready**: Error handling, logging, environment configuration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, express-rate-limit, express-validator
- **Dev Tools**: nodemon

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new phone number
- `POST /set-mpin` - Set MPIN after registration
- `POST /login` - Login with phone number and MPIN
- `GET /me` - Get current user profile (Protected)

### Wallet (`/api/wallet`)
- `GET /balance` - Get current balance (Protected)
- `GET /summary` - Get wallet summary with stats (Protected)
- `GET /verify/:phoneNumber` - Verify if phone number exists (Protected)

### Transactions (`/api/transactions`)
- `POST /send-money` - Send money to another user (Protected)
- `POST /cash-in` - Add money to wallet (Protected)
- `GET /history` - Get transaction history (Protected)
- `GET /:referenceNumber` - Get transaction details (Protected)

## Installation

### Prerequisites
- Node.js 18+ 
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Local Development

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/gcash-clone
   JWT_SECRET=your-super-secret-key
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:5000`

## Deployment to Render.com

### Prerequisites
- GitHub account
- Render.com account (free tier available)
- MongoDB Atlas account (free tier available)

### Steps

1. **Set up MongoDB Atlas**
   - Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Get your connection string
   - Whitelist Render.com IPs or use `0.0.0.0/0` for all IPs

2. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial backend setup"
   git push origin main
   ```

3. **Deploy on Render.com**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Use the `render.yaml` configuration or manually set:
     - **Build Command**: `cd backend && npm install`
     - **Start Command**: `cd backend && npm start`
     - **Environment**: Node

4. **Set Environment Variables**
   Add these in Render dashboard:
   ```
   NODE_ENV=production
   MONGODB_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-secure-random-secret
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=your-frontend-url
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

5. **Deploy**
   - Render will automatically build and deploy
   - Your API will be available at `https://your-app-name.onrender.com`

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 5000 | No |
| `NODE_ENV` | Environment | development | No |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d | No |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 | No |

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js        # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── validate.js        # Input validation
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Transaction.js     # Transaction schema
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── wallet.js          # Wallet routes
│   │   └── transactions.js    # Transaction routes
│   └── server.js              # Express app entry point
├── .env                       # Environment variables (git-ignored)
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies
└── README.md                 # This file
```

## Security Features

- **Password Hashing**: MPIN hashed with bcrypt (12 rounds)
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: All inputs validated with express-validator
- **CORS**: Configured for specific frontend origin
- **Environment Variables**: Sensitive data in .env files

## Testing API

Use tools like Postman, Thunder Client, or curl:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "09123456789"}'

# Set MPIN
curl -X POST http://localhost:5000/api/auth/set-mpin \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "09123456789", "mpin": "123456"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "09123456789", "mpin": "123456"}'

# Get balance (use token from login)
curl http://localhost:5000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Schema

### User Model
```javascript
{
  phoneNumber: String,     // 10 digits starting with 9
  mpin: String,           // 6-digit hashed
  balance: Number,        // Default: 0
  isVerified: Boolean,    // Default: false
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model
```javascript
{
  sender: ObjectId,
  recipient: ObjectId,
  type: String,           // 'send_money', 'cash_in', 'cash_out', 'bills_payment'
  amount: Number,
  fee: Number,
  totalAmount: Number,
  message: String,
  status: String,         // 'pending', 'completed', 'failed', 'cancelled'
  referenceNumber: String,
  senderBalanceBefore: Number,
  senderBalanceAfter: Number,
  recipientBalanceBefore: Number,
  recipientBalanceAfter: Number,
  metadata: Object,
  createdAt: Date
}
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check `MONGODB_URI` in `.env`
   - Ensure MongoDB is running (local) or accessible (Atlas)
   - Verify network access in MongoDB Atlas

2. **Port Already in Use**
   - Change `PORT` in `.env`
   - Or kill process using port 5000: `lsof -ti:5000 | xargs kill`

3. **JWT Token Invalid**
   - Ensure `JWT_SECRET` is set
   - Check token expiration
   - Verify Bearer token format in Authorization header

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
