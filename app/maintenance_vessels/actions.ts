"use server";

import { revalidatePath } from "next/cache";
import { getSql } from "../lib/db";

export async function saveVesselMaintenance(formData: FormData) {
  // 1. Mengambil data dari form client
  const vesselId = formData.get("vesselId") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const damageLevel = formData.get("damageLevel") as string;
  const description = formData.get("description") as string;

  // 2. Validasi data
  if (!vesselId || !startDate || !endDate || !damageLevel || !description) {
    return { success: false, error: "Semua kolom input wajib diisi!" };
  }

  const sql = getSql();

  try {
    // A. Mengupdate status di tabel utama 'fleet_vessels'
    // Status menjadi MAINTENANCE, warna ungu (#a855f7), icon menjadi 'wrench'
    await sql`
      UPDATE fleet_vessels 
      SET 
        status = 'MAINTENANCE', 
        status_color = '#a855f7',
        monitoring_icon = 'wrench',
        updated_at = NOW()
      WHERE id = ${vesselId}
    `;

    // B. Menyimpan detail kerusakan ke tabel khusus 'maintenance_logs'
    // (Jika tabel ini belum ada di Neon DB kamu, pastikan dibuat dulu ya)
    await sql`
      INSERT INTO maintenance_logs (vessel_id, start_date, end_date, damage_level, description, created_at)
      VALUES (${vesselId}, ${startDate}, ${endDate}, ${damageLevel}, ${description}, NOW())
    `;

    console.log(`Berhasil mengubah status ${vesselId} ke MAINTENANCE`);

    // 4. Refresh halaman agar status kapal di Fleet Page langsung berubah
    revalidatePath("/fleet");
    revalidatePath("/maintenance_vessels");
    // Refresh layout agar MaintenanceContext (Client) ikut re-fetch di polling berikutnya
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Database Error [saveVesselMaintenance]:", error);
    return { 
      success: false, 
      error: error.message || "Sistem gagal terhubung ke Database Neon." 
    };
  }
}

/**
 * Server action yang dipanggil SETELAH progress bar 100% selesai.
 * Tugasnya mengubah status kapal dari MAINTENANCE ke status baru yang dipilih user,
 * lalu kapal akan otomatis hilang dari megamenu MAINTENANCE VESSEL.
 *
 * @param vesselId ID kapal (misal: "PL-102-MARS")
 * @param newStatus Salah satu dari: "EN ROUTE", "IN PORT", "HOME PORT"
 */
export async function completeVesselMaintenance(vesselId: string, newStatus: string) {
  // Validasi input
  const allowed = ["EN ROUTE", "IN PORT", "HOME PORT"];
  if (!vesselId || !newStatus || !allowed.includes(newStatus)) {
    return { success: false, error: "Parameter tidak valid." };
  }

  // Tentukan warna & icon untuk status baru (samakan dengan STATUS_MAP di fleet-page-client)
  let statusColor = "#22d3ee";
  let monitoringIcon = "anchor";
  if (newStatus === "IN PORT") {
    statusColor = "#6b7280";
    monitoringIcon = "anchor";
  } else if (newStatus === "HOME PORT") {
    statusColor = "#ffffff";
    monitoringIcon = "home";
  }

  const sql = getSql();

  try {
    await sql`
      UPDATE fleet_vessels
      SET 
        status = ${newStatus},
        status_color = ${statusColor},
        monitoring_icon = ${monitoringIcon},
        updated_at = NOW()
      WHERE id = ${vesselId} AND status = 'MAINTENANCE'
    `;

    // Update log maintenance: tandai log terakhir kapal ini sebagai 'completed'
    // Tabel maintenance_logs bersifat opsional, jadi pakai try/catch terpisah agar tidak menggagalkan flow utama
    try {
      await sql`
        UPDATE maintenance_logs
        SET completed_at = NOW()
        WHERE id = (
          SELECT id FROM maintenance_logs 
          WHERE vessel_id = ${vesselId} AND completed_at IS NULL
          ORDER BY created_at DESC LIMIT 1
        )
      `;
    } catch (logErr) {
      console.warn("[completeVesselMaintenance] maintenance_logs update skipped:", logErr);
    }

    // Revalidate path agar data di Fleet page & layout (MaintenanceContext polling) ikut ter-update
    revalidatePath("/fleet");
    revalidatePath("/map");
    revalidatePath("/maintenance_vessels");
    revalidatePath("/", "layout");

    console.log(`[completeVesselMaintenance] ${vesselId} -> ${newStatus}`);
    return { success: true };
  } catch (error: any) {
    console.error("Database Error [completeVesselMaintenance]:", error);
    return { 
      success: false, 
      error: error.message || "Gagal memperbarui status kapal." 
    };
  }
}
