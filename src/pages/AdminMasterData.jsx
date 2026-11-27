import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// ── Konstanta ────────────────────────────────────────────────────────────────
const RMK_COLOR = {
  PA:   { bg: '#e8f0fe', text: '#1a5cb8', label: 'Perancangan Arsitektur' },
  TS:   { bg: '#fff3e0', text: '#b45309', label: 'Teori Sejarah Kritik' },
  ST:   { bg: '#e8f5e9', text: '#2e7d32', label: 'Sains Teknologi' },
  PP:   { bg: '#fce4ec', text: '#c2185b', label: 'Perumahan & Permukiman' },
  PK:   { bg: '#ede7f6', text: '#6a1b9a', label: 'Perancangan Kota' },
  DL:   { bg: '#f5f5f5', text: '#616161', label: 'Non Departemen/ITS' },
  PPAr: { bg: '#e0f7fa', text: '#00695c', label: 'Praktik Profesi' },
  SKPB: { bg: '#fff9c4', text: '#f57f17', label: 'Kurikulum Bersama ITS' },
  Umum: { bg: '#f3e5f5', text: '#7b1fa2', label: 'Umum/Wajib' },
};

const JENJANG_LIST = ['S1', 'Profesi', 'S2', 'S3'];
const TIPE_LIST    = ['Studio', 'Teoritik'];

function RmkBadge({ rmk }) {
  const c = RMK_COLOR[rmk] || { bg: '#f5f5f5', text: '#555' };
  return (
    <span style={{
      display: 'inline-block', padding: '1px 7px', borderRadius: 4,
      fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
      background: c.bg, color: c.text,
    }}>{rmk || '—'}</span>
  );
}

function StatusDot({ status }) {
  const aktif = status === 'Aktif';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: aktif ? '#16a34a' : '#dc2626', flexShrink: 0,
      }} />
      <span style={{ color: aktif ? '#16a34a' : '#dc2626' }}>{status || 'Tidak Aktif'}</span>
    </span>
  );
}

