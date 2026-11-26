import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from '../supabaseClient';
import Icon from '../components/Icon';

// ─── Design tokens (sesuai Figma) ────────────────────────────────────────────
const NODE_COLORS = {
  mk:        { bg: '#f8b4c8', border: '#e91e8c', label: '#7a0030', title: 'MK'        },
  cpl:       { bg: '#fde0d4', border: '#f97316', label: '#7a2000', title: 'CPL'       },
  bk:        { bg: '#fff9c4', border: '#f9a825', label: '#5a4000', title: 'Bahan Kajian' },
  cpmk:      { bg: '#c8f5d4', border: '#22c55e', label: '#0a4a1a', title: 'CPMK'     },
  sub_cpmk:  { bg: '#cce8ff', border: '#3b82f6', label: '#0a2a5a', title: 'Sub-CPMK' },
};

const EDGE_STYLE = {
  stroke: '#94a3b8',
  strokeWidth: 1.5,
};

// ─── Custom Nodes ─────────────────────────────────────────────────────────────
function MKNode({ data, selected }) {
  const c = NODE_COLORS.mk;
  return (
    <div style={{
      background: selected ? '#fce4ec' : c.bg,
      border: `2px solid ${selected ? '#e91e8c' : c.border}`,
      borderRadius: 10,
      padding: '10px 14px',
      minWidth: 180,
      boxShadow: selected ? '0 0 0 3px rgba(233,30,140,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
      cursor: 'pointer',
    }}>
      <Handle type="source" position={Position.Right} style={{ background: c.border }} />
      <div style={{ fontSize: 10, fontWeight: 700, color: c.label, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
        {data.kode} · Sem.{data.semester}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3, marginBottom: 4 }}>
        {data.nama}
      </div>
      <div style={{ fontSize: 11, color: '#666' }}>{data.sks} SKS</div>
      {data.deskripsi && (
        <div style={{
          marginTop: 8, padding: '6px 8px',
          background: '#fce4ec', borderRadius: 6,
          fontSize: 11, color: '#7a0030',
        }}>
          {data.deskripsi.slice(0, 80)}{data.deskripsi.length > 80 ? '…' : ''}
        </div>
      )}
    </div>
  );
}

function CPLNode({ data }) {
  const c = NODE_COLORS.cpl;
  return (
    <div style={{
      background: c.bg, border: `1.5px solid ${c.border}`,
      borderRadius: 10, padding: '10px 14px', minWidth: 160,
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: c.border }} />
      <Handle type="source" position={Position.Right} style={{ background: c.border }} />
      <div style={{ fontSize: 10, fontWeight: 700, color: c.label, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
        CPL ({data.items?.length || 0})
      </div>
      {(data.items || []).map((item, i) => (
        <div key={i} style={{
          fontSize: 12, color: '#333', padding: '3px 0',
          borderBottom: i < data.items.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
        }}>
          {item}
        </div>
      ))}
    </div>
  );
}

function BKNode({ data }) {
  const c = NODE_COLORS.bk;
  return (
    <div style={{
      background: c.bg, border: `1.5px solid ${c.border}`,
      borderRadius: 10, padding: '10px 14px', minWidth: 180,
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: c.border }} />
      <Handle type="source" position={Position.Right} style={{ background: c.border }} />
      <div style={{ fontSize: 10, fontWeight: 700, color: c.label, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
        Bahan Kajian ({data.items?.length || 0})
      </div>
      {(data.items || []).slice(0, 5).map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '3px 0', fontSize: 12, color: '#333' }}>
          <span style={{ color: c.border, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
          <span>{item}</span>
        </div>
      ))}
      {data.items?.length > 5 && (
        <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>+{data.items.length - 5} lainnya</div>
      )}
    </div>
  );
}

function CPMKNode({ data }) {
  const c = NODE_COLORS.cpmk;
  return (
    <div style={{
      background: c.bg, border: `1.5px solid ${c.border}`,
      borderRadius: 10, padding: '10px 14px', minWidth: 160,
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: c.border }} />
      <Handle type="source" position={Position.Right} style={{ background: c.border }} />
      <div style={{ fontSize: 10, fontWeight: 700, color: c.label, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
        CPMK
      </div>
      {(data.items || []).map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 0',
          borderBottom: i < data.items.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
          fontSize: 12, color: '#333',
        }}>
          <span style={{
            width: 20, height: 20, borderRadius: '50%',
            background: c.border, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, flexShrink: 0,
          }}>{i + 1}</span>
          {item}
        </div>
      ))}
    </div>
  );
}

