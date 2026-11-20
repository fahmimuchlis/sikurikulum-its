import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';

const STATUS_LABEL = {
  belum: { label: 'Belum Dibuat', badgeClass: 'badge-belum', icon: '○' },
  draft: { label: 'Draf', badgeClass: 'badge-draft', icon: '◑' },
  selesai: { label: 'Selesai', badgeClass: 'badge-selesai', icon: '●' },
};

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [profil, setProfil] = useState(null);
  const [dokumenList, setDokumenList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ belum: 0, draft: 0, selesai: 0 });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    setLoading(true);

    // Ambil profil dosen
    const { data: profilData } = await supabase
      .from('profil_dosen')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfil(profilData);

    // Ambil semua dokumen silabus milik dosen ini beserta info MK
    const { data: dokData } = await supabase
      .from('dokumen_silabus')
      .select(`
        id, status, updated_at,
        master_mata_kuliah (kode_mk, nama_mk, sks, jenjang, semester)
      `)
      .eq('dosen_id', user.id)
      .order('updated_at', { ascending: false });

    setDokumenList(dokData || []);

    // Hitung statistik
    const s = { belum: 0, draft: 0, selesai: 0 };
    (dokData || []).forEach(d => { s[d.status] = (s[d.status] || 0) + 1; });
    setStats(s);

    setLoading(false);
  };

  const formatTanggal = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <>
        <Navbar user={user} />
        <div className="page-loader" style={{ minHeight: 'calc(100vh - 60px)' }}>
          <div className="spinner spinner-primary"></div>
          <p>Memuat dasbor...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar user={user} />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Sambutan */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>
            Selamat datang, {profil?.nama_lengkap?.split(',')[0] || user.email}
          </h1>
          <p style={{ color: 'var(--color-gray-500)', fontSize: 15 }}>
            Departemen Arsitektur ITS — Kelola dokumen kurikulum mata kuliah Anda di sini.
          </p>
        </div>

        {/* Kartu statistik */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard icon="📄" label="Total Dokumen" value={dokumenList.length} color="var(--color-primary)" />
          <StatCard icon="✅" label="Selesai" value={stats.selesai} color="var(--color-success)" />
          <StatCard icon="📝" label="Draf" value={stats.draft} color="var(--color-warning)" />
          <StatCard icon="○" label="Belum Dibuat" value={stats.belum} color="var(--color-gray-500)" />
        </div>

        {/* Tombol buat dokumen baru */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Dokumen Kurikulum Saya</h2>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/form')}
          >
            + Buat Dokumen Baru
          </button>
        </div>

        {/* Daftar dokumen */}
        {dokumenList.length === 0 ? (
          <EmptyState onBuat={() => navigate('/form')} />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {dokumenList.map(dok => (
              <DokumenRow key={dok.id} dok={dok} formatTanggal={formatTanggal} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function DokumenRow({ dok, formatTanggal }) {
  const mk = dok.master_mata_kuliah;
  const st = STATUS_LABEL[dok.status] || STATUS_LABEL.belum;

  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* Info MK */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{
              background: 'var(--color-gray-100)',
              color: 'var(--color-gray-700)',
              fontSize: 12,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 4,
              fontFamily: 'monospace',
            }}>
              {mk?.kode_mk}
            </span>
            <span style={{
              background: '#EEF2FF',
              color: '#3730A3',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 4,
            }}>
              {mk?.jenjang} — Sem {mk?.semester}
            </span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-gray-900)' }}>
            {mk?.nama_mk}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 2 }}>
            {mk?.sks} SKS · Diperbarui {formatTanggal(dok.updated_at)}
          </p>
        </div>

        {/* Status badge */}
        <span className={`badge ${st.badgeClass}`}>
          {st.icon} {st.label}
        </span>

        {/* Tombol aksi */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/form/${dok.id}`} className="btn btn-secondary btn-sm">
            ✏️ Edit
          </Link>
          <Link to={`/dokumen/${dok.id}`} className="btn btn-secondary btn-sm">
            👁 Lihat
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onBuat }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 24px',
      background: 'white',
      borderRadius: 'var(--radius-lg)',
      border: '2px dashed var(--color-gray-200)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--color-gray-700)' }}>
        Belum ada dokumen kurikulum
      </h3>
      <p style={{ color: 'var(--color-gray-500)', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
        Mulai buat dokumen kurikulum pertama Anda. Sistem akan memandu Anda langkah demi langkah.
      </p>
      <button className="btn btn-primary" onClick={onBuat}>
        + Buat Dokumen Pertama
      </button>
    </div>
  );
}
