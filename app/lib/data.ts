import { getSql } from './db';
import type { InvoicesTable } from './definitions';

// Interface tetap sama, tidak diubah agar kompatibel dengan sistem
export interface Revenue {
  month: string;
  revenue: number;
}

export interface VesselData {
  id: string;
  subtitle: string;
  destination: string;
  status: string;
  status_color: string;
  eta: string;
  eta_color: string;
  monitoring_icon: string;
  progress_pct: number;
  speed: string;
  fuel: string;
  diag: string;
  signal: string;
  weather: string;
  color: string;
  region: string;
  current_lat: number;
  current_lng: number;
  route_id: number | null;
  jalur_koordinat: [number, number][] | null;
}

export async function fetchRevenue() {
  const sql = getSql();
  try {
    const data = await sql<Revenue[]>`SELECT * FROM revenue`;
    return data;
  } catch (error) {
    console.error('Database Error [fetchRevenue]:', error);
    return [];
  }
}

// 2. Ambil data gabungan fleet_vessels dan jalurnya dari vessel_routes
export async function fetchVesselData(): Promise<VesselData[]> {
  const sql = getSql();
  try {
    // Perbaikan: Menggunakan Alias untuk sinkronisasi properti ke UI dan nomor_rute untuk pengurutan
    const data = await sql<VesselData[]>`
      SELECT DISTINCT ON (f.id)
        f.*, 
        f.destination AS dest,
        f.status_color AS "statusColor",
        f.monitoring_icon AS mon,
        r.jalur_koordinat
      FROM fleet_vessels f
      LEFT JOIN vessel_routes r ON f.id = r.vessel_id
      ORDER BY f.id, r.nomor_rute DESC;
    `;
    return data;
  } catch (error) {
    console.error('Database Error [fetchVesselData]:', error);
    return [];
  }
}

export async function fetchFleetAlerts() {
  const sql = getSql();
  try {
    const data = await sql`SELECT * FROM fleet_alerts ORDER BY id DESC LIMIT 5`;
    return data;
  } catch (error) {
    console.error('Database Error [fetchFleetAlerts]:', error);
    return [];
  }
}

export async function fetchTrackingPackages() {
  const sql = getSql();
  try {
    const data = await sql`SELECT * FROM tracking_packages LIMIT 7`;
    return data;
  } catch (error) {
    console.error('Database Error [fetchTrackingPackages]:', error);
    return [];
  }
}

export async function fetchFilteredInvoices(
  _query: string,
  _currentPage: number,
): Promise<InvoicesTable[]> {
  return [];
}
