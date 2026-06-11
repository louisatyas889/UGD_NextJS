import DashboardClient from "./DashboardClient";
import { fetchVesselData, fetchFleetAlerts, fetchTrackingPackages } from "../lib/data";

export const revalidate = 0;

export default async function DashboardPage() {
  // Ambil data asli dari tabel database lewat fungsi lib
  const vesselsData = await fetchVesselData();
  const alertsData = await fetchFleetAlerts();
  const packagesData = await fetchTrackingPackages();
  
  // 1. Kartu & Fleet Info Counter
  const initialCards = {
    numberOfInvoices: vesselsData?.length || 0,
    totalPaidInvoices: `${alertsData?.length || 0} Alerts`
  };

  // 2. Pemetaan Alerts -> Menjadi System Logs di UI Bawaan (Sebelum simulator berjalan)
  const initialLogs = (alertsData || []).map(al => ({
    id: al.vessel_id || "",
    type: al.type,
    time: al.log_time,
    body: al.body,
    tc: al.title_color || '#f59e0b' 
  }));

  // 3. Pemetaan Vessels -> Menyesuaikan dengan tipe data DB dan mengirim progress_pct ke Context
  const initialVessels = (vesselsData || []).map(v => {
    // Hitung perkiraan awal fuel level menggunakan rumus charCode bawaan Anda
    const charCodeSum = v.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const mockFuelLevel = 40 + (charCodeSum % 55); 

    return {
      id: v.id,
      dest: v.destination,          
      status: v.status,
      statusColor: v.status_color,   
      eta: v.eta,
      etaColor: v.eta_color,         
      mon: v.monitoring_icon,        
      current_lat: v.current_lat,
      current_lng: v.current_lng,
      region: v.region,
      progress_pct: mockFuelLevel // Menggunakan rumus aman, terhindar dari error v.progress
    };
  });

  // 4. Pemetaan Vessels -> Dijadikan data telemetri awal grafik batang ENERGY CORE
  const initialFuel = initialVessels.slice(0, 6).map((v, index) => {
    return {
      h: v.progress_pct, 
      c: v.statusColor || (index % 2 === 0 ? '#22d3ee' : '#a855f7'), 
      l: v.id 
    };
  });

  // Fallback jika database kosong melompong
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
