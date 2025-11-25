# Vercel Deployment Guide

This guide explains how to deploy your Smart University Communication and Venue Notification System on Vercel as a monorepo with microservices architecture.

## Overview

Your microservices have been configured to work with Vercel's serverless functions. The API Gateway has been replaced with Vercel's routing system.

## Services Deployed on Vercel

The following services will be deployed as serverless functions:

- **Auth Service** (`/api/auth/*`)
- **Course Service** (`/api/courses/*`)
- **Schedule Service** (`/api/schedules/*`)
- **Venue Service** (`/api/venues/*`)
- **Announcement Service** (`/api/announcements/*`)
- **User Service** (`/api/users/*`)

## ⚠️ Important: Notification Service Limitation

The **Notification Service** uses Socket.IO for real-time notifications, which **does not work** on Vercel serverless functions because:

- Serverless functions shut down immediately after execution
- Socket.IO requires persistent connections
- WebSockets are not supported in Vercel's serverless environment

### Solution: Deploy Notification Service Separately

For the notification service, you have two options:

#### Option 1: Deploy on Render (Recommended)
1. Create a new repository containing only the notification service
2. Deploy it on Render as a web service
3. Update your frontend to connect to the Render deployment for Socket.IO

#### Option 2: Use Push Notifications Only
1. Disable Socket.IO in the frontend
2. Rely only on push notifications via Expo
3. Poll the notification endpoints periodically

## Deployment Steps

### 1. Prepare Your Environment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

### 2. Deploy to Vercel

1. Run the deployment command from your project root:
```bash
vercel --prod
```

2. Vercel will automatically detect the `vercel.json` configuration and deploy your services

### 3. Environment Variables

Set these environment variables in your Vercel dashboard:

```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=your_vercel_deployed_url
NODE_ENV=production
```

### 4. Database Setup

1. Deploy your PostgreSQL database (Vercel Postgres, Supabase, or Railway)
2. Run database migrations:
```bash
cd BACKEND
npx prisma migrate deploy
npx prisma generate
```

## 🔧 Fixed Issues

The following issues have been resolved in this configuration:

### 1. Prisma Client Generation
- Added `buildCommand` to vercel.json to generate Prisma client
- Updated root package.json with all required dependencies
- Prisma client is now properly generated during build

### 2. Routing Configuration
- Fixed vercel.json to properly route to microservices
- Added `.vercelignore` to exclude old monolithic server.js
- Configured proper build output directory

### 3. Dependencies
- Added all required dependencies to root package.json
- Ensured compatibility with Vercel's build process

## Frontend Configuration

Update your frontend API client to use the Vercel deployment URL:

```javascript
// In web/src/utils/apiClient.js
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-vercel-app.vercel.app/api'
  : 'http://localhost:3000/api';
```

## Notification Service Setup (Render Deployment)

If you choose to deploy the notification service on Render:

1. Create a new repository with just the notification service
2. Deploy to Render as a web service
3. Update your frontend Socket.IO connection:
```javascript
// In web/src/utils/socket.js
const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-notification-service.onrender.com'
  : 'http://localhost:3004';
```

## Testing Your Deployment

1. Test each service endpoint:
   - Auth: `https://your-app.vercel.app/api/auth/health`
   - Courses: `https://your-app.vercel.app/api/courses/health`
   - etc.

2. Test user registration and login
3. Test course creation and enrollment
4. Test notification creation (without real-time updates)

## Limitations

1. **No real-time notifications** on Vercel deployment
2. **Cold starts** may cause slight delays on first requests
3. **Database connections** need proper connection pooling
4. **File uploads** may need additional configuration

## Monitoring

Monitor your Vercel deployment through:
- Vercel Analytics
- Vercel Logs
- Database monitoring tools

## Rollback Plan

If you need to rollback:
```bash
vercel rollback [deployment-url]
```

## Support

For issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test individual services locally
4. Check database connectivity