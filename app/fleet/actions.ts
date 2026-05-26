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

  if (lowerStatus.includes("en route") || lowerStatus === "en route") {
    statusColor = "#22d3ee"; // Cyan
    etaColor = "#e5e7eb";
  } else if (lowerStatus.includes("delay") || lowerStatus.includes("delayed")) {
    statusColor = "#f87171"; // Red
    etaColor = "#f87171";    // Teks ETA ikut merah kalau delay
  } else if (lowerStatus.includes("port") || lowerStatus.includes("in port") || lowerStatus.includes("docked")) {
    statusColor = "#6b7280"; // Muted Gray
    etaColor = "#e5e7eb";
  }

  return { statusColor, etaColor };
}

// 1. CREATE: Menambah Kapal Baru
export async function createVessel(formData: FormData) {
  const id = (formData.get("id") as string)?.toUpperCase();
  const destination = formData.get("destination") as string;
  const status = (formData.get("status") as string) || "MAINTENANCE";
  const etaInput = formData.get("eta") as string;
  const monitoring_icon = formData.get("monitoring_icon") as string || 'chart';

  if (!id || !destination) return { error: "ID dan Tujuan wajib diisi" };

  const { statusColor, etaColor } = getVesselColors(status);

  // Hitung Auto-ETA jika statusnya EN ROUTE dan inputnya kosong/--
  const generateAutoEta = () => {
    const arrival = new Date();
    const randomHours = Math.floor(Math.random() * 8) + 4; // Tambah 4 sampai 12 jam ke depan
    arrival.setHours(arrival.getHours() + randomHours);
    return arrival.toLocaleDateString("id-ID", { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    }).toUpperCase();
  };

  const finalEta = (status.toLowerCase().includes("en route") && (!etaInput || etaInput.trim() === "--" || etaInput.trim() === "")) 
    ? generateAutoEta() 
    : (etaInput || '--');

  try {
    await getFleetSql()`
      INSERT INTO fleet_vessels (id, destination, status, status_color, eta, eta_color, monitoring_icon)
      VALUES (${id}, ${destination}, ${status}, ${statusColor}, ${finalEta}, ${etaColor}, ${monitoring_icon})
    `;
    revalidatePath("/fleet");
    revalidatePath("/map");
    return { success: true };
  } catch (err) {
    console.error("Error at createVessel:", err);
    return { error: "Gagal menambahkan data kapal." };
  }
}

// 2. UPDATE: Mengedit Kapal yang Ada dengan Fitur Auto-ETA
export async function updateVessel(formData: FormData) {
  const id = formData.get("id") as string;
  const destination = formData.get("destination") as string;
  const status = (formData.get("status") as string) || "MAINTENANCE";
  const etaInput = formData.get("eta") as string;
  const monitoring_icon = formData.get("monitoring_icon") as string || 'chart';

  const { statusColor, etaColor } = getVesselColors(status);

  // Fungsi pembuat ETA otomatis (waktu sekarang + 4 s.d 12 jam ke depan)
  const generateAutoEta = () => {
    const arrival = new Date();
    const randomHours = Math.floor(Math.random() * 8) + 4; 
    arrival.setHours(arrival.getHours() + randomHours);
    return arrival.toLocaleDateString("id-ID", { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    }).toUpperCase();
  };

  try {
    // Ambil data kapal saat ini di database agar nilai lama aman
    const [currentVessel] = await getFleetSql()`SELECT eta FROM fleet_vessels WHERE id = ${id}`;
    
    let finalEta;
    
    // LOGIKA OTOMATISASI ETA:
    if (status.toLowerCase().includes("en route")) {
      // Jika status diganti/tetap EN ROUTE, dan input form kosong atau berkarakter "--" / "AUTO ETA"
      if (!etaInput || etaInput.trim() === "" || etaInput.trim() === "--" || etaInput.trim() === "AUTO ETA") {
        finalEta = generateAutoEta(); // Hitung waktu otomatis yang baru
      } else {
        finalEta = etaInput; // Jika user sengaja mengetik manual, pakai ketikan user
      }
    } else {
      // Jika statusnya BUKAN en route (misal: PORT atau MAINTENANCE)
      // Gunakan input baru jika ada, kalau tidak ada kembali ke data lama atau '--'
      finalEta = etaInput && etaInput.trim() !== "" && etaInput.trim() !== "AUTO ETA" ? etaInput : '--';
    }

    await getFleetSql()`
      UPDATE fleet_vessels 
      SET destination = ${destination}, 
          status = ${status}, 
          status_color = ${statusColor}, 
          eta = ${finalEta}, 
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
