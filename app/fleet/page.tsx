import type { Metadata } from "next";
import { fetchVesselData } from "../lib/data";
import FleetPageClient from "./fleet-page-client";

export const metadata: Metadata = {
  title: "Fleet | Serena Sail",
  description: "Halaman fleet menampilkan status dan detail armada dalam tampilan operasional.",
};

export const revalidate = 0; // Memastikan data dari Neon selalu fresh di setiap request

export default async function FleetPage() {
  // 1. Ambil data asli dari database Neon melalui Server Side
  const vesselsFromDb = await fetchVesselData();

  // 2. Petakan kolom Neon ke properti UI dengan menambahkan tipe : any agar tidak merah
  const initialVessels = (vesselsFromDb || []).map((v: any) => {
    const lowerStatus = v.status?.toLowerCase() || "";
    
    // Tentukan kode warna HEX asli untuk kebutuhan render Grafik Bar di Client Panel
    let hexColor = "#f472b6"; // Default maintenance (Pink)
    if (lowerStatus.includes("en route") || lowerStatus.includes("en_route")) {
      hexColor = "#22d3ee"; // Cyan
    } else if (lowerStatus.includes("delay")) {
      hexColor = "#f87171"; // Merah
    } else if (lowerStatus.includes("port") || lowerStatus.includes("docked") || lowerStatus.includes("in port")) {
      hexColor = "#9ca3af"; // Abu-abu
    }

    return {
      id: v.id,
      // Fallback bersilangan jika di skema database tertulis 'destination' atau 'dest'
      dest: v.destination || v.dest || "UNKNOWN HUB", 
      status: v.status || "MAINTENANCE",
      st: hexColor, // Sekarang berisi kode warna HEX asli (#22d3ee, dll) untuk menyalakan grafik!
      eta: v.eta || "--",
      // Mengamankan fallback monitoring icon saat update/create data baru
      mon: v.monitoring_icon || v.mon || "chart",
      // Ambil properti subtitle dari Neon DB agar nama/serial teks tidak hilang
      subtitle: v.subtitle || "",
      // 🌟 TAMBAHAN FIX SINKRONISASI: Ambil persentase murni dari kolom database progress_pct
      progress: Number(v.progress_pct) || 0 
    };
  });

  // 3. Oper data database langsung ke dalam UI Client Component
  return <FleetPageClient dbVessels={initialVessels} />;
}
