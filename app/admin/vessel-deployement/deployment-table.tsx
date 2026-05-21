'use client';

import { Orbitron } from "next/font/google";
import { useDeferredValue, useEffect, useState } from "react";
import { filterItemsByQuery, paginateItems } from "../../lib/data-controls";
import DataPaginationBar from "../../ui/data-pagination-bar";
import DataSearchInput from "../../ui/data-search-input";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

type DeploymentRow = {
  destination: string;
  eta: string;
  identifier: string;
  status: "ACTIVE" | "DELAYED" | "EN ROUTE";
  sublabel: string;
};

const statusStyles = {
  ACTIVE:
    "border-cyan-400/25 bg-cyan-400/10 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.16)]",
  DELAYED:
    "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-200 shadow-[0_0_14px_rgba(217,70,239,0.16)]",
  "EN ROUTE":
    "border-violet-400/25 bg-violet-500/10 text-violet-200 shadow-[0_0_14px_rgba(139,92,246,0.16)]",
} as const;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatusBadge({ status }: { status: DeploymentRow["status"] }) {
  return (
    <span
      className={cn(
        orbitron.className,
        "inline-flex rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.18em]",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}

type DeploymentTableProps = {
  deployments: DeploymentRow[];
};

export default function DeploymentTable({
  deployments,
}: DeploymentTableProps) {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredQuery]);

  const filteredDeployments = filterItemsByQuery(deployments, deferredQuery, [
    (deployment) => deployment.identifier,
    (deployment) => deployment.destination,
    (deployment) => deployment.eta,
    (deployment) => deployment.status,
    (deployment) => deployment.sublabel,
  ]);

  const paginatedDeployments = paginateItems(filteredDeployments, currentPage, 4);

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-4 border-b border-white/6 pb-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-sm text-slate-400">
            Real-time manifest for the latest deployment wave.
          </p>
          <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
            {filteredDeployments.length} MATCHING ROUTES
          </span>
        </div>

        <DataSearchInput
          ariaLabel="Search deployment routes"
          onChange={setQuery}
          placeholder="Search vessel, node, or status..."
          value={query}
        />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] table-auto">
          <thead>
            <tr className="border-b border-white/6 text-left">
              {[
                "Vessel Identifier",
                "Destination Node",
                "ETA (UTC)",
                "Status",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-4 text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500 first:pl-0 last:pr-0"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedDeployments.items.length === 0 ? (
              <tr>
                <td
                  className="px-0 py-8 text-center text-sm uppercase tracking-[0.2em] text-slate-500"
                  colSpan={4}
                >
                  No deployments match the current search.
                </td>
              </tr>
            ) : (
              paginatedDeployments.items.map((deployment) => (
                <tr
                  key={deployment.identifier}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-5 align-top first:pl-0">
                    <div className="flex flex-col gap-1.5">
                      <span
                        className={cn(
                          orbitron.className,
                          "text-base tracking-[0.04em] text-white",
                        )}
                      >
                        {deployment.identifier}
                      </span>
                      <span className="text-sm text-slate-500">
                        {deployment.sublabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-base text-slate-200">
                    {deployment.destination}
                  </td>
                  <td className="px-4 py-5">
                    <span className="rounded-[4px] border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
                      {deployment.eta}
                    </span>
                  </td>
                  <td className="px-4 py-5 pr-0">
                    <StatusBadge status={deployment.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DataPaginationBar
        accentColor="#22d3ee"
        currentPage={paginatedDeployments.currentPage}
        itemLabel="routes"
        onPageChange={setCurrentPage}
        totalItems={paginatedDeployments.totalItems}
        totalPages={paginatedDeployments.totalPages}
        visibleEnd={paginatedDeployments.endIndex}
        visibleStart={
          paginatedDeployments.totalItems === 0
            ? 0
            : paginatedDeployments.startIndex + 1
        }
      />
    </div>
  );
}
