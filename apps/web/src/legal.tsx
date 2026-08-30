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
          <div className="legal-updated">{t('website.legal.updated')}</div>
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
      <p className="lead">
        NIAGANTARA (&ldquo;kami&rdquo;, &ldquo;kita&rdquo;, atau &ldquo;platform&rdquo;) berkomitmen melindungi privasi Anda.
        Kebijakan ini menjelaskan secara transparan bagaimana kami mengumpulkan, menggunakan, menyimpan, membagikan, dan
        melindungi data pribadi yang Anda percayakan kepada kami ketika menggunakan situs web, aplikasi, dan layanan
        NIAGANTARA.
      </p>

      <h2>1. Data yang kami kumpulkan</h2>
      <p>
        Kami mengumpulkan data secara langsung dan tidak langsung, hanya sebatas yang diperlukan untuk menyediakan dan
        meningkatkan layanan, antara lain:
      </p>
      <p>
        <strong>Data akun</strong> — nama, alamat email, nomor telepon, kata sandi (di-hash), serta preferensi bahasa.
        Data ini digunakan untuk autentikasi dan identifikasi pengguna.
      </p>
      <p>
        <strong>Data organisasi &amp; bisnis</strong> — nama perusahaan atau cabang, keanggotaan, peran (role), dan data
        operasional yang dimasukkan oleh pengguna berwenang seperti produk, stok, penjualan, pembelian, keuangan, dan
        pelanggan. Data ini diproses atas dasar perintah dan kendali pengguna atau pemilik akun.
      </p>
      <p>
        <strong>Data autentikasi &amp; keamanan</strong> — catatan autentikasi, alamat IP, perangkat, dan metadata sesi
        untuk mencegah akses tidak sah dan mendeteksi aktivitas mencurigakan.
      </p>
      <p>
        <strong>Data teknis</strong> — log operasional, data diagnostik, dan statistik penggunaan agregat yang tidak
        mengidentifikasi individu secara langsung.
      </p>

      <h2>2. Integrasi Google (Google Sheets)</h2>
      <p>
        Saat Anda menghubungkan akun Google untuk pelaporan, kami hanya meminta izin yang benar-benar diperlukan
        (scope minimum): identitas email dan akses Google Sheets. Kami tidak mengakses email, kontak, Drive, atau data
        Google lainnya di luar kebutuhan pelaporan.
      </p>
      <p>
        Token akses <em>refresh</em> dienkripsi saat disimpan dan tidak pernah ditampilkan ke browser atau aplikasi
        klien. Anda dapat mencabut akses kapan saja melalui pengaturan akun Google atau melalui pusat kontrol akun
        NIAGANTARA.
      </p>

      <h2>3. Penggunaan dan dasar hukum pemrosesan</h2>
      <p>
        Kami memproses data pribadi berdasarkan dasar hukum yang sesuai, termasuk: pelaksanaan kontrak (penyediaan
        layanan yang Anda minta), persetujuan (misalnya komunikasi pemasaran), kewajiban hukum, dan kepentingan sah
        (seperti keamanan sistem dan pencegahan penipuan).
      </p>

      <h2>4. Pembagian data</h2>
      <p>
        Kami tidak menjual data pribadi Anda. Kami hanya berbagi data kepada pihak ketiga tepercaya untuk tujuan
        menjalankan layanan, misalnya:
      </p>
      <p>
        <strong>Penyedia infrastruktur</strong> — Supabase (basis data dengan Row Level Security) dan penyedia hosting,
        yang terikat perjanjian kerahasiaan dan pemrosesan data.
      </p>
      <p>
        <strong>Pihak berwenang</strong> — hanya jika diwajibkan oleh hukum dan sejauh diizinkan undang-undang yang
        berlaku.
      </p>

      <h2>5. Hak Anda</h2>
      <p>
        Sesuai undang-undang perlindungan data yang berlaku (antara lain UU Perlindungan Data Pribadi No. 27 Tahun 2022
        di Indonesia), Anda berhak atas: akses, perbaikan, penghapusan, pembatasan pemrosesan, portabilitas data, dan
        penarikan persetujuan. Anda juga berhak mengajukan pengaduan kepada otoritas pengawas.
      </p>

      <h2>6. Keamanan data</h2>
      <p>
        Kami menerapkan langkah-langkah teknis dan organisasi yang sesuai, termasuk autentikasi, kontrol akses berbasis
        peran (RBAC), isolasi penyewa (tenant) dan cabang, audit logging, security events, enkripsi saat transit dan
        saat disimpan, serta Row Level Security pada basis data. Silakan lihat halaman <Link to="/security">Laporan
        Keamanan</Link> kami untuk detail lebih lanjut.
      </p>

      <h2>7. Retensi data</h2>
      <p>
        Data disimpan hanya selama diperlukan untuk memenuhi tujuan yang dijelaskan dalam kebijakan ini atau selama
        diwajibkan oleh hukum. Ketika data tidak lagi diperlukan, kami menghapus atau menganonimkannya dengan aman.
      </p>

      <h2>8. Cooky dan pelacakan</h2>
      <p>
        Kami menggunakan cookie dan teknologi serupa untuk fungsi dasar (misalnya menyimpan bahasa dan sesi) serta untuk
        memahami penggunaan situs. Anda dapat mengelola cookie melalui pengaturan browser. Kami mematuhi permintaan
        &ldquo;Do Not Track&rdquo; bila tersedia.
      </p>

      <h2>9. Transfer internasional</h2>
      <p>
        Kecuali untuk fungsi pelaporan Google Sheets yang Anda pilih sendiri, data utama disimpan pada penyedia dengan
        standar keamanan yang setara. Setiap transfer data lintas negara dilakukan dengan mitigasi yang sesuai hukum.
      </p>

      <h2>10. Privasi anak-anak</h2>
      <p>
        Layanan NIAGANTARA ditujukan untuk pengguna bisnis dewasa. Kami tidak secara sengaja mengumpulkan data pribadi
        anak-anak di bawah usia yang diatur peraturan. Bila Anda meyakini kami telah mengumpulkannya, segera hubungi
        kami.
      </p>

      <h2>11. Perubahan kebijakan</h2>
      <p>
        Kami dapat memperbarui kebijakan ini sewaktu-waktu untuk mencerminkan perubahan layanan atau hukum. Perubahan
        signifikan akan kami informasikan melalui situs atau email. Tanggal &ldquo;terakhir diperbarui&rdquo; di atas
        menunjukkan versi yang berlaku.
      </p>

      <h2>12. Kontak</h2>
      <p>Untuk pertanyaan, permintaan akses data, atau pengaduan privasi, hubungi kami di{' '}
        <a href="mailto:privacy@niagantara.com">privacy@niagantara.com</a>.
      </p>
    </Legal>
  );
}

