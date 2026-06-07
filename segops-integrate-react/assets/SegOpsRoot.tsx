/**
 * App entry wrapped in <SegOpsProvider> (Vite example).
 *
 * For Create React App, swap `import.meta.env.VITE_*` for
 * `process.env.REACT_APP_*`.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SegOpsProvider } from '@segops/sdk/react';
import App from './App';

const apiUrl = import.meta.env.VITE_SEGOPS_API_URL as string;
const apiKey = import.meta.env.VITE_SEGOPS_PUBLIC_KEY as string; // pk_…

if (!apiUrl || !apiKey) {
  console.warn('[segops] set VITE_SEGOPS_API_URL and VITE_SEGOPS_PUBLIC_KEY');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SegOpsProvider apiUrl={apiUrl} apiKey={apiKey}>
      <App />
    </SegOpsProvider>
  </StrictMode>,
);
