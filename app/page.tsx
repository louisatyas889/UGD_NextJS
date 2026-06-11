"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// --- INTERFACES TYPESCRIPT ---
interface TrackingPackage {
  id: string;
  package_size: string;
  dest: string;
  lat: number;
  lng: number;
  vesselName: string;
}

// --- KOMPONEN UI NAVBAR ---
const Navbar = ({ onOpenProfile, onAdminLogin }: { onOpenProfile: () => void, onAdminLogin: () => void }) => (
  <nav className="fixed top-0 w-full z-50 bg-[#020617]/85 backdrop-blur-md border-b border-white/5 px-8 py-5">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 border border-purple-500/50 rounded-lg flex items-center justify-center bg-purple-500/10 group-hover:bg-purple-500/20 transition-all">
          <Image src="/kapal.png" alt="Logo" width={25} height={25} />
        </div>
        <span className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-300 group-hover:to-cyan-400 transition-all">
          SERENA SAIL
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-10">
        <Link href="#about" className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-cyan-400 transition-colors">
          About Us
        </Link>
        <Link href="#layanan" className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-cyan-400 transition-colors">
          Layanan
        </Link>
        <Link href="#tracing" className="text-sm font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-all flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
          Tracing Paket
        </Link>
        <button onClick={onOpenProfile} className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-cyan-400 transition-colors">
          Kunjungan Profil
        </button>
      </div>

      <button
        onClick={onAdminLogin}
        className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-gray-200 hover:text-white hover:bg-purple-600 hover:border-purple-500 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.1)] cursor-pointer"
      >
        Login Admin / User
      </button>
    </div>
  </nav>
);

interface ServiceCardProps {
  size: string;
  price: string;
  desc: string;
  details: string;
  onClick: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ size, price, desc, details, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white/[0.04] backdrop-blur-md border border-white/10 p-10 rounded-2xl hover:bg-purple-500/10 hover:border-purple-500/40 cursor-pointer transition-all duration-500 group flex flex-col justify-between min-h-[400px]"
  >
    <div>
      <div className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-sm font-black uppercase tracking-[0.3em] mb-4">{size} Package</div>
      <div className="text-4xl md:text-5xl font-black mb-6 tracking-tighter italic leading-tight text-white">
        <span className="text-xs font-normal not-italic text-gray-400 uppercase tracking-widest block mb-1">Mulai dari</span>
        {price}
      </div>
      <p className="text-gray-300 text-base md:text-lg mb-8 leading-relaxed font-medium">{desc}</p>
    </div>
    <div className="pt-8 border-t border-white/5 flex justify-between items-center">
      <p className="text-xs md:text-sm text-cyan-400 font-bold uppercase tracking-widest leading-relaxed">{details}</p>
      <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity font-mono">PILIH</span>
    </div>
  </div>
);