// ── Komponen tabel spreadsheet ───────────────────────────────────────────────
function MKTable({ data, onDelete, onEdit, isAdmin }) {
  const cols = [
    { key: 'kode_mk',  label: 'Kode',       width: 110 },
    { key: 'nama_mk',  label: 'Nama Mata Kuliah', width: 280, flex: true },
    { key: 'sks',      label: 'SKS',         width: 48,  align: 'center' },
    { key: 'jenjang',  label: 'Jenjang',     width: 72,  align: 'center' },
    { key: 'rmk',      label: 'RMK',         width: 72,  align: 'center' },
    { key: 'tipe',     label: 'Tipe',        width: 80 },
    { key: 'semester', label: 'Sem',         width: 48,  align: 'center' },
    { key: 'status',   label: 'Status',      width: 90 },
  ];

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e4e7ec', borderRadius: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f8f9fb', borderBottom: '1px solid #e4e7ec' }}>
            {cols.map(c => (
              <th key={c.key} style={{
                padding: '8px 10px', textAlign: c.align || 'left',
                fontWeight: 600, fontSize: 11, color: '#6b7280',
                letterSpacing: 0.5, whiteSpace: 'nowrap',
                width: c.flex ? undefined : c.width,
                minWidth: c.width,
              }}>{c.label}</th>
            ))}
            {isAdmin && <th style={{ width: 32, padding: '8px 6px' }} />}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr><td colSpan={cols.length + 1} style={{ textAlign: 'center', padding: 32, color: '#aaa', fontSize: 13 }}>Tidak ada data</td></tr>
          )}
          {data.map((mk, i) => (
            <tr
              key={mk.id}
              style={{
                borderBottom: '1px solid #f0f0f0',
                background: i % 2 === 0 ? 'white' : '#fafafa',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafafa'}
            >
              <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#1a5cb8', whiteSpace: 'nowrap' }}>
                {mk.kode_mk}
              </td>
              <td style={{ padding: '7px 10px', fontWeight: 500, color: '#111' }}>{mk.nama_mk}</td>
              <td style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 700 }}>{mk.sks}</td>
              <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#555' }}>{mk.jenjang}</span>
              </td>
              <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                <RmkBadge rmk={mk.rmk} />
              </td>
              <td style={{ padding: '7px 10px' }}>
                <span style={{
                  fontSize: 11, padding: '1px 7px', borderRadius: 4,
                  background: mk.tipe === 'Studio' ? '#fff3e0' : '#f3f4f6',
                  color: mk.tipe === 'Studio' ? '#c05600' : '#374151',
                  fontWeight: 500,
                }}>{mk.tipe}</span>
              </td>
              <td style={{ padding: '7px 10px', textAlign: 'center', color: '#6b7280' }}>{mk.semester}</td>
              <td style={{ padding: '7px 10px' }}>
                <StatusDot status={mk.status} />
              </td>
              {isAdmin && (
                <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                  <button
                    onClick={() => onDelete(mk.id, mk.kode_mk)}
                    title="Hapus"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#dc2626', fontSize: 14, padding: '2px 4px', borderRadius: 4,
                      opacity: 0.5, transition: 'opacity 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                  >✕</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Komponen tabel CPL ───────────────────────────────────────────────────────
function CPLTable({ data, onDelete, isAdmin }) {
  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e4e7ec', borderRadius: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f8f9fb', borderBottom: '1px solid #e4e7ec' }}>
            {['Jenjang','Nomor','Kategori','Deskripsi (ID)','Deskripsi (EN)'].map(h => (
              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#6b7280', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
            {isAdmin && <th style={{ width: 32 }} />}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#aaa', fontSize: 13 }}>Tidak ada data</td></tr>
          )}
          {data.map((cpl, i) => (
            <tr
              key={cpl.id}
              style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafafa'}
            >
              <td style={{ padding: '7px 10px' }}><span style={{ fontSize: 11, fontWeight: 600 }}>{cpl.jenjang}</span></td>
              <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#1a5cb8', whiteSpace: 'nowrap' }}>{cpl.nomor_cpl}</td>
              <td style={{ padding: '7px 10px', color: '#6b7280', fontSize: 12 }}>{cpl.kategori || '—'}</td>
              <td style={{ padding: '7px 10px', maxWidth: 320 }}><span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cpl.deskripsi_id}</span></td>
              <td style={{ padding: '7px 10px', maxWidth: 280, color: '#6b7280', fontSize: 12 }}><span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cpl.deskripsi_en || '—'}</span></td>
              {isAdmin && (
                <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                  <button onClick={() => onDelete(cpl.id)} title="Hapus"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 14, padding: '2px 4px', opacity: 0.5 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                  >✕</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Modal tambah MK ──────────────────────────────────────────────────────────
function ModalTambahMK({ onClose, onSave, msg, error }) {
  const [form, setForm] = useState({
    kode_mk: '', nama_mk: '', sks: 3, jenjang: 'S1', semester: 1,
    tipe: 'Teoritik', rmk: 'PA', status: 'Aktif', departemen: 'Arsitektur',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Tambah Mata Kuliah</h3>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Kode MK *</label>
            <input style={inputStyle} value={form.kode_mk} onChange={e => setForm({...form, kode_mk: e.target.value})} placeholder="CA234503" />
          </div>
          <div>
            <label style={labelStyle}>SKS *</label>
            <input type="number" min={1} max={12} style={inputStyle} value={form.sks} onChange={e => setForm({...form, sks: Number(e.target.value)})} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Nama Mata Kuliah *</label>
          <input style={inputStyle} value={form.nama_mk} onChange={e => setForm({...form, nama_mk: e.target.value})} placeholder="Berfikir Merancang Digital" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Jenjang</label>
            <select style={inputStyle} value={form.jenjang} onChange={e => setForm({...form, jenjang: e.target.value})}>
              {JENJANG_LIST.map(j => <option key={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Semester</label>
            <input type="number" min={1} max={8} style={inputStyle} value={form.semester} onChange={e => setForm({...form, semester: Number(e.target.value)})} />
          </div>
          <div>
            <label style={labelStyle}>Tipe</label>
            <select style={inputStyle} value={form.tipe} onChange={e => setForm({...form, tipe: e.target.value})}>
              {TIPE_LIST.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>RMK</label>
            <select style={inputStyle} value={form.rmk} onChange={e => setForm({...form, rmk: e.target.value})}>
              {Object.keys(RMK_COLOR).map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option>Aktif</option><option>Tidak Aktif</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #e4e7ec', background: 'white', cursor: 'pointer', fontSize: 14 }}>Batal</button>
          <button onClick={() => onSave(form)} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#1a5cb8', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Simpan</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal tambah CPL ─────────────────────────────────────────────────────────
function ModalTambahCPL({ onClose, onSave, error }) {
  const [form, setForm] = useState({ jenjang: 'S1', nomor_cpl: '', kategori: '', deskripsi_id: '', deskripsi_en: '' });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 28, width: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Tambah CPL</h3>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Jenjang</label>
            <select style={inputStyle} value={form.jenjang} onChange={e => setForm({...form, jenjang: e.target.value})}>
              {JENJANG_LIST.map(j => <option key={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Nomor CPL *</label>
            <input style={inputStyle} value={form.nomor_cpl} onChange={e => setForm({...form, nomor_cpl: e.target.value})} placeholder="CPL-1" />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Kategori <span style={{ opacity: 0.5, fontWeight: 400 }}>opsional</span></label>
          <input style={inputStyle} value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} placeholder="Sikap / Ketrampilan / Pengetahuan" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Deskripsi (Indonesia) *</label>
          <textarea rows={3} style={{...inputStyle, resize: 'vertical'}} value={form.deskripsi_id} onChange={e => setForm({...form, deskripsi_id: e.target.value})} placeholder="Mampu menerapkan..." />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Deskripsi (English) <span style={{ opacity: 0.5, fontWeight: 400 }}>opsional</span></label>
          <textarea rows={3} style={{...inputStyle, resize: 'vertical'}} value={form.deskripsi_en} onChange={e => setForm({...form, deskripsi_en: e.target.value})} placeholder="Able to apply..." />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #e4e7ec', background: 'white', cursor: 'pointer', fontSize: 14 }}>Batal</button>
          <button onClick={() => onSave(form)} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#1a5cb8', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Simpan</button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, letterSpacing: 0.3 };
const inputStyle = { width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };

// ── Halaman utama ────────────────────────────────────────────────────────────
export default function AdminMasterData({ user }) {
  const [tab, setTab] = useState('mk');
  const [daftarMK, setDaftarMK] = useState([]);
  const [daftarCPL, setDaftarCPL] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Filter state
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [filterRMK, setFilterRMK] = useState('');
  const [filterTipe, setFilterTipe] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal
  const [showModalMK, setShowModalMK] = useState(false);
  const [showModalCPL, setShowModalCPL] = useState(false);
  const [modalError, setModalError] = useState('');

  // Toast
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const { data: profil } = await supabase.from('profil_dosen').select('role').eq('id', user.id).single();
    setIsAdmin(profil?.role === 'admin');
    const [{ data: mkData }, { data: cplData }] = await Promise.all([
      supabase.from('master_mata_kuliah').select('*').order('kode_mk'),
      supabase.from('master_cpl').select('*').order('jenjang, nomor_cpl'),
    ]);
    setDaftarMK(mkData || []);
    setDaftarCPL(cplData || []);
    setLoading(false);
  };

  // ── Filter logic ────────────────────────────────────────────────────────
  const filteredMK = daftarMK.filter(mk => {
    const q = search.toLowerCase();
    if (q && !mk.kode_mk?.toLowerCase().includes(q) && !mk.nama_mk?.toLowerCase().includes(q)) return false;
    if (filterJenjang && mk.jenjang !== filterJenjang) return false;
    if (filterRMK && mk.rmk !== filterRMK) return false;
    if (filterTipe && mk.tipe !== filterTipe) return false;
    if (filterStatus && mk.status !== filterStatus) return false;
    return true;
  });

  const filteredCPL = daftarCPL.filter(cpl => {
    const q = search.toLowerCase();
    if (q && !cpl.nomor_cpl?.toLowerCase().includes(q) && !cpl.deskripsi_id?.toLowerCase().includes(q)) return false;
    if (filterJenjang && cpl.jenjang !== filterJenjang) return false;
    return true;
  });

  // ── CRUD ────────────────────────────────────────────────────────────────
  const simpanMK = async (form) => {
    setModalError('');
    if (!form.kode_mk || !form.nama_mk) { setModalError('Kode dan Nama MK wajib diisi.'); return; }
    const { error } = await supabase.from('master_mata_kuliah').insert(form);
    if (error) { setModalError('Gagal: ' + error.message); return; }
    setShowModalMK(false);
    notify('Mata kuliah berhasil ditambahkan.');
    loadAll();
  };

  const hapusMK = async (id, kode) => {
    if (!window.confirm(`Hapus "${kode}"? Dokumen terkait akan terpengaruh.`)) return;
    await supabase.from('master_mata_kuliah').delete().eq('id', id);
    notify('Mata kuliah dihapus.', 'info');
    loadAll();
  };

  const simpanCPL = async (form) => {
    setModalError('');
    if (!form.nomor_cpl || !form.deskripsi_id) { setModalError('Nomor dan Deskripsi CPL wajib diisi.'); return; }
    const { error } = await supabase.from('master_cpl').insert(form);
    if (error) { setModalError('Gagal: ' + error.message); return; }
    setShowModalCPL(false);
    notify('CPL berhasil ditambahkan.');
    loadAll();
  };

  const hapusCPL = async (id) => {
    if (!window.confirm('Hapus CPL ini?')) return;
    await supabase.from('master_cpl').delete().eq('id', id);
    notify('CPL dihapus.', 'info');
    loadAll();
  };

  // ── Import CSV ──────────────────────────────────────────────────────────
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']));
    }).filter(r => r['KODE'] && r['NAMA MK']);

    const toInsert = rows.map(r => ({
      kode_mk: r['KODE'],
      nama_mk: r['NAMA MK'],
      sks: parseInt(r['SKS']) || 3,
      jenjang: r['PRODI'] || 'S1',
      rmk: r['RMK'] || '',
      tipe: r['TIPE'] || 'Teoritik',
      status: r['STATUS'] || 'Aktif',
      departemen: 'Arsitektur',
    }));

    const { error } = await supabase.from('master_mata_kuliah').upsert(toInsert, { onConflict: 'kode_mk' });
    if (error) { notify('Import gagal: ' + error.message, 'error'); return; }
    notify(`${toInsert.length} MK berhasil diimpor/diperbarui.`);
    loadAll();
    e.target.value = '';
  };

  // ── Render ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 28, height: 28, border: '3px solid #e4e7ec', borderTopColor: '#1a5cb8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ color: '#888', fontSize: 13 }}>Memuat data...</span>
    </div>
  );

  const isMKTab = tab === 'mk';

  return (
    <div style={{ paddingRight: 'var(--rail-width, 44px)', minHeight: '100vh', background: '#f8f9fb' }}>
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 2000,
          padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          background: toast.type === 'error' ? '#fee2e2' : toast.type === 'info' ? '#f0f9ff' : '#dcfce7',
          color: toast.type === 'error' ? '#dc2626' : toast.type === 'info' ? '#0369a1' : '#16a34a',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          animation: 'fadeIn 0.2s ease',
        }}>{toast.msg}</div>
      )}

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 48px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Master Data</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>
              {isMKTab ? 'Mata Kuliah' : 'Capaian Pembelajaran Lulusan (CPL)'}
            </h1>
            <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>
              {isMKTab
                ? `${filteredMK.length} dari ${daftarMK.length} mata kuliah ditampilkan`
                : `${filteredCPL.length} dari ${daftarCPL.length} CPL ditampilkan`}
            </p>
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {isMKTab && (
                <>
                  <label style={{
                    padding: '8px 14px', borderRadius: 7, border: '1px solid #d1d5db',
                    background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}>
                    ↑ Import CSV
                    <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImportCSV} />
                  </label>
                  <button onClick={() => { setShowModalMK(true); setModalError(''); }}
                    style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: '#1a5cb8', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    + Tambah MK
                  </button>
                </>
              )}
              {!isMKTab && (
                <button onClick={() => { setShowModalCPL(true); setModalError(''); }}
                  style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: '#1a5cb8', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  + Tambah CPL
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid #e4e7ec', paddingBottom: 0 }}>
          {[{ key: 'mk', label: `Mata Kuliah`, count: daftarMK.length }, { key: 'cpl', label: 'CPL', count: daftarCPL.length }].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setFilterJenjang(''); setFilterRMK(''); setFilterTipe(''); setFilterStatus(''); }}
              style={{
                padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                color: tab === t.key ? '#1a5cb8' : '#888',
                borderBottom: tab === t.key ? '2px solid #1a5cb8' : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.15s',
              }}
            >
              {t.label} <span style={{ marginLeft: 4, fontSize: 11, background: tab === t.key ? '#e8f0fe' : '#f3f4f6', color: tab === t.key ? '#1a5cb8' : '#888', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* ── Filter bar ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: 14 }}>⌕</span>
            <input
              type="text"
              placeholder={isMKTab ? 'Cari kode atau nama MK...' : 'Cari nomor atau deskripsi CPL...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 30, background: 'white' }}
            />
          </div>

          <select value={filterJenjang} onChange={e => setFilterJenjang(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 90, flex: '0 0 auto' }}>
            <option value="">Semua Jenjang</option>
            {JENJANG_LIST.map(j => <option key={j}>{j}</option>)}
          </select>

          {isMKTab && (
            <>
              <select value={filterRMK} onChange={e => setFilterRMK(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 90, flex: '0 0 auto' }}>
                <option value="">Semua RMK</option>
                {Object.keys(RMK_COLOR).map(r => <option key={r}>{r}</option>)}
              </select>
              <select value={filterTipe} onChange={e => setFilterTipe(e.target.value)} style={{ ...inputStyle, width: 'auto', flex: '0 0 auto' }}>
                <option value="">Semua Tipe</option>
                {TIPE_LIST.map(t => <option key={t}>{t}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', flex: '0 0 auto' }}>
                <option value="">Semua Status</option>
                <option>Aktif</option>
                <option>Tidak Aktif</option>
              </select>
            </>
          )}

          {(search || filterJenjang || filterRMK || filterTipe || filterStatus) && (
            <button onClick={() => { setSearch(''); setFilterJenjang(''); setFilterRMK(''); setFilterTipe(''); setFilterStatus(''); }}
              style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #e4e7ec', background: 'white', cursor: 'pointer', fontSize: 12, color: '#6b7280' }}>
              ✕ Reset
            </button>
          )}
        </div>

        {/* ── Legenda RMK ── */}
        {isMKTab && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {Object.entries(RMK_COLOR).map(([k, v]) => (
              <button key={k} onClick={() => setFilterRMK(filterRMK === k ? '' : k)}
                style={{
                  padding: '2px 10px', borderRadius: 20, border: `1px solid ${filterRMK === k ? v.text : 'transparent'}`,
                  background: filterRMK === k ? v.bg : '#f3f4f6',
                  color: filterRMK === k ? v.text : '#888',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {k} · {v.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Tabel ── */}
        <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {isMKTab
            ? <MKTable data={filteredMK} onDelete={hapusMK} isAdmin={isAdmin} />
            : <CPLTable data={filteredCPL} onDelete={hapusCPL} isAdmin={isAdmin} />
          }
        </div>

      </main>

      {/* ── Modals ── */}
      {showModalMK && <ModalTambahMK onClose={() => setShowModalMK(false)} onSave={simpanMK} error={modalError} />}
      {showModalCPL && <ModalTambahCPL onClose={() => setShowModalCPL(false)} onSave={simpanCPL} error={modalError} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
