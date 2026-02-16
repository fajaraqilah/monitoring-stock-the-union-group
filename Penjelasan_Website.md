# Penjelasan Aplikasi: Inventory Management System (The Union Group)

Dokumen ini berisi narasi formal untuk menjelaskan proyek website monitoring stok Anda. Teks ini dirancang agar Anda terlihat menguasai baik sisi bisnis/fungsional maupun sisi teknis (engineering).

---

## 1. Latar Belakang & Tujuan (The "Why")
**Narasi:**
"Website ini dikembangkan sebagai solusi digital untuk optimalisasi manajemen inventaris di **The Union Group**. Masalah utama yang ingin diselesaikan adalah kurangnya visibilitas data stok secara real-time dan proses rekapitulasi data manual yang memakan waktu. Aplikasi ini hadir untuk memonitor pergerakan stok, mulai dari penerimaan barang (*Receiving*), transfer internal antar gudang (*Internal Transfer*), hingga pemantauan stok akhir di setiap outlet secara otomatis dan akurat."

---

## 2. Fitur Utama (The "What")
Dalam menjelaskan fitur, fokuslah pada nilai tambah (value) yang diberikan:

*   **Dashboard Interaktif:** Menggunakan visualisasi grafis untuk memberikan ringkasan cepat mengenai total nilai stok, tren penerimaan barang, dan distribusi stok di 5 outlet/warehouse teratas. Ini memudahkan manajemen dalam pengambilan keputusan.
*   **Manajemen Inventaris End-to-End:** Memungkinkan pelacakan detail setiap item berdasarkan grup, sub-grup, merek, hingga lokasi bin (rak) penyimpanan.
*   **Otomasi Data Management:** Fitur *Upload Data* memungkinkan admin mengunggah ribuan baris data dari file CSV/Excel secara sekaligus. Sistem secara otomatis melakukan normalisasi data dan validasi sebelum disimpan ke database.
*   **Keamanan & Role-Based Access:** Sistem dilengkapi dengan autentikasi yang membedakan hak akses antara *Admin* (yang bisa mengelola/unggah data) dan *User* biasa.

---

## 3. Arsitektur Teknis (The "How")
Gunakan poin ini untuk menunjukkan keahlian teknis Anda:

*   **Frontend:** Menggunakan **Vanilla JavaScript (ES Modules)** untuk logika yang ringan dan cepat, serta **Tailwind CSS** untuk desain antarmuka yang modern dan responsif.
*   **Backend-as-a-Service (BaaS):** Menggunakan **Supabase** yang didukung oleh database **PostgreSQL**. Ini memungkinkan manajemen database, sistem autentikasi, dan *Row Level Security* (RLS) yang sangat aman.
*   **Data Visualization:** Menggunakan library **Chart.js** untuk merepresentasikan data kompleks ke dalam bentuk grafik batang, garis, dan doughnut yang mudah dipahami.
*   **Data Processing:** Integrasi dengan **SheetJS (XLSX)** untuk memproses file spreadsheet langsung di sisi klien (browser) sebelum dikirim ke database.

---

## 4. Keunggulan Sistem (The "Value")
"Salah satu keunggulan utama sistem ini adalah kemampuannya menangani data dalam jumlah besar melalui proses *chunking* saat proses upload, sehingga aplikasi tetap stabil meskipun mengolah ribuan baris data sekaligus. Selain itu, penggunaan teknologi *Serverless* (melalui Supabase) membuat biaya operasional aplikasi menjadi sangat efisien tanpa mengorbankan keamanan data."
