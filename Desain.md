# 🎨 Desain UI/UX — Aplikasi Kebeng

> Dokumen ini adalah panduan desain lengkap untuk aplikasi Kebeng.
> Berikan dokumen ini kepada AI agent bersama Blueprint.md sebelum mulai coding.

---

## 🪪 Identitas Aplikasi

| Properti | Detail |
|---|---|
| Nama App | **Kebeng** |
| Tagline | Catat. Analisis. Hemat. |
| Icon App | `ti-wallet` (Tabler Icons) + teks "Kebeng" warna aksen |
| Target Platform | Android |

---

## 🎨 Design System

### Tema
- **Mode**: Dark Mode only
- **Gaya**: Minimalis, clean, modern (Notion-inspired)
- **Kartu**: Rounded & Soft — border-radius besar, terasa friendly

### Palet Warna

| Nama | Hex | Fungsi |
|---|---|---|
| Background Utama | `#111111` | Latar belakang seluruh app |
| Background Kartu | `#1c1c1c` | Kartu, komponen |
| Background Kartu Aksen | `#0d1f16` | Kartu highlight AI / budget |
| Border | `#2a2a2a` | Garis batas kartu & komponen |
| Aksen Utama (Hijau Tosca) | `#2DD4A0` | Highlight, tombol utama, income |
| Aksen Hijau Gelap | `#0d3d2a` | Background icon kategori makanan/income |
| Teks Utama | `#f0f0f0` | Judul, angka penting |
| Teks Sekunder | `#888888` | Label, keterangan |
| Teks Tersier | `#555555` | Timestamp, hint |
| Merah (Pengeluaran) | `#f87171` | Nominal pengeluaran, warning |
| Background Merah | `#3d1515` | Icon kategori danger |
| Biru (Transport) | `#60aaee` | Icon kategori transport |
| Oranye (Belanja) | `#f0a040` | Icon kategori belanja |
| Ungu (Hiburan) | `#a078f0` | Icon kategori hiburan |
| Coklat (Kopi) | `#d4894a` | Icon kategori kopi/minuman |

### Tipografi

| Elemen | Ukuran | Weight | Warna |
|---|---|---|---|
| Judul Halaman | 18px | 500 | `#f0f0f0` |
| Angka Besar (saldo) | 28px | 500 | `#f0f0f0` atau aksen |
| Angka Sedang | 15px | 500 | `#f0f0f0` |
| Teks Normal | 13px | 400 | `#cccccc` |
| Label Kecil | 11px | 400 | `#666666` |
| Timestamp | 10px | 400 | `#555555` |
| Section Label | 11px | 400 | `#555555` (uppercase, letter-spacing 0.8px) |

### Spacing & Shape

| Properti | Nilai |
|---|---|
| Border Radius Kartu | 16px |
| Border Radius Icon Circle | 50% (bulat penuh) |
| Border Radius Tombol | 10px |
| Border Radius Pill/Badge | 20px |
| Border Kartu | `0.5px solid #2a2a2a` |
| Padding Kartu | 14px 16px |
| Gap antar Kartu | 12px |

---

## 🔤 Icon System

Semua icon menggunakan **Tabler Icons** (outline style).
**Dilarang menggunakan emoji sebagai icon UI.**

### Icon per Kategori Transaksi

| Kategori | Icon Tabler | Warna Icon | Background Icon |
|---|---|---|---|
| Makanan | `ti-tools-kitchen-2` | `#2DD4A0` | `#0d3d2a` |
| Minuman/Kopi | `ti-coffee` | `#d4894a` | `#1e1208` |
| Transport | `ti-bus` | `#60aaee` | `#0d2233` |
| Belanja | `ti-shopping-cart` | `#f0a040` | `#2a1a0d` |
| Hiburan | `ti-device-gamepad-2` | `#a078f0` | `#1e0d33` |
| Pemasukan | `ti-cash` | `#2DD4A0` | `#0d3d2a` |
| Kesehatan | `ti-heart-rate-monitor` | `#f87171` | `#3d1515` |
| Pendidikan | `ti-book` | `#60aaee` | `#0d2233` |
| Lainnya | `ti-dots-circle-horizontal` | `#888888` | `#222222` |

### Icon UI Umum

