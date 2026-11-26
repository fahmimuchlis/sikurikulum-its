import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Icon from '../components/Icon';

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'deskripsi', label: 'Deskripsi', color: '#f8b4c8', accent: '#e91e8c' },
  { id: 'bk',        label: 'BK',        color: '#fde68a', accent: '#f59e0b' },
  { id: 'cpmk',      label: 'CPMK',      color: '#a7f3d0', accent: '#10b981' },
  { id: 'sub',       label: 'Sub',        color: '#bfdbfe', accent: '#3b82f6' },
  { id: 'eval',      label: 'Eval',       color: '#ddd6fe', accent: '#8b5cf6' },
  { id: 'tugas',     label: 'Tugas',      color: '#fed7aa', accent: '#f97316' },
  { id: 'sap',       label: 'SAP',        color: '#e0e7ff', accent: '#6366f1' },
];

const RANTAI = [
  { step: 1, label: 'Diskusi',      color: '#f97316' },
  { step: 2, label: 'Bahan Kajian', color: '#eab308' },
  { step: 3, label: 'CPMK',         color: '#22c55e' },
  { step: 4, label: 'Sub-CPMK',     color: '#3b82f6' },
  { step: 5, label: 'RAE',          color: '#a855f7' },
  { step: 6, label: 'RT',           color: '#6366f1' },
];

// Highlight legend colors matching Figma
const HIGHLIGHT_COLORS = [
  { label: 'Pengetahuan',       bg: '#d1fae5', dot: '#10b981' },
  { label: 'Kelompok BK',       bg: '#fef3c7', dot: '#f59e0b' },
  { label: 'Tambahan',          bg: '#fef9c3', dot: '#eab308' },
  { label: 'Sikap & metoda',    bg: '#dbeafe', dot: '#3b82f6' },
  { label: 'Penghubung AI',     bg: '#ede9fe', dot: '#7c3aed' },
];

