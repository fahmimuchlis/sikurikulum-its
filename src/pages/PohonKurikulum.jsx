import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Icon from '../components/Icon';

// ── Palet warna resmi kurikulum (sesuai legenda bagan ITS) ───────────────────
// PA  = Perancangan Arsitektur  → oranye muda
// TS  = Teori Sejarah Kritik    → krem/kuning gading
// PP  = Perumahan & Permukiman  → hijau muda
// ST  = Sains Teknologi         → biru lavender
// PK  = Perancangan Kota        → kuning muda
// DL  = Non Departemen/ITS      → biru cerah (cyan)
// SKPB/Umum/Nasional            → merah-oranye (Pancasila, Agama, dsb)
// MK Pilihan                    → abu-abu
// Belum dikategorikan           → putih
const RMK_COLOR = {
  PA:   { bg: '#F4A460', border: '#C06020', label: 'Perancangan Arsitektur' },
  TS:   { bg: '#F5F0DC', border: '#C8B870', label: 'Teori Sejarah Kritik Arsitektur' },
  PP:   { bg: '#C8DDB8', border: '#7AAA5A', label: 'Perumahan & Pemukiman' },
  ST:   { bg: '#B8C0D8', border: '#6878A8', label: 'Sains Teknologi Arsitektur' },
  PK:   { bg: '#F0F0A0', border: '#A8A830', label: 'Perancangan Kota' },
  DL:   { bg: '#00BFFF', border: '#007AAA', label: 'Non Departemen/ITS' },
  SKPB: { bg: '#FF6040', border: '#CC2000', label: 'Nasional (b. indo, kewarganegaraan, Pancasila, agama)' },
  Umum: { bg: '#FF6040', border: '#CC2000', label: 'Nasional/Umum' },
  PPAr: { bg: '#F4A460', border: '#C06020', label: 'Praktik Profesi Arsitektur' },
};
const STUDIO_COLOR    = { bg: '#F4A460', border: '#C06020', label: 'Studio Perancangan' };
const PILIHAN_COLOR   = { bg: '#B0B0B0', border: '#787878', label: 'MK Pilihan' };
const DISERTASI_COLOR = { bg: '#B8C0D8', border: '#6878A8', label: 'Disertasi' };
const DEFAULT_COLOR   = { bg: '#FFFFFF', border: '#C0C8D0', label: 'Lainnya' };

function getRmkColor(mk) {
  if (mk.tipe === 'Studio') return STUDIO_COLOR;
  return RMK_COLOR[mk.rmk] || DEFAULT_COLOR;
}

const JENJANG_OPTIONS = [
  { id: 'S1',   label: 'Sarjana (S1)',   semesterMax: 8, sksMandatory: 144 },
  { id: 'PPAr', label: 'PPAr',           semesterMax: 2, sksMandatory: 24  },
  { id: 'S2',   label: 'Magister (S2)',  semesterMax: 4, sksMandatory: 36  },
  { id: 'S3',   label: 'Doktor (S3)',    semesterMax: 6, sksMandatory: 42  },
];

// ── Konfigurasi layout kolom per jenjang ──────────────────────────────────────
// Kolom: left[] … [studio] … right[]
// Studio selalu di tengah. Urutan kolom kiri = kanan dari studio ke luar.
const LAYOUT_COLS = 7; // total kolom: 3 kiri + 1 studio + 3 kanan

