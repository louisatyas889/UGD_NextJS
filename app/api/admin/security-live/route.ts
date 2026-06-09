import { NextResponse } from "next/server";
import { requireAdminSession } from "@/app/lib/auth";
import { getSql } from "@/app/lib/db";

/**
 * Endpoint live data untuk Security & Accounts workspace.
 * Hanya admin yang boleh akses.
 * Return logs + users terbaru dari database untuk real-time monitoring.
 */
export async function GET() {
  try {
    // Proteksi: hanya admin
    await requireAdminSession();

    const sql = getSql();

    // Ambil logs terbaru (max 100)
    const logsRaw = (await sql`
      SELECT id, actor, location, severity, message, color, log_time, created_at
      FROM security_logs
      ORDER BY created_at DESC, id DESC
      LIMIT 100
    `) as unknown as Array<{
      id: number;
      actor: string;
      location: string;
      severity: string;
      message: string;
      color: string;
      log_time: string;
      created_at: string;
    }>;

    // Ambil SEMUA users
    const usersRaw = (await sql`
      SELECT id, "key", name, role, status, avatar, last_login_at, last_logout_at
      FROM app_users
      ORDER BY role ASC, name ASC
    `) as unknown as Array<{
      id: string;
      key: string;
      name: string;
      role: string;
      status: string;
      avatar: string;
      last_login_at: string | null;
      last_logout_at: string | null;
    }>;

    const logs = logsRaw.map((r) => ({
      id: Number(r.id),
      actor: String(r.actor),
      location: String(r.location),
      severity: String(r.severity),
      message: String(r.message),
      color: String(r.color),
      time: String(r.log_time),
      createdAt: new Date(r.created_at).toISOString(),
    }));

    const users = usersRaw.map((u) => ({
      id: String(u.id),
      key: String(u.key),
      name: String(u.name),
      role: String(u.role),
      status: String(u.status),
      avatar: String(u.avatar),
      lastLoginAt: u.last_login_at ? new Date(u.last_login_at).toISOString() : null,
      lastLogoutAt: u.last_logout_at ? new Date(u.last_logout_at).toISOString() : null,
    }));

    return NextResponse.json({
      success: true,
      logs,
      users,
      meta: {
        logsCount: logs.length,
        usersCount: users.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[/api/admin/security-live] Error:", error);
    return NextResponse.json(
      { success: false, logs: [], users: [], error: error?.message ?? "Server error" },
      { status: 200 },
    );
  }
}
