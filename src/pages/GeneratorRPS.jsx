import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Icon from '../components/Icon';

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'deskripsi', label: 'Deskripsi', accent: '#e09bdb' },
  { id: 'bk',        label: 'BK',        accent: '#f59e0b' },
  { id: 'cpmk',      label: 'CPMK',      accent: '#10b981' },
  { id: 'sub',       label: 'Sub',        accent: '#3b82f6' },
  { id: 'eval',      label: 'Eval',       accent: '#8b5cf6' },
  { id: 'tugas',     label: 'Tugas',      accent: '#f97316' },
  { id: 'sap',       label: 'SAP',        accent: '#6366f1' },
];

// Figma-exact Rantai Generator steps
const RANTAI = [
  { step: 1, label: 'Diskusi',      circleColor: '#7ed957', badgeColor: '#7ed957', badgeText: '#1a1a1a', badge: 'Draft',  bold: true  },
  { step: 2, label: 'Bahan Kajian', circleColor: '#aaaaaa', badgeColor: '#f1f5f9', badgeText: '#94a3b8', badge: 'Draft',  bold: false },
  { step: 3, label: 'CPMK',         circleColor: '#aaaaaa', badgeColor: '#f1f5f9', badgeText: '#94a3b8', badge: 'Draft',  bold: false },
  { step: 4, label: 'Sub-CPMK',     circleColor: '#aaaaaa', badgeColor: '#f1f5f9', badgeText: '#94a3b8', badge: 'Draft',  bold: false },
  { step: 5, label: 'RAE',          circleColor: '#aaaaaa', badgeColor: '#f1f5f9', badgeText: '#94a3b8', badge: 'Draft',  bold: false },
  { step: 6, label: 'RT',           circleColor: '#aaaaaa', badgeColor: '#f1f5f9', badgeText: '#94a3b8', badge: 'Draft',  bold: false },
];

// Figma exact highlight/legend colors
const HIGHLIGHT_COLORS = [
  { label: 'Pengetahuan',    dot: '#1b7f36' },
  { label: 'Kelompok BK',   dot: '#1b5fa8' },
  { label: 'Tambahan',       dot: '#b26a00' },
  { label: 'Sikap',          dot: '#6b3fa0' },
  { label: 'Penghubung AI',  dot: '#b03fa8' },
];