// Fungsi sortir MK per semester ke slot kolom
// Mengembalikan array panjang LAYOUT_COLS (index 0..6), tiap slot = mk|null|'pilihan'
function assignCols(mkWajib, mkPilihan, sem, jenjang) {
  const cols = Array(LAYOUT_COLS).fill(null);
  const studioIdx = 3; // kolom tengah (0-based)

  // Cari studio
  const studio = mkWajib.find(mk => mk.tipe === 'Studio');

  if (jenjang === 'S3') {
    // S3: Disertasi mengisi kolom tengah penuh
    const disertasi = mkWajib.find(mk =>
      mk.nama_mk?.toLowerCase().includes('disertasi') || mk.tipe === 'Disertasi'
    );
    if (disertasi) cols[studioIdx] = disertasi;
    // MK lain di kiri
    const others = mkWajib.filter(mk => mk !== disertasi);
    others.forEach((mk, i) => { if (i < 3) cols[2 - i] = mk; });
    return cols;
  }

  if (studio) cols[studioIdx] = studio;

  // MK non-studio wajib
  const nonStudio = mkWajib.filter(mk => mk.tipe !== 'Studio');

  // Heuristik urutan: letakkan ke kiri-kanan bergantian
  // Prioritas kiri: TS, ST, PP (pendukung teknis/teori)
  // Prioritas kanan: DL, SKPB, Umum, PK (pendukung non-inti)
  const left  = nonStudio.filter(mk => ['TS','ST','PP','PA'].includes(mk.rmk));
  const right = nonStudio.filter(mk => !['TS','ST','PP','PA'].includes(mk.rmk));

  // isi kiri (cols 2,1,0 dari studio ke luar)
  left.forEach((mk, i) => { if (studioIdx - 1 - i >= 0) cols[studioIdx - 1 - i] = mk; });
  // isi kanan (cols 4,5,6)
  right.forEach((mk, i) => { if (studioIdx + 1 + i < LAYOUT_COLS) cols[studioIdx + 1 + i] = mk; });

  // Jika ada sisa (kiri penuh), masukkan ke kanan yang masih kosong
  const overflow = left.slice(3);
  overflow.forEach(mk => {
    for (let c = studioIdx + 1; c < LAYOUT_COLS; c++) {
      if (!cols[c]) { cols[c] = mk; break; }
    }
  });

  // Slot pilihan: selalu di ujung kanan (cols 5 & 6) untuk S1 sem 6-7
  if (jenjang === 'S1' && getPilihanSlots(sem) > 0) {
    const slots = getPilihanSlots(sem);
    for (let s = 0; s < slots; s++) {
      const c = LAYOUT_COLS - 1 - s;
      if (!cols[c]) cols[c] = { _pilihan: true, slot: s + 1, mkPilihan };
    }
  }

  return cols;
}

function getPilihanSlots(sem) {
  if (sem === 6 || sem === 7) return 2;
  if (sem === 8) return 1;
  return 0;
}

// ── Kartu MK ─────────────────────────────────────────────────────────────────
function MKCard({ mk, onClick, selected, isStudio, isDisertasi }) {
  const col = isDisertasi ? DISERTASI_COLOR : getRmkColor(mk);
  const [hov, setHov] = useState(false);

  return (
    <div
      onClick={() => onClick(mk)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: col.bg,
        border: `2px solid ${selected ? '#1A4FA8' : col.border}`,
        borderRadius: 6,
        padding: '6px 8px 8px',
        cursor: 'pointer',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        boxShadow: selected
          ? '0 0 0 3px rgba(26,79,168,0.25)'
          : hov ? '0 4px 12px rgba(0,0,0,0.20)' : '0 1px 4px rgba(0,0,0,0.12)',
        transform: hov ? 'translateY(-1px)' : 'none',
        transition: 'all 0.12s ease',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* Kode & SKS */}
      <div style={{
        fontSize: 8.5, fontWeight: 600, color: 'rgba(0,0,0,0.5)',
        fontFamily: 'monospace', letterSpacing: '0.1px', lineHeight: 1,
      }}>
        ({mk.kode_mk}) &bull; {mk.sks} sks
      </div>
      {/* Nama MK */}
      <div style={{
        fontSize: isStudio || isDisertasi ? 12 : 10.5,
        fontWeight: 800,
        color: '#111',
        lineHeight: 1.3,
        textAlign: 'center',
        textTransform: 'uppercase',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: '0.1px',
      }}>
        {mk.nama_mk}
      </div>
    </div>
  );
}