// --- KOMPONEN UTAMA (DEFAULT EXPORT) ---
export default function Page() {
  const router = useRouter();
  const [packageId, setPackageId] = useState<string>("");
  const [activePkg, setActivePkg] = useState<TrackingPackage | null>(null);
  const [trackingError, setTrackingError] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // State Modal & Multi-Step Flow
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalStep, setModalStep] = useState<"login" | "service" | "login_profile">("login");
  const [selectedService, setSelectedService] = useState<string>("");
  const [checkoutStatus, setCheckoutStatus] = useState<string>("");
  const [loginStatus, setLoginStatus] = useState<string>("");

  // State Form Validations
  const [submitAttemptedLogin, setSubmitAttemptedLogin] = useState<boolean>(false);
  const [submitAttemptedService, setSubmitAttemptedService] = useState<boolean>(false);
  const [submitAttemptedProfile, setSubmitAttemptedProfile] = useState<boolean>(false);

  // State Form Input Login/Registrasi Customer
  const [loginData, setLoginData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: ""
  });

  // State Form Kunjungan Profil
  const [profileLoginData, setProfileLoginData] = useState({
    email: "",
    password: ""
  });

  // State Form Input Transaksi Layanan
  const [formData, setFormData] = useState({
    pengirim: "", penerima: "", telepon: "", asal: "", tujuan: "", barang: "", jenis_barang: "", berat: "", pembayaran: "QRIS", tanggal: ""
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const currentMarker = useRef<any>(null);

  // --- EFFECT UNTUK INITIALISASI LEAFLET SECARA AMAN ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Tambahkan block direct access login
    sessionStorage.removeItem('adminLoginAllowed');

    if (!document.getElementById("share-tech-mono-font")) {
      const fontLink = document.createElement("link");
      fontLink.id = "share-tech-mono-font";
      fontLink.rel = "stylesheet";
      fontLink.href = "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap";
      document.head.appendChild(fontLink);
    }

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    let mapInstance: any = null;

    const initMap = () => {
      if (!mapContainerRef.current || (window as any).L === undefined || leafletMap.current) return;
      if ((mapContainerRef.current as any)._leaflet_id) return;

      const L = (window as any).L;

      const map = L.map(mapContainerRef.current, {
        center: [15.0, 120.0],
        zoom: 3,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      leafletMap.current = map;
      mapInstance = map;
      setTimeout(() => { map.invalidateSize(); }, 300);
    };

    if ((window as any).L) {
      initMap();
    } else if (!document.getElementById("leaflet-script")) {
      const script = document.createElement("script");
      script.id = "leaflet-script";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if ((window as any).L) {
          initMap();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      if (mapInstance) {
        mapInstance.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  const handleTrack = async () => {
    const searchId = packageId.toUpperCase().trim();
    if (!searchId) return;

    setTrackingError("");
    setIsSearching(true);

    try {
      const response = await fetch(`/api/track?id=${encodeURIComponent(searchId)}`);
      const data = await response.json();

      if (data.error) {
        setActivePkg(null);
        setTrackingError(`⚡ ${data.error}`);
        setIsSearching(false);
        return;
      }

      if (data.tracking || data.barang) {
        const L = (window as any).L;

        let destName = data.tracking ? data.tracking.destination : data.barang.negara_tujuan;
        let vName = data.tracking ? data.tracking.vessel_name : "Serena Fleet (Stationary/Waiting)";
        let pSize = data.tracking ? data.tracking.package_size : (data.barang.package_size || "Unknown");
        let lat = data.tracking ? parseFloat(data.tracking.lat) : 0;
        let lng = data.tracking ? parseFloat(data.tracking.lng) : 0;

        const destKey = destName.toLowerCase().trim();
        const countryMap: Record<string, [number, number]> = {
          "singapura": [1.3521, 103.8198],
          "jepang": [36.2048, 138.2529],
          "korea selatan": [35.9078, 127.7669],
          "korea": [35.9078, 127.7669],
          "thailand": [15.8700, 100.9925],
          "filipina": [12.8797, 121.7740],
          "china": [35.8617, 104.1954],
          "amerika": [37.0902, -95.7129],
          "amerika serikat": [37.0902, -95.7129],
          "australia": [-25.2744, 133.7751]
        };

        if (countryMap[destKey]) {
          lat = countryMap[destKey][0];
          lng = countryMap[destKey][1];
        } else if (!data.tracking && data.barang) {
          lat = -0.7893;
          lng = 113.9213;
        }

        const foundPackage: TrackingPackage = {
          id: data.tracking ? data.tracking.id : (data.barang.no_resi || searchId),
          package_size: pSize,
          dest: destName,
          lat: lat,
          lng: lng,
          vesselName: vName
        };

        setActivePkg(foundPackage);

        if (leafletMap.current) {
          leafletMap.current.invalidateSize();
          leafletMap.current.flyTo([foundPackage.lat, foundPackage.lng], 5, { animate: true, duration: 2 });

          if (currentMarker.current) currentMarker.current.remove();

          const pulseIcon = L.divIcon({
            className: 'map-pulse-icon',
            html: `<div style="width:14px; height:14px; background:#22d3ee; border-radius:50%; box-shadow:0 0 15px #22d3ee;"></div>`,
            iconSize: [14, 14]
          });

          currentMarker.current = L.marker([foundPackage.lat, foundPackage.lng], { icon: pulseIcon }).addTo(leafletMap.current);
          currentMarker.current.bindPopup(
            `<b style="color:black; font-family:sans-serif;">${foundPackage.vesselName}</b><br/>` +
            `<span style="color:#4b5563; font-family:sans-serif;">Dest: ${foundPackage.dest}</span>`
          ).openPopup();
        }

        if (!data.tracking && data.barang) {
          setTrackingError(
            `📦 Manifest Terdaftar: Barang dari [${data.barang.nama_pengirim}] tujuan [${data.barang.negara_tujuan}] ` +
            `ditemukan di sistem dengan status operasional [${data.barang.status_barang || 'Menunggu Keberangkatan'}]. Menunggu keberangkatan armada kargo.`
          );
        } else {
          setTrackingError("");
        }

      } else {
        setActivePkg(null);
        setTrackingError("Nomor resi kargo atau ID Kontainer tidak terdaftar di database manifest.");
      }
    } catch (err) {
      console.error(err);
      setActivePkg(null);
      setTrackingError("⚡ Kegagalan jaringan. Tidak dapat terhubung ke sistem manifest server.");
    } finally {
      setIsSearching(false);
    }
  };

  // --- HANDLER SUBMIT KUNJUNGAN PROFIL ---
  const handleProfileLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttemptedProfile(true);

    if (!profileLoginData.email || !profileLoginData.password) {
      setLoginStatus("Harap isi seluruh kolom untuk login.");
      return;
    }

    setLoginStatus("⏳ Memproses otentikasi identitas akun ke Neon Database...");

    try {
      const payload = {
        name: "Existing User",
        email: profileLoginData.email,
        password: profileLoginData.password,
        phone: "",
        address: ""
      };

      const response = await fetch('/api/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok || responseText.startsWith("<!DOCTYPE") || responseText.includes("<html")) {
        console.error("Gagal memproses JSON. Mendapatkan respons HTML:", responseText);
        throw new Error(`Server API mengembalikan respons non-JSON (${response.status}). Pastikan endpoint ditempatkan pada folder 'app/api/customer-login/route.ts'.`);
      }

      const data = JSON.parse(responseText);

      if (data.error) {
         throw new Error(data.error);
      }

      setLoginStatus("Otentikasi Berhasil! Menyinkronkan session...");

      if (typeof window !== "undefined") {
        localStorage.setItem("serena_customer_session", JSON.stringify({
          id: data.id || "SS-USER",
          name: data.name || "Customer",
          email: profileLoginData.email,
          phone: data.phone || "",
          address: data.address || ""
        }));
      }

      setTimeout(() => {
        setLoginStatus("Login Berhasil! Mengalihkan ke profil...");
        setTimeout(() => {
          window.location.href = "/profile_costumer";
        }, 1000);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setLoginStatus(`${err.message || "Kehilangan sinyal logistik. Gagal memproses akun."}`);
    }
  };

  // --- HANDLER SUBMIT LOGIN/REGISTER CUSTOMER ---
  const handleCustomerLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginData.name || !loginData.email || !loginData.password || !loginData.phone || !loginData.address) {
      setLoginStatus("Harap lengkapi seluruh formulir yang wajib diisi.");
      return;
    }

    setLoginStatus("Sedang memproses autentikasi ke database Neon...");

    try {
      const response = await fetch('/api/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const responseText = await response.text();

      if (!response.ok || responseText.startsWith("<!DOCTYPE") || responseText.includes("<html")) {
        console.error("Gagal memproses JSON. Mendapatkan respons HTML:", responseText);
        throw new Error(`Server API mengembalikan respons non-JSON (${response.status}). Pastikan endpoint ditempatkan pada folder 'app/api/customer-login/route.ts'.`);
      }

      const data = JSON.parse(responseText);

      if (data.error) {
        throw new Error(data.error);
      }

      setLoginStatus("✅ Autentikasi Customer Berhasil! Membuka formulir layanan...");

      setFormData(prev => ({
        ...prev,
        pengirim: loginData.name,
        telepon: loginData.phone
      }));

      setTimeout(() => {
        setModalStep("service");
        setLoginStatus("");
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setLoginStatus(`❌ ${err.message || "Kegagalan sistem jaringan. Tidak dapat memverifikasi akun customer."}`);
    }
  };

  // --- HANDLER SUBMIT DATA LAYANAN / MANIFEST ---
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pengirim || !formData.penerima || !formData.telepon || !formData.asal || !formData.tujuan || !formData.barang || !formData.jenis_barang || !formData.berat || !formData.tanggal) {
      setCheckoutStatus("Harap lengkapi semua kolom form layanan pengiriman.");
      return;
    }

    const generatedId = `PKG-${Math.floor(100000 + Math.random() * 900000)}`;
    setCheckoutStatus("Sedang memproses dan mengamankan data ke database Neon...");

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          no_resi: generatedId,
          nama_pengirim: formData.pengirim,
          nama_penerima: formData.penerima,
          negara_asal: formData.asal,
          negara_tujuan: formData.tujuan,
          package_size: selectedService,
          nama_barang: formData.barang,
          jenis_barang: formData.jenis_barang,
          berat: parseFloat(formData.berat) || 0,
          no_telepon: formData.telepon,
          tanggal: formData.tanggal,
          status_barang: "Manifested / Menunggu Kapal"
        }),
      });

      const responseText = await response.text();

      if (!response.ok || responseText.startsWith("<!DOCTYPE")) {
        console.error("Gagal memuat manifes kargo otomatis:", responseText);
        throw new Error("Gagal mendaftarkan manifest muatan laut. Silakan coba sesaat lagi.");
      }

      const data = JSON.parse(responseText);

      if (data.error) {
        throw new Error(data.error);
      }

      setCheckoutStatus(`Transaksi Berhasil! ID Resi Otomatis: ${generatedId}. Data sudah disimpan aman di database Neon.`);

      localStorage.setItem("serena_customer_session", JSON.stringify({
        id: loginData.email || "SS-USER",
        name: formData.pengirim,
        email: loginData.email,
        phone: formData.telepon,
        address: loginData.address,
        password: loginData.password
      }));

      localStorage.setItem("serena_latest_cargo", JSON.stringify({
        id: Date.now(),
        no_resi: generatedId,
        tanggal_kirim: formData.tanggal,
        nama_pengirim: formData.pengirim,
        nama_penerima: formData.penerima,
        no_telepon: formData.telepon,
        negara_asal: formData.asal,
        negara_tujuan: formData.tujuan,
        nama_barang: formData.barang,
        jenis_barang: formData.jenis_barang,
        berat: parseFloat(formData.berat),
        harga: selectedService === "Small" ? 250000 : selectedService === "Medium" ? 1200000 : 5500000,
        status_pengiriman: "Menunggu Keberangkatan",
        status_barang: "Manifested / Menunggu Kapal",
        status_transaksi: "Lunas",
        moda_pengiriman: "Sea Freight",
        jenis_pengiriman: `${selectedService} Package`,
        nama_kendaraan: "Serena Fleet"
      }));

      setTimeout(() => {
        window.location.href = "/profile_costumer"; // Alihkan langsung ke profil
      }, 2000);

      } catch (err: any) {
        // Blok catch ini tetap dipertahankan ya!
        console.error(err);
        setCheckoutStatus(`${err.message || "Kegagalan sistem jaringan. Tidak dapat mengirim data manifest."}`);
      }
    };

  const handleZoom = (type: "in" | "out") => {
    if (!leafletMap.current) return;
    if (type === "in") leafletMap.current.zoomIn();
    else leafletMap.current.zoomOut();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileLoginData(prev => ({ ...prev, [name]: value }));
  };

  const openForm = (serviceName: string) => {
    setSelectedService(serviceName);
    setSubmitAttemptedLogin(false);
    setSubmitAttemptedService(false);
    setLoginStatus("");
    setModalStep("login");
    setIsModalOpen(true);
  };

  const handleOpenProfile = () => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("serena_customer_session");
      if (session) {
        window.location.href = "/profile_costumer";
        return;
      }
    }
    setSubmitAttemptedProfile(false);
    setLoginStatus("");
    setModalStep("login_profile");
    setIsModalOpen(true);
  };

  const handleAdminLogin = () => {
      sessionStorage.setItem('adminLoginAllowed', 'true');
      router.push('/login');
  };
  return (
    <main className="min-h-screen bg-[#020617] text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container { background: #020617 !important; cursor: crosshair !important; }
        .leaflet-popup-content-wrapper { border-radius: 8px; font-weight: bold; padding: 4px; }
      `}} />

      <Navbar onOpenProfile={handleOpenProfile} onAdminLogin={handleAdminLogin} />

      {/* HERO SECTION */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute w-[800px] h-[800px] bg-purple-600/10 blur-[180px] rounded-full -z-10" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none scale-125 md:scale-100 z-0">
          <Image src="/kapal.png" alt="Watermark Logo" width={550} height={550} priority className="object-contain" />
        </div>
        <div className="z-10 pt-20 relative">
          <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter mb-6 italic leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-purple-300 drop-shadow-[0_0_35px_rgba(168,85,247,0.25)]">
            SERENA SAIL
          </h1>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 tracking-[0.5em] uppercase text-sm md:text-lg font-black opacity-90 drop-shadow-[0_2px_10px_rgba(34,211,238,0.3)]">
            Navigating the Future, Anchored in Precision
          </p>
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section id="about" className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5 relative">
        <div className="flex flex-col gap-24">

          {/* VISI & MISI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <span className="bg-purple-500/10 text-purple-300 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                Corporate Profile
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mt-6 uppercase italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400 mb-6">
                Visi Kami
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed font-medium">
                Menjadi perusahaan pelayaran internasional terdepan yang menghubungkan dunia melalui layanan transportasi laut yang aman, terpercaya, inovatif, dan berkelanjutan, serta memberikan nilai terbaik bagi pelanggan, mitra bisnis, dan masyarakat global.
              </p>
            </div>

            <div className="border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-8 rounded-2xl relative overflow-hidden backdrop-blur-sm group hover:border-cyan-500/30 transition-all duration-500">
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 blur-2xl rounded-full group-hover:bg-cyan-500/10 transition-all"></div>
              <h3 style={{ fontFamily: `'Share Tech Mono', monospace` }} className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-6 uppercase tracking-wider">
                Misi Perusahaan
              </h3>
              <ul className="space-y-4 text-sm text-gray-400 leading-relaxed font-medium">
                <li className="flex gap-3"><span className="text-cyan-400">▹</span> Menyediakan layanan transportasi dan logistik laut internasional yang tepat waktu, aman, dan efisien untuk mendukung perdagangan global.</li>
                <li className="flex gap-3"><span className="text-cyan-400">▹</span> Mengutamakan keselamatan awak kapal, pelanggan, muatan, dan lingkungan dalam setiap kegiatan operasional perusahaan.</li>
                <li className="flex gap-3"><span className="text-cyan-400">▹</span> Mengembangkan armada modern dan teknologi maritim yang inovatif guna meningkatkan kualitas layanan dan daya saing.</li>
                <li className="flex gap-3"><span className="text-cyan-400">▹</span> Membangun jaringan pelayaran internasional yang luas untuk menghubungkan berbagai negara, pelabuhan, dan pusat perdagangan.</li>
                <li className="flex gap-3"><span className="text-cyan-400">▹</span> Menjalin kemitraan strategis dengan pelanggan, pelaku industri, dan otoritas pelabuhan.</li>
                <li className="flex gap-3"><span className="text-cyan-400">▹</span> Mengembangkan SDM yang profesional, kompeten, dan berintegritas tinggi.</li>
                <li className="flex gap-3"><span className="text-cyan-400">▹</span> Mendukung praktik bisnis yang ramah lingkungan melalui pengurangan emisi dan efisiensi energi.</li>
              </ul>
            </div>
          </div>

          {/* NILAI-NILAI PERUSAHAAN */}
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Nilai-Nilai Perusahaan SERENA SAIL</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Safety First", desc: "Keselamatan merupakan prioritas utama dalam setiap pelayaran dan aktivitas operasional." },
                { title: "Excellence", desc: "Memberikan pelayanan terbaik dengan standar internasional." },
                { title: "Reliability", desc: "Menjadi mitra logistik yang dapat dipercaya dalam setiap perjalanan dan pengiriman." },
                { title: "Environmental Responsibility", desc: "Menjaga kelestarian laut dan lingkungan untuk generasi mendatang." },
                { title: "Networking & Growth", desc: "Membangun konektivitas global dan menciptakan peluang pertumbuhan bersama." },
                { title: "Adaptability", desc: "Terus berinovasi dan beradaptasi terhadap perkembangan teknologi dan kebutuhan pasar." }
              ].map((val, idx) => (
                <div key={idx} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:border-purple-500/40 hover:bg-purple-500/5 hover:-translate-y-1 transition-all duration-300 group">
                  <h4 style={{ fontFamily: `'Share Tech Mono', monospace` }} className="text-lg font-bold text-purple-400 mb-3 group-hover:text-cyan-400 transition-colors">{val.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-300 transition-colors">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* TENTANG JARINGAN LAYANAN */}
          <div className="bg-gradient-to-br from-[#020617] via-purple-900/10 to-cyan-900/10 border border-white/10 rounded-3xl p-10 lg:p-16 relative overflow-hidden text-center shadow-[0_0_40px_rgba(34,211,238,0.05)]">
            <div className="absolute inset-0 bg-[url('/kapal.png')] opacity-[0.03] bg-center bg-no-repeat bg-contain"></div>
            <h2 className="text-3xl font-bold mb-6 text-white relative z-10 uppercase italic tracking-tight">Tentang Jaringan Layanan SERENA SAIL</h2>
            <p className="text-gray-300 max-w-4xl mx-auto text-base leading-relaxed mb-8 relative z-10 font-medium">
              Sebagai perusahaan pelayaran internasional yang terus berkembang, SERENA SAIL saat ini melayani pengiriman barang dan logistik ke delapan negara tujuan utama yang menjadi pusat perdagangan dan distribusi di kawasan Asia-Pasifik hingga Amerika Utara. Jaringan pelayaran kami dirancang untuk memberikan layanan yang aman, efisien, dan tepat waktu bagi pelanggan yang ingin menjangkau pasar internasional.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-10 relative z-10">
              {["Singapura", "Jepang", "Thailand", "Filipina", "China", "Korea Selatan", "Amerika Serikat", "Australia"].map((country) => (
                <span key={country} className="px-5 py-2.5 border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 rounded-full text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:bg-cyan-400 hover:text-[#020617] transition-all cursor-default">
                  {country}
                </span>
              ))}
            </div>
            <p className="text-gray-400 max-w-4xl mx-auto text-sm leading-relaxed mb-12 relative z-10">
              Meskipun masih tergolong sebagai perusahaan yang sedang memperluas jangkauan operasionalnya, SERENA SAIL berkomitmen untuk menghadirkan layanan pengiriman internasional yang dapat diandalkan melalui konektivitas pelabuhan strategis di kedelapan negara tersebut. Ke depan, kami akan terus mengembangkan jaringan pelayaran guna mendukung kebutuhan perdagangan global serta memperkuat peran Indonesia dalam rantai pasok internasional.
            </p>
            <div className="inline-block relative z-10 bg-white/5 backdrop-blur-sm border border-white/10 px-8 py-5 rounded-2xl">
              <h3 className="text-xl md:text-3xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                "From Indonesia to the World's Key Trade Routes"
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* LAYANAN SECTION */}
      <section id="layanan" className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5 bg-[#030712]/50">
        <div className="text-center mb-20">
          <span className="bg-cyan-500/10 text-cyan-400 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest border border-cyan-500/20">Shipping Solutions</span>
          <h2 className="text-5xl md:text-6xl font-bold mt-6 uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">Layanan Kami</h2>
          <p className="text-gray-400 mt-4 text-sm md:text-base">Pilih paket dimensi logistik untuk membuka form entry order manifestasi.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <ServiceCard size="Small" price="Rp 250.000" desc="Pengiriman dokumen penting atau paket kecil." details="Standard Domestik" onClick={() => openForm("Small")} />
          <ServiceCard size="Medium" price="Rp 1.200.000" desc="Ideal untuk inventaris bisnis atau elektronik." details="Volume & Koordinat" onClick={() => openForm("Medium")} />
          <ServiceCard size="Large" price="Rp 5.500.000" desc="Kapasitas kontainer besar untuk alat berat." details="Rute Pelayaran Khusus" onClick={() => openForm("Large")} />
        </div>
      </section>

      {/* TRACING PAKET SECTION */}
      <section id="tracing" className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5 relative">
        <div className="text-left mb-16">
          <span className="bg-orange-500/10 text-orange-400 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest border border-orange-500/20">Live Tracking</span>
          <h2 className="text-5xl md:text-6xl font-bold mt-6 uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Tracing Paket</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-10 rounded-3xl flex flex-col justify-center">
            <h3 style={{ fontFamily: `'Share Tech Mono', monospace` }} className="text-xl font-bold mb-8 uppercase tracking-tighter text-cyan-400">Masukkan ID Paket</h3>
            <div className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  placeholder="Contoh: PKG-100293 atau LUT-0394392687-825"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-5 text-base font-mono focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-600 uppercase text-gray-200"
                  onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
              </div>
              <button
                onClick={handleTrack}
                disabled={isSearching}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black py-5 rounded-xl uppercase tracking-[0.2em] text-xs transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-[0_4px_20px_rgba(147,51,234,0.2)] disabled:opacity-50"
              >
                {isSearching ? "MENGHUBUNGKAN KE NEON DB..." : "LACAK SEKARANG"}
              </button>
              {trackingError && (
                <div style={{ fontFamily: `'Share Tech Mono', monospace` }} className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-300 text-xs font-medium leading-relaxed">
                  {trackingError}
                </div>
              )}
            </div>
          </div>

          <div className="relative group min-h-[400px]">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative h-full w-full bg-[#030712] border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center z-[1000]">
                <span style={{ fontFamily: `'Share Tech Mono', monospace` }} className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span> SATELLITE FEED: NEON DB ACTIVE
                </span>
                <div className="flex gap-2">
                  <button onClick={() => handleZoom("in")} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded border border-white/20 text-white font-mono text-sm transition-colors">+</button>
                  <button onClick={() => handleZoom("out")} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded border border-white/20 text-white font-mono text-sm transition-colors">-</button>
                </div>
              </div>
              <div className="flex-grow relative w-full h-full min-h-[300px] z-10">
                <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
              </div>
              <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-[1000]">
                <div className="flex justify-between items-end">
                  <div>
                    <div style={{ fontFamily: `'Share Tech Mono', monospace` }} className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Current Vessel</div>
                    <div className="text-lg font-bold italic uppercase text-cyan-400">
                      {activePkg ? activePkg.vesselName : "Awaiting Feed..."}
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontFamily: `'Share Tech Mono', monospace` }} className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Destination</div>
                    <div className="text-lg font-bold text-gray-200 uppercase tracking-tighter">
                      {activePkg ? activePkg.dest : "---"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* MODAL MULTI-STEP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center items-start pt-20 pb-10 overflow-y-auto bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#0c0c12] border border-white/10 rounded-2xl p-8 max-w-3xl w-full relative shadow-[0_0_50px_rgba(168,85,247,0.15)] animate-fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white text-base transition-colors"
            >
              ✕
            </button>

            {/* STEP: KUNJUNGAN PROFIL (LOGIN EXISTING CUSTOMER) */}
            {modalStep === "login_profile" && (
              <div>
                <div className="mb-6">
                  <p style={{ fontFamily: `'Share Tech Mono', monospace` }} className="text-[#22d3ee] text-[10px] tracking-[0.14em] mb-2 uppercase">PORTAL AKSES CUSTOMER</p>
                  <h2 className="text-2xl font-bold tracking-tight text-gray-100">Kunjungan Profil</h2>
                  <p className="text-gray-400 text-xs mt-1">Silakan masuk menggunakan akun yang sudah terdaftar untuk menuju halaman profil.</p>
                </div>
                <form onSubmit={handleProfileLoginSubmit} className="space-y-4">
                  <div>
                    <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">EMAIL AKUN *</label>
                    <input required name="email" value={profileLoginData.email} onChange={handleProfileLoginChange} className={`w-full rounded-xl border bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none transition-colors placeholder:text-gray-600 ${submitAttemptedProfile && !profileLoginData.email ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-cyan-500/50'}`} type="email" placeholder="Masukkan email Anda" />
                  </div>
                  <div>
                    <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">PASSWORD *</label>
                    <input required name="password" value={profileLoginData.password} onChange={handleProfileLoginChange} className={`w-full rounded-xl border bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none transition-colors placeholder:text-gray-600 ${submitAttemptedProfile && !profileLoginData.password ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-cyan-500/50'}`} type="password" placeholder="Masukkan password Anda" />
                  </div>
                  {loginStatus && (
                    <div style={{ fontFamily: `'Share Tech Mono', monospace` }} className={`p-4 border rounded-xl text-center text-xs leading-relaxed ${loginStatus.includes('❌') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
                      {loginStatus}
                    </div>
                  )}
                  <button type="submit" onClick={() => setSubmitAttemptedProfile(true)} style={{ fontFamily: `'Share Tech Mono', monospace` }} className="w-full mt-4 py-4 rounded-xl text-xs tracking-[0.14em] uppercase text-white bg-gradient-to-r from-[#22d3ee] to-[#7c3aed] hover:opacity-90 transition-opacity font-bold shadow-[0_0_25px_rgba(34,211,238,0.15)]">
                    Masuk ke Profil
                  </button>
                </form>
              </div>
            )}

            {/* STEP 1: FORMULIR LOGIN / REGISTRASI CUSTOMER */}
            {modalStep === "login" && (
              <div>
                <div className="mb-6">
                  <p style={{ fontFamily: `'Share Tech Mono', monospace` }} className="text-[#22d3ee] text-[10px] tracking-[0.14em] mb-2 uppercase">STEP 1: CUSTOMER IDENTITY VERIFICATION</p>
                  <h2 className="text-2xl font-bold tracking-tight text-gray-100">Formulir Pendaftaran Customer</h2>
                  <p className="text-gray-400 text-xs mt-1">Harap isi identitas dan password Anda untuk mencatat manifest logistik ke database Neon.</p>
                </div>
                <form onSubmit={handleCustomerLoginSubmit} className="space-y-4">
                  <div>
                    <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">NAMA LENGKAP CUSTOMER *</label>
                    <input required name="name" value={loginData.name} onChange={handleLoginInputChange} className={`w-full rounded-xl border bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none transition-colors placeholder:text-gray-600 ${submitAttemptedLogin && !loginData.name ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-cyan-500/50'}`} type="text" placeholder="Masukkan nama lengkap Anda" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">EMAIL CUSTOMER *</label>
                      <input required name="email" value={loginData.email} onChange={handleLoginInputChange} className={`w-full rounded-xl border bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none transition-colors placeholder:text-gray-600 ${submitAttemptedLogin && !loginData.email ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-cyan-500/50'}`} type="email" placeholder="contoh@email.com" />
                    </div>
                    <div>
                      <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">PASSWORD *</label>
                      <input required name="password" value={loginData.password} onChange={handleLoginInputChange} className={`w-full rounded-xl border bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none transition-colors placeholder:text-gray-600 ${submitAttemptedLogin && !loginData.password ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-cyan-500/50'}`} type="password" placeholder="Buat password untuk akun ini" />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">NOMOR TELEPON AKTIF *</label>
                    <input required name="phone" value={loginData.phone} onChange={handleLoginInputChange} className={`w-full rounded-xl border bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none transition-colors placeholder:text-gray-600 ${submitAttemptedLogin && !loginData.phone ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-cyan-500/50'}`} type="text" placeholder="Contoh: 0812xxxxxxxx" />
                  </div>
                  <div>
                    <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">ALAMAT ASAL CUSTOMER *</label>
                    <textarea required name="address" value={loginData.address} onChange={handleLoginInputChange} rows={3} className={`w-full rounded-xl border bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none transition-colors placeholder:text-gray-600 resize-none ${submitAttemptedLogin && !loginData.address ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-cyan-500/50'}`} placeholder="Masukkan alamat lengkap rumah/kantor Anda" />
                  </div>
                  {loginStatus && (
                    <div style={{ fontFamily: `'Share Tech Mono', monospace` }} className={`p-4 border rounded-xl text-center text-xs leading-relaxed ${loginStatus.includes('❌') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
                      {loginStatus}
                    </div>
                  )}
                  <button type="submit" onClick={() => setSubmitAttemptedLogin(true)} style={{ fontFamily: `'Share Tech Mono', monospace` }} className="w-full mt-4 py-4 rounded-xl text-xs tracking-[0.14em] uppercase text-white bg-gradient-to-r from-[#22d3ee] to-[#7c3aed] hover:opacity-90 transition-opacity font-bold shadow-[0_0_25px_rgba(34,211,238,0.15)]">
                    Verifikasi Data & Lanjutkan Pemesanan
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: FORMULIR DATA DIRI PENGIRIMAN & BARANG LAYANAN */}
            {modalStep === "service" && (
              <div>
                <div className="mb-6">
                  <p style={{ fontFamily: `'Share Tech Mono', monospace` }} className="text-[#a855f7] text-[10px] tracking-[0.14em] mb-2 uppercase">STEP 2: CARGO SECURE ENTRY FORM</p>
                  <h2 className="text-2xl font-bold tracking-tight text-gray-100">Formulir Data Diri Pengiriman</h2>
                  <p className="text-gray-400 text-xs mt-1">Jenis paket terikat otomatis pada pilihan layanan: <span className="text-cyan-400 font-bold uppercase">{selectedService}</span>.</p>
                </div>
                {checkoutStatus ? (
                  <div style={{ fontFamily: `'Share Tech Mono', monospace` }} className={`p-6 border rounded-xl text-center text-xs leading-relaxed ${checkoutStatus.includes('❌') ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                    {checkoutStatus}
                  </div>
                ) : (
                  <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <div className="md:col-span-2 mb-3">
                      <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">JENIS LAYANAN YANG DIPILIH</label>
                      <input type="text" value={`${selectedService} Package`} disabled className="w-full rounded-xl border border-white/5 bg-white/[0.01] text-gray-500 px-3.5 py-2.5 text-xs cursor-not-allowed outline-none" />
                    </div>
                    <div className="mb-3">
                      <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">NAMA PENGIRIM (OTOMATIS) *</label>
                      <input required name="pengirim" value={formData.pengirim} onChange={handleInputChange} className={`w-full rounded-xl border bg-white/[0.05] text-purple-300 px-3.5 py-2.5 text-xs outline-none transition-colors ${submitAttemptedService && !formData.pengirim ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-purple-500/50'}`} type="text" placeholder="Nama Lengkap Pengirim" />
                    </div>
                    <div className="mb-3">
                      <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">NAMA PENERIMA *</label>
                      <input required name="penerima" value={formData.penerima} onChange={handleInputChange} className={`w-full rounded-xl border bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none transition-colors placeholder:text-gray-600 ${submitAttemptedService && !formData.penerima ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-purple-500/50'}`} type="text" placeholder="Nama Lengkap Penerima" />
                    </div>
                    <div className="mb-3">
                      <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">NOMOR TELEPON PENGIRIM (OTOMATIS) *</label>
                      <input required name="telepon" value={formData.telepon} onChange={handleInputChange} className={`w-full rounded-xl border bg-white/[0.05] text-purple-300 px-3.5 py-2.5 text-xs outline-none transition-colors ${submitAttemptedService && !formData.telepon ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-purple-500/50'}`} type="text" placeholder="Contoh: 0812xxxxxxxx" />
                    </div>
                    <div className="mb-3">
                      <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">NAMA BARANG / KOMODITAS *</label>
                      <input required name="barang" value={formData.barang} onChange={handleInputChange} className={`w-full rounded-xl border bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none transition-colors placeholder:text-gray-600 ${submitAttemptedService && !formData.barang ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-purple-500/50'}`} type="text" placeholder="Contoh: Paket Elektronik, Pakaian" />
                    </div>
                    <div className="mb-3">
                      <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">KATEGORI JENIS BARANG *</label>
                      <select required name="jenis_barang" value={formData.jenis_barang} onChange={handleInputChange} className={`w-full rounded-xl border bg-[#0c0c12] text-gray-200 px-3.5 py-2.5 text-xs outline-none transition-colors cursor-pointer appearance-none ${submitAttemptedService && !formData.jenis_barang ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-cyan-500/50'}`}>
                        <option value="" disabled>Pilih Kategori Barang...</option>
                        <option value="Makanan">Makanan</option>
                        <option value="MakeUp">MakeUp</option>
                        <option value="Aksesories">Aksesories</option>
                        <option value="Pakaian">Pakaian</option>
                        <option value="Furnitur">Furnitur</option>
                        <option value="Barang Berat">Barang Berat</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">NEGARA ASAL PENGIRIMAN *</label>
                      <input required name="asal" value={formData.asal} onChange={handleInputChange} className={`w-full rounded-xl border bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none transition-colors placeholder:text-gray-600 ${submitAttemptedService && !formData.asal ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-purple-500/50'}`} type="text" placeholder="Contoh: Indonesia, Jepang" />
                    </div>
                    <div className="mb-3">
                      <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">NEGARA TUJUAN PENGIRIMAN *</label>
                      <input required name="tujuan" value={formData.tujuan} onChange={handleInputChange} className={`w-full rounded-xl border bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none transition-colors placeholder:text-gray-600 ${submitAttemptedService && !formData.tujuan ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-purple-500/50'}`} type="text" placeholder="Contoh: Filipina, Singapura" />
                    </div>
                    <div className="mb-3">
                      <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">ESTIMASI BERAT BARANG (KG) *</label>
                      <input required name="berat" value={formData.berat} onChange={handleInputChange} className={`w-full rounded-xl border bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none transition-colors placeholder:text-gray-600 ${submitAttemptedService && !formData.berat ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-purple-500/50'}`} type="number" step="0.1" min="0.1" placeholder="0.0" />
                    </div>
                    <div className="mb-3">
                      <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">TANGGAL PENGIRIMAN *</label>
                      <input required name="tanggal" value={formData.tanggal} onChange={handleInputChange} className={`w-full rounded-xl border bg-white/[0.02] text-gray-200 px-3.5 py-2.5 text-xs outline-none transition-colors [color-scheme:dark] ${submitAttemptedService && !formData.tanggal ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-purple-500/50'}`} type="date" />
                    </div>
                    <div className="mb-3 md:col-span-2">
                      <label style={{ fontFamily: `'Share Tech Mono', monospace` }} className="block mb-1.5 text-gray-400 text-[10px] tracking-wider uppercase">METODE PEMBAYARAN KUNCI *</label>
                      <select required name="pembayaran" value={formData.pembayaran} onChange={handleInputChange} className={`w-full rounded-xl border bg-[#0c0c12] text-gray-200 px-3.5 py-2.5 text-xs outline-none cursor-pointer ${submitAttemptedService && !formData.pembayaran ? 'border-red-500 focus:border-red-500' : 'border-white/10'}`}>
                        <option value="QRIS">QRIS (Automated Feed)</option>
                        <option value="Debit">Transfer Bank / Debit Virtual Account</option>
                      </select>
                    </div>
                    <button type="submit" onClick={() => setSubmitAttemptedService(true)} style={{ fontFamily: `'Share Tech Mono', monospace` }} className="md:col-span-2 mt-4 py-4 rounded-xl text-xs tracking-[0.14em] uppercase text-white bg-gradient-to-r from-[#7c3aed] to-[#22d3ee] hover:opacity-90 transition-opacity font-bold shadow-[0_0_25px_rgba(34,211,238,0.15)]">
                      Proses Pembayaran & Buat Resi Otomatis
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="py-20 border-t border-white/5 text-center bg-[#01040f] text-gray-500 text-xs tracking-wider uppercase font-mono">
        © {new Date().getFullYear()} SERENA SAIL Logistics. Connected securely via Neon Serverless PostgreSQL.
      </footer>
    </main>
  );
}
