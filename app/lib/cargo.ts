import { z } from "zod";
import { getSql } from "./db";
import {
  deliveryTypeOptions,
  itemStatusOptions,
  shipmentStatusOptions,
  transactionStatusOptions,
  transportModeOptions,
  vehicleStatusOptions,
  type CargoFormData,
  type CargoRecord,
  type CargoSummary,
} from "./cargo-types";

type SqlClient = ReturnType<typeof getSql>;

const cargoPayloadSchema = z.object({
  shippingDate: z.string().min(1, "Tanggal kirim wajib diisi."),
  senderName: z.string().trim().min(2, "Nama pengirim wajib diisi."),
  recipientName: z.string().trim().min(2, "Nama penerima wajib diisi."),
  phone: z.string().trim().min(8, "Nomor telepon wajib diisi."),
  originCity: z.string().trim().min(2, "Kota asal wajib diisi."),
  destinationCity: z.string().trim().min(2, "Kota tujuan wajib diisi."),
  itemName: z.string().trim().min(2, "Nama barang wajib diisi."),
  itemType: z.string().trim().min(2, "Jenis barang wajib diisi."),
  itemWeightKg: z.coerce.number().positive("Berat barang harus lebih dari 0."),
  shippingPrice: z.coerce.number().nonnegative("Tarif tidak boleh negatif."),
  transportMode: z.enum(transportModeOptions),
  deliveryType: z.enum(deliveryTypeOptions),
  shipmentStatus: z.enum(shipmentStatusOptions),
  itemStatus: z.enum(itemStatusOptions),
  transactionStatus: z.enum(transactionStatusOptions),
  description: z.string().trim().default(""),
  vehicleName: z.string().trim().min(2, "Nama kendaraan wajib diisi."),
  vehicleType: z.string().trim().min(2, "Jenis kendaraan wajib diisi."),
  vehicleCode: z.string().trim().min(2, "Plat nomor / kode kendaraan wajib diisi."),
  vehicleCapacityKg: z.coerce
    .number()
    .positive("Kapasitas kendaraan harus lebih dari 0."),
  vehicleStatus: z.enum(vehicleStatusOptions),
});

export type CargoInput = z.infer<typeof cargoPayloadSchema>;

function normalizePayload(payload: CargoFormData | Record<string, unknown>) {
  return cargoPayloadSchema.parse(payload);
}

