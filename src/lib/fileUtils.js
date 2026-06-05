export function downloadBlob(blob, fileName = "download") {
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  link.remove();
  URL.revokeObjectURL(url);
}

export function getFileExtension(fileName = "") {
  const parts = String(fileName).split(".");

  if (parts.length < 2) return "";

  return parts.pop().toLowerCase();
}

export function isImageFile(file) {
  return Boolean(file?.type?.startsWith("image/"));
}

export function isPdfFile(file) {
  return file?.type === "application/pdf";
}