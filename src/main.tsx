import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import 'katex/dist/katex.min.css';
import App from './App.tsx';
import './index.css';

// Подавление доброкачественных системных ошибок WebSocket/HMR платформы AI Studio
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || String(event.reason);
  if (
    reason.includes('WebSocket') || 
    reason.includes('websocket') || 
    reason.includes('vite') ||
    reason.includes('HMR')
  ) {
    event.preventDefault();
    console.warn('RICIS System Safe Mode: Blocked benign platform-specific WebSocket rejection:', reason);
  }
});

window.addEventListener('error', (event) => {
  const message = event.message || '';
  if (
    message.includes('WebSocket') || 
    message.includes('websocket') ||
    message.includes('vite')
  ) {
    event.preventDefault();
    console.warn('RICIS System Safe Mode: Blocked benign platform-specific WebSocket error:', message);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