function SubCPMKNode({ data }) {
  const c = NODE_COLORS.sub_cpmk;
  return (
    <div style={{
      background: c.bg, border: `1.5px solid ${c.border}`,
      borderRadius: 10, padding: '10px 14px', minWidth: 150,
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: c.border }} />
      <div style={{ fontSize: 10, fontWeight: 700, color: c.label, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
        Sub-CPMK {data.cpmkIndex}
      </div>
      {(data.items || []).map((item, i) => (
        <div key={i} style={{ fontSize: 12, color: '#333', padding: '2px 0' }}>
          {item}
        </div>
      ))}
    </div>
  );
}

function RelasimkNode({ data }) {
  return (
    <div style={{
      background: 'white', border: '1.5px dashed #94a3b8',
      borderRadius: 10, padding: '12px 16px', minWidth: 200,
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        Relasi MK antar Semester
      </div>
      {data.atas?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Semester Atas</div>
          {data.atas.map((mk, i) => (
            <div key={i} style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: 6, fontSize: 11, color: '#444', marginBottom: 3 }}>{mk}</div>
          ))}
        </div>
      )}
      {data.sama?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Semester Sama</div>
          {data.sama.map((mk, i) => (
            <div key={i} style={{ padding: '4px 8px', background: 'var(--color-primary)', color: 'white', borderRadius: 6, fontSize: 11, marginBottom: 3 }}>{mk}</div>
          ))}
        </div>
      )}
      {data.bawah?.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Prasyarat (Semester Bawah)</div>
          {data.bawah.map((mk, i) => (
            <div key={i} style={{ padding: '4px 8px', background: '#e8f5e9', color: '#2e7d32', borderRadius: 6, fontSize: 11, marginBottom: 3 }}>{mk}</div>
          ))}
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  mkNode: MKNode,
  cplNode: CPLNode,
  bkNode: BKNode,
  cpmkNode: CPMKNode,
  subCpmkNode: SubCPMKNode,
  relasiMKNode: RelasimkNode,
};

// ─── Build graph from MK data ─────────────────────────────────────────────────
function buildGraph(mk, cplList, cpmkList) {
  if (!mk) return { nodes: [], edges: [] };

  const GAP_X = 260;
  const nodes = [];
  const edges = [];

  // MK node
  nodes.push({
    id: 'mk',
    type: 'mkNode',
    position: { x: 0, y: 120 },
    data: {
      kode: mk.kode_mk,
      nama: mk.nama_mk,
      sks: mk.sks,
      semester: mk.semester,
      deskripsi: mk.deskripsi_mk || '',
    },
  });

  // CPL node
  const cplItems = cplList.map(c => c.kode_cpl + ': ' + (c.deskripsi_singkat || c.deskripsi || '').slice(0, 60));
  nodes.push({
    id: 'cpl',
    type: 'cplNode',
    position: { x: GAP_X, y: 60 },
    data: { items: cplItems },
  });
  edges.push({
    id: 'mk-cpl',
    source: 'mk', target: 'cpl',
    style: EDGE_STYLE,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  });

  // BK node (placeholder — bahan kajian dari CPMK deskripsi)
  const bkItems = cpmkList.map((c, i) => `BK ${i + 1}: ${(c.deskripsi || c.nama_cpmk || '').slice(0, 50)}`);
  nodes.push({
    id: 'bk',
    type: 'bkNode',
    position: { x: GAP_X * 2, y: 20 },
    data: { items: bkItems },
  });
  edges.push({
    id: 'cpl-bk',
    source: 'cpl', target: 'bk',
    style: EDGE_STYLE,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  });

  // CPMK node
  const cpmkItems = cpmkList.map(c => c.nama_cpmk || c.deskripsi || '').filter(Boolean);
  nodes.push({
    id: 'cpmk',
    type: 'cpmkNode',
    position: { x: GAP_X * 3, y: 60 },
    data: { items: cpmkItems },
  });
  edges.push({
    id: 'bk-cpmk',
    source: 'bk', target: 'cpmk',
    style: EDGE_STYLE,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  });

  // Sub-CPMK nodes (1 per CPMK, contoh)
  cpmkList.forEach((cpmk, i) => {
    const subId = `sub_cpmk_${i}`;
    const subItems = [`Sub-CPMK ${i * 2 + 1}`, `Sub-CPMK ${i * 2 + 2}`];
    nodes.push({
      id: subId,
      type: 'subCpmkNode',
      position: { x: GAP_X * 4, y: i * 120 },
      data: { items: subItems, cpmkIndex: i + 1 },
    });
    edges.push({
      id: `cpmk-sub-${i}`,
      source: 'cpmk', target: subId,
      style: EDGE_STYLE,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
    });
  });

  // Relasi MK node (kiri bawah)
  nodes.push({
    id: 'relasi',
    type: 'relasiMKNode',
    position: { x: -20, y: 320 },
    data: {
      atas: [`${mk.kode_mk?.replace(/\d/, v => String(parseInt(v) + 1))} (Sem.${(mk.semester || 1) + 1})`],
      sama: [mk.kode_mk + ' (Sem.' + mk.semester + ')', 'Kode-MK-Lain (Sem.' + mk.semester + ')'],
      bawah: [`Pra: ${mk.nama_mk?.split(' ')[0] || 'Prasyarat'} ${(mk.semester || 2) - 1}`],
    },
  });
  edges.push({
    id: 'mk-relasi',
    source: 'mk', target: 'relasi',
    style: { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5,4' },
    type: 'straight',
  });

  return { nodes, edges };
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function NodeMode({ user }) {
  const [mkList, setMkList] = useState([]);
  const [selectedMk, setSelectedMk] = useState(null);
  const [cplList, setCplList] = useState([]);
  const [cpmkList, setCpmkList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [versiList, setVersiList] = useState([]);
  const [selectedVersi, setSelectedVersi] = useState('');
  const [jenjang, setJenjang] = useState('S1');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load versi & MK list
  useEffect(() => {
    supabase.from('versi_kurikulum').select('*').order('tahun_mulai').then(({ data }) => {
      setVersiList(data || []);
      const aktif = (data || []).find(v => v.status === 'aktif' && v.jenjang === 'S1');
      if (aktif) setSelectedVersi(aktif.id);
    });
  }, []);

  useEffect(() => {
    supabase
      .from('master_mata_kuliah')
      .select('id, kode_mk, nama_mk, sks, semester, jenjang, deskripsi_mk')
      .eq('jenjang', jenjang)
      .order('semester')
      .order('kode_mk')
      .then(({ data }) => {
        setMkList(data || []);
        if (data?.length) setSelectedMk(data[0]);
      });
  }, [jenjang]);

  // Load CPL & CPMK for selected MK
  useEffect(() => {
    if (!selectedMk) return;
    setLoading(true);

    Promise.all([
      supabase.from('master_cpl').select('kode_cpl, deskripsi, deskripsi_singkat').order('kode_cpl'),
      supabase.from('dokumen_cpmk').select('id, nama_cpmk, deskripsi').eq('mk_id', selectedMk.id).order('created_at'),
    ]).then(([cplRes, cpmkRes]) => {
      setCplList(cplRes.data || []);
      setCpmkList(cpmkRes.data || []);
      setLoading(false);
    });
  }, [selectedMk]);

  // Build graph when data changes
  useEffect(() => {
    if (!selectedMk) return;
    const { nodes: n, edges: e } = buildGraph(selectedMk, cplList, cpmkList);
    setNodes(n);
    setEdges(e);
    setSelectedNode(null);
  }, [selectedMk, cplList, cpmkList, setNodes, setEdges]);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  const filteredMk = useMemo(() =>
    mkList.filter(mk =>
      mk.nama_mk?.toLowerCase().includes(searchQ.toLowerCase()) ||
      mk.kode_mk?.toLowerCase().includes(searchQ.toLowerCase())
    ), [mkList, searchQ]);

  const stats = useMemo(() => ({
    mk: 1,
    cpl: cplList.length,
    bk: cpmkList.length,
    cpmk: cpmkList.length,
    sub: cpmkList.length * 2,
  }), [cplList, cpmkList]);

  return (
    <div style={{ display: 'flex', height: '100vh', paddingRight: 'var(--rail-width, 44px)', overflow: 'hidden', background: '#EDF3F9', transition: 'padding-right 0.2s ease' }}>

      {/* ── Left Sidebar: MK list ── */}
      {sidebarOpen && (
        <div style={{
          width: 260,
          height: '100vh',
          background: 'white',
          borderRight: '1px solid #e0e8f0',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          zIndex: 10,
        }}>
          {/* Header */}
          <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: 1, textTransform: 'uppercase' }}>
                  NODE MODE
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Peta Kurikulum</div>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <Icon name="chevron_left" size={20} />
              </button>
            </div>

            {/* Jenjang tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
              {['S1', 'PPAr', 'S2', 'S3'].map(j => (
                <button key={j} onClick={() => setJenjang(j)} style={{
                  flex: 1, padding: '5px 2px', fontSize: 11, fontWeight: 600,
                  borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: jenjang === j ? 'var(--color-primary)' : '#f5f5f5',
                  color: jenjang === j ? 'white' : '#666',
                }}>{j}</button>
              ))}
            </div>

            {/* Versi selector */}
            <select
              value={selectedVersi}
              onChange={e => setSelectedVersi(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px', fontSize: 12,
                border: '1px solid #e0e8f0', borderRadius: 8,
                background: '#f8fafc', color: '#333', marginBottom: 10,
              }}
            >
              {versiList.filter(v => v.jenjang === jenjang).map(v => (
                <option key={v.id} value={v.id}>{v.nama}</option>
              ))}
            </select>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Icon name="search" size={14} style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'
              }} />
              <input
                type="text"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Cari mata kuliah..."
                style={{
                  width: '100%', padding: '7px 10px 7px 28px', fontSize: 12,
                  border: '1px solid #e0e8f0', borderRadius: 8,
                  background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* MK list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {filteredMk.map(mk => (
              <button
                key={mk.id}
                onClick={() => setSelectedMk(mk)}
                style={{
                  width: '100%', padding: '10px 16px', textAlign: 'left',
                  background: selectedMk?.id === mk.id ? 'rgba(42,100,150,0.08)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  borderLeft: selectedMk?.id === mk.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 6px',
                    background: '#f0f0f0', borderRadius: 4, color: '#555', fontFamily: 'monospace',
                  }}>{mk.kode_mk}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>Sem.{mk.semester} · {mk.sks} SKS</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: selectedMk?.id === mk.id ? 600 : 400, color: '#1a1a1a', lineHeight: 1.3 }}>
                  {mk.nama_mk}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Canvas ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              position: 'absolute', top: 16, left: 16, zIndex: 10,
              background: 'white', border: '1px solid #e0e8f0', borderRadius: 8,
              padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, color: '#333', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Icon name="menu" size={16} /> Daftar MK
          </button>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="spinner spinner-primary" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 13, color: '#888' }}>Memuat graph…</div>
            </div>
          </div>
        ) : !selectedMk ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <Icon name="account_tree" size={48} />
              <div style={{ fontSize: 14, marginTop: 12 }}>Pilih mata kuliah dari daftar</div>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant="dots"
              gap={24}
              size={1}
              color="#aac8df"
              style={{ background: '#EDF3F9' }}
            />
            <Controls
              style={{ background: 'white', border: '1px solid #e0e8f0', borderRadius: 8 }}
            />
            <MiniMap
              style={{
                background: 'white',
                border: '1px solid #e0e8f0',
                borderRadius: 8,
              }}
              maskColor="rgba(42,100,150,0.08)"
            />

            {/* MK info panel (top-left of canvas) */}
            <Panel position="top-left" style={{ margin: 16 }}>
              <div style={{
                background: 'white', borderRadius: 12,
                border: '1px solid #e0e8f0',
                padding: '14px 18px', maxWidth: 300,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                  {selectedMk.kode_mk} · {selectedMk.sks} SKS · Semester {selectedMk.semester}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
                  {selectedMk.nama_mk}
                </div>
                {selectedMk.deskripsi_mk && (
                  <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>
                    {selectedMk.deskripsi_mk.slice(0, 120)}{selectedMk.deskripsi_mk.length > 120 ? '…' : ''}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                  Semua hasil generator (Deskripsi, CPL, BK, CPMK, Sub-CPMK) tampil sebagai peta node. Klik node untuk membuka panel edit.
                </div>
              </div>
            </Panel>
          </ReactFlow>
        )}
      </div>

      {/* ── Right Panel: Properti ── */}
      {rightOpen ? (
        <div style={{
          width: 240,
          height: '100vh',
          background: 'white',
          borderLeft: '1px solid #e0e8f0',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflowY: 'auto',
          zIndex: 10,
        }}>
          {/* Header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Properti</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <Icon name="tune" size={18} />
              </button>
              <button onClick={() => setRightOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <Icon name="chevron_right" size={18} />
              </button>
            </div>
          </div>

          <div style={{ padding: '12px 16px', flex: 1 }}>
            {/* Periode */}
            <Section title="Periode">
              <select style={{
                width: '100%', padding: '6px 10px', fontSize: 12,
                border: '1px solid #e0e8f0', borderRadius: 8, background: '#f8fafc',
              }}>
                {versiList.map(v => <option key={v.id} value={v.id}>{v.nama}</option>)}
              </select>
            </Section>

            {/* Struktur Kurikulum */}
            <Section title="Struktur Kurikulum">
              {['Sarjana', 'PPAr', 'Magister', 'Doktor'].map(j => (
                <label key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', fontSize: 12 }}>
                  <input
                    type="radio"
                    name="jenjang_right"
                    checked={jenjang === (j === 'Sarjana' ? 'S1' : j === 'Magister' ? 'S2' : j === 'Doktor' ? 'S3' : j)}
                    onChange={() => setJenjang(j === 'Sarjana' ? 'S1' : j === 'Magister' ? 'S2' : j === 'Doktor' ? 'S3' : j)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  {j}
                </label>
              ))}
            </Section>

            {/* Node Connector Legend */}
            <Section title="Node Connector">
              {Object.entries(NODE_COLORS).map(([key, c]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.border, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#333' }}>{c.title}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 20, height: 2, borderTop: '2px dashed #94a3b8', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#333' }}>Relasi antar semester</span>
              </div>
            </Section>

            {/* Selected Node Properties */}
            {selectedNode && (
              <Section title="Properti Node">
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: NODE_COLORS[selectedNode.type?.replace('Node', '')] ? NODE_COLORS[selectedNode.type.replace('Node', '')].border : '#94a3b8',
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{selectedNode.type?.replace('Node', '').replace('_', '-').toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
                    <div>ID: {selectedNode.id}</div>
                    {selectedNode.data?.kode && <div>Kode: {selectedNode.data.kode}</div>}
                    {selectedNode.data?.sks && <div>SKS: {selectedNode.data.sks}</div>}
                    {selectedNode.data?.items && <div>Item: {selectedNode.data.items.length}</div>}
                  </div>
                </div>
              </Section>
            )}

            {/* Statistik */}
            <Section title="Statistik">
              {[
                ['MK', stats.mk],
                ['CPL', stats.cpl],
                ['Bahan Kajian', stats.bk],
                ['CPMK', stats.cpmk],
                ['Sub-CPMK', stats.sub],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#333' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>{val}</span>
                </div>
              ))}
            </Section>

            {/* Keterangan */}
            <Section title="Keterangan">
              {Object.entries(NODE_COLORS).map(([key, c]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: c.bg, border: `1px solid ${c.border}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#333' }}>{c.title}</span>
                </div>
              ))}
            </Section>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setRightOpen(true)}
          style={{
            position: 'fixed', top: 16, right: 'calc(var(--rail-width, 44px) + 16px)',
            transition: 'right 0.2s ease',
            background: 'white', border: '1px solid #e0e8f0', borderRadius: 8,
            padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, color: '#333', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 50,
          }}
        >
          <Icon name="tune" size={16} /> Properti
        </button>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}
