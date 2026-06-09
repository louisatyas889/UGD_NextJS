import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Orbitron, Rajdhani } from "next/font/google";
import { revalidatePath } from "next/cache";
import PrimeTopbar from "../ui/PrimeTopbar";
import { requireSession, recordSecurityLog } from "@/app/lib/auth";
import { getSql } from "../lib/db";

export const metadata: Metadata = {
  title: "Profile | Serena Sail",
  description: "Halaman profil pengguna untuk melihat & mengubah data diri.",
};

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// SERVER ACTION: Update nama user dan otomatis set avatar dari huruf pertama
async function updateNameAvatarAction(formData: FormData) {
  "use server";
  const newName = (formData.get("name") as string | null)?.trim() ?? "";
  const userId = formData.get("userId") as string | null;

  if (!userId) return;
  if (!newName || newName.length < 2) return;

  const autoAvatar = newName.charAt(0).toUpperCase();

  try {
    const sql = getSql();
    await sql`
      UPDATE app_users
      SET name = ${newName},
          avatar = ${autoAvatar},
          updated_at = NOW()
      WHERE id = ${userId}
    `;
    await recordSecurityLog({
      actor: userId,
      action: "OTHER",
      severity: "INFO",
      message: `✎ Profile updated: name diubah oleh ${userId}`,
    });
    revalidatePath("/profile");
    revalidatePath("/admin");
  } catch (error) {
    console.error("updateNameAvatarAction error:", error);
  }
}

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

export default async function ProfilePage() {
  const session = await requireSession();
  const isAdmin = !["STANDARD", "GUEST"].includes(session.role.toUpperCase());

  const sql = getSql();
  const result = await sql`
    SELECT id, name, role, status, avatar, "key", last_login_at, last_logout_at, created_at
    FROM app_users
    WHERE id = ${session.id}
  `;
  const user = result[0] || null;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a10] text-white">
        <h2 className={orbitron.className}>User data not found in database.</h2>
      </div>
    );
  }

  const initials = user.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.avatar || "U";

  const roleText =
    user.role === "SYS-ADMIN" ? "System Administrator" :
    user.role === "FLEET-MANAGER" ? "Fleet Manager" :
    user.role === "ADMIN" ? "Administrator" :
    "Standard User";

  const operatorCode = user.key ? `${user.id.toUpperCase()}-${user.key}` : user.id.toUpperCase();
  const emailPlaceholder = `${user.name.toLowerCase().replace(/\s+/g, "")}@serenasail.local`;

  return (
    <>
      <PrimeTopbar />
      <main
        className={cn(
          rajdhani.className,
          "relative min-h-[calc(100vh-46px)] overflow-hidden bg-[#0a0a10] text-white flex flex-col justify-start pt-8 pb-12",
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

        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 sm:px-6 lg:px-8">
          <header className="border-b border-white/6 pb-4 flex items-end justify-between flex-wrap gap-3">
            <div>
              <p className={cn(orbitron.className, "text-[10px] uppercase tracking-[0.32em] text-fuchsia-300/80")}>
                Operator Profile
              </p>
              <h1 className={cn(orbitron.className, "mt-2 text-2xl font-semibold tracking-[0.08em] text-white")}>
                Profile Center
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Kelola informasi akun dan avatar kamu.
                {isAdmin && <span className="ml-2 text-cyan-300">[Mode: Administrator]</span>}
              </p>
            </div>
            <a
              href={isAdmin ? "/admin" : "/dashboard"}
              style={{
                fontSize: 10, padding: "8px 14px", background: "rgba(34,211,238,0.1)",
                border: "1px solid rgba(34,211,238,0.25)", color: "#22d3ee",
                fontFamily: "Share Tech Mono", letterSpacing: "0.1em", textTransform: "uppercase",
              }}
            >
              ← {isAdmin ? "Admin Panel" : "Dashboard"}
            </a>
          </header>

          {/* PANEL 1: Identitas */}
          <Panel className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center lg:items-stretch">
              <div className="flex flex-col items-center justify-center text-center lg:border-r lg:border-white/10 lg:pr-10 pb-8 lg:pb-0">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-400/10 text-3xl font-semibold text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.16)]">
                  {initials}
                </div>
                <form action={updateNameAvatarAction} className="mt-6 w-full flex flex-col items-center gap-3">
                  <input type="hidden" name="userId" value={user.id} />
                  <div className="w-full max-w-xs">
                    <label className="block text-left text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={user.name}
                      placeholder="Enter Name..."
                      required
                      className={cn(
                        orbitron.className,
                        "w-full bg-transparent border-b border-white/10 text-center text-xl tracking-[0.06em] text-white focus:border-cyan-300 focus:outline-none pb-1 transition-colors"
                      )}
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-2 rounded bg-cyan-500/10 px-5 py-1.5 text-[10px] uppercase tracking-[0.2em] text-cyan-300 border border-cyan-400/20 hover:bg-cyan-500/20 transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </form>

                <p className="mt-4 text-base text-slate-400">{roleText}</p>
                <span className="mt-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-[10px] uppercase tracking-[0.24em] text-cyan-200">
                  {user.status ? user.status.toUpperCase() : "ACTIVE"}
                </span>
              </div>

              <div className="lg:col-span-2 flex flex-col justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {[
                    { label: "Operator Code", value: operatorCode },
                    { label: "Email", value: emailPlaceholder },
                    { label: "User ID", value: user.id },
                    { label: "Last Login", value: user.last_login_at ? new Date(user.last_login_at).toLocaleString("id-ID") : "—" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="border border-white/5 bg-white/[0.01] rounded-[4px] p-5 relative overflow-hidden group"
                    >
                      <div className="pointer-events-none absolute left-0 top-0 h-full w-[2px] bg-cyan-500/30 group-hover:bg-cyan-400 transition-colors" />
                      <p className={cn(orbitron.className, "text-[10px] uppercase tracking-[0.24em] text-slate-500")}>
                        {item.label}
                      </p>
                      <p className="mt-2 text-lg text-slate-200 font-medium tracking-[0.02em]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {/* PANEL 2: Session Info */}
          <Panel className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h2 className={cn(orbitron.className, "text-base font-semibold tracking-[0.05em] text-white")}>
                  Sesi Aktif
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Informasi login & logout session Anda.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded border border-white/5 bg-white/[0.01] p-4">
                <p className={cn(orbitron.className, "text-[9px] uppercase tracking-[0.2em] text-slate-500")}>
                  Last Login
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleString("id-ID") : "—"}
                </p>
              </div>
              <div className="rounded border border-white/5 bg-white/[0.01] p-4">
                <p className={cn(orbitron.className, "text-[9px] uppercase tracking-[0.2em] text-slate-500")}>
                  Last Logout
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  {user.last_logout_at ? new Date(user.last_logout_at).toLocaleString("id-ID") : "—"}
                </p>
              </div>
              <div className="rounded border border-white/5 bg-white/[0.01] p-4">
                <p className={cn(orbitron.className, "text-[9px] uppercase tracking-[0.2em] text-slate-500")}>
                  Akun Dibuat
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit", month: "short", year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </Panel>

          {/* FOOTER NOTE */}
          <footer className="mt-2 border-t border-white/6 pt-4 text-center text-[10px] text-slate-500">
            <p className={cn(orbitron.className, "uppercase tracking-[0.25em]")}>
              <br />
              <span className="text-cyan-300/60">Hubungi Administrator jika Anda perlu melakukan reset password.</span>
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
