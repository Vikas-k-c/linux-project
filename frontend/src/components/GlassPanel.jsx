import { motion } from "framer-motion";

export function GlassPanel({ children, className = "" }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-lg border border-white/10 bg-panel p-5 shadow-glow backdrop-blur-xl ${className}`}
    >
      {children}
    </motion.section>
  );
}

