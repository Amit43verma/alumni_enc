// This file contains all the functions for key generation, encryption, and decryption.
// We use the browser's native Web Crypto API for performance and security.

// Asymmetric key algorithm for establishing a shared secret
const ASYMMETRIC_ALGORITHM = {
  name: 'ECDH',
  namedCurve: 'P-256',
};

// Symmetric key algorithm for encrypting messages
const SYMMETRIC_ALGORITHM = {
  name: 'AES-GCM',
  length: 256,
};

// 1. Generate a new key pair (private and public) for a user
export const generateKeyPair = async () => {
  return await window.crypto.subtle.generateKey(ASYMMETRIC_ALGORITHM, true, ['deriveKey']);
};

// 2. Export a key to a storable format (JSON Web Key)
export const exportKey = async (key) => {
  return await window.crypto.subtle.exportKey('jwk', key);
};

// 3. Import a public key from JWK format
export const importPublicKey = async (jwk) => {
  return await window.crypto.subtle.importKey('jwk', jwk, ASYMMETRIC_ALGORITHM, true, []);
};

// 4. Derive a shared secret key for a chat session using your private key and their public key
export const deriveSharedKey = async (privateKey, publicKey) => {
  return await window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    SYMMETRIC_ALGORITHM,
    true,
    ['encrypt', 'decrypt']
  );
};

// 5. Encrypt a message using the shared key
export const encryptMessage = async (message, sharedKey) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector
  const encodedMessage = new TextEncoder().encode(JSON.stringify(message));

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    encodedMessage
  );

  // Combine IV and encrypted data for easy transport
  const ivAndEncrypted = new Uint8Array(iv.length + encrypted.byteLength);
  ivAndEncrypted.set(iv);
  ivAndEncrypted.set(new Uint8Array(encrypted), iv.length);

  // Return as a Base64 string for sending via JSON/Socket.IO
  return btoa(String.fromCharCode.apply(null, ivAndEncrypted));
};

// 6. Decrypt a message using the shared key
export const decryptMessage = async (encryptedData, sharedKey) => {
  const data = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));

  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    encrypted
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
};

// NEW: Function to save all shared keys to sessionStorage
export const saveSharedKeysToSession = async (sharedKeys) => {
  const exportableKeys = {};
  for (const roomId in sharedKeys) {
    exportableKeys[roomId] = await exportKey(sharedKeys[roomId]);
  }
  sessionStorage.setItem('sharedKeys', JSON.stringify(exportableKeys));
};

// NEW: Function to load and import shared keys from sessionStorage
export const loadSharedKeysFromSession = async () => {
  const storedKeys = sessionStorage.getItem('sharedKeys');
  if (!storedKeys) return {};

  const importedKeys = {};
  const parsedKeys = JSON.parse(storedKeys);
  for (const roomId in parsedKeys) {
    importedKeys[roomId] = await window.crypto.subtle.importKey(
      'jwk',
      parsedKeys[roomId],
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }
  return importedKeys;
};

// We will use a simple IndexedDB wrapper like 'idb-keyval' for key storage
// You can install it with: npm install idb-keyval
import { get, set } from 'idb-keyval';

export const keyStore = {
  get: (key) => get(key),
  set: (key, value) => set(key, value),
};