// ── ChatBubble component ──────────────────────────────────────────────────────
function ChatBubble({ role, text, sources, actions, analysis }) {
  const isAssistant = role === 'assistant';
  return (
    <div style={{ marginBottom: 16 }}>
      {isAssistant && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {/* Dark circle avatar with ✦ */}
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
          <span style={{
            fontSize: 10, fontWeight: 600,
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

      {/* RAG chips for first assistant message */}
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
            <button style={{
              fontSize: 10, background: 'none',
              border: '1px dashed #94a3b8', borderRadius: 20,
              padding: '2px 10px', color: '#94a3b8', cursor: 'pointer',
            }}>+ Tambah</button>
          </div>
        </div>
      )}

      {/* Konteks aktif card */}
      {isAssistant && analysis?.context && (
        <div style={{
          fontSize: 10, color: '#475569', marginBottom: 8,
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 8, padding: '6px 10px',
          lineHeight: 1.6,
        }}>
          <span style={{ color: '#94a3b8' }}>Konteks aktif</span><br />
          <span style={{ fontWeight: 600 }}>{analysis.context}</span>
        </div>
      )}

      {/* User bubble — right aligned, dark */}
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

      {/* Assistant bubble */}
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

      {/* Analysis table */}
      {isAssistant && analysis?.items && (
        <div style={{
          marginTop: 8, background: '#f8fafc',
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
                  item.status === 'Tercermin' ? '#dcfce7' :
                  item.status === 'Selaras'    ? '#dbeafe' : '#fff7ed',
                color:
                  item.status === 'Tercermin' ? '#16a34a' :
                  item.status === 'Selaras'    ? '#1d4ed8' : '#c2410c',
              }}>{item.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Source citation chips */}
      {isAssistant && analysis?.sources && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {analysis.sources.map((s, i) => (
            <span key={i} style={{
              fontSize: 10, background: '#f1f5f9',
              border: '1px solid #e2e8f0', borderRadius: 6,
              padding: '3px 8px', color: '#475569',
            }}>[{i + 1}] {s}</span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {isAssistant && actions && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {actions.map((a, i) => (
            <button key={i} style={{
              fontSize: 11, padding: '5px 12px', borderRadius: 20,
              background: i === 0 ? '#1a1a1a' : '#f1f5f9',
              color: i === 0 ? 'white' : '#475569',
              border: 'none', cursor: 'pointer', fontWeight: 500,
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
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}>Bahasa Indonesia</span>
            <span style={{
              fontSize: 10, background: '#fce4ec', color: '#e91e8c',
              border: 'none', borderRadius: 20, padding: '2px 10px', fontWeight: 600,
            }}>✦ Draf AI</span>
          </div>
          <div style={{
            background: 'white', borderRadius: 10,
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            padding: '16px 18px',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>
              {mk?.nama_mk || 'Mata Kuliah'}
            </div>
            <div style={{ fontSize: 12, color: '#333', lineHeight: 1.8 }}>
              {formData.deskripsi_id || (
                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                  Deskripsi mata kuliah dalam Bahasa Indonesia akan muncul di sini setelah diisi atau di-generate oleh AI…
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bahasa Inggris card */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}>Bahasa Inggris</span>
            <span style={{
              fontSize: 10, background: '#fce4ec', color: '#e91e8c',
              border: 'none', borderRadius: 20, padding: '2px 10px', fontWeight: 600,
            }}>✦ Terjemahan</span>
          </div>
          <div style={{
            background: 'white', borderRadius: 10,
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            padding: '16px 18px',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>
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
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Bahan Kajian</div>
        {formData.bk_items?.length ? formData.bk_items.map((bk, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, padding: '8px 10px', background: '#fffde7', borderRadius: 8, fontSize: 12 }}>
            <span style={{ color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
            <span>{bk}</span>
          </div>
        )) : (
          <div style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>Bahan kajian belum diisi…</div>
        )}
      </div>
    ),
    cpmk: (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Capaian Pembelajaran MK (CPMK)</div>
        {formData.cpmk_items?.length ? formData.cpmk_items.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, padding: '8px 10px', background: '#f0fdf4', borderRadius: 8, fontSize: 12 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
            <span>{c}</span>
          </div>
        )) : (
          <div style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>CPMK belum diisi…</div>
        )}
      </div>
    ),
    sap: (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Satuan Acara Perkuliahan</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f0f4f8' }}>
              {['Mg', 'Kemampuan Akhir', 'Metode', 'Waktu', 'Bobot'].map(h => (
                <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #e0e8f0', fontSize: 10, fontWeight: 700, color: '#64748b' }}>{h}</th>
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

// ── Main Generator Page ───────────────────────────────────────────────────────
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
          { label: 'CPL 2, 4',      status: 'Tercermin' },
          { label: 'CPL 9, 10',     status: 'Belum tersurat' },
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

  // Active tab accent color
  const activeTabObj = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#EDF3F9' }}>

      {/* ══════════════════════════════════════════
          PANEL 1 — FORM (kiri)   w=374
      ══════════════════════════════════════════ */}
      <div style={{
        width: 374,
        flexShrink: 0,
        height: '100vh',
        background: 'white',
        borderRight: '1px solid #e0e8f0',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Accent strip — 10px color bar matching active tab */}
        <div style={{
          height: 10,
          background: activeTabObj.accent,
          flexShrink: 0,
          borderRadius: '0 0 0 0',
        }} />

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 2, padding: '8px 10px 0',
          borderBottom: '1px solid #f0f0f0',
          overflowX: 'auto', flexShrink: 0,
        }}>
          {TABS.map(t => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: isActive ? '5px 14px' : '5px 10px',
                  fontSize: 11, fontWeight: isActive ? 700 : 400,
                  borderRadius: isActive ? 20 : 6,
                  border: 'none', cursor: 'pointer',
                  background: isActive ? t.accent : 'transparent',
                  color: isActive ? 'white' : '#94a3b8',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >{t.label}</button>
            );
          })}
        </div>

        {/* Meta info — Keterangan */}
        {selectedMk && (
          <div style={{
            padding: '8px 16px',
            borderBottom: '1px solid #f5f5f5',
            background: '#fafafa',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2, fontWeight: 600, letterSpacing: 0.5 }}>Keterangan</div>
            <div style={{ fontSize: 11, color: '#475569' }}>
              <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{selectedMk.jenjang === 'S1' ? 'Wajib' : selectedMk.jenjang}</span>
              <span style={{ color: '#94a3b8' }}> • {selectedMk.sks} SKS • Sem. {selectedMk.semester} • Prasyarat: —</span>
            </div>
          </div>
        )}

        {/* Form body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

          {activeTab === 'deskripsi' && (
            <div>
              <FormGroup label="Pengetahuan &amp; Ketrampilan">
                <select style={selectStyle} value={formData.kemampuan} onChange={e => setFormData(f => ({ ...f, kemampuan: e.target.value }))}>
                  <option value="">Kemampuan</option>
                  <option>Memahami (C2)</option>
                  <option>Menganalisis (C4)</option>
                  <option>Mengevaluasi (C5)</option>
                  <option>Menciptakan (C6)</option>
                </select>
                <select style={{ ...selectStyle, marginTop: 6 }} value={formData.keterampilan} onChange={e => setFormData(f => ({ ...f, keterampilan: e.target.value }))}>
                  <option value="">Keterampilan</option>
                  <option>Keterampilan Umum</option>
                  <option>Keterampilan Khusus</option>
                </select>
              </FormGroup>

              <FormGroup label="Kelompok Bahan Kajian">
                <textarea
                  style={{ ...inputStyle, minHeight: 60 }}
                  placeholder="Ketik bebas..."
                  value={formData.bk_bebas}
                  onChange={e => setFormData(f => ({ ...f, bk_bebas: e.target.value }))}
                />
              </FormGroup>

              <FormGroup label="Sikap &amp; Metode Pembelajaran">
                <select style={selectStyle} value={formData.bentuk_penugasan} onChange={e => setFormData(f => ({ ...f, bentuk_penugasan: e.target.value }))}>
                  <option value="">Bentuk Penugasan</option>
                  <option>Kritik Studio</option>
                  <option>Portofolio</option>
                  <option>Ujian Tulis</option>
                  <option>Tugas Terstruktur</option>
                  <option>Presentasi</option>
                </select>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <select style={{ ...selectStyle, flex: 1 }} value={formData.metode} onChange={e => setFormData(f => ({ ...f, metode: e.target.value }))}>
                    <option value="">Metode Pembelajaran</option>
                    <option>Kuliah</option>
                    <option>Diskusi</option>
                    <option>Studio</option>
                    <option>Studi Kasus</option>
                    <option>Presentasi</option>
                  </select>
                  <button style={{
                    background: 'var(--color-primary)', color: 'white',
                    border: 'none', borderRadius: 7, width: 30, height: 30,
                    cursor: 'pointer', fontSize: 18, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>+</button>
                </div>
              </FormGroup>

              {/* Composer card — Rangkaian kalimat */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' }}>
                    Rangkaian kalimat · {selectedMk?.kode_mk || 'CA234503'}
                  </span>
                  <button style={{
                    fontSize: 10, color: '#94a3b8', background: 'none',
                    border: '1px solid #e0e8f0', borderRadius: 20,
                    padding: '2px 8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span>ⓘ</span> Susunan
                  </button>
                </div>

                {/* Highlight color legend */}
                <div style={{
                  display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8,
                  padding: '8px 10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px 8px 0 0',
                }}>
                  {HIGHLIGHT_COLORS.map(hc => (
                    <span key={hc.label} style={{
                      fontSize: 9, fontWeight: 600,
                      background: hc.bg,
                      padding: '2px 7px', borderRadius: 3,
                      display: 'flex', alignItems: 'center', gap: 3,
                      color: '#475569',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: hc.dot, display: 'inline-block' }} />
                      {hc.label}
                    </span>
                  ))}
                </div>

                <textarea
                  style={{
                    ...inputStyle, minHeight: 100, fontSize: 12, lineHeight: 1.7,
                    borderRadius: '0 0 8px 8px',
                    borderTop: 'none',
                    marginBottom: 0,
                  }}
                  placeholder="Deskripsi mata kuliah (Bahasa Indonesia)..."
                  value={formData.deskripsi_id}
                  onChange={e => setFormData(f => ({ ...f, deskripsi_id: e.target.value }))}
                />

                {/* Status dot */}
                {formData.deskripsi_id && (
                  <div style={{
                    fontSize: 10, color: '#f97316', marginTop: 5,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} />
                    Draf · deskripsi siap disimpan
                  </div>
                )}
              </div>

              <FormGroup label="Deskripsi Tambahan">
                <textarea
                  style={{ ...inputStyle, minHeight: 60 }}
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
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
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
                      style={{ background: '#fee2e2', border: 'none', borderRadius: 6, width: 28, cursor: 'pointer', color: '#dc2626' }}>✕</button>
                  </div>
                ))}
                <button
                  onClick={() => setFormData(f => ({ ...f, bk_items: [...(f.bk_items || []), ''] }))}
                  style={{ width: '100%', padding: '7px', background: '#f8fafc', border: '1px dashed #e0e8f0', borderRadius: 7, cursor: 'pointer', fontSize: 12, color: '#64748b' }}
                >+ Tambah Bahan Kajian</button>
              </FormGroup>
            </div>
          )}

          {activeTab === 'cpmk' && (
            <div>
              <FormGroup label="CPMK">
                {(formData.cpmk_items || []).map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 6 }}>{i + 1}</span>
                    <textarea style={{ ...inputStyle, flex: 1, minHeight: 56 }} value={c}
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
                  style={{ width: '100%', padding: '7px', background: '#f8fafc', border: '1px dashed #e0e8f0', borderRadius: 7, cursor: 'pointer', fontSize: 12, color: '#64748b' }}
                >+ Tambah CPMK</button>
              </FormGroup>
            </div>
          )}

          {(activeTab === 'sub' || activeTab === 'eval' || activeTab === 'tugas') && (
            <div style={{ textAlign: 'center', paddingTop: 40 }}>
              <Icon name="construction" size={36} style={{ color: '#e0e8f0', marginBottom: 10 }} />
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Form {activeTab.toUpperCase()} dalam pengembangan</div>
            </div>
          )}

          {activeTab === 'sap' && (
            <div>
              <FormGroup label="Satuan Acara Perkuliahan (16 Minggu)">
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  SAP akan di-generate otomatis dari CPMK dan Bahan Kajian yang sudah diisi.
                </div>
              </FormGroup>
            </div>
          )}
        </div>

        {/* Generate button (bottom) */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
          <button style={{
            width: '100%', padding: '10px',
            background: '#1a1a1a', color: 'white',
            border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span>✦</span> Generate Deskripsi
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PANEL 2 — PREVIEW (tengah)   w=flex
      ══════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        minWidth: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #e0e8f0',
        background: '#f8fafc',
      }}>
        {/* Header strip */}
        <div style={{
          height: 10, background: activeTabObj.accent, flexShrink: 0,
        }} />

        {/* Preview header */}
        <div style={{
          padding: '10px 20px',
          borderBottom: '1px solid #e0e8f0',
          background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>Preview</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{selectedMk?.kode_mk || 'Pilih MK'}</span>
        </div>

        {/* Preview content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <PreviewPanel activeTab={activeTab} formData={formData} mk={selectedMk} />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PANEL 3 — DISKUSI AI   w=426
      ══════════════════════════════════════════ */}
      <div style={{
        width: 426,
        flexShrink: 0,
        height: '100vh',
        background: '#f8fafc',
        borderRight: '1px solid #e0e8f0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header strip */}
        <div style={{ height: 10, background: '#7c3aed', flexShrink: 0 }} />

        {/* Chat header */}
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid #e0e8f0',
          background: 'white',
          flexShrink: 0,
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
              fontSize: 10, fontWeight: 600, background: '#dcfce7', color: '#16a34a',
              padding: '2px 8px', borderRadius: 20,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
              Siap
            </span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {chatMessages.map((msg, i) => (
            <ChatBubble key={i} {...msg} />
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Quick prompts */}
        <div style={{ padding: '0 16px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
          {['Cek keselarasan CPL', 'Periksa level kognitif', 'Cari kesenjangan'].map(p => (
            <button key={p} onClick={() => setChatInput(p)} style={{
              fontSize: 10, padding: '4px 12px', borderRadius: 20,
              background: 'white', border: '1px solid #e0e8f0',
              cursor: 'pointer', color: '#475569',
            }}>{p}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid #e0e8f0',
          background: 'white',
          display: 'flex', gap: 8, alignItems: 'flex-end',
          flexShrink: 0,
        }}>
          <textarea
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanyakan keterkaitan, relevansi, atau akurasi…"
            rows={2}
            style={{
              flex: 1, border: '1px solid #e0e8f0', borderRadius: 10,
              padding: '8px 10px', fontSize: 12, resize: 'none',
              outline: 'none', background: '#f8fafc', lineHeight: 1.5,
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={sendChat}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: chatInput.trim() ? '#1a1a1a' : '#e0e8f0',
              border: 'none', cursor: chatInput.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: chatInput.trim() ? 'white' : '#94a3b8', fontSize: 16, lineHeight: 1 }}>↑</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PANEL 4 — PANEL MK / RIGHT SIDEBAR   w=372
      ══════════════════════════════════════════ */}
      <div style={{
        width: 372,
        flexShrink: 0,
        height: '100vh',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        marginRight: 'var(--rail-width, 44px)',
        transition: 'margin-right 0.2s ease',
        borderLeft: '1px solid #e0e8f0',
        overflowY: 'auto',
      }}>
        {/* User header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid #e0e8f0',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {user?.nama ? user.nama.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{user?.nama || 'Nama User'}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{user?.peran || 'Peran'}</div>
          </div>
        </div>

        {/* Sidebar controls */}
        <div style={{ padding: '14px 16px', flex: 1 }}>

          {/* Periode */}
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Periode</label>
            <select style={selectStyle}>
              {versiList.length > 0
                ? versiList.map(v => <option key={v.id} value={v.id}>{v.nama}</option>)
                : <option>Periode 2023–2028</option>
              }
            </select>
          </div>

          {/* Jenjang Studi */}
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Jenjang Studi</label>
            <select style={selectStyle} value={jenjang} onChange={e => { setJenjang(e.target.value); loadMKList(e.target.value); }}>
              <option value="S1">Sarjana</option>
              <option value="PPAr">PPAr</option>
              <option value="S2">Magister</option>
              <option value="S3">Doktor</option>
            </select>
          </div>

          {/* Kode & Nama MK */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Kode &amp; Nama Mata Kuliah</label>
            <select
              style={selectStyle}
              value={selectedMkId}
              onChange={e => handleMkChange(e.target.value)}
            >
              <option value="">— Pilih Mata Kuliah —</option>
              {mkList.map(mk => (
                <option key={mk.id} value={mk.id}>{mk.kode_mk} – {mk.nama_mk}</option>
              ))}
            </select>
          </div>

          {/* Buat Dokumen CTA — full width blue */}
          <button
            disabled={!selectedMkId}
            style={{
              width: '100%', padding: '9px',
              background: selectedMkId ? 'var(--color-primary)' : '#e0e8f0',
              color: selectedMkId ? 'white' : '#94a3b8',
              border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 700,
              cursor: selectedMkId ? 'pointer' : 'not-allowed',
              marginBottom: 14,
            }}
          >Buat Dokumen</button>

          <div style={{ height: 1, background: '#f0f4f8', marginBottom: 14 }} />

          {/* Rantai Generator */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              Rantai Generator
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {RANTAI.map((r, i) => (
                <div key={r.step}>
                  {/* Step row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 36 }}>
                    {/* Circle + vertical line column */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: r.color, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                      }}>{r.step}</div>
                    </div>
                    <span style={{ fontSize: 12, flex: 1, color: '#1a1a1a' }}>{r.label}</span>
                    <span style={{
                      fontSize: 10, background: '#f1f5f9', color: '#94a3b8',
                      padding: '1px 8px', borderRadius: 20, fontWeight: 600,
                    }}>Draft</span>
                  </div>
                  {/* Connector line between steps */}
                  {i < RANTAI.length - 1 && (
                    <div style={{ display: 'flex', paddingLeft: 11 }}>
                      <div style={{ width: 2, height: 10, background: '#e0e8f0' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: '#f0f4f8', marginBottom: 14 }} />

          {/* MK yang Sudah Dibuat */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              MK yang Sudah Dibuat
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {dokList.length === 0 ? (
                <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Belum ada dokumen</div>
              ) : dokList.slice(0, 6).map(d => (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 2px', minHeight: 26,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 11, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {d.master_mata_kuliah?.kode_mk} – {d.master_mata_kuliah?.nama_mk}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/form/${d.id}`)}
                    style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 6,
                      background: '#fef3c7', color: '#c2410c',
                      border: 'none', cursor: 'pointer', fontWeight: 600, flexShrink: 0,
                    }}
                  >Edit</button>
                </div>
              ))}
            </div>
          </div>

          {/* Lihat sebagai Node */}
          <button
            onClick={() => navigate('/node')}
            style={{
              width: '100%', padding: '8px',
              background: 'white', border: '1px solid #e0e8f0',
              borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#475569',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginBottom: 14,
            }}
          >
            <Icon name="hub" size={13} /> Lihat hasil sebagai Node →
          </button>

          {/* Minimap placeholder */}
          <div style={{
            height: 112,
            background: '#f8fafc',
            border: '1px solid #e0e8f0',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 4,
          }}>
            <Icon name="map" size={20} style={{ color: '#d0d8e4' }} />
            <span style={{ fontSize: 10, color: '#94a3b8' }}>Minimap</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '7px 10px',
  border: '1px solid #e0e8f0',
  borderRadius: 7,
  fontSize: 12,
  outline: 'none',
  background: '#f8fafc',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  resize: 'vertical',
};

const selectStyle = {
  width: '100%',
  padding: '7px 10px',
  border: '1px solid #e0e8f0',
  borderRadius: 7,
  fontSize: 12,
  outline: 'none',
  background: '#f8fafc',
  cursor: 'pointer',
  appearance: 'auto',
  fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block',
  fontSize: 10,
  fontWeight: 700,
  color: '#94a3b8',
  letterSpacing: 1,
  textTransform: 'uppercase',
  marginBottom: 6,
};

function FormGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}
