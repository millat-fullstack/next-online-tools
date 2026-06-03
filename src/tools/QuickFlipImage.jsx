// src/tools/QuickFlipImage.jsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  RotateCw,
  RotateCcw as RotateLeft,
  Image as ImageIcon,
  FlipHorizontal2,
  FlipVertical2,
  ArrowLeftRight,
  ArrowUpDown,
  Sparkles,
  Settings2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Quick Flip Image",
  path: "/quick-flip-image",
  category: "Image Tools",
  description:
    "Flip images online quickly. Upload, drag, or paste an image, then flip horizontally, vertically, rotate, and download instantly.",
  metaTitle: "Quick Flip Image Online | Flip Photos Horizontally or Vertically",
  metaDescription:
    "Flip images online for free. Upload, drag, or paste an image, then flip horizontally, vertically, rotate, preview, and download as PNG, JPG, or WEBP.",
};

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_LONG_SIDE = 8000;
const MIN_PROCESSING_TIME_MS = 6000;

const OUTPUT_FORMATS = [
  {
    value: "image/png",
    label: "PNG",
    extension: "png",
  },
  {
    value: "image/jpeg",
    label: "JPG",
    extension: "jpg",
  },
  {
    value: "image/webp",
    label: "WEBP",
    extension: "webp",
  },
];

const PRESET_ACTIONS = [
  {
    id: "flip-horizontal",
    label: "Flip Horizontal",
    description: "Mirror image left to right",
    icon: FlipHorizontal2,
  },
  {
    id: "flip-vertical",
    label: "Flip Vertical",
    description: "Mirror image top to bottom",
    icon: FlipVertical2,
  },
  {
    id: "flip-both",
    label: "Flip Both",
    description: "Flip horizontal and vertical",
    icon: ArrowLeftRight,
  },
  {
    id: "reset",
    label: "Original",
    description: "Reset all changes",
    icon: RotateCcw,
  },
];

