import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Icon from '../components/Icon';

// ── RMK → warna (sesuai master data) ─────────────────────────────────────────
const RMK_COLOR = {
  PA:   { bg: '#ffb3b3', border: '#d94f4f', label: 'Perancangan Arsitektur' },
  TS:   { bg: '#fff176', border: '#c8a000', label: 'Teori Sejarah Kritik' },
  ST:   { bg: '#b3d9ff', border: '#2a6cb5', label: 'Sains Teknologi' },
  PP:   { bg: '#ffd6c2', border: '#d4622a', label: 'Perumahan & Permukiman' },
  PK:   { bg: '#62c8f0', border: '#0a6a9a', label: 'Perancangan Kota' },
  DL:   { bg: '#d0d0d0', border: '#777',    label: 'Non Departemen/ITS' },
  PPAr: { bg: '#a8e6b8', border: '#2a7a4a', label: 'Praktik Profesi' },
  SKPB: { bg: '#ffe0b2', border: '#c47000', label: 'Kurikulum Bersama ITS' },
  Umum: { bg: '#e8d5f5', border: '#7b2fa2', label: 'Umum/Wajib' },
};

// Studio tampil merah tua seperti di bagan resmi
const STUDIO_COLOR = { bg: '#ff7f7f', border: '#c00000', label: 'Studio Perancangan' };

function getRmkColor(mk) {
  if (mk.tipe === 'Studio') return STUDIO_COLOR;
  return RMK_COLOR[mk.rmk] || { bg: '#eeeeee', border: '#aaaaaa', label: mk.rmk || '—' };
}

const JENJANG_OPTIONS = [
  { id: 'S1',   label: 'Sarjana',  semesterMax: 8 },
  { id: 'PPAr', label: 'PPAr',     semesterMax: 2 },
  { id: 'S2',   label: 'Magister', semesterMax: 4 },
  { id: 'S3',   label: 'Doktor',   semesterMax: 6 },
];

// ── MK Card (mirip bagan resmi: compact, warna blok penuh) ───────────────────
function MKCard({ mk, onClick, selected }) {
  const col = getRmkColor(mk);
  const [hov, setHov] = useState(false);
  const isStudio = mk.tipe === 'Studio';

  return (
    <div
      onClick={() => onClick(mk)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={`${mk.kode_mk} — ${mk.nama_mk}\n${mk.sks} SKS · ${mk.tipe || ''} · ${mk.rmk || ''}`}
      style={{
        background: col.bg,
        border: `1.5px solid ${selected ? '#1a4fa8' : col.border}`,
        borderRadius: 8,
        padding: isStudio ? '10px 12px' : '7px 10px',
        cursor: 'pointer',
        width: isStudio ? 160 : 130,
        minHeight: isStudio ? 72 : 58,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 2,
        boxShadow: selected
          ? '0 0 0 3px rgba(26,79,168,0.3)'
          : hov
          ? '0 4px 10px rgba(0,0,0,0.18)'
          : '0 1px 3px rgba(0,0,0,0.12)',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'all 0.13s ease',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Garis kiri tebal untuk studio */}
      {isStudio && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
          background: col.border, borderRadius: '8px 0 0 8px',
        }} />
      )}
      <div style={{
        fontSize: 9,
        fontWeight: 700,
        color: 'rgba(0,0,0,0.5)',
        letterSpacing: '0.3px',
        fontFamily: 'monospace',
        paddingLeft: isStudio ? 6 : 0,
      }}>
        {mk.kode_mk}
      </div>
      <div style={{
        fontSize: isStudio ? 11.5 : 10.5,
        fontWeight: 700,
        color: '#111',
        lineHeight: 1.3,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        paddingLeft: isStudio ? 6 : 0,
      }}>
        {mk.nama_mk}
      </div>
      <div style={{
        fontSize: 9.5,
        color: 'rgba(0,0,0,0.55)',
        fontWeight: 600,
        paddingLeft: isStudio ? 6 : 0,
      }}>
        {mk.sks} SKS{mk.wajib_pilihan === 'P' ? ' · Pilihan' : ''}
      </div>
    </div>
  );
}

