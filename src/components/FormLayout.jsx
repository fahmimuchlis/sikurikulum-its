/**
 * FormLayout — 3-panel layout sesuai desain slide:
 * Kiri: Form wizard (280px, putih)
 * Tengah: Preview text area (flex)
 * Kanan: Node canvas (expandable)
 */
import React, { useState } from 'react';

// ── Tab colors (pill tabs di atas form) ──────────────────────────────────────
const TAB_COLORS = [
  { bg: '#f472b6', text: 'white' }, // MK — pink
  { bg: '#a78bfa', text: 'white' }, // Des — violet
  { bg: '#34d399', text: 'white' }, // CPL — green
  { bg: '#fb923c', text: 'white' }, // CPMK — orange
  { bg: '#f87171', text: 'white' }, // BK — red
  { bg: '#60a5fa', text: 'white' }, // SAP — blue
  { bg: '#a3e635', text: '#365314' }, // Done — lime
];

// ── Tooltip komponen ─────────────────────────────────────────────────────────
export function SectionTooltip({ title, children, hint }) {
  const [show, setShow] = useState(false);
  const timer = React.useRef(null);
  const onEnter = () => { timer.current = setTimeout(() => setShow(true), 400); };
  const onLeave = () => { clearTimeout(timer.current); setShow(false); };
  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <div onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ cursor: 'default', width: '100%' }}>
        {children}
      </div>
      {show && hint && (
        <div style={{
          position: 'absolute', left: 'calc(100% + 10px)', top: 0, zIndex: 9999,
          width: 260, padding: '12px 14px',
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b', marginBottom: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
            💡 {title}
          </div>
          <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.7 }}>{hint}</div>
        </div>
      )}
    </div>
  );
}

