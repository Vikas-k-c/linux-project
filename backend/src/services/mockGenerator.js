import { env } from "../config/env.js";

const processes = ["bash", "chrome", "node", "docker", "systemd", "sshd", "postgres", "code", "nginx"];
const syscalls = ["openat", "read", "write", "close", "execve", "clone", "socket", "connect", "mmap", "ioctl"];

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export class MockLogGenerator {
  constructor(onLog) {
    this.onLog = onLog;
    this.timer = null;
  }

  start() {
    if (this.timer) return;

    this.timer = setInterval(() => {
      const process = pick(processes);
      const syscall = pick(syscalls);
      const pid = Math.floor(1000 + Math.random() * 9000);

      this.onLog({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        pid,
        process,
        syscall,
        timestamp: new Date().toISOString(),
        raw: `[demo] Project4: pid=${pid} process=${process} syscall=${syscall}`
      });
    }, env.mockIntervalMs);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }
}