function buildTrackingNumber(transportMode: string) {
  const prefixMap: Record<string, string> = {
    Darat: "DRT",
    Udara: "UDR",
    Laut: "LUT",
  };
  const prefix = prefixMap[transportMode] ?? "CRG";
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${timestamp}-${suffix}`;
}

function mapCargoRows(rows: any[]): CargoRecord[] {
  return rows.map((row) => ({
    id: Number(row.id),
    trackingNumber: row.tracking_number,
    shippingDate: row.shipping_date ? String(row.shipping_date).slice(0, 10) : "",
    senderName: row.sender_name,
    recipientName: row.recipient_name,
    phone: row.phone,
    originCity: row.origin_city,
    destinationCity: row.destination_city,
    itemName: row.item_name,
    itemType: row.item_type,
    itemWeightKg: Number(row.weight_kg),
    itemPrice: 0,
    shippingPrice: Number(row.shipping_price),
    transportMode: row.transport_mode,
    deliveryType: row.delivery_type,
    shipmentStatus: row.shipment_status,
    itemStatus: row.item_status,
    transactionStatus: row.transaction_status,
    description: row.description ?? "",
    vehicleName: row.vehicle_name ?? "",
    vehicleType: row.vehicle_type ?? "",
    vehicleCode: row.vehicle_code ?? "",
    vehicleCapacityKg: Number(row.capacity_kg ?? 0),
    vehicleStatus: row.vehicle_status ?? "",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : "",
  }));
}

async function fetchCargoByIdWithClient(sql: SqlClient, id: number) {
  const rows = await sql`
    SELECT
      s.id,
      s.tracking_number,
      s.shipping_date,
      s.sender_name,
      s.recipient_name,
      s.phone,
      s.origin_city,
      s.destination_city,
      s.transport_mode,
      s.delivery_type,
      s.shipment_status,
      s.item_status,
      s.description,
      s.created_at,
      s.updated_at,
      i.item_name,
      i.item_type,
      i.weight_kg,
      t.shipping_price,
      t.transaction_status,
      v.vehicle_name,
      v.vehicle_type,
      v.vehicle_code,
      v.capacity_kg,
      v.vehicle_status
    FROM cargo_shipments s
    INNER JOIN cargo_items i ON i.shipment_id = s.id
    INNER JOIN cargo_transactions t ON t.shipment_id = s.id
    LEFT JOIN cargo_vehicles v ON v.id = s.vehicle_id
    WHERE s.id = ${id}
    LIMIT 1
  `;

  return mapCargoRows(rows)[0] ?? null;
}

async function upsertVehicle(sql: SqlClient, payload: CargoInput) {
  const vehicleRows = await sql`
    INSERT INTO cargo_vehicles (
      vehicle_name,
      vehicle_type,
      vehicle_code,
      capacity_kg,
      vehicle_status,
      transport_mode,
      updated_at
    )
    VALUES (
      ${payload.vehicleName},
      ${payload.vehicleType},
      ${payload.vehicleCode},
      ${payload.vehicleCapacityKg},
      ${payload.vehicleStatus},
      ${payload.transportMode},
      NOW()
    )
    ON CONFLICT (vehicle_code)
    DO UPDATE SET
      vehicle_name = EXCLUDED.vehicle_name,
      vehicle_type = EXCLUDED.vehicle_type,
      capacity_kg = EXCLUDED.capacity_kg,
      vehicle_status = EXCLUDED.vehicle_status,
      transport_mode = EXCLUDED.transport_mode,
      updated_at = NOW()
    RETURNING id
  `;

  return Number(vehicleRows[0].id);
}

async function cleanupVehicleIfUnused(sql: SqlClient, vehicleId: number | null) {
  if (!vehicleId) {
    return;
  }

  await sql`
    DELETE FROM cargo_vehicles
    WHERE id = ${vehicleId}
      AND NOT EXISTS (
        SELECT 1
        FROM cargo_shipments
        WHERE vehicle_id = ${vehicleId}
      )
  `;
}

export async function ensureCargoSchema() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS cargo_vehicles (
      id SERIAL PRIMARY KEY,
      vehicle_name VARCHAR(120) NOT NULL,
      vehicle_type VARCHAR(80) NOT NULL,
      vehicle_code VARCHAR(80) NOT NULL UNIQUE,
      capacity_kg NUMERIC(12, 2) NOT NULL,
      vehicle_status VARCHAR(40) NOT NULL,
      transport_mode VARCHAR(20) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cargo_shipments (
      id SERIAL PRIMARY KEY,
      tracking_number VARCHAR(40) NOT NULL UNIQUE,
      shipping_date DATE NOT NULL,
      sender_name VARCHAR(120) NOT NULL,
      recipient_name VARCHAR(120) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      origin_city VARCHAR(120) NOT NULL,
      destination_city VARCHAR(120) NOT NULL,
      transport_mode VARCHAR(20) NOT NULL,
      delivery_type VARCHAR(20) NOT NULL,
      shipment_status VARCHAR(40) NOT NULL,
      item_status VARCHAR(40) NOT NULL,
      description TEXT,
      vehicle_id INTEGER REFERENCES cargo_vehicles(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cargo_items (
      id SERIAL PRIMARY KEY,
      shipment_id INTEGER NOT NULL UNIQUE REFERENCES cargo_shipments(id) ON DELETE CASCADE,
      item_name VARCHAR(120) NOT NULL,
      item_type VARCHAR(120) NOT NULL,
      weight_kg NUMERIC(12, 2) NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cargo_transactions (
      id SERIAL PRIMARY KEY,
      shipment_id INTEGER NOT NULL UNIQUE REFERENCES cargo_shipments(id) ON DELETE CASCADE,
      shipping_price NUMERIC(12, 2) NOT NULL,
      transaction_status VARCHAR(40) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS cargo_shipments_tracking_idx
    ON cargo_shipments (tracking_number)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS cargo_shipments_sender_idx
    ON cargo_shipments (sender_name)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS cargo_shipments_recipient_idx
    ON cargo_shipments (recipient_name)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS cargo_items_name_idx
    ON cargo_items (item_name)
  `;
}

