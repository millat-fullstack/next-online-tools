import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  Image as ImageIcon,
  Loader2,
  Palette,
  RotateCcw,
  Settings2,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import JSZip from "jszip";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "PNG to JPG Converter",
  path: "/png-to-jpg-converter",
  category: "Image Tools",
  description:
    "Convert PNG images to high-quality JPG files online with background color and quality control.",
  metaTitle: "PNG to JPG Converter Online Free | Convert PNG to JPEG",
  metaDescription:
    "Convert PNG to JPG online for free. Upload PNG images, choose JPG quality and background color, preview converted images, and download JPG files instantly.",
};

const MAX_FILES = 30;
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MIN_PROCESSING_TIME_MS = 500;

export default function PngToJpgConverter() {
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [convertedImages, setConvertedImages] = useState([]);
  const [fullViewImage, setFullViewImage] = useState(null);

  const [jpgQuality, setJpgQuality] = useState(0.92);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPhase, setProcessingPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalOriginalSize = useMemo(() => {
    return images.reduce((sum, image) => sum + image.file.size, 0);
  }, [images]);

  const totalConvertedSize = useMemo(() => {
    return convertedImages.reduce((sum, image) => sum + image.size, 0);
  }, [convertedImages]);

  const canConvert = images.length > 0 && !isProcessing;

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function clearConvertedOutput() {
    convertedImages.forEach((image) => {
      if (image.url) URL.revokeObjectURL(image.url);
    });

    setConvertedImages([]);
    setFullViewImage(null);
    setProcessingTimeMs(0);
    setProgress(0);
  }

  function validateFile(file) {
    if (!file) return "No file selected.";

    const fileName = file.name.toLowerCase();
    const isPng =
      file.type === "image/png" ||
      fileName.endsWith(".png");

    if (!isPng) {
      return "Only PNG images are allowed.";
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Each PNG image must be under ${MAX_FILE_SIZE_MB} MB.`;
    }

    return "";
  }

  function createImageItem(file) {
    return {
      id: makeId(),
      file,
      name: file.name,
      size: file.size,
      previewUrl: URL.createObjectURL(file),
      width: 0,
      height: 0,
      status: "ready",
    };
  }

  function addFiles(fileList) {
    if (isProcessing) return;

    clearFeedback();
    clearConvertedOutput();

    const incomingFiles = Array.from(fileList || []);

    if (!incomingFiles.length) return;

    const validFiles = [];
    let rejectedCount = 0;

    incomingFiles.forEach((file) => {
      const validationError = validateFile(file);

      if (validationError) {
        rejectedCount += 1;
        return;
      }

      validFiles.push(file);
    });

    const remainingSlots = Math.max(0, MAX_FILES - images.length);
    const acceptedFiles = validFiles.slice(0, remainingSlots);
    const skippedByLimit = Math.max(0, validFiles.length - acceptedFiles.length);

    if (!acceptedFiles.length) {
      setError(
        images.length >= MAX_FILES
          ? `Maximum ${MAX_FILES} PNG images are allowed.`
          : "Please upload valid PNG images."
      );
      resetFileInput();
      return;
    }

    const newItems = acceptedFiles.map(createImageItem);

    setImages((current) => [...current, ...newItems]);

    newItems.forEach((item) => {
      loadImage(item.previewUrl)
        .then((image) => {
          updateImage(item.id, {
            width: image.naturalWidth || image.width,
            height: image.naturalHeight || image.height,
          });
        })
        .catch(() => {
          updateImage(item.id, {
            status: "error",
          });
        });
    });

    const messages = [];
    messages.push(`${acceptedFiles.length} PNG image${acceptedFiles.length === 1 ? "" : "s"} added.`);

    if (rejectedCount) {
      messages.push(`${rejectedCount} invalid file${rejectedCount === 1 ? "" : "s"} ignored.`);
    }

    if (skippedByLimit) {
      messages.push(`${skippedByLimit} file${skippedByLimit === 1 ? "" : "s"} skipped because the limit is ${MAX_FILES}.`);
    }

    setSuccess(messages.join(" "));
    resetFileInput();
  }

  function handleFileInputChange(event) {
    addFiles(event.target.files);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
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

  function updateImage(id, updates) {
    setImages((current) =>
      current.map((image) => (image.id === id ? { ...image, ...updates } : image))
    );
  }

  function removeImage(id) {
    if (isProcessing) return;

    clearFeedback();
    clearConvertedOutput();

    setImages((current) => {
      const imageToRemove = current.find((image) => image.id === id);

      if (imageToRemove?.previewUrl) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return current.filter((image) => image.id !== id);
    });
  }

  function clearImages() {
    if (isProcessing) return;

    images.forEach((image) => {
      if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
    });

    setImages([]);
    clearConvertedOutput();
    setError("");
    setSuccess("");
    resetFileInput();
  }

  async function convertImages() {
    if (!images.length) {
      setError("Please upload at least one PNG image first.");
      return;
    }

    setError("");
    setSuccess("");
    clearConvertedOutput();

    setIsProcessing(true);
    setProgress(0);
    setProcessingPhase("Preparing PNG images...");

    const startTime = performance.now();

    try {
      const results = [];

      for (let index = 0; index < images.length; index += 1) {
        const imageItem = images[index];

        setProcessingPhase(`Converting image ${index + 1} of ${images.length}...`);
        setProgress(Math.round((index / images.length) * 82));

        updateImage(imageItem.id, { status: "processing" });

        const image = await loadImage(imageItem.previewUrl);
        const canvas = document.createElement("canvas");

        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Canvas is not supported.");
        }

        ctx.fillStyle = backgroundColor || "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const blob = await canvasToBlob(canvas, "image/jpeg", jpgQuality);
        const url = URL.createObjectURL(blob);

        results.push({
          id: makeId(),
          sourceId: imageItem.id,
          sourceName: imageItem.name,
          fileName: `${getFileBaseName(imageItem.name)}.jpg`,
          blob,
          url,
          size: blob.size,
          width: canvas.width,
          height: canvas.height,
        });

        updateImage(imageItem.id, { status: "done" });
        await wait(40);
      }

      await waitRemaining(startTime, MIN_PROCESSING_TIME_MS);

      setConvertedImages(results);
      setProgress(100);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));
      setProcessingTimeMs(actualTime);
      setProcessingPhase("Conversion completed.");
      setSuccess(`${results.length} JPG image${results.length === 1 ? "" : "s"} created in ${(actualTime / 1000).toFixed(1)}s.`);
    } catch (conversionError) {
      console.error("PNG to JPG conversion error:", conversionError);

      setImages((current) =>
        current.map((image) => ({
          ...image,
          status: image.status === "processing" ? "ready" : image.status,
        }))
      );

      setError("Could not convert PNG to JPG. Please try another PNG image.");
    } finally {
      setIsProcessing(false);
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  async function downloadSingleImage(image) {
    if (!image) return;

    setError("");
    setSuccess("");
    setIsProcessing(true);
    setProcessingPhase("Starting JPG download...");
    setProgress(60);

    const startTime = performance.now();

    try {
      await saveBlob(image.blob, image.fileName);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));

      setProgress(100);
      setProcessingTimeMs(actualTime);
      setSuccess(`Download started in ${(actualTime / 1000).toFixed(1)}s.`);
    } catch {
      setError("Could not download this JPG image. Please try again.");
    } finally {
      setIsProcessing(false);
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  async function downloadAllImages() {
    if (!convertedImages.length) {
      setError("Convert PNG images to JPG first.");
      return;
    }

    if (convertedImages.length === 1) {
      await downloadSingleImage(convertedImages[0]);
      return;
    }

    setError("");
    setSuccess("");
    setIsProcessing(true);
    setProgress(0);
    setProcessingPhase("Preparing ZIP file...");

    const startTime = performance.now();

    try {
      const zip = new JSZip();

      for (let index = 0; index < convertedImages.length; index += 1) {
        const image = convertedImages[index];

        setProcessingPhase(`Adding JPG ${index + 1} of ${convertedImages.length}...`);
        zip.file(image.fileName, image.blob, {
          binary: true,
          compression: "STORE",
        });
        setProgress(Math.round(((index + 1) / convertedImages.length) * 70));
        await wait(15);
      }

      const zipBlob = await zip.generateAsync(
        {
          type: "blob",
          streamFiles: true,
          compression: "STORE",
          mimeType: "application/zip",
        },
        (metadata) => {
          const zipProgress = 70 + Math.round((metadata.percent || 0) * 0.2);
          setProgress(Math.min(92, zipProgress));
        }
      );

      setProcessingPhase("Starting ZIP download...");
      setProgress(94);

      await saveBlob(zipBlob, "converted-png-to-jpg-images.zip");

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));

      setProgress(100);
      setProcessingTimeMs(actualTime);
      setSuccess(`All JPG images prepared in ${(actualTime / 1000).toFixed(1)}s.`);
    } catch (zipError) {
      console.error("Download all JPG images error:", zipError);
      setError("Could not create ZIP file. Try downloading images one by one.");
    } finally {
      setIsProcessing(false);
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  function handleQualityChange(value) {
    setJpgQuality(value);
    clearConvertedOutput();
    clearFeedback();
  }

  function handleBackgroundColorChange(value) {
    setBackgroundColor(value);
    clearConvertedOutput();
    clearFeedback();
  }

  function resetTool() {
    images.forEach((image) => {
      if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
    });

    clearConvertedOutput();

    setImages([]);
    setJpgQuality(0.92);
    setBackgroundColor("#ffffff");
    setSettingsOpen(false);
    setIsDragging(false);
    setIsProcessing(false);
    setProcessingPhase("");
    setProgress(0);
    setProcessingTimeMs(0);
    setError("");
    setSuccess("");
    resetFileInput();
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <ImageIcon size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">PNG to JPG Converter</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload PNG images, choose JPG quality and background color for transparent
          areas, then download clean JPG files.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="flex flex-col gap-5">
          {!images.length && (
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

              <h2 className="text-xl font-semibold mb-2">Choose or drop PNG images here</h2>

              <p className="text-sm text-[var(--text-secondary)]">
                Upload up to {MAX_FILES} PNG images. Each file must be under{" "}
                <strong>{MAX_FILE_SIZE_MB} MB</strong>.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,.png"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
          )}

          {images.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ImageIcon size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-bold">PNG Images</h2>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {images.length} image{images.length === 1 ? "" : "s"} • {formatBytes(totalOriginalSize)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing || images.length >= MAX_FILES}
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <Upload size={17} />
                    Add More
                  </button>

                  <button
                    type="button"
                    onClick={convertImages}
                    disabled={!canConvert}
                    className={`btn-primary inline-flex items-center justify-center gap-2 text-sm ${
                      !canConvert ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isProcessing ? <Loader2 size={17} className="animate-spin" /> : <Zap size={17} />}
                    Convert to JPG
                  </button>

                  <button
                    type="button"
                    onClick={clearImages}
                    disabled={isProcessing}
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 size={17} />
                    Clear
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,.png"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </div>
          )}

          {images.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setSettingsOpen((current) => !current)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-[#f8f4ff] transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f4edff] flex items-center justify-center shrink-0">
                    <Settings2 size={20} className="text-[var(--primary)]" />
                  </div>

                  <div>
                    <h3 className="font-semibold">JPG Settings</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Quality {Math.round(jpgQuality * 100)}% • Background {backgroundColor}
                    </p>
                  </div>
                </div>
              </button>

              {settingsOpen && (
                <div className="border-t border-[var(--border)] bg-[#fafafa] p-4 sm:p-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block rounded-2xl border border-[var(--border)] bg-white p-4">
                      <span className="block text-sm font-bold mb-3">
                        JPG Quality: {Math.round(jpgQuality * 100)}%
                      </span>

                      <input
                        type="range"
                        min="0.5"
                        max="1"
                        step="0.01"
                        value={jpgQuality}
                        onChange={(event) => handleQualityChange(Number(event.target.value))}
                        className="w-full accent-[var(--primary)]"
                      />
                    </label>

                    <label className="block rounded-2xl border border-[var(--border)] bg-white p-4">
                      <span className="block text-sm font-bold mb-3">
                        Transparent Background
                      </span>

                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(event) => handleBackgroundColorChange(event.target.value)}
                          className="h-11 w-16 rounded-xl border border-[var(--border)] bg-white p-1"
                        />

                        <input
                          type="text"
                          value={backgroundColor}
                          onChange={(event) => handleBackgroundColorChange(event.target.value)}
                          className="flex-1 h-11 rounded-xl border border-[var(--border)] bg-white px-3 font-bold outline-none focus:border-[var(--primary)]"
                        />
                      </div>

                      <p className="text-xs text-[var(--text-secondary)] mt-2">
                        JPG does not support transparency, so transparent PNG areas use this color.
                      </p>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                <span>{processingPhase || "Processing..."}</span>
                <span>{progress}%</span>
              </div>

              <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start justify-between gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>

              {processingTimeMs > 0 && (
                <span className="font-bold shrink-0">
                  {(processingTimeMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          )}

          {images.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-5">
              <ImageGrid
                title="Original PNG"
                images={images.map((image) => ({
                  id: image.id,
                  name: image.name,
                  url: image.previewUrl,
                  size: image.size,
                  width: image.width,
                  height: image.height,
                  status: image.status,
                }))}
                onRemove={removeImage}
                onFullView={(image) => setFullViewImage(image)}
                removable
              />

              <ConvertedGrid
                images={convertedImages}
                totalSize={totalConvertedSize}
                onDownload={downloadSingleImage}
                onDownloadAll={downloadAllImages}
                onFullView={(image) => setFullViewImage(image)}
                isProcessing={isProcessing}
              />
            </div>
          )}

          {!images.length && (
            <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
              <ImageIcon size={42} className="mx-auto mb-3 text-gray-300" />
              <p className="text-[var(--text-secondary)]">
                Upload PNG images to create JPG files.
              </p>
            </div>
          )}
        </div>
      </section>

      {fullViewImage && (
        <div className="fixed inset-0 z-50 bg-black/75 p-4 flex items-center justify-center">
          <div className="w-full max-w-6xl max-h-[92vh] rounded-2xl bg-white overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold truncate">{fullViewImage.name || fullViewImage.fileName}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {fullViewImage.width || "-"}×{fullViewImage.height || "-"} • {formatBytes(fullViewImage.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFullViewImage(null)}
                className="h-10 w-10 rounded-xl border border-[var(--border)] inline-flex items-center justify-center hover:bg-[#f8f4ff]"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="h-[78vh] bg-[#f8f4ff] flex items-center justify-center p-4 overflow-auto">
              <img
                src={fullViewImage.url}
                alt={fullViewImage.name || fullViewImage.fileName}
                className="max-h-full max-w-full object-contain rounded-xl shadow"
              />
            </div>
          </div>
        </div>
      )}

      <SuggestedTools currentToolId="png-to-jpg-converter" />
    </div>
  );
}

function ImageGrid({ title, images, onRemove, onFullView, removable = false }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon size={20} className="text-[var(--primary)]" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            onRemove={removable ? () => onRemove(image.id) : null}
            onFullView={() => onFullView(image)}
          />
        ))}
      </div>
    </div>
  );
}

