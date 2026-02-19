/**
 * Application Monitoring & Analytics Configuration
 * Integrates with multiple monitoring services for comprehensive observability
 */

// ==================== Configuration ====================

export interface MonitoringConfig {
  sentry?: {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
    replaysSessionSampleRate: number;
    replaysOnErrorSampleRate: number;
  };
  googleAnalytics?: {
    measurementId: string;
  };
  mixpanel?: {
    token: string;
  };
  logrocket?: {
    appId: string;
  };
  datadog?: {
    clientToken: string;
    applicationId: string;
    site: string;
  };
}

// ==================== Sentry Setup ====================

export async function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) return;

  const Sentry = await import('@sentry/react');
  const { BrowserTracing } = await import('@sentry/tracing');

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors from browser extensions
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        frame => frame.filename?.includes('extensions/')
      )) {
        return null;
      }
      
      // Don't send network errors from localhost
      if (hint.originalException?.toString().includes('localhost')) {
        return null;
      }

      return event;
    },

    // Additional context
    initialScope: {
      tags: {
        'app.version': import.meta.env.VITE_APP_VERSION || '1.0.0',
      },
    },
  });

  console.log('✅ Sentry monitoring initialized');
}

// ==================== Google Analytics Setup ====================

export function initGoogleAnalytics() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;

  // Load gtag.js
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(arguments);
  }
  
  gtag('js', new Date());
  gtag('config', measurementId, {
    send_page_view: false, // We'll manually track page views
    anonymize_ip: true,
  });

  (window as any).gtag = gtag;

  console.log('✅ Google Analytics initialized');
}

// ==================== Analytics Tracking ====================

export const analytics = {
  // Page view tracking
  trackPageView(path: string, title?: string) {
    if ((window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
      });
    }
  },

  // Event tracking
  trackEvent(eventName: string, properties?: Record<string, any>) {
    if ((window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }

    // Also track in Mixpanel if available
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track(eventName, properties);
    }
  },

  // User identification
  identifyUser(userId: string, traits?: Record<string, any>) {
    if ((window as any).gtag) {
      (window as any).gtag('set', { user_id: userId });
    }

    if ((window as any).mixpanel) {
      (window as any).mixpanel.identify(userId);
      if (traits) {
        (window as any).mixpanel.people.set(traits);
      }
    }
  },

  // Emergency-specific events
  trackAlertView(alertId: string, alertType: string, severity: string) {
    this.trackEvent('alert_viewed', {
      alert_id: alertId,
      alert_type: alertType,
      severity,
    });
  },

  trackReportSubmission(reportType: string, severity: string) {
    this.trackEvent('report_submitted', {
      report_type: reportType,
      severity,
    });
  },

  trackEvacuationRouteView(routeId: string) {
    this.trackEvent('evacuation_route_viewed', {
      route_id: routeId,
    });
  },

  trackResourceSearch(resourceType: string, resultCount: number) {
    this.trackEvent('resource_searched', {
      resource_type: resourceType,
      result_count: resultCount,
    });
  },

  trackAIChatMessage(messageLength: number, responseTime: number) {
    this.trackEvent('ai_chat_used', {
      message_length: messageLength,
      response_time: responseTime,
    });
  },
};

// ==================== Performance Monitoring ====================

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  // Track page load performance
  trackPageLoad() {
    if (!window.performance) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
        const ttfb = perfData.responseStart - perfData.navigationStart;

        this.recordMetric('page_load_time', pageLoadTime);
        this.recordMetric('dom_ready_time', domReadyTime);
        this.recordMetric('time_to_first_byte', ttfb);

        analytics.trackEvent('page_performance', {
          page_load_time: pageLoadTime,
          dom_ready_time: domReadyTime,
          ttfb,
        });
      }, 0);
    });
  }

  // Track API call performance
  async trackAPICall<T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      this.recordMetric(`api_${endpoint}`, duration);
      
      if (duration > 3000) {
        console.warn(`Slow API call: ${endpoint} took ${duration}ms`);
        analytics.trackEvent('slow_api_call', {
          endpoint,
          duration,
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      analytics.trackEvent('api_error', {
        endpoint,
        duration,
        error: (error as Error).message,
      });
      
      throw error;
    }
  }

  // Track custom metrics
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  // Get metric statistics
  getMetricStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  // Report all metrics
  reportMetrics() {
    const report: Record<string, any> = {};
    
    for (const [name, _] of this.metrics) {
      report[name] = this.getMetricStats(name);
    }

    console.table(report);
    return report;
  }
}

// ==================== Error Tracking ====================

export function setupErrorTracking() {
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    analytics.trackEvent('javascript_error', {
      message: event.error?.message,
      stack: event.error?.stack,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    analytics.trackEvent('unhandled_rejection', {
      reason: event.reason?.toString(),
    });
  });
}

// ==================== User Session Tracking ====================

export class SessionTracker {
  private sessionId: string;
  private sessionStart: number;
  private pageViews: number = 0;
  private interactions: number = 0;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.trackSession();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private trackSession() {
    // Track user interactions
    ['click', 'scroll', 'keypress'].forEach(eventType => {
      window.addEventListener(eventType, () => {
        this.interactions++;
      }, { passive: true });
    });

    // Track session end
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseSession();
      } else {
        this.resumeSession();
      }
    });
  }

  incrementPageViews() {
    this.pageViews++;
  }

  private endSession() {
    const sessionDuration = Date.now() - this.sessionStart;
    
    analytics.trackEvent('session_end', {
      session_id: this.sessionId,
      duration_ms: sessionDuration,
      page_views: this.pageViews,
      interactions: this.interactions,
    });
  }

  private pauseSession() {
    analytics.trackEvent('session_paused', {
      session_id: this.sessionId,
    });
  }

  private resumeSession() {
    analytics.trackEvent('session_resumed', {
      session_id: this.sessionId,
    });
  }

  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStart,
      pageViews: this.pageViews,
      interactions: this.interactions,
    };
  }
}

// ==================== Initialize All Monitoring ====================

export async function initializeMonitoring() {
  // Initialize error tracking
  setupErrorTracking();

  // Initialize Sentry
  await initSentry();

  // Initialize Google Analytics
  initGoogleAnalytics();

  // Initialize performance monitoring
  const perfMonitor = new PerformanceMonitor();
  perfMonitor.trackPageLoad();

  // Initialize session tracking
  const sessionTracker = new SessionTracker();

  // Report metrics every 5 minutes
  setInterval(() => {
    const metrics = perfMonitor.reportMetrics();
    const session = sessionTracker.getSessionInfo();
    
    analytics.trackEvent('metrics_report', {
      ...metrics,
      ...session,
    });
  }, 5 * 60 * 1000);

  console.log('✅ All monitoring services initialized');

  return {
    perfMonitor,
    sessionTracker,
  };
}

// Export singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const sessionTracker = new SessionTracker();

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    mixpanel: any;
  }
}
