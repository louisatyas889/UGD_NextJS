"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// --- INTERFACES PORTAL CUSTOMER ---
interface CustomerSession {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  password?: string;
}

interface CustomerCargo {
  id: number;
  no_resi: string;
  tanggal_kirim: string;
  nama_pengirim: string;
  nama_penerima: string;
  no_telepon: string;
  negara_asal: string;
  negara_tujuan: string;
  nama_barang: string;
  jenis_barang: string;
  berat: number;
  harga: number;
  status_pengiriman: string;
  status_barang: string;
  status_transaksi: string;
  moda_pengiriman: string;
  jenis_pengiriman: string;
  nama_kendaraan: string;
}

interface CustomerSummary {
  totalShipments: number;
  completedShipments: number;
  totalSpent: number;
}

export default function ProfilCustomerPage() {
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [cargoRecords, setCargoRecords] = useState<CustomerCargo[]>([]);
  const [summary, setSummary] = useState<CustomerSummary>({
    totalShipments: 0,
    completedShipments: 0,
    totalSpent: 0,
  });
  const [isLoadingCargo, setIsLoadingCargo] = useState<boolean>(true);
  const [hasCheckedSession, setHasCheckedSession] = useState<boolean>(false);

  // State Input Form (Hanya Nama dan No Telp yang bisa diedit)
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>("");
  const [editedPhone, setEditedPhone] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<string>("");

  // 1. Ambil Sesi Login Customer
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSession = localStorage.getItem("serena_customer_session");
      if (savedSession) {
        try {
          const parsed: CustomerSession = JSON.parse(savedSession);
          setCustomer(parsed);
          setEditedName(parsed.name || "");
          setEditedPhone(parsed.phone || "");
        } catch (e) {
          console.error("Gagal parse session customer:", e);
          setCustomer(null);
        }
      } else {
        setCustomer(null);
      }
      setIsLoadingCargo(false);
      setHasCheckedSession(true);
    }
  }, []);

  // 2. Tarik Data Riwayat Pengiriman Customer dari API customer-cargo
  const fetchLiveCargoHistory = useCallback(async (sessionData: CustomerSession) => {
    setIsLoadingCargo(true);
    try {
      const params = new URLSearchParams();
      // Backend customer-cargo hanya pakai name & phone untuk pencocokan.
      // Supaya tidak kosong/berubah, prioritaskan phone + fallback name.
      if (sessionData.phone) params.append("phone", sessionData.phone);
      if (sessionData.name) params.append("name", sessionData.name);
      if (sessionData.email) params.append("email", sessionData.email);


      const response = await fetch(`/api/customer-cargo?${params.toString()}`, {
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.records)) {
          setCargoRecords(data.records);
        } else {
          setCargoRecords([]);
        }
        if (data.summary) {
          setSummary({
            totalShipments: Number(data.summary.totalShipments ?? 0),
            completedShipments: Number(data.summary.completedShipments ?? 0),
            totalSpent: Number(data.summary.totalSpent ?? 0),
          });
        }
      } else {
        let details = "";
        try {
          // Ambil response body untuk logging, tapi jangan sampai UI rusak.
          const text = await response.text();
          details = text ? ` - ${text.slice(0, 300)}` : "";
        } catch {}
        console.warn("API customer-cargo mengembalikan error:", response.status, details);
        setCargoRecords([]);
        setSummary({ totalShipments: 0, completedShipments: 0, totalSpent: 0 });
      }
    } catch (err) {
      // Jangan ganggu render UI: cukup log error dan reset data.
      console.error("Gagal sinkronisasi data kargo customer:", err);
      setCargoRecords([]);
      setSummary({ totalShipments: 0, completedShipments: 0, totalSpent: 0 });
    } finally {
      setIsLoadingCargo(false);
    }
  }, []);

  useEffect(() => {
    if (customer) {
      fetchLiveCargoHistory(customer);
    }
  }, [customer, fetchLiveCargoHistory]);

  // 3. Simpan Perubahan Profil (Nama & No HP) ke Database
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    if (!editedName || !editedPhone) {
      setSaveStatus("❌ Nama dan Nomor Telepon wajib diisi!");
      return;
    }

    setSaveStatus("⏳ Menyimpan perubahan profil Anda...");

    try {
      const response = await fetch('/api/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedName,
          email: customer.email,
          password: customer.password || "123456",
          phone: editedPhone,
          address: customer.address,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setSaveStatus(`❌ Gagal menyimpan: ${data.error || "Terjadi kesalahan server"}`);
        return;
      }

      // Update Local Storage & State Browser
      const updatedSession: CustomerSession = {
        ...customer,
        id: data.id || customer.id,
        name: editedName,
        phone: editedPhone,
      };
      setCustomer(updatedSession);
      localStorage.setItem("serena_customer_session", JSON.stringify(updatedSession));

      // Refresh data cargo karena nama customer bisa berubah
      await fetchLiveCargoHistory(updatedSession);

      setSaveStatus("✅ Profil berhasil diperbarui!");
      setIsEditing(false);

      setTimeout(() => setSaveStatus(""), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus("❌ Terjadi gangguan pada koneksi server.");
    }
  };

  // 4. Fungsi Keluar dari Ruang Customer
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("serena_customer_session");
      window.location.href = "/";
    }
  };

  // Helper untuk format Rupiah
  const formatRupiah = (n: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);
  };

  // Helper untuk status badge color
  const getStatusColor = (status: string): string => {
    const s = status?.toLowerCase() || "";
    if (s.includes("sampai") || s.includes("selesai") || s.includes("arrived") || s.includes("delivered")) {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
    if (s.includes("siap") || s.includes("manifested") || s.includes("menunggu")) {
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }
    if (s.includes("lunas") || s.includes("paid")) {
      return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
    }
    return "bg-purple-500/10 text-purple-300 border border-purple-500/20";
  };

  if (!customer && hasCheckedSession && !isLoadingCargo) {
    return (
      <main className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md border border-white/10 bg-white/[0.02] p-8 rounded-2xl backdrop-blur-md">
          <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">🔒</div>
          <h2 className="text-lg font-bold mb-2 text-gray-200">Akses Terbatas</h2>
          <p className="text-gray-400 text-xs mb-6 leading-relaxed">
            Sesi akun customer tidak ditemukan. Silakan masuk dari menu "Kunjungan Profil" di halaman utama terlebih dahulu untuk memuat akun Anda.
          </p>
          <Link href="/" className="px-5 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl text-xs font-bold uppercase tracking-widest block text-center shadow-lg hover:opacity-90 transition-all">
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="text-purple-400 text-xs animate-pulse">⏳ Memuat sesi customer...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white font-sans pb-20 selection:bg-purple-500/30">

      {/* TOP BAR / NAVBAR KHUSUS PORTAL CUSTOMER */}
      <nav className="fixed top-0 w-full z-50 bg-[#020617]/80 backdrop-blur-lg border-b border-white/5 px-6 md:px-12 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 border border-white/10 rounded-lg flex items-center justify-center bg-white/5 group-hover:border-purple-500/40 transition-all">
              <Image src="/kapal.png" alt="Logo" width={18} height={18} onError={(e: any) => e.target.style.display = 'none'} />
            </div>
            <span className="text-base font-bold tracking-tight text-white group-hover:text-purple-300 transition-all">
              SERENA SAIL
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs font-medium text-gray-400 hover:text-red-400 border border-white/10 px-4 py-2 rounded-xl bg-white/[0.02] hover:bg-red-500/10 hover:border-red-500/20 transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* KONTEN UTAMA PROFIL CUSTOMER */}
      <div className="max-w-4xl mx-auto px-6 pt-28 space-y-10">

        {/* SALAM PEMBUKA */}
        <div className="border-b border-white/5 pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-100">
            Selamat Datang, {customer.name} 👋
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Halaman khusus pemantauan paket dan pengaturan data kontak pelanggan.
          </p>
        </div>

        {/* STATISTIK RINGKASAN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-5 hover:border-purple-500/30 transition-all">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Total Pengiriman</div>
            <div className="text-3xl font-black text-white tracking-tighter">{summary.totalShipments}</div>
            <div className="text-[10px] text-purple-400 mt-1 uppercase tracking-wider">Manifest Terdaftar</div>
          </div>
          <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-5 hover:border-emerald-500/30 transition-all">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Selesai</div>
            <div className="text-3xl font-black text-emerald-400 tracking-tighter">{summary.completedShipments}</div>
            <div className="text-[10px] text-emerald-400 mt-1 uppercase tracking-wider">Sampai Tujuan</div>
          </div>
          <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-5 hover:border-cyan-500/30 transition-all">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Total Pengeluaran</div>
            <div className="text-2xl font-black text-cyan-400 tracking-tighter">{formatRupiah(summary.totalSpent)}</div>
            <div className="text-[10px] text-cyan-400 mt-1 uppercase tracking-wider">Lunas Terbayar</div>
          </div>
        </div>

        {/* KOLOM INFORMASI CUSTOMER (BISA EDIT NAMA & TELEPON) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-gray-400 uppercase">Informasi Akun</h2>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                Edit Profil
              </button>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-1.5 text-gray-400 text-xs font-medium">Nama Pelanggan</label>
              <input
                type="text"
                value={isEditing ? editedName : customer.name}
                onChange={(e) => setEditedName(e.target.value)}
                disabled={!isEditing}
                placeholder="Nama Anda"
                className={`w-full rounded-xl border px-4 py-3 text-xs outline-none transition-all font-medium ${
                  isEditing
                    ? 'bg-[#0c0c12] border-purple-500/40 text-white focus:border-purple-500'
                    : 'bg-white/[0.02] border-white/5 text-gray-400 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label className="block mb-1.5 text-gray-400 text-xs font-medium">Nomor Telepon</label>
              <input
                type="text"
                value={isEditing ? editedPhone : customer.phone}
                onChange={(e) => setEditedPhone(e.target.value)}
                disabled={!isEditing}
                placeholder="Nomor Handphone"
                className={`w-full rounded-xl border px-4 py-3 text-xs outline-none transition-all font-medium ${
                  isEditing
                    ? 'bg-[#0c0c12] border-purple-500/40 text-white focus:border-purple-500'
                    : 'bg-white/[0.02] border-white/5 text-gray-400 cursor-not-allowed'
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1.5 text-gray-500 text-xs font-medium">Email Terdaftar</label>
              <input
                type="email"
                value={customer.email}
                disabled
                className="w-full rounded-xl border border-white/5 bg-white/[0.01] text-gray-500 px-4 py-3 text-xs cursor-not-allowed font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1.5 text-gray-500 text-xs font-medium">Alamat Lengkap</label>
              <textarea
                value={customer.address}
                disabled
                rows={2}
                className="w-full rounded-xl border border-white/5 bg-white/[0.01] text-gray-500 px-4 py-3 text-xs cursor-not-allowed font-medium resize-none"
              />
            </div>

            {saveStatus && (
              <div className="md:col-span-2 p-3 bg-white/5 border border-white/10 rounded-xl text-center text-xs font-medium text-purple-300">
                {saveStatus}
              </div>
            )}

            {isEditing && (
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedName(customer.name);
                    setEditedPhone(customer.phone);
                    setSaveStatus("");
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg hover:opacity-90 transition-opacity"
                >
                  Simpan Perubahan
                </button>
              </div>
            )}
          </form>
        </div>

        {/* RIWAYAT LAYANAN & NOMOR RESI */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-gray-400 uppercase">Riwayat Layanan & Nomor Resi</h2>
            {cargoRecords.length > 0 && !isLoadingCargo && (
              <button
                type="button"
                onClick={() => fetchLiveCargoHistory(customer)}
                className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                🔄 Refresh
              </button>
            )}
          </div>

          {isLoadingCargo ? (
            <div className="text-center py-8">
              <span className="text-xs text-purple-400 animate-pulse">⏳ Menghubungkan ke sistem manifest pelayaran...</span>
            </div>
          ) : cargoRecords.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-xl">
                📦
              </div>
              <p className="text-xs text-gray-400 mb-2 font-semibold">Belum ada riwayat order cargo terdaftar atas nama Anda.</p>
              <p className="text-[10px] text-gray-500 mb-4 leading-relaxed max-w-md mx-auto">
                Pesanan akan muncul secara otomatis di sini setelah Anda melakukan transaksi pada menu layanan di halaman utama.
              </p>
              <Link
                href="/#layanan"
                className="inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white shadow-lg hover:opacity-90 transition-opacity"
              >
                🚢 Buat Pesanan Sekarang
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cargoRecords.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-purple-500/30 transition-all"
                >
                  {/* HEADER: NOMOR RESI (paling jelas) + BADGES */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Nomor Resi:</span>
                        <span className="text-base font-mono font-black text-cyan-400 tracking-wider select-all">
                          #{pkg.no_resi}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase">
                          {pkg.moda_pengiriman}
                        </span>
                        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-gray-400 border border-white/10 uppercase">
                          {pkg.jenis_pengiriman}
                        </span>
                        <span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-md uppercase ${getStatusColor(pkg.status_barang)}`}>
                          {pkg.status_barang}
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest">Tanggal Kirim</div>
                      <div className="text-xs font-bold text-gray-200">
                        {pkg.tanggal_kirim
                          ? new Date(pkg.tanggal_kirim).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </div>
                    </div>
                  </div>

                  {/* BODY: DETAIL BARANG & RUTE */}
                  <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">Barang Pesanan</div>
                      <p className="text-sm font-semibold text-gray-200">
                        {pkg.nama_barang}{' '}
                        <span className="text-xs font-normal text-gray-400">({pkg.berat} kg)</span>
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Kategori: <span className="text-gray-300">{pkg.jenis_barang || '-'}</span>
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Penerima: <span className="text-gray-300">{pkg.nama_penerima}</span>
                      </p>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">Rute Pengiriman</div>
                      <p className="text-sm font-semibold text-gray-200 flex items-center gap-1.5">
                        <span>🗺️</span>
                        {pkg.negara_asal} <span className="text-cyan-400">➔</span> {pkg.negara_tujuan}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Armada: <span className="text-gray-300">{pkg.nama_kendaraan || 'Serena Cargo Vessel'}</span>
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Biaya: <span className="text-cyan-400 font-bold">{formatRupiah(pkg.harga)}</span>{' '}
                        <span className={`ml-1 text-[10px] uppercase ${pkg.status_transaksi === 'Lunas' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          ({pkg.status_transaksi})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

