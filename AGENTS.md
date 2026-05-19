# 📱 Project Blueprint — Aplikasi Keuangan Personal AI

> Dokumen ini adalah panduan lengkap untuk membangun aplikasi keuangan personal berbasis AI.
> Berikan dokumen ini sebagai konteks awal kepada AI agent sebelum mulai coding.

---

## ✅ Status Blueprint

| Bagian            | Status     |
| ----------------- | ---------- |
| Tech Stack        | ✅ Selesai |
| Fitur & Batasan   | ✅ Selesai |
| Struktur Database | ✅ Selesai |
| Aturan AI Agent   | ✅ Selesai |

---

## 🛠️ Tech Stack

| Komponen       | Teknologi                      | Alasan                                          |
| -------------- | ------------------------------ | ----------------------------------------------- |
| Mobile App     | React Native + Expo            | Cross-platform, JavaScript, cepat dikembangkan  |
| Database       | SQLite (lokal di HP)           | Gratis, offline, tidak perlu server             |
| AI & Analisis  | Google Gemini 2.0 Flash API    | Gratis, powerful, bisa baca gambar (multimodal) |
| OCR Foto Struk | Gemini Vision (sudah termasuk) | Tidak perlu library OCR tambahan                |
| Hosting        | Tidak ada — semua lokal di HP  | Rp 0/bulan                                      |

**Total Biaya: Rp 0 / bulan** 🎉

---

## 🎯 Fitur Aplikasi

### F1 — Input Pengeluaran & Pemasukan

| ID   | Fitur             | Deskripsi                                                                |
| ---- | ----------------- | ------------------------------------------------------------------------ |
| F1.1 | Chat Natural      | User ketik bebas → AI parsing otomatis (contoh: "beli makan siang 25rb") |
| F1.2 | Upload Foto Struk | Foto struk/nota → Gemini baca & ekstrak data otomatis                    |
| F1.3 | Input Manual      | Form input manual sebagai fallback                                       |
| F1.4 | Edit & Hapus      | User bisa koreksi data yang sudah tersimpan                              |

### F2 — Manajemen Budget

| ID   | Fitur                 | Deskripsi                                             |
| ---- | --------------------- | ----------------------------------------------------- |
| F2.1 | Budget Total Bulanan  | Set total uang bulanan (contoh: Rp 1.500.000/bulan)   |
| F2.2 | Budget Per Kategori   | Set batas per kategori (contoh: Makan max Rp 500.000) |
| F2.3 | Sisa Budget Real-time | Tampil sisa budget total & per kategori kapan saja    |
| F2.4 | Reset Otomatis        | Budget reset tiap awal bulan otomatis                 |

### F3 — Notifikasi & Pengingat

| ID   | Fitur                          | Deskripsi                                            |
| ---- | ------------------------------ | ---------------------------------------------------- |
| F3.1 | Peringatan Budget Hampir Habis | Notifikasi saat pengeluaran mencapai 80% budget      |
| F3.2 | Ringkasan Harian Otomatis      | Notifikasi ringkasan pengeluaran hari ini tiap malam |
| F3.3 | Pengingat Input Pengeluaran    | Notifikasi pengingat jika belum input seharian       |
| F3.4 | Analisis AI Mingguan           | Setiap minggu AI kirim analisis pola pengeluaran     |

### F4 — Laporan & Visualisasi

| ID   | Fitur              | Deskripsi                                               |
| ---- | ------------------ | ------------------------------------------------------- |
| F4.1 | Dashboard Utama    | Ringkasan saldo, pengeluaran hari ini, sisa budget      |
| F4.2 | Grafik Visual      | Pie chart per kategori, bar chart tren mingguan/bulanan |
| F4.3 | Ringkasan Mingguan | Rekap pengeluaran 7 hari terakhir                       |
| F4.4 | Ringkasan Bulanan  | Rekap pengeluaran per bulan lengkap                     |
| F4.5 | Export Excel       | Export data transaksi & laporan ke file .xlsx           |

### F5 — AI Analyst

| ID   | Fitur                | Deskripsi                                                            |
| ---- | -------------------- | -------------------------------------------------------------------- |
| F5.1 | Parsing Chat         | AI ekstrak nominal, kategori, tanggal dari chat bebas                |
| F5.2 | Baca Foto Struk      | AI ekstrak data dari foto nota/struk                                 |
| F5.3 | Analisis Pola        | AI deteksi pola boros, kategori terbesar, tren pengeluaran           |
| F5.4 | Saran Hemat          | AI beri saran spesifik berdasarkan data keuangan user                |
| F5.5 | Tanya Jawab Keuangan | User bisa tanya bebas, contoh: "bulan ini aku paling boros di mana?" |

---

## 🚫 Batasan Aplikasi

### Batasan Teknis

- Data hanya tersimpan **lokal di HP** — tidak ada sync antar device
- Fitur AI membutuhkan **koneksi internet aktif**
- OCR foto struk mungkin tidak akurat 100% — user wajib konfirmasi hasil sebelum disimpan
- Export Excel membutuhkan storage permission di HP

### Batasan Fitur (Sengaja Tidak Dibangun)

- ❌ Tidak ada fitur multi-user / login akun
- ❌ Tidak ada koneksi ke rekening bank / e-wallet otomatis
- ❌ Tidak ada backup cloud otomatis
- ❌ Tidak ada export PDF (hanya Excel)
- ❌ Tidak ada fitur hutang-piutang

### Batasan AI

- AI hanya boleh parsing & analisis data — **tidak boleh hapus atau ubah transaksi** tanpa konfirmasi user
- Semua hasil parsing AI wajib **dikonfirmasi user** sebelum disimpan
- AI tidak menyimpan riwayat chat ke server manapun

---

## 🗄️ Struktur Database (SQLite)

