/**
 * KurikulumCanvas — live node-graph preview dari data form silabus.
 * Menerima props: mkDipilih, cplDipilih, daftarCPL, cpmk, bahanKajian,
 *                 deskripsiMk, desMk
 * Readonly — hanya preview, tidak bisa diedit dari sini.
 */
import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ── Warna node per tipe ───────────────────────────────────────────────────────
const COLOR = {
  mk:      { bg: '#1e293b', text: '#f8fafc', border: '#334155' },
  deskripsi: { bg: '#7c3aed', text: 'white',  border: '#6d28d9' },
  cpl:     { bg: '#374151', text: '#f9fafb', border: '#4b5563' },
  cplItem: { bg: '#fef9c3', text: '#78350f', border: '#fde68a' },
  bk:      { bg: '#0f766e', text: 'white',   border: '#0d9488' },
  bkItem:  { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  cpmk:    { bg: '#166534', text: 'white',   border: '#16a34a' },
  subCpmk: { bg: '#bbf7d0', text: '#14532d', border: '#86efac' },
  relasi:  { bg: '#64748b', text: 'white',   border: '#94a3b8' },
};

// ── Custom node components ────────────────────────────────────────────────────
function MkNode({ data }) {
  return (
    <div style={{
      background: COLOR.mk.bg, color: COLOR.mk.text, border: `2px solid ${COLOR.mk.border}`,
      borderRadius: 10, padding: '10px 16px', minWidth: 180, maxWidth: 220, fontSize: 13,
    }}>
      <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Mata Kuliah</div>
      <div style={{ fontWeight: 700 }}>{data.kode} — {data.nama}</div>
      {data.info && <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{data.info}</div>}
    </div>
  );
}

function GroupNode({ data }) {
  const c = COLOR[data.colorKey] || COLOR.cpl;
  return (
    <div style={{
      background: c.bg, color: c.text, border: `2px solid ${c.border}`,
      borderRadius: 10, minWidth: 160, fontSize: 12, overflow: 'hidden',
    }}>
      <div style={{ padding: '7px 12px', fontWeight: 700, fontSize: 12, borderBottom: `1px solid ${c.border}80` }}>
        {data.label}
        {data.count != null && (
          <span style={{ float: 'right', background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '0 7px', fontSize: 11 }}>
            {data.count}
          </span>
        )}
      </div>
      {data.items?.map((item, i) => (
        <div key={i} style={{
          padding: '5px 12px', fontSize: 11,
          borderBottom: i < data.items.length - 1 ? `1px solid ${c.border}40` : 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ flex: 1 }}>{item.label}</span>
          {item.badge != null && (
            <span style={{
              background: 'rgba(255,255,255,0.3)', borderRadius: '50%',
              width: 20, height: 20, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0,
            }}>{item.badge}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function SubCpmkNode({ data }) {
  return (
    <div style={{
      background: COLOR.subCpmk.bg, color: COLOR.subCpmk.text,
      border: `1px solid ${COLOR.subCpmk.border}`,
      borderRadius: 8, minWidth: 160, fontSize: 11, overflow: 'hidden',
    }}>
      <div style={{ padding: '5px 10px', fontWeight: 700, background: '#86efac', borderBottom: '1px solid #6ee7b7', display: 'flex', justifyContent: 'space-between' }}>
        <span>{data.label}</span>
        <span style={{ background: '#16a34a', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{data.badge}</span>
      </div>
      {data.items?.map((item, i) => (
        <div key={i} style={{
          padding: '4px 10px', fontSize: 10,
          borderBottom: i < data.items.length - 1 ? '1px solid #bbf7d0' : 'none',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span style={{ flex: 1 }}>{item.label}</span>
          <span style={{ background: '#16a34a', color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>{item.badge}</span>
        </div>
      ))}
    </div>
  );
}

const nodeTypes = { mk: MkNode, group: GroupNode, subCpmk: SubCpmkNode };

// ── Layout builder ────────────────────────────────────────────────────────────
function buildGraph({ mkDipilih, cplDipilih, daftarCPL, cpmk, bahanKajian, desMk }) {
  const nodes = [];
  const edges = [];
  let subCpmkCounter = 0;

  // ── MK node ──
  nodes.push({
    id: 'mk', type: 'mk', position: { x: 60, y: 160 },
    data: {
      kode: mkDipilih?.kode_mk || 'Kode',
      nama: mkDipilih?.nama_mk || 'Nama MK',
      info: mkDipilih
        ? `${mkDipilih.sks || '-'} SKS • Sem. ${mkDipilih.semester || '-'} • ${mkDipilih.jenjang || '-'}`
        : null,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });

  // ── Deskripsi node ──
  nodes.push({
    id: 'des', type: 'group', position: { x: 60, y: 310 },
    data: {
      colorKey: 'deskripsi', label: 'Deskripsi',
      items: desMk?.jenis_mk ? [
        { label: desMk.jenis_mk },
        desMk.kemampuan ? { label: desMk.kemampuan } : null,
        desMk.metoda_1 ? { label: `📐 ${[desMk.metoda_1, desMk.metoda_2, desMk.metoda_3].filter(Boolean).join(', ')}` } : null,
      ].filter(Boolean) : [{ label: '(belum diisi)' }],
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });
  edges.push({ id: 'mk-des', source: 'mk', target: 'des', type: 'smoothstep', style: { strokeDasharray: '5,5', stroke: '#94a3b8' }, animated: false });

  // ── CPL node ──
  const cplItems = daftarCPL.filter(c => cplDipilih.includes(c.id));
  nodes.push({
    id: 'cpl', type: 'group', position: { x: 340, y: 60 },
    data: {
      colorKey: 'cpl', label: 'CPL',
      count: cplItems.length,
      items: cplItems.map(c => ({ label: c.nomor_cpl })),
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });
  edges.push({ id: 'mk-cpl', source: 'mk', target: 'cpl', type: 'smoothstep', style: { stroke: '#94a3b8' } });

  // ── Bahan Kajian node ──
  const bkFilled = bahanKajian.filter(Boolean);
  nodes.push({
    id: 'bk', type: 'group', position: { x: 580, y: 60 },
    data: {
      colorKey: 'bk', label: 'Bahan Kajian',
      count: bkFilled.length,
      items: bkFilled.length
        ? bkFilled.map((b, i) => ({ label: b.length > 30 ? b.substring(0, 30) + '…' : b, badge: String.fromCharCode(65 + i) }))
        : [{ label: '(belum diisi)' }],
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });
  edges.push({ id: 'mk-bk', source: 'mk', target: 'bk', type: 'smoothstep', style: { stroke: '#0d9488' } });

  // ── CPMK + Sub-CPMK nodes ──
  if (cpmk.length > 0) {
    nodes.push({
      id: 'cpmk-header', type: 'group', position: { x: 580, y: 240 },
      data: {
        colorKey: 'cpmk', label: 'CPMK',
        count: cpmk.length,
        items: cpmk.map((c, i) => ({ label: c.no || `CPMK ${i+1}`, badge: i + 1 })),
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
    edges.push({ id: 'bk-cpmk', source: 'bk', target: 'cpmk-header', type: 'smoothstep', style: { stroke: '#16a34a' } });
    edges.push({ id: 'cpl-cpmk', source: 'cpl', target: 'cpmk-header', type: 'smoothstep', style: { stroke: '#16a34a' } });

    // Sub-CPMK per CPMK
    cpmk.forEach((c, ci) => {
      const kogs = c.sub_cpmk_kog || [];
      const psis = c.sub_cpmk_psiko || [];
      const afks = c.sub_cpmk_afeksi || [];
      const totalSub = kogs.length + psis.length + afks.length;
      if (totalSub === 0) return;

      const subItems = [
        ...kogs.map((_, i) => { subCpmkCounter++; return { label: `Sub-CPMK ${subCpmkCounter}`, badge: subCpmkCounter }; }),
        ...psis.map((_, i) => { subCpmkCounter++; return { label: `Sub-CPMK ${subCpmkCounter}`, badge: subCpmkCounter }; }),
        ...afks.map((_, i) => { subCpmkCounter++; return { label: `Sub-CPMK ${subCpmkCounter}`, badge: subCpmkCounter }; }),
      ];
      // reset counter logic — number within this CPMK
      subCpmkCounter -= totalSub;
      let localCounter = 0;
      const localItems = [
        ...kogs.map(() => { localCounter++; subCpmkCounter++; return { label: `Sub-CPMK ${subCpmkCounter}`, badge: subCpmkCounter }; }),
        ...psis.map(() => { localCounter++; subCpmkCounter++; return { label: `Sub-CPMK ${subCpmkCounter}`, badge: subCpmkCounter }; }),
        ...afks.map(() => { localCounter++; subCpmkCounter++; return { label: `Sub-CPMK ${subCpmkCounter}`, badge: subCpmkCounter }; }),
      ];

      const nodeId = `sub-${ci}`;
      nodes.push({
        id: nodeId, type: 'subCpmk',
        position: { x: 820, y: 60 + ci * 160 },
        data: { label: c.no || `CPMK ${ci+1}`, badge: ci + 1, items: localItems },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
      edges.push({
        id: `cpmk-sub-${ci}`,
        source: 'cpmk-header', target: nodeId,
        type: 'smoothstep', style: { stroke: '#86efac' },
      });
    });
  } else {
    nodes.push({
      id: 'cpmk-header', type: 'group', position: { x: 580, y: 240 },
      data: { colorKey: 'cpmk', label: 'CPMK', count: 0, items: [{ label: '(belum diisi)' }] },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
    edges.push({ id: 'bk-cpmk', source: 'bk', target: 'cpmk-header', type: 'smoothstep', style: { stroke: '#16a34a' } });
    edges.push({ id: 'cpl-cpmk', source: 'cpl', target: 'cpmk-header', type: 'smoothstep', style: { stroke: '#16a34a' } });
  }

  return { nodes, edges };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function KurikulumCanvas({ mkDipilih, cplDipilih, daftarCPL, cpmk, bahanKajian, desMk }) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph({ mkDipilih, cplDipilih: cplDipilih || [], daftarCPL: daftarCPL || [], cpmk: cpmk || [], bahanKajian: bahanKajian || [], desMk }),
    [mkDipilih, cplDipilih, daftarCPL, cpmk, bahanKajian, desMk]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when props change
  const { nodes: newNodes, edges: newEdges } = useMemo(
    () => buildGraph({ mkDipilih, cplDipilih: cplDipilih || [], daftarCPL: daftarCPL || [], cpmk: cpmk || [], bahanKajian: bahanKajian || [], desMk }),
    [mkDipilih, cplDipilih, daftarCPL, cpmk, bahanKajian, desMk]
  );

  return (
    <div style={{ width: '100%', height: '100%', background: '#f8fafc' }}>
      <ReactFlow
        nodes={newNodes}
        edges={newEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll
        style={{ background: '#f1f5f9' }}
      >
        <Background color="#cbd5e1" gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={n => {
            if (n.id === 'mk') return '#1e293b';
            if (n.id === 'cpl') return '#374151';
            if (n.id === 'bk') return '#0f766e';
            if (n.id.startsWith('sub')) return '#16a34a';
            return '#7c3aed';
          }}
          style={{ background: '#e2e8f0', border: '1px solid #cbd5e1' }}
        />
      </ReactFlow>
    </div>
  );
}
