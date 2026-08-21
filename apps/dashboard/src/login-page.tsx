import { FormEvent, useState } from 'react';
import { login } from './api';
import { useAuth } from './auth/auth-context';
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
        <div className="auth-brand">N</div>
        <p className="eyebrow">NIAGANTARA</p>
        <h1>Masuk dashboard</h1>
        <p className="muted">Gunakan akun perusahaan yang aktif.</p>
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
          <button disabled={busy}>{busy ? 'Memuat...' : 'Masuk'}</button>
          <p className="form-status" role="alert">
            {error}
          </p>
          <a href="/auth/forgot-password">Lupa password?</a>
        </form>
      </section>
    </main>
  );
}
