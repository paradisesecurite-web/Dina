import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// La notification du matin est programmée sur le téléphone lui-même :
// aucun serveur, aucun compte. L'autorisation n'est demandée qu'au moment
// où l'utilisateur active la notification.

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

const CHANNEL = 'journal-du-matin';

export async function enableDaily(hour: number, minute: number): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Journal du matin', importance: Notifications.AndroidImportance.HIGH, sound: 'default' });
  }
  let perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: '☀️ Ton journal est prêt', body: 'Touche pour le lire ou l\'écouter.', data: { open: 'journal' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL },
  });
  return true;
}

export async function disableDaily() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
