import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { ForgotPasswordPage, ResetPasswordPage, VerifyRecoveryPage } from './auth/recovery-pages';

const modules = ['Dashboard', 'POS / Kasir', 'Produk', 'Stok', 'Cabang', 'Karyawan', 'Keuangan', 'Google Sheets'];
function App() { return <div className="layout"><aside><div className="brand"><span>N</span><div>NIAGANTARA<small>BUSINESS CONTROL PLATFORM</small></div></div><nav>{modules.map((item, index) => <a className={index === 0 ? 'active' : ''} key={item}>{item}</a>)}</nav></aside><main className="content"><p className="eyebrow">USER DASHBOARD</p><h1>Kontrol bisnis dalam satu tempat.</h1><p className="muted">Dashboard operasional company akan mengagregasi data cabang secara aman.</p><section className="cards">{['Revenue hari ini','Transaksi','Stok hampir habis'].map(label => <article key={label}><span>{label}</span><strong>—</strong><small>Belum ada data</small></article>)}</section></main></div>; }
const recoveryRoutes = {
  '/auth/forgot-password': ForgotPasswordPage,
  '/auth/verify-recovery': VerifyRecoveryPage,
  '/auth/reset-password': ResetPasswordPage,
} as const;
const Page = recoveryRoutes[window.location.pathname as keyof typeof recoveryRoutes] ?? App;
createRoot(document.getElementById('root')!).render(<StrictMode><Page /></StrictMode>);
