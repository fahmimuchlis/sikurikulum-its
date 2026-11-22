/**
 * FormLayout — 3-panel layout sesuai slide referensi:
 * Kiri: Form wizard (resizable, putih)
 * Tengah: Preview (2 textarea besar)
 * Kanan: Node canvas (terang #f0f0f0)
 */
import React, { useState } from 'react';

// ── Tab colors sesuai slide (pastel/salmon) ───────────────────────────────────
const TAB_COLORS = [
  { bg: '#f48fb1', text: 'white' },       // Deskripsi — pink-salmon
  { bg: '#ef9a9a', text: 'white' },       // CPL — salmon-red
  { bg: '#ffab91', text: 'white' },       // CPMK — peach-orange
  { bg: '#ffcc80', text: '#5d4037' },     // BK — amber
  { bg: '#80deea', text: '#006064' },     // SAP — cyan-teal
  { bg: '#a5d6a7', text: '#1b5e20' },     // Done — hijau muda
];

// ── Tooltip ──────────────────────────────────────────────────────────────────
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
          <a href={`/dokumen/${silabusId}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#1d4ed8', textDecoration: 'none', padding: '5px 12px', border: '1px solid #bfdbfe', borderRadius: 6, background: '#eff6ff' }}>
            🔗 Tab Baru
          </a>
        </MacTitlebar>
        <iframe src={`/dokumen/${silabusId}`} style={{ flex: 1, border: 'none', background: '#f8fafc' }} title="Pratinjau Dokumen" />
      </div>
    </div>
  );
}

function MacTitlebar({ title, onClose, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', flexShrink: 0, background: '#f8fafc' }}>
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

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
const panelStyle = { background: 'white', borderRadius: 14, padding: '20px 24px', width: '95vw', maxWidth: 600, maxHeight: '90vh', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' };
const closeBtnStyle = { background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: '#475569', fontWeight: 500 };

// ── Pill Tab Bar (sesuai slide — warna salmon/pastel) ─────────────────────────
export function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '8px 10px',
      borderBottom: '1px solid #f0f0f0',
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
              padding: '3px 10px',
              border: 'none',
              borderRadius: 20,
              background: isActive ? color.bg : '#f5f5f5',
              color: isActive ? color.text : '#aaa',
              fontWeight: isActive ? 600 : 500,
              fontSize: 11,
              cursor: 'pointer',
              transition: 'all 0.15s',
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

// ── Drag handle ───────────────────────────────────────────────────────────────
function DragHandle({ onMouseDown }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 6, flexShrink: 0,
        cursor: 'col-resize',
        background: hovered ? 'rgba(233,30,140,0.25)' : '#e8e8e8',
        transition: 'background 0.15s',
        position: 'relative', zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      title="Geser untuk mengubah lebar panel"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: hovered ? '#e91e8c' : '#bbb' }} />
        ))}
      </div>
    </div>
  );
}

// ── Main FormLayout ───────────────────────────────────────────────────────────
export default function FormLayout({ children, silabusId, canvasProps, tabs, activeTab, onTabChange }) {
  const [showPreview, setShowPreview] = useState(false);
  const [formWidth, setFormWidth] = useState(300);
  const [KurikulumCanvas, setKurikulumCanvas] = React.useState(null);

  // Lazy load canvas
  React.useEffect(() => {
    import('./KurikulumCanvas').then(m => setKurikulumCanvas(() => m.default));
  }, []);

  // Drag panel kiri
  const onFormDragStart = React.useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = formWidth;
    const onMove = (ev) => {
      const newW = Math.max(220, Math.min(600, startW + (ev.clientX - startX)));
      setFormWidth(newW);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [formWidth]);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 44px)', overflow: 'hidden', background: '#f5f5f5' }}>

      {/* ── Panel Kiri: Form Wizard ── */}
      <div style={{
        width: formWidth, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: 'white',
        zIndex: 10, minWidth: 0,
      }}>
        {/* Tab pills */}
        {tabs && tabs.length > 0 && (
          <TabBar tabs={tabs} activeTab={activeTab || 0} onTabChange={onTabChange} />
        )}
        {/* Scroll area */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
          {children}
        </div>
      </div>

      {/* ── Drag handle ── */}
      <DragHandle onMouseDown={onFormDragStart} />

      {/* ── Panel Kanan: Canvas (terang) — mengisi sisa ruang ── */}
      <div style={{
        flex: 1,
        position: 'relative', overflow: 'hidden',
        background: '#f0f0f0',
        borderLeft: '1px solid #e0e0e0',
        minWidth: 0,
      }}>
        {/* Tombol pratinjau dokumen */}
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 5,
          display: 'flex', gap: 6,
        }}>
          <button
            onClick={() => setShowPreview(true)}
            style={{
              background: 'white', border: '1px solid #d0d0d0',
              borderRadius: 20, padding: '4px 12px',
              fontSize: 11, color: '#555', cursor: 'pointer', fontWeight: 500,
            }}
            title="Pratinjau dokumen lengkap"
          >
            📄 Pratinjau
          </button>
        </div>

        {KurikulumCanvas && canvasProps ? (
          <KurikulumCanvas {...canvasProps} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', fontSize: 13 }}>
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
