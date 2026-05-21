'use client';

import { useDeferredValue, useEffect, useState } from "react";
import { filterItemsByQuery, paginateItems } from "../../lib/data-controls";
import DataPaginationBar from "../../ui/data-pagination-bar";
import DataSearchInput from "../../ui/data-search-input";

type StaffMember = {
  location: string;
  name: string;
  role: string;
};

type SecurityLog = {
  actor: string;
  color: string;
  id: number;
  location: string;
  message: string;
  severity: string;
  time: string;
};

const staffMembers: StaffMember[] = [
  { name: "Captain Elias Thorne", role: "ROOT", location: "BRIDGE" },
  { name: "Sarah Jenkins", role: "SECURE", location: "ENGINE ROOM" },
  { name: "Marcus Vane", role: "SECURE", location: "DECK 04" },
  { name: "Li Wei", role: "GUEST", location: "CARGO BAY" },
  { name: "Dr. Julian Ross", role: "SECURE", location: "MED-BAY" },
];

const initialLogs: SecurityLog[] = [
  {
    id: 1,
    time: "14:22:01",
    actor: "Captain Elias Thorne",
    location: "BRIDGE",
    severity: "ROOT",
    message: "Root access granted to primary command console.",
    color: "#22c55e",
  },
  {
    id: 2,
    time: "12:15:44",
    actor: "Unknown Source",
    location: "REMOTE NODE",
    severity: "ALERT",
    message: "Failed login attempt from IP 104.22.1.9.",
    color: "#f87171",
  },
  {
    id: 3,
    time: "11:48:19",
    actor: "Sarah Jenkins",
    location: "ENGINE ROOM",
    severity: "SECURE",
    message: "Engine room diagnostics package synchronized.",
    color: "#22d3ee",
  },
  {
    id: 4,
    time: "10:31:02",
    actor: "Marcus Vane",
    location: "DECK 04",
    severity: "SECURE",
    message: "Manual session refresh approved for deck navigation hub.",
    color: "#22d3ee",
  },
  {
    id: 5,
    time: "09:52:10",
    actor: "Dr. Julian Ross",
    location: "MED-BAY",
    severity: "SECURE",
    message: "Medical storage locker re-authenticated.",
    color: "#a855f7",
  },
  {
    id: 6,
    time: "08:41:33",
    actor: "Li Wei",
    location: "CARGO BAY",
    severity: "GUEST",
    message: "Guest terminal moved into restricted review mode.",
    color: "#f59e0b",
  },
];

