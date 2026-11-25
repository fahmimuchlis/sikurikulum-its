import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Icon from '../components/Icon';

// Halaman admin untuk kelola Master Data MK dan CPL

export default function AdminMasterData({ user }) {
  const [tab, setTab] = useState('mk');
  const [daftarMK, setDaftarMK] = useState([]);
  const [daftarCPL, setDaftarCPL] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Form state MK
  const [formMK, setFormMK] = useState({ kode_mk: '', nama_mk: '', sks: 2, jenjang: 'S1', semester: 1, tipe: 'Teoritik', periode: 'Ganjil', departemen: 'Arsitektur' });
  // Form state CPL
  const [formCPL, setFormCPL] = useState({ jenjang: 'S1', nomor_cpl: '', kategori: '', deskripsi_id: '', deskripsi_en: '' });

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    setLoading(true);
    // Cek role admin
    const { data: profil } = await supabase
      .from('profil_dosen')
      .select('role')
      .eq('id', user.id)
      .single();
    setIsAdmin(profil?.role === 'admin');

    const [{ data: mkData }, { data: cplData }] = await Promise.all([
      supabase.from('master_mata_kuliah').select('*').order('kode_mk'),
      supabase.from('master_cpl').select('*').order('jenjang, nomor_cpl'),
    ]);
    setDaftarMK(mkData || []);
    setDaftarCPL(cplData || []);
    setLoading(false);
  };

  const notify = (m, isError = false) => {
    if (isError) setError(m);
    else setMsg(m);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  };

  // ── Tambah MK ──────────────────────────────────────────────────────────
  const tambahMK = async () => {
    if (!formMK.kode_mk || !formMK.nama_mk) return notify('Kode dan Nama MK wajib diisi.', true);
    const { error: err } = await supabase.from('master_mata_kuliah').insert(formMK);
    if (err) return notify('Gagal: ' + err.message, true);
    notify('✅ MK berhasil ditambahkan.');
    setFormMK({ kode_mk: '', nama_mk: '', sks: 2, jenjang: 'S1', semester: 1, tipe: 'Teoritik', periode: 'Ganjil', departemen: 'Arsitektur' });
    loadAll();
  };

  const hapusMK = async (id) => {
    if (!window.confirm('Hapus MK ini? Dokumen terkait akan terpengaruh.')) return;
    await supabase.from('master_mata_kuliah').delete().eq('id', id);
    notify('MK dihapus.');
    loadAll();
  };

  // ── Tambah CPL ─────────────────────────────────────────────────────────
  const tambahCPL = async () => {
    if (!formCPL.nomor_cpl || !formCPL.deskripsi_id) return notify('Nomor dan Deskripsi CPL wajib diisi.', true);
    const { error: err } = await supabase.from('master_cpl').insert(formCPL);
    if (err) return notify('Gagal: ' + err.message, true);
    notify('✅ CPL berhasil ditambahkan.');
    setFormCPL({ jenjang: 'S1', nomor_cpl: '', kategori: '', deskripsi_id: '', deskripsi_en: '' });
    loadAll();
  };

  const hapusCPL = async (id) => {
    if (!window.confirm('Hapus CPL ini?')) return;
    await supabase.from('master_cpl').delete().eq('id', id);
    notify('CPL dihapus.');
    loadAll();
  };

  if (loading) {
    return (
      <div>
        <div className="page-loader" style={{ minHeight: '100vh' }}>
          <div className="spinner spinner-primary"></div>
          <p>Memuat data admin...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div>
        <main style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <Icon name="lock" size={48} style={{ color: '#e0e0e0', marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Akses Dibatasi</h2>
          <p style={{ color: '#aaa', fontSize: 13 }}>Halaman ini hanya dapat diakses oleh Administrator.</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '56px 24px 48px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>
          ⚙️ Kelola Master Data
        </h1>
        <p style={{ color: 'var(--color-gray-500)', fontSize: 14, marginBottom: 24 }}>
          Tambah/hapus data Mata Kuliah dan CPL yang digunakan dalam sistem.
        </p>

        {msg && <div className="success-msg">{msg}</div>}
        {error && <div className="error-msg">{error}</div>}

        {/* Tab */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[
            { key: 'mk', label: `📋 Mata Kuliah (${daftarMK.length})` },
            { key: 'cpl', label: `🎯 CPL (${daftarCPL.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 20px',
                borderRadius: 6,
                border: 'none',
                fontSize: 14,
                fontWeight: tab === t.key ? 600 : 400,
                background: tab === t.key ? 'var(--color-primary)' : 'var(--color-gray-100)',
                color: tab === t.key ? 'white' : 'var(--color-gray-700)',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Mata Kuliah */}
        {tab === 'mk' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
            {/* Form tambah MK */}
            <div className="card" style={{ padding: 20, alignSelf: 'start' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Tambah Mata Kuliah Baru</h3>
              {['kode_mk', 'nama_mk'].map(field => (
                <div className="form-group" key={field}>
                  <label className="form-label">{field === 'kode_mk' ? 'Kode MK' : 'Nama MK'}</label>
                  <input
                    className="form-input"
                    value={formMK[field]}
                    onChange={e => setFormMK({ ...formMK, [field]: e.target.value })}
                    placeholder={field === 'kode_mk' ? 'CA234503' : 'Nama Mata Kuliah'}
                  />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">SKS</label>
                  <input type="number" min={1} max={12} className="form-input" value={formMK.sks}
                    onChange={e => setFormMK({ ...formMK, sks: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <input type="number" min={1} max={8} className="form-input" value={formMK.semester}
                    onChange={e => setFormMK({ ...formMK, semester: Number(e.target.value) })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Jenjang</label>
                  <select className="form-select" value={formMK.jenjang}
                    onChange={e => setFormMK({ ...formMK, jenjang: e.target.value })}>
                    {['S1', 'Profesi', 'S2', 'S3'].map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipe</label>
                  <select className="form-select" value={formMK.tipe}
                    onChange={e => setFormMK({ ...formMK, tipe: e.target.value })}>
                    {['Teoritik', 'Studio'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Periode</label>
                <select className="form-select" value={formMK.periode}
                  onChange={e => setFormMK({ ...formMK, periode: e.target.value })}>
                  {['Ganjil', 'Genap'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={tambahMK}>
                + Tambah MK
              </button>
            </div>

            {/* Daftar MK */}
            <div>
              {loading ? <div className="page-loader" style={{ minHeight: 200 }}><div className="spinner spinner-primary"></div></div> : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {daftarMK.map(mk => (
                    <div key={mk.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)', fontSize: 13 }}>{mk.kode_mk}</span>
                        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--color-gray-500)' }}>{mk.jenjang} · Sem {mk.semester} · {mk.sks} SKS · {mk.tipe} · {mk.periode}</span>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{mk.nama_mk}</div>
                      </div>
                      <button onClick={() => hapusMK(mk.id)} style={{ background: 'none', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: CPL */}
        {tab === 'cpl' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
            {/* Form tambah CPL */}
            <div className="card" style={{ padding: 20, alignSelf: 'start' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Tambah CPL Baru</h3>
              <div className="form-group">
                <label className="form-label">Jenjang</label>
                <select className="form-select" value={formCPL.jenjang}
                  onChange={e => setFormCPL({ ...formCPL, jenjang: e.target.value })}>
                  {['S1', 'Profesi', 'S2', 'S3'].map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nomor CPL</label>
                <input className="form-input" value={formCPL.nomor_cpl}
                  onChange={e => setFormCPL({ ...formCPL, nomor_cpl: e.target.value })}
                  placeholder="CPL-1 atau CPL.4" />
              </div>
              <div className="form-group">
                <label className="form-label">Kategori <span style={{ opacity: 0.6, fontWeight: 400 }}>opsional</span></label>
                <input className="form-input" value={formCPL.kategori}
                  onChange={e => setFormCPL({ ...formCPL, kategori: e.target.value })}
                  placeholder="Sikap, Ketrampilan, Pengetahuan..." />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi (Indonesia)</label>
                <textarea className="form-textarea" rows={3} value={formCPL.deskripsi_id}
                  onChange={e => setFormCPL({ ...formCPL, deskripsi_id: e.target.value })}
                  placeholder="Mampu menerapkan..." />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi (English) <span style={{ opacity: 0.6, fontWeight: 400 }}>opsional</span></label>
                <textarea className="form-textarea" rows={3} value={formCPL.deskripsi_en}
                  onChange={e => setFormCPL({ ...formCPL, deskripsi_en: e.target.value })}
                  placeholder="Able to apply..." />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={tambahCPL}>
                + Tambah CPL
              </button>
            </div>

            {/* Daftar CPL */}
            <div>
              {['S1', 'Profesi', 'S2', 'S3'].map(jenjang => {
                const cplJenjang = daftarCPL.filter(c => c.jenjang === jenjang);
                if (cplJenjang.length === 0) return null;
                return (
                  <div key={jenjang} style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--color-primary)' }}>
                      Jenjang {jenjang} ({cplJenjang.length} CPL)
                    </h3>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {cplJenjang.map(cpl => (
                        <div key={cpl.id} className="card" style={{ padding: '10px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 13 }}>{cpl.nomor_cpl}</span>
                            {cpl.kategori && <span style={{ fontSize: 11, color: 'var(--color-gray-500)', marginLeft: 6 }}>({cpl.kategori})</span>}
                            <div style={{ fontSize: 13, marginTop: 2 }}>{cpl.deskripsi_id}</div>
                          </div>
                          <button onClick={() => hapusCPL(cpl.id)} style={{ background: 'none', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11, flexShrink: 0 }}>
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}