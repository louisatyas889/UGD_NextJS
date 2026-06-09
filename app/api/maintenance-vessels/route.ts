import { NextRequest, NextResponse } from "next/server";
import { getSql } from "../../lib/db";

// Endpoint ini digunakan oleh MaintenanceContext (Client) untuk mengambil
// daftar kapal. Default: hanya kapal MAINTENANCE (untuk megamenu & list aktif).
// Query param ?scope=all  : kembalikan SEMUA kapal (untuk dropdown inisialisasi form).
export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope");

  try {
    const sql = getSql();

    if (scope === "all") {
      const rows = (await sql`
        SELECT id, status
        FROM fleet_vessels
        ORDER BY id ASC
      `) as unknown as Array<{ id: string | number; status: string }>;
      const vessels = rows.map((r) => ({
        id: String(r.id),
        status: r.status ?? "UNKNOWN",
      }));
      return NextResponse.json({ success: true, vessels });
    }

    // Default scope: hanya MAINTENANCE
    const rows = (await sql`
      SELECT id, destination, status, eta, monitoring_icon
      FROM fleet_vessels
      WHERE status = 'MAINTENANCE'
      ORDER BY id ASC
    `) as unknown as Array<{
      id: string | number;
      destination: string | null;
      status: string;
      eta: string | null;
      monitoring_icon: string | null;
    }>;

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
      { success: false, vessels: [], error: error?.message ?? "Database error" },
      { status: 200 } // tetap 200 agar client tidak crash, list kosong
    );
  }
}
