import { Activity, MonitorCog } from "lucide-react";

export function StatusBadge({ status, connected }) {
  const label = status?.runtime?.label || "Connecting";
  const isMock = status?.runtime?.mode === "mock";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 font-mono text-xs">
      <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_12px_#34d399]" : "bg-rose-400"}`} />
      <span className="text-slate-200">{connected ? "Socket Online" : "Socket Offline"}</span>
      <span className="text-slate-600">/</span>
      {isMock ? <MonitorCog size={14} className="text-amber-300" /> : <Activity size={14} className="text-emerald-300" />}
      <span className={isMock ? "text-amber-200" : "text-emerald-200"}>{label}</span>
    </div>
  );
}

