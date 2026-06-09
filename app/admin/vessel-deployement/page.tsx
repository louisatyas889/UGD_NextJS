import type { Metadata } from "next";
import type { ReactNode } from "react";
import PrimeTopbar from "../../ui/PrimeTopbar";
import DeploymentWorkspace from "./deployment-workspace";

export const metadata: Metadata = {
  title: "Vessel Deployment | Serena Sail",
  description: "Detail lengkap identitas kapal, lokasi, negara kunjungan, paket kargo, dan kru yang bertugas.",
};

export default function VesselDeployementPage(): ReactNode {
  return (
    <>
      <PrimeTopbar />
      <DeploymentWorkspace />
    </>
  );
}