export default function QuickFlipImage() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageUrlRef = useRef("");
  const outputUrlRef = useRef("");

  const [imageData, setImageData] = useState(null);

  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [rotation, setRotation] = useState(0);

  const [outputFormat, setOutputFormat] = useState("image/png");
  const [quality, setQuality] = useState(0.94);

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [exportProgress, setExportProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [lastOutputSize, setLastOutputSize] = useState(0);
  const [outputPreviewUrl, setOutputPreviewUrl] = useState("");

  const [activePanel, setActivePanel] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const hasImage = Boolean(imageData?.element);

  const selectedOutputFormat = useMemo(() => {
    return (
      OUTPUT_FORMATS.find((format) => format.value === outputFormat) ||
      OUTPUT_FORMATS[0]
    );
  }, [outputFormat]);

  const outputDimensions = useMemo(() => {
    if (!imageData) {
      return {
        width: 0,
        height: 0,
      };
    }

    return getOutputDimensions({
      width: imageData.width,
      height: imageData.height,
      rotation,
    });
  }, [imageData, rotation]);

  const previewWidth = useMemo(() => {
    if (!outputDimensions.width) return 0;

    const isLandscape = outputDimensions.width >= outputDimensions.height;
    const maxWidth = isLandscape ? 980 : 620;

    return Math.min(maxWidth, outputDimensions.width);
  }, [outputDimensions]);

  const processingText = processingTimeMs
    ? `${(processingTimeMs / 1000).toFixed(1)}s`
    : "6s minimum";

  const handleImageFile = useCallback(async (file) => {
    setErrorMessage("");
    setSuccessMessage("");
    clearOutput();

    const validationError = validateImageFile(file);

    if (validationError) {
      setErrorMessage(validationError);
      resetFileInput();
      return;
    }

    setIsLoadingImage(true);

    try {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(file);
      imageUrlRef.current = objectUrl;

      const loadedImage = await loadImage(objectUrl);

      const imageWidth = loadedImage.naturalWidth || loadedImage.width;
      const imageHeight = loadedImage.naturalHeight || loadedImage.height;

      if (Math.max(imageWidth, imageHeight) > MAX_IMAGE_LONG_SIDE) {
        throw new Error(
          `Image is too large. Maximum side allowed is ${MAX_IMAGE_LONG_SIDE}px.`
        );
      }

      setImageData({
        element: loadedImage,
        url: objectUrl,
        name: file.name || "image",
        size: file.size,
        type: file.type,
        width: imageWidth,
        height: imageHeight,
      });

      setOutputFormat(getDefaultOutputFormat(file.type));
      setFlipX(false);
      setFlipY(false);
      setRotation(0);
      setActivePanel("");

      setSuccessMessage(
        "Image loaded successfully. Choose a flip option and download the final image."
      );
    } catch (error) {
      setErrorMessage(
        error?.message || "Could not load this image. Please try another file."
      );

      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = "";
      }

      setImageData(null);
    } finally {
      setIsLoadingImage(false);
      resetFileInput();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !imageData) return;

    drawFlippedImage({
      canvas,
      imageData,
      flipX,
      flipY,
      rotation,
      outputFormat,
      includeEditorGuides: true,
    });
  }, [imageData, flipX, flipY, rotation, outputFormat]);

  useEffect(() => {
    function handlePaste(event) {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type?.startsWith("image/"));

      if (!imageItem) return;

      const file = imageItem.getAsFile();

      if (file) {
        handleImageFile(file);
      }
    }

    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handleImageFile]);

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }

      if (outputUrlRef.current) {
        URL.revokeObjectURL(outputUrlRef.current);
      }
    };
  }, []);

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearOutput() {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = "";
    }

    setOutputPreviewUrl("");
    setLastOutputSize(0);
    setProcessingTimeMs(0);
    setExportProgress(0);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileInputChange(event) {
    const file = event.target.files?.[0];

    if (file) {
      handleImageFile(file);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDraggingFile(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleImageFile(file);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDraggingFile(true);
  }

  function handleDragLeave() {
    setIsDraggingFile(false);
  }

  function applyAction(actionId) {
    clearOutput();

    if (actionId === "flip-horizontal") {
      setFlipX((current) => !current);
      return;
    }

    if (actionId === "flip-vertical") {
      setFlipY((current) => !current);
      return;
    }

    if (actionId === "flip-both") {
      setFlipX((current) => !current);
      setFlipY((current) => !current);
      return;
    }

    if (actionId === "reset") {
      setFlipX(false);
      setFlipY(false);
      setRotation(0);
    }
  }

  function rotateLeft() {
    clearOutput();
    setRotation((current) => normalizeRotation(current - 90));
  }

  function rotateRight() {
    clearOutput();
    setRotation((current) => normalizeRotation(current + 90));
  }

  function resetTransform() {
    clearOutput();
    setFlipX(false);
    setFlipY(false);
    setRotation(0);
  }

  async function createFlippedImage({ downloadAfterCreate = false } = {}) {
    if (!hasImage) {
      setErrorMessage("Please upload an image first.");
      return;
    }

    setIsExporting(true);
    setErrorMessage("");
    setSuccessMessage("");
    setExportProgress(5);

    const startTime = performance.now();

    try {
      await wait(120);
      setExportProgress(25);

      const exportCanvas = document.createElement("canvas");

      drawFlippedImage({
        canvas: exportCanvas,
        imageData,
        flipX,
        flipY,
        rotation,
        outputFormat,
        includeEditorGuides: false,
      });

      setExportProgress(55);

      const blob = await canvasToBlob(exportCanvas, outputFormat, quality);

      setExportProgress(72);

      await ensureMinimumProcessingTime({
        startTime,
        minimumMs: MIN_PROCESSING_TIME_MS,
        setProgress: setExportProgress,
      });

      if (outputUrlRef.current) {
        URL.revokeObjectURL(outputUrlRef.current);
      }

      const previewUrl = URL.createObjectURL(blob);
      outputUrlRef.current = previewUrl;

      const actualProcessingTime = Math.max(
        MIN_PROCESSING_TIME_MS,
        Math.round(performance.now() - startTime)
      );

      setOutputPreviewUrl(previewUrl);
      setLastOutputSize(blob.size);
      setProcessingTimeMs(actualProcessingTime);
      setExportProgress(100);
      setSuccessMessage(
        `Image created in ${(actualProcessingTime / 1000).toFixed(1)}s.`
      );

      if (downloadAfterCreate) {
        downloadBlob(blob);
      }
    } catch {
      setErrorMessage("Could not create the flipped image. Please try again.");
    } finally {
      setIsExporting(false);

      window.setTimeout(() => {
        setExportProgress(0);
      }, 900);
    }
  }

  function downloadBlob(blob) {
    if (!blob && !outputPreviewUrl) {
      setErrorMessage("Please create the flipped image first.");
      return;
    }

    const link = document.createElement("a");
    const fileName = getFileBaseName(imageData?.name || "image");

    link.href = blob ? URL.createObjectURL(blob) : outputPreviewUrl;
    link.download = `flipped-${fileName}.${selectedOutputFormat.extension}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (blob) {
      window.setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 1000);
    }
  }

  function resetTool() {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = "";
    }

    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = "";
    }

    setImageData(null);
    setFlipX(false);
    setFlipY(false);
    setRotation(0);
    setOutputFormat("image/png");
    setQuality(0.94);
    setIsDraggingFile(false);
    setIsLoadingImage(false);
    setIsExporting(false);
    setExportProgress(0);
    setProcessingTimeMs(0);
    setLastOutputSize(0);
    setOutputPreviewUrl("");
    setActivePanel("");
    setErrorMessage("");
    setSuccessMessage("");
    resetFileInput();
  }

  return (
    <div className="flex flex-col gap-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Header */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <FlipHorizontal2 size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Quick Flip Image</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload, drag, or paste an image, then flip it horizontally,
          vertically, or both. You can also rotate the image and download the
          final result as PNG, JPG, or WEBP.
        </p>
      </section>

      {/* Tool */}
      <section className="card p-4 sm:p-5">
        {!hasImage && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFilePicker}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition mb-5 ${
              isDraggingFile
                ? "border-[var(--primary)] bg-[#f4edff]"
                : "border-[var(--border)] hover:bg-[#f8f4ff]"
            }`}
          >
            {isLoadingImage ? (
              <Loader2
                size={40}
                className="mx-auto mb-4 text-[var(--primary)] animate-spin"
              />
            ) : (
              <Upload size={40} className="mx-auto mb-4 text-[var(--primary)]" />
            )}

            <h2 className="text-xl font-semibold mb-2">
              Upload, drop, or paste image
            </h2>

            <p className="text-sm text-[var(--text-secondary)]">
              Supports JPG, PNG, WEBP, GIF, and BMP. You can also paste an image
              with <strong>Ctrl + V</strong>. Max file size:{" "}
              <strong>{MAX_FILE_SIZE_MB} MB</strong>.
            </p>
          </div>
        )}

        {/* Top Toolbar */}
        <div className="sticky top-3 z-30 rounded-2xl border border-[var(--border)] bg-white/95 backdrop-blur shadow-sm p-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openFilePicker}
              className="btn-secondary inline-flex items-center justify-center gap-2 px-3 py-2 text-sm"
            >
              <Upload size={16} />
              Upload
            </button>

            <div className="w-px h-8 bg-[var(--border)] mx-1" />

            {PRESET_ACTIONS.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => applyAction(action.id)}
                  disabled={!hasImage}
                  className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm ${
                    !hasImage
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-[#f8f4ff]"
                  } ${
                    (action.id === "flip-horizontal" && flipX) ||
                    (action.id === "flip-vertical" && flipY)
                      ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                      : "border-[var(--border)]"
                  }`}
                  title={action.description}
                >
                  <Icon size={17} />
                  <span className="hidden sm:inline">{action.label}</span>
                </button>
              );
            })}

            <div className="w-px h-8 bg-[var(--border)] mx-1" />

            <IconButton disabled={!hasImage} title="Rotate left" onClick={rotateLeft}>
              <RotateLeft size={18} />
            </IconButton>

            <IconButton disabled={!hasImage} title="Rotate right" onClick={rotateRight}>
              <RotateCw size={18} />
            </IconButton>

            <button
              type="button"
              onClick={() =>
                setActivePanel(activePanel === "export" ? "" : "export")
              }
              className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm ${
                activePanel === "export"
                  ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                  : "border-[var(--border)] hover:bg-[#f8f4ff]"
              }`}
            >
              <Settings2 size={17} />
              Export
            </button>

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => createFlippedImage({ downloadAfterCreate: true })}
              disabled={!hasImage || isExporting}
              className={`btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm ${
                !hasImage || isExporting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isExporting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Download size={17} />
              )}
              {isExporting ? "Creating..." : "Create & Download"}
            </button>
          </div>

          {/* Export Panel */}
          {activePanel === "export" && (
            <div className="mt-3 border border-[var(--border)] rounded-2xl bg-[#fafafa] p-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Format
                  </label>

                  <select
                    value={outputFormat}
                    onChange={(event) => {
                      setOutputFormat(event.target.value);
                      clearOutput();
                    }}
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  >
                    {OUTPUT_FORMATS.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(outputFormat === "image/jpeg" ||
                  outputFormat === "image/webp") && (
                  <RangeInput
                    label={`Quality: ${Math.round(quality * 100)}%`}
                    min={0.6}
                    max={1}
                    step={0.01}
                    value={quality}
                    onChange={(value) => {
                      setQuality(Number(value));
                      clearOutput();
                    }}
                  />
                )}

                <InfoCard
                  label="Processing"
                  value={
                    processingTimeMs
                      ? `${(processingTimeMs / 1000).toFixed(1)}s`
                      : "6s minimum"
                  }
                  green={Boolean(processingTimeMs)}
                />

                <InfoCard
                  label="Output Size"
                  value={lastOutputSize ? formatBytes(lastOutputSize) : "-"}
                  green={Boolean(lastOutputSize)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Feedback */}
        {(errorMessage || successMessage || isExporting) && (
          <div className="grid md:grid-cols-2 gap-3 mb-4">
            {errorMessage && (
              <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
                <p>{successMessage}</p>
              </div>
            )}

            {isExporting && (
              <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-xl p-4 md:col-span-2">
                <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                  <span>Creating final flipped image...</span>
                  <span>{exportProgress}%</span>
                </div>

                <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-300"
                    style={{
                      width: `${exportProgress}%`,
                    }}
                  />
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  Premium processing time: minimum 6 seconds for final output.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Artboard */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border border-[var(--border)] rounded-2xl bg-[#eef0f5] min-h-[640px] overflow-auto p-4 sm:p-6 flex items-center justify-center ${
            isDraggingFile ? "ring-2 ring-[var(--primary)]" : ""
          }`}
        >
          {!hasImage ? (
            <div className="text-center">
              <ImageIcon size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-[var(--text-secondary)]">
                Upload, drop, or paste an image to start flipping.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white shadow-2xl">
              <canvas
                ref={canvasRef}
                className="rounded-xl bg-white"
                style={{
                  width: `${previewWidth}px`,
                  maxWidth: "none",
                }}
              />
            </div>
          )}
        </div>

        {/* Stats */}
        {hasImage && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
            <InfoCard label="Original" value={`${imageData.width}×${imageData.height}`} />
            <InfoCard label="Output" value={`${outputDimensions.width}×${outputDimensions.height}`} />
            <InfoCard label="Horizontal" value={flipX ? "Flipped" : "Normal"} />
            <InfoCard label="Vertical" value={flipY ? "Flipped" : "Normal"} />
            <InfoCard label="Rotation" value={`${rotation}°`} />
            <InfoCard
              label="Process Time"
              value={
                processingTimeMs
                  ? `${(processingTimeMs / 1000).toFixed(1)}s`
                  : "6s minimum"
              }
              green={Boolean(processingTimeMs)}
            />
          </div>
        )}

        {/* Final Preview */}
        {outputPreviewUrl && (
          <div className="mt-4 border border-[var(--border)] rounded-2xl p-5 bg-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-semibold">Final Preview</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Created in {(processingTimeMs / 1000).toFixed(1)}s •{" "}
                  {formatBytes(lastOutputSize)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => downloadBlob()}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download Again
              </button>
            </div>

            <div className="mt-4 flex justify-center bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-4 overflow-auto">
              <img
                src={outputPreviewUrl}
                alt="Final flipped preview"
                className="max-w-[260px] rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Help Note */}
        {hasImage && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Eye size={20} className="text-blue-700 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Use Flip Horizontal to mirror left and right, Flip Vertical to
                mirror top and bottom, or Flip Both for a complete reverse. PNG
                keeps transparency, while JPG uses a white background.
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={resetTool}
          className="btn-secondary w-full mt-4 inline-flex items-center justify-center gap-2"
        >
          <RotateCcw size={18} />
          Reset Everything
        </button>
      </section>

      {/* SEO Content */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-4">Flip Images Online</h2>

        <div className="text-[var(--text-secondary)] leading-7 space-y-3">
          <p>
            Quick Flip Image lets you flip photos and graphics online directly
            in your browser. You can mirror an image horizontally, flip it
            vertically, rotate it, preview the result, and download the final
            image in PNG, JPG, or WEBP format.
          </p>

          <p>
            This tool is useful for fixing selfie orientation, creating mirrored
            designs, reversing product images, or preparing graphics for social
            media and websites.
          </p>

          <p>
            Your image is processed locally in your browser. No paid API is
            required.
          </p>
        </div>
      </section>

      <SuggestedTools currentToolId="quick-flip-image" />
    </div>
  );
}

function IconButton({ children, disabled, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-10 h-10 rounded-xl border inline-flex items-center justify-center ${
        disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-[#f8f4ff]"
      }`}
    >
      {children}
    </button>
  );
}

function drawFlippedImage({
  canvas,
  imageData,
  flipX,
  flipY,
  rotation,
  outputFormat,
  includeEditorGuides,
}) {
  const outputDimensions = getOutputDimensions({
    width: imageData.width,
    height: imageData.height,
    rotation,
  });

  canvas.width = outputDimensions.width;
  canvas.height = outputDimensions.height;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (outputFormat === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.save();

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    imageData.element,
    -imageData.width / 2,
    -imageData.height / 2,
    imageData.width,
    imageData.height
  );

  ctx.restore();

  if (includeEditorGuides) {
    drawEditorGuides(ctx, canvas.width, canvas.height);
  }
}

function drawEditorGuides(ctx, width, height) {
  ctx.save();

  ctx.strokeStyle = "rgba(155,108,227,0.55)";
  ctx.lineWidth = Math.max(1, width * 0.002);

  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(155,108,227,0.9)";
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.max(4, width * 0.006), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function getOutputDimensions({ width, height, rotation }) {
  const normalizedRotation = normalizeRotation(rotation);

  if (normalizedRotation === 90 || normalizedRotation === 270) {
    return {
      width: height,
      height: width,
    };
  }

  return {
    width,
    height,
  };
}

function RangeInput({ label, min, max, step, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-semibold mb-2 block">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full accent-[var(--primary)]"
      />
    </div>
  );
}

function InfoCard({ label, value, green = false }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-4 text-center">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p
        className={`font-bold break-all ${
          green ? "text-green-600" : "text-[var(--primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function validateImageFile(file) {
  if (!file) return "Please upload an image file.";

  if (!file.type.startsWith("image/")) {
    return "Please upload a valid image file.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Image must be under ${MAX_FILE_SIZE_MB} MB.`;
  }

  return "";
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function getDefaultOutputFormat(fileType) {
  if (fileType === "image/jpeg") return "image/jpeg";
  if (fileType === "image/webp") return "image/webp";
  return "image/png";
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not export image."));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

async function ensureMinimumProcessingTime({ startTime, minimumMs, setProgress }) {
  while (performance.now() - startTime < minimumMs) {
    const elapsed = performance.now() - startTime;
    const nextProgress = Math.min(
      96,
      72 + Math.round((elapsed / minimumMs) * 24)
    );

    setProgress(nextProgress);
    await wait(180);
  }
}

function normalizeRotation(rotation) {
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function getFileBaseName(fileName) {
  return String(fileName || "image").replace(/\.[^/.]+$/, "");
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

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}