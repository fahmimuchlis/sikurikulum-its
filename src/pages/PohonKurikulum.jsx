import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Icon from '../components/Icon';

// ── Rumpun warna mapping (dari Figma) ──────────────────────────────────────
const RUMPUN_COLORS = {
  'Perancangan Arsitektur':          { bg: '#ff7f7f', label: '#7a1a1a' }, // merah
  'Teori Sejarah Kritik Arsitektur': { bg: '#ffff99', label: '#5a5a00' }, // kuning
  'Perumahan & Pemukiman':           { bg: '#fde0d4', label: '#7a3010' }, // salmon
  'Sains Teknologi Arsitektur':      { bg: '#dce8f5', label: '#1a3a5a' }, // biru muda
  'Perancangan Kota':                { bg: '#62c8f0', label: '#0a3a5a' }, // biru terang
  'Non Departemen/ITS':              { bg: '#b0b0b0', label: '#2a2a2a' }, // abu
  'Studio':                          { bg: '#ff7f7f', label: '#7a1a1a' }, // merah (studio = perancangan)
  'Praktik Profesi':                 { bg: '#47d45a', label: '#0a4a1a' }, // hijau
  'default':                         { bg: '#ffff99', label: '#5a5a00' }, // kuning default
};

const JENJANG_OPTIONS = [
  { id: 'S1',   label: 'Sarjana',  semesterMax: 8 },
  { id: 'PPAr', label: 'PPAr',     semesterMax: 2 },
  { id: 'S2',   label: 'Magister', semesterMax: 4 },
  { id: 'S3',   label: 'Doktor',   semesterMax: 6 },
];

function getRumpunColor(rumpun) {
  if (!rumpun) return RUMPUN_COLORS['default'];
  for (const key of Object.keys(RUMPUN_COLORS)) {
    if (rumpun.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
      return RUMPUN_COLORS[key];
    }
  }
  return RUMPUN_COLORS['default'];
}

// MK Card
function MKCard({ mk, onClick }) {
  const color = getRumpunColor(mk.rumpun || mk.tipe_mk);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onClick(mk)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`${mk.kode_mk} — ${mk.nama_mk}\n${mk.sks} SKS · ${mk.rumpun || mk.tipe_mk || ''}`}
      style={{
        background: color.bg,
        border: '1px solid rgba(0,0,0,0.18)',
        borderRadius: 10,
        padding: '8px 10px',
        cursor: 'pointer',
        minWidth: 110,
        maxWidth: 150,
        minHeight: 60,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        boxShadow: hovered
          ? '0 4px 12px rgba(0,0,0,0.18)'
          : '0 1px 3px rgba(0,0,0,0.1)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'all 0.15s ease',
        flexShrink: 0,
      }}
    >
      <div style={{
        fontSize: 9.5,
        fontWeight: 700,
        color: color.label,
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        opacity: 0.8,
      }}>
        {mk.kode_mk}
      </div>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: color.label,
        lineHeight: 1.3,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {mk.nama_mk}
      </div>
      <div style={{
        fontSize: 10,
        color: color.label,
        opacity: 0.75,
        marginTop: 2,
      }}>
        {mk.sks} SKS
      </div>
    </div>
  );
}

// Baris semester
function SemesterRow({ semester, mks, onClick }) {
  const semLabel = `Sem. ${semester}`;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      minHeight: 80,
      position: 'relative',
    }}>
      {/* Garis horizontal */}
      <div style={{
        position: 'absolute',
        left: 0, right: 48,
        top: '50%',
        height: 1,
        background: 'rgba(42,100,150,0.1)',
        zIndex: 0,
      }} />

      {/* Label semester */}
      <div style={{
        width: 56,
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--color-gray-500)',
        textAlign: 'right',
        paddingRight: 10,
        flexShrink: 0,
        zIndex: 1,
      }}>
        {semLabel}
      </div>

      {/* MK cards */}
      <div style={{
        display: 'flex',
        gap: 8,
        flex: 1,
        flexWrap: 'wrap',
        paddingLeft: 8,
        zIndex: 1,
      }}>
        {mks.length === 0 ? (
          <div style={{
            height: 60,
            width: 110,
            border: '1.5px dashed var(--color-gray-300)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-gray-400)',
            fontSize: 11,
          }}>
            Belum ada MK
          </div>
        ) : (
          mks.map(mk => (
            <MKCard key={mk.id} mk={mk} onClick={onClick} />
          ))
        )}
      </div>

      {/* Total SKS baris */}
      <div style={{
        width: 44,
        textAlign: 'center',
        fontSize: 11,
        color: 'var(--color-primary)',
        fontWeight: 700,
        flexShrink: 0,
      }}>
        {mks.reduce((sum, mk) => sum + (mk.sks || 0), 0)} sks
      </div>
    </div>
  );
}

