export const users = [
  {
    id: "Louisa-2909",
    key: "2909",
    name: "Admin Operator",
  },
  {
    id: "Della-2888",
    key: "2888",
    name: "Standard User",
  }
];

export const dummyAdmins = [
  {
    id: "Louisa-Admin",
    key: "0909",
    name: "Louisa",
    role: "SYS-ADMIN",
    status: "Active",
    avatar: "L"
  },
  {
    id: "Della-Admin",
    key: "8888",
    name: "Della",
    role: "FLEET-MANAGER",
    status: "Active",
    avatar: "D"
  }
];

export const vessels = [
  { id: "PL-992-BUMI", dest: "Port of Rotterdam (NLD)", status: "EN ROUTE", statusColor: "#22d3ee", eta: "24 OCT 14:00", etaColor: "#e5e7eb", mon: "chart" },
  { id: "PL-441-BULAN", dest: "Singapore Harbor (SGP)", status: "IN PORT", statusColor: "#6b7280", eta: "DOCKED", etaColor: "#e5e7eb", mon: "anchor" },
  { id: "PL-770-ORION", dest: "Suez Canal (EGY)", status: "DELAYED", statusColor: "#f87171", eta: "RECALCULATING", etaColor: "#f87171", mon: "warn" },
  { id: "PL-102-MARS", dest: "Dry Dock 4 (HKG)", status: "MAINTENANCE", statusColor: "#a855f7", eta: "30 OCT 08:00", etaColor: "#e5e7eb", mon: "wrench" },
  { id: "PL-505-VENUS", dest: "Port of Tanjung Priok (IDN)", status: "EN ROUTE", statusColor: "#22d3ee", eta: "26 OCT 09:00", etaColor: "#e5e7eb", mon: "chart" },
];

export const alerts = [
  { type: "WEATHER WARNING", tc: "#f87171", time: "10:45 UTC", body: "Tropical Cyclone Alert: Region IV-B. Reroute mandatory for vessels in sector 7." },
  { type: "ENGINE ISSUE", tc: "#f59e0b", time: "09:12 UTC", body: "Vessel PL-992-ALPHA: P04- Engine Temp High. Cooling system bypass initiated." },
  { type: "SECURITY ALERT", tc: "#f87171", time: "08:30 UTC", body: "Unauthorized drone activity detected near sector 12. Increase surveillance." },
];

export const fuel = [
  { c: "#f472b6", h: 52, l: "MERCURIUS" }, { c: "#a78bfa", h: 70, l: "ORION" }, { c: "#f472b6", h: 45, l: "SATURNUS" },
  { c: "#22d3ee", h: 88, l: "MARS" }, { c: "#22d3ee", h: 95, l: "JUPITER" }, { c: "#a78bfa", h: 65, l: "BUMI" }, { c: "#f472b6", h: 60, l: "BULAN" },
];

// Data tambahan untuk Page Analytics/Map nantinya
export const telemetry = {
  signal: "98.4%",
  activeVessels: 42,
  totalDistance: "1.2M NM",
  weatherStatus: "WARNING"
};

// lib/placeholder-data.ts

export const sizes = ["SMALL", "MEDIUM", "LARGE"];

export const vessels4 = [
  { id: "PL-0909-MERKURIUS", sub: "KM Merkurius", dest: "Singapura", status: "EN ROUTE", pct: 78 },
  { id: "PL-123-BULAN", sub: "KM Bulan", dest: "Malaysia", status: "IN PORT", pct: 45 },
  { id: "PL-230-NANA", sub: "KM Nana", dest: "Thailand", status: "EN ROUTE", pct: 65 },
  { id: "PL-234-NARS", sub: "KM Nars", dest: "Filipina", status: "DELAYED", pct: 30 },
  { id: "PL-245-MARS", sub: "KM Mars", dest: "China", status: "MAINTENANCE", pct: 12 },
  { id: "PL-901-JUPITER", sub: "KM Jupiter", dest: "Jepang", status: "EN ROUTE", pct: 82 },
  { id: "PL-808-SATURNUS", sub: "KM Saturnus", dest: "Korea Selatan", status: "HOME PORT", pct: 0 }
];

