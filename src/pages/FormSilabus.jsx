import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import FormLayout, { SectionTooltip } from '../components/FormLayout';

// Daftar nama langkah wizard
const STEPS = [
  { id: 1, label: 'Pilih MK',      short: 'MK',   title: 'Pilih Mata Kuliah' },
  { id: 2, label: 'Deskripsi',     short: 'Des',  title: 'Deskripsi Mata Kuliah' },
  { id: 3, label: 'CPL',           short: 'CPL',  title: 'Capaian Pembelajaran Lulusan (CPL)' },
  { id: 4, label: 'CPMK',          short: 'CPMK', title: 'Capaian Pembelajaran Mata Kuliah (CPMK)' },
  { id: 5, label: 'Bahan Kajian',  short: 'BK',   title: 'Bahan Kajian & Pustaka' },
  { id: 6, label: 'SAP',           short: 'SAP',  title: 'Rencana Perkuliahan per Minggu' },
  { id: 7, label: 'Selesai',       short: 'Done', title: 'Simpan & Selesai' },
];

// ── Panduan tooltip per langkah ───────────────────────────────────────────────
const STEP_HINTS = {
  1: (
    <div>
      <b>Pilih Mata Kuliah</b> yang akan Anda susun kurikulumnya.
      <br /><br />
      Daftar MK sudah terfilter sesuai mata kuliah yang Anda ampu. Jenjang dan semester akan menentukan pilihan CPL di langkah berikutnya.
    </div>
  ),
  2: (
    <div>
      <b>Deskripsi Mata Kuliah</b> berisi gambaran umum isi, pendekatan, dan output MK.
      <br /><br />
      • <b>Pengetahuan & Ketrampilan:</b> pilih kata kerja kognitif (tahu, memahami, menerapkan…) dan jenis pengetahuan (faktual, prosedural, dll.)
      <br />• <b>Kelompok Bahan Kajian:</b> topik/tema utama yang dipelajari, 1–2 frasa singkat
      <br />• <b>Metoda Pembelajaran:</b> cara utama belajar (ceramah, studio, diskusi…)
      <br />• <b>Deskripsi Tambahan:</b> narasi bebas untuk melengkapi konteks MK
    </div>
  ),
  3: (
    <div>
      <b>Capaian Pembelajaran Lulusan (CPL)</b> adalah standar kemampuan lulusan program studi.
      <br /><br />
      Pilih CPL yang <i>dibebankan</i> ke MK ini. CPL yang sudah dipilih akan muncul di peta kurikulum sebelah kanan.
      <br /><br />
      Untuk jenjang S1: biasanya 2–4 CPL per MK. Untuk S2/S3: bisa lebih spesifik.
    </div>
  ),
  4: (
    <div>
      <b>CPMK</b> adalah kemampuan spesifik yang ingin dicapai mahasiswa setelah mengikuti MK ini.
      <br /><br />
      • Maks. <b>6 CPMK</b> per mata kuliah
      <br />• Setiap CPMK punya <b>tipe</b>: Kognitif, Psikomotorik, Gabungan, atau Afeksi
      <br />• Kalimat CPMK dibangun otomatis dari pilihan kata kerja
      <br />• Tambahkan <b>Sub-CPMK</b> (maks. 2 per CPMK) untuk rincian lebih spesifik
    </div>
  ),
  5: (
    <div>
      <b>Bahan Kajian</b> adalah topik/materi yang akan dipelajari sepanjang semester.
      <br /><br />
      • Tulis 3–8 bahan kajian utama (tiap baris = satu topik)
      <br />• <b>Prasyarat MK:</b> MK lain yang harus sudah diambil sebelum MK ini
      <br />• <b>Pustaka Utama:</b> referensi wajib (buku teks, artikel standar)
      <br />• <b>Pustaka Pendukung:</b> referensi tambahan/penunjang
    </div>
  ),
  6: (
    <div>
      <b>SAP (Satuan Acara Perkuliahan)</b> adalah rencana perkuliahan 16 minggu.
      <br /><br />
      • Minggu 8 = UTS, Minggu 16 = UAS (sudah ditetapkan otomatis)
      <br />• Kolom <b>Sub-CPMK</b>: pilih Sub-CPMK yang dicapai di minggu tersebut
      <br />• Kolom <b>Bobot</b>: persentase penilaian. Total harus = 100%
      <br />• Materi dan metoda bisa diisi berbeda tiap minggu
    </div>
  ),
  7: (
    <div>
      <b>Langkah terakhir</b> — tinjau ringkasan dokumen Anda.
      <br /><br />
      Klik <b>Selesaikan Dokumen</b> untuk mengubah status dari Draf menjadi Final. Dokumen Final akan muncul di Direktori Kurikulum dan bisa dilihat dosen lain.
      <br /><br />
      Anda masih bisa kembali ke langkah sebelumnya untuk merevisi.
    </div>
  ),
};

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
    metoda_2: '',
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
              metoda_2: dok.metoda_2 || '',
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

  // Canvas props — dikirim ke KurikulumCanvas
  const canvasProps = {
    mkDipilih,
    cplDipilih,
    daftarCPL,
    cpmk,
    bahanKajian,
    desMk,
    deskripsiEn,
  };

  return (
    <>
      <Navbar user={user} />
      <FormLayout
        silabusId={currentSilabusId}
        canvasProps={canvasProps}
        tabs={STEPS}
        activeTab={step - 1}
        onTabChange={(i) => {
          // Hanya izinkan jump ke step yang sudah dilalui atau 1 step ke depan
          if (i <= step - 1 || i === step) setStep(i + 1);
        }}
      >

        {/* ── Tombol kembali + judul ── */}
        <div style={{ padding: '8px 16px 6px', borderBottom: '1px solid #f1f5f9' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}
          >
            ← Dasbor
          </button>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 1 }}>
            {isEdit ? 'Edit Dokumen' : 'Dokumen Baru'}
          </div>
          {mkDipilih && (
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {mkDipilih.kode_mk} — {mkDipilih.nama_mk}
            </div>
          )}
        </div>

        {/* ── Step header dengan tooltip ── */}
        <SectionTooltip
          title={STEPS[step - 1].title}
          hint={STEP_HINTS[step]}
        >
          <div style={{
            padding: '8px 16px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                {STEPS[step - 1].title}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {saving && (
                <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div className="spinner spinner-primary" style={{ width: 12, height: 12 }} />
                  Menyimpan…
                </span>
              )}
              <span style={{ fontSize: 10, color: '#94a3b8', background: '#e2e8f0', borderRadius: 10, padding: '2px 8px' }}>
                💡 Hover untuk panduan
              </span>
            </div>
          </div>
        </SectionTooltip>

        {/* ── Error ── */}
        {error && <div className="error-msg" style={{ margin: '10px 16px' }}>⚠️ {error}</div>}

        {/* ── Konten step ── */}
        <div style={{ padding: '12px 16px' }}>
          {step === 1 && <Step1PilihMK daftarMK={daftarMK} mkDipilih={mkDipilih} onChange={handleMkChange} />}
          {step === 2 && <Step2Deskripsi mkDipilih={mkDipilih} deskripsi={deskripsiMk} onChange={setDeskripsiMk} desMk={desMk} onChangeDesMk={setDesMk} deskripsiEn={deskripsiEn} onChangeDeskripsiEn={setDeskripsiEn} />}
          {step === 3 && <Step3CPL cplFiltered={cplFiltered} cplDipilih={cplDipilih} onChange={setCplDipilih} jenjang={mkDipilih?.jenjang} kodeTipeMk={mkDipilih?.kode_tipe} cplOtomatis={cplOtomatis} />}
          {step === 4 && <Step4CPMK cpmk={cpmk} onChange={setCpmk} cplDipilih={cplDipilih} daftarCPL={daftarCPL} jenjang={mkDipilih?.jenjang} kodeTipe={mkDipilih?.kode_tipe} isStudio={mkDipilih?.tipe === 'studio'} />}
          {step === 5 && <Step5BahanKajian bahanKajian={bahanKajian} setBahanKajian={setBahanKajian} prasyarat={prasyarat} setPrasyarat={setPrasyarat} pustakaUtama={pustakaUtama} setPustakaUtama={setPustakaUtama} pustakaP={pustakaP} setPustakaP={setPustakaP} />}
          {step === 6 && <Step6SAP sapMinggu={sapMinggu} onChange={setSapMinggu} cpmk={cpmk} />}
          {step === 7 && <Step7Selesai mkDipilih={mkDipilih} cplDipilih={cplDipilih} cpmk={cpmk} bahanKajian={bahanKajian} daftarCPL={daftarCPL} />}
        </div>

        {/* ── Navigasi (fixed di bawah panel) ── */}
        <div style={{
          position: 'sticky', bottom: 0, background: 'white',
          borderTop: '1px solid #e2e8f0', padding: '10px 16px',
          display: 'flex', justifyContent: 'space-between', gap: 8,
        }}>
          <button className="btn btn-secondary btn-sm" onClick={handleBack} disabled={step === 1}>
            ← Sebelumnya
          </button>
          {step < 7 ? (
            <button className="btn btn-primary btn-sm" onClick={handleNext} disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} />Menyimpan…</> : 'Lanjut →'}
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleSelesai} disabled={saving} style={{ background: 'var(--color-success)' }}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} />Menyimpan…</> : '✅ Selesaikan'}
            </button>
          )}
        </div>

      </FormLayout>
    </>
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
// Tanda baca antar metoda ditentukan otomatis (koma + "dan") — tidak perlu input manual

const SUPABASE_FN_URL = 'https://hohzdezcdcpjjpabuhge.supabase.co/functions/v1/translate-desc';

// Tentukan jenis MK (wajib/pilihan) secara otomatis dari kode_tipe
function getJenisMkOtomatis(mk) {
  if (!mk) return 'wajib';
  const tipe = (mk.kode_tipe || '').toLowerCase();
  // Tipe yang termasuk "pilihan": pilihan, p-dasar, p-bidang, dis (doktor)
  if (['pilihan', 'p-dasar', 'p-bidang', 'dis'].includes(tipe)) return 'pilihan';
  return 'wajib';
}

function buildDeskripsiStatement(mk, des) {
  if (!mk || !des.kemampuan) return '';
  const jenis = getJenisMkOtomatis(mk);
  const parts = [`Mata kuliah ${jenis} yang mengembangkan kemampuan mahasiswa dalam`];
  parts.push(des.kemampuan);
  if (des.jenis_pengetahuan) parts.push(des.jenis_pengetahuan);
  if (des.bahan_kajian_des) parts.push(des.bahan_kajian_des);
  if (des.penugasan_des) parts.push(des.penugasan_des);
  parts.push('melalui perkuliahan dan pembelajaran');
  const metodaList = [des.metoda_1, des.metoda_2, des.metoda_3].filter(Boolean);
  if (metodaList.length === 1) parts.push(metodaList[0]);
  else if (metodaList.length === 2) parts.push(`${metodaList[0]} dan ${metodaList[1]}`);
  else if (metodaList.length === 3) parts.push(`${metodaList[0]}, ${metodaList[1]}, dan ${metodaList[2]}`);
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

      {/* Panduan mengisi Step 2 */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px', marginBottom: 20, fontSize: 13 }}>
        <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 8 }}>📝 Panduan Pengisian Deskripsi Mata Kuliah</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, color: '#1e3a8a' }}>
          <div style={{ background: 'white', borderRadius: 8, padding: '10px 12px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>🅰 Bagian A — Pengetahuan &amp; Ketrampilan</div>
            <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.7, color: '#374151' }}>
              <li><strong>① Kemampuan:</strong> pilih kata kerja aktif yang menggambarkan level kognitif lulusan (cth: <em>memahami, menerapkan, menghasilkan</em>)</li>
              <li><strong>② Jenis Pengetahuan:</strong> pilih jenis materi MK (faktual, konseptual, prosedural, atau meta-kognitif)</li>
              <li><strong>③ Kelompok Bahan Kajian:</strong> tuliskan tema/topik utama yang dipelajari, dalam 1–2 frasa singkat (cth: <em>aspek keberlanjutan dalam perancangan arsitektur tropis</em>)</li>
            </ul>
          </div>
          <div style={{ background: 'white', borderRadius: 8, padding: '10px 12px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>🅱 Bagian B — Sikap &amp; Metoda</div>
            <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.7, color: '#374151' }}>
              <li><strong>④ Bentuk Penugasan:</strong> cara mahasiswa mengerjakan (mandiri/kelompok)</li>
              <li><strong>⑤ Lingkup Kegiatan:</strong> jenis kegiatan akademik (kuliah, studio, penelitian, dll.)</li>
              <li><strong>⑥ Sikap/Etika:</strong> nilai-nilai yang ditanamkan selama proses belajar</li>
              <li><strong>⑦ Deskripsi Tambahan (opsional):</strong> narasi bebas untuk memperkaya deskripsi — konteks, pendekatan, atau keunikan MK ini</li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#3b82f6' }}>
          💡 Kalimat deskripsi terbentuk <strong>otomatis</strong> dari pilihan Anda sesuai pola standar ITS. Terjemahan Inggris otomatis tersedia di panel kanan.
        </div>
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
            {/* Jenis MK otomatis dari tipe MK yang dipilih */}
            <div style={{ marginBottom: 8, padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#475569' }}>
              <span style={{ fontWeight: 600 }}>Jenis MK:</span>{' '}
              <span style={{ textTransform: 'capitalize', color: 'var(--color-primary)', fontWeight: 700 }}>
                {getJenisMkOtomatis(mkDipilih)}
              </span>
              <span style={{ color: '#94a3b8', marginLeft: 6 }}>(otomatis dari tipe MK "{mkDipilih?.kode_tipe || '-'}")</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 12 }}>① Kemampuan <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <select className="form-select" style={{ fontSize: 12 }} value={desMk.kemampuan} onChange={e => upd('kemampuan', e.target.value)}>
                  <option value="">— pilih —</option>
                  {KEMAMPUAN_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 12 }}>② Jenis Pengetahuan <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <select className="form-select" style={{ fontSize: 12 }} value={desMk.jenis_pengetahuan} onChange={e => upd('jenis_pengetahuan', e.target.value)}>
                  <option value="">— pilih —</option>
                  {JENIS_PENGETAHUAN_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0, marginTop: 8 }}>
              <label className="form-label" style={{ fontSize: 12 }}>③ Kelompok Bahan Kajian <span style={{ fontSize: 11, color: 'var(--color-gray-400)', fontWeight: 400 }}>(ketik bebas)</span></label>
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
              <div key={n} className="form-group" style={{ marginBottom: 6 }}>
                <label className="form-label" style={{ fontSize: 12 }}>
                  ② Metoda Pembelajaran{n > 1 ? ` ${n}` : ''} {n > 1 && <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opsional)</span>}
                </label>
                <select className="form-select" style={{ fontSize: 12 }} value={desMk[`metoda_${n}`]} onChange={e => upd(`metoda_${n}`, e.target.value)}>
                  <option value="">— pilih —</option>
                  {METODA_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, marginBottom: 0 }}>
              Jika lebih dari 1 metoda dipilih, tanda baca otomatis disesuaikan (koma dan "dan").
            </p>
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

