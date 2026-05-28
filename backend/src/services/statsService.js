function countBy(logs, key) {
  return logs.reduce((acc, log) => {
    const value = log[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function toRankedList(counts, labelKey, limit = 8) {
  return Object.entries(counts)
    .map(([name, count]) => ({ [labelKey]: name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function buildStats(logs) {
  const processCounts = countBy(logs, "process");
  const syscallCounts = countBy(logs, "syscall");
  const topSyscall = Object.entries(syscallCounts).sort((a, b) => b[1] - a[1])[0];

  const perMinuteMap = logs.reduce((acc, log) => {
    const date = new Date(log.timestamp);
    const minute = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    acc[minute] = (acc[minute] || 0) + 1;
    return acc;
  }, {});

  return {
    totalSyscalls: logs.length,
    mostUsedSyscall: topSyscall ? { syscall: topSyscall[0], count: topSyscall[1] } : null,
    topProcesses: toRankedList(processCounts, "process"),
    syscallDistribution: toRankedList(syscallCounts, "syscall", 12),
    syscallsPerMinute: Object.entries(perMinuteMap).map(([minute, count]) => ({ minute, count }))
  };
}

