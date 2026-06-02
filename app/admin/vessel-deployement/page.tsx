import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Orbitron, Rajdhani } from "next/font/google";
import { lazy, Suspense } from "react";
import PrimeTopbar from "../../ui/PrimeTopbar";
import SuspensePanelLoader from "../../ui/suspense-panel-loader";

export const metadata: Metadata = {
  title: "Vessel Deployment | Serena Sail",
  description: "Halaman penempatan kapal dan manajemen jadwal deployment armada.",
};

const DeploymentTable = lazy(() => import("./deployment-table"));

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const summaryCards = [
  {
    label: "En Route",
    value: "42",
    unit: "vessels",
    detail: "Optimal route sync",
    tone: "cyan",
  },
  {
    label: "In Port",
    value: "18",
    unit: "vessels",
    detail: "Docked across 6 hubs",
    tone: "neutral",
  },
  {
    label: "Delayed",
    value: "03",
    unit: "critical",
    detail: "Escalation required",
    tone: "magenta",
  },
  {
    label: "Maintenance",
    value: "07",
    unit: "units",
    detail: "Service window active",
    tone: "violet",
  },
] as const;

const deployments = [
  {
    identifier: "PL-902-BUMI",
    sublabel: "Polar lane / convoy batch 07",
    destination: "Titan Gateway Alpha",
    eta: "14:20:00",
    status: "ACTIVE",
  },
  {
    identifier: "VX-441-MOON",
    sublabel: "Cryogenic freight / line sector 3",
    destination: "European Ice Depot",
    eta: "16:45:12",
    status: "DELAYED",
  },
  {
    identifier: "DS-112-MARS",
    sublabel: "Orbital shuttle / synchronized transfer",
    destination: "Neo-Tokyo Orbital 3",
    eta: "21:05:40",
    status: "EN ROUTE",
  },
  {
    identifier: "AR-774-ATLAS",
    sublabel: "Deep sea container / secure manifest",
    destination: "Pacific Relay Sigma",
    eta: "22:14:09",
    status: "ACTIVE",
  },
  {
    identifier: "QN-205-NOVA",
    sublabel: "Medical priority / climate shielded",
    destination: "Arctic Health Terminal",
    eta: "23:52:31",
    status: "EN ROUTE",
  },
] as const;

const fuelMonitoring = [
  { day: "MON", value: 58, liters: "5.8k" },
  { day: "TUE", value: 74, liters: "7.4k" },
  { day: "WED", value: 52, liters: "5.2k" },
  { day: "THU", value: 88, liters: "8.8k" },
  { day: "FRI", value: 69, liters: "6.9k" },
  { day: "SAT", value: 46, liters: "4.6k" },
] as const;

const systemChips = ["SYNC ONLINE", "UTC +00:00", "SECURE LAYER"] as const;
const sectionTabs = [
  "Deployment Grid",
  "Fleet Nodes",
  "Signal Feed",
  "Security Layer",
] as const;

const summaryToneStyles = {
  cyan: {
    text: "text-cyan-300",
    glow: "shadow-[0_0_18px_rgba(34,211,238,0.16)]",
    border: "border-cyan-400/20",
    pill: "bg-cyan-400/10 text-cyan-200",
  },
  neutral: {
    text: "text-white",
    glow: "shadow-[0_0_18px_rgba(255,255,255,0.08)]",
    border: "border-white/10",
    pill: "bg-white/10 text-slate-100",
  },
  magenta: {
    text: "text-fuchsia-300",
    glow: "shadow-[0_0_18px_rgba(217,70,239,0.16)]",
    border: "border-fuchsia-400/20",
    pill: "bg-fuchsia-500/10 text-fuchsia-200",
  },
  violet: {
    text: "text-violet-300",
    glow: "shadow-[0_0_18px_rgba(139,92,246,0.16)]",
    border: "border-violet-400/20",
    pill: "bg-violet-500/10 text-violet-200",
  },
} as const;

