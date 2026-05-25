'use client';

import { useActionState, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { initialPanelActionState } from "@/app/admin/panel-action-state";
import {
  deleteFleetVesselAction,
  deleteTrackingPackageAction,
  saveFleetVesselAction,
  saveTrackingPackageAction,
} from "@/app/admin/panel-actions";
import type { TrackingPackageRecord, VesselRecord } from "@/app/lib/admin-panels";
import DataPaginationBar from "@/app/ui/data-pagination-bar";
import DataSearchInput from "@/app/ui/data-search-input";

type Props = {
  packages: TrackingPackageRecord[];
  vessels: VesselRecord[];
};

type VesselForm = {
  id: string;
  subtitle: string;
  destination: string;
  status: string;
  eta: string;
  progressPct: string;
};

type PackageForm = {
  id: string;
  packageSize: string;
  destination: string;
  vesselName: string;
  lat: string;
  lng: string;
};

const emptyVesselForm: VesselForm = {
  id: "",
  subtitle: "",
  destination: "",
  status: "IN TRANSIT",
  eta: "",
  progressPct: "0",
};

const emptyPackageForm: PackageForm = {
  id: "",
  packageSize: "MEDIUM",
  destination: "",
  vesselName: "",
  lat: "0",
  lng: "0",
};

function VesselButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Menyimpan..." : editing ? "Update Vessel" : "Tambah Vessel"}
    </button>
  );
}

function PackageButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Menyimpan..." : editing ? "Update Package" : "Tambah Package"}
    </button>
  );
}

