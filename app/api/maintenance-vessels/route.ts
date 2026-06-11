import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/app/lib/db"; // Disarankan menggunakan path alias agar aman jika file dipindah


export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope");

  try {
    const sql = getSql();

    // Scope 'all': mengembalikan semua kapal untuk dropdown/inisialisasi
    if (scope === "all") {
      // 2. PERBAIKAN: Menuliskan generic type langsung pada function sql<> agar lebih clean tanpa "as unknown as"
      const rows = await sql<Array<{ id: string | number; status: string }>>`
        SELECT id, status
        FROM fleet_vessels
        ORDER BY id ASC
      `;
      
      const vessels = rows.map((r) => ({
        id: String(r.id),
        status: r.status ?? "UNKNOWN",
      }));
      
      return NextResponse.json({ success: true, vessels });
    }

    // Default scope: hanya kapal dengan status MAINTENANCE
    // 3. PERBAIKAN: Menggunakan UPPER() untuk mengantisipasi ketidakkonsistenan penulisan huruf di DB (misal: 'Maintenance' atau 'maintenance')
    const rows = await sql<Array<{
      id: string | number;
      destination: string | null;
      status: string;
      eta: string | null;
      monitoring_icon: string | null;
    }>>`
      SELECT id, destination, status, eta, monitoring_icon
      FROM fleet_vessels
      WHERE UPPER(status) = 'MAINTENANCE'
      ORDER BY id ASC
    `;

    const vessels = rows.map((r) => ({
      id: String(r.id),
      destination: r.destination ?? "UNKNOWN HUB",
      status: r.status,
      eta: r.eta ?? "--",
      monitoring_icon: r.monitoring_icon ?? "wrench",
    }));

    return NextResponse.json({ success: true, vessels });
  } catch (error: any) {
    console.error("[/api/maintenance-vessels] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        vessels: [], 
        error: error?.message ?? "Database error" 
      },
      { status: 200 } // Tetap 200 sesuai kebutuhan proteksi komponen client Anda
    );
  }
}
