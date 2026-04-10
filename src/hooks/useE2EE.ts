import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  generateKeyPair,
  getPrivateKey,
  getLocalPublicKey,
  encryptMessage,
  decryptMessage,
  isEncryptedPayload,
  parseEncryptedPayload,
  type EncryptedPayload,
} from '@/lib/e2ee/crypto';

/**
 * Hook that manages E2EE key lifecycle for the current user.
 * On mount, ensures the user has a key pair and publishes the public key.
 */
export function useE2EESetup(userId?: string) {
  const [ready, setReady] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!userId || initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        // Check if we already have a private key locally
        let privateKey = await getPrivateKey(userId);
        let publicKeyB64 = await getLocalPublicKey(userId);

        if (!privateKey || !publicKeyB64) {
          // Generate new key pair
          publicKeyB64 = await generateKeyPair(userId);
        }

        // Upsert public key to server
        const { error } = await supabase
          .from('user_encryption_keys' as any)
          .upsert(
            {
              user_id: userId,
              public_key: publicKeyB64,
              device_id: 'default',
              key_type: 'ecdh-p256',
            } as any,
            { onConflict: 'user_id,device_id' }
          );

        if (error) {
          console.error('Failed to publish public key:', error);
        }

        setReady(true);
      } catch (err) {
        console.error('E2EE setup failed:', err);
      }
    })();
  }, [userId]);

  return { ready };
}

/**
 * Hook that provides encrypt/decrypt functions for a specific conversation.
 * Fetches the other user's public key for direct chats.
 */
export function useE2EEChat(userId?: string, otherUserId?: string | null) {
  const [otherPublicKey, setOtherPublicKey] = useState<string | null>(null);

  useEffect(() => {
    if (!otherUserId) return;

    (async () => {
      const { data } = await supabase
        .from('user_encryption_keys' as any)
        .select('public_key')
        .eq('user_id', otherUserId)
        .eq('device_id', 'default')
        .single();

      if (data) {
        setOtherPublicKey((data as any).public_key);
      }
    })();
  }, [otherUserId]);

  const encrypt = useCallback(
    async (plaintext: string): Promise<string | null> => {
      if (!userId || !otherPublicKey) return null;
      try {
        const privateKey = await getPrivateKey(userId);
        if (!privateKey) return null;
        const payload = await encryptMessage(plaintext, privateKey, otherPublicKey);
        return JSON.stringify(payload);
      } catch (err) {
        console.error('Encrypt failed:', err);
        return null;
      }
    },
    [userId, otherPublicKey]
  );

  const decrypt = useCallback(
    async (content: string, senderPublicKey?: string): Promise<string> => {
      if (!userId) return content;
      if (!isEncryptedPayload(content)) return content;

      try {
        const privateKey = await getPrivateKey(userId);
        if (!privateKey) return '[🔒 无法解密]';

        // For messages from others, use their public key
        // For our own messages, use the other user's public key (same shared secret)
        const pubKey = senderPublicKey || otherPublicKey;
        if (!pubKey) return '[🔒 密钥未找到]';

        const payload = parseEncryptedPayload(content);
        return await decryptMessage(payload, privateKey, pubKey);
      } catch (err) {
        console.error('Decrypt failed:', err);
        return '[🔒 解密失败]';
      }
    },
    [userId, otherPublicKey]
  );

  const canEncrypt = !!otherPublicKey;

  return { encrypt, decrypt, canEncrypt, otherPublicKey };
}
