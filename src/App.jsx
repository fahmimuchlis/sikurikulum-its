import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

import RightRail from './components/RightRail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FormSilabus from './pages/FormSilabus';
import Direktori from './pages/Direktori';
import DetailDokumen from './pages/DetailDokumen';
import AdminMasterData from './pages/AdminMasterData';
import CpmkGenerator from './pages/CpmkGenerator';
import MatriksPage from './pages/MatriksPage';
import PohonKurikulum from './pages/PohonKurikulum';
import NodeMode from './pages/NodeMode';

// Layout dengan RightRail untuk halaman yang sudah login
function AppLayout({ user, children }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  return (
    <div className="page-root">
      {children}
      <RightRail user={user} onLogout={handleLogout} />
    </div>
  );
}

// Komponen penjaga: hanya bisa diakses jika sudah login
function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout user={user}>{children}</AppLayout>;
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = belum dicek

  useEffect(() => {
    // Cek sesi aktif saat pertama kali buka
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Pantau perubahan status login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Tampilkan loading saat cek sesi
  if (user === undefined) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-primary"></div>
        <p>Memuat...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman publik */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

        {/* Halaman yang butuh login */}
        <Route path="/dashboard" element={
          <ProtectedRoute user={user}>
            <Dashboard user={user} />
          </ProtectedRoute>
        } />
        <Route path="/form/:silabusId?" element={
          <ProtectedRoute user={user}>
            <FormSilabus user={user} />
          </ProtectedRoute>
        } />
        <Route path="/direktori" element={
          <ProtectedRoute user={user}>
            <Direktori user={user} />
          </ProtectedRoute>
        } />
        <Route path="/dokumen/:id" element={
          <ProtectedRoute user={user}>
            <DetailDokumen user={user} />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute user={user}>
            <AdminMasterData user={user} />
          </ProtectedRoute>
        } />

        {/* CPMK & Matriks — hanya dari dalam MK (silabus context) */}
        <Route path="/form/:silabusId/cpmk" element={
          <ProtectedRoute user={user}>
            <CpmkGenerator user={user} />
          </ProtectedRoute>
        } />
        <Route path="/form/:silabusId/matriks" element={
          <ProtectedRoute user={user}>
            <MatriksPage user={user} />
          </ProtectedRoute>
        } />
        <Route path="/pohon" element={
          <ProtectedRoute user={user}>
            <PohonKurikulum user={user} />
          </ProtectedRoute>
        } />
        <Route path="/node" element={
          <ProtectedRoute user={user}>
            <NodeMode user={user} />
          </ProtectedRoute>
        } />

        {/* Legacy redirect — jika ada yang akses langsung */}
        <Route path="/cpmk" element={<Navigate to="/dashboard" replace />} />
        <Route path="/matriks" element={<Navigate to="/dashboard" replace />} />
        <Route path="/" element={
          <ProtectedRoute user={user}>
            <Dashboard user={user} />
          </ProtectedRoute>
        } /> />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
