import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Registers the device for native push notifications (APNs / FCM).
 * On web this hook is a no-op.
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!user || registeredRef.current) return;
    if (!Capacitor.isNativePlatform()) return;

    const platform = Capacitor.getPlatform() as 'ios' | 'android';

    async function register() {
      try {
        // Check / request permission
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('[Push] Permission not granted');
          return;
        }

        // Register with APNs / FCM
        await PushNotifications.register();

        // Listen for the token
        PushNotifications.addListener('registration', async (tokenData) => {
          console.log('[Push] Device token:', tokenData.value);
          await saveToken(tokenData.value, platform);
          registeredRef.current = true;
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error('[Push] Registration error:', err);
        });

        // Handle received notifications while app is in foreground
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[Push] Received in foreground:', notification);
        });

        // Handle notification tap (app opened from notification)
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('[Push] Action performed:', action);
          // TODO: navigate to the relevant conversation
        });
      } catch (err) {
        console.error('[Push] Setup error:', err);
      }
    }

    async function saveToken(token: string, plat: 'ios' | 'android') {
      try {
        const { error } = await supabase
          .from('device_tokens')
          .upsert(
            {
              user_id: user!.id,
              token,
              platform: plat,
            },
            { onConflict: 'user_id,token' }
          );

        if (error) {
          console.error('[Push] Failed to save device token:', error);
        } else {
          console.log('[Push] Device token saved');
        }
      } catch (err) {
        console.error('[Push] Save token error:', err);
      }
    }

    register();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [user]);
}
