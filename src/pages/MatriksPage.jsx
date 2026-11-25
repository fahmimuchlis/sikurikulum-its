import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// CPL default S1 Arsitektur ITS (bisa di-override dari data silabus)
const CPL_DEFAULT_S1 = [
  { no: '1', desc: 'Mampu menunjukkan sikap dan karakter yang mencerminkan ketakwaan, etika, integritas, berbudi pekerti luhur, peka sosial, menghargai kemajemukan, menjunjung hukum, mendahulukan kepentingan bangsa melalui kreatifitas, inovasi, dan kepemimpinan.' },
  { no: '2', desc: 'Mampu mengkaji dan memanfaatkan ilmu pengetahuan dan teknologi dalam arsitektur, serta mengambil keputusan tepat melalui pemikiran logis, kritis, sistematis dan inovatif.' },
  { no: '4', desc: 'Mampu menguasai konsep teoritis arsitektur, perancangan, material dan sistem bangunan, seni dan budaya, sosial, lingkungan dan keprofesian.' },
  { no: '6', desc: 'Mampu menguasai prinsip arsitektur kontekstual yang merujuk pada permasalahan dan potensi lokal.' },
  { no: '9', desc: 'Mampu secara mandiri merancang arsitektur berbasis penelitian dan menghasilkan karya arsitektur yang kreatif, kontekstual serta teruji secara teoritis.' },
  { no: '10', desc: 'Mampu mempresentasikan secara komunikatif gagasan dan rancangan arsitektur dalam bentuk lisan, tulisan, grafis dan berbagai media.' },
];

const JENIS_EVALUASI_OPTS = ['Tugas', 'Ujian', 'Quiz', 'Presentasi', 'Praktikum', 'Proyek'];
const JENIS_PENILAIAN_OPTS = ['Kognitif-Tugas', 'Kognitif-UAS', 'Kognitif-UTS', 'Psikomotorik-Tugas', 'Afektif', 'Presentasi'];

export default function MatriksPage({ user }) {
  const navigate = useNavigate();
  const { silabusId } = useParams();  // dari URL /form/:silabusId/matriks

  // Data master
  const [silabusInfo, setSilabusInfo] = useState(null);
  const [cpmkList, setCpmkList] = useState([]); // dari dokumen_cpmk

  // Halaman aktif
  const [activeTab, setActiveTab] = useState('cpl-cpmk'); // 'cpl-cpmk' | 'rae'

  // CPL yang dipilih untuk silabus ini
  const [selectedCpl, setSelectedCpl] = useState([]); // array of no_cpl string
  const [cplList, setCplList] = useState(CPL_DEFAULT_S1);

  // Matriks CPL-CPMK: { [no_cpmk]: { [no_cpl]: 0|1 } }
  const [matriksData, setMatriksData] = useState({});

  // Bobot CPMK: { [no_cpmk]: { bobot: '', minggu: '' } }
  const [bobotCpmk, setBobotCpmk] = useState({});

  // RAE list
  const [raeList, setRaeList] = useState([]);
  // RAE-CPMK bobot: { [no_rae]: { [no_cpmk]: '' } }
  const [raeCpmkData, setRaeCpmkData] = useState({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // silabusOptions tidak lagi diperlukan (silabusId dari URL param)

  // Load data saat silabus dipilih
  const loadData = useCallback(async (sid) => {
    if (!sid) return;
    setLoading(true);

    // Load info silabus
    const { data: sil } = await supabase
      .from('dokumen_silabus')
      .select('*')
      .eq('id', sid)
      .single();
    setSilabusInfo(sil);

    // Load CPMK untuk silabus ini
    const { data: cpmks } = await supabase
      .from('dokumen_cpmk')
      .select('*')
      .eq('silabus_id', sid)
      .order('no_urut', { ascending: true });
    setCpmkList(cpmks || []);

    // Load CPL yang dipilih
    const { data: cplData } = await supabase
      .from('dokumen_cpl_silabus')
      .select('*')
      .eq('silabus_id', sid)
      .order('urutan', { ascending: true });

    if (cplData && cplData.length > 0) {
      setSelectedCpl(cplData.map(c => c.no_cpl));
      setCplList(cplData.map(c => ({ no: c.no_cpl, desc: c.deskripsi_cpl })));
    } else {
      setSelectedCpl(CPL_DEFAULT_S1.map(c => c.no));
      setCplList(CPL_DEFAULT_S1);
    }

    // Load matriks CPL-CPMK
    const { data: mData } = await supabase
      .from('dokumen_matriks_cpl_cpmk')
      .select('*')
      .eq('silabus_id', sid);

    const mObj = {};
    (mData || []).forEach(r => {
      if (!mObj[r.no_cpmk]) mObj[r.no_cpmk] = {};
      mObj[r.no_cpmk][r.no_cpl] = r.nilai;
    });
    setMatriksData(mObj);

    // Load bobot CPMK
    const { data: bobotData } = await supabase
      .from('dokumen_cpmk_bobot')
      .select('*')
      .eq('silabus_id', sid);

    const bobotObj = {};
    (bobotData || []).forEach(r => {
      bobotObj[r.no_cpmk] = { bobot: r.bobot_persen, minggu: r.jumlah_minggu };
    });
    setBobotCpmk(bobotObj);

    // Load RAE
    const { data: raeData } = await supabase
      .from('dokumen_rae')
      .select('*')
      .eq('silabus_id', sid)
      .order('no_rae', { ascending: true });
    setRaeList(raeData || []);

    // Load RAE-CPMK
    const { data: raeCpmk } = await supabase
      .from('dokumen_rae_cpmk')
      .select('*')
      .eq('silabus_id', sid);

    const rcObj = {};
    (raeCpmk || []).forEach(r => {
      if (!rcObj[r.no_rae]) rcObj[r.no_rae] = {};
      rcObj[r.no_rae][r.no_cpmk] = r.bobot_persen === null ? '--' : String(r.bobot_persen);
    });
    setRaeCpmkData(rcObj);

    setLoading(false);
  }, []);

  useEffect(() => {
    if (silabusId) loadData(silabusId);
  }, [silabusId, loadData]);

  // Flatten silabusInfo untuk render header
  const mkInfo = silabusInfo ? {
    kode_mk: silabusInfo.master_mata_kuliah?.kode_mk || silabusInfo.kode_mk || '—',
    nama_mk: silabusInfo.master_mata_kuliah?.nama_mk || silabusInfo.nama_mk || '—',
    jenjang: silabusInfo.master_mata_kuliah?.jenjang || silabusInfo.jenjang || '—',
    semester: silabusInfo.master_mata_kuliah?.semester || silabusInfo.semester || '—',
    sks: silabusInfo.master_mata_kuliah?.sks || silabusInfo.sks || '—',
  } : null;

  // Toggle sel CPL
  const toggleCpl = (no) => {
    setSelectedCpl(prev =>
      prev.includes(no) ? prev.filter(x => x !== no) : [...prev, no]
    );
  };

  // Toggle nilai matriks CPL-CPMK
  const toggleMatriks = (noCpmk, noCpl) => {
    setMatriksData(prev => {
      const cur = prev[noCpmk]?.[noCpl] || 0;
      return {
        ...prev,
        [noCpmk]: { ...(prev[noCpmk] || {}), [noCpl]: cur === 1 ? 0 : 1 }
      };
    });
  };

  // Update bobot CPMK
  const updateBobotCpmk = (noCpmk, field, val) => {
    setBobotCpmk(prev => ({
      ...prev,
      [noCpmk]: { ...(prev[noCpmk] || {}), [field]: val }
    }));
  };

  // Tambah RAE baru
  const addRae = () => {
    const nextNo = raeList.length > 0 ? Math.max(...raeList.map(r => r.no_rae)) + 1 : 1;
    setRaeList(prev => [
      ...prev,
      { no_rae: nextNo, jenis_evaluasi: 'Tugas', nama_evaluasi: '', jenis_penilaian: 'Kognitif-Tugas', bobot_total: 0, _new: true }
    ]);
  };

  const updateRae = (noRae, field, val) => {
    setRaeList(prev => prev.map(r => r.no_rae === noRae ? { ...r, [field]: val } : r));
  };

  const removeRae = (noRae) => {
    setRaeList(prev => prev.filter(r => r.no_rae !== noRae));
    setRaeCpmkData(prev => {
      const next = { ...prev };
      delete next[noRae];
      return next;
    });
  };

  const updateRaeCpmk = (noRae, noCpmk, val) => {
    setRaeCpmkData(prev => ({
      ...prev,
      [noRae]: { ...(prev[noRae] || {}), [noCpmk]: val }
    }));
  };

  // Hitung total bobot CPL per kolom
  const totalBobotCpl = (noCpl) => {
    const activeCpmks = cpmkList.filter(c => matriksData[c.no_urut]?.[noCpl] === 1);
    if (activeCpmks.length === 0) return 0;
    const total = activeCpmks.reduce((sum, c) => {
      const b = parseFloat(bobotCpmk[c.no_urut]?.bobot) || 0;
      return sum + b;
    }, 0);
    return total / (selectedCpl.length || 1);
  };

  // Hitung total bobot RAE per CPMK
  const totalBobotRaeByCpmk = (noCpmk) => {
    return raeList.reduce((sum, r) => {
      const val = raeCpmkData[r.no_rae]?.[noCpmk];
      if (!val || val === '--') return sum;
      return sum + (parseFloat(val) || 0);
    }, 0);
  };

  // Simpan semua data
  const handleSave = async () => {
    if (!silabusId) return;
    setSaving(true);
    setMsg('');

    try {
      // 1. Simpan CPL yang dipilih
      await supabase.from('dokumen_cpl_silabus').delete().eq('silabus_id', silabusId);
      const cplInserts = selectedCpl.map((no, i) => {
        const cplInfo = cplList.find(c => c.no === no) || CPL_DEFAULT_S1.find(c => c.no === no);
        return {
          silabus_id: silabusId,
          user_id: user.id,
          no_cpl: no,
          deskripsi_cpl: cplInfo?.desc || '',
          urutan: i,
        };
      });
      if (cplInserts.length > 0) {
        await supabase.from('dokumen_cpl_silabus').insert(cplInserts);
      }

      // 2. Simpan matriks CPL-CPMK
      await supabase.from('dokumen_matriks_cpl_cpmk').delete().eq('silabus_id', silabusId);
      const matriksInserts = [];
      cpmkList.forEach(c => {
        selectedCpl.forEach(noCpl => {
          matriksInserts.push({
            silabus_id: silabusId,
            user_id: user.id,
            no_cpmk: c.no_urut,
            no_cpl: noCpl,
            nilai: matriksData[c.no_urut]?.[noCpl] || 0,
          });
        });
      });
      if (matriksInserts.length > 0) {
        await supabase.from('dokumen_matriks_cpl_cpmk').insert(matriksInserts);
      }

      // 3. Simpan bobot CPMK
      await supabase.from('dokumen_cpmk_bobot').delete().eq('silabus_id', silabusId);
      const bobotInserts = cpmkList.map(c => ({
        silabus_id: silabusId,
        user_id: user.id,
        no_cpmk: c.no_urut,
        bobot_persen: parseFloat(bobotCpmk[c.no_urut]?.bobot) || 0,
        jumlah_minggu: parseInt(bobotCpmk[c.no_urut]?.minggu) || 0,
      }));
      if (bobotInserts.length > 0) {
        await supabase.from('dokumen_cpmk_bobot').insert(bobotInserts);
      }

      // 4. Simpan RAE
      await supabase.from('dokumen_rae').delete().eq('silabus_id', silabusId);
      const raeInserts = raeList.map(r => ({
        silabus_id: silabusId,
        user_id: user.id,
        no_rae: r.no_rae,
        jenis_evaluasi: r.jenis_evaluasi,
        nama_evaluasi: r.nama_evaluasi,
        jenis_penilaian: r.jenis_penilaian,
        bobot_total: parseFloat(r.bobot_total) || 0,
      }));
      if (raeInserts.length > 0) {
        await supabase.from('dokumen_rae').insert(raeInserts);
      }

      // 5. Simpan RAE-CPMK
      await supabase.from('dokumen_rae_cpmk').delete().eq('silabus_id', silabusId);
      const raeCpmkInserts = [];
      raeList.forEach(r => {
        cpmkList.forEach(c => {
          const val = raeCpmkData[r.no_rae]?.[c.no_urut];
          raeCpmkInserts.push({
            silabus_id: silabusId,
            user_id: user.id,
            no_rae: r.no_rae,
            no_cpmk: c.no_urut,
            bobot_persen: (!val || val === '--') ? null : parseFloat(val),
          });
        });
      });
      if (raeCpmkInserts.length > 0) {
        await supabase.from('dokumen_rae_cpmk').insert(raeCpmkInserts);
      }

      setMsg('✅ Matriks berhasil disimpan!');
    } catch (err) {
      setMsg('❌ Gagal menyimpan: ' + err.message);
    }
    setSaving(false);
  };

  // ——— Hitung ringkasan ———
  const totalBobotCpmkAll = cpmkList.reduce((s, c) => s + (parseFloat(bobotCpmk[c.no_urut]?.bobot) || 0), 0);
  const totalMingguAll = cpmkList.reduce((s, c) => s + (parseInt(bobotCpmk[c.no_urut]?.minggu) || 0), 0);
  const totalBobotRae = raeList.reduce((s, r) => s + (parseFloat(r.bobot_total) || 0), 0);

  const st = {
    page: { minHeight: '100vh', background: '#f8fafc' },
    wrap: { maxWidth: 1300, margin: '0 auto', padding: '56px 16px 48px' },
    card: { background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24, marginBottom: 20 },
    h1: { fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 4 },
    h2: { fontSize: 16, fontWeight: 600, color: '#334155', marginBottom: 16 },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 },
    select: { width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
    input: { padding: '6px 10px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 13, width: '100%' },
    btn: { padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
    btnPrimary: { background: 'var(--color-primary)', color: 'white' },
    btnGhost: { background: '#f1f5f9', color: '#475569' },
    tabBar: { display: 'flex', gap: 4, marginBottom: 20 },
    tab: (active) => ({
      padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
      fontSize: 14, fontWeight: active ? 700 : 500,
      background: active ? 'var(--color-primary)' : '#f1f5f9',
      color: active ? 'white' : '#64748b',
    }),
    tbl: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: { background: '#f1f5f9', padding: '8px 10px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: 12 },
    thLeft: { background: '#f1f5f9', padding: '8px 10px', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: 12 },
    td: { padding: '7px 10px', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'middle' },
    tdLeft: { padding: '7px 10px', border: '1px solid #e2e8f0', textAlign: 'left', verticalAlign: 'middle' },
    badge: (ok) => ({
      display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: ok ? '#dcfce7' : '#fef9c3', color: ok ? '#166534' : '#854d0e',
    }),
    chip: (active) => ({
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 20, border: `1.5px solid ${active ? 'var(--color-primary)' : '#cbd5e1'}`,
      background: active ? '#eff6ff' : 'white', color: active ? 'var(--color-primary)' : '#94a3b8',
      fontSize: 13, fontWeight: 600, cursor: 'pointer', userSelect: 'none',
    }),
  };

  return (
    <div>
    <div style={st.page}>

      <div style={st.wrap}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <button onClick={() => navigate(`/form/${silabusId}`)} style={{ ...st.btn, ...st.btnGhost, padding: '6px 14px', fontSize: 13 }}>
              ← Kembali ke Form
            </button>
            <div>
              <h1 style={st.h1}>📊 Matriks CPL-CPMK & RAE</h1>
              {mkInfo && (
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  {mkInfo.kode_mk} — {mkInfo.nama_mk} · {mkInfo.jenjang} Sem. {mkInfo.semester} · {mkInfo.sks} SKS
                </p>
              )}
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ ...st.btn, ...st.btnPrimary, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Menyimpan...' : '💾 Simpan Matriks'}
              </button>
            </div>
          </div>
          {msg && <div style={{ fontSize: 13, color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', marginBottom: 8 }}>{msg}</div>}
        </div>

        {!silabusId && (
          <div style={{ ...st.card, textAlign: 'center', padding: 48, color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Silabus tidak ditemukan</div>
            <div style={{ fontSize: 13 }}>Akses matriks dari halaman form mata kuliah</div>
          </div>
        )}

        {silabusId && loading && (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>⏳</div>
            <div>Memuat data...</div>
          </div>
        )}

        {silabusId && !loading && (
          <>
            {/* Tab Navigation */}
            <div style={st.tabBar}>
              <button style={st.tab(activeTab === 'cpl-cpmk')} onClick={() => setActiveTab('cpl-cpmk')}>
                1️⃣ Matriks CPL ↔ CPMK
              </button>
              <button style={st.tab(activeTab === 'rae')} onClick={() => setActiveTab('rae')}>
                2️⃣ Rencana Asesmen & Evaluasi (RAE)
              </button>
              <button style={st.tab(activeTab === 'ringkasan')} onClick={() => setActiveTab('ringkasan')}>
                3️⃣ Ringkasan & Validasi
              </button>
            </div>

            {/* ===== TAB 1: MATRIKS CPL-CPMK ===== */}
            {activeTab === 'cpl-cpmk' && (
              <>
                {/* Pilih CPL aktif */}
                <div style={st.card}>
                  <h2 style={st.h2}>CPL yang Digunakan pada MK Ini</h2>
                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                    Klik CPL untuk memasukkan atau mengeluarkan dari matriks. Hanya CPL terpilih yang akan muncul di tabel.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {CPL_DEFAULT_S1.map(cpl => (
                      <div
                        key={cpl.no}
                        style={st.chip(selectedCpl.includes(cpl.no))}
                        onClick={() => toggleCpl(cpl.no)}
                        title={cpl.desc}
                      >
                        {selectedCpl.includes(cpl.no) ? '✓' : '+'} CPL-{cpl.no}
                      </div>
                    ))}
                  </div>
                  {selectedCpl.length > 0 && (
                    <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
                      {selectedCpl.length} CPL dipilih: {selectedCpl.map(n => `CPL-${n}`).join(', ')}
                    </div>
                  )}
                </div>

                {/* Tabel Matriks */}
                <div style={st.card}>
                  <h2 style={st.h2}>Matriks Relasi CPL dan CPMK</h2>
                  {cpmkList.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: 24 }}>
                      Belum ada CPMK. Buat dulu di CPMK Generator.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={st.tbl}>
                        <thead>
                          <tr>
                            <th style={{ ...st.thLeft, width: 40 }}>No.</th>
                            <th style={{ ...st.thLeft, minWidth: 300 }}>Deskripsi CPMK</th>
                            {selectedCpl.map(no => (
                              <th key={no} style={{ ...st.th, width: 60 }}>CPL-{no}</th>
                            ))}
                            <th style={{ ...st.th, width: 90 }}>Bobot (%)</th>
                            <th style={{ ...st.th, width: 70 }}>Minggu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cpmkList.map(c => (
                            <tr key={c.id}>
                              <td style={st.td}>{c.no_urut}</td>
                              <td style={{ ...st.tdLeft, fontSize: 12, lineHeight: 1.5 }}>
                                {c.pernyataan || c.deskripsi_cpmk || '—'}
                              </td>
                              {selectedCpl.map(noCpl => {
                                const val = matriksData[c.no_urut]?.[noCpl] || 0;
                                return (
                                  <td key={noCpl} style={{ ...st.td, cursor: 'pointer' }}
                                    onClick={() => toggleMatriks(c.no_urut, noCpl)}>
                                    {val === 1
                                      ? <span style={{ color: '#16a34a', fontSize: 18, fontWeight: 700 }}>✓</span>
                                      : <span style={{ color: '#e2e8f0', fontSize: 18 }}>○</span>
                                    }
                                  </td>
                                );
                              })}
                              <td style={st.td}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  style={{ ...st.input, width: 70, textAlign: 'center' }}
                                  value={bobotCpmk[c.no_urut]?.bobot ?? ''}
                                  onChange={e => updateBobotCpmk(c.no_urut, 'bobot', e.target.value)}
                                  placeholder="0"
                                />
                              </td>
                              <td style={st.td}>
                                <input
                                  type="number"
                                  min="0"
                                  max="16"
                                  style={{ ...st.input, width: 60, textAlign: 'center' }}
                                  value={bobotCpmk[c.no_urut]?.minggu ?? ''}
                                  onChange={e => updateBobotCpmk(c.no_urut, 'minggu', e.target.value)}
                                  placeholder="0"
                                />
                              </td>
                            </tr>
                          ))}
                          {/* Row kosong/tambah */}
                          <tr>
                            <td style={{ ...st.td, color: '#94a3b8' }}>—</td>
                            <td style={{ ...st.tdLeft, color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>
                              Tambah CPMK lewat menu CPMK Generator
                            </td>
                            {selectedCpl.map(no => <td key={no} style={st.td}></td>)}
                            <td style={st.td}></td>
                            <td style={st.td}></td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#f8fafc' }}>
                            <td colSpan={2} style={{ ...st.tdLeft, fontWeight: 700, fontSize: 12 }}>
                              Total Bobot CPL
                            </td>
                            {selectedCpl.map(noCpl => {
                              const tot = totalBobotCpl(noCpl);
                              return (
                                <td key={noCpl} style={{ ...st.td, fontWeight: 700, fontSize: 12 }}>
                                  {tot > 0 ? `${tot.toFixed(0)}%` : '0%'}
                                </td>
                              );
                            })}
                            <td style={{ ...st.td, fontWeight: 700 }}>
                              <span style={st.badge(Math.abs(totalBobotCpmkAll - 100) < 1)}>
                                {totalBobotCpmkAll.toFixed(0)}%
                              </span>
                            </td>
                            <td style={{ ...st.td, fontWeight: 700 }}>
                              <span style={st.badge(totalMingguAll === 16)}>
                                {totalMingguAll}/16
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                  <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
                    💡 Klik sel ○/✓ untuk mengaktifkan/menonaktifkan relasi CPL-CPMK. Isi Bobot (%) dan Jumlah Minggu tiap CPMK.
                  </div>
                </div>

                {/* Deskripsi CPL yang dipilih */}
                {selectedCpl.length > 0 && (
                  <div style={st.card}>
                    <h2 style={st.h2}>Deskripsi CPL yang Digunakan</h2>
                    <table style={st.tbl}>
                      <thead>
                        <tr>
                          <th style={{ ...st.th, width: 70 }}>No. CPL</th>
                          <th style={st.thLeft}>Deskripsi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCpl.map(no => {
                          const cpl = CPL_DEFAULT_S1.find(c => c.no === no);
                          return (
                            <tr key={no}>
                              <td style={st.td}><strong>CPL-{no}</strong></td>
                              <td style={{ ...st.tdLeft, fontSize: 12, lineHeight: 1.5 }}>{cpl?.desc}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ===== TAB 2: RAE ===== */}
            {activeTab === 'rae' && (
              <>
                <div style={st.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ ...st.h2, marginBottom: 0 }}>Rencana Asesmen & Evaluasi (RAE)</h2>
                    <button onClick={addRae} style={{ ...st.btn, ...st.btnPrimary, fontSize: 13 }}>
                      + Tambah Evaluasi
                    </button>
                  </div>

                  {raeList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>
                      Belum ada rencana evaluasi. Klik "+ Tambah Evaluasi" untuk mulai.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={st.tbl}>
                        <thead>
                          <tr>
                            <th style={{ ...st.th, width: 40 }}>No.</th>
                            <th style={{ ...st.th, width: 90 }}>Jenis</th>
                            <th style={{ ...st.thLeft, minWidth: 200 }}>Nama Evaluasi</th>
                            <th style={{ ...st.th, width: 150 }}>Jenis Penilaian</th>
                            <th style={{ ...st.th, width: 90 }}>Bobot Total</th>
                            {cpmkList.map(c => (
                              <th key={c.no_urut} style={{ ...st.th, width: 70 }}>CPMK-{c.no_urut}</th>
                            ))}
                            <th style={{ ...st.th, width: 50 }}>Hapus</th>
                          </tr>
                          {/* Baris target bobot CPMK */}
                          <tr style={{ background: '#eff6ff' }}>
                            <th colSpan={5} style={{ ...st.thLeft, fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>
                              Target Bobot CPMK:
                            </th>
                            {cpmkList.map(c => (
                              <th key={c.no_urut} style={{ ...st.th, fontSize: 11, color: '#3b82f6' }}>
                                {bobotCpmk[c.no_urut]?.bobot ? `${bobotCpmk[c.no_urut].bobot}%` : '—'}
                              </th>
                            ))}
                            <th style={st.th}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {raeList.map(r => (
                            <tr key={r.no_rae}>
                              <td style={st.td}>{r.no_rae}</td>
                              <td style={st.td}>
                                <select
                                  style={{ ...st.input, padding: '4px 6px', fontSize: 12 }}
                                  value={r.jenis_evaluasi}
                                  onChange={e => updateRae(r.no_rae, 'jenis_evaluasi', e.target.value)}
                                >
                                  {JENIS_EVALUASI_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              </td>
                              <td style={st.tdLeft}>
                                <input
                                  style={st.input}
                                  value={r.nama_evaluasi}
                                  onChange={e => updateRae(r.no_rae, 'nama_evaluasi', e.target.value)}
                                  placeholder="Nama tugas/ujian..."
                                />
                              </td>
                              <td style={st.td}>
                                <select
                                  style={{ ...st.input, padding: '4px 6px', fontSize: 12 }}
                                  value={r.jenis_penilaian}
                                  onChange={e => updateRae(r.no_rae, 'jenis_penilaian', e.target.value)}
                                >
                                  {JENIS_PENILAIAN_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              </td>
                              <td style={st.td}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  style={{ ...st.input, width: 70, textAlign: 'center' }}
                                  value={r.bobot_total}
                                  onChange={e => updateRae(r.no_rae, 'bobot_total', e.target.value)}
                                  placeholder="0"
                                />
                              </td>
                              {cpmkList.map(c => (
                                <td key={c.no_urut} style={st.td}>
                                  <input
                                    style={{ ...st.input, width: 60, textAlign: 'center' }}
                                    value={raeCpmkData[r.no_rae]?.[c.no_urut] ?? '--'}
                                    onChange={e => updateRaeCpmk(r.no_rae, c.no_urut, e.target.value)}
                                    placeholder="--"
                                  />
                                </td>
                              ))}
                              <td style={st.td}>
                                <button
                                  onClick={() => removeRae(r.no_rae)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16 }}
                                  title="Hapus"
                                >✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#f8fafc' }}>
                            <td colSpan={4} style={{ ...st.tdLeft, fontWeight: 700, fontSize: 12 }}>
                              Total Bobot CPMK
                            </td>
                            <td style={st.td}>
                              <span style={st.badge(Math.abs(totalBobotRae - 100) < 1)}>
                                {totalBobotRae.toFixed(0)}%
                              </span>
                            </td>
                            {cpmkList.map(c => {
                              const tot = totalBobotRaeByCpmk(c.no_urut);
                              const target = parseFloat(bobotCpmk[c.no_urut]?.bobot) || 0;
                              return (
                                <td key={c.no_urut} style={st.td}>
                                  <span style={st.badge(Math.abs(tot - target) < 0.5)}>
                                    {tot.toFixed(0)}%
                                  </span>
                                </td>
                              );
                            })}
                            <td style={st.td}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                  <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
                    💡 Isi bobot per CPMK untuk setiap evaluasi (dalam %). Gunakan "--" untuk evaluasi yang tidak menilai CPMK tersebut.
                  </div>
                </div>
              </>
            )}

            {/* ===== TAB 3: RINGKASAN ===== */}
            {activeTab === 'ringkasan' && (
              <div style={st.card}>
                <h2 style={st.h2}>Ringkasan & Validasi Matriks</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>

                  {/* Total Bobot CPMK */}
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Total Bobot CPMK</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: Math.abs(totalBobotCpmkAll - 100) < 1 ? '#16a34a' : '#dc2626' }}>
                      {totalBobotCpmkAll.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Target: 100%</div>
                  </div>

                  {/* Total Minggu */}
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Total Minggu</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: totalMingguAll === 16 ? '#16a34a' : '#f59e0b' }}>
                      {totalMingguAll}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Target: 16 minggu</div>
                  </div>

                  {/* Total Bobot RAE */}
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Total Bobot RAE</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: Math.abs(totalBobotRae - 100) < 1 ? '#16a34a' : '#dc2626' }}>
                      {totalBobotRae.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Target: 100%</div>
                  </div>

                  {/* CPL Aktif */}
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>CPL Aktif</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>
                      {selectedCpl.length}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{selectedCpl.map(n => `CPL-${n}`).join(', ') || '—'}</div>
                  </div>
                </div>

                {/* Checklist validasi */}
                <div style={{ fontSize: 14 }}>
                  <div style={{ fontWeight: 600, marginBottom: 10, color: '#334155' }}>Checklist Kelengkapan:</div>
                  {[
                    { ok: selectedCpl.length > 0, label: `CPL telah dipilih (${selectedCpl.length} CPL)` },
                    { ok: cpmkList.length > 0, label: `CPMK sudah ada (${cpmkList.length} CPMK)` },
                    { ok: Math.abs(totalBobotCpmkAll - 100) < 1, label: `Total bobot CPMK = 100% (saat ini: ${totalBobotCpmkAll.toFixed(0)}%)` },
                    { ok: totalMingguAll === 16, label: `Total minggu = 16 (saat ini: ${totalMingguAll})` },
                    { ok: raeList.length > 0, label: `RAE telah diisi (${raeList.length} evaluasi)` },
                    { ok: Math.abs(totalBobotRae - 100) < 1, label: `Total bobot RAE = 100% (saat ini: ${totalBobotRae.toFixed(0)}%)` },
                    { ok: cpmkList.every(c => selectedCpl.some(noCpl => matriksData[c.no_urut]?.[noCpl] === 1)), label: 'Setiap CPMK terhubung ke minimal 1 CPL' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: 16 }}>{item.ok ? '✅' : '⚠️'}</span>
                      <span style={{ color: item.ok ? '#16a34a' : '#f59e0b' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </div>
  );
}

