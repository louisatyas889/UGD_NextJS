export const transportModeOptions = ["Darat", "Udara", "Laut"] as const;
export const deliveryTypeOptions = ["Biasa", "Cepat", "Vvip"] as const;
export const shipmentStatusOptions = [
  "Diproses",
  "Pending",
  "Dalam Pengiriman",
  "Sampai Tujuan",
  "Selesai",
] as const;
export const itemStatusOptions = [
  "Siap Kirim",
  "Diproses",
  "Dalam Pengiriman",
  "Sampai Tujuan",
  "Selesai",
] as const;
export const transactionStatusOptions = [
  "Belum Dibayar",
  "Pending",
  "Lunas",
  "Refund",
] as const;
export const vehicleStatusOptions = [
  "Siap Jalan",
  "Dalam Perjalanan",
  "Maintenance",
  "Tidak Aktif",
] as const;

export type CargoFormData = {
  shippingDate: string;
  senderName: string;
  recipientName: string;
  phone: string;
  originCity: string;
  destinationCity: string;
  itemName: string;
  itemType: string;
  itemWeightKg: string;
  shippingPrice: string;
  transportMode: (typeof transportModeOptions)[number];
  deliveryType: (typeof deliveryTypeOptions)[number];
  shipmentStatus: (typeof shipmentStatusOptions)[number];
  itemStatus: (typeof itemStatusOptions)[number];
  transactionStatus: (typeof transactionStatusOptions)[number];
  description: string;
  vehicleName: string;
  vehicleType: string;
  vehicleCode: string;
  vehicleCapacityKg: string;
  vehicleStatus: (typeof vehicleStatusOptions)[number];
};

export type CargoRecord = {
  id: number;
  trackingNumber: string;
  shippingDate: string;
  senderName: string;
  recipientName: string;
  phone: string;
  originCity: string;
  destinationCity: string;
  itemName: string;
  itemType: string;
  itemWeightKg: number;
  shippingPrice: number;
  transportMode: (typeof transportModeOptions)[number];
  deliveryType: (typeof deliveryTypeOptions)[number];
  shipmentStatus: string;
  itemStatus: string;
  transactionStatus: string;
  description: string;
  vehicleName: string;
  vehicleType: string;
  vehicleCode: string;
  vehicleCapacityKg: number;
  vehicleStatus: string;
  createdAt: string;
  updatedAt: string;
};

export type CargoSummary = {
  totalShipments: number;
  landShipments: number;
  airShipments: number;
  seaShipments: number;
  completedShipments: number;
  totalRevenue: number;
};

export const emptyCargoFormData: CargoFormData = {
  shippingDate: "",
  senderName: "",
  recipientName: "",
  phone: "",
  originCity: "",
  destinationCity: "",
  itemName: "",
  itemType: "",
  itemWeightKg: "",
  shippingPrice: "",
  transportMode: "Darat",
  deliveryType: "Biasa",
  shipmentStatus: "Diproses",
  itemStatus: "Siap Kirim",
  transactionStatus: "Belum Dibayar",
  description: "",
  vehicleName: "",
  vehicleType: "",
  vehicleCode: "",
  vehicleCapacityKg: "",
  vehicleStatus: "Siap Jalan",
};
