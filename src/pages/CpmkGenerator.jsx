import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';

// ── Helper: build CPMK statement ──────────────────────────────────────────────
function buildCpmkStatement(tipe, fields) {
  if (tipe === 'kognitif') {
    const parts = ['Mampu'];
    if (fields.kognitif_1) parts.push(fields.kognitif_1);
    if (fields.elemen_1) parts.push(fields.elemen_1);
    if (fields.kata_hubung && fields.kognitif_2) {
      parts.push(fields.kata_hubung);
      parts.push(fields.kognitif_2);
    }
    if (fields.elemen_2) parts.push(fields.elemen_2);
    if (fields.rincian) parts.push(fields.rincian);
    if (fields.ukuran) parts.push(fields.ukuran);
    return parts.join(' ');
  }
  if (tipe === 'kognitif_psiko') {
    const parts = ['Mampu'];
    if (fields.kognitif) parts.push(fields.kognitif);
    if (fields.elemen_1) parts.push(fields.elemen_1);
    if (fields.kata_hubung && fields.psikomotorik) {
      parts.push(fields.kata_hubung);
      parts.push(fields.psikomotorik);
    }
    if (fields.elemen_2) parts.push(fields.elemen_2);
    if (fields.rincian) parts.push(fields.rincian);
    if (fields.ukuran) parts.push(fields.ukuran);
    return parts.join(' ');
  }
  if (tipe === 'afeksi') {
    const parts = ['Mampu'];
    if (fields.afeksi) parts.push(fields.afeksi);
    parts.push('pada kegiatan');
    if (fields.kegiatan_1) parts.push(fields.kegiatan_1);
    if (fields.kata_hubung && fields.kegiatan_2) {
      parts.push(fields.kata_hubung);
      parts.push(fields.kegiatan_2);
    }
    parts.push('materi/topik');
    if (fields.rincian) parts.push(fields.rincian);
    return parts.join(' ');
  }
  return '';
}

// ── Helper: build Sub-CPMK statement ──────────────────────────────────────────
function buildSubStatement(tipe, fields) {
  if (tipe === 'kognitif') {
    const kataKerja = fields.mengingat || fields.memahami || fields.menerapkan ||
      fields.menganalisis || fields.mengevaluasi || fields.mencipta || '';
    const parts = ['Mampu'];
    if (kataKerja) parts.push(kataKerja);
    if (fields.elemen_pengetahuan) parts.push(fields.elemen_pengetahuan);
    if (fields.rincian) parts.push(fields.rincian);
    if (fields.penugasan) parts.push(fields.penugasan);
    parts.push('berdasarkan acuan yang sahih dan dikerjakan dengan');
    if (fields.ukuran) parts.push(fields.ukuran);
    return parts.join(' ');
  }
  if (tipe === 'psikomotorik') {
    const parts = ['Mampu'];
    if (fields.psikomotorik) parts.push(fields.psikomotorik);
    if (fields.kegiatan_psiko) parts.push(fields.kegiatan_psiko);
    // obyek kosong = "Biarkan KOSONG"
    parts.push('tugas');
    if (fields.rincian) parts.push(fields.rincian);
    if (fields.penugasan) parts.push(fields.penugasan);
    parts.push('berdasarkan panduan yang sahih dan dikerjakan dengan');
    if (fields.ukuran) parts.push(fields.ukuran);
    return parts.join(' ');
  }
  if (tipe === 'afeksi') {
    const parts = ['Mampu'];
    if (fields.afeksi) parts.push(fields.afeksi);
    parts.push('pada kegiatan');
    if (fields.kegiatan_1) parts.push(fields.kegiatan_1);
    parts.push('materi/topik');
    if (fields.rincian) parts.push(fields.rincian);
    if (fields.penugasan) parts.push(fields.penugasan);
    return parts.join(' ');
  }
  return '';
}

