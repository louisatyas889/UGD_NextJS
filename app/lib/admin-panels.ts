import { z } from "zod";
import { ensureUserSchema } from "@/app/lib/auth";
import { getSql } from "@/app/lib/db";

const personnelSchema = z.object({
  id: z.string().trim().min(2, "ID crew wajib diisi."),
  name: z.string().trim().min(2, "Nama crew wajib diisi."),
  workShift: z.string().trim().min(2, "Shift wajib diisi."),
  jobTitle: z.string().trim().min(2, "Job title wajib diisi."),
  startHour: z.coerce.number().int().min(0).max(23),
  endHour: z.coerce.number().int().min(0).max(23),
  assignedVessel: z.string().trim().min(2, "Assigned vessel wajib diisi."),
});

const vesselSchema = z.object({
  id: z.string().trim().min(2, "Vessel ID wajib diisi."),
  subtitle: z.string().trim().min(2, "Kode kapal wajib diisi."),
  destination: z.string().trim().min(2, "Destination wajib diisi."),
  status: z.string().trim().min(2, "Status wajib diisi."),
  eta: z.string().trim().min(2, "ETA wajib diisi."),
  progressPct: z.coerce.number().int().min(0).max(100),
});

const packageSchema = z.object({
  id: z.string().trim().min(2, "Package ID wajib diisi."),
  packageSize: z.string().trim().min(2, "Ukuran paket wajib diisi."),
  destination: z.string().trim().min(2, "Destination wajib diisi."),
  vesselName: z.string().trim().min(2, "Vessel name wajib diisi."),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const securityUserSchema = z.object({
  id: z.string().trim().min(2, "User ID wajib diisi."),
  key: z.string().trim().min(2, "Access key wajib diisi."),
  name: z.string().trim().min(2, "Nama wajib diisi."),
  role: z.string().trim().min(2, "Role wajib diisi."),
  status: z.string().trim().min(2, "Status wajib diisi."),
  avatar: z.string().trim().min(1).max(5),
});

const securityLogSchema = z.object({
  actor: z.string().trim().min(2, "Actor wajib diisi."),
  location: z.string().trim().min(2, "Location wajib diisi."),
  severity: z.string().trim().min(2, "Severity wajib diisi."),
  message: z.string().trim().min(4, "Message wajib diisi."),
  color: z.string().trim().min(4, "Color wajib diisi."),
});

export type PersonnelRecord = {
  id: string;
  name: string;
  workShift: string;
  jobTitle: string;
  startHour: number;
  endHour: number;
  workingHours: string;
  assignedVessel: string;
};

export type VesselRecord = {
  id: string;
  subtitle: string;
  destination: string;
  status: string;
  eta: string;
  progressPct: number;
};

export type TrackingPackageRecord = {
  id: string;
  packageSize: string;
  destination: string;
  lat: number;
  lng: number;
  vesselName: string;
};

export type SecurityUserRecord = {
  id: string;
  key: string;
  name: string;
  role: string;
  status: string;
  avatar: string;
};

export type SecurityLogRecord = {
  id: number;
  actor: string;
  location: string;
  severity: string;
  message: string;
  color: string;
  time: string;
  createdAt: string;
};

function getStatusColor(status: string) {
  const value = status.toLowerCase();
  if (value.includes("delay") || value.includes("storm")) {
    return "#f87171";
  }
  if (value.includes("loading") || value.includes("depart")) {
    return "#f59e0b";
  }
  if (value.includes("approach")) {
    return "#4ade80";
  }
  return "#22d3ee";
}

function formatHour(value: number) {
  return String(value).padStart(2, "0");
}

function buildWorkingHours(startHour: number, endHour: number) {
  return `${formatHour(startHour)}:00 - ${formatHour(endHour)}:00`;
}

export async function ensureAdminPanelSchemas() {
  const sql = getSql();
  await ensureUserSchema();

  await sql`
    CREATE TABLE IF NOT EXISTS fleet_personnel (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      work_shift VARCHAR(20) NOT NULL,
      job_title VARCHAR(100) NOT NULL,
      start_hour INTEGER NOT NULL,
      end_hour INTEGER NOT NULL,
      working_hours VARCHAR(20) NOT NULL,
      assigned_vessel VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE fleet_personnel
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS fleet_vessels (
      id VARCHAR(50) PRIMARY KEY,
      subtitle VARCHAR(80) NOT NULL DEFAULT '',
      destination VARCHAR(150) NOT NULL,
      status VARCHAR(50) NOT NULL,
      status_color VARCHAR(20) NOT NULL DEFAULT '#22d3ee',
      eta VARCHAR(50) NOT NULL DEFAULT '--',
      eta_color VARCHAR(20) NOT NULL DEFAULT '#e5e7eb',
      monitoring_icon VARCHAR(20) NOT NULL DEFAULT 'chart',
      progress_pct INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE fleet_vessels
    ADD COLUMN IF NOT EXISTS subtitle VARCHAR(80) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS progress_pct INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tracking_packages (
      id VARCHAR(50) PRIMARY KEY,
      package_size VARCHAR(20) NOT NULL,
      destination VARCHAR(100) NOT NULL,
      lat DOUBLE PRECISION NOT NULL DEFAULT 0,
      lng DOUBLE PRECISION NOT NULL DEFAULT 0,
      vessel_name VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE tracking_packages
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS security_logs (
      id SERIAL PRIMARY KEY,
      actor VARCHAR(120) NOT NULL,
      location VARCHAR(120) NOT NULL,
      severity VARCHAR(40) NOT NULL,
      message TEXT NOT NULL,
      color VARCHAR(20) NOT NULL DEFAULT '#22d3ee',
      log_time VARCHAR(20) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function fetchPersonnelRecords() {
  await ensureAdminPanelSchemas();
  const sql = getSql();
  const rows = await sql`
    SELECT id, name, work_shift, job_title, start_hour, end_hour, working_hours, assigned_vessel
    FROM fleet_personnel
    ORDER BY name ASC
  `;

  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    workShift: String(row.work_shift),
    jobTitle: String(row.job_title),
    startHour: Number(row.start_hour),
    endHour: Number(row.end_hour),
    workingHours: String(row.working_hours),
    assignedVessel: String(row.assigned_vessel),
  })) satisfies PersonnelRecord[];
}

export async function fetchFleetVessels() {
  await ensureAdminPanelSchemas();
  const sql = getSql();
  const rows = await sql`
    SELECT id, subtitle, destination, status, eta, progress_pct
    FROM fleet_vessels
    ORDER BY updated_at DESC, id ASC
  `;

  return rows.map((row) => ({
    id: String(row.id),
    subtitle: String(row.subtitle ?? ""),
    destination: String(row.destination),
    status: String(row.status),
    eta: String(row.eta ?? "--"),
    progressPct: Number(row.progress_pct ?? 0),
  })) satisfies VesselRecord[];
}

export async function fetchTrackingPackagesRecords() {
  await ensureAdminPanelSchemas();
  const sql = getSql();
  const rows = await sql`
    SELECT id, package_size, destination, lat, lng, vessel_name
    FROM tracking_packages
    ORDER BY updated_at DESC, id ASC
  `;

  return rows.map((row) => ({
    id: String(row.id),
    packageSize: String(row.package_size),
    destination: String(row.destination),
    lat: Number(row.lat ?? 0),
    lng: Number(row.lng ?? 0),
    vesselName: String(row.vessel_name),
  })) satisfies TrackingPackageRecord[];
}

export async function fetchSecurityUsers() {
  await ensureAdminPanelSchemas();
  const sql = getSql();
  const rows = await sql`
    SELECT id, key, name, role, status, avatar
    FROM app_users
    ORDER BY role ASC, name ASC
  `;

  return rows.map((row) => ({
    id: String(row.id),
    key: String(row.key),
    name: String(row.name),
    role: String(row.role),
    status: String(row.status),
    avatar: String(row.avatar),
  })) satisfies SecurityUserRecord[];
}

export async function fetchSecurityLogs() {
  await ensureAdminPanelSchemas();
  const sql = getSql();
  const rows = await sql`
    SELECT id, actor, location, severity, message, color, log_time, created_at
    FROM security_logs
    ORDER BY created_at DESC, id DESC
    LIMIT 30
  `;

  return rows.map((row) => ({
    id: Number(row.id),
    actor: String(row.actor),
    location: String(row.location),
    severity: String(row.severity),
    message: String(row.message),
    color: String(row.color),
    time: String(row.log_time),
    createdAt: new Date(row.created_at).toISOString(),
  })) satisfies SecurityLogRecord[];
}

export async function upsertPersonnel(payload: Record<string, unknown>) {
  await ensureAdminPanelSchemas();
  const data = personnelSchema.parse(payload);
  const sql = getSql();
  const workingHours = buildWorkingHours(data.startHour, data.endHour);

  await sql`
    INSERT INTO fleet_personnel (
      id,
      name,
      work_shift,
      job_title,
      start_hour,
      end_hour,
      working_hours,
      assigned_vessel,
      updated_at
    )
    VALUES (
      ${data.id},
      ${data.name},
      ${data.workShift},
      ${data.jobTitle},
      ${data.startHour},
      ${data.endHour},
      ${workingHours},
      ${data.assignedVessel},
      NOW()
    )
    ON CONFLICT (id)
    DO UPDATE SET
      name = EXCLUDED.name,
      work_shift = EXCLUDED.work_shift,
      job_title = EXCLUDED.job_title,
      start_hour = EXCLUDED.start_hour,
      end_hour = EXCLUDED.end_hour,
      working_hours = EXCLUDED.working_hours,
      assigned_vessel = EXCLUDED.assigned_vessel,
      updated_at = NOW()
  `;
}

export async function deletePersonnel(id: string) {
  await ensureAdminPanelSchemas();
  const sql = getSql();
  const rows = await sql`
    DELETE FROM fleet_personnel
    WHERE id = ${id}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function upsertFleetVessel(payload: Record<string, unknown>) {
  await ensureAdminPanelSchemas();
  const data = vesselSchema.parse(payload);
  const sql = getSql();
  const statusColor = getStatusColor(data.status);

  await sql`
    INSERT INTO fleet_vessels (
      id,
      subtitle,
      destination,
      status,
      status_color,
      eta,
      eta_color,
      monitoring_icon,
      progress_pct,
      updated_at
    )
    VALUES (
      ${data.id},
      ${data.subtitle},
      ${data.destination},
      ${data.status},
      ${statusColor},
      ${data.eta},
      ${"#e5e7eb"},
      ${"chart"},
      ${data.progressPct},
      NOW()
    )
    ON CONFLICT (id)
    DO UPDATE SET
      subtitle = EXCLUDED.subtitle,
      destination = EXCLUDED.destination,
      status = EXCLUDED.status,
      status_color = EXCLUDED.status_color,
      eta = EXCLUDED.eta,
      progress_pct = EXCLUDED.progress_pct,
      updated_at = NOW()
  `;
}

export async function deleteFleetVessel(id: string) {
  await ensureAdminPanelSchemas();
  const sql = getSql();
  const rows = await sql`
    DELETE FROM fleet_vessels
    WHERE id = ${id}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function upsertTrackingPackage(payload: Record<string, unknown>) {
  await ensureAdminPanelSchemas();
  const data = packageSchema.parse(payload);
  const sql = getSql();

  await sql`
    INSERT INTO tracking_packages (
      id,
      package_size,
      destination,
      lat,
      lng,
      vessel_name,
      updated_at
    )
    VALUES (
      ${data.id},
      ${data.packageSize},
      ${data.destination},
      ${data.lat},
      ${data.lng},
      ${data.vesselName},
      NOW()
    )
    ON CONFLICT (id)
    DO UPDATE SET
      package_size = EXCLUDED.package_size,
      destination = EXCLUDED.destination,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      vessel_name = EXCLUDED.vessel_name,
      updated_at = NOW()
  `;
}

export async function deleteTrackingPackage(id: string) {
  await ensureAdminPanelSchemas();
  const sql = getSql();
  const rows = await sql`
    DELETE FROM tracking_packages
    WHERE id = ${id}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function upsertSecurityUser(payload: Record<string, unknown>) {
  await ensureAdminPanelSchemas();
  const data = securityUserSchema.parse(payload);
  const sql = getSql();

  await sql`
    INSERT INTO app_users (
      id,
      key,
      name,
      role,
      status,
      avatar,
      updated_at
    )
    VALUES (
      ${data.id},
      ${data.key},
      ${data.name},
      ${data.role},
      ${data.status},
      ${data.avatar},
      NOW()
    )
    ON CONFLICT (id)
    DO UPDATE SET
      key = EXCLUDED.key,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      status = EXCLUDED.status,
      avatar = EXCLUDED.avatar,
      updated_at = NOW()
  `;
}

export async function deleteSecurityUser(id: string) {
  await ensureAdminPanelSchemas();
  const sql = getSql();
  const rows = await sql`
    DELETE FROM app_users
    WHERE id = ${id}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function createSecurityLog(payload: Record<string, unknown>) {
  await ensureAdminPanelSchemas();
  const data = securityLogSchema.parse(payload);
  const sql = getSql();
  const logTime = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

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
      ${data.actor},
      ${data.location},
      ${data.severity},
      ${data.message},
      ${data.color},
      ${logTime}
    )
  `;
}

export async function deleteSecurityLog(id: number) {
  await ensureAdminPanelSchemas();
  const sql = getSql();
  const rows = await sql`
    DELETE FROM security_logs
    WHERE id = ${id}
    RETURNING id
  `;
  return rows.length > 0;
}
