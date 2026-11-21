/**
 * KurikulumCanvas — live node-graph sesuai visual slide referensi.
 * Layout: MK di kiri-tengah → branch ke kanan (CPL, Bahan Kajian, CPMK → Sub-CPMK)
 * Warna: gelap (slate/teal/green) sesuai slide.
 */
import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Position,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ── Design tokens (dari slide) ────────────────────────────────────────────────
const C = {
  mk:      { bg: '#1e293b', border: '#475569', text: '#f1f5f9', sub: '#94a3b8' },
  des:     { bg: '#6d28d9', border: '#7c3aed', text: 'white',   sub: '#c4b5fd' },
  cpl:     { bg: '#374151', border: '#6b7280', text: '#f9fafb', sub: '#d1d5db', row: '#4b5563', badge: '#1f2937' },
  bk:      { bg: '#0f766e', border: '#14b8a6', text: 'white',   sub: '#99f6e4', row: '#0d9488', badge: '#064e3b' },
  cpmk:    { bg: '#166534', border: '#22c55e', text: 'white',   sub: '#86efac', row: '#15803d', badge: '#14532d' },
  sub:     { bg: '#bbf7d0', border: '#86efac', text: '#14532d', header: '#86efac', badge: '#16a34a' },
  relasi:  { bg: '#64748b', border: '#94a3b8', text: 'white' },
};

const NODE_W = 180;
const ROW_H = 26;
const HEADER_H = 32;

// ── Handle helper ─────────────────────────────────────────────────────────────
function Handles({ left = true, right = true }) {
  return (
    <>
      {left  && <Handle type="target" position={Position.Left}  style={{ background: 'transparent', border: 'none', width: 0, height: 0 }} />}
      {right && <Handle type="source" position={Position.Right} style={{ background: 'transparent', border: 'none', width: 0, height: 0 }} />}
    </>
  );
}

// ── Badge bulat ───────────────────────────────────────────────────────────────
function Badge({ n, bg = '#1f2937', color = 'white', size = 20 }) {
  return (
    <span style={{
      background: bg, color, borderRadius: '50%',
      width: size, height: size, display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.5, fontWeight: 700, flexShrink: 0,
    }}>{n}</span>
  );
}

// ── MK Node ───────────────────────────────────────────────────────────────────
function MkNode({ data }) {
  return (
    <div style={{
      background: C.mk.bg, border: `2px solid ${C.mk.border}`,
      borderRadius: 10, minWidth: NODE_W, maxWidth: 220, overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontSize: 9, color: C.mk.sub, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 3 }}>
          Mata Kuliah
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.mk.text, lineHeight: 1.3 }}>
          {data.kode}
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, color: C.mk.text, lineHeight: 1.4, marginTop: 2 }}>
          {data.nama}
        </div>
        {data.info && (
          <div style={{ fontSize: 10, color: C.mk.sub, marginTop: 6, padding: '4px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: 5 }}>
            {data.info}
          </div>
        )}
      </div>
      {/* Deskripsi baris bawah */}
      {data.desDot && (
        <div style={{
          borderTop: `1px solid ${C.mk.border}`,
          background: C.des.bg, padding: '6px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, color: 'white', fontWeight: 600 }}>Deskripsi</span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c4b5fd', display: 'inline-block' }} />
        </div>
      )}
      <Handles left={false} right />
    </div>
  );
}

// ── Group Node (CPL / Bahan Kajian / CPMK) ────────────────────────────────────
function GroupNode({ data }) {
  const c = C[data.ck] || C.cpl;
  return (
    <div style={{
      background: c.bg, border: `2px solid ${c.border}`,
      borderRadius: 10, minWidth: NODE_W, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '7px 12px', background: c.bg,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${c.border}60`,
        minHeight: HEADER_H,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{data.label}</span>
        {data.count != null && (
          <span style={{
            background: 'rgba(0,0,0,0.25)', color: c.text,
            borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 600,
          }}>({data.count})</span>
        )}
      </div>
      {/* Rows */}
      {data.items?.map((item, i) => (
        <div key={i} style={{
          padding: '5px 12px',
          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.05)',
          borderBottom: i < data.items.length - 1 ? `1px solid ${c.border}30` : 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          minHeight: ROW_H,
        }}>
          <span style={{ fontSize: 11, color: c.text, flex: 1 }}>{item.label}</span>
          {item.badge != null && <Badge n={item.badge} bg={c.badge || 'rgba(0,0,0,0.3)'} color={c.text} />}
        </div>
      ))}
      <Handles left right />
    </div>
  );
}

// ── Sub-CPMK Node ─────────────────────────────────────────────────────────────
function SubCpmkNode({ data }) {
  return (
    <div style={{
      background: C.sub.bg, border: `2px solid ${C.sub.border}`,
      borderRadius: 10, minWidth: NODE_W, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '6px 12px', background: C.sub.header,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${C.sub.border}`,
        minHeight: HEADER_H,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.sub.text }}>{data.label}</span>
        <Badge n={data.badge} bg={C.sub.badge} color="white" />
      </div>
      {/* Sub rows */}
      {data.items?.map((item, i) => (
        <div key={i} style={{
          padding: '5px 12px',
          background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.04)',
          borderBottom: i < data.items.length - 1 ? `1px solid ${C.sub.border}60` : 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          minHeight: ROW_H,
        }}>
          <span style={{ fontSize: 11, color: C.sub.text, flex: 1 }}>{item.label}</span>
          <Badge n={item.badge} bg={C.sub.badge} color="white" size={18} />
        </div>
      ))}
      <Handles left right={false} />
    </div>
  );
}