// ─── CPMK Builder helpers ─────────────────────────────────────────────────

// ── Vocab ITS (sesuai template resmi) ──────────────────────────────────────

// KOGNITIF: semua kata kerja (C1-C6, sesuai tabel ITS)
const KATA_KERJA_KOGNITIF = [
  'menyebut',           // C1 Remember
  'menjelaskan',        // C2 Understand
  'menerapkan',         // C3 Apply
  'menguraikan',        // C4 Analyse
  'mengevaluasi',       // C5 Evaluate
  'menghasilkan gagasan', // C6 Create
];

// ── Filter Kemampuan per Jenjang × Tipe MK (sesuai tabel resmi ITS) ─────────
//
// Kognitif: C1=menyebut, C2=menjelaskan, C3=menerapkan,
//           C4=menguraikan, C5=mengevaluasi, C6=menghasilkan gagasan
// Psikomotorik: P1=meniru, P2=melakukan sebagian, P3=menggabungkan,
//               P4=melakukan semua, P5=melakukan otomatis
//
// Kunci: `${jenjang}__${kode_tipe}` → { kog: [...], psiko: [...] }
//
// PROGRAM SARJANA (S1):
//   Pengantar: C1,C2 | P1,P2,P3
//   Dasar:     C1,C2,C3 | P1,P2,P3
//   Bidang:    C1,C2,C3,C4 | P1,P2,P3,P4
//   Pilihan:   C1,C2,C3,C4,C5 | P1,P2,P3,P4
//   DPA1:      C1,C2,C3,C4 | P1,P2,P3
//   DPA2:      C1,C2,C3,C4,C5 | P1,P2,P3,P4
//   PA:        C1,C2,C3,C4,C5 | P1,P2,P3,P4,P5
//   Prop-TA:   C1,C2,C3,C4,C5 | P1,P2,P3,P4,P5
//   TA:        C1,C2,C3,C4,C5,C6 | P1,P2,P3,P4,P5
//
// PROGRAM PROFESI (Profesi):
//   Dasar:     C1,C2,C3 | P1,P2,P3,P4
//   Bidang:    C1,C2,C3,C4,C5 | P1,P2,P3,P4
//   PPA:       C1,C2,C3,C4,C5 | P1,P2,P3,P4,P5
//
// PROGRAM MAGISTER (S2):
//   Umum:      C1,C2,C3,C4 | P1,P2,P3,P4
//   P-Dasar:   C1,C2,C3,C4 | P1,P2,P3,P4
//   P-Bidang:  C1,C2,C3,C4,C5 | P1,P2,P3,P4,P5
//   W-shop:    C1,C2,C3,C4,C5 | P1,P2,P3,P4
//   Prop-R:    C1,C2,C3,C4,C5,C6 | P1,P2,P3,P4,P5
//   Tesis-R:   C1,C2,C3,C4,C5,C6 | P1,P2,P3,P4,P5
//   PAL:       C1,C2,C3,C4 | P1,P2,P3,P4,P5
//   W-shop(P): C1,C2,C3,C4,C5 | P1,P2,P3,P4
//   Prop-PA:   C1,C2,C3,C4,C5,C6 | P1,P2,P3,P4,P5
//   Tesis-PA:  C1,C2,C3,C4,C5,C6 | P1,P2,P3,P4,P5
//
// PROGRAM DOKTOR (S3):
//   Umum:      C1,C2,C3,C4,C5 | P1,P2,P3,P4
//   Pilihan:   C1,C2,C3,C4,C5 | P1,P2,P3,P4
//   Prop-D:    C1,C2,C3,C4,C5 | P1,P2,P3,P4
//   DIS:       C1,C2,C3,C4,C5 | P1,P2,P3,P4,P5

const KK = {
  // Kognitif (C1-C6)
  kog: {
    C1:  'menyebut',
    C2:  'menjelaskan',
    C3:  'menerapkan',
    C4:  'menguraikan',
    C5:  'mengevaluasi',
    C6:  'menghasilkan gagasan',
  },
  // Psikomotorik (P1-P5)
  psi: {
    P1:  'meniru kegiatan',
    P2:  'melakukan sebagian kegiatan',
    P3:  'menggabungkan kegiatan',
    P4:  'melakukan semua kegiatan',
    P5:  'melakukan otomatis kegiatan',
  },
};

// Shorthand builder
const k = (...levels) => levels.map(l => KK.kog[l]);
const p = (...levels) => levels.map(l => KK.psi[l]);

const KEMAMPUAN_BY_JENJANG_TIPE = {
  // ── SARJANA ──────────────────────────────────────────────────────────
  'S1__pengantar':  { kog: k('C1','C2'),                       psiko: p('P1','P2','P3') },
  'S1__dasar':      { kog: k('C1','C2','C3'),                  psiko: p('P1','P2','P3') },
  'S1__bidang':     { kog: k('C1','C2','C3','C4'),             psiko: p('P1','P2','P3','P4') },
  'S1__pilihan':    { kog: k('C1','C2','C3','C4','C5'),        psiko: p('P1','P2','P3','P4') },
  'S1__dpa1':       { kog: k('C1','C2','C3','C4'),             psiko: p('P1','P2','P3') },
  'S1__dpa2':       { kog: k('C1','C2','C3','C4','C5'),        psiko: p('P1','P2','P3','P4') },
  'S1__pa':         { kog: k('C1','C2','C3','C4','C5'),        psiko: p('P1','P2','P3','P4','P5') },
  'S1__prop-ta':    { kog: k('C1','C2','C3','C4','C5'),        psiko: p('P1','P2','P3','P4','P5') },
  'S1__ta':         { kog: k('C1','C2','C3','C4','C5','C6'),   psiko: p('P1','P2','P3','P4','P5') },

  // ── PROFESI ──────────────────────────────────────────────────────────
  'Profesi__dasar':  { kog: k('C1','C2','C3'),                 psiko: p('P1','P2','P3','P4') },
  'Profesi__bidang': { kog: k('C1','C2','C3','C4','C5'),       psiko: p('P1','P2','P3','P4') },
  'Profesi__ppa':    { kog: k('C1','C2','C3','C4','C5'),       psiko: p('P1','P2','P3','P4','P5') },

  // ── MAGISTER ─────────────────────────────────────────────────────────
  'S2__umum':       { kog: k('C1','C2','C3','C4'),             psiko: p('P1','P2','P3','P4') },
  'S2__p-dasar':    { kog: k('C1','C2','C3','C4'),             psiko: p('P1','P2','P3','P4') },
  'S2__p-bidang':   { kog: k('C1','C2','C3','C4','C5'),        psiko: p('P1','P2','P3','P4','P5') },
  'S2__w-shop':     { kog: k('C1','C2','C3','C4','C5'),        psiko: p('P1','P2','P3','P4') },
  'S2__prop-r':     { kog: k('C1','C2','C3','C4','C5','C6'),   psiko: p('P1','P2','P3','P4','P5') },
  'S2__tesis-r':    { kog: k('C1','C2','C3','C4','C5','C6'),   psiko: p('P1','P2','P3','P4','P5') },
  'S2__pal':        { kog: k('C1','C2','C3','C4'),             psiko: p('P1','P2','P3','P4','P5') },
  'S2__w-shop-p':   { kog: k('C1','C2','C3','C4','C5'),        psiko: p('P1','P2','P3','P4') },
  'S2__prop-pa':    { kog: k('C1','C2','C3','C4','C5','C6'),   psiko: p('P1','P2','P3','P4','P5') },
  'S2__tesis-pa':   { kog: k('C1','C2','C3','C4','C5','C6'),   psiko: p('P1','P2','P3','P4','P5') },

  // ── DOKTOR ───────────────────────────────────────────────────────────
  'S3__umum':       { kog: k('C1','C2','C3','C4','C5'),        psiko: p('P1','P2','P3','P4') },
  'S3__pilihan':    { kog: k('C1','C2','C3','C4','C5'),        psiko: p('P1','P2','P3','P4') },
  'S3__prop-d':     { kog: k('C1','C2','C3','C4','C5'),        psiko: p('P1','P2','P3','P4') },
  'S3__dis':        { kog: k('C1','C2','C3','C4','C5'),        psiko: p('P1','P2','P3','P4','P5') },
};

// Helper: ambil kemampuan sesuai jenjang + kode_tipe (case-insensitive)
function getKemampuan(jenjang, kodeTipe) {
  if (!jenjang) return { kog: KATA_KERJA_KOGNITIF, psiko: KATA_KERJA_PSIKO };
  const key = `${jenjang}__${(kodeTipe || '').toLowerCase()}`;
  const found = KEMAMPUAN_BY_JENJANG_TIPE[key];
  if (found) return found;
  // Fallback: cari berdasarkan jenjang saja (ambil semua kata kerja jenjang tsb)
  const allForJenjang = Object.entries(KEMAMPUAN_BY_JENJANG_TIPE)
    .filter(([k]) => k.startsWith(`${jenjang}__`))
    .map(([, v]) => v);
  if (allForJenjang.length) {
    // Gabungkan semua pilihan (union) sebagai fallback
    const kogSet = new Set(allForJenjang.flatMap(v => v.kog));
    const psiSet = new Set(allForJenjang.flatMap(v => v.psiko));
    return { kog: [...kogSet], psiko: [...psiSet] };
  }
  return { kog: KATA_KERJA_KOGNITIF, psiko: KATA_KERJA_PSIKO };
}


// KOGNITIF: elemen pengetahuan
const ELEMEN_PENGETAHUAN = [
  'pengetahuan', 'data', 'cara berpikir', 'desain',
  'konsep rancangan', 'konsep teoritis', 'prinsip',
  'teori', 'teori dasar', 'teori dan prinsip', 'teori dan konteks',
  'konteks', 'model', 'metoda', 'strategi', 'proses', 'prosedur',
];

// UKURAN KETERCAPAIAN (sama untuk Kognitif & Psikomotorik)
const UKURAN_KETERCAPAIAN = [
  'sesuai literatur yang kredibel',
  'sesuai pedoman baku mutu',
  'sesuai literatur dan pedoman baku mutu',
];

// PSIKOMOTORIK: semua kata kerja (P1-P5, sesuai tabel ITS)
const KATA_KERJA_PSIKO = [
  'meniru kegiatan',              // P1 Procedural
  'melakukan sebagian kegiatan',  // P2 Partial-performance
  'menggabungkan kegiatan',       // P3 Coord-performance
  'melakukan semua kegiatan',     // P4 Conscious control
  'melakukan otomatis kegiatan',  // P5 Mastery
];

// PSIKOMOTORIK: objek kegiatan
const OBJEK_KEGIATAN_PSIKO = [
  'dokumen teknis', 'model', 'sajian grafis', 'kajian',
  'kritik', 'apresiasi pada', 'riset/penelitian', 'presentasi',
  'poster', 'diskusi', 'alat/perangkat', 'pameran',
];

// AFEKSI
const AFEKSI_PREFIX = 'Mampu menunjukkan sikap dan menjunjung tinggi etika akademik pada kegiatan';

const KEGIATAN_AFEKSI = [
  'perkuliahan dan diskusi',
  'bimbingan dan diskusi',
  'pembuatan tugas',
  'diskusi dan presentasi tugas',
  'pembuatan, diskusi dan presentasi tugas',
  'ujian',
];