// ── Baris semester ────────────────────────────────────────────────────────────
function SemesterRow({ semester, mks, totalSks, onClick, selectedMK }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      minHeight: 86,
      borderBottom: '1px solid #dde3ea',
    }}>
      {/* Label semester */}
      <div style={{
        width: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 12,
        flexShrink: 0,
        fontSize: 12,
        fontWeight: 700,
        color: '#4a6080',
        borderRight: '2px solid #c8d4e0',
        background: 'rgba(200,212,224,0.18)',
      }}>
        Sem. {semester}
      </div>

      {/* MK cards */}
      <div style={{
        display: 'flex',
        gap: 8,
        flex: 1,
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '8px 12px',
        background: 'white',
      }}>
        {mks.length === 0 ? (
          <div style={{
            height: 58, width: 120,
            border: '1.5px dashed #c8d4e0',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#aab8c8', fontSize: 11,
          }}>
            Belum ada MK
          </div>
        ) : (
          mks.map(mk => (
            <MKCard
              key={mk.id}
              mk={mk}
              onClick={onClick}
              selected={selectedMK?.id === mk.id}
            />
          ))
        )}
      </div>

      {/* Total SKS kolom kanan */}
      <div style={{
        width: 54,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        flexDirection: 'column',
        borderLeft: '1px solid #dde3ea',
        background: 'rgba(200,212,224,0.1)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1a4fa8', lineHeight: 1 }}>
          {totalSks}
        </div>
        <div style={{ fontSize: 9, color: '#7a90a8', letterSpacing: 0.3 }}>sks</div>
      </div>
    </div>
  );
}

// ── Detail panel floating ─────────────────────────────────────────────────────
function MKDetailPanel({ mk, onClose }) {
  if (!mk) return null;
  const col = getRmkColor(mk);

  return (
    <div style={{
      position: 'fixed',
      bottom: 24, left: '50%',
      transform: 'translateX(-50%)',
      background: 'white',
      border: '1px solid #dde3ea',
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      padding: '16px 20px',
      minWidth: 340, maxWidth: 500,
      zIndex: 300,
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 6, alignSelf: 'stretch',
        borderRadius: 3,
        background: col.bg,
        border: `1px solid ${col.border}`,
        flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: '#7a90a8', marginBottom: 3 }}>
          {mk.kode_mk} · {mk.sks} SKS · Sem. {mk.semester} · {mk.rmk || '—'} · {mk.tipe || '—'}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 }}>
          {mk.nama_mk}
        </div>
        {mk.nama_mk_en && (
          <div style={{ fontSize: 12, color: '#7a90a8', fontStyle: 'italic', marginBottom: 4 }}>
            {mk.nama_mk_en}
          </div>
        )}
        {mk.wajib_pilihan && (
          <div style={{ fontSize: 11, color: '#4a6080' }}>
            {mk.wajib_pilihan === 'W' ? '✓ Wajib' : '○ Pilihan'}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4, flexShrink: 0 }}
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

