import { z } from "zod";
import { getSql } from "@/app/lib/db";
import {
  deliveryTypeOptions,
  shipmentStatusOptions,
  type CargoFormData,
  type CargoRecord,
  type CargoSummary,
} from "@/app/lib/cargo-types";

type SqlClient = ReturnType<typeof getSql>;

const cargoCreateSchema = z.object({
  shippingDate: z.string().min(1, "Tanggal kirim wajib diisi."),
  senderName: z.string().trim().min(2, "Nama pengirim wajib diisi."),
  recipientName: z.string().trim().min(2, "Nama penerima wajib diisi."),
  phone: z.string().trim().min(8, "Nomor telepon wajib diisi."),
  originCity: z.string().trim().min(2, "Kota asal wajib diisi."),
  destinationCity: z.string().trim().min(2, "Kota tujuan wajib diisi."),
  itemName: z.string().trim().min(2, "Nama barang wajib diisi."),
  itemType: z.string().trim().min(2, "Jenis barang wajib diisi."),
  itemWeightKg: z.coerce.number().positive("Berat barang harus lebih dari 0."),
  shippingPrice: z.coerce.number().nonnegative("Harga atau tarif tidak boleh negatif."),
  deliveryType: z.enum(deliveryTypeOptions),
  shipmentStatus: z.enum(shipmentStatusOptions),
  description: z.string().trim().default(""),
  transportMode: z.literal("Laut").default("Laut"),
  itemStatus: z.literal("Siap Kirim").default("Siap Kirim"),
  transactionStatus: z.string().trim().default("Belum Dibayar"),
  vehicleName: z.string().trim().default(""),
  vehicleType: z.string().trim().default(""),
  vehicleCode: z.string().trim().default(""),
  vehicleCapacityKg: z.coerce.number().nonnegative().default(0),
  vehicleStatus: z.string().trim().default("Siap Jalan"),
});

const cargoQuickUpdateSchema = z.object({
  shipmentStatus: z.enum(shipmentStatusOptions),
  shippingPrice: z.coerce.number().nonnegative("Harga atau tarif tidak boleh negatif."),
  description: z.string().trim().default(""),
  transactionStatus: z.string().trim().default("Belum Dibayar"),
});

export type AdminCargoCreateInput = z.infer<typeof cargoCreateSchema>;
export type AdminCargoQuickUpdateInput = z.infer<typeof cargoQuickUpdateSchema>;

