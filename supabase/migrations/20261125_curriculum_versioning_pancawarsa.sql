-- ============================================================
-- CURRICULUM VERSIONING (PANCAWARSA)
-- Tracks periodic 5-year curriculum cycles with change log
-- Run via Supabase Dashboard → SQL Editor if MCP times out
-- ============================================================

-- Versi Kurikulum table (e.g. "Kurikulum 2023", "Kurikulum 2028")
CREATE TABLE IF NOT EXISTS versi_kurikulum (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode          TEXT NOT NULL UNIQUE,          -- e.g. "K2023", "K2028"
  nama          TEXT NOT NULL,                 -- e.g. "Kurikulum 2023"
  jenjang       TEXT NOT NULL DEFAULT 'S1'
                CHECK (jenjang IN ('S1','S2','PPAr','S3')),
  tahun_mulai   INTEGER NOT NULL,
  tahun_selesai INTEGER,
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','aktif','arsip')),
  deskripsi     TEXT,
  parent_id     UUID REFERENCES versi_kurikulum(id), -- forked from which version
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Changelog per MK per versi (structured archive)
CREATE TABLE IF NOT EXISTS changelog_kurikulum (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  versi_id        UUID NOT NULL REFERENCES versi_kurikulum(id) ON DELETE CASCADE,
  versi_lama_id   UUID REFERENCES versi_kurikulum(id),
  tipe_perubahan  TEXT NOT NULL
                  CHECK (tipe_perubahan IN (
                    'mk_baru','mk_hapus','mk_gabung','mk_pisah',
                    'sks_berubah','semester_berubah','nama_berubah',
                    'cpl_berubah','prasyarat_berubah','rumpun_berubah','lainnya'
                  )),
  mk_id           UUID REFERENCES dokumen_silabus(id),
  mk_kode         TEXT,
  mk_nama         TEXT,
  deskripsi       TEXT,
  nilai_lama      JSONB,
  nilai_baru      JSONB,
  catatan         TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link MK ke versi kurikulum (many-to-many)
CREATE TABLE IF NOT EXISTS mk_versi_kurikulum (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  versi_id    UUID NOT NULL REFERENCES versi_kurikulum(id) ON DELETE CASCADE,
  mk_id       UUID NOT NULL REFERENCES dokumen_silabus(id) ON DELETE CASCADE,
  semester    INTEGER CHECK (semester BETWEEN 1 AND 14),
  sks         INTEGER CHECK (sks > 0),
  wajib       BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (versi_id, mk_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_versi_kurikulum_status   ON versi_kurikulum(status);
CREATE INDEX IF NOT EXISTS idx_versi_kurikulum_jenjang  ON versi_kurikulum(jenjang);
CREATE INDEX IF NOT EXISTS idx_changelog_versi_id       ON changelog_kurikulum(versi_id);
CREATE INDEX IF NOT EXISTS idx_changelog_mk_id          ON changelog_kurikulum(mk_id);
CREATE INDEX IF NOT EXISTS idx_mk_versi_versi_id        ON mk_versi_kurikulum(versi_id);

-- RLS
ALTER TABLE versi_kurikulum     ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog_kurikulum ENABLE ROW LEVEL SECURITY;
ALTER TABLE mk_versi_kurikulum  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_versi_kurikulum" ON versi_kurikulum FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_changelog"       ON changelog_kurikulum FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_mk_versi"        ON mk_versi_kurikulum FOR SELECT TO authenticated USING (true);

CREATE POLICY "write_versi_kurikulum" ON versi_kurikulum FOR ALL TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "write_changelog" ON changelog_kurikulum FOR ALL TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "write_mk_versi" ON mk_versi_kurikulum FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_versi_kurikulum_updated_at ON versi_kurikulum;
CREATE TRIGGER update_versi_kurikulum_updated_at
  BEFORE UPDATE ON versi_kurikulum
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data: 4 versi awal
INSERT INTO versi_kurikulum (kode, nama, jenjang, tahun_mulai, status, deskripsi)
VALUES
  ('K2023-S1',   'Kurikulum 2023 — Sarjana S1',  'S1',   2023, 'aktif', 'Kurikulum berbasis OBE, periode 2023–2027'),
  ('K2028-S1',   'Kurikulum 2028 — Sarjana S1',  'S1',   2028, 'draft', 'Draft awal evaluasi pancawarsa 2028'),
  ('K2023-S2',   'Kurikulum 2023 — Magister S2', 'S2',   2023, 'aktif', 'Kurikulum program magister arsitektur'),
  ('K2023-PPAr', 'Kurikulum 2023 — PPAr',        'PPAr', 2023, 'aktif', 'Program Profesi Arsitek')
ON CONFLICT (kode) DO NOTHING;
