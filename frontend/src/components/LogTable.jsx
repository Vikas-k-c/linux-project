import { Pause, Play, Search, Download } from "lucide-react";
import { exportLogsToCsv } from "../utils/exportCsv";

export function LogTable({ logs, search, setSearch, syscallFilter, setSyscallFilter, paused, onPause, onResume }) {
  const syscalls = Array.from(new Set(logs.map((log) => log.syscall))).filter(Boolean).sort();

  const filteredLogs = logs.filter((log) => {
    const matchesProcess = log.process.toLowerCase().includes(search.toLowerCase());
    const matchesSyscall = syscallFilter === "all" || log.syscall === syscallFilter;
    return matchesProcess && matchesSyscall;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <Search size={18} className="text-cyan-300" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search process"
              className="w-full bg-transparent font-mono text-sm text-white outline-none placeholder:text-slate-500"
            />
          </label>
          <select
            value={syscallFilter}
            onChange={(event) => setSyscallFilter(event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 font-mono text-sm text-white outline-none"
          >
            <option value="all">All syscalls</option>
            {syscalls.map((syscall) => (
              <option key={syscall} value={syscall}>
                {syscall}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={paused ? onResume : onPause}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={() => exportLogsToCsv(filteredLogs)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/20"
          >
            <Download size={16} />
            CSV
          </button>
        </div>
      </div>

      <div className="max-h-[560px] overflow-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[760px] border-collapse font-mono text-sm">
          <thead className="sticky top-0 bg-slate-950/95 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">PID</th>
              <th className="px-4 py-3">Process</th>
              <th className="px-4 py-3">Syscall</th>
              <th className="px-4 py-3">Raw Kernel Line</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-t border-white/5 text-slate-200 transition hover:bg-cyan-400/[0.06]">
                <td className="whitespace-nowrap px-4 py-3 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                <td className="px-4 py-3 text-amber-200">{log.pid ?? "-"}</td>
                <td className="px-4 py-3 text-emerald-200">{log.process}</td>
                <td className="px-4 py-3 text-cyan-200">{log.syscall}</td>
                <td className="max-w-[360px] truncate px-4 py-3 text-slate-500" title={log.raw}>
                  {log.raw}
                </td>
              </tr>
            ))}
            {!filteredLogs.length && (
              <tr>
                <td colSpan="5" className="px-4 py-10 text-center text-slate-500">
                  Waiting for syscall activity...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

