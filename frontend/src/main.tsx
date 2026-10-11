import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrace Service Workeru pro PWA (Offline podpora a instalovatelnost přes vite-plugin-pwa)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('Nová verze aplikace je k dispozici.');
    },
    onOfflineReady() {
      console.log('Aplikace je připravena k offline použití.');
    },
  });
}
