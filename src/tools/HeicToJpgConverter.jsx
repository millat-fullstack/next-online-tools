import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock3,
  Download,
  Eye,
  FileImage,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import JSZip from "jszip";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "HEIC to JPG Converter",
  path: "/heic-to-jpg-converter",
  category: "Image Tools",
  description:
    "Convert up to 10 HEIC and HEIF images to 100% quality JPG online with clean preview and instant download.",
  metaTitle: "HEIC to JPG Converter | Convert HEIC Images to JPG Online Free",
  metaDescription:
    "Convert HEIC and HEIF images to JPG online for free. Batch convert up to 10 images with 100% JPG quality, preview, and download.",
};

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 35;
const JPG_QUALITY = 100;
const ACCEPTED_EXTENSIONS = [".heic", ".heif"];
const ACCEPTED_TYPES = [
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
];

export default function HeicToJpgConverter() {
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [convertedImages, setConvertedImages] = useState([]);
  const [fullViewImage, setFullViewImage] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingPhase, setProcessingPhase] = useState("");
  const [processingTimeMs, setProcessingTimeMs] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalInputSize = useMemo(() => {
    return files.reduce((sum, item) => sum + item.file.size, 0);
  }, [files]);

  const totalOutputSize = useMemo(() => {
    return convertedImages.reduce((sum, item) => sum + item.size, 0);
  }, [convertedImages]);

  const canConvert = files.length > 0 && !isConverting;

  useEffect(() => {
    return () => {
      files.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });

      convertedImages.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
    };
  }, []);

  function resetInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function clearConvertedOutput() {
    convertedImages.forEach((item) => {
      if (item.url) URL.revokeObjectURL(item.url);
    });

    setConvertedImages([]);
    setFullViewImage(null);
    setProcessingTimeMs(0);
    setProgress(0);
    setProcessingPhase("");
  }

  function isValidHeicFile(selectedFile) {
    if (!selectedFile) return false;

    const lowerName = selectedFile.name.toLowerCase();
    const hasValidExtension = ACCEPTED_EXTENSIONS.some((extension) =>
      lowerName.endsWith(extension)
    );

    return hasValidExtension || ACCEPTED_TYPES.includes(selectedFile.type);
  }

  function createFileItem(selectedFile) {
    return {
      id: createId(),
      file: selectedFile,
      name: selectedFile.name,
      size: selectedFile.size,
      status: "ready",
      message: "",
      previewUrl: "",
    };
  }

  function handleFiles(fileList) {
    if (isConverting) return;

    clearFeedback();
    clearConvertedOutput();

    const incomingFiles = Array.from(fileList || []);

    if (!incomingFiles.length) return;

    const acceptedFiles = [];
    let rejectedCount = 0;
    let tooLargeCount = 0;

    incomingFiles.forEach((selectedFile) => {
      if (!isValidHeicFile(selectedFile)) {
        rejectedCount += 1;
        return;
      }

      if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        tooLargeCount += 1;
        return;
      }

      acceptedFiles.push(selectedFile);
    });

    const remainingSlots = Math.max(0, MAX_FILES - files.length);
    const limitedFiles = acceptedFiles.slice(0, remainingSlots);
    const skippedByLimit = Math.max(0, acceptedFiles.length - limitedFiles.length);

    if (!limitedFiles.length) {
      if (files.length >= MAX_FILES) {
        setError(`Maximum ${MAX_FILES} HEIC/HEIF images are allowed.`);
      } else if (tooLargeCount) {
        setError(`Each image must be under ${MAX_FILE_SIZE_MB} MB.`);
      } else {
        setError("Please upload valid HEIC or HEIF image files.");
      }

      resetInput();
      return;
    }

    const newItems = limitedFiles.map(createFileItem);

    setFiles((current) => [...current, ...newItems]);

    const messages = [];
    messages.push(`${newItems.length} image${newItems.length === 1 ? "" : "s"} added.`);
    messages.push(`JPG quality is fixed at ${JPG_QUALITY}%.`);

    if (rejectedCount) {
      messages.push(`${rejectedCount} invalid file${rejectedCount === 1 ? "" : "s"} ignored.`);
    }

    if (tooLargeCount) {
      messages.push(`${tooLargeCount} large file${tooLargeCount === 1 ? "" : "s"} ignored.`);
    }

    if (skippedByLimit) {
      messages.push(`${skippedByLimit} file${skippedByLimit === 1 ? "" : "s"} skipped because the limit is ${MAX_FILES}.`);
    }

    setSuccess(messages.join(" "));
    resetInput();
  }

  function handleInputChange(event) {
    handleFiles(event.target.files);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  function removeFile(fileId) {
    if (isConverting) return;

    clearFeedback();
    clearConvertedOutput();

    setFiles((current) => {
      const itemToRemove = current.find((item) => item.id === fileId);

      if (itemToRemove?.previewUrl) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }

      return current.filter((item) => item.id !== fileId);
    });
  }

  function updateFileStatus(fileId, updates) {
    setFiles((current) =>
      current.map((item) => (item.id === fileId ? { ...item, ...updates } : item))
    );
  }

  async function convertFiles() {
    if (!files.length) {
      setError("Please upload at least one HEIC or HEIF image first.");
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setProcessingTimeMs(0);
    setProcessingPhase("Preparing images...");
    setError("");
    setSuccess("");
    clearConvertedOutput();

    const startTime = performance.now();
    const results = [];
    let failedCount = 0;

    try {
      for (let index = 0; index < files.length; index += 1) {
        const item = files[index];

        setProcessingPhase(`Converting image ${index + 1} of ${files.length}...`);
        setProgress(Math.round((index / Math.max(1, files.length)) * 88));
        updateFileStatus(item.id, {
          status: "converting",
          message: "",
        });

        try {
          const jpgBlob = await convertHeicToJpg(item.file, JPG_QUALITY);

          if (!(jpgBlob instanceof Blob) || !jpgBlob.size) {
            throw new Error("The converter returned an empty JPG file.");
          }

          const jpgUrl = URL.createObjectURL(jpgBlob);
          const jpgName = `${getBaseName(item.name)}.jpg`;

          const resultItem = {
            id: createId(),
            sourceId: item.id,
            sourceName: item.name,
            fileName: jpgName,
            blob: jpgBlob,
            url: jpgUrl,
            size: jpgBlob.size,
          };

          results.push(resultItem);

          updateFileStatus(item.id, {
            status: "done",
            message: "Converted",
          });
        } catch (conversionError) {
          failedCount += 1;
          updateFileStatus(item.id, {
            status: "error",
            message: conversionError?.message || "Conversion failed",
          });
        }

        await wait(35);
      }

      setConvertedImages(results);
      setProgress(100);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));
      setProcessingTimeMs(actualTime);

      if (results.length) {
        const successMessage = `${results.length} JPG image${results.length === 1 ? "" : "s"} created in ${(actualTime / 1000).toFixed(1)}s.`;
        setSuccess(
          failedCount
            ? `${successMessage} ${failedCount} image${failedCount === 1 ? "" : "s"} failed.`
            : successMessage
        );
      } else {
        setError(
          "No image could be converted. This HEIC/HEIF variant may be unsupported by browser-side converters."
        );
      }
    } finally {
      setIsConverting(false);
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  async function handleDownloadSingle(image) {
    if (!image?.blob) return;

    setError("");
    setSuccess("");

    try {
      await saveBlob(image.blob, image.fileName);
      setSuccess("Download started.");
    } catch {
      setError("Could not download this JPG image.");
    }
  }

  async function handleDownloadAll() {
    if (!convertedImages.length) {
      setError("Please convert images first.");
      return;
    }

    if (convertedImages.length === 1) {
      await handleDownloadSingle(convertedImages[0]);
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setProcessingPhase("Preparing ZIP file...");
    setError("");
    setSuccess("");

    const startTime = performance.now();

    try {
      const zip = new JSZip();

      for (let index = 0; index < convertedImages.length; index += 1) {
        const item = convertedImages[index];

        zip.file(item.fileName, item.blob, {
          binary: true,
          compression: "STORE",
        });

        setProgress(Math.round(((index + 1) / convertedImages.length) * 70));
        await wait(10);
      }

      const zipBlob = await zip.generateAsync(
        {
          type: "blob",
          streamFiles: true,
          compression: "STORE",
          mimeType: "application/zip",
        },
        (metadata) => {
          setProgress(Math.min(95, 70 + Math.round((metadata.percent || 0) * 0.25)));
        }
      );

      await saveBlob(zipBlob, "converted-heic-to-jpg-images.zip");

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));

      setProgress(100);
      setProcessingTimeMs(actualTime);
      setSuccess(`ZIP download prepared in ${(actualTime / 1000).toFixed(1)}s.`);
    } catch (downloadError) {
      console.error("HEIC JPG ZIP download error:", downloadError);
      setError("Could not create ZIP. Please download images one by one.");
    } finally {
      setIsConverting(false);
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  function handleReset() {
    files.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });

    clearConvertedOutput();
    setFiles([]);
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
          Upload up to {MAX_FILES} iPhone HEIC/HEIF images, convert them to 100% quality JPG, preview, and download.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="flex flex-col gap-5">
          {!files.length && (
            <label
              onDrop={handleDrop}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              className={`min-h-[280px] border-2 border-dashed rounded-3xl p-8 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                isDragging
                  ? "border-[var(--primary)] bg-[#f8f4ff]"
                  : "border-[var(--border)] bg-gray-50 hover:bg-[#f8f4ff]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".heic,.heif,image/heic,image/heif,image/heic-sequence,image/heif-sequence"
                multiple
                onChange={handleInputChange}
                className="hidden"
              />

              <Upload size={44} className="text-[var(--primary)] mb-4" />

              <h2 className="text-xl font-bold mb-2">Upload HEIC / HEIF Images</h2>

              <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-5">
                Convert up to {MAX_FILES} images at once. Max {MAX_FILE_SIZE_MB} MB per image.
              </p>

              <span className="btn-primary inline-flex items-center gap-2">
                <Upload size={17} />
                Choose Images
              </span>
            </label>
          )}

          {files.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileImage size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-bold">Selected Images</h2>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {files.length}/{MAX_FILES} images • {formatBytes(totalInputSize)} • JPG quality {JPG_QUALITY}%
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isConverting || files.length >= MAX_FILES}
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <Upload size={17} />
                    Add More
                  </button>

                  <button
                    type="button"
                    onClick={convertFiles}
                    disabled={!canConvert}
                    className={`btn-primary inline-flex items-center justify-center gap-2 text-sm ${
                      !canConvert ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isConverting ? <Loader2 size={17} className="animate-spin" /> : <FileImage size={17} />}
                    Convert JPG
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isConverting}
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <RotateCcw size={17} />
                    Reset
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".heic,.heif,image/heic,image/heif,image/heic-sequence,image/heif-sequence"
                    multiple
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={isConverting}
                  />
                </div>
              </div>
            </div>
          )}

          {isConverting && (
            <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4">
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                <span>{processingPhase || "Processing..."}</span>
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

          {(error || success) && (
            <>
              {error && <MessageBox type="error" message={error} />}
              {success && <MessageBox type="success" message={success} />}
            </>
          )}

          {files.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Upload size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-bold">Input HEIC / HEIF</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {files.map((item) => (
                    <FileCard
                      key={item.id}
                      item={item}
                      onRemove={() => removeFile(item.id)}
                      disabled={isConverting}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Download size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-bold">JPG Result</h2>
                  </div>

                  {convertedImages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadAll}
                      disabled={isConverting}
                      className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
                    >
                      <Download size={17} />
                      {convertedImages.length === 1 ? "Download JPG" : "Download All"}
                    </button>
                  )}
                </div>

                {processingTimeMs > 0 && (
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 rounded-full px-3 py-2 mb-4">
                    <Clock3 size={14} />
                    {(processingTimeMs / 1000).toFixed(1)}s • {formatBytes(totalOutputSize)}
                  </div>
                )}

                {convertedImages.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {convertedImages.map((image) => (
                      <ConvertedCard
                        key={image.id}
                        image={image}
                        onPreview={() => setFullViewImage(image)}
                        onDownload={() => handleDownloadSingle(image)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="min-h-[300px] rounded-2xl border border-dashed border-[var(--border)] bg-gray-50 flex items-center justify-center text-center p-6">
                    <div>
                      <FileImage size={46} className="mx-auto mb-3 text-[var(--primary)]" />
                      <p className="font-semibold">No JPG result yet</p>
                      <p className="text-sm text-[var(--text-secondary)] mt-2">
                        Convert images and the JPG previews will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {fullViewImage && (
        <div className="fixed inset-0 z-50 bg-black/75 p-4 flex items-center justify-center">
          <div className="w-full max-w-6xl max-h-[92vh] rounded-2xl bg-white overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{fullViewImage.fileName}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {formatBytes(fullViewImage.size)}
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
                alt={fullViewImage.fileName}
                className="max-h-full max-w-full object-contain rounded-xl shadow-sm bg-white"
              />
            </div>
          </div>
        </div>
      )}

      <SuggestedTools currentToolId="heic-to-jpg-converter" />
    </div>
  );
}

function FileCard({ item, onRemove, disabled }) {
  const isDone = item.status === "done";
  const isError = item.status === "error";
  const isConverting = item.status === "converting";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          isDone
            ? "bg-green-50 text-green-700"
            : isError
              ? "bg-red-50 text-red-700"
              : "bg-[#f4edff] text-[var(--primary)]"
        }`}>
          {isConverting ? <Loader2 size={19} className="animate-spin" /> : <FileImage size={19} />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{item.name}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {formatBytes(item.size)}
          </p>

          {item.message && (
            <p className={`text-xs mt-2 ${isError ? "text-red-600" : "text-green-700"}`}>
              {item.message}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="h-9 w-9 rounded-xl border border-red-200 bg-red-50 text-red-600 inline-flex items-center justify-center hover:bg-red-100 disabled:opacity-40"
          title="Remove image"
          aria-label="Remove image"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function ConvertedCard({ image, onPreview, onDownload }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden shadow-sm">
      <div className="relative h-44 bg-[#f8f4ff] flex items-center justify-center p-2">
        <img
          src={image.url}
          alt={image.fileName}
          className="max-h-full max-w-full object-contain rounded-lg bg-white"
        />

        <button
          type="button"
          onClick={onPreview}
          className="absolute bottom-3 right-3 h-10 w-10 rounded-xl border border-[var(--border)] bg-white/95 shadow-sm inline-flex items-center justify-center hover:bg-[#f4edff] hover:text-[var(--primary)] transition"
          title="Preview full image"
          aria-label="Preview full image"
        >
          <Eye size={18} />
        </button>
      </div>

      <div className="p-4">
        <p className="font-semibold text-sm truncate" title={image.fileName}>
          {image.fileName}
        </p>

        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {formatBytes(image.size)}
        </p>

        <button
          type="button"
          onClick={onDownload}
          className="mt-4 h-10 w-10 rounded-xl border border-[var(--border)] bg-white inline-flex items-center justify-center text-[var(--primary)] hover:bg-[#f8f4ff] transition"
          title="Download JPG"
          aria-label="Download JPG"
        >
          <Download size={18} />
        </button>
      </div>
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

  throw new Error("Unsupported HEIC/HEIF variant.");
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

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
