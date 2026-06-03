import { NextResponse } from 'next/server';
import { getSql } from '@/app/lib/db'; // Sesuaikan path ini dengan lokasi file db.ts kamu

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.toUpperCase().trim();

  if (!id) {
    return NextResponse.json({ error: 'ID atau Nomor Resi tidak boleh kosong' }, { status: 400 });
  }

  try {
    const sql = getSql();

    // 1. Ambil data dari tabel tracking_packages (untuk koordinat live di peta)
    const trackingData = await sql`
      SELECT id, package_size, destination, lat, lng, vessel_name 
      FROM tracking_packages 
      WHERE UPPER(id) = ${id} 
      LIMIT 1
    `;

    // 2. Ambil data dari tabel barang (untuk manifest status pengemasan/gudang)
    const barangData = await sql`
      SELECT no_resi, status_barang, nama_pengirim, nama_penerima, negara_asal, negara_tujuan 
      FROM barang 
      WHERE UPPER(no_resi) = ${id} 
      LIMIT 1
    `;

    return NextResponse.json({
      tracking: trackingData[0] || null,
      barang: barangData[0] || null
    });
  } catch (error) {
    console.error('Database API Error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data dari database Neon' }, { status: 500 });
  }
}
