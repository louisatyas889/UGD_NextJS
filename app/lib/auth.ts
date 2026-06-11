import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSql } from "./db";

const SESSION_COOKIE_NAME = "serena_sail_session";
const DEFAULT_SESSION_SECRET = "serena-sail-local-session-secret";
const PUBLIC_ROLES = new Set(["STANDARD", "GUEST"]);

export type UserSession = {
  id: string;
  name: string;
  role: string;
  status: string;
  avatar: string;
  homePath: string;
};

function getSessionSecret() {
  return (
    process.env.SESSION_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    DEFAULT_SESSION_SECRET
  );
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function serializeSession(session: UserSession) {
  const payload = base64UrlEncode(JSON.stringify(session));
  return `${payload}.${signPayload(payload)}`;
}

function deserializeSession(value: string) {
  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payload);
  const providedSignature = Buffer.from(signature);
  const knownSignature = Buffer.from(expectedSignature);

  if (
    providedSignature.length !== knownSignature.length ||
    !timingSafeEqual(providedSignature, knownSignature)
  ) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(payload)) as UserSession;
  } catch {
    return null;
  }
}

export function isAdminRole(role: string) {
  return !PUBLIC_ROLES.has(role.toUpperCase());
}

export function resolveHomePath(role: string) {
  return isAdminRole(role) ? "/admin" : "/dashboard";
}

export async function ensureUserSchema() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS app_users (
      id VARCHAR(50) PRIMARY KEY,
      "key" VARCHAR(40) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
      status VARCHAR(20) NOT NULL DEFAULT 'Active',
      avatar VARCHAR(5) NOT NULL DEFAULT 'U',
      job_title VARCHAR(100),
      assigned_vessel VARCHAR(100),
      work_shift VARCHAR(20),
      start_hour INTEGER,
      end_hour INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Tambahan kolom untuk tracking login/logout (idempotent ALTER)
  await sql`
    ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Active',
    ADD COLUMN IF NOT EXISTS avatar VARCHAR(5) NOT NULL DEFAULT 'U',
    ADD COLUMN IF NOT EXISTS job_title VARCHAR(100),
    ADD COLUMN IF NOT EXISTS assigned_vessel VARCHAR(100),
    ADD COLUMN IF NOT EXISTS work_shift VARCHAR(20),
    ADD COLUMN IF NOT EXISTS start_hour INTEGER,
    ADD COLUMN IF NOT EXISTS end_hour INTEGER,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_logout_at TIMESTAMPTZ
  `;
}

/**
 * Helper untuk mencatat event ke tabel security_logs.
 * Dipakai otomatis oleh login/logout API dan juga oleh action admin.
 */
