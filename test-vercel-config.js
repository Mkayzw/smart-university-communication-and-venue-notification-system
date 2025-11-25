#!/usr/bin/env node

/**
 * Test script to verify Vercel configuration
 * This script checks if all the necessary files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Vercel Configuration...\n');

// Check if vercel.json exists
const vercelConfigPath = path.join(__dirname, 'vercel.json');
if (fs.existsSync(vercelConfigPath)) {
  console.log('✅ vercel.json found');
  
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    console.log(`✅ vercel.json has ${vercelConfig.routes.length} routes configured`);
    
    // Check if all expected routes are present
    const expectedRoutes = [
      '/api/auth',
      '/api/courses',
      '/api/schedules',
      '/api/venues',
      '/api/announcements',
      '/api/users'
    ];
    
    expectedRoutes.forEach(route => {
      const routeExists = vercelConfig.routes.some(r => r.src.startsWith(route));
      if (routeExists) {
        console.log(`✅ Route ${route} configured`);
      } else {
        console.log(`❌ Route ${route} missing`);
      }
    });
  } catch (error) {
    console.log('❌ Error parsing vercel.json:', error.message);
  }
} else {
  console.log('❌ vercel.json not found');
}

// Check if service files exist and export properly
const services = [
  'auth-service',
  'course-service',
  'schedule-service',
  'venue-service',
  'announcement-service',
  'user-service',
  'notification-service'
];

services.forEach(service => {
  const servicePath = path.join(__dirname, 'BACKEND/src/services', service, 'server.js');
  if (fs.existsSync(servicePath)) {
    console.log(`✅ ${service}/server.js found`);
    
    // Check if file has Vercel compatibility
    try {
      const content = fs.readFileSync(servicePath, 'utf8');
      const hasVercelExport = content.includes('module.exports = app');
      const hasConditionalListen = content.includes('process.env.NODE_ENV !== \'production\'');
      
      if (hasVercelExport) {
        console.log(`✅ ${service} exports app for Vercel`);
      } else {
        console.log(`❌ ${service} missing module.exports = app`);
      }
      
      if (hasConditionalListen) {
        console.log(`✅ ${service} has conditional server listening`);
      } else {
        console.log(`❌ ${service} missing conditional server listening`);
      }
    } catch (error) {
      console.log(`❌ Error reading ${service}/server.js:`, error.message);
    }
  } else {
    console.log(`❌ ${service}/server.js not found`);
  }
});

// Check if deployment guide exists
const guidePath = path.join(__dirname, 'VERCEL_DEPLOYMENT_GUIDE.md');
if (fs.existsSync(guidePath)) {
  console.log('✅ VERCEL_DEPLOYMENT_GUIDE.md found');
} else {
  console.log('❌ VERCEL_DEPLOYMENT_GUIDE.md not found');
}

// Check if root package.json exists
const rootPackagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(rootPackagePath)) {
  console.log('✅ Root package.json found');
} else {
  console.log('❌ Root package.json not found');
}

console.log('\n🎉 Vercel configuration test completed!');
console.log('\n📋 Next Steps:');
console.log('1. Set up environment variables in Vercel dashboard');
console.log('2. Deploy with: vercel --prod');
console.log('3. Deploy notification service separately on Render');
console.log('4. Update frontend Socket.IO URL for notifications');