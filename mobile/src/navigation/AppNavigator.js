import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AnnouncementsScreen } from '../screens/AnnouncementsScreen';
import { AnnouncementDetailScreen } from '../screens/AnnouncementDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CoursesScreen } from '../screens/CoursesScreen';
import { CreateCourseScreen } from '../screens/CreateCourseScreen';
import { EditCourseScreen } from '../screens/EditCourseScreen';
import { VenuesScreen } from '../screens/VenuesScreen';
import { CreateVenueScreen } from '../screens/CreateVenueScreen';
import { EditVenueScreen } from '../screens/EditVenueScreen';
import { SchedulesScreen } from '../screens/SchedulesScreen';
import { CreateScheduleScreen } from '../screens/CreateScheduleScreen';
import { EditScheduleScreen } from '../screens/EditScheduleScreen';
import { CreateAnnouncementScreen } from '../screens/CreateAnnouncementScreen';
import { EditAnnouncementScreen } from '../screens/EditAnnouncementScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { View, ActivityIndicator, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// This is the main tab bar after logging in
const MainTabs = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#14b8a6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#e2e8f0' },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      {/* Conditional Tabs for Admin/Lecturer vs Student */}
      {user?.role === 'ADMIN' || user?.role === 'LECTURER' ? (
        <Tab.Screen
          name="Manage Courses"
          component={CoursesScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Feather name="book-open" size={size} color={color} />,
          }}
        />
      ) : (
        <Tab.Screen
          name="My Courses"
          component={CoursesScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Feather name="book" size={size} color={color} />,
          }}
        />
      )}
      <Tab.Screen
        name="Schedules"
        component={SchedulesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="calendar" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Venues"
        component={VenuesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="map-pin" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

// This stack contains the main tabs and any screen you can navigate to from them
const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen 
      name="AnnouncementDetail" 
      component={AnnouncementDetailScreen}
      options={{ headerShown: true, title: 'Announcement Details' }} 
    />
    <Stack.Screen 
      name="Announcements"
      component={AnnouncementsScreen}
      options={{ headerShown: true, title: 'All Announcements' }}
    />
    <Stack.Screen 
      name="CreateCourse"
      component={CreateCourseScreen}
      options={{ headerShown: true, title: 'Create Course' }}
    />
    <Stack.Screen 
      name="EditCourse"
      component={EditCourseScreen}
      options={{ headerShown: true, title: 'Edit Course' }}
    />
    <Stack.Screen 
      name="CreateVenue"
      component={CreateVenueScreen}
      options={{ headerShown: true, title: 'Create Venue' }}
    />
    <Stack.Screen 
      name="EditVenue"
      component={EditVenueScreen}
      options={{ headerShown: true, title: 'Edit Venue' }}
    />
    <Stack.Screen 
      name="CreateSchedule"
      component={CreateScheduleScreen}
      options={{ headerShown: true, title: 'Create Schedule' }}
    />
    <Stack.Screen 
      name="EditSchedule"
      component={EditScheduleScreen}
      options={{ headerShown: true, title: 'Edit Schedule' }}
    />
    <Stack.Screen 
      name="CreateAnnouncement"
      component={CreateAnnouncementScreen}
      options={{ headerShown: true, title: 'Create Announcement' }}
    />
    <Stack.Screen 
      name="EditAnnouncement"
      component={EditAnnouncementScreen}
      options={{ headerShown: true, title: 'Edit Announcement' }}
    />
    <Stack.Screen 
      name="Notifications"
      component={NotificationsScreen}
      options={{ headerShown: true, title: 'Notifications' }}
    />
  </Stack.Navigator>
);

// This is the root navigator that decides whether to show Login or the Main App
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
