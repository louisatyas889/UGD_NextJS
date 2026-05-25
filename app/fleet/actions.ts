"use server";

import { revalidatePath } from "next/cache";
import { getSql } from "@/app/lib/db";

function getFleetSql() {
  return getSql();
}

// Fungsi bantuan untuk menentukan warna berdasarkan status kapal
function getVesselColors(status: string) {
  const lowerStatus = status.toLowerCase().trim();
  
  let statusColor = "#a855f7"; // Default MAINTENANCE (Purple)
  let etaColor = "#e5e7eb";     // Default teks ETA (Abu-abu terang)

  if (lowerStatus.includes("en route") || lowerStatus.includes("en_route") || lowerStatus === "en route") {
    statusColor = "#22d3ee"; // Cyan
    etaColor = "#e5e7eb";
  } else if (lowerStatus.includes("delay") || lowerStatus.includes("delayed")) {
    statusColor = "#f87171"; // Red
    etaColor = "#f87171";    // Teks ETA ikut merah kalau delay
  } else if (lowerStatus.includes("port") || lowerStatus.includes("docked") || lowerStatus.includes("in port")) {
    statusColor = "#6b7280"; // Muted Gray (Bisa diganti #10b981 jika ingin hijau pelabuhan)
    etaColor = "#e5e7eb";
  }

  return { statusColor, etaColor };
}

// 1. CREATE: Menambah Kapal Baru
export async function createVessel(formData: FormData) {
  const id = (formData.get("id") as string)?.toUpperCase();
  const destination = formData.get("destination") as string;
  const status = (formData.get("status") as string) || "MAINTENANCE";
  const eta = formData.get("eta") as string || '--';
  const monitoring_icon = formData.get("monitoring_icon") as string || 'chart';

  if (!id || !destination) return { error: "ID dan Tujuan wajib diisi" };

  // Hitung warna secara dinamis berdasarkan nilai status
  const { statusColor, etaColor } = getVesselColors(status);

  try {
    // FIX: Sekarang memasukkan status_color dan eta_color agar tidak NULL di Neon
    await getFleetSql()`
      INSERT INTO fleet_vessels (id, destination, status, status_color, eta, eta_color, monitoring_icon)
      VALUES (${id}, ${destination}, ${status}, ${statusColor}, ${eta}, ${etaColor}, ${monitoring_icon})
    `;
    revalidatePath("/fleet");
    revalidatePath("/map");
    return { success: true };
  } catch (err) {
    console.error("Error at createVessel:", err);
    return { error: "Gagal menambahkan data kapal ke Neon." };
  }
}

// 2. UPDATE: Mengedit Kapal yang Ada
export async function updateVessel(formData: FormData) {
  const id = formData.get("id") as string;
  const destination = formData.get("destination") as string;
  const status = (formData.get("status") as string) || "MAINTENANCE";
  const eta = formData.get("eta") as string || '--';
  const monitoring_icon = formData.get("monitoring_icon") as string || 'chart';

  // Hitung warna baru secara dinamis saat data diedit
  const { statusColor, etaColor } = getVesselColors(status);

  try {
    // FIX: Perbarui juga kolom warnanya di Neon saat data di-update
    await getFleetSql()`
      UPDATE fleet_vessels 
      SET destination = ${destination}, 
          status = ${status}, 
          status_color = ${statusColor}, 
          eta = ${eta}, 
          eta_color = ${etaColor}, 
          monitoring_icon = ${monitoring_icon}
      WHERE id = ${id}
    `;
    revalidatePath("/fleet");
    revalidatePath("/map");
    return { success: true };
  } catch (err) {
    console.error("Error at updateVessel:", err);
    return { error: "Gagal memperbarui data kapal." };
  }
}

// 3. DELETE: Menghapus Kapal
export async function deleteVessel(id: string) {
  try {
    await getFleetSql()`DELETE FROM fleet_vessels WHERE id = ${id}`;
    revalidatePath("/fleet");
    revalidatePath("/map");
    return { success: true };
  } catch (err) {
    console.error("Error at deleteVessel:", err);
    return { error: "Gagal menghapus data kapal." };
  }
}
