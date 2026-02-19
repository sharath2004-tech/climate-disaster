/**
 * Service Worker Registration Utility
 * Handles registration, updates, and communication with service worker
 */

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Register service worker for PWA support
 */
export function registerServiceWorker(config: ServiceWorkerConfig = {}) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });

        console.log('✅ Service Worker registered successfully:', registration.scope);

        // Check for updates on load
        registration.update();

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('🔄 New version available!');
              if (config.onUpdate) {
                config.onUpdate(registration);
              } else {
                // Auto-update by default
                showUpdateNotification(registration);
              }
            }
          });
        });

        if (config.onSuccess) {
          config.onSuccess(registration);
        }

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
        if (config.onError) {
          config.onError(error as Error);
        }
      }
    });

    // Handle service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('📨 Message from Service Worker:', event.data);
      handleServiceWorkerMessage(event.data);
    });

    // Listen for controller change (new SW took over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service Worker controller changed, reloading...');
      window.location.reload();
    });
  } else {
    console.warn('⚠️ Service Workers not supported in this browser');
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('✅ Service Worker unregistered');
    }
  }
}

/**
 * Request push notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('⚠️ Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('⚠️ Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Request permission first
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.warn('⚠️ Notification permission denied');
        return null;
      }

      // Subscribe
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
        ),
      });
      
      console.log('✅ Subscribed to push notifications');
    }

    return subscription;
  } catch (error) {
    console.error('❌ Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Unsubscribed from push notifications');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Failed to unsubscribe:', error);
    return false;
  }
}

/**
 * Send message to service worker
 */
export function sendMessageToSW(message: any) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

/**
 * Show update notification when new version is available
 */
function showUpdateNotification(registration: ServiceWorkerRegistration) {
  const updateAvailable = document.createElement('div');
  updateAvailable.innerHTML = `
    <div style="position: fixed; bottom: 20px; right: 20px; background: #0ea5e9; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 10000; max-width: 400px;">
      <div style="font-weight: 600; margin-bottom: 8px;">🔄 New version available!</div>
      <div style="font-size: 14px; margin-bottom: 12px;">A new version of the app is available. Update now for the latest features.</div>
      <div style="display: flex; gap: 8px;">
        <button id="sw-update-btn" style="flex: 1; padding: 8px 16px; background: white; color: #0ea5e9; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">Update Now</button>
        <button id="sw-dismiss-btn" style="padding: 8px 16px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 4px; cursor: pointer;">Later</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(updateAvailable);

  document.getElementById('sw-update-btn')?.addEventListener('click', () => {
    // Tell the service worker to skip waiting
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });

  document.getElementById('sw-dismiss-btn')?.addEventListener('click', () => {
    updateAvailable.remove();
  });
}

/**
 * Handle messages from service worker
 */
function handleServiceWorkerMessage(data: any) {
  if (data.type === 'CACHE_UPDATED') {
    console.log('📦 Cache updated:', data.urls);
  }
  
  if (data.type === 'SYNC_COMPLETE') {
    console.log('✅ Background sync completed');
  }
}

/**
 * Convert VAPID key for push subscription
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Check if app is running as PWA
 */
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as any).standalone) ||
    document.referrer.includes('android-app://');
}

/**
 * Check if app can be installed
 */
export function canInstallPWA(): boolean {
  return 'beforeinstallprompt' in window;
}

/**
 * Prompt user to install PWA
 */
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('💾 PWA install prompt available');
});

export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('⚠️ PWA install prompt not available');
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`PWA install prompt outcome: ${outcome}`);
  deferredPrompt = null;
  
  return outcome === 'accepted';
}

// Listen for app installation
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installed successfully');
  deferredPrompt = null;
});