export default function FleetLogisticsBoard({ packages, vessels }: Props) {
  const router = useRouter();
  const [vesselState, vesselAction] = useActionState(
    saveFleetVesselAction,
    initialPanelActionState,
  );
  const [packageState, packageAction] = useActionState(
    saveTrackingPackageAction,
    initialPanelActionState,
  );
  const [vesselForm, setVesselForm] = useState<VesselForm>(emptyVesselForm);
  const [packageForm, setPackageForm] = useState<PackageForm>(emptyPackageForm);
  const [editingVesselId, setEditingVesselId] = useState<string | null>(null);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [vesselQuery, setVesselQuery] = useState("");
  const [packageQuery, setPackageQuery] = useState("");
  const [vesselPage, setVesselPage] = useState(1);
  const [packagePage, setPackagePage] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const deferredVesselQuery = useDeferredValue(vesselQuery);
  const deferredPackageQuery = useDeferredValue(packageQuery);

  useEffect(() => {
    if (vesselState.success) {
      setVesselForm(emptyVesselForm);
      setEditingVesselId(null);
      setFeedback(vesselState.message);
      router.refresh();
    }
  }, [router, vesselState.message, vesselState.success]);

  useEffect(() => {
    if (packageState.success) {
      setPackageForm(emptyPackageForm);
      setEditingPackageId(null);
      setFeedback(packageState.message);
      router.refresh();
    }
  }, [packageState.message, packageState.success, router]);

  const filteredVessels = useMemo(() => {
    const normalized = deferredVesselQuery.trim().toLowerCase();
    if (!normalized) return vessels;
    return vessels.filter((vessel) =>
      [vessel.id, vessel.subtitle, vessel.destination, vessel.status]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [deferredVesselQuery, vessels]);

  const filteredPackages = useMemo(() => {
    const normalized = deferredPackageQuery.trim().toLowerCase();
    if (!normalized) return packages;
    return packages.filter((item) =>
      [item.id, item.packageSize, item.destination, item.vesselName]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [deferredPackageQuery, packages]);

  const vesselPages = Math.max(1, Math.ceil(filteredVessels.length / 5));
  const packagePages = Math.max(1, Math.ceil(filteredPackages.length / 5));
  const safeVesselPage = Math.min(vesselPage, vesselPages);
  const safePackagePage = Math.min(packagePage, packagePages);
  const visibleVessels = filteredVessels.slice((safeVesselPage - 1) * 5, (safeVesselPage - 1) * 5 + 5);
  const visiblePackages = filteredPackages.slice((safePackagePage - 1) * 5, (safePackagePage - 1) * 5 + 5);

  function handleEditVessel(vessel: VesselRecord) {
    setVesselForm({
      id: vessel.id,
      subtitle: vessel.subtitle,
      destination: vessel.destination,
      status: vessel.status,
      eta: vessel.eta,
      progressPct: String(vessel.progressPct),
    });
    setEditingVesselId(vessel.id);
    setFeedback(`Mode edit vessel ${vessel.id} aktif.`);
  }

  function handleEditPackage(item: TrackingPackageRecord) {
    setPackageForm({
      id: item.id,
      packageSize: item.packageSize,
      destination: item.destination,
      vesselName: item.vesselName,
      lat: String(item.lat),
      lng: String(item.lng),
    });
    setEditingPackageId(item.id);
    setFeedback(`Mode edit package ${item.id} aktif.`);
  }

  async function handleDeleteVessel(id: string) {
    if (!window.confirm(`Hapus vessel ${id} dari database?`)) return;
    startTransition(async () => {
      const result = await deleteFleetVesselAction(id);
      setFeedback(result.message);
      if (result.success) router.refresh();
    });
  }

  async function handleDeletePackage(id: string) {
    if (!window.confirm(`Hapus package ${id} dari database?`)) return;
    startTransition(async () => {
      const result = await deleteTrackingPackageAction(id);
      setFeedback(result.message);
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="space-y-6 px-6 pb-14 pt-4 max-md:px-4">
      {feedback ? (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <form action={vesselAction} className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-5 shadow-2xl shadow-black/20">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Vessel Control</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {editingVesselId ? "Edit Vessel" : "Tambah Vessel"}
              </h2>
            </div>
            <button
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300"
              onClick={() => {
                setVesselForm(emptyVesselForm);
                setEditingVesselId(null);
              }}
              type="button"
            >
              Reset
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["id", "VESSEL ID"],
              ["subtitle", "SHIP CODE"],
              ["destination", "DESTINATION"],
              ["status", "STATUS"],
              ["eta", "ETA"],
              ["progressPct", "PROGRESS %"],
            ].map(([field, label]) => (
              <label className="block text-sm text-slate-300" key={field}>
                {label}
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-violet-400/60"
                  name={field}
                  onChange={(event) =>
                    setVesselForm((current) => ({ ...current, [field]: event.target.value }))
                  }
                  value={vesselForm[field as keyof VesselForm]}
                />
                <p className="mt-1 text-xs text-rose-300">{vesselState.fieldErrors?.[field]?.[0]}</p>
              </label>
            ))}
          </div>

          <div className="mt-5">
            <VesselButton editing={Boolean(editingVesselId)} />
          </div>
        </form>

        <form action={packageAction} className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-5 shadow-2xl shadow-black/20">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Package Control</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {editingPackageId ? "Edit Package" : "Tambah Package"}
              </h2>
            </div>
            <button
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300"
              onClick={() => {
                setPackageForm(emptyPackageForm);
                setEditingPackageId(null);
              }}
              type="button"
            >
              Reset
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["id", "PACKAGE ID"],
              ["packageSize", "SIZE"],
              ["destination", "DESTINATION"],
              ["vesselName", "VESSEL NAME"],
              ["lat", "LATITUDE"],
              ["lng", "LONGITUDE"],
            ].map(([field, label]) => (
              <label className="block text-sm text-slate-300" key={field}>
                {label}
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
                  name={field}
                  onChange={(event) =>
                    setPackageForm((current) => ({ ...current, [field]: event.target.value }))
                  }
                  value={packageForm[field as keyof PackageForm]}
                />
                <p className="mt-1 text-xs text-rose-300">{packageState.fieldErrors?.[field]?.[0]}</p>
              </label>
            ))}
          </div>

          <div className="mt-5">
            <PackageButton editing={Boolean(editingPackageId)} />
          </div>
        </form>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-black/20">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Fleet Overview</p>
              <p className="mt-2 text-sm text-slate-400">
                Data vessel dibaca langsung dari Neon. Panel ini sekarang bisa di-scroll
                saat data bertambah banyak.
              </p>
            </div>
            <DataSearchInput
              ariaLabel="Search vessels"
              onChange={setVesselQuery}
              placeholder="Search vessel, route, or destination..."
              value={vesselQuery}
            />
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-950/40">
            <div className="max-h-[460px] overflow-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 text-xs uppercase tracking-[0.2em] text-slate-500 backdrop-blur">
                <tr>
                  <th className="px-3 py-3">Vessel</th>
                  <th className="px-3 py-3">Destination</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">ETA</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleVessels.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-slate-500" colSpan={5}>
                      Tidak ada vessel yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : visibleVessels.map((vessel) => (
                  <tr className="border-b border-white/5" key={vessel.id}>
                    <td className="px-3 py-4">
                      <div className="font-medium text-violet-200">{vessel.id}</div>
                      <div className="text-xs text-slate-500">{vessel.subtitle}</div>
                    </td>
                    <td className="px-3 py-4">{vessel.destination}</td>
                    <td className="px-3 py-4">
                      <div className="font-medium">{vessel.status}</div>
                      <div className="mt-2 h-2 w-full max-w-[130px] overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-violet-400"
                          style={{ width: `${vessel.progressPct}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-slate-500">{vessel.progressPct}%</div>
                    </td>
                    <td className="px-3 py-4">{vessel.eta}</td>
                    <td className="px-3 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100" onClick={() => handleEditVessel(vessel)} type="button">Edit</button>
                        <button className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-100 disabled:opacity-60" disabled={isPending} onClick={() => handleDeleteVessel(vessel.id)} type="button">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <DataPaginationBar
            accentColor="#a855f7"
            currentPage={safeVesselPage}
            itemLabel="vessels"
            mutedColor="#6b7280"
            onPageChange={setVesselPage}
            totalItems={filteredVessels.length}
            totalPages={vesselPages}
            visibleEnd={Math.min((safeVesselPage - 1) * 5 + 5, filteredVessels.length)}
            visibleStart={filteredVessels.length === 0 ? 0 : (safeVesselPage - 1) * 5 + 1}
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-black/20">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Package Overview</p>
              <p className="mt-2 text-sm text-slate-400">
                Data tracking package dibaca dari Neon. Scroll internal aktif untuk
                melihat data lain tanpa memotong layout.
              </p>
            </div>
            <DataSearchInput
              ariaLabel="Search package segments"
              onChange={setPackageQuery}
              placeholder="Search package ID or destination..."
              value={packageQuery}
            />
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-950/40">
            <div className="max-h-[460px] overflow-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 text-xs uppercase tracking-[0.2em] text-slate-500 backdrop-blur">
                <tr>
                  <th className="px-3 py-3">Package</th>
                  <th className="px-3 py-3">Size</th>
                  <th className="px-3 py-3">Destination</th>
                  <th className="px-3 py-3">Vessel</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {visiblePackages.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-slate-500" colSpan={5}>
                      Tidak ada package yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : visiblePackages.map((item) => (
                  <tr className="border-b border-white/5" key={item.id}>
                    <td className="px-3 py-4 font-mono text-slate-200">{item.id}</td>
                    <td className="px-3 py-4">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                        {item.packageSize}
                      </span>
                    </td>
                    <td className="px-3 py-4">{item.destination}</td>
                    <td className="px-3 py-4 text-cyan-300">{item.vesselName}</td>
                    <td className="px-3 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100" onClick={() => handleEditPackage(item)} type="button">Edit</button>
                        <button className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-100 disabled:opacity-60" disabled={isPending} onClick={() => handleDeletePackage(item.id)} type="button">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <DataPaginationBar
            accentColor="#22d3ee"
            currentPage={safePackagePage}
            itemLabel="segments"
            mutedColor="#6b7280"
            onPageChange={setPackagePage}
            totalItems={filteredPackages.length}
            totalPages={packagePages}
            visibleEnd={Math.min((safePackagePage - 1) * 5 + 5, filteredPackages.length)}
            visibleStart={filteredPackages.length === 0 ? 0 : (safePackagePage - 1) * 5 + 1}
          />
        </div>
      </div>
    </div>
  );
}
