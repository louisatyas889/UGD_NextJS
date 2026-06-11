import { NextResponse } from "next/server";
import { getSql } from "@/app/lib/db";

export const dynamic = "force-dynamic";

/**
 * Mengambil data cargo (barang) yang dimiliki oleh customer berdasarkan:
 * - Customer name (nama_pengirim) dicocokkan dengan customer.name
 * - Customer phone (no_telepon) dicocokkan dengan customer.phone
 * - Customer email (email) dicocokkan dengan customer.email
 * Catatan: Sistem saat ini tidak memiliki foreign key antara customers dan barang,
 * sehingga pencocokan dilakukan berdasarkan nama pengirim dan nomor telepon.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerName = (searchParams.get("name") ?? "").trim();
    const customerPhone = (searchParams.get("phone") ?? "").trim();
    const customerEmail = (searchParams.get("email") ?? "").trim();

    if (!customerName && !customerPhone && !customerEmail) {
      return NextResponse.json(
        { message: "Minimal salah satu parameter (name, phone, email) harus diisi." },
        { status: 400 }
      );
    }

    const sql = getSql();

    // Bangun kondisi WHERE dinamis berdasarkan parameter yang tersedia
    const conditions: string[] = [];
    if (customerName) {
      conditions.push(`(LOWER(TRIM(b.nama_pengirim)) = LOWER(TRIM($${1})) OR LOWER(TRIM(b.nama_pengirim)) LIKE LOWER(TRIM($${2})))`);
    }
    if (customerPhone) {
      conditions.push(`(b.no_telepon = $${3} OR b.no_telepon LIKE $${4})`);
    }

    const whereClause = conditions.length > 0 ? `AND (${conditions.join(" OR ")})` : "";

    // Query utama: ambil data barang milik customer
    const rows = await sql.unsafe(`
      SELECT
        b.id,
        b.no_resi,
        b.tanggal_kirim,
        b.nama_pengirim,
        b.nama_penerima,
        b.no_telepon,
        b.negara_asal,
        b.negara_tujuan,
        b.nama_barang,
        b.jenis_barang,
        b.berat_barang_kg,
        b.status_pengiriman,
        b.status_barang,
        b.moda_pengiriman,
        b.jenis_pengiriman,
        b.nama_kendaraan,
        t.harga,
        t.status_transaksi
      FROM barang b
      LEFT JOIN transaksi t ON t.barang_id = b.id
      WHERE COALESCE(b.moda_pengiriman, 'Laut') = 'Laut'
        ${whereClause}
      ORDER BY b.created_at DESC, b.id DESC
    `,
      customerName ? [customerName, `%${customerName}%`, customerPhone, `%${customerPhone}%`]
                    : [customerName || "", `%${customerName}%`, customerPhone, `%${customerPhone}%`]
    );

    // Transform hasil ke format yang lebih clean untuk frontend
    const records = rows.map((row: any) => ({
      id: Number(row.id),
      no_resi: String(row.no_resi),
      tanggal_kirim: row.tanggal_kirim ? String(row.tanggal_kirim).slice(0, 10) : "",
      nama_pengirim: String(row.nama_pengirim),
      nama_penerima: String(row.nama_penerima),
      no_telepon: String(row.no_telepon ?? ""),
      negara_asal: String(row.negara_asal ?? ""),
      negara_tujuan: String(row.negara_tujuan ?? ""),
      nama_barang: String(row.nama_barang),
      jenis_barang: String(row.jenis_barang ?? ""),
      berat: Number(row.berat_barang_kg),
      harga: Number(row.harga ?? 0),
      status_pengiriman: String(row.status_pengiriman ?? ""),
      status_barang: String(row.status_barang ?? "Siap Kirim"),
      status_transaksi: String(row.status_transaksi ?? "Lunas"),
      moda_pengiriman: String(row.moda_pengiriman ?? "Laut"),
      jenis_pengiriman: String(row.jenis_pengiriman ?? "Cepat"),
      nama_kendaraan: String(row.nama_kendaraan ?? ""),
    }));

    // Hitung ringkasan untuk customer
    const summary = {
      totalShipments: records.length,
      completedShipments: records.filter((r: any) =>
        r.status_pengiriman?.toLowerCase().includes("sampai") ||
        r.status_pengiriman?.toLowerCase().includes("selesai")
      ).length,
      totalSpent: records.reduce((sum: number, r: any) => sum + r.harga, 0),
    };

    return NextResponse.json({
      records,
      summary,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
      },
    });
  } catch (error) {
    console.error("GET /api/customer-cargo error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data cargo customer dari database." },
      { status: 500 }
    );
  }
}
