/**
 * SECURITY UTILITIES
 * 
 * This file contains security-related utilities for client-side operations:
 * - Password hashing (demonstration only - real hashing happens server-side)
 * - PIN encryption for local storage
 * - Token management
 * - Data encryption/decryption for sensitive local storage
 * 
 * ⚠️ SECURITY WARNING:
 * - Client-side encryption is NOT a replacement for server-side security
 * - These utilities protect against casual inspection only
 * - Sensitive operations (auth, payments) MUST be validated server-side
 * - Never store sensitive data (passwords, PINs) in plain text
 * 
 * PRODUCTION RECOMMENDATIONS:
 * - Use HTTPS everywhere (enforce with HSTS headers)
 * - Implement Content Security Policy (CSP)
 * - Use HttpOnly, Secure cookies for tokens
 * - Implement rate limiting on backend
 * - Use proper bcrypt/argon2 hashing on backend
 * - Implement CSRF protection
 * - Regular security audits and penetration testing
 */

// ================================
// ENCRYPTION CONFIGURATION
// ================================

/**
 * Encryption key for local storage
 * 
 * ⚠️ WARNING: In production, this should be:
 * 1. Generated per-user session
 * 2. Derived from user credentials
 * 3. Never hardcoded in source
 * 
 * This is a demonstration only!
 */
const ENCRYPTION_KEY = 'kakeibo_local_encryption_key_v1';

// ================================
// PASSWORD UTILITIES
// ================================

/**
 * Hash password using SHA-256
 * 
 * ⚠️ DEMONSTRATION ONLY!
 * 
 * In production:
 * - Password hashing MUST happen on the server
 * - Use bcrypt, argon2, or scrypt (NOT SHA-256)
 * - Include a salt unique to each user
 * - Use a high work factor (cost)
 * 
 * This function is for educational purposes and frontend validation only.
 * 
 * @param password - Password to hash
 * @returns Hashed password (hex string)
 */
export async function hashPassword(password: string): Promise<string> {
  // Use Web Crypto API (available in all modern browsers)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Compare password with hash
 * 
 * ⚠️ DEMONSTRATION ONLY - Real comparison happens on server!
 * 
 * @param password - Plain text password
 * @param hash - Hashed password to compare against
 * @returns True if passwords match
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// ================================
// PIN ENCRYPTION
// ================================

/**
 * Encrypt PIN for local storage
 * 
 * Uses AES-GCM encryption (authenticated encryption)
 * 
 * ⚠️ NOTE: This protects against casual inspection only.
 * For production, store PINs on server with proper hashing.
 * 
 * @param pin - PIN to encrypt
 * @returns Encrypted PIN (base64 encoded)
 */
export async function encryptPIN(pin: string): Promise<string> {
  try {
    // Generate a key from our encryption key string
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(ENCRYPTION_KEY),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive an AES key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('kakeibo_salt_v1'), // In production, use random salt
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Generate random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the PIN
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(pin)
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('PIN encryption failed:', error);
    // Fallback to simple encoding (not secure!)
    return btoa(pin);
  }
}

/**
 * Decrypt PIN from local storage
 * 
 * @param encryptedPIN - Encrypted PIN (base64 encoded)
 * @returns Decrypted PIN
 */
export async function decryptPIN(encryptedPIN: string): Promise<string> {
  try {
    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedPIN)
        .split('')
        .map(c => c.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    // Generate key (same as encryption)
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(ENCRYPTION_KEY),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('kakeibo_salt_v1'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('PIN decryption failed:', error);
    // Fallback to simple decoding
    return atob(encryptedPIN);
  }
}

// ================================
// TOKEN MANAGEMENT
// ================================

/**
 * Check if JWT token is expired
 * 
 * @param token - JWT token to check
 * @returns True if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    // Decode payload (base64url)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    // Check expiry time (exp claim in seconds)
    if (!payload.exp) return true;

    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    return currentTime >= expiryTime;
  } catch (error) {
    console.error('Token validation failed:', error);
    return true; // Treat invalid tokens as expired
  }
}

/**
 * Get token expiry time
 * 
 * @param token - JWT token
 * @returns Expiry date or null if invalid
 */
export function getTokenExpiry(token: string): Date | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return null;

    return new Date(payload.exp * 1000);
  } catch (error) {
    return null;
  }
}

/**
 * Decode JWT token payload
 * 
 * ⚠️ NOTE: This does NOT verify the signature!
 * Signature verification must happen on the server.
 * 
 * @param token - JWT token
 * @returns Decoded payload or null
 */
export function decodeToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch (error) {
    console.error('Token decode failed:', error);
    return null;
  }
}

// ================================
// LOCAL STORAGE ENCRYPTION
// ================================

/**
 * Encrypt data before storing in localStorage
 * 
 * Use this for sensitive data that shouldn't be easily readable
 * in localStorage (e.g., temporary tokens, user preferences)
 * 
 * ⚠️ NOTE: This is basic obfuscation, not military-grade encryption!
 * 
 * @param data - Data to encrypt (will be JSON stringified)
 * @returns Encrypted string
 */
