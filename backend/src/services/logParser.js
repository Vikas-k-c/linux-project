const syscallNames = [
  "openat",
  "read",
  "write",
  "close",
  "execve",
  "clone",
  "fork",
  "socket",
  "connect",
  "mmap",
  "ioctl",
  "stat"
];

function firstMatch(line, patterns) {
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match?.groups?.value) return match.groups.value.trim();
  }

  return null;
}

function detectSyscall(line) {
  const explicit = firstMatch(line, [
    /syscall(?:_name)?[=:]\s*(?<value>[a-zA-Z0-9_]+)/i,
    /system call[=:]\s*(?<value>[a-zA-Z0-9_]+)/i,
    /sys_(?<value>[a-zA-Z0-9_]+)/i
  ]);

  if (explicit) return explicit.replace(/^sys_/, "");

  const lower = line.toLowerCase();
  return syscallNames.find((name) => lower.includes(name)) || "unknown";
}

export function parseKernelLog(line) {
  if (!line || !line.trim()) return null;

  const pid = firstMatch(line, [
    /pid[=:]\s*(?<value>\d+)/i,
    /\bPID\s+(?<value>\d+)/i,
    /\[(?<value>\d+)\]/
  ]);

  const process = firstMatch(line, [
    /process[=:]\s*(?<value>[\w.-]+)/i,
    /comm[=:]\s*(?<value>[\w.-]+)/i,
    /task[=:]\s*(?<value>[\w.-]+)/i,
    /proc[=:]\s*(?<value>[\w.-]+)/i
  ]);

  const syscall = detectSyscall(line);

  // Keep the parser tolerant because kernel module print formats vary between
  // student projects. Unknown fields are still useful in the live dashboard.
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    pid: pid ? Number(pid) : null,
    process: process || "kernel",
    syscall,
    timestamp: new Date().toISOString(),
    raw: line.trim()
  };
}

