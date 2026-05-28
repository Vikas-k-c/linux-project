export function exportLogsToCsv(logs) {
  const headers = ["timestamp", "pid", "process", "syscall", "raw"];
  const rows = logs.map((log) =>
    headers
      .map((header) => {
        const value = log[header] ?? "";
        return `"${String(value).replaceAll('"', '""')}"`;
      })
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `syscall-logs-${new Date().toISOString().slice(0, 19)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