export function encryptData(data: any): string {
  try {
    const jsonString = JSON.stringify(data);
    const encoded = btoa(jsonString);
    
    // Simple XOR cipher (for obfuscation only)
    const key = ENCRYPTION_KEY;
    let encrypted = '';
    for (let i = 0; i < encoded.length; i++) {
      encrypted += String.fromCharCode(
        encoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    return btoa(encrypted);
  } catch (error) {
    console.error('Data encryption failed:', error);
    return btoa(JSON.stringify(data)); // Fallback to simple base64
  }
}

/**
 * Decrypt data from localStorage
 * 
 * @param encryptedData - Encrypted string
 * @returns Decrypted data
 */
export function decryptData(encryptedData: string): any {
  try {
    const encrypted = atob(encryptedData);
    
    // Reverse XOR cipher
    const key = ENCRYPTION_KEY;
    let decoded = '';
    for (let i = 0; i < encrypted.length; i++) {
      decoded += String.fromCharCode(
        encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    const jsonString = atob(decoded);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Data decryption failed:', error);
    try {
      // Fallback to simple base64 decode
      return JSON.parse(atob(encryptedData));
    } catch {
      return null;
    }
  }
}

// ================================
// SECURE STORAGE WRAPPER
// ================================

/**
 * Secure localStorage wrapper with automatic encryption
 * 
 * Usage:
 * secureStorage.set('user_data', { name: 'John', email: 'john@example.com' });
 * const data = secureStorage.get('user_data');
 */
export const secureStorage = {
  /**
   * Store data securely in localStorage
   * 
   * @param key - Storage key
   * @param value - Value to store (will be encrypted)
   */
  set(key: string, value: any): void {
    try {
      const encrypted = encryptData(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Secure storage set failed:', error);
    }
  },

  /**
   * Retrieve and decrypt data from localStorage
   * 
   * @param key - Storage key
   * @returns Decrypted value or null
   */
  get(key: string): any {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return decryptData(encrypted);
    } catch (error) {
      console.error('Secure storage get failed:', error);
      return null;
    }
  },

  /**
   * Remove data from localStorage
   * 
   * @param key - Storage key
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * Clear all data from localStorage
   */
  clear(): void {
    localStorage.clear();
  },
};

// ================================
// RATE LIMITING
// ================================

/**
 * Simple client-side rate limiter
 * Prevents excessive API calls from the client
 * 
 * ⚠️ NOTE: This is for UX only. Real rate limiting happens on server!
 * 
 * @param key - Unique identifier for the rate limit
 * @param limit - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 * @returns True if request is allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const storageKey = `rate_limit_${key}`;
  
  // Get existing requests
  const stored = localStorage.getItem(storageKey);
  let requests: number[] = stored ? JSON.parse(stored) : [];
  
  // Filter out old requests outside the time window
  requests = requests.filter(timestamp => now - timestamp < windowMs);
  
  // Check if limit exceeded
  if (requests.length >= limit) {
    return false;
  }
  
  // Add current request
  requests.push(now);
  localStorage.setItem(storageKey, JSON.stringify(requests));
  
  return true;
}

/**
 * Clear rate limit data for a key
 * 
 * @param key - Rate limit key to clear
 */
export function clearRateLimit(key: string): void {
  localStorage.removeItem(`rate_limit_${key}`);
}

// ================================
// XSS PROTECTION
// ================================

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes potentially dangerous tags and attributes
 * 
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(html: string): string {
  const div = document.createElement('div');
  div.textContent = html; // This automatically escapes HTML
  return div.innerHTML;
}

/**
 * Escape HTML special characters
 * 
 * @param str - String to escape
 * @returns Escaped string safe for HTML insertion
 */
export function escapeHTML(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return str.replace(/[&<>"'/]/g, (char) => map[char]);
}

// ================================
// SESSION MANAGEMENT
// ================================

/**
 * Check if session is active and valid
 * 
 * @returns True if user has valid session
 */
export function hasValidSession(): boolean {
  const token = localStorage.getItem('jwt_token');
  if (!token) return false;
  return !isTokenExpired(token);
}

/**
 * Clear all session data (logout)
 */
export function clearSession(): void {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
  
  // Clear rate limit data
  Object.keys(localStorage)
    .filter(key => key.startsWith('rate_limit_'))
    .forEach(key => localStorage.removeItem(key));
}

/**
 * Auto-logout after period of inactivity
 * 
 * @param timeoutMs - Inactivity timeout in milliseconds (default: 30 minutes)
 * @param onTimeout - Callback to execute on timeout
 * @returns Cleanup function to stop the auto-logout
 */
export function setupAutoLogout(
  timeoutMs: number = 30 * 60 * 1000, // 30 minutes
  onTimeout: () => void
): () => void {
  let timeoutId: NodeJS.Timeout;

  const resetTimer = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      console.log('Auto-logout: Session expired due to inactivity');
      clearSession();
      onTimeout();
    }, timeoutMs);
  };

  // Reset timer on user activity
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, resetTimer);
  });

  // Initial timer
  resetTimer();

  // Return cleanup function
  return () => {
    clearTimeout(timeoutId);
    events.forEach(event => {
      document.removeEventListener(event, resetTimer);
    });
  };
}