// ── Kartu placeholder MK Pilihan ─────────────────────────────────────────────
function PilihanCard({ slot, mkPilihan, onOpen, semester }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onOpen(semester, slot)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#B8C4D0' : PILIHAN_COLOR.bg,
        border: `2px dashed ${PILIHAN_COLOR.border}`,
        borderRadius: 6,
        padding: '6px 8px 8px',
        cursor: 'pointer',
        width: '100%', height: '100%',
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 4,
        transition: 'all 0.12s ease',
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: 8.5, fontWeight: 600, color: 'rgba(0,0,0,0.4)', fontFamily: 'monospace' }}>
        PILIHAN &bull; 3 sks
      </div>
      <div style={{
        fontSize: 10.5, fontWeight: 800, color: '#5A6878',
        textTransform: 'uppercase', textAlign: 'center',
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        lineHeight: 1.3,
      }}>
        MK. PILIHAN {slot}
      </div>
      <div style={{ fontSize: 8, color: '#8090A0', textAlign: 'center' }}>
        ▼ {mkPilihan.length} opsi · klik untuk lihat
      </div>
    </div>
  );
}

// ── Baris semester ────────────────────────────────────────────────────────────
const ROW_HEIGHT = 96;    // tinggi area kartu
const COL_WIDTH  = 130;   // lebar tiap kolom MK
const STUDIO_W   = 160;   // lebar kolom studio
const COL_GAP    = 6;

function SemesterRow({ semester, mkWajib, mkPilihan, totalSks, semKumulatif, onClickMK, selectedMK, onOpenPilihan, jenjang }) {
  const cols = assignCols(mkWajib, mkPilihan, semester, jenjang);
  const isStudio = (mk) => mk && mk.tipe === 'Studio';
  const isDisertasi = (mk) => mk && (mk.nama_mk?.toLowerCase().includes('disertasi') || mk.tipe === 'Disertasi');

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      borderBottom: '1px solid #DDE3EA', background: 'white',
    }}>
      {/* Label semester */}
      <div style={{
        width: 56, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingRight: 10,
        fontSize: 11, fontWeight: 700, color: '#4A6080',
        borderRight: '2px solid #C8D4E0',
        background: 'rgba(200,212,224,0.18)',
      }}>
        Sem {semester}
      </div>

      {/* Grid kolom MK */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: COL_GAP,
        padding: `8px 12px`,
        overflowX: 'auto',
      }}>
        {cols.map((cell, ci) => {
          const colIsStudio = ci === 3;
          const w = colIsStudio ? STUDIO_W : COL_WIDTH;
          const h = ROW_HEIGHT;

          if (!cell) {
            // slot kosong
            return (
              <div key={ci} style={{ width: w, height: h, flexShrink: 0 }} />
            );
          }

          if (cell._pilihan) {
            return (
              <div key={ci} style={{ width: w, height: h, flexShrink: 0 }}>
                <PilihanCard
                  slot={cell.slot}
                  mkPilihan={cell.mkPilihan}
                  onOpen={onOpenPilihan}
                  semester={semester}
                />
              </div>
            );
          }

          return (
            <div key={ci} style={{ width: w, height: h, flexShrink: 0 }}>
              <MKCard
                mk={cell}
                onClick={onClickMK}
                selected={selectedMK?.id === cell.id}
                isStudio={isStudio(cell)}
                isDisertasi={isDisertasi(cell)}
              />
            </div>
          );
        })}
      </div>

      {/* SKS kolom kanan */}
      <div style={{
        width: 80, flexShrink: 0, borderLeft: '1px solid #DDE3EA',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 12, background: 'rgba(200,212,224,0.08)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1A4FA8', lineHeight: 1 }}>{totalSks}</div>
          <div style={{ fontSize: 8, color: '#7A90A8', letterSpacing: 0.5 }}>SKS</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#AAB8C8', lineHeight: 1 }}>{semKumulatif}</div>
          <div style={{ fontSize: 8, color: '#AAB8C8', letterSpacing: 0.3 }}>kum.</div>
        </div>
      </div>
    </div>
  );
}

