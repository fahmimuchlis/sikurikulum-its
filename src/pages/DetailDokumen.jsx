import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';

// ── Helper: bangun kalimat CPMK dari fields (sama dengan FormSilabus) ──────────
function buildCpmkStatement(tipe, fields) {
  if (!tipe || !fields) return '';
  if (tipe === 'kognitif') {
    const parts = ['Mampu'];
    if (fields.kognitif_1) parts.push(fields.kognitif_1);
    if (fields.kognitif_2) { parts.push('dan'); parts.push(fields.kognitif_2); }
    if (fields.elemen_1) parts.push(fields.elemen_1);
    if (fields.rincian) parts.push(fields.rincian);
    if (fields.ukuran) parts.push(fields.ukuran);
    return parts.length > 1 ? parts.join(' ') + '.' : '';
  }
  if (tipe === 'psikomotorik') {
    const parts = ['Mampu'];
    if (fields.psiko_1) parts.push(fields.psiko_1);
    if (fields.psiko_2) { parts.push('dan'); parts.push(fields.psiko_2); }
    if (fields.objek_psiko) parts.push(fields.objek_psiko);
    if (fields.rincian) parts.push(fields.rincian);
    if (fields.ukuran) parts.push(fields.ukuran);
    return parts.length > 1 ? parts.join(' ') + '.' : '';
  }
  if (tipe === 'kognitif_psiko') {
    const kog = [];
    if (fields.kognitif_1) kog.push(fields.kognitif_1);
    if (fields.kognitif_2) kog.push(fields.kognitif_2);
    const psi = [];
    if (fields.psiko_1) psi.push(fields.psiko_1);
    if (fields.psiko_2) psi.push(fields.psiko_2);
    const parts = ['Mampu'];
    if (kog.length) parts.push(kog.join(' dan '));
    if (fields.elemen_1) parts.push(fields.elemen_1);
    if (psi.length) { parts.push('serta'); parts.push(psi.join(' dan ')); }
    if (fields.objek_psiko) parts.push(fields.objek_psiko);
    if (fields.rincian) parts.push(fields.rincian);
    if (fields.ukuran) parts.push(fields.ukuran);
    return parts.length > 1 ? parts.join(' ') + '.' : '';
  }
  if (tipe === 'afeksi') {
    const parts = ['Mampu'];
    if (fields.kegiatan_1) parts.push(fields.kegiatan_1);
    if (fields.kegiatan_2) { parts.push('dan'); parts.push(fields.kegiatan_2); }
    if (fields.rincian) parts.push(fields.rincian);
    if (fields.ukuran) parts.push(fields.ukuran);
    return parts.length > 1 ? parts.join(' ') + '.' : '';
  }
  return fields.deskripsi_id || '';
}

// ── Warna & label per tipe CPMK ───────────────────────────────────────────────
const TIPE_META = {
  kognitif:       { label: 'Kognitif',    color: '#1d4ed8', bg: '#eff6ff', icon: '🧠' },
  psikomotorik:   { label: 'Psikomotorik',color: '#7c3aed', bg: '#f5f3ff', icon: '🤝' },
  kognitif_psiko: { label: 'Gabungan',    color: '#0369a1', bg: '#e0f2fe', icon: '🧠🤝' },
  afeksi:         { label: 'Afeksi',      color: '#dc2626', bg: '#fef2f2', icon: '❤️' },
};

