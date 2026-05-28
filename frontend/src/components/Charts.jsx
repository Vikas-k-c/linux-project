import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const colors = ["#22d3ee", "#34d399", "#fbbf24", "#fb7185", "#a78bfa", "#60a5fa", "#f97316"];

const tooltipStyle = {
  background: "#07111a",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px",
  color: "#e2e8f0"
};

const tooltipLabelStyle = {
  color: "#cbd5e1",
  fontWeight: 600
};

const tooltipItemStyle = {
  color: "#f8fafc"
};

export function Charts({ stats }) {
  const topProcesses = stats?.topProcesses || [];
  const distribution = stats?.syscallDistribution || [];
  const perMinute = stats?.syscallsPerMinute || [];

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="h-80 rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <h3 className="mb-4 font-mono text-sm uppercase tracking-[0.2em] text-slate-300">Top Processes</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={topProcesses}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
            <XAxis dataKey="process" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#22d3ee" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-80 rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <h3 className="mb-4 font-mono text-sm uppercase tracking-[0.2em] text-slate-300">Syscall Mix</h3>
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie data={distribution} dataKey="count" nameKey="syscall" outerRadius={92} innerRadius={48} paddingAngle={3}>
              {distribution.map((entry, index) => (
                <Cell key={entry.syscall} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="h-80 rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <h3 className="mb-4 font-mono text-sm uppercase tracking-[0.2em] text-slate-300">Syscalls / Minute</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={perMinute}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
            <XAxis dataKey="minute" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
            <Line type="monotone" dataKey="count" stroke="#34d399" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
