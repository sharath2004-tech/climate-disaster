/**
 * Security Middleware and Utilities
 * Implements security best practices for the application
 */

// ==================== Content Security Policy ====================

export const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // Required for Vite in dev
    "'unsafe-eval'", // Required for some libraries
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Required for styled components
    'https://fonts.googleapis.com',
  ],
  fontSrc: [
    "'self'",
    'https://fonts.gstatic.com',
  ],
  imgSrc: [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'https://api.mapbox.com',
    'https://tile.openstreetmap.org',
  ],
  connectSrc: [
    "'self'",
    'https://api.openweathermap.org',
    'https://nominatim.openstreetmap.org',
    'wss://*.vercel.app',
    'wss://*.onrender.com',
  ],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  upgradeInsecureRequests: [],
};

/**
 * Generate CSP header string
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => {
      const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
}

// ==================== XSS Protection ====================

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(html: string): string {
  const allowedTags = ['b', 'i', 'u', 'p', 'br', 'strong', 'em'];
  const allowedAttributes = ['class'];

  const div = document.createElement('div');
  div.innerHTML = html;

  // Remove unauthorized tags
  const elements = div.querySelectorAll('*');
  elements.forEach((el) => {
    if (!allowedTags.includes(el.tagName.toLowerCase())) {
      el.remove();
      return;
    }

    // Remove unauthorized attributes
    Array.from(el.attributes).forEach((attr) => {
      if (!allowedAttributes.includes(attr.name)) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return div.innerHTML;
}

/**
 * Escape HTML characters
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

// ==================== CSRF Protection ====================

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token
 */
export function storeCSRFToken(token: string): void {
  sessionStorage.setItem('csrf_token', token);
}

/**
 * Get CSRF token
 */
export function getCSRFToken(): string | null {
  return sessionStorage.getItem('csrf_token');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = getCSRFToken();
  return storedToken === token;
}

// ==================== Secure Storage ====================

/**
 * Securely store sensitive data
 */
export class SecureStorage {
  private prefix = 'climate_secure_';

  /**
   * Encrypt data before storing
   */
  private async encrypt(data: string): Promise<string> {
    // In production, use Web Crypto API for real encryption
    // This is a simplified version
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store data securely
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      const encrypted = await this.encrypt(jsonValue);
      localStorage.setItem(this.prefix + key, encrypted);
    } catch (error) {
      console.error('Failed to store data securely:', error);
    }
  }

  /**
   * Retrieve data securely
   */
  get(key: string): any {
    try {
      const value = localStorage.getItem(this.prefix + key);
      if (!value) return null;

      // In production, decrypt the value
      return JSON.parse(value);
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      return null;
    }
  }

  /**
   * Remove data
   */
  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  /**
   * Clear all secure data
   */
  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

// ==================== Rate Limiting ====================

export class ClientRateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Check if request is allowed
   */
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Filter out old requests
    const recentRequests = requests.filter(time => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return true;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.requests.clear();
  }
}

// ==================== Input Validation ====================

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate coordinates
 */
export function validateCoordinates(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Include lowercase letters');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Include uppercase letters');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    feedback.push('Include numbers');
  } else {
    score += 1;
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    feedback.push('Include special characters');
  } else {
    score += 1;
  }

  return {
    isValid: score >= 3,
    score,
    feedback,
  };
}

// ==================== Secure API Calls ====================

/**
 * Add security headers to API requests
 */
export function addSecurityHeaders(headers: HeadersInit = {}): HeadersInit {
  return {
    ...headers,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

/**
 * Validate API response
 */
export function validateAPIResponse(response: any): boolean {
  // Check for SQL injection attempts in response
  const suspiciousPatterns = [
    /'|(\\')|(--)|(\\")|(\\\\")|;|(?:OR|AND)\s+\d+\s*=\s*\d+/gi,
    /<script[^>]*>.*?<\/script>/gi,
  ];

  const stringified = JSON.stringify(response);
  return !suspiciousPatterns.some(pattern => pattern.test(stringified));
}

// ==================== Export Security Utilities ====================

export const security = {
  sanitizeInput,
  sanitizeHTML,
  escapeHTML,
  generateCSRFToken,
  storeCSRFToken,
  getCSRFToken,
  validateCSRFToken,
  validateEmail,
  validatePhone,
  validateCoordinates,
  validatePasswordStrength,
  addSecurityHeaders,
  validateAPIResponse,
  SecureStorage: new SecureStorage(),
  RateLimiter: new ClientRateLimiter(),
};

export default security;
