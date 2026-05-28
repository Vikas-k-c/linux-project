import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { api, API_URL } from "../api/client";

export function useSyscallSocket() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState(null);
  const [latestLog, setLatestLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const socket = useMemo(
    () =>
      io(API_URL, {
        autoConnect: false,
        transports: ["websocket", "polling"]
      }),
    []
  );

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [logsResponse, statsResponse] = await Promise.all([api.get("/api/logs"), api.get("/api/stats")]);
        setLogs(logsResponse.data.logs || []);
        setStats(statsResponse.data.stats || null);
        setStatus({ runtime: logsResponse.data.mode });
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("logs:init", (initialLogs) => setLogs(initialLogs || []));
    socket.on("monitor:status", setStatus);
    socket.on("stats:update", setStats);
    socket.on("syscall:new", (log) => {
      setLatestLog(log);
      setLogs((current) => [log, ...current].slice(0, 1000));
    });
    socket.on("monitor:error", (error) => {
      setStatus((current) => ({ ...current, lastError: error.message }));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [socket]);

  return {
    logs,
    stats,
    status,
    latestLog,
    loading,
    connected,
    pause: () => socket.emit("monitor:pause"),
    resume: () => socket.emit("monitor:resume")
  };
}

