import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FormSilabus from './pages/FormSilabus';
import Direktori from './pages/Direktori';
import DetailDokumen from './pages/DetailDokumen';
import AdminMasterData from './pages/AdminMasterData';
import CpmkGenerator from './pages/CpmkGenerator';
import MatriksPage from './pages/MatriksPage';

// Komponen penjaga: hanya bisa diakses jika sudah login
function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
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

        <Route path="/matriks" element={
          <ProtectedRoute user={user}>
            <MatriksPage user={user} />
          </ProtectedRoute>
        } />

        {/* Redirect default */}
        <Route path="/cpmk" element={
          <ProtectedRoute user={user}>
            <CpmkGenerator user={user} />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