// ── Preview overlay ───────────────────────────────────────────────────────────
function PreviewOverlay({ silabusId, onClose }) {
  if (!silabusId) {
    return (
      <div style={overlayStyle}>
        <div style={panelStyle}>
          <MacTitlebar title="Pratinjau Dokumen" onClose={onClose} />
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px 0', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
            Simpan draf terlebih dahulu untuk melihat pratinjau.
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...panelStyle, width: '90vw', maxWidth: 1100, height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <MacTitlebar title="Pratinjau Dokumen" onClose={onClose}>
          <a
            href={`/dokumen/${silabusId}`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#1d4ed8', textDecoration: 'none', padding: '5px 12px', border: '1px solid #bfdbfe', borderRadius: 6, background: '#eff6ff' }}
          >
            🔗 Tab Baru
          </a>
        </MacTitlebar>
        <iframe
          src={`/dokumen/${silabusId}`}
          style={{ flex: 1, border: 'none', background: '#f8fafc' }}
          title="Pratinjau Dokumen"
        />
      </div>
    </div>
  );
}

function MacTitlebar({ title, onClose, children }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 16px', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
      background: '#f8fafc',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
        <span style={{ fontWeight: 700, fontSize: 12, color: '#1e293b', marginLeft: 8 }}>📄 {title}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {children}
        <button onClick={onClose} style={closeBtnStyle}>✕ Tutup</button>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
  zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(4px)',
};
const panelStyle = {
  background: 'white', borderRadius: 14, padding: '20px 24px',
  width: '95vw', maxWidth: 600, maxHeight: '90vh',
  boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
};
const closeBtnStyle = {
  background: '#f1f5f9', border: 'none', borderRadius: 6,
  padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: '#475569',
  fontWeight: 500,
};

// ── Pill Tab Bar (sesuai slide — warna-warni horizontal) ─────────────────────
export function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '8px 12px',
      borderBottom: '1px solid #f1f5f9',
      overflowX: 'auto', flexShrink: 0,
      scrollbarWidth: 'none',
    }}>
      {tabs.map((tab, i) => {
        const color = TAB_COLORS[i % TAB_COLORS.length];
        const isActive = activeTab === i;
        return (
          <button
            key={i}
            onClick={() => onTabChange(i)}
            title={tab.label}
            style={{
              flexShrink: 0,
              padding: '4px 10px',
              border: 'none',
              borderRadius: 20,
              background: isActive ? color.bg : '#f1f5f9',
              color: isActive ? color.text : '#94a3b8',
              fontWeight: isActive ? 700 : 500,
              fontSize: 11,
              cursor: 'pointer',
              transition: 'all 0.15s',
              letterSpacing: 0.1,
              whiteSpace: 'nowrap',
            }}
          >
            {tab.short || tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main FormLayout ───────────────────────────────────────────────────────────
export default function FormLayout({ children, silabusId, canvasProps, tabs, activeTab, onTabChange }) {
  const [showPreview, setShowPreview] = useState(false);
  const [canvasExpanded, setCanvasExpanded] = useState(false);
  const [KurikulumCanvas, setKurikulumCanvas] = React.useState(null);

  // Lazy load canvas
  React.useEffect(() => {
    import('./KurikulumCanvas').then(m => setKurikulumCanvas(() => m.default));
  }, []);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden', background: '#f8f9fb' }}>

      {/* ── Panel Kiri: Form Wizard ── */}
      <div style={{
        width: 282, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: 'white',
        borderRight: '1px solid #e8eaed',
        boxShadow: '2px 0 6px rgba(0,0,0,0.04)',
        zIndex: 10,
      }}>
        {/* Tab pills */}
        {tabs && tabs.length > 0 && (
          <TabBar tabs={tabs} activeTab={activeTab || 0} onTabChange={onTabChange} />
        )}

        {/* Scroll area untuk form */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
          {children}
        </div>
      </div>

      {/* ── Panel Tengah: Preview + tombol ── */}
      {!canvasExpanded && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: '#f8f9fb', borderRight: '1px solid #e8eaed',
          minWidth: 0,
        }}>
          {/* Header preview */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '8px 16px', borderBottom: '1px solid #e8eaed',
            background: 'white', flexShrink: 0,
            gap: 10,
          }}>
            <button
              onClick={() => setShowPreview(true)}
              style={{
                background: 'white', color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: 6, padding: '4px 14px',
                fontSize: 12, cursor: 'pointer', fontWeight: 600,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              👁 Preview
            </button>
            <span style={{
              fontSize: 12, fontWeight: 700, color: '#374151',
              letterSpacing: 0.5,
            }}>Preview</span>
            <button
              onClick={() => setCanvasExpanded(true)}
              title="Perbesar canvas"
              style={{
                background: 'white', color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: 6, padding: '4px 10px',
                fontSize: 12, cursor: 'pointer',
              }}
            >
              ⊞ Perluas Canvas
            </button>
          </div>

          {/* Preview area — dua textarea */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {canvasProps?.mkDipilih && (
              <>
                {/* Info MK */}
                <div style={{
                  background: 'white', borderRadius: 8,
                  border: '1px solid #e8eaed',
                  padding: '10px 14px', fontSize: 12,
                }}>
                  <div style={{ fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                    {canvasProps.mkDipilih.kode_mk} — {canvasProps.mkDipilih.nama_mk}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 11 }}>
                    {canvasProps.mkDipilih.jenis_mk && `${canvasProps.mkDipilih.jenis_mk} • `}
                    {canvasProps.mkDipilih.sks} SKS • Sem. {canvasProps.mkDipilih.semester} • {canvasProps.mkDipilih.jenjang}
                  </div>
                </div>

                {/* Textarea Indonesia */}
                <div style={{
                  background: 'white', borderRadius: 8,
                  border: '1px solid #e8eaed', overflow: 'hidden', flex: 1,
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 11, color: '#9ca3af', background: '#fafafa' }}>
                    Bahasa Indonesia
                  </div>
                  <div style={{ padding: '10px 12px', fontSize: 12, color: '#374151', lineHeight: 1.6, minHeight: 120 }}>
                    {canvasProps.desMk?.deskripsi_tambahan || <span style={{ color: '#d1d5db' }}>Deskripsi MK dalam Bahasa Indonesia akan muncul di sini…</span>}
                  </div>
                </div>

                {/* Textarea English */}
                <div style={{
                  background: 'white', borderRadius: 8,
                  border: '1px solid #e8eaed', overflow: 'hidden', flex: 1,
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 11, color: '#9ca3af', background: '#fafafa' }}>
                    English
                  </div>
                  <div style={{ padding: '10px 12px', fontSize: 12, color: '#374151', lineHeight: 1.6, minHeight: 120 }}>
                    {canvasProps.deskripsiEn || <span style={{ color: '#d1d5db' }}>English description will appear here…</span>}
                  </div>
                </div>
              </>
            )}

            {!canvasProps?.mkDipilih && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 8, color: '#d1d5db' }}>
                <div style={{ fontSize: 32 }}>📋</div>
                <div style={{ fontSize: 12 }}>Pilih mata kuliah untuk melihat pratinjau</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Panel Kanan: Canvas ── */}
      <div style={{
        flex: canvasExpanded ? 1 : '0 0 auto',
        width: canvasExpanded ? undefined : 420,
        position: 'relative', overflow: 'hidden',
        background: '#1a1f2e',
        transition: 'width 0.3s ease',
      }}>
        {/* Canvas header */}
        <div style={{
          position: 'absolute', top: 10, left: 10, right: 10, zIndex: 5,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 20, padding: '4px 12px',
            fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600,
          }}>
            🗺 Peta Kurikulum
          </div>
          <button
            onClick={() => setCanvasExpanded(v => !v)}
            style={{
              marginLeft: 'auto',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6, padding: '4px 10px',
              fontSize: 11, color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            {canvasExpanded ? '⊟ Kecilkan' : '⊞ Perbesar'}
          </button>
        </div>

        {KurikulumCanvas && canvasProps ? (
          <KurikulumCanvas {...canvasProps} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#4b5563', fontSize: 13 }}>
            Memuat peta…
          </div>
        )}
      </div>

      {/* ── Preview overlay ── */}
      {showPreview && (
        <PreviewOverlay silabusId={silabusId} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}
