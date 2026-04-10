/**
 * E2EE Crypto Module
 * Uses ECDH (P-256) + AES-256-GCM for message encryption.
 * Private keys are stored in IndexedDB, public keys are shared via the server.
 */

const DB_NAME = 'archimi_e2ee';
const STORE_NAME = 'keys';
const DB_VERSION = 1;

// ─── IndexedDB helpers ───

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── Key helpers ───

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// ─── Key Generation & Storage ───

export interface E2EEKeyPair {
  publicKey: string; // base64 raw public key
  privateKey: CryptoKey;
}

/**
 * Generate a new ECDH P-256 key pair.
 * Private key is stored in IndexedDB, public key returned as base64.
 */
export async function generateKeyPair(userId: string): Promise<string> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    false, // private key not extractable
    ['deriveKey']
  );

  // Export public key as raw bytes
  const pubRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const pubB64 = arrayBufferToBase64(pubRaw);

  // Store private key in IndexedDB
  await idbPut(`privateKey:${userId}`, keyPair.privateKey);
  // Also store public key locally for convenience
  await idbPut(`publicKey:${userId}`, pubB64);

  return pubB64;
}

/**
 * Get stored private key for a user
 */
export async function getPrivateKey(userId: string): Promise<CryptoKey | undefined> {
  return idbGet<CryptoKey>(`privateKey:${userId}`);
}

/**
 * Get stored public key for a user (local cache)
 */
export async function getLocalPublicKey(userId: string): Promise<string | undefined> {
  return idbGet<string>(`publicKey:${userId}`);
}

/**
 * Import a raw base64 public key into a CryptoKey
 */
async function importPublicKey(pubB64: string): Promise<CryptoKey> {
  const raw = base64ToArrayBuffer(pubB64);
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
}

/**
 * Derive a shared AES-GCM key from our private key and their public key
 */
async function deriveSharedKey(privateKey: CryptoKey, theirPublicKeyB64: string): Promise<CryptoKey> {
  const theirPub = await importPublicKey(theirPublicKeyB64);
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPub },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ─── Encrypt / Decrypt ───

export interface EncryptedPayload {
  iv: string;       // base64 IV
  ciphertext: string; // base64 ciphertext
  v: number;        // version
}

/**
 * Encrypt a plaintext message using ECDH shared secret.
 */
export async function encryptMessage(
  plaintext: string,
  myPrivateKey: CryptoKey,
  theirPublicKeyB64: string
): Promise<EncryptedPayload> {
  const sharedKey = await deriveSharedKey(myPrivateKey, theirPublicKeyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    encoded
  );

  return {
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertext),
    v: 1,
  };
}

/**
 * Decrypt an encrypted message using ECDH shared secret.
 */
export async function decryptMessage(
  payload: EncryptedPayload,
  myPrivateKey: CryptoKey,
  theirPublicKeyB64: string
): Promise<string> {
  const sharedKey = await deriveSharedKey(myPrivateKey, theirPublicKeyB64);
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
  const ciphertext = base64ToArrayBuffer(payload.ciphertext);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Check if a message content is an encrypted payload
 */
export function isEncryptedPayload(content: string | null): boolean {
  if (!content) return false;
  try {
    const parsed = JSON.parse(content);
    return parsed.v === 1 && !!parsed.iv && !!parsed.ciphertext;
  } catch {
    return false;
  }
}

/**
 * Parse encrypted payload from message content
 */
export function parseEncryptedPayload(content: string): EncryptedPayload {
  return JSON.parse(content) as EncryptedPayload;
}

/**
 * Delete all stored keys (used on logout)
 */
export async function clearAllKeys(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
