/**
 * KurikulumCanvas — node-graph TEMA TERANG sesuai slide referensi.
 * Background: #f0f0f0 light gray
 * Node Bahan Kajian: putih, header charcoal #424242, row highlight kuning #fff9c4
 * Node CPMK: charcoal header, green rows #66bb6a, badge orange #ff7043
 * Node Sub-CPMK: header pill #43a047, light green rows #c8e6c9
 * Edges: abu-abu #9e9e9e
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

// ── Design tokens (slide referensi — tema terang) ─────────────────────────────
const C = {
  bk: {
    bg:        'white',
    border:    '#e0e0e0',
    headerBg:  '#424242',
    headerText:'white',
    rowBg:     'white',
    rowText:   '#333',
    hlBg:      '#fff9c4',   // row highlight (RMK/penting)
    hlText:    '#5d4037',
    hlBadge:   '#e53935',
    // diamond colors per cluster
    diamonds:  ['#1565c0','#00acc1','#e53935','#43a047','#1e88e5'],
  },
  cpmk: {
    bg:        'white',
    border:    '#e0e0e0',
    headerBg:  '#424242',
    headerText:'white',
    rowBg:     '#66bb6a',
    rowText:   'white',
    badge:     '#ff7043',
  },
  sub: {
    bg:        '#c8e6c9',
    border:    '#a5d6a7',
    headerBg:  '#43a047',
    headerText:'white',
    rowText:   '#1b5e20',
    badge:     '#ff7043',
  },
  edge:       '#9e9e9e',
};

const NODE_W   = 200;
const HEADER_H = 32;
const ROW_H    = 26;

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
function Badge({ label, bg = '#ff7043', color = 'white', size = 22, fontSize = 10 }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: size, height: size, borderRadius: size / 2,
      background: bg, color,
      fontSize, fontWeight: 700, padding: '0 5px', flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

// ── Diamond ikon ──────────────────────────────────────────────────────────────
function Diamond({ color = '#1565c0', size = 10 }) {
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

// ═══════════════════════════════════════════════════════════════════════════════
// NODE: Bahan Kajian
// ═══════════════════════════════════════════════════════════════════════════════
function BahanKajianNode({ data }) {
  const { label, rows = [] } = data;
  const totalH = HEADER_H + rows.length * ROW_H;
  return (
    <div style={{
      width: NODE_W, minHeight: totalH,
      background: C.bk.bg, border: `1px solid ${C.bk.border}`,
      borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    }}>
      <Handles />
      {/* Header charcoal */}
      <div style={{
        height: HEADER_H, background: C.bk.headerBg,
        display: 'flex', alignItems: 'center',
        padding: '0 10px', gap: 6,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.bk.headerText, lineHeight: 1.2 }}>{label}</span>
      </div>

      {/* Rows */}
      {rows.map((row, i) => {
        const isHL = row.highlight;
        const dColor = C.bk.diamonds[row.cluster ?? (i % C.bk.diamonds.length)];
        return (
          <div key={i} style={{
            height: ROW_H,
            background: isHL ? C.bk.hlBg : C.bk.rowBg,
            display: 'flex', alignItems: 'center',
            padding: '0 8px', gap: 6,
            borderTop: '1px solid #f0f0f0',
          }}>
            <Diamond color={isHL ? C.bk.hlBadge : dColor} />
            <span style={{
              fontSize: 10, flex: 1,
              color: isHL ? C.bk.hlText : C.bk.rowText,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {row.label}
            </span>
            {isHL && <Badge label="HL" bg={C.bk.hlBadge} size={18} fontSize={8} />}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NODE: CPMK
// ═══════════════════════════════════════════════════════════════════════════════
function CpmkNode({ data }) {
  const { label, rows = [], idx } = data;
  const totalH = HEADER_H + rows.length * ROW_H;
  return (
    <div style={{
      width: NODE_W, minHeight: totalH,
      background: C.cpmk.bg, border: `1px solid ${C.cpmk.border}`,
      borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    }}>
      <Handles />
      {/* Header charcoal */}
      <div style={{
        height: HEADER_H, background: C.cpmk.headerBg,
        display: 'flex', alignItems: 'center',
        padding: '0 10px', gap: 8,
      }}>
        {idx !== undefined && <Badge label={idx} bg={C.cpmk.badge} />}
        <span style={{ fontSize: 11, fontWeight: 700, color: C.cpmk.headerText, flex: 1 }}>{label}</span>
      </div>

      {/* Rows green */}
      {rows.map((row, i) => (
        <div key={i} style={{
          height: ROW_H, background: C.cpmk.rowBg,
          display: 'flex', alignItems: 'center',
          padding: '0 8px', gap: 6,
          borderTop: '1px solid rgba(255,255,255,0.3)',
        }}>
          <span style={{ fontSize: 10, color: C.cpmk.rowText, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {row}
          </span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NODE: Sub-CPMK
// ═══════════════════════════════════════════════════════════════════════════════
function SubCpmkNode({ data }) {
  const { label, rows = [], idx } = data;
  const totalH = HEADER_H + rows.length * ROW_H;
  return (
    <div style={{
      width: NODE_W, minHeight: totalH,
      background: C.sub.bg, border: `1px solid ${C.sub.border}`,
      borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
    }}>
      <Handles />
      {/* Header pill hijau tua */}
      <div style={{
        height: HEADER_H, background: C.sub.headerBg,
        display: 'flex', alignItems: 'center',
        padding: '0 10px', gap: 8,
      }}>
        {idx !== undefined && <Badge label={idx} bg={C.sub.badge} />}
        <span style={{ fontSize: 11, fontWeight: 700, color: C.sub.headerText, flex: 1 }}>{label}</span>
      </div>

      {/* Rows light green */}
      {rows.map((row, i) => (
        <div key={i} style={{
          height: ROW_H,
          display: 'flex', alignItems: 'center',
          padding: '0 8px', gap: 6,
          borderTop: '1px solid rgba(0,0,0,0.08)',
        }}>
          <span style={{ fontSize: 10, color: C.sub.rowText, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {row}
          </span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NODE: MK Info (pojok kiri atas)
// ═══════════════════════════════════════════════════════════════════════════════
function MkInfoNode({ data }) {
  const { mk, sks, jenjang, semester } = data;
  return (
    <div style={{
      background: 'white', border: '1px solid #e0e0e0', borderRadius: 8,
      padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
      minWidth: 200,
    }}>
      <Handles left={false} />
      <div style={{ fontWeight: 800, fontSize: 13, color: '#222', marginBottom: 4 }}>{mk}</div>
      <div style={{ fontSize: 11, color: '#666', display: 'flex', gap: 8 }}>
        <span>{sks} SKS</span>
        {semester && <span>Sem. {semester}</span>}
        {jenjang && <span>{jenjang}</span>}
      </div>
    </div>
  );
}

const nodeTypes = {
  bahanKajian: BahanKajianNode,
  cpmk:        CpmkNode,
  subCpmk:     SubCpmkNode,
  mkInfo:      MkInfoNode,
};

// ── Layout helpers ─────────────────────────────────────────────────────────────
const GAP_X = 240;
const GAP_Y = 20;
const START_X = 20;
const START_Y = 80;

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function KurikulumCanvas({ mkDipilih, cplDipilih, daftarCPL, cpmk, bahanKajian, desMk }) {
  const { nodes, edges } = useMemo(() => {
    const nodes = [];
    const edges = [];
    let yOff = START_Y;

    // ── MK Info node ──
    if (mkDipilih) {
      nodes.push({
        id: 'mk-info',
        type: 'mkInfo',
        position: { x: START_X, y: 10 },
        data: {
          mk: `${mkDipilih.kode_mk} · ${mkDipilih.nama_mk}`,
          sks: mkDipilih.sks,
          semester: mkDipilih.semester,
          jenjang: mkDipilih.jenjang,
        },
      });
    }

    // ── Bahan Kajian nodes (kolom 1) ──
    const bkList = Array.isArray(bahanKajian) ? bahanKajian : [];
    bkList.forEach((bk, i) => {
      const bkRows = [
        { label: bk.nama || `BK ${i + 1}`, cluster: 0 },
        ...(bk.sub_topik || []).map((s, j) => ({ label: s, cluster: j % C.bk.diamonds.length })),
      ];
      nodes.push({
        id: `bk-${i}`,
        type: 'bahanKajian',
        position: { x: START_X, y: yOff },
        data: { label: `Bahan Kajian ${i + 1}`, rows: bkRows },
      });
      yOff += HEADER_H + bkRows.length * ROW_H + GAP_Y;
    });

    // ── CPMK nodes (kolom 2) ──
    const cpmkList = Array.isArray(cpmk) ? cpmk : [];
    let yC = START_Y;
    cpmkList.forEach((c, i) => {
      const cRows = [c.deskripsi || c.kode || `CPMK ${i + 1}`];
      nodes.push({
        id: `cpmk-${i}`,
        type: 'cpmk',
        position: { x: START_X + GAP_X, y: yC },
        data: { label: c.kode || `CPMK ${i + 1}`, rows: cRows, idx: i + 1 },
      });
      yC += HEADER_H + cRows.length * ROW_H + GAP_Y;

      // Edge BK → CPMK (simple 1:1 mapping)
      if (bkList[i]) {
        edges.push({
          id: `e-bk${i}-cpmk${i}`,
          source: `bk-${i}`, target: `cpmk-${i}`,
          type: 'straight',
          style: { stroke: C.edge, strokeWidth: 1.5 },
          markerEnd: { type: 'arrowclosed', color: C.edge, width: 10, height: 10 },
        });
      }
    });

    // ── Sub-CPMK nodes (kolom 3) ──
    let yS = START_Y;
    cpmkList.forEach((c, i) => {
      const subs = Array.isArray(c.sub_cpmk) ? c.sub_cpmk : [];
      subs.forEach((s, j) => {
        const subRows = [s.deskripsi || s.kode || `Sub ${j + 1}`];
        const subId = `sub-${i}-${j}`;
        nodes.push({
          id: subId,
          type: 'subCpmk',
          position: { x: START_X + GAP_X * 2, y: yS },
          data: { label: s.kode || `Sub-CPMK ${j + 1}`, rows: subRows, idx: `${i + 1}.${j + 1}` },
        });
        yS += HEADER_H + subRows.length * ROW_H + GAP_Y;

        edges.push({
          id: `e-cpmk${i}-sub${i}-${j}`,
          source: `cpmk-${i}`, target: subId,
          type: 'straight',
          style: { stroke: C.edge, strokeWidth: 1.5 },
          markerEnd: { type: 'arrowclosed', color: C.edge, width: 10, height: 10 },
        });
      });
    });

    // ── Fallback: placeholder ketika data kosong ──
    if (nodes.length <= 1) {
      nodes.push({
        id: 'placeholder',
        type: 'bahanKajian',
        position: { x: START_X, y: START_Y },
        data: {
          label: 'Bahan Kajian',
          rows: [
            { label: 'Pilih mata kuliah dan isi form', cluster: 0 },
            { label: 'untuk melihat peta kurikulum', cluster: 1 },
          ],
        },
      });
      nodes.push({
        id: 'placeholder-cpmk',
        type: 'cpmk',
        position: { x: START_X + GAP_X, y: START_Y },
        data: { label: 'CPMK', rows: ['Capaian Pembelajaran MK'], idx: '—' },
      });
      nodes.push({
        id: 'placeholder-sub',
        type: 'subCpmk',
        position: { x: START_X + GAP_X * 2, y: START_Y },
        data: { label: 'Sub-CPMK', rows: ['Sub Capaian Pembelajaran'], idx: '—' },
      });
      edges.push({
        id: 'e-ph1', source: 'placeholder', target: 'placeholder-cpmk',
        type: 'straight', style: { stroke: C.edge, strokeWidth: 1.5 },
      });
      edges.push({
        id: 'e-ph2', source: 'placeholder-cpmk', target: 'placeholder-sub',
        type: 'straight', style: { stroke: C.edge, strokeWidth: 1.5 },
      });
    }

    return { nodes, edges };
  }, [mkDipilih, cpmk, bahanKajian]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#d0d0d0" gap={20} size={1} variant="dots" />
        <Controls style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 8 }} />
        <MiniMap
          style={{ background: 'white', border: '1px solid #e0e0e0' }}
          nodeColor={n => n.type === 'cpmk' ? '#66bb6a' : n.type === 'subCpmk' ? '#43a047' : '#9e9e9e'}
        />
      </ReactFlow>
    </div>
  );
}
