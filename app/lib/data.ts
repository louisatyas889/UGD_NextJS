import { getSql } from './db';
import type { InvoicesTable } from './definitions';

// Interface penyesuaian tipe data objek revenue bulanan
export interface Revenue {
  month: string;
  revenue: number;
}

// ==========================================
// 1. Ambil data asli dari tabel REVENUE baru di Neon
// ==========================================
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

// ==========================================
// 2. Ambil data dari tabel fleet_vessels
// ==========================================
export async function fetchVesselData() {
  const sql = getSql();
  try {
    const data = await sql`SELECT * FROM fleet_vessels`;
    return data;
  } catch (error) {
    console.error('Database Error [fetchVesselData]:', error);
    return [];
  }
}

// ==========================================
// 3. Ambil data dari tabel fleet_alerts
// ==========================================
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

// ==========================================
// 4. Ambil data dari tabel tracking_packages
// ==========================================
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
