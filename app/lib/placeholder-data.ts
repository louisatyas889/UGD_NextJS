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
  { id: "V-902 STELLAR", sub: "XJ-902-25", dest: "Reykjavik, ISL", status: "IN TRANSIT", pct: 78 },
  { id: "V-902 AQUILA", sub: "XJ-902-66", dest: "Reykjavik, ISL", status: "IN TRANSIT", pct: 65 },
  { id: "V-441 BULAN", sub: "XJ-441-MOON", dest: "Singapore, SGP", status: "DELAYED", pct: 45 },
  { id: "V-771 ORION", sub: "XJ-771-86", dest: "Rotterdam, NLD", status: "APPROACHING", pct: 96 },
  { id: "V-105 MARS", sub: "XJ-105-X", dest: "Dubai, ARE", status: "LOADING", pct: 12 },
  { id: "V-992 BUMI", sub: "PL-992-B", dest: "Tokyo, JPN", status: "STORM", pct: 60 },
  { id: "V-202 VENUS", sub: "XJ-202-01", dest: "Oslo, NOR", status: "IN TRANSIT", pct: 33 },
  { id: "V-303 SATURN", sub: "XJ-303-99", dest: "Sydney, AUS", status: "DEPARTING", pct: 5 },
  { id: "V-412 NEPTUNE", sub: "XJ-412-31", dest: "Singapore, SGP", status: "IN TRANSIT", pct: 42 },
  { id: "V-118 TITAN", sub: "XJ-118-24", dest: "Dubai, ARE", status: "DEPARTURE PHASE", pct: 16 },
  { id: "V-551 PLUTO", sub: "XJ-551-07", dest: "Cape Town, ZAF", status: "IN TRANSIT", pct: 88 },
  { id: "V-882 JUPITER", sub: "XJ-882-12", dest: "Shanghai, CHN", status: "IN TRANSIT", pct: 50 }
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
    assignedVessel: "V-902 AQUILA"
  },
  {
    id: "SS-042",
    name: "Sarah Jenkins",
    workShift: "NIGHT",
    jobTitle: "Chief Engineer",
    startHour: 22,
    endHour: 6, // Selesai pagi hari
    workingHours: "22:00 - 06:00",
    assignedVessel: "V-902 AQUILA"
  },
  {
    id: "SS-109",
    name: "Marcus Vane",
    workShift: "SWING",
    jobTitle: "Navigation Specialist",
    startHour: 14,
    endHour: 22,
    workingHours: "14:00 - 22:00",
    assignedVessel: "V-902 AQUILA"
  },
  {
    id: "SS-114",
    name: "Aisha Karim",
    workShift: "MORNING",
    jobTitle: "Cargo Operations Lead",
    startHour: 7,
    endHour: 15,
    workingHours: "07:00 - 15:00",
    assignedVessel: "V-992 BUMI"
  },
  {
    id: "SS-127",
    name: "Kenji Sato",
    workShift: "SWING",
    jobTitle: "Route Analyst",
    startHour: 13,
    endHour: 21,
    workingHours: "13:00 - 21:00",
    assignedVessel: "V-771 ORION"
  },
  {
    id: "SS-132",
    name: "Helena Costa",
    workShift: "NIGHT",
    jobTitle: "Security Supervisor",
    startHour: 21,
    endHour: 5,
    workingHours: "21:00 - 05:00",
    assignedVessel: "V-441 BULAN"
  },
  {
    id: "SS-149",
    name: "Rafael Moreau",
    workShift: "MORNING",
    jobTitle: "Maintenance Chief",
    startHour: 5,
    endHour: 13,
    workingHours: "05:00 - 13:00",
    assignedVessel: "V-105 MARS"
  },
  {
    id: "SS-156",
    name: "Nadia Petrov",
    workShift: "SWING",
    jobTitle: "Medical Officer",
    startHour: 12,
    endHour: 20,
    workingHours: "12:00 - 20:00",
    assignedVessel: "V-118 TITAN"
  },
  {
    id: "SS-173",
    name: "Thomas Blake",
    workShift: "NIGHT",
    jobTitle: "Communications Officer",
    startHour: 20,
    endHour: 4,
    workingHours: "20:00 - 04:00",
    assignedVessel: "V-551 PLUTO"
  }
];

// Di placeholder-data.ts
export const customers = []; 
export const invoices = [];
export const revenue = [];

// Tambahkan koordinat ke data packages yang sudah ada
export const TrakingPackages = [
  { id: "PKG-100293", size: "MEDIUM", dest: "Japan (HND)", lat: 35.6762, lng: 139.6503, vesselName: "V-992 BUMI" },
  { id: "PKG-100412", size: "MEDIUM", dest: "Germany (FRA)", lat: 50.1109, lng: 8.6821, vesselName: "V-771 ORION" },
  { id: "PKG-200112", size: "SMALL", dest: "Korea (ICN)", lat: 37.5665, lng: 126.9780, vesselName: "V-441 BULAN" },
  { id: "PKG-300441", size: "LARGE", dest: "Australia (SYD)", lat: -33.8688, lng: 151.2093, vesselName: "V-303 SATURN" },
];
