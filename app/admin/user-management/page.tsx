"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import SereneSailTopbar from "../../ui/SereneSailTopbar";
import SuspensePanelLoader from "../../ui/suspense-panel-loader";

const UserManagementTable = lazy(() => import("./user-management-table"));

export default function UserManagementPage() {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentHour(new Date().getHours()),
      60000,
    );

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0c",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <SereneSailTopbar />

      <main style={{ padding: "40px" }}>
        <header style={{ marginBottom: "32px" }}>
          <p
            style={{
              fontSize: "10px",
              fontFamily: "monospace",
              color: "#6b7280",
              letterSpacing: "0.2em",
            }}
          >
            FLEET PERSONNEL COMMAND
          </p>
          <h1 style={{ fontSize: "30px", fontWeight: "bold", marginTop: "4px" }}>
            User Management
          </h1>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          {[
            { label: "CREW", value: "142" },
            { label: "ON DECK", value: "38", status: "online" },
            { label: "SHIFT OVERLAP", value: "12 HRS" },
            { label: "SECURITY STATUS", value: "Normal", color: "#4ade80" },
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "#111114",
                border: "1px solid rgba(255,255,255,0.05)",
                padding: "24px",
              }}
            >
              <p
                style={{
                  fontSize: "9px",
                  fontFamily: "monospace",
                  color: "#6b7280",
                  marginBottom: "8px",
                }}
              >
                {stat.label}
              </p>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {stat.status === "online" && (
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "#4ade80",
                      boxShadow: "0 0 8px #4ade80",
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: "600",
                    color: stat.color || "white",
                  }}
                >
                  {stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Suspense
          fallback={
            <SuspensePanelLoader
              rows={4}
              title="Loading personnel records..."
            />
          }
        >
          <UserManagementTable currentHour={currentHour} />
        </Suspense>
      </main>

      <footer
        style={{
          position: "fixed",
          bottom: 0,
          width: "100%",
          backgroundColor: "#050508",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "8px 24px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "9px",
          color: "#4b5563",
          fontFamily: "monospace",
        }}
      >
        <div>SYSTEM HEALTH: NOMINAL | CONNECTIVITY: ACTIVE</div>
        <div>LAT: 24.1200 N LONG: 80.1234 W</div>
      </footer>
    </div>
  );
}
