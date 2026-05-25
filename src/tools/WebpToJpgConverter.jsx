import { useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  Image as ImageIcon,
  RotateCcw,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Archive,
  SlidersHorizontal,
  Trash2,
  Images,
  Zap,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "WEBP to JPG/PNG Converter",
  path: "/webp-to-jpg-converter",
  category: "Image Tools",
  description:
    "Convert up to 10 WEBP images in one batch. Transparent WEBP files are saved as PNG, and opaque files are saved as JPG.",
  metaTitle: "WEBP to JPG/PNG Converter | Preserve Transparency Online",
  metaDescription:
    "Convert WEBP images online for free. Transparent WEBP files are automatically converted to PNG, opaque WEBP files are converted to JPG, and batch downloads are supported.",
};

const MAX_FILES = 10;
const DEFAULT_QUALITY = 0.92;
const MIN_PROCESSING_DELAY = 4000;
const MAX_PROCESSING_DELAY = 18000;

export default function WebpToJpgConverter() {
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [quality, setQuality] = useState(DEFAULT_QUALITY);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchDone, setBatchDone] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const readyImages = useMemo(() => {
    return images.filter((image) => image.status === "done" && image.outputBlob);
  }, [images]);

  const totalSizeText = useMemo(() => {
    const totalSize = images.reduce((sum, image) => sum + image.file.size, 0);
    return formatBytes(totalSize);
  }, [images]);

  const estimatedProcessingTime = useMemo(() => {
    if (!images.length) return 0;
    return getProcessingDelayMs(images);
  }, [images]);

  function createImageItem(file) {
    const previewUrl = URL.createObjectURL(file);

    return {
      id: makeId(file),
      file,
      name: file.name,
      size: file.size,
      previewUrl,
      outputUrl: null,
      outputBlob: null,
      outputName: getOutputName(file.name, "jpg"),
      outputFormat: "",
      wasTransparent: false,
      status: "queued",
      progress: 0,
      width: 0,
      height: 0,
      error: "",
    };
  }

  function addFiles(fileList) {
    setError("");
    setSuccess("");
    setBatchDone(false);
    setOverallProgress(0);

    const incomingFiles = Array.from(fileList || []);

    if (!incomingFiles.length) return;

    const webpFiles = incomingFiles.filter((file) => {
      const fileName = file.name.toLowerCase();
      return file.type === "image/webp" || fileName.endsWith(".webp");
    });

    const rejectedCount = incomingFiles.length - webpFiles.length;
    const remainingSlots = Math.max(0, MAX_FILES - images.length);
    const acceptedFiles = webpFiles.slice(0, remainingSlots);
    const skippedByLimit = Math.max(0, webpFiles.length - acceptedFiles.length);

    if (!acceptedFiles.length) {
      setError(
        images.length >= MAX_FILES
          ? `Maximum ${MAX_FILES} images are allowed in one batch.`
          : "Please upload valid WEBP image files only."
      );
      return;
    }

    const newItems = acceptedFiles.map(createImageItem);

    setImages((currentImages) => [...currentImages, ...newItems]);

    const messages = [];

    if (acceptedFiles.length > 0) {
      messages.push(`${acceptedFiles.length} WEBP image(s) added.`);
    }

    if (rejectedCount > 0) {
      messages.push(`${rejectedCount} non-WEBP file(s) ignored.`);
    }

    if (skippedByLimit > 0) {
      messages.push(
        `${skippedByLimit} file(s) skipped because the limit is ${MAX_FILES}.`
      );
    }

    setSuccess(messages.join(" "));
  }

  function handleFileInputChange(event) {
    addFiles(event.target.files);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    if (isProcessing) return;

    addFiles(event.dataTransfer.files);
  }

  function handleDragOver(event) {
    event.preventDefault();

    if (!isProcessing) {
      setIsDragging(true);
    }
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function revokeImageUrls(image) {
    if (image.previewUrl) {
      URL.revokeObjectURL(image.previewUrl);
    }

    if (image.outputUrl) {
      URL.revokeObjectURL(image.outputUrl);
    }
  }

  function removeImage(id) {
    if (isProcessing) return;

    setImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === id);

      if (imageToRemove) {
        revokeImageUrls(imageToRemove);
      }

      return currentImages.filter((image) => image.id !== id);
    });

    setBatchDone(false);
    setOverallProgress(0);
    setError("");
    setSuccess("");
  }

  function clearAllImages() {
    if (isProcessing) return;

    images.forEach(revokeImageUrls);

    setImages([]);
    setBatchDone(false);
    setOverallProgress(0);
    setError("");
    setSuccess("");
  }

  function resetConvertedResults() {
    setImages((currentImages) => {
      currentImages.forEach((image) => {
        if (image.outputUrl) {
          URL.revokeObjectURL(image.outputUrl);
        }
      });

      return currentImages.map((image) => ({
        ...image,
        outputUrl: null,
        outputBlob: null,
        outputName: getOutputName(image.name, "jpg"),
        outputFormat: "",
        wasTransparent: false,
        status: "queued",
        progress: 0,
        width: 0,
        height: 0,
        error: "",
      }));
    });
  }

  function updateImage(id, updates) {
    setImages((currentImages) => {
      return currentImages.map((image) => {
        if (image.id !== id) return image;
        return { ...image, ...updates };
      });
    });
  }

  async function startSmartProgress(delayMs) {
    setOverallProgress(0);

    return new Promise((resolve) => {
      const startTime = Date.now();

      const timer = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(94, Math.round((elapsed / delayMs) * 94));

        setOverallProgress(progress);

        if (elapsed >= delayMs) {
          window.clearInterval(timer);
          resolve();
        }
      }, 120);
    });
  }

  async function handleBatchConvert() {
    if (!images.length) {
      setError("Please upload at least one WEBP image first.");
      return;
    }

    setError("");
    setSuccess("");
    setBatchDone(false);
    setIsProcessing(true);
    setOverallProgress(0);
    resetConvertedResults();

    const processingDelay = getProcessingDelayMs(images);

    try {
      const processingDelayPromise = startSmartProgress(processingDelay);
      const conversionPromise = convertImagesSequentially(images);

      const [conversionResult] = await Promise.all([
        conversionPromise,
        processingDelayPromise,
      ]);

      setOverallProgress(100);
      setBatchDone(true);

      if (conversionResult.successCount > 0) {
        setSuccess(
          `${images.length > 1 ? "Batch conversion" : "Conversion"} completed. ${conversionResult.successCount} file(s) are ready to download.`
        );
      } else {
        setError(
          "No files could be converted. Please try again with different WEBP files."
        );
      }
    } catch {
      setError(
        "Something went wrong during conversion. Please try again with different WEBP images."
      );
    } finally {
      window.setTimeout(() => {
        setIsProcessing(false);
      }, 400);
    }
  }

  async function convertImagesSequentially(imageList) {
    let successCount = 0;
    let failedCount = 0;

    for (let index = 0; index < imageList.length; index += 1) {
      const image = imageList[index];

      updateImage(image.id, {
        status: "processing",
        progress: 20,
        error: "",
      });

      try {
        const result = await convertWebpPreservingTransparency(
          image.previewUrl,
          image.name,
          quality
        );

        successCount += 1;

        updateImage(image.id, {
          status: "done",
          progress: 100,
          outputBlob: result.blob,
          outputUrl: result.url,
          outputName: result.outputName,
          outputFormat: result.outputFormat,
          wasTransparent: result.wasTransparent,
          width: result.width,
          height: result.height,
          error: "",
        });
      } catch {
        failedCount += 1;

        updateImage(image.id, {
          status: "error",
          progress: 0,
          error: "Could not convert this image.",
        });
      }
    }

    return {
      successCount,
      failedCount,
    };
  }

  function loadImage(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  async function convertWebpPreservingTransparency(imageUrl, fileName, jpgQuality) {
    const img = await loadImage(imageUrl);

    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = img.naturalWidth || img.width;
    sourceCanvas.height = img.naturalHeight || img.height;

    const sourceCtx = sourceCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!sourceCtx) {
      throw new Error("Canvas is not supported.");
    }

    sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    sourceCtx.drawImage(img, 0, 0);

    const hasTransparency = canvasHasTransparency(
      sourceCtx,
      sourceCanvas.width,
      sourceCanvas.height
    );

    const outputFormat = hasTransparency ? "png" : "jpg";
    const mimeType = hasTransparency ? "image/png" : "image/jpeg";
    const outputCanvas = hasTransparency
      ? sourceCanvas
      : createJpgCanvas(sourceCanvas);

    const blob = await canvasToBlob(
      outputCanvas,
      mimeType,
      hasTransparency ? undefined : jpgQuality
    );

    return {
      blob,
      url: URL.createObjectURL(blob),
      outputName: getOutputName(fileName, outputFormat),
      outputFormat: outputFormat.toUpperCase(),
      wasTransparent: hasTransparency,
      width: sourceCanvas.width,
      height: sourceCanvas.height,
    };
  }

  function createJpgCanvas(sourceCanvas) {
    const jpgCanvas = document.createElement("canvas");
    jpgCanvas.width = sourceCanvas.width;
    jpgCanvas.height = sourceCanvas.height;

    const jpgCtx = jpgCanvas.getContext("2d");

    if (!jpgCtx) {
      throw new Error("Canvas is not supported.");
    }

    jpgCtx.fillStyle = "#ffffff";
    jpgCtx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
    jpgCtx.drawImage(sourceCanvas, 0, 0);

    return jpgCanvas;
  }

  function canvasHasTransparency(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] < 255) {
        return true;
      }
    }

    return false;
  }

  function canvasToBlob(canvas, mimeType, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (generatedBlob) => {
          if (!generatedBlob) {
            reject(new Error(`Could not generate ${mimeType} file.`));
            return;
          }

          resolve(generatedBlob);
        },
        mimeType,
        quality
      );
    });
  }

  async function handleDownloadAllZip() {
    if (!batchDone || !readyImages.length) {
      setError("Please complete conversion first.");
      return;
    }

    try {
      setError("");
      setSuccess("Preparing ZIP file...");

      const JSZipModule = await import("jszip");
      const JSZip = JSZipModule.default || JSZipModule;
      const zip = new JSZip();

      readyImages.forEach((image) => {
        zip.file(image.outputName, image.outputBlob);
      });

      const zipBlob = await zip.generateAsync({
        type: "blob",
      });

      downloadBlob(zipBlob, "converted-images.zip");

      setSuccess("ZIP file downloaded successfully.");
    } catch {
      setError("ZIP download failed. Please make sure jszip is installed.");
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function resetTool() {
    images.forEach(revokeImageUrls);

    setImages([]);
    setQuality(DEFAULT_QUALITY);
    setIsDragging(false);
    setIsProcessing(false);
    setBatchDone(false);
    setOverallProgress(0);
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <ImageIcon size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">WEBP to JPG/PNG Converter</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Convert up to {MAX_FILES} WEBP images in one batch. Transparent WEBP
          files are saved as PNG to keep transparency, while opaque files are
          saved as JPG with quality control.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        {/* UPLOAD AREA */}
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
            isDragging
              ? "border-[var(--primary)] bg-[#f4edff]"
              : "border-[var(--border)] hover:bg-[#f8f4ff]"
          } ${isProcessing ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <Upload size={38} className="mx-auto mb-4 text-[var(--primary)]" />

          <h2 className="text-xl font-semibold mb-2">Upload WEBP Images</h2>

          <p className="text-sm text-[var(--text-secondary)]">
            Select or drag up to {MAX_FILES} .webp images. Current batch:{" "}
            <strong>{images.length}/{MAX_FILES}</strong>
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/webp,.webp"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isProcessing}
          />
        </label>

        {/* FEEDBACK */}
        {error && (
          <div className="mt-4 flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

        {/* SETTINGS */}
        {images.length > 0 && (
          <div className="mt-6 bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal size={20} className="text-[var(--primary)]" />
              <h3 className="font-semibold">Conversion Settings</h3>
            </div>

            <label className="block">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-sm font-medium">JPG Quality</span>
                <span className="text-sm font-semibold text-[var(--primary)]">
                  {Math.round(quality * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0.7"
                max="1"
                step="0.01"
                value={quality}
                onChange={(event) => {
                  setQuality(Number(event.target.value));
                  setBatchDone(false);
                }}
                className="w-full accent-[var(--primary)]"
                disabled={isProcessing}
              />
            </label>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 text-sm">
              <InfoBox label="Images" value={`${images.length}/${MAX_FILES}`} />
              <InfoBox label="Total Size" value={totalSizeText} />
              <InfoBox
                label="Converted"
                value={`${readyImages.length}/${images.length}`}
              />
              <InfoBox
                label="Smart Time"
                value={`${Math.ceil(estimatedProcessingTime / 1000)}s`}
              />
            </div>

            {isProcessing && (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                  <span>
                    {images.length > 1
                      ? "Processing batch..."
                      : "Processing file..."}
                  </span>
                  <span>{overallProgress}%</span>
                </div>

                <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              <button
                type="button"
                onClick={handleBatchConvert}
                disabled={isProcessing || !images.length}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  isProcessing || !images.length
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isProcessing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Zap size={18} />
                )}
                {isProcessing
                  ? images.length > 1
                    ? "Converting Batch..."
                    : "Converting..."
                  : images.length > 1
                    ? "Convert Batch"
                    : "Convert"}
              </button>

              <button
                type="button"
                onClick={clearAllImages}
                disabled={isProcessing}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  isProcessing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Trash2 size={18} />
                Clear
              </button>

              <button
                type="button"
                onClick={resetTool}
                disabled={isProcessing}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  isProcessing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>
          </div>
        )}

        {/* DOWNLOAD OPTIONS - ONLY AFTER FULL BATCH DONE */}
        {batchDone && readyImages.length > 0 && !isProcessing && (
          <div className="mt-6 bg-white border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Archive size={20} className="text-[var(--primary)]" />
              <h3 className="font-semibold">
                {readyImages.length > 1
                  ? "Download Converted Files"
                  : "Download Converted File"}
              </h3>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-5">
              Conversion is complete. Transparent files are available as PNG,
              and opaque files are available as JPG. You can download files from
              the image cards below.
            </p>

            {readyImages.length > 1 && (
              <button
                type="button"
                onClick={handleDownloadAllZip}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <Archive size={18} />
                Download All as ZIP
              </button>
            )}

            <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800">
                Note: Transparent WEBP files are exported as PNG so the
                transparent background stays transparent. Opaque WEBP files are
                exported as JPG.
              </p>
            </div>
          </div>
        )}

        {/* IMAGE LIST */}
        {images.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Images size={20} className="text-[var(--primary)]" />
              <h3 className="font-semibold">
                {images.length > 1 ? "Batch Images" : "Selected Image"}
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {images.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  isProcessing={isProcessing}
                  batchDone={batchDone}
                  onRemove={() => removeImage(image.id)}
                />
              ))}
            </div>
          </div>
        )}

        {!images.length && (
          <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50 mt-6">
            <ImageIcon size={42} className="mx-auto mb-3 text-gray-300" />
            <p className="text-[var(--text-secondary)]">
              Upload WEBP images to start batch conversion.
            </p>
          </div>
        )}
      </section>

      <SuggestedTools currentToolId="webp-to-jpg-converter" />
    </div>
  );
}

function ImageCard({ image, isProcessing, batchDone, onRemove }) {
  const statusLabel = {
    queued: "Waiting",
    processing: "Converting",
    done: batchDone ? "Ready" : "Finalizing",
    error: "Failed",
  }[image.status];

  const canDownload =
    batchDone && !isProcessing && image.status === "done" && image.outputUrl;

  return (
    <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white">
      <div className="relative bg-[#f8f4ff] h-44 flex items-center justify-center">
        <img
          src={image.previewUrl}
          alt={image.name}
          className="max-h-full max-w-full object-contain"
        />

        {!isProcessing && !batchDone && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white border border-[var(--border)] flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition"
            title="Remove image"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="p-4">
        <p className="font-semibold text-sm truncate" title={image.name}>
          {image.name}
        </p>

        <div className="flex items-center justify-between gap-3 mt-2 text-xs text-[var(--text-secondary)]">
          <span>{formatBytes(image.size)}</span>
          <span>{statusLabel}</span>
        </div>

        {image.status === "processing" && (
          <div className="mt-3 flex items-center gap-2 text-sm text-[var(--primary)]">
            <Loader2 size={16} className="animate-spin" />
            Processing...
          </div>
        )}

        {image.status === "done" && !batchDone && (
          <div className="mt-3 flex items-center gap-2 text-sm text-[var(--primary)]">
            <Loader2 size={16} className="animate-spin" />
            Finalizing batch...
          </div>
        )}

        {canDownload && (
          <div className="mt-3">
            <p className="text-xs text-green-700 mb-3">
              Converted to {image.outputFormat || "file"}
              {image.width && image.height
                ? ` • ${image.width}×${image.height}`
                : ""}
            </p>

            <a
              href={image.outputUrl}
              download={image.outputName}
              className="btn-secondary w-full inline-flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Download {image.outputFormat || "File"}
            </a>
          </div>
        )}

        {image.status === "error" && (
          <p className="mt-3 text-xs text-red-600">
            {image.error || "Could not convert this image."}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-xl p-3 text-center">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="font-semibold text-[var(--primary)] break-all">{value}</p>
    </div>
  );
}

function makeId(file) {
  const randomPart =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${file.name}-${file.size}-${file.lastModified}-${randomPart}`;
}

function getOutputName(fileName, extension = "jpg") {
  const cleanName = String(fileName || "converted-image").replace(/\.[^/.]+$/, "");
  return `${cleanName}.${extension}`;
}

function getProcessingDelayMs(images) {
  const totalSizeMb =
    images.reduce((sum, image) => sum + image.file.size, 0) / (1024 * 1024);

  const calculatedDelay =
    MIN_PROCESSING_DELAY + images.length * 650 + totalSizeMb * 350;

  return Math.min(
    MAX_PROCESSING_DELAY,
    Math.max(MIN_PROCESSING_DELAY, Math.round(calculatedDelay))
  );
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const sizeIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const size = bytes / Math.pow(1024, sizeIndex);

  return `${size.toFixed(sizeIndex === 0 ? 0 : 1)} ${units[sizeIndex]}`;
}