export async function recordSecurityLog(params: {
  actor: string;
  action: "LOGIN" | "LOGOUT" | "PASSWORD_CHANGED" | "ACCOUNT_CREATED" | "ACCOUNT_DELETED" | "FAILED_LOGIN" | "OTHER";
  location?: string;
  severity?: "SECURE" | "WARNING" | "CRITICAL" | "INFO";
  message: string;
  color?: string;
}) {
  try {
    const sql = getSql();
    // Pastikan tabel ada
    await sql`
      CREATE TABLE IF NOT EXISTS security_logs (
        id SERIAL PRIMARY KEY,
        actor VARCHAR(120) NOT NULL,
        location VARCHAR(120) NOT NULL DEFAULT 'system',
        severity VARCHAR(40) NOT NULL DEFAULT 'INFO',
        message TEXT NOT NULL,
        color VARCHAR(20) NOT NULL DEFAULT '#22d3ee',
        log_time VARCHAR(20) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    const logTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const defaultColors: Record<string, string> = {
      LOGIN: "#22d3ee",
      LOGOUT: "#a855f7",
      PASSWORD_CHANGED: "#10b981",
      ACCOUNT_CREATED: "#22d3ee",
      ACCOUNT_DELETED: "#f87171",
      FAILED_LOGIN: "#f87171",
      OTHER: "#6b7280",
    };

    await sql`
      INSERT INTO security_logs (
        actor,
        location,
        severity,
        message,
        color,
        log_time
      )
      VALUES (
        ${params.actor},
        ${params.location ?? "system"},
        ${params.severity ?? "INFO"},
        ${params.message},
        ${params.color ?? defaultColors[params.action] ?? "#22d3ee"},
        ${logTime}
      )
    `;
  } catch (err) {
    console.error("[recordSecurityLog] error:", err);
  }
}

export async function authenticateUser(operatorId: string, accessKey: string) {
  await ensureUserSchema();
  const sql = getSql();

  const rows = await sql`
    SELECT id, name, role, status, avatar
    FROM app_users
    WHERE id = ${operatorId}
      AND "key" = ${accessKey}
      AND LOWER(status) = 'active'
    LIMIT 1
  `;

  const user = rows[0];

  if (!user) {
    // Catat failed login (jika user ada tapi key salah, atau jika user tidak ada)
    await recordSecurityLog({
      actor: operatorId || "anonymous",
      action: "FAILED_LOGIN",
      severity: "WARNING",
      message: `Failed login attempt for User ID "${operatorId}"`,
    }).catch(() => {});
    return null;
  }

  // Update last_login_at
  try {
    await sql`UPDATE app_users SET last_login_at = NOW() WHERE id = ${operatorId}`;
  } catch (err) {
    console.error("[authenticateUser] last_login_at update failed:", err);
  }

  // Catat successful login
  await recordSecurityLog({
    actor: String(user.id),
    action: "LOGIN",
    severity: "SECURE",
    message: `✓ Login berhasil: ${String(user.name)} (${String(user.role)})`,
  }).catch(() => {});

  return {
    id: String(user.id),
    name: String(user.name),
    role: String(user.role),
    status: String(user.status),
    avatar: String(user.avatar),
    homePath: resolveHomePath(String(user.role)),
  } satisfies UserSession;
}

export async function recordLogout(userId: string) {
  try {
    const sql = getSql();
    // Update last_logout_at
    await sql`UPDATE app_users SET last_logout_at = NOW() WHERE id = ${userId}`;
    // Catat logout
    const userRows = await sql`SELECT name, role FROM app_users WHERE id = ${userId} LIMIT 1`;
    const userName = userRows[0]?.name ? String(userRows[0].name) : userId;
    const userRole = userRows[0]?.role ? String(userRows[0].role) : "UNKNOWN";
    await recordSecurityLog({
      actor: userId,
      action: "LOGOUT",
      severity: "INFO",
      message: `↪ Logout: ${userName} (${userRole})`,
    });
  } catch (err) {
    console.error("[recordLogout] error:", err);
  }
}

export async function changeUserPassword(userId: string, newKey: string) {
  await ensureUserSchema();
  const sql = getSql();
  const rows = await sql`
    UPDATE app_users
    SET "key" = ${newKey}, updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, name
  `;
  if (rows.length === 0) {
    return { success: false, error: "User tidak ditemukan." };
  }
  await recordSecurityLog({
    actor: userId,
    action: "PASSWORD_CHANGED",
    severity: "CRITICAL",
    message: `🔑 Password diubah untuk user: ${String(rows[0].name)} (${userId})`,
  });
  return { success: true, name: String(rows[0].name) };
}

export async function fetchCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return deserializeSession(token);
}

export async function requireSession() {
  const session = await fetchCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireAdminSession() {
  const session = await requireSession();

  if (!isAdminRole(session.role)) {
    redirect(session.homePath);
  }

  return session;
}

export function buildSessionCookie(session: UserSession) {
  return {
    name: SESSION_COOKIE_NAME,
    value: serializeSession(session),
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    },
  };
}

export function buildClearedSessionCookie() {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    },
  };
}
