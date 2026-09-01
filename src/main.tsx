// Safeguard window.fetch in sandboxed environment
(function() {
  try {
    const rawFetch = typeof window !== 'undefined' ? window.fetch : null;
    let currentFetch = rawFetch ? rawFetch.bind(window) : null;
    const desc = {
      get: () => currentFetch,
      set: (fn: typeof fetch) => { currentFetch = fn; },
      configurable: true,
      enumerable: true
    };
    if (typeof Window !== 'undefined' && Window.prototype) {
      try { Object.defineProperty(Window.prototype, 'fetch', desc); } catch {}
    }
    if (typeof window !== 'undefined') {
      try { Object.defineProperty(window, 'fetch', desc); } catch {}
    }
  } catch {}
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
