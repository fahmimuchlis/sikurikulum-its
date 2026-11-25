import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import Icon from '../components/Icon';

// Rumpun colors (sesuai PohonKurikulum)
const RUMPUN_COLORS = {
  'Perancangan Arsitektur':          '#ff7f7f',
  'Teori Sejarah Kritik Arsitektur': '#f9d94c',
  'Perumahan & Pemukiman':           '#fde0d4',
  'Sains Teknologi Arsitektur':      '#7bb8e8',
  'Perancangan Kota':                '#62c8f0',
  'Non Departemen/ITS':              '#b0b0b0',
  'Praktik Profesi':                 '#47d45a',
};

const RUMPUN_LIST = Object.keys(RUMPUN_COLORS);

// ── RPS Document Preview ──────────────────────────────────────────────────────
function RPSPreview({ dok }) {
  if (!dok) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100%', color: '#94a3b8', gap: 12,
      }}>
        <Icon name="description" size={48} style={{ color: '#dce8f5' }} />
        <div style={{ fontSize: 13, fontWeight: 500 }}>Pilih mata kuliah untuk melihat preview RPS</div>
      </div>
    );
  }

  const mk = dok.master_mata_kuliah;
  const dosen = dok.profil_dosen;

  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', height: '100%' }}>
      {/* RPS document paper */}
      <div style={{
        background: 'white',
        border: '1px solid #e0e8f0',
        borderRadius: 4,
        boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: 11,
        color: '#1a1a1a',
        maxWidth: 760,
        margin: '0 auto',
        overflow: 'hidden',
      }}>
        {/* ITS Header */}
        <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '2px solid #1a1a1a' }}>
          <tbody>
            <tr>
              <td rowSpan={2} style={{ width: 90, padding: '10px 12px', borderRight: '1px solid #ccc', textAlign: 'center', verticalAlign: 'middle' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, lineHeight: 1.4 }}>
                  DEPARTEMEN<br />
                  <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--color-primary)' }}>ARSITEKTUR</span>
                </div>
              </td>
              <td colSpan={3} style={{ padding: '8px 12px', borderBottom: '1px solid #ccc', fontWeight: 700, fontSize: 13, letterSpacing: 1, textAlign: 'center' }}>
                RENCANA PEMBELAJARAN SEMESTER
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px 12px', fontSize: 10, borderRight: '1px solid #eee' }}>
                <b>FAKULTAS</b><br />TEKNIK SIPIL, PERENCANAAN DAN KEBUMIAN
              </td>
              <td style={{ padding: '5px 12px', fontSize: 10, borderRight: '1px solid #eee' }}>
                <b>DEPARTEMEN</b><br />ARSITEKTUR
              </td>
              <td style={{ padding: '5px 12px', fontSize: 10 }}>
                <b>PRODI</b><br />{mk?.jenjang === 'S1' ? 'SARJANA' : mk?.jenjang === 'S2' ? 'MAGISTER' : mk?.jenjang}
              </td>
            </tr>
          </tbody>
        </table>

        {/* MK Identity */}
        <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '1px solid #ccc' }}>
          <tbody>
            <tr>
              <td style={{ width: 180, padding: '6px 12px', background: '#f8fafc', borderRight: '1px solid #e0e8f0', fontSize: 10, fontWeight: 600 }}>Nama Mata Kuliah</td>
              <td style={{ padding: '6px 12px', fontSize: 10, fontWeight: 700 }}>{mk?.nama_mk}</td>
              <td style={{ width: 80, padding: '6px 12px', background: '#f8fafc', borderLeft: '1px solid #e0e8f0', borderRight: '1px solid #e0e8f0', fontSize: 10, fontWeight: 600 }}>Kredit</td>
              <td style={{ width: 60, padding: '6px 12px', fontSize: 10, fontWeight: 700 }}>{mk?.sks}</td>
            </tr>
            <tr style={{ borderTop: '1px solid #e0e8f0' }}>
              <td style={{ padding: '6px 12px', background: '#f8fafc', borderRight: '1px solid #e0e8f0', fontSize: 10, fontWeight: 600 }}>Kode MK</td>
              <td style={{ padding: '6px 12px', fontSize: 10, fontFamily: 'monospace' }}>{mk?.kode_mk}</td>
              <td style={{ padding: '6px 12px', background: '#f8fafc', borderLeft: '1px solid #e0e8f0', borderRight: '1px solid #e0e8f0', fontSize: 10, fontWeight: 600 }}>Semester</td>
              <td style={{ padding: '6px 12px', fontSize: 10 }}>{mk?.semester}</td>
            </tr>
          </tbody>
        </table>

        {/* Otorisasi */}
        <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '1px solid #ccc' }}>
          <thead>
            <tr style={{ background: '#f0f4f8' }}>
              <th style={{ padding: '5px 12px', fontSize: 10, fontWeight: 700, textAlign: 'left', borderRight: '1px solid #e0e8f0' }}>Otorisasi (ttd.)</th>
              <th style={{ padding: '5px 12px', fontSize: 10, fontWeight: 700, textAlign: 'center', borderRight: '1px solid #e0e8f0' }}>Pengembang RPS</th>
              <th style={{ padding: '5px 12px', fontSize: 10, fontWeight: 700, textAlign: 'center', borderRight: '1px solid #e0e8f0' }}>Koordinator MK</th>
              <th style={{ padding: '5px 12px', fontSize: 10, fontWeight: 700, textAlign: 'center', borderRight: '1px solid #e0e8f0' }}>Ka.Prodi</th>
              <th style={{ padding: '5px 12px', fontSize: 10, fontWeight: 700, textAlign: 'center' }}>Tgl. Penyusunan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '14px 12px', borderRight: '1px solid #e0e8f0' }}></td>
              <td style={{ padding: '14px 12px', fontSize: 10, textAlign: 'center', borderRight: '1px solid #e0e8f0', color: '#888' }}>
                {dosen?.nama_lengkap || '—'}
              </td>
              <td style={{ padding: '14px 12px', fontSize: 10, textAlign: 'center', borderRight: '1px solid #e0e8f0', color: '#888' }}>
                {dosen?.nama_lengkap || '—'}
              </td>
              <td style={{ padding: '14px 12px', fontSize: 10, textAlign: 'center', borderRight: '1px solid #e0e8f0', color: '#888' }}>Ka.Prodi</td>
              <td style={{ padding: '14px 12px', fontSize: 10, textAlign: 'center', color: '#888' }}>
                {dok.updated_at ? new Date(dok.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* CPL */}
        <RPSSection title="CPL Beban Mata Kuliah">
          {dok.cpl_list?.length ? dok.cpl_list.map((cpl, i) => (
            <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
              <td style={{ width: 30, padding: '5px 10px', textAlign: 'center', color: '#888', fontSize: 10 }}>{i + 1}</td>
              <td style={{ padding: '5px 10px', fontSize: 10 }}>{cpl}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={2} style={{ padding: '10px 12px', fontSize: 10, color: '#aaa', fontStyle: 'italic' }}>
                Data CPL belum tersedia
              </td>
            </tr>
          )}
        </RPSSection>

        {/* CPMK */}
        <RPSSection title="Capaian Pembelajaran MK (CPMK)">
          {dok.cpmk_list?.length ? dok.cpmk_list.map((cpmk, i) => (
            <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
              <td style={{ width: 30, padding: '5px 10px', textAlign: 'center', color: '#888', fontSize: 10 }}>{i + 1}</td>
              <td style={{ padding: '5px 10px', fontSize: 10, lineHeight: 1.5 }}>{cpmk}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={2} style={{ padding: '10px 12px', fontSize: 10, color: '#aaa', fontStyle: 'italic' }}>
                Data CPMK belum tersedia
              </td>
            </tr>
          )}
        </RPSSection>

        {/* Deskripsi MK */}
        <div style={{ padding: '0', borderBottom: '1px solid #ccc' }}>
          <div style={{ padding: '5px 12px', background: '#f0f4f8', borderBottom: '1px solid #e0e8f0', fontSize: 10, fontWeight: 700 }}>
            Deskripsi MK
          </div>
          <div style={{ padding: '10px 12px', fontSize: 10, lineHeight: 1.7, color: dok.deskripsi ? '#1a1a1a' : '#aaa', fontStyle: dok.deskripsi ? 'normal' : 'italic' }}>
            {dok.deskripsi || mk?.deskripsi_mk || 'Deskripsi mata kuliah belum tersedia.'}
          </div>
        </div>

        {/* Bahan Kajian */}
        <RPSSection title="Bahan Kajian">
          {dok.bk_list?.length ? dok.bk_list.map((bk, i) => (
            <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
              <td style={{ width: 30, padding: '5px 10px', textAlign: 'center', color: '#888', fontSize: 10 }}>{i + 1}</td>
              <td style={{ padding: '5px 10px', fontSize: 10 }}>{bk}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={2} style={{ padding: '10px 12px', fontSize: 10, color: '#aaa', fontStyle: 'italic' }}>
                Bahan kajian belum tersedia
              </td>
            </tr>
          )}
        </RPSSection>

        {/* Pustaka placeholder */}
        <div style={{ borderBottom: '1px solid #ccc' }}>
          <div style={{ padding: '5px 12px', background: '#f0f4f8', borderBottom: '1px solid #e0e8f0', fontSize: 10, fontWeight: 700 }}>
            Pustaka
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '5px 12px', background: '#f8fafc', borderRight: '1px solid #e0e8f0', borderBottom: '1px solid #f0f0f0', fontSize: 10, fontWeight: 600, width: 80 }}>Utama</td>
                <td style={{ padding: '8px 12px', fontSize: 10, color: '#aaa', fontStyle: 'italic' }}>Referensi pustaka utama belum diisi</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 12px', background: '#f8fafc', borderRight: '1px solid #e0e8f0', fontSize: 10, fontWeight: 600 }}>Pendukung</td>
                <td style={{ padding: '8px 12px', fontSize: 10, color: '#aaa', fontStyle: 'italic' }}>Referensi pendukung belum diisi</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 12px', background: '#f8fafc', fontSize: 9, color: '#94a3b8', textAlign: 'right' }}>
          Versi 01.00 · {dok.updated_at ? new Date(dok.updated_at).toLocaleDateString('id-ID') : '—'} · ITSArchCurricula.app
        </div>
      </div>
    </div>
  );
}

