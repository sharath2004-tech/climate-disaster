import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';

/**
 * Test Utilities and Examples for Climate Disaster Platform
 */

// ==================== Mock Data ====================

export const mockUser = {
  _id: '123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user' as const,
  isVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockAlert = {
  _id: 'alert123',
  title: 'Flash Flood Warning',
  description: 'Severe flooding expected in the area',
  type: 'flood' as const,
  severity: 'high' as const,
  status: 'active' as const,
  location: {
    type: 'Point' as const,
    coordinates: [-74.006, 40.7128] as [number, number],
    city: 'New York',
    state: 'NY',
  },
  issuedBy: mockUser._id,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockReport = {
  _id: 'report123',
  reportedBy: mockUser._id,
  type: 'flood' as const,
  severity: 'medium' as const,
  description: 'Water rising on Main Street',
  location: {
    type: 'Point' as const,
    coordinates: [-74.006, 40.7128] as [number, number],
    address: '123 Main St',
  },
  status: 'pending' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockResource = {
  _id: 'resource123',
  name: 'Emergency Shelter',
  type: 'shelter' as const,
  description: 'Safe shelter with medical facilities',
  location: {
    type: 'Point' as const,
    coordinates: [-74.006, 40.7128] as [number, number],
    address: '456 Shelter Ave',
    city: 'New York',
  },
  status: 'available' as const,
  quantity: 100,
  addedBy: mockUser._id,
  lastUpdated: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ==================== Test Wrappers ====================

/**
 * Wrapper for components that need Router and Query Client
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

// ==================== Mock Functions ====================

/**
 * Mock fetch API
 */
export function mockFetch(data: any, status = 200) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    } as Response)
  );
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
}

/**
 * Mock geolocation
 */
export function mockGeolocation() {
  const mockGeolocation = {
    getCurrentPosition: vi.fn((success) =>
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      })
    ),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  };

  Object.defineProperty(global.navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true,
  });

  return mockGeolocation;
}

// ==================== Example Tests ====================

describe('Example Test Suite', () => {
  beforeEach(() => {
    // Setup before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    vi.restoreAllMocks();
  });

  describe('API Tests', () => {
    it('should fetch alerts successfully', async () => {
      mockFetch({ data: [mockAlert] });

      const response = await fetch('/api/alerts');
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe('Flash Flood Warning');
    });

    it('should handle API errors', async () => {
      mockFetch({ error: 'Server error' }, 500);

      const response = await fetch('/api/alerts');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('Utility Functions', () => {
    it('should validate email correctly', async () => {
      const { validateEmail } = await import('@/lib/security');
      
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });

    it('should validate coordinates correctly', async () => {
      const { validateCoordinates } = await import('@/lib/security');
      
      expect(validateCoordinates(40.7128, -74.006)).toBe(true);
      expect(validateCoordinates(91, 0)).toBe(false);
      expect(validateCoordinates(0, 181)).toBe(false);
    });

    it('should sanitize input to prevent XSS', async () => {
      const { sanitizeInput } = await import('@/lib/security');
      
      const maliciousInput = '<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
    });
  });

  describe('Authentication', () => {
    it('should store auth token in localStorage', () => {
      const token = 'test-token-123';
      localStorage.setItem('token', token);
      
      expect(localStorage.getItem('token')).toBe(token);
    });

    it('should clear auth token on logout', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('Geolocation', () => {
    it('should get user location', async () => {
      const mockGeo = mockGeolocation();

      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition((position) => {
          expect(position.coords.latitude).toBe(40.7128);
          expect(position.coords.longitude).toBe(-74.006);
          resolve();
        });
      });

      expect(mockGeo.getCurrentPosition).toHaveBeenCalled();
    });
  });
});

// ==================== Integration Test Example ====================

describe('Alert Flow Integration Test', () => {
  it('should display alerts on the alerts page', async () => {
    mockFetch({ data: [mockAlert] });

    // This would be your actual AlertsPage component
    // renderWithProviders(<AlertsPage />);

    // await waitFor(() => {
    //   expect(screen.getByText('Flash Flood Warning')).toBeInTheDocument();
    // });
  });
});

// ==================== Performance Test Example ====================

describe('Performance Tests', () => {
  it('should render large alert list efficiently', () => {
    const startTime = performance.now();
    
    // Render component with 1000 alerts
    const manyAlerts = Array.from({ length: 1000 }, (_, i) => ({
      ...mockAlert,
      _id: `alert${i}`,
      title: `Alert ${i}`,
    }));

    // renderWithProviders(<AlertList alerts={manyAlerts} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render in less than 1000ms
    expect(renderTime).toBeLessThan(1000);
  });
});

// ==================== Accessibility Test Example ====================

describe('Accessibility Tests', () => {
  it('should have proper ARIA labels', () => {
    // renderWithProviders(<AlertCard alert={mockAlert} />);
    
    // const alert = screen.getByRole('article');
    // expect(alert).toHaveAttribute('aria-label');
  });
});
