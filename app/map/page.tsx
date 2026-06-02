import type { Metadata } from "next";
import { fetchVesselData } from "../lib/data";
import MapPageClient from "./map-page-client";

export const metadata: Metadata = {
  title: "Map | Serena Sail",
  description: "Tampilan peta interaktif armada untuk memantau posisi kapal dan kondisi rute.",
};

export const revalidate = 0; 

export default async function MapPage() {
  // Ambil data mentah dari database Neon
  const vesselsFromDb = await fetchVesselData() || [];

  // 1. Hilangkan duplikasi kapal menggunakan metode filter yang aman
  const uniqueVesselsMap = vesselsFromDb.filter((vessel, index, self) =>
    index === self.findIndex((t) => t.id === vessel.id)
  );

  // 2. Mapping data yang bersih untuk dikirim ke MapPageClient
  const initialVessels = uniqueVesselsMap.map((v: any, index: number) => {
    const lowerStatus = (v.status || "").toLowerCase().trim();

    // --- SINKRONISASI WARNA UTAMA BERDASARKAN STATUS (SINKRON DENGAN SISTEM FLEET SEBELUMNYA) ---
    let finalColor = "#22d3ee"; // Default: Cyan (EN ROUTE / UNDERWAY / AKTIF)
    let diagnosticsStatus = "NO ISSUES";

    if (lowerStatus.includes("maintenance") || lowerStatus === "mainted") {
      finalColor = "#f472b6";        // Pink / Merah Muda untuk Maintenance
      diagnosticsStatus = "UNDER REPAIR";
    } else if (lowerStatus.includes("delay")) {
      finalColor = "#f87171";        // Merah Terang untuk Delay 🚨
      diagnosticsStatus = "WEATHER DELAY";
    } else if (
      lowerStatus.includes("port") || 
      lowerStatus.includes("docked") || 
      lowerStatus === "active" || 
      lowerStatus === "aktif"
    ) {
      finalColor = "#a855f7";        // Ungu Neon untuk In Port / Home Port / Docked
    }

    return {
      id: String(v.id || `UNKNOWN-${index}`),
      speed: v.speed || "21.4 Knots",
      fuel: v.fuel || "84%",
      diag: diagnosticsStatus, 
      signal: v.signal || "98%",
      weather: lowerStatus.includes("delay") ? "BAD WEATHER" : "OPTIMAL",
      color: finalColor,             
      region: String(v.region || v.destination || "SG"), 

      subtitle: String(v.subtitle || v.id || "Cargo Vessel"),
      destination: String(v.destination || "UNKNOWN"),
      status: String(v.status || "UNKNOWN"),
      status_color: finalColor,      
      eta: String(v.eta || "N/A"),
      eta_color: String(v.eta_color || "#ffffff"),
      monitoring_icon: String(v.monitoring_icon || "chart"),
      progress_pct: Number(v.progress_pct) || 0,
    };
  });

  return <MapPageClient dbVessels={initialVessels as any} />;
}
