import { useTranslation } from '@niagantara/ui';
import type { ReactNode } from 'react';
import { Shell } from './chrome';
import { Link } from './router';

function Legal({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Shell>
      <div className="legal">
        <div className="container">
          <Link className="back" to="/">{t('website.legal.backHome')}</Link>
          {children}
        </div>
      </div>
    </Shell>
  );
}

export function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <Legal>
      <h1>{t('website.legal.privacyTitle')}</h1>
      <p>{t('website.legal.updated')}</p>
      <h2>Informasi yang kami proses</h2>
      <p>NIAGANTARA memproses identitas akun, catatan autentikasi, keanggotaan perusahaan dan cabang, serta data bisnis yang dimasukkan oleh pengguna berwenang.</p>
      <h2>Integrasi Google</h2>
      <p>Saat administrator menghubungkan Google, NIAGANTARA meminta identitas email dan akses Google Sheets yang diperlukan untuk pelaporan. Token refresh dienkripsi dan tidak ditampilkan kepada browser.</p>
      <h2>Penyimpanan dan keamanan</h2>
      <p>Supabase adalah sumber data utama. Google Sheets adalah lapisan pelaporan. Log operasional, security events, dan audit records mendukung operasi dan keamanan.</p>
      <h2>Kontak</h2>
      <p>Permintaan privasi: <a href="mailto:privacy@niagantara.com">privacy@niagantara.com</a>.</p>
    </Legal>
  );
}

export function TermsPage() {
  const { t } = useTranslation();
  return (
    <Legal>
      <h1>{t('website.legal.termsTitle')}</h1>
      <p>{t('website.legal.updated')}</p>
      <h2>Akun dan penggunaan</h2>
      <p>Anda bertanggung jawab memberikan informasi yang akurat, menjaga kredensial, dan menggunakan NIAGANTARA secara sah.</p>
      <h2>Data bisnis</h2>
      <p>Anda bertanggung jawab atas akurasi dan hak penggunaan data yang dimasukkan. Catatan Supabase tetap menjadi sumber data utama.</p>
      <h2>Kontak</h2>
      <p>Pertanyaan: <a href="mailto:support@niagantara.com">support@niagantara.com</a>.</p>
    </Legal>
  );
}
