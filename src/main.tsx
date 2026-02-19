import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/serviceWorker";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA support
if (import.meta.env.PROD) {
  registerServiceWorker({
    onSuccess: () => {
      console.log('✅ Service Worker registered - App is now available offline!');
    },
    onUpdate: () => {
      console.log('🔄 New version available - Update notification shown');
    },
    onError: (error) => {
      console.error('❌ Service Worker registration failed:', error);
    },
  });
}
