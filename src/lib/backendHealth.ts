/**
 * Backend Health Check Utility
 * Helps manage Render.com free tier cold starts
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface HealthStatus {
  isHealthy: boolean;
  isWakingUp: boolean;
  message: string;
  responseTime?: number;
}

/**
 * Check if backend is healthy
 * @param timeout Maximum time to wait for response (ms)
 */
export async function checkBackendHealth(timeout = 15000): Promise<HealthStatus> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const healthUrl = API_URL.replace('/api', '/health');
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        isHealthy: true,
        isWakingUp: false,
        message: 'Backend is running',
        responseTime,
      };
    }

    return {
      isHealthy: false,
      isWakingUp: false,
      message: `Backend returned error: ${response.status}`,
      responseTime,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        isHealthy: false,
        isWakingUp: true,
        message: 'Backend is waking up from sleep (free tier). Please wait...',
        responseTime,
      };
    }

    return {
      isHealthy: false,
      isWakingUp: false,
      message: 'Cannot reach backend',
      responseTime,
    };
  }
}

/**
 * Wake up the backend by sending health check
 * Useful for Render.com free tier that sleeps after 15 minutes
 */
export async function wakeUpBackend(): Promise<HealthStatus> {
  console.log('⏰ Waking up backend...');
  
  // Try health check with longer timeout
  const status = await checkBackendHealth(60000);
  
  if (status.isHealthy) {
    console.log('✅ Backend is awake');
  } else if (status.isWakingUp) {
    console.log('⏳ Backend is still waking up, may take 30-60 seconds on free tier');
  } else {
    console.error('❌ Backend health check failed');
  }
  
  return status;
}

/**
 * Auto-retry wrapper for API calls with backend wake-up
 */
export async function callWithWakeup<T>(
  apiCall: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // If backend is sleeping, wake it up
      if (errorMessage.includes('waking up') || errorMessage.includes('timeout')) {
        console.log(`Attempt ${attempt + 1}/${maxRetries}: Backend might be sleeping...`);
        
        if (attempt < maxRetries - 1) {
          await wakeUpBackend();
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Check if error is a backend sleep error
 */
export function isBackendSleepError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('waking up') ||
      message.includes('timeout') ||
      message.includes('failed to fetch') ||
      message.includes('network error')
    );
  }
  return false;
}
