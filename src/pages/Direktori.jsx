import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Icon from '../components/Icon';

export default function Direktori({ user }) {
  const [dokumenList, setDokumenList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [filterStatus, setFilterStatus] = useState('selesai');

  useEffect(() => { loadDirektori(); }, []);

  const loadDirektori = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('dokumen_silabus')
      .select(`
        id, status, updated_at,
        master_mata_kuliah (kode_mk, nama_mk, sks, jenjang, semester),
        profil_dosen (nama_lengkap, nidn)
      `)
      .order('updated_at', { ascending: false });
    setDokumenList(data || []);
    setLoading(false);
  };

  const jenjangList = [...new Set(dokumenList.map(d => d.master_mata_kuliah?.jenjang).filter(Boolean))];

  const filtered = dokumenList.filter(d => {
    const mk = d.master_mata_kuliah;
    const matchSearch =
      !search ||
      mk?.nama_mk?.toLowerCase().includes(search.toLowerCase()) ||
      mk?.kode_mk?.toLowerCase().includes(search.toLowerCase()) ||
      d.profil_dosen?.nama_lengkap?.toLowerCase().includes(search.toLowerCase());
    const matchJenjang = !filterJenjang || mk?.jenjang === filterJenjang;
    const matchStatus = !filterStatus || d.status === filterStatus;
    return matchSearch && matchJenjang && matchStatus;
  });

  return (
    <div>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '56px 24px 48px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#e91e8c', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Departemen Arsitektur ITS
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
            Direktori Kurikulum
          </h1>
          <p style={{ color: '#888', fontSize: 13 }}>
            Lihat dokumen RPS/SAP dari seluruh dosen untuk keselarasan kurikulum. (Hanya baca)
          </p>
        </div>

        {/* Filter bar */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap',
          background: 'white', padding: '14px 16px',
          borderRadius: 16, border: '1px solid #f0f0f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Icon name="search" size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#bbb', pointerEvents: 'none' }} />
            <input
              style={{ width: '100%', border: '1px solid #efefef', borderRadius: 10, padding: '7px 12px 7px 32px', fontSize: 13, outline: 'none', background: '#fafafa', boxSizing: 'border-box' }}
              placeholder="Cari nama MK, kode, atau nama dosen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            style={{ border: '1px solid #efefef', borderRadius: 10, padding: '7px 12px', fontSize: 13, outline: 'none', background: '#fafafa', cursor: 'pointer' }}
            value={filterJenjang}
            onChange={e => setFilterJenjang(e.target.value)}
          >
            <option value="">Semua Jenjang</option>
            {jenjangList.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <select
            style={{ border: '1px solid #efefef', borderRadius: 10, padding: '7px 12px', fontSize: 13, outline: 'none', background: '#fafafa', cursor: 'pointer' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="selesai">Selesai</option>
            <option value="draft">Draf</option>
            <option value="belum">Belum</option>
          </select>
        </div>

        {/* Count */}
        <div style={{ marginBottom: 14, fontSize: 12, color: '#aaa' }}>
          {filtered.length} dari {dokumenList.length} dokumen
        </div>

        {loading ? (
          <div className="page-loader" style={{ minHeight: 300 }}>
            <div className="spinner spinner-primary"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
            <Icon name="search_off" size={40} style={{ color: '#e0e0e0', marginBottom: 12 }} />
            <p style={{ fontSize: 13 }}>Tidak ada dokumen yang cocok dengan filter.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {filtered.map(dok => <DirektoriRow key={dok.id} dok={dok} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function DirektoriRow({ dok }) {
  const mk = dok.master_mata_kuliah;
  const dosen = dok.profil_dosen;

  const ss = {
    selesai: { color: '#166534', bg: '#dcfce7', dot: '#22c55e', label: 'Selesai' },
    draft:   { color: '#c2410c', bg: '#fff3e0', dot: '#f97316', label: 'Draf' },
    belum:   { color: '#777',    bg: '#f5f5f5', dot: '#ccc',    label: 'Belum' },
  }[dok.status] || { color: '#777', bg: '#f5f5f5', dot: '#ccc', label: 'Belum' };

  return (
    <div style={{
      background: 'white', borderRadius: 16,
      border: '1px solid #f0f0f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      padding: '14px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', gap: 7, marginBottom: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, background: '#f0f0f0', color: '#555', padding: '2px 8px', borderRadius: 6 }}>
              {mk?.kode_mk}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 6 }}>
              {mk?.jenjang}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, background: ss.bg, color: ss.color, padding: '2px 10px', borderRadius: 20 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: ss.dot }} />
              {ss.label}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{mk?.nama_mk}</div>
          <div style={{ fontSize: 12, color: '#aaa' }}>{mk?.sks} SKS · Semester {mk?.semester}</div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#444' }}>{dosen?.nama_lengkap || '—'}</div>
          <div style={{ fontSize: 11, color: '#aaa' }}>{dosen?.nidn ? `NIDN: ${dosen.nidn}` : ''}</div>
        </div>

        <Link
          to={`/dokumen/${dok.id}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#fce4ec', color: '#e91e8c',
            borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          <Icon name="visibility" size={14} /> Lihat
        </Link>
      </div>
    </div>
  );
}
