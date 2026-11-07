# AGENTS.md — UNDANG-UNDANG DISIPLIN MUTLAK & ANTI-DOSA REKAYASA
## BADAK LNG PLANT-3 OTS & AI C3MR OPTIMIZATION SUITE

Dokumen ini adalah undang-undang tertinggi dan konstitusi operasional yang **WAJIB DIPATUHI OLEH SETIAP AGENT AI TANPA PENGECUALIAN**. Dilarang keras melakukan asumsi fiktif, mengarang angka gaib, memalsukan model Machine Learning, membuat jalan pintas malas, atau menulis kode yang merusak keabsahan ilmiah dan keselamatan proses LNG.

---

## BAB I: HUKUM ANTI-DOSA REKAYASA (THE 7 SINS OF ENGINEERING AI)

### Pasal 1: Haram Angka Gaib & Pengali Arbitrer (Zero Magic Numbers)
1. **DILARANG KERAS** mengarang angka pengali, eksponen tebakan, atau faktor pembagi tanpa rujukan dataset atau hukum fisika pertama.
   - *Contoh Dosa Fatal:* `reboilerDuty * 6.5`, `condenserDuty * 6.2`, `Math.pow(vaporLoading, 1.8)`, `chillerDuty / 7.0 * 25.23`.
2. Setiap konstanta, koefisien polynomial, dan parameter dalam kode **WAJIB BERSUMBER DARI**:
   - Dataset operasional aktual (`scrubcolumn.xlsx`, `OTSMINI.xlsx`, `master_minute_level.parquet`).
   - Persamaan Termodinamika & EOS resmi (Peng-Robinson EOS, CoolProp, NeqSim, Steam Tables).
   - Datasheet instrumen Badak LNG (`Plant3_Instrumentation_Tag_List.xlsx`).

### Pasal 2: Haram Pseudo-ML & Regresi Palsu (Zero Fake Regression)
1. **DILARANG KERAS** meloloskan model surrogate ML yang memiliki performa defektif ($R^2 < 0.60$) atau melatih model tanpa pemisahan dataset valid (`train_test_split`).
2. **DILARANG KERAS** memprediksi laju akumulasi/integrasi (`LIC2_rate`) dengan mengecualikan variabel fisik penentu utama (seperti mengabaikan level cairan `LIC2` dan bukaan valve `LIC2MV`, lalu memasukkan aliran gas `FI4` yang korelasi fisiknya $0.0008$).
3. Setiap model surrogate **WAJIB** dievaluasi dengan partisi data 80:20 (atau split kronologis) dan melaporkan metrik independen pada test set:
   $$\text{Syarat Lolos: } R^2_{\text{test}} \ge 0.60, \quad \text{MAE} < 1.0, \quad \text{Feature Correlation } |r| \ge 0.30$$

### Pasal 3: Haram Memalsukan Komposisi Gas & Analyzer (Zero Invented Gas Compositions)
1. **DILARANG KERAS** menulis nilai default komposisi gas atau analyzer stream (`AI25A-H`, `AI21`, `AI23`) yang bertentangan dengan data DCS.
2. Komposisi baseline overhead gas Scrub Column (3C-1) di `DistillationColumn.ts` **WAJIB PERSIS** median 65.535 baris data riil `scrubcolumn.xlsx`:
   - $N_2$ (`AI25A`): **$0.0536\text{ mol\%}$** *(bukan 0.14%)*
   - $C_1$ (`AI25B`): **$94.5096\text{ mol\%}$** *(bukan 90.89%)*
   - $C_2$ (`AI25C`): **$2.7181\text{ mol\%}$** *(bukan 5.18%)*
   - $C_3$ (`AI25D`): **$1.6738\text{ mol\%}$** *(bukan 2.72%)*
   - $iC_4$ (`AI25E`): **$0.3913\text{ mol\%}$** *(bukan 0.50%)*
   - $nC_4$ (`AI25F`): **$0.5426\text{ mol\%}$** *(bukan 0.51%)*
   - $iC_5$ (`AI25G`): **$0.000157\text{ mol\%}$** *(bukan 0.04%)*
   - $\text{HHV}$ (`AI25H`): **$1076.3876\text{ BTU/scf}$** *(bukan 1102.5 BTU/scf)*
3. Slip fraksi berat ($C_3+$) saat gangguan termal **WAJIB** mengikuti kesetimbangan termodinamika VLE (kurva volatilitas relatif eksponensial), dilarang memakai slip linier buatan (`c3 = 2.72 + slip * 0.85`).

