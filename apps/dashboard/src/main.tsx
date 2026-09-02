import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initTheme } from '@niagantara/ui/theme';
import '@niagantara/ui/design-tokens.css';
import '@niagantara/ui/components.css';
import '@niagantara/ui/ui.css';
import './styles.css';
import './theme-overrides.css';
import {
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyRecoveryPage,
} from './auth/recovery-pages';
import { AuthProvider } from './auth/auth-context';
import { DashboardApp } from './dashboard-app';
import { LoginPage } from './login-page';

initTheme();
const recoveryRoutes = {
  '/auth/forgot-password': ForgotPasswordPage,
  '/auth/verify-recovery': VerifyRecoveryPage,
  '/auth/reset-password': ResetPasswordPage,
} as const;
const authRoutes = ['/auth/login', '/auth/register'];
const Page = authRoutes.includes(window.location.pathname)
  ? LoginPage
  : (recoveryRoutes[window.location.pathname as keyof typeof recoveryRoutes] ??
    DashboardApp);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Page />
    </AuthProvider>
  </StrictMode>,
);