export async function fetchCargoShipments(query = "") {
  await ensureCargoSchema();
  const sql = getSql();
  const keyword = `%${query.trim()}%`;

  const rows =
    query.trim().length === 0
      ? await sql`
          SELECT
            s.id,
            s.tracking_number,
            s.shipping_date,
            s.sender_name,
            s.recipient_name,
            s.phone,
            s.origin_city,
            s.destination_city,
            s.transport_mode,
            s.delivery_type,
            s.shipment_status,
            s.item_status,
            s.description,
            s.created_at,
            s.updated_at,
            i.item_name,
            i.item_type,
            i.weight_kg,
            t.shipping_price,
            t.transaction_status,
            v.vehicle_name,
            v.vehicle_type,
            v.vehicle_code,
            v.capacity_kg,
            v.vehicle_status
          FROM cargo_shipments s
          INNER JOIN cargo_items i ON i.shipment_id = s.id
          INNER JOIN cargo_transactions t ON t.shipment_id = s.id
          LEFT JOIN cargo_vehicles v ON v.id = s.vehicle_id
          ORDER BY s.created_at DESC, s.id DESC
        `
      : await sql`
          SELECT
            s.id,
            s.tracking_number,
            s.shipping_date,
            s.sender_name,
            s.recipient_name,
            s.phone,
            s.origin_city,
            s.destination_city,
            s.transport_mode,
            s.delivery_type,
            s.shipment_status,
            s.item_status,
            s.description,
            s.created_at,
            s.updated_at,
            i.item_name,
            i.item_type,
            i.weight_kg,
            t.shipping_price,
            t.transaction_status,
            v.vehicle_name,
            v.vehicle_type,
            v.vehicle_code,
            v.capacity_kg,
            v.vehicle_status
          FROM cargo_shipments s
          INNER JOIN cargo_items i ON i.shipment_id = s.id
          INNER JOIN cargo_transactions t ON t.shipment_id = s.id
          LEFT JOIN cargo_vehicles v ON v.id = s.vehicle_id
          WHERE
            s.tracking_number ILIKE ${keyword} OR
            s.sender_name ILIKE ${keyword} OR
            s.recipient_name ILIKE ${keyword} OR
            i.item_name ILIKE ${keyword}
          ORDER BY s.created_at DESC, s.id DESC
        `;

  return mapCargoRows(rows);
}

export async function fetchCargoSummary() {
  await ensureCargoSchema();
  const sql = getSql();

  const rows = await sql`
    SELECT
      COUNT(*)::INT AS total_shipments,
      COUNT(*) FILTER (WHERE s.transport_mode = 'Darat')::INT AS land_shipments,
      COUNT(*) FILTER (WHERE s.transport_mode = 'Udara')::INT AS air_shipments,
      COUNT(*) FILTER (WHERE s.transport_mode = 'Laut')::INT AS sea_shipments,
      COUNT(*) FILTER (
        WHERE s.shipment_status IN ('Sampai Tujuan', 'Selesai')
      )::INT AS completed_shipments,
      COALESCE(SUM(t.shipping_price), 0)::NUMERIC AS total_revenue
    FROM cargo_shipments s
    INNER JOIN cargo_transactions t ON t.shipment_id = s.id
  `;

  const row = rows[0];

  return {
    totalShipments: Number(row?.total_shipments ?? 0),
    landShipments: Number(row?.land_shipments ?? 0),
    airShipments: Number(row?.air_shipments ?? 0),
    seaShipments: Number(row?.sea_shipments ?? 0),
    completedShipments: Number(row?.completed_shipments ?? 0),
    totalRevenue: Number(row?.total_revenue ?? 0),
  } satisfies CargoSummary;
}

