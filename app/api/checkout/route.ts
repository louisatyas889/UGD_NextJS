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
      package_size,
      nama_barang,
      berat,
      no_telepon,
      tanggal,
    } = body;

    const sql = getSql();

    await sql`
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
        ${nama_barang},
        ${berat},
        'Laut',
        '',
        '',
        '',
        0,
        'Siap Jalan',
        'Cepat',
        'Diproses',
        'Siap Kirim',
        ''
      )
    `;

    await sql`
      INSERT INTO tracking_packages (
        id,
        package_size,
        destination,
        lat,
        lng,
        vessel_name
      )
      VALUES (
        ${no_resi},
        ${package_size},
        ${negara_tujuan},
        14.5995,
        120.9842,
        'Serena Cargo Vessel'
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
