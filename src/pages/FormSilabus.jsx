import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';

// Daftar nama langkah wizard
const STEPS = [
  { id: 1, label: 'Pilih MK', title: 'Pilih Mata Kuliah' },
  { id: 2, label: 'Deskripsi', title: 'Deskripsi Mata Kuliah' },
  { id: 3, label: 'CPL', title: 'Capaian Pembelajaran Lulusan (CPL)' },
  { id: 4, label: 'CPMK', title: 'Capaian Pembelajaran Mata Kuliah (CPMK)' },
  { id: 5, label: 'Bahan Kajian', title: 'Bahan Kajian & Pustaka' },
  { id: 6, label: 'SAP', title: 'Rencana Perkuliahan per Minggu' },
  { id: 7, label: 'Selesai', title: 'Simpan & Selesai' },
];

export default function FormSilabus({ user }) {
  const navigate = useNavigate();
  const { silabusId } = useParams();
  const isEdit = !!silabusId;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [currentSilabusId, setCurrentSilabusId] = useState(silabusId || null);

  // Master data
  const [daftarMK, setDaftarMK] = useState([]);
  const [daftarCPL, setDaftarCPL] = useState([]);

  // Form data
  const [mkDipilih, setMkDipilih] = useState(null);
  const [deskripsiMk, setDeskripsiMk] = useState('');
  // Deskripsi MK terstruktur (DES-Cre)
  const [desMk, setDesMk] = useState({
    jenis_mk: 'wajib',
    kemampuan: '',
    jenis_pengetahuan: '',
    bahan_kajian_des: '',
    penugasan_des: '',
    metoda_1: '',
    tanda_baca_1: '.',
    metoda_2: '',
    tanda_baca_2: '',
    metoda_3: '',
  });
  const [cplDipilih, setCplDipilih] = useState([]); // array of CPL id
  const [cpmk, setCpmk] = useState([{ no: 'CPMK-1', deskripsi_id: '', deskripsi_en: '' }]);
  const [bahanKajian, setBahanKajian] = useState(['']);
  const [prasyarat, setPrasyarat] = useState('');
  const [pustakaUtama, setPustakaUtama] = useState(['']);
  const [pustakaP, setPustakaP] = useState(['']);
  const [sapMinggu, setSapMinggu] = useState(() =>
    Array.from({ length: 16 }, (_, i) => ({
      minggu: i + 1,
      sub_cpmk_no: '',
      materi: '',
      bentuk_pembelajaran: 'kuliah (kelas)',
      metoda: 'diskusi kelompok',
      bobot_penilaian: i === 7 ? 20 : i === 15 ? 30 : 0,
    }))
  );

  // Muat data awal
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // Ambil semua MK
      const { data: mkData } = await supabase
        .from('master_mata_kuliah')
        .select('*')
        .order('kode_mk');
      setDaftarMK(mkData || []);

      // Ambil semua CPL
      const { data: cplData } = await supabase
        .from('master_cpl')
        .select('*')
        .order('jenjang, nomor_cpl');
      setDaftarCPL(cplData || []);

      // Jika edit: muat dokumen yang sudah ada
      if (isEdit) {
        const { data: dok } = await supabase
          .from('dokumen_silabus')
          .select('*')
          .eq('id', silabusId)
          .single();

        if (dok) {
          const mk = mkData?.find(m => m.id === dok.mk_id);
          setMkDipilih(mk || null);
          setDeskripsiMk(dok.deskripsi_mk || '');
          if (dok.jenis_mk) {
            setDesMk({
              jenis_mk: dok.jenis_mk || 'wajib',
              kemampuan: dok.kemampuan || '',
              jenis_pengetahuan: dok.jenis_pengetahuan || '',
              bahan_kajian_des: dok.bahan_kajian_des || '',
              penugasan_des: dok.penugasan_des || '',
              metoda_1: dok.metoda_1 || '',
              tanda_baca_1: '.',
              metoda_2: dok.metoda_2 || '',
              tanda_baca_2: '',
              metoda_3: dok.metoda_3 || '',
            });
          }
          setCplDipilih(dok.cpl_dipilih || []);
          setCpmk(dok.cpmk?.length > 0 ? dok.cpmk : [{ no: 'CPMK-1', deskripsi_id: '', deskripsi_en: '' }]);
          setBahanKajian(dok.bahan_kajian?.length > 0 ? dok.bahan_kajian : ['']);
          setPrasyarat(Array.isArray(dok.prasyarat) ? dok.prasyarat.join(', ') : (dok.prasyarat || ''));
          setPustakaUtama(dok.pustaka_utama?.length > 0 ? dok.pustaka_utama : ['']);
          setPustakaP(dok.pustaka_pendukung?.length > 0 ? dok.pustaka_pendukung : ['']);

          // Muat SAP mingguan
          const { data: sapData } = await supabase
            .from('sap_mingguan')
            .select('*')
            .eq('silabus_id', silabusId)
            .order('minggu');

          if (sapData?.length > 0) {
            setSapMinggu(sapData);
          }
        }
      }

      setLoading(false);
    };
    init();
  }, [isEdit, silabusId]);

  // CPL yang difilter berdasarkan jenjang MK dipilih
  const cplFiltered = mkDipilih
    ? daftarCPL.filter(c => c.jenjang === mkDipilih.jenjang)
    : [];

  // Auto-save ke Supabase
  const autoSave = useCallback(async (statusBaru = 'draft') => {
    if (!mkDipilih || !user) return null;
    setSaving(true);
    setError('');

    const payload = {
      dosen_id: user.id,
      mk_id: mkDipilih.id,
      status: statusBaru,
      deskripsi_mk: deskripsiMk,
      jenis_mk: desMk.jenis_mk || null,
      kemampuan: desMk.kemampuan || null,
      jenis_pengetahuan: desMk.jenis_pengetahuan || null,
      bahan_kajian_des: desMk.bahan_kajian_des || null,
      penugasan_des: desMk.penugasan_des || null,
      metoda_1: desMk.metoda_1 || null,
      metoda_2: desMk.metoda_2 || null,
      metoda_3: desMk.metoda_3 || null,
      cpl_dipilih: cplDipilih,
      cpmk,
      bahan_kajian: bahanKajian.filter(b => b.trim()),
      prasyarat: prasyarat.split(',').map(s => s.trim()).filter(Boolean),
      pustaka_utama: pustakaUtama.filter(p => p.trim()),
      pustaka_pendukung: pustakaP.filter(p => p.trim()),
      updated_at: new Date().toISOString(),
    };

    let id = currentSilabusId;
    if (id) {
      await supabase.from('dokumen_silabus').update(payload).eq('id', id);
    } else {
      const { data } = await supabase.from('dokumen_silabus').insert(payload).select().single();
      id = data?.id;
      setCurrentSilabusId(id);
    }

    // Simpan SAP mingguan
    if (id) {
      await supabase.from('sap_mingguan').delete().eq('silabus_id', id);
      const sapRows = sapMinggu.map(s => ({ ...s, silabus_id: id }));
      await supabase.from('sap_mingguan').insert(sapRows);
    }

    setSaving(false);
    return id;
  }, [mkDipilih, user, deskripsiMk, cplDipilih, cpmk, bahanKajian, prasyarat, pustakaUtama, pustakaP, sapMinggu, currentSilabusId]);

  const handleNext = async () => {
    if (step === 1 && !mkDipilih) {
      setError('Pilih mata kuliah terlebih dahulu.');
      return;
    }
    setError('');
    if (step < 7) {
      await autoSave();
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) setStep(s => s - 1);
  };

  const handleSelesai = async () => {
    const id = await autoSave('selesai');
    if (id) navigate('/dashboard');
  };

  if (loading) {
    return (
      <>
        <Navbar user={user} />
        <div className="page-loader" style={{ minHeight: 'calc(100vh - 60px)' }}>
          <div className="spinner spinner-primary"></div>
          <p>Memuat formulir...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar user={user} />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', color: 'var(--color-gray-500)', fontSize: 14, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← Kembali ke Dasbor
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>
            {isEdit ? 'Edit Dokumen Kurikulum' : 'Buat Dokumen Kurikulum Baru'}
          </h1>
          {mkDipilih && (
            <p style={{ color: 'var(--color-gray-500)', fontSize: 14, marginTop: 4 }}>
              {mkDipilih.kode_mk} — {mkDipilih.nama_mk}
            </p>
          )}
        </div>

        {/* Progress wizard */}
        <WizardProgress steps={STEPS} currentStep={step} />

        {/* Form card */}
        <div className="card" style={{ marginTop: 24, padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600 }}>
              Langkah {step}: {STEPS[step - 1].title}
            </h2>
            {saving && (
              <span style={{ fontSize: 12, color: 'var(--color-gray-500)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="spinner spinner-primary" style={{ width: 14, height: 14 }}></div>
                Menyimpan...
              </span>
            )}
          </div>

          {error && <div className="error-msg">⚠️ {error}</div>}

          {/* Konten setiap langkah */}
          {step === 1 && (
            <Step1PilihMK
              daftarMK={daftarMK}
              mkDipilih={mkDipilih}
              onChange={setMkDipilih}
            />
          )}
          {step === 2 && (
            <Step2Deskripsi
              mkDipilih={mkDipilih}
              deskripsi={deskripsiMk}
              onChange={setDeskripsiMk}
              desMk={desMk}
              onChangeDesMk={setDesMk}
            />
          )}
          {step === 3 && (
            <Step3CPL
              cplFiltered={cplFiltered}
              cplDipilih={cplDipilih}
              onChange={setCplDipilih}
              jenjang={mkDipilih?.jenjang}
            />
          )}
          {step === 4 && (
            <Step4CPMK
              cpmk={cpmk}
              onChange={setCpmk}
            />
          )}
          {step === 5 && (
            <Step5BahanKajian
              bahanKajian={bahanKajian}
              setBahanKajian={setBahanKajian}
              prasyarat={prasyarat}
              setPrasyarat={setPrasyarat}
              pustakaUtama={pustakaUtama}
              setPustakaUtama={setPustakaUtama}
              pustakaP={pustakaP}
              setPustakaP={setPustakaP}
            />
          )}
          {step === 6 && (
            <Step6SAP
              sapMinggu={sapMinggu}
              onChange={setSapMinggu}
              cpmk={cpmk}
            />
          )}
          {step === 7 && (
            <Step7Selesai
              mkDipilih={mkDipilih}
              cplDipilih={cplDipilih}
              cpmk={cpmk}
              bahanKajian={bahanKajian}
              daftarCPL={daftarCPL}
            />
          )}

          {/* Navigasi */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 32,
            paddingTop: 20,
            borderTop: '1px solid var(--color-gray-200)',
          }}>
            <button
              className="btn btn-secondary"
              onClick={handleBack}
              disabled={step === 1}
            >
              ← Sebelumnya
            </button>

            {step < 7 ? (
              <button className="btn btn-primary" onClick={handleNext} disabled={saving}>
                {saving ? <><div className="spinner" style={{ width: 16, height: 16 }}></div>Menyimpan...</> : 'Lanjut →'}
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleSelesai}
                disabled={saving}
                style={{ background: 'var(--color-success)' }}
              >
                {saving ? <><div className="spinner" style={{ width: 16, height: 16 }}></div>Menyimpan...</> : '✅ Selesaikan Dokumen'}
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

// ─── Komponen Progress Bar ────────────────────────────────────────────────
function WizardProgress({ steps, currentStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              background: currentStep > s.id ? 'var(--color-success)'
                : currentStep === s.id ? 'var(--color-primary)'
                : 'var(--color-gray-200)',
              color: currentStep >= s.id ? 'white' : 'var(--color-gray-500)',
              transition: 'all 0.2s',
            }}>
              {currentStep > s.id ? '✓' : s.id}
            </div>
            <span style={{
              fontSize: 11,
              marginTop: 4,
              color: currentStep === s.id ? 'var(--color-primary)' : 'var(--color-gray-500)',
              fontWeight: currentStep === s.id ? 600 : 400,
              whiteSpace: 'nowrap',
            }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              height: 2,
              flex: 1,
              background: currentStep > s.id ? 'var(--color-success)' : 'var(--color-gray-200)',
              marginBottom: 16,
              transition: 'background 0.2s',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Langkah 1: Pilih Mata Kuliah ────────────────────────────────────────
function Step1PilihMK({ daftarMK, mkDipilih, onChange }) {
  const jenjangList = [...new Set(daftarMK.map(m => m.jenjang))];
  const [filterJenjang, setFilterJenjang] = useState('');

  const mkFiltered = filterJenjang
    ? daftarMK.filter(m => m.jenjang === filterJenjang)
    : daftarMK;

  return (
    <div>
      <p style={{ color: 'var(--color-gray-500)', fontSize: 14, marginBottom: 20 }}>
        Pilih mata kuliah yang akan Anda buatkan dokumen kurikulumnya.
      </p>

      <div className="form-group">
        <label className="form-label">Filter berdasarkan Jenjang</label>
        <select
          className="form-select"
          value={filterJenjang}
          onChange={e => setFilterJenjang(e.target.value)}
          style={{ maxWidth: 220 }}
        >
          <option value="">— Semua Jenjang —</option>
          {jenjangList.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
        {mkFiltered.map(mk => (
          <label
            key={mk.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '14px 16px',
              border: `2px solid ${mkDipilih?.id === mk.id ? 'var(--color-primary)' : 'var(--color-gray-200)'}`,
              borderRadius: 8,
              cursor: 'pointer',
              background: mkDipilih?.id === mk.id ? '#EEF4FF' : 'white',
              transition: 'all 0.15s',
            }}
          >
            <input
              type="radio"
              name="mk"
              value={mk.id}
              checked={mkDipilih?.id === mk.id}
              onChange={() => onChange(mk)}
              style={{ marginTop: 3, flexShrink: 0 }}
            />
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
                  {mk.kode_mk}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>
                  {mk.jenjang} · Sem {mk.semester} · {mk.sks} SKS
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{mk.nama_mk}</div>
            </div>
          </label>
        ))}
        {mkFiltered.length === 0 && (
          <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: 32 }}>
            Tidak ada mata kuliah ditemukan.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Langkah 2: Deskripsi MK ─────────────────────────────────────────────
const KEMAMPUAN_OPTS = ['mendalami', 'memahami', 'menerapkan', 'menganalisis', 'mengembangkan', 'merancang'];
const JENIS_PENGETAHUAN_OPTS = ['teori dan prinsip', 'teori dan konteks', 'teori dasar', 'konsep teoritis', 'konsep rancangan', 'prinsip', 'proses', 'prosedur', 'strategi', 'metoda', 'desain'];
const PENUGASAN_DES_OPTS = ['secara mandiri', 'secara berkelompok', 'secara mandiri dan berkelompok'];
const METODA_OPTS = ['diskusi kelompok', 'studi kasus', 'berbasis permasalahan', 'berbasis proyek', 'simulasi', 'penemuan/discovery', 'kontekstual', 'kooperatif', 'kolaboratif', 'mandiri', 'bertukar matra/flipped', 'bauran/blended', 'non-SCL (kuliah dan diskusi kelas)', 'ujian/evaluasi'];
const TANDA_BACA_OPTS = ['.', ',', '; ', 'dan', 'serta'];

function buildDeskripsiStatement(mk, des) {
  if (!mk || !des.kemampuan) return '';
  const jenis = des.jenis_mk || 'wajib';
  const parts = [`Mata kuliah ${jenis} yang mengembangkan kemampuan mahasiswa dalam`];
  parts.push(des.kemampuan);
  if (des.jenis_pengetahuan) parts.push(des.jenis_pengetahuan);
  if (des.bahan_kajian_des) parts.push(des.bahan_kajian_des);
  if (des.penugasan_des) parts.push(des.penugasan_des);
  parts.push('melalui perkuliahan dan pembelajaran');
  const metodaList = [des.metoda_1, des.metoda_2, des.metoda_3].filter(Boolean);
  if (metodaList.length) parts.push(metodaList.join(', '));
  return parts.join(' ') + '.';
}

function Step2Deskripsi({ mkDipilih, deskripsi, onChange, desMk, onChangeDesMk }) {
  const preview = buildDeskripsiStatement(mkDipilih, desMk);

  // sync generated statement to deskripsiMk whenever preview changes
  React.useEffect(() => {
    if (preview) onChange(preview);
  }, [preview]); // eslint-disable-line react-hooks/exhaustive-deps

  const upd = (key, val) => onChangeDesMk(prev => ({ ...prev, [key]: val }));

  const SelDes = ({ label, field, opts, placeholder = '— pilih —' }) => (
    <div className="form-group">
      <label className="form-label" style={{ fontSize: 13 }}>{label}</label>
      <select className="form-select" value={desMk[field]} onChange={e => upd(field, e.target.value)}>
        <option value="">{placeholder}</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div>
      {mkDipilih && (
        <div style={{ background: 'var(--color-gray-50)', border: '1px solid var(--color-gray-200)', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginBottom: 4 }}>Mata Kuliah</div>
          <div style={{ fontWeight: 700 }}>{mkDipilih.kode_mk} — {mkDipilih.nama_mk}</div>
          <div style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 2 }}>
            {mkDipilih.sks} SKS · {mkDipilih.jenjang} · Semester {mkDipilih.semester} · {mkDipilih.tipe}
          </div>
        </div>
      )}

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
        ℹ️ Pilih komponen di bawah — deskripsi MK akan <strong>terbentuk otomatis</strong> sesuai pola standar ITS.
      </div>

      {/* Komponen Pengetahuan & Ketrampilan */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 12, padding: '6px 12px', background: 'var(--color-gray-50)', borderRadius: 6 }}>
          📘 Komponen: Pengetahuan &amp; Ketrampilan
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 13 }}>Jenis MK <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['wajib', 'pilihan'].map(j => (
                <button key={j}
                  onClick={() => upd('jenis_mk', j)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
                    fontWeight: desMk.jenis_mk === j ? 700 : 400,
                    background: desMk.jenis_mk === j ? 'var(--color-primary)' : 'var(--color-gray-100)',
                    color: desMk.jenis_mk === j ? 'white' : 'var(--color-gray-700)',
                  }}
                >
                  {j.charAt(0).toUpperCase() + j.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <SelDes label="Kemampuan *" field="kemampuan" opts={KEMAMPUAN_OPTS} />
        </div>
        <SelDes label="Jenis Pengetahuan *" field="jenis_pengetahuan" opts={JENIS_PENGETAHUAN_OPTS} />
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 13 }}>Kelompok Bahan Kajian <span style={{ fontSize: 11, color: 'var(--color-gray-500)', fontWeight: 400 }}>(ketik bebas)</span></label>
          <textarea className="form-textarea" rows={2} style={{ fontSize: 13 }}
            placeholder="mis: perkembangan proses desain di era digital; peran perancang dalam platform digital; ..."
            value={desMk.bahan_kajian_des}
            onChange={e => upd('bahan_kajian_des', e.target.value)} />
        </div>
      </div>

      {/* Komponen Sikap & Metoda */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 12, padding: '6px 12px', background: 'var(--color-gray-50)', borderRadius: 6 }}>
          💡 Komponen: Sikap &amp; Metoda Pembelajaran
        </div>
        <SelDes label="Penugasan" field="penugasan_des" opts={PENUGASAN_DES_OPTS} />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <SelDes label="Metoda Pembelajaran-1" field="metoda_1" opts={METODA_OPTS} />
          <SelDes label="Tanda Baca" field="tanda_baca_1" opts={TANDA_BACA_OPTS} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <SelDes label="Metoda Pembelajaran-2 (opsional)" field="metoda_2" opts={METODA_OPTS} />
          <SelDes label="Tanda Baca" field="tanda_baca_2" opts={TANDA_BACA_OPTS} />
        </div>
        <SelDes label="Metoda Pembelajaran-3 (opsional)" field="metoda_3" opts={METODA_OPTS} />
      </div>

      {/* Preview */}
      {preview && (
        <div style={{ marginTop: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 6 }}>📋 Pernyataan Deskripsi MK (otomatis):</div>
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
            padding: '14px 16px', fontSize: 14, lineHeight: 1.7, color: 'var(--color-gray-800)',
          }}>
            {preview}
          </div>
        </div>
      )}

      {/* Fallback manual */}
      <details style={{ marginTop: 8 }}>
        <summary style={{ fontSize: 12, color: 'var(--color-gray-400)', cursor: 'pointer' }}>
          ✏️ Edit manual deskripsi (opsional)
        </summary>
        <div className="form-group" style={{ marginTop: 8 }}>
          <textarea className="form-textarea" rows={4} style={{ fontSize: 13 }}
            value={deskripsi}
            onChange={e => onChange(e.target.value)} />
        </div>
      </details>
    </div>
  );
}

