import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationData {
  type: 'APPOINTMENT' | 'PRESCRIPTION' | 'EXAM' | 'TELEMEDICINE' | 'GAMIFICATION' | 'SYSTEM';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

class NotificationService {
  private expoPushToken: string | null = null;

  // Register for push notifications
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return null;
    }

    // Get the Expo push token
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with actual project ID
      });
      this.expoPushToken = token.data;

      // Save token locally
      await AsyncStorage.setItem('pushToken', token.data);

      // Register token with backend
      await this.registerTokenWithBackend(token.data);

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Register token with backend
  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await api.post('/notifications/register-device', {
        token,
        platform: Platform.OS,
        deviceName: Device.deviceName,
      });
    } catch (error) {
      console.error('Error registering push token with backend:', error);
    }
  }

  // Unregister device
  async unregisterDevice(): Promise<void> {
    const token = await AsyncStorage.getItem('pushToken');
    if (token) {
      try {
        await api.post('/notifications/unregister-device', { token });
        await AsyncStorage.removeItem('pushToken');
      } catch (error) {
        console.error('Error unregistering device:', error);
      }
    }
  }

  // Schedule a local notification
  async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: Record<string, unknown>
  ): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger,
    });
    return id;
  }

  // Schedule appointment reminder
  async scheduleAppointmentReminder(
    appointmentId: string,
    doctorName: string,
    scheduledAt: Date,
    minutesBefore: number = 30
  ): Promise<string | null> {
    const reminderTime = new Date(scheduledAt.getTime() - minutesBefore * 60 * 1000);

    if (reminderTime <= new Date()) {
      return null; // Don't schedule if time has passed
    }

    return this.scheduleLocalNotification(
      'Lembrete de Consulta',
      `Sua consulta com Dr(a). ${doctorName} começa em ${minutesBefore} minutos`,
      { date: reminderTime },
      { type: 'APPOINTMENT', appointmentId }
    );
  }

  // Cancel a scheduled notification
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return Notifications.getAllScheduledNotificationsAsync();
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  // Get badge count
  async getBadgeCount(): Promise<number> {
    return Notifications.getBadgeCountAsync();
  }

  // Add notification received listener
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Add notification response listener (when user taps notification)
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Handle notification response (navigation)
  handleNotificationResponse(
    response: Notifications.NotificationResponse,
    navigation: { navigate: (screen: string, params?: unknown) => void }
  ): void {
    const data = response.notification.request.content.data as PushNotificationData;

    switch (data?.type) {
      case 'APPOINTMENT':
        navigation.navigate('appointments');
        break;
      case 'TELEMEDICINE':
        navigation.navigate('telemedicine', { id: data.data?.appointmentId });
        break;
      case 'PRESCRIPTION':
        navigation.navigate('prescriptions');
        break;
      case 'EXAM':
        navigation.navigate('exams');
        break;
      case 'GAMIFICATION':
        navigation.navigate('profile');
        break;
      default:
        // Default navigation
        break;
    }
  }
}

export const notificationService = new NotificationService();

// Hook for using notifications in components
export function useNotifications() {
  return {
    register: () => notificationService.registerForPushNotifications(),
    unregister: () => notificationService.unregisterDevice(),
    scheduleAppointmentReminder: notificationService.scheduleAppointmentReminder.bind(notificationService),
    cancelNotification: notificationService.cancelNotification.bind(notificationService),
    cancelAllNotifications: notificationService.cancelAllNotifications.bind(notificationService),
    setBadgeCount: notificationService.setBadgeCount.bind(notificationService),
    getBadgeCount: notificationService.getBadgeCount.bind(notificationService),
    addReceivedListener: notificationService.addNotificationReceivedListener.bind(notificationService),
    addResponseListener: notificationService.addNotificationResponseListener.bind(notificationService),
  };
}
