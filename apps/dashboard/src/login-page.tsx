import { FormEvent, useState } from 'react';
import { login, register } from './api';
import { useAuth } from './auth/auth-context';
import { LoginBrand } from '@niagantara/ui';
import { createClient } from '@supabase/supabase-js';

const supabase =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    ? createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: true,
            detectSessionInUrl: false,
          },
        },
      )
    : null;

type Tab = 'login' | 'register';

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('login');

  return (
    <main className="auth-page">
      <div className="auth-wrapper">
        <LoginBrand appLabel="Dashboard" />

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={tab === 'login' ? 'active' : ''}
              type="button"
              onClick={() => setTab('login')}
            >
              Masuk
            </button>
            <button
              className={tab === 'register' ? 'active' : ''}
              type="button"
              onClick={() => setTab('register')}
            >
              Daftar
            </button>
          </div>

          {tab === 'login' ? <LoginForm /> : <RegisterForm />}

          <div className="auth-footer">
            <small>&copy; {new Date().getFullYear()} Niagantara</small>
          </div>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginForm() {
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
        result.session.refresh_token,
      );
      window.location.assign('/');
    } catch {
      setError('Email atau password tidak valid.');
    } finally {
      setBusy(false);
    }
  }

  async function loginWithGoogle() {
    if (!supabase) {
      setError('Google login tidak dikonfigurasi.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/',
          skipBrowserRedirect: false,
        },
      });
      if (authError) throw authError;
    } catch {
      setError('Gagal masuk dengan Google.');
      setBusy(false);
    }
  }

  return (
    <div className="auth-form-area">
      <button
        type="button"
        className="auth-google-btn"
        onClick={loginWithGoogle}
        disabled={busy}
      >
        <GoogleIcon />
        Masuk dengan Google
      </button>

      <div className="auth-divider">
        <span>atau</span>
      </div>

      <form onSubmit={submit}>
        <label>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            placeholder="nama@perusahaan.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <p className="form-error" role="alert">
          {error}
        </p>
        <button className="auth-submit" disabled={busy}>
          {busy ? 'Memuat...' : 'Masuk'}
        </button>
      </form>

      <a href="/auth/forgot-password" className="auth-link">
        Lupa password?
      </a>
    </div>
  );
}

function RegisterForm() {
  const { setSession } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 12) {
      setError('Password minimal 12 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    if (!companyName.trim()) {
      setError('Nama perusahaan wajib diisi.');
      return;
    }

    setBusy(true);
    try {
      const result = await register({
        email,
        password,
        fullName: fullName.trim(),
        companyName: companyName.trim(),
      });
      if (result.session?.access_token) {
        setSession(
          { id: result.user.id, email: result.user.email },
          result.session.access_token,
          result.session.refresh_token,
        );
        window.location.assign('/');
      } else {
        setError('Registrasi berhasil. Silakan cek email untuk verifikasi.');
      }
    } catch (err: any) {
      if (err?.status === 409) {
        setError('Email sudah terdaftar. Silakan masuk.');
      } else {
        setError('Registrasi gagal. Silakan coba lagi.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function registerWithGoogle() {
    if (!supabase) {
      setError('Google login tidak dikonfigurasi.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/',
          skipBrowserRedirect: false,
        },
      });
      if (authError) throw authError;
    } catch {
      setError('Gagal daftar dengan Google.');
      setBusy(false);
    }
  }

  return (
    <div className="auth-form-area">
      <button
        type="button"
        className="auth-google-btn"
        onClick={registerWithGoogle}
        disabled={busy}
      >
        <GoogleIcon />
        Daftar dengan Google
      </button>

      <div className="auth-divider">
        <span>atau</span>
      </div>

      <form onSubmit={submit}>
        <label>
          <span>Nama Lengkap</span>
          <input
            type="text"
            autoComplete="name"
            required
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
        <label>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            placeholder="nama@perusahaan.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          <span>Nama Perusahaan</span>
          <input
            type="text"
            autoComplete="organization"
            required
            placeholder="PT Nama Perusahaan"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            placeholder="Min. 12 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          <span>Konfirmasi Password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            placeholder="Ulangi password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>
        <p className="form-error" role="alert">
          {error}
        </p>
        <button className="auth-submit" disabled={busy}>
          {busy ? 'Memuat...' : 'Buat Akun'}
        </button>
      </form>

      <p className="auth-alt-action">
        Sudah punya akun?{' '}
        <a
          href="/auth/login"
          onClick={(e) => {
            e.preventDefault();
            window.location.reload();
          }}
        >
          Masuk
        </a>
      </p>
    </div>
  );
}
