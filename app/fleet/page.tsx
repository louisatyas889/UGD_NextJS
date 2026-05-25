import { fetchVesselData } from "../lib/data";
import FleetPageClient from "./fleet-page-client";

export const revalidate = 0; // Memastikan data dari Neon selalu fresh di setiap request

export default async function FleetPage() {
  // 1. Ambil data asli dari database Neon melalui Server Side
  const vesselsFromDb = await fetchVesselData();

  // 2. Petakan kolom Neon ke properti UI dengan menambahkan tipe : any agar tidak merah
  const initialVessels = (vesselsFromDb || []).map((v: any) => {
    const lowerStatus = v.status?.toLowerCase() || "";
    let statusClass = "maint";
    
    if (lowerStatus.includes("en route") || lowerStatus.includes("en_route")) statusClass = "enroute";
    else if (lowerStatus.includes("delay")) statusClass = "delayed";
    else if (lowerStatus.includes("port") || lowerStatus.includes("docked") || lowerStatus.includes("in port")) statusClass = "inport";

    return {
      id: v.id,
      // Fallback bersilangan jika di skema database tertulis 'destination' atau 'dest'
      dest: v.destination || v.dest || "UNKNOWN HUB", 
      status: v.status || "MAINTENANCE",
      st: statusClass,
      eta: v.eta || "--",
      // Mengamankan fallback monitoring icon saat update/create data baru
      mon: v.monitoring_icon || v.mon || "chart",
    };
  });

  // 3. Oper data database langsung ke dalam UI Client Component
  return <FleetPageClient dbVessels={initialVessels} />;
}