// ── Builder: rakit kalimat CPMK dari fields ────────────────────────────────
// Tipe:
//   'kognitif'       → Mampu [kog1] [kog2] [elemen] [rincian] [ukuran]
//   'psikomotorik'   → Mampu [psiko1] [psiko2] [objek] [rincian] [ukuran]
//   'kognitif_psiko' → Mampu [kog1] [elemen] dan [psiko1] [objek] [rincian] [ukuran]
//   'afeksi'         → template baku ITS
function buildCpmkStatement(tipe, fields) {
  if (tipe === 'kognitif') {
    const parts = ['Mampu'];
    if (fields.kognitif_1) parts.push(fields.kognitif_1);
    if (fields.kognitif_2) { parts.push('dan'); parts.push(fields.kognitif_2); }
    if (fields.elemen_1) parts.push(fields.elemen_1);
    if (fields.rincian) parts.push(fields.rincian);
    if (fields.ukuran) parts.push(fields.ukuran);
    return parts.length > 1 ? parts.join(' ') + '.' : '';
  }
  if (tipe === 'psikomotorik') {
    const parts = ['Mampu'];
    if (fields.psiko_1) parts.push(fields.psiko_1);
    if (fields.psiko_2) { parts.push('dan'); parts.push(fields.psiko_2); }
    if (fields.objek_psiko) parts.push(fields.objek_psiko);
    if (fields.rincian) parts.push(fields.rincian);
    if (fields.ukuran) parts.push(fields.ukuran);
    return parts.length > 1 ? parts.join(' ') + '.' : '';
  }
  if (tipe === 'kognitif_psiko') {
    // Gabungan: "Mampu [kog] [elemen] dan [psiko] [objek] [rincian] [ukuran]."
    const parts = ['Mampu'];
    if (fields.kognitif_1) parts.push(fields.kognitif_1);
    if (fields.elemen_1) parts.push(fields.elemen_1);
    if (fields.psiko_1) { parts.push('dan'); parts.push(fields.psiko_1); }
    if (fields.objek_psiko) parts.push(fields.objek_psiko);
    if (fields.rincian) parts.push(fields.rincian);
    if (fields.ukuran) parts.push(fields.ukuran);
    return parts.length > 1 ? parts.join(' ') + '.' : '';
  }
  if (tipe === 'afeksi') {
    const kegiatan = [fields.kegiatan_1, fields.kegiatan_2].filter(Boolean);
    if (!kegiatan.length) return '';
    let keg = kegiatan.length === 1 ? kegiatan[0] : kegiatan[0] + ' dan ' + kegiatan[1];
    let result = `${AFEKSI_PREFIX} ${keg}`;
    if (fields.rincian) result += ` materi/topik ${fields.rincian}`;
    return result + '.';
  }
  return '';
}

// Render highlighted kalimat — warna berbeda per komponen
function CpmkPreviewHighlight({ tipe, fields }) {
  const stmt = buildCpmkStatement(tipe, fields);
  if (!stmt) return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Pilih komponen di kiri untuk melihat kalimat CPMK...</span>;

  const S = { fontSize: 15, lineHeight: 1.9 };
  const Muted = ({ children }) => <span style={{ color: '#64748b' }}>{children}</span>;
  const Blue = ({ children }) => <span style={{ color: '#1d4ed8', fontWeight: 700 }}>{children}</span>;
  const Green = ({ children }) => <span style={{ color: '#059669', fontWeight: 700 }}>{children}</span>;
  const Purple = ({ children }) => <span style={{ color: '#7c3aed', fontWeight: 700 }}>{children}</span>;
  const Orange = ({ children }) => <span style={{ color: '#d97706', fontWeight: 700 }}>{children}</span>;

  if (tipe === 'kognitif') {
    return (
      <span style={S}>
        <Muted>Mampu </Muted>
        {fields.kognitif_1 && <Blue>{fields.kognitif_1}</Blue>}
        {fields.kognitif_2 && <><Muted> dan </Muted><Blue>{fields.kognitif_2}</Blue></>}
        {fields.elemen_1 && <><Muted> </Muted><Green>{fields.elemen_1}</Green></>}
        {fields.rincian && <><Muted> </Muted><Purple>{fields.rincian}</Purple></>}
        {fields.ukuran && <><Muted> </Muted><Orange>{fields.ukuran}</Orange></>}
        <Muted>.</Muted>
      </span>
    );
  }

  if (tipe === 'psikomotorik') {
    return (
      <span style={S}>
        <Muted>Mampu </Muted>
        {fields.psiko_1 && <Blue>{fields.psiko_1}</Blue>}
        {fields.psiko_2 && <><Muted> dan </Muted><Blue>{fields.psiko_2}</Blue></>}
        {fields.objek_psiko && <><Muted> </Muted><Green>{fields.objek_psiko}</Green></>}
        {fields.rincian && <><Muted> </Muted><Purple>{fields.rincian}</Purple></>}
        {fields.ukuran && <><Muted> </Muted><Orange>{fields.ukuran}</Orange></>}
        <Muted>.</Muted>
      </span>
    );
  }

  if (tipe === 'kognitif_psiko') {
    // Gabungan: warna beda untuk bagian kognitif vs psikomotorik
    return (
      <span style={S}>
        <Muted>Mampu </Muted>
        {fields.kognitif_1 && <Blue>{fields.kognitif_1}</Blue>}
        {fields.elemen_1 && <><Muted> </Muted><Green>{fields.elemen_1}</Green></>}
        {fields.psiko_1 && <><Muted> dan </Muted><span style={{ color: '#7c3aed', fontWeight: 700 }}>{fields.psiko_1}</span></>}
        {fields.objek_psiko && <><Muted> </Muted><span style={{ color: '#059669', fontWeight: 700 }}>{fields.objek_psiko}</span></>}
        {fields.rincian && <><Muted> </Muted><Purple>{fields.rincian}</Purple></>}
        {fields.ukuran && <><Muted> </Muted><Orange>{fields.ukuran}</Orange></>}
        <Muted>.</Muted>
      </span>
    );
  }

  if (tipe === 'afeksi') {
    const kegiatan = [fields.kegiatan_1, fields.kegiatan_2].filter(Boolean);
    const kegStr = kegiatan.length === 1 ? kegiatan[0] : kegiatan.length === 2 ? kegiatan[0] + ' dan ' + kegiatan[1] : '';
    return (
      <span style={S}>
        <Muted>{AFEKSI_PREFIX} </Muted>
        {kegStr && <Blue>{kegStr}</Blue>}
        {fields.rincian && <><Muted> materi/topik </Muted><Purple>{fields.rincian}</Purple></>}
        <Muted>.</Muted>
      </span>
    );
  }

  return <span style={S}>{stmt}</span>;
}

// Selector dropdown bergaya
function SelDrop({ label, value, onChange, options, required = false, placeholder = '— pilih —' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <select
        className="form-select"
        style={{ fontSize: 13, borderColor: value ? '#6366f1' : undefined, background: value ? '#fafaf9' : undefined }}
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// Selector checkbox untuk daftar kata kerja (maks 2)
function CheckboxSelector({ label, options, val1, val2, onChange1, onChange2, required = false }) {
  const upd = (k) => {
    const isV1 = val1 === k;
    const isV2 = val2 === k;
    if (isV1) { onChange1(val2 || ''); onChange2(''); }
    else if (isV2) { onChange2(''); }
    else if (!val1) { onChange1(k); }
    else if (!val2) { onChange2(k); }
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>(pilih maks. 2)</span>
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {options.map(k => {
          const isV1 = val1 === k, isV2 = val2 === k;
          const isSel = isV1 || isV2;
          const canSel = isSel || !(val1 && val2);
          return (
            <label key={k} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 8,
              border: `1.5px solid ${isSel ? '#6366f1' : '#e2e8f0'}`,
              background: isSel ? '#eef2ff' : '#fafafa',
              cursor: canSel ? 'pointer' : 'not-allowed',
              opacity: !canSel ? 0.4 : 1,
              transition: 'all 0.15s',
            }}>
              <input type="checkbox" checked={isSel} disabled={!canSel}
                onChange={() => upd(k)} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: isSel ? 600 : 400, color: isSel ? '#4338ca' : '#374151' }}>
                {k}
                {isV1 && val2 && <span style={{ fontSize: 10, color: '#818cf8', marginLeft: 4 }}>①</span>}
                {isV2 && <span style={{ fontSize: 10, color: '#818cf8', marginLeft: 4 }}>②</span>}
              </span>
            </label>
          );
        })}
      </div>
      {(val1 || val2) && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#6366f1' }}>
          Terpilih: {[val1, val2].filter(Boolean).join(' dan ')}
        </div>
      )}
    </div>
  );
}

