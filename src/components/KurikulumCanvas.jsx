/**
 * KurikulumCanvas — node-graph sesuai visual slide referensi v2.
 * Bahan Kajian: dark header + list dengan diamond icon cyan
 * CPMK: dark charcoal header + green rows dengan badge angka bulat
 * Sub-CPMK: rounded rect hijau dengan badge oranye di kanan
 * Background gelap (#1a1f2e)
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

// ── Design tokens (dari slide v2) ─────────────────────────────────────────────
const C = {
  mk:      { bg: '#2d3748', border: '#4a5568', text: '#f7fafc', sub: '#a0aec0' },
  des:     { bg: '#6d28d9', border: '#7c3aed', text: 'white',   sub: '#c4b5fd' },
  bk:      { bg: '#1a202c', border: '#4a5568', text: '#e2e8f0',
             headerBg: '#2d3748', rowBg: '#252d3d', diamond: '#63b3ed',
             groupBg: '#f6e05e', groupText: '#744210' },
  cpmk:    { bg: '#1a202c', border: '#4a5568', text: '#e2e8f0',
             headerBg: '#2d3748', rowBg: '#38a169', badge: '#38a169' },
  sub:     { bg: '#38a169', border: '#2f855a', text: 'white',
             badge: '#ed8936', badgeText: 'white' },
  relasi:  { bg: '#2d3748', border: '#4a5568', text: '#e2e8f0' },
};

const NODE_W = 190;
const ROW_H  = 28;
const HEADER_H = 34;

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
function Badge({ n, bg = '#38a169', color = 'white', size = 22 }) {
  return (
    <span style={{
      background: bg, color, borderRadius: '50%',
      width: size, height: size, minWidth: size,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.max(9, size * 0.45), fontWeight: 700, flexShrink: 0,
    }}>{n}</span>
  );
}

// ── Diamond icon ──────────────────────────────────────────────────────────────
function Diamond({ color = '#63b3ed', size = 10 }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size, height: size,
      background: color,
      transform: 'rotate(45deg)',
      flexShrink: 0,
    }} />
  );
}

// ── MK Node ───────────────────────────────────────────────────────────────────
function MkNode({ data }) {
  return (
    <div style={{
      background: C.mk.bg, border: `1.5px solid ${C.mk.border}`,
      borderRadius: 10, minWidth: NODE_W, maxWidth: 230, overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 9, color: C.mk.sub, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
          Mata Kuliah
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.mk.text, lineHeight: 1.2, marginBottom: 2 }}>
          {data.kode}
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#a0aec0', lineHeight: 1.4 }}>
          {data.nama}
        </div>
        {data.info && (
          <div style={{
            fontSize: 10, color: '#718096', marginTop: 8,
            padding: '4px 8px', background: 'rgba(255,255,255,0.05)',
            borderRadius: 5, border: '1px solid #3d4a5c',
          }}>
            {data.info}
          </div>
        )}
      </div>
      {/* Deskripsi baris */}
      {data.desDot && (
        <div style={{
          borderTop: `1px solid ${C.mk.border}`,
          background: '#553c9a', padding: '6px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, color: 'white', fontWeight: 600 }}>Deskripsi</span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d6bcfa', display: 'inline-block' }} />
        </div>
      )}
      <Handles left={false} right />
    </div>
  );
}

