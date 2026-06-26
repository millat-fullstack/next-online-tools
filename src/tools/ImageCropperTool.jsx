import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cropper } from "react-cropper";
import "../styles/cropper.min.css";
import {
  Upload,
  Download,
  RotateCcw,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Crop,
  Settings2,
  Clock3,
  Maximize2,
  Move,
  Sparkles,
  SlidersHorizontal,
  FileImage,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Image Cropper Tool",
  path: "/image-cropper-tool",
  category: "Design Tools",
  description:
    "Crop images perfectly for Facebook, Instagram, YouTube, LinkedIn, Pinterest, and custom sizes. Drag to adjust and download in JPG, PNG, or WEBP.",
  metaTitle: "Image Cropper Tool | Crop Images for Social Media Online",
  metaDescription:
    "Crop images online for Facebook posts, Instagram stories, YouTube thumbnails, LinkedIn banners, Pinterest pins, and custom sizes. Drag, zoom, preview, and download.",
};

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MIN_PROCESSING_TIME_MS = 350;

const CROP_PRESETS = [
  {
    id: "facebook-post",
    label: "Facebook Post",
    width: 1200,
    height: 630,
    ratioLabel: "1.91:1",
    group: "Facebook",
  },
  {
    id: "facebook-square",
    label: "Facebook Square Post",
    width: 1080,
    height: 1080,
    ratioLabel: "1:1",
    group: "Facebook",
  },
  {
    id: "facebook-cover",
    label: "Facebook Cover",
    width: 1640,
    height: 624,
    ratioLabel: "2.63:1",
    group: "Facebook",
  },
  {
    id: "instagram-square",
    label: "Instagram Square",
    width: 1080,
    height: 1080,
    ratioLabel: "1:1",
    group: "Instagram",
  },
  {
    id: "instagram-portrait",
    label: "Instagram Portrait Post",
    width: 1080,
    height: 1350,
    ratioLabel: "4:5",
    group: "Instagram",
  },
  {
    id: "instagram-story",
    label: "Instagram Story / Reel",
    width: 1080,
    height: 1920,
    ratioLabel: "9:16",
    group: "Instagram",
  },
  {
    id: "youtube-thumbnail",
    label: "YouTube Thumbnail",
    width: 1280,
    height: 720,
    ratioLabel: "16:9",
    group: "YouTube",
  },
  {
    id: "linkedin-post",
    label: "LinkedIn Post",
    width: 1200,
    height: 627,
    ratioLabel: "1.91:1",
    group: "LinkedIn",
  },
  {
    id: "linkedin-banner",
    label: "LinkedIn Banner",
    width: 1584,
    height: 396,
    ratioLabel: "4:1",
    group: "LinkedIn",
  },
  {
    id: "twitter-post",
    label: "X / Twitter Post",
    width: 1600,
    height: 900,
    ratioLabel: "16:9",
    group: "X / Twitter",
  },
  {
    id: "pinterest-pin",
    label: "Pinterest Pin",
    width: 1000,
    height: 1500,
    ratioLabel: "2:3",
    group: "Pinterest",
  },
  {
    id: "whatsapp-status",
    label: "WhatsApp Status",
    width: 1080,
    height: 1920,
    ratioLabel: "9:16",
    group: "Messaging",
  },
  {
    id: "profile-picture",
    label: "Profile Picture",
    width: 800,
    height: 800,
    ratioLabel: "1:1",
    group: "Common",
  },
  {
    id: "custom",
    label: "Custom Size",
    width: null,
    height: null,
    ratioLabel: "Custom",
    group: "Custom",
  },
  {
    id: "free",
    label: "Free Crop",
    width: null,
    height: null,
    ratioLabel: "Free",
    group: "Custom",
  },
];

const OUTPUT_FORMATS = [
  { value: "image/png", label: "PNG", extension: "png" },
  { value: "image/jpeg", label: "JPG", extension: "jpg" },
  { value: "image/webp", label: "WEBP", extension: "webp" },
];