### Pasal 4: Haram Offset Statis Penipuan Termal (Zero Fake Delta Offsets)
1. **DILARANG KERAS** mengganti pemodelan tray distilasi dengan menambahkan/mengurangkan selisih offset statis terhadap suhu bawah (Contoh dosa penipuan: `TIC3 = bottomTemp - 28.55`, `TI197 = bottomTemp - 9.08`, `TI174 = bottomTemp + 2.99`).
2. Gradien suhu kolom (De-Ethanizer, De-Propanizer, De-Butanizer) **WAJIB** dihitung secara terkopel terhadap neraca panas tray:
   $$T_i = T_{\text{top}} + \alpha_i \cdot (T_{\text{bottom}} - T_{\text{top}})$$
   di mana parameter tray $\alpha_i$ dikalibrasi dari DCS dan dipengaruhi oleh rasio refluks aktual serta masukan panas reboiler.
3. **DILARANG KERAS** membekukan 14 tag menjadi konstanta statis tanpa dinamika fisik (`TI177 = -37.16`, `TI165 = 43.07`, dsb.).

### Pasal 5: Kepatuhan Mutlak pada First-Principles Manual Book (First-Principles Ground Truth)
Setiap pemodelan dan optimasi siklus pendinginan C3MR **WAJIB MEMATUHI 10 MODUL DI `MANUAL_BOOK_AI_C3MR_OPTIMIZATION.md`**:
- **Modul 2 (MCHE Pinch):** PR-EOS Enthalpy Departure & 100-slice pinch analysis. Batas minimum $\text{MITA} \ge 1.50^\circ\text{C}$; haram terjadi temperature crossover ($\Delta T \le 0$).
- **Modul 3 (Compressor Anti-Surge):** Kompresor sentrifugal C3 (4K-1/2/3) dan MCR (4K-4) wajib mematuhi safe operating envelope flow floor $480.0\text{ t/h}$, modulasi kickback valve 4UV-53, dan perhitungan daya poros isentropik:
  $$\dot{W}_{\text{shaft}} = \frac{\dot{m} \cdot \Delta h_s}{\eta_p}$$
- **Modul 4 (Suction Drum Safety):** Interlock Temperature Alarm Low (TAL) suction drum:
  $$T_{\text{suct}} \ge -45.0^\circ\text{C}$$
  Reheat valve 4TV-510 wajib membuka proporsional jika $T_{\text{suct}}$ mendekati batas bawah untuk mencegah *liquid carryover* ke impeller.
- **Modul 5 (Compositional Geometry):** Transformasi Aitchison Isometric Log-Ratio (ILR) pada ruang Simpleks $S^D$ dan verifikasi Mahalanobis Distance:
  $$D_M = \sqrt{(\mathbf{z} - \boldsymbol{\mu})^T \boldsymbol{\Sigma}^{-1} (\mathbf{z} - \boldsymbol{\mu})} \le 3.0802 \quad (\chi^2_{0.95, 6})$$
  Haram merekomendasikan komposisi refrigeran di luar elipsoid operasional kilang Badak.
- **Modul 6 (Surrogate Architecture):** Model surrogate wajib menerapkan batasan monoton (`monotonic_cst`) pada variabel fisik searah.
- **Modul 7 (Barrier Reward Engine):** Log-barrier penalty untuk pelanggaran batasan operasional kilang.

### Pasal 6: Haram Pemalsuan Mimic, Grafik DCS & PFD (Zero Fake Mimics & PFD Deviations)
1. **DILARANG KERAS** membuat mimic DCS, layout grafis SVG, perpipaan, dan tata letak instrumen secara malas, asal-asalan, atau perkiraan kasar yang menyimpang dari tampilan asli Yokogawa Centum DCS dan PFD (Picture2.png, Picture3.png, Picture4.png).
2. **Geometri Peralatan & Jalur Perpipaan Wajib Presisi:**
   - Bentuk kolom distilasi wajib mengikuti desain rekayasa riil: 3C-4 wajib memiliki stepped swage (rectification atas sempit, stripping/sump bawah lebar), sedangkan 3C-6 dan 3C-8 berupa kolom fraksinasi vertikal proporsional dengan dome hemispherical. Haram membuat reboiler/kondensor berbentuk blob sembarangan atau kolom pill-box generik.
   - Penukar panas (3E-14, 3E-4, 3E-5, 3E-17, 3E-6, 3E-7, 3E-8, 3E-9, 3E-10) wajib menggunakan simbol shell-and-tube resmi atau kettle reboiler yang akurat beserta nozzle utilitas (CW, LP STM, MLP STM, COND).
   - Pompa sentrifugal (3G-2A/B, 3G-6A/B/C, 3G-7A/B, 3G-11A/B) wajib memiliki simbol motor 'M', indikator status running/tripped (hijau/merah), dan pembacaan motor current (Amps) yang terhubung ke model fisik/simulasi (haram angka statis fiktif).
   - Palet warna wajib patuh pada standar Yokogawa Centum VP: Background #000000, Equipment outline #00ff00, Process fluid lines cyan (#00ffff / #ffffff) atau magenta (#d946ef / #e879f9) untuk C3/C4, LP STM kuning (#ffff00), COND oranye (#e69138), Alarm merah (#ff1e1e), Liquid level fill biru/pink real-time.
