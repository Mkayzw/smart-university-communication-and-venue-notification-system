# Mobile App Setup Complete! 📱

## What Was Created

A complete React Native mobile app for the Smart University system has been created in the `/mobile` directory.

### Features Implemented ✅
- 🔐 **Authentication** - Login, secure token storage, auto-login
- 🏠 **Dashboard** - Overview with metrics, latest announcements, schedule
- 📢 **Announcements** - Browse, search, view details, comment
- 📚 **Courses** - View enrolled courses and details
- 📅 **Schedule** - Personal timetable view
- 🔔 **Notifications** - View and mark as read
- 👤 **Profile** - User info and logout
- 🎨 **Bottom Tab Navigation** - Mobile-friendly navigation
- 🎨 **NativeWind Styling** - Consistent design matching web app

### Tech Stack
- React Native with Expo
- React Navigation (Stack + Bottom Tabs)
- NativeWind (Tailwind CSS for RN)
- Expo Secure Store
- Custom API hooks (no TanStack Query)

## Quick Start

### 1. Navigate to mobile directory
```bash
cd mobile
```

### 2. Configure API URL
Edit `src/config/index.js`:

**For testing on physical device:**
```javascript
export const config = {
  API_URL: 'http://YOUR_IP:5000/api',  // Replace with your computer's IP
}
```

Find your IP:
- Linux/Mac: `ifconfig` or `ip addr`
- Windows: `ipconfig`

**For Android emulator:**
```javascript
export const config = {
  API_URL: 'http://10.0.2.2:5000/api',
}
```

**For iOS simulator:**
```javascript
export const config = {
  API_URL: 'http://localhost:5000/api',
}
```

### 3. Make sure backend is running
```bash
cd ../BACKEND
pnpm dev
```

### 4. Start mobile app
```bash
cd ../mobile
pnpm start
```

### 5. Run on device
- **Physical device**: Install Expo Go app, scan QR code
- **Android**: Press `a` 
- **iOS**: Press `i` (macOS only)

### 6. Login
Use test credentials:
- **Admin**: `admin@university.edu` / `password123`
- **Student**: `student@university.edu` / `password123`
- **Lecturer**: `lecturer@university.edu` / `password123`

## Project Structure

```
mobile/
├── src/
│   ├── components/       # Reusable UI components
│   ├── config/          # App configuration
│   ├── contexts/        # React contexts (Auth)
│   ├── navigation/      # Navigation setup
│   ├── screens/         # App screens
│   └── utils/           # Utilities (API client, hooks)
├── App.js              # Root component
├── global.css          # Global styles
├── tailwind.config.js  # Tailwind config
├── metro.config.js     # Metro bundler config
└── babel.config.js     # Babel config
```

## Documentation

- **README.md** - Complete project documentation
- **QUICKSTART.md** - Detailed setup guide with troubleshooting
- **FEATURES.md** - Full feature list and technical details

## Key Files

### Configuration
- `src/config/index.js` - App configuration (API URL)
- `tailwind.config.js` - Styling configuration
- `babel.config.js` - NativeWind plugin setup
- `metro.config.js` - NativeWind metro setup

### Core Logic
- `src/contexts/AuthContext.js` - Authentication state management
- `src/utils/apiClient.js` - API fetch wrapper
- `src/utils/hooks.js` - Custom hooks (useApiQuery, useApiMutation)
- `src/navigation/AppNavigator.js` - Navigation setup

### Screens
All screens are in `src/screens/`:
- `LoginScreen.js`
- `DashboardScreen.js`
- `AnnouncementsScreen.js` & `AnnouncementDetailScreen.js`
- `CoursesScreen.js` & `CourseDetailScreen.js`
- `MyScheduleScreen.js`
- `NotificationsScreen.js`
- `ProfileScreen.js`

### Components
Reusable components in `src/components/`:
- **Cards**: AnnouncementCard, CourseCard, MetricCard, ScheduleCard
- **Common**: Loader, EmptyState, StatusPill

## Design Principles

### Simple & Clean
- No unnecessary dependencies
- Plain React hooks instead of TanStack Query
- Custom hooks for API calls
- Straightforward code structure

### Consistent Styling
- Matches web app design system
- Same color palette (teal primary, orange accent)
- Same component patterns (rounded corners, shadows)
- NativeWind for styling consistency

### Mobile-First UX
- Bottom tab navigation for main screens
- Native gestures and interactions
- Safe area handling
- Loading and empty states
- Smooth transitions

## Troubleshooting

### Can't connect to backend
1. Check backend is running on `http://0.0.0.0:5000`
2. Verify API URL in `src/config/index.js`
3. Make sure phone and computer on same WiFi
4. Test backend in browser: `http://YOUR_IP:5000`

### Metro bundler issues
```bash
pnpm start --clear
```

### Module resolution errors
```bash
rm -rf node_modules
pnpm install
```

### More help
See `QUICKSTART.md` for detailed troubleshooting steps.

## Next Steps

1. ✅ Start the mobile app
2. ✅ Login with test credentials
3. ✅ Test all features
4. 🎨 Customize as needed
5. 📱 Build for production when ready

Enjoy your mobile app! 🚀

