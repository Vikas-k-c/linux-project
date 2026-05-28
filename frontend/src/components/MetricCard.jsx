import { motion } from "framer-motion";

export function MetricCard({ icon: Icon, label, value, accent = "text-cyan-300" }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-emerald"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 font-mono text-3xl font-semibold text-white"
          >
            {value}
          </motion.p>
        </div>
        <div className={`rounded-md border border-white/10 bg-black/30 p-3 ${accent}`}>
          <Icon size={24} />
        </div>
      </div>
    </motion.div>
  );
}