3. **Haram Piping Ganda (Zero Ghost Piping):**
   - Dilarang keras menimpa pipa hardcode SVG dengan garis 'ghost' dari layout editor yang tidak sinkron koordinatnya. Satu sistem grafis hanya boleh memiliki satu sumber kebenaran perpipaan.

### Pasal 7: Haram Mengacak-acak Ruang Lingkup & Modul di Luar Instruksi (Zero Scope Creep & Strict Boundary Enforcement)
1. **DILARANG KERAS** menyentuh, mengubah, mereset, atau memodifikasi modul, grafik DCS, state store, atau file yang berada di luar ruang lingkup yang diperintahkan secara eksplisit oleh instruksi pengguna.
2. **Kepatuhan Batas Perintah Eksplisit:**
   - Jika pengguna secara spesifik memerintahkan pengerjaan pada kolom De-Ethanizer (3C-4), De-Propanizer (3C-6), dan De-Butanizer (3C-8), maka modul Scrub Column (3C-1 / GRH0033), Refrigeration Cycle (4K-1/2/3/4), dan modul lainnya **MUTLAK TERLARANG DIUBAH ATAU DI-RESET**.
   - **Haram Menaikkan Storage Keys Sembarangan:** Dilarang menaikkan storage key (`STORAGE_KEY_LAYOUTS`, `STORAGE_KEY_LINES`, `STORAGE_KEY_SYMBOLS`, dsb.) secara sembrono yang berakibat mereset atau menghapus konfigurasi grafis/posisi instrumen modul lain di browser pengguna. Jika perlu pembaruan key, wajib dilakukan per-screen atau backward-compatible.
   - Setiap perbaikan wajib terisolasi strictly pada modul target (*strictly scoped diff*).

---

## BAB II: INTEGRASI SKILLS & DISIPLIN OPERASIONAL

### 1. `/unlazy` — Disiplin Penyelesaian Tuntas Tanpa Pemalas
*Filosofi:* Pekerjaan yang tidak tuntas adalah kegagalan mutlak. Buktikan hasil dengan acceptance ledger eksplisit (`GATES.md`), bukan dengan laporan kata-kata manis.
- **Tulis Gates Sebelum Eksekusi:** Buat acceptance gates yang memiliki perintah runnable `CHECK:` dan kondisi sukses eksplisit `EXPECT:`.
- **4-Pass Execution Model:**
  1. *Pass 1 (Complete Deliverable):* Implementasikan seluruh fitur dan fungsi secara utuh. Dilarang meninggalkan `// TODO`, `// nanti dilengkapi`, placeholder, atau fungsi kosong.
  2. *Pass 2 (Domain Expert Review):* Tinjau ulang kode dari perspektif *principal process engineer*. Ganti semua pendekatan instan/amatir dengan first-principles fisika.
  3. *Pass 3 (Defect Hunting):* Audit mendalam terhadap akurasi numerik, integrasi lintas file, penanganan edge case, memory leak, dan portabilitas OS.
  4. *Pass 4 (Low-Cost Polish & Re-verify):* Rapikan struktur kode, jalankan kembali seluruh gates verification, dan pastikan bukti lulus tervalidasi.
- **Authoring Gates Yang Dapat Gagal Jujur:** Gate harus mampu mendeteksi kegagalan secara nyata; dilarang membuat verifikasi tautologis yang selalu return true.

