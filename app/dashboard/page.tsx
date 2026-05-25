import DashboardClient from "./DashboardClient";
import { fetchVesselData, fetchFleetAlerts, fetchTrackingPackages } from "../lib/data";
import { redirect } from "next/navigation";
// import { auth } from "@/auth"; // <-- Sesuaikan dengan library auth yang kamu pakai (NextAuth/Clerk/dll)

export const revalidate = 0;

export default async function DashboardPage() {
  // 1. TAMBAHKAN CEK LOGIN DI SINI (Jika nanti sudah pasang auth)
  // const session = await auth();
  // if (!session) {
  //   redirect('/login'); // Jika belum login, tendang balik ke halaman login/web awal
  // }

  // Ambil data asli dari tabel database lewat fungsi lib
  const vesselsData = await fetchVesselData();
  const alertsData = await fetchFleetAlerts();
  const packagesData = await fetchTrackingPackages();
  
  // 1. Kartu & Fleet Info Counter
  const initialCards = {
    numberOfInvoices: vesselsData?.length || 0, // Menggunakan jumlah kapal nyata
    totalPaidInvoices: `${alertsData?.length || 0} Alerts`
  };

  // 2. Pemetaan Alerts -> Menjadi System Logs di UI
  const initialLogs = (alertsData || []).map(al => ({
    type: al.type,
    time: al.log_time,
    body: al.body,
    tc: al.title_color || '#f59e0b' // Warna teks dinamis dari database
  }));

  // 3. Pemetaan Vessels -> Masuk ke Tabel Utama Fleet Overview
  const initialVessels = (vesselsData || []).map(v => ({
    id: v.id,
    dest: v.destination,
    status: v.status,
    statusColor: v.status_color,
    eta: v.eta,
    etaColor: v.eta_color,
    mon: v.monitoring_icon
  }));

  // 4. Pemetaan Vessels -> Dijadikan data telemetri grafik batang ENERGY CORE
  // Diambil maksimal 6 data teratas agar muat pas secara estetika grid komponen kamu
  const initialFuel = (vesselsData || []).slice(0, 6).map((v, index) => {
    // Membuat kalkulasi persentase tinggi bar yang aman (40% - 95%) berdasarkan kode unik ID Kapal
    const charCodeSum = v.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const mockFuelLevel = 40 + (charCodeSum % 55); 

    return {
      h: mockFuelLevel, // Mengisi level tinggi bar energi
      c: index % 2 === 0 ? '#22d3ee' : '#a855f7', // Skema warna khas neon cyan / purple milikmu
      l: v.id // Mengubah label paket beralih total menjadi ID Kapal nyata (misal: PL-441-BULAN)
    };
  });

  // Jika database kosong melompong, berikan fallback data planet agar grafik batangnya tidak hilang
  if (initialFuel.length === 0) {
    initialFuel.push(
      { h: 75, c: '#a855f7', l: 'MERCURIUS' },
      { h: 45, c: '#22d3ee', l: 'ORION' },
      { h: 90, c: '#a855f7', l: 'SATURNUS' },
      { h: 60, c: '#22d3ee', l: 'MARS' }
    );
  }

  return (
    <DashboardClient 
      initialCards={initialCards} 
      initialLogs={initialLogs} 
      initialFuel={initialFuel}
      initialVessels={initialVessels}
    />
  );
}
