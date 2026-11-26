import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Icon from '../components/Icon';

const RUMPUN_COLORS = {
  'Perancangan Arsitektur':          '#ff7f7f',
  'Teori Sejarah Kritik Arsitektur': '#f9d94c',
  'Perumahan & Pemukiman':           '#fde0d4',
  'Sains Teknologi Arsitektur':      '#7bb8e8',
  'Perancangan Kota':                '#62c8f0',
  'Non Departemen/ITS':              '#b0b0b0',
  'Praktik Profesi':                 '#47d45a',
};

const VISI = 'Menjadi Departemen Arsitektur bertaraf internasional yang berkontribusi di tingkat Asia dan mengembangkan pendidikan arsitektur berbasis kolaborasi riset dan keunggulan lokal.';
const MISI = 'Memberikan kontribusi dalam ilmu pengetahuan dan teknologi bidang arsitektur untuk kesejahteraan masyarakat melalui kegiatan pendidikan, penelitian, pengabdian kepada Masyarakat, dan manajemen yang berbasis teknologi informasi dan komunikasi.';
const TUJUAN = [
  'Mendidik, mengembangkan kemampuan mahasiswa, dan menghasilkan lulusan yang berbudi luhur, kristis, kreatif, unggul dalam penguasaan dan penerapan ilmu pengetahuan dan teknologi bidang arsitektur, berkepribadian dan mandiri, bersikap professional, memiliki integritas dan tanggung jawab yang tinggi, mampu beradaptasi dan mengembangkan diri serta bersaing ditingkat nasional dan internasional.',
  'Menghasilkan karya konseptual yang relevan dan berkualitas tinggi, berakar pada keunggulan lokal dan dapat dikontribusikan pada masyarakat di tingkat regional, nasional dan internasional.',
  'Menumbuhkan suasana akademik yang kondusif, serta menjunjung tinggi tata nilai moral akademik dalam usaha membentuk masyarakat kampus yang dinamis dan harmonis.',
  'Menjadikan program sarjana arsitektur sebagai pusat pendidikan dan penerapan ilmu pengetahuan dan teknologi bidang arsitektur, perumahan & permukiman, perkotaan dan lingkungan.',
];

