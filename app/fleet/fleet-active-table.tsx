'use client';

import { useDeferredValue, useEffect, useState } from "react";
import { filterItemsByQuery, paginateItems } from "../lib/data-controls";
import DataPaginationBar from "../ui/data-pagination-bar";
import DataSearchInput from "../ui/data-search-input";

const vessels = [
  {
    id: "PL-992-BUMI",
    dest: "Singapore Hub",
    status: "EN ROUTE",
    st: "enroute",
    eta: "14:28:00",
    mon: "chart",
  },
  {
    id: "PL-441-BULAN",
    dest: "Port of Rotterdam",
    status: "DELAYED",
    st: "delayed",
    eta: "UNKNOWN",
    mon: "warn",
  },
  {
    id: "PL-770-ORION",
    dest: "Busan Terminal",
    status: "IN PORT",
    st: "inport",
    eta: "--",
    mon: "anchor",
  },
  {
    id: "PL-105-MARS",
    dest: "Dry Dock C",
    status: "MAINTENANCE",
    st: "maint",
    eta: "--",
    mon: "wrench",
  },
];

function MonIcon({ t }: { t: string }) {
  if (t === "chart") {
    return (
      <svg
        fill="none"
        height="16"
        stroke="#4b5563"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="16"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    );
  }

  if (t === "anchor") {
    return (
      <svg
        fill="none"
        height="16"
        stroke="#4b5563"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="16"
      >
        <circle cx="12" cy="5" r="3" />
        <line x1="12" x2="12" y1="8" y2="22" />
        <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
      </svg>
    );
  }

  if (t === "warn") {
    return (
      <svg
        fill="none"
        height="16"
        stroke="#4b5563"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="16"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" x2="12" y1="9" y2="13" />
        <line x1="12" x2="12.01" y1="17" y2="17" />
      </svg>
    );
  }

  return (
    <svg
      fill="none"
      height="16"
      stroke="#4b5563"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

export default function FleetActiveTable() {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredQuery]);

  const filteredVessels = filterItemsByQuery(vessels, deferredQuery, [
    (vessel) => vessel.id,
    (vessel) => vessel.dest,
    (vessel) => vessel.status,
  ]);

  const paginatedVessels = paginateItems(filteredVessels, currentPage, 3);

  return (
    <div className="panel-v2">
      <div className="panel-label">ARMADA AKTIF</div>
      <div
        className="table-header-ctrl"
        style={{ justifyContent: "space-between", flexWrap: "wrap" }}
      >
        <DataSearchInput
          ariaLabel="Search vessel records"
          onChange={setQuery}
          placeholder="Search vessel..."
          value={query}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <span
            style={{
              fontSize: 9,
              color: "#22d3ee",
              border: "1px solid #22d3ee",
              padding: "2px 8px",
              borderRadius: 10,
            }}
          >
            LIVE_STREAM
          </span>
          <span style={{ fontSize: 9, color: "#4b5563" }}>
            {filteredVessels.length} MATCHING VESSELS
          </span>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>ID KAPAL</th>
              <th>TUJUAN</th>
              <th>STATUS</th>
              <th>ETA</th>
              <th>MONITORING</th>
            </tr>
          </thead>
          <tbody>
            {paginatedVessels.items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    color: "#4b5563",
                    fontFamily: "'Share Tech Mono', monospace",
                    letterSpacing: "0.12em",
                    padding: "28px 10px",
                  }}
                >
                  NO VESSELS FOUND FOR THE CURRENT SEARCH.
                </td>
              </tr>
            ) : (
              paginatedVessels.items.map((vessel) => (
                <tr key={vessel.id}>
                  <td style={{ textAlign: "left" }}>
                    <span className="v-id">{vessel.id}</span>
                  </td>
                  <td>
                    <div className="v-dest">{vessel.dest}</div>
                  </td>
                  <td>
                    <span className={`pill ${vessel.st}`}>{vessel.status}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: "'Share Tech Mono'",
                        fontSize: 13,
                        color: vessel.eta === "UNKNOWN" ? "#f87171" : "#fff",
                      }}
                    >
                      {vessel.eta}
                    </span>
                  </td>
                  <td>
                    <MonIcon t={vessel.mon} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <DataPaginationBar
          accentColor="#22d3ee"
          currentPage={paginatedVessels.currentPage}
          itemLabel="vessels"
          mutedColor="#4b5563"
          onPageChange={setCurrentPage}
          totalItems={paginatedVessels.totalItems}
          totalPages={paginatedVessels.totalPages}
          visibleEnd={paginatedVessels.endIndex}
          visibleStart={
            paginatedVessels.totalItems === 0
              ? 0
              : paginatedVessels.startIndex + 1
          }
        />
      </div>
    </div>
  );
}
