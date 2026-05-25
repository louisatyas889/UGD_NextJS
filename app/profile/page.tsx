import type { ReactNode } from "react";
import { Orbitron, Rajdhani } from "next/font/google";
import PrimeTopbar from "../ui/PrimeTopbar";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const profile = {
  name: "Louisa Ardhana",
  role: "System Administrator",
  code: "LOUISA-ADMIN-0909",
  email: "louisa@serenasail.local",
  region: "SOUTH ASIA COMMAND",
  shift: "06:00 - 14:00 UTC",
  status: "ONLINE",
  initials: "LA",
};

const stats = [
  { label: "Access Level", value: "ROOT-07", tone: "cyan" },
  { label: "Fleet Scope", value: "42 Units", tone: "white" },
  { label: "Alerts Cleared", value: "128", tone: "violet" },
  { label: "Auth Layer", value: "SECURED", tone: "magenta" },
] as const;

const activities = [
  {
    title: "Session validated from command deck",
    time: "10:42 UTC",
    accent: "cyan",
  },
  {
    title: "Fleet route permissions synchronized",
    time: "09:18 UTC",
    accent: "violet",
  },
  {
    title: "Security audit completed with no anomaly",
    time: "08:05 UTC",
    accent: "white",
  },
] as const;

const settings = [
  { label: "Multi-factor authentication", value: "Enabled" },
  { label: "Biometric access token", value: "Active" },
  { label: "Command channel priority", value: "High" },
  { label: "Emergency override", value: "Restricted" },
] as const;

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

function StatCard({
  item,
}: {
  item: (typeof stats)[number];
}) {
  const tones = {
    cyan: "text-cyan-300",
    white: "text-white",
    violet: "text-violet-300",
    magenta: "text-fuchsia-300",
  } as const;

  return (
    <Panel className="p-5">
      <p
        className={cn(
          orbitron.className,
          "text-[10px] uppercase tracking-[0.26em] text-slate-500",
        )}
      >
        {item.label}
      </p>
      <p
        className={cn(
          orbitron.className,
          "mt-5 text-2xl tracking-[0.06em]",
          tones[item.tone],
        )}
      >
        {item.value}
      </p>
    </Panel>
  );
}

export default function ProfilePage() {
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

        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <header className="border-b border-white/6 pb-6">
            <p
              className={cn(
                orbitron.className,
                "text-[10px] uppercase tracking-[0.32em] text-fuchsia-300/80",
              )}
            >
              Operator Profile
            </p>
            <h1
              className={cn(
                orbitron.className,
                "mt-3 text-3xl font-semibold tracking-[0.08em] text-white sm:text-4xl",
              )}
            >
              Profile Center
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-400 sm:text-lg">
              Personal command overview, access status, and security profile for
              the currently authenticated operator.
            </p>
          </header>

          <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Panel className="p-6">
              <div className="flex flex-col items-center border-b border-white/6 pb-6 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-400/10 text-2xl font-semibold text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.16)]">
                  {profile.initials}
                </div>
                <h2
                  className={cn(
                    orbitron.className,
                    "mt-5 text-xl tracking-[0.06em] text-white",
                  )}
                >
                  {profile.name}
                </h2>
                <p className="mt-2 text-base text-slate-400">{profile.role}</p>
                <span className="mt-4 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-cyan-200">
                  {profile.status}
                </span>
              </div>

              <div className="space-y-4 pt-6">
                {[
                  { label: "Operator Code", value: profile.code },
                  { label: "Email", value: profile.email },
                  { label: "Command Region", value: profile.region },
                  { label: "Assigned Shift", value: profile.shift },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="border-b border-white/5 pb-4 last:border-b-0 last:pb-0"
                  >
                    <p
                      className={cn(
                        orbitron.className,
                        "text-[10px] uppercase tracking-[0.24em] text-slate-500",
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="mt-2 text-base text-slate-200">{item.value}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="flex flex-col gap-6">
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => (
                  <StatCard key={item.label} item={item} />
                ))}
              </section>

              <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
                <Panel className="p-6">
                  <div className="flex items-center justify-between border-b border-white/6 pb-4">
                    <div>
                      <p
                        className={cn(
                          orbitron.className,
                          "text-[10px] uppercase tracking-[0.26em] text-cyan-300/80",
                        )}
                      >
                        Recent Activity
                      </p>
                      <h3
                        className={cn(
                          orbitron.className,
                          "mt-2 text-xl tracking-[0.05em] text-white",
                        )}
                      >
                        Session timeline
                      </h3>
                    </div>
                    <span className="rounded-[4px] border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                      Live sync
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    {activities.map((activity) => (
                      <div
                        key={activity.title}
                        className="flex items-start gap-4 border-b border-white/5 pb-4 last:border-b-0 last:pb-0"
                      >
                        <span
                          className={cn(
                            "mt-1 h-2.5 w-2.5 rounded-full",
                            activity.accent === "cyan"
                              ? "bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.7)]"
                              : activity.accent === "violet"
                                ? "bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,0.7)]"
                                : "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]",
                          )}
                        />
                        <div className="flex-1">
                          <p className="text-base text-slate-200">
                            {activity.title}
                          </p>
                          <p className="mt-1 text-sm uppercase tracking-[0.18em] text-slate-500">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel className="p-6">
                  <p
                    className={cn(
                      orbitron.className,
                      "text-[10px] uppercase tracking-[0.26em] text-violet-300/80",
                    )}
                  >
                    Security Profile
                  </p>
                  <h3
                    className={cn(
                      orbitron.className,
                      "mt-2 text-xl tracking-[0.05em] text-white",
                    )}
                  >
                    Active settings
                  </h3>

                  <div className="mt-5 space-y-4">
                    {settings.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between border-b border-white/5 pb-4 last:border-b-0 last:pb-0"
                      >
                        <div>
                          <p className="text-base text-slate-200">{item.label}</p>
                          <p className="mt-1 text-sm uppercase tracking-[0.18em] text-slate-500">
                            System policy
                          </p>
                        </div>
                        <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-violet-200">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </section>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
