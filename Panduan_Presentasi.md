# Panduan Strategi Presentasi Sidang Skripsi

Agar presentasi Anda meyakinkan, Anda tidak hanya perlu menjelaskan "apa" fitur website Anda, tapi juga "mengapa" Anda membangunnya seperti itu. Gunakan panduan ini untuk mengarahkan alur bicara Anda.

---

## 1. Alur Live Demo (Script Singkat)

**Langkah 1: Login & Dashboard**
*   "Saya mulai dengan login sebagai Admin. Di halaman utama, kita langsung disuguhkan Dashboard. Di sini penguji bisa melihat ringkasan visual stok kita saat ini secara real-time. Contohnya, grafik 'Top 5 Warehouse' ini memberi tahu kita outlet mana yang memiliki nilai aset stok tertinggi saat ini."

**Langkah 2: Navigasi Data (Inventory/Receiving)**
*   "Kita bisa masuk ke menu Inventory. Di sini, saya mengimplementasikan fitur filter dinamis. Misalnya, kita ingin mencari stok di outlet tertentu saja, sistem akan langsung memprosesnya dari ribuan baris data di PostgreSQL tanpa terasa lambat."

**Langkah 3: Fitur Andalan (Upload Data)**
*   "Ini adalah bagian yang paling krusial. Biasanya rekap data stok dilakukan manual di Excel. Dengan fitur ini, kita cukup mengunggah file CSV. Sistem saya akan melakukan pembersihan data (*data cleaning*) dan validasi format sebelum menyimpannya ke database Supabase."

---

## 2. Prediksi Pertanyaan Penguji & Cara Menjawab

**Pertanyaan 1: Mengapa menggunakan Vanilla JS dan bukan Framework seperti React/Vue?**
*   *Jawaban Terbaik:* "Saya memilih Vanilla JS untuk meminimalisir *overhead* dan memastikan performa aplikasi sangat cepat dan ringan. Selain itu, ini membuktikan pemahaman mendalam saya terhadap struktur dasar DOM dan logika JavaScript tanpa bergantung pada abstraksi framework."

**Pertanyaan 2: Seberapa aman data Anda?**
*   *Jawaban Terbaik:* "Keamanan dijamin melalui dua lapis. Pertama, Autentikasi Supabase untuk memverifikasi siapa penggunanya. Kedua, saya mengaktifkan **Row Level Security (RLS)** di database, sehingga user biasa tidak bisa melakukan modifikasi data meskipun mereka tahu endpoint database-nya."

**Pertanyaan 3: Bagaimana jika data yang diupload sangat banyak (misal 50.000 baris)?**
*   *Jawaban Terbaik:* "Saya sudah memitigasi hal tersebut dengan teknik **Bulk Processing & Chunking**. Data dipecah menjadi bagian-bagian kecil (per 1000 baris) sebelum dikirim, sehingga tidak membebani memori browser maupun batasan payload server."

---

## 3. Tips Tambahan Saat Sidang

1.  **Jangan Panik Saat Bug Muncul:** Jika terjadi error saat demo, jelaskan secara tenang: *"Tampaknya ada masalah koneksi/data format di sini, namun secara logika sistem sudah saya siapkan untuk menangani Exception Handling seperti yang ada di kode saya."*
2.  **Fokus pada Masalah & Solusi:** Ingatkan penguji terus-menerus bahwa aplikasi Anda ini dibuat untuk **mengefisiensi kerja**, bukan sekadar tugas membuat web.
3.  **Tunjukkan Kode (Jika Diminta):** Jika mereka ingin melihat kode, arahkan ke `public/js/charts.js` atau `public/js/auth.js` untuk menunjukkan kemampuan Anda dalam mengolah logika data dan keamanan.

**Semangat untuk sidangnya! Anda sudah membangun aplikasi yang sangat solid.**