// ── Halaman utama ─────────────────────────────────────────────────────────────
export default function PohonKurikulum() {
  const navigate = useNavigate();
  const [selectedJenjang, setSelectedJenjang] = useState('S1');
  const [versiList, setVersiList] = useState([]);
  const [selectedVersi, setSelectedVersi] = useState(null);
  const [mkData, setMkData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMK, setSelectedMK] = useState(null);
  const [filterRmk, setFilterRmk] = useState(null);
  const [showPilihan, setShowPilihan] = useState(false);

  const jenjangInfo = JENJANG_OPTIONS.find(j => j.id === selectedJenjang);
  const semMax = jenjangInfo?.semesterMax || 8;
  const semesters = Array.from({ length: semMax }, (_, i) => semMax - i); // atas ke bawah

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

  // Load MK dari master_mata_kuliah filtered by jenjang
  useEffect(() => {
    setLoading(true);
    setMkData([]);
    supabase
      .from('master_mata_kuliah')
      .select('id, kode_mk, nama_mk, nama_mk_en, sks, semester, jenjang, rmk, tipe, status')
      .eq('jenjang', selectedJenjang)
      .order('semester', { ascending: true })
      .order('kode_mk', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          // Tandai wajib/pilihan dari kode: CA23 = departemen (W), lainnya = bisa pilihan
          // Untuk sekarang semua dianggap W kecuali dari sheet ada info berbeda
          setMkData(data);
        }
        setLoading(false);
      });
  }, [selectedJenjang]);

  // Filter per semester
  const mkBySemester = (sem) => {
    return mkData.filter(mk => {
      if (mk.semester !== sem) return false;
      if (filterRmk && mk.rmk !== filterRmk && mk.tipe !== filterRmk) return false;
      return true;
    });
  };

  // Statistik
  const mkWajib = mkData.filter(mk => mk.status !== 'Pilihan');
  const totalSKS = mkData.reduce((s, mk) => s + (mk.sks || 0), 0);
  const rmkList = [...new Set(mkData.map(mk => mk.rmk).filter(Boolean))];
  const studioList = mkData.filter(mk => mk.tipe === 'Studio');

  return (
    <div style={{ minHeight: '100vh', paddingRight: 'var(--rail-width)', display: 'flex', flexDirection: 'column' }}>

      {/* Header sticky */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #dde3ea',
        padding: '0 20px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a90a8', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
        >
          <Icon name="arrow_back" size={16} /> Kembali
        </button>
        <div style={{ width: 1, height: 20, background: '#dde3ea' }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Pohon Kurikulum</div>

        {/* Jenjang tabs */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {JENJANG_OPTIONS.map(j => (
            <button
              key={j.id}
              onClick={() => { setSelectedJenjang(j.id); setSelectedMK(null); setFilterRmk(null); }}
              style={{
                padding: '5px 14px', borderRadius: 6, border: '1px solid',
                borderColor: selectedJenjang === j.id ? '#1a4fa8' : '#dde3ea',
                background: selectedJenjang === j.id ? '#1a4fa8' : 'transparent',
                color: selectedJenjang === j.id ? 'white' : '#4a6080',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >{j.label}</button>
          ))}
        </div>

        {/* Periode selector */}
        {versiList.length > 0 && (
          <select
            value={selectedVersi?.id || ''}
            onChange={e => setSelectedVersi(versiList.find(v => v.id === e.target.value))}
            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #dde3ea', fontSize: 12, color: '#4a6080', background: 'white', cursor: 'pointer' }}
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
      <div style={{ display: 'flex', flex: 1, gap: 0, background: '#f4f7fa' }}>

        {/* Grid kurikulum */}
        <div style={{ flex: 1, overflowX: 'auto', padding: '20px 0 80px 0' }}>

          {/* Title row */}
          <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>
              Struktur Kurikulum {jenjangInfo?.label}
            </h1>
            {selectedVersi && (
              <span style={{ fontSize: 13, fontWeight: 400, color: '#7a90a8' }}>
                {selectedVersi.tahun_mulai}–{selectedVersi.tahun_selesai}
              </span>
            )}
          </div>

          {/* Header kolom */}
          <div style={{ display: 'flex', borderBottom: '2px solid #c8d4e0', background: '#e8eff6', marginBottom: 0 }}>
            <div style={{ width: 60, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: '5px 12px', fontSize: 10, fontWeight: 700, color: '#4a6080', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Mata Kuliah
            </div>
            <div style={{ width: 54, flexShrink: 0, textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#4a6080', letterSpacing: 0.5, padding: '5px 0', textTransform: 'uppercase' }}>
              SKS
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 48, color: '#7a90a8' }}>
              <div className="spinner spinner-primary" /> Memuat...
            </div>
          ) : (
            <div style={{ background: '#f4f7fa' }}>
              {semesters.map(sem => {
                const mks = mkBySemester(sem);
                const semSks = mks.reduce((s, mk) => s + (mk.sks || 0), 0);
                return (
                  <SemesterRow
                    key={sem}
                    semester={sem}
                    mks={mks}
                    totalSks={semSks}
                    onClick={setSelectedMK}
                    selectedMK={selectedMK}
                  />
                );
              })}

              {/* Row total */}
              <div style={{ display: 'flex', borderTop: '2px solid #1a4fa8', background: '#e8eff6' }}>
                <div style={{ width: 60, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#1a4fa8' }}>
                  Total — {mkData.length} Mata Kuliah
                </div>
                <div style={{ width: 54, flexShrink: 0, textAlign: 'center', padding: '8px 0', fontSize: 15, fontWeight: 800, color: '#1a4fa8' }}>
                  {totalSKS}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{
          width: 190,
          background: '#e8eff6',
          borderLeft: '1px solid #c8d4e0',
          padding: '16px 12px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
        }}>

          {/* Filter RMK */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4a6080', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7 }}>
              Rumpun Mata Kuliah
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                onClick={() => setFilterRmk(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '1px 0', textAlign: 'left' }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  border: filterRmk === null ? '2.5px solid #1a4fa8' : '2px solid #9ab0c8',
                  background: filterRmk === null ? '#1a4fa8' : 'transparent',
                }} />
                <span style={{ fontSize: 11, color: '#4a6080' }}>Semua</span>
              </button>

              {rmkList.map(r => {
                const col = RMK_COLOR[r] || { bg: '#eee', border: '#aaa', label: r };
                return (
                  <button
                    key={r}
                    onClick={() => setFilterRmk(filterRmk === r ? null : r)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '1px 0', textAlign: 'left' }}
                  >
                    <div style={{
                      width: 10, height: 10, borderRadius: 2, flexShrink: 0,
                      background: col.bg,
                      border: `1.5px solid ${filterRmk === r ? '#1a4fa8' : col.border}`,
                      outline: filterRmk === r ? '2px solid rgba(26,79,168,0.3)' : 'none',
                    }} />
                    <span style={{ fontSize: 10, color: '#4a6080', lineHeight: 1.3 }}>{r} · {col.label}</span>
                  </button>
                );
              })}

              {studioList.length > 0 && (
                <button
                  onClick={() => setFilterRmk(filterRmk === 'Studio' ? null : 'Studio')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '1px 0', textAlign: 'left' }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: 2, flexShrink: 0,
                    background: STUDIO_COLOR.bg,
                    border: `1.5px solid ${filterRmk === 'Studio' ? '#1a4fa8' : STUDIO_COLOR.border}`,
                    outline: filterRmk === 'Studio' ? '2px solid rgba(26,79,168,0.3)' : 'none',
                  }} />
                  <span style={{ fontSize: 10, color: '#4a6080' }}>Studio Perancangan</span>
                </button>
              )}
            </div>
          </div>

          {/* Statistik */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4a6080', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7 }}>
              Statistik
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { label: 'Total MK',  val: mkData.length },
                { label: 'Total SKS', val: totalSKS },
                { label: 'MK Wajib',  val: mkWajib.length },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #c8d4e0', fontSize: 11 }}>
                  <span style={{ color: '#4a6080' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: '#111' }}>{row.val}</span>
                </div>
              ))}
            </div>

            {/* Bar per semester */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: '#7a90a8', marginBottom: 5 }}>SKS per semester</div>
              {semesters.slice().reverse().map(sem => {
                const sks = mkData.filter(mk => mk.semester === sem).reduce((s, mk) => s + (mk.sks || 0), 0);
                const pct = totalSKS > 0 ? (sks / totalSKS) * 100 : 0;
                return (
                  <div key={sem} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <span style={{ width: 30, fontSize: 9, color: '#7a90a8', flexShrink: 0 }}>Sem {sem}</span>
                    <div style={{ flex: 1, height: 6, background: '#c8d4e0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#1a4fa8', borderRadius: 3, transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ width: 20, fontSize: 9, color: '#4a6080', textAlign: 'right', flexShrink: 0 }}>{sks}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legenda */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4a6080', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7 }}>
              Legenda Warna
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 10, borderRadius: 2, background: STUDIO_COLOR.bg, border: `1px solid ${STUDIO_COLOR.border}`, flexShrink: 0 }} />
                <span style={{ fontSize: 9.5, color: '#4a6080' }}>Studio Perancangan</span>
              </div>
              {Object.entries(RMK_COLOR).map(([k, col]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 16, height: 10, borderRadius: 2, background: col.bg, border: `1px solid ${col.border}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 9.5, color: '#4a6080', lineHeight: 1.3 }}>{k} · {col.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Toggle MK Pilihan */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 11, color: '#4a6080' }}>
              <input
                type="checkbox"
                checked={showPilihan}
                onChange={e => setShowPilihan(e.target.checked)}
                style={{ width: 13, height: 13 }}
              />
              Tampilkan MK Pilihan
            </label>
          </div>
        </div>
      </div>

      {/* Detail floating panel */}
      <MKDetailPanel mk={selectedMK} onClose={() => setSelectedMK(null)} />
    </div>
  );
}
