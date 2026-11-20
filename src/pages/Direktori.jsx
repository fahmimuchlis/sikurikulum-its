import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';

export default function Direktori({ user }) {
  const [dokumenList, setDokumenList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [filterStatus, setFilterStatus] = useState('selesai');

  useEffect(() => {
    loadDirektori();
  }, []);

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
    <>
      <Navbar user={user} />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>
            📚 Direktori Kurikulum
          </h1>
          <p style={{ color: 'var(--color-gray-500)', fontSize: 14 }}>
            Lihat dokumen RPS/SAP dari seluruh dosen untuk keselarasan kurikulum. (Hanya baca)
          </p>
        </div>

        {/* Filter bar */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
          background: 'white',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-gray-200)',
        }}>
          <input
            className="form-input"
            style={{ flex: 1, minWidth: 200 }}
            placeholder="🔍 Cari nama MK, kode, atau nama dosen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="form-select"
            style={{ width: 160 }}
            value={filterJenjang}
            onChange={e => setFilterJenjang(e.target.value)}
          >
            <option value="">Semua Jenjang</option>
            {jenjangList.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <select
            className="form-select"
            style={{ width: 160 }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="selesai">Selesai</option>
            <option value="draft">Draf</option>
            <option value="belum">Belum</option>
          </select>
        </div>

        {/* Info jumlah */}
        <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--color-gray-500)' }}>
          Menampilkan {filtered.length} dari {dokumenList.length} dokumen
        </div>

        {loading ? (
          <div className="page-loader" style={{ minHeight: 300 }}>
            <div className="spinner spinner-primary"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-gray-500)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p>Tidak ada dokumen yang cocok dengan filter Anda.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map(dok => (
              <DirektoriRow key={dok.id} dok={dok} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function DirektoriRow({ dok }) {
  const mk = dok.master_mata_kuliah;
  const dosen = dok.profil_dosen;

  const statusStyle = {
    selesai: { background: '#D1FAE5', color: '#065F46' },
    draft: { background: '#FEF3C7', color: '#92400E' },
    belum: { background: '#F1F5F9', color: '#64748B' },
  };
  const st = statusStyle[dok.status] || statusStyle.belum;

  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
              background: 'var(--color-gray-100)', color: 'var(--color-gray-700)',
              padding: '2px 8px', borderRadius: 4,
            }}>
              {mk?.kode_mk}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              background: '#EEF2FF', color: '#3730A3',
              padding: '2px 8px', borderRadius: 4,
            }}>
              {mk?.jenjang}
            </span>
            <span style={{
              fontSize: 11,
              background: st.background, color: st.color,
              padding: '2px 8px', borderRadius: 4, fontWeight: 600,
            }}>
              {dok.status === 'selesai' ? '● Selesai' : dok.status === 'draft' ? '◑ Draf' : '○ Belum'}
            </span>
          </div>
          <h3 style={{ fontWeight: 600, fontSize: 15 }}>{mk?.nama_mk}</h3>
          <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 2 }}>
            {mk?.sks} SKS · Semester {mk?.semester}
          </p>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-700)' }}>
            {dosen?.nama_lengkap || 'Nama tidak tersedia'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-gray-400)' }}>
            {dosen?.nidn ? `NIDN: ${dosen.nidn}` : ''}
          </div>
        </div>

        <Link
          to={`/dokumen/${dok.id}`}
          className="btn btn-secondary btn-sm"
        >
          👁 Lihat Dokumen
        </Link>
      </div>
    </div>
  );
}
