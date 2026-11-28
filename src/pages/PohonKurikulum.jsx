import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Icon from '../components/Icon';

// ── Warna RMK ─────────────────────────────────────────────────────────────────
const RMK_COLOR = {
  PA:   { bg: '#FFCBA4', border: '#D4622A', label: 'Perancangan Arsitektur' },
  TS:   { bg: '#FFF176', border: '#C8A000', label: 'Teori Sejarah Kritik' },
  ST:   { bg: '#B3D9FF', border: '#2A6CB5', label: 'Sains Teknologi' },
  PP:   { bg: '#FFD6C2', border: '#D4622A', label: 'Perumahan & Permukiman' },
  PK:   { bg: '#62C8F0', border: '#0A6A9A', label: 'Perancangan Kota' },
  DL:   { bg: '#D0D0D0', border: '#777777', label: 'Non Departemen/ITS' },
  PPAr: { bg: '#A8E6B8', border: '#2A7A4A', label: 'Praktik Profesi' },
  SKPB: { bg: '#FFE0B2', border: '#C47000', label: 'Kurikulum Bersama ITS' },
  Umum: { bg: '#E8D5F5', border: '#7B2FA2', label: 'Umum/Wajib' },
};
const STUDIO_COLOR = { bg: '#FF9F9F', border: '#C00000', label: 'Studio Perancangan' };
const PILIHAN_COLOR = { bg: '#E8EEF4', border: '#8FA8C0', label: 'MK Pilihan' };

function getRmkColor(mk) {
  if (mk.tipe === 'Studio') return STUDIO_COLOR;
  return RMK_COLOR[mk.rmk] || { bg: '#EEEEEE', border: '#AAAAAA', label: mk.rmk || '—' };
}

const JENJANG_OPTIONS = [
  { id: 'S1',   label: 'Sarjana',  semesterMax: 8,  sksMandatory: 144 },
  { id: 'PPAr', label: 'PPAr',     semesterMax: 2,  sksMandatory: 24  },
  { id: 'S2',   label: 'Magister', semesterMax: 4,  sksMandatory: 36  },
  { id: 'S3',   label: 'Doktor',   semesterMax: 6,  sksMandatory: 42  },
];

// ── Kartu MK — desain seperti referensi ──────────────────────────────────────
function MKCard({ mk, onClick, selected }) {
  const col = getRmkColor(mk);
  const [hov, setHov] = useState(false);
  const isStudio = mk.tipe === 'Studio';
  const w = isStudio ? 148 : 120;
  const h = isStudio ? 80 : 68;

  return (
    <div
      onClick={() => onClick(mk)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: col.bg,
        border: `2px solid ${selected ? '#1A4FA8' : col.border}`,
        borderRadius: 10,
        padding: '7px 10px 8px',
        cursor: 'pointer',
        width: w,
        minHeight: h,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        boxShadow: selected
          ? '0 0 0 3px rgba(26,79,168,0.25)'
          : hov ? '0 4px 12px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.10)',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'all 0.13s ease',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* baris atas: kode · SKS */}
      <div style={{
        fontSize: 9,
        fontWeight: 600,
        color: 'rgba(0,0,0,0.52)',
        fontFamily: 'monospace',
        letterSpacing: '0.2px',
        lineHeight: 1,
      }}>
        {mk.kode_mk} &bull; {mk.sks} SKS
      </div>

      {/* nama MK — bold besar, tengah blok */}
      <div style={{
        fontSize: isStudio ? 12 : 11,
        fontWeight: 800,
        color: '#111',
        lineHeight: 1.25,
        flex: 1,
        display: '-webkit-box',
        WebkitLineClamp: isStudio ? 3 : 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textTransform: 'uppercase',
        letterSpacing: '0.1px',
      }}>
        {mk.nama_mk}
      </div>
    </div>
  );
}

