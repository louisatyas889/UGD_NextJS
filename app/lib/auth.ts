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
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Active',
    ADD COLUMN IF NOT EXISTS avatar VARCHAR(5) NOT NULL DEFAULT 'U',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `;
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
    return null;
  }

  return {
    id: String(user.id),
    name: String(user.name),
    role: String(user.role),
    status: String(user.status),
    avatar: String(user.avatar),
    homePath: resolveHomePath(String(user.role)),
  } satisfies UserSession;
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