// ── Sub-CPMK badges ───────────────────────────────────────────────────────────
function SubCpmkBadges({ cpmk }) {
  const kogs = cpmk.sub_cpmk_kog || [];
  const psis = cpmk.sub_cpmk_psiko || [];
  const afks = cpmk.sub_cpmk_afeksi || [];
  if (!kogs.length && !psis.length && !afks.length) return null;
  return (
    <div style={{ marginTop: 6, paddingLeft: 12, borderLeft: '3px solid #e2e8f0' }}>
      {kogs.map((s, i) => s.statement || (s.sub_kk ? `Mampu ${s.sub_kk} ${s.elemen||''} ${s.rincian_sub||''} ${s.penugasan||''} berdasarkan acuan yang sahih dan dikerjakan dengan ${s.kriteria||''}.` : '') ? (
        <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 4, display: 'flex', gap: 6 }}>
          <span style={{ color: '#1d4ed8', fontWeight: 700, flexShrink: 0 }}>↳ Sub-Kog {i+1}</span>
          <span>{s.statement || [s.sub_kk, s.elemen, s.rincian_sub, s.penugasan].filter(Boolean).join(' ') + (s.kriteria ? ` berdasarkan acuan yang sahih dan dikerjakan dengan ${s.kriteria}.` : '.')}</span>
        </div>
      ) : null)}
      {psis.map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 4, display: 'flex', gap: 6 }}>
          <span style={{ color: '#7c3aed', fontWeight: 700, flexShrink: 0 }}>↳ Sub-Psi {i+1}</span>
          <span>{[s.kemampuan_psiko, s.penjelasan_keg, s.objek_sub, s.rincian_sub ? `pada tugas ${s.rincian_sub}` : '', s.penugasan, s.kriteria ? `berdasarkan panduan yang sahih dan dikerjakan dengan ${s.kriteria}.` : '.'].filter(Boolean).join(' ')}</span>
        </div>
      ))}
      {afks.map((s, i) => (
        <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 4, display: 'flex', gap: 6 }}>
          <span style={{ color: '#dc2626', fontWeight: 700, flexShrink: 0 }}>↳ Sub-Afk {i+1}</span>
          <span>{['Mampu', s.kata_sikap, s.kegiatan ? `pada kegiatan ${s.kegiatan}` : '', s.rincian_sub ? `materi/topik ${s.rincian_sub}` : '', s.penugasan].filter(Boolean).join(' ') + '.'}</span>
        </div>
      ))}
    </div>
  );
}