// ── Select helper ─────────────────────────────────────────────────────────────
function Sel({ label, value, onChange, options, placeholder = '— pilih —', required = false }) {
  return (
    <div className="form-group">
      <label className="form-label" style={{ fontSize: 12 }}>
        {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
      </label>
      <select className="form-select" style={{ fontSize: 13 }} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ── Preview badge ──────────────────────────────────────────────────────────────
function PreviewBadge({ statement }) {
  if (!statement || statement.trim() === 'Mampu') return null;
  return (
    <div style={{
      background: 'var(--color-primary-50, #eff6ff)',
      border: '1px solid var(--color-primary-200, #bfdbfe)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 13,
      lineHeight: 1.6,
      color: 'var(--color-gray-800)',
      marginTop: 8,
      fontStyle: 'italic',
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', fontStyle: 'normal' }}>Preview: </span>
      {statement}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CPMK FORM KOGNITIF
// ═══════════════════════════════════════════════════════════════════════════════
function CpmkKognitifForm({ vocab, fields, onChange }) {
  const preview = buildCpmkStatement('kognitif', fields);
  return (
    <div>
      <Sel label="Kata Kerja Kognitif-1 (C1–C6)" value={fields.kognitif_1} onChange={v => onChange({ ...fields, kognitif_1: v })}
        options={[...vocab.kognitif_c1, ...vocab.kognitif_c2, ...vocab.kognitif_c3, ...vocab.kognitif_c4, ...vocab.kognitif_c5, ...vocab.kognitif_c6]} required />
      <Sel label="Elemen Pengetahuan-1" value={fields.elemen_1} onChange={v => onChange({ ...fields, elemen_1: v })}
        options={vocab.elemen_pengetahuan} required />
      <Sel label="Kata Hubung (opsional)" value={fields.kata_hubung} onChange={v => onChange({ ...fields, kata_hubung: v })}
        options={vocab.kata_hubung} />
      {fields.kata_hubung && <>
        <Sel label="Kata Kerja Kognitif-2" value={fields.kognitif_2} onChange={v => onChange({ ...fields, kognitif_2: v })}
          options={[...vocab.kognitif_c1, ...vocab.kognitif_c2, ...vocab.kognitif_c3, ...vocab.kognitif_c4, ...vocab.kognitif_c5, ...vocab.kognitif_c6]} />
        <Sel label="Elemen Pengetahuan-2" value={fields.elemen_2} onChange={v => onChange({ ...fields, elemen_2: v })}
          options={vocab.elemen_pengetahuan} />
      </>}
      <div className="form-group">
        <label className="form-label" style={{ fontSize: 12 }}>Rincian Sub-Bahan Kajian <span style={{ color: 'var(--color-danger)' }}>*</span></label>
        <input className="form-input" style={{ fontSize: 13 }} value={fields.rincian}
          onChange={e => onChange({ ...fields, rincian: e.target.value })}
          placeholder="ketik topik/bahan kajian MK..." />
      </div>
      <Sel label="Ukuran / Kriteria" value={fields.ukuran} onChange={v => onChange({ ...fields, ukuran: v })}
        options={vocab.ukuran} required />
      <PreviewBadge statement={preview} />
    </div>
  );
}

// CPMK FORM KOGNITIF + PSIKOMOTORIK
function CpmkKogPsikoForm({ vocab, fields, onChange }) {
  const preview = buildCpmkStatement('kognitif_psiko', fields);
  return (
    <div>
      <Sel label="Kata Kerja Kognitif" value={fields.kognitif} onChange={v => onChange({ ...fields, kognitif: v })}
        options={[...vocab.kognitif_c4, ...vocab.kognitif_c5, ...vocab.kognitif_c6]} required />
      <Sel label="Elemen Pengetahuan-1" value={fields.elemen_1} onChange={v => onChange({ ...fields, elemen_1: v })}
        options={vocab.elemen_pengetahuan} required />
      <Sel label="Kata Hubung" value={fields.kata_hubung} onChange={v => onChange({ ...fields, kata_hubung: v })}
        options={vocab.kata_hubung} />
      <Sel label="Kata Kerja Psikomotorik" value={fields.psikomotorik} onChange={v => onChange({ ...fields, psikomotorik: v })}
        options={vocab.psikomotorik} required />
      <Sel label="Elemen Pengetahuan-2 / Obyek" value={fields.elemen_2} onChange={v => onChange({ ...fields, elemen_2: v })}
        options={vocab.elemen_pengetahuan} />
      <div className="form-group">
        <label className="form-label" style={{ fontSize: 12 }}>Rincian Sub-Bahan Kajian <span style={{ color: 'var(--color-danger)' }}>*</span></label>
        <input className="form-input" style={{ fontSize: 13 }} value={fields.rincian}
          onChange={e => onChange({ ...fields, rincian: e.target.value })}
          placeholder="ketik topik/bahan kajian MK..." />
      </div>
      <Sel label="Ukuran / Kriteria" value={fields.ukuran} onChange={v => onChange({ ...fields, ukuran: v })}
        options={vocab.ukuran} required />
      <PreviewBadge statement={preview} />
    </div>
  );
}

// CPMK FORM AFEKSI
function CpmkAfeksiForm({ vocab, fields, onChange }) {
  const preview = buildCpmkStatement('afeksi', fields);
  return (
    <div>
      <Sel label="Sikap Afektif (fixed: menunjukkan...)" value={fields.afeksi} onChange={v => onChange({ ...fields, afeksi: v })}
        options={vocab.afektif} required />
      <Sel label="Kegiatan-1" value={fields.kegiatan_1} onChange={v => onChange({ ...fields, kegiatan_1: v })}
        options={vocab.kegiatan} required />
      <Sel label="Kata Hubung (opsional)" value={fields.kata_hubung} onChange={v => onChange({ ...fields, kata_hubung: v })}
        options={vocab.kata_hubung_afeksi} />
      {fields.kata_hubung && <Sel label="Kegiatan-2" value={fields.kegiatan_2} onChange={v => onChange({ ...fields, kegiatan_2: v })}
        options={vocab.kegiatan} />}
      <div className="form-group">
        <label className="form-label" style={{ fontSize: 12 }}>Topik/Rincian Sub-Bahan Kajian <span style={{ color: 'var(--color-danger)' }}>*</span></label>
        <input className="form-input" style={{ fontSize: 13 }} value={fields.rincian}
          onChange={e => onChange({ ...fields, rincian: e.target.value })}
          placeholder="mis: berpikir merancang digital" />
      </div>
      <PreviewBadge statement={preview} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-CPMK FORM KOGNITIF
// ═══════════════════════════════════════════════════════════════════════════════
function SubKognitifForm({ vocab, fields, onChange }) {
  const preview = buildSubStatement('kognitif', fields);
  const tingkat = ['mengingat', 'memahami', 'menerapkan', 'menganalisis', 'mengevaluasi', 'mencipta'];
  const vocabMap = {
    mengingat: vocab.kognitif_c1,
    memahami: vocab.kognitif_c2,
    menerapkan: vocab.kognitif_c3,
    menganalisis: vocab.kognitif_c4,
    mengevaluasi: vocab.kognitif_c5,
    mencipta: vocab.kognitif_c6,
  };
  // reset other tingkat when one is picked
  const pickTingkat = (key, val) => {
    const reset = tingkat.reduce((acc, t) => ({ ...acc, [t]: '' }), {});
    onChange({ ...fields, ...reset, [key]: val });
  };

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--color-gray-500)', marginBottom: 12 }}>
        Pilih satu tingkat kognitif sesuai kedalaman Sub-CPMK:
      </p>
      {tingkat.map(t => (
        <Sel key={t} label={`${t.charAt(0).toUpperCase() + t.slice(1)} (C${tingkat.indexOf(t) + 1})`}
          value={fields[t]}
          onChange={v => pickTingkat(t, v)}
          options={vocabMap[t]} />
      ))}
      <Sel label="Elemen Pengetahuan" value={fields.elemen_pengetahuan} onChange={v => onChange({ ...fields, elemen_pengetahuan: v })}
        options={vocab.elemen_pengetahuan} required />
      <div className="form-group">
        <label className="form-label" style={{ fontSize: 12 }}>Rincian Sub-Bahan Kajian</label>
        <input className="form-input" style={{ fontSize: 13 }} value={fields.rincian}
          onChange={e => onChange({ ...fields, rincian: e.target.value })}
          placeholder="ketik detail topik..." />
      </div>
      <Sel label="Penugasan" value={fields.penugasan} onChange={v => onChange({ ...fields, penugasan: v })}
        options={vocab.penugasan} required />
      <Sel label="Ukuran" value={fields.ukuran} onChange={v => onChange({ ...fields, ukuran: v })}
        options={vocab.ukuran} required />
      <PreviewBadge statement={preview} />
    </div>
  );
}

// SUB-CPMK FORM PSIKOMOTORIK
function SubPsikoForm({ vocab, fields, onChange }) {
  const preview = buildSubStatement('psikomotorik', fields);
  return (
    <div>
      <Sel label="Kata Kerja Psikomotorik" value={fields.psikomotorik} onChange={v => onChange({ ...fields, psikomotorik: v })}
        options={vocab.psikomotorik} required />
      <Sel label="Kegiatan" value={fields.kegiatan_psiko} onChange={v => onChange({ ...fields, kegiatan_psiko: v })}
        options={vocab.kegiatan_psiko || ['membuat', 'mengerjakan', 'menyusun', 'merancang']} />
      <div className="form-group">
        <label className="form-label" style={{ fontSize: 12 }}>Rincian Sub-Bahan Kajian</label>
        <input className="form-input" style={{ fontSize: 13 }} value={fields.rincian}
          onChange={e => onChange({ ...fields, rincian: e.target.value })}
          placeholder="ketik detail topik..." />
      </div>
      <Sel label="Penugasan" value={fields.penugasan} onChange={v => onChange({ ...fields, penugasan: v })}
        options={vocab.penugasan} required />
      <Sel label="Ukuran" value={fields.ukuran} onChange={v => onChange({ ...fields, ukuran: v })}
        options={vocab.ukuran} />
      <PreviewBadge statement={preview} />
    </div>
  );
}

// SUB-CPMK FORM AFEKSI
function SubAfeksiForm({ vocab, fields, onChange }) {
  const preview = buildSubStatement('afeksi', fields);
  return (
    <div>
      <Sel label="Sikap Afektif" value={fields.afeksi} onChange={v => onChange({ ...fields, afeksi: v })}
        options={vocab.afektif} required />
      <Sel label="Kegiatan" value={fields.kegiatan_1} onChange={v => onChange({ ...fields, kegiatan_1: v })}
        options={vocab.kegiatan} required />
      <div className="form-group">
        <label className="form-label" style={{ fontSize: 12 }}>Topik Rincian</label>
        <input className="form-input" style={{ fontSize: 13 }} value={fields.rincian}
          onChange={e => onChange({ ...fields, rincian: e.target.value })} />
      </div>
      <Sel label="Penugasan" value={fields.penugasan} onChange={v => onChange({ ...fields, penugasan: v })}
        options={[...vocab.penugasan, 'di dalam kelompok dan kelas', 'di dalam kelompok', 'di dalam kelas']} />
      <PreviewBadge statement={preview} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const EMPTY_CPMK = {
  tipe: 'kognitif',
  kognitif_1: '', elemen_1: '', kata_hubung: '', kognitif_2: '', elemen_2: '',
  kognitif: '', psikomotorik: '',
  rincian: '', ukuran: '',
  afeksi: '', kegiatan_1: '', kegiatan_2: '',
};

const EMPTY_SUB = {
  tipe: 'kognitif',
  mengingat: '', memahami: '', menerapkan: '', menganalisis: '', mengevaluasi: '', mencipta: '',
  elemen_pengetahuan: '', rincian: '', penugasan: '', ukuran: '',
  psikomotorik: '', kegiatan_psiko: '', obyek_kegiatan: '',
  afeksi: '', kegiatan_1: '',
};

export default function CpmkGenerator({ user }) {
  const [vocab, setVocab] = useState(null);
  const [silabusId, setSilabusId] = useState('');
  const [daftarSilabus, setDaftarSilabus] = useState([]);
  const [daftarCpmk, setDaftarCpmk] = useState([]);
  const [daftarSub, setDaftarSub] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [modeCpmk, setModeCpmk] = useState(false);
  const [modeSub, setModeSub] = useState(false);
  const [cpmkFields, setCpmkFields] = useState({ ...EMPTY_CPMK });
  const [subFields, setSubFields] = useState({ ...EMPTY_SUB });
  const [subLinkedCpmk, setSubLinkedCpmk] = useState('');

  const notify = (m, isErr = false) => {
    if (isErr) setError(m); else setMsg(m);
    setTimeout(() => { setMsg(''); setError(''); }, 4000);
  };

  // Load vocabulary
  useEffect(() => {
    const loadVocab = async () => {
      const { data } = await supabase.from('source_vocabulary').select('*').order('urutan');
      if (data) {
        const v = {};
        data.forEach(row => {
          if (!v[row.kategori]) v[row.kategori] = [];
          v[row.kategori].push(row.nilai);
        });
        setVocab(v);
      }
    };
    loadVocab();
  }, []);

  // Load silabus milik user
  useEffect(() => {
    const loadSilabus = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('dokumen_silabus')
        .select('id, nama_mk, jenjang, semester, status')
        .eq('dosen_id', user.id)
        .order('created_at', { ascending: false });
      setDaftarSilabus(data || []);
      setLoading(false);
    };
    loadSilabus();
  }, [user.id]);

  // Load CPMK & Sub-CPMK when silabus selected
  const loadCpmkData = useCallback(async (sid) => {
    if (!sid) { setDaftarCpmk([]); setDaftarSub([]); return; }
    const [{ data: cpmkData }, { data: subData }] = await Promise.all([
      supabase.from('dokumen_cpmk').select('*').eq('silabus_id', sid).order('nomor'),
      supabase.from('dokumen_sub_cpmk').select('*').eq('silabus_id', sid).order('nomor_global'),
    ]);
    setDaftarCpmk(cpmkData || []);
    setDaftarSub(subData || []);
  }, []);

  useEffect(() => { loadCpmkData(silabusId); }, [silabusId, loadCpmkData]);

  // ── Simpan CPMK ─────────────────────────────────────────────────────────────
  const simpanCpmk = async () => {
    if (!silabusId) return notify('Pilih Mata Kuliah (Silabus) terlebih dahulu.', true);
    const pernyataan = buildCpmkStatement(cpmkFields.tipe, cpmkFields);
    if (!pernyataan || pernyataan === 'Mampu') return notify('Isi form CPMK terlebih dahulu.', true);
    const nomor = daftarCpmk.length + 1;
    const payload = {
      silabus_id: silabusId,
      nomor,
      tipe: cpmkFields.tipe,
      kognitif_1: cpmkFields.kognitif_1 || null,
      elemen_pengetahuan_1: cpmkFields.elemen_1 || null,
      kata_hubung: cpmkFields.kata_hubung || null,
      kognitif_2: cpmkFields.kognitif_2 || null,
      elemen_pengetahuan_2: cpmkFields.elemen_2 || null,
      rincian_sub_bk: cpmkFields.rincian || null,
      ukuran: cpmkFields.ukuran || null,
      psikomotorik: cpmkFields.psikomotorik || null,
      afeksi: cpmkFields.afeksi || null,
      kegiatan_1: cpmkFields.kegiatan_1 || null,
      kata_hubung_afeksi: cpmkFields.kata_hubung || null,
      kegiatan_2: cpmkFields.kegiatan_2 || null,
      pernyataan,
    };
    const { error: err } = await supabase.from('dokumen_cpmk').insert(payload);
    if (err) return notify('Gagal simpan: ' + err.message, true);
    notify(`✅ CPMK ${nomor} disimpan.`);
    setCpmkFields({ ...EMPTY_CPMK });
    setModeCpmk(false);
    loadCpmkData(silabusId);
  };

  // ── Simpan Sub-CPMK ──────────────────────────────────────────────────────────
  const simpanSub = async () => {
    if (!silabusId) return notify('Pilih Mata Kuliah terlebih dahulu.', true);
    if (!subLinkedCpmk) return notify('Pilih CPMK induk terlebih dahulu.', true);
    const pernyataan = buildSubStatement(subFields.tipe, subFields);
    if (!pernyataan || pernyataan === 'Mampu') return notify('Isi form Sub-CPMK terlebih dahulu.', true);
    const nomor_global = daftarSub.length + 1;
    const payload = {
      cpmk_id: subLinkedCpmk,
      silabus_id: silabusId,
      nomor_global,
      tipe: subFields.tipe,
      mengingat: subFields.mengingat || null,
      memahami: subFields.memahami || null,
      menerapkan: subFields.menerapkan || null,
      menganalisis: subFields.menganalisis || null,
      mengevaluasi: subFields.mengevaluasi || null,
      mencipta: subFields.mencipta || null,
      elemen_pengetahuan: subFields.elemen_pengetahuan || null,
      rincian_sub_bk: subFields.rincian || null,
      penugasan: subFields.penugasan || null,
      ukuran: subFields.ukuran || null,
      psikomotorik: subFields.psikomotorik || null,
      kegiatan_psiko: subFields.kegiatan_psiko || null,
      afeksi: subFields.afeksi || null,
      kegiatan_afeksi: subFields.kegiatan_1 || null,
      pernyataan,
    };
    const { error: err } = await supabase.from('dokumen_sub_cpmk').insert(payload);
    if (err) return notify('Gagal simpan: ' + err.message, true);
    notify(`✅ Sub-CPMK ${nomor_global} disimpan.`);
    setSubFields({ ...EMPTY_SUB });
    setModeSub(false);
    loadCpmkData(silabusId);
  };

  const hapusCpmk = async (id) => {
    if (!window.confirm('Hapus CPMK ini dan semua Sub-CPMK terkait?')) return;
    await supabase.from('dokumen_cpmk').delete().eq('id', id);
    notify('CPMK dihapus.');
    loadCpmkData(silabusId);
  };

  const hapusSub = async (id) => {
    if (!window.confirm('Hapus Sub-CPMK ini?')) return;
    await supabase.from('dokumen_sub_cpmk').delete().eq('id', id);
    notify('Sub-CPMK dihapus.');
    loadCpmkData(silabusId);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading || !vocab) {
    return (
      <>
        <Navbar user={user} />
        <div className="page-loader" style={{ minHeight: 'calc(100vh - 60px)' }}>
          <div className="spinner spinner-primary"></div>
          <p>Memuat generator...</p>
        </div>
      </>
    );
  }

  const selectedSilabus = daftarSilabus.find(s => s.id === silabusId); // eslint-disable-line no-unused-vars
  const tipeLabel = { kognitif: '🧠 Kognitif', kognitif_psiko: '🧠💪 Kognitif + Psiko', afeksi: '💛 Afeksi' };
  const tipeLabelSub = { kognitif: '🧠 Kognitif', psikomotorik: '💪 Psikomotorik', afeksi: '💛 Afeksi' };

  return (
    <>
      <Navbar user={user} />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>
            🎯 Generator CPMK & Sub-CPMK
          </h1>
          <p style={{ color: 'var(--color-gray-500)', fontSize: 14 }}>
            Susun Capaian Pembelajaran Mata Kuliah dengan pilihan kata kerja Taksonomi Bloom sesuai panduan ITS.
          </p>
        </div>

        {msg && <div className="success-msg">{msg}</div>}
        {error && <div className="error-msg">{error}</div>}

        {/* Pilih MK */}
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <label className="form-label" style={{ fontWeight: 600 }}>Pilih Mata Kuliah (Silabus)</label>
          <select className="form-select" value={silabusId} onChange={e => { setSilabusId(e.target.value); setModeCpmk(false); setModeSub(false); }}>
            <option value="">— pilih mata kuliah —</option>
            {daftarSilabus.map(s => (
              <option key={s.id} value={s.id}>
                [{s.jenjang} Sem {s.semester}] {s.nama_mk}
              </option>
            ))}
          </select>
          {daftarSilabus.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--color-gray-500)', marginTop: 8 }}>
              Belum ada silabus. Buat silabus terlebih dahulu di menu Dasbor.
            </p>
          )}
        </div>

        {silabusId && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* ── Kolom Kiri: CPMK ─────────────────────────────────────────── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>CPMK ({daftarCpmk.length})</h2>
                <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}
                  onClick={() => { setModeCpmk(!modeCpmk); setCpmkFields({ ...EMPTY_CPMK }); }}>
                  {modeCpmk ? '✕ Batal' : '+ Tambah CPMK'}
                </button>
              </div>

              {/* Form tambah CPMK */}
              {modeCpmk && (
                <div className="card" style={{ padding: 16, marginBottom: 16, background: '#fafbff', border: '2px solid var(--color-primary-200, #bfdbfe)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>CPMK {daftarCpmk.length + 1}</h3>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Tipe CPMK</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {Object.entries(tipeLabel).map(([k, v]) => (
                        <button key={k}
                          onClick={() => setCpmkFields({ ...EMPTY_CPMK, tipe: k })}
                          style={{
                            padding: '6px 14px', borderRadius: 20, fontSize: 12, border: 'none', cursor: 'pointer',
                            fontWeight: cpmkFields.tipe === k ? 700 : 400,
                            background: cpmkFields.tipe === k ? 'var(--color-primary)' : 'var(--color-gray-100)',
                            color: cpmkFields.tipe === k ? 'white' : 'var(--color-gray-700)',
                          }}
                        >{v}</button>
                      ))}
                    </div>
                  </div>

                  {cpmkFields.tipe === 'kognitif' && <CpmkKognitifForm vocab={vocab} fields={cpmkFields} onChange={setCpmkFields} />}
                  {cpmkFields.tipe === 'kognitif_psiko' && <CpmkKogPsikoForm vocab={vocab} fields={cpmkFields} onChange={setCpmkFields} />}
                  {cpmkFields.tipe === 'afeksi' && <CpmkAfeksiForm vocab={vocab} fields={cpmkFields} onChange={setCpmkFields} />}

                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={simpanCpmk}>
                    💾 Simpan CPMK {daftarCpmk.length + 1}
                  </button>
                </div>
              )}

              {/* Daftar CPMK */}
              {daftarCpmk.length === 0 && !modeCpmk && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-gray-400)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
                  <p style={{ fontSize: 13 }}>Belum ada CPMK. Klik "+ Tambah CPMK" untuk mulai.</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>
                    Catatan: MK Teoritik = lebih banyak Kognitif; MK Studio = Kognitif + Psiko seimbang
                  </p>
                </div>
              )}

              {daftarCpmk.map(c => {
                const subTerkait = daftarSub.filter(s => s.cpmk_id === c.id);
                return (
                  <div key={c.id} className="card" style={{ padding: '12px 14px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{
                        background: c.tipe === 'afeksi' ? '#fef3c7' : c.tipe === 'kognitif_psiko' ? '#f0fdf4' : '#eff6ff',
                        color: c.tipe === 'afeksi' ? '#92400e' : c.tipe === 'kognitif_psiko' ? '#166534' : '#1e40af',
                        borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}>
                        CPMK {c.nomor}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>{c.pernyataan}</p>
                        {subTerkait.length > 0 && (
                          <div style={{ marginTop: 6, paddingLeft: 8, borderLeft: '2px solid var(--color-gray-200)' }}>
                            {subTerkait.map(s => (
                              <div key={s.id} style={{ fontSize: 11, color: 'var(--color-gray-600)', marginBottom: 2, display: 'flex', gap: 6 }}>
                                <span style={{ fontWeight: 600, flexShrink: 0 }}>Sub {s.nomor_global}:</span>
                                <span>{s.pernyataan}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => hapusCpmk(c.id)}
                        style={{ background: 'none', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11, flexShrink: 0 }}>
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Kolom Kanan: Sub-CPMK ─────────────────────────────────────── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Sub-CPMK ({daftarSub.length})</h2>
                <button className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}
                  disabled={daftarCpmk.length === 0}
                  onClick={() => { setModeSub(!modeSub); setSubFields({ ...EMPTY_SUB }); }}>
                  {modeSub ? '✕ Batal' : '+ Tambah Sub-CPMK'}
                </button>
              </div>

              {/* Form tambah Sub-CPMK */}
              {modeSub && (
                <div className="card" style={{ padding: 16, marginBottom: 16, background: '#fafbff', border: '2px solid var(--color-primary-200, #bfdbfe)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Sub-CPMK {daftarSub.length + 1}</h3>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>CPMK Induk <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                    <select className="form-select" style={{ fontSize: 13 }} value={subLinkedCpmk}
                      onChange={e => setSubLinkedCpmk(e.target.value)}>
                      <option value="">— pilih CPMK —</option>
                      {daftarCpmk.map(c => (
                        <option key={c.id} value={c.id}>CPMK {c.nomor}: {c.pernyataan?.slice(0, 50)}...</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Tipe Sub-CPMK</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {Object.entries(tipeLabelSub).map(([k, v]) => (
                        <button key={k}
                          onClick={() => setSubFields({ ...EMPTY_SUB, tipe: k })}
                          style={{
                            padding: '6px 14px', borderRadius: 20, fontSize: 12, border: 'none', cursor: 'pointer',
                            fontWeight: subFields.tipe === k ? 700 : 400,
                            background: subFields.tipe === k ? 'var(--color-primary)' : 'var(--color-gray-100)',
                            color: subFields.tipe === k ? 'white' : 'var(--color-gray-700)',
                          }}
                        >{v}</button>
                      ))}
                    </div>
                  </div>

                  {subFields.tipe === 'kognitif' && <SubKognitifForm vocab={vocab} fields={subFields} onChange={setSubFields} />}
                  {subFields.tipe === 'psikomotorik' && <SubPsikoForm vocab={vocab} fields={subFields} onChange={setSubFields} />}
                  {subFields.tipe === 'afeksi' && <SubAfeksiForm vocab={vocab} fields={subFields} onChange={setSubFields} />}

                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={simpanSub}>
                    💾 Simpan Sub-CPMK {daftarSub.length + 1}
                  </button>
                </div>
              )}

              {/* Daftar Sub-CPMK */}
              {daftarSub.length === 0 && !modeSub && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-gray-400)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
                  <p style={{ fontSize: 13 }}>Belum ada Sub-CPMK.</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>
                    Tiap CPMK biasanya memiliki 2 Sub-CPMK:<br />
                    1 Kognitif (mandiri) + 1 Kognitif/Psiko (berkelompok)
                  </p>
                </div>
              )}

              {daftarSub.map(s => {
                const cpmkInduk = daftarCpmk.find(c => c.id === s.cpmk_id);
                return (
                  <div key={s.id} className="card" style={{ padding: '12px 14px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                        <span style={{
                          background: '#f0fdf4', color: '#166534',
                          borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700,
                        }}>
                          Sub {s.nomor_global}
                        </span>
                        {cpmkInduk && (
                          <span style={{ fontSize: 10, color: 'var(--color-gray-400)', textAlign: 'center' }}>
                            CPMK {cpmkInduk.nomor}
                          </span>
                        )}
                      </div>
                      <p style={{ flex: 1, fontSize: 13, lineHeight: 1.5, margin: 0 }}>{s.pernyataan}</p>
                      <button onClick={() => hapusSub(s.id)}
                        style={{ background: 'none', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11, flexShrink: 0 }}>
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
