import { z } from "zod";
import { getSql } from "@/app/lib/db";
import {
  deliveryTypeOptions,
  shipmentStatusOptions,
  itemStatusOptions,
  transactionStatusOptions,
  vehicleStatusOptions,
  type CargoFormData,
  type CargoRecord,
  type CargoSummary,
} from "@/app/lib/cargo-types";

type SqlClient = ReturnType<typeof getSql>;

// =========================================================================
// 1. SKEMA VALIDASI ZOD 
// =========================================================================
const cargoCreateSchema = z.object({
  shippingDate: z.string().min(1, "Tanggal kirim wajib diisi."),
  senderName: z.string().trim().min(2, "Nama pengirim wajib diisi."),
  recipientName: z.string().trim().min(2, "Nama penerima wajib diisi."),
  
  // Sudah aman (Abaikan jika kosong dari client)
  phone: z.string().trim().default(""),
  itemType: z.string().trim().default(""),
  
  originCity: z.string().trim().min(2, "Kota asal wajib diisi."),
  destinationCity: z.string().trim().min(2, "Kota tujuan wajib diisi."),
  itemName: z.string().trim().min(2, "Nama barang wajib diisi."),
  itemWeightKg: z.coerce.number().positive("Berat barang harus lebih dari 0."),
  shippingPrice: z.coerce.number().default(0), 
  deliveryType: z.enum(deliveryTypeOptions),
  shipmentStatus: z.enum(shipmentStatusOptions),
  description: z.string().trim().default(""),
  transportMode: z.enum(["Darat", "Udara", "Laut"]).default("Laut"),
  itemStatus: z.enum(itemStatusOptions).default("Siap Kirim"),
  transactionStatus: z.enum(transactionStatusOptions).default("Lunas"),
  
  vehicleName: z.string().trim().default(""), 
  vehicleType: z.string().trim().default("Kapal Kargo"),
  vehicleCode: z.string().trim().default(""),
  vehicleCapacityKg: z.coerce.number().nonnegative().default(0),
  vehicleStatus: z.enum(vehicleStatusOptions).default("Siap Jalan"),
});

const cargoQuickUpdateSchema = z.object({
  shipmentStatus: z.enum(shipmentStatusOptions),
  description: z.string().trim().default(""),
  transactionStatus: z.enum(transactionStatusOptions).default("Lunas"),
});

export type AdminCargoCreateInput = z.infer<typeof cargoCreateSchema>;
export type AdminCargoQuickUpdateInput = z.infer<typeof cargoQuickUpdateSchema>;

// =========================================================================
// 2. MAPPING DATA DARI DATABASE KE TYPESCRIPT (Strict Type Casted)
// =========================================================================
function mapCargoRows(rows: any[]): CargoRecord[] {
  return rows.map((row) => ({
    id: Number(row.id),
    trackingNumber: String(row.no_resi),
    shippingDate: row.tanggal_kirim ? String(row.tanggal_kirim).slice(0, 10) : "",
    senderName: String(row.nama_pengirim),
    recipientName: String(row.nama_penerima),
    phone: String(row.no_telepon ?? ""),
    originCity: String(row.negara_asal ?? ""),
    destinationCity: String(row.negara_tujuan ?? ""),
    itemName: String(row.nama_barang),
    itemType: String(row.jenis_barang ?? ""),
    itemWeightKg: Number(row.berat_barang_kg),
    shippingPrice: Number(row.harga ?? 0),
    transportMode: (row.moda_pengiriman ?? "Laut") as "Darat" | "Udara" | "Laut",
    deliveryType: (row.jenis_pengiriman ?? "Biasa") as "Biasa" | "Cepat" | "Vvip",
    shipmentStatus: String(row.status_pengiriman),
    itemStatus: String(row.status_barang ?? "Siap Kirim"),
    transactionStatus: String(row.status_transaksi ?? "Lunas"),
    description: String(row.deskripsi ?? ""),
    vehicleName: String(row.nama_kendaraan ?? ""),
    vehicleType: String(row.jenis_kendaraan ?? ""),
    vehicleCode: String(row.kode_kendaraan ?? ""),
    itemPrice: 0, 
    vehicleCapacityKg: Number(row.kapasitas_kendaraan_kg ?? 0),
    vehicleStatus: String(row.status_kendaraan ?? ""),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : "", 
  }));
}

async function fetchCargoByIdWithClient(sql: SqlClient, id: number) {
  const rows = await sql`
    SELECT
      b.id, b.no_resi, b.tanggal_kirim, b.nama_pengirim, b.nama_penerima, b.no_telepon,
      b.negara_asal, b.negara_tujuan, b.nama_barang, b.jenis_barang, b.berat_barang_kg,
      b.moda_pengiriman, b.jenis_kendaraan, b.nama_kendaraan, b.kode_kendaraan,
      b.kapasitas_kendaraan_kg, b.status_kendaraan, b.jenis_pengiriman, b.status_pengiriman,
      b.status_barang, b.deskripsi, b.created_at, b.updated_at,
      t.harga, t.status_transaksi
    FROM barang b
    LEFT JOIN transaksi t ON t.barang_id = b.id
    WHERE b.id = ${id} AND COALESCE(b.moda_pengiriman, 'Laut') = 'Laut'
    LIMIT 1
  `;
  return mapCargoRows(rows)[0] ?? null;
}

