import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';

export default function DetailDokumen({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const [loading, setLoading] = useState(true);
  const [dokumen, setDokumen] = useState(null);
  const [sap, setSap] = useState([]);
  const [daftarCPL, setDaftarCPL] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: dok } = await supabase
        .from('dokumen_silabus')
        .select(`
          *,
          master_mata_kuliah (*),
          profil_dosen (nama_lengkap, nidn, email)
        `)
        .eq('id', id)
        .single();

      const { data: sapData } = await supabase
        .from('sap_mingguan')
        .select('*')
        .eq('silabus_id', id)
        .order('minggu');

      const { data: cplData } = await supabase
        .from('master_cpl')
        .select('*');

      setDokumen(dok);
      setSap(sapData || []);
      setDaftarCPL(cplData || []);
      setLoading(false);
    };
    load();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <>
        <Navbar user={user} />
        <div className="page-loader" style={{ minHeight: 'calc(100vh - 60px)' }}>
          <div className="spinner spinner-primary"></div>
        </div>
      </>
    );
  }

  if (!dokumen) {
    return (
      <>
        <Navbar user={user} />
        <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center' }}>
          <p>Dokumen tidak ditemukan.</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Kembali ke Dasbor
          </button>
        </div>
      </>
    );
  }

  const mk = dokumen.master_mata_kuliah;
  const dosen = dokumen.profil_dosen;
  const cplSelected = daftarCPL.filter(c => (dokumen.cpl_dipilih || []).includes(c.id));

  return (
    <>
      <Navbar user={user} />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary btn-sm"
          >
            ← Kembali
          </button>
          <div style={{ flex: 1 }} />
          {dokumen.dosen_id === user.id && (
            <button
              onClick={() => navigate(`/form/${id}`)}
              className="btn btn-secondary btn-sm"
            >
              ✏️ Edit Dokumen
            </button>
          )}
          <button onClick={handlePrint} className="btn btn-primary btn-sm">
            🖨️ Cetak / PDF
          </button>
        </div>

        {/* Konten dokumen */}
        <div ref={printRef}>
          {/* Header dokumen */}
          <div className="card" style={{ padding: '24px 32px', marginBottom: 20 }}>
            <div style={{
              borderBottom: '3px solid var(--color-primary)',
              paddingBottom: 16,
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Departemen Arsitektur — ITS
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' }}>
                  RENCANA PEMBELAJARAN SEMESTER (RPS)
                </h1>
              </div>
              <div style={{
                background: dokumen.status === 'selesai' ? '#D1FAE5' : '#FEF3C7',
                color: dokumen.status === 'selesai' ? '#065F46' : '#92400E',
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
              }}>
                {dokumen.status === 'selesai' ? '● Final' : '◑ Draf'}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                <InfoRow label="Mata Kuliah" value={`${mk?.kode_mk} — ${mk?.nama_mk}`} />
                <InfoRow label="SKS" value={mk?.sks} />
                <InfoRow label="Semester" value={mk?.semester} />
                <InfoRow label="Jenjang" value={mk?.jenjang} />
                <InfoRow label="Pengampu" value={dosen?.nama_lengkap || '-'} />
                {dosen?.nidn && <InfoRow label="NIDN" value={dosen.nidn} />}
              </tbody>
            </table>
          </div>

          {/* Deskripsi */}
          {dokumen.deskripsi_mk && (
            <Section title="Deskripsi Mata Kuliah">
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>{dokumen.deskripsi_mk}</p>
            </Section>
          )}

          {/* CPL */}
          {cplSelected.length > 0 && (
            <Section title="Capaian Pembelajaran Lulusan (CPL) yang Dibebankan">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--color-gray-100)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', width: 100 }}>Kode CPL</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Deskripsi</th>
                  </tr>
                </thead>
                <tbody>
                  {cplSelected.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--color-gray-200)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--color-primary)', verticalAlign: 'top' }}>
                        {c.nomor_cpl}
                      </td>
                      <td style={{ padding: '8px 12px', lineHeight: 1.6 }}>{c.deskripsi_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* CPMK */}
          {dokumen.cpmk?.length > 0 && (
            <Section title="Capaian Pembelajaran Mata Kuliah (CPMK)">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--color-gray-100)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', width: 100 }}>Kode</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Deskripsi (ID)</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Deskripsi (EN)</th>
                  </tr>
                </thead>
                <tbody>
                  {dokumen.cpmk.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-gray-200)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--color-primary)', verticalAlign: 'top' }}>
                        {c.no}
                      </td>
                      <td style={{ padding: '8px 12px', lineHeight: 1.6 }}>{c.deskripsi_id}</td>
                      <td style={{ padding: '8px 12px', lineHeight: 1.6, color: 'var(--color-gray-500)', fontStyle: 'italic' }}>
                        {c.deskripsi_en || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Bahan Kajian */}
          {dokumen.bahan_kajian?.length > 0 && (
            <Section title="Bahan Kajian">
              <ol style={{ paddingLeft: 20, fontSize: 14, lineHeight: 2 }}>
                {dokumen.bahan_kajian.map((b, i) => <li key={i}>{b}</li>)}
              </ol>
            </Section>
          )}

          {/* Prasyarat */}
          {dokumen.prasyarat?.length > 0 && (
            <Section title="Prasyarat">
              <p style={{ fontSize: 14 }}>{Array.isArray(dokumen.prasyarat) ? dokumen.prasyarat.join(', ') : dokumen.prasyarat}</p>
            </Section>
          )}

          {/* SAP Mingguan */}
          {sap.length > 0 && (
            <Section title="Rencana Perkuliahan per Minggu (SAP)">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-primary)', color: 'white' }}>
                      <th style={thS}>Mgg</th>
                      <th style={thS}>Sub CPMK</th>
                      <th style={{ ...thS, minWidth: 200 }}>Materi</th>
                      <th style={thS}>Bentuk Pembelajaran</th>
                      <th style={thS}>Metoda</th>
                      <th style={thS}>Bobot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sap.map((row, i) => (
                      <tr key={i} style={{
                        background: row.minggu === 8 ? '#FEF9C3' : row.minggu === 16 ? '#DCFCE7' : i % 2 === 0 ? 'white' : 'var(--color-gray-50)',
                        borderBottom: '1px solid var(--color-gray-200)',
                      }}>
                        <td style={{ ...tdS, textAlign: 'center', fontWeight: 700 }}>
                          {row.minggu}
                          {row.minggu === 8 && <div style={{ fontSize: 9, color: '#92400E' }}>UTS</div>}
                          {row.minggu === 16 && <div style={{ fontSize: 9, color: '#065F46' }}>UAS</div>}
                        </td>
                        <td style={{ ...tdS, fontWeight: 600, color: 'var(--color-primary)' }}>{row.sub_cpmk_no || '-'}</td>
                        <td style={tdS}>{row.materi || '-'}</td>
                        <td style={tdS}>{row.bentuk_pembelajaran || '-'}</td>
                        <td style={tdS}>{row.metoda || '-'}</td>
                        <td style={{ ...tdS, textAlign: 'center' }}>{row.bobot_penilaian || 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Pustaka */}
          {(dokumen.pustaka_utama?.length > 0 || dokumen.pustaka_pendukung?.length > 0) && (
            <Section title="Daftar Pustaka">
              {dokumen.pustaka_utama?.filter(p => p).length > 0 && (
                <>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--color-gray-700)' }}>Pustaka Utama</h4>
                  <ol style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>
                    {dokumen.pustaka_utama.filter(p => p).map((p, i) => <li key={i}>{p}</li>)}
                  </ol>
                </>
              )}
              {dokumen.pustaka_pendukung?.filter(p => p).length > 0 && (
                <>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--color-gray-700)' }}>Pustaka Pendukung</h4>
                  <ol style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
                    {dokumen.pustaka_pendukung.filter(p => p).map((p, i) => <li key={i}>{p}</li>)}
                  </ol>
                </>
              )}
            </Section>
          )}
        </div>
      </main>
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <tr>
      <td style={{ padding: '5px 12px 5px 0', color: 'var(--color-gray-500)', fontSize: 13, width: 140, verticalAlign: 'top' }}>
        {label}
      </td>
      <td style={{ padding: '5px 0', fontSize: 13, fontWeight: 500 }}>
        {value}
      </td>
    </tr>
  );
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 16, padding: '20px 24px' }}>
      <h2 style={{
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--color-primary)',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: '1px solid var(--color-gray-200)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

const thS = { padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' };
const tdS = { padding: '7px 10px', fontSize: 12, verticalAlign: 'top' };
