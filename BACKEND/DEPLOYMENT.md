# Deployment Guide for Monolithic Backend

## Current Issue
The Render deployment is failing because it's using old code that tries to proxy requests to microservices that don't exist. The error logs show:
- `ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false`
- `Proxy error: ECONNREFUSED ::1:3001` (trying to connect to auth service)

## Solution Applied
We've converted the backend to a true monolithic architecture where all services run in a single process.

### Changes Made:
1. **Updated `src/server.js`**: Now uses the monolithic app directly without proxies
2. **Updated `src/app.js`**: Added trust proxy configuration for production
3. **Updated `package.json`**: Changed scripts to use server.js for monolithic deployment

## Deployment Steps

### 1. Push Changes to GitHub
```bash
# Ensure you're on the monolith branch
git checkout monolith

# Push the changes (you may need to set up GitHub authentication)
git push origin monolith --force
```

### 2. Trigger Redeploy on Render
After pushing, Render should automatically redeploy. If not:
1. Go to your Render dashboard
2. Navigate to your service
3. Click "Manual Deploy" > "Deploy latest commit"

### 3. Environment Variables on Render
Ensure these environment variables are set in your Render service:

```env
NODE_ENV=production
DATABASE_URL=<your-postgres-connection-string>
JWT_SECRET=<your-secret-key>
JWT_EXPIRES_IN=30d
FRONTEND_URL=<your-frontend-url>
```

### 4. Build & Start Commands on Render
Ensure your Render service has these settings:
- **Build Command**: `pnpm install --frozen-lockfile && npx prisma generate && npx prisma migrate deploy`
- **Start Command**: `node src/server.js`

## Testing the Deployment

Once deployed, test the API:

```bash
# Check if server is running
curl https://smart-comms-backend.onrender.com

# Test login endpoint
curl -X POST https://smart-comms-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Troubleshooting

### If you still see proxy errors:
1. Ensure the latest code is deployed (check commit hash in Render logs)
2. Clear Render build cache: Settings > Clear build cache & deploy

### If you see rate limit errors:
The trust proxy setting should be automatically applied in production. If not, check that `NODE_ENV=production` is set.

### Database Connection Issues:
1. Ensure DATABASE_URL is correctly set
2. Run migrations: `npx prisma migrate deploy`

## Local Testing

To test the monolithic setup locally:

```bash
# Install dependencies
npm install

# Set up .env file
cp .env.example .env
# Edit .env with your local database settings

# Run migrations
npx prisma migrate dev

# Start the server
npm start
```

The server should start on http://localhost:5000 with all endpoints working without microservices.

## API Endpoints

All endpoints are now served from the single monolithic application:

- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User management
- `/api/courses/*` - Course management
- `/api/announcements/*` - Announcements
- `/api/schedules/*` - Schedule management
- `/api/venues/*` - Venue management
- `/api/notifications/*` - Notifications
- `/api-docs` - Swagger documentation

## Architecture Change Summary

**Before (Microservices):**
- API Gateway (port 5000) proxying to:
  - Auth Service (port 3001)
  - User Service (port 3008)
  - Course Service (port 3003)
  - etc.

**After (Monolithic):**
- Single application (port 5000) handling all requests directly
- No proxying, no separate services
- All routes handled in `app.js`
- Simplified deployment and configuration