// ── Bahan Kajian Node (dari slide: dark + diamond icons + group highlight) ────
function BahanKajianNode({ data }) {
  return (
    <div style={{
      background: C.bk.bg, border: `1.5px solid ${C.bk.border}`,
      borderRadius: 10, minWidth: NODE_W, overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{
        padding: '7px 12px', background: C.bk.headerBg,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid #3d4a5c`,
        minHeight: HEADER_H,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{data.label}</span>
        {data.rmk && (
          <span style={{ fontSize: 10, color: '#718096', fontStyle: 'italic' }}>{data.rmk}</span>
        )}
      </div>

      {/* Group row (highlighted, sesuai slide) */}
      {data.group && (
        <div style={{
          padding: '5px 12px',
          background: C.bk.groupBg,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: `1px solid #3d4a5c`,
          minHeight: ROW_H,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.bk.groupText }}>{data.group}</span>
          <span style={{
            background: '#c05621', color: 'white', borderRadius: 4,
            padding: '1px 7px', fontSize: 10, fontWeight: 700,
          }}>–</span>
        </div>
      )}

      {/* Item rows dengan diamond */}
      {data.items?.map((item, i) => (
        <div key={i} style={{
          padding: '5px 12px',
          background: i % 2 === 0 ? C.bk.rowBg : 'rgba(255,255,255,0.03)',
          borderBottom: i < data.items.length - 1 ? `1px solid #2a3344` : 'none',
          display: 'flex', alignItems: 'center', gap: 8,
          minHeight: ROW_H,
        }}>
          <Diamond color={C.bk.diamond} size={9} />
          <span style={{ fontSize: 11, color: '#cbd5e0', flex: 1 }}>{item.label}</span>
          {item.badge != null && (
            <Diamond color={C.bk.diamond} size={9} />
          )}
        </div>
      ))}
      <Handles left right />
    </div>
  );
}

// ── CPMK Node (dark header, green rows, badge angka) ─────────────────────────
function CpmkNode({ data }) {
  return (
    <div style={{
      background: C.cpmk.bg, border: `1.5px solid ${C.cpmk.border}`,
      borderRadius: 10, minWidth: NODE_W, overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{
        padding: '7px 12px', background: C.cpmk.headerBg,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid #3d4a5c`,
        minHeight: HEADER_H,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>CPMK</span>
        {data.count != null && (
          <span style={{ fontSize: 10, color: '#718096' }}>({data.count})</span>
        )}
      </div>

      {/* Green CPMK rows */}
      {data.items?.map((item, i) => (
        <div key={i} style={{
          padding: '5px 12px',
          background: '#276749',
          borderBottom: i < data.items.length - 1 ? `1px solid #2f855a` : 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          minHeight: ROW_H,
        }}>
          <span style={{ fontSize: 11, color: '#c6f6d5', fontWeight: 500, flex: 1 }}>{item.label}</span>
          <Badge n={item.badge} bg="#276749" color="#c6f6d5" size={20}
            style={{ border: '1px solid #c6f6d5' }}
          />
        </div>
      ))}
      <Handles left right />
    </div>
  );
}

// ── Sub-CPMK Node (rounded green, badge oranye di kanan) ─────────────────────
function SubCpmkNode({ data }) {
  return (
    <div style={{
      background: '#276749', border: `1.5px solid #2f855a`,
      borderRadius: 10, minWidth: NODE_W + 20, overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
    }}>
      {/* Header: label CPMK + badge oranye */}
      <div style={{
        padding: '7px 12px',
        background: '#38a169',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid #2f855a`,
        minHeight: HEADER_H,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{data.label}</span>
        <Badge n={data.badge} bg="#ed8936" color="white" size={22} />
      </div>

      {/* Sub-CPMK rows */}
      {data.items?.map((item, i) => (
        <div key={i} style={{
          padding: '5px 12px',
          background: i % 2 === 0 ? '#276749' : 'rgba(255,255,255,0.05)',
          borderBottom: i < data.items.length - 1 ? `1px solid #2f855a` : 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          minHeight: ROW_H,
        }}>
          <span style={{ fontSize: 11, color: '#c6f6d5', flex: 1 }}>{item.label}</span>
          <Badge n={item.badge} bg="#ed8936" color="white" size={20} />
        </div>
      ))}
      <Handles left right={false} />
    </div>
  );
}

// ── Relasi MK Node ────────────────────────────────────────────────────────────
function RelasiNode({ data }) {
  return (
    <div style={{
      background: C.relasi.bg, border: `1px solid ${C.relasi.border}`,
      borderRadius: 10, minWidth: 170, overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}>
      <div style={{ padding: '7px 12px', borderBottom: `1px solid #3d4a5c` }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#e2e8f0' }}>Relasi MK antar Semester</span>
      </div>
      {data.groups?.map((g, gi) => (
        <div key={gi}>
          <div style={{ padding: '4px 12px', fontSize: 9, color: '#718096', letterSpacing: 1, textTransform: 'uppercase' }}>{g.label}</div>
          {g.items.map((mk, mi) => (
            <div key={mi} style={{
              margin: '2px 8px', padding: '4px 10px',
              background: '#3d4a5c', borderRadius: 5,
              fontSize: 10, color: '#cbd5e0',
              marginBottom: mi === g.items.length - 1 ? 6 : 2,
            }}>{mk}</div>
          ))}
        </div>
      ))}
      <Handles left right={false} />
    </div>
  );
}

const nodeTypes = { mk: MkNode, bk: BahanKajianNode, cpmkGrp: CpmkNode, subCpmk: SubCpmkNode, relasi: RelasiNode };

// ── Layout builder ────────────────────────────────────────────────────────────
function buildGraph({ mkDipilih, cplDipilih, daftarCPL, cpmk, bahanKajian, desMk }) {
  const nodes = [];
  const edges = [];

  const edgeBase = { type: 'smoothstep', style: { strokeWidth: 1.5 } };

  const X_MK   = 20;
  const X_MID  = 290;   // BK & Relasi
  const X_CPMK = 540;
  const X_SUB  = 800;

  const bkFilled  = (bahanKajian || []).filter(Boolean);
  const cpmkList  = cpmk || [];

  // ─ MK node ─
  nodes.push({
    id: 'mk', type: 'mk',
    position: { x: X_MK, y: 160 },
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

  // ─ Bahan Kajian (slide: nama kelompok sebagai group highlight) ─
  const bkGroupLabel = desMk?.bahan_kajian_des ? `Bahan Kajian (${bkFilled.length})` : `Bahan Kajian (${bkFilled.length})`;
  nodes.push({
    id: 'bk', type: 'bk',
    position: { x: X_MID, y: 20 },
    data: {
      label: 'Bahan Kajian',
      rmk: mkDipilih ? `RMK – ${mkDipilih.nama_mk?.substring(0, 20)}` : undefined,
      group: bkGroupLabel,
      items: bkFilled.length
        ? bkFilled.map((b, i) => ({ label: b.length > 26 ? b.substring(0, 26) + '…' : b, badge: i }))
        : [{ label: '(belum diisi)' }],
    },
  });
  edges.push({ ...edgeBase, id: 'mk-bk', source: 'mk', target: 'bk', style: { ...edgeBase.style, stroke: '#4a5568' } });

  // ─ Relasi MK ─
  const bkH = HEADER_H + ROW_H + Math.max(bkFilled.length, 1) * ROW_H + 20;
  nodes.push({
    id: 'relasi', type: 'relasi',
    position: { x: X_MID, y: 20 + bkH + 16 },
    data: {
      groups: [
        { label: 'Semester Atas',  items: ['(Sem. atas)'] },
        { label: 'Semester Sama',  items: ['(Sem. sama)', mkDipilih ? `${mkDipilih.kode_mk} (Sem.${mkDipilih.semester||'-'})` : '(MK ini)'] },
        { label: 'Semester Bawah', items: ['(Prasyarat)'] },
      ],
    },
  });
  edges.push({ ...edgeBase, id: 'mk-rel', source: 'mk', target: 'relasi', style: { ...edgeBase.style, stroke: '#4a5568', strokeDasharray: '5,5' } });

  // ─ CPMK group node ─
  const cpmkNodeY = 20 + bkH / 2;
  nodes.push({
    id: 'cpmk', type: 'cpmkGrp',
    position: { x: X_CPMK, y: cpmkNodeY },
    data: {
      count: cpmkList.length,
      items: cpmkList.length
        ? cpmkList.map((c, i) => ({ label: c.no || `CPMK ${i + 1}`, badge: i + 1 }))
        : [{ label: '(belum diisi)', badge: '-' }],
    },
  });
  edges.push({ ...edgeBase, id: 'bk-cpmk',  source: 'bk',     target: 'cpmk', style: { ...edgeBase.style, stroke: '#38a169' } });
  edges.push({ ...edgeBase, id: 'rel-cpmk', source: 'relasi', target: 'cpmk', style: { ...edgeBase.style, stroke: '#4a5568', strokeDasharray: '5,5' } });

  // ─ Sub-CPMK nodes ─
  let subCounter = 0;
  let subY = 20;

  cpmkList.forEach((c, ci) => {
    const kogs = c.sub_cpmk_kog   || [];
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
      data: { label: c.no || `CPMK ${ci + 1}`, badge: ci + 1, items },
    });
    edges.push({
      ...edgeBase, id: `cpmk-${nodeId}`,
      source: 'cpmk', target: nodeId,
      style: { ...edgeBase.style, stroke: '#68d391' },
    });

    subY += HEADER_H + totalSub * ROW_H + 16;
  });

  return { nodes, edges };
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function KurikulumCanvas({ mkDipilih, cplDipilih, daftarCPL, cpmk, bahanKajian, desMk }) {
  const { nodes, edges } = useMemo(
    () => buildGraph({ mkDipilih, cplDipilih: cplDipilih || [], daftarCPL: daftarCPL || [], cpmk: cpmk || [], bahanKajian: bahanKajian || [], desMk }),
    [mkDipilih, cplDipilih, daftarCPL, cpmk, bahanKajian, desMk]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll
        style={{ background: '#1a1f2e' }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background color="#2d3748" gap={24} size={1} variant="dots" />
        <Controls showInteractive={false} position="bottom-right"
          style={{ background: '#2d3748', border: '1px solid #4a5568', borderRadius: 8 }}
        />
        <MiniMap
          position="bottom-left"
          nodeColor={n => {
            if (n.id === 'mk')    return '#4a5568';
            if (n.id === 'bk')    return '#2b6cb0';
            if (n.id === 'cpmk')  return '#276749';
            if (n.id === 'relasi') return '#4a5568';
            if (n.id.startsWith('sub')) return '#ed8936';
            return '#4a5568';
          }}
          style={{ background: '#1a202c', border: '1px solid #3d4a5c', borderRadius: 8 }}
          maskColor="rgba(26,32,46,0.7)"
        />
      </ReactFlow>
    </div>
  );
}
