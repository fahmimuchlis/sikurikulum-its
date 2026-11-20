# SiKurikulum — Sistem Penyusunan Dokumen Kurikulum
## Departemen Arsitektur ITS

---

## 🗺️ Panduan Deploy Lengkap (dari Nol)

### Prasyarat
- Akun GitHub (gratis): https://github.com
- Akun Vercel (gratis): https://vercel.com
- Akun Supabase (gratis): https://supabase.com
- Node.js terinstall di komputer Anda (https://nodejs.org — pilih versi LTS)

---

## LANGKAH 1: Buat Project Supabase Baru

1. Buka https://supabase.com dan login
2. Klik **"New Project"**
3. Isi nama project: `sikurikulum-its`
4. Pilih region: **Southeast Asia (Singapore)**
5. Buat password database (simpan baik-baik)
6. Klik **"Create new project"** — tunggu ~2 menit

---

## LANGKAH 2: Jalankan SQL Schema

1. Di Supabase, buka menu **SQL Editor** (ikon database di sidebar kiri)
2. Klik **"New query"**
3. Buka file `supabase/migrations/001_schema.sql` di komputer Anda
4. Salin semua isinya → tempel ke SQL Editor
5. Klik **"Run"** → tunggu hingga muncul "Success"
6. Ulangi untuk file `supabase/migrations/002_seed_cpl.sql`
   (berisi data CPL dan contoh mata kuliah)

---

## LANGKAH 3: Ambil Kredensial Supabase

1. Di Supabase, buka **Settings → API**
2. Catat dua nilai ini:
   - **Project URL**: `https://xxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGci...` (string panjang)

---

## LANGKAH 4: Upload Kode ke GitHub

1. Buka GitHub → klik **"New repository"**
2. Nama repo: `sikurikulum-its`
3. Pilih **Private**, klik **"Create repository"**
4. Di komputer Anda, buka Terminal / Command Prompt
5. Jalankan perintah berikut:

```bash
cd /path/ke/folder/sikurikulum
git init
git add .
git commit -m "Initial commit: SiKurikulum ITS"
git branch -M main
git remote add origin https://github.com/NAMA_ANDA/sikurikulum-its.git
git push -u origin main
```

---

## LANGKAH 5: Deploy ke Vercel

1. Buka https://vercel.com dan login dengan akun GitHub
2. Klik **"Add New → Project"**
3. Pilih repository `sikurikulum-its`
4. Di bagian **"Environment Variables"**, tambahkan:
   - `REACT_APP_SUPABASE_URL` → isi dengan Project URL dari Langkah 3
   - `REACT_APP_SUPABASE_ANON_KEY` → isi dengan anon key dari Langkah 3
5. Klik **"Deploy"** → tunggu ~3 menit
6. Vercel akan memberi URL seperti: `https://sikurikulum-its.vercel.app`

---

## LANGKAH 6: Aktifkan Email Auth di Supabase

1. Di Supabase, buka **Authentication → Providers**
2. Pastikan **Email** sudah aktif (default sudah aktif)
3. Buka **Authentication → Email Templates** untuk kustomisasi email verifikasi (opsional)
4. Jika ingin dosen bisa daftar tanpa verifikasi email dulu:
   - Buka **Authentication → Settings**
   - Nonaktifkan "Confirm email" (untuk kemudahan testing)

---

## LANGKAH 7: Test Aplikasi

1. Buka URL Vercel Anda
2. Klik **"Daftar di sini"** → buat akun dengan email dan password
3. Login → Anda akan masuk ke Dasbor
4. Klik **"Buat Dokumen Baru"** → ikuti 7 langkah wizard
5. Lihat hasilnya di **Direktori Kurikulum**

---

## 🔧 Kelola Master Data (Admin)

Untuk menambah/mengubah data Mata Kuliah atau CPL:

**Cara 1 (via Aplikasi):**
- Login → akses `/admin` di URL
- Gunakan form tambah MK / CPL

**Cara 2 (via Supabase SQL Editor):**
```sql
-- Contoh tambah MK baru:
INSERT INTO master_mata_kuliah (kode_mk, nama_mk, sks, jenjang, semester)
VALUES ('CA234506', 'Nama Mata Kuliah Baru', 3, 'S1', 5);

-- Contoh tambah CPL baru untuk S1:
INSERT INTO master_cpl (jenjang, nomor_cpl, kategori, deskripsi_id)
VALUES ('S1', 'CPL-12', 'Ketrampilan', 'Deskripsi CPL baru...');
```

---

## 📁 Struktur File Proyek

```
sikurikulum/
├── public/
│   └── index.html              ← Template HTML
├── src/
│   ├── App.jsx                 ← Routing utama
│   ├── index.js                ← Entry point
│   ├── index.css               ← CSS global + variabel warna
│   ├── supabaseClient.js       ← Koneksi Supabase
│   ├── components/
│   │   └── Navbar.jsx          ← Header navigasi
│   └── pages/
│       ├── Login.jsx           ← Halaman login
│       ├── Register.jsx        ← Halaman daftar akun
│       ├── Dashboard.jsx       ← Dasbor utama dosen
│       ├── FormSilabus.jsx     ← Wizard 7 langkah (form utama)
│       ├── Direktori.jsx       ← Direktori kurikulum publik
│       ├── DetailDokumen.jsx   ← Tampilan dokumen + cetak
│       └── AdminMasterData.jsx ← Kelola data MK & CPL
├── supabase/migrations/
│   ├── 001_schema.sql          ← Skema tabel + RLS
│   └── 002_seed_cpl.sql        ← Data awal CPL + contoh MK
├── package.json
├── vercel.json                 ← Konfigurasi Vercel SPA
├── .env.example                ← Template environment variables
└── .gitignore                  ← File yang tidak diupload ke GitHub
```

---

## ❓ Pertanyaan Umum

**Q: Bagaimana cara update kode setelah deploy?**
Cukup `git push` ke GitHub → Vercel otomatis rebuild dan update.

**Q: Apakah data aman di Supabase?**
Ya. Row Level Security (RLS) aktif — dosen hanya bisa akses data miliknya sendiri.

**Q: Bisakah dosen dari departemen lain mendaftar?**
Ya, siapapun dengan email bisa daftar. Untuk membatasi, tambahkan validasi domain email di Register.jsx.

**Q: Bagaimana cara backup data?**
Supabase menyediakan backup otomatis. Atau gunakan SQL Editor → export tabel ke CSV.

---

## 📞 Butuh Bantuan?

Hubungi administrator sistem atau buka isu di repository GitHub.
