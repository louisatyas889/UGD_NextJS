"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// Tipe kapal maintenance yang dibagikan secara global ke seluruh komponen client
export interface MaintenanceVessel {
  id: string;
  destination: string;
  status: string;
  eta: string;
  monitoring_icon: string;
}

interface MaintenanceContextType {
  vessels: MaintenanceVessel[];
  loading: boolean;
  refresh: () => Promise<void>;
  // Optimistic remove: hilangkan kapal dari list sebelum server selesai (UX cepat)
  removeVesselLocally: (id: string) => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [vessels, setVessels] = useState<MaintenanceVessel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/maintenance-vessels", { cache: "no-store" });
      const json = await res.json();
      if (json?.success && Array.isArray(json.vessels)) {
        setVessels(json.vessels);
      } else {
        setVessels([]);
      }
    } catch (err) {
      console.error("[MaintenanceContext] fetch failed:", err);
      setVessels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeVesselLocally = useCallback((id: string) => {
    setVessels((prev) => prev.filter((v) => v.id !== id));
  }, []);

  // Fetch pertama kali saat mount + auto-refresh setiap 5 detik (polling)
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <MaintenanceContext.Provider value={{ vessels, loading, refresh, removeVesselLocally }}>
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const ctx = useContext(MaintenanceContext);
  if (!ctx) throw new Error("useMaintenance must be used within a MaintenanceProvider");
  return ctx;
}