const statusStyles = {
  ACTIVE:
    "border-cyan-400/25 bg-cyan-400/10 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.16)]",
  DELAYED:
    "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-200 shadow-[0_0_14px_rgba(217,70,239,0.16)]",
  "EN ROUTE":
    "border-violet-400/25 bg-violet-500/10 text-violet-200 shadow-[0_0_14px_rgba(139,92,246,0.16)]",
} as const;

type SummaryTone = keyof typeof summaryToneStyles;
type DeploymentStatus = keyof typeof statusStyles;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[6px] border border-white/8 bg-[#0f0f1a] shadow-[0_18px_40px_rgba(0,0,0,0.34)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="relative">{children}</div>
    </section>
  );
}

function SummaryCard({
  item,
}: {
  item: (typeof summaryCards)[number];
}) {
  const tone = summaryToneStyles[item.tone as SummaryTone];

  return (
    <Panel className={cn("p-5", tone.border)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={cn(
              orbitron.className,
              "text-[10px] uppercase tracking-[0.28em] text-slate-500",
            )}
          >
            {item.label}
          </p>
          <div className="mt-5 flex items-end gap-3">
            <span
              className={cn(
                orbitron.className,
                "text-4xl font-semibold leading-none sm:text-5xl",
                tone.text,
                tone.glow,
              )}
            >
              {item.value}
            </span>
            <span
              className={cn(
                rajdhani.className,
                "pb-1 text-sm font-medium uppercase tracking-[0.18em] text-slate-500",
              )}
            >
              {item.unit}
            </span>
          </div>
        </div>

        <div
          className={cn(
            "flex h-8 min-w-8 items-center justify-center rounded-[4px] border border-white/8 px-2 text-[9px] uppercase tracking-[0.18em]",
            orbitron.className,
            tone.pill,
          )}
        >
          Live
        </div>
      </div>

      <div className="mt-5 border-t border-white/6 pt-4 text-sm text-slate-400">
        {item.detail}
      </div>
    </Panel>
  );
}

function StatusBadge({ status }: { status: DeploymentStatus }) {
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

function FuelBar({
  day,
  value,
  liters,
}: (typeof fuelMonitoring)[number]) {
  return (
    <div className="flex flex-1 flex-col items-center justify-end gap-3">
      <span
        className={cn(
          orbitron.className,
          "text-[9px] uppercase tracking-[0.22em] text-cyan-200/80",
        )}
      >
        {liters}
      </span>
      <div className="flex h-56 w-full max-w-[58px] items-end border border-white/8 bg-white/[0.02] p-2">
        <div
          className="w-full bg-gradient-to-t from-cyan-500 via-cyan-400 to-sky-200 shadow-[0_0_18px_rgba(34,211,238,0.28)]"
          style={{ height: `${value}%` }}
        />
      </div>
      <span
        className={cn(
          orbitron.className,
          "text-[9px] uppercase tracking-[0.22em] text-slate-500",
        )}
      >
        {day}
      </span>
    </div>
  );
}

export default function VesselDeployementPage() {
  return (
    <>
      <PrimeTopbar />

      <main
        className={cn(
          rajdhani.className,
          "relative min-h-[calc(100vh-46px)] overflow-hidden bg-[#0a0a10] text-white",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "radial-gradient(circle at top left, rgba(34,211,238,0.08), transparent 24%), radial-gradient(circle at top right, rgba(168,85,247,0.10), transparent 22%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-5 border-b border-white/6 pb-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p
                className={cn(
                  orbitron.className,
                  "text-[10px] uppercase tracking-[0.34em] text-fuchsia-300/80",
                )}
              >
                Deployment Console
              </p>
              <h1
                className={cn(
                  orbitron.className,
                  "mt-3 text-3xl font-semibold tracking-[0.08em] text-white sm:text-4xl",
                )}
              >
                Vessel Deployment
              </h1>
              <p className="mt-3 max-w-3xl text-base text-slate-400 sm:text-lg">
                Coordinate strategic routes, monitor active departures, and
                review fleet readiness from the same dark operations grid.
              </p>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex flex-wrap gap-2">
                {systemChips.map((chip) => (
                  <span
                    key={chip}
                    className={cn(
                      orbitron.className,
                      "rounded-[4px] border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-300",
                    )}
                  >
                    {chip}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {sectionTabs.map((item, index) => (
                  <span
                    key={item}
                    className={cn(
                      orbitron.className,
                      "rounded-[4px] border px-3 py-2 text-[10px] uppercase tracking-[0.2em]",
                      index === 0
                        ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-200"
                        : "border-white/8 bg-white/[0.03] text-slate-500",
                    )}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </header>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item) => (
              <SummaryCard key={item.label} item={item} />
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,1fr)]">
            <Panel className="p-5 sm:p-6">
              <div className="flex flex-col gap-3 border-b border-white/6 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p
                    className={cn(
                      orbitron.className,
                      "text-[10px] uppercase tracking-[0.3em] text-cyan-300/80",
                    )}
                  >
                    Recent Deployments
                  </p>
                  <h2
                    className={cn(
                      orbitron.className,
                      "mt-2 text-2xl font-semibold tracking-[0.05em] text-white",
                    )}
                  >
                    Active vessel queue
                  </h2>
                </div>
              </div>

              <Suspense
                fallback={
                  <div className="mt-5">
                    <SuspensePanelLoader
                      rows={4}
                      title="Loading deployment routes..."
                    />
                  </div>
                }
              >
                <DeploymentTable
                  deployments={deployments.map((deployment) => ({
                    ...deployment,
                    status: deployment.status as "ACTIVE" | "DELAYED" | "EN ROUTE",
                  }))}
                />
              </Suspense>
            </Panel>

            <div className="flex flex-col gap-6">
              <Panel className="p-5 sm:p-6">
                <div className="border-b border-white/6 pb-5">
                  <p
                    className={cn(
                      orbitron.className,
                      "text-[10px] uppercase tracking-[0.3em] text-cyan-300/80",
                    )}
                  >
                    Daily Fuel Monitoring (Company Fleet)
                  </p>
                  <h2
                    className={cn(
                      orbitron.className,
                      "mt-2 text-2xl font-semibold tracking-[0.05em] text-white",
                    )}
                  >
                    Consumption profile
                  </h2>
                </div>

                <div className="mt-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-400">
                      Fleet fuel draw across active deployment cycles.
                    </span>
                    <span className="rounded-[4px] border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-cyan-200">
                      Live analytics
                    </span>
                  </div>

                  <div className="border border-white/8 bg-[#0b0d16] p-4">
                    <div className="mb-5 flex items-center justify-between border-b border-white/6 pb-4 text-sm text-slate-400">
                      <span>Projected burn window</span>
                      <span>Last 6 days</span>
                    </div>

                    <div className="flex min-h-[310px] items-end gap-3">
                      {fuelMonitoring.map((entry) => (
                        <FuelBar key={entry.day} {...entry} />
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[6px] border border-violet-300/20 bg-violet-500/10 text-violet-200 shadow-[0_0_24px_rgba(139,92,246,0.14)]">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M4 14h4l2-5 4 10 2-5h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        orbitron.className,
                        "text-[10px] uppercase tracking-[0.3em] text-violet-300/80",
                      )}
                    >
                      Fleet Efficiency Status
                    </p>
                    <p className="mt-3 text-base leading-7 text-slate-300">
                      Total fleet efficiency is currently{" "}
                      <span className="font-semibold text-cyan-200">
                        12% above benchmark
                      </span>{" "}
                      for all{" "}
                      <span className="font-semibold text-white">
                        10 active vessels
                      </span>
                      . Operational performance is optimal.
                    </p>
                  </div>
                </div>
              </Panel>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