function ConvertedGrid({ images, totalSize, onDownload, onDownloadAll, onFullView, isProcessing }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Download size={20} className="text-[var(--primary)]" />
          <h2 className="text-xl font-bold">JPG Result</h2>
        </div>

        {images.length > 0 && (
          <button
            type="button"
            onClick={onDownloadAll}
            disabled={isProcessing}
            className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
          >
            <Download size={17} />
            {images.length === 1 ? "Download JPG" : "Download All"}
          </button>
        )}
      </div>

      {images.length > 0 ? (
        <>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {images.length} JPG image{images.length === 1 ? "" : "s"} • {formatBytes(totalSize)}
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {images.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                onDownload={() => onDownload(image)}
                onFullView={() => onFullView(image)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="min-h-[260px] rounded-2xl border border-dashed border-[var(--border)] bg-gray-50 flex items-center justify-center text-center p-6">
          <div>
            <Download size={42} className="mx-auto mb-3 text-gray-300" />
            <p className="text-[var(--text-secondary)]">
              Converted JPG files will appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageCard({ image, onRemove, onDownload, onFullView }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden shadow-sm">
      <div className="relative h-44 bg-[#f8f4ff] flex items-center justify-center">
        <img
          src={image.url}
          alt={image.name || image.fileName}
          className="max-h-full max-w-full object-contain"
        />

        <button
          type="button"
          onClick={onFullView}
          className="absolute bottom-3 right-3 h-10 w-10 rounded-xl border border-[var(--border)] bg-white/95 shadow-sm inline-flex items-center justify-center hover:bg-[#f4edff] hover:text-[var(--primary)] transition"
          title="Preview full image"
          aria-label="Preview full image"
        >
          <Eye size={18} />
        </button>
      </div>

      <div className="p-4">
        <p className="font-semibold text-sm truncate" title={image.name || image.fileName}>
          {image.name || image.fileName}
        </p>

        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {image.width && image.height ? `${image.width}×${image.height} • ` : ""}
          {formatBytes(image.size)}
        </p>

        <div className="flex justify-end gap-2 mt-4">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="h-10 w-10 rounded-xl border border-[var(--border)] bg-white inline-flex items-center justify-center text-[var(--primary)] hover:bg-[#f8f4ff] transition"
              title="Download JPG"
              aria-label="Download JPG"
            >
              <Download size={18} />
            </button>
          )}

          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="h-10 w-10 rounded-xl border border-red-200 bg-red-50 inline-flex items-center justify-center text-red-600 hover:bg-red-100 transition"
              title="Remove image"
              aria-label="Remove image"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create image."));
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

  const safeName = sanitizeDownloadFileName(filename || "download.jpg");
  const file = new File([safeBlob], safeName, { type: safeBlob.type || "image/jpeg" });

  const canUseNativeShare =
    isIosLikeDevice() &&
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function" &&
    navigator.canShare({ files: [file] });

  if (canUseNativeShare) {
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
  const cleanName = String(fileName || "download.jpg")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  return cleanName || "download.jpg";
}

function getFileBaseName(fileName) {
  return String(fileName || "converted").replace(/\.[^/.]+$/, "");
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const sizeIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, sizeIndex);

  return `${size.toFixed(sizeIndex === 0 ? 0 : 1)} ${units[sizeIndex]}`;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitRemaining(startTime, minimumMs) {
  const elapsed = performance.now() - startTime;
  const remaining = Math.max(0, minimumMs - elapsed);

  if (remaining > 0) {
    await wait(remaining);
  }
}
