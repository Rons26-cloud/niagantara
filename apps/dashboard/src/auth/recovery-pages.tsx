import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { RecoveryApiError, requestRecovery, saveNewPassword, verifyRecovery } from './recovery-api';

const EMAIL_KEY = 'niagantara.recovery.v1.email';
const ACCESS_KEY = 'niagantara.recovery.v1.access';
const REFRESH_KEY = 'niagantara.recovery.v1.refresh';
const RESEND_KEY = 'niagantara.recovery.v1.resendAt';
const COOLDOWN_SECONDS = 60;

const messageFor = (error: unknown) => {
  if (!(error instanceof RecoveryApiError)) return 'Permintaan tidak dapat diproses. Coba lagi.';
  if (error.code === 'RATE_LIMIT') return 'Tunggu sebelum meminta kode baru.';
  if (error.code === 'PASSWORD_MISMATCH') return 'Konfirmasi password tidak cocok.';
  if (error.code === 'RECOVERY_SESSION_REQUIRED') return 'Sesi pemulihan tidak tersedia. Verifikasi OTP kembali.';
  return 'Kode OTP tidak valid atau sudah kedaluwarsa.';
};

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      await requestRecovery(email);
      sessionStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
      localStorage.setItem(RESEND_KEY, String(Date.now() + COOLDOWN_SECONDS * 1000));
      window.location.assign('/auth/verify-recovery');
    } catch (error) {
      setStatus(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return <AuthShell title="Lupa password" subtitle="Kami akan mengirim kode OTP pemulihan melalui email.">
    <form onSubmit={submit}>
      <label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <button disabled={busy}>{busy ? 'Mengirim...' : 'Kirim kode OTP'}</button>
      <Status text={status} />
    </form>
  </AuthShell>;
}

export function VerifyRecoveryPage() {
  const [email, setEmail] = useState(() => sessionStorage.getItem(EMAIL_KEY) ?? '');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.ceil((Number(localStorage.getItem(RESEND_KEY) ?? 0) - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      const result = await verifyRecovery(email, otp);
      sessionStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
      sessionStorage.setItem(ACCESS_KEY, result.accessToken);
      sessionStorage.setItem(REFRESH_KEY, result.refreshToken);
      window.location.assign('/auth/reset-password');
    } catch (error) {
      setStatus(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (remaining > 0) return;
    setBusy(true);
    setStatus('');
    try {
      await requestRecovery(email);
      localStorage.setItem(RESEND_KEY, String(Date.now() + COOLDOWN_SECONDS * 1000));
      setRemaining(COOLDOWN_SECONDS);
      setStatus('Kode baru telah dikirim.');
    } catch (error) {
      setStatus(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return <AuthShell title="Verifikasi OTP" subtitle="Masukkan kode dari email pemulihan NIAGANTARA.">
    <form onSubmit={submit}>
      <label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>Kode OTP<input inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={8} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} /></label>
      <button disabled={busy}>{busy ? 'Memverifikasi...' : 'Verifikasi'}</button>
      <button className="secondary" type="button" disabled={busy || remaining > 0 || !email} onClick={resend}>
        {remaining > 0 ? `Kirim ulang dalam ${remaining} detik` : 'Kirim ulang OTP'}
      </button>
      <Status text={status} />
    </form>
  </AuthShell>;
}

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setStatus('Konfirmasi password tidak cocok.');
      return;
    }
    const accessToken = sessionStorage.getItem(ACCESS_KEY);
    const refreshToken = sessionStorage.getItem(REFRESH_KEY);
    if (!accessToken || !refreshToken) {
      setStatus('Sesi pemulihan tidak tersedia. Verifikasi OTP kembali.');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      await saveNewPassword(accessToken, refreshToken, password, confirmPassword);
      sessionStorage.removeItem(ACCESS_KEY);
      sessionStorage.removeItem(REFRESH_KEY);
      sessionStorage.removeItem(EMAIL_KEY);
      setStatus('Password berhasil diperbarui. Silakan login kembali.');
    } catch (error) {
      setStatus(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return <AuthShell title="Buat password baru" subtitle="Gunakan minimal 12 karakter dan simpan dengan aman.">
    <form onSubmit={submit}>
      <label>Password baru<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <label>Konfirmasi password<input type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
      <button disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan password'}</button>
      <Status text={status} />
    </form>
  </AuthShell>;
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <main className="auth-page"><section className="auth-card"><div className="auth-brand">N</div><p className="eyebrow">NIAGANTARA SECURITY</p><h1>{title}</h1><p className="muted">{subtitle}</p>{children}</section></main>;
}

function Status({ text }: { text: string }) {
  return <p className="form-status" role="status" aria-live="polite">{text}</p>;
}
