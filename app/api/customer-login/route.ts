import { NextResponse } from 'next/server';
import { getSql } from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Toleransi Ganda: Membaca key Inggris maupun Indonesia dari landing page
    const name = body.name || body.nama;
    const email = body.email;
    const phone = body.phone || body.telepon || body.noHp || body.phone_number;
    const address = body.address || body.alamat;

    // Validasi input dasar
    if (!name || !email) {
      return NextResponse.json(
        { error: "Nama dan Email wajib diisi!" },
        { status: 400 }
      );
    }

    const sql = getSql();

    // 2. Membuat ID cadangan jika ini adalah customer baru
    const generatedCustomerId = `SS-${Math.floor(200 + Math.random() * 700)}`;

    // 3. Jalankan Query Upsert (Insert atau Update jika Email sudah ada)
    // CATATAN: Kolom 'email' di tabel database Anda WAJIB memiliki aturan UNIQUE constraint!
    await sql`
      INSERT INTO customers (id, name, email, phone_number, address)
      VALUES (${generatedCustomerId}, ${name}, ${email}, ${phone || null}, ${address || null})
      ON CONFLICT (email) 
      DO UPDATE SET name = ${name}, phone_number = ${phone || null}, address = ${address || null};
    `;

    // 4. Ambil data ID yang sebenarnya dari database (mencegah salah ID saat login ulang)
    const exactCustomer = await sql`
      SELECT id, name, email FROM customers WHERE email = ${email} LIMIT 1;
    `;
    const finalCustomer = exactCustomer[0];

    // 5. Kembalikan response sukses ke frontend
    return NextResponse.json({ 
      success: true,
      message: "Customer berhasil diautentikasi!", 
      id: finalCustomer ? String(finalCustomer.id) : generatedCustomerId
    });

  } catch (error: any) {
    console.error("Database Error Detail:", error);
    
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan internal pada server database." },
      { status: 500 }
    );
  }
}