export function TermsPage() {
  const { t } = useTranslation();
  return (
    <Legal>
      <h1>{t('website.legal.termsTitle')}</h1>
      <p className="lead">
        Syarat &amp; Ketentuan ini (&ldquo;S&nbsp;&amp;&nbsp;K&rdquo;) merupakan perjanjian yang mengikat antara Anda
        (&ldquo;pengguna&rdquo;, &ldquo;Anda&rdquo;, atau &ldquo;langganan&rdquo;) dan NIAGANTARA sehubungan dengan
        penggunaan platform NIAGANTARA. Dengan mendaftar atau menggunakan layanan, Anda menyatakan telah membaca,
        memahami, dan menyetujui seluruh ketentuan berikut.
      </p>

      <h2>1. Penerimaan dan perubahan ketentuan</h2>
      <p>
        Dengan mengakses atau menggunakan layanan, Anda setuju terikat oleh S&nbsp;&amp;&nbsp;K ini beserta Kebijakan
        Privasi kami. Kami dapat memperbarui S&nbsp;&amp;&nbsp;K ini dari waktu ke waktu; perubahan signifikan akan
        disampaikan kepada Anda. Penggunaan berkelanjutan setelah perubahan berarti Anda menerima ketentuan terbaru.
      </p>

      <h2>2. Deskripsi layanan</h2>
      <p>
        NIAGANTARA menyediakan platform operasional bisnis terintegrasi, termasuk titik penjualan (POS), pengelolaan
        stok, pembelian, keuangan, pelanggan, cabang, pelaporan, dan sinkronisasi Google Sheets, dengan data utama yang
        disimpan pada basis data Supabase.
      </p>

      <h2>3. Pendaftaran dan keamanan akun</h2>
      <p>
        Anda menjamin informasi pendaftaran yang Anda berikan akurat dan terkini. Anda bertanggung jawab menjaga
        kerahasiaan kredensial, tidak membagikannya, dan segera melaporkan akses tanpa izin. Anda bertanggung jawab atas
        seluruh aktivitas yang terjadi pada akun Anda.
      </p>

      <h2>4. Penggunaan yang diizinkan dan perilaku</h2>
      <p>Anda setuju menggunakan layanan dengan sah, wajar, dan tidak:</p>
      <ul>
        <li>melanggar hukum atau peraturan yang berlaku;</li>
        <li>mengirimkan atau memproses data secara melanggar hak pihak ketiga;</li>
        <li>mencoba mengakses sistem tanpa izin, melakukan peretasan, atau mengeksploitasi kerentanan;</li>
        <li>menyalahgunakan, memuat berlebihan, atau mengganggu layanan;</li>
        <li>menggunakan layanan untuk tujuan yang bertentangan dengan ketentuan ini.</li>
      </ul>

      <h2>5. Data bisnis dan sumber data</h2>
      <p>
        Anda bertanggung jawab atas akurasi, legalitas, dan hak atas data yang Anda masukkan. Catatan pada basis data
        Supabase tetap menjadi sumber data utama; Google Sheets hanya merupakan lapisan pelaporan. Anda memegang
        kendali atas data bisnis Anda dan dapat mengekspornya melalui fitur yang tersedia.
      </p>

      <h2>6. Hak kekayaan intelektual</h2>
      <p>
        Seluruh perangkat lunak, antarmuka, desain, logo, merek, dan konten platform adalah milik NIAGANTARA atau
        pemberi lisensinya dan dilindungi hukum kekayaan intelektual. Anda memperoleh lisensi terbatas untuk
        menggunakan layanan sesuai S&nbsp;&amp;&nbsp;K ini dan tidak berhak menyalin, mengubah, atau mendistribusikan
        kembali platform tanpa izin tertulis.
      </p>

      <h2>7. Langganan, biaya, dan pembayaran</h2>
      <p>
        Beberapa fitur memerlukan paket berbayar. Biaya, jangka waktu, dan syarat paket dijelaskan di halaman harga dan
        dapat berubah dengan pemberitahuan wajar. Keterlambatan pembayaran dapat mengakibatkan pembatasan layanan.
      </p>

      <h2>8. Jaminan dan batasan tanggung jawab</h2>
      <p>
        Layanan disediakan &ldquo;sebagaimana adanya&rdquo; sesuai standar upaya yang wajar. Sejauh diizinkan hukum,
        NIAGANTARA tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul
        dari penggunaan layanan. Tanggung jawab kami dibatasi hingga jumlah yang Anda bayarkan dalam periode terkait.
      </p>

      <h2>9. Penghentian</h2>
      <p>
        Anda dapat menghentikan penggunaan kapan saja. Kami dapat menangguhkan atau menghentikan akses atas pelanggaran
        serius terhadap S&nbsp;&amp;&nbsp;K ini atau aktivitas yang membahayakan layanan. Ketentuan yang secara alamiah
        tetap berlaku setelah penghentian (seperti kerahasiaan dan batasan tanggung jawab) akan terus berlaku.
      </p>

      <h2>10. Hukum yang berlaku dan penyelesaian sengketa</h2>
      <p>
        S&nbsp;&amp;&nbsp;K ini diatur oleh hukum Republik Indonesia. Setiap sengketa akan diupayakan diselesaikan
        secara musyawarah terlebih dahulu, kemudian melalui penyelesaian di pengadilan yang berwenang sesuai hukum yang
        berlaku.
      </p>

      <h2>11. Lain-lain</h2>
      <p>
        Apabila sebagian ketentuan dianggap tidak sah, ketentuan lainnya tetap berlaku. Kegagalan kami menegakkan suatu
        ketentuan tidak berarti melepaskan hak tersebut. Seluruh komunikasi resmi akan dikirim ke alamat email yang
        Anda daftarkan.
      </p>

      <h2>12. Kontak</h2>
      <p>Untuk pertanyaan seputar layanan atau ketentuan ini, hubungi kami di{' '}
        <a href="mailto:support@niagantara.com">support@niagantara.com</a>.
      </p>
    </Legal>
  );
}

