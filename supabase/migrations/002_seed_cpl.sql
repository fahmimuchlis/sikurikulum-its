-- =============================================================
-- Seed Data: CPL Departemen Arsitektur ITS (Semua Jenjang)
-- Sumber: Dokumen Kurikulum ARS-ITS 2023-2028
-- =============================================================

-- ── CPL Jenjang S1 (Sarjana) ─────────────────────────────────
INSERT INTO master_cpl (jenjang, nomor_cpl, kategori, deskripsi_id, deskripsi_en) VALUES
('S1', 'CPL-1',  'Sikap',
 'Bertakwa kepada Tuhan Yang Maha Esa dan mampu menunjukkan sikap religius;',
 'Believe in God and be able to show religious attitudes;'),
('S1', 'CPL-2',  'Sikap',
 'Menjunjung tinggi nilai kemanusiaan dalam menjalankan tugas berdasarkan agama, moral, dan etika;',
 'Uphold human values in performing duties based on religion, morals and ethics;'),
('S1', 'CPL-3',  'Sikap',
 'Berkontribusi dalam peningkatan mutu kehidupan bermasyarakat, berbangsa, bernegara, dan kemajuan peradaban berdasarkan Pancasila;',
 NULL),
('S1', 'CPL-4',  'Sikap',
 'Berperan sebagai warga negara yang bangga dan cinta tanah air, memiliki nasionalisme serta rasa tanggung jawab pada negara dan bangsa;',
 NULL),
('S1', 'CPL-5',  'Sikap',
 'Menghargai keanekaragaman budaya, pandangan, agama, dan kepercayaan, serta pendapat atau temuan orisinal orang lain;',
 NULL),
('S1', 'CPL-6',  'Sikap',
 'Bekerja sama dan memiliki kepekaan sosial serta kepedulian terhadap masyarakat dan lingkungan;',
 'Work together and have social sensitivity and concern for society and the environment;'),
('S1', 'CPL-7',  'Sikap',
 'Taat hukum dan disiplin dalam kehidupan bermasyarakat dan bernegara;',
 NULL),
('S1', 'CPL-8',  'Sikap',
 'Menginternalisasi nilai, norma, dan etika akademik;',
 NULL),
('S1', 'CPL-9',  'Pengetahuan',
 'Menguasai konsep dan prinsip perancangan arsitektur yang mempertimbangkan aspek fungsi, estetika, struktur, utilitas, dan konteks;',
 'Master the concepts and principles of architectural design that consider aspects of function, aesthetics, structure, utilities, and context;'),
('S1', 'CPL-10', 'Ketrampilan Khusus',
 'Mampu merancang dan mendokumentasikan karya arsitektur secara komprehensif;',
 'Able to design and document architectural works comprehensively;'),
('S1', 'CPL-11', 'Ketrampilan Umum',
 'Mampu menerapkan pemikiran logis, kritis, sistematis, dan inovatif dalam konteks pengembangan atau implementasi ilmu pengetahuan dan teknologi yang memperhatikan dan menerapkan nilai humaniora;',
 'Able to apply logical, critical, systematic, and innovative thinking in the context of developing or implementing science and technology that pays attention to and applies humanistic values;');

-- ── CPL Jenjang Profesi (PPAr) ───────────────────────────────
INSERT INTO master_cpl (jenjang, nomor_cpl, kategori, deskripsi_id, deskripsi_en) VALUES
('Profesi', 'CPL-P1', 'Sikap',
 'Menjunjung tinggi nilai kemanusiaan dalam menjalankan tugas berdasarkan agama, moral, dan etika profesi arsitek;',
 'Uphold human values in performing the duties of the architect profession based on religion, morals and professional ethics;'),
('Profesi', 'CPL-P2', 'Sikap',
 'Memiliki integritas profesional dan etika profesi yang tinggi dalam praktik arsitektur;',
 'Have high professional integrity and professional ethics in architectural practice;'),
('Profesi', 'CPL-P3', 'Pengetahuan',
 'Menguasai pengetahuan lanjut tentang perancangan arsitektur yang terintegrasi dengan aspek teknis, sosial, budaya, dan lingkungan;',
 'Master advanced knowledge of architectural design integrated with technical, social, cultural, and environmental aspects;'),
('Profesi', 'CPL-P4', 'Pengetahuan',
 'Menguasai regulasi, standar, dan prosedur profesi arsitektur di tingkat nasional dan internasional;',
 'Master regulations, standards, and procedures of the architectural profession at national and international levels;'),
('Profesi', 'CPL-P5', 'Ketrampilan Khusus',
 'Mampu memimpin dan mengelola proyek arsitektur secara profesional;',
 'Able to lead and manage architectural projects professionally;'),