export async function createCargoShipment(payload: CargoFormData | Record<string, unknown>) {
  await ensureCargoSchema();
  const data = normalizePayload(payload);
  const sql = getSql();

  return sql.begin(async (transactionSql) => {
    const vehicleId = await upsertVehicle(transactionSql, data);
    const trackingNumber = buildTrackingNumber(data.transportMode);

    const shipmentRows = await transactionSql`
      INSERT INTO cargo_shipments (
        tracking_number,
        shipping_date,
        sender_name,
        recipient_name,
        phone,
        origin_city,
        destination_city,
        transport_mode,
        delivery_type,
        shipment_status,
        item_status,
        description,
        vehicle_id,
        updated_at
      )
      VALUES (
        ${trackingNumber},
        ${data.shippingDate},
        ${data.senderName},
        ${data.recipientName},
        ${data.phone},
        ${data.originCity},
        ${data.destinationCity},
        ${data.transportMode},
        ${data.deliveryType},
        ${data.shipmentStatus},
        ${data.itemStatus},
        ${data.description},
        ${vehicleId},
        NOW()
      )
      RETURNING id
    `;

    const shipmentId = Number(shipmentRows[0].id);

    await transactionSql`
      INSERT INTO cargo_items (
        shipment_id,
        item_name,
        item_type,
        weight_kg
      )
      VALUES (
        ${shipmentId},
        ${data.itemName},
        ${data.itemType},
        ${data.itemWeightKg}
      )
    `;

    await transactionSql`
      INSERT INTO cargo_transactions (
        shipment_id,
        shipping_price,
        transaction_status,
        updated_at
      )
      VALUES (
        ${shipmentId},
        ${data.shippingPrice},
        ${data.transactionStatus},
        NOW()
      )
    `;

    return fetchCargoByIdWithClient(transactionSql, shipmentId);
  });
}

export async function updateCargoShipment(
  id: number,
  payload: CargoFormData | Record<string, unknown>,
) {
  await ensureCargoSchema();
  const data = normalizePayload(payload);
  const sql = getSql();

  return sql.begin(async (transactionSql) => {
    const existingRows = await transactionSql`
      SELECT vehicle_id
      FROM cargo_shipments
      WHERE id = ${id}
      LIMIT 1
    `;

    if (existingRows.length === 0) {
      return null;
    }

    const previousVehicleId = Number(existingRows[0].vehicle_id ?? 0) || null;
    const vehicleId = await upsertVehicle(transactionSql, data);

    await transactionSql`
      UPDATE cargo_shipments
      SET
        shipping_date = ${data.shippingDate},
        sender_name = ${data.senderName},
        recipient_name = ${data.recipientName},
        phone = ${data.phone},
        origin_city = ${data.originCity},
        destination_city = ${data.destinationCity},
        transport_mode = ${data.transportMode},
        delivery_type = ${data.deliveryType},
        shipment_status = ${data.shipmentStatus},
        item_status = ${data.itemStatus},
        description = ${data.description},
        vehicle_id = ${vehicleId},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    await transactionSql`
      UPDATE cargo_items
      SET
        item_name = ${data.itemName},
        item_type = ${data.itemType},
        weight_kg = ${data.itemWeightKg}
      WHERE shipment_id = ${id}
    `;

    await transactionSql`
      UPDATE cargo_transactions
      SET
        shipping_price = ${data.shippingPrice},
        transaction_status = ${data.transactionStatus},
        updated_at = NOW()
      WHERE shipment_id = ${id}
    `;

    if (previousVehicleId && previousVehicleId !== vehicleId) {
      await cleanupVehicleIfUnused(transactionSql, previousVehicleId);
    }

    return fetchCargoByIdWithClient(transactionSql, id);
  });
}

export async function deleteCargoShipment(id: number) {
  await ensureCargoSchema();
  const sql = getSql();

  return sql.begin(async (transactionSql) => {
    const shipmentRows = await transactionSql`
      DELETE FROM cargo_shipments
      WHERE id = ${id}
      RETURNING vehicle_id
    `;

    if (shipmentRows.length === 0) {
      return false;
    }

    const vehicleId = Number(shipmentRows[0].vehicle_id ?? 0) || null;
    await cleanupVehicleIfUnused(transactionSql, vehicleId);
    return true;
  });
}

export async function fetchCargoShipmentById(id: number) {
  await ensureCargoSchema();
  const sql = getSql();
  return fetchCargoByIdWithClient(sql, id);
}
