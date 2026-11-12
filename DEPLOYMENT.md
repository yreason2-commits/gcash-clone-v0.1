# Deployment Guide for GCash Clone

This guide will help you deploy your Vue.js frontend and Express backend to the public.

## Current frontend demo

The phone/OTP flow is frontend-only: use a fictional phone number and test OTP
`123456`. It does not send SMS or send/save the phone number, OTP, or PIN. This
demo does not require the backend or a `VITE_API_URL`.

For Vercel, set the project root directory to `frontend`, use the Vite preset,
build command `npm run build`, and output directory `dist`. Redeploy the
frontend after pushing the changes. The existing backend can remain deployed,
but it is not used by this demo flow.

The backend/SMS steps below describe the legacy API integration, not the
frontend-only demo. Real authentication codes are intentionally not part of
this demo.

## Step 1: Build the Frontend

First, build your Vue.js application for production:

```bash
cd frontend
npm install
npm run build
```

This creates a `dist` folder with optimized production files.

## Step 2: Choose Deployment Platform

### Option A: Deploy Frontend to Vercel (Recommended - Free)

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy from frontend directory**:
   ```bash
   cd frontend
   vercel
   ```

3. **Follow the prompts** - Vercel will automatically detect Vue.js and configure it.

4. **Set environment variables** (if needed):
   - Go to your Vercel project dashboard
   - Settings → Environment Variables
   - Add `VITE_API_URL` with your backend URL

**Alternative: Deploy via GitHub**
- Push your code to GitHub
- Go to [vercel.com](https://vercel.com)
- Import your repository
- Vercel will auto-deploy on every push

### Option B: Deploy Frontend to Netlify (Free)

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and deploy**:
   ```bash
   cd frontend
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Or use Netlify Drop**:
   - Go to [app.netlify.com/drop](https://app.netlify.com/drop)
   - Drag and drop your `frontend/dist` folder

### Option C: Deploy Frontend to GitHub Pages (Free)

1. **Update vite.config.js**:
   ```js
   export default defineConfig({
     plugins: [vue()],
     base: '/your-repo-name/' // Add this line
   })
   ```

2. **Build**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy**:
   - Push the `dist` folder to `gh-pages` branch
   - Or use GitHub Actions for automatic deployment

## Step 3: Deploy Backend

### Option A: Deploy Backend to Railway (Recommended - Free tier available)

1. **Sign up** at [railway.app](https://railway.app)

2. **Create new project** → Deploy from GitHub

3. **Add MySQL database**:
   - Click "New" → Database → MySQL
   - Railway will provide connection details

4. **Set environment variables**:
   - `DB_HOST` - from Railway MySQL service
   - `DB_PORT` - usually 3306
   - `DB_USER` - from Railway
   - `DB_PASSWORD` - from Railway
   - `DB_NAME` - your database name
   - `PORT` - Railway will set this automatically

5. **Deploy**:
   - Railway will auto-detect Node.js
   - Set start command: `npm start`

### Option B: Deploy Backend to Render (Free tier available)

1. **Sign up** at [render.com](https://render.com)

2. **Create new Web Service**:
   - Connect your GitHub repository
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Add MySQL Database**:
   - Create new PostgreSQL or MySQL database
   - Copy connection details

4. **Set environment variables** in Render dashboard

### Option C: Deploy Backend to Heroku

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Login and create app**:
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Add MySQL addon**:
   ```bash
   heroku addons:create cleardb:ignite
   ```

4. **Set environment variables**:
   ```bash
   heroku config:set DB_HOST=...
   heroku config:set DB_USER=...
   # etc.
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

## Step 4: Update Frontend API URL

After deploying your backend, update the frontend to use the production API URL:

1. **Create `.env.production` in frontend folder**:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

2. **Rebuild frontend**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Redeploy frontend**

## Step 5: Database Setup

1. **Connect to your production database** (from Railway/Render/etc.)

2. **Run the schema**:
   ```sql
   SOURCE backend/database/schema.sql;
   ```
   Or import the SQL file through your database management tool.

## Quick Start Commands

### Build Frontend:
```bash
cd frontend
npm install
npm run build
```

### Test Production Build Locally:
```bash
cd frontend
npm run preview
```

### Deploy to Vercel (Easiest):
```bash
cd frontend
npm install -g vercel
vercel
```

## Recommended Setup

- **Frontend**: Vercel (automatic deployments, free SSL, CDN)
- **Backend**: Railway (easy MySQL setup, free tier)
- **Database**: Railway MySQL (included with Railway)

## Important Notes

1. **CORS**: Make sure your backend CORS settings allow your frontend domain
2. **Environment Variables**: Never commit `.env` files to Git
3. **Database**: Use production database credentials, not local ones
4. **HTTPS**: Most platforms provide free SSL certificates
5. **API URL**: Update `VITE_API_URL` in frontend after backend deployment

## Troubleshooting

- **CORS errors**: Update CORS settings in `backend/src/server.js`
- **Database connection**: Verify environment variables are set correctly
- **Build errors**: Check Node.js version (should be 18+)
- **404 errors**: Check base path in `vite.config.js` for GitHub Pages