('Profesi', 'CPL-P6', 'Ketrampilan Khusus',
 'Mampu merancang karya arsitektur yang inovatif, berkelanjutan, dan responsif terhadap konteks lokal dan global;',
 'Able to design innovative, sustainable architectural works that are responsive to local and global contexts;'),
('Profesi', 'CPL-P7', 'Ketrampilan Khusus',
 'Mampu berkomunikasi dan berkolaborasi secara efektif dalam tim multidisiplin pada proyek arsitektur;',
 'Able to communicate and collaborate effectively in multidisciplinary teams on architectural projects;'),
('Profesi', 'CPL-P8', 'Ketrampilan Umum',
 'Mampu mengembangkan diri secara berkelanjutan dan beradaptasi dengan perkembangan ilmu dan praktik arsitektur;',
 'Able to continuously develop themselves and adapt to developments in architectural science and practice;');

-- ── CPL Jenjang S2 (Magister) ───────────────────────────────
INSERT INTO master_cpl (jenjang, nomor_cpl, kategori, deskripsi_id, deskripsi_en) VALUES
('S2', 'CPL-M1', 'Sikap',
 'Memiliki integritas akademik dan komitmen terhadap pengembangan ilmu arsitektur;',
 'Have academic integrity and commitment to the development of architectural science;'),
('S2', 'CPL-M2', 'Pengetahuan',
 'Menguasai teori dan metodologi penelitian arsitektur secara mendalam;',
 'Master architectural research theories and methodologies in depth;'),
('S2', 'CPL-M3', 'Pengetahuan',
 'Menguasai pengetahuan mutakhir tentang isu-isu arsitektur kontemporer dalam konteks lokal dan global;',
 'Master up-to-date knowledge of contemporary architectural issues in local and global contexts;'),
('S2', 'CPL-M4', 'Ketrampilan Khusus',
 'Mampu mengembangkan teori, konsep, dan/atau metode baru dalam ilmu arsitektur melalui penelitian;',
 'Able to develop new theories, concepts, and/or methods in architectural science through research;'),
('S2', 'CPL-M5', 'Ketrampilan Khusus',
 'Mampu merancang karya arsitektur yang inovatif berbasis penelitian dan kajian kritis;',
 'Able to design innovative architectural works based on research and critical studies;'),
('S2', 'CPL-M6', 'Ketrampilan Khusus',
 'Mampu menganalisis dan mengkritisi karya arsitektur dalam konteks budaya, sejarah, dan sosial;',
 'Able to analyze and critique architectural works in cultural, historical, and social contexts;'),
('S2', 'CPL-M7', 'Ketrampilan Umum',
 'Mampu mendiseminasikan hasil penelitian melalui publikasi ilmiah bereputasi;',
 'Able to disseminate research results through reputable scientific publications;'),
('S2', 'CPL-M8', 'Ketrampilan Umum',
 'Mampu memimpin dan mengelola tim riset atau perancangan dalam konteks akademik dan profesional;',
 'Able to lead and manage research or design teams in academic and professional contexts;');

-- ── CPL Jenjang S3 (Doktor) ─────────────────────────────────
INSERT INTO master_cpl (jenjang, nomor_cpl, kategori, deskripsi_id, deskripsi_en) VALUES
('S3', 'CPL-D1', 'Sikap',
 'Memiliki kemandirian akademik dan berkontribusi pada pengembangan ilmu arsitektur di tingkat internasional;',
 'Have academic independence and contribute to the development of architectural science at the international level;'),
('S3', 'CPL-D2', 'Pengetahuan',
 'Menguasai bidang spesialisasi arsitektur secara komprehensif di garis terdepan ilmu pengetahuan;',
 'Master the field of architectural specialization comprehensively at the forefront of knowledge;'),
('S3', 'CPL-D3', 'Pengetahuan',
 'Menguasai epistemologi dan filsafat ilmu yang relevan dengan penelitian arsitektur;',
 'Master epistemology and philosophy of science relevant to architectural research;'),
('S3', 'CPL-D4', 'Ketrampilan Khusus',
 'Mampu menghasilkan pengetahuan baru yang memberikan kontribusi orisinal pada ilmu arsitektur;',
 'Able to generate new knowledge that makes an original contribution to architectural science;'),
('S3', 'CPL-D5', 'Ketrampilan Khusus',
 'Mampu merancang dan mengimplementasikan metodologi penelitian arsitektur yang inovatif;',
 'Able to design and implement innovative architectural research methodologies;'),
('S3', 'CPL-D6', 'Ketrampilan Khusus',
 'Mampu mengembangkan paradigma baru dalam teori dan praktik arsitektur;',
 'Able to develop new paradigms in architectural theory and practice;'),
