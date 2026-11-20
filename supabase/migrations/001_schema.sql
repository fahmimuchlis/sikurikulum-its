-- =============================================================
-- SiKurikulum ITS — Skema Database Lengkap
-- Jalankan file ini di: Supabase Dashboard → SQL Editor
-- =============================================================

-- ── 1. Tabel Master Mata Kuliah ──────────────────────────────
CREATE TABLE IF NOT EXISTS master_mata_kuliah (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kode_mk     TEXT NOT NULL UNIQUE,
  nama_mk     TEXT NOT NULL,
  sks         INTEGER NOT NULL DEFAULT 2,
  jenjang     TEXT NOT NULL CHECK (jenjang IN ('S1', 'Profesi', 'S2', 'S3')),
  semester    INTEGER NOT NULL DEFAULT 1,
  departemen  TEXT DEFAULT 'Arsitektur',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── 2. Tabel Master CPL ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS master_cpl (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jenjang      TEXT NOT NULL CHECK (jenjang IN ('S1', 'Profesi', 'S2', 'S3')),
  nomor_cpl    TEXT NOT NULL,
  kategori     TEXT,
  deskripsi_id TEXT NOT NULL,
  deskripsi_en TEXT,
  UNIQUE(jenjang, nomor_cpl)
);

-- ── 3. Tabel Profil Dosen ────────────────────────────────────
CREATE TABLE IF NOT EXISTS profil_dosen (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nama_lengkap  TEXT,
  nidn          TEXT,
  email         TEXT,
  departemen    TEXT DEFAULT 'Arsitektur',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── 4. Tabel Dokumen Silabus ─────────────────────────────────
CREATE TABLE IF NOT EXISTS dokumen_silabus (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dosen_id            UUID REFERENCES profil_dosen(id) ON DELETE CASCADE,
  mk_id               UUID REFERENCES master_mata_kuliah(id),
  status              TEXT DEFAULT 'draft' CHECK (status IN ('belum', 'draft', 'selesai')),
  deskripsi_mk        TEXT,
  cpl_dipilih         JSONB DEFAULT '[]',
  cpmk                JSONB DEFAULT '[]',
  bahan_kajian        JSONB DEFAULT '[]',
  prasyarat           JSONB DEFAULT '[]',
  pustaka_utama       JSONB DEFAULT '[]',
  pustaka_pendukung   JSONB DEFAULT '[]',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ── 5. Tabel SAP Mingguan ────────────────────────────────────
CREATE TABLE IF NOT EXISTS sap_mingguan (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  silabus_id          UUID REFERENCES dokumen_silabus(id) ON DELETE CASCADE,
  minggu              INTEGER NOT NULL CHECK (minggu BETWEEN 1 AND 16),
  sub_cpmk_no         TEXT,
  indikator           TEXT,
  kriteria            TEXT,
  bentuk_penilaian    TEXT,
  bobot_penilaian     INTEGER DEFAULT 0,
  materi              TEXT,
  bentuk_pembelajaran TEXT DEFAULT 'kuliah (kelas)',
  metoda              TEXT DEFAULT 'diskusi kelompok',
  skema               TEXT
);

-- ── 6. Row Level Security (RLS) ──────────────────────────────
ALTER TABLE dokumen_silabus   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sap_mingguan      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profil_dosen      ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_mata_kuliah ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_cpl        ENABLE ROW LEVEL SECURITY;

-- Dosen hanya bisa kelola dokumen miliknya sendiri
CREATE POLICY "dosen_own_silabus"
  ON dokumen_silabus FOR ALL
  USING (dosen_id = auth.uid());

-- Direktori: semua user terdaftar bisa baca dokumen silabus
CREATE POLICY "direktori_baca_semua"
  ON dokumen_silabus FOR SELECT
  USING (auth.role() = 'authenticated');

-- SAP: ikuti akses silabus induknya
CREATE POLICY "sap_via_silabus_owner"
  ON sap_mingguan FOR ALL
  USING (
    silabus_id IN (
      SELECT id FROM dokumen_silabus WHERE dosen_id = auth.uid()
    )
  );

CREATE POLICY "sap_baca_semua"
  ON sap_mingguan FOR SELECT
  USING (auth.role() = 'authenticated');

-- Profil: hanya pemilik yang bisa edit, semua bisa baca
CREATE POLICY "profil_own"
  ON profil_dosen FOR ALL
  USING (id = auth.uid());

CREATE POLICY "profil_baca_semua"
  ON profil_dosen FOR SELECT
  USING (auth.role() = 'authenticated');

-- Master data: semua user bisa baca (admin yang tambah via SQL)
CREATE POLICY "mk_baca_semua"
  ON master_mata_kuliah FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "mk_admin_all"
  ON master_mata_kuliah FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "cpl_baca_semua"
  ON master_cpl FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "cpl_admin_all"
  ON master_cpl FOR ALL
  USING (auth.role() = 'authenticated');

-- ── 7. Trigger: auto-update updated_at ──────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_silabus_updated_at
  BEFORE UPDATE ON dokumen_silabus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 8. Trigger: auto-buat profil dosen saat register ────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profil_dosen (id, email, nama_lengkap)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