export default function SecurityAccountsWorkspace() {
  const [activeLogs, setActiveLogs] = useState(initialLogs);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomStaff =
        staffMembers[Math.floor(Math.random() * staffMembers.length)];
      const now = new Date().toLocaleTimeString("en-GB");

      const newLog: SecurityLog = {
        id: Date.now(),
        time: now,
        actor: randomStaff.name,
        location: randomStaff.location,
        severity: randomStaff.role,
        message: `${randomStaff.name} accessed system from ${randomStaff.location}.`,
        color: randomStaff.role === "ROOT" ? "#22c55e" : "#22d3ee",
      };

      setActiveLogs((currentLogs) => [newLog, ...currentLogs].slice(0, 18));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredQuery]);

  const filteredLogs = filterItemsByQuery(activeLogs, deferredQuery, [
    (log) => log.time,
    (log) => log.actor,
    (log) => log.location,
    (log) => log.severity,
    (log) => log.message,
  ]);

  const paginatedLogs = paginateItems(filteredLogs, currentPage, 5);

  return (
    <div className="layout-sec">
      <div
        className="panel"
        style={{
          minHeight: "600px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <h3
            style={{
              fontSize: "12px",
              fontFamily: "Share Tech Mono",
              color: "#a855f7",
            }}
          >
            REMOTE SESSION MANAGEMENT
          </h3>
          <span style={{ fontSize: "10px", color: "#22d3ee" }}>
            LIVE TELEMETRY
          </span>
        </div>

        <DataSearchInput
          ariaLabel="Search security logs"
          onChange={setQuery}
          placeholder="Search actor, location, or event..."
          value={query}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "110px 1fr 100px",
            gap: "12px",
            paddingBottom: "10px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            fontSize: "9px",
            color: "#6b7280",
            fontFamily: "Share Tech Mono",
            letterSpacing: "0.16em",
          }}
        >
          <span>TIME</span>
          <span>ACTIVITY</span>
          <span>LEVEL</span>
        </div>

        <div style={{ flex: 1, overflow: "hidden" }}>
          {paginatedLogs.items.length === 0 ? (
            <div
              style={{
                color: "#6b7280",
                fontFamily: "Share Tech Mono",
                fontSize: "10px",
                letterSpacing: "0.16em",
                padding: "24px 0",
              }}
            >
              NO SECURITY EVENTS MATCH THIS SEARCH.
            </div>
          ) : (
            paginatedLogs.items.map((log) => (
              <div
                key={log.id}
                className="log-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "110px 1fr 100px",
                  alignItems: "start",
                }}
              >
                <span
                  style={{
                    color: log.color,
                    fontFamily: "Share Tech Mono",
                    fontSize: "11px",
                  }}
                >
                  [{log.time}]
                </span>
                <div>
                  <div style={{ color: "#e5e7eb", fontSize: "12px" }}>
                    {log.message}
                  </div>
                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: "10px",
                      marginTop: "6px",
                      fontFamily: "Share Tech Mono",
                    }}
                  >
                    {log.actor} / {log.location}
                  </div>
                </div>
                <span
                  style={{
                    justifySelf: "end",
                    color: log.color,
                    border: `1px solid ${log.color}`,
                    borderRadius: "999px",
                    padding: "4px 8px",
                    fontFamily: "Share Tech Mono",
                    fontSize: "9px",
                  }}
                >
                  {log.severity}
                </span>
              </div>
            ))
          )}
        </div>

        <DataPaginationBar
          accentColor="#22d3ee"
          currentPage={paginatedLogs.currentPage}
          itemLabel="logs"
          mutedColor="#6b7280"
          onPageChange={setCurrentPage}
          totalItems={paginatedLogs.totalItems}
          totalPages={paginatedLogs.totalPages}
          visibleEnd={paginatedLogs.endIndex}
          visibleStart={
            paginatedLogs.totalItems === 0 ? 0 : paginatedLogs.startIndex + 1
          }
        />

        <button
          style={{
            background: "none",
            border: "1px dashed #ef4444",
            color: "#ef4444",
            padding: "10px",
            fontSize: "10px",
            width: "100%",
          }}
          type="button"
        >
          TERMINATE ALL SESSIONS
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div className="panel">
          <h3
            style={{
              fontSize: "14px",
              marginBottom: "15px",
              fontFamily: "Share Tech Mono",
            }}
          >
            CREDENTIAL CONTROL
          </h3>
          <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "20px" }}>
            Update administrative access tokens and authorization protocols.
          </p>

          <label style={{ fontSize: "9px", color: "#4b5563" }}>USER NAME</label>
          <input className="inp-cyber" defaultValue="Elias Thorne" />

          <label style={{ fontSize: "9px", color: "#4b5563" }}>JOB TITLE</label>
          <input className="inp-cyber" defaultValue="Captain Commander" />

          <label style={{ fontSize: "9px", color: "#4b5563" }}>
            NEW PASSWORD
          </label>
          <input
            className="inp-cyber"
            placeholder="••••••••••••"
            type="password"
          />

          <div
            style={{
              background: "rgba(168,85,247,0.1)",
              padding: "15px",
              border: "1px solid #a855f7",
              marginBottom: "20px",
            }}
          >
            <p style={{ fontSize: "10px", color: "#a855f7", marginBottom: "10px" }}>
              AUTHORIZING CHANGES
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              {["S", "I", "G", "N"].map((letter) => (
                <div
                  key={letter}
                  style={{
                    width: "30px",
                    height: "30px",
                    border: "1px solid #22d3ee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#22d3ee",
                  }}
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>

          <button className="btn-override" type="button">
            EXECUTE OVERRIDE
          </button>
        </div>
      </div>
    </div>
  );
}