### Tabel 1: `transactions`

```sql
CREATE TABLE transactions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT NOT NULL,        -- 'expense' atau 'income'
  amount        REAL NOT NULL,        -- nominal (Rp)
  category_id   INTEGER,              -- relasi ke tabel categories
  description   TEXT,                 -- keterangan bebas
  source        TEXT,                 -- 'chat' | 'photo' | 'manual'
  date          TEXT NOT NULL,        -- format: YYYY-MM-DD
  created_at    TEXT DEFAULT (datetime('now'))
);
```

### Tabel 2: `categories`

```sql
CREATE TABLE categories (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,        -- 'Makan', 'Transport', dll
  icon          TEXT,                 -- emoji icon
  type          TEXT NOT NULL,        -- 'expense' atau 'income'
  is_default    INTEGER DEFAULT 0     -- 1 = kategori bawaan sistem
);
```

### Tabel 3: `budgets`

```sql
CREATE TABLE budgets (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT NOT NULL,        -- 'total' atau 'category'
  category_id   INTEGER,              -- NULL jika type = 'total'
  amount        REAL NOT NULL,        -- batas budget (Rp)
  month         TEXT NOT NULL,        -- format: YYYY-MM
  created_at    TEXT DEFAULT (datetime('now'))
);
```

### Tabel 4: `notifications_log`

```sql
CREATE TABLE notifications_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT NOT NULL,        -- 'budget_warning'|'daily_summary'|'weekly_analysis'
  message       TEXT,
  sent_at       TEXT DEFAULT (datetime('now')),
  is_read       INTEGER DEFAULT 0
);
```

### Tabel 5: `settings`

```sql
CREATE TABLE settings (
  key           TEXT PRIMARY KEY,     -- nama setting
  value         TEXT                  -- nilai setting
);

-- Contoh data default:
-- key: 'monthly_income',              value: '1500000'
-- key: 'notification_daily_time',     value: '21:00'
-- key: 'budget_warning_threshold',    value: '80'
```

### Relasi Antar Tabel

```
categories (id) ──< transactions (category_id)
categories (id) ──< budgets (category_id)
```

---

## 🤖 Aturan AI Agent

> Berikan aturan ini kepada AI agent (Cursor, Claude, dll) sebagai system prompt atau konteks awal sebelum mulai coding.

### Aturan Umum

```
1. Selalu gunakan Bahasa Indonesia dalam semua UI, teks, dan pesan
2. Semua nominal uang dalam format Rupiah (Rp)
3. Format tanggal: DD/MM/YYYY untuk display, YYYY-MM-DD untuk database
4. Jangan pernah hardcode API key di dalam kode — selalu gunakan .env
5. Aplikasi ini hanya untuk 1 user, tidak perlu sistem autentikasi
```

### Aturan Struktur Folder

```
/src
  /screens        → halaman-halaman app
  /components     → komponen reusable
  /services       → logika AI & database
    geminiService.js   → semua panggilan Gemini API
    dbService.js       → semua operasi SQLite
  /hooks          → custom React hooks
  /utils          → helper functions (format uang, tanggal, dll)
  /constants      → warna, font, kategori default
```

### Aturan Kode

```
1. Setiap fungsi database wajib ada error handling (try-catch)
2. Pisahkan logika AI di file terpisah: /services/geminiService.js
3. Pisahkan logika database di file terpisah: /services/dbService.js
4. Gunakan TypeScript jika memungkinkan untuk type safety
5. Setiap komponen harus reusable dan tidak hardcode data
```

### Aturan Format Response AI (Gemini)

```
Setiap response parsing transaksi dari Gemini WAJIB dalam format JSON berikut:

{
  "type": "expense" | "income",
  "amount": 25000,
  "category": "Makan",
  "description": "makan siang",
  "date": "2024-01-15",
  "confidence": 0.95
}

Aturan tambahan:
- Jika confidence < 0.7 → tampilkan dialog konfirmasi ke user
- Jika foto tidak terbaca → kembalikan error: "Foto kurang jelas, coba foto ulang"
- Jika data tidak lengkap → isi field yang tidak ada dengan null, jangan mengarang
- AI tidak boleh langsung menyimpan ke database — wajib lewat konfirmasi user
```

### Aturan UI/UX

```
1. Setiap aksi destruktif (hapus transaksi) wajib ada dialog konfirmasi
2. Tampilkan loading indicator saat memanggil Gemini API
3. Selalu ada pesan error yang ramah jika internet tidak tersedia
4. Warna merah untuk pengeluaran, hijau untuk pemasukan — konsisten di seluruh app
5. Semua teks tombol, label, dan pesan error dalam Bahasa Indonesia
```

---

## 🗓️ Roadmap Development

### Phase 1 — MVP (Minggu 1–2)

- [ ] Setup project React Native + Expo
- [ ] Setup SQLite & buat semua tabel
- [ ] Input pengeluaran via chat → Gemini parsing → konfirmasi → simpan
- [ ] Lihat daftar transaksi harian

### Phase 2 — Core Features (Minggu 3–4)

- [ ] Dashboard utama dengan ringkasan saldo & budget
- [ ] Manajemen budget (total & per kategori)
- [ ] Grafik visual (pie chart & bar chart)
- [ ] Ringkasan mingguan & bulanan

### Phase 3 — Advanced (Minggu 5–6)

- [ ] Upload foto struk → Gemini OCR
- [ ] Sistem notifikasi (budget warning, daily summary, reminder)
- [ ] Analisis AI mingguan
- [ ] Export Excel
- [ ] Fitur tanya jawab keuangan bebas ke AI

## @Desain.md

_Blueprint ini dibuat sebagai panduan pengembangan aplikasi keuangan personal AI berbasis React Native + Gemini API._
