import { useState, useEffect } from 'react';
import { pushApi, publicApi } from '../api/endpoints';
import { showToast } from '../components/ui';

// Helper to convert base64 VAPID key to Uint8Array
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePushNotifications = () => {
  const [hasPushPermission, setHasPushPermission] = useState(Notification.permission === 'granted');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    setHasPushPermission(Notification.permission === 'granted');
  }, []);

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showToast.error('Push notifications are not supported by your browser.');
      return;
    }

    setIsSubscribing(true);
    try {
      // Ensure Service Worker is registered
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        showToast.success('You are already subscribed to notifications!');
        setIsSubscribing(false);
        setHasPushPermission(true);
        return;
      }

      // Get VAPID public key from backend
      const configRes = await publicApi.getConfig();
      const vapidPublicKey = configRes.data?.vapidPublicKey;
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not found');
      }

      // Subscribe to PushManager
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to backend
      await pushApi.subscribe(subscription.toJSON());
      setHasPushPermission(true);
      showToast.success('Successfully subscribed to notifications!');
    } catch (err: any) {
      console.error('Push subscription failed:', err);
      if (Notification.permission === 'denied') {
        showToast.error('Notification permission was denied. Please enable it in browser settings.');
      } else {
        showToast.error('Failed to subscribe to notifications.');
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  return {
    hasPushPermission,
    isSubscribing,
    subscribe,
  };
};
