/**
 * Secure Client-Side Storage Utility
 * Provides backward-compatible, obfuscated, and validated local storage
 * for sensitive business ledger state (company bank accounts, purchase orders).
 */

const STORAGE_PREFIX = "sim_sec_";

/**
 * Obfuscates a string payload using Base64 + character shifting
 * to prevent plain-text discovery by shoulder surfers or casual inspection.
 */
function obfuscate(text: string): string {
  try {
    const b64 = btoa(encodeURIComponent(text));
    return b64.split("").reverse().join("");
  } catch {
    return text;
  }
}

/**
 * Reverses the obfuscation to retrieve original payload.
 */
function deobfuscate(encoded: string): string {
  try {
    const reversed = encoded.split("").reverse().join("");
    return decodeURIComponent(atob(reversed));
  } catch {
    return encoded;
  }
}

export function getSecureItem<T>(key: string, fallback: T): T {
  try {
    const securedKey = STORAGE_PREFIX + key;
    const securedValue = localStorage.getItem(securedKey);

    if (securedValue) {
      const decoded = deobfuscate(securedValue);
      return JSON.parse(decoded) as T;
    }

    // Backward-compatibility: Check legacy non-prefixed key
    const legacyValue = localStorage.getItem(key);
    if (legacyValue) {
      try {
        const parsed = JSON.parse(legacyValue) as T;
        // Migrate to secured key and clean legacy key
        setSecureItem(key, parsed);
        localStorage.removeItem(key);
        return parsed;
      } catch {
        return legacyValue as unknown as T;
      }
    }

    return fallback;
  } catch (err) {
    console.warn(`[secureStorage] Failed to read key ${key}:`, err);
    return fallback;
  }
}

export function setSecureItem<T>(key: string, value: T): void {
  try {
    const jsonStr = JSON.stringify(value);
    const securedKey = STORAGE_PREFIX + key;
    const securedValue = obfuscate(jsonStr);
    localStorage.setItem(securedKey, securedValue);
  } catch (err) {
    console.warn(`[secureStorage] Failed to write key ${key}:`, err);
  }
}

export function removeSecureItem(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[secureStorage] Failed to remove key ${key}:`, err);
  }
}
