import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Icon from '../components/Icon';

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'deskripsi', label: 'Deskripsi', color: '#f8b4c8' },
  { id: 'bk',        label: 'BK',        color: '#fde68a' },
  { id: 'cpmk',      label: 'CPMK',      color: '#a7f3d0' },
  { id: 'sub',       label: 'Sub',        color: '#bfdbfe' },
  { id: 'eval',      label: 'Eval',       color: '#ddd6fe' },
  { id: 'tugas',     label: 'Tugas',      color: '#fed7aa' },
  { id: 'sap',       label: 'SAP',        color: '#e0e7ff' },
];

const RANTAI = [
  { step: 1, label: 'Diskusi',   color: '#f97316' },
  { step: 2, label: 'Bahan Kajian', color: '#eab308' },
  { step: 3, label: 'CPMK',     color: '#22c55e' },
  { step: 4, label: 'Sub-CPMK', color: '#3b82f6' },
  { step: 5, label: 'RAE',      color: '#a855f7' },
  { step: 6, label: 'RT',       color: '#6366f1' },
];

// ── Highlight BK keywords in text (reserved for future inline highlight feature) ──

// ── AI Chat Bubble ─────────────────────────────────────────────────────────────
function ChatBubble({ role, text, sources, actions, analysis }) {
  const isAssistant = role === 'assistant';
  return (
    <div style={{ marginBottom: 14 }}>
      {isAssistant && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="smart_toy" size={14} style={{ color: 'white' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a' }}>Asisten Kurikulum</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>Agen AI · RAG buku Bloom-Anderson</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 20 }}>
            ● Siap
          </span>
        </div>
      )}

      {/* Sources RAG */}
      {sources && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Sumber pengetahuan (RAG)</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {sources.map((s, i) => (
              <span key={i} style={{ fontSize: 10, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 20, padding: '2px 10px', color: '#475569' }}>{s}</span>
            ))}
            <button style={{ fontSize: 10, background: 'none', border: '1px dashed #94a3b8', borderRadius: 20, padding: '2px 10px', color: '#94a3b8', cursor: 'pointer' }}>
              + Tambah
            </button>
          </div>
        </div>
      )}

      {/* Context aktif */}
      {isAssistant && analysis?.context && (
        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 8 }}>
          Konteks aktif<br />
          <span style={{ color: '#475569', fontWeight: 500 }}>{analysis.context}</span>
        </div>
      )}

      {/* Bubble */}
      <div style={{
        background: isAssistant ? 'white' : 'var(--color-primary)',
        color: isAssistant ? '#1a1a1a' : 'white',
        border: isAssistant ? '1px solid #e2e8f0' : 'none',
        borderRadius: isAssistant ? '0 12px 12px 12px' : '12px 0 12px 12px',
        padding: '10px 14px',
        fontSize: 12,
        lineHeight: 1.6,
        maxWidth: '90%',
        marginLeft: isAssistant ? 0 : 'auto',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {text}
      </div>

      {/* Analysis grid */}
      {analysis?.items && (
        <div style={{ marginTop: 8, background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
          {analysis.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#475569' }}>{item.label}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                background: item.status === 'Tercermin' ? '#dcfce7' : item.status === 'Selaras' ? '#dcfce7' : '#fff3cd',
                color: item.status === 'Tercermin' ? '#16a34a' : item.status === 'Selaras' ? '#16a34a' : '#c2410c',
              }}>{item.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sources list */}
      {analysis?.sources && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Sumber</div>
          {analysis.sources.map((s, i) => (
            <div key={i} style={{ fontSize: 10, background: '#f1f5f9', borderRadius: 6, padding: '4px 8px', marginBottom: 3, color: '#475569' }}>
              [{i + 1}] {s}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {actions && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {actions.map((a, i) => (
            <button key={i} style={{
              fontSize: 11, padding: '5px 12px', borderRadius: 20,
              background: i === 0 ? 'var(--color-primary)' : '#f1f5f9',
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
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Bahasa Indonesia</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{mk?.nama_mk || 'Mata Kuliah'}</span>
            <button style={{ fontSize: 10, background: '#fce4ec', color: '#e91e8c', border: 'none', borderRadius: 20, padding: '2px 10px', cursor: 'pointer' }}>
              ✦ Draf AI
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#333', lineHeight: 1.8 }}>
            {formData.deskripsi_id || (
              <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                Deskripsi mata kuliah dalam Bahasa Indonesia akan muncul di sini setelah diisi atau di-generate oleh AI…
              </span>
            )}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Bahasa Inggris</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{mk?.nama_mk_en || mk?.nama_mk || 'Course Name'}</span>
            <button style={{ fontSize: 10, background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: 20, padding: '2px 10px', cursor: 'pointer' }}>
              ✦ Terjemahan
            </button>
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
  const [dokList, setDokList] = useState([]); // MK yang sudah ada dokumen
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

  // Demo chat messages (placeholder AI, nanti pakai RAG real)
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: 'Apakah deskripsi sudah mencerminkan capaian yang dibebankan pada MK ini?',
      sources: ['Anderson & Krathwohl 2001', 'Bloom 1956'],
      analysis: {
        context: `Deskripsi MK · ${selectedMkId || 'CA234503'} · CPL 1, 2, 4, 6, 9, 10`,
        items: [
          { label: 'CPL 2, 4', status: 'Tercermin' },
          { label: 'CPL 9, 10', status: 'Belum tersurat' },
          { label: 'Metode belajar', status: 'Selaras' },
        ],
        sources: [
          'Anderson & Krathwohl (2001) · Keselarasan tujuan-pembelajaran',
        ],
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

    // Juga ambil yang sudah punya dokumen
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

  return (
    <div style={{ display: 'flex', height: '100vh', paddingRight: 44, overflow: 'hidden', background: '#EDF3F9' }}>

      {/* ══════════════════════════════════════════
          PANEL 1 — FORM (kiri)
      ══════════════════════════════════════════ */}
      <div style={{
        width: 300,
        flexShrink: 0,
        height: '100vh',
        background: 'white',
        borderRight: '1px solid #e0e8f0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 3, padding: '10px 10px 0', borderBottom: '1px solid #f0f0f0', overflowX: 'auto', flexShrink: 0 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '6px 10px', fontSize: 11, fontWeight: 600,
                borderRadius: '6px 6px 0 0',
                border: 'none', cursor: 'pointer',
                background: activeTab === t.id ? t.color : 'transparent',
                color: activeTab === t.id ? '#1a1a1a' : '#94a3b8',
                borderBottom: activeTab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Form body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {/* Meta info */}
          {selectedMk && (
            <div style={{ marginBottom: 14, padding: '8px 10px', background: '#f8fafc', borderRadius: 8, fontSize: 11 }}>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{selectedMk.jenjang}</span>
              <span style={{ color: '#94a3b8' }}> • {selectedMk.sks} SKS</span>
              <span style={{ color: '#94a3b8' }}> • Sem. {selectedMk.semester}</span>
              {selectedMk.kode_mk && <span style={{ color: '#94a3b8' }}> • Prasyarat: —</span>}
            </div>
          )}

          {activeTab === 'deskripsi' && (
            <div>
              <FormGroup label="Pengetahuan & Ketrampilan">
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

              <FormGroup label="Sikap & Metode Pembelajaran">
                <select style={selectStyle} value={formData.bentuk_penugasan} onChange={e => setFormData(f => ({ ...f, bentuk_penugasan: e.target.value }))}>
                  <option value="">Bentuk Penugasan</option>
                  <option>Kritik Studio</option>
                  <option>Portofolio</option>
                  <option>Ujian Tulis</option>
                  <option>Tugas Terstruktur</option>
                  <option>Presentasi</option>
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <select style={{ ...selectStyle, flex: 1 }} value={formData.metode} onChange={e => setFormData(f => ({ ...f, metode: e.target.value }))}>
                    <option value="">Metode Pembelajaran</option>
                    <option>Kuliah</option>
                    <option>Diskusi</option>
                    <option>Studio</option>
                    <option>Studi Kasus</option>
                    <option>Presentasi</option>
                  </select>
                  <button style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', fontSize: 16 }}>+</button>
                </div>
              </FormGroup>

              {/* Kata highlight legend */}
              <FormGroup label={`Rangkaian kalimat · ${selectedMk?.kode_mk || 'CA234503'}`}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ fontSize: 9, background: '#bbf7d0', padding: '1px 6px', borderRadius: 3 }}>Pengetahuan</span>
                  <span style={{ fontSize: 9, background: '#fef08a', padding: '1px 6px', borderRadius: 3 }}>Kelompok BK</span>
                  <span style={{ fontSize: 9, background: '#bbf7d0', padding: '1px 6px', borderRadius: 3 }}>+ Tambahan</span>
                  <span style={{ fontSize: 9, background: '#e9d5ff', padding: '1px 6px', borderRadius: 3 }}>Sikap & metode</span>
                  <span style={{ fontSize: 9, background: '#fce7f3', padding: '1px 6px', borderRadius: 3 }}>Penghubung (AI)</span>
                </div>
                <textarea
                  style={{ ...inputStyle, minHeight: 100, fontSize: 12, lineHeight: 1.7 }}
                  placeholder="Deskripsi mata kuliah (Bahasa Indonesia)..."
                  value={formData.deskripsi_id}
                  onChange={e => setFormData(f => ({ ...f, deskripsi_id: e.target.value }))}
                />
                {formData.deskripsi_id && (
                  <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 4 }}>● Draf · deskripsi siap disimpan</div>
                )}
              </FormGroup>

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
                >
                  + Tambah Bahan Kajian
                </button>
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
                >
                  + Tambah CPMK
                </button>
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

        {/* Save button */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
          <button style={{
            width: '100%', padding: '10px', background: '#1a1a1a', color: 'white',
            border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            Simpan
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PANEL 2 — PREVIEW (tengah)
      ══════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        minWidth: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #e0e8f0',
      }}>
        {/* Preview header */}
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid #e0e8f0',
          background: 'rgba(255,255,255,0.9)',
          display: 'flex', alignItems: 'center', gap: 8,
          flexShrink: 0,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#333', marginLeft: 4 }}>Preview</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>— {selectedMk?.kode_mk || 'Pilih MK'}</span>
        </div>

        {/* Preview content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: 'white' }}>
          <PreviewPanel activeTab={activeTab} formData={formData} mk={selectedMk} />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PANEL 3 — DISKUSI AI (kanan-tengah)
      ══════════════════════════════════════════ */}
      <div style={{
        width: 340,
        flexShrink: 0,
        height: '100vh',
        background: '#f8fafc',
        borderRight: '1px solid #e0e8f0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Chat header */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid #e0e8f0',
          background: 'white',
          display: 'flex', alignItems: 'center', gap: 8,
          flexShrink: 0,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#333', marginLeft: 4 }}>Diskusi AI</span>
          <span style={{ fontSize: 10, background: '#fce4ec', color: '#e91e8c', padding: '1px 8px', borderRadius: 20, fontWeight: 600, marginLeft: 'auto' }}>
            ✦ RAG · Placeholder
          </span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
          {chatMessages.map((msg, i) => (
            <ChatBubble key={i} {...msg} />
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Quick prompts */}
        <div style={{ padding: '0 14px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
          {['Cek keselarasan CPL', 'Periksa level kognitif', 'Cari kesenjangan'].map(p => (
            <button key={p} onClick={() => setChatInput(p)} style={{
              fontSize: 10, padding: '4px 10px', borderRadius: 20,
              background: 'white', border: '1px solid #e0e8f0',
              cursor: 'pointer', color: '#475569',
            }}>{p}</button>
          ))}
        </div>

        {/* Input */}
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid #e0e8f0',
          background: 'white',
          display: 'flex', gap: 8, alignItems: 'flex-end',
          flexShrink: 0,
        }}>
          <textarea
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanyakan keterkaitan, relevansi, atau akurasi..."
            rows={2}
            style={{
              flex: 1, border: '1px solid #e0e8f0', borderRadius: 10,
              padding: '8px 10px', fontSize: 12, resize: 'none',
              outline: 'none', background: '#f8fafc', lineHeight: 1.5,
            }}
          />
          <button
            onClick={sendChat}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: chatInput.trim() ? 'var(--color-primary)' : '#e0e8f0',
              border: 'none', cursor: chatInput.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="send" size={16} style={{ color: chatInput.trim() ? 'white' : '#94a3b8' }} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PANEL 4 — RIGHT SIDEBAR
      ══════════════════════════════════════════ */}
      <div style={{
        width: 240,
        flexShrink: 0,
        height: '100vh',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        padding: '14px 14px',
      }}>
        {/* Periode */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Periode</label>
          <select style={selectStyle}>
            {versiList.map(v => <option key={v.id} value={v.id}>{v.nama}</option>)}
          </select>
        </div>

        {/* Jenjang */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Jenjang Studi</label>
          <select style={selectStyle} value={jenjang} onChange={e => { setJenjang(e.target.value); loadMKList(e.target.value); }}>
            <option value="S1">Sarjana</option>
            <option value="PPAr">PPAr</option>
            <option value="S2">Magister</option>
            <option value="S3">Doktor</option>
          </select>
        </div>

        {/* Kode & Nama MK */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Kode & Nama Mata Kuliah</label>
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

        {/* Buat Dokumen */}
        <button
          disabled={!selectedMkId}
          style={{
            width: '100%', padding: '10px', marginBottom: 20,
            background: selectedMkId ? 'var(--color-primary)' : '#e0e8f0',
            color: selectedMkId ? 'white' : '#94a3b8',
            border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: selectedMkId ? 'pointer' : 'not-allowed',
          }}
        >
          Buat Dokumen
        </button>

        <div style={{ height: 1, background: '#f0f4f8', marginBottom: 14 }} />

        {/* Rantai Generator */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Rantai Generator</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {RANTAI.map((r, i) => (
              <div key={r.step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Connector line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: r.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {r.step}
                  </div>
                  {i < RANTAI.length - 1 && <div style={{ width: 2, height: 10, background: '#e0e8f0', margin: '1px 0' }} />}
                </div>
                <span style={{ fontSize: 12, flex: 1 }}>{r.label}</span>
                <span style={{ fontSize: 10, background: '#fff3cd', color: '#c2410c', padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>Draft</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: '#f0f4f8', marginBottom: 14 }} />

        {/* MK yang Sudah Dibuat */}
        <div>
          <label style={labelStyle}>MK yang Sudah Dibuat</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {dokList.length === 0 ? (
              <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Belum ada dokumen</div>
            ) : dokList.slice(0, 6).map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', background: '#f8fafc', borderRadius: 7 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#1a1a1a' }}>{d.master_mata_kuliah?.kode_mk}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.master_mata_kuliah?.nama_mk}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/form/${d.id}`)}
                  style={{
                    fontSize: 10, padding: '3px 8px', borderRadius: 6,
                    background: d.status === 'selesai' ? '#dcfce7' : '#fff3e0',
                    color: d.status === 'selesai' ? '#16a34a' : '#c2410c',
                    border: 'none', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Lihat sebagai Node */}
        <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #f0f4f8' }}>
          <button
            onClick={() => navigate('/node')}
            style={{
              width: '100%', padding: '9px', background: '#f8fafc',
              border: '1px solid #e0e8f0', borderRadius: 10,
              fontSize: 12, fontWeight: 600, color: '#475569',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Icon name="hub" size={14} /> Lihat hasil sebagai Node →
          </button>
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