// ── Modal daftar MK Pilihan ───────────────────────────────────────────────────
function PilihanModal({ semester, slot, mkPilihan, onClose }) {
  if (!semester) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.38)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 14,
        boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
        width: 480, maxHeight: '70vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid #DDE3EA',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
              MK Pilihan {slot} — Semester {semester}
            </div>
            <div style={{ fontSize: 11, color: '#7A90A8', marginTop: 2 }}>
              {mkPilihan.length} mata kuliah tersedia · pilih 1 (3 SKS)
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAA', padding: 4 }}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {mkPilihan.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#AAB8C8', fontSize: 13 }}>
              Belum ada MK Pilihan terdaftar untuk semester ini
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
                  <div style={{ width: 10, height: 36, borderRadius: 3, background: col.bg, border: `1px solid ${col.border}`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9.5, color: '#8FA8C0', fontFamily: 'monospace' }}>
                      {mk.kode_mk} &bull; {mk.sks} SKS &bull; {mk.rmk}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#111', textTransform: 'uppercase' }}>
                      {mk.nama_mk}
                    </div>
                    {mk.nama_mk_en && (
                      <div style={{ fontSize: 10, color: '#8FA8C0', fontStyle: 'italic' }}>{mk.nama_mk_en}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#4A6080' }}>{mk.sks} sks</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Detail floating panel ─────────────────────────────────────────────────────
function MKDetailPanel({ mk, onClose }) {
  if (!mk) return null;
  const col = getRmkColor(mk);
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'white', border: '1px solid #DDE3EA',
      borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      padding: '14px 18px', minWidth: 320, maxWidth: 480,
      zIndex: 300, display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{ width: 5, alignSelf: 'stretch', borderRadius: 3, background: col.bg, border: `1px solid ${col.border}`, flexShrink: 0 }} />
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
  const [pilihanModal, setPilihanModal] = useState(null);

  const jenjangInfo = JENJANG_OPTIONS.find(j => j.id === selectedJenjang);
  const semMax = jenjangInfo?.semesterMax || 8;
  // Urutan tampil: semester terbesar di atas (Sem 8 → Sem 1)
  const semesters = Array.from({ length: semMax }, (_, i) => semMax - i);

  useEffect(() => {
    supabase
      .from('versi_kurikulum').select('*').eq('jenjang', selectedJenjang)
      .order('tahun_mulai', { ascending: false })
      .then(({ data }) => {
        setVersiList(data || []);
        const aktif = data?.find(v => v.status === 'aktif');
        setSelectedVersi(aktif || data?.[0] || null);
      });
  }, [selectedJenjang]);

  useEffect(() => {
    setLoading(true); setMkData([]);
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

  const mkWajibBySem  = (sem) => mkData.filter(mk => mk.semester === sem && mk.status !== 'Pilihan'
    && (!filterRmk || mk.rmk === filterRmk || mk.tipe === filterRmk));
  const mkPilihanBySem = (sem) => mkData.filter(mk => mk.semester === sem && mk.status === 'Pilihan');

  const mkWajib  = mkData.filter(mk => mk.status !== 'Pilihan');
  const totalSKS = mkWajib.reduce((s, mk) => s + (mk.sks || 0), 0);
  const rmkList  = [...new Set(mkWajib.map(mk => mk.rmk).filter(Boolean))];

  // Kumulatif SKS per semester (dari sem 1 ke atas)
  const kumulatif = {};
  let acc = 0;
  for (let s = 1; s <= semMax; s++) {
    acc += mkData.filter(mk => mk.semester === s && mk.status !== 'Pilihan').reduce((x, mk) => x + (mk.sks || 0), 0);
    kumulatif[s] = acc;
  }

  return (
    <div style={{ minHeight: '100vh', paddingRight: 'var(--rail-width)', display: 'flex', flexDirection: 'column', background: '#F4F7FA' }}>

      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #DDE3EA', padding: '0 20px', height: 52,
        display: 'flex', alignItems: 'center', gap: 14,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A90A8', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <Icon name="arrow_back" size={16} /> Kembali
        </button>
        <div style={{ width: 1, height: 20, background: '#DDE3EA' }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Pohon Kurikulum</div>

        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {JENJANG_OPTIONS.map(j => (
            <button key={j.id}
              onClick={() => { setSelectedJenjang(j.id); setSelectedMK(null); setFilterRmk(null); }}
              style={{
                padding: '5px 14px', borderRadius: 6, border: '1px solid',
                borderColor: selectedJenjang === j.id ? '#1A4FA8' : '#DDE3EA',
                background: selectedJenjang === j.id ? '#1A4FA8' : 'transparent',
                color: selectedJenjang === j.id ? 'white' : '#4A6080',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}>{j.label}</button>
          ))}
        </div>

        {versiList.length > 0 && (
          <select value={selectedVersi?.id || ''} onChange={e => setSelectedVersi(versiList.find(v => v.id === e.target.value))}
            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #DDE3EA', fontSize: 12, color: '#4A6080', background: 'white', cursor: 'pointer' }}>
            {versiList.map(v => (
              <option key={v.id} value={v.id}>{v.nama} {v.status === 'aktif' ? '(Aktif)' : v.status === 'draft' ? '(Draft)' : ''}</option>
            ))}
          </select>
        )}
      </div>

      {/* Main */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* Bagan */}
        <div style={{ flex: 1, overflowX: 'auto', padding: '16px 0 100px' }}>

          {/* Judul */}
          <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 15, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              Struktur Kurikulum {jenjangInfo?.label}
            </h1>
            {selectedVersi && <span style={{ fontSize: 13, color: '#7A90A8' }}>{selectedVersi.tahun_mulai}–{selectedVersi.tahun_selesai}</span>}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#7A90A8', background: '#E8EEF4', padding: '3px 10px', borderRadius: 20 }}>
              {totalSKS} SKS wajib · target {jenjangInfo?.sksMandatory} SKS
            </span>
          </div>

          {/* Header kolom dengan label kolom */}
          <div style={{
            display: 'flex', borderBottom: '2px solid #C8D4E0', borderTop: '1px solid #C8D4E0',
            background: '#E4EBF3', marginBottom: 0,
          }}>
            <div style={{ width: 56, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', gap: COL_GAP, padding: '4px 12px', alignItems: 'center' }}>
              {Array.from({ length: LAYOUT_COLS }, (_, ci) => {
                const isStudioCol = ci === 3;
                return (
                  <div key={ci} style={{
                    width: isStudioCol ? STUDIO_W : COL_WIDTH,
                    flexShrink: 0,
                    textAlign: 'center',
                    fontSize: 9,
                    fontWeight: 700,
                    color: isStudioCol ? '#C00000' : '#7A90A8',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    {isStudioCol ? '— Studio —' : ''}
                  </div>
                );
              })}
            </div>
            <div style={{ width: 80, flexShrink: 0, textAlign: 'right', paddingRight: 12, fontSize: 9, fontWeight: 700, color: '#7A90A8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 20 }}>
              <span>SKS</span>
              <span style={{ color: '#AAB8C8' }}>Kum.</span>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 48, color: '#7A90A8' }}>
              <div className="spinner spinner-primary" /> Memuat…
            </div>
          ) : (
            <div>
              {semesters.map(sem => {
                const wajib  = mkWajibBySem(sem);
                const pilihan = mkPilihanBySem(sem);
                const semSks = wajib.reduce((s, mk) => s + (mk.sks || 0), 0);
                return (
                  <SemesterRow
                    key={sem}
                    semester={sem}
                    mkWajib={wajib}
                    mkPilihan={pilihan}
                    totalSks={semSks}
                    semKumulatif={kumulatif[sem]}
                    onClickMK={setSelectedMK}
                    selectedMK={selectedMK}
                    onOpenPilihan={(s, slot) => setPilihanModal({ semester: s, slot })}
                    jenjang={selectedJenjang}
                  />
                );
              })}

              {/* Row total */}
              <div style={{ display: 'flex', borderTop: '2px solid #1A4FA8', background: '#111' }}>
                <div style={{ width: 56, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 700, color: 'white' }}>
                  Total — {mkWajib.length} MK Wajib
                  {mkData.filter(mk => mk.status === 'Pilihan').length > 0 &&
                    ` + ${mkData.filter(mk => mk.status === 'Pilihan').length} MK Pilihan`}
                </div>
                <div style={{ width: 80, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'white', lineHeight: 1 }}>{totalSKS}</div>
                    <div style={{ fontSize: 8, color: '#7A90A8' }}>SKS</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#AAB8C8', lineHeight: 1 }}>{jenjangInfo?.sksMandatory}</div>
                    <div style={{ fontSize: 8, color: '#7A90A8' }}>target</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar kanan */}
        <div style={{
          width: 180, background: '#E8EFF6',
          borderLeft: '1px solid #C8D4E0',
          padding: '14px 10px', flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 14,
          overflowY: 'auto',
        }}>
          {/* Filter RMK */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Filter Rumpun</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button onClick={() => setFilterRmk(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '1px 0', textAlign: 'left' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, border: filterRmk === null ? '2.5px solid #1A4FA8' : '2px solid #9AB0C8', background: filterRmk === null ? '#1A4FA8' : 'transparent' }} />
                <span style={{ fontSize: 11, color: '#4A6080' }}>Semua</span>
              </button>
              {rmkList.map(r => {
                const col = RMK_COLOR[r] || { bg: '#EEE', border: '#AAA', label: r };
                return (
                  <button key={r} onClick={() => setFilterRmk(filterRmk === r ? null : r)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '1px 0', textAlign: 'left' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: col.bg, border: `1.5px solid ${filterRmk === r ? '#1A4FA8' : col.border}`, outline: filterRmk === r ? '2px solid rgba(26,79,168,0.3)' : 'none' }} />
                    <span style={{ fontSize: 9.5, color: '#4A6080', lineHeight: 1.3 }}>{r} · {col.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Statistik */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Statistik</div>
            {[
              { label: 'MK Wajib',    val: mkWajib.length },
              { label: 'SKS Wajib',   val: totalSKS },
              { label: 'Target SKS',  val: jenjangInfo?.sksMandatory },
              { label: 'MK Pilihan',  val: mkData.filter(mk => mk.status === 'Pilihan').length },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #C8D4E0', fontSize: 11 }}>
                <span style={{ color: '#4A6080' }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: '#111' }}>{r.val}</span>
              </div>
            ))}
            {/* Bar SKS per semester */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 9, color: '#7A90A8', marginBottom: 5 }}>SKS wajib per semester</div>
              {semesters.slice().reverse().map(sem => {
                const sks = mkData.filter(mk => mk.semester === sem && mk.status !== 'Pilihan').reduce((s, mk) => s + (mk.sks || 0), 0);
                const pct = totalSKS > 0 ? (sks / totalSKS) * 100 : 0;
                return (
                  <div key={sem} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <span style={{ width: 28, fontSize: 8.5, color: '#7A90A8', flexShrink: 0 }}>Sem {sem}</span>
                    <div style={{ flex: 1, height: 6, background: '#C8D4E0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#1A4FA8', borderRadius: 3, transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ width: 18, fontSize: 8.5, color: '#4A6080', textAlign: 'right', flexShrink: 0 }}>{sks}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legenda — sesuai palet resmi */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#4A6080', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Legenda Warna</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                { col: STUDIO_COLOR,  label: 'Perancangan Arsitektur', note: '(termasuk Studio)' },
                { col: RMK_COLOR.TS,  label: 'Teori Sejarah Kritik Arsitektur' },
                { col: RMK_COLOR.PP,  label: 'Perumahan & Pemukiman' },
                { col: RMK_COLOR.ST,  label: 'Sains Teknologi Arsitektur' },
                { col: RMK_COLOR.PK,  label: 'Perancangan Kota' },
                { col: RMK_COLOR.DL,  label: 'Non Departemen/ITS' },
                { col: RMK_COLOR.SKPB,label: 'Nasional (b. indo, kewarganegaraan, Pancasila, agama)' },
                { col: PILIHAN_COLOR, label: 'MK Pilihan', dashed: true },
                { col: DEFAULT_COLOR, label: 'Belum dikategorikan' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{
                    width: 13, height: 13, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: item.col.bg,
                    border: `1.5px ${item.dashed ? 'dashed' : 'solid'} ${item.col.border}`,
                  }} />
                  <span style={{ fontSize: 9, color: '#4A6080', lineHeight: 1.35 }}>
                    {item.label}
                    {item.note && <span style={{ color: '#9AB0C8' }}> {item.note}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <MKDetailPanel mk={selectedMK} onClose={() => setSelectedMK(null)} />
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
