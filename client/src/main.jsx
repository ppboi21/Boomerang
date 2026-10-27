import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/inter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Toaster } from 'sonner';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PrefsProvider, usePrefs } from './context/PrefsContext';
import { SocketProvider } from './context/SocketContext';
import './index.css';

function ThemedToaster() {
  const { resolvedTheme } = usePrefs();
  return (
    <Toaster
      theme={resolvedTheme}
      position="top-center"
      toastOptions={{
        style: { background: 'var(--ink-850)', border: '1px solid var(--ink-700)', color: 'var(--ink-50)', borderRadius: '16px', boxShadow: 'var(--pop-shadow)' },
      }}
    />
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PrefsProvider>
        <AuthProvider>
          <SocketProvider>
            <App />
            <ThemedToaster />
          </SocketProvider>
        </AuthProvider>
      </PrefsProvider>
    </BrowserRouter>
  </StrictMode>,
);