function isFullUpdatePayload(payload: any): payload is CargoFormData {
  return typeof payload === "object" && payload !== null && "shippingDate" in payload;
}

// =========================================================================
// 3. FUNGSI UTAMA DATABASE (CRUD & QUERY)
// =========================================================================
export async function ensureAdminCargoSchema() {
  const sql = getSql();
  
  await sql`
    CREATE TABLE IF NOT EXISTS barang (
      id SERIAL PRIMARY KEY,
      no_resi VARCHAR(50) NOT NULL UNIQUE,
      tanggal_kirim DATE NOT NULL,
      nama_pengirim VARCHAR(120) NOT NULL,
      nama_penerima VARCHAR(120) NOT NULL,
      no_telepon VARCHAR(30) NOT NULL DEFAULT '',
      negara_asal VARCHAR(120) NOT NULL,
      negara_tujuan VARCHAR(120) NOT NULL,
      nama_barang VARCHAR(120) NOT NULL,
      jenis_barang VARCHAR(120) NOT NULL DEFAULT '',
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
    CREATE TABLE IF NOT EXISTS transaksi (
      id SERIAL PRIMARY KEY,
      barang_id INT NOT NULL,
      harga NUMERIC(12, 2) NOT NULL DEFAULT 0,
      status_transaksi VARCHAR(40) NOT NULL DEFAULT 'Belum Dibayar',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
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
}

export async function fetchAdminCargoRecords(query = "") {
  await ensureAdminCargoSchema();
  const sql = getSql();
  const trimmedQuery = query.trim();

  const rows = trimmedQuery.length === 0
    ? await sql`
        SELECT b.*, t.harga, t.status_transaksi FROM barang b
        LEFT JOIN transaksi t ON t.barang_id = b.id
        WHERE COALESCE(b.moda_pengiriman, 'Laut') = 'Laut'
        ORDER BY b.created_at DESC, b.id DESC`
    : await sql`
        SELECT b.*, t.harga, t.status_transaksi FROM barang b
        LEFT JOIN transaksi t ON t.barang_id = b.id
        WHERE COALESCE(b.moda_pengiriman, 'Laut') = 'Laut'
          AND (b.no_resi ILIKE ${`%${trimmedQuery}%`} OR b.nama_pengirim ILIKE ${`%${trimmedQuery}%`} OR b.nama_penerima ILIKE ${`%${trimmedQuery}%`})
        ORDER BY b.created_at DESC, b.id DESC`;

  return mapCargoRows(rows);
}

export async function fetchAdminCargoSummary() {
  const sql = getSql();
  const rows = await sql`
    SELECT 
      COUNT(*)::INT AS total_shipments,
      COUNT(*) FILTER (WHERE b.status_pengiriman IN ('Sampai Tujuan', 'Selesai'))::INT AS completed_shipments,
      COALESCE(SUM(t.harga), 0)::INT AS total_revenue
    FROM barang b
    LEFT JOIN transaksi t ON t.barang_id = b.id
    WHERE COALESCE(b.moda_pengiriman, 'Laut') = 'Laut'`;

  return {
    totalShipments: rows[0]?.total_shipments ?? 0,
    landShipments: 0, 
    airShipments: 0,
    seaShipments: rows[0]?.total_shipments ?? 0,
    completedShipments: rows[0]?.completed_shipments ?? 0,
    totalRevenue: rows[0]?.total_revenue ?? 0 
  } satisfies CargoSummary;
}

export async function createAdminCargoRecord(payload: any) {
  const sql = getSql();
  const data = cargoCreateSchema.parse(payload);
  const trackingNumber = `CRG-${Math.floor(10000000 + Math.random() * 90000000)}`;

  return sql.begin(async (transactionSql) => {
    const inserted = await transactionSql`
      INSERT INTO barang (
        no_resi, tanggal_kirim, nama_pengirim, nama_penerima, no_telepon,
        negara_asal, negara_tujuan, nama_barang, jenis_barang, berat_barang_kg,
        moda_pengiriman, jenis_pengiriman, jenis_kendaraan, nama_kendaraan, 
        kode_kendaraan, kapasitas_kendaraan_kg, status_kendaraan, status_pengiriman,
        status_barang, deskripsi
      ) VALUES (
        ${trackingNumber}, ${data.shippingDate}, ${data.senderName}, ${data.recipientName}, ${data.phone},
        ${data.originCity}, ${data.destinationCity}, ${data.itemName}, ${data.itemType}, ${data.itemWeightKg},
        'Laut', ${data.deliveryType}, ${data.vehicleType}, ${data.vehicleName}, 
        ${data.vehicleCode}, ${data.vehicleCapacityKg}, ${data.vehicleStatus}, ${data.shipmentStatus},
        ${data.itemStatus}, ${data.description}
      ) RETURNING id
    `;
    
    await transactionSql`
      INSERT INTO transaksi (barang_id, harga, status_transaksi)
      VALUES (${inserted[0].id}, ${data.shippingPrice}, ${data.transactionStatus})
    `;

    await transactionSql`
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
        ${trackingNumber},
        ${data.deliveryType},
        ${data.destinationCity},
        14.5995,
        120.9842,
        ${data.vehicleName || "Serena Cargo Vessel"},
        NOW()
      )
      ON CONFLICT (id)
      DO UPDATE SET
        destination = EXCLUDED.destination,
        vessel_name = EXCLUDED.vessel_name,
        updated_at = NOW()
    `;

    return fetchCargoByIdWithClient(transactionSql, inserted[0].id);
  });
}

export async function updateAdminCargoRecord(id: number, payload: any) {
  const sql = getSql();
  return sql.begin(async (transactionSql) => {
    if (isFullUpdatePayload(payload)) {
      const data = cargoCreateSchema.parse(payload);
      const updatedCargo = await transactionSql`
        UPDATE barang SET
          tanggal_kirim = ${data.shippingDate}, nama_pengirim = ${data.senderName}, nama_penerima = ${data.recipientName},
          no_telepon = ${data.phone}, negara_asal = ${data.originCity}, negara_tujuan = ${data.destinationCity},
          nama_barang = ${data.itemName}, jenis_barang = ${data.itemType}, berat_barang_kg = ${data.itemWeightKg},
          jenis_pengiriman = ${data.deliveryType}, nama_kendaraan = ${data.vehicleName}, kode_kendaraan = ${data.vehicleCode}, 
          jenis_kendaraan = ${data.vehicleType}, kapasitas_kendaraan_kg = ${data.vehicleCapacityKg}, status_kendaraan = ${data.vehicleStatus},
          status_pengiriman = ${data.shipmentStatus}, status_barang = ${data.itemStatus}, deskripsi = ${data.description}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id
      `;

      if (updatedCargo.length === 0) {
        return null;
      }

      const updatedTransactions = await transactionSql`
        UPDATE transaksi SET
          harga = ${data.shippingPrice},
          status_transaksi = ${data.transactionStatus},
          updated_at = NOW()
        WHERE barang_id = ${id}
        RETURNING id
      `;

      if (updatedTransactions.length === 0) {
        await transactionSql`
          INSERT INTO transaksi (barang_id, harga, status_transaksi)
          VALUES (${id}, ${data.shippingPrice}, ${data.transactionStatus})
        `;
      }

      await transactionSql`
        INSERT INTO tracking_packages (
          id,
          package_size,
          destination,
          lat,
          lng,
          vessel_name,
          updated_at
        )
        SELECT
          b.no_resi,
          ${data.deliveryType},
          ${data.destinationCity},
          COALESCE(tp.lat, 14.5995),
          COALESCE(tp.lng, 120.9842),
          ${data.vehicleName || "Serena Cargo Vessel"},
          NOW()
        FROM barang b
        LEFT JOIN tracking_packages tp ON tp.id = b.no_resi
        WHERE b.id = ${id}
        ON CONFLICT (id)
        DO UPDATE SET
          destination = EXCLUDED.destination,
          vessel_name = EXCLUDED.vessel_name,
          updated_at = NOW()
    `;
    } else {
      const data = cargoQuickUpdateSchema.parse(payload);
      const updatedCargo = await transactionSql`
        UPDATE barang SET
          status_pengiriman = ${data.shipmentStatus},
          deskripsi = ${data.description},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id
      `;

      if (updatedCargo.length === 0) {
        return null;
      }

      const updatedTransactions = await transactionSql`
        UPDATE transaksi SET
          status_transaksi = ${data.transactionStatus},
          updated_at = NOW()
        WHERE barang_id = ${id}
        RETURNING id
      `;

      if (updatedTransactions.length === 0) {
        await transactionSql`
          INSERT INTO transaksi (barang_id, harga, status_transaksi)
          VALUES (${id}, 0, ${data.transactionStatus})
        `;
      }
    }
    return fetchCargoByIdWithClient(transactionSql, id);
  });
}

export async function deleteAdminCargoRecord(id: number) {
  const sql = getSql();
  return sql.begin(async (transactionSql) => {
    await transactionSql`DELETE FROM transaksi WHERE barang_id = ${id}`;
    const rows = await transactionSql`DELETE FROM barang WHERE id = ${id} RETURNING no_resi`;
    if (rows[0]?.no_resi) {
      await transactionSql`DELETE FROM tracking_packages WHERE id = ${String(rows[0].no_resi)}`;
    }
    return rows.length > 0;
  });
}

export async function fetchAdminCargoRecordById(id: number) {
  await ensureAdminCargoSchema();
  const sql = getSql();
  return fetchCargoByIdWithClient(sql, id);
}