const TIMELINE_START = 2025;
const TIMELINE_END   = 2040;
const TOTAL_YEARS    = TIMELINE_END - TIMELINE_START + 1;

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [profil, setProfil] = useState(null);
  const [versiList, setVersiList] = useState([]);
  const [selectedVersi, setSelectedVersi] = useState(null);
  const [jenjang, setJenjang] = useState('S1');
  const [filterRumpun, setFilterRumpun] = useState('');
  const [showVisi, setShowVisi] = useState(true);
  const [dokStats, setDokStats] = useState({ total: 0, selesai: 0, draft: 0 });
  const timelineRef = useRef(null);

  useEffect(() => {
    // Profil
    supabase.from('profil_dosen').select('*').eq('id', user.id).single()
      .then(({ data }) => setProfil(data));

    // Versi
    supabase.from('versi_kurikulum').select('*').order('tahun_mulai')
      .then(({ data }) => {
        setVersiList(data || []);
        const aktif = (data || []).find(v => v.status === 'aktif' && v.jenjang === 'S1');
        if (aktif) setSelectedVersi(aktif);
      });

    // Stats dokumen
    supabase.from('dokumen_silabus').select('status').eq('dosen_id', user.id)
      .then(({ data }) => {
        const d = data || [];
        setDokStats({
          total: d.length,
          selesai: d.filter(x => x.status === 'selesai').length,
          draft: d.filter(x => x.status === 'draft').length,
        });
      });
  }, [user]);

  // Scroll timeline ke periode aktif
  useEffect(() => {
    if (selectedVersi && timelineRef.current) {
      const pct = (selectedVersi.tahun_mulai - TIMELINE_START) / TOTAL_YEARS;
      const el = timelineRef.current;
      el.scrollLeft = pct * el.scrollWidth - el.clientWidth / 2;
    }
  }, [selectedVersi]);

  const periodeWidth = (v) => {
    const start = Math.max(v.tahun_mulai, TIMELINE_START);
    const end   = Math.min(v.tahun_selesai || v.tahun_mulai + 5, TIMELINE_END);
    return { left: `${((start - TIMELINE_START) / TOTAL_YEARS) * 100}%`, width: `${((end - start) / TOTAL_YEARS) * 100}%` };
  };

  const nama = profil?.nama_lengkap?.split(',')[0] || user?.email?.split('@')[0] || 'Pengguna';

  return (
    <div style={{ display: 'flex', height: '100vh', paddingRight: 'var(--rail-width, 44px)', overflow: 'hidden', background: '#EDF3F9', transition: 'padding-right 0.2s ease' }}>

      {/* ── MAIN CANVAS ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Top greeting */}
        <div style={{ padding: '32px 48px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
            Departemen Arsitektur ITS
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                Selamat datang, {nama}
              </h1>
              <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
                {selectedVersi ? `Periode aktif: ${selectedVersi.nama}` : 'Sistem Informasi Kurikulum'}
              </p>
            </div>
            {/* Quick stats */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'Dokumen', value: dokStats.total, color: 'var(--color-primary)', bg: 'rgba(42,100,150,0.08)' },
                { label: 'Selesai', value: dokStats.selesai, color: '#16a34a', bg: '#dcfce7' },
                { label: 'Draf', value: dokStats.draft, color: '#c2410c', bg: '#fff3e0' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 72 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: s.color, opacity: 0.8, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TIMELINE ── */}
        <div style={{ padding: '0 48px', marginBottom: 0 }}>
          {/* Periode pills above line */}
          <div style={{ position: 'relative', height: 48, marginBottom: 0 }}>
            {versiList.filter(v => v.jenjang === jenjang).map(v => {
              const pos = periodeWidth(v);
              const isActive = v.status === 'aktif';
              const isDraft  = v.status === 'draft';
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersi(v)}
                  style={{
                    position: 'absolute',
                    left: pos.left,
                    top: 10,
                    width: pos.width,
                    height: 28,
                    background: selectedVersi?.id === v.id ? 'white' : isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
                    border: `1.5px solid ${isActive ? 'var(--color-primary)' : isDraft ? '#94a3b8' : '#ccc'}`,
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    color: isActive ? 'var(--color-primary)' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: selectedVersi?.id === v.id ? '0 2px 10px rgba(42,100,150,0.2)' : 'none',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {v.tahun_mulai}–{v.tahun_selesai || v.tahun_mulai + 4}
                  {isDraft && <span style={{ fontSize: 9, background: '#e2e8f0', color: '#64748b', padding: '1px 5px', borderRadius: 3 }}>draft</span>}
                </button>
              );
            })}
          </div>

          {/* Timeline ruler */}
          <div ref={timelineRef} style={{ position: 'relative', overflowX: 'auto', userSelect: 'none' }}>
            {/* Arrow line */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
              <div style={{ flex: 1, height: 2, background: '#1a1a1a', position: 'relative' }}>
                {/* Tick marks */}
                {Array.from({ length: TOTAL_YEARS }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${(i / (TOTAL_YEARS - 1)) * 100}%`,
                      top: 0,
                      width: 1,
                      height: i % 5 === 0 ? 10 : 6,
                      background: '#1a1a1a',
                      transform: 'translateX(-50%)',
                    }}
                  />
                ))}
              </div>
              {/* Arrowhead */}
              <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '10px solid #1a1a1a' }} />
            </div>

            {/* Year labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              {Array.from({ length: TOTAL_YEARS }, (_, i) => TIMELINE_START + i).map(yr => (
                <div key={yr} style={{
                  fontSize: 11,
                  color: selectedVersi && yr >= selectedVersi.tahun_mulai && yr <= (selectedVersi.tahun_selesai || selectedVersi.tahun_mulai + 4)
                    ? 'var(--color-primary)' : '#94a3b8',
                  fontWeight: yr === new Date().getFullYear() ? 700 : 400,
                  minWidth: 0,
                  textAlign: 'center',
                  flex: 1,
                }}>
                  {yr}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Visi Misi Tujuan card ── */}
        <div style={{ padding: '24px 48px', flex: 1, overflowY: 'auto' }}>
          {showVisi && (
            <div style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #e0e8f0',
              borderRadius: 16,
              padding: '20px 24px',
              maxWidth: 620,
              boxShadow: '0 2px 16px rgba(42,100,150,0.08)',
            }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>Visi</div>
                <div style={{ fontSize: 12, color: '#333', lineHeight: 1.7 }}>{VISI}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>Misi</div>
                <div style={{ fontSize: 12, color: '#333', lineHeight: 1.7 }}>{MISI}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>Tujuan</div>
                {TUJUAN.map((t, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#333', lineHeight: 1.7, marginBottom: 4 }}>
                    {i + 1}. {t}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Pohon Kurikulum', icon: 'account_tree', path: '/pohon', color: 'var(--color-primary)' },
              { label: 'Node Mode', icon: 'hub', path: '/node', color: '#7c3aed' },
              { label: 'Direktori MK', icon: 'list', path: '/direktori', color: '#0369a1' },
              { label: 'Matriks OBE', icon: 'grid_view', path: '/matriks', color: '#0f766e' },
              { label: 'Generator RPS', icon: 'edit_note', path: '/form', color: '#c2410c' },
            ].map(a => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
                  border: '1px solid #e0e8f0', borderRadius: 12,
                  padding: '10px 16px', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: a.color,
                  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.06)'; }}
              >
                <Icon name={a.icon} size={16} style={{ color: a.color }} />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        width: 220,
        flexShrink: 0,
        height: '100vh',
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        borderLeft: '1px solid #e0e8f0',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        padding: '16px 14px',
      }}>
        {/* User */}
        <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f4f8' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{profil?.nama_lengkap?.split(',')[0] || 'Pengguna'}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{profil?.role || 'Dosen'}</div>
        </div>

        {/* Periode */}
        <RSection title="Periode">
          <select
            value={selectedVersi?.id || ''}
            onChange={e => { const v = versiList.find(x => x.id === e.target.value); setSelectedVersi(v); }}
            style={{ width: '100%', padding: '6px 8px', fontSize: 11, border: '1px solid #e0e8f0', borderRadius: 7, background: '#f8fafc' }}
          >
            {versiList.map(v => <option key={v.id} value={v.id}>{v.nama}</option>)}
          </select>
        </RSection>

        {/* Visi Misi toggle */}
        <RSection title="Visi Misi Tujuan">
          <button
            onClick={() => setShowVisi(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: showVisi ? 'rgba(42,100,150,0.08)' : '#f0f4f8',
              border: 'none', borderRadius: 7,
              padding: '6px 10px', cursor: 'pointer', fontSize: 11, color: '#444',
              width: '100%',
            }}
          >
            <Icon name={showVisi ? 'visibility' : 'visibility_off'} size={14} />
            {showVisi ? 'Sembunyikan' : 'Tampilkan'}
          </button>
        </RSection>

        {/* Pohon Kurikulum links */}
        <RSection title="Pohon Kurikulum">
          {['Sarjana', 'PPAr', 'Magister', 'Doktor'].map(j => (
            <label key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', fontSize: 12 }}>
              <input
                type="radio"
                name="jenjang_dash"
                checked={jenjang === (j === 'Sarjana' ? 'S1' : j === 'Magister' ? 'S2' : j === 'Doktor' ? 'S3' : j)}
                onChange={() => setJenjang(j === 'Sarjana' ? 'S1' : j === 'Magister' ? 'S2' : j === 'Doktor' ? 'S3' : j)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              {j}
            </label>
          ))}
        </RSection>

        {/* Rumpun MK */}
        <RSection title="Rumpun Mata Kuliah">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(RUMPUN_COLORS).map(([r, color]) => (
              <button
                key={r}
                onClick={() => setFilterRumpun(r === filterRumpun ? '' : r)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: filterRumpun === r ? color + '22' : 'transparent',
                  border: 'none', borderRadius: 5, padding: '3px 4px',
                  cursor: 'pointer', fontSize: 10, color: '#333', textAlign: 'left',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                {r}
              </button>
            ))}
          </div>
        </RSection>

        {/* Zoom / Nav controls */}
        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #f0f4f8', display: 'flex', justifyContent: 'center', gap: 8 }}>
          {[
            { icon: 'add', action: () => {} },
            { icon: 'remove', action: () => {} },
            { icon: 'my_location', action: () => {} },
          ].map(({ icon, action }) => (
            <button key={icon} onClick={action} style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#f0f4f8', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b',
            }}>
              <Icon name={icon} size={16} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RSection({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}
