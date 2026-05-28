import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Cpu, Moon, Server, Shield, Sun, TerminalSquare, Zap } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSyscallSocket } from "./hooks/useSyscallSocket";
import { GlassPanel } from "./components/GlassPanel";
import { MetricCard } from "./components/MetricCard";
import { StatusBadge } from "./components/StatusBadge";
import { LogTable } from "./components/LogTable";
import { Charts } from "./components/Charts";
import { NotificationToast } from "./components/NotificationToast";

const pages = [
  { id: "dashboard", label: "Dashboard", icon: Cpu },
  { id: "live", label: "Live Monitor", icon: TerminalSquare },
  { id: "stats", label: "Statistics", icon: BarChart3 },
  { id: "about", label: "About Project", icon: Shield }
];

export default function App() {
  const { logs, stats, status, latestLog, loading, connected, pause, resume } = useSyscallSocket();
  const [page, setPage] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [syscallFilter, setSyscallFilter] = useState("all");
  const [dark, setDark] = useState(true);
  const [toastLog, setToastLog] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    if (!latestLog) return;
    setToastLog(latestLog);
    const timer = setTimeout(() => setToastLog(null), 2600);
    return () => clearTimeout(timer);
  }, [latestLog]);

  const mostUsed = stats?.mostUsedSyscall?.syscall || "none";
  const activeProcesses = stats?.topProcesses?.length || 0;
  const perMinute = stats?.syscallsPerMinute?.at(-1)?.count || 0;

  const content = useMemo(() => {
    if (page === "live") {
      return (
        <GlassPanel>
          <LogTable
            logs={logs}
            search={search}
            setSearch={setSearch}
            syscallFilter={syscallFilter}
            setSyscallFilter={setSyscallFilter}
            paused={Boolean(status?.paused)}
            onPause={pause}
            onResume={resume}
          />
        </GlassPanel>
      );
    }

    if (page === "stats") {
      return (
        <GlassPanel>
          <Charts stats={stats} />
        </GlassPanel>
      );
    }

    if (page === "about") {
      return (
        <GlassPanel className="space-y-5">
          <div className="flex items-center gap-3">
            <Shield className="text-emerald-300" />
            <h2 className="text-2xl font-semibold text-white">Cross-Platform Linux System Call Monitoring Dashboard</h2>
          </div>
          <p className="max-w-4xl text-slate-300">
            The kernel module remains isolated in <span className="font-mono text-cyan-200">kernel_module/</span>. On Linux, the backend reads
            kernel output with <span className="font-mono text-cyan-200">dmesg --follow</span>, parses syscall events, and streams them to this
            dashboard. On Windows, the same backend starts in demo mode and generates realistic syscall activity for presentations.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {["React + Tailwind UI", "Express + Socket.IO API", "Linux dmesg integration"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 font-mono text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </GlassPanel>
      );
    }

    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Activity} label="Total Syscalls" value={stats?.totalSyscalls || 0} accent="text-emerald-300" />
          <MetricCard icon={Server} label="Processes" value={activeProcesses} accent="text-cyan-300" />
          <MetricCard icon={Zap} label="Top Syscall" value={mostUsed} accent="text-amber-300" />
          <MetricCard icon={BarChart3} label="Latest Minute" value={perMinute} accent="text-rose-300" />
        </div>
        <GlassPanel>
          <Charts stats={stats} />
        </GlassPanel>
        <GlassPanel>
          <LogTable
            logs={logs.slice(0, 12)}
            search={search}
            setSearch={setSearch}
            syscallFilter={syscallFilter}
            setSyscallFilter={setSyscallFilter}
            paused={Boolean(status?.paused)}
            onPause={pause}
            onResume={resume}
          />
        </GlassPanel>
      </div>
    );
  }, [page, logs, search, syscallFilter, status, stats, activeProcesses, mostUsed, perMinute, pause, resume]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <NotificationToast log={toastLog} />
      <div className="terminal-grid fixed inset-0 opacity-70" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200 shadow-glow">
                <TerminalSquare size={28} />
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.26em] text-emerald-300">Project4 Integration</p>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">Linux Syscall Monitor</h1>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <StatusBadge status={status} connected={connected} />
            <button
              onClick={() => setDark((value) => !value)}
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] p-3 text-slate-200 transition hover:bg-white/[0.1]"
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-black/25 p-2 backdrop-blur">
          {pages.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                page === item.id ? "bg-cyan-300/15 text-cyan-100" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        {loading ? (
          <GlassPanel>
            <div className="flex h-64 items-center justify-center font-mono text-cyan-200">Booting monitor interface...</div>
          </GlassPanel>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={page} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {content}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}

