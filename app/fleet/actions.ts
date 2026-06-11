"use server";

import { revalidatePath } from "next/cache";
import { getSql } from "@/app/lib/db";

function getFleetSql() {
  return getSql();
}

function getVesselColors(status: string) {
  const lowerStatus = status.toLowerCase().trim();
  
  let statusColor = "#a855f7";
  let etaColor = "#e5e7eb";

  if (lowerStatus.includes("en route") || lowerStatus === "en route") {
    statusColor = "#22d3ee";
  } else if (lowerStatus.includes("delay") || lowerStatus.includes("delayed")) {
    statusColor = "#f87171";
    etaColor = "#f87171";
  } else if (lowerStatus.includes("port") || lowerStatus.includes("in port") || lowerStatus.includes("docked")) {
    statusColor = "#6b7280";
  }

  return { statusColor, etaColor };
}

// 1. CREATE
export async function createVessel(formData: FormData) {
  const id = (formData.get("id") as string)?.toUpperCase();
  const destination = formData.get("destination") as string;
  const status = (formData.get("status") as string) || "MAINTENANCE";
  const etaInput = formData.get("eta") as string;
  const monitoring_icon = formData.get("monitoring_icon") as string || 'chart';

  if (!id || !destination) return { success: false, error: "ID dan Tujuan wajib diisi" };

  const { statusColor, etaColor } = getVesselColors(status);

  const generateAutoEta = () => {
    const arrival = new Date();
    const randomHours = Math.floor(Math.random() * 8) + 4;
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
    revalidatePath("/admin/user-management");
    revalidatePath("/admin/cargo-management");
    return { success: true };
  } catch (err) {
    console.error("Error at createVessel:", err);
    return { success: false, error: "Gagal menyimpan data ke database." };
  }
}

// 2. UPDATE
export async function updateVessel(formData: FormData) {
  const id = formData.get("id") as string;
  const destination = formData.get("destination") as string;
  const status = (formData.get("status") as string) || "MAINTENANCE";
  const etaInput = formData.get("eta") as string;
  const monitoring_icon = formData.get("monitoring_icon") as string || 'chart';

  if (!id) return { success: false, error: "ID kapal tidak ditemukan." };

  const { statusColor, etaColor } = getVesselColors(status);

  const generateAutoEta = () => {
    const arrival = new Date();
    const randomHours = Math.floor(Math.random() * 8) + 4;
    arrival.setHours(arrival.getHours() + randomHours);
    return arrival.toLocaleDateString("id-ID", { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    }).toUpperCase();
  };

  try {
    let finalEta;
    if (status.toLowerCase().includes("en route")) {
      if (!etaInput || etaInput.trim() === "" || etaInput.trim() === "--" || etaInput.trim() === "AUTO ETA") {
        finalEta = generateAutoEta();
      } else {
        finalEta = etaInput;
      }
    } else {
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
    revalidatePath("/admin/user-management");
    revalidatePath("/admin/cargo-management");
    return { success: true };
  } catch (err) {
    console.error("Error at updateVessel:", err);
    return { success: false, error: "Gagal memperbarui data di database." };
  }
}

// 3. DELETE
export async function deleteVessel(id: string) {
  if (!id) return { success: false, error: "ID tidak valid." };

  try {
    await getFleetSql()`DELETE FROM fleet_vessels WHERE id = ${id}`;
    revalidatePath("/fleet");
    revalidatePath("/map");
    revalidatePath("/admin/user-management");
    revalidatePath("/admin/cargo-management");
    return { success: true };
  } catch (err) {
    console.error("Error at deleteVessel:", err);
    return { success: false, error: "Gagal menghapus data kapal." };
  }
}
