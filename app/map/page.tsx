import { fetchVesselData } from "../lib/data";
import MapPageClient from "./map-page-client";

export const revalidate = 0; // Memastikan data koordinat selalu real-time

export default async function MapPage() {
  // 1. Ambil data asli kapal dari database Neon
  const vesselsFromDb = await fetchVesselData();

  // 2. Petakan kolom database agar sesuai dengan kebutuhan peta komponen client
  const initialVessels = (vesselsFromDb || []).map((v: any, index: number) => {
    
    // Gunakan status_color langsung dari Neon yang sudah kita perbaiki di actions.ts
    // Jika data lama belum ada warnanya, baru kita fallback ke logic pencocokan warna string
    const lowerStatus = v.status?.toLowerCase() || "";
    let statusColor = v.status_color;
    
    if (!statusColor) {
      if (lowerStatus.includes("en route") || lowerStatus.includes("enroute")) {
        statusColor = "#22d3ee"; // Cyan
      } else if (lowerStatus.includes("delay") || lowerStatus.includes("delayed")) {
        statusColor = "#f87171"; // Red
      } else if (lowerStatus.includes("port") || lowerStatus.includes("docked") || lowerStatus.includes("inport")) {
        statusColor = "#10b981"; // Green
      } else {
        statusColor = "#a855f7"; // Default purple (maint)
      }
    }

    return {
      id: v.id || `UNKNOWN-${index}`,
      
      // PENTING: Set ke 0 agar mengaktifkan fitur pencarian otomatis berbasis teks negara/hub di Client Component
      lat: 0, 
      lng: 0,
      
      speed: v.speed || "21.4 Knots",
      fuel: v.fuel || "84%",
      diag: v.status?.toUpperCase() === "MAINTENANCE" ? "UNDER REPAIR" : "NO ISSUES",
      signal: v.signal || "98%",
      weather: v.weather || "OPTIMAL",
      color: statusColor,
      region: v.destination || "UNKNOWN REGION", // Menggunakan kolom destination sebagai penggerak utama Geo-Router
    };
  });

  // 3. Oper data dari Neon langsung ke Client Component Peta
  return <MapPageClient dbVessels={initialVessels} />;
}
