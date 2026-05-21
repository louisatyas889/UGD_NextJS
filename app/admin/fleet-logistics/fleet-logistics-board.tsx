'use client';

import { useDeferredValue, useEffect, useState } from "react";
import { filterItemsByQuery, paginateItems } from "../../lib/data-controls";
import { packages, sizes, vessels4 } from "../../lib/placeholder-data";
import DataPaginationBar from "../../ui/data-pagination-bar";
import DataSearchInput from "../../ui/data-search-input";

export default function FleetLogisticsBoard() {
  const [activeSize, setActiveSize] = useState("MEDIUM");
  const [vesselQuery, setVesselQuery] = useState("");
  const [packageQuery, setPackageQuery] = useState("");
  const [vesselPage, setVesselPage] = useState(1);
  const [packagePage, setPackagePage] = useState(1);
  const deferredVesselQuery = useDeferredValue(vesselQuery);
  const deferredPackageQuery = useDeferredValue(packageQuery);

  useEffect(() => {
    setVesselPage(1);
  }, [deferredVesselQuery]);

  useEffect(() => {
    setPackagePage(1);
  }, [activeSize, deferredPackageQuery]);

  const filteredVessels = filterItemsByQuery(vessels4, deferredVesselQuery, [
    (vessel) => vessel.id,
    (vessel) => vessel.sub,
    (vessel) => vessel.dest,
    (vessel) => vessel.status,
  ]);

  const filteredPackages = filterItemsByQuery(
    packages.filter((item) => item.size === activeSize),
    deferredPackageQuery,
    [(item) => item.id, (item) => item.size, (item) => item.dest],
  );

  const paginatedVessels = paginateItems(filteredVessels, vesselPage, 5);
  const paginatedPackages = paginateItems(filteredPackages, packagePage, 4);

  return (
    <div className="layout">
      <div className="left-panel">
        <div style={{ padding: "16px 20px 0" }}>
          <DataSearchInput
            ariaLabel="Search vessels"
            onChange={setVesselQuery}
            placeholder="Search vessel, route, or destination..."
            value={vesselQuery}
          />
        </div>

        <table style={{ marginTop: "16px" }}>
          <thead>
            <tr>
              <th>VESSEL ID & NAME</th>
              <th>DESTINATION</th>
              <th>DELIVERY PROGRESS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedVessels.items.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    color: "#6b7280",
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "10px",
                    letterSpacing: "0.16em",
                    padding: "28px 18px",
                  }}
                >
                  NO ACTIVE VESSELS MATCH THIS SEARCH.
                </td>
              </tr>
            ) : (
              paginatedVessels.items.map((vessel) => (
                <tr key={vessel.id}>
                  <td>
                    <span className="vid3">{vessel.id}</span>
                    <span className="vsub">{vessel.sub}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: "'Rajdhani',sans-serif",
                        fontSize: 12,
                        color: "#d1d5db",
                      }}
                    >
                      {vessel.dest}
                    </span>
                  </td>
                  <td>
                    <div className="prog-wrap">
                      <span className="prog-status">{vessel.status}</span>
                      <div className="prog-track">
                        <div
                          className="prog-fill"
                          style={{ width: `${vessel.pct}%` }}
                        />
                      </div>
                      <span className="prog-pct">{vessel.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={{ padding: "0 20px 20px" }}>
          <DataPaginationBar
            accentColor="#a855f7"
            currentPage={paginatedVessels.currentPage}
            itemLabel="vessels"
            mutedColor="#6b7280"
            onPageChange={setVesselPage}
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

      <div className="right-panel">
        <div className="size-tabs">
          {sizes.map((size) => (
            <button
              key={size}
              className={`stab ${activeSize === size ? "active" : ""}`}
              onClick={() => setActiveSize(size)}
              type="button"
            >
              {size}
            </button>
          ))}
        </div>

        <div className="pkg-header">
          <div>
            <span className="pkg-title">PACKAGE OVERVIEW</span>
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 9,
                color: "#6b7280",
                marginTop: 4,
              }}
            >
              {filteredPackages.length} MATCHING SEGMENTS
            </div>
          </div>
          <svg
            fill="none"
            height="14"
            stroke="#6b7280"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="14"
          >
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="8" x2="20" y1="12" y2="12" />
            <line x1="12" x2="20" y1="18" y2="18" />
          </svg>
        </div>

        <div style={{ padding: "16px 20px 0" }}>
          <DataSearchInput
            ariaLabel="Search package segments"
            onChange={setPackageQuery}
            placeholder="Search package ID or destination..."
            value={packageQuery}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <table style={{ marginTop: "14px" }}>
            <thead>
              <tr>
                <th style={{ fontSize: "7px", padding: "8px 16px" }}>ITEM ID</th>
                <th style={{ fontSize: "7px", padding: "8px 16px" }}>SIZE</th>
                <th style={{ fontSize: "7px", padding: "8px 16px" }}>
                  DESTINATION
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedPackages.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      color: "#6b7280",
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "10px",
                      letterSpacing: "0.16em",
                      padding: "24px 16px",
                    }}
                  >
                    NO SEGMENTS MATCH THE ACTIVE FILTER.
                  </td>
                </tr>
              ) : (
                paginatedPackages.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: "10px 16px" }}>
                      <span className="pkg-id">{item.id}</span>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <div className="size-badge">
                        <div className="size-icon" />
                        {item.size}
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span
                        style={{
                          fontFamily: "'Rajdhani',sans-serif",
                          fontSize: 12,
                          color: "#9ca3af",
                        }}
                      >
                        {item.dest}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "0 20px 14px" }}>
          <DataPaginationBar
            accentColor="#22d3ee"
            currentPage={paginatedPackages.currentPage}
            itemLabel="segments"
            mutedColor="#6b7280"
            onPageChange={setPackagePage}
            totalItems={paginatedPackages.totalItems}
            totalPages={paginatedPackages.totalPages}
            visibleEnd={paginatedPackages.endIndex}
            visibleStart={
              paginatedPackages.totalItems === 0
                ? 0
                : paginatedPackages.startIndex + 1
            }
          />
        </div>

        <div className="view-all">VIEW ALL SEGMENTS</div>

        <div className="health-section">
          <div className="health-title">OPERATIONAL HEALTH</div>
          <div className="health-row">
            <span className="hk">Bandwidth Efficiency</span>
            <span className="hv">98.2%</span>
          </div>
          <div className="health-row">
            <span className="hk">Signal Integrity</span>
            <span className="hv">Normal</span>
          </div>
          <div className="health-row" style={{ marginBottom: 0 }}>
            <span className="hk">Last Sync</span>
            <span className="hv" style={{ color: "#4b5563" }}>
              0.02s ago
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
