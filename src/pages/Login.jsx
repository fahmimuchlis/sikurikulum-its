import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Masukkan email dan kata sandi Anda.');
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Email atau kata sandi salah. Silakan coba lagi.');
    } else {
      navigate('/dashboard');
    }
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
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            background: 'white',
            color: 'var(--color-primary)',
            width: 64,
            height: 64,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 24,
            margin: '0 auto 16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>
            SK
          </div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            SiKurikulum
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
            Sistem Penyusunan Dokumen Kurikulum
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            Departemen Arsitektur ITS
          </p>
        </div>

        {/* Form Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: 'var(--color-gray-700)' }}>
            Masuk ke Akun Anda
          </h2>

          {error && <div className="error-msg">⚠️ {error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Kampus</label>
              <input
                type="email"
                className="form-input"
                placeholder="nama@its.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kata Sandi</label>
              <input
                type="password"
                className="form-input"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }}></div>
                  Memverifikasi...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          <div style={{
            marginTop: 20,
            paddingTop: 20,
            borderTop: '1px solid var(--color-gray-200)',
            textAlign: 'center',
            fontSize: 14,
            color: 'var(--color-gray-500)',
          }}>
            Belum punya akun?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Daftar di sini
            </Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 24 }}>
          © {new Date().getFullYear()} Departemen Arsitektur ITS
        </p>
      </div>
    </div>
  );
}
