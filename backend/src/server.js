import express from "express";
import http from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import { getRuntimeMode } from "./utils/platform.js";
import { createLogRouter } from "./routes/logRoutes.js";
import { buildStats } from "./services/statsService.js";
import { LinuxLogReader } from "./services/linuxLogReader.js";
import { MockLogGenerator } from "./services/mockGenerator.js";

const app = express();
const server = http.createServer(app);
const runtime = getRuntimeMode();
const state = {
  runtime,
  logs: [],
  paused: false,
  lastError: null
};

const io = new Server(server, {
  cors: {
    origin: env.frontendUrl,
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: env.frontendUrl }));
app.use(express.json());
app.use("/api", createLogRouter(state));

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    runtime,
    logCount: state.logs.length,
    lastError: state.lastError
  });
});

function pushLog(log) {
  if (state.paused) return;

  state.logs.unshift(log);
  state.logs = state.logs.slice(0, env.maxLogs);

  io.emit("syscall:new", log);
  io.emit("stats:update", buildStats(state.logs));
}

function reportError(message) {
  if (!message) return;
  state.lastError = message;
  console.error(`[monitor] ${message}`);
  io.emit("monitor:error", { message });
}

io.on("connection", (socket) => {
  socket.emit("monitor:status", {
    runtime,
    paused: state.paused,
    lastError: state.lastError
  });
  socket.emit("logs:init", state.logs);
  socket.emit("stats:update", buildStats(state.logs));

  socket.on("monitor:pause", () => {
    state.paused = true;
    io.emit("monitor:status", { runtime, paused: true, lastError: state.lastError });
  });

  socket.on("monitor:resume", () => {
    state.paused = false;
    io.emit("monitor:status", { runtime, paused: false, lastError: state.lastError });
  });
});

const monitor =
  runtime.mode === "linux"
    ? new LinuxLogReader(pushLog, reportError)
    : new MockLogGenerator(pushLog);

monitor.start();

server.listen(env.port, () => {
  console.log(`Syscall monitor backend running on http://localhost:${env.port}`);
  console.log(`Runtime: ${runtime.label}`);
});

process.on("SIGINT", () => {
  monitor.stop();
  server.close(() => process.exit(0));
});