| Fungsi | Icon Tabler |
|---|---|
| Home / Dashboard | `ti-home` |
| Chat AI | `ti-message-circle` |
| Transaksi | `ti-list` |
| Laporan | `ti-chart-bar` |
| Pengaturan | `ti-settings` |
| Tambah (FAB) | `ti-plus` |
| Notifikasi | `ti-bell` |
| Cari | `ti-search` |
| Kamera / Foto Struk | `ti-camera` |
| Kirim Chat | `ti-send` |
| Konfirmasi / Simpan | `ti-check` |
| Edit | `ti-pencil` |
| Hapus | `ti-trash` |
| Download / Export | `ti-download` |
| Kalender | `ti-calendar` |
| AI / Robot | `ti-robot` |
| Pemasukan | `ti-arrow-down-circle` |
| Pengeluaran | `ti-arrow-up-circle` |
| Trending Naik | `ti-trending-up` |
| Trending Turun | `ti-trending-down` |
| Riwayat | `ti-history` |
| Budget Bulanan | `ti-calendar-month` |
| Tag Kategori | `ti-tag` |
| Export Excel | `ti-file-spreadsheet` |
| Chevron Kanan | `ti-chevron-right` |
| Wallet (Logo) | `ti-wallet` |
| Peringatan Budget | `ti-bell-exclamation` |
| Pengingat | `ti-bell-ringing` |

---

## 🧭 Navigasi

### Bottom Tab Bar
Posisi: bawah layar, selalu tampil di semua halaman utama.

| Urutan | Tab | Icon | Warna Aktif |
|---|---|---|---|
| 1 | Home | `ti-home` | `#2DD4A0` |
| 2 | Chat AI | `ti-message-circle` | `#2DD4A0` |
| — | FAB (tengah) | `ti-plus` | Background `#2DD4A0`, icon `#111` |
| 3 | Transaksi | `ti-list` | `#2DD4A0` |
| 4 | Laporan | `ti-chart-bar` | `#2DD4A0` |
| 5 | Pengaturan | `ti-settings` | `#2DD4A0` |

### FAB (Floating Action Button)
- Posisi: tengah bottom tab bar
- Ukuran: 48x48px
- Background: `#2DD4A0`
- Icon: `ti-plus`, warna `#111111`
- Border: `3px solid #111111` (memisahkan dari tab bar)
- Margin atas: `-20px` (melayang di atas tab bar)
- Aksi: membuka halaman Chat AI

---

## 📱 Halaman & Komponen

---

### 1. Dashboard (Home)

**Header:**
- Kiri: Logo `ti-wallet` + teks "Kebeng" warna `#2DD4A0`
- Kanan: Icon notifikasi `ti-bell`, background kartu kecil bulat

**Kartu Budget Utama:**
- Background: `#0d1f16`, border: `#1e3d2a`
- Label: "Sisa Budget Bulan Ini"
- Angka besar warna aksen `#2DD4A0`
- Progress bar hijau di bawah angka
- Baris bawah: teks "Terpakai Rp X" (kiri) + persentase aksen (kanan)

**Kartu Statistik (2 kolom):**
- Kiri: Pemasukan — icon `ti-arrow-down-circle` hijau + nominal hijau
- Kanan: Pengeluaran — icon `ti-arrow-up-circle` merah + nominal merah

**Section "Transaksi Terbaru":**
- Label section uppercase
- Kartu berisi 3 transaksi terakhir
- Setiap baris: icon circle (kategori) + nama + waktu + nominal
- Nominal pengeluaran merah, pemasukan hijau

---

### 2. Chat AI

**Header:**
- Kiri: Judul "Chat AI"
- Kanan: Icon riwayat `ti-history`

**Sub-judul:** "Cerita pengeluaranmu secara natural"

**Area Chat:**
- Bubble AI: background `#1c2e24`, radius `16px 16px 4px 16px` (kiri)
- Bubble User: background `#1e1e1e`, border `#2a2a2a`, radius `16px 4px 16px 16px` (kanan)
- Header bubble AI: icon `ti-robot` + teks "Kebeng AI" warna `#2DD4A0`

**Kartu Konfirmasi Transaksi (dari AI):**
- Background dalam: `#0d1f16`
- Tampil: nama item + nominal + kategori (badge hijau)
- Tombol Simpan: background `#2DD4A0`, teks `#111`, icon `ti-check`
- Tombol Edit: background `#222`, teks `#888`, icon `ti-pencil`

**Input Bar (bawah, fixed):**
- Background: `#111111`, border atas `#222`
- Tombol kamera `ti-camera` (bulat, kiri) → upload foto struk
- Input teks: background `#1c1c1c`, border `#2a2a2a`, radius 24px
- Tombol kirim: bulat `#2DD4A0`, icon `ti-send` hitam

---

### 3. Transaksi