// ─── Langkah 3: CPL ──────────────────────────────────────────────────────
function Step3CPL({ cplFiltered, cplDipilih, onChange, jenjang }) {
  const toggle = (id) => {
    onChange(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <div style={{
        background: '#EEF4FF',
        border: '1px solid #C7D7F9',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 20,
        fontSize: 14,
      }}>
        ℹ️ Daftar CPL di bawah sudah <strong>difilter otomatis</strong> untuk jenjang <strong>{jenjang}</strong>.
        Centang CPL yang dibebankan pada mata kuliah ini.
      </div>

      {cplFiltered.length === 0 ? (
        <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: 32 }}>
          Tidak ada data CPL untuk jenjang {jenjang}. Hubungi administrator.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {cplFiltered.map(cpl => (
            <label
              key={cpl.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '14px 16px',
                border: `2px solid ${cplDipilih.includes(cpl.id) ? 'var(--color-primary)' : 'var(--color-gray-200)'}`,
                borderRadius: 8,
                cursor: 'pointer',
                background: cplDipilih.includes(cpl.id) ? '#EEF4FF' : 'white',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="checkbox"
                checked={cplDipilih.includes(cpl.id)}
                onChange={() => toggle(cpl.id)}
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-primary)', marginBottom: 2 }}>
                  {cpl.nomor_cpl}
                  {cpl.kategori && <span style={{ color: 'var(--color-gray-500)', fontWeight: 400, marginLeft: 8 }}>({cpl.kategori})</span>}
                </div>
                <div style={{ fontSize: 14 }}>{cpl.deskripsi_id}</div>
                {cpl.deskripsi_en && (
                  <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginTop: 4, fontStyle: 'italic' }}>
                    {cpl.deskripsi_en}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      )}
      <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 12 }}>
        {cplDipilih.length} CPL dipilih
      </p>
    </div>
  );
}