export default function ImageCropperTool() {
  const fileInputRef = useRef(null);
  const cropperRef = useRef(null);
  const imageUrlRef = useRef("");
  const outputUrlRef = useRef("");

  const [image, setImage] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);

  const [presetId, setPresetId] = useState("free");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [cropperKey, setCropperKey] = useState(0);
  const [dragMode, setDragMode] = useState("crop");

  const [outputFormat, setOutputFormat] = useState("image/png");
  const [quality, setQuality] = useState(0.94);

  const [croppedImageUrl, setCroppedImageUrl] = useState("");
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [outputSize, setOutputSize] = useState(0);

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [progress, setProgress] = useState(0);
  const [processingPhase, setProcessingPhase] = useState("");
  const [processingTimeMs, setProcessingTimeMs] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedPreset = useMemo(() => {
    return CROP_PRESETS.find((preset) => preset.id === presetId) || CROP_PRESETS[0];
  }, [presetId]);

  const selectedFormat = useMemo(() => {
    return OUTPUT_FORMATS.find((format) => format.value === outputFormat) || OUTPUT_FORMATS[0];
  }, [outputFormat]);

  const customDimensions = useMemo(() => {
    const width = Math.round(Number(customWidth));
    const height = Math.round(Number(customHeight));

    if (width > 0 && height > 0) {
      return { width, height };
    }

    return null;
  }, [customHeight, customWidth]);

  const outputDimensions = useMemo(() => {
    if (presetId === "custom" && customDimensions) return customDimensions;

    if (selectedPreset.width && selectedPreset.height) {
      return {
        width: selectedPreset.width,
        height: selectedPreset.height,
      };
    }

    return null;
  }, [customDimensions, presetId, selectedPreset]);

  const aspectRatio = useMemo(() => {
    if (!outputDimensions?.width || !outputDimensions?.height) {
      return NaN;
    }

    return outputDimensions.width / outputDimensions.height;
  }, [outputDimensions]);

  const isFixedSize = Boolean(outputDimensions?.width && outputDimensions?.height);

  const outputDimensionText = isFixedSize
    ? `${outputDimensions.width} × ${outputDimensions.height}px`
    : "Original crop size";

  const handleImageFile = useCallback(async (file) => {
    setError("");
    setSuccess("");
    clearOutput();

    const validationError = validateImageFile(file);

    if (validationError) {
      setError(validationError);
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

      setImage(objectUrl);
      setImageInfo({
        name: file.name || "image",
        size: file.size,
        type: file.type,
        width: loadedImage.naturalWidth || loadedImage.width,
        height: loadedImage.naturalHeight || loadedImage.height,
      });

      setCropperKey((current) => current + 1);
      setSuccess(
        "Image loaded successfully. Choose a size, then drag and zoom to make the crop perfect."
      );
    } catch {
      setError("Failed to load this image. Please try another image.");

      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = "";
      }

      setImage(null);
      setImageInfo(null);
    } finally {
      setIsLoadingImage(false);
      resetFileInput();
    }
  }, []);

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

    setCroppedImageUrl("");
    setCroppedBlob(null);
    setOutputSize(0);
    setProgress(0);
    setProcessingPhase("");
    setProcessingTimeMs(0);
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

  function handlePresetChange(nextPresetId) {
    setPresetId(nextPresetId);
    setError("");
    setSuccess("");
    clearOutput();

    const nextPreset = CROP_PRESETS.find((preset) => preset.id === nextPresetId);

    if (nextPreset?.width && nextPreset?.height) {
      setCustomWidth("");
      setCustomHeight("");
    }

    setCropperKey((current) => current + 1);
  }

  function handleFormatChange(nextFormat) {
    setOutputFormat(nextFormat);
    clearOutput();
  }

  function handleDragModeChange(nextMode) {
    setDragMode(nextMode);

    const cropper = cropperRef.current?.cropper;

    if (cropper) {
      cropper.setDragMode(nextMode);
    }

    clearOutput();
    setSuccess(nextMode === "crop" ? "Crop mode active. Drag to select any area." : "Move mode active. Drag image to position it.");
  }

  function applyCustomSize() {
    const width = Math.round(Number(customWidth));
    const height = Math.round(Number(customHeight));
    const cropper = cropperRef.current?.cropper;

    if (!width || !height || width < 1 || height < 1) {
      setError("Please enter a valid custom width and height.");
      return;
    }

    setPresetId("custom");
    setError("");
    setSuccess(`Custom crop size set to ${width} × ${height}px.`);
    clearOutput();

    if (!cropper) return;

    const ratio = width / height;
    cropper.setAspectRatio(ratio);
    cropper.crop();

    window.setTimeout(() => {
      fitCropBoxToCurrentView(ratio);
      alignCropBox("center");
    }, 40);
  }

  function fitCropBoxToCurrentView(ratio = aspectRatio) {
    const cropper = cropperRef.current?.cropper;

    if (!cropper) return;

    const container = cropper.getContainerData();

    if (!container?.width || !container?.height) return;

    const maxWidth = container.width * 0.72;
    const maxHeight = container.height * 0.72;
    let width = maxWidth;
    let height = Number.isFinite(ratio) ? width / ratio : maxHeight;

    if (height > maxHeight) {
      height = maxHeight;
      width = Number.isFinite(ratio) ? height * ratio : maxWidth;
    }

    cropper.setCropBoxData({
      width,
      height,
      left: (container.width - width) / 2,
      top: (container.height - height) / 2,
    });
  }

  function alignCropBox(direction) {
    const cropper = cropperRef.current?.cropper;

    if (!cropper) {
      setError("Please upload an image first.");
      return;
    }

    const cropBox = cropper.getCropBoxData();
    const container = cropper.getContainerData();

    if (!cropBox || !container) return;

    const nextData = {};

    if (direction === "left") nextData.left = 0;
    if (direction === "right") nextData.left = container.width - cropBox.width;
    if (direction === "center-x" || direction === "center") {
      nextData.left = (container.width - cropBox.width) / 2;
    }

    if (direction === "top") nextData.top = 0;
    if (direction === "bottom") nextData.top = container.height - cropBox.height;
    if (direction === "center-y" || direction === "center") {
      nextData.top = (container.height - cropBox.height) / 2;
    }

    cropper.setCropBoxData(nextData);
    clearOutput();
    setSuccess("Crop selection aligned perfectly.");
  }

  function resetCropBox() {
    const cropper = cropperRef.current?.cropper;

    if (!cropper) return;

    cropper.reset();
    cropper.clear();
    cropper.crop();

    cropper.setAspectRatio(Number.isFinite(aspectRatio) ? aspectRatio : NaN);
    cropper.setDragMode(dragMode);

    clearOutput();
    setSuccess("Crop area reset. Drag and zoom again to adjust perfectly.");
  }

  function zoomCropper(value) {
    const cropper = cropperRef.current?.cropper;

    if (!cropper) return;

    cropper.zoom(value);
    clearOutput();
  }

  function rotateCropper(degree) {
    const cropper = cropperRef.current?.cropper;

    if (!cropper) return;

    cropper.rotate(degree);
    clearOutput();
  }

  async function createCrop({ downloadAfterCreate = false } = {}) {
    const cropper = cropperRef.current?.cropper;

    if (!cropper) {
      setError("Please upload an image first.");
      return;
    }

    setIsProcessing(true);
    setError("");
    setSuccess("");
    setProcessingPhase(downloadAfterCreate ? "Preparing crop for download..." : "Preparing crop preview...");
    setProgress(5);

    const startTime = performance.now();

    try {
      await wait(40);
      setProcessingPhase("Reading selected crop area...");
      setProgress(20);

      const canvasOptions = {
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      };

      if (isFixedSize) {
        canvasOptions.width = outputDimensions.width;
        canvasOptions.height = outputDimensions.height;
      }

      if (outputFormat === "image/jpeg") {
        canvasOptions.fillColor = "#ffffff";
      }

      setProcessingPhase("Creating high-quality cropped image...");
      const canvas = cropper.getCroppedCanvas(canvasOptions);

      if (!canvas) {
        throw new Error("No crop area selected.");
      }

      setProgress(35);

      setProcessingPhase("Preparing output file...");
      const blob = await canvasToBlob(canvas, outputFormat, quality);

      setProgress(75);

      await ensureMinimumProcessingTime({
        startTime,
        minimumMs: MIN_PROCESSING_TIME_MS,
        setProgress,
      });

      if (outputUrlRef.current) {
        URL.revokeObjectURL(outputUrlRef.current);
      }

      const nextOutputUrl = URL.createObjectURL(blob);
      outputUrlRef.current = nextOutputUrl;

      const actualProcessingTime = Math.max(
        1,
        Math.round(performance.now() - startTime)
      );

      setCroppedBlob(blob);
      setCroppedImageUrl(nextOutputUrl);
      setOutputSize(blob.size);
      setProcessingTimeMs(actualProcessingTime);
      setProgress(100);

      if (downloadAfterCreate) {
        setProcessingPhase("Starting download...");
        downloadBlob(blob, true);
        setSuccess(
          `Crop created and download started in ${(actualProcessingTime / 1000).toFixed(1)}s.`
        );
      } else {
        setProcessingPhase("Preview ready.");
        setSuccess(
          `Crop preview created in ${(actualProcessingTime / 1000).toFixed(1)}s.`
        );
      }
    } catch {
      setError("Could not create the crop. Please adjust the crop area and try again.");
    } finally {
      setIsProcessing(false);

      window.setTimeout(() => {
        setProgress(0);
      }, 900);
    }
  }

  function downloadBlob(blob = croppedBlob, silent = false) {
    if (!blob) {
      setError("Please create the cropped image first.");
      return;
    }

    if (!silent) {
      setSuccess("Download started.");
    }

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = `cropped-${selectedPreset.id}.${selectedFormat.extension}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 1000);
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

    setImage(null);
    setImageInfo(null);
    setPresetId("free");
    setCustomWidth("");
    setCustomHeight("");
    setCropperKey((current) => current + 1);
    setDragMode("crop");
    setOutputFormat("image/png");
    setQuality(0.94);
    setCroppedImageUrl("");
    setCroppedBlob(null);
    setOutputSize(0);
    setIsDraggingFile(false);
    setIsLoadingImage(false);
    setIsProcessing(false);
    setProgress(0);
    setProcessingPhase("");
    setProcessingTimeMs(0);
    setError("");
    setSuccess("");
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

      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Crop size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Image Cropper Tool</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Crop any part of an image smoothly. Use free crop, fixed social sizes,
          zoom, move, preview, and download the cropped image instantly.
        </p>
      </section>

      {/* TOOL */}
      <section className="card p-4 sm:p-5">
        {!image && (
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

        {/* COMPACT TOP TOOLBAR */}
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

            <div className="min-w-[240px] flex-1 sm:flex-none">
              <select
                value={presetId}
                onChange={(event) => handlePresetChange(event.target.value)}
                className="h-10 w-full border border-[var(--border)] rounded-xl px-3 bg-white outline-none focus:border-[var(--primary)] text-sm font-semibold"
                title="Choose crop size"
              >
                {CROP_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label} {preset.ratioLabel ? `(${preset.ratioLabel})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[120px]">
              <select
                value={outputFormat}
                onChange={(event) => handleFormatChange(event.target.value)}
                className="h-10 w-full border border-[var(--border)] rounded-xl px-3 bg-white outline-none focus:border-[var(--primary)] text-sm font-semibold"
                title="Output format"
              >
                {OUTPUT_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex rounded-xl border border-[var(--border)] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => handleDragModeChange("crop")}
                disabled={!image}
                className={`h-10 px-3 text-sm font-semibold ${
                  dragMode === "crop"
                    ? "bg-[var(--primary)] text-white"
                    : !image
                      ? "text-gray-400 cursor-not-allowed"
                      : "hover:bg-[#f8f4ff]"
                }`}
                title="Drag to create or adjust crop area"
              >
                Crop
              </button>

              <button
                type="button"
                onClick={() => handleDragModeChange("move")}
                disabled={!image}
                className={`h-10 px-3 text-sm font-semibold border-l border-[var(--border)] ${
                  dragMode === "move"
                    ? "bg-[var(--primary)] text-white"
                    : !image
                      ? "text-gray-400 cursor-not-allowed"
                      : "hover:bg-[#f8f4ff]"
                }`}
                title="Drag to move the image inside crop area"
              >
                Move
              </button>
            </div>

            <button
              type="button"
              onClick={() => zoomCropper(0.08)}
              disabled={!image}
              className={`w-10 h-10 rounded-xl border inline-flex items-center justify-center ${
                !image ? "opacity-40 cursor-not-allowed" : "hover:bg-[#f8f4ff]"
              }`}
              title="Zoom in"
            >
              <Maximize2 size={17} />
            </button>

            <button
              type="button"
              onClick={() => zoomCropper(-0.08)}
              disabled={!image}
              className={`w-10 h-10 rounded-xl border inline-flex items-center justify-center ${
                !image ? "opacity-40 cursor-not-allowed" : "hover:bg-[#f8f4ff]"
              }`}
              title="Zoom out"
            >
              <Move size={17} />
            </button>

            <button
              type="button"
              onClick={() => rotateCropper(-90)}
              disabled={!image}
              className={`w-10 h-10 rounded-xl border inline-flex items-center justify-center ${
                !image ? "opacity-40 cursor-not-allowed" : "hover:bg-[#f8f4ff]"
              }`}
              title="Rotate left"
            >
              <RotateCcw size={17} />
            </button>

            <button
              type="button"
              onClick={resetCropBox}
              disabled={!image}
              className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm ${
                !image ? "opacity-40 cursor-not-allowed" : "hover:bg-[#f8f4ff]"
              }`}
            >
              <RotateCcw size={16} />
              Reset Crop
            </button>

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => createCrop({ downloadAfterCreate: false })}
              disabled={!image || isProcessing}
              className={`btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm ${
                !image || isProcessing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isProcessing ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Sparkles size={17} />
              )}
              {isProcessing ? "Processing..." : "Crop Preview"}
            </button>

            <button
              type="button"
              onClick={() => createCrop({ downloadAfterCreate: true })}
              disabled={!image || isProcessing}
              className={`btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm ${
                !image || isProcessing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Download size={17} />
              Download Crop
            </button>
          </div>
        </div>

        {/* FEEDBACK */}
        {(error || success || isProcessing) && (
          <div className="grid md:grid-cols-2 gap-3 mb-4">
            {error && (
              <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            {isProcessing && (
              <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-xl p-4 md:col-span-2">
                <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                  <span>{processingPhase || "Creating final crop..."}</span>
                  <span>{progress}%</span>
                </div>

                <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  {processingPhase || "Creating your crop with high-quality image smoothing."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* MAIN EDITOR */}
        {image ? (
          <div className="grid xl:grid-cols-[1.35fr_0.75fr] gap-5">
            <div className="border border-[var(--border)] rounded-2xl bg-[#eef0f5] p-4 sm:p-5 min-h-[620px]">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Smart Crop Editor</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Drag the image or crop box. Use mouse wheel or zoom buttons
                    to adjust the crop perfectly.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => createCrop({ downloadAfterCreate: true })}
                  disabled={!image || isProcessing}
                  className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                    !image || isProcessing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Download size={16} />
                  Create & Download
                </button>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white p-3 mb-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold">Crop Alignment</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Place the crop selection accurately, or set an exact custom size.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-xl border border-[var(--border)] bg-white overflow-hidden">
                      <button type="button" onClick={() => alignCropBox("left")} disabled={!image} className="align-btn" title="Align left">←</button>
                      <button type="button" onClick={() => alignCropBox("center-x")} disabled={!image} className="align-btn" title="Center horizontally">↔</button>
                      <button type="button" onClick={() => alignCropBox("right")} disabled={!image} className="align-btn" title="Align right">→</button>
                      <button type="button" onClick={() => alignCropBox("top")} disabled={!image} className="align-btn" title="Align top">↑</button>
                      <button type="button" onClick={() => alignCropBox("center-y")} disabled={!image} className="align-btn" title="Center vertically">↕</button>
                      <button type="button" onClick={() => alignCropBox("bottom")} disabled={!image} className="align-btn" title="Align bottom">↓</button>
                      <button type="button" onClick={() => alignCropBox("center")} disabled={!image} className="align-btn font-bold" title="Center crop">◎</button>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-2 py-2">
                      <input
                        type="number"
                        min="1"
                        value={customWidth}
                        onChange={(event) => setCustomWidth(event.target.value)}
                        placeholder="Width"
                        className="custom-size-input"
                        aria-label="Custom crop width"
                      />
                      <span className="text-xs font-bold text-[var(--text-secondary)]">×</span>
                      <input
                        type="number"
                        min="1"
                        value={customHeight}
                        onChange={(event) => setCustomHeight(event.target.value)}
                        placeholder="Height"
                        className="custom-size-input"
                        aria-label="Custom crop height"
                      />
                      <button
                        type="button"
                        onClick={applyCustomSize}
                        disabled={!image}
                        className="h-9 rounded-lg bg-[var(--primary)] px-3 text-xs font-bold text-white disabled:opacity-40"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-white">
                <Cropper
                  key={cropperKey}
                  ref={cropperRef}
                  src={image}
                  style={{
                    height: "min(68vh, 620px)",
                    minHeight: 430,
                    width: "100%",
                  }}
                  aspectRatio={aspectRatio}
                  initialAspectRatio={aspectRatio}
                  guides={true}
                  center={true}
                  highlight={true}
                  viewMode={0}
                  autoCrop={true}
                  autoCropArea={0.82}
                  dragMode={dragMode}
                  movable={true}
                  zoomable={true}
                  scalable={true}
                  rotatable={true}
                  cropBoxMovable={true}
                  cropBoxResizable={true}
                  toggleDragModeOnDblclick={true}
                  background={false}
                  responsive={true}
                  checkOrientation={false}
                  ready={() => {
                    const cropper = cropperRef.current?.cropper;

                    if (cropper) {
                      cropper.setAspectRatio(Number.isFinite(aspectRatio) ? aspectRatio : NaN);
                      cropper.setDragMode(dragMode);

                      if (Number.isFinite(aspectRatio)) {
                        window.setTimeout(() => fitCropBoxToCurrentView(aspectRatio), 60);
                      }
                    }
                  }}
                  cropstart={() => clearOutput()}
                  cropmove={() => clearOutput()}
                  cropend={() => clearOutput()}
                  zoom={() => clearOutput()}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-3 mt-4">
                <div className="bg-white border border-[var(--border)] rounded-xl p-3">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">
                    How to crop
                  </p>
                  <p className="text-sm font-semibold">
                    Free crop → drag area → download
                  </p>
                </div>

                <div className="bg-white border border-[var(--border)] rounded-xl p-3">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">
                    Drag mode
                  </p>
                  <p className="text-sm font-semibold">
                    Use Crop or Move mode as needed
                  </p>
                </div>

                <div className="bg-white border border-[var(--border)] rounded-xl p-3">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">
                    Output quality
                  </p>
                  <p className="text-sm font-semibold">
                    Fast export with high smoothing
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="border border-[var(--border)] rounded-2xl bg-white p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileImage size={20} className="text-[var(--primary)]" />
                  <h3 className="font-semibold">Image Info</h3>
                </div>

                {imageInfo && (
                  <div className="space-y-3">
                    <InfoRow label="File" value={imageInfo.name} />
                    <InfoRow
                      label="Original"
                      value={`${imageInfo.width} × ${imageInfo.height}px`}
                    />
                    <InfoRow label="Size" value={formatBytes(imageInfo.size)} />
                    <InfoRow label="Output" value={outputDimensionText} />
                  </div>
                )}
              </div>

              <div className="border border-[var(--border)] rounded-2xl bg-white p-5">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersHorizontal size={20} className="text-[var(--primary)]" />
                  <h3 className="font-semibold">Export Settings</h3>
                </div>

                <label className="text-sm font-semibold mb-2 block">
                  Format
                </label>
                <select
                  value={outputFormat}
                  onChange={(event) => handleFormatChange(event.target.value)}
                  className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                >
                  {OUTPUT_FORMATS.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>

                {(outputFormat === "image/jpeg" ||
                  outputFormat === "image/webp") && (
                  <div className="mt-4">
                    <label className="text-sm font-semibold mb-2 block">
                      Quality: {Math.round(quality * 100)}%
                    </label>

                    <input
                      type="range"
                      min="0.6"
                      max="1"
                      step="0.01"
                      value={quality}
                      onChange={(event) => {
                        setQuality(Number(event.target.value));
                        clearOutput();
                      }}
                      className="w-full accent-[var(--primary)]"
                    />
                  </div>
                )}
              </div>

              <div className="border border-[var(--border)] rounded-2xl bg-white p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon size={20} className="text-[var(--primary)]" />
                  <h3 className="font-semibold">Cropped Preview</h3>
                </div>

                <div className="w-full h-[280px] flex justify-center items-center rounded-xl bg-[#fafafa] border border-[var(--border)] overflow-hidden">
                  {croppedImageUrl ? (
                    <img
                      src={croppedImageUrl}
                      alt="Cropped Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <p className="text-center text-sm text-[var(--text-secondary)] px-4">
                      No final crop yet. Adjust the crop and click Crop Preview or Download Crop.
                    </p>
                  )}
                </div>

                {croppedBlob && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <InfoCard
                      label="Final Time"
                      value={`${(processingTimeMs / 1000).toFixed(1)}s`}
                      green
                    />
                    <InfoCard
                      label="Output Size"
                      value={formatBytes(outputSize)}
                      green
                    />
                  </div>
                )}

                {croppedBlob && (
                  <button
                    type="button"
                    onClick={() => downloadBlob()}
                    className="btn-primary w-full mt-4 inline-flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Download {selectedFormat.label}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={resetTool}
                className="btn-secondary w-full inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Reset Everything
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-[var(--border)] rounded-2xl bg-[#eef0f5] min-h-[480px] flex items-center justify-center">
            <div className="text-center">
              <ImageIcon size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-[var(--text-secondary)]">
                Upload an image to start smart cropping.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-4">Crop Images for Social Media</h2>

        <div className="text-[var(--text-secondary)] leading-7 space-y-3">
          <p>
            Use this online image cropper to prepare perfect image sizes for
            Facebook posts, Instagram stories, Instagram posts, YouTube
            thumbnails, LinkedIn banners, Pinterest pins, WhatsApp status, and
            profile photos.
          </p>

          <p>
            Choose free crop to crop any part, or select a social media size preset.
            Drag the crop box, move or zoom the image, then download the final cropped
            image in PNG, JPG, or WEBP. The tool runs directly in your browser.
          </p>
        </div>
      </section>

      <style>{`
        .align-btn {
          height: 38px;
          min-width: 38px;
          padding: 0 0.6rem;
          border-right: 1px solid var(--border);
          font-size: 1rem;
          font-weight: 800;
          color: #374151;
          transition: 160ms ease;
        }
        .align-btn:last-child {
          border-right: 0;
        }
        .align-btn:hover:not(:disabled) {
          background: #f8f4ff;
          color: var(--primary);
        }
        .align-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .custom-size-input {
          height: 36px;
          width: 86px;
          border: 1px solid var(--border);
          border-radius: 0.6rem;
          padding: 0 0.65rem;
          font-size: 0.8rem;
          font-weight: 700;
          outline: none;
        }
        .custom-size-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(155, 108, 227, 0.14);
        }
      `}</style>

      <SuggestedTools currentToolId="image-cropper-tool" />
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

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm border-b border-[var(--border)] last:border-b-0 pb-2 last:pb-0">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-semibold text-right break-all">{value}</span>
    </div>
  );
}

function validateImageFile(file) {
  if (!file) return "Please upload an image file.";

  if (!file.type.startsWith("image/")) {
    return "Only image files are allowed.";
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

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create cropped image."));
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
      94,
      55 + Math.round((elapsed / minimumMs) * 39)
    );

    setProgress(nextProgress);
    await wait(180);
  }
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