function RPSSection({ title, children }) {
  return (
    <div style={{ borderBottom: '1px solid #ccc' }}>
      <div style={{ padding: '5px 12px', background: '#f0f4f8', borderBottom: '1px solid #e0e8f0', fontSize: 10, fontWeight: 700 }}>
        {title}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// ── Main Direktori Page ───────────────────────────────────────────────────────
export default function Direktori({ user }) {
  const [mkList, setMkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDok, setSelectedDok] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [versiList, setVersiList] = useState([]);
  const [selectedVersi, setSelectedVersi] = useState('');
  const [jenjang, setJenjang] = useState('S1');
  const [filterRumpun, setFilterRumpun] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [search, setSearch] = useState('');
  const [rightOpen, setRightOpen] = useState(true);
  const [previewZoom, setPreviewZoom] = useState(1);

  // Load versi
  useEffect(() => {
    supabase.from('versi_kurikulum').select('*').order('tahun_mulai').then(({ data }) => {
      setVersiList(data || []);
      const aktif = (data || []).find(v => v.status === 'aktif' && v.jenjang === 'S1');
      if (aktif) setSelectedVersi(aktif.id);
    });
  }, []);

  // Load MK list
  useEffect(() => {
    setLoading(true);
    setSelectedDok(null);
    supabase
      .from('dokumen_silabus')
      .select(`
        id, status, updated_at, deskripsi,
        master_mata_kuliah (id, kode_mk, nama_mk, nama_mk_en, sks, jenjang, semester, rumpun_mk, deskripsi_mk),
        profil_dosen (nama_lengkap, nidn)
      `)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setMkList(data || []);
        setLoading(false);
      });
  }, []);

  // Load CPL & CPMK for selected doc
  const selectDok = async (dok) => {
    setSelectedDok({ ...dok, cpl_list: null, cpmk_list: null, bk_list: null });
    setLoadingPreview(true);

    const mkId = dok.master_mata_kuliah?.id;
    const [cplRes, cpmkRes] = await Promise.all([
      supabase.from('master_cpl').select('kode_cpl, deskripsi').order('kode_cpl'),
      supabase.from('dokumen_cpmk').select('nama_cpmk, deskripsi').eq('mk_id', mkId || '').order('created_at'),
    ]);

    const cplItems = (cplRes.data || []).map(c => `${c.kode_cpl}: ${(c.deskripsi || '').slice(0, 150)}`);
    const cpmkItems = (cpmkRes.data || []).map(c => c.nama_cpmk || c.deskripsi || '');
    const bkItems = (cpmkRes.data || []).map((c, i) => `BK ${i + 1}: ${(c.deskripsi || '').slice(0, 100)}`);

    setSelectedDok(prev => ({ ...prev, cpl_list: cplItems, cpmk_list: cpmkItems, bk_list: bkItems }));
    setLoadingPreview(false);
  };

  // Filtered MK
  const filtered = useMemo(() => {
    return mkList.filter(d => {
      const mk = d.master_mata_kuliah;
      if (!mk) return false;
      if (mk.jenjang !== jenjang) return false;
      if (filterRumpun && mk.rumpun_mk !== filterRumpun) return false;
      if (filterSem && String(mk.semester) !== filterSem) return false;
      if (search) {
        const q = search.toLowerCase();
        return mk.nama_mk?.toLowerCase().includes(q) || mk.kode_mk?.toLowerCase().includes(q) || d.profil_dosen?.nama_lengkap?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [mkList, jenjang, filterRumpun, filterSem, search]);

  // Stats per semester
  const semStats = useMemo(() => {
    const stats = {};
    mkList.filter(d => d.master_mata_kuliah?.jenjang === jenjang).forEach(d => {
      const sem = d.master_mata_kuliah?.semester;
      if (!stats[sem]) stats[sem] = { total: 0, sks: 0 };
      stats[sem].total++;
      stats[sem].sks += d.master_mata_kuliah?.sks || 0;
    });
    return stats;
  }, [mkList, jenjang]);

  const semCount = jenjang === 'S1' ? 8 : jenjang === 'S2' ? 4 : jenjang === 'S3' ? 6 : 2;

  return (
    <div style={{ display: 'flex', height: '100vh', paddingRight: 44, overflow: 'hidden', background: '#EDF3F9' }}>

      {/* ── LEFT: MK Table ── */}
      <div style={{
        width: 460,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
        borderRight: '1px solid #e0e8f0',
        height: '100vh',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid #f0f0f0' }}>
          {/* Versi pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--color-primary)', color: 'white',
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            }}>
              {versiList.find(v => v.id === selectedVersi)?.kode || 'Kurikulum'}
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff7f7f' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffcf7f' }} />
            </div>
          </div>

          {/* Jenjang tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {['S1', 'PPAr', 'S2', 'S3'].map(j => (
              <button key={j} onClick={() => { setJenjang(j); setFilterSem(''); setFilterRumpun(''); }} style={{
                flex: 1, padding: '5px 2px', fontSize: 11, fontWeight: 600,
                borderRadius: 6, border: 'none', cursor: 'pointer',
                background: jenjang === j ? 'var(--color-primary)' : '#f5f5f5',
                color: jenjang === j ? 'white' : '#666',
              }}>{j}</button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Icon name="search" size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama MK, kode, dosen..."
              style={{
                width: '100%', padding: '7px 10px 7px 28px',
                fontSize: 12, border: '1px solid #e0e8f0', borderRadius: 8,
                outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 44px 1fr',
          padding: '7px 16px', borderBottom: '1px solid #e8f0f8',
          background: '#f8fafc',
        }}>
          {['Mata Kuliah', 'SKS', 'Koordinator Mata Kuliah'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {/* MK rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div className="page-loader" style={{ minHeight: 200 }}><div className="spinner spinner-primary" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
              <Icon name="search_off" size={32} style={{ color: '#e0e8f0', marginBottom: 8 }} />
              <div style={{ fontSize: 12 }}>Tidak ada mata kuliah</div>
            </div>
          ) : filtered.map(dok => {
            const mk = dok.master_mata_kuliah;
            const isActive = selectedDok?.id === dok.id;
            const rumpunColor = RUMPUN_COLORS[mk?.rumpun_mk] || '#e0e8f0';

            return (
              <button
                key={dok.id}
                onClick={() => selectDok(dok)}
                style={{
                  width: '100%', textAlign: 'left',
                  display: 'grid', gridTemplateColumns: '1fr 44px 1fr',
                  alignItems: 'center', gap: 0,
                  padding: '10px 16px',
                  background: isActive ? 'rgba(42,100,150,0.06)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                  borderBottom: '1px solid #f0f4f8',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* MK info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 7px',
                      background: rumpunColor + '33',
                      color: '#1a1a1a',
                      borderRadius: 4, fontFamily: 'monospace',
                      border: `1px solid ${rumpunColor}66`,
                    }}>{mk?.kode_mk}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.3 }}>{mk?.nama_mk}</div>
                  {mk?.nama_mk_en && (
                    <div style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', marginTop: 1 }}>{mk.nama_mk_en}</div>
                  )}
                </div>

                {/* SKS */}
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textAlign: 'center' }}>
                  {mk?.sks}
                </div>

                {/* Koordinator */}
                <div style={{ fontSize: 11, color: '#444', lineHeight: 1.4, paddingLeft: 8 }}>
                  {dok.profil_dosen?.nama_lengkap || <span style={{ color: '#ccc' }}>—</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer count */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', fontSize: 11, color: '#94a3b8', background: '#f8fafc' }}>
          {filtered.length} mata kuliah · {filtered.reduce((sum, d) => sum + (d.master_mata_kuliah?.sks || 0), 0)} total SKS
        </div>
      </div>

      {/* ── CENTER: Preview ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Preview header */}
        <div style={{
          padding: '10px 16px', background: 'rgba(255,255,255,0.9)',
          borderBottom: '1px solid #e0e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#f8fafc', border: '1px solid #e0e8f0',
              borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }} />
              <span style={{ fontWeight: 600 }}>Preview</span>
            </div>
            {selectedDok && (
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {selectedDok.master_mata_kuliah?.kode_mk} — {selectedDok.master_mata_kuliah?.nama_mk}
              </span>
            )}
          </div>

          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.1))}
              style={{ background: '#f0f4f8', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 14 }}>−</button>
            <span style={{ fontSize: 11, color: '#64748b', minWidth: 42, textAlign: 'center' }}>{Math.round(previewZoom * 100)}%</span>
            <button onClick={() => setPreviewZoom(z => Math.min(1.5, z + 0.1))}
              style={{ background: '#f0f4f8', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 14 }}>+</button>
            <button onClick={() => setPreviewZoom(1)}
              style={{ background: '#f0f4f8', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, marginLeft: 4 }}>Reset</button>
          </div>
        </div>

        {/* Preview content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          {loadingPreview ? (
            <div className="page-loader" style={{ minHeight: 400 }}><div className="spinner spinner-primary" /></div>
          ) : (
            <div style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top center', transition: 'transform 0.15s' }}>
              <RPSPreview dok={selectedDok} />
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Filter Panel ── */}
      {rightOpen ? (
        <div style={{
          width: 220,
          flexShrink: 0,
          background: 'white',
          borderLeft: '1px solid #e0e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          height: '100vh',
        }}>
          {/* Top icons row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 12px 0', gap: 4 }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }} title="List view">
              <Icon name="view_list" size={18} />
            </button>
            <button onClick={() => setRightOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <Icon name="chevron_right" size={18} />
            </button>
          </div>

          <div style={{ padding: '0 14px 20px', flex: 1 }}>
            {/* Periode */}
            <RSection title="Periode">
              <select
                value={selectedVersi}
                onChange={e => setSelectedVersi(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', fontSize: 11, border: '1px solid #e0e8f0', borderRadius: 7, background: '#f8fafc' }}
              >
                {versiList.map(v => <option key={v.id} value={v.id}>{v.nama}</option>)}
              </select>
            </RSection>

            {/* Visi Misi */}
            <RSection title="Visi Misi Tujuan">
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#f0f4f8', border: 'none', borderRadius: 7,
                padding: '6px 10px', cursor: 'pointer', fontSize: 11, color: '#444',
              }}>
                <Icon name="visibility" size={14} /> Lihat Visi Misi
              </button>
            </RSection>

            {/* Rumpun MK filter */}
            <RSection title="Rumpun Mata Kuliah">
              <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                {['S1', 'PPAr', 'S2', 'S3'].map(j => (
                  <button key={j} onClick={() => setJenjang(j)} style={{
                    padding: '3px 8px', fontSize: 10, fontWeight: 600,
                    borderRadius: 5, border: 'none', cursor: 'pointer',
                    background: jenjang === j ? 'var(--color-primary)' : '#f0f4f8',
                    color: jenjang === j ? 'white' : '#666',
                  }}>{j}</button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <button
                  onClick={() => setFilterRumpun('')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: !filterRumpun ? 'rgba(42,100,150,0.08)' : 'transparent',
                    border: 'none', borderRadius: 6, padding: '4px 6px',
                    cursor: 'pointer', fontSize: 11, color: '#333', textAlign: 'left',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', flexShrink: 0 }} />
                  Semua Rumpun
                </button>
                {RUMPUN_LIST.map(r => (
                  <button key={r}
                    onClick={() => setFilterRumpun(r === filterRumpun ? '' : r)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      background: filterRumpun === r ? RUMPUN_COLORS[r] + '22' : 'transparent',
                      border: 'none', borderRadius: 6, padding: '4px 6px',
                      cursor: 'pointer', fontSize: 11, color: '#333', textAlign: 'left',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: RUMPUN_COLORS[r], flexShrink: 0 }} />
                    {r}
                  </button>
                ))}
              </div>
            </RSection>

            {/* Statistik per semester */}
            <RSection title="Statistik">
              <div style={{ marginBottom: 6 }}>
                {Array.from({ length: semCount }, (_, i) => i + 1).map(sem => {
                  const st = semStats[sem] || { total: 0, sks: 0 };
                  const isActive = filterSem === String(sem);
                  return (
                    <button
                      key={sem}
                      onClick={() => setFilterSem(isActive ? '' : String(sem))}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '4px 6px', marginBottom: 2,
                        background: isActive ? 'rgba(42,100,150,0.08)' : 'transparent',
                        border: 'none', borderRadius: 5, cursor: 'pointer',
                        fontSize: 11, color: '#333',
                      }}
                    >
                      <span style={{ color: isActive ? 'var(--color-primary)' : '#64748b', fontWeight: isActive ? 700 : 400 }}>
                        Sem. {sem}
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: '#94a3b8' }}>{st.total} MK</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{st.sks} SKS</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </RSection>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setRightOpen(true)}
          style={{
            position: 'fixed', top: 16, right: 60,
            background: 'white', border: '1px solid #e0e8f0', borderRadius: 8,
            padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, color: '#333', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50,
          }}
        >
          <Icon name="tune" size={16} /> Filter
        </button>
      )}
    </div>
  );
}

function RSection({ title, children }) {
  return (
    <div style={{ marginBottom: 18, paddingTop: 14, borderTop: '1px solid #f0f4f8' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}
