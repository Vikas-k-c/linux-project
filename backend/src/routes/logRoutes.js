import express from "express";
import { buildStats } from "../services/statsService.js";

export function createLogRouter(state) {
  const router = express.Router();

  router.get("/logs", (req, res) => {
    res.json({
      mode: state.runtime,
      logs: state.logs
    });
  });

  router.get("/stats", (req, res) => {
    res.json({
      mode: state.runtime,
      stats: buildStats(state.logs)
    });
  });

  return router;
}

