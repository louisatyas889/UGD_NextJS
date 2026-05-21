'use client';

import { useDeferredValue, useEffect, useState } from "react";
import { filterItemsByQuery, paginateItems } from "../../lib/data-controls";
import { fleetPersonnel } from "../../lib/placeholder-data";
import DataPaginationBar from "../../ui/data-pagination-bar";
import DataSearchInput from "../../ui/data-search-input";

type UserManagementTableProps = {
  currentHour: number;
};

function checkStatus(currentHour: number, start: number, end: number) {
  if (start < end) {
    return currentHour >= start && currentHour < end;
  }

  return currentHour >= start || currentHour < end;
}

export default function UserManagementTable({
  currentHour,
}: UserManagementTableProps) {
  const [selectedCrew, setSelectedCrew] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredQuery]);

  useEffect(() => {
    setSelectedCrew(null);
  }, [currentPage, deferredQuery]);

  const filteredCrew = filterItemsByQuery(fleetPersonnel, deferredQuery, [
    (crew) => crew.id,
    (crew) => crew.name,
    (crew) => crew.workShift,
    (crew) => crew.jobTitle,
    (crew) => crew.assignedVessel,
  ]);

  const paginatedCrew = paginateItems(filteredCrew, currentPage, 4);

  return (
    <div
      style={{
        backgroundColor: "#0d0d10",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "2px",
        padding: "20px 20px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "10px",
              fontFamily: "monospace",
              color: "#6b7280",
              letterSpacing: "0.2em",
              marginBottom: "6px",
            }}
          >
            PERSONNEL DIRECTORY
          </p>
          <p style={{ fontSize: "13px", color: "#9ca3af" }}>
            Search crew records and review active assignments.
          </p>
        </div>

        <DataSearchInput
          ariaLabel="Search personnel records"
          onChange={setQuery}
          placeholder="Search by user, role, shift, or vessel..."
          value={query}
        />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            textAlign: "left",
          }}
        >
          <thead>
            <tr
              style={{
                color: "#6b7280",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                fontFamily: "monospace",
                fontSize: "10px",
              }}
            >
              <th style={{ padding: "16px 24px" }}>USER ID</th>
              <th style={{ padding: "16px 24px" }}>NAME</th>
              <th style={{ padding: "16px 24px" }}>STATUS</th>
              <th style={{ padding: "16px 24px" }}>WORK SHIFT</th>
              <th style={{ padding: "16px 24px" }}>JOB TITLE</th>
              <th style={{ padding: "16px 24px" }}>ASSIGNED VESSEL</th>
              <th style={{ padding: "16px 24px", textAlign: "right" }}>
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedCrew.items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "28px 24px",
                    textAlign: "center",
                    color: "#6b7280",
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                  }}
                >
                  NO CREW MATCHES THE CURRENT SEARCH.
                </td>
              </tr>
            ) : (
              paginatedCrew.items.map((crew) => {
                const isOnDuty = checkStatus(
                  currentHour,
                  crew.startHour,
                  crew.endHour,
                );

                return (
                  <tr
                    key={crew.id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <td
                      style={{
                        padding: "16px 24px",
                        color: "#9ca3af",
                        fontFamily: "monospace",
                      }}
                    >
                      {crew.id}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(255,255,255,0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {crew.name
                          .split(" ")
                          .map((segment) => segment[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: "500" }}>{crew.name}</span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: isOnDuty ? "#4ade80" : "#ef4444",
                            boxShadow: isOnDuty ? "0 0 8px #4ade80" : "none",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "10px",
                            color: isOnDuty ? "#4ade80" : "#ef4444",
                          }}
                        >
                          {isOnDuty ? "ON SITE" : "RESTING"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span
                        style={{
                          fontSize: "9px",
                          padding: "2px 6px",
                          borderRadius: "2px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color:
                            crew.workShift === "NIGHT"
                              ? "#a855f7"
                              : crew.workShift === "SWING"
                                ? "#fbbf24"
                                : "#60a5fa",
                        }}
                      >
                        {crew.workShift}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#9ca3af" }}>
                      {crew.jobTitle}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        color: "#22d3ee",
                        fontFamily: "monospace",
                      }}
                    >
                      {crew.assignedVessel}
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        textAlign: "right",
                        position: "relative",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <button
                        aria-expanded={selectedCrew === crew.id}
                        aria-label={`Toggle actions for ${crew.name}`}
                        onClick={() =>
                          setSelectedCrew(selectedCrew === crew.id ? null : crew.id)
                        }
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#e5e7eb",
                          cursor: "pointer",
                          fontSize: "16px",
                          lineHeight: 1,
                        }}
                        type="button"
                      >
                        ...
                      </button>
                      {selectedCrew === crew.id && (
                        <div
                          style={{
                            position: "absolute",
                            right: "60px",
                            top: "0",
                            zIndex: 50,
                            width: "200px",
                            backgroundColor: "#16161a",
                            border: "1px solid #22d3ee",
                            padding: "15px",
                            textAlign: "left",
                          }}
                        >
                          <p style={{ fontSize: "8px", color: "#6b7280" }}>
                            ASSIGNED VESSEL
                          </p>
                          <p
                            style={{
                              fontSize: "10px",
                              color: "#22d3ee",
                              fontWeight: "bold",
                            }}
                          >
                            {crew.assignedVessel}
                          </p>
                          <p
                            style={{
                              fontSize: "8px",
                              color: "#6b7280",
                              marginTop: "10px",
                            }}
                          >
                            WORKING HOURS
                          </p>
                          <p style={{ fontSize: "10px", color: "white" }}>
                            {crew.workingHours}
                          </p>
                          <button
                            style={{
                              marginTop: "10px",
                              width: "100%",
                              backgroundColor: "white",
                              color: "black",
                              fontWeight: "bold",
                              fontSize: "10px",
                              padding: "5px",
                              border: "none",
                            }}
                            type="button"
                          >
                            SAVE
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <DataPaginationBar
        accentColor="#22d3ee"
        currentPage={paginatedCrew.currentPage}
        itemLabel="crew"
        onPageChange={setCurrentPage}
        totalItems={paginatedCrew.totalItems}
        totalPages={paginatedCrew.totalPages}
        visibleEnd={paginatedCrew.endIndex}
        visibleStart={
          paginatedCrew.totalItems === 0 ? 0 : paginatedCrew.startIndex + 1
        }
      />
    </div>
  );
}
