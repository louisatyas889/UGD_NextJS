import { NextResponse } from 'next/server';
import { getSql } from '@/app/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      no_resi,
      nama_pengirim,
      nama_penerima,
      negara_asal,
      negara_tujuan,
      package_size, // Nilai 'Small', 'Medium', atau 'Large'
      nama_barang,
      jenis_barang,
      berat,
      no_telepon,
      tanggal,
      pembayaran, 
    } = body;

    // 1. HITUNG HARGA BERDASARKAN PACKAGE SIZE
    let hargaLayanan = 0;
    if (package_size === 'Small') {
      hargaLayanan = 250000;
    } else if (package_size === 'Medium') {
      hargaLayanan = 1200000;
    } else if (package_size === 'Large') {
      hargaLayanan = 5500000;
    }

    const sql = getSql();

    // 2. INSERT KE TABEL BARANG DAN AMBIL ID BARANG YANG BARU
    const insertBarangResult = await sql`
      INSERT INTO barang (
        no_resi,
        tanggal_kirim,
        nama_pengirim,
        nama_penerima,
        no_telepon,
        negara_asal,
        negara_tujuan,
        nama_barang,
        jenis_barang,
        berat_barang_kg,
        moda_pengiriman,
        jenis_kendaraan,
        nama_kendaraan,
        kode_kendaraan,
        kapasitas_kendaraan_kg,
        status_kendaraan,
        jenis_pengiriman,
        status_pengiriman,
        status_barang,
        deskripsi
      )
      VALUES (
        ${no_resi},
        ${tanggal},
        ${nama_pengirim},
        ${nama_penerima},
        ${no_telepon},
        ${negara_asal},
        ${negara_tujuan},
        ${nama_barang},
        ${jenis_barang},
        ${berat},
        'Laut',
        '',
        'Serena Cargo Vessel', -- Disamakan dengan nama kapal di tracking paket biar sinkron
        '',
        0,
        'Siap Jalan',
        'Cepat',
        'Diproses',
        'Siap Kirim',
        ''
      )
      RETURNING id
    `;

    // Ambil ID barang hasil insert tadi
    const barangId = insertBarangResult[0].id;

    // 3. INSERT KE TABEL TRANSAKSI MENGGUNAKAN BARANG_ID
    await sql`
      INSERT INTO transaksi (
        barang_id,
        harga,
        status_transaksi
      )
      VALUES (
        ${barangId},
        ${hargaLayanan},
        'Lunas'
      )
    `;

    // 4. INSERT KE TABEL TRACKING_PACKAGES (SINKRON DENGAN TIMESTAMPS)
    await sql`
      INSERT INTO tracking_packages (
        id,
        package_size,
        destination,
        lat,
        lng,
        vessel_name,
        created_at,
        updated_at
      )
      VALUES (
        ${no_resi},
        ${package_size}, -- Sekarang datanya murni 'Small'/'Medium'/'Large' sesuai frontend
        ${negara_tujuan},
        14.5995,
        120.9842,
        'Serena Cargo Vessel',
        NOW(), -- Mengisi waktu pembuatan otomatis di Neon
        NOW()  -- Mengisi waktu update otomatis di Neon
      )
    `;

    return NextResponse.json({
      success: true,
      no_resi,
    });

  } catch (error: any) {
    console.error("Checkout DB Error:", error);

    return NextResponse.json(
      {
        error: error.message || "Gagal menyimpan data"
      },
      {
        status: 500
      }
    );
  }
}
