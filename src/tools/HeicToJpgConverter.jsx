import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  FileImage,
  Loader2,
  SlidersHorizontal,
  Clock3,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "HEIC to JPG Converter",
  path: "/heic-to-jpg-converter",
  category: "Image Tools",
  description:
    "Convert HEIC and HEIF images to JPG online with clean preview, quality control, and instant download.",
  metaTitle: "HEIC to JPG Converter | Convert HEIC Images to JPG Online Free",
  metaDescription:
    "Convert HEIC and HEIF images to JPG online for free. Browser-based HEIC to JPG converter with preview, quality control, and instant download.",
};

const MAX_FILE_SIZE_MB = 35;
const ACCEPTED_EXTENSIONS = [".heic", ".heif"];
const ACCEPTED_TYPES = [
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
];

export default function HeicToJpgConverter() {
  const fileInputRef = useRef(null);
  const convertedUrlRef = useRef("");

  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(92);

  const [convertedUrl, setConvertedUrl] = useState("");
  const [convertedBlob, setConvertedBlob] = useState(null);
  const [convertedName, setConvertedName] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      revokeConvertedUrl();
    };
  }, []);

  function revokeConvertedUrl() {
    if (convertedUrlRef.current) {
      URL.revokeObjectURL(convertedUrlRef.current);
      convertedUrlRef.current = "";
    }
  }

  function clearConvertedOutput() {
    revokeConvertedUrl();
    setConvertedUrl("");
    setConvertedBlob(null);
    setConvertedName("");
    setProcessingTimeMs(0);
    setProgress(0);
  }

  function resetInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function isValidHeicFile(selectedFile) {
    if (!selectedFile) return false;

    const lowerName = selectedFile.name.toLowerCase();
    const hasValidExtension = ACCEPTED_EXTENSIONS.some((extension) =>
      lowerName.endsWith(extension)
    );

    return hasValidExtension || ACCEPTED_TYPES.includes(selectedFile.type);
  }

  async function handleFile(selectedFile) {
    setError("");
    setSuccess("");
    clearConvertedOutput();

    if (!selectedFile) return;

    if (!isValidHeicFile(selectedFile)) {
      setError("Please upload a valid HEIC or HEIF image file.");
      resetInput();
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Please upload a HEIC/HEIF image under ${MAX_FILE_SIZE_MB} MB.`);
      resetInput();
      return;
    }

    setFile(selectedFile);
    setSuccess("HEIC image loaded. Click Convert JPG to start conversion.");
  }

  function handleInputChange(event) {
    handleFile(event.target.files?.[0]);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  async function convertFile(targetFile = file, targetQuality = quality) {
    setError("");
    setSuccess("");

    if (!targetFile) {
      setError("Please upload a HEIC or HEIF image first.");
      return;
    }

    setIsConverting(true);
    setProgress(8);
    setProcessingTimeMs(0);
    clearConvertedOutput();

    const startTime = performance.now();
    const progressTimer = startProgressTimer(targetFile);

    try {
      const jpgBlob = await convertHeicToJpg(targetFile, targetQuality);

      if (!(jpgBlob instanceof Blob) || !jpgBlob.size) {
        throw new Error("The converter returned an empty JPG file.");
      }

      const jpgUrl = URL.createObjectURL(jpgBlob);
      const jpgName = `${getBaseName(targetFile.name)}.jpg`;
      const actualTime = Math.max(1, Math.round(performance.now() - startTime));

      convertedUrlRef.current = jpgUrl;
      setConvertedBlob(jpgBlob);
      setConvertedUrl(jpgUrl);
      setConvertedName(jpgName);
      setProcessingTimeMs(actualTime);
      setProgress(100);
      setSuccess(`Converted successfully in ${(actualTime / 1000).toFixed(1)}s. JPG preview is ready.`);
    } catch (conversionError) {
      setError(
        conversionError?.message ||
          "Conversion failed. Please try another HEIC/HEIF image."
      );
      clearConvertedOutput();
    } finally {
      window.clearInterval(progressTimer);
      window.setTimeout(() => {
        setIsConverting(false);
        setProgress(0);
      }, 500);
    }
  }

  function startProgressTimer(targetFile) {
    const start = Date.now();
    const estimatedMs = Math.max(
      1200,
      Math.min(7500, (targetFile?.size || file?.size || 2_000_000) / 3500)
    );

    return window.setInterval(() => {
      const elapsed = Date.now() - start;
      const nextProgress = Math.min(92, Math.round((elapsed / estimatedMs) * 92));
      setProgress(Math.max(8, nextProgress));
    }, 90);
  }

  function handleQualityChange(value) {
    setQuality(value);

    if (file) {
      setSuccess("Quality changed. Click Convert JPG again to apply the new quality.");
      clearConvertedOutput();
    }
  }

  async function handleDownload() {
    if (!convertedBlob || !convertedUrl) {
      setError("Please convert the HEIC image first.");
      return;
    }

    try {
      await saveBlob(convertedBlob, convertedName || "converted-image.jpg");
    } catch {
      setError("Could not start JPG download. Please try again.");
    }
  }

  function handleReset() {
    clearConvertedOutput();
    setFile(null);
    setQuality(92);
    setIsDragging(false);
    setIsConverting(false);
    setError("");
    setSuccess("");
    resetInput();
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <ImageIcon size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">HEIC to JPG Converter</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload an iPhone HEIC/HEIF image, convert it to JPG with stronger browser decoders, preview the converted image, and download it instantly.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-6">
          <div className="flex flex-col gap-4">
            <div
              onDrop={handleDrop}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`min-h-[300px] border-2 border-dashed rounded-3xl p-8 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                isDragging
                  ? "border-[var(--primary)] bg-[#f8f4ff]"
                  : "border-[var(--border)] bg-gray-50 hover:bg-[#f8f4ff]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".heic,.heif,image/heic,image/heif,image/heic-sequence,image/heif-sequence"
                onChange={handleInputChange}
                className="hidden"
              />

              <Upload size={44} className="text-[var(--primary)] mb-4" />

              <h2 className="text-xl font-bold mb-2">Upload HEIC / HEIF</h2>

              <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-5">
                Drag and drop your image here, or click to choose a file. Max {MAX_FILE_SIZE_MB} MB.
              </p>

              <button type="button" className="btn-primary inline-flex items-center gap-2">
                <Upload size={17} />
                Choose Image
              </button>

              {file && (
                <div className="mt-5 max-w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
                  <p className="font-semibold truncate">{file.name}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {formatBytes(file.size)}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal size={18} className="text-[var(--primary)]" />
                <h3 className="font-semibold">JPG Quality</h3>
              </div>

              <label className="block text-sm font-medium mb-2">
                Quality: {quality}%
              </label>

              <input
                type="range"
                min="50"
                max="100"
                value={quality}
                onChange={(event) => handleQualityChange(Number(event.target.value))}
                className="w-full accent-[var(--primary)]"
              />

              <p className="text-xs text-[var(--text-secondary)] mt-2">
                90-95% is best for normal photos. Higher quality may create a larger JPG.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => convertFile()}
                disabled={!file || isConverting}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !file || isConverting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isConverting ? <Loader2 size={18} className="animate-spin" /> : <FileImage size={18} />}
                {isConverting ? "Converting..." : "Convert JPG"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {(error || success) && (
              <>
                {error && <MessageBox type="error" message={error} />}
                {success && <MessageBox type="success" message={success} />}
              </>
            )}

            {isConverting && (
              <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4">
                <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                  <span>Converting HEIC to JPG...</span>
                  <span>{progress}%</span>
                </div>

                <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="border border-[var(--border)] rounded-3xl bg-white p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">JPG Preview</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Preview appears after successful conversion.
                  </p>
                </div>

                {processingTimeMs > 0 && (
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 rounded-full px-3 py-2">
                    <Clock3 size={14} />
                    {(processingTimeMs / 1000).toFixed(1)}s
                  </div>
                )}
              </div>

              <div className="min-h-[420px] rounded-2xl border border-[var(--border)] bg-gray-50 flex items-center justify-center overflow-hidden p-3">
                {convertedUrl ? (
                  <img
                    src={convertedUrl}
                    alt="Converted JPG preview"
                    className="max-w-full max-h-[520px] object-contain rounded-xl shadow-sm bg-white"
                  />
                ) : (
                  <div className="text-center max-w-sm p-6">
                    <FileImage size={46} className="mx-auto mb-3 text-[var(--primary)]" />
                    <p className="font-semibold">No JPG preview yet</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-2">
                      Upload a HEIC image and click Convert JPG. The converted JPG will show here.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-3 mt-4">
                <StatCard label="Input" value={file ? formatBytes(file.size) : "-"} />
                <StatCard label="Output" value={convertedBlob ? formatBytes(convertedBlob.size) : "-"} />
                <StatCard label="Format" value={convertedBlob ? "JPG" : "HEIC"} />
              </div>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!convertedUrl || isConverting}
                className={`btn-primary w-full inline-flex items-center justify-center gap-2 mt-4 ${
                  !convertedUrl || isConverting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download JPG
              </button>
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="heic-to-jpg-converter" />
    </div>
  );
}


async function convertHeicToJpg(file, quality) {
  if (typeof window === "undefined") {
    throw new Error("HEIC conversion must run in the browser.");
  }

  const errors = [];
  const attempts = await createConversionAttempts(file);

  const heicToConverter = await getHeicToConverter();

  if (heicToConverter) {
    for (const attempt of attempts) {
      try {
        const result = await heicToConverter({
          blob: attempt.blob,
          type: "image/jpeg",
          quality: quality / 100,
        });

        const jpgBlob = Array.isArray(result) ? result[0] : result;

        if (jpgBlob instanceof Blob && jpgBlob.size > 0) {
          return jpgBlob;
        }

        errors.push(`heic-to ${attempt.label}: empty result`);
      } catch (error) {
        errors.push(`heic-to ${attempt.label}: ${error?.message || "failed"}`);
      }
    }
  } else {
    errors.push("heic-to package is not installed or could not be loaded");
  }

  const heic2AnyConverter = await getHeic2AnyConverter();

  if (heic2AnyConverter) {
    for (const attempt of attempts) {
      try {
        const result = await heic2AnyConverter({
          blob: attempt.blob,
          toType: "image/jpeg",
          quality: quality / 100,
        });

        const jpgBlob = Array.isArray(result) ? result[0] : result;

        if (jpgBlob instanceof Blob && jpgBlob.size > 0) {
          return jpgBlob;
        }

        errors.push(`heic2any ${attempt.label}: empty result`);
      } catch (error) {
        errors.push(`heic2any ${attempt.label}: ${error?.message || "failed"}`);
      }
    }
  } else {
    errors.push("heic2any package is not installed or could not be loaded");
  }

  try {
    return await convertWithNativeBrowserDecode(file, quality);
  } catch (nativeError) {
    errors.push(`native browser decoder: ${nativeError?.message || "failed"}`);
  }

  console.warn("HEIC conversion attempts failed:", errors);

  throw new Error(
    "Conversion failed. This HEIC/HEIF file was not supported by the available browser decoders. Install both heic-to and heic2any, then try again. If it still fails, the file may be an unsupported iPhone HEIC variant."
  );
}

let heicToConverterPromise = null;

async function getHeicToConverter() {
  if (!heicToConverterPromise) {
    heicToConverterPromise = import("heic-to")
      .catch(() => import("heic-to/csp"))
      .then((module) => {
        if (typeof module?.heicTo === "function") return module.heicTo;
        if (typeof module?.default?.heicTo === "function") return module.default.heicTo;
        if (typeof module?.default === "function") return module.default;
        if (typeof module === "function") return module;
        return null;
      })
      .catch(() => null);
  }

  const converter = await heicToConverterPromise;

  return typeof converter === "function" ? converter : null;
}

let heic2anyConverterPromise = null;

async function getHeic2AnyConverter() {
  if (!heic2anyConverterPromise) {
    heic2anyConverterPromise = import("heic2any")
      .then((module) => module.default || module)
      .catch(() => null);
  }

  const converter = await heic2anyConverterPromise;

  return typeof converter === "function" ? converter : null;
}

async function createConversionAttempts(file) {
  const buffer = await file.arrayBuffer();
  const inferredType = inferHeicMimeType(file);
  const attempts = [
    {
      label: "original file",
      blob: file,
    },
    {
      label: inferredType,
      blob: new Blob([buffer], { type: inferredType }),
    },
  ];

  if (inferredType !== "image/heic") {
    attempts.push({
      label: "image/heic",
      blob: new Blob([buffer], { type: "image/heic" }),
    });
  }

  if (inferredType !== "image/heif") {
    attempts.push({
      label: "image/heif",
      blob: new Blob([buffer], { type: "image/heif" }),
    });
  }

  return attempts;
}

function inferHeicMimeType(file) {
  const lowerName = String(file?.name || "").toLowerCase();

  if (lowerName.endsWith(".heif")) return "image/heif";
  return "image/heic";
}

async function convertWithNativeBrowserDecode(file, quality) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    if (!width || !height) {
      throw new Error("native decoder returned an invalid image size");
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("canvas is not supported");
    }

    ctx.drawImage(img, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, "image/jpeg", quality / 100);

    if (!blob?.size) {
      throw new Error("native conversion returned an empty JPG");
    }

    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("browser could not decode this HEIC image"));
    image.src = source;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("canvas could not create JPG"));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

async function saveBlob(blob, filename) {
  const safeBlob = blob instanceof Blob
    ? blob
    : new Blob([blob], { type: "application/octet-stream" });
  const safeName = sanitizeDownloadFileName(filename || "converted-image.jpg");
  const file = new File([safeBlob], safeName, { type: safeBlob.type || "image/jpeg" });

  const canShareFile =
    isIosLikeDevice() &&
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function" &&
    navigator.canShare({ files: [file] });

  if (canShareFile) {
    await navigator.share({
      files: [file],
      title: safeName,
    });
    return;
  }

  const url = URL.createObjectURL(safeBlob);
  const link = document.createElement("a");

  link.href = url;
  link.download = safeName;
  link.rel = "noopener";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function isIosLikeDevice() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";

  return (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1)
  );
}

function sanitizeDownloadFileName(fileName) {
  const cleanName = String(fileName || "converted-image.jpg")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  return cleanName || "converted-image.jpg";
}

function MessageBox({ type, message }) {
  const isError = type === "error";

  return (
    <div
      className={`flex items-start gap-3 text-sm p-4 rounded-xl border ${
        isError
          ? "text-red-700 bg-red-50 border-red-100"
          : "text-green-700 bg-green-50 border-green-100"
      }`}
    >
      {isError ? (
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
      ) : (
        <CheckCircle size={18} className="shrink-0 mt-0.5" />
      )}
      <p>{message}</p>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-50 border border-[var(--border)] rounded-2xl p-3 text-center">
      <p className="text-[11px] text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="text-sm font-bold text-[var(--primary)] break-all">{value}</p>
    </div>
  );
}

function getBaseName(name) {
  return String(name || "converted-image").replace(/\.[^/.]+$/, "");
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
