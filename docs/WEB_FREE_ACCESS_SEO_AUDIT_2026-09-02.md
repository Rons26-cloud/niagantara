# Audit Web, Akses Gratis, dan SEO — 2 September 2026

## Ringkasan struktur

- `apps/web`: situs marketing publik berbasis Vite + React.
- `apps/dashboard`: dashboard operasional pemilik dan tim.
- `apps/pos`: aplikasi kasir.
- `services/api`: API NestJS dengan autentikasi, tenant, branch, dan permission guards.
- `supabase/migrations`: skema, RLS, RBAC, serta kolom `plan` dan `plan_limits`.
- `packages/ui`: komponen, tema, ikon, dan terjemahan bersama.

## Temuan akses dan pricing

- Fitur dashboard tidak dipaywall berdasarkan paket. Akses fitur ditentukan oleh role dan permission; kontrol ini harus tetap aktif.
- Presentasi paket berbayar berada di situs marketing, status paket di Settings, dan kartu batas plan pada halaman toko.
- Struktur `companies.plan` dan `companies.plan_limits` tetap dipertahankan sebagai fondasi monetisasi masa depan.
- Batas pembuatan perusahaan merupakan guardrail operasional/anti-abuse, bukan kunci fitur dashboard.

## Perubahan fase gratis

- Halaman `/harga` dan alias `/pricing` diarahkan permanen ke beranda.
- Bagian tiga paket dan metode pembayaran tidak lagi dirender.
- Beranda kini menjelaskan akses penuh gratis selama masa peluncuran.
- Settings menampilkan status `GRATIS` dan tidak lagi meminta endpoint plan.
- Tombol tambah toko tidak lagi disembunyikan oleh data plan; permission `store.manage` tetap wajib.
- Ketentuan layanan menjelaskan kemungkinan perubahan model layanan dengan pemberitahuan dan masa transisi.

## Audit SEO teknis

Sudah tersedia: canonical URL, robots.txt, sitemap XML, metadata per rute, Open Graph, Twitter Card, manifest, schema Organization, WebSite, SoftwareApplication, FAQ, dan breadcrumb.

Peningkatan pada perubahan ini:

- Fokus judul dan keyword intent pada dashboard bisnis gratis untuk UMKM.
- Schema `Offer` harga Rp0 untuk status akses saat ini.
- URL harga lama dihapus dari sitemap dan dialihkan 301 untuk mencegah halaman tipis/duplikat.
- Copy beranda diperjelas untuk POS, stok, laporan, operasional, serta akses gratis.

## Risiko dan tindak lanjut SEO

- Situs masih berupa client-rendered SPA. Google dapat merender JavaScript, tetapi pre-render/SSR untuk halaman marketing akan memberi HTML awal yang lebih konsisten bagi crawler dan social bot.
- Domain produksi masih `niagantara-web.pages.dev`. Sebelum ekspansi konten, pindahkan canonical, sitemap, Search Console, dan redirect ke domain utama yang stabil.
- Ranking tidak dapat dijamin cepat hanya dengan menambah banyak keyword. Prioritas berikutnya adalah halaman konten unik berdasarkan intent (aplikasi kasir UMKM, stok barang, multi-cabang, laporan penjualan), bukti penggunaan nyata, backlink relevan, Core Web Vitals, dan pengiriman sitemap melalui Google Search Console.
- Saat monetisasi diaktifkan, buat satu feature flag server-side untuk enforcement paket, migrasikan akun secara eksplisit, lalu aktifkan kembali UI harga. Jangan menggunakan UI saja sebagai kontrol akses.

