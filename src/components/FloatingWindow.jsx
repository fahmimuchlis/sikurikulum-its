import React, { useState, useRef, useEffect, useCallback } from 'react';

let zTop = 50;
const MIN_W = 320, MIN_H = 240;

function loadRect(id) {
  try { return JSON.parse(localStorage.getItem('fw:' + id)); } catch { return null; }
}
function clampRect(r) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = Math.min(Math.max(r.w, MIN_W), vw - 20);
  const h = Math.min(Math.max(r.h, MIN_H), vh - 20);
  return {
    w, h,
    x: Math.min(Math.max(r.x, 0), vw - Math.min(w, 120)),   // sisakan sebagian window tetap terlihat
    y: Math.min(Math.max(r.y, 0), vh - 40),
  };
}

/**
 * Window mengambang: geser lewat elemen ber-atribut data-drag-handle,
 * ubah ukuran lewat sudut kanan-bawah, klik untuk membawa ke depan.
 * Posisi & ukuran disimpan di localStorage per id.
 */
export default function FloatingWindow({ id, defaultRect, style, children }) {
  const [rect, setRect] = useState(() => clampRect(loadRect(id) || defaultRect()));
  const [z, setZ] = useState(() => ++zTop);
  const drag = useRef(null);

  const front = () => setZ(++zTop);

  useEffect(() => {
    try { localStorage.setItem('fw:' + id, JSON.stringify(rect)); } catch { /* abaikan */ }
  }, [id, rect]);

  useEffect(() => {
    const onResize = () => setRect(r => clampRect(r));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onMove = useCallback((e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.px, dy = e.clientY - d.py;
    setRect(clampRect(d.mode === 'move'
      ? { ...d.start, x: d.start.x + dx, y: d.start.y + dy }
      : { ...d.start, w: d.start.w + dx, h: d.start.h + dy }));
  }, []);

  const onUp = useCallback(() => {
    drag.current = null;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    document.body.style.userSelect = '';
  }, [onMove]);

  const begin = (mode) => (e) => {
    drag.current = { mode, px: e.clientX, py: e.clientY, start: rect };
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onPointerDown = (e) => {
    front();
    const handle = e.target.closest('[data-drag-handle]');
    if (handle && !e.target.closest('button, input, textarea, select')) begin('move')(e);
  };

  useEffect(() => onUp, [onUp]);

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: 'fixed', left: rect.x, top: rect.y, width: rect.w, height: rect.h,
        zIndex: z, display: 'flex', flexDirection: 'column',
        border: '1px solid #c9d3db', borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(20,40,60,0.18)',
        ...style,
      }}
    >
      {children}
      <div
        onPointerDown={(e) => { e.stopPropagation(); front(); begin('resize')(e); }}
        title="Ubah ukuran"
        style={{
          position: 'absolute', right: 0, bottom: 0, width: 18, height: 18,
          cursor: 'nwse-resize',
          background: 'linear-gradient(135deg, transparent 55%, #9aa5ad 55%, #9aa5ad 62%, transparent 62%, transparent 74%, #9aa5ad 74%, #9aa5ad 81%, transparent 81%)',
        }}
      />
    </div>
  );
}
