import { useState, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';

// Check if we're running in Expo Go (push notifications are not supported in Expo Go SDK 53+)
const isExpoGo = Constants.appOwnership === 'expo';

// Only set notification handler if not in Expo Go
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export const usePushNotifications = () => {
  const { token } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Skip push notification setup in Expo Go (not supported in SDK 53+)
    if (isExpoGo) {
      console.log('Push notifications are not available in Expo Go (SDK 53+). Use a development build for push notification support.');
      return;
    }

    if (token) {
      registerForPushNotificationsAsync().then(pushToken => {
        if (pushToken) {
          setExpoPushToken(pushToken);
          // Send the token to your backend
          apiFetch('/users/me/push-token', {
            method: 'PUT',
            token: token,
            body: { pushToken },
          }).catch(error => {
            console.error("Failed to send push token to server:", error);
          });
        }
      });
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
      // Handle navigation on notification tap here
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [token]);

  return {
    expoPushToken,
    notification,
  };
};

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    // alert('Must use physical device for Push Notifications');
    console.log('Push notifications are not available on simulators. A physical device is required.');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}
