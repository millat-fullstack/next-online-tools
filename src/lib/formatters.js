export function formatFileSize(bytes = 0) {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1
  );

  const value = size / 1024 ** index;

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatNumber(value = 0) {
  return new Intl.NumberFormat("en").format(Number(value) || 0);
}

export function formatPercent(value = 0) {
  return `${Number(value || 0).toFixed(1)}%`;
}