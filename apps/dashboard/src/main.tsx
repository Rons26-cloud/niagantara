import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import {
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyRecoveryPage,
} from './auth/recovery-pages';
import { AuthProvider } from './auth/auth-context';
import { DashboardApp } from './dashboard-app';
import { LoginPage } from './login-page';
const recoveryRoutes = {
  '/auth/forgot-password': ForgotPasswordPage,
  '/auth/verify-recovery': VerifyRecoveryPage,
  '/auth/reset-password': ResetPasswordPage,
} as const;
const Page =
  window.location.pathname === '/auth/login'
    ? LoginPage
    : (recoveryRoutes[
        window.location.pathname as keyof typeof recoveryRoutes
      ] ?? DashboardApp);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Page />
    </AuthProvider>
  </StrictMode>,
);
