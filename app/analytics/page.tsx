import { fetchVesselData } from "../lib/data";
import AnalyticsPageClient from "./analytics-page-client";

export const revalidate = 0;

export default async function AnalyticsPage() {
  // 1. Ambil data mentah dari fungsi query Neon
  const vesselsFromDb = await fetchVesselData();

  // 2. Lakukan type-casting 'as any' agar TypeScript tidak menganggapnya sebagai RowList mentah
  const safeVessels = (vesselsFromDb || []) as any[];

  // 3. Petakan ulang agar nama properti database pas dengan properti interface DbVessel di client
  const mappedVessels = safeVessels.map((v) => ({
    id: v.id,
    destination: v.destination || "",
    status: v.status || "",
    status_color: v.status_color || "#a855f7",
    eta: v.eta || ""
  }));

  return <AnalyticsPageClient dbVessels={mappedVessels} />;
}
