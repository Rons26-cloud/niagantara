import { FormEvent, useState } from 'react';
import { login } from './api';
import { useAuth } from './auth/auth-context';
import { LoginBrand } from '@niagantara/ui';

export function LoginPage() {
  const { setSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await login(email, password);
      setSession(
        { id: result.user.id, email: result.user.email },
        result.session.access_token,
      );
      window.location.assign('/');
    } catch {
      setError('Email atau password tidak valid.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <LoginBrand appLabel="Dashboard User" />
        <h1>Masuk ke Dashboard</h1>
        <p className="muted">Kelola bisnis, cabang, penjualan, stok, dan laporan Anda.</p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button disabled={busy}>{busy ? 'Memuat...' : 'Masuk ke Dashboard'}</button>
          <p className="form-status" role="alert">
            {error}
          </p>
          <a href="/auth/forgot-password">Lupa password?</a>
        </form>
      </section>
    </main>
  );
}