('S3', 'CPL-D7', 'Ketrampilan Umum',
 'Mampu memimpin komunitas akademik dan menjadi rujukan dalam bidang arsitektur;',
 'Able to lead academic communities and become a reference in the field of architecture;');

-- =============================================================
-- Seed Data: Contoh Mata Kuliah (dari dokumen ARS-ITS)
-- =============================================================
INSERT INTO master_mata_kuliah (kode_mk, nama_mk, sks, jenjang, semester, departemen) VALUES
-- S1 Semester 1-2
('CA113101', 'Fisika Bangunan 1', 2, 'S1', 1, 'Arsitektur'),
('CA113102', 'Matematika Teknik', 2, 'S1', 1, 'Arsitektur'),
('CA113103', 'Pengantar Arsitektur', 2, 'S1', 1, 'Arsitektur'),
('CA113104', 'Studio Perancangan Arsitektur 1', 4, 'S1', 1, 'Arsitektur'),
('CA113201', 'Fisika Bangunan 2', 2, 'S1', 2, 'Arsitektur'),
('CA113202', 'Teknologi Bahan Bangunan', 2, 'S1', 2, 'Arsitektur'),
('CA113203', 'Sejarah Arsitektur 1', 2, 'S1', 2, 'Arsitektur'),
('CA113204', 'Studio Perancangan Arsitektur 2', 4, 'S1', 2, 'Arsitektur'),
-- S1 Semester 3-4
('CA213301', 'Struktur Bangunan 1', 2, 'S1', 3, 'Arsitektur'),
('CA213302', 'Utilitas Bangunan', 2, 'S1', 3, 'Arsitektur'),
('CA213303', 'Sejarah Arsitektur 2', 2, 'S1', 3, 'Arsitektur'),
('CA213304', 'Studio Perancangan Arsitektur 3', 4, 'S1', 3, 'Arsitektur'),
('CA213401', 'Struktur Bangunan 2', 2, 'S1', 4, 'Arsitektur'),
('CA213402', 'Manajemen Konstruksi', 2, 'S1', 4, 'Arsitektur'),
('CA213403', 'Arsitektur Tropis', 2, 'S1', 4, 'Arsitektur'),
('CA213404', 'Studio Perancangan Arsitektur 4', 4, 'S1', 4, 'Arsitektur'),
-- S1 Semester 5-6
('CA234503', 'Berpikir Merancang Digital / Digital Design Thinking', 3, 'S1', 5, 'Arsitektur'),
('CA234504', 'Perancangan Arsitektur 5', 4, 'S1', 5, 'Arsitektur'),
('CA234505', 'Asas Perancangan Arsitektur Kontekstual', 2, 'S1', 5, 'Arsitektur'),
('CA234601', 'Perancangan Arsitektur 6 / Urban Design', 4, 'S1', 6, 'Arsitektur'),
('CA234602', 'Metode Penelitian Arsitektur', 2, 'S1', 6, 'Arsitektur'),
('CA234603', 'Arsitektur Berkelanjutan', 2, 'S1', 6, 'Arsitektur'),
-- S1 Semester 7-8
('CA234701', 'Perancangan Arsitektur 7', 4, 'S1', 7, 'Arsitektur'),
('CA234702', 'Seminar Arsitektur', 2, 'S1', 7, 'Arsitektur'),
('CA234801', 'Tugas Akhir', 6, 'S1', 8, 'Arsitektur'),
-- Profesi
('CP201', 'Studio Arsitektur Profesi 1', 4, 'Profesi', 1, 'Arsitektur'),
('CP202', 'Manajemen Proyek Arsitektur', 2, 'Profesi', 1, 'Arsitektur'),
('CP203', 'Hukum dan Etika Profesi', 2, 'Profesi', 1, 'Arsitektur'),
('CP204', 'Studio Arsitektur Profesi 2', 4, 'Profesi', 2, 'Arsitektur'),
-- S2
('CM201', 'Teori Arsitektur Lanjut', 3, 'S2', 1, 'Arsitektur'),
('CM202', 'Metode Penelitian Kualitatif', 3, 'S2', 1, 'Arsitektur'),
('CM203', 'Seminar Proposal Tesis', 2, 'S2', 2, 'Arsitektur'),
('CM204', 'Tesis', 6, 'S2', 3, 'Arsitektur'),
-- S3
('CD301', 'Epistemologi Arsitektur', 3, 'S3', 1, 'Arsitektur'),
('CD302', 'Metodologi Penelitian Lanjut', 3, 'S3', 1, 'Arsitektur'),
('CD303', 'Seminar Disertasi', 2, 'S3', 2, 'Arsitektur'),
('CD304', 'Disertasi', 12, 'S3', 3, 'Arsitektur');
