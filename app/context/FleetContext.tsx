"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface DbVessel {
  id: string;
  status: string;
  progress_pct?: number;
}

interface FleetContextType {
  vesselEnergy: Record<string, number>;
  initializeFleet: (vessels: DbVessel[]) => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export function FleetProvider({ children }: { children: React.ReactNode }) {
  const [vesselEnergy, setVesselEnergy] = useState<Record<string, number>>({});
  const [vesselsRef, setVesselsRef] = useState<DbVessel[]>([]);

  // Fungsi untuk mendaftarkan database vessels ke global state jika belum ada
  const initializeFleet = (vessels: DbVessel[]) => {
    setVesselsRef(vessels);
    setVesselEnergy((prev) => {
      // Jika sudah terisi, jangan timpa lagi agar tidak ke-reset
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

  return (
    <FleetContext.Provider value={{ vesselEnergy, initializeFleet }}>
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) throw new Error("useFleet must be used within a FleetProvider");
  return context;
}