function buildTrackingNumber(transportMode: string) {
  const prefixMap: Record<string, string> = {
    Laut: "LUT",
  };
  const prefix = prefixMap[transportMode] ?? "CRG";
  const timestamp = Date.now().toString().slice(-10);
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${timestamp}-${suffix}`;
}

function mapCargoRows(rows: any[]): CargoRecord[] {
  return rows.map((row) => ({
    id: Number(row.id),
    trackingNumber: String(row.no_resi),
    shippingDate: row.tanggal_kirim ? String(row.tanggal_kirim).slice(0, 10) : "",
    senderName: String(row.nama_pengirim),
    recipientName: String(row.nama_penerima),
    phone: String(row.no_telepon),
    originCity: String(row.kota_asal),
    destinationCity: String(row.kota_tujuan),
    itemName: String(row.nama_barang),
    itemType: String(row.jenis_barang),
    itemWeightKg: Number(row.berat_barang_kg),
    shippingPrice: Number(row.harga ?? 0),
    transportMode: row.moda_pengiriman ?? "Laut",
    deliveryType: row.jenis_pengiriman ?? "Biasa",
    shipmentStatus: String(row.status_pengiriman),
    itemStatus: String(row.status_barang ?? "Siap Kirim"),
    transactionStatus: String(row.status_transaksi ?? "Belum Dibayar"),
    description: String(row.deskripsi ?? ""),
    vehicleName: String(row.nama_kendaraan ?? ""),
    vehicleType: String(row.jenis_kendaraan ?? ""),
    vehicleCode: String(row.kode_kendaraan ?? ""),
    vehicleCapacityKg: Number(row.kapasitas_kendaraan_kg ?? 0),
    vehicleStatus: String(row.status_kendaraan ?? ""),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : "",
  }));
}

async function fetchCargoByIdWithClient(sql: SqlClient, id: number) {
  const rows = await sql`
    SELECT
      b.id,
      b.no_resi,
      b.tanggal_kirim,
      b.nama_pengirim,
      b.nama_penerima,
      b.no_telepon,
      b.kota_asal,
      b.kota_tujuan,
      b.nama_barang,
      b.jenis_barang,
      b.berat_barang_kg,
      b.moda_pengiriman,
      b.jenis_kendaraan,
      b.nama_kendaraan,
      b.kode_kendaraan,
      b.kapasitas_kendaraan_kg,
      b.status_kendaraan,
      b.jenis_pengiriman,
      b.status_pengiriman,
      b.status_barang,
      b.deskripsi,
      b.created_at,
      b.updated_at,
      t.harga,
      t.status_transaksi
    FROM barang b
    LEFT JOIN transaksi t ON t.barang_id = b.id
    WHERE b.id = ${id}
      AND COALESCE(b.moda_pengiriman, 'Laut') = 'Laut'
    LIMIT 1
  `;

  return mapCargoRows(rows)[0] ?? null;
}

function isFullUpdatePayload(
  payload: CargoFormData | Record<string, unknown>,
): payload is CargoFormData | Record<string, unknown> {
  return typeof payload === "object" && payload !== null && "shippingDate" in payload;
}

export async function ensureAdminCargoSchema() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS barang (
      id SERIAL PRIMARY KEY,
      no_resi VARCHAR(50) NOT NULL UNIQUE,
      tanggal_kirim DATE NOT NULL,
      nama_pengirim VARCHAR(120) NOT NULL,
      nama_penerima VARCHAR(120) NOT NULL,
      no_telepon VARCHAR(30) NOT NULL,
      kota_asal VARCHAR(120) NOT NULL,
      kota_tujuan VARCHAR(120) NOT NULL,
      nama_barang VARCHAR(120) NOT NULL,
      jenis_barang VARCHAR(120) NOT NULL,
      berat_barang_kg NUMERIC(12, 2) NOT NULL,
      moda_pengiriman VARCHAR(20) NOT NULL,
      jenis_kendaraan VARCHAR(120) NOT NULL,
      nama_kendaraan VARCHAR(120) NOT NULL DEFAULT '',
      kode_kendaraan VARCHAR(80) NOT NULL DEFAULT '',
      kapasitas_kendaraan_kg NUMERIC(12, 2) NOT NULL DEFAULT 0,
      status_kendaraan VARCHAR(40) NOT NULL DEFAULT 'Siap Jalan',
      jenis_pengiriman VARCHAR(20) NOT NULL,
      status_pengiriman VARCHAR(40) NOT NULL,
      status_barang VARCHAR(40) NOT NULL DEFAULT 'Siap Kirim',
      deskripsi TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE barang
    ADD COLUMN IF NOT EXISTS no_resi VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS tanggal_kirim DATE,
    ADD COLUMN IF NOT EXISTS nama_pengirim VARCHAR(120),
    ADD COLUMN IF NOT EXISTS nama_penerima VARCHAR(120),
    ADD COLUMN IF NOT EXISTS no_telepon VARCHAR(30),
    ADD COLUMN IF NOT EXISTS kota_asal VARCHAR(120),
    ADD COLUMN IF NOT EXISTS kota_tujuan VARCHAR(120),
    ADD COLUMN IF NOT EXISTS nama_barang VARCHAR(120),
    ADD COLUMN IF NOT EXISTS jenis_barang VARCHAR(120),
    ADD COLUMN IF NOT EXISTS berat_barang_kg NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS moda_pengiriman VARCHAR(20),
    ADD COLUMN IF NOT EXISTS jenis_kendaraan VARCHAR(120),
    ADD COLUMN IF NOT EXISTS nama_kendaraan VARCHAR(120) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS kode_kendaraan VARCHAR(80) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS kapasitas_kendaraan_kg NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status_kendaraan VARCHAR(40) NOT NULL DEFAULT 'Siap Jalan',
    ADD COLUMN IF NOT EXISTS jenis_pengiriman VARCHAR(20),
    ADD COLUMN IF NOT EXISTS status_pengiriman VARCHAR(40),
    ADD COLUMN IF NOT EXISTS status_barang VARCHAR(40) NOT NULL DEFAULT 'Siap Kirim',
    ADD COLUMN IF NOT EXISTS deskripsi TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transaksi (
      id SERIAL PRIMARY KEY,
      barang_id INTEGER NOT NULL UNIQUE REFERENCES barang(id) ON DELETE CASCADE,
      harga NUMERIC(12, 2) NOT NULL,
      status_transaksi VARCHAR(40) NOT NULL DEFAULT 'Belum Dibayar',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE transaksi
    ADD COLUMN IF NOT EXISTS barang_id INTEGER UNIQUE,
    ADD COLUMN IF NOT EXISTS harga NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS status_transaksi VARCHAR(40) NOT NULL DEFAULT 'Belum Dibayar',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `;

  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'transaksi_barang_id_fkey'
          AND table_name = 'transaksi'
      ) THEN
        ALTER TABLE transaksi
        ADD CONSTRAINT transaksi_barang_id_fkey
        FOREIGN KEY (barang_id) REFERENCES barang(id) ON DELETE CASCADE;
      END IF;
    END $$;
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS barang_no_resi_idx ON barang (no_resi)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS barang_nama_pengirim_idx ON barang (nama_pengirim)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS barang_nama_penerima_idx ON barang (nama_penerima)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS barang_nama_barang_idx ON barang (nama_barang)
  `;
}

export async function fetchAdminCargoRecords(query = "") {
  await ensureAdminCargoSchema();
  const sql = getSql();
  const trimmedQuery = query.trim();

  const rows =
    trimmedQuery.length === 0
      ? await sql`
          SELECT
            b.id,
            b.no_resi,
            b.tanggal_kirim,
            b.nama_pengirim,
            b.nama_penerima,
            b.no_telepon,
            b.kota_asal,
            b.kota_tujuan,
            b.nama_barang,
            b.jenis_barang,
            b.berat_barang_kg,
            b.moda_pengiriman,
            b.jenis_kendaraan,
            b.nama_kendaraan,
            b.kode_kendaraan,
            b.kapasitas_kendaraan_kg,
            b.status_kendaraan,
            b.jenis_pengiriman,
            b.status_pengiriman,
            b.status_barang,
            b.deskripsi,
            b.created_at,
            b.updated_at,
            t.harga,
            t.status_transaksi
          FROM barang b
          LEFT JOIN transaksi t ON t.barang_id = b.id
          WHERE COALESCE(b.moda_pengiriman, 'Laut') = 'Laut'
          ORDER BY b.created_at DESC, b.id DESC
        `
      : await sql`
          SELECT
            b.id,
            b.no_resi,
            b.tanggal_kirim,
            b.nama_pengirim,
            b.nama_penerima,
            b.no_telepon,
            b.kota_asal,
            b.kota_tujuan,
            b.nama_barang,
            b.jenis_barang,
            b.berat_barang_kg,
            b.moda_pengiriman,
            b.jenis_kendaraan,
            b.nama_kendaraan,
            b.kode_kendaraan,
            b.kapasitas_kendaraan_kg,
            b.status_kendaraan,
            b.jenis_pengiriman,
            b.status_pengiriman,
            b.status_barang,
            b.deskripsi,
            b.created_at,
            b.updated_at,
            t.harga,
            t.status_transaksi
          FROM barang b
          LEFT JOIN transaksi t ON t.barang_id = b.id
          WHERE
            COALESCE(b.moda_pengiriman, 'Laut') = 'Laut'
            AND (
              b.no_resi ILIKE ${`%${trimmedQuery}%`} OR
              b.nama_pengirim ILIKE ${`%${trimmedQuery}%`} OR
              b.nama_penerima ILIKE ${`%${trimmedQuery}%`} OR
              b.nama_barang ILIKE ${`%${trimmedQuery}%`}
            )
          ORDER BY b.created_at DESC, b.id DESC
        `;

  return mapCargoRows(rows);
}

export async function fetchAdminCargoSummary() {
  await ensureAdminCargoSchema();
  const sql = getSql();

  const rows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE COALESCE(b.moda_pengiriman, 'Laut') = 'Laut')::INT AS total_shipments,
      COUNT(*) FILTER (WHERE COALESCE(b.moda_pengiriman, 'Laut') = 'Laut')::INT AS sea_shipments,
      COUNT(*) FILTER (
        WHERE COALESCE(b.moda_pengiriman, 'Laut') = 'Laut'
          AND b.status_pengiriman IN ('Sampai Tujuan', 'Selesai')
      )::INT AS completed_shipments,
      COALESCE(SUM(t.harga) FILTER (WHERE COALESCE(b.moda_pengiriman, 'Laut') = 'Laut'), 0)::NUMERIC AS total_revenue
    FROM barang b
    LEFT JOIN transaksi t ON t.barang_id = b.id
  `;

  const row = rows[0];

  return {
    totalShipments: Number(row?.total_shipments ?? 0),
    landShipments: 0,
    airShipments: 0,
    seaShipments: Number(row?.sea_shipments ?? 0),
    completedShipments: Number(row?.completed_shipments ?? 0),
    totalRevenue: Number(row?.total_revenue ?? 0),
  } satisfies CargoSummary;
}