### 2. `/caveman` — Suara Ringkas, Padat Fakta, Tanpa Basa-Basi
*Filosofi:* Output token berharga mahal. Semua substansi teknis bertahan utuh; hanya basa-basi dan etiket kosong yang dimatikan.
- **Pola Jawaban Langsung:** `[objek] [tindakan] [alasan]. [langkah berikutnya].`
- **Hapus Basa-Basi:** Dilarang menyapa ("Halo!", "Tentu!"), meminta maaf ("Maaf atas kekeliruan"), atau menutup dengan basa-basi ("Semoga membantu!").
- **Pertahankan Payload 100%:** Angka desimal, satuan proses, file path absolut/relatif, nama tag DCS, nama fungsi/kelas, rumus matematika, dan pesan error terminal wajib disajikan persis tanpa disingkat.
- **Satu Ide Per Kalimat:** Bahasa aktif, ringkas, maksimal 20 kata per kalimat. Jika keringkasan bertentangan dengan kejelasan teknis, kejelasan teknis mutlak menang.
- **Dilarang Roleplay:** Jangan menirukan manusia purba kartun ("me think", "caveman on"). Bicaralah seperti senior engineer yang sangat sibuk di control room kilang.

### 3. `/ml-best-practices` — Higienitas & Integritas Machine Learning
*Filosofi:* Integritas model ditentukan oleh higienitas data dan validasi yang jujur terhadap realitas industri.
- **Strict Featurization Ordering:** Selalu lakukan pemisahan dataset (Train vs Test 80:20 atau Train/Val/Test temporal) **SEBELUM** melakukan fitting scaler (StandardScaler/MinMaxScaler), imputer, atau encoder. Preprocessing fitted pada data uji adalah dosa *data leakage*.
- **Pencegahan Leakage:** Dilarang memasukkan variabel masa depan, label target turunan, atau ID kelompok ke dalam matriks fitur regresi.
- **Analisis Null & Outlier:** Selidiki frekuensi dan pola hilangnya data. Jangan melakukan `dropna()` membabi-buta jika merusak kontinuitas deret waktu sensor.
- **Model Comparison Mandate:** Bandingkan performa terhadap baseline sederhana (Mean/Ridge) sebelum mengklaim keunggulan model non-linear.
- **Pelaporan Metrik Wajib:** Laporkan $R^2$, MAE, RMSE, dan kurva residual pada test set independen. Tolak model jika $R^2 < 0.60$.

### 4. `/ml-training-recipes` — Resep Pelatihan Model Tabular & Debugging
*Filosofi:* Resep pelatihan yang tepat mengalahkan kompleksitas arsitektur model.
- **Model Selection untuk Tabular Process Data:** Gunakan `HistGradientBoostingRegressor` (atau `LightGBM`/`XGBoost`) dengan batasan monotonik fisika (`monotonic_cst`), atau `Ridge` berfitur fisik untuk surrogate linier cepat di browser.
- **Karpathy's Canonical Debugging Recipe:**
  1. *Become one with the data:* Plot distribusi fitur, cek korelasi Pearson/Spearman terhadap target, verifikasi rentang fisik sensor (misal: suhu LNG tidak boleh di atas $0^\circ\text{C}$).
  2. *End-to-end running:* Pastikan pipeline training hingga prediksi berjalan mulus pada data kecil.
  3. *Overfit one batch:* Pastikan model mampu mencapai loss mendekati nol pada sampel kecil; jika gagal, terdapat bug mendasar pada arsitektur atau loss function.
  4. *Regularize:* Tambahkan regularisasi ($L_2$, `min_samples_leaf`) hanya setelah kemampuan fitting terbukti.
  5. *Systematic Hyperparameter Tuning:* Prioritaskan tuning learning rate terlebih dahulu, kemudian regularisasi dan kedalaman pohon.
- **Divergence Fast-Fail:** Pantau nilai gradient norm dan loss. Jika loss menghasilkan NaN/Infinity atau meledak, hentikan training seketika dan periksa masukan data serta learning rate.

### 5. `/ponytail-audit` — Audit Repositori Ala Principal Engineer
*Filosofi:* Audit sistematis tanpa ampun terhadap kelemahan, kepalsuan, dan bloatware kode.
- **3 Tingkat Prioritas Temuan:**
  1. **Must Fix:** Bug kritis, angka palsu/gaib, model pseudo-ML rusak, bahaya keamanan proses, kalkulasi neraca massa/energi yang bocor.
  2. **Should Fix:** Heuristik tanpa kalibrasi, penggabungan tanggung jawab modul yang semrawut, konstanta waktu buatan yang tidak cocok dengan dinamika kilang.
  3. **Nice to Have:** Pembersihan tag mati (*lean -N lines*), simplifikasi wrapper berlebihan, penggabungan fungsi duplikat.
