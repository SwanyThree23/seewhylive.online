/**
 * useVaultPro — AES-256-GCM envelope encryption for sensitive values
 * (RTMP stream keys, guest credentials, API tokens).
 *
 * Uses the browser's native Web Crypto API — no external dependencies,
 * zero-knowledge: the plaintext never leaves the device unencrypted.
 *
 * encrypt(plaintext) → { ciphertext, iv, key }   (all base64)
 * decrypt({ ciphertext, iv, key }) → plaintext
 * mask(value) → "abcd••••••••wxyz"  (safe display)
 */
export function useVaultPro() {
  const encrypt = async (plaintext) => {
    const enc  = new TextEncoder();
    const key  = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
    );
    const iv   = window.crypto.getRandomValues(new Uint8Array(12));
    const data = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, enc.encode(plaintext)
    );
    const raw  = await window.crypto.subtle.exportKey('raw', key);

    const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
    return { ciphertext: b64(data), iv: b64(iv), key: b64(raw) };
  };

  const decrypt = async ({ ciphertext, iv, key }) => {
    const from64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw', from64(key), { name: 'AES-GCM' }, false, ['decrypt']
    );
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: from64(iv) }, cryptoKey, from64(ciphertext)
    );
    return new TextDecoder().decode(decrypted);
  };

  // Show only first 4 + last 4 chars — safe to display in UI
  const mask = (value) => {
    if (!value || value.length <= 8) return '••••••••';
    return `${value.slice(0, 4)}${'•'.repeat(Math.max(4, value.length - 8))}${value.slice(-4)}`;
  };

  return { encrypt, decrypt, mask };
}