export async function createAdminCargoRecord(
  payload: CargoFormData | Record<string, unknown>,
) {
  await ensureAdminCargoSchema();
  const data = cargoCreateSchema.parse(payload);
  const sql = getSql();

  return sql.begin(async (transactionSql) => {
    const trackingNumber = buildTrackingNumber("Laut");

    const barangRows = await transactionSql`
      INSERT INTO barang (
        no_resi,
        tanggal_kirim,
        nama_pengirim,
        nama_penerima,
        no_telepon,
        kota_asal,
        kota_tujuan,
        nama_barang,
        jenis_barang,
        berat_barang_kg,
        moda_pengiriman,
        jenis_kendaraan,
        nama_kendaraan,
        kode_kendaraan,
        kapasitas_kendaraan_kg,
        status_kendaraan,
        jenis_pengiriman,
        status_pengiriman,
        status_barang,
        deskripsi,
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
        ${data.itemName},
        ${data.itemType},
        ${data.itemWeightKg},
        ${"Laut"},
        ${data.vehicleType},
        ${data.vehicleName},
        ${data.vehicleCode},
        ${data.vehicleCapacityKg},
        ${data.vehicleStatus},
        ${data.deliveryType},
        ${data.shipmentStatus},
        ${data.itemStatus},
        ${data.description},
        NOW()
      )
      RETURNING id
    `;

    const barangId = Number(barangRows[0].id);

    await transactionSql`
      INSERT INTO transaksi (
        barang_id,
        harga,
        status_transaksi,
        updated_at
      )
      VALUES (
        ${barangId},
        ${data.shippingPrice},
        ${data.transactionStatus},
        NOW()
      )
    `;

    return fetchCargoByIdWithClient(transactionSql, barangId);
  });
}

