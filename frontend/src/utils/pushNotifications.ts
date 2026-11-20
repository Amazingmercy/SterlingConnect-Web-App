import { api } from '../services/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function requestPushPermissionAndSubscribe(): Promise<{
  success: boolean;
  message?: string;
}> {
  if (!isPushNotificationSupported()) {
    return {
      success: false,
      message: 'Push notifications are not supported on this browser/device.',
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        message: 'Notification permission was denied.',
      };
    }

    const reg = await navigator.serviceWorker.ready;

    // Fetch VAPID public key from backend
    const keyRes = await api.get('/push-notifications/public-key');
    const vapidPublicKey = keyRes.data?.publicKey;

    if (!vapidPublicKey) {
      return {
        success: false,
        message: 'Server push key is unavailable.',
      };
    }

    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

    // Subscribe natively via browser PushManager
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });

    // Send subscription to backend
    await api.post('/push-notifications/subscribe', {
      subscription: subscription.toJSON(),
    });

    return {
      success: true,
      message: 'Push notifications enabled successfully!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to enable push notifications.',
    };
  }
}