export function SecurityReportPage() {
  const { t } = useTranslation();
  return (
    <Legal>
      <h1>{t('website.legal.securityTitle')}</h1>
      <p className="lead">
        Keamanan adalah prioritas kami. Kami mengundang peneliti keamanan, pelanggan, dan pengguna untuk melaporkan
        kerentanan secara bertanggung jawab agar kami dapat melindungi seluruh pengguna NIAGANTARA. Halaman ini
        menjelaskan cara melaporkan dan komitmen kami dalam menangani setiap laporan.
      </p>

      <h2>Komitmen keamanan kami</h2>
      <p>
        NIAGANTARA menerapkan pendekatan keamanan berlapis: autentikasi yang kuat, kontrol akses berbasis peran (RBAC),
        isolasi penyewa (tenant) dan cabang, audit logging, security events, Row Level Security pada basis data
        Supabase, dan enkripsi data saat transit serta saat disimpan. Kami juga melakukan tinjauan keamanan secara
        berkala terhadap kode dan konfigurasi.
      </p>

      <h2>Kebijakan pengungkapan bertanggung jawab</h2>
      <p>
        Jika Anda menemukan potensi kerentanan, kami berharap Anda melaporkannya secara bekerja sama dan bertanggung
        jawab sebagai berikut:
      </p>
      <ul>
        <li>Laporkan melalui kanal resmi (di bawah) dan berikan waktu yang wajar bagi kami untuk menanganinya sebelum memublikasikan temuan;</li>
        <li>jangan mengeksploitasi, mengunduh massal, mengubah, atau menghapus data yang bukan milik Anda;</li>
        <li>jangan mengakses data pengguna lain atau melakukan pengujian yang mengganggu ketersediaan layanan;</li>
        <li>berikan detail yang jelas: langkah untuk mereproduksi, dampak, dan jenis kerentanan.</li>
      </ul>

      <h2>Cakupan laporan</h2>
      <p>
        Kami menerima laporan terkait aplikasi web NIAGANTARA, API, autentikasi dan kontrol akses, injeksi dan OWASP
        Top 10, serta praktik keamanan konfigurasi. Pengujian pada sistem pihak ketiga (misalnya Supabase atau Google)
        harus mematuhi kebijakan mereka masing-masing.
      </p>

      <h2>Proses dan respons</h2>
      <p>
        Kami akan mengonfirmasi penerimaan laporan dalam waktu 2 hari kerja dan bekerja secepatnya untuk memverifikasi,
        memperbaiki, dan merilis pembaruan. Untuk kerentanan yang valid, kami akan berkoordinasi mengenai waktu
        pengungkapan publik dan, bila sesuai, mengakui kontribusi Anda.
      </p>

      <h2>Cara melaporkan</h2>
      <p>
        Silakan kirim laporan ke jawaban email berikut dan sertakan rincian teknis di atas. Kami menjaga kerahasiaan
        pelapor dan informasi yang dibagikan selama proses penanganan.
      </p>
      <p>
        <strong>Keamanan:</strong> <a href="mailto:security@niagantara.com">security@niagantara.com</a>
      </p>
      <p>
        <strong>Privasi / data pribadi:</strong> <a href="mailto:privacy@niagantara.com">privacy@niagantara.com</a>
      </p>

      <h2>Kontak pengaman</h2>
      <p>
        Untuk laporan darurat keamanan yang membutuhkan perhatian segera, silakan gunakan kanal yang sama dengan subjek
        &ldquo;URGENT&rdquo;. Kami akan memberikan prioritas penanganan pada laporan yang mengancam keamanan data
        pengguna.
      </p>
    </Legal>
  );
}
