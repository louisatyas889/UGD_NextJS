'use client';

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { generatePagination } from "../lib/utils";

type DataPaginationBarProps = {
  accentColor?: string;
  currentPage: number;
  itemLabel: string;
  mutedColor?: string;
  onPageChange: (page: number) => void;
  totalItems: number;
  totalPages: number;
  visibleEnd: number;
  visibleStart: number;
};

function paginationButtonStyle(
  active: boolean,
  accentColor: string,
  mutedColor: string,
) {
  return {
    minWidth: "34px",
    height: "34px",
    borderRadius: "999px",
    border: active
      ? `1px solid ${accentColor}`
      : "1px solid rgba(255,255,255,0.08)",
    background: active ? `${accentColor}1a` : "rgba(255,255,255,0.03)",
    color: active ? accentColor : mutedColor,
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: "10px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    padding: "0 10px",
  } as const;
}

export default function DataPaginationBar({
  accentColor = "#22d3ee",
  currentPage,
  itemLabel,
  mutedColor = "#94a3b8",
  onPageChange,
  totalItems,
  totalPages,
  visibleEnd,
  visibleStart,
}: DataPaginationBarProps) {
  const pages = generatePagination(currentPage, totalPages);
  const summary =
    totalItems === 0
      ? `0 ${itemLabel}`
      : `${visibleStart}-${visibleEnd} of ${totalItems} ${itemLabel}`;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        marginTop: "18px",
      }}
    >
      <span
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.12em",
          color: mutedColor,
          textTransform: "uppercase",
        }}
      >
        {summary}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          aria-label="Go to previous page"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={paginationButtonStyle(false, accentColor, mutedColor)}
          type="button"
        >
          <ChevronLeftIcon style={{ width: "14px", height: "14px" }} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {pages.map((page, index) =>
            typeof page === "string" ? (
              <span
                key={`ellipsis-${index}`}
                style={{
                  color: mutedColor,
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "10px",
                }}
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                style={paginationButtonStyle(
                  currentPage === page,
                  accentColor,
                  mutedColor,
                )}
                type="button"
              >
                {page}
              </button>
            ),
          )}
        </div>

        <button
          aria-label="Go to next page"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={paginationButtonStyle(false, accentColor, mutedColor)}
          type="button"
        >
          <ChevronRightIcon style={{ width: "14px", height: "14px" }} />
        </button>
      </div>
    </div>
  );
}