export const packages = [
  { id: "PKG-100293", size: "MEDIUM", dest: "Japan (HND)" },
  { id: "PKG-100412", size: "MEDIUM", dest: "Germany (FRA)" },
  { id: "PKG-100881", size: "SMALL", dest: "USA (JFK)" },
  { id: "PKG-100994", size: "LARGE", dest: "UK (LHR)" },
  { id: "PKG-101221", size: "MEDIUM", dest: "Brazil (GRU)" },
  { id: "PKG-101552", size: "MEDIUM", dest: "Norway (OSL)" },
  { id: "PKG-200112", size: "SMALL", dest: "Korea (ICN)" },
  { id: "PKG-300441", size: "LARGE", dest: "Australia (SYD)" },
  { id: "PKG-400998", size: "SMALL", dest: "Canada (YYZ)" },
  { id: "PKG-500662", size: "MEDIUM", dest: "France (CDG)" }
];

export const fleetPersonnel = [
  {
    id: "SS-001",
    name: "Captain Elias Thorne",
    workShift: "MORNING",
    jobTitle: "Commanding Officer",
    startHour: 6,
    endHour: 14,
    workingHours: "06:00 - 14:00",
    assignedVessel: "PL-0909-MERKURIUS"
  },
  {
    id: "SS-042",
    name: "Sarah Jenkins",
    workShift: "NIGHT",
    jobTitle: "Chief Engineer",
    startHour: 22,
    endHour: 6,
    workingHours: "22:00 - 06:00",
    assignedVessel: "PL-123-BULAN"
  },
  {
    id: "SS-109",
    name: "Marcus Vane",
    workShift: "SWING",
    jobTitle: "Navigation Specialist",
    startHour: 14,
    endHour: 22,
    workingHours: "14:00 - 22:00",
    assignedVessel: "PL-230-NANA"
  },
  {
    id: "SS-114",
    name: "Aisha Karim",
    workShift: "MORNING",
    jobTitle: "Cargo Operations Lead",
    startHour: 7,
    endHour: 15,
    workingHours: "07:00 - 15:00",
    assignedVessel: "PL-234-NARS"
  },
  {
    id: "SS-127",
    name: "Kenji Sato",
    workShift: "SWING",
    jobTitle: "Route Analyst",
    startHour: 13,
    endHour: 21,
    workingHours: "13:00 - 21:00",
    assignedVessel: "PL-245-MARS"
  },
  {
    id: "SS-132",
    name: "Helena Costa",
    workShift: "NIGHT",
    jobTitle: "Security Supervisor",
    startHour: 21,
    endHour: 5,
    workingHours: "21:00 - 05:00",
    assignedVessel: "PL-901-JUPITER"
  },
  {
    id: "SS-149",
    name: "Rafael Moreau",
    workShift: "MORNING",
    jobTitle: "Maintenance Chief",
    startHour: 5,
    endHour: 13,
    workingHours: "05:00 - 13:00",
    assignedVessel: "PL-808-SATURNUS"
  }
];

// Di placeholder-data.ts
export const customers = []; 
export const invoices = [];
export const revenue = [];

// Tambahkan koordinat ke data packages yang sudah ada
export const TrakingPackages = [
  { id: "PKG-100293", size: "MEDIUM", dest: "Japan (HND)", lat: 35.6762, lng: 139.6503, vesselName: "PL-901-JUPITER" },
  { id: "PKG-100412", size: "MEDIUM", dest: "Germany (FRA)", lat: 50.1109, lng: 8.6821, vesselName: "PL-230-NANA" },
  { id: "PKG-200112", size: "SMALL", dest: "Korea (ICN)", lat: 37.5665, lng: 126.9780, vesselName: "PL-808-SATURNUS" },
  { id: "PKG-300441", size: "LARGE", dest: "Australia (SYD)", lat: -33.8688, lng: 151.2093, vesselName: "PL-123-BULAN" },
];