// ── Komponen tabel SAP ────────────────────────────────────────────────────────
function TabelSAP({ sap, cpmk }) {
  const cpmkMap = {};
  (cpmk || []).forEach(c => { cpmkMap[c.no] = c; });

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#1e40af', color: 'white' }}>
            {['Mgg', 'Sub-CPMK', 'Materi / Pokok Bahasan', 'Bentuk Pembelajaran', 'Metoda', 'Media', 'Bobot (%)'].map(h => (
              <th key={h} style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap', borderRight: '1px solid #3b5998' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sap.map((row, i) => {
            const isUTS = row.minggu === 8;
            const isUAS = row.minggu === 16;
            const rowBg = isUTS ? '#fef9c3' : isUAS ? '#dcfce7' : i % 2 === 0 ? 'white' : '#f8fafc';
            return (
              <tr key={i} style={{ background: rowBg, borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ ...tdS, textAlign: 'center', fontWeight: 700, width: 36 }}>
                  {row.minggu}
                  {isUTS && <div style={{ fontSize: 9, color: '#92400e', fontWeight: 700 }}>UTS</div>}
                  {isUAS && <div style={{ fontSize: 9, color: '#065f46', fontWeight: 700 }}>UAS</div>}
                </td>
                <td style={{ ...tdS, fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
                  {row.sub_cpmk_no || '-'}
                </td>
                <td style={{ ...tdS, minWidth: 200 }}>{row.materi || '-'}</td>
                <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{row.bentuk_pembelajaran || '-'}</td>
                <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{row.metoda || '-'}</td>
                <td style={{ ...tdS, whiteSpace: 'nowrap' }}>{row.media || '-'}</td>
                <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>
                  {row.bobot_penilaian ? `${row.bobot_penilaian}%` : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Header ITS standar ────────────────────────────────────────────────────────
function HeaderITS({ judul, mk, dosen, status, tahunAjaran }) {
  return (
    <div style={{ border: '2px solid #1e40af', borderRadius: 0, marginBottom: 0, overflow: 'hidden' }}>
      {/* Baris logo + judul */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #1e40af', background: '#f8faff' }}>
        <div style={{ padding: '12px 16px', borderRight: '2px solid #1e40af', textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1e40af', letterSpacing: 1 }}>ITS</div>
          <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>Surabaya</div>
        </div>
        <div style={{ flex: 1, padding: '12px 20px' }}>
          <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' }}>
            Institut Teknologi Sepuluh Nopember — Departemen Arsitektur
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1e40af', marginTop: 2, letterSpacing: 0.5 }}>
            {judul}
          </div>
        </div>
        <div style={{ padding: '12px 16px', textAlign: 'right', flexShrink: 0 }}>
          <span style={{
            display: 'inline-block',
            background: status === 'selesai' ? '#d1fae5' : '#fef3c7',
            color: status === 'selesai' ? '#065f46' : '#92400e',
            padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
          }}>
            {status === 'selesai' ? '✔ Final' : '◑ Draf'}
          </span>
        </div>
      </div>

      {/* Tabel identitas */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <tbody>
          {[
            ['Mata Kuliah', `${mk?.kode_mk || ''} — ${mk?.nama_mk || '-'}`],
            ['SKS / Semester', `${mk?.sks || '-'} SKS / Semester ${mk?.semester || '-'}`],
            ['Jenjang / Tipe', `${mk?.jenjang || '-'}${mk?.kode_tipe ? ` / ${mk.kode_tipe.toUpperCase()}` : ''}`],
            ['Dosen Pengampu', dosen?.nama_lengkap || '-'],
            dosen?.nidn ? ['NIDN', dosen.nidn] : null,
            tahunAjaran ? ['Tahun Ajaran', tahunAjaran] : null,
          ].filter(Boolean).map(([label, value], i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '7px 14px', color: '#475569', fontWeight: 600, width: 180, background: '#f8faff', fontSize: 12 }}>{label}</td>
              <td style={{ padding: '7px 14px', color: '#1e293b', fontWeight: 500 }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
function DocSection({ title, children, accent = '#1e40af' }) {
  return (
    <div style={{ marginBottom: 0, borderBottom: '1px solid #e2e8f0' }}>
      <div style={{
        background: accent, color: 'white',
        padding: '7px 16px', fontSize: 12, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 0.8,
      }}>
        {title}
      </div>
      <div style={{ padding: '14px 16px' }}>
        {children}
      </div>
    </div>
  );
}

// ── Tab Silabus ───────────────────────────────────────────────────────────────
function TabSilabus({ dok, cplSelected, cpmkList }) {
  const mk = dok.master_mata_kuliah;
  const dosen = dok.profil_dosen;

  return (
    <div style={{ border: '1px solid #c7d2fe', borderRadius: 4, overflow: 'hidden' }}>
      <HeaderITS judul="SILABUS MATA KULIAH" mk={mk} dosen={dosen} status={dok.status} tahunAjaran={dok.tahun_ajaran} />

      {/* Deskripsi */}
      {dok.deskripsi_mk && (
        <DocSection title="Deskripsi Mata Kuliah">
          <p style={{ fontSize: 13, lineHeight: 1.85, color: '#1e293b', margin: 0 }}>{dok.deskripsi_mk}</p>
          {dok.deskripsi_mk_en && (
            <p style={{ fontSize: 12, lineHeight: 1.75, color: '#64748b', fontStyle: 'italic', marginTop: 8, marginBottom: 0 }}>
              {dok.deskripsi_mk_en}
            </p>
          )}
        </DocSection>
      )}

      {/* CPL */}
      {cplSelected.length > 0 && (
        <DocSection title="Capaian Pembelajaran Lulusan (CPL) yang Dibebankan">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ ...thS, width: 90 }}>Kode CPL</th>
                <th style={thS}>Deskripsi (ID)</th>
                <th style={thS}>Deskripsi (EN)</th>
              </tr>
            </thead>
            <tbody>
              {cplSelected.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ ...tdS, fontWeight: 700, color: '#1d4ed8' }}>{c.nomor_cpl}</td>
                  <td style={tdS}>{c.deskripsi_id}</td>
                  <td style={{ ...tdS, color: '#64748b', fontStyle: 'italic' }}>{c.deskripsi_en || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DocSection>
      )}

      {/* CPMK */}
      {cpmkList.length > 0 && (
        <DocSection title="Capaian Pembelajaran Mata Kuliah (CPMK)">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ ...thS, width: 90 }}>Kode</th>
                <th style={{ ...thS, width: 70 }}>Tipe</th>
                <th style={thS}>Rumusan CPMK</th>
                <th style={{ ...thS, width: 100 }}>CPL yang Dicapai</th>
              </tr>
            </thead>
            <tbody>
              {cpmkList.map((c, i) => {
                const stmt = buildCpmkStatement(c.tipe, c) || c.deskripsi_id || '(belum diisi)';
                const meta = TIPE_META[c.tipe] || TIPE_META.kognitif;
                const cplKeys = (c.cpl_ids || []);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                    <td style={{ ...tdS, fontWeight: 700, color: '#1d4ed8' }}>{c.no || `CPMK-${i+1}`}</td>
                    <td style={{ ...tdS }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, background: meta.bg, padding: '1px 7px', borderRadius: 10 }}>
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td style={{ ...tdS, lineHeight: 1.65 }}>
                      {stmt}
                      <SubCpmkBadges cpmk={c} />
                    </td>
                    <td style={{ ...tdS, fontSize: 11, color: '#475569' }}>
                      {cplKeys.length > 0
                        ? cplSelected.filter(cp => cplKeys.includes(cp.id)).map(cp => cp.nomor_cpl).join(', ')
                        : <span style={{ color: '#f59e0b' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DocSection>
      )}

      {/* Pemetaan CPL × CPMK */}
      {cplSelected.length > 0 && cpmkList.length > 0 && (
        <DocSection title="Matriks Pemetaan CPL × CPMK">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ ...thS, background: '#f1f5f9', borderRight: '1px solid #e2e8f0', minWidth: 80 }}>CPL \ CPMK</th>
                  {cpmkList.map((c, i) => (
                    <th key={i} style={{ ...thS, background: '#f1f5f9', textAlign: 'center', borderRight: '1px solid #e2e8f0', minWidth: 60 }}>
                      {c.no || `C${i+1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cplSelected.map(cpl => (
                  <tr key={cpl.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ ...tdS, fontWeight: 700, color: '#1d4ed8', borderRight: '1px solid #e2e8f0', background: '#f8faff' }}>{cpl.nomor_cpl}</td>
                    {cpmkList.map((c, ci) => {
                      const terpetakan = (c.cpl_ids || []).includes(cpl.id);
                      return (
                        <td key={ci} style={{ ...tdS, textAlign: 'center', borderRight: '1px solid #f1f5f9', background: terpetakan ? '#dcfce7' : 'white' }}>
                          {terpetakan ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span> : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DocSection>
      )}

      {/* Bahan Kajian */}
      {dok.bahan_kajian?.filter(Boolean).length > 0 && (
        <DocSection title="Bahan Kajian / Pokok Bahasan">
          <ol style={{ paddingLeft: 20, fontSize: 13, lineHeight: 2, margin: 0 }}>
            {dok.bahan_kajian.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
          </ol>
        </DocSection>
      )}

      {/* Prasyarat */}
      {dok.prasyarat && (
        <DocSection title="Mata Kuliah Prasyarat">
          <p style={{ fontSize: 13, margin: 0 }}>
            {Array.isArray(dok.prasyarat) ? dok.prasyarat.join(', ') : dok.prasyarat}
          </p>
        </DocSection>
      )}

      {/* Pustaka */}
      {(dok.pustaka_utama?.filter(Boolean).length > 0 || dok.pustaka_pendukung?.filter(Boolean).length > 0) && (
        <DocSection title="Daftar Pustaka">
          {dok.pustaka_utama?.filter(Boolean).length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#475569', marginBottom: 6 }}>Pustaka Utama</div>
              <ol style={{ paddingLeft: 20, fontSize: 12, lineHeight: 1.8, marginBottom: 14 }}>
                {dok.pustaka_utama.filter(Boolean).map((p, i) => <li key={i}>{p}</li>)}
              </ol>
            </>
          )}
          {dok.pustaka_pendukung?.filter(Boolean).length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#475569', marginBottom: 6 }}>Pustaka Pendukung</div>
              <ol style={{ paddingLeft: 20, fontSize: 12, lineHeight: 1.8 }}>
                {dok.pustaka_pendukung.filter(Boolean).map((p, i) => <li key={i}>{p}</li>)}
              </ol>
            </>
          )}
        </DocSection>
      )}
    </div>
  );
}

// ── Tab RPS ───────────────────────────────────────────────────────────────────
function TabRPS({ dok, cplSelected, cpmkList, sap }) {
  const mk = dok.master_mata_kuliah;
  const dosen = dok.profil_dosen;

  // Hitung total bobot
  const totalBobot = sap.reduce((acc, r) => acc + (Number(r.bobot_penilaian) || 0), 0);

  return (
    <div style={{ border: '1px solid #c7d2fe', borderRadius: 4, overflow: 'hidden' }}>
      <HeaderITS judul="RENCANA PEMBELAJARAN SEMESTER (RPS)" mk={mk} dosen={dosen} status={dok.status} tahunAjaran={dok.tahun_ajaran} />

      {/* Deskripsi singkat */}
      {dok.deskripsi_mk && (
        <DocSection title="Deskripsi Singkat">
          <p style={{ fontSize: 13, lineHeight: 1.85, margin: 0 }}>{dok.deskripsi_mk}</p>
        </DocSection>
      )}

      {/* CPL */}
      {cplSelected.length > 0 && (
        <DocSection title="CPL yang Dibebankan">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cplSelected.map(c => (
              <div key={c.id} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: '#1d4ed8' }}>{c.nomor_cpl}</div>
                <div style={{ color: '#374151', marginTop: 2 }}>{c.deskripsi_id}</div>
              </div>
            ))}
          </div>
        </DocSection>
      )}

      {/* CPMK lengkap dengan Sub-CPMK */}
      {cpmkList.length > 0 && (
        <DocSection title="CPMK dan Sub-CPMK">
          {cpmkList.map((c, i) => {
            const stmt = buildCpmkStatement(c.tipe, c) || c.deskripsi_id || '(belum diisi)';
            const meta = TIPE_META[c.tipe] || TIPE_META.kognitif;
            return (
              <div key={i} style={{ marginBottom: 12, padding: '10px 12px', background: meta.bg, borderRadius: 8, border: `1px solid ${meta.color}30` }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, color: meta.color, flexShrink: 0, fontSize: 12 }}>{c.no || `CPMK-${i+1}`}</span>
                  <span style={{ fontSize: 10, background: 'white', color: meta.color, border: `1px solid ${meta.color}40`, padding: '1px 6px', borderRadius: 10, flexShrink: 0 }}>{meta.icon} {meta.label}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.65, color: '#1e293b' }}>{stmt}</span>
                </div>
                <SubCpmkBadges cpmk={c} />
              </div>
            );
          })}
        </DocSection>
      )}

      {/* SAP Mingguan */}
      {sap.length > 0 && (
        <DocSection title="Rencana Perkuliahan per Minggu (SAP 16 Minggu)">
          <TabelSAP sap={sap} cpmk={cpmkList} />
          {totalBobot > 0 && (
            <div style={{ marginTop: 10, textAlign: 'right', fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: totalBobot === 100 ? '#16a34a' : '#dc2626' }}>
                Total bobot penilaian: {totalBobot}%
                {totalBobot !== 100 && ' ⚠️ (seharusnya 100%)'}
              </span>
            </div>
          )}
        </DocSection>
      )}

      {/* Pustaka */}
      {(dok.pustaka_utama?.filter(Boolean).length > 0 || dok.pustaka_pendukung?.filter(Boolean).length > 0) && (
        <DocSection title="Daftar Pustaka">
          {dok.pustaka_utama?.filter(Boolean).length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#475569', marginBottom: 6 }}>Pustaka Utama</div>
              <ol style={{ paddingLeft: 20, fontSize: 12, lineHeight: 1.8, marginBottom: 14 }}>
                {dok.pustaka_utama.filter(Boolean).map((p, i) => <li key={i}>{p}</li>)}
              </ol>
            </>
          )}
          {dok.pustaka_pendukung?.filter(Boolean).length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#475569', marginBottom: 6 }}>Pustaka Pendukung</div>
              <ol style={{ paddingLeft: 20, fontSize: 12, lineHeight: 1.8 }}>
                {dok.pustaka_pendukung.filter(Boolean).map((p, i) => <li key={i}>{p}</li>)}
              </ol>
            </>
          )}
        </DocSection>
      )}

      {/* Tanda tangan */}
      <DocSection title="Pengesahan">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 8 }}>
          {['Dosen Pengampu', 'Koordinator Kurikulum', 'Ketua Departemen'].map(role => (
            <div key={role} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 60 }}>{role}</div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 6, fontSize: 12, color: '#374151' }}>
                {role === 'Dosen Pengampu' ? (dok.profil_dosen?.nama_lengkap || '_________________') : '_________________'}
              </div>
              {role === 'Dosen Pengampu' && dok.profil_dosen?.nidn && (
                <div style={{ fontSize: 11, color: '#64748b' }}>NIDN: {dok.profil_dosen.nidn}</div>
              )}
            </div>
          ))}
        </div>
      </DocSection>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DetailDokumen({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const [loading, setLoading] = useState(true);
  const [dokumen, setDokumen] = useState(null);
  const [sap, setSap] = useState([]);
  const [daftarCPL, setDaftarCPL] = useState([]);
  const [activeDoc, setActiveDoc] = useState('silabus'); // 'silabus' | 'rps'
  const [printMode, setPrintMode] = useState(false);     // cetak kedua dokumen

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: dok } = await supabase
        .from('dokumen_silabus')
        .select(`*, master_mata_kuliah (*), profil_dosen (nama_lengkap, nidn, email)`)
        .eq('id', id).single();
      const { data: sapData } = await supabase
        .from('sap_mingguan').select('*').eq('silabus_id', id).order('minggu');
      const { data: cplData } = await supabase.from('master_cpl').select('*');
      setDokumen(dok);
      setSap(sapData || []);
      setDaftarCPL(cplData || []);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return (
    <>
      <Navbar user={user} />
      <div className="page-loader" style={{ minHeight: 'calc(100vh - 60px)' }}>
        <div className="spinner spinner-primary" />
      </div>
    </>
  );

  if (!dokumen) return (
    <>
      <Navbar user={user} />
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center' }}>
        <p>Dokumen tidak ditemukan.</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>← Kembali ke Dasbor</button>
      </div>
    </>
  );

  const cplSelected = daftarCPL.filter(c => (dokumen.cpl_dipilih || []).includes(c.id));
  const cpmkList = dokumen.cpmk || [];

  const handlePrint = () => window.print();

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { page-break-after: always; }
        }
      `}</style>

      <Navbar user={user} />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px' }}>
        {/* ── Toolbar ── */}
        <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm">← Kembali</button>
          <div style={{ flex: 1 }} />

          {/* Tab Silabus / RPS */}
          <div style={{ display: 'flex', border: '1px solid #c7d2fe', borderRadius: 8, overflow: 'hidden' }}>
            {[
              { id: 'silabus', label: '📄 Silabus' },
              { id: 'rps',     label: '📋 RPS' },
              { id: 'keduanya', label: '📑 Silabus + RPS' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveDoc(tab.id)} style={{
                padding: '7px 16px', fontSize: 12, fontWeight: activeDoc === tab.id ? 700 : 500,
                background: activeDoc === tab.id ? '#1e40af' : 'white',
                color: activeDoc === tab.id ? 'white' : '#475569',
                border: 'none', cursor: 'pointer',
                borderRight: '1px solid #c7d2fe',
              }}>{tab.label}</button>
            ))}
          </div>

          {dokumen.dosen_id === user?.id && (
            <button onClick={() => navigate(`/form/${id}`)} className="btn btn-secondary btn-sm">✏️ Edit</button>
          )}
          <button onClick={handlePrint} className="btn btn-primary btn-sm">🖨️ Cetak / PDF</button>
        </div>

        {/* ── Kelengkapan dokumen ── */}
        {cpmkList.length === 0 && (
          <div className="no-print" style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#78350f' }}>
            ⚠️ CPMK belum diisi — beberapa bagian dokumen akan kosong. <button className="btn btn-secondary btn-sm" style={{ marginLeft: 8 }} onClick={() => navigate(`/form/${id}`)}>Isi sekarang →</button>
          </div>
        )}

        {/* ── Konten dokumen ── */}
        <div ref={printRef}>
          {(activeDoc === 'silabus' || activeDoc === 'keduanya') && (
            <div className={activeDoc === 'keduanya' ? 'print-page' : ''} style={{ marginBottom: activeDoc === 'keduanya' ? 32 : 0 }}>
              <TabSilabus dok={dokumen} cplSelected={cplSelected} cpmkList={cpmkList} />
            </div>
          )}
          {(activeDoc === 'rps' || activeDoc === 'keduanya') && (
            <div>
              <TabRPS dok={dokumen} cplSelected={cplSelected} cpmkList={cpmkList} sap={sap} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}

const thS = { padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #e2e8f0' };
const tdS = { padding: '7px 10px', fontSize: 12, verticalAlign: 'top', lineHeight: 1.6 };
