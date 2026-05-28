import { spawn } from "node:child_process";
import readline from "node:readline";
import { parseKernelLog } from "./logParser.js";

export class LinuxLogReader {
  constructor(onLog, onError) {
    this.onLog = onLog;
    this.onError = onError;
    this.process = null;
  }

  start() {
    if (this.process) return;

    this.process = spawn("dmesg", ["--follow", "--human"], {
      stdio: ["ignore", "pipe", "pipe"]
    });

    const lines = readline.createInterface({ input: this.process.stdout });

    lines.on("line", (line) => {
      const parsed = parseKernelLog(line);
      if (parsed) this.onLog(parsed);
    });

    this.process.stderr.on("data", (chunk) => {
      this.onError(chunk.toString().trim());
    });

    this.process.on("error", (error) => {
      this.onError(error.message);
    });

    this.process.on("close", (code) => {
      this.process = null;
      if (code !== 0) {
        this.onError(`dmesg reader exited with code ${code}`);
      }
    });
  }

  stop() {
    if (!this.process) return;
    this.process.kill("SIGTERM");
    this.process = null;
  }
}