**Header:**
- Kiri: Judul "Transaksi"
- Kanan: Icon cari `ti-search` (bulat)

**Tab Filter:**
- Semua / Pengeluaran / Pemasukan
- Tab aktif: background `#0d3d2a`, teks & border `#2DD4A0`

**Section per Hari:** label "Hari ini", "Kemarin", dll.

**Setiap Baris Transaksi:**
- Icon circle kategori (warna sesuai tabel icon)
- Nama transaksi + kategori & waktu (teks kecil)
- Nominal (merah/hijau)
- Badge sumber kecil: icon + teks `chat` / `foto` / `manual`

---

### 4. Laporan

**Header:**
- Kiri: Judul "Laporan"
- Kanan: Pill filter bulan — icon `ti-calendar` + teks bulan

**Tab:** Mingguan / Bulanan

**Kartu Total:**
- Label + angka besar merah
- Baris tren: icon `ti-trending-up` merah + teks persentase

**Section "Per Kategori":**
- Setiap baris: icon kategori berwarna + nama + nominal
- Progress bar hijau (atau merah jika melebihi budget) di bawah tiap baris

**Kartu Analisis AI:**
- Background `#0d1f16`, border `#1e3d2a`
- Header: icon `ti-robot` + teks "Analisis AI Mingguan" warna `#2DD4A0`
- Teks analisis warna `#aaa`

---

### 5. Pengaturan

**Header:**
- Kiri: Judul "Pengaturan"
- Kanan: Logo Kebeng kecil (`ti-wallet` + teks)

**Section Budget:**
- Budget Bulanan Total → icon `ti-calendar-month` + nilai + chevron
- Budget Per Kategori → icon `ti-tag` + chevron
- Peringatan Budget → icon `ti-bell-exclamation` + toggle ON

**Section Notifikasi:**
- Ringkasan Harian → icon `ti-clock` + sub-teks waktu + toggle ON
- Pengingat Input → icon `ti-bell-ringing` + sub-teks + toggle OFF

**Toggle Style:**
- ON: background `#2DD4A0`, thumb putih di kanan
- OFF: background `#333`, thumb `#666` di kiri

**Section Data:**
- Export Excel → icon `ti-file-spreadsheet` + icon download `#2DD4A0`
- Hapus Semua Data → teks & icon merah `#f87171`

---

## 🧩 Komponen Reusable

### Icon Circle
```
Ukuran    : 34x34px (normal), 28x28px (kecil di settings)
Shape     : border-radius 50%
Isi       : 1 Tabler Icon, font-size 16px
Warna     : sesuai tabel kategori
```

### Badge / Pill
```
Font-size : 10px
Padding   : 3px 8px
Radius    : 20px
Varian    : green (#0d3d2a / #2DD4A0), red (#3d1515 / #f87171), gray (#222 / #888)
```

### Progress Bar
```
Background  : #222222
Radius      : 8px
Tinggi      : 6px
Fill Normal : #2DD4A0
Fill Warning: #f87171
```

### Toggle Switch
```
Ukuran  : 36x20px
Radius  : 20px
Thumb   : 16x16px, putih/abu
ON      : background #2DD4A0, thumb kanan
OFF     : background #333, thumb kiri
```

### Tombol Utama
```
Background  : #2DD4A0
Teks        : #111111, 12px, weight 500
Radius      : 10px
Padding     : 8px
```

### Tombol Sekunder
```
Background  : #222222
Teks        : #888888, 12px
Radius      : 10px
Padding     : 8px
```

---

## ✅ Aturan Wajib untuk AI Agent

```
1. DILARANG menggunakan emoji sebagai icon UI — selalu pakai Tabler Icons
2. Semua icon Tabler menggunakan style OUTLINE — jangan pakai suffix "-filled"
3. Warna merah (#f87171) HANYA untuk pengeluaran dan aksi berbahaya
4. Warna hijau (#2DD4A0) HANYA untuk pemasukan, aksi positif, dan elemen aktif
5. Setiap icon circle WAJIB punya background warna sesuai tabel kategori
6. Nama aplikasi selalu ditulis "Kebeng" — huruf K kapital, sisanya kecil
7. Dark mode only — tidak ada mode terang
8. Semua teks UI dalam Bahasa Indonesia
9. Nominal uang selalu format: "Rp 25.000" (ada spasi setelah Rp, titik ribuan)
10. Progress bar merah jika pengeluaran > 80% budget, hijau jika di bawahnya
```

---

*Dokumen Desain.md ini digunakan bersama Blueprint.md sebagai panduan lengkap membangun aplikasi Kebeng.*
