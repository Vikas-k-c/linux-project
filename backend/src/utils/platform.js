import os from "node:os";
import { env } from "../config/env.js";

export function getRuntimeMode() {
  if (env.forceMock) {
    return {
      platform: os.platform(),
      mode: "mock",
      label: "Forced Demo Mode"
    };
  }

  const platform = os.platform();

  if (platform === "linux") {
    return {
      platform,
      mode: "linux",
      label: "Linux Monitoring Active"
    };
  }

  return {
    platform,
    mode: "mock",
    label: platform === "win32" ? "Windows Demo Mode" : "Demo Mode"
  };
}