// ── Kartu placeholder MK Pilihan ──────────────────────────────────────────────
function PilihanCard({ slot, semester, mkPilihan, onOpen }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onOpen(semester, slot)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#DDE8F2' : PILIHAN_COLOR.bg,
        border: `2px dashed ${PILIHAN_COLOR.border}`,
        borderRadius: 10,
        padding: '7px 10px 8px',
        cursor: 'pointer',
        width: 120,
        minHeight: 68,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        flexShrink: 0,
        transition: 'all 0.13s ease',
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(0,0,0,0.4)', fontFamily: 'monospace' }}>
        PILIHAN &bull; 3 SKS
      </div>
      <div style={{
        fontSize: 11, fontWeight: 800, color: '#5A7898',
        textTransform: 'uppercase', lineHeight: 1.25, flex: 1,
      }}>
        MK Pilihan {slot}
      </div>
      <div style={{ fontSize: 9, color: '#8FA8C0', display: 'flex', alignItems: 'center', gap: 3 }}>
        <span>▼</span> {mkPilihan.length} opsi tersedia
      </div>
    </div>
  );
}

// ── Modal daftar MK Pilihan ───────────────────────────────────────────────────
function PilihanModal({ semester, slot, mkPilihan, onClose }) {
  if (!semester) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 400,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 14,
          boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
          width: 480, maxHeight: '70vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid #DDE3EA',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
              Daftar MK Pilihan {slot} — Semester {semester}
            </div>
            <div style={{ fontSize: 11, color: '#7A90A8', marginTop: 2 }}>
              {mkPilihan.length} mata kuliah tersedia
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAA', padding: 4 }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Daftar */}
        <div style={{ overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {mkPilihan.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#AAB8C8', fontSize: 13 }}>
              Belum ada MK Pilihan untuk semester ini
            </div>
          ) : (
            mkPilihan.map(mk => {
              const col = getRmkColor(mk);
              return (
                <div key={mk.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  border: '1px solid #DDE3EA', background: '#FAFBFC',
                }}>
                  <div style={{
                    width: 10, height: 36, borderRadius: 3,
                    background: col.bg, border: `1px solid ${col.border}`,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#8FA8C0', fontFamily: 'monospace' }}>
                      {mk.kode_mk} &bull; {mk.sks} SKS &bull; {mk.rmk}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#111', textTransform: 'uppercase' }}>
                      {mk.nama_mk}
                    </div>
                    {mk.nama_mk_en && (
                      <div style={{ fontSize: 10, color: '#8FA8C0', fontStyle: 'italic' }}>{mk.nama_mk_en}</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Detail panel floating (klik MK wajib) ────────────────────────────────────
function MKDetailPanel({ mk, onClose }) {
  if (!mk) return null;
  const col = getRmkColor(mk);
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%',
      transform: 'translateX(-50%)',
      background: 'white', border: '1px solid #DDE3EA',
      borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      padding: '14px 18px', minWidth: 320, maxWidth: 480,
      zIndex: 300, display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 5, alignSelf: 'stretch', borderRadius: 3,
        background: col.bg, border: `1px solid ${col.border}`, flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: '#7A90A8', marginBottom: 2 }}>
          {mk.kode_mk} · {mk.sks} SKS · Sem. {mk.semester} · {mk.rmk || '—'} · {mk.tipe || '—'}
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {mk.nama_mk}
        </div>
        {mk.nama_mk_en && (
          <div style={{ fontSize: 11, color: '#7A90A8', fontStyle: 'italic', marginTop: 2 }}>{mk.nama_mk_en}</div>
        )}
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAA', padding: 4, flexShrink: 0 }}>
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

// ── Baris semester ────────────────────────────────────────────────────────────
function SemesterRow({ semester, mkWajib, mkPilihan, totalSks, onClickMK, selectedMK, onOpenPilihan, jenjang }) {
  // Jumlah slot pilihan per semester: S1 biasanya ada 2 slot, selain itu 0
  const pilihanSlots = jenjang === 'S1' ? getPilihanSlots(semester) : 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      minHeight: 86, borderBottom: '1px solid #DDE3EA',
    }}>
      {/* Label semester */}
      <div style={{
        width: 60, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingRight: 12, flexShrink: 0,
        fontSize: 12, fontWeight: 700, color: '#4A6080',
        borderRight: '2px solid #C8D4E0',
        background: 'rgba(200,212,224,0.18)',
      }}>
        Sem. {semester}
      </div>

      {/* Kartu MK */}
      <div style={{
        display: 'flex', gap: 7, flex: 1,
        flexWrap: 'wrap', alignItems: 'center',
        padding: '8px 12px', background: 'white',
      }}>
        {mkWajib.length === 0 && pilihanSlots === 0 ? (
          <div style={{
            height: 68, width: 120,
            border: '1.5px dashed #C8D4E0', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#AAB8C8', fontSize: 11,
          }}>
            Belum ada MK
          </div>
        ) : (
          <>
            {mkWajib.map(mk => (
              <MKCard
                key={mk.id}
                mk={mk}
                onClick={onClickMK}
                selected={selectedMK?.id === mk.id}
              />
            ))}
            {/* Slot MK Pilihan */}
            {Array.from({ length: pilihanSlots }, (_, i) => (
              <PilihanCard
                key={`pilihan-${i + 1}`}
                slot={i + 1}
                semester={semester}
                mkPilihan={mkPilihan}
                onOpen={onOpenPilihan}
              />
            ))}
          </>
        )}
      </div>

      {/* Total SKS (hanya MK wajib) */}
      <div style={{
        width: 54, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, flexDirection: 'column',
        borderLeft: '1px solid #DDE3EA', background: 'rgba(200,212,224,0.1)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1A4FA8', lineHeight: 1 }}>
          {totalSks}
        </div>
        <div style={{ fontSize: 9, color: '#7A90A8', letterSpacing: 0.3 }}>sks</div>
      </div>
    </div>
  );
}

// Berapa slot pilihan per semester S1
function getPilihanSlots(sem) {
  // Semester 5, 6, 7 biasanya ada MK pilihan di S1
  if (sem >= 5 && sem <= 7) return 2;
  return 0;
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
  const [pilihanModal, setPilihanModal] = useState(null); // { semester, slot }

  const jenjangInfo = JENJANG_OPTIONS.find(j => j.id === selectedJenjang);
  const semMax = jenjangInfo?.semesterMax || 8;
  const semesters = Array.from({ length: semMax }, (_, i) => semMax - i);

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

  // Load MK — pisah wajib dan pilihan
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
        if (!error && data) setMkData(data);
        setLoading(false);
      });
  }, [selectedJenjang]);

  // MK wajib per semester (tidak dihitung pilihan)
  const mkWajibBySem = (sem) => mkData.filter(mk => {
    if (mk.semester !== sem) return false;
    if (mk.status === 'Pilihan') return false;
    if (filterRmk && mk.rmk !== filterRmk && mk.tipe !== filterRmk) return false;
    return true;
  });

  // MK pilihan per semester (untuk modal)
  const mkPilihanBySem = (sem) => mkData.filter(mk =>
    mk.semester === sem && mk.status === 'Pilihan'
  );

  // Total SKS wajib saja
  const mkWajib = mkData.filter(mk => mk.status !== 'Pilihan');
  const totalSKS = mkWajib.reduce((s, mk) => s + (mk.sks || 0), 0);
  const rmkList = [...new Set(mkWajib.map(mk => mk.rmk).filter(Boolean))];
  const studioList = mkWajib.filter(mk => mk.tipe === 'Studio');

  return (
    <div style={{ minHeight: '100vh', paddingRight: 'var(--rail-width)', display: 'flex', flexDirection: 'column' }}>

      {/* Header sticky */}
      <div style={{
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #DDE3EA', padding: '0 20px', height: 52,
        display: 'flex', alignItems: 'center', gap: 14,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A90A8', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
        >
          <Icon name="arrow_back" size={16} /> Kembali
        </button>
        <div style={{ width: 1, height: 20, background: '#DDE3EA' }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Pohon Kurikulum</div>

        {/* Jenjang tabs */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {JENJANG_OPTIONS.map(j => (
            <button
              key={j.id}
              onClick={() => { setSelectedJenjang(j.id); setSelectedMK(null); setFilterRmk(null); }}
              style={{
                padding: '5px 14px', borderRadius: 6, border: '1px solid',
                borderColor: selectedJenjang === j.id ? '#1A4FA8' : '#DDE3EA',
                background: selectedJenjang === j.id ? '#1A4FA8' : 'transparent',
                color: selectedJenjang === j.id ? 'white' : '#4A6080',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >{j.label}</button>
          ))}
        </div>

        {versiList.length > 0 && (
          <select
            value={selectedVersi?.id || ''}
            onChange={e => setSelectedVersi(versiList.find(v => v.id === e.target.value))}
            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #DDE3EA', fontSize: 12, color: '#4A6080', background: 'white', cursor: 'pointer' }}
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
      <div style={{ display: 'flex', flex: 1, background: '#F4F7FA' }}>

        {/* Grid */}
        <div style={{ flex: 1, overflowX: 'auto', padding: '20px 0 100px 0' }}>

          {/* Title */}
          <div style={{ padding: '0 20px 14px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              Struktur Kurikulum {jenjangInfo?.label}
            </h1>
            {selectedVersi && (
              <span style={{ fontSize: 13, color: '#7A90A8' }}>
                {selectedVersi.tahun_mulai}–{selectedVersi.tahun_selesai}
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#7A90A8', background: '#E8EEF4', padding: '3px 10px', borderRadius: 20 }}>
              Wajib: {totalSKS} SKS · Target: {jenjangInfo?.sksMandatory} SKS
            </span>
          </div>

          {/* Header kolom */}
          <div style={{ display: 'flex', borderBottom: '2px solid #C8D4E0', background: '#E8EFF6' }}>
            <div style={{ width: 60, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: '5px 12px', fontSize: 10, fontWeight: 700, color: '#4A6080', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Mata Kuliah
            </div>
            <div style={{ width: 54, flexShrink: 0, textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#4A6080', padding: '5px 0', textTransform: 'uppercase' }}>
              SKS
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 48, color: '#7A90A8' }}>
              <div className="spinner spinner-primary" /> Memuat data kurikulum…
            </div>
          ) : (
            <>
              {semesters.map(sem => {
                const wajib = mkWajibBySem(sem);
                const pilihan = mkPilihanBySem(sem);
                const semSks = wajib.reduce((s, mk) => s + (mk.sks || 0), 0);
                return (
                  <SemesterRow
                    key={sem}
                    semester={sem}
                    mkWajib={wajib}
                    mkPilihan={pilihan}
                    totalSks={semSks}
                    onClickMK={setSelectedMK}
                    selectedMK={selectedMK}
                    onOpenPilihan={(semester, slot) => setPilihanModal({ semester, slot })}
                    jenjang={selectedJenjang}
                  />
                );
              })}

              {/* Row total */}
              <div style={{ display: 'flex', borderTop: '2px solid #1A4FA8', background: '#E8EFF6' }}>
                <div style={{ width: 60, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#1A4FA8' }}>
                  Total — {mkWajib.length} MK Wajib
                  {mkData.filter(mk => mk.status === 'Pilihan').length > 0 &&
                    ` + ${mkData.filter(mk => mk.status === 'Pilihan').length} MK Pilihan`
                  }
                </div>
                <div style={{ width: 54, flexShrink: 0, textAlign: 'center', padding: '8px 0', fontSize: 15, fontWeight: 800, color: '#1A4FA8' }}>
                  {totalSKS}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{
          width: 190, background: '#E8EFF6',
          borderLeft: '1px solid #C8D4E0',
          padding: '16px 12px', flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 16,
          overflowY: 'auto',
        }}>

          {/* Filter RMK */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7 }}>
              Filter Rumpun
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                onClick={() => setFilterRmk(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '1px 0', textAlign: 'left' }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  border: filterRmk === null ? '2.5px solid #1A4FA8' : '2px solid #9AB0C8',
                  background: filterRmk === null ? '#1A4FA8' : 'transparent',
                }} />
                <span style={{ fontSize: 11, color: '#4A6080' }}>Semua</span>
              </button>

              {rmkList.map(r => {
                const col = RMK_COLOR[r] || { bg: '#EEE', border: '#AAA', label: r };
                return (
                  <button
                    key={r}
                    onClick={() => setFilterRmk(filterRmk === r ? null : r)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '1px 0', textAlign: 'left' }}
                  >
                    <div style={{
                      width: 10, height: 10, borderRadius: 2, flexShrink: 0,
                      background: col.bg,
                      border: `1.5px solid ${filterRmk === r ? '#1A4FA8' : col.border}`,
                      outline: filterRmk === r ? '2px solid rgba(26,79,168,0.3)' : 'none',
                    }} />
                    <span style={{ fontSize: 10, color: '#4A6080', lineHeight: 1.3 }}>{r} · {col.label}</span>
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
                    border: `1.5px solid ${filterRmk === 'Studio' ? '#1A4FA8' : STUDIO_COLOR.border}`,
                    outline: filterRmk === 'Studio' ? '2px solid rgba(26,79,168,0.3)' : 'none',
                  }} />
                  <span style={{ fontSize: 10, color: '#4A6080' }}>Studio Perancangan</span>
                </button>
              )}
            </div>
          </div>

          {/* Statistik */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7 }}>
              Statistik
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { label: 'MK Wajib',  val: mkWajib.length },
                { label: 'SKS Wajib', val: totalSKS },
                { label: 'Target SKS', val: jenjangInfo?.sksMandatory },
                { label: 'MK Pilihan', val: mkData.filter(mk => mk.status === 'Pilihan').length },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #C8D4E0', fontSize: 11 }}>
                  <span style={{ color: '#4A6080' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: '#111' }}>{row.val}</span>
                </div>
              ))}
            </div>

            {/* Bar per semester — hanya wajib */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: '#7A90A8', marginBottom: 5 }}>SKS wajib per semester</div>
              {semesters.slice().reverse().map(sem => {
                const sks = mkData.filter(mk => mk.semester === sem && mk.status !== 'Pilihan').reduce((s, mk) => s + (mk.sks || 0), 0);
                const pct = totalSKS > 0 ? (sks / totalSKS) * 100 : 0;
                return (
                  <div key={sem} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <span style={{ width: 30, fontSize: 9, color: '#7A90A8', flexShrink: 0 }}>Sem {sem}</span>
                    <div style={{ flex: 1, height: 6, background: '#C8D4E0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#1A4FA8', borderRadius: 3, transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ width: 20, fontSize: 9, color: '#4A6080', textAlign: 'right', flexShrink: 0 }}>{sks}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legenda */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7 }}>
              Legenda Warna
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 10, borderRadius: 2, background: STUDIO_COLOR.bg, border: `1px solid ${STUDIO_COLOR.border}`, flexShrink: 0 }} />
                <span style={{ fontSize: 9.5, color: '#4A6080' }}>Studio Perancangan</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 10, borderRadius: 2, background: PILIHAN_COLOR.bg, border: `2px dashed ${PILIHAN_COLOR.border}`, flexShrink: 0 }} />
                <span style={{ fontSize: 9.5, color: '#4A6080' }}>MK Pilihan</span>
              </div>
              {Object.entries(RMK_COLOR).map(([k, col]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 16, height: 10, borderRadius: 2, background: col.bg, border: `1px solid ${col.border}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 9.5, color: '#4A6080', lineHeight: 1.3 }}>{k} · {col.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail floating panel (klik MK wajib) */}
      <MKDetailPanel mk={selectedMK} onClose={() => setSelectedMK(null)} />

      {/* Modal daftar MK Pilihan */}
      {pilihanModal && (
        <PilihanModal
          semester={pilihanModal.semester}
          slot={pilihanModal.slot}
          mkPilihan={mkPilihanBySem(pilihanModal.semester)}
          onClose={() => setPilihanModal(null)}
        />
      )}
    </div>
  );
}
