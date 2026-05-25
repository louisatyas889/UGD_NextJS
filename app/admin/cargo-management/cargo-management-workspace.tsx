'use client';

import type { CSSProperties, FormEvent } from "react";
import { useDeferredValue, useEffect, useState } from "react";
import {
  deliveryTypeOptions,
  emptyCargoFormData,
  itemStatusOptions,
  shipmentStatusOptions,
  transactionStatusOptions,
  transportModeOptions,
  vehicleStatusOptions,
  type CargoFormData,
  type CargoRecord,
  type CargoSummary,
} from "@/app/lib/cargo-types";
import DataSearchInput from "@/app/ui/data-search-input";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

type CargoApiResponse = {
  records: CargoRecord[];
  summary: CargoSummary;
};

type CargoMutationResponse = {
  message: string;
  record?: CargoRecord | null;
};

function buildFormDataFromRecord(record: CargoRecord): CargoFormData {
  return {
    shippingDate: record.shippingDate,
    senderName: record.senderName,
    recipientName: record.recipientName,
    phone: record.phone,
    originCity: record.originCity,
    destinationCity: record.destinationCity,
    itemName: record.itemName,
    itemType: record.itemType,
    itemWeightKg: String(record.itemWeightKg),
    shippingPrice: String(record.shippingPrice),
    transportMode: record.transportMode,
    deliveryType: record.deliveryType,
    shipmentStatus: record.shipmentStatus as CargoFormData["shipmentStatus"],
    itemStatus: record.itemStatus as CargoFormData["itemStatus"],
    transactionStatus: record.transactionStatus as CargoFormData["transactionStatus"],
    description: record.description,
    vehicleName: record.vehicleName,
    vehicleType: record.vehicleType,
    vehicleCode: record.vehicleCode,
    vehicleCapacityKg: String(record.vehicleCapacityKg),
    vehicleStatus: record.vehicleStatus as CargoFormData["vehicleStatus"],
  };
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "cyan" | "green" | "amber" | "rose" | "violet";
}) {
  const colors: Record<
    "cyan" | "green" | "amber" | "rose" | "violet",
    { background: string; color: string; border: string }
  > = {
    cyan: {
      background: "rgba(34,211,238,0.12)",
      color: "#67e8f9",
      border: "rgba(34,211,238,0.22)",
    },
    green: {
      background: "rgba(74,222,128,0.12)",
      color: "#86efac",
      border: "rgba(74,222,128,0.22)",
    },
    amber: {
      background: "rgba(251,191,36,0.12)",
      color: "#fcd34d",
      border: "rgba(251,191,36,0.22)",
    },
    rose: {
      background: "rgba(251,113,133,0.12)",
      color: "#fda4af",
      border: "rgba(251,113,133,0.22)",
    },
    violet: {
      background: "rgba(168,85,247,0.12)",
      color: "#d8b4fe",
      border: "rgba(168,85,247,0.22)",
    },
  };

  const active = colors[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        borderRadius: "999px",
        border: `1px solid ${active.border}`,
        background: active.background,
        color: active.color,
        padding: "5px 10px",
        fontSize: "10px",
        fontFamily: "'Share Tech Mono', monospace",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}

function getShipmentTone(status: string): "cyan" | "green" | "amber" | "rose" | "violet" {
  if (status === "Selesai" || status === "Sampai Tujuan") {
    return "green";
  }
  if (status === "Pending") {
    return "amber";
  }
  if (status === "Diproses") {
    return "violet";
  }
  if (status === "Dalam Pengiriman") {
    return "cyan";
  }
  return "rose";
}

export default function CargoManagementWorkspace() {
  const [records, setRecords] = useState<CargoRecord[]>([]);
  const [summary, setSummary] = useState<CargoSummary | null>(null);
  const [formData, setFormData] = useState<CargoFormData>(emptyCargoFormData);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("Sinkronisasi database aktif.");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  async function loadRecords(query = "") {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/cargo?query=${encodeURIComponent(query)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as CargoApiResponse & { message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? "Gagal mengambil data cargo.");
      }

      setRecords(data.records);
      setSummary(data.summary);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal mengambil data cargo.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRecords(deferredSearchQuery);
  }, [deferredSearchQuery]);

  function resetForm(nextMessage = "Form siap dipakai untuk data cargo baru.") {
    setFormData(emptyCargoFormData);
    setEditingId(null);
    setStatusMessage(nextMessage);
    setErrorMessage("");
  }

  function handleFieldChange<K extends keyof CargoFormData>(
    field: K,
    value: CargoFormData[K],
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const endpoint =
        editingId === null ? "/api/admin/cargo" : `/api/admin/cargo/${editingId}`;
      const method = editingId === null ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as CargoMutationResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message ?? "Proses penyimpanan gagal.");
      }

      resetForm(data.message);
      await loadRecords(searchQuery);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menyimpan data cargo.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Hapus data cargo ini dari database?");
    if (!confirmed) {
      return;
    }

    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/cargo/${id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? "Gagal menghapus data cargo.");
      }

      if (editingId === id) {
        resetForm();
      }

      setStatusMessage(data.message ?? "Data cargo berhasil dihapus.");
      await loadRecords(searchQuery);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menghapus data cargo.";
      setErrorMessage(message);
    }
  }

  function handleEdit(record: CargoRecord) {
    setEditingId(record.id);
    setFormData(buildFormDataFromRecord(record));
    setStatusMessage(`Mode edit aktif untuk resi ${record.trackingNumber}.`);
    setErrorMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main style={{ padding: "24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono&display=swap');
        @media (max-width: 1100px) {
          .cargo-panel-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .cargo-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              color: "#6b7280",
              letterSpacing: "0.18em",
              fontSize: "10px",
              marginBottom: "6px",
            }}
          >
            ADMIN CARGO CONTROL
          </p>
          <h1
            style={{
              fontSize: "34px",
              fontFamily: "'Orbitron', sans-serif",
              marginBottom: "8px",
            }}
          >
            Cargo Management
          </h1>
          <p style={{ color: "#9ca3af", maxWidth: "760px", lineHeight: 1.6 }}>
            Halaman admin ini sudah menangani CRUDS cargo darat, udara, dan laut
            langsung ke database Neon. Data kendaraan, barang, dan transaksi
            disimpan sinkron melalui relasi tabel.
          </p>
        </div>

        <div
          style={{
            minWidth: "260px",
            border: "1px solid rgba(168,85,247,0.2)",
            background: "linear-gradient(135deg, rgba(17,17,25,0.98), rgba(8,8,13,0.98))",
            borderRadius: "18px",
            padding: "16px 18px",
          }}
        >
          <p
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "10px",
              color: "#a855f7",
              letterSpacing: "0.14em",
              marginBottom: "10px",
            }}
          >
            STATUS SISTEM
          </p>
          <p style={{ color: "#e5e7eb", fontSize: "14px", lineHeight: 1.6 }}>
            {statusMessage}
          </p>
          {errorMessage ? (
            <p style={{ color: "#fda4af", marginTop: "10px", fontSize: "13px" }}>
              {errorMessage}
            </p>
          ) : null}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        {[
          {
            label: "Total Pengiriman",
            value: summary?.totalShipments ?? 0,
            color: "#22d3ee",
          },
          {
            label: "Cargo Darat",
            value: summary?.landShipments ?? 0,
            color: "#a855f7",
          },
          {
            label: "Cargo Udara",
            value: summary?.airShipments ?? 0,
            color: "#f59e0b",
          },
          {
            label: "Cargo Laut",
            value: summary?.seaShipments ?? 0,
            color: "#34d399",
          },
          {
            label: "Selesai / Sampai",
            value: summary?.completedShipments ?? 0,
            color: "#4ade80",
          },
          {
            label: "Total Tarif",
            value: formatCurrency(summary?.totalRevenue ?? 0),
            color: "#f472b6",
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(13,13,18,0.95)",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <p
              style={{
                color: "#6b7280",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "10px",
                letterSpacing: "0.12em",
                marginBottom: "10px",
              }}
            >
              {card.label}
            </p>
            <p
              style={{
                color: card.color,
                fontSize: "28px",
                fontWeight: 700,
                fontFamily: "'Rajdhani', sans-serif",
              }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section
        className="cargo-panel-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            background: "rgba(12,12,18,0.96)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            padding: "20px",
            position: "sticky",
            top: "72px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <div>
              <p
                style={{
                  color: "#6b7280",
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  marginBottom: "6px",
                }}
              >
                {editingId === null ? "CREATE" : "UPDATE"} CARGO
              </p>
              <h2 style={{ fontSize: "22px", fontFamily: "'Rajdhani', sans-serif" }}>
                {editingId === null ? "Tambah Data Cargo" : "Edit Data Cargo"}
              </h2>
            </div>
            <button
              onClick={() => resetForm()}
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "#9ca3af",
                padding: "8px 12px",
                borderRadius: "999px",
                cursor: "pointer",
                fontSize: "12px",
              }}
              type="button"
            >
              Reset
            </button>
          </div>

          <div
            className="cargo-form-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <label style={{ gridColumn: "1 / -1" }}>
              <span style={labelStyle}>No Resi</span>
              <input
                disabled
                value={editingId === null ? "Auto generated saat submit" : "Menggunakan no resi yang sudah ada"}
                style={disabledInputStyle}
              />
            </label>

            <label>
              <span style={labelStyle}>Tanggal Kirim</span>
              <input
                onChange={(event) => handleFieldChange("shippingDate", event.target.value)}
                required
                style={inputStyle}
                type="date"
                value={formData.shippingDate}
              />
            </label>

            <label>
              <span style={labelStyle}>No Telepon</span>
              <input
                onChange={(event) => handleFieldChange("phone", event.target.value)}
                required
                style={inputStyle}
                type="text"
                value={formData.phone}
              />
            </label>

            <label>
              <span style={labelStyle}>Nama Pengirim</span>
              <input
                onChange={(event) => handleFieldChange("senderName", event.target.value)}
                required
                style={inputStyle}
                type="text"
                value={formData.senderName}
              />
            </label>

            <label>
              <span style={labelStyle}>Nama Penerima</span>
              <input
                onChange={(event) => handleFieldChange("recipientName", event.target.value)}
                required
                style={inputStyle}
                type="text"
                value={formData.recipientName}
              />
            </label>

            <label>
              <span style={labelStyle}>Kota Asal</span>
              <input
                onChange={(event) => handleFieldChange("originCity", event.target.value)}
                required
                style={inputStyle}
                type="text"
                value={formData.originCity}
              />
            </label>

            <label>
              <span style={labelStyle}>Kota Tujuan</span>
              <input
                onChange={(event) => handleFieldChange("destinationCity", event.target.value)}
                required
                style={inputStyle}
                type="text"
                value={formData.destinationCity}
              />
            </label>

            <label>
              <span style={labelStyle}>Nama Barang</span>
              <input
                onChange={(event) => handleFieldChange("itemName", event.target.value)}
                required
                style={inputStyle}
                type="text"
                value={formData.itemName}
              />
            </label>

            <label>
              <span style={labelStyle}>Jenis Barang</span>
              <input
                onChange={(event) => handleFieldChange("itemType", event.target.value)}
                required
                style={inputStyle}
                type="text"
                value={formData.itemType}
              />
            </label>

            <label>
              <span style={labelStyle}>Berat (Kg)</span>
              <input
                min="0.01"
                onChange={(event) => handleFieldChange("itemWeightKg", event.target.value)}
                required
                step="0.01"
                style={inputStyle}
                type="number"
                value={formData.itemWeightKg}
              />
            </label>

            <label>
              <span style={labelStyle}>Tarif Pengiriman</span>
              <input
                min="0"
                onChange={(event) => handleFieldChange("shippingPrice", event.target.value)}
                required
                step="1000"
                style={inputStyle}
                type="number"
                value={formData.shippingPrice}
              />
            </label>

            <label>
              <span style={labelStyle}>Moda Cargo</span>
              <select
                onChange={(event) =>
                  handleFieldChange("transportMode", event.target.value as CargoFormData["transportMode"])
                }
                style={inputStyle}
                value={formData.transportMode}
              >
                {transportModeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={labelStyle}>Jenis Pengiriman</span>
              <select
                onChange={(event) =>
                  handleFieldChange("deliveryType", event.target.value as CargoFormData["deliveryType"])
                }
                style={inputStyle}
                value={formData.deliveryType}
              >
                {deliveryTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={labelStyle}>Status Pengiriman</span>
              <select
                onChange={(event) =>
                  handleFieldChange("shipmentStatus", event.target.value as CargoFormData["shipmentStatus"])
                }
                style={inputStyle}
                value={formData.shipmentStatus}
              >
                {shipmentStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={labelStyle}>Status Barang</span>
              <select
                onChange={(event) =>
                  handleFieldChange("itemStatus", event.target.value as CargoFormData["itemStatus"])
                }
                style={inputStyle}
                value={formData.itemStatus}
              >
                {itemStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={labelStyle}>Status Transaksi</span>
              <select
                onChange={(event) =>
                  handleFieldChange(
                    "transactionStatus",
                    event.target.value as CargoFormData["transactionStatus"],
                  )
                }
                style={inputStyle}
                value={formData.transactionStatus}
              >
                {transactionStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={labelStyle}>Nama Kendaraan</span>
              <input
                onChange={(event) => handleFieldChange("vehicleName", event.target.value)}
                required
                style={inputStyle}
                type="text"
                value={formData.vehicleName}
              />
            </label>

            <label>
              <span style={labelStyle}>Jenis Kendaraan</span>
              <input
                onChange={(event) => handleFieldChange("vehicleType", event.target.value)}
                required
                style={inputStyle}
                type="text"
                value={formData.vehicleType}
              />
            </label>

            <label>
              <span style={labelStyle}>Plat / Kode Kendaraan</span>
              <input
                onChange={(event) => handleFieldChange("vehicleCode", event.target.value)}
                required
                style={inputStyle}
                type="text"
                value={formData.vehicleCode}
              />
            </label>

            <label>
              <span style={labelStyle}>Kapasitas Muatan (Kg)</span>
              <input
                min="0.01"
                onChange={(event) => handleFieldChange("vehicleCapacityKg", event.target.value)}
                required
                step="0.01"
                style={inputStyle}
                type="number"
                value={formData.vehicleCapacityKg}
              />
            </label>

            <label style={{ gridColumn: "1 / -1" }}>
              <span style={labelStyle}>Status Kendaraan</span>
              <select
                onChange={(event) =>
                  handleFieldChange("vehicleStatus", event.target.value as CargoFormData["vehicleStatus"])
                }
                style={inputStyle}
                value={formData.vehicleStatus}
              >
                {vehicleStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ gridColumn: "1 / -1" }}>
              <span style={labelStyle}>Deskripsi / Catatan Barang</span>
              <textarea
                onChange={(event) => handleFieldChange("description", event.target.value)}
                rows={4}
                style={{ ...inputStyle, borderRadius: "14px", resize: "vertical" }}
                value={formData.description}
              />
            </label>
          </div>

          <button
            disabled={isSubmitting}
            style={{
              width: "100%",
              marginTop: "18px",
              padding: "14px 16px",
              borderRadius: "14px",
              border: "none",
              background: isSubmitting
                ? "rgba(168,85,247,0.45)"
                : "linear-gradient(90deg, #7c3aed, #22d3ee)",
              color: "#ffffff",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.14em",
              cursor: isSubmitting ? "wait" : "pointer",
            }}
            type="submit"
          >
            {isSubmitting
              ? "MENYIMPAN KE DATABASE..."
              : editingId === null
                ? "TAMBAH DATA CARGO"
                : "UPDATE DATA CARGO"}
          </button>
        </form>

        <div
          style={{
            background: "rgba(12,12,18,0.96)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            padding: "20px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              marginBottom: "18px",
            }}
          >
            <div>
              <p
                style={{
                  color: "#6b7280",
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  marginBottom: "6px",
                }}
              >
                READ + SEARCH
              </p>
              <h2 style={{ fontSize: "22px", fontFamily: "'Rajdhani', sans-serif" }}>
                Data Cargo Dari Database
              </h2>
            </div>

            <DataSearchInput
              ariaLabel="Search cargo records"
              onChange={setSearchQuery}
              placeholder="Cari no resi, pengirim, penerima, atau barang..."
              value={searchQuery}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1100px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    color: "#6b7280",
                    textAlign: "left",
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "10px",
                  }}
                >
                  <th style={tableHeadStyle}>No Resi</th>
                  <th style={tableHeadStyle}>Pengirim / Penerima</th>
                  <th style={tableHeadStyle}>Rute</th>
                  <th style={tableHeadStyle}>Barang</th>
                  <th style={tableHeadStyle}>Kendaraan</th>
                  <th style={tableHeadStyle}>Status</th>
                  <th style={tableHeadStyle}>Tarif</th>
                  <th style={tableHeadStyle}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} style={emptyCellStyle}>
                      Mengambil data cargo dari Neon...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={emptyCellStyle}>
                      Tidak ada data yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr
                      key={record.id}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        verticalAlign: "top",
                      }}
                    >
                      <td style={tableCellStyle}>
                        <div
                          style={{
                            color: "#22d3ee",
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: "11px",
                            marginBottom: "6px",
                          }}
                        >
                          {record.trackingNumber}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                          {formatDate(record.shippingDate)}
                        </div>
                        <div style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>
                          {record.transportMode} / {record.deliveryType}
                        </div>
                      </td>

                      <td style={tableCellStyle}>
                        <div style={{ fontWeight: 600 }}>{record.senderName}</div>
                        <div style={{ color: "#cbd5e1", marginTop: "6px" }}>
                          ke {record.recipientName}
                        </div>
                        <div style={{ color: "#64748b", fontSize: "12px", marginTop: "6px" }}>
                          {record.phone}
                        </div>
                      </td>

                      <td style={tableCellStyle}>
                        <div>{record.originCity}</div>
                        <div style={{ color: "#64748b", margin: "6px 0" }}>menuju</div>
                        <div>{record.destinationCity}</div>
                      </td>

                      <td style={tableCellStyle}>
                        <div style={{ fontWeight: 600 }}>{record.itemName}</div>
                        <div style={{ color: "#cbd5e1", marginTop: "6px" }}>
                          {record.itemType}
                        </div>
                        <div style={{ color: "#64748b", marginTop: "6px", fontSize: "12px" }}>
                          {record.itemWeightKg} Kg
                        </div>
                      </td>

                      <td style={tableCellStyle}>
                        <div style={{ fontWeight: 600 }}>{record.vehicleName}</div>
                        <div style={{ color: "#cbd5e1", marginTop: "6px" }}>
                          {record.vehicleType}
                        </div>
                        <div style={{ color: "#64748b", marginTop: "6px", fontSize: "12px" }}>
                          {record.vehicleCode} • {record.vehicleCapacityKg} Kg
                        </div>
                      </td>

                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <StatusBadge
                            label={record.shipmentStatus}
                            tone={getShipmentTone(record.shipmentStatus)}
                          />
                          <StatusBadge label={record.itemStatus} tone="violet" />
                          <StatusBadge label={record.transactionStatus} tone="amber" />
                        </div>
                      </td>

                      <td style={tableCellStyle}>
                        <div
                          style={{
                            color: "#f8fafc",
                            fontWeight: 600,
                            marginBottom: "8px",
                          }}
                        >
                          {formatCurrency(record.shippingPrice)}
                        </div>
                        <div style={{ color: "#64748b", fontSize: "12px" }}>
                          {record.description || "Tanpa catatan"}
                        </div>
                      </td>

                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <button
                            onClick={() => handleEdit(record)}
                            style={actionButtonStyle("#22d3ee")}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            style={actionButtonStyle("#fb7185")}
                            type="button"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "7px",
  color: "#94a3b8",
  fontSize: "11px",
  fontFamily: "'Share Tech Mono', monospace",
  letterSpacing: "0.08em",
};

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "#f8fafc",
  padding: "11px 12px",
  fontSize: "13px",
  marginBottom: "12px",
  outline: "none",
};

const disabledInputStyle: CSSProperties = {
  ...inputStyle,
  color: "#64748b",
  cursor: "not-allowed",
};

const tableHeadStyle: CSSProperties = {
  padding: "14px 12px",
  fontWeight: 400,
};

const tableCellStyle: CSSProperties = {
  padding: "14px 12px",
  fontSize: "14px",
  color: "#e5e7eb",
};

const emptyCellStyle: CSSProperties = {
  padding: "28px 16px",
  textAlign: "center",
  color: "#64748b",
  fontFamily: "'Share Tech Mono', monospace",
  letterSpacing: "0.12em",
  fontSize: "10px",
};

function actionButtonStyle(color: string): CSSProperties {
  return {
    border: `1px solid ${color}55`,
    background: `${color}14`,
    color,
    padding: "10px 12px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "12px",
    width: "100%",
  };
}