// Detail panel untuk MK yang diklik
function MKDetailPanel({ mk, onClose }) {
  if (!mk) return null;
  const color = getRumpunColor(mk.rumpun || mk.tipe_mk);

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'white',
      border: '1px solid var(--color-gray-200)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      padding: '16px 20px',
      minWidth: 320,
      maxWidth: 480,
      zIndex: 300,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: 6,
        alignSelf: 'stretch',
        borderRadius: 3,
        background: color.bg,
        flexShrink: 0,
        border: '1px solid rgba(0,0,0,0.1)',
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--color-gray-500)', marginBottom: 2 }}>
          {mk.kode_mk} · {mk.sks} SKS · Sem. {mk.semester} · {mk.rumpun || mk.tipe_mk || '—'}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: 6 }}>
          {mk.nama_mk}
        </div>
        {mk.nama_inggris && (
          <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginBottom: 6, fontStyle: 'italic' }}>
            {mk.nama_inggris}
          </div>
        )}
        {mk.prasyarat && (
          <div style={{ fontSize: 11, color: 'var(--color-gray-500)' }}>
            Prasyarat: {mk.prasyarat}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-gray-400)', padding: 4, flexShrink: 0,
        }}
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

export default function PohonKurikulum() {
  const navigate = useNavigate();
  const [selectedJenjang, setSelectedJenjang] = useState('S1');
  const [versiList, setVersiList] = useState([]);
  const [selectedVersi, setSelectedVersi] = useState(null);
  const [mkData, setMkData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMK, setSelectedMK] = useState(null);
  const [filterRumpun, setFilterRumpun] = useState(null);

  const semMax = JENJANG_OPTIONS.find(j => j.id === selectedJenjang)?.semesterMax || 8;
  const semesters = Array.from({ length: semMax }, (_, i) => semMax - i); // 8 → 1 (atas ke bawah)

  // Load versi kurikulum
  useEffect(() => {
    supabase
      .from('versi_kurikulum')
      .select('*')
      .eq('jenjang', selectedJenjang)
      .order('tahun_mulai', { ascending: false })
      .then(({ data }) => {
        setVersiList(data || []);
        const aktif = data?.find(v => v.status === 'aktif');
        setSelectedVersi(aktif || data?.[0] || null);
      });
  }, [selectedJenjang]);

  // Load MK dari master_mata_kuliah filtered by semester
  useEffect(() => {
    setLoading(true);
    supabase
      .from('master_mata_kuliah')
      .select(`
        id, kode_mk, nama_mk, sks, semester,
        master_tipe_mk ( nama_tipe )
      `)
      .order('semester', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          const mapped = data.map(mk => ({
            ...mk,
            rumpun: mk.master_tipe_mk?.nama_tipe || null,
          }));
          setMkData(mapped);
        }
        setLoading(false);
      });
  }, [selectedJenjang]);

  // Kelompokkan MK per semester
  const mkBySemester = (sem) => {
    let mks = mkData.filter(mk => mk.semester === sem);
    if (filterRumpun) {
      mks = mks.filter(mk =>
        (mk.rumpun || '').toLowerCase().includes(filterRumpun.toLowerCase())
      );
    }
    return mks;
  };

  // Statistik
  const totalSKS   = mkData.reduce((s, mk) => s + (mk.sks || 0), 0);
  const totalWajib  = mkData.length; // semua dianggap wajib sampai ada field
  const rumpunList  = [...new Set(mkData.map(mk => mk.rumpun).filter(Boolean))];

  return (
    <div style={{
      minHeight: '100vh',
      paddingRight: 'var(--rail-width)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Header bar */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-gray-200)',
        padding: '0 24px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-gray-500)', display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 13,
          }}
        >
          <Icon name="arrow_back" size={16} />
          Kembali
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--color-gray-200)' }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-gray-900)' }}>
          Pohon Kurikulum
        </div>

        {/* Jenjang tabs */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {JENJANG_OPTIONS.map(j => (
            <button
              key={j.id}
              onClick={() => { setSelectedJenjang(j.id); setSelectedMK(null); }}
              style={{
                padding: '5px 14px',
                borderRadius: 6,
                border: '1px solid',
                borderColor: selectedJenjang === j.id ? 'var(--color-primary)' : 'var(--color-gray-200)',
                background: selectedJenjang === j.id ? 'var(--color-primary)' : 'transparent',
                color: selectedJenjang === j.id ? 'white' : 'var(--color-gray-700)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {j.label}
            </button>
          ))}
        </div>

        {/* Periode/versi selector */}
        {versiList.length > 0 && (
          <select
            value={selectedVersi?.id || ''}
            onChange={e => setSelectedVersi(versiList.find(v => v.id === e.target.value))}
            style={{
              padding: '5px 10px',
              borderRadius: 6,
              border: '1px solid var(--color-gray-200)',
              fontSize: 12,
              color: 'var(--color-gray-700)',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            {versiList.map(v => (
              <option key={v.id} value={v.id}>
                {v.nama} {v.status === 'aktif' ? '(Aktif)' : v.status === 'draft' ? '(Draft)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, gap: 0 }}>

        {/* Grid area */}
        <div style={{
          flex: 1,
          padding: '24px 24px 24px 20px',
          overflowX: 'auto',
        }}>
          {/* Title */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--color-gray-900)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Struktur Kurikulum {JENJANG_OPTIONS.find(j => j.id === selectedJenjang)?.label}
              {selectedVersi && (
                <span style={{ fontWeight: 400, fontSize: 14, marginLeft: 10, color: 'var(--color-gray-500)', textTransform: 'none' }}>
                  ({selectedVersi.tahun_mulai}
                  {selectedVersi.tahun_selesai ? `–${selectedVersi.tahun_selesai}` : '—'})
                </span>
              )}
            </h1>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 40, color: 'var(--color-gray-500)' }}>
              <div className="spinner spinner-primary" />
              Memuat data mata kuliah...
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minWidth: 600,
            }}>
              {semesters.map(sem => (
                <SemesterRow
                  key={sem}
                  semester={sem}
                  mks={mkBySemester(sem)}
                  onClick={setSelectedMK}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{
          width: 200,
          background: 'rgba(233,239,243,0.92)',
          borderLeft: '1px solid var(--color-gray-200)',
          padding: '20px 14px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
        }}>

          {/* Rumpun filter */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Rumpun Mata Kuliah
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <button
                onClick={() => setFilterRumpun(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '2px 0', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  border: filterRumpun === null ? '2.5px solid var(--color-primary)' : '2px solid var(--color-gray-400)',
                  background: filterRumpun === null ? 'var(--color-primary)' : 'transparent',
                }} />
                <span style={{ fontSize: 11, color: 'var(--color-gray-700)' }}>Semua</span>
              </button>
              {rumpunList.map(r => {
                const col = getRumpunColor(r);
                return (
                  <button
                    key={r}
                    onClick={() => setFilterRumpun(filterRumpun === r ? null : r)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '2px 0', textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: col.bg,
                      border: `1px solid rgba(0,0,0,0.15)`,
                      outline: filterRumpun === r ? `2px solid var(--color-primary)` : 'none',
                    }} />
                    <span style={{ fontSize: 10, color: 'var(--color-gray-700)', lineHeight: 1.3 }}>{r}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Statistik */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Statistik
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { label: 'Total MK', val: mkData.length },
                { label: 'Total SKS', val: totalSKS },
                { label: 'MK Wajib', val: totalWajib },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '4px 0',
                  borderBottom: '1px solid var(--color-gray-200)',
                  fontSize: 11,
                }}>
                  <span style={{ color: 'var(--color-gray-600)' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-gray-900)' }}>{row.val}</span>
                </div>
              ))}
            </div>

            {/* Per semester */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--color-gray-500)', marginBottom: 4 }}>SKS per semester</div>
              {semesters.slice().reverse().map(sem => {
                const mks = mkData.filter(mk => mk.semester === sem);
                const sks = mks.reduce((s, mk) => s + (mk.sks || 0), 0);
                const pct = totalSKS > 0 ? (sks / totalSKS) * 100 : 0;
                return (
                  <div key={sem} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <span style={{ width: 28, fontSize: 9, color: 'var(--color-gray-500)', flexShrink: 0 }}>
                      Sem {sem}
                    </span>
                    <div style={{
                      flex: 1, height: 6, background: 'var(--color-gray-200)', borderRadius: 3, overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: 'var(--color-primary)',
                        borderRadius: 3,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <span style={{ width: 20, fontSize: 9, color: 'var(--color-gray-700)', textAlign: 'right', flexShrink: 0 }}>
                      {sks}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend warna */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Legenda Warna
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(RUMPUN_COLORS).filter(([k]) => k !== 'default').map(([name, col]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 16, height: 10, borderRadius: 3,
                    background: col.bg,
                    border: '1px solid rgba(0,0,0,0.12)',
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 9.5, color: 'var(--color-gray-700)', lineHeight: 1.3 }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail floating panel */}
      <MKDetailPanel mk={selectedMK} onClose={() => setSelectedMK(null)} />
    </div>
  );
}
