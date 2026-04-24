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

        // 前台收到通知：来电类型直接派发事件，让 CallProvider 弹出来电界面
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[Push] Received in foreground:', notification);
          handlePushPayload(notification.data);
        });

        // 用户点击通知（App 从后台/锁屏被唤醒）
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('[Push] Action performed:', action);
          handlePushPayload(action.notification?.data);
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

/**
 * 解析推送 payload 并分发到对应处理逻辑。
 * APNs 的 data 字段在传输中会被序列化为字符串，这里做一次健壮的解析。
 */
function handlePushPayload(rawData: any): void {
  if (!rawData || typeof window === 'undefined') return;

  const data: Record<string, any> = {};
  for (const [k, v] of Object.entries(rawData)) {
    if (typeof v === 'string') {
      // 尝试把字符串化的 JSON 字段还原（如 callType / callerId 等）
      try {
        data[k] = JSON.parse(v);
      } catch {
        data[k] = v;
      }
    } else {
      data[k] = v;
    }
  }

  const type = data.type;

  if (type === 'incoming_call' && data.callSessionId) {
    // 通过全局事件让 CallProvider 弹出来电界面（避免循环依赖 CallContext）
    window.dispatchEvent(
      new CustomEvent('archime:push:incoming_call', {
        detail: {
          callSessionId: String(data.callSessionId),
          conversationId: String(data.conversationId || ''),
          callType: (data.callType === 'video' ? 'video' : 'audio') as 'video' | 'audio',
          callerId: String(data.callerId || ''),
        },
      }),
    );
    return;
  }

  if (type === 'message' && data.conversationId) {
    window.dispatchEvent(
      new CustomEvent('archime:push:message', {
        detail: { conversationId: String(data.conversationId) },
      }),
    );
  }
}
