import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    namaLengkap: '',
    nidn: '',
    email: '',
    password: '',
    konfirmasi: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.namaLengkap || !form.email || !form.password) {
      setError('Semua kolom wajib diisi.');
      return;
    }
    if (form.password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (form.password !== form.konfirmasi) {
      setError('Konfirmasi kata sandi tidak sesuai.');
      return;
    }

    setLoading(true);

    // Daftarkan akun
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nama_lengkap: form.namaLengkap,
          nidn: form.nidn,
        }
      }
    });

    if (signUpError) {
      setError('Gagal mendaftar: ' + signUpError.message);
      setLoading(false);
      return;
    }

    // Buat profil dosen
    if (data.user) {
      await supabase.from('profil_dosen').upsert({
        id: data.user.id,
        nama_lengkap: form.namaLengkap,
        nidn: form.nidn,
        email: form.email,
        departemen: 'Arsitektur',
      });
    }

    setSuccess('Pendaftaran berhasil! Silakan masuk dengan akun baru Anda.');
    setTimeout(() => navigate('/login'), 2500);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #003B7A 0%, #0056B3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            background: 'white',
            color: 'var(--color-primary)',
            width: 56,
            height: 56,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 20,
            margin: '0 auto 12px',
          }}>
            SK
          </div>
          <h1 style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>Daftar Akun Baru</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4 }}>SiKurikulum — Arsitektur ITS</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {error && <div className="error-msg">⚠️ {error}</div>}
          {success && <div className="success-msg">✅ {success}</div>}

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Nama Lengkap (dengan gelar)</label>
              <input
                type="text"
                name="namaLengkap"
                className="form-input"
                placeholder="Dr. Ir. Nama Anda, M.T."
                value={form.namaLengkap}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">NIDN <span style={{fontWeight:400,opacity:0.6}}>(opsional)</span></label>
              <input
                type="text"
                name="nidn"
                className="form-input"
                placeholder="Nomor Induk Dosen Nasional"
                value={form.nidn}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Kampus</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="nama@its.ac.id"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kata Sandi</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Minimal 6 karakter"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Konfirmasi Kata Sandi</label>
              <input
                type="password"
                name="konfirmasi"
                className="form-input"
                placeholder="Ketik ulang kata sandi"
                value={form.konfirmasi}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16 }}></div>Mendaftarkan...</>
              ) : 'Daftar Sekarang'}
            </button>
          </form>

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 14, color: 'var(--color-gray-500)' }}>
            Sudah punya akun?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
