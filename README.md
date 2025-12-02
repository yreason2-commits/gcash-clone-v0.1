# GCash Clone Scaffold

This repository bootstraps a full-stack application with a Vue 3 frontend, an Express backend, and a MySQL database.

## Prerequisites

- Node.js 18 or later
- npm 8 or later
- MySQL 8 (or compatible)

## Frontend (Vue + Vite)

```bash
cd frontend
npm install
npm run dev
```

The development server runs on `http://localhost:5173` by default.

## Backend (Express)

1. Copy environment variables:

   ```bash
   cd backend
   cp env.example .env
   ```

2. Update the `.env` file with your MySQL credentials.

3. Install dependencies and start the server:

   ```bash
   npm install
   npm run dev
   ```

The backend listens on `http://localhost:5000` by default. It exposes a `GET /api/health` endpoint used by the frontend health check.

## Database

1. Start your MySQL server.
2. Run the schema script to create the database and tables:

   ```sql
   SOURCE backend/database/schema.sql;
   ```

   You can execute the script via the MySQL CLI or any SQL client capable of running files.

The schema currently defines the following tables:

- `users` – stores application users with a balance field
- `transactions` – records credit/debit operations linked to users

## 🤖 Tidio Chatbot Integration

This GCash Clone includes a **complete Tidio AI chatbot integration** for customer support:

### Features
- **AI-powered customer support** with GCash-specific responses
- **Personalized support** based on user authentication
- **Automated responses** for balance, transfers, login help, and troubleshooting
- **Fallback custom chat interface** when Tidio is unavailable
- **Webhook integration** for backend processing

### Quick Setup
1. Get your Tidio API key from [tidio.com](https://www.tidio.com)
2. Replace `your-public-key-here` in `frontend/index.html`
3. Configure webhooks in Tidio dashboard
4. See `docs/TIDIO_CHATBOT_SETUP.md` for complete setup guide

### Components
- `ChatBot.vue` - Main chatbot component
- `tidioService.js` - Tidio integration service
- `/api/tidio/*` - Backend webhook endpoints
- `ChatBotDemo.vue` - Testing interface

## Next Steps

- Flesh out API routes (authentication, wallet operations, etc.).
- Implement database migrations or an ORM if preferred.  
- Replace the demo health check in the frontend with real data views.
- Add testing, linting, and CI workflows as needed.
- **Configure Tidio chatbot** with your API keys and customize responses.

