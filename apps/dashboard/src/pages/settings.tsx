import { FormEvent, useEffect, useState } from 'react';
import { ApiError, api } from '../api';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Select,
  StatusBadge,
  Switch,
  useTranslation,
} from '@niagantara/ui';
import type { Language, Theme } from '@niagantara/ui';
import { getLanguage, getTheme, setLanguage, setTheme } from '@niagantara/ui';
import type { OrgCtx } from '../enhancements';
import {
  Building2,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';

type CompanyProfile = {
  id: string;
  name: string;
  legal_name?: string;
  npwp?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  website?: string;
  industry?: string;
  founded_date?: string;
  business_type?: string;
  logo_url?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  created_at?: string;
};

function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function SettingsPage({
  ctx,
  companyName,
  token,
}: {
  ctx: OrgCtx;
  companyName: string;
  token: string;
}) {
  const { t, language, setLanguage: setLang } = useTranslation();
  const [theme, setThemeState] = useState<Theme>(getTheme());
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [editingCompany, setEditingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState<Partial<CompanyProfile>>({});
  const [companyMsg, setCompanyMsg] = useState('');

  useEffect(() => {
    let active = true;
    if (!ctx.active_company) return;
    setLoadingCompany(true);
    api<CompanyProfile>(
      `/companies/${ctx.active_company}`,
      token,
      ctx.active_company,
    )
      .then((data) => {
        if (active) {
          setCompany(data);
          setCompanyForm(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingCompany(false);
      });
    return () => {
      active = false;
    };
  }, [ctx.active_company, token]);

  async function saveCompany(e: FormEvent) {
    e.preventDefault();
    setCompanyMsg('Menyimpan...');
    try {
      const updated = await api<CompanyProfile>(
        `/companies/${ctx.active_company}`,
        token,
        ctx.active_company,
        {
          method: 'PATCH',
          body: JSON.stringify(companyForm),
        },
      );
      setCompany(updated);
      setEditingCompany(false);
      setCompanyMsg('Profil perusahaan berhasil diperbarui.');
    } catch {
      setCompanyMsg('Gagal memperbarui profil perusahaan.');
    }
  }

  const fmtRp = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

  return (
    <>
      <Card title="Profil Perusahaan">
        {loadingCompany ? (
          <LoadingState label="Memuat profil..." />
        ) : company ? (
          editingCompany ? (
            <form className="inline-form" onSubmit={saveCompany}>
              <div className="settings-grid">
                <Field label="Nama Perusahaan">
                  <Input
                    required
                    value={companyForm.name ?? ''}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, name: e.target.value })
                    }
                  />
                </Field>
                <Field label="Nama Legal / NPWP">
                  <Input
                    value={companyForm.legal_name ?? ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        legal_name: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="NPWP">
                  <Input
                    value={companyForm.npwp ?? ''}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, npwp: e.target.value })
                    }
                    placeholder="00.000.000.0-000.000"
                  />
                </Field>
                <Field label="Telepon">
                  <Input
                    value={companyForm.phone ?? ''}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, phone: e.target.value })
                    }
                    placeholder="+62 xxx"
                  />
                </Field>
                <Field label="Email Perusahaan">
                  <Input
                    type="email"
                    value={companyForm.email ?? ''}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, email: e.target.value })
                    }
                  />
                </Field>
                <Field label="Website">
                  <Input
                    value={companyForm.website ?? ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        website: e.target.value,
                      })
                    }
                    placeholder="https://..."
                  />
                </Field>
                <Field label="Bidang Usaha">
                  <Input
                    value={companyForm.industry ?? ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        industry: e.target.value,
                      })
                    }
                    placeholder="Retail, F&B, dll."
                  />
                </Field>
                <Field label="Bentuk Usaha">
                  <Select
                    value={companyForm.business_type ?? ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        business_type: e.target.value,
                      })
                    }
                  >
                    <option value="">Pilih</option>
                    <option value="PT">PT (Perseroan Terbatas)</option>
                    <option value="CV">CV (Commanditaire Vennootschap)</option>
                    <option value="UD">UD (Usaha Dagang)</option>
                    <option value="PERSEORANGAN">Perseorangan</option>
                    <option value="KOPERASI">Koperasi</option>
                    <option value="LAINNYA">Lainnya</option>
                  </Select>
                </Field>
                <Field label="Tanggal Berdiri">
                  <Input
                    type="date"
                    value={companyForm.founded_date ?? ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        founded_date: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
              <Field label="Alamat Lengkap">
                <textarea
                  className="settings-textarea"
                  value={companyForm.address ?? ''}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, address: e.target.value })
                  }
                  rows={3}
                />
              </Field>
              <div className="settings-grid">
                <Field label="Kota">
                  <Input
                    value={companyForm.city ?? ''}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, city: e.target.value })
                    }
                  />
                </Field>
                <Field label="Provinsi">
                  <Input
                    value={companyForm.province ?? ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        province: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Kode Pos">
                  <Input
                    value={companyForm.postal_code ?? ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        postal_code: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Negara">
                  <Input
                    value={companyForm.country ?? 'Indonesia'}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        country: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Latitude">
                  <Input
                    type="number"
                    step="any"
                    value={companyForm.latitude ?? ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        latitude: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Longitude">
                  <Input
                    type="number"
                    step="any"
                    value={companyForm.longitude ?? ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        longitude: Number(e.target.value),
                      })
                    }
                  />
                </Field>
              </div>
              <div className="settings-actions">
                <Button type="submit">
                  <Save size={14} /> Simpan
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setEditingCompany(false);
                    setCompanyForm(company);
                  }}
                >
                  Batal
                </Button>
              </div>
              {companyMsg && (
                <p className="muted" role="status">
                  {companyMsg}
                </p>
              )}
            </form>
          ) : (
            <>
              <dl className="def-grid">
                <dt>
                  <Building2 size={14} /> Nama Perusahaan
                </dt>
                <dd>{company.name}</dd>
                {company.legal_name && (
                  <>
                    <dt>
                      <FileText size={14} /> Nama Legal
                    </dt>
                    <dd>{company.legal_name}</dd>
                  </>
                )}
                {company.npwp && (
                  <>
                    <dt>
                      <FileText size={14} /> NPWP
                    </dt>
                    <dd>{company.npwp}</dd>
                  </>
                )}
                {company.phone && (
                  <>
                    <dt>
                      <Phone size={14} /> Telepon
                    </dt>
                    <dd>{company.phone}</dd>
                  </>
                )}
                {company.email && (
                  <>
                    <dt>
                      <Mail size={14} /> Email
                    </dt>
                    <dd>{company.email}</dd>
                  </>
                )}
                {safeExternalUrl(company.website) && (
                  <>
                    <dt>
                      <Globe size={14} /> Website
                    </dt>
                    <dd>
                      <a
                        href={safeExternalUrl(company.website)!}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {company.website}
                      </a>
                    </dd>
                  </>
                )}
                {company.industry && (
                  <>
                    <dt>Bidang Usaha</dt>
                    <dd>{company.industry}</dd>
                  </>
                )}
                {company.business_type && (
                  <>
                    <dt>Bentuk Usaha</dt>
                    <dd>{company.business_type}</dd>
                  </>
                )}
                {company.founded_date && (
                  <>
                    <dt>Tanggal Berdiri</dt>
                    <dd>
                      {new Date(company.founded_date).toLocaleDateString(
                        'id-ID',
                        { year: 'numeric', month: 'long', day: 'numeric' },
                      )}
                    </dd>
                  </>
                )}
                {company.address && (
                  <>
                    <dt>
                      <MapPin size={14} /> Alamat
                    </dt>
                    <dd>
                      {company.address}
                      {company.city ? `, ${company.city}` : ''}
                      {company.province ? `, ${company.province}` : ''}
                      {company.postal_code ? ` ${company.postal_code}` : ''}
                      {company.country ? `, ${company.country}` : ''}
                    </dd>
                  </>
                )}
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={company.status ?? 'ACTIVE'} />
                </dd>
                {company.created_at && (
                  <>
                    <dt>Dibuat</dt>
                    <dd>
                      {new Date(company.created_at).toLocaleDateString('id-ID')}
                    </dd>
                  </>
                )}
              </dl>
              <Button
                onClick={() => setEditingCompany(true)}
                style={{ marginTop: '1rem' }}
              >
                Edit Profil Perusahaan
              </Button>
            </>
          )
        ) : (
          <EmptyState title="Profil perusahaan tidak ditemukan" />
        )}
      </Card>

      <Card title="Profil Pengguna">
        <dl className="def-grid">
          <dt>
            <User size={14} /> User ID
          </dt>
          <dd>
            <code>{ctx.user.id}</code>
          </dd>
          <dt>
            <User size={14} /> Nama Lengkap
          </dt>
          <dd>{ctx.profile?.full_name ?? '—'}</dd>
          <dt>
            <Mail size={14} /> Email
          </dt>
          <dd>{ctx.profile?.email ?? '—'}</dd>
        </dl>
      </Card>

      <Card title="Tampilan">
        <div className="setting-row">
          <span>Theme Terang</span>
          <Switch
            label="Tema"
            checked={theme === 'blue'}
            onChange={(on) => {
              const next: Theme = on ? 'blue' : 'light';
              setTheme(next);
              setThemeState(next);
            }}
          />
          <span>Theme Biru</span>
        </div>
        <div className="setting-row" style={{ marginTop: 12 }}>
          <span>Bahasa</span>
          <div className="ng-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={language === 'id'}
              className={language === 'id' ? 'active' : ''}
              onClick={() => {
                setLang('id');
                setLanguage('id');
              }}
            >
              Indonesia
            </button>
            <button
              role="tab"
              aria-selected={language === 'en'}
              className={language === 'en' ? 'active' : ''}
              onClick={() => {
                setLang('en');
                setLanguage('en');
              }}
            >
              English
            </button>
          </div>
        </div>
      </Card>

      <Card title="Workspace & Hak Akses">
        <dl className="def-grid">
          <dt>Perusahaan Aktif</dt>
          <dd>{companyName}</dd>
          <dt>Peran Anda</dt>
          <dd>
            {ctx.roles.map((r) => (
              <span
                key={r}
                className="ng-badge ng-badge--info"
                style={{ marginRight: 6 }}
              >
                {r}
              </span>
            ))}
          </dd>
          <dt>Cabang yang Diakses</dt>
          <dd>
            {ctx.accessible_branches.length > 0
              ? ctx.accessible_branches.map((b: any) => b.name).join(', ')
              : 'Semua cabang (owner)'}
          </dd>
        </dl>
        <details>
          <summary>
            <ShieldCheck size={14} /> Izin yang Diberikan (
            {ctx.permissions.length})
          </summary>
          <div className="perm-cloud">
            {ctx.permissions.map((p) => (
              <code key={p}>{p}</code>
            ))}
          </div>
        </details>
      </Card>

      <Card title="Akses NIAGANTARA">
        <dl className="def-grid">
          <dt>Status Akses</dt>
          <dd>
            <StatusBadge status="GRATIS" />
          </dd>
          <dt>Cakupan</dt>
          <dd>Seluruh dashboard sesuai role dan izin pengguna</dd>
          <dt>Keterangan</dt>
          <dd>
            Gratis selama masa peluncuran. Tidak ada pembayaran atau upgrade
            paket yang diperlukan.
          </dd>
        </dl>
      </Card>

      <Card title="Keamanan Sesi">
        <dl className="def-grid">
          <dt>Lokasi Sesi</dt>
          <dd>Penyimpanan sesi lokal (sessionStorage)</dd>
          <dt>Token Refresh</dt>
          <dd>Otomatis diperbarui via Supabase</dd>
          <dt>Auto-Logout</dt>
          <dd>Saat browser ditutup atau sesi expired</dd>
        </dl>
      </Card>

      <Card title="Zona Bahaya">
        <p className="muted" style={{ marginBottom: '0.75rem' }}>
          Tindakan di bawah ini tidak dapat dibatalkan.
        </p>
        <Button
          variant="danger"
          onClick={() => {
            localStorage.removeItem('niagantara.dashboard.session.v1');
            sessionStorage.clear();
            location.assign('/auth/login');
          }}
        >
          Keluar dari Semua Sesi
        </Button>
      </Card>
    </>
  );
}