// ── Relasi MK antar Semester Node ─────────────────────────────────────────────
function RelasiNode({ data }) {
  return (
    <div style={{
      background: C.relasi.bg, border: `1px solid ${C.relasi.border}`,
      borderRadius: 10, minWidth: 160, overflow: 'hidden',
    }}>
      <div style={{ padding: '7px 12px', borderBottom: `1px solid ${C.relasi.border}60` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.relasi.text }}>Relasi MK antar Semester</span>
      </div>
      {data.groups?.map((g, gi) => (
        <div key={gi}>
          <div style={{ padding: '4px 12px', fontSize: 9, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' }}>{g.label}</div>
          {g.items.map((mk, mi) => (
            <div key={mi} style={{
              margin: '2px 8px', padding: '4px 10px',
              background: '#475569', borderRadius: 6, fontSize: 10, color: '#e2e8f0',
              marginBottom: mi === g.items.length - 1 ? 6 : 2,
            }}>{mk}</div>
          ))}
        </div>
      ))}
      <Handles left right={false} />
    </div>
  );
}

const nodeTypes = { mk: MkNode, group: GroupNode, subCpmk: SubCpmkNode, relasi: RelasiNode };

// ── Layout builder ────────────────────────────────────────────────────────────
function buildGraph({ mkDipilih, cplDipilih, daftarCPL, cpmk, bahanKajian, desMk }) {
  const nodes = [];
  const edges = [];

  const edgeBase = { type: 'smoothstep', style: { strokeWidth: 1.5 } };

  // ── Kolom X ──
  const X_MK    = 40;
  const X_CPL   = 300;
  const X_BK    = 540;
  const X_CPMK  = 540;
  const X_SUB   = 780;
  const X_REL   = 300;  // relasi di bawah CPL

  // ── MK node (y tengah) ──
  const cplItems = daftarCPL.filter(c => cplDipilih.includes(c.id));
  const bkFilled = (bahanKajian || []).filter(Boolean);

  nodes.push({
    id: 'mk', type: 'mk', position: { x: X_MK, y: 160 },
    data: {
      kode: mkDipilih?.kode_mk || 'Kode MK',
      nama: mkDipilih?.nama_mk || 'Nama Mata Kuliah',
      info: mkDipilih
        ? `${mkDipilih.sks||'-'} SKS • Sem. ${mkDipilih.semester||'-'} • ${mkDipilih.jenjang||'-'}`
        : 'Belum dipilih',
      desDot: !!(desMk?.jenis_mk || desMk?.kemampuan),
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });

  // ── CPL node ──
  nodes.push({
    id: 'cpl', type: 'group', position: { x: X_CPL, y: 60 },
    data: {
      ck: 'cpl', label: 'CPL',
      count: cplItems.length,
      items: cplItems.length
        ? cplItems.map(c => ({ label: c.nomor_cpl }))
        : [{ label: '(belum dipilih)' }],
    },
  });
  edges.push({ ...edgeBase, id: 'mk-cpl', source: 'mk', target: 'cpl', style: { ...edgeBase.style, stroke: '#6b7280' } });

  // ── Relasi MK (hanya jika ada info prasyarat — pakai dummy) ──
  nodes.push({
    id: 'relasi', type: 'relasi', position: { x: X_REL, y: 60 + HEADER_H + cplItems.length * ROW_H + 40 },
    data: {
      groups: [
        { label: 'Semester Atas',  items: ['(Sem. atas)'] },
        { label: 'Semester Sama',  items: ['(Sem. sama)', mkDipilih?.kode_mk ? `${mkDipilih.kode_mk} (Sem.${mkDipilih.semester||'-'})` : '(MK ini)'] },
        { label: 'Semester Bawah', items: ['(Prasyarat)'] },
      ],
    },
  });
  edges.push({ ...edgeBase, id: 'mk-rel', source: 'mk', target: 'relasi', style: { ...edgeBase.style, stroke: '#6b7280', strokeDasharray: '5,5' } });

  // ── Bahan Kajian node ──
  const bkY = 60;
  nodes.push({
    id: 'bk', type: 'group', position: { x: X_BK, y: bkY },
    data: {
      ck: 'bk', label: 'Bahan Kajian',
      count: bkFilled.length,
      items: bkFilled.length
        ? bkFilled.map((b, i) => ({ label: b.length > 28 ? b.substring(0, 28) + '…' : b, badge: String.fromCharCode(65 + i) }))
        : [{ label: '(belum diisi)' }],
    },
  });
  edges.push({ ...edgeBase, id: 'mk-bk', source: 'mk', target: 'bk', style: { ...edgeBase.style, stroke: '#14b8a6' } });

  // ── CPMK node ──
  const cpmkY = bkY + HEADER_H + Math.max(bkFilled.length, 1) * ROW_H + 24;
  const cpmkList = cpmk || [];

  nodes.push({
    id: 'cpmk', type: 'group', position: { x: X_CPMK, y: cpmkY },
    data: {
      ck: 'cpmk', label: 'CPMK',
      count: cpmkList.length,
      items: cpmkList.length
        ? cpmkList.map((c, i) => ({ label: c.no || `CPMK ${i+1}`, badge: i + 1 }))
        : [{ label: '(belum diisi)' }],
    },
  });
  edges.push({ ...edgeBase, id: 'cpl-cpmk',  source: 'cpl', target: 'cpmk', style: { ...edgeBase.style, stroke: '#22c55e' } });
  edges.push({ ...edgeBase, id: 'bk-cpmk',   source: 'bk',  target: 'cpmk', style: { ...edgeBase.style, stroke: '#22c55e' } });

  // ── Sub-CPMK nodes (satu per CPMK) ──
  let subCounter = 0;
  let subY = bkY;

  cpmkList.forEach((c, ci) => {
    const kogs = c.sub_cpmk_kog  || [];
    const psis = c.sub_cpmk_psiko || [];
    const afks = c.sub_cpmk_afeksi || [];
    const totalSub = kogs.length + psis.length + afks.length;
    if (totalSub === 0) return;

    const items = [
      ...kogs.map(() => { subCounter++; return { label: `Sub-CPMK ${subCounter}`, badge: subCounter }; }),
      ...psis.map(() => { subCounter++; return { label: `Sub-CPMK ${subCounter}`, badge: subCounter }; }),
      ...afks.map(() => { subCounter++; return { label: `Sub-CPMK ${subCounter}`, badge: subCounter }; }),
    ];

    const nodeId = `sub-${ci}`;
    nodes.push({
      id: nodeId, type: 'subCpmk',
      position: { x: X_SUB, y: subY },
      data: { label: c.no || `CPMK ${ci+1}`, badge: ci + 1, items },
    });
    edges.push({
      ...edgeBase, id: `cpmk-${nodeId}`,
      source: 'cpmk', target: nodeId,
      style: { ...edgeBase.style, stroke: '#86efac' },
    });

    subY += HEADER_H + totalSub * ROW_H + 20;
  });

  return { nodes, edges };
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function KurikulumCanvas({ mkDipilih, cplDipilih, daftarCPL, cpmk, bahanKajian, desMk }) {
  const { nodes, edges } = useMemo(
    () => buildGraph({
      mkDipilih,
      cplDipilih: cplDipilih || [],
      daftarCPL:  daftarCPL  || [],
      cpmk:       cpmk       || [],
      bahanKajian: bahanKajian || [],
      desMk,
    }),
    [mkDipilih, cplDipilih, daftarCPL, cpmk, bahanKajian, desMk]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll
        style={{ background: '#f1f5f9' }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background color="#cbd5e1" gap={20} size={1} variant="dots" />
        <Controls showInteractive={false} position="bottom-right" />
        <MiniMap
          position="bottom-left"
          nodeColor={n => {
            if (n.id === 'mk')    return C.mk.bg;
            if (n.id === 'cpl')   return C.cpl.bg;
            if (n.id === 'bk')    return C.bk.bg;
            if (n.id === 'cpmk')  return C.cpmk.bg;
            if (n.id.startsWith('sub')) return C.sub.badge;
            return C.relasi.bg;
          }}
          style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: 8 }}
          maskColor="rgba(241,245,249,0.7)"
        />
      </ReactFlow>
    </div>
  );
}
