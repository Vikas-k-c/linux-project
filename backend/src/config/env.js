import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  maxLogs: Number(process.env.MAX_LOGS || 1000),
  mockIntervalMs: Number(process.env.MOCK_INTERVAL_MS || 1800),
  forceMock: String(process.env.FORCE_MOCK || "false").toLowerCase() === "true"
};