export async function updateAdminCargoRecord(
  id: number,
  payload: CargoFormData | Record<string, unknown>,
) {
  await ensureAdminCargoSchema();
  const sql = getSql();

  return sql.begin(async (transactionSql) => {
    const existingRows = await transactionSql`
      SELECT id
      FROM barang
      WHERE id = ${id}
      LIMIT 1
    `;

    if (existingRows.length === 0) {
      return null;
    }

    if (isFullUpdatePayload(payload)) {
      const data = cargoCreateSchema.parse(payload);

      await transactionSql`
        UPDATE barang
        SET
          tanggal_kirim = ${data.shippingDate},
          nama_pengirim = ${data.senderName},
          nama_penerima = ${data.recipientName},
          no_telepon = ${data.phone},
          kota_asal = ${data.originCity},
          kota_tujuan = ${data.destinationCity},
          nama_barang = ${data.itemName},
          jenis_barang = ${data.itemType},
          berat_barang_kg = ${data.itemWeightKg},
          moda_pengiriman = ${"Laut"},
          jenis_kendaraan = ${data.vehicleType},
          nama_kendaraan = ${data.vehicleName},
          kode_kendaraan = ${data.vehicleCode},
          kapasitas_kendaraan_kg = ${data.vehicleCapacityKg},
          status_kendaraan = ${data.vehicleStatus},
          jenis_pengiriman = ${data.deliveryType},
          status_pengiriman = ${data.shipmentStatus},
          status_barang = ${data.itemStatus},
          deskripsi = ${data.description},
          updated_at = NOW()
        WHERE id = ${id}
      `;

      await transactionSql`
        INSERT INTO transaksi (
          barang_id,
          harga,
          status_transaksi,
          updated_at
        )
        VALUES (
          ${id},
          ${data.shippingPrice},
          ${data.transactionStatus},
          NOW()
        )
        ON CONFLICT (barang_id)
        DO UPDATE SET
          harga = EXCLUDED.harga,
          status_transaksi = EXCLUDED.status_transaksi,
          updated_at = NOW()
      `;
    } else {
      const data = cargoQuickUpdateSchema.parse(payload);

      await transactionSql`
        UPDATE barang
        SET
          status_pengiriman = ${data.shipmentStatus},
          deskripsi = ${data.description},
          updated_at = NOW()
        WHERE id = ${id}
      `;

      await transactionSql`
        INSERT INTO transaksi (
          barang_id,
          harga,
          status_transaksi,
          updated_at
        )
        VALUES (
          ${id},
          ${data.shippingPrice},
          ${data.transactionStatus},
          NOW()
        )
        ON CONFLICT (barang_id)
        DO UPDATE SET
          harga = EXCLUDED.harga,
          status_transaksi = EXCLUDED.status_transaksi,
          updated_at = NOW()
      `;
    }

    return fetchCargoByIdWithClient(transactionSql, id);
  });
}

export async function deleteAdminCargoRecord(id: number) {
  await ensureAdminCargoSchema();
  const sql = getSql();

  const deletedRows = await sql`
    DELETE FROM barang
    WHERE id = ${id}
    RETURNING id
  `;

  return deletedRows.length > 0;
}

export async function fetchAdminCargoRecordById(id: number) {
  await ensureAdminCargoSchema();
  const sql = getSql();
  return fetchCargoByIdWithClient(sql, id);
}

