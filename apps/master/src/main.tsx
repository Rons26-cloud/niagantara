import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initTheme } from '@niagantara/ui/theme';
import './styles.css';
import './theme-overrides.css';
import { AuthProvider } from './auth';
import { MasterApp } from './app';

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <MasterApp />
    </AuthProvider>
  </StrictMode>,
);
