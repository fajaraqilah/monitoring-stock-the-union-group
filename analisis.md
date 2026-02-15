📌 1. Tidak Memfilter Waktu Transaksi

Masalah:
Kamu mengasumsikan data transfer = 30 hari terakhir, tapi tidak memfilter tanggal di query.

Bagian script:

let transferQuery = this.supabase
  .from('internal_transfer')
  .select('item_code, quantity, document_date');

Dampak:

Velocity terlalu besar

Tidak mencerminkan kondisi terkini

ROP jadi tidak realistis

Seharusnya:

Filter document_date (misalnya 30 hari terakhir atau bulan tertentu)

📌 2. Tidak Memperhatikan Arah Transfer (from → to)

Masalah:
Semua transfer dianggap sebagai pemakaian.

Bagian script:

dailyUsage[u.item_code] += (parseFloat(u.quantity) || 0);

Dampak:

Transfer masuk ikut dihitung sebagai konsumsi

Bisa terjadi double counting

Velocity jadi bias

Seharusnya:

Hanya hitung transfer KELUAR dari gudang yang dianalisis
(from_warehouse_name = warehouse target)

📌 3. Tidak Memfilter Berdasarkan Gudang

Masalah:
Velocity dihitung global, tidak spesifik per warehouse.

Bagian script:

let transferQuery = this.supabase
  .from('internal_transfer')
  .select('item_code, quantity, document_date');

Dampak:

Stok gudang A dibandingkan dengan pemakaian gudang B

Rekomendasi reorder salah lokasi

Seharusnya:

Filter from_warehouse_name atau from_warehouse_code

📌 4. Tidak Menggunakan Receiving untuk Perhitungan Stok Historis

Masalah:
Kamu hanya pakai inventory_stock sebagai stok awal.

Bagian script:

let stockQuery = this.supabase.from('inventory_stock')

Dampak:

Tidak bisa validasi apakah stok konsisten

Tidak bisa menghitung tren masuk vs keluar

Seharusnya (ideal):

Bisa dibandingkan dengan receiving (opsional, tapi lebih kuat secara sistem)

📌 5. Asumsi Data Selalu 30 Hari

Masalah:
Kamu hardcode pembagi 30.

Bagian script:

dailyUsage[key] = dailyUsage[key] / 30;

Dampak:

Kalau data cuma 10 hari → velocity salah

Kalau data 90 hari → velocity salah

Seharusnya:

Hitung jumlah hari dari rentang tanggal transaksi

📌 6. Tidak Memisahkan Jenis Item (Fast Moving vs Slow Moving)

Masalah:
Semua item diperlakukan sama.

Bagian script:

const safetyStock = velocity * 2;

Dampak:

Barang mahal & lambat gerak dapat safety stock besar

Tidak sesuai karakter F&B

Seharusnya:

Safety stock berbeda per kategori item

📌 7. Tidak Ada Penanganan Data Kosong / Null

Masalah:
Jika tidak ada transfer, velocity = 0 dan item diabaikan.

Bagian script:

if (currentStock <= reorderPoint && velocity > 0)

Dampak:

Item baru tidak pernah direkomendasikan reorder

Potensi out of stock tidak terdeteksi

Seharusnya:

Tetap buat status khusus: “No Usage Data”

📌 8. Sorting Status Kurang Konsisten

Masalah:
Sorting hanya cek Out of Stock.

Bagian script:

return recommendations.sort((a, b) => (b.status === 'Out of Stock' ? 1 : -1));

Dampak:

Critical dan Overstock tercampur

Prioritas tidak jelas

Seharusnya:

Buat bobot prioritas:
Out of Stock > Critical > Overstock