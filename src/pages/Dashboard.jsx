import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AppShell from '../components/AppShell';
import Icon from '../components/Icon';

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
      <AppShell user={user}>
        <div className="page-loader" style={{ minHeight: '100vh' }}>
          <div className="spinner spinner-primary"></div>
          <p>Memuat dasbor...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={user}>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '56px 24px 48px' }}>

        {/* Sambutan */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#e91e8c', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Departemen Arsitektur ITS
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
            Selamat datang, {profil?.nama_lengkap?.split(',')[0] || user.email.split('@')[0]} 👋
          </h1>
          <p style={{ color: '#888', fontSize: 14 }}>
            Kelola dokumen kurikulum mata kuliah Anda di bawah ini.
          </p>
        </div>

        {/* Kartu statistik */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 32 }}>
          <StatCard iconName="folder_open" label="Total Dokumen" value={dokumenList.length} color="#e91e8c" bg="#fce4ec" />
          <StatCard iconName="check_circle" label="Selesai" value={stats.selesai} color="#2e7d32" bg="#e8f5e9" />
          <StatCard iconName="edit_note" label="Draf" value={stats.draft} color="#e65100" bg="#fff3e0" />
          <StatCard iconName="radio_button_unchecked" label="Belum Dibuat" value={stats.belum} color="#555" bg="#f5f5f5" />
        </div>

        {/* Banner Admin */}
        {profil?.role === 'admin' && (
          <div style={{
            background: '#fff8f0',
            border: '1px solid #fed7aa',
            borderRadius: 14,
            padding: '14px 20px',
            marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="admin_panel_settings" size={20} style={{ color: '#c2410c' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#7c2d12' }}>Mode Administrator</div>
                <div style={{ fontSize: 12, color: '#b45309' }}>Akses penuh ke data master dan pengaturan sistem.</div>
              </div>
            </div>
            <button
              style={{ background: '#fff', border: '1px solid #fed7aa', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#c2410c', cursor: 'pointer' }}
              onClick={() => navigate('/admin')}
            >
              Panel Admin
            </button>
          </div>
        )}

        {/* Header daftar + tombol buat */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Dokumen Kurikulum Saya</h2>
          <button
            onClick={() => navigate('/form')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#e91e8c', color: 'white',
              border: 'none', borderRadius: 20, padding: '8px 18px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(233,30,140,0.25)',
            }}
          >
            <Icon name="add" size={16} /> Buat Dokumen Baru
          </button>
        </div>

        {/* Daftar dokumen */}
        {dokumenList.length === 0 ? (
          <EmptyState onBuat={() => navigate('/form')} />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {dokumenList.map(dok => (
              <DokumenRow key={dok.id} dok={dok} formatTanggal={formatTanggal} />
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}

function StatCard({ iconName, label, value, color, bg }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '18px 20px',
      border: '1px solid #f0f0f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={iconName} size={20} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

const STATUS_STYLE = {
  belum: { color: '#777', bg: '#f5f5f5', dot: '#ccc' },
  draft: { color: '#c2410c', bg: '#fff3e0', dot: '#f97316' },
  selesai: { color: '#166534', bg: '#dcfce7', dot: '#22c55e' },
};

function DokumenRow({ dok, formatTanggal }) {
  const mk = dok.master_mata_kuliah;
  const st = STATUS_LABEL[dok.status] || STATUS_LABEL.belum;
  const ss = STATUS_STYLE[dok.status] || STATUS_STYLE.belum;

  return (
    <div style={{
      background: 'white', borderRadius: 16,
      border: '1px solid #f0f0f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      padding: '14px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {/* Info MK */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ background: '#f0f0f0', color: '#555', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, fontFamily: 'monospace', letterSpacing: 0.3 }}>
              {mk?.kode_mk}
            </span>
            <span style={{ background: '#ede9fe', color: '#5b21b6', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>
              {mk?.jenjang} · Sem {mk?.semester}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>
            {mk?.nama_mk}
          </div>
          <div style={{ fontSize: 12, color: '#aaa' }}>
            {mk?.sks} SKS · Diperbarui {formatTanggal(dok.updated_at)}
          </div>
        </div>

        {/* Status pill */}
        <span style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: ss.bg, color: ss.color,
          fontSize: 12, fontWeight: 600,
          padding: '4px 12px', borderRadius: 20,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ss.dot, flexShrink: 0 }} />
          {st.label}
        </span>

        {/* Tombol aksi */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/form/${dok.id}`} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#f5f5f5', color: '#444', border: 'none',
            borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 500,
            textDecoration: 'none', cursor: 'pointer',
          }}>
            <Icon name="edit" size={14} /> Edit
          </Link>
          <Link to={`/dokumen/${dok.id}`} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#fce4ec', color: '#e91e8c', border: 'none',
            borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 500,
            textDecoration: 'none', cursor: 'pointer',
          }}>
            <Icon name="visibility" size={14} /> Lihat
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
      borderRadius: 20,
      border: '2px dashed #e8e8e8',
    }}>
      <Icon name="folder_open" size={48} style={{ color: '#e0e0e0', marginBottom: 16 }} />
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#555' }}>
        Belum ada dokumen kurikulum
      </h3>
      <p style={{ color: '#aaa', marginBottom: 24, maxWidth: 320, margin: '0 auto 24px', fontSize: 13 }}>
        Mulai buat dokumen kurikulum pertama Anda. Sistem akan memandu langkah demi langkah.
      </p>
      <button
        onClick={onBuat}
        style={{
          background: '#e91e8c', color: 'white', border: 'none',
          borderRadius: 20, padding: '10px 24px', fontSize: 13,
          fontWeight: 600, cursor: 'pointer',
        }}
      >
        Buat Dokumen Pertama
      </button>
    </div>
  );
}
