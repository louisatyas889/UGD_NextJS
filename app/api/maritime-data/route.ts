import { NextResponse } from "next/server";
import { getSql } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Pastikan koneksi benar-benar terjadi (dan dapat error root-cause)
    const sql = getSql();

    // 0) Test koneksi ringan
    await sql`SELECT 1 AS ok`;

    // Query untuk mengambil data fleet beserta rutenya
    const fleetData = await sql`
      SELECT 
        v.id,
        v.destination,
        v.status,
        v.status_color,
        v.current_lat,
        v.current_lng,
        COALESCE(
          json_agg(
            json_build_object(
              'id', r.id,
              'nomor_rute', r.nomor_rute,
              'status_rute', r.status_rute,
              'jalur_koordinat', r.jalur_koordinat
            ) ORDER BY r.nomor_rute ASC
          ) FILTER (WHERE r.id IS NOT NULL), '[]'::json
        ) AS routes
      FROM fleet_vessels v
      LEFT JOIN vessel_routes r ON v.id = r.vessel_id
      GROUP BY v.id, v.destination, v.status, v.status_color, v.current_lat, v.current_lng
      ORDER BY v.id ASC
    `;

    return NextResponse.json({
      fleetVessels: fleetData ?? [],
    });
  } catch (error) {
    console.error("Error pada API Maritime Data:", error);

    // Jangan keluarkan secret; tampilkan error message yang aman untuk debugging
    const message = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { error: "Gagal mengambil data dari database Neon", details: message },
      { status: 500 },
    );
  }
}