// ── Composer Card — colored span text matching Figma ─────────────────────────
function ComposerCard({ kode, deskripsi, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 6,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: '#7a7a7a',
          letterSpacing: 0.3, textTransform: 'uppercase',
        }}>
          Rangkaian kalimat · {kode || 'CA234503'}
        </span>
        {/* Trigger Susunan button — Figma: bg white, border #bdbdbd, radius 10, h=20, w=74 */}
        <button style={{
          height: 20, minWidth: 74,
          background: 'white',
          border: '1px solid #bdbdbd',
          borderRadius: 10,
          fontSize: 10.5, fontWeight: 500, color: '#444',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          padding: '0 10px',
        }}>
          <span style={{ fontSize: 9 }}>ⓘ</span> Susunan
        </button>
      </div>

      {/* Composer card — Figma: bg white, h=265, w=334, shadow */}
      <div style={{
        background: 'white',
        borderRadius: 8,
        border: '1px solid #e2e2e2',
        padding: '12px 14px',
        minHeight: 180,
        marginBottom: 8,
      }}>
        {/* Legend row — Figma dots: 8×8px, borderRadius 2, text 10.5px color #555 */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap',
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: '1px solid #f0f0f0',
        }}>
          {HIGHLIGHT_COLORS.map(hc => (
            <span key={hc.label} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10.5, color: '#555',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: 2,
                background: hc.dot,
                display: 'inline-block', flexShrink: 0,
              }} />
              {hc.label}
            </span>
          ))}
        </div>

        {/* Main deskripsi textarea */}
        <textarea
          style={{
            width: '100%', boxSizing: 'border-box',
            border: 'none', outline: 'none',
            fontSize: 13, lineHeight: '21px',
            color: '#262626',
            fontFamily: 'inherit',
            resize: 'none',
            background: 'transparent',
            minHeight: 90,
          }}
          placeholder={
            'Mata kuliah ini mengembangkan ' +
            'kemampuan mahasiswa untuk ' +
            'menganalisis…'
          }
          value={deskripsi}
          onChange={e => onChange(e.target.value)}
        />

        {/* Status dot row — Figma: dot #e0a030, text #555 medium 10.5px */}
        {deskripsi && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            marginTop: 8, paddingTop: 8,
            borderTop: '1px solid #f0f0f0',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 4,
              background: '#e0a030', display: 'inline-block', flexShrink: 0,
            }} />
            <span style={{ fontSize: 10.5, fontWeight: 500, color: '#555' }}>
              Draf · deskripsi siap disimpan
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ChatBubble ────────────────────────────────────────────────────────────────
function ChatBubble({ role, text, sources, actions, analysis, onAction }) {
  const isAssistant = role === 'assistant';

  return (
    <div style={{ marginBottom: 18 }}>
      {/* Assistant header */}
      {isAssistant && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: 'white', fontSize: 14 }}>✦</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>Asisten Kurikulum</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>Agen AI · RAG buku Bloom–Anderson</div>
          </div>
          {/* Siap badge — Figma: bg #dcfce7, color #16a34a */}
          <span style={{
            fontSize: 10.5, fontWeight: 500,
            background: '#dcfce7', color: '#16a34a',
            padding: '2px 8px', borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 4,
            flexShrink: 0,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            Siap
          </span>
        </div>
      )}

      {/* RAG source chips */}
      {isAssistant && sources && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Sumber pengetahuan (RAG)</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {sources.map((s, i) => (
              <span key={i} style={{
                fontSize: 10, background: '#f1f5f9',
                border: '1px solid #e2e8f0', borderRadius: 20,
                padding: '2px 10px', color: '#475569',
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Context aktif */}
      {isAssistant && analysis?.context && (
        <div style={{
          fontSize: 10, color: '#475569', marginBottom: 8,
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 8, padding: '6px 10px', lineHeight: 1.6,
        }}>
          <span style={{ color: '#94a3b8' }}>Konteks aktif</span><br />
          <span style={{ fontWeight: 600 }}>{analysis.context}</span>
        </div>
      )}

      {/* User bubble — Figma: bg #1a1a1a, borderRadius 12 0 12 12, maxW=300 */}
      {!isAssistant && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <div style={{
            background: '#1a1a1a', color: 'white',
            borderRadius: '12px 0 12px 12px',
            padding: '10px 14px', fontSize: 12, lineHeight: 1.6,
            maxWidth: 300,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}>
            {text}
          </div>
        </div>
      )}

      {/* Assistant bubble — Figma: bg white, rounded, border */}
      {isAssistant && (
        <>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>✦ Asisten · baru saja</div>
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0 12px 12px 12px',
            padding: '10px 14px', fontSize: 12, lineHeight: 1.6,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            {text}
          </div>
        </>
      )}

      {/* Analysis items — Figma chips: Tercermin=#dcfce7/#16a34a, Belum=#fff7ed/#c2410c, Selaras=#dbeafe/#1d4ed8 */}
      {isAssistant && analysis?.items && (
        <div style={{
          marginTop: 8, background: 'white',
          border: '1px solid #e2e8f0', borderRadius: 8,
          overflow: 'hidden',
        }}>
          {analysis.items.map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '7px 12px',
              borderBottom: i < analysis.items.length - 1 ? '1px solid #f0f4f8' : 'none',
            }}>
              <span style={{ fontSize: 11, color: '#475569' }}>{item.label}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                background:
                  item.status === 'Tercermin'      ? '#dcfce7' :
                  item.status === 'Selaras'         ? '#dbeafe' : '#fff7ed',
                color:
                  item.status === 'Tercermin'      ? '#16a34a' :
                  item.status === 'Selaras'         ? '#1d4ed8' : '#c2410c',
              }}>{item.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Source citation — Figma: w=361 full, border, chip */}
      {isAssistant && analysis?.sources && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {analysis.sources.map((s, i) => (
            <span key={i} style={{
              fontSize: 10, background: '#f1f5f9',
              border: '1px solid #e2e8f0', borderRadius: 6,
              padding: '3px 8px', color: '#475569',
              width: '100%', boxSizing: 'border-box',
            }}>[{i + 1}] {s}</span>
          ))}
        </div>
      )}

      {/* Action chips — Figma: h=26, bg #f1f5f9 or #1a1a1a */}
      {isAssistant && actions && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {actions.map((a, i) => (
            <button key={i} onClick={() => onAction?.(a)} style={{
              height: 26,
              padding: '0 12px',
              borderRadius: 13,
              background: i === 0 ? '#1a1a1a' : '#f1f5f9',
              color: i === 0 ? 'white' : '#475569',
              border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 500,
            }}>{a}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Preview Panel ─────────────────────────────────────────────────────────────
function PreviewPanel({ activeTab, formData, mk }) {
  const previewContent = {
    deskripsi: (
      <div>
        {/* Bahasa Indonesia card */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#475569' }}>Bahasa Indonesia</span>
            {/* Chip ✦ Draf AI — Figma: h=18, w=92 */}
            <span style={{
              height: 18, minWidth: 92,
              fontSize: 10, background: '#fce4ec', color: '#e91e8c',
              borderRadius: 20, padding: '0 10px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✦ Draf AI</span>
          </div>
          <div style={{
            background: 'white', borderRadius: 10,
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            padding: '16px 18px',
          }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, lineHeight: 1.3 }}>
              {mk?.nama_mk || 'Nama Mata Kuliah'}
            </div>
            <div style={{ fontSize: 12, color: '#333', lineHeight: 1.8 }}>
              {formData.deskripsi_id || (
                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                  Deskripsi mata kuliah dalam Bahasa Indonesia akan muncul di sini…
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bahasa Inggris card */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#475569' }}>Bahasa Inggris</span>
            <span style={{
              height: 18, minWidth: 92,
              fontSize: 10, background: '#e3f2fd', color: '#1565c0',
              borderRadius: 20, padding: '0 10px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✦ Terjemahan</span>
          </div>
          <div style={{
            background: 'white', borderRadius: 10,
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            padding: '16px 18px',
          }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, lineHeight: 1.3 }}>
              {mk?.nama_mk_en || mk?.nama_mk || 'Course Name'}
            </div>
            <div style={{ fontSize: 12, color: '#333', lineHeight: 1.8 }}>
              {formData.deskripsi_en || (
                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                  English description will appear here after translation…
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    ),

    bk: (
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#1a1a1a' }}>Bahan Kajian</div>
        {formData.bk_items?.length ? formData.bk_items.map((bk, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, marginBottom: 8,
            padding: '8px 10px', background: '#fffde7', borderRadius: 8, fontSize: 12,
          }}>
            <span style={{ color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ color: '#333' }}>{bk}</span>
          </div>
        )) : (
          <div style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>Bahan kajian belum diisi…</div>
        )}
      </div>
    ),

    cpmk: (
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#1a1a1a' }}>Capaian Pembelajaran MK</div>
        {formData.cpmk_items?.length ? formData.cpmk_items.map((c, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, marginBottom: 8,
            padding: '8px 10px', background: '#f0fdf4', borderRadius: 8, fontSize: 12,
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: '50%',
              background: '#22c55e', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, flexShrink: 0,
            }}>{i + 1}</span>
            <span style={{ color: '#333' }}>{c}</span>
          </div>
        )) : (
          <div style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>CPMK belum diisi…</div>
        )}
      </div>
    ),

    sap: (
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#1a1a1a' }}>Satuan Acara Perkuliahan</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f0f4f8' }}>
              {['Mg', 'Kemampuan Akhir', 'Metode', 'Waktu', 'Bobot'].map(h => (
                <th key={h} style={{
                  padding: '6px 8px', textAlign: 'left',
                  borderBottom: '1px solid #e0e8f0',
                  fontSize: 10, fontWeight: 700, color: '#64748b',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 16 }, (_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0f4f8' }}>
                <td style={{ padding: '6px 8px', color: '#94a3b8' }}>{i + 1}</td>
                <td style={{ padding: '6px 8px', color: '#94a3b8', fontStyle: 'italic' }}>—</td>
                <td style={{ padding: '6px 8px', color: '#94a3b8' }}>—</td>
                <td style={{ padding: '6px 8px', color: '#94a3b8' }}>—</td>
                <td style={{ padding: '6px 8px', color: '#94a3b8' }}>—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  };

  return previewContent[activeTab] || (
    <div style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic', textAlign: 'center', paddingTop: 40 }}>
      Preview untuk tab "{activeTab}" akan tersedia setelah data diisi.
    </div>
  );
}

// ── Style constants ───────────────────────────────────────────────────────────
// Panel Form inputs — Figma: bg white, border #e2e2e2, radius 8, h=32, font 14px placeholder #a0a0a0
const inputStyle = {
  width: '100%',
  height: 32,
  padding: '0 10px',
  border: '1px solid #e2e2e2',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  background: 'white',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  color: '#222',
};

const selectStyle = {
  width: '100%',
  height: 32,
  padding: '0 10px',
  border: '1px solid #e2e2e2',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  background: 'white',
  boxSizing: 'border-box',
  cursor: 'pointer',
  appearance: 'auto',
  fontFamily: 'inherit',
  color: '#222',
};

const textareaStyle = {
  width: '100%',
  padding: '7px 10px',
  border: '1px solid #e2e2e2',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  background: 'white',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  resize: 'vertical',
  color: '#222',
};

// Panel MK sidebar controls — Figma: bg white, border #9aa5ad, radius 9, h=34
const mkSelectStyle = {
  width: '100%',
  height: 34,
  padding: '0 10px',
  border: '1px solid #9aa5ad',
  borderRadius: 9,
  fontSize: 14,
  outline: 'none',
  background: 'white',
  boxSizing: 'border-box',
  cursor: 'pointer',
  appearance: 'auto',
  fontFamily: 'inherit',
  color: '#1a1a1a',
};

// Section label — Figma: color #7a7a7a, 12px
const sectionLabelStyle = {
  display: 'block',
  fontSize: 12,
  color: '#7a7a7a',
  marginBottom: 6,
};

// Panel MK section label — Figma: color #6b6b6b, 12.5px
const mkSectionLabel = {
  display: 'block',
  fontSize: 12.5,
  color: '#6b6b6b',
  marginBottom: 8,
};

function FormGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {/* Figma label: color #7a7a7a, font 12px */}
      <label style={sectionLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GeneratorRPS({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('deskripsi');
  const [mkList, setMkList] = useState([]);
  const [selectedMkId, setSelectedMkId] = useState('');
  const [selectedMk, setSelectedMk] = useState(null);
  const [versiList, setVersiList] = useState([]);
  const [jenjang, setJenjang] = useState('S1');
  const [chatInput, setChatInput] = useState('');
  const [dokList, setDokList] = useState([]);
  const chatEndRef = useRef(null);

  // Panel visibility state
  const [diskusiOpen, setDiskusiOpen] = useState(false);         // Panel AI overlay
  const [previewOpen, setPreviewOpen] = useState(false);         // muncul saat Simpan
  const [previewMinimized, setPreviewMinimized] = useState(false); // minimize ke strip bawah

  const [formData, setFormData] = useState({
    deskripsi_id: '',
    deskripsi_en: '',
    kemampuan: '',
    keterampilan: '',
    bk_items: [],
    bk_bebas: '',
    cpmk_items: [],
    bentuk_penugasan: '',
    metode: '',
    deskripsi_tambahan: '',
  });

  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: 'Apakah deskripsi sudah mencerminkan capaian yang dibebankan pada MK ini?',
      sources: ['Anderson & Krathwohl 2001', 'Bloom 1956'],
      analysis: {
        context: 'Deskripsi MK · CA234503 · CPL 1, 2, 4, 6, 9, 10',
        items: [
          { label: 'CPL 2, 4',       status: 'Tercermin' },
          { label: 'CPL 9, 10',      status: 'Belum tersurat' },
          { label: 'Metode belajar', status: 'Selaras' },
        ],
        sources: ['Anderson & Krathwohl (2001) · Keselarasan tujuan–pembelajaran'],
      },
      actions: ['Terapkan saran', 'Tampilkan kutipan'],
    },
  ]);

  useEffect(() => {
    supabase.from('versi_kurikulum').select('*').order('tahun_mulai').then(({ data }) => setVersiList(data || []));
    loadMKList('S1');
  }, []);

  const loadMKList = async (j) => {
    const { data } = await supabase
      .from('master_mata_kuliah')
      .select('id, kode_mk, nama_mk, nama_mk_en, sks, semester, jenjang')
      .eq('jenjang', j)
      .order('semester').order('kode_mk');
    setMkList(data || []);
    const { data: dokData } = await supabase
      .from('dokumen_silabus')
      .select('id, master_mata_kuliah(kode_mk, nama_mk), status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);
    setDokList(dokData || []);
  };

  const handleMkChange = (id) => {
    setSelectedMkId(id);
    const mk = mkList.find(m => m.id === id);
    setSelectedMk(mk);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', text: chatInput };
    const aiReply = {
      role: 'assistant',
      text: 'Tambahkan satu klausa tentang kegiatan praktik berbasis data agar CPL 9 dan 10 terwakili, tanpa menambah topik baru.',
      analysis: {
        sources: ['Anderson & Krathwohl (2001) · Tabel Taksonomi'],
      },
      actions: ['Terapkan ke form', 'Abaikan'],
    };
    setChatMessages(prev => [...prev, userMsg, aiReply]);
    setChatInput('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
  };

  const activeTabObj = TABS.find(t => t.id === activeTab) || TABS[0];
  const initials = user?.nama
    ? user.nama.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'U';

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: '#EDF3F9',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      marginRight: 'var(--rail-width, 44px)',
      transition: 'margin-right 0.2s ease',
    }}>

      {/* ══════════════════════════════════════════════
          PANEL 1 — FORM   flex:1, bg=#f6f6f6
          Melebar ke kanan, dengan icon-strip di tepi kanan
      ══════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        minWidth: 320,
        maxWidth: 680,
        height: '100vh',
        background: '#f6f6f6',
        display: 'flex',
        flexDirection: 'row',   /* icon strip di sebelah kanan konten form */
        position: 'relative',
      }}>
        {/* ── Form content column ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #d2d2d2' }}>
        {/* Accent strip — Figma: h=10px, color #e09bdb (lavender-pink) for Deskripsi tab */}
        <div style={{
          height: 10,
          background: activeTabObj.accent,
          flexShrink: 0,
        }} />

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 2, padding: '8px 10px 0',
          borderBottom: '1px solid #d6d6d6',
          overflowX: 'auto', flexShrink: 0,
          background: '#f6f6f6',
        }}>
          {TABS.map(t => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: isActive ? '5px 14px' : '5px 10px',
                  fontSize: 11, fontWeight: isActive ? 600 : 400,
                  borderRadius: isActive ? 20 : 6,
                  border: 'none', cursor: 'pointer',
                  background: isActive ? t.accent : 'transparent',
                  color: isActive ? 'white' : '#7a7a7a',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >{t.label}</button>
            );
          })}
        </div>

        {/* Meta info — Keterangan — Figma: label #7a7a7a 12px, text #222 14px medium */}
        {selectedMk ? (
          <div style={{
            padding: '8px 16px',
            borderBottom: '1px solid #d6d6d6',
            background: '#f6f6f6',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 12, color: '#7a7a7a', marginBottom: 2 }}>Keterangan</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#222', lineHeight: '20px' }}>
              {selectedMk.jenjang === 'S1' ? 'Wajib' : selectedMk.jenjang}
              <span style={{ color: '#7a7a7a', fontWeight: 400 }}>
                {' '}• {selectedMk.sks} SKS • Sem. {selectedMk.semester} • Prasyarat: —
              </span>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '8px 16px',
            borderBottom: '1px solid #d6d6d6',
            background: '#f6f6f6',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 12, color: '#7a7a7a', marginBottom: 2 }}>Keterangan</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#222', lineHeight: '20px' }}>
              Wajib <span style={{ color: '#7a7a7a', fontWeight: 400 }}>• 3 SKS • Sem. 3 • Prasyarat: —</span>
            </div>
          </div>
        )}

        {/* Form body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

          {activeTab === 'deskripsi' && (
            <div>
              <FormGroup label="Pengetahuan &amp; Ketrampilan">
                <select style={selectStyle} value={formData.kemampuan}
                  onChange={e => setFormData(f => ({ ...f, kemampuan: e.target.value }))}>
                  <option value="" style={{ color: '#a0a0a0' }}>Kemampuan</option>
                  <option>Memahami (C2)</option>
                  <option>Menganalisis (C4)</option>
                  <option>Mengevaluasi (C5)</option>
                  <option>Menciptakan (C6)</option>
                </select>
                <select style={{ ...selectStyle, marginTop: 6 }} value={formData.keterampilan}
                  onChange={e => setFormData(f => ({ ...f, keterampilan: e.target.value }))}>
                  <option value="" style={{ color: '#a0a0a0' }}>Keterampilan</option>
                  <option>Keterampilan Umum</option>
                  <option>Keterampilan Khusus</option>
                </select>
              </FormGroup>

              <FormGroup label="Kelompok Bahan Kajian">
                <textarea
                  style={{ ...textareaStyle, minHeight: 60 }}
                  placeholder="Ketik bebas..."
                  value={formData.bk_bebas}
                  onChange={e => setFormData(f => ({ ...f, bk_bebas: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="Sikap &amp; Metode Pembelajaran">
                <select style={selectStyle} value={formData.bentuk_penugasan}
                  onChange={e => setFormData(f => ({ ...f, bentuk_penugasan: e.target.value }))}>
                  <option value="" style={{ color: '#a0a0a0' }}>Bentuk Penugasan</option>
                  <option>Kritik Studio</option>
                  <option>Portofolio</option>
                  <option>Ujian Tulis</option>
                  <option>Tugas Terstruktur</option>
                  <option>Presentasi</option>
                </select>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <select style={{ ...selectStyle, flex: 1 }} value={formData.metode}
                    onChange={e => setFormData(f => ({ ...f, metode: e.target.value }))}>
                    <option value="" style={{ color: '#a0a0a0' }}>Metode Pembelajaran</option>
                    <option>Kuliah</option>
                    <option>Diskusi</option>
                    <option>Studio</option>
                    <option>Studi Kasus</option>
                    <option>Presentasi</option>
                  </select>
                  <button style={{
                    background: '#1f1f1f', color: 'white',
                    border: 'none', borderRadius: 7, width: 32, height: 32,
                    cursor: 'pointer', fontSize: 20, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>+</button>
                </div>
              </FormGroup>

              {/* Composer card — Figma: bg white, h≈265, w=334, composer textarea */}
              <ComposerCard
                kode={selectedMk?.kode_mk}
                deskripsi={formData.deskripsi_id}
                onChange={v => setFormData(f => ({ ...f, deskripsi_id: v }))}
              />

              <FormGroup label="Deskripsi Tambahan">
                <textarea
                  style={{ ...textareaStyle, minHeight: 60 }}
                  placeholder="Ketik bebas..."
                  value={formData.deskripsi_tambahan}
                  onChange={e => setFormData(f => ({ ...f, deskripsi_tambahan: e.target.value }))}
                />
              </FormGroup>
            </div>
          )}

          {activeTab === 'bk' && (
            <div>
              <FormGroup label="Bahan Kajian">
                <div style={{ fontSize: 12, color: '#7a7a7a', marginBottom: 8 }}>
                  Tambahkan bahan kajian yang akan dipelajari dalam MK ini.
                </div>
                {(formData.bk_items || []).map((bk, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <input style={{ ...inputStyle, flex: 1 }} value={bk}
                      onChange={e => {
                        const items = [...formData.bk_items];
                        items[i] = e.target.value;
                        setFormData(f => ({ ...f, bk_items: items }));
                      }}
                    />
                    <button onClick={() => setFormData(f => ({ ...f, bk_items: f.bk_items.filter((_, j) => j !== i) }))}
                      style={{
                        background: '#fee2e2', border: 'none', borderRadius: 6,
                        width: 28, height: 32, cursor: 'pointer', color: '#dc2626', flexShrink: 0,
                      }}>✕</button>
                  </div>
                ))}
                <button
                  onClick={() => setFormData(f => ({ ...f, bk_items: [...(f.bk_items || []), ''] }))}
                  style={{
                    width: '100%', padding: '7px',
                    background: 'white', border: '1px dashed #d2d2d2',
                    borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#7a7a7a',
                  }}
                >+ Tambah Bahan Kajian</button>
              </FormGroup>
            </div>
          )}

          {activeTab === 'cpmk' && (
            <div>
              <FormGroup label="CPMK">
                {(formData.cpmk_items || []).map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: '#22c55e', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 5,
                    }}>{i + 1}</span>
                    <textarea style={{ ...textareaStyle, flex: 1, minHeight: 56 }} value={c}
                      onChange={e => {
                        const items = [...formData.cpmk_items];
                        items[i] = e.target.value;
                        setFormData(f => ({ ...f, cpmk_items: items }));
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => setFormData(f => ({ ...f, cpmk_items: [...(f.cpmk_items || []), ''] }))}
                  style={{
                    width: '100%', padding: '7px',
                    background: 'white', border: '1px dashed #d2d2d2',
                    borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#7a7a7a',
                  }}
                >+ Tambah CPMK</button>
              </FormGroup>
            </div>
          )}

          {(activeTab === 'sub' || activeTab === 'eval' || activeTab === 'tugas') && (
            <div style={{ textAlign: 'center', paddingTop: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>🔧</div>
              <div style={{ fontSize: 12, color: '#7a7a7a' }}>Form {activeTab.toUpperCase()} dalam pengembangan</div>
            </div>
          )}

          {activeTab === 'sap' && (
            <div>
              <FormGroup label="Satuan Acara Perkuliahan (16 Minggu)">
                <div style={{ fontSize: 12, color: '#7a7a7a' }}>
                  SAP akan di-generate otomatis dari CPMK dan Bahan Kajian yang sudah diisi.
                </div>
              </FormGroup>
            </div>
          )}
        </div>

        {/* Generate Deskripsi button — Figma: bg #1f1f1f, h=34, radius=15, text white medium 13px */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #d6d6d6',
          flexShrink: 0,
          background: '#f6f6f6',
        }}>
          <button
            onClick={() => { setPreviewOpen(true); setPreviewMinimized(false); }}
            style={{
              width: '100%', height: 34,
              background: '#1f1f1f', color: 'white',
              border: 'none', borderRadius: 15,
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              letterSpacing: 0.1,
            }}>
            <span>✦</span>  Generate & Simpan
          </button>
        </div>

        </div>{/* end form content column */}

        {/* ── Icon strip — tombol Preview & AI menempel di tepi kanan panel ── */}
        <div style={{
          width: 44, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 60, gap: 6,
          background: '#f0f0f0',
          borderRight: '1px solid #d2d2d2',
        }}>
          {/* Preview button */}
          <button
            onClick={() => { setPreviewOpen(o => !o); setPreviewMinimized(false); }}
            title="Preview hasil"
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: previewOpen ? '#f59e0b' : 'white',
              border: `1px solid ${previewOpen ? '#d97706' : '#d2d2d2'}`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
              boxShadow: previewOpen ? '0 2px 8px rgba(245,158,11,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'all 0.15s',
            }}
          >👁</button>
          {/* AI Diskusi button */}
          <button
            onClick={() => setDiskusiOpen(o => !o)}
            title="Asisten AI Kurikulum"
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: diskusiOpen ? '#7c3aed' : 'white',
              border: `1px solid ${diskusiOpen ? '#6d28d9' : '#d2d2d2'}`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: diskusiOpen ? 'white' : '#7c3aed',
              boxShadow: diskusiOpen ? '0 2px 8px rgba(124,58,237,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'all 0.15s',
            }}
          >✦</button>
        </div>

      </div>{/* end Panel 1 outer */}

      {/* ══════════════════════════════════════════════
          PANEL AI — Overlay slide-in dari kanan panel generator
          Muncul saat tombol ✦ diklik, melayang di atas Panel MK
      ══════════════════════════════════════════════ */}
      {diskusiOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: `calc(var(--rail-width, 44px) + 372px)`,
          width: 420,
          height: '100vh',
          background: '#f8fafc',
          borderLeft: '1px solid #d2d2d2',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
          display: 'flex', flexDirection: 'column',
          zIndex: 400,
          animation: 'slideInRight 0.2s ease',
        }}>
          <style>{`@keyframes slideInRight { from { transform: translateX(40px); opacity:0; } to { transform: translateX(0); opacity:1; } }`}</style>
          {/* Header strip */}
          <div style={{ height: 10, background: '#7c3aed', flexShrink: 0 }} />
          {/* Chat header */}
          <div style={{
            padding: '10px 16px', borderBottom: '1px solid #e0e8f0',
            background: 'white', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: '#1a1a1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ color: 'white', fontSize: 14 }}>✦</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>Asisten Kurikulum</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Agen AI · RAG buku Bloom–Anderson</div>
              </div>
              <span style={{
                fontSize: 10.5, fontWeight: 500, background: '#dcfce7', color: '#16a34a',
                padding: '2px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                Siap
              </span>
              <button onClick={() => setDiskusiOpen(false)} style={{
                width: 24, height: 24, borderRadius: '50%', background: '#f1f5f9',
                border: '1px solid #e0e8f0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: '#64748b', marginLeft: 4,
              }}>×</button>
            </div>
          </div>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
            {chatMessages.map((msg, i) => (<ChatBubble key={i} {...msg} />))}
            <div ref={chatEndRef} />
          </div>
          {/* Quick prompts */}
          <div style={{ padding: '0 16px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
            {['Cek keselarasan CPL', 'Periksa level kognitif', 'Cari kesenjangan', 'Tambah referensi', 'Ringkas temuan'].map(p => (
              <button key={p} onClick={() => setChatInput(p)} style={{
                height: 26, padding: '0 12px', borderRadius: 13, background: 'white',
                border: '1px solid #e0e8f0', cursor: 'pointer', fontSize: 11, color: '#475569', whiteSpace: 'nowrap',
              }}>{p}</button>
            ))}
          </div>
          {/* Input */}
          <div style={{
            padding: '10px 16px', borderTop: '1px solid #e0e8f0', background: 'white',
            display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
          }}>
            <textarea
              value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Tanyakan keterkaitan, relevansi, atau akurasi…" rows={2}
              style={{
                flex: 1, minHeight: 60, border: '1px solid #e0e8f0', borderRadius: 10,
                padding: '8px 10px', fontSize: 12, resize: 'none', outline: 'none',
                background: '#f8fafc', lineHeight: 1.5, fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            <button onClick={sendChat} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: chatInput.trim() ? '#1a1a1a' : '#e0e8f0',
              border: 'none', cursor: chatInput.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ color: chatInput.trim() ? 'white' : '#94a3b8', fontSize: 16, lineHeight: 1 }}>↑</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          FLOATING PREVIEW PANEL (Figma-style bottom sheet)
          Muncul setelah Generate & Simpan diklik
          Bisa di-minimize ke strip 48px di bawah
      ══════════════════════════════════════════════ */}
      {previewOpen && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 374,  /* mulai dari kanan Panel 1 */
          right: `calc(var(--rail-width, 44px) + 372px)`,
          zIndex: 500,
          transition: 'height 0.25s ease, right 0.2s ease',
          height: previewMinimized ? 48 : 380,
          background: 'white',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.13)',
          borderTop: '1px solid #d0d8e0',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Preview header bar */}
          <div style={{
            height: 48, flexShrink: 0,
            background: previewMinimized ? '#1a1a1a' : 'white',
            borderBottom: previewMinimized ? 'none' : '1px solid #e0e8f0',
            display: 'flex', alignItems: 'center',
            padding: '0 16px', gap: 10,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
            onClick={() => setPreviewMinimized(m => !m)}
          >
            {/* Accent dot */}
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: activeTabObj.accent, flexShrink: 0,
            }} />
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: previewMinimized ? 'white' : '#1a1a1a',
              flex: 1,
            }}>
              ✦ Preview — {selectedMk?.kode_mk || 'Draft'} · {activeTabObj.label}
            </span>
            {/* Controls */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setPreviewMinimized(m => !m)}
                title={previewMinimized ? 'Perluas preview' : 'Minimize preview'}
                style={{
                  height: 24, padding: '0 10px',
                  background: previewMinimized ? 'rgba(255,255,255,0.15)' : '#f1f5f9',
                  border: 'none', borderRadius: 12,
                  fontSize: 11, fontWeight: 500,
                  color: previewMinimized ? 'white' : '#475569',
                  cursor: 'pointer',
                }}
              >{previewMinimized ? '▲ Perluas' : '▼ Minimize'}</button>
              <button
                onClick={() => setPreviewOpen(false)}
                title="Tutup preview"
                style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: previewMinimized ? 'rgba(255,255,255,0.15)' : '#fee2e2',
                  border: 'none',
                  fontSize: 13, color: previewMinimized ? 'white' : '#dc2626',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>
          </div>

          {/* Preview content — only visible when not minimized */}
          {!previewMinimized && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
              <PreviewPanel activeTab={activeTab} formData={formData} mk={selectedMk} />
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          PANEL 4 — PANEL MK / SIDEBAR   w=372
          Header: bg rgba(198,228,245,0.9), border #9cc3dd
      ══════════════════════════════════════════════ */}
      <div style={{
        width: 372,
        flexShrink: 0,
        height: '100vh',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #d2d2d2',
        overflowY: 'auto',
      }}>
        {/* User header — Figma: bg rgba(198,228,245,0.9), h=55, border-bottom #9cc3dd */}
        <div style={{
          padding: '0 16px',
          height: 55,
          borderBottom: '1px solid #9cc3dd',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(198,228,245,0.9)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#2a6496',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            {/* Figma: Nama User #1a1a1a bold 16px at y=12, Peran #1a1a1a regular 12px at y=34 */}
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>{user?.nama || 'Nama User'}</div>
            <div style={{ fontSize: 12, color: '#1a1a1a', marginTop: 2 }}>{user?.peran || 'Peran'}</div>
          </div>
        </div>

        {/* Sidebar scroll area — Figma: bg rgba(233,239,243,0.92) */}
        <div style={{
          margin: 8,
          marginBottom: 0,
          background: 'rgba(233,239,243,0.92)',
          border: '1px solid #b9c8d3',
          borderRadius: 12,
          padding: '12px 15px',
          flex: 1,
          overflowY: 'auto',
        }}>
          {/* Periode dropdown — Figma: placeholder #555 14px */}
          <div style={{ marginBottom: 10 }}>
            <label style={mkSectionLabel}>Periode</label>
            <select style={{ ...mkSelectStyle, color: '#555' }}>
              {versiList.length > 0
                ? versiList.map(v => <option key={v.id} value={v.id}>{v.nama}</option>)
                : <option value="">Periode 2023–2028</option>
              }
            </select>
          </div>

          {/* Jenjang dropdown — Figma: selected text #1a1a1a 15px */}
          <div style={{ marginBottom: 10 }}>
            <label style={mkSectionLabel}>Jenjang Studi</label>
            <select style={{ ...mkSelectStyle, fontSize: 15, color: '#1a1a1a' }}
              value={jenjang}
              onChange={e => { setJenjang(e.target.value); loadMKList(e.target.value); }}>
              <option value="S1">Sarjana</option>
              <option value="PPAr">PPAr</option>
              <option value="S2">Magister</option>
              <option value="S3">Doktor</option>
            </select>
          </div>

          {/* MK dropdown — Figma: selected text #1a1a1a 13px */}
          <div style={{ marginBottom: 12 }}>
            <label style={mkSectionLabel}>Kode &amp; Nama Mata Kuliah</label>
            <select
              style={{ ...mkSelectStyle, fontSize: 13, color: selectedMkId ? '#1a1a1a' : '#555' }}
              value={selectedMkId}
              onChange={e => handleMkChange(e.target.value)}
            >
              <option value="">— Pilih Mata Kuliah —</option>
              {mkList.map(mk => (
                <option key={mk.id} value={mk.id}>{mk.kode_mk} – {mk.nama_mk}</option>
              ))}
            </select>
          </div>

          {/* Buat Dokumen — Figma: bg #4a90d9, h=36, radius=18 (pill), text white medium 14px, w=324 */}
          <button
            disabled={!selectedMkId}
            style={{
              width: '100%', height: 36,
              background: selectedMkId ? '#4a90d9' : '#b9c8d3',
              color: 'white',
              border: 'none', borderRadius: 18,
              fontSize: 14, fontWeight: 500,
              cursor: selectedMkId ? 'pointer' : 'not-allowed',
              marginBottom: 14,
              letterSpacing: 0.1,
            }}
          >Buat Dokumen</button>

          {/* Divider — Figma: #8a949b, h=1 */}
          <div style={{ height: 1, background: '#8a949b', marginBottom: 14 }} />

          {/* Rantai Generator — Figma: label #6b6b6b 12.5px */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ ...mkSectionLabel, marginBottom: 10 }}>Rantai Generator</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {RANTAI.map((r, i) => (
                <div key={r.step}>
                  {/* Step row — Figma: h=36, w=324 */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    minHeight: 36, gap: 10,
                  }}>
                    {/* Circle column with connector */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22, flexShrink: 0 }}>
                      {/* Figma: ellipse 22×22, colored SVG style, step1=green #7ed957 */}
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: r.circleColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>{r.step}</div>
                    </div>
                    {/* Step label — Figma: step1 bold #1a1a1a 13.5px, rest regular */}
                    <span style={{
                      fontSize: 13.5, flex: 1, color: '#1a1a1a',
                      fontWeight: r.bold ? 700 : 400,
                    }}>{r.label}</span>
                    {/* Badge — Figma step1: bg #7ed957, h=17, w=48, radius=8, text #1a1a1a 10px */}
                    <span style={{
                      height: 17, minWidth: 48,
                      background: r.badgeColor,
                      color: r.badgeText,
                      borderRadius: 8,
                      fontSize: 10, fontWeight: 500,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 8px',
                      flexShrink: 0,
                    }}>{r.badge}</span>
                  </div>
                  {/* Connector line — Figma: bg #111, h=10, w=1, at x=14 */}
                  {i < RANTAI.length - 1 && (
                    <div style={{ display: 'flex', paddingLeft: 10 }}>
                      <div style={{ width: 1, height: 10, background: '#111' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#8a949b', marginBottom: 14 }} />

          {/* MK yang Sudah Dibuat — Figma: label #6b6b6b 12.5px, items h=26, text #333 12px */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...mkSectionLabel, marginBottom: 8 }}>MK yang Sudah Dibuat</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {dokList.length === 0 ? (
                <div style={{ fontSize: 12, color: '#6b6b6b', fontStyle: 'italic' }}>Belum ada dokumen</div>
              ) : dokList.slice(0, 6).map(d => (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  height: 26,
                }}>
                  <span style={{
                    fontSize: 12, color: '#333',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    flex: 1, minWidth: 0,
                  }}>
                    {d.master_mata_kuliah?.kode_mk} – {d.master_mata_kuliah?.nama_mk}
                  </span>
                  {/* Chip Edit — Figma: bg #f5f23a (bright yellow), h=16, w=40, radius=8, text #1a1a1a 10px */}
                  <button
                    onClick={() => navigate(`/form/${d.id}`)}
                    style={{
                      height: 16, minWidth: 40,
                      fontSize: 10, padding: '0 6px',
                      borderRadius: 8,
                      background: '#f5f23a',
                      color: '#1a1a1a',
                      border: 'none', cursor: 'pointer',
                      fontWeight: 500, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >Edit</button>
                </div>
              ))}
            </div>
          </div>

          {/* Btn Lihat Node — Figma: border #222, radius=16, h=32, text #1a1a1a medium 12.5px */}
          <button
            onClick={() => navigate('/node')}
            style={{
              width: '100%', height: 32,
              background: 'white',
              border: '1px solid #222',
              borderRadius: 16,
              fontSize: 12.5, fontWeight: 500, color: '#1a1a1a',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginBottom: 12,
            }}
          >
            <Icon name="hub" size={13} /> Lihat hasil sebagai Node →
          </button>
        </div>

        {/* Minimap — Figma: bg rgba(233,239,243,0.92), border #b9c8d3, radius=12, x=8, w=356, h=112 */}
        <div style={{
          margin: '8px 8px 8px 8px',
          height: 112,
          background: 'rgba(233,239,243,0.92)',
          border: '1px solid #b9c8d3',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 4,
          flexShrink: 0,
        }}>
          {/* Placeholder — Figma: bg #afafaf, w=68, h=40, centered */}
          <div style={{
            width: 68, height: 40,
            background: '#afafaf',
            borderRadius: 4,
          }} />
          <span style={{ fontSize: 10, color: '#6b6b6b', marginTop: 4 }}>Minimap</span>
        </div>
      </div>
    </div>
  );
}