// ─── Langkah 4: CPMK ─────────────────────────────────────────────────────
function Step4CPMK({ cpmk, onChange }) {
  const updateCPMK = (idx, field, val) => {
    const updated = [...cpmk];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange(updated);
  };

  const addCPMK = () => {
    onChange([...cpmk, { no: `CPMK-${cpmk.length + 1}`, deskripsi_id: '', deskripsi_en: '' }]);
  };

  const removeCPMK = (idx) => {
    if (cpmk.length <= 1) return;
    onChange(cpmk.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <p style={{ color: 'var(--color-gray-500)', fontSize: 14, marginBottom: 20 }}>
        Rumuskan Capaian Pembelajaran Mata Kuliah (CPMK) yang spesifik dan terukur.
        Gunakan kata kerja operasional Bloom (mis: menganalisis, merancang, mengevaluasi).
      </p>

      {cpmk.map((item, idx) => (
        <div
          key={idx}
          style={{
            border: '1px solid var(--color-gray-200)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            background: 'var(--color-gray-50)',
          }}
        >
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
            <div className="form-group" style={{ width: 120, margin: 0 }}>
              <label className="form-label" style={{ marginBottom: 4 }}>Kode</label>
              <input
                className="form-input"
                value={item.no}
                onChange={e => updateCPMK(idx, 'no', e.target.value)}
                placeholder="CPMK-1"
              />
            </div>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label className="form-label" style={{ marginBottom: 4 }}>Deskripsi (Bahasa Indonesia)</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={item.deskripsi_id}
                onChange={e => updateCPMK(idx, 'deskripsi_id', e.target.value)}
                placeholder="Mahasiswa mampu menganalisis dan merancang..."
              />
            </div>
            <button
              onClick={() => removeCPMK(idx)}
              disabled={cpmk.length <= 1}
              style={{
                background: 'none',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                borderRadius: 6,
                padding: '6px 10px',
                cursor: cpmk.length <= 1 ? 'not-allowed' : 'pointer',
                opacity: cpmk.length <= 1 ? 0.3 : 1,
                marginTop: 20,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ marginBottom: 4 }}>Deskripsi (English) <span style={{ opacity: 0.6, fontWeight: 400 }}>opsional</span></label>
            <textarea
              className="form-textarea"
              rows={2}
              value={item.deskripsi_en}
              onChange={e => updateCPMK(idx, 'deskripsi_en', e.target.value)}
              placeholder="Students are able to analyse and design..."
            />
          </div>
        </div>
      ))}

      <button className="btn btn-secondary" onClick={addCPMK}>
        + Tambah CPMK
      </button>
    </div>
  );
}

// ─── Langkah 5: Bahan Kajian & Pustaka ───────────────────────────────────
function Step5BahanKajian({ bahanKajian, setBahanKajian, prasyarat, setPrasyarat, pustakaUtama, setPustakaUtama, pustakaP, setPustakaP }) {
  const updateList = (list, setList, idx, val) => {
    const updated = [...list];
    updated[idx] = val;
    setList(updated);
  };

  const addItem = (list, setList) => setList([...list, '']);
  const removeItem = (list, setList, idx) => {
    if (list.length <= 1) return;
    setList(list.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {/* Bahan Kajian */}
      <div className="form-group">
        <label className="form-label">Bahan Kajian / Pokok Bahasan</label>
        {bahanKajian.map((b, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              className="form-input"
              value={b}
              onChange={e => updateList(bahanKajian, setBahanKajian, i, e.target.value)}
              placeholder={`Bahan Kajian ${i + 1}`}
            />
            <button
              onClick={() => removeItem(bahanKajian, setBahanKajian, i)}
              disabled={bahanKajian.length <= 1}
              style={{ background: 'none', border: '1px solid var(--color-gray-300)', borderRadius: 6, padding: '0 10px', cursor: 'pointer', flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={() => addItem(bahanKajian, setBahanKajian)}>
          + Tambah Bahan Kajian
        </button>
      </div>

      {/* Prasyarat */}
      <div className="form-group">
        <label className="form-label">Mata Kuliah Prasyarat <span style={{ opacity: 0.6, fontWeight: 400 }}>opsional</span></label>
        <input
          className="form-input"
          value={prasyarat}
          onChange={e => setPrasyarat(e.target.value)}
          placeholder="Perancangan Arsitektur 3, Asas Perancangan Arsitektur Kontekstual"
        />
        <p style={{ fontSize: 12, color: 'var(--color-gray-500)', marginTop: 4 }}>
          Pisahkan dengan koma jika lebih dari satu prasyarat.
        </p>
      </div>

      {/* Pustaka Utama */}
      <div className="form-group">
        <label className="form-label">Pustaka Utama</label>
        {pustakaUtama.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <textarea
              className="form-textarea"
              rows={2}
              value={p}
              onChange={e => updateList(pustakaUtama, setPustakaUtama, i, e.target.value)}
              placeholder="Nama Pengarang. (Tahun). Judul Buku. Penerbit."
            />
            <button
              onClick={() => removeItem(pustakaUtama, setPustakaUtama, i)}
              disabled={pustakaUtama.length <= 1}
              style={{ background: 'none', border: '1px solid var(--color-gray-300)', borderRadius: 6, padding: '0 10px', cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}
            >
              ✕
            </button>
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={() => addItem(pustakaUtama, setPustakaUtama)}>
          + Tambah Pustaka Utama
        </button>
      </div>

      {/* Pustaka Pendukung */}
      <div className="form-group">
        <label className="form-label">Pustaka Pendukung <span style={{ opacity: 0.6, fontWeight: 400 }}>opsional</span></label>
        {pustakaP.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <textarea
              className="form-textarea"
              rows={2}
              value={p}
              onChange={e => updateList(pustakaP, setPustakaP, i, e.target.value)}
              placeholder="Nama Pengarang. (Tahun). Judul Referensi. Sumber."
            />
            <button
              onClick={() => removeItem(pustakaP, setPustakaP, i)}
              disabled={pustakaP.length <= 1}
              style={{ background: 'none', border: '1px solid var(--color-gray-300)', borderRadius: 6, padding: '0 10px', cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}
            >
              ✕
            </button>
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={() => addItem(pustakaP, setPustakaP)}>
          + Tambah Pustaka Pendukung
        </button>
      </div>
    </div>
  );
}

// ─── Langkah 6: SAP Mingguan ─────────────────────────────────────────────
function Step6SAP({ sapMinggu, onChange, cpmk }) {
  const updateRow = (idx, field, val) => {
    const updated = [...sapMinggu];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange(updated);
  };

  const BENTUK_OPTIONS = [
    'kuliah (kelas)', 'studio', 'kuliah dan studio', 'kuliah lapangan',
    'penelitian', 'kerja praktek', 'ujian/evaluasi',
  ];

  const METODA_OPTIONS = [
    'diskusi kelompok', 'studi kasus', 'berbasis permasalahan', 'berbasis proyek',
    'simulasi', 'penemuan/discovery', 'kooperatif', 'kolaboratif', 'mandiri',
    'non-SCL (kuliah dan diskusi kelas)',
  ];

  return (
    <div>
      <p style={{ color: 'var(--color-gray-500)', fontSize: 14, marginBottom: 16 }}>
        Isi rencana perkuliahan untuk 16 minggu. Minggu 8 (UTS) dan Minggu 16 (UAS) sudah ditandai.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--color-primary)', color: 'white' }}>
              <th style={thStyle}>Minggu</th>
              <th style={thStyle}>Sub CPMK</th>
              <th style={{ ...thStyle, minWidth: 200 }}>Materi / Pokok Bahasan</th>
              <th style={thStyle}>Bentuk Pembelajaran</th>
              <th style={thStyle}>Metoda</th>
              <th style={thStyle}>Bobot (%)</th>
            </tr>
          </thead>
          <tbody>
            {sapMinggu.map((row, idx) => {
              const isUTS = row.minggu === 8;
              const isUAS = row.minggu === 16;
              // eslint-disable-next-line no-unused-vars
              const isEval = isUTS || isUAS;

              return (
                <tr
                  key={idx}
                  style={{
                    background: isUTS ? '#FEF9C3' : isUAS ? '#DCFCE7' : idx % 2 === 0 ? 'white' : 'var(--color-gray-50)',
                  }}
                >
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>
                    {row.minggu}
                    {isUTS && <div style={{ fontSize: 10, color: '#92400E', fontWeight: 600 }}>UTS</div>}
                    {isUAS && <div style={{ fontSize: 10, color: '#065F46', fontWeight: 600 }}>UAS</div>}
                  </td>
                  <td style={tdStyle}>
                    <select
                      className="form-select"
                      style={{ fontSize: 12, padding: '4px 6px' }}
                      value={row.sub_cpmk_no}
                      onChange={e => updateRow(idx, 'sub_cpmk_no', e.target.value)}
                    >
                      <option value="">—</option>
                      {cpmk.map(c => (
                        <option key={c.no} value={c.no}>{c.no}</option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      style={{ fontSize: 12, minHeight: 'unset', padding: '4px 8px' }}
                      value={row.materi}
                      onChange={e => updateRow(idx, 'materi', e.target.value)}
                      placeholder={isUTS ? 'Ujian Tengah Semester' : isUAS ? 'Ujian Akhir Semester' : 'Materi pertemuan...'}
                    />
                  </td>
                  <td style={tdStyle}>
                    <select
                      className="form-select"
                      style={{ fontSize: 12, padding: '4px 6px' }}
                      value={row.bentuk_pembelajaran}
                      onChange={e => updateRow(idx, 'bentuk_pembelajaran', e.target.value)}
                    >
                      {BENTUK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <select
                      className="form-select"
                      style={{ fontSize: 12, padding: '4px 6px' }}
                      value={row.metoda}
                      onChange={e => updateRow(idx, 'metoda', e.target.value)}
                    >
                      {METODA_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ fontSize: 12, padding: '4px 8px', width: 60, textAlign: 'center' }}
                      min={0}
                      max={100}
                      value={row.bobot_penilaian}
                      onChange={e => updateRow(idx, 'bobot_penilaian', Number(e.target.value))}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12, color: 'var(--color-gray-500)', marginTop: 12 }}>
        Total bobot: {sapMinggu.reduce((sum, r) => sum + (r.bobot_penilaian || 0), 0)}% (target: 100%)
      </p>
    </div>
  );
}

const thStyle = {
  padding: '10px 12px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 12,
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '8px 10px',
  borderBottom: '1px solid var(--color-gray-200)',
  verticalAlign: 'top',
};

// ─── Langkah 7: Ringkasan / Selesai ──────────────────────────────────────
function Step7Selesai({ mkDipilih, cplDipilih, cpmk, bahanKajian, daftarCPL }) {
  const cplSelected = daftarCPL.filter(c => cplDipilih.includes(c.id));

  return (
    <div>
      <div style={{
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: 8,
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 24 }}>✅</span>
        <div>
          <strong>Dokumen siap diselesaikan!</strong>
          <p style={{ fontSize: 14, color: '#166534', marginTop: 4 }}>
            Periksa ringkasan di bawah ini sebelum menyimpan sebagai dokumen final.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <SummaryCard title="Mata Kuliah">
          <div style={{ fontWeight: 700 }}>{mkDipilih?.kode_mk} — {mkDipilih?.nama_mk}</div>
          <div style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 4 }}>
            {mkDipilih?.sks} SKS · Jenjang {mkDipilih?.jenjang} · Semester {mkDipilih?.semester}
          </div>
        </SummaryCard>

        <SummaryCard title={`CPL Dibebankan (${cplSelected.length} CPL)`}>
          {cplSelected.map(c => (
            <div key={c.id} style={{ marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{c.nomor_cpl}</span>
              <span style={{ marginLeft: 8, fontSize: 13 }}>{c.deskripsi_id}</span>
            </div>
          ))}
        </SummaryCard>

        <SummaryCard title={`CPMK (${cpmk.length} capaian)`}>
          {cpmk.map((c, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{c.no}</span>
              <span style={{ marginLeft: 8, fontSize: 13 }}>{c.deskripsi_id}</span>
            </div>
          ))}
        </SummaryCard>

        <SummaryCard title={`Bahan Kajian (${bahanKajian.filter(b => b.trim()).length} topik)`}>
          {bahanKajian.filter(b => b.trim()).map((b, i) => (
            <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>• {b}</div>
          ))}
        </SummaryCard>
      </div>

      <div style={{
        background: '#FFF7ED',
        border: '1px solid #FED7AA',
        borderRadius: 8,
        padding: '12px 16px',
        marginTop: 20,
        fontSize: 14,
        color: '#92400E',
      }}>
        💡 Setelah disimpan, Anda dapat melihat dan mengunduh dokumen lengkap dari halaman Dasbor.
      </div>
    </div>
  );
}

function SummaryCard({ title, children }) {
  return (
    <div style={{
      border: '1px solid var(--color-gray-200)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{
        background: 'var(--color-gray-100)',
        padding: '10px 16px',
        fontWeight: 600,
        fontSize: 13,
        color: 'var(--color-gray-700)',
        borderBottom: '1px solid var(--color-gray-200)',
      }}>
        {title}
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  );
}
