type SuspensePanelLoaderProps = {
  rows?: number;
  title: string;
};

export default function SuspensePanelLoader({
  rows = 5,
  title,
}: SuspensePanelLoaderProps) {
  return (
    <section className="rounded-[8px] border border-white/10 bg-[#0f0f1a] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.34)]">
      <div className="animate-pulse">
        <div className="h-3 w-40 rounded-full bg-white/10" />
        <div className="mt-4 h-9 w-full max-w-xs rounded-full bg-white/10" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: rows }, (_, index) => (
            <div
              key={`${title}-${index}`}
              className="h-14 rounded-[6px] border border-white/6 bg-white/[0.03]"
            />
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-400">{title}</p>
    </section>
  );
}
