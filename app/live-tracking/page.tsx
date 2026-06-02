import type { Metadata } from "next";
import { fetchVesselData } from "../lib/data";
import LiveTrackingPage from "./LiveTrackingPage";

export const metadata: Metadata = {
  title: "Live Tracking | Serena Sail",
  description: "Sistem pelacakan real-time koordinat armada Serena Sail berdasarkan database Neon.",
};

export const revalidate = 0; // Memastikan data real-time selalu fresh dari Neon DB

const BANGKA_BELITUNG_COORD: [number, number] = [-2.1000, 106.1333];

// Fungsi pembantu pemetaan koordinat negara tujuan berdasarkan string database
function getDestCoords(dest: string): [number, number] {
  const d = dest.toUpperCase().trim();
  if (d.includes("SG") || d.includes("SINGAPORE")) return [1.3521, 103.8198];
  if (d.includes("PH") || d.includes("PHILIPPINES")) return [14.5995, 120.9842];
  if (d.includes("TH") || d.includes("THAILAND")) return [15.8700, 100.9925];
  if (d.includes("CN") || d.includes("CHINA") || d.includes("SHANGHAI")) return [31.2304, 121.4737];
  if (d.includes("JP") || d.includes("JAPAN") || d.includes("TOKYO")) return [35.6762, 139.6503];
  if (d.includes("KR") || d.includes("KOREA") || d.includes("SEOUL")) return [37.5665, 126.9780];
  return [1.3521, 103.8198]; // Default jika tidak dikenal dialihkan ke Singapore
}

export default async function LiveTrackingServerPage() {
  // Ambil data asli terupdate dari Neon Database
  const vesselsFromDb = await fetchVesselData() || [];

  // Hilangkan duplikasi data kapal berdasarkan ID uniknya
  const uniqueVessels = vesselsFromDb.filter((vessel, index, self) =>
    index === self.findIndex((t) => t.id === vessel.id)
  );

  // Transformasi data untuk kebutuhan Live Tracking Peta Pintar
  const parsedVessels = uniqueVessels.map((v: any) => {
    const statusUpper = (v.status || "").toUpperCase().trim();
    const destCoords = getDestCoords(v.destination || v.dest || "SG");

    // 1. SINKRONISASI WARNA UTAMA BERDASARKAN STATUS OPERASIONAL SYSTEM
    let finalColor = "#22d3ee"; // Default: Cyan (EN ROUTE / UNDERWAY)
    if (statusUpper.includes("MAINTENANCE")) {
      finalColor = "#f472b6"; // Pink
    } else if (statusUpper.includes("DELAY")) {
      finalColor = "#f87171"; // Merah
    } else if (statusUpper.includes("PORT") || statusUpper.includes("DOCKED")) {
      finalColor = "#a855f7"; // Ungu Neon
    }

    // 2. ATUR ATURAN LOGIKA POSISI BULATAN (MARKER) KAPAL BERDASARKAN SIKLUS
    let currentLat = BANGKA_BELITUNG_COORD[0];
    let currentLng = BANGKA_BELITUNG_COORD[1];

    if (statusUpper === "IN PORT" || statusUpper === "DOCKED") {
      // Jika IN PORT, bulatan melompat ke negara tujuan pembeli
      currentLat = destCoords[0];
      currentLng = destCoords[1];
    } else {
      // Jika EN ROUTE, DELAY, MAINTENANCE, atau HOME PORT -> Berada di Bangka Belitung Indonesia
      currentLat = BANGKA_BELITUNG_COORD[0];
      currentLng = BANGKA_BELITUNG_COORD[1];
    }

    // Generate telemetry pendukung berdasarkan keunikan ID string secara aman
    const charCodeSum = v.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const mockFuel = 45 + (charCodeSum % 50);

    return {
      id: v.id,
      status: v.status || "EN ROUTE",
      coordinates: `${currentLat.toFixed(4)}° N, ${currentLng.toFixed(4)}° E`,
      lat: currentLat,
      lng: currentLng,
      speed: v.speed || "21.7 Knots",
      fuel: mockFuel,
      signal: "TERHUBUNG (SAT-AI LINK OMNI)",
      eta: v.eta || "--",
      wind: (11.2 + (charCodeSum % 10)).toFixed(1),
      wave: (0.8 + (charCodeSum % 4) * 0.4).toFixed(1),
      load: `${65 + (charCodeSum % 30)}%`,
      color: finalColor,
      destination: v.destination || v.dest || "SINGAPORE",
      route: [BANGKA_BELITUNG_COORD, destCoords] as [number, number][],
      destLat: destCoords[0],
      destLng: destCoords[1]
    };
  });

  return <LiveTrackingPage vessels={parsedVessels} />;
}
