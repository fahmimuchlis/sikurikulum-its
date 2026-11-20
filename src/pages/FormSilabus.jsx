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
  const [cplTipeMk, setCplTipeMk] = useState([]); // mapping CPL ↔ tipe MK

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
    deskripsi_tambahan: '',
  });
  const [cplDipilih, setCplDipilih] = useState([]); // array of CPL id
  const [deskripsiEn, setDeskripsiEn] = useState(''); // terjemahan Inggris deskripsi MK
  const [cpmk, setCpmk] = useState([{ tipe: 'kognitif', no: 'CPMK-1', deskripsi_id: '', deskripsi_en: '', kognitif_1: '', elemen_1: '', kata_hubung: '', kognitif_2: '', elemen_2: '', kognitif: '', psikomotorik: '', rincian: '', ukuran: '', afeksi: '', kegiatan_1: '', kegiatan_2: '' }]);
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

      // Ambil mapping CPL ↔ tipe MK
      const { data: cplTipeData } = await supabase
        .from('cpl_tipe_mk')
        .select('*');
      setCplTipeMk(cplTipeData || []);

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
          setDeskripsiEn(dok.deskripsi_mk_en || '');
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
              deskripsi_tambahan: dok.deskripsi_tambahan || '',
            });
          }
          setCplDipilih(dok.cpl_dipilih || []);
          const defaultCpmk = [{ tipe: 'kognitif', no: 'CPMK-1', deskripsi_id: '', deskripsi_en: '', kognitif_1: '', elemen_1: '', kata_hubung: '', rincian: '', ukuran: '', afeksi: '', kegiatan_1: '' }];
          setCpmk(dok.cpmk?.length > 0 ? dok.cpmk.map(c => ({ tipe: 'kognitif', kognitif_1: '', elemen_1: '', kata_hubung: '', rincian: '', ukuran: '', afeksi: '', kegiatan_1: '', ...c })) : defaultCpmk);
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

  // CPL yang otomatis terdeteksi dari tipe MK (berdasarkan cpl_tipe_mk)
  const cplOtomatis = mkDipilih
    ? cplTipeMk
        .filter(m => m.jenjang === mkDipilih.jenjang && m.kode_tipe === mkDipilih.kode_tipe)
        .map(m => m.nomor_cpl)
    : [];

  // Ketika MK dipilih, otomatis pre-select CPL yang terdeteksi
  const handleMkChange = useCallback((mk) => {
    setMkDipilih(mk);
    // Auto-detect CPL berdasarkan tipe MK — gunakan setter function agar dapat akses state terbaru
    setCplTipeMk(currentCplTipeMk => {
      if (mk && currentCplTipeMk.length > 0) {
        const nomorCplOtomatis = currentCplTipeMk
          .filter(m => m.jenjang === mk.jenjang && m.kode_tipe === mk.kode_tipe)
          .map(m => m.nomor_cpl);
        setDaftarCPL(currentDaftarCPL => {
          const cplIds = currentDaftarCPL
            .filter(c => c.jenjang === mk.jenjang && nomorCplOtomatis.includes(c.nomor_cpl))
            .map(c => c.id);
          setCplDipilih(cplIds);
          return currentDaftarCPL;
        });
      }
      return currentCplTipeMk;
    });
  }, []);

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
      deskripsi_tambahan: desMk.deskripsi_tambahan || null,
      deskripsi_mk_en: deskripsiEn || null,
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
  }, [mkDipilih, user, deskripsiMk, deskripsiEn, cplDipilih, cpmk, bahanKajian, prasyarat, pustakaUtama, pustakaP, sapMinggu, currentSilabusId]); // eslint-disable-line react-hooks/exhaustive-deps

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
              onChange={handleMkChange}
            />
          )}
          {step === 2 && (
            <Step2Deskripsi
              mkDipilih={mkDipilih}
              deskripsi={deskripsiMk}
              onChange={setDeskripsiMk}
              desMk={desMk}
              onChangeDesMk={setDesMk}
              deskripsiEn={deskripsiEn}
              onChangeDeskripsiEn={setDeskripsiEn}
            />
          )}
          {step === 3 && (
            <Step3CPL
              cplFiltered={cplFiltered}
              cplDipilih={cplDipilih}
              onChange={setCplDipilih}
              jenjang={mkDipilih?.jenjang}
              kodeTipeMk={mkDipilih?.kode_tipe}
              cplOtomatis={cplOtomatis}
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
const JENJANG_ORDER = ['S1', 'Profesi', 'S2', 'S3'];

function Step1PilihMK({ daftarMK, mkDipilih, onChange }) {
  const jenjangList = JENJANG_ORDER.filter(j => daftarMK.some(m => m.jenjang === j));
  const [filterJenjang, setFilterJenjang] = useState(mkDipilih?.jenjang || '');
  const [filterTipe, setFilterTipe] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterSks, setFilterSks] = useState('');
  const [cari, setCari] = useState('');

  // Ketika jenjang berubah, reset filter lainnya
  const handleJenjangChange = (j) => {
    setFilterJenjang(j);
    setFilterTipe('');
    setFilterSemester('');
  };

  // Daftar filter opsi berdasarkan jenjang terpilih
  const mkByJenjang = filterJenjang ? daftarMK.filter(m => m.jenjang === filterJenjang) : [];
  const tipeList = [...new Set(mkByJenjang.map(m => m.kode_tipe).filter(Boolean))].sort();
  const semesterList = [...new Set(mkByJenjang.map(m => m.semester).filter(Boolean))].sort((a,b) => a-b);
  const sksList = [...new Set(mkByJenjang.map(m => m.sks).filter(Boolean))].sort((a,b) => a-b);

  // Filter MK berdasarkan semua kriteria
  const mkFiltered = mkByJenjang.filter(m => {
    if (filterTipe && m.kode_tipe !== filterTipe) return false;
    if (filterSemester && m.semester !== parseInt(filterSemester)) return false;
    if (filterSks && m.sks !== parseInt(filterSks)) return false;
    if (cari && !m.nama_mk.toLowerCase().includes(cari.toLowerCase()) && !m.kode_mk.toLowerCase().includes(cari.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <p style={{ color: 'var(--color-gray-500)', fontSize: 14, marginBottom: 20 }}>
        Pilih jenjang terlebih dahulu, lalu gunakan filter untuk mempersempit pilihan mata kuliah.
      </p>

      {/* Step 1: Pilih Jenjang */}
      <div style={{ marginBottom: 20 }}>
        <label className="form-label" style={{ marginBottom: 8 }}>1. Pilih Jenjang <span style={{ color: 'var(--color-danger)' }}>*</span></label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {jenjangList.map(j => (
            <button
              key={j}
              type="button"
              onClick={() => handleJenjangChange(j)}
              style={{
                padding: '8px 20px',
                borderRadius: 20,
                border: `2px solid ${filterJenjang === j ? 'var(--color-primary)' : 'var(--color-gray-300)'}`,
                background: filterJenjang === j ? 'var(--color-primary)' : 'white',
                color: filterJenjang === j ? 'white' : 'var(--color-gray-700)',
                fontWeight: filterJenjang === j ? 700 : 400,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {j}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Filter (hanya tampil setelah jenjang dipilih) */}
      {filterJenjang && (
        <>
          <div style={{
            background: 'var(--color-gray-50)',
            border: '1px solid var(--color-gray-200)',
            borderRadius: 8,
            padding: '14px 16px',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-500)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              2. Filter Mata Kuliah (opsional)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-gray-600)', display: 'block', marginBottom: 4 }}>Tipe MK</label>
                <select className="form-select" style={{ fontSize: 13 }} value={filterTipe} onChange={e => setFilterTipe(e.target.value)}>
                  <option value="">— Semua Tipe —</option>
                  {tipeList.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-gray-600)', display: 'block', marginBottom: 4 }}>Semester</label>
                <select className="form-select" style={{ fontSize: 13 }} value={filterSemester} onChange={e => setFilterSemester(e.target.value)}>
                  <option value="">— Semua —</option>
                  {semesterList.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-gray-600)', display: 'block', marginBottom: 4 }}>SKS</label>
                <select className="form-select" style={{ fontSize: 13 }} value={filterSks} onChange={e => setFilterSks(e.target.value)}>
                  <option value="">— Semua —</option>
                  {sksList.map(s => <option key={s} value={s}>{s} SKS</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-gray-600)', display: 'block', marginBottom: 4 }}>Cari nama / kode</label>
                <input
                  className="form-input"
                  style={{ fontSize: 13 }}
                  placeholder="Ketik nama atau kode MK..."
                  value={cari}
                  onChange={e => setCari(e.target.value)}
                />
              </div>
            </div>
            {(filterTipe || filterSemester || filterSks || cari) && (
              <button
                type="button"
                onClick={() => { setFilterTipe(''); setFilterSemester(''); setFilterSks(''); setCari(''); }}
                style={{ marginTop: 8, fontSize: 12, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕ Reset filter
              </button>
            )}
          </div>

          {/* Step 3: Daftar MK */}
          <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginBottom: 8 }}>
            3. Pilih Mata Kuliah — menampilkan {mkFiltered.length} dari {mkByJenjang.length} MK
          </div>
          <div style={{ display: 'grid', gap: 8, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
            {mkFiltered.map(mk => (
              <label
                key={mk.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 16px',
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
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', background: '#EEF4FF', padding: '1px 6px', borderRadius: 4 }}>
                      {mk.kode_mk}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-gray-500)', background: 'var(--color-gray-100)', padding: '1px 6px', borderRadius: 4 }}>
                      Sem {mk.semester}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-gray-500)', background: 'var(--color-gray-100)', padding: '1px 6px', borderRadius: 4 }}>
                      {mk.sks} SKS
                    </span>
                    {mk.kode_tipe && (
                      <span style={{ fontSize: 11, color: '#7c3aed', background: '#f5f3ff', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                        {mk.kode_tipe}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{mk.nama_mk}</div>
                </div>
              </label>
            ))}
            {mkFiltered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-gray-400)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <p style={{ fontSize: 14 }}>Tidak ada mata kuliah yang cocok dengan filter ini.</p>
              </div>
            )}
          </div>

          {mkDipilih && (
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 8,
              fontSize: 13,
            }}>
              ✅ <strong>Terpilih:</strong> {mkDipilih.kode_mk} — {mkDipilih.nama_mk}
              {mkDipilih.kode_tipe && <span style={{ color: '#7c3aed', marginLeft: 8 }}>({mkDipilih.kode_tipe})</span>}
            </div>
          )}
        </>
      )}

      {!filterJenjang && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-400)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
          <p style={{ fontSize: 14 }}>Pilih jenjang terlebih dahulu untuk melihat daftar mata kuliah.</p>
        </div>
      )}
    </div>
  );
}

// ─── Langkah 2: Deskripsi MK ─────────────────────────────────────────────
const KEMAMPUAN_OPTS = ['mendalami', 'memahami', 'menerapkan', 'menganalisis', 'mengembangkan', 'merancang'];
const JENIS_PENGETAHUAN_OPTS = ['teori dan prinsip', 'teori dan konteks', 'teori dasar', 'konsep teoritis', 'konsep rancangan', 'prinsip', 'proses', 'prosedur', 'strategi', 'metoda', 'desain'];
const PENUGASAN_DES_OPTS = ['secara mandiri', 'secara berkelompok', 'secara mandiri dan berkelompok'];
const METODA_OPTS = ['diskusi kelompok', 'studi kasus', 'berbasis permasalahan', 'berbasis proyek', 'simulasi', 'penemuan/discovery', 'kontekstual', 'kooperatif', 'kolaboratif', 'mandiri', 'bertukar matra/flipped', 'bauran/blended', 'non-SCL (kuliah dan diskusi kelas)', 'ujian/evaluasi'];
const TANDA_BACA_OPTS = ['.', ',', '; ', 'dan', 'serta'];

const SUPABASE_FN_URL = 'https://hohzdezcdcpjjpabuhge.supabase.co/functions/v1/translate-desc';

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

function Step2Deskripsi({ mkDipilih, deskripsi, onChange, desMk, onChangeDesMk, deskripsiEn, onChangeDeskripsiEn }) {
  const preview = buildDeskripsiStatement(mkDipilih, desMk);
  const [deskripsiTambahan, setDeskripsiTambahan] = useState(desMk.deskripsi_tambahan || '');
  const [translating, setTranslating] = useState(false);
  const [transError, setTransError] = useState('');
  const [enEdited, setEnEdited] = useState(false); // apakah user sudah edit manual terjemahan

  // sync generated statement to deskripsiMk whenever preview changes
  React.useEffect(() => {
    if (preview) onChange(preview);
  }, [preview]); // eslint-disable-line react-hooks/exhaustive-deps

  // sync deskripsi_tambahan ke desMk
  React.useEffect(() => {
    onChangeDesMk(prev => ({ ...prev, deskripsi_tambahan: deskripsiTambahan }));
  }, [deskripsiTambahan]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-translate ketika preview atau tambahan berubah (debounce 800ms)
  React.useEffect(() => {
    if (!preview && !deskripsiTambahan) return;
    if (enEdited) return; // jangan overwrite kalau user sudah edit manual
    const timer = setTimeout(async () => {
      setTranslating(true);
      setTransError('');
      try {
        const res = await fetch(SUPABASE_FN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text_id: preview, deskripsi_tambahan: deskripsiTambahan }),
        });
        const data = await res.json();
        if (data.translation) {
          onChangeDeskripsiEn(data.translation);
        }
      } catch {
        setTransError('Gagal memuat terjemahan otomatis.');
      } finally {
        setTranslating(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [preview, deskripsiTambahan]); // eslint-disable-line react-hooks/exhaustive-deps

  const upd = (key, val) => onChangeDesMk(prev => ({ ...prev, [key]: val }));

  // Teks lengkap Indonesia = template + tambahan
  const deskripsiFullId = [preview, deskripsiTambahan].filter(Boolean).join(' ');

  return (
    <div>
      {/* Info MK */}
      {mkDipilih && (
        <div style={{ background: 'var(--color-gray-50)', border: '1px solid var(--color-gray-200)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-gray-500)', marginBottom: 2 }}>Mata Kuliah</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{mkDipilih.kode_mk} — {mkDipilih.nama_mk}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 'auto' }}>
            <span style={{ fontSize: 11, background: '#EEF4FF', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{mkDipilih.jenjang}</span>
            <span style={{ fontSize: 11, background: 'var(--color-gray-100)', color: 'var(--color-gray-600)', padding: '2px 8px', borderRadius: 10 }}>Sem {mkDipilih.semester}</span>
            <span style={{ fontSize: 11, background: 'var(--color-gray-100)', color: 'var(--color-gray-600)', padding: '2px 8px', borderRadius: 10 }}>{mkDipilih.sks} SKS</span>
            {mkDipilih.kode_tipe && <span style={{ fontSize: 11, background: '#f5f3ff', color: '#7c3aed', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{mkDipilih.kode_tipe}</span>}
          </div>
        </div>
      )}

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13 }}>
        ℹ️ Pilih komponen di bawah — deskripsi MK terbentuk otomatis sesuai <strong>pola standar ITS</strong>, lalu Anda bisa tambahkan narasi bebas. Terjemahan Inggris disarankan otomatis di panel kanan.
      </div>

      {/* Layout utama: form kiri, preview dua kolom kanan */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── KOLOM KIRI: Form input ── */}
        <div>
          {/* A. Pengetahuan & Ketrampilan */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '5px 10px', background: '#EEF4FF', borderRadius: 6, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>A</span> Pengetahuan &amp; Ketrampilan
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 12 }}>① Jenis MK</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['wajib', 'pilihan'].map(j => (
                    <button key={j} type="button"
                      onClick={() => upd('jenis_mk', j)}
                      style={{
                        flex: 1, padding: '7px', borderRadius: 6, border: `1px solid ${desMk.jenis_mk === j ? 'var(--color-primary)' : 'var(--color-gray-300)'}`,
                        cursor: 'pointer', fontSize: 12, fontWeight: desMk.jenis_mk === j ? 700 : 400,
                        background: desMk.jenis_mk === j ? 'var(--color-primary)' : 'white',
                        color: desMk.jenis_mk === j ? 'white' : 'var(--color-gray-600)',
                      }}
                    >
                      {j.charAt(0).toUpperCase() + j.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 12 }}>② Kemampuan <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <select className="form-select" style={{ fontSize: 12 }} value={desMk.kemampuan} onChange={e => upd('kemampuan', e.target.value)}>
                  <option value="">— pilih —</option>
                  {KEMAMPUAN_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 8, marginTop: 8 }}>
              <label className="form-label" style={{ fontSize: 12 }}>③ Jenis Pengetahuan <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select className="form-select" style={{ fontSize: 12 }} value={desMk.jenis_pengetahuan} onChange={e => upd('jenis_pengetahuan', e.target.value)}>
                <option value="">— pilih —</option>
                {JENIS_PENGETAHUAN_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 12 }}>④ Kelompok Bahan Kajian <span style={{ fontSize: 11, color: 'var(--color-gray-400)', fontWeight: 400 }}>(ketik bebas)</span></label>
              <textarea className="form-textarea" rows={2} style={{ fontSize: 12 }}
                placeholder="mis: aspek lingkungan dan keberlanjutan dalam perancangan arsitektur tropis..."
                value={desMk.bahan_kajian_des}
                onChange={e => upd('bahan_kajian_des', e.target.value)} />
            </div>
          </div>

          {/* B. Sikap & Metoda */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '5px 10px', background: '#e0f2fe', borderRadius: 6, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>B</span> Sikap &amp; Metoda Pembelajaran
            </div>
            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="form-label" style={{ fontSize: 12 }}>① Bentuk Penugasan</label>
              <select className="form-select" style={{ fontSize: 12 }} value={desMk.penugasan_des} onChange={e => upd('penugasan_des', e.target.value)}>
                <option value="">— pilih —</option>
                {PENUGASAN_DES_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ display: 'grid', gridTemplateColumns: n < 3 ? '3fr 1fr' : '1fr', gap: 6, marginBottom: 6 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>② Metoda {n === 1 ? '' : n === 2 ? '2 ' : '3 '}{n > 1 ? '(opsional)' : ''}</label>
                  <select className="form-select" style={{ fontSize: 12 }} value={desMk[`metoda_${n}`]} onChange={e => upd(`metoda_${n}`, e.target.value)}>
                    <option value="">— pilih —</option>
                    {METODA_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                {n < 3 && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>Pemisah</label>
                    <select className="form-select" style={{ fontSize: 12 }} value={desMk[`tanda_baca_${n}`]} onChange={e => upd(`tanda_baca_${n}`, e.target.value)}>
                      {TANDA_BACA_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* C. Deskripsi Tambahan */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '5px 10px', background: '#d1fae5', borderRadius: 6, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>C</span> Deskripsi Tambahan <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none' }}>(opsional — narasi bebas)</span>
            </div>
            <textarea
              className="form-textarea"
              rows={3}
              style={{ fontSize: 12 }}
              placeholder="Tambahkan penjelasan lebih spesifik tentang konteks, pendekatan, atau keunikan mata kuliah ini..."
              value={deskripsiTambahan}
              onChange={e => { setDeskripsiTambahan(e.target.value); setEnEdited(false); }}
            />
            <p style={{ fontSize: 11, color: 'var(--color-gray-400)', marginTop: 4 }}>
              Narasi bebas ini akan digabung dengan deskripsi template dan diterjemahkan.
            </p>
          </div>
        </div>

        {/* ── KOLOM KANAN: Preview dua bahasa ── */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-gray-600)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            📋 Pratinjau Deskripsi
          </div>

          {/* Bahasa Indonesia */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, background: '#1d4ed8', color: 'white', padding: '2px 8px', borderRadius: 10 }}>🇮🇩 Bahasa Indonesia</span>
              {deskripsiFullId && <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>terbentuk otomatis</span>}
            </div>
            <div style={{
              minHeight: 80,
              background: deskripsiFullId ? '#f8faff' : 'var(--color-gray-50)',
              border: `1px solid ${deskripsiFullId ? '#bfdbfe' : 'var(--color-gray-200)'}`,
              borderRadius: 8,
              padding: '12px 14px',
              fontSize: 13,
              lineHeight: 1.75,
              color: deskripsiFullId ? 'var(--color-gray-800)' : 'var(--color-gray-400)',
              fontStyle: deskripsiFullId ? 'normal' : 'italic',
            }}>
              {deskripsiFullId || 'Deskripsi akan muncul setelah mengisi komponen di kiri...'}
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-gray-200)' }} />
            <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>terjemahan</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-gray-200)' }} />
          </div>

          {/* Bahasa Inggris */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#b45309', color: 'white', padding: '2px 8px', borderRadius: 10 }}>🇬🇧 English</span>
                {translating && (
                  <span style={{ fontSize: 11, color: 'var(--color-gray-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid #bfdbfe', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                    menerjemahkan...
                  </span>
                )}
                {!translating && deskripsiEn && !enEdited && (
                  <span style={{ fontSize: 11, color: '#16a34a' }}>✓ saran AI</span>
                )}
                {enEdited && (
                  <span style={{ fontSize: 11, color: '#d97706' }}>✏️ diedit manual</span>
                )}
              </div>
              {deskripsiEn && enEdited && (
                <button
                  type="button"
                  onClick={() => { setEnEdited(false); }}
                  style={{ fontSize: 11, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  ↺ Muat ulang terjemahan
                </button>
              )}
            </div>
            <textarea
              className="form-textarea"
              rows={5}
              style={{ fontSize: 13, lineHeight: 1.75, background: enEdited ? '#fffbeb' : '#fafff9', borderColor: enEdited ? '#fcd34d' : '#bbf7d0' }}
              placeholder="Terjemahan Inggris akan muncul otomatis..."
              value={deskripsiEn}
              onChange={e => { onChangeDeskripsiEn(e.target.value); setEnEdited(true); }}
            />
            {transError && <p style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 4 }}>{transError}</p>}
            <p style={{ fontSize: 11, color: 'var(--color-gray-400)', marginTop: 4 }}>
              Terjemahan istilah standar diisi otomatis. Anda dapat mengedit bagian narasi bebas.
            </p>
          </div>

          {/* Summary card */}
          {deskripsiFullId && (
            <div style={{ marginTop: 16, padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#166534', marginBottom: 6 }}>✅ Ringkasan Komponen</div>
              <div style={{ fontSize: 11, color: 'var(--color-gray-600)', lineHeight: 1.6 }}>
                {desMk.jenis_mk && <div>• Jenis: <strong>{desMk.jenis_mk}</strong></div>}
                {desMk.kemampuan && <div>• Kemampuan: <strong>{desMk.kemampuan}</strong></div>}
                {desMk.jenis_pengetahuan && <div>• Pengetahuan: <strong>{desMk.jenis_pengetahuan}</strong></div>}
                {desMk.penugasan_des && <div>• Penugasan: <strong>{desMk.penugasan_des}</strong></div>}
                {[desMk.metoda_1, desMk.metoda_2, desMk.metoda_3].filter(Boolean).length > 0 && (
                  <div>• Metoda: <strong>{[desMk.metoda_1, desMk.metoda_2, desMk.metoda_3].filter(Boolean).join(', ')}</strong></div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Langkah 3: CPL ──────────────────────────────────────────────────────
function Step3CPL({ cplFiltered, cplDipilih, onChange, jenjang, kodeTipeMk, cplOtomatis }) {
  const toggle = (id) => {
    onChange(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const jumlahOtomatis = cplFiltered.filter(c => cplOtomatis.includes(c.nomor_cpl)).length;
  const jumlahLainnya = cplFiltered.length - jumlahOtomatis;

  return (
    <div>
      {/* Info otomatis */}
      {cplOtomatis.length > 0 ? (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 8,
          padding: '14px 16px',
          marginBottom: 20,
          fontSize: 14,
        }}>
          <div style={{ fontWeight: 600, color: '#166534', marginBottom: 6 }}>
            ✅ {jumlahOtomatis} CPL terdeteksi otomatis untuk Tipe MK: <strong>{kodeTipeMk}</strong>
          </div>
          <div style={{ color: '#15803d', fontSize: 13 }}>
            CPL yang disorot hijau sudah dipilihkan sesuai kurikulum. Anda dapat menambah atau melepas centang sesuai kebutuhan mata kuliah.
          </div>
        </div>
      ) : (
        <div style={{
          background: '#EEF4FF',
          border: '1px solid #C7D7F9',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: 14,
        }}>
          ℹ️ Daftar CPL di bawah sudah <strong>difilter otomatis</strong> untuk jenjang <strong>{jenjang}</strong>.
          {kodeTipeMk && <span> Centang CPL yang sesuai dengan tipe MK <strong>{kodeTipeMk}</strong>.</span>}
        </div>
      )}

      {cplFiltered.length === 0 ? (
        <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: 32 }}>
          Tidak ada data CPL untuk jenjang {jenjang}. Hubungi administrator.
        </p>
      ) : (
        <>
          {/* CPL yang otomatis terdeteksi */}
          {jumlahOtomatis > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, padding: '4px 10px', background: '#dcfce7', borderRadius: 4, display: 'inline-block' }}>
                📌 CPL Sesuai Tipe MK ({kodeTipeMk})
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {cplFiltered.filter(c => cplOtomatis.includes(c.nomor_cpl)).map(cpl => (
                  <label
                    key={cpl.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 16px',
                      border: `2px solid ${cplDipilih.includes(cpl.id) ? '#16a34a' : '#86efac'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: cplDipilih.includes(cpl.id) ? '#f0fdf4' : '#fafff9',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={cplDipilih.includes(cpl.id)}
                      onChange={() => toggle(cpl.id)}
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#15803d' }}>{cpl.nomor_cpl}</span>
                        {cpl.kategori && <span style={{ fontSize: 11, color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: 10 }}>{cpl.kategori}</span>}
                        <span style={{ fontSize: 11, color: '#15803d', background: '#dcfce7', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>✓ sesuai kurikulum</span>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--color-gray-800)' }}>{cpl.deskripsi_id}</div>
                      {cpl.deskripsi_en && (
                        <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginTop: 3, fontStyle: 'italic' }}>
                          {cpl.deskripsi_en}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* CPL lainnya (tidak terdeteksi otomatis) */}
          {jumlahLainnya > 0 && (
            <div>
              {jumlahOtomatis > 0 && (
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, padding: '4px 10px', background: 'var(--color-gray-100)', borderRadius: 4, display: 'inline-block' }}>
                  CPL Lainnya (opsional / lintas tipe)
                </div>
              )}
              <div style={{ display: 'grid', gap: 8 }}>
                {cplFiltered.filter(c => !cplOtomatis.includes(c.nomor_cpl)).map(cpl => (
                  <label
                    key={cpl.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 16px',
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
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-primary)' }}>{cpl.nomor_cpl}</span>
                        {cpl.kategori && <span style={{ fontSize: 11, color: 'var(--color-gray-500)', background: 'var(--color-gray-100)', padding: '1px 6px', borderRadius: 10 }}>{cpl.kategori}</span>}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--color-gray-800)' }}>{cpl.deskripsi_id}</div>
                      {cpl.deskripsi_en && (
                        <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginTop: 3, fontStyle: 'italic' }}>
                          {cpl.deskripsi_en}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--color-gray-50)', borderRadius: 8, fontSize: 13, color: 'var(--color-gray-600)' }}>
        <strong>{cplDipilih.length}</strong> CPL dipilih
        {cplOtomatis.length > 0 && cplDipilih.length > 0 && (
          <span style={{ marginLeft: 8, color: 'var(--color-gray-400)' }}>
            ({cplDipilih.filter(id => {
              const cpl = cplFiltered.find(c => c.id === id);
              return cpl && cplOtomatis.includes(cpl.nomor_cpl);
            }).length} sesuai kurikulum)
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Builder helpers (sama dengan CpmkGenerator) ──────────────────────────
function buildCpmkStatement(tipe, fields) {
  if (tipe === 'kognitif') {
    const parts = ['Mampu'];
    if (fields.kognitif_1) parts.push(fields.kognitif_1);
    if (fields.elemen_1) parts.push(fields.elemen_1);
    if (fields.kata_hubung && fields.kognitif_2) { parts.push(fields.kata_hubung); parts.push(fields.kognitif_2); }
    if (fields.elemen_2) parts.push(fields.elemen_2);
    if (fields.rincian) parts.push(fields.rincian);
    if (fields.ukuran) parts.push(fields.ukuran);
    return parts.join(' ');
  }
  if (tipe === 'kognitif_psiko') {
    const parts = ['Mampu'];
    if (fields.kognitif) parts.push(fields.kognitif);
    if (fields.elemen_1) parts.push(fields.elemen_1);
    if (fields.kata_hubung && fields.psikomotorik) { parts.push(fields.kata_hubung); parts.push(fields.psikomotorik); }
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
    if (fields.kata_hubung && fields.kegiatan_2) { parts.push(fields.kata_hubung); parts.push(fields.kegiatan_2); }
    parts.push('materi/topik');
    if (fields.rincian) parts.push(fields.rincian);
    return parts.join(' ');
  }
  return '';
}

function SelInline({ label, value, onChange, options, required = false }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 3 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <select className="form-select" style={{ fontSize: 13 }} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">— pilih —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function CpmkBuilderForm({ tipe, fields, vocab, onChange }) {
  const preview = buildCpmkStatement(tipe, fields);
  const allKog = [...(vocab.kognitif_c1||[]), ...(vocab.kognitif_c2||[]), ...(vocab.kognitif_c3||[]),
    ...(vocab.kognitif_c4||[]), ...(vocab.kognitif_c5||[]), ...(vocab.kognitif_c6||[])];

  return (
    <div style={{ padding: '12px 0' }}>
      {tipe === 'kognitif' && <>
        <SelInline label="Kata Kerja Kognitif-1 (C1–C6)" value={fields.kognitif_1||''} onChange={v => onChange({...fields, kognitif_1: v})} options={allKog} required />
        <SelInline label="Elemen Pengetahuan-1" value={fields.elemen_1||''} onChange={v => onChange({...fields, elemen_1: v})} options={vocab.elemen_pengetahuan||[]} required />
        <SelInline label="Kata Hubung (opsional)" value={fields.kata_hubung||''} onChange={v => onChange({...fields, kata_hubung: v})} options={vocab.kata_hubung||[]} />
        {fields.kata_hubung && <>
          <SelInline label="Kata Kerja Kognitif-2" value={fields.kognitif_2||''} onChange={v => onChange({...fields, kognitif_2: v})} options={allKog} />
          <SelInline label="Elemen Pengetahuan-2" value={fields.elemen_2||''} onChange={v => onChange({...fields, elemen_2: v})} options={vocab.elemen_pengetahuan||[]} />
        </>}
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 3 }}>Rincian / Topik Bahan Kajian <span style={{ color: '#ef4444' }}>*</span></label>
          <input className="form-input" style={{ fontSize: 13 }} value={fields.rincian||''} onChange={e => onChange({...fields, rincian: e.target.value})} placeholder="mis: digitalisasi konteks arsitektur" />
        </div>
        <SelInline label="Ukuran / Kriteria" value={fields.ukuran||''} onChange={v => onChange({...fields, ukuran: v})} options={vocab.ukuran||[]} required />
      </>}

      {tipe === 'kognitif_psiko' && <>
        <SelInline label="Kata Kerja Kognitif" value={fields.kognitif||''} onChange={v => onChange({...fields, kognitif: v})} options={[...(vocab.kognitif_c4||[]), ...(vocab.kognitif_c5||[]), ...(vocab.kognitif_c6||[])]} required />
        <SelInline label="Elemen Pengetahuan-1" value={fields.elemen_1||''} onChange={v => onChange({...fields, elemen_1: v})} options={vocab.elemen_pengetahuan||[]} required />
        <SelInline label="Kata Hubung" value={fields.kata_hubung||''} onChange={v => onChange({...fields, kata_hubung: v})} options={vocab.kata_hubung||[]} />
        <SelInline label="Kata Kerja Psikomotorik" value={fields.psikomotorik||''} onChange={v => onChange({...fields, psikomotorik: v})} options={vocab.psikomotorik||[]} required />
        <SelInline label="Elemen-2 / Obyek" value={fields.elemen_2||''} onChange={v => onChange({...fields, elemen_2: v})} options={vocab.elemen_pengetahuan||[]} />
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 3 }}>Rincian / Topik <span style={{ color: '#ef4444' }}>*</span></label>
          <input className="form-input" style={{ fontSize: 13 }} value={fields.rincian||''} onChange={e => onChange({...fields, rincian: e.target.value})} placeholder="mis: cara berpikir merancang digital" />
        </div>
        <SelInline label="Ukuran / Kriteria" value={fields.ukuran||''} onChange={v => onChange({...fields, ukuran: v})} options={vocab.ukuran||[]} required />
      </>}

      {tipe === 'afeksi' && <>
        <SelInline label="Sikap Afektif" value={fields.afeksi||''} onChange={v => onChange({...fields, afeksi: v})} options={vocab.afektif||[]} required />
        <SelInline label="Kegiatan-1" value={fields.kegiatan_1||''} onChange={v => onChange({...fields, kegiatan_1: v})} options={vocab.kegiatan||[]} required />
        <SelInline label="Kata Hubung (opsional)" value={fields.kata_hubung||''} onChange={v => onChange({...fields, kata_hubung: v})} options={vocab.kata_hubung_afeksi||[]} />
        {fields.kata_hubung && <SelInline label="Kegiatan-2" value={fields.kegiatan_2||''} onChange={v => onChange({...fields, kegiatan_2: v})} options={vocab.kegiatan||[]} />}
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 3 }}>Topik / Rincian <span style={{ color: '#ef4444' }}>*</span></label>
          <input className="form-input" style={{ fontSize: 13 }} value={fields.rincian||''} onChange={e => onChange({...fields, rincian: e.target.value})} placeholder="mis: berpikir merancang digital" />
        </div>
      </>}

      {/* Preview */}
      {preview && preview !== 'Mampu' && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.6, color: '#1e293b', marginTop: 8, fontStyle: 'italic' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', fontStyle: 'normal' }}>Preview: </span>
          {preview}
        </div>
      )}
    </div>
  );
}

const EMPTY_CPMK_FIELDS = {
  tipe: 'kognitif',
  kognitif_1: '', elemen_1: '', kata_hubung: '', kognitif_2: '', elemen_2: '',
  kognitif: '', psikomotorik: '',
  rincian: '', ukuran: '',
  afeksi: '', kegiatan_1: '', kegiatan_2: '',
};

// ─── Langkah 4: CPMK ─────────────────────────────────────────────────────
function Step4CPMK({ cpmk, onChange }) {
  const [vocab, setVocab] = useState({});
  const [vocabLoaded, setVocabLoaded] = useState(false);
  const [expanded, setExpanded] = useState(0); // index yang terbuka

  useEffect(() => {
    supabase.from('source_vocabulary').select('*').then(({ data, error }) => {
      if (error) console.error('vocab load error:', error);
      if (data) {
        const v = {};
        data.forEach(r => {
          if (!v[r.kategori]) v[r.kategori] = [];
          v[r.kategori].push(r.nilai);
        });
        setVocab(v);
      }
      setVocabLoaded(true); // selalu set, agar spinner tidak hang selamanya
    });
  }, []);

  const updateItem = (idx, patch) => {
    const updated = [...cpmk];
    updated[idx] = { ...updated[idx], ...patch };
    // sync deskripsi_id dari builder
    if (patch.tipe !== undefined || Object.keys(patch).some(k => k !== 'no' && k !== 'deskripsi_en')) {
      const item = updated[idx];
      const stmt = buildCpmkStatement(item.tipe || 'kognitif', item);
      if (stmt && stmt !== 'Mampu') updated[idx].deskripsi_id = stmt;
    }
    onChange(updated);
  };

  const addCPMK = () => {
    const newIdx = cpmk.length;
    onChange([...cpmk, { ...EMPTY_CPMK_FIELDS, no: `CPMK-${newIdx + 1}`, deskripsi_id: '', deskripsi_en: '' }]);
    setExpanded(newIdx);
  };

  const removeCPMK = (idx) => {
    if (cpmk.length <= 1) return;
    onChange(cpmk.filter((_, i) => i !== idx));
    setExpanded(Math.max(0, idx - 1));
  };

  const TIPE_OPTS = [
    { value: 'kognitif', label: '🧠 Kognitif', desc: 'Memahami / menganalisis / merancang' },
    { value: 'kognitif_psiko', label: '🤝 Kognitif + Psikomotorik', desc: 'Menganalisis + melakukan/membuat' },
    { value: 'afeksi', label: '❤️ Afeksi / Sikap', desc: 'Menunjukkan sikap etika, kemandirian' },
  ];

  return (
    <div>
      <p style={{ color: 'var(--color-gray-500)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
        Susun CPMK menggunakan <strong>pola kalimat ITS</strong> — pilih tipe, isi dropdown, preview otomatis tampil.
        {!vocabLoaded && <span style={{ color: '#f59e0b', marginLeft: 8 }}>⏳ Memuat kosakata...</span>}
      </p>

      {cpmk.map((item, idx) => {
        const isOpen = expanded === idx;
        const preview = buildCpmkStatement(item.tipe || 'kognitif', item);
        const hasContent = preview && preview !== 'Mampu';

        return (
          <div key={idx} style={{ border: `2px solid ${isOpen ? 'var(--color-primary)' : '#e2e8f0'}`, borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
            {/* Header accordion */}
            <div
              onClick={() => setExpanded(isOpen ? -1 : idx)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: isOpen ? '#eff6ff' : '#f8fafc', cursor: 'pointer' }}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: isOpen ? 'var(--color-primary)' : '#cbd5e1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>CPMK-{idx + 1}</div>
                <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {hasContent ? preview : '— belum diisi —'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {hasContent && <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>✓ Terisi</span>}
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Body accordion */}
            {isOpen && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0' }}>
                {/* Kode & Tipe */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: '0 0 120px' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 3 }}>Kode</label>
                    <input className="form-input" style={{ fontSize: 13 }} value={item.no || `CPMK-${idx+1}`}
                      onChange={e => updateItem(idx, { no: e.target.value })} />
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 3 }}>Tipe CPMK</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {TIPE_OPTS.map(t => (
                        <button key={t.value} type="button"
                          onClick={() => updateItem(idx, { tipe: t.value })}
                          title={t.desc}
                          style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${(item.tipe||'kognitif') === t.value ? 'var(--color-primary)' : '#cbd5e1'}`, background: (item.tipe||'kognitif') === t.value ? '#eff6ff' : 'white', color: (item.tipe||'kognitif') === t.value ? 'var(--color-primary)' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Builder form */}
                {vocabLoaded ? (
                  <CpmkBuilderForm
                    tipe={item.tipe || 'kognitif'}
                    fields={item}
                    vocab={vocab}
                    onChange={fields => updateItem(idx, fields)}
                  />
                ) : (
                  <div style={{ padding: '16px', background: '#fefce8', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                    ⏳ Memuat kosakata dari database...
                  </div>
                )}

                {/* Deskripsi English */}
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 3 }}>
                    Deskripsi (English) <span style={{ opacity: 0.6, fontWeight: 400 }}>opsional</span>
                  </label>
                  <textarea className="form-textarea" rows={2} style={{ fontSize: 13 }}
                    value={item.deskripsi_en || ''}
                    onChange={e => updateItem(idx, { deskripsi_en: e.target.value })}
                    placeholder="Students are able to..." />
                </div>

                {/* Hapus */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button onClick={() => removeCPMK(idx)} disabled={cpmk.length <= 1}
                    style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 6, padding: '5px 14px', fontSize: 13, cursor: cpmk.length <= 1 ? 'not-allowed' : 'pointer', opacity: cpmk.length <= 1 ? 0.3 : 1 }}>
                    🗑 Hapus CPMK ini
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button className="btn btn-secondary" onClick={addCPMK} style={{ marginTop: 4 }}>
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
