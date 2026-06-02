"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export interface DbVessel {
  id: string;
  status: string;
  progress_pct?: number;
}

export interface FleetAlert {
  id: string;
  type: string;
  body: string;
  tc: string; // Tone/Accent Color (misal: #f43f5e atau #f59e0b)
}

interface FleetContextType {
  vesselEnergy: Record<string, number>;
  alerts: FleetAlert[];
  addAlert: (alert: FleetAlert) => void;
  initializeFleet: (vessels: DbVessel[]) => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export function FleetProvider({ children }: { children: React.ReactNode }) {
  const [vesselEnergy, setVesselEnergy] = useState<Record<string, number>>({});
  const [alerts, setAlerts] = useState<FleetAlert[]>([]);
  const [vesselsRef, setVesselsRef] = useState<DbVessel[]>([]);
  
  // Ref untuk menghindari penambahan alert duplikat secara berulang
  const triggeredAlertsRef = useRef<Record<string, boolean>>({});

  const addAlert = (alert: FleetAlert) => {
    setAlerts((prev) => {
      // Cek apakah bodi alert sudah ada agar tidak duplikat di list
      if (prev.some((a) => a.id === alert.id && a.type === alert.type)) return prev;
      return [alert, ...prev].slice(0, 10); // Batasi maksimal 10 alert terbaru
    });
  };

  const initializeFleet = (vessels: DbVessel[]) => {
    setVesselsRef(vessels);
    setVesselEnergy((prev) => {
      if (Object.keys(prev).length > 0) return prev;

      const initialEnergies: Record<string, number> = {};
      vessels.forEach((v) => {
        initialEnergies[v.id] = v.progress_pct !== undefined ? v.progress_pct : 100;
      });
      return initialEnergies;
    });
  };

  // 🚀 ENGINE SIMULATOR RUNNING GLOBAL BACKGROUND LISTENER
  useEffect(() => {
    if (vesselsRef.length === 0) return;

    const drainInterval = setInterval(() => {
      setVesselEnergy((prevEnergies) => {
        const updated = { ...prevEnergies };

        vesselsRef.forEach((v) => {
          const s = v.status?.toLowerCase() || "";
          const isEnRoute = s.includes("route") || s.includes("transit") || s.includes("depart") || s.includes("storm") || s.includes("approach");

          const currentEng = updated[v.id] !== undefined ? updated[v.id] : (v.progress_pct !== undefined ? v.progress_pct : 100);

          if (isEnRoute) {
            const drainRate = Math.random() > 0.4 ? 1 : 0;
            updated[v.id] = Math.max(currentEng - drainRate, 5);
          } else {
            if (currentEng < 100) {
              updated[v.id] = Math.min(currentEng + 1, 100);
            } else {
              updated[v.id] = 100;
            }
          }
        });

        return updated;
      });
    }, 3000);

    return () => clearInterval(drainInterval);
  }, [vesselsRef]);

  // 🚨 AUTOMATIC CRITICAL ENERGY MONITOR
  // Otomatis menembakkan alert ke dashboard jika ada kapal menyentuh batas kritis
  useEffect(() => {
    Object.entries(vesselEnergy).forEach(([id, energy]) => {
      if (energy <= 20 && !triggeredAlertsRef.current[`${id}-low`]) {
        addAlert({
          id,
          type: "CRITICAL FUEL OVERRIDE",
          body: `Vessel ${id} Core Energy dropped to ${energy}%. Operating efficiency compromised.`,
          tc: "#f43f5e",
        });
        triggeredAlertsRef.current[`${id}-low`] = true;
      } else if (energy > 20 && triggeredAlertsRef.current[`${id}-low`]) {
        // Reset status alert jika kapal sudah diisi ulang energinya
        delete triggeredAlertsRef.current[`${id}-low`];
      }
    });
  }, [vesselEnergy]);

  return (
    <FleetContext.Provider value={{ vesselEnergy, alerts, addAlert, initializeFleet }}>
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) throw new Error("useFleet must be used within a FleetProvider");
  return context;
}