- **Standar Sitasi Konkret:** Setiap temuan audit wajib menyertakan path `file:baris`, kutipan blok kode yang bersalah, penjelasan ilmiah mengapa kode itu salah, dan rancangan kode pengganti yang benar.

### 6. `/ponytail` — Filosofi Senior Dev: Kode Paling Bersih Adalah Kode Paling Sedikit
*Filosofi:* Selesaikan 100% masalah pengguna dengan perubahan kode seminimal mungkin (*minimal working diff*).
- **Penghapusan Mengalahkan Penambahan:** Pangkas kode mubazir daripada menambah lapisan wrapper, adaptor, atau factory baru yang tidak diminta.
- **Manfaatkan Platform Asli:** Gunakan fungsi bawaan bahasa (TypeScript/Python/Node.js) dan pustaka yang sudah terpasang di repositori. Jangan menambah dependensi npm/pip baru untuk pekerjaan beberapa baris.
- **Dokumentasikan Limitasi Sadar:** Jika terpaksa mengambil jalan pintas dengan batas tertentu, wajib tandai dengan format:
  `// shortcut: <limitasi teknis>, <kapan harus di-upgrade>`
- **Area Terlarang Dipangkas:** Dilarang memangkas validasi batas aman, penanganan error keselamatan, akurasi kalibrasi instrumen, dan fitur yang diminta pengguna.

### 7. `/plan` — Rencana Matang Sebelum Eksekusi
*Filosofi:* Bertindak tanpa rencana tertulis adalah sumber malapetaka rekayasa.
- **Wajib Buat Artefak Desain Teknis:** Untuk setiap perubahan signifikan, buat artefak rencana (`.md`) yang menguraikan:
  - Daftar file yang akan diubah (`[MODIFY]`), dibuat (`[NEW]`), atau dihapus (`[DELETE]`).
  - Landasan teori fisika dan formulasi matematika pengganti.
  - Rencana verifikasi otomatis (*automated verification plan*) dan verifikasi manual (*manual verification walkthrough*).
- **Pintu Persetujuan Pengguna:** Pasang `RequestFeedback: true` pada artefak rencana dan tunggu konfirmasi pengguna sebelum mengeksekusi perubahan kode pada repositori.

---

## BAB III: PROTOKOL PENJAGA MUTU (VERIFICATION GATES)

Setiap modifikasi kode pada repositori ini **WAJIB LOLOS 4 PINTU VERIFIKASI** sebelum diserahkan kepada pengguna:

1. **Pintu 1 (Dataset Ground Truth Gate):**
   Setiap konstanta, baseline sensor, dan koefisien regresi wajib terbukti secara matematis bersumber dari `scrubcolumn.xlsx`, `OTSMINI.xlsx`, atau manual operasi Badak LNG.
2. **Pintu 2 (Static Typing & Compilation Gate):**
   Jalankan kompilasi TypeScript:
   ```cmd
   cmd /c "npm run build"
   ```
   Wajib menghasilkan exit code 0 tanpa error tipe data atau penggunaan tipe `any` sembarangan.
3. **Pintu 3 (Automated Test Suite Gate):**
   Jalankan seluruh rangkaian uji unit dan integrasi:
   ```cmd
   cmd /c "npm test"
   ```
   Seluruh test case fisika, hidraulika, dan termodinamika wajib lulus (*all green*).
4. **Pintu 4 (Dynamic Simulation & Bounded State Gate):**
   Simulator web di `http://localhost:3000/` harus berjalan stabil:
   - Nilai seluruh sensor berada dalam rentang wajar (tidak NaN, null, atau Infinity).
   - Respon transien terhadap gangguan bukaan valve, trip kompresor, atau perubahan laju umpan menunjukkan dinamika fisik yang realistis.

---

## BAB IV: PENEGAKAN HUKUM & SANKSI SISTEM

1. Pelanggaran terhadap salah satu pasal dalam Bab I dikategorikan sebagai **Cacat Rekayasa Berat**.
2. Apabila agent kedapatan menulis angka gaib, membuat regresi tipu-tipu, atau membekukan sensor menjadi offset statis:
   - Kode yang dihasilkan dianggap tidak sah dan wajib dibatalkan (*revert*).
   - Agent wajib melakukan audit ulang menyeluruh menggunakan prosedur `/ponytail-audit` dan `/unlazy` hingga seluruh bukti kelayakan terpenuhi.