// Form builder dalam modal
function CpmkBuilderFields({ tipe, fields, onChange, jenjang, kodeTipe }) {
  const upd = patch => onChange({ ...fields, ...patch });
  // Kata kerja yang difilter sesuai jenjang × tipe MK
  const { kog: kkKog, psiko: kkPsiko } = getKemampuan(jenjang, kodeTipe);

  if (tipe === 'kognitif') return (
    <>
      {/* A: Kata Kerja Kognitif — maks 2 */}
      <CheckboxSelector
        label="① Kata Kerja Kognitif"
        options={kkKog}
        val1={fields.kognitif_1||''} val2={fields.kognitif_2||''}
        onChange1={v => upd({ kognitif_1: v })}
        onChange2={v => upd({ kognitif_2: v })}
        required
      />
      {/* B: Elemen Pengetahuan */}
      <SelDrop label="② Elemen Pengetahuan" value={fields.elemen_1||''} onChange={v => upd({elemen_1: v})} options={ELEMEN_PENGETAHUAN} required />
      {/* C: Rincian (manual) */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
          ③ Rincian Sub-Bahan Kajian <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input className="form-input" style={{ fontSize: 13 }} value={fields.rincian||''}
          onChange={e => upd({rincian: e.target.value})}
          placeholder="mis: digitalisasi dalam konteks arsitektur tropis" />
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>Ketik topik/bahan kajian spesifik MK ini</p>
      </div>
      {/* D: Ukuran */}
      <SelDrop label="④ Ukuran Ketercapaian" value={fields.ukuran||''} onChange={v => upd({ukuran: v})} options={UKURAN_KETERCAPAIAN} required />
    </>
  );

  if (tipe === 'psikomotorik') return (
    <>
      {/* A: Kata Kerja Psikomotorik — maks 2 */}
      <CheckboxSelector
        label="① Kata Kerja Psikomotorik"
        options={kkPsiko}
        val1={fields.psiko_1||''} val2={fields.psiko_2||''}
        onChange1={v => upd({ psiko_1: v })}
        onChange2={v => upd({ psiko_2: v })}
        required
      />
      {/* B: Objek kegiatan */}
      <SelDrop label="② Objek Kegiatan" value={fields.objek_psiko||''} onChange={v => upd({objek_psiko: v})} options={OBJEK_KEGIATAN_PSIKO} required />
      {/* C: Rincian (manual) */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
          ③ Rincian Sub-Bahan Kajian <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input className="form-input" style={{ fontSize: 13 }} value={fields.rincian||''}
          onChange={e => upd({rincian: e.target.value})}
          placeholder="mis: perancangan sistem informasi berbasis web" />
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>Ketik topik/bahan kajian spesifik MK ini</p>
      </div>
      {/* D: Ukuran */}
      <SelDrop label="④ Ukuran Ketercapaian" value={fields.ukuran||''} onChange={v => upd({ukuran: v})} options={UKURAN_KETERCAPAIAN} required />
    </>
  );

  if (tipe === 'kognitif_psiko') return (
    <>
      {/* Banner penjelasan gabungan */}
      <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: '#6d28d9', lineHeight: 1.5 }}>
        <strong>Gabungan Kognitif + Psikomotorik</strong> — masing-masing 1 kemampuan.<br/>
        Format: <em>Mampu [kognitif] [elemen] dan [psikomotorik] [objek] [rincian] [ukuran]</em>
      </div>

      {/* Bagian Kognitif */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', marginBottom: 10 }}>🧠 BAGIAN KOGNITIF</div>
        <SelDrop label="① Kata Kerja Kognitif" value={fields.kognitif_1||''} onChange={v => upd({kognitif_1: v})} options={kkKog} required />
        <SelDrop label="② Elemen Pengetahuan" value={fields.elemen_1||''} onChange={v => upd({elemen_1: v})} options={ELEMEN_PENGETAHUAN} required />
      </div>

      {/* Penghubung */}
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#6d28d9', margin: '4px 0 8px' }}>
        — dan —
      </div>

      {/* Bagian Psikomotorik */}
      <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', marginBottom: 10 }}>🤝 BAGIAN PSIKOMOTORIK</div>
        <SelDrop label="③ Kata Kerja Psikomotorik" value={fields.psiko_1||''} onChange={v => upd({psiko_1: v})} options={kkPsiko} required />
        <SelDrop label="④ Objek Kegiatan" value={fields.objek_psiko||''} onChange={v => upd({objek_psiko: v})} options={OBJEK_KEGIATAN_PSIKO} required />
      </div>

      {/* Rincian & Ukuran (bersama) */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
          ⑤ Rincian Sub-Bahan Kajian <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input className="form-input" style={{ fontSize: 13 }} value={fields.rincian||''}
          onChange={e => upd({rincian: e.target.value})}
          placeholder="mis: perancangan struktur bangunan tahan gempa" />
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>Topik/bahan kajian spesifik MK ini</p>
      </div>
      <SelDrop label="⑥ Ukuran Ketercapaian" value={fields.ukuran||''} onChange={v => upd({ukuran: v})} options={UKURAN_KETERCAPAIAN} required />
    </>
  );

  if (tipe === 'afeksi') return (
    <>
      {/* Kalimat baku — read only */}
      <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>📌 Kalimat Baku (tetap)</span>
        <em>{AFEKSI_PREFIX}...</em>
      </div>

      {/* Pilih 1–2 kegiatan */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
          ① Jenis Kegiatan <span style={{ color: '#ef4444' }}>*</span>
          <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>(pilih maks. 2)</span>
        </label>
        <div style={{ display: 'grid', gap: 6 }}>
          {KEGIATAN_AFEKSI.map(k => {
            const isK1 = fields.kegiatan_1 === k;
            const isK2 = fields.kegiatan_2 === k;
            const isSelected = isK1 || isK2;
            const canSelect = isSelected || !(fields.kegiatan_1 && fields.kegiatan_2);
            return (
              <label
                key={k}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8, cursor: canSelect ? 'pointer' : 'not-allowed',
                  border: `1.5px solid ${isSelected ? '#6366f1' : '#e2e8f0'}`,
                  background: isSelected ? '#eef2ff' : '#fafafa',
                  opacity: !canSelect ? 0.4 : 1,
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!canSelect}
                  onChange={() => {
                    if (isK1) upd({ kegiatan_1: fields.kegiatan_2 || '', kegiatan_2: '' });
                    else if (isK2) upd({ kegiatan_2: '' });
                    else if (!fields.kegiatan_1) upd({ kegiatan_1: k });
                    else upd({ kegiatan_2: k });
                  }}
                  style={{ flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? '#4338ca' : '#374151' }}>
                  {k}
                  {isK1 && fields.kegiatan_2 && <span style={{ fontSize: 11, color: '#6366f1', marginLeft: 6 }}>kegiatan 1</span>}
                  {isK2 && <span style={{ fontSize: 11, color: '#6366f1', marginLeft: 6 }}>kegiatan 2</span>}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
          ② Topik / Materi <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          className="form-input"
          style={{ fontSize: 13 }}
          value={fields.rincian||''}
          onChange={e => upd({ rincian: e.target.value })}
          placeholder="mis: berpikir merancang digital"
        />
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>Isi topik/materi MK yang spesifik sesuai konteks</p>
      </div>
    </>
  );

  return null;
}

// ── Sub-CPMK Kognitif ────────────────────────────────────────────────────────
// Sub-kata kerja per level Bloom (C1–C6) sesuai ketentuan ITS
const SUB_KATA_KERJA_KOG = {
  'menyebut':            ['mengenali','mendeskripsikan','memasangkan','membuat daftar','memilih'],
  'menjelaskan':         ['mengklasifikasikan','menjelaskan','menyarikan','membedakan'],
  'menerapkan':          ['mendemonstrasikan','menghitung','menyelesaikan','mengadaptasi','menghubungkan'],
  'menguraikan':         ['menemukan perbedaan','memisahkan','menguraikan','menyusun urutan'],
  'mengevaluasi':        ['menimbang','mengkritik','membandingkan','membuat rasional','menyimpulkan','mendukung'],
  'menghasilkan gagasan':['menggabungkan','membangun gagasan','merancang','merumuskan','membuat komposisi'],
};

const BENTUK_PENUGASAN_SUBCPMK = [
  'secara mandiri',
  'secara berkelompok',
  'secara mandiri dan berkelompok',
];

const KRITERIA_KETERCAPAIAN_SUBCPMK = [
  'lengkap, sistematik, komunikatif dan akurat',
  'lengkap, sistematik, komunikatif dan mendalam',
  'lengkap, sistematik, komunikatif dan tajam',
  'lengkap, sistematik, komunikatif, kreatif dan inovatif',
  'lengkap dan sesuai prosedur',
  'kesungguhan',
  'kesungguhan dan keaktifan',
];

// Rakit kalimat Sub-CPMK Kognitif
// Pola: "Mampu [sub_kk] [elemen] [rincian_sub] [penugasan] berdasarkan acuan yang sahih dan dikerjakan dengan [kriteria]."
function buildSubCpmkKognitifStatement(fields) {
  const { sub_kk, elemen, rincian_sub, penugasan, kriteria } = fields;
  if (!sub_kk) return '';
  const parts = ['Mampu', sub_kk];
  if (elemen) parts.push(elemen);
  if (rincian_sub) parts.push(rincian_sub);
  if (penugasan) parts.push(penugasan);
  parts.push('berdasarkan acuan yang sahih dan dikerjakan dengan');
  if (kriteria) parts.push(kriteria);
  else return ''; // wajib ada kriteria
  return parts.join(' ') + '.';
}

const EMPTY_SUB_CPMK_KOG = {
  sub_kk: '', elemen: '', rincian_sub: '', penugasan: 'secara mandiri', kriteria: '',
};

// ── Sub-CPMK Psikomotorik ─────────────────────────────────────────────────────
// A. Kemampuan psikomotorik (dari kata kerja CPMK parent)
// B. Penjelasan kegiatan
const PENJELASAN_KEGIATAN_PSIKO = ['membuat', 'mengoperasikan', 'menggunakan', 'mempertunjukan'];
// C. Objek kegiatan (sama dengan yang ada di CPMK parent)
const OBJEK_KEGIATAN_PSIKO_SUB = [
  'dokumen teknis', 'model', 'sajian grafis', 'kajian',
  'kritik', 'apresiasi pada', 'riset/penelitian', 'presentasi',
  'poster', 'diskusi', 'alat/perangkat', 'pameran',
];
// D. Bentuk penugasan (sama dengan kognitif)
// E. Kriteria ketercapaian (sama dengan kognitif)

// Rakit kalimat Sub-CPMK Psikomotorik
// Pola: "Mampu [kemampuan_psiko] [penjelasan_keg] [objek] pada tugas [rincian_sub] [penugasan] berdasarkan panduan yang sahih dan dikerjakan dengan [kriteria]."
function buildSubCpmkPsikoStatement(fields) {
  const { kemampuan_psiko, penjelasan_keg, objek_sub, rincian_sub, penugasan, kriteria } = fields;
  if (!kemampuan_psiko || !penjelasan_keg || !objek_sub) return '';
  const parts = ['Mampu', kemampuan_psiko, penjelasan_keg, objek_sub];
  if (rincian_sub) parts.push('pada tugas', rincian_sub);
  if (penugasan) parts.push(penugasan);
  parts.push('berdasarkan panduan yang sahih dan dikerjakan dengan');
  if (kriteria) parts.push(kriteria);
  else return '';
  return parts.join(' ') + '.';
}

const EMPTY_SUB_CPMK_PSIKO = {
  kemampuan_psiko: '', penjelasan_keg: '', objek_sub: '',
  rincian_sub: '', penugasan: 'secara mandiri', kriteria: '',
};

// ── Sub-CPMK Afeksi ───────────────────────────────────────────────────────────
// A. Kata sikap (setelah "Mampu")
const KATA_SIKAP_AFEKSI = [
  'menunjukkan perhatian',
  'berpartisipasi',
  'menghargai upaya/pendapat',
  'mempertimbangkan sikap',
  'mengambil sikap',
];

// B. Jenis kegiatan (setelah "pada kegiatan")
const KEGIATAN_AFEKSI_SUB = [
  'perkuliahan dan diskusi',
  'bimbingan dan diskusi',
  'pembuatan tugas',
  'diskusi dan presentasi tugas',
  'pembuatan, diskusi dan presentasi tugas',
  'ujian',
];

// D. Bentuk penugasan (berbeda dari kognitif/psiko — konteks kelas)
const PENUGASAN_AFEKSI = [
  'di dalam kelompok',
  'di dalam kelas',
  'di dalam kelompok dan kelas',
];

// Rakit kalimat Sub-CPMK Afeksi
// Pola: "Mampu [kata_sikap] pada kegiatan [kegiatan] materi/topik [rincian_sub] [penugasan]."
function buildSubCpmkAfeksiStatement(fields) {
  const { kata_sikap, kegiatan, rincian_sub, penugasan } = fields;
  if (!kata_sikap || !kegiatan) return '';
  const parts = ['Mampu', kata_sikap, 'pada kegiatan', kegiatan];
  if (rincian_sub) parts.push('materi/topik', rincian_sub);
  if (penugasan) parts.push(penugasan);
  return parts.join(' ') + '.';
}

const EMPTY_SUB_CPMK_AFEKSI = {
  kata_sikap: '', kegiatan: '', rincian_sub: '', penugasan: 'di dalam kelas',
};

const EMPTY_CPMK_FIELDS = {
  tipe: 'kognitif',
  // Kognitif
  kognitif_1: '', kognitif_2: '', elemen_1: '',
  // Psikomotorik
  psiko_1: '', psiko_2: '', objek_psiko: '',
  // Bersama
  rincian: '', ukuran: '',
  // Afeksi
  kegiatan_1: '', kegiatan_2: '',
  cpl_ids: [], // CPL yang dipetakan ke CPMK ini
  sub_cpmk_kog: [],   // array of EMPTY_SUB_CPMK_KOG
  sub_cpmk_psiko: [], // array of EMPTY_SUB_CPMK_PSIKO
  sub_cpmk_afeksi: [], // array of EMPTY_SUB_CPMK_AFEKSI
};

// ── Generator Sub-CPMK Kognitif (panel di dalam modal CPMK) ──────────────────
function SubCpmkKognitifPanel({ subList, onChange, parentFields, tipe, totalSubCpmk }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  // Kumpulkan kata kerja kognitif dari parent CPMK (1 atau 2)
  const kkParent = [parentFields.kognitif_1, parentFields.kognitif_2].filter(Boolean);
  // Elemen pengetahuan diwariskan dari parent
  const elemenParent = parentFields.elemen_1 || '';

  // Limit: kognitif_psiko → max 1 Sub-CPMK kog; lainnya max 2 total
  const isGabungan = tipe === 'kognitif_psiko';
  const maxKog = isGabungan ? 1 : 2;
  const canAdd = subList.length < maxKog && (isGabungan || totalSubCpmk < 2);

  const addSub = () => {
    if (!canAdd) return;
    const newList = [...subList, { ...EMPTY_SUB_CPMK_KOG, elemen: elemenParent }];
    onChange(newList);
    setExpandedIdx(newList.length - 1);
  };

  const removeSub = (i) => {
    onChange(subList.filter((_, idx) => idx !== i));
    setExpandedIdx(null);
  };

  const updateSub = (i, patch) => {
    const updated = [...subList];
    updated[i] = { ...updated[i], ...patch };
    onChange(updated);
  };

  if (kkParent.length === 0) {
    return (
      <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
        ⚠️ Pilih kata kerja kognitif pada CPMK ini terlebih dahulu untuk bisa mengisi Sub-CPMK.
      </div>
    );
  }

  return (
    <div>
      {/* Panduan Sub-CPMK Kognitif */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 14px', fontSize: 12, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 6 }}>🧠 Panduan Sub-CPMK Kognitif — {parentFields.no || 'CPMK ini'}</div>
        <div style={{ color: '#1e3a8a', lineHeight: 1.7 }}>
          Sub-CPMK adalah <strong>rincian operasional</strong> dari CPMK induk yang memandu aktivitas pembelajaran per sesi/pertemuan.
        </div>
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div style={{ background: 'white', borderRadius: 7, padding: '7px 10px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontWeight: 600, color: '#1d4ed8', marginBottom: 3 }}>🔤 Sub-Kata Kerja</div>
            <div style={{ color: '#374151' }}>Pilih kata kerja turunan Bloom yang lebih spesifik dari kata kerja CPMK induk (cth: induk <em>menjelaskan</em> → sub <em>mengklasifikasikan</em>)</div>
          </div>
          <div style={{ background: 'white', borderRadius: 7, padding: '7px 10px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontWeight: 600, color: '#1d4ed8', marginBottom: 3 }}>📚 Elemen Pengetahuan</div>
            <div style={{ color: '#374151' }}>Topik spesifik yang dipelajari — diwariskan dari CPMK induk{elemenParent ? <>, saat ini: <em>"{elemenParent}"</em></> : ', bisa diubah sesuai rincian pertemuan'}.</div>
          </div>
          <div style={{ background: 'white', borderRadius: 7, padding: '7px 10px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontWeight: 600, color: '#1d4ed8', marginBottom: 3 }}>🗒 Rincian Sub-Bahan Kajian</div>
            <div style={{ color: '#374151' }}>Topik/materi yang lebih rinci untuk pertemuan ini (cth: <em>"teori dasar digitalisasi sebagai data rancang"</em>)</div>
          </div>
          <div style={{ background: 'white', borderRadius: 7, padding: '7px 10px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontWeight: 600, color: '#1d4ed8', marginBottom: 3 }}>📝 Bentuk Penugasan &amp; Kriteria</div>
            <div style={{ color: '#374151' }}>Cara mahasiswa mengerjakan (mandiri/kelompok) dan standar kualitas hasil (cth: <em>lengkap, sistematik, komunikatif dan akurat</em>)</div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#3b82f6' }}>
          💡 Pola kalimat otomatis: <em>"Mampu [sub-kata kerja] [elemen] [rincian] [penugasan] berdasarkan acuan yang sahih dan dikerjakan dengan [kriteria]."</em>
        </div>
      </div>

      {/* Daftar sub-CPMK */}
      {subList.map((sub, i) => {
        const stmt = buildSubCpmkKognitifStatement(sub);
        const isOpen = expandedIdx === i;
        return (
          <div key={i} style={{ border: `2px solid ${stmt ? '#a5b4fc' : '#e2e8f0'}`, borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
            {/* Header sub */}
            <div
              style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: 'pointer', background: isOpen ? '#f0f4ff' : 'white', gap: 8 }}
              onClick={() => setExpandedIdx(isOpen ? null : i)}
            >
              <span style={{ fontWeight: 700, fontSize: 12, color: '#4f46e5', flexShrink: 0 }}>Sub-CPMK {i + 1}</span>
              {stmt ? (
                <span style={{ fontSize: 12, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stmt}</span>
              ) : (
                <span style={{ fontSize: 12, color: '#94a3b8', flex: 1, fontStyle: 'italic' }}>Belum diisi</span>
              )}
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
              <button
                onClick={e => { e.stopPropagation(); removeSub(i); }}
                style={{ background: 'none', border: 'none', fontSize: 14, color: '#ef4444', cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}
                title="Hapus Sub-CPMK ini"
              >✕</button>
            </div>

            {/* Form detail */}
            {isOpen && (
              <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* A. Sub-kata kerja */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    A. Sub-Kata Kerja <span style={{ color: '#ef4444' }}>*</span>
                    <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>
                      (dari kata kerja CPMK: {kkParent.join(', ')})
                    </span>
                  </label>
                  <select
                    className="form-select"
                    style={{ fontSize: 13 }}
                    value={sub.sub_kk}
                    onChange={e => updateSub(i, { sub_kk: e.target.value })}
                  >
                    <option value="">— Pilih sub-kata kerja —</option>
                    {kkParent.map(kk => (
                      <optgroup key={kk} label={`Dari "${kk}"`}>
                        {(SUB_KATA_KERJA_KOG[kk] || []).map(skk => (
                          <option key={skk} value={skk}>{skk}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* B. Elemen pengetahuan (inherited) + Rincian sub-bahan kajian */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      B. Elemen Pengetahuan
                      <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>(dari CPMK)</span>
                    </label>
                    <input
                      className="form-input"
                      style={{ fontSize: 13, background: '#f8fafc' }}
                      value={sub.elemen || elemenParent}
                      onChange={e => updateSub(i, { elemen: e.target.value })}
                      placeholder={elemenParent || 'elemen pengetahuan...'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Rincian Sub-Bahan Kajian</label>
                    <input
                      className="form-input"
                      style={{ fontSize: 13 }}
                      value={sub.rincian_sub}
                      onChange={e => updateSub(i, { rincian_sub: e.target.value })}
                      placeholder="cth: teori dasar digitalisasi konteks sebagai data rancang"
                    />
                  </div>
                </div>

                {/* C. Bentuk penugasan */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    C. Bentuk Penugasan <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {BENTUK_PENUGASAN_SUBCPMK.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateSub(i, { penugasan: opt })}
                        style={{
                          padding: '6px 12px', fontSize: 12, borderRadius: 8, cursor: 'pointer', border: '2px solid',
                          borderColor: sub.penugasan === opt ? '#4f46e5' : '#e2e8f0',
                          background: sub.penugasan === opt ? '#eff0ff' : 'white',
                          color: sub.penugasan === opt ? '#4338ca' : '#64748b',
                          fontWeight: sub.penugasan === opt ? 700 : 400,
                          transition: 'all 0.15s',
                        }}
                      >{opt}</button>
                    ))}
                  </div>
                </div>

                {/* D. Kriteria ketercapaian */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    D. Kriteria Ketercapaian <span style={{ color: '#ef4444' }}>*</span>
                    <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>
                      (akan diawali "...dikerjakan dengan")
                    </span>
                  </label>
                  <select
                    className="form-select"
                    style={{ fontSize: 13 }}
                    value={sub.kriteria}
                    onChange={e => updateSub(i, { kriteria: e.target.value })}
                  >
                    <option value="">— Pilih kriteria —</option>
                    {KRITERIA_KETERCAPAIAN_SUBCPMK.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                {/* Preview kalimat sub-CPMK */}
                {buildSubCpmkKognitifStatement(sub) ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>✅ Pratinjau Sub-CPMK {i + 1}</div>
                    <p style={{ fontSize: 13, color: '#166534', margin: 0, lineHeight: 1.65, fontStyle: 'italic' }}>
                      {buildSubCpmkKognitifStatement(sub)}
                    </p>
                  </div>
                ) : (
                  <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#92400e' }}>
                    ⚠️ Lengkapi sub-kata kerja dan kriteria ketercapaian untuk melihat pratinjau kalimat.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addSub}
        disabled={!canAdd}
        title={
          !canAdd
            ? isGabungan
              ? 'CPMK Gabungan hanya dapat memiliki 1 Sub-CPMK Kognitif'
              : 'Maks. 2 Sub-CPMK per CPMK (total semua tipe)'
            : ''
        }
        style={{
          marginTop: 4, padding: '7px 14px', fontSize: 12, fontWeight: 600,
          color: canAdd ? '#4f46e5' : '#94a3b8',
          background: canAdd ? '#eff0ff' : '#f1f5f9',
          border: `1.5px dashed ${canAdd ? '#818cf8' : '#cbd5e1'}`,
          borderRadius: 8, cursor: canAdd ? 'pointer' : 'not-allowed',
        }}
      >
        {canAdd ? '+ Tambah Sub-CPMK Kognitif' : `✋ Maks. ${maxKog} Sub-CPMK Kognitif${!isGabungan && totalSubCpmk >= 2 ? ' (total 2 tercapai)' : ''}`}
      </button>
    </div>
  );
}

// ── Generator Sub-CPMK Psikomotorik (panel di dalam modal CPMK) ──────────────
function SubCpmkPsikoPanel({ subList, onChange, parentFields, tipe, totalSubCpmk }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  // Kata kerja psikomotorik dari parent CPMK (1 atau 2)
  const kkPsikoParent = [parentFields.psiko_1, parentFields.psiko_2].filter(Boolean);

  // Limit: kognitif_psiko → max 1 Sub-CPMK psiko; lainnya max 2 total
  const isGabungan = tipe === 'kognitif_psiko';
  const maxPsiko = isGabungan ? 1 : 2;
  const canAdd = subList.length < maxPsiko && (isGabungan || totalSubCpmk < 2);

  if (kkPsikoParent.length === 0) {
    return (
      <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
        ⚠️ Pilih kata kerja psikomotorik pada CPMK ini terlebih dahulu untuk bisa mengisi Sub-CPMK.
      </div>
    );
  }

  const addSub = () => {
    if (!canAdd) return;
    const newList = [...subList, { ...EMPTY_SUB_CPMK_PSIKO }];
    onChange(newList);
    setExpandedIdx(newList.length - 1);
  };

  const removeSub = (i) => {
    onChange(subList.filter((_, idx) => idx !== i));
    setExpandedIdx(null);
  };

  const updateSub = (i, patch) => {
    const updated = [...subList];
    updated[i] = { ...updated[i], ...patch };
    onChange(updated);
  };

  return (
    <div>
      {/* Panduan Sub-CPMK Psikomotorik */}
      <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '12px 14px', fontSize: 12, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, color: '#5b21b6', marginBottom: 6 }}>🤝 Panduan Sub-CPMK Psikomotorik — {parentFields.no || 'CPMK ini'}</div>
        <div style={{ color: '#4c1d95', lineHeight: 1.7 }}>
          Sub-CPMK Psikomotorik merinci <strong>keterampilan/aktivitas praktis</strong> yang dilakukan mahasiswa pada setiap sesi.
        </div>
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div style={{ background: 'white', borderRadius: 7, padding: '7px 10px', border: '1px solid #ddd6fe' }}>
            <div style={{ fontWeight: 600, color: '#7c3aed', marginBottom: 3 }}>💪 Kemampuan Psiko (dari CPMK)</div>
            <div style={{ color: '#374151' }}>Kata kerja psikomotorik dari CPMK induk — klik salah satu untuk memilih. Kata kerja aktif: {kkPsikoParent.join(', ')}.</div>
          </div>
          <div style={{ background: 'white', borderRadius: 7, padding: '7px 10px', border: '1px solid #ddd6fe' }}>
            <div style={{ fontWeight: 600, color: '#7c3aed', marginBottom: 3 }}>🔧 Penjelasan Kegiatan</div>
            <div style={{ color: '#374151' }}>Kata kerja spesifik aktivitas (cth: <em>membuat, mengoperasikan, mempertunjukan</em>). Pilih dari daftar yang tersedia.</div>
          </div>
          <div style={{ background: 'white', borderRadius: 7, padding: '7px 10px', border: '1px solid #ddd6fe' }}>
            <div style={{ fontWeight: 600, color: '#7c3aed', marginBottom: 3 }}>📦 Objek Kegiatan</div>
            <div style={{ color: '#374151' }}>Produk/artefak yang dihasilkan (cth: <em>dokumen teknis, model, sajian grafis, presentasi, poster</em>)</div>
          </div>
          <div style={{ background: 'white', borderRadius: 7, padding: '7px 10px', border: '1px solid #ddd6fe' }}>
            <div style={{ fontWeight: 600, color: '#7c3aed', marginBottom: 3 }}>🗒 Rincian Tugas &amp; Kriteria</div>
            <div style={{ color: '#374151' }}>Topik spesifik tugas dan standar kualitas pengerjaan (cth: <em>lengkap dan sesuai prosedur</em>)</div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#7c3aed' }}>
          💡 Pola kalimat otomatis: <em>"Mampu [kemampuan] [penjelasan_keg] [objek] pada tugas [rincian] [penugasan] berdasarkan panduan yang sahih dan dikerjakan dengan [kriteria]."</em>
        </div>
      </div>

      {subList.map((sub, i) => {
        const stmt = buildSubCpmkPsikoStatement(sub);
        const isOpen = expandedIdx === i;
        return (
          <div key={i} style={{ border: `2px solid ${stmt ? '#c4b5fd' : '#e2e8f0'}`, borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
            {/* Header sub */}
            <div
              style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: 'pointer', background: isOpen ? '#f5f3ff' : 'white', gap: 8 }}
              onClick={() => setExpandedIdx(isOpen ? null : i)}
            >
              <span style={{ fontWeight: 700, fontSize: 12, color: '#7c3aed', flexShrink: 0 }}>Sub-CPMK {i + 1}</span>
              {stmt ? (
                <span style={{ fontSize: 12, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stmt}</span>
              ) : (
                <span style={{ fontSize: 12, color: '#94a3b8', flex: 1, fontStyle: 'italic' }}>Belum diisi</span>
              )}
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
              <button
                onClick={e => { e.stopPropagation(); removeSub(i); }}
                style={{ background: 'none', border: 'none', fontSize: 14, color: '#ef4444', cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}
                title="Hapus Sub-CPMK ini"
              >✕</button>
            </div>

            {/* Form detail */}
            {isOpen && (
              <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* A. Kemampuan psikomotorik (dari kata kerja CPMK parent) */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    A. Kemampuan Psikomotorik <span style={{ color: '#ef4444' }}>*</span>
                    <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>(dari kata kerja CPMK)</span>
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {kkPsikoParent.map(kk => (
                      <button
                        key={kk}
                        type="button"
                        onClick={() => updateSub(i, { kemampuan_psiko: kk })}
                        style={{
                          padding: '6px 14px', fontSize: 12, borderRadius: 8, cursor: 'pointer', border: '2px solid',
                          borderColor: sub.kemampuan_psiko === kk ? '#7c3aed' : '#e2e8f0',
                          background: sub.kemampuan_psiko === kk ? '#f5f3ff' : 'white',
                          color: sub.kemampuan_psiko === kk ? '#6d28d9' : '#64748b',
                          fontWeight: sub.kemampuan_psiko === kk ? 700 : 400,
                        }}
                      >{kk}</button>
                    ))}
                  </div>
                </div>

                {/* B. Penjelasan kegiatan */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    B. Penjelasan Kegiatan <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {PENJELASAN_KEGIATAN_PSIKO.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateSub(i, { penjelasan_keg: opt })}
                        style={{
                          padding: '6px 12px', fontSize: 12, borderRadius: 8, cursor: 'pointer', border: '2px solid',
                          borderColor: sub.penjelasan_keg === opt ? '#7c3aed' : '#e2e8f0',
                          background: sub.penjelasan_keg === opt ? '#f5f3ff' : 'white',
                          color: sub.penjelasan_keg === opt ? '#6d28d9' : '#64748b',
                          fontWeight: sub.penjelasan_keg === opt ? 700 : 400,
                        }}
                      >{opt}</button>
                    ))}
                  </div>
                </div>

                {/* C. Objek kegiatan */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    C. Objek Kegiatan <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="form-select"
                    style={{ fontSize: 13 }}
                    value={sub.objek_sub}
                    onChange={e => updateSub(i, { objek_sub: e.target.value })}
                  >
                    <option value="">— Pilih objek kegiatan —</option>
                    {OBJEK_KEGIATAN_PSIKO_SUB.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                {/* Rincian tugas (opsional) */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Rincian Tugas / Sub-Bahan Kajian
                    <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>(opsional — akan diawali "pada tugas")</span>
                  </label>
                  <input
                    className="form-input"
                    style={{ fontSize: 13 }}
                    value={sub.rincian_sub}
                    onChange={e => updateSub(i, { rincian_sub: e.target.value })}
                    placeholder="cth: digitalisasi dan komputerisasi arsitektur"
                  />
                </div>

                {/* D. Bentuk penugasan */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    D. Bentuk Penugasan <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {BENTUK_PENUGASAN_SUBCPMK.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateSub(i, { penugasan: opt })}
                        style={{
                          padding: '6px 12px', fontSize: 12, borderRadius: 8, cursor: 'pointer', border: '2px solid',
                          borderColor: sub.penugasan === opt ? '#7c3aed' : '#e2e8f0',
                          background: sub.penugasan === opt ? '#f5f3ff' : 'white',
                          color: sub.penugasan === opt ? '#6d28d9' : '#64748b',
                          fontWeight: sub.penugasan === opt ? 700 : 400,
                          transition: 'all 0.15s',
                        }}
                      >{opt}</button>
                    ))}
                  </div>
                </div>

                {/* E. Kriteria ketercapaian */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    E. Kriteria Ketercapaian <span style={{ color: '#ef4444' }}>*</span>
                    <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>(akan diawali "...dikerjakan dengan")</span>
                  </label>
                  <select
                    className="form-select"
                    style={{ fontSize: 13 }}
                    value={sub.kriteria}
                    onChange={e => updateSub(i, { kriteria: e.target.value })}
                  >
                    <option value="">— Pilih kriteria —</option>
                    {KRITERIA_KETERCAPAIAN_SUBCPMK.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                {/* Preview kalimat */}
                {buildSubCpmkPsikoStatement(sub) ? (
                  <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>✅ Pratinjau Sub-CPMK {i + 1}</div>
                    <p style={{ fontSize: 13, color: '#4c1d95', margin: 0, lineHeight: 1.65, fontStyle: 'italic' }}>
                      {buildSubCpmkPsikoStatement(sub)}
                    </p>
                  </div>
                ) : (
                  <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#92400e' }}>
                    ⚠️ Lengkapi kemampuan, penjelasan kegiatan, objek, dan kriteria untuk melihat pratinjau.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addSub}
        disabled={!canAdd}
        title={
          !canAdd
            ? isGabungan
              ? 'CPMK Gabungan hanya dapat memiliki 1 Sub-CPMK Psikomotorik'
              : 'Maks. 2 Sub-CPMK per CPMK (total semua tipe)'
            : ''
        }
        style={{
          marginTop: 4, padding: '7px 14px', fontSize: 12, fontWeight: 600,
          color: canAdd ? '#7c3aed' : '#94a3b8',
          background: canAdd ? '#f5f3ff' : '#f1f5f9',
          border: `1.5px dashed ${canAdd ? '#a78bfa' : '#cbd5e1'}`,
          borderRadius: 8, cursor: canAdd ? 'pointer' : 'not-allowed',
        }}
      >
        {canAdd ? '+ Tambah Sub-CPMK Psikomotorik' : `✋ Maks. ${maxPsiko} Sub-CPMK Psiko${!isGabungan && totalSubCpmk >= 2 ? ' (total 2 tercapai)' : ''}`}
      </button>
    </div>
  );
}

// ── Generator Sub-CPMK Afeksi (panel di dalam modal CPMK) ────────────────────
function SubCpmkAfeksiPanel({ subList, onChange, parentFields, tipe, totalSubCpmk }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  // Max 2 Sub-CPMK Afeksi (1=tugas ATAU ujian, 2=tugas DAN ujian)
  const MAX_AFEKSI = 2;
  const canAdd = subList.length < MAX_AFEKSI;

  const addSub = () => {
    if (!canAdd) return;
    const newList = [...subList, { ...EMPTY_SUB_CPMK_AFEKSI }];
    onChange(newList);
    setExpandedIdx(newList.length - 1);
  };

  const removeSub = (i) => {
    onChange(subList.filter((_, idx) => idx !== i));
    setExpandedIdx(null);
  };

  const updateSub = (i, patch) => {
    const updated = [...subList];
    updated[i] = { ...updated[i], ...patch };
    onChange(updated);
  };

  return (
    <div>
      {/* Panduan Sub-CPMK Afeksi */}
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', fontSize: 12, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>❤️ Panduan Sub-CPMK Afeksi/Sikap — {parentFields.no || 'CPMK ini'}</div>
        <div style={{ color: '#7f1d1d', lineHeight: 1.7 }}>
          Sub-CPMK Afeksi merinci <strong>sikap, nilai, dan etika akademik</strong> yang diharapkan dari mahasiswa selama pembelajaran berlangsung.
        </div>
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          <div style={{ background: 'white', borderRadius: 7, padding: '7px 10px', border: '1px solid #fecaca' }}>
            <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: 3 }}>💬 Kata Sikap</div>
            <div style={{ color: '#374151' }}>Kata kerja afektif yang menggambarkan sikap mahasiswa (cth: <em>menunjukkan perhatian, berpartisipasi, menghargai upaya/pendapat</em>)</div>
          </div>
          <div style={{ background: 'white', borderRadius: 7, padding: '7px 10px', border: '1px solid #fecaca' }}>
            <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: 3 }}>🎯 Jenis Kegiatan</div>
            <div style={{ color: '#374151' }}>Konteks kegiatan di mana sikap ditunjukkan (cth: <em>perkuliahan dan diskusi, pembuatan tugas, ujian</em>). Pilih <strong>ujian</strong> untuk penilaian sikap saat ujian.</div>
          </div>
          <div style={{ background: 'white', borderRadius: 7, padding: '7px 10px', border: '1px solid #fecaca' }}>
            <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: 3 }}>📖 Rincian Materi/Topik</div>
            <div style={{ color: '#374151' }}>Topik/materi yang menjadi konteks sikap (cth: <em>berpikir merancang digital</em> atau <em>keberlanjutan arsitektur</em>)</div>
          </div>
          <div style={{ background: 'white', borderRadius: 7, padding: '7px 10px', border: '1px solid #fecaca' }}>
            <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: 3 }}>📐 Lingkup Penilaian</div>
            <div style={{ color: '#374151' }}>Tempat/lingkup penilaian sikap: <em>di dalam kelompok</em>, <em>di dalam kelas</em>, atau keduanya. Isi <strong>1 Sub-CPMK</strong> jika tugas/ujian saja; <strong>2</strong> jika keduanya.</div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#dc2626' }}>
          💡 Pola kalimat otomatis: <em>"Mampu [kata_sikap] pada kegiatan [kegiatan] materi/topik [rincian] [lingkup penilaian]."</em>
        </div>
      </div>

      {subList.map((sub, i) => {
        const stmt = buildSubCpmkAfeksiStatement(sub);
        const isOpen = expandedIdx === i;
        return (
          <div key={i} style={{ border: `2px solid ${stmt ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
            {/* Header sub */}
            <div
              style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: 'pointer', background: isOpen ? '#fef2f2' : 'white', gap: 8 }}
              onClick={() => setExpandedIdx(isOpen ? null : i)}
            >
              <span style={{ fontWeight: 700, fontSize: 12, color: '#dc2626', flexShrink: 0 }}>Sub-CPMK {i + 1}</span>
              {stmt ? (
                <span style={{ fontSize: 12, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stmt}</span>
              ) : (
                <span style={{ fontSize: 12, color: '#94a3b8', flex: 1, fontStyle: 'italic' }}>Belum diisi</span>
              )}
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
              <button
                onClick={e => { e.stopPropagation(); removeSub(i); }}
                style={{ background: 'none', border: 'none', fontSize: 14, color: '#ef4444', cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}
                title="Hapus Sub-CPMK ini"
              >✕</button>
            </div>

            {/* Form detail */}
            {isOpen && (
              <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* A. Kata sikap */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    A. Kata Sikap <span style={{ color: '#ef4444' }}>*</span>
                    <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>(setelah "Mampu")</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {KATA_SIKAP_AFEKSI.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateSub(i, { kata_sikap: opt })}
                        style={{
                          padding: '7px 10px', fontSize: 12, borderRadius: 8, cursor: 'pointer',
                          border: `2px solid ${sub.kata_sikap === opt ? '#dc2626' : '#e2e8f0'}`,
                          background: sub.kata_sikap === opt ? '#fef2f2' : 'white',
                          color: sub.kata_sikap === opt ? '#b91c1c' : '#64748b',
                          fontWeight: sub.kata_sikap === opt ? 700 : 400,
                          textAlign: 'left', transition: 'all 0.15s',
                        }}
                      >{opt}</button>
                    ))}
                  </div>
                </div>

                {/* B. Kegiatan (setelah "pada kegiatan") */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    B. Jenis Kegiatan <span style={{ color: '#ef4444' }}>*</span>
                    <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>(setelah "pada kegiatan")</span>
                  </label>
                  <select
                    className="form-select"
                    style={{ fontSize: 13 }}
                    value={sub.kegiatan}
                    onChange={e => updateSub(i, { kegiatan: e.target.value })}
                  >
                    <option value="">— Pilih kegiatan —</option>
                    {KEGIATAN_AFEKSI_SUB.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                {/* C. Rincian sub-bahan kajian (materi/topik) */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    C. Rincian Sub-Bahan Kajian
                    <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>(akan diawali "materi/topik")</span>
                  </label>
                  <input
                    className="form-input"
                    style={{ fontSize: 13 }}
                    value={sub.rincian_sub}
                    onChange={e => updateSub(i, { rincian_sub: e.target.value })}
                    placeholder="cth: berpikir merancang digital"
                  />
                </div>

                {/* D. Bentuk penugasan */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    D. Bentuk Penugasan <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {PENUGASAN_AFEKSI.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateSub(i, { penugasan: opt })}
                        style={{
                          padding: '6px 12px', fontSize: 12, borderRadius: 8, cursor: 'pointer', border: '2px solid',
                          borderColor: sub.penugasan === opt ? '#dc2626' : '#e2e8f0',
                          background: sub.penugasan === opt ? '#fef2f2' : 'white',
                          color: sub.penugasan === opt ? '#b91c1c' : '#64748b',
                          fontWeight: sub.penugasan === opt ? 700 : 400,
                          transition: 'all 0.15s',
                        }}
                      >{opt}</button>
                    ))}
                  </div>
                </div>

                {/* Preview kalimat */}
                {buildSubCpmkAfeksiStatement(sub) ? (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>✅ Pratinjau Sub-CPMK {i + 1}</div>
                    <p style={{ fontSize: 13, color: '#7f1d1d', margin: 0, lineHeight: 1.65, fontStyle: 'italic' }}>
                      {buildSubCpmkAfeksiStatement(sub)}
                    </p>
                  </div>
                ) : (
                  <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#92400e' }}>
                    ⚠️ Pilih kata sikap dan kegiatan untuk melihat pratinjau kalimat.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Info panduan afeksi */}
      {subList.length === 0 && (
        <div style={{ marginBottom: 12, background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#78350f' }}>
          💡 Sub-CPMK Afeksi bisa diisi 1 (Tugas <em>atau</em> Ujian) atau 2 (Tugas <em>dan</em> Ujian) — maks. 2 entri.
        </div>
      )}
      {subList.length === 1 && (
        <div style={{ marginBottom: 12, background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#065f46' }}>
          ✅ 1 Sub-CPMK Afeksi terisi. Tambah 1 lagi jika ada penilaian tugas <em>dan</em> ujian.
        </div>
      )}

      <button
        type="button"
        onClick={addSub}
        disabled={!canAdd}
        title={!canAdd ? 'Maks. 2 Sub-CPMK Afeksi (tugas + ujian)' : ''}
        style={{
          marginTop: 4, padding: '7px 14px', fontSize: 12, fontWeight: 600,
          color: canAdd ? '#dc2626' : '#94a3b8',
          background: canAdd ? '#fef2f2' : '#f1f5f9',
          border: `1.5px dashed ${canAdd ? '#fca5a5' : '#cbd5e1'}`,
          borderRadius: 8, cursor: canAdd ? 'pointer' : 'not-allowed',
        }}
      >
        {canAdd ? `+ Tambah Sub-CPMK Afeksi (${subList.length}/2)` : '✋ Maks. 2 Sub-CPMK Afeksi tercapai'}
      </button>
    </div>
  );
}

// Modal generator CPMK
function CpmkGeneratorModal({ item, idx, cplDipilih, daftarCPL, onSave, onClose, jenjang, kodeTipe }) {
  const [draft, setDraft] = useState({ ...EMPTY_CPMK_FIELDS, ...item });
  const [activeTab, setActiveTab] = useState('cpmk'); // 'cpmk' | 'subcpmk_kog' | 'subcpmk_psiko' | 'subcpmk_afeksi'
  const tipe = draft.tipe || 'kognitif';
  const preview = buildCpmkStatement(tipe, draft);
  const subCpmkKogList = draft.sub_cpmk_kog || [];
  const subCpmkPsikoList = draft.sub_cpmk_psiko || [];
  const subCpmkAfeksiList = draft.sub_cpmk_afeksi || [];
  const isKog = tipe === 'kognitif' || tipe === 'kognitif_psiko';
  const isPsiko = tipe === 'psikomotorik' || tipe === 'kognitif_psiko';
  const isAfeksi = tipe === 'afeksi';

  const TIPE_OPTS = [
    { value: 'kognitif',       label: '🧠 Kognitif',        color: '#2563eb', bg: '#eff6ff',  desc: 'Maks 2 kata kerja kognitif + elemen pengetahuan + rincian + ukuran' },
    { value: 'psikomotorik',   label: '🤝 Psikomotorik',    color: '#7c3aed', bg: '#f5f3ff',  desc: 'Maks 2 kata kerja psikomotorik + objek kegiatan + rincian + ukuran' },
    { value: 'kognitif_psiko', label: '🧠🤝 Gabungan',      color: '#0369a1', bg: '#e0f2fe',  desc: 'Kognitif (1) + Psikomotorik (1) dalam 1 kalimat CPMK' },
    { value: 'afeksi',         label: '❤️ Afeksi',          color: '#dc2626', bg: '#fef2f2',  desc: 'Template baku ITS: sikap & etika akademik — 1 nomor per MK' },
  ];

  // CPL yang bisa dipetakan (hanya CPL yang sudah dipilih di Step3)
  const cplTersedia = daftarCPL.filter(c => cplDipilih.includes(c.id));

  const toggleCpl = (id) => {
    setDraft(prev => ({
      ...prev,
      cpl_ids: (prev.cpl_ids||[]).includes(id)
        ? (prev.cpl_ids||[]).filter(x => x !== id)
        : [...(prev.cpl_ids||[]), id],
    }));
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: 'white', borderRadius: 16, width: '100%', maxWidth: 900,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      }}>
        {/* Header modal */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 17, color: '#1e293b', margin: 0 }}>
                🏗️ Generator CPMK-{idx + 1}
                {jenjang && (
                  <span style={{
                    marginLeft: 10, fontSize: 12, fontWeight: 600,
                    background: jenjang === 'S3' ? '#fef3c7' : jenjang === 'S2' ? '#ede9fe' : jenjang === 'Profesi' ? '#dcfce7' : '#dbeafe',
                    color: jenjang === 'S3' ? '#92400e' : jenjang === 'S2' ? '#5b21b6' : jenjang === 'Profesi' ? '#166534' : '#1e40af',
                    padding: '2px 10px', borderRadius: 999, verticalAlign: 'middle',
                  }}>
                    {jenjang}{kodeTipe ? ` · ${kodeTipe.toUpperCase()}` : ''}
                  </span>
                )}
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                Susun kalimat CPMK sesuai pola standar ITS — preview tampil otomatis
                {jenjang && <span style={{ marginLeft: 6, color: '#94a3b8', fontSize: 12 }}>• Kata kerja difilter untuk jenjang {jenjang}</span>}
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8', lineHeight: 1, padding: 4 }}>✕</button>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap' }}>
            {[
              { id: 'cpmk',           label: '🏗️ CPMK', disabled: false },
              { id: 'subcpmk_kog',    label: `🧠 Sub-CPMK Kognitif${subCpmkKogList.length > 0 ? ` (${subCpmkKogList.length})` : ''}`,       disabled: !isKog },
              { id: 'subcpmk_psiko',  label: `🤝 Sub-CPMK Psikomotorik${subCpmkPsikoList.length > 0 ? ` (${subCpmkPsikoList.length})` : ''}`, disabled: !isPsiko },
              { id: 'subcpmk_afeksi', label: `❤️ Sub-CPMK Afeksi${subCpmkAfeksiList.length > 0 ? ` (${subCpmkAfeksiList.length})` : ''}`,    disabled: !isAfeksi },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                disabled={tab.disabled}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 14px', fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500,
                  borderRadius: '8px 8px 0 0', cursor: tab.disabled ? 'not-allowed' : 'pointer',
                  border: 'none', borderBottom: activeTab === tab.id ? '3px solid #4f46e5' : '3px solid transparent',
                  background: activeTab === tab.id ? '#f0f4ff' : 'transparent',
                  color: tab.disabled ? '#cbd5e1' : activeTab === tab.id ? '#4338ca' : '#64748b',
                  transition: 'all 0.15s',
                }}
              >{tab.label}</button>
            ))}
          </div>
        </div>

        {/* Body: 2 kolom (tab CPMK) atau full width (tab Sub-CPMK) */}
        <div style={{ flex: 1, overflow: 'hidden', display: activeTab === 'cpmk' ? 'grid' : 'block', gridTemplateColumns: '1fr 1fr' }}>

          {/* Panel Sub-CPMK Kognitif */}
          {activeTab === 'subcpmk_kog' && (
            <div style={{ padding: '20px 28px', overflowY: 'auto', height: '100%' }}>
              <SubCpmkKognitifPanel
                subList={subCpmkKogList}
                onChange={(list) => setDraft(p => ({ ...p, sub_cpmk_kog: list }))}
                parentFields={draft}
                tipe={tipe}
                totalSubCpmk={subCpmkKogList.length + subCpmkPsikoList.length + subCpmkAfeksiList.length}
              />
            </div>
          )}

          {/* Panel Sub-CPMK Psikomotorik */}
          {activeTab === 'subcpmk_psiko' && (
            <div style={{ padding: '20px 28px', overflowY: 'auto', height: '100%' }}>
              <SubCpmkPsikoPanel
                subList={subCpmkPsikoList}
                onChange={(list) => setDraft(p => ({ ...p, sub_cpmk_psiko: list }))}
                parentFields={draft}
                tipe={tipe}
                totalSubCpmk={subCpmkKogList.length + subCpmkPsikoList.length + subCpmkAfeksiList.length}
              />
            </div>
          )}

          {/* Panel Sub-CPMK Afeksi */}
          {activeTab === 'subcpmk_afeksi' && (
            <div style={{ padding: '20px 28px', overflowY: 'auto', height: '100%' }}>
              <SubCpmkAfeksiPanel
                subList={subCpmkAfeksiList}
                onChange={(list) => setDraft(p => ({ ...p, sub_cpmk_afeksi: list }))}
                parentFields={draft}
                tipe={tipe}
                totalSubCpmk={subCpmkKogList.length + subCpmkPsikoList.length + subCpmkAfeksiList.length}
              />
            </div>
          )}

          {/* Kolom kiri: form (tab CPMK) */}
          {activeTab === 'cpmk' && <div style={{ padding: '20px 24px', overflowY: 'auto', borderRight: '1px solid #f1f5f9' }}>
            {/* Kode CPMK */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 2 }}>Kode CPMK</label>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Nomor urut CPMK ini — bisa diubah, cth: CPMK-1, C1, dll.</div>
              <input className="form-input" style={{ fontSize: 13, maxWidth: 140 }} value={draft.no||`CPMK-${idx+1}`} onChange={e => setDraft(p => ({...p, no: e.target.value}))} />
            </div>

            {/* Pilih Tipe */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 2 }}>Tipe CPMK <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>Pilih tipe domain kemampuan — tipe menentukan field dan pola kalimat yang digunakan.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {TIPE_OPTS.map(t => (
                  <button key={t.value} type="button" title={t.desc}
                    onClick={() => setDraft(p => ({ ...EMPTY_CPMK_FIELDS, no: p.no, cpl_ids: p.cpl_ids||[], tipe: t.value }))}
                    style={{
                      padding: '8px 6px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                      border: `2px solid ${tipe === t.value ? t.color : '#e2e8f0'}`,
                      background: tipe === t.value ? t.bg : 'white',
                      color: tipe === t.value ? t.color : '#64748b',
                      fontWeight: tipe === t.value ? 700 : 400, fontSize: 12,
                      transition: 'all 0.15s',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#f1f5f9', margin: '0 0 16px' }} />

            {/* Fields sesuai tipe */}
            <CpmkBuilderFields tipe={tipe} fields={draft} onChange={d => setDraft(p => ({...p, ...d}))} jenjang={jenjang} kodeTipe={kodeTipe} />

            {/* Pemetaan CPL */}
            {cplTersedia.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 2 }}>
                  Pemetaan ke CPL <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
                  Centang CPL yang <strong>dicapai</strong> oleh CPMK ini — 1 CPMK bisa dipetakan ke beberapa CPL. CPL yang tersedia adalah yang sudah Anda pilih di Langkah 3.
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {cplTersedia.map(cpl => (
                    <label key={cpl.id} style={{
                      display: 'flex', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${(draft.cpl_ids||[]).includes(cpl.id) ? '#16a34a' : '#e2e8f0'}`,
                      background: (draft.cpl_ids||[]).includes(cpl.id) ? '#f0fdf4' : '#fafafa',
                      transition: 'all 0.15s',
                    }}>
                      <input type="checkbox" checked={(draft.cpl_ids||[]).includes(cpl.id)} onChange={() => toggleCpl(cpl.id)} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>{cpl.nomor_cpl}</div>
                        <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{cpl.deskripsi_id}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>}

          {/* Kolom kanan: preview sticky (tab CPMK) */}
          {activeTab === 'cpmk' && <div style={{ padding: '20px 24px', overflowY: 'auto', background: '#fafbff', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>📋 Pratinjau Kalimat</div>

              {/* Indonesia */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, background: '#1d4ed8', color: 'white', padding: '3px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 8 }}>🇮🇩 Bahasa Indonesia</div>
                <div style={{
                  minHeight: 72, padding: '14px 16px', borderRadius: 10,
                  border: `1.5px solid ${preview ? '#6366f1' : '#e2e8f0'}`,
                  background: preview ? '#fafaf9' : '#f8fafc',
                  fontSize: 15, lineHeight: 1.75, fontWeight: preview ? 500 : 400,
                }}>
                  <CpmkPreviewHighlight tipe={tipe} fields={draft} />
                </div>
              </div>

              {/* English */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, background: '#92400e', color: 'white', padding: '3px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 8 }}>🇬🇧 English</div>
                <textarea
                  className="form-textarea"
                  rows={3}
                  style={{ fontSize: 13, lineHeight: 1.6 }}
                  value={draft.deskripsi_en||''}
                  onChange={e => setDraft(p => ({...p, deskripsi_en: e.target.value}))}
                  placeholder="Students are able to..."
                />
                <p style={{ fontSize: 11, color: '#94a3b8' }}>Isi terjemahan Inggris secara manual</p>
              </div>
            </div>

            {/* Summary komponen */}
            {preview && (
              <div style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 8 }}>✅ Komponen Terpilih</div>
                <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.7 }}>
                  <div>• Tipe: <strong>{{ kognitif: 'Kognitif', psikomotorik: 'Psikomotorik', kognitif_psiko: 'Gabungan K+P', afeksi: 'Afeksi' }[tipe]}</strong></div>
                  {(tipe === 'kognitif') && (draft.kognitif_1 || draft.kognitif_2) && (
                    <div>• Kata kerja: <strong>{[draft.kognitif_1, draft.kognitif_2].filter(Boolean).join(' dan ')}</strong></div>
                  )}
                  {(tipe === 'kognitif' || tipe === 'kognitif_psiko') && draft.elemen_1 && <div>• Elemen pengetahuan: <strong>{draft.elemen_1}</strong></div>}
                  {(tipe === 'psikomotorik' || tipe === 'kognitif_psiko') && (draft.psiko_1 || draft.psiko_2) && (
                    <div>• Kata kerja psiko: <strong>{[draft.psiko_1, draft.psiko_2].filter(Boolean).join(' dan ')}</strong></div>
                  )}
                  {(tipe === 'psikomotorik' || tipe === 'kognitif_psiko') && draft.objek_psiko && <div>• Objek kegiatan: <strong>{draft.objek_psiko}</strong></div>}
                  {tipe === 'afeksi' && draft.kegiatan_1 && <div>• Kegiatan: <strong>{[draft.kegiatan_1, draft.kegiatan_2].filter(Boolean).join(' + ')}</strong></div>}
                  {draft.rincian && <div>• Rincian/Topik: <strong>{draft.rincian}</strong></div>}
                  {draft.ukuran && <div>• Ukuran: <strong>{draft.ukuran}</strong></div>}
                  {(draft.cpl_ids||[]).length > 0 && (
                    <div>• Dipetakan ke: <strong>{cplTersedia.filter(c => (draft.cpl_ids||[]).includes(c.id)).map(c => c.nomor_cpl).join(', ')}</strong></div>
                  )}
                </div>
              </div>
            )}
          </div>}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 10 }}>
            {subCpmkKogList.length > 0 && (
              <span style={{ background: '#eff0ff', color: '#4338ca', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                🧠 {subCpmkKogList.length} Sub-CPMK Kognitif
              </span>
            )}
            {subCpmkPsikoList.length > 0 && (
              <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                🤝 {subCpmkPsikoList.length} Sub-CPMK Psikomotorik
              </span>
            )}
            {subCpmkAfeksiList.length > 0 && (
              <span style={{ background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                ❤️ {subCpmkAfeksiList.length} Sub-CPMK Afeksi
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} className="btn btn-secondary">Batal</button>
            <button
              onClick={() => {
                const stmt = buildCpmkStatement(draft.tipe || 'kognitif', draft);
                onSave({ ...draft, deskripsi_id: stmt });
              }}
              className="btn btn-primary"
              disabled={!preview}
              style={{ opacity: preview ? 1 : 0.5 }}
            >
              ✅ Simpan CPMK-{idx + 1}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Langkah 4: CPMK ─────────────────────────────────────────────────────
function Step4CPMK({ cpmk, onChange, cplDipilih, daftarCPL, jenjang, kodeTipe, isStudio }) {
  const [modalIdx, setModalIdx] = useState(null); // null = tutup

  // Jika jenjang atau tipe MK berubah, reset kata kerja yang tidak valid
  useEffect(() => {
    if (!jenjang) return;
    const { kog: validKog, psiko: validPsiko } = getKemampuan(jenjang, kodeTipe);
    const updated = cpmk.map(c => ({
      ...c,
      kognitif_1: validKog.includes(c.kognitif_1) ? c.kognitif_1 : '',
      kognitif_2: validKog.includes(c.kognitif_2) ? c.kognitif_2 : '',
      psiko_1:    validPsiko.includes(c.psiko_1)   ? c.psiko_1   : '',
      psiko_2:    validPsiko.includes(c.psiko_2)   ? c.psiko_2   : '',
    }));
    const changed = updated.some((c, i) =>
      c.kognitif_1 !== cpmk[i].kognitif_1 || c.kognitif_2 !== cpmk[i].kognitif_2 ||
      c.psiko_1 !== cpmk[i].psiko_1 || c.psiko_2 !== cpmk[i].psiko_2
    );
    if (changed) onChange(updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jenjang, kodeTipe]);

  const MAX_CPMK = 6;

  const addCPMK = () => {
    if (cpmk.length >= MAX_CPMK) return;
    const newIdx = cpmk.length;
    onChange([...cpmk, { ...EMPTY_CPMK_FIELDS, no: `CPMK-${newIdx + 1}` }]);
    setModalIdx(newIdx);
  };

  const removeCPMK = (idx) => {
    if (cpmk.length <= 1) return;
    onChange(cpmk.filter((_, i) => i !== idx));
  };

  const saveFromModal = (idx, item) => {
    const updated = [...cpmk];
    updated[idx] = item;
    onChange(updated);
    setModalIdx(null);
  };

  // CPL yang sudah dipilih di Step 3 (sesuai jenjang)
  const cplTersedia = daftarCPL.filter(c => cplDipilih.includes(c.id));

  // Hitung distribusi tipe saat ini
  const countTipe = (t) => cpmk.filter(c => c.tipe === t).length;
  const totalCpmk = cpmk.length;

  return (
    <div>
      {/* Panduan komposisi berdasarkan jenis MK */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>📐 Panduan Komposisi CPMK</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
          <div style={{ background: isStudio ? '#eff6ff' : '#f1f5f9', border: `1px solid ${isStudio ? '#93c5fd' : '#e2e8f0'}`, borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontWeight: 700, color: isStudio ? '#1d4ed8' : '#94a3b8', marginBottom: 2 }}>🏛️ MK Non-Studio</div>
            <div style={{ color: '#64748b', lineHeight: 1.5 }}>Kognitif: banyak<br/>Psikomotorik: sedikit<br/>❤️ Afeksi: 1 nomor</div>
          </div>
          <div style={{ background: isStudio ? '#f0fdf4' : '#f1f5f9', border: `1px solid ${isStudio ? '#86efac' : '#e2e8f0'}`, borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontWeight: 700, color: isStudio ? '#15803d' : '#94a3b8', marginBottom: 2 }}>🎨 MK Studio</div>
            <div style={{ color: '#64748b', lineHeight: 1.5 }}>Kognitif: ≈ 50%<br/>Psikomotorik: ≈ 50%<br/>❤️ Afeksi: 1 nomor</div>
          </div>
        </div>
        {totalCpmk > 0 && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {countTipe('kognitif') > 0 && <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>🧠 Kognitif: {countTipe('kognitif')}</span>}
            {countTipe('psikomotorik') > 0 && <span style={{ fontSize: 11, background: '#f5f3ff', color: '#7c3aed', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>🤝 Psikomotorik: {countTipe('psikomotorik')}</span>}
            {countTipe('kognitif_psiko') > 0 && <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>🧠🤝 Gabungan: {countTipe('kognitif_psiko')}</span>}
            {countTipe('afeksi') > 0 && <span style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>❤️ Afeksi: {countTipe('afeksi')}</span>}
          </div>
        )}
      </div>

      {/* Panduan mengisi Step 4 CPMK */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 8, fontSize: 13 }}>📌 Panduan Pengisian CPMK</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12 }}>
          <div style={{ background: 'white', borderRadius: 8, padding: '8px 12px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>🧠 Kognitif</div>
            <div style={{ color: '#374151', lineHeight: 1.6 }}>Kemampuan berpikir mahasiswa. Isi: <strong>kata kerja kognitif</strong> (C1–C6 Bloom), <strong>elemen pengetahuan</strong>, dan <strong>rincian topik</strong>. Contoh: <em>"Mampu menjelaskan konsep digitalisasi..."</em></div>
          </div>
          <div style={{ background: 'white', borderRadius: 8, padding: '8px 12px', border: '1px solid #ddd6fe' }}>
            <div style={{ fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>🤝 Psikomotorik</div>
            <div style={{ color: '#374151', lineHeight: 1.6 }}>Kemampuan praktis/keterampilan. Isi: <strong>kata kerja psiko</strong>, <strong>objek kegiatan</strong>, dan <strong>rincian produk</strong>. Contoh: <em>"Mampu membuat model arsitektur..."</em></div>
          </div>
          <div style={{ background: 'white', borderRadius: 8, padding: '8px 12px', border: '1px solid #bae6fd' }}>
            <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>🧠🤝 Gabungan</div>
            <div style={{ color: '#374151', lineHeight: 1.6 }}>Satu CPMK menggabungkan kognitif + psikomotorik dalam satu kalimat. Dapat dipecah menjadi <strong>1 Sub-CPMK Kognitif</strong> + <strong>1 Sub-CPMK Psikomotorik</strong>.</div>
          </div>
          <div style={{ background: 'white', borderRadius: 8, padding: '8px 12px', border: '1px solid #fecaca' }}>
            <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>❤️ Afeksi</div>
            <div style={{ color: '#374151', lineHeight: 1.6 }}>Sikap &amp; etika akademik. Isi: <strong>kata sikap</strong>, <strong>jenis kegiatan</strong>, dan <strong>topik/materi</strong>. Biasanya <strong>1 nomor per MK</strong>, bisa diisi 1 (tugas/ujian) atau 2 Sub-CPMK.</div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#3b82f6' }}>
          💡 Klik <em>✏️ Buka Generator</em> pada setiap CPMK untuk menyusun kalimat. Setelah mengisi CPMK, buka tab <strong>Sub-CPMK</strong> (maks. 2 per CPMK) lalu petakan ke <strong>CPL</strong> yang relevan.
        </div>
      </div>

      {/* Daftar CPMK */}
      {cpmk.map((item, idx) => {
        const preview = buildCpmkStatement(item.tipe || 'kognitif', item);
        const hasContent = !!(preview);
        const cplMapped = cplTersedia.filter(c => (item.cpl_ids||[]).includes(c.id));

        // Badge warna per tipe
        const tipeBadge = {
          kognitif:       { label: '🧠 Kognitif',     color: '#1d4ed8', bg: '#eff6ff' },
          psikomotorik:   { label: '🤝 Psikomotorik', color: '#7c3aed', bg: '#f5f3ff' },
          kognitif_psiko: { label: '🧠🤝 Gabungan',   color: '#0369a1', bg: '#e0f2fe' },
          afeksi:         { label: '❤️ Afeksi',       color: '#dc2626', bg: '#fef2f2' },
        }[item.tipe || 'kognitif'] || { label: '—', color: '#64748b', bg: '#f1f5f9' };

        return (
          <div key={idx} style={{
            border: `2px solid ${hasContent ? '#c7d2fe' : '#e2e8f0'}`,
            borderRadius: 12, marginBottom: 12, overflow: 'hidden',
          }}>
            {/* Row CPMK */}
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 0, alignItems: 'stretch' }}>
              {/* Nomor */}
              <div style={{ background: hasContent ? '#6366f1' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>
                {idx + 1}
              </div>
              {/* Konten */}
              <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{item.no || `CPMK-${idx+1}`}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, background: tipeBadge.bg, color: tipeBadge.color, padding: '2px 8px', borderRadius: 20 }}>{tipeBadge.label}</span>
                  {hasContent && <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>✓ Terisi</span>}
                  {!hasContent && <span style={{ fontSize: 11, background: '#fef9c3', color: '#a16207', padding: '2px 8px', borderRadius: 20 }}>Belum diisi</span>}
                </div>
                {hasContent ? (
                  <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>{preview}</p>
                ) : (
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>Klik ✏️ Buka Generator untuk menyusun kalimat CPMK ini</p>
                )}
                {cplMapped.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {cplMapped.map(c => (
                      <span key={c.id} style={{ fontSize: 11, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>↔ {c.nomor_cpl}</span>
                    ))}
                  </div>
                )}
                {/* Badge sub-CPMK */}
                {((item.sub_cpmk_kog||[]).length > 0 || (item.sub_cpmk_psiko||[]).length > 0 || (item.sub_cpmk_afeksi||[]).length > 0) && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(item.sub_cpmk_kog||[]).length > 0 && (
                      <span style={{ fontSize: 11, background: '#f0f4ff', color: '#4338ca', border: '1px solid #c7d2fe', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>
                        🧠 {(item.sub_cpmk_kog).length} Sub-CPMK Kog
                      </span>
                    )}
                    {(item.sub_cpmk_psiko||[]).length > 0 && (
                      <span style={{ fontSize: 11, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>
                        🤝 {(item.sub_cpmk_psiko).length} Sub-CPMK Psiko
                      </span>
                    )}
                    {(item.sub_cpmk_afeksi||[]).length > 0 && (
                      <span style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>
                        ❤️ {(item.sub_cpmk_afeksi).length} Sub-CPMK Afeksi
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* Aksi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderLeft: '1px solid #f1f5f9' }}>
                <button
                  onClick={() => setModalIdx(idx)}
                  style={{ flex: 1, padding: '0 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#4f46e5', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}
                >
                  ✏️ {hasContent ? 'Edit' : 'Buka Generator'}
                </button>
                <button
                  onClick={() => removeCPMK(idx)}
                  disabled={cpmk.length <= 1}
                  style={{ flex: 1, padding: '0 16px', background: 'none', border: 'none', cursor: cpmk.length <= 1 ? 'not-allowed' : 'pointer', fontSize: 12, color: '#ef4444', opacity: cpmk.length <= 1 ? 0.3 : 1 }}
                >
                  🗑 Hapus
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <button
        className="btn btn-secondary"
        onClick={addCPMK}
        disabled={cpmk.length >= MAX_CPMK}
        title={cpmk.length >= MAX_CPMK ? `Maksimal ${MAX_CPMK} CPMK per mata kuliah` : ''}
        style={{ marginTop: 4, opacity: cpmk.length >= MAX_CPMK ? 0.45 : 1, cursor: cpmk.length >= MAX_CPMK ? 'not-allowed' : 'pointer' }}
      >
        + Tambah CPMK {cpmk.length >= MAX_CPMK && `(Maks. ${MAX_CPMK} tercapai)`}
      </button>

      {/* Ringkasan pemetaan */}
      {cplTersedia.length > 0 && (
        <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--color-gray-50)', border: '1px solid var(--color-gray-200)', borderRadius: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-gray-600)', marginBottom: 10 }}>📊 Ringkasan Pemetaan CPL ↔ CPMK</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {cplTersedia.map(cpl => {
              const mapped = cpmk.filter(c => (c.cpl_ids||[]).includes(cpl.id));
              return (
                <div key={cpl.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: '#15803d', flexShrink: 0, minWidth: 60 }}>{cpl.nomor_cpl}</span>
                  {mapped.length > 0 ? (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {mapped.map(c => <span key={c.no} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>{c.no || 'CPMK'}</span>)}
                    </div>
                  ) : (
                    <span style={{ color: '#f59e0b' }}>⚠️ Belum ada CPMK yang dipetakan</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalIdx !== null && (
        <CpmkGeneratorModal
          item={cpmk[modalIdx] || EMPTY_CPMK_FIELDS}
          idx={modalIdx}
          cplDipilih={cplDipilih}
          daftarCPL={daftarCPL}
          onSave={(item) => saveFromModal(modalIdx, item)}
          onClose={() => setModalIdx(null)}
          jenjang={jenjang}
          kodeTipe={kodeTipe}
        />
      )}
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
      {/* Panduan Step 5 */}
      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: '#14532d', marginBottom: 8, fontSize: 13 }}>📚 Panduan Pengisian Bahan Kajian &amp; Pustaka</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12 }}>
          <div style={{ background: 'white', borderRadius: 8, padding: '10px 12px', border: '1px solid #86efac' }}>
            <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 4 }}>📋 Bahan Kajian / Pokok Bahasan</div>
            <div style={{ color: '#374151', lineHeight: 1.6 }}>
              Daftar topik/materi utama yang dibahas dalam MK ini. Setiap entri adalah <strong>satu pokok bahasan</strong> yang akan muncul di SAP (jadwal per minggu). Contoh:
              <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                <li>Pengantar digitalisasi arsitektur</li>
                <li>Teknik pemodelan parametrik</li>
                <li>Simulasi energi bangunan</li>
              </ul>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 8, padding: '10px 12px', border: '1px solid #86efac' }}>
            <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 4 }}>🔗 Mata Kuliah Prasyarat</div>
            <div style={{ color: '#374151', lineHeight: 1.6 }}>
              MK yang harus sudah lulus sebelum mengambil MK ini. Pisahkan dengan koma jika lebih dari satu. Opsional — kosongkan jika tidak ada prasyarat.
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 8, padding: '10px 12px', border: '1px solid #86efac' }}>
            <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 4 }}>📖 Pustaka Utama (Wajib)</div>
            <div style={{ color: '#374151', lineHeight: 1.6 }}>
              Referensi utama yang <strong>wajib</strong> dibaca mahasiswa. Gunakan format APA:<br/>
              <em>Nama. (Tahun). Judul Buku. Penerbit.</em><br/>
              Minimal 1 referensi, disarankan 2–5 buku/artikel.
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 8, padding: '10px 12px', border: '1px solid #86efac' }}>
            <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 4 }}>📰 Pustaka Pendukung (Opsional)</div>
            <div style={{ color: '#374151', lineHeight: 1.6 }}>
              Referensi tambahan yang dianjurkan — jurnal, artikel, modul, website resmi, atau buku penunjang. Format sama dengan pustaka utama.
            </div>
          </div>
        </div>
      </div>

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
