import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Maximize2,
  Loader2,
  Image as ImageIcon,
  SlidersHorizontal,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCcw,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Trash2,
  Crop,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Image Resizer",
  path: "/image-resizer",
  category: "Design Tools",
  description:
    "Upload and resize images with custom dimensions, smooth zoom, drag positioning, transform guides, and social media presets.",
  metaTitle: "Image Resizer Tool - Resize Images Easily | Next Online Tools",
  metaDescription:
    "Resize images online with custom width and height, smooth zoom, drag positioning, transform guides, background options, and quick presets for Facebook, Instagram, YouTube, and more.",
};

const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
];

const MIN_DIMENSION = 20;
const MAX_DIMENSION = 8000;
const MIN_SCALE = 0.02;
const MAX_SCALE = 8;

const PRESETS = [
  {
    group: "Instagram",
    items: [
      { label: "Square Post", width: 1080, height: 1080 },
      { label: "Portrait Post", width: 1080, height: 1350 },
      { label: "Story / Reel", width: 1080, height: 1920 },
    ],
  },
  {
    group: "Facebook",
    items: [
      { label: "Post", width: 1200, height: 630 },
      { label: "Cover", width: 1640, height: 624 },
      { label: "Square", width: 1080, height: 1080 },
    ],
  },
  {
    group: "YouTube",
    items: [
      { label: "Thumbnail", width: 1280, height: 720 },
      { label: "Channel Art", width: 2560, height: 1440 },
    ],
  },
  {
    group: "Common",
    items: [
      { label: "A4 Portrait", width: 1240, height: 1754 },
      { label: "Wallpaper", width: 1920, height: 1080 },
      { label: "Profile", width: 800, height: 800 },
    ],
  },
];

const OUTPUT_FORMATS = [
  { value: "image/png", label: "PNG", extension: "png" },
  { value: "image/jpeg", label: "JPG", extension: "jpg" },
  { value: "image/webp", label: "WEBP", extension: "webp" },
];

export default function ImageResizer() {
  const fileInputRef = useRef(null);
  const artboardRef = useRef(null);
  const imageUrlRef = useRef("");
  const dragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  const [imageData, setImageData] = useState(null);
  const [dimensions, setDimensions] = useState({
    width: 1080,
    height: 1080,
  });

  const [transform, setTransform] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
  });

  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [outputFormat, setOutputFormat] = useState("image/png");
  const [quality, setQuality] = useState(0.92);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  const [showGuides, setShowGuides] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const hasImage = Boolean(imageData?.element);

  const aspectRatio = useMemo(() => {
    if (!dimensions.width || !dimensions.height) return 1;
    return dimensions.width / dimensions.height;
  }, [dimensions]);

  const imageBoxStyle = useMemo(() => {
    if (!imageData) return null;

    const imageWidth = imageData.width * transform.scale;
    const imageHeight = imageData.height * transform.scale;

    const left =
      ((dimensions.width / 2 + transform.offsetX - imageWidth / 2) /
        dimensions.width) *
      100;

    const top =
      ((dimensions.height / 2 + transform.offsetY - imageHeight / 2) /
        dimensions.height) *
      100;

    const width = (imageWidth / dimensions.width) * 100;
    const height = (imageHeight / dimensions.height) * 100;

    return {
      left: `${left}%`,
      top: `${top}%`,
      width: `${width}%`,
      height: `${height}%`,
      transform: `rotate(${transform.rotation}deg)`,
      transformOrigin: "center center",
      transition: isDraggingImage
        ? "none"
        : "left 140ms ease, top 140ms ease, width 140ms ease, height 140ms ease, transform 140ms ease",
    };
  }, [imageData, transform, dimensions, isDraggingImage]);

  const selectedOutputFormat = useMemo(() => {
    return (
      OUTPUT_FORMATS.find((format) => format.value === outputFormat) ||
      OUTPUT_FORMATS[0]
    );
  }, [outputFormat]);

  const artboardBackgroundStyle = useMemo(() => {
    if (backgroundColor !== "transparent") {
      return {
        backgroundColor,
      };
    }

    return {
      backgroundColor: "#ffffff",
      backgroundImage:
        "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
      backgroundSize: "20px 20px",
      backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
    };
  }, [backgroundColor]);

  const previewArtboardStyle = useMemo(() => {
    const isLandscape = dimensions.width >= dimensions.height;

    return {
      width: isLandscape ? "100%" : "min(100%, 430px)",
      maxWidth: "760px",
      aspectRatio: `${dimensions.width} / ${dimensions.height}`,
      ...artboardBackgroundStyle,
    };
  }, [dimensions, artboardBackgroundStyle]);

  const zoomPercent = Math.round(transform.scale * 100);

  const originalSizeText = imageData
    ? `${imageData.width} × ${imageData.height}px`
    : "-";

  const outputSizeText = `${dimensions.width} × ${dimensions.height}px`;

  const outputBackgroundNote =
    backgroundColor === "transparent"
      ? outputFormat === "image/jpeg"
        ? "JPG does not support transparency. White background will be used."
        : "Transparent background enabled."
      : "Solid background enabled.";

  const handleImageFile = useCallback(async (file) => {
    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateImageFile(file);

    if (validationError) {
      setErrorMessage(validationError);
      resetFileInput();
      return;
    }

    setIsProcessing(true);

    try {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(file);
      imageUrlRef.current = objectUrl;

      const loadedImage = await loadImage(objectUrl);

      const nextImageData = {
        element: loadedImage,
        url: objectUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        width: loadedImage.naturalWidth || loadedImage.width,
        height: loadedImage.naturalHeight || loadedImage.height,
      };

      setImageData(nextImageData);
      setDimensions({
        width: nextImageData.width,
        height: nextImageData.height,
      });

      setTransform({
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
      });

      setOutputFormat(getDefaultOutputFormat(file.type));
      setBackgroundColor(file.type === "image/png" ? "transparent" : "#ffffff");
      setSuccessMessage("Image loaded successfully. Use the artboard to drag, zoom, and position it.");
    } catch {
      setErrorMessage("Failed to load image. Please try another image.");

      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = "";
      }

      setImageData(null);
    } finally {
      setIsProcessing(false);
      resetFileInput();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, []);

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function getArtboardPoint(event) {
    const artboard = artboardRef.current;

    if (!artboard) return null;

    const rect = artboard.getBoundingClientRect();

    if (!rect.width || !rect.height) return null;

    return {
      x: ((event.clientX - rect.left) / rect.width) * dimensions.width,
      y: ((event.clientY - rect.top) / rect.height) * dimensions.height,
    };
  }

  function handleArtboardPointerDown(event) {
    if (!hasImage) return;

    const point = getArtboardPoint(event);

    if (!point) return;

    event.preventDefault();

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y,
      startOffsetX: transform.offsetX,
      startOffsetY: transform.offsetY,
    };

    setIsDraggingImage(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleArtboardPointerMove(event) {
    if (!dragRef.current.active || !hasImage) return;

    const point = getArtboardPoint(event);

    if (!point) return;

    event.preventDefault();

    const deltaX = point.x - dragRef.current.startX;
    const deltaY = point.y - dragRef.current.startY;

    setTransform((current) => ({
      ...current,
      offsetX: dragRef.current.startOffsetX + deltaX,
      offsetY: dragRef.current.startOffsetY + deltaY,
    }));
  }

  function handleArtboardPointerUp(event) {
    if (!dragRef.current.active) return;

    dragRef.current.active = false;
    setIsDraggingImage(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  function handleWheelZoom(event) {
    if (!hasImage) return;

    event.preventDefault();

    const point = getArtboardPoint(event);
    const factor = Math.exp(-event.deltaY * 0.0012);
    const nextScale = clampNumber(transform.scale * factor, MIN_SCALE, MAX_SCALE);

    applyScale(nextScale, point);
  }

  function applyScale(nextScale, anchorPoint = null) {
    setTransform((current) => {
      const safeScale = clampNumber(nextScale, MIN_SCALE, MAX_SCALE);

      if (!anchorPoint || !imageData) {
        return {
          ...current,
          scale: safeScale,
        };
      }

      const oldCenterX = dimensions.width / 2 + current.offsetX;
      const oldCenterY = dimensions.height / 2 + current.offsetY;

      const localX = (anchorPoint.x - oldCenterX) / current.scale;
      const localY = (anchorPoint.y - oldCenterY) / current.scale;

      const newCenterX = anchorPoint.x - localX * safeScale;
      const newCenterY = anchorPoint.y - localY * safeScale;

      return {
        ...current,
        scale: safeScale,
        offsetX: newCenterX - dimensions.width / 2,
        offsetY: newCenterY - dimensions.height / 2,
      };
    });
  }

  function updateDimension(type, value) {
    const nextValue = clampNumber(Number(value), MIN_DIMENSION, MAX_DIMENSION);

    setDimensions((current) => {
      const currentRatio =
        current.width && current.height ? current.width / current.height : 1;

      if (!lockAspectRatio) {
        return {
          ...current,
          [type]: nextValue,
        };
      }

      if (type === "width") {
        return {
          width: nextValue,
          height: Math.max(MIN_DIMENSION, Math.round(nextValue / currentRatio)),
        };
      }

      return {
        width: Math.max(MIN_DIMENSION, Math.round(nextValue * currentRatio)),
        height: nextValue,
      };
    });
  }

  function setPreset(width, height) {
    setDimensions({ width, height });

    if (imageData) {
      const nextScale = getFitScale(imageData, { width, height });

      setTransform({
        scale: nextScale,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
      });
    }
  }

  function fitImageToArtboard() {
    if (!imageData) return;

    setTransform((current) => ({
      ...current,
      scale: getFitScale(imageData, dimensions),
      offsetX: 0,
      offsetY: 0,
    }));
  }

  function fillArtboard() {
    if (!imageData) return;

    setTransform((current) => ({
      ...current,
      scale: getFillScale(imageData, dimensions),
      offsetX: 0,
      offsetY: 0,
    }));
  }

  function centerImage() {
    setTransform((current) => ({
      ...current,
      offsetX: 0,
      offsetY: 0,
    }));
  }

  function resetTransform() {
    if (!imageData) return;

    setTransform({
      scale: getFitScale(imageData, dimensions),
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    });
  }

  function resetToOriginalSize() {
    if (!imageData) return;

    setDimensions({
      width: imageData.width,
      height: imageData.height,
    });

    setTransform({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    });
  }

  function rotateImage() {
    setTransform((current) => ({
      ...current,
      rotation: normalizeRotation(current.rotation + 90),
    }));
  }

  async function downloadImage() {
    if (!imageData?.element) {
      setErrorMessage("Upload and resize an image first.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas is not supported.");
      }

      if (backgroundColor !== "transparent" || outputFormat === "image/jpeg") {
        ctx.fillStyle =
          backgroundColor === "transparent" ? "#ffffff" : backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      const imageWidth = imageData.width * transform.scale;
      const imageHeight = imageData.height * transform.scale;

      ctx.save();
      ctx.translate(
        dimensions.width / 2 + transform.offsetX,
        dimensions.height / 2 + transform.offsetY
      );
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        imageData.element,
        -imageWidth / 2,
        -imageHeight / 2,
        imageWidth,
        imageHeight
      );
      ctx.restore();

      const blob = await canvasToBlob(canvas, outputFormat, quality);
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `resized-${getFileBaseName(
        imageData.name
      )}-${dimensions.width}x${dimensions.height}.${selectedOutputFormat.extension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      setSuccessMessage("Resized image downloaded successfully.");
    } catch {
      setErrorMessage("Could not export this image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  function resetTool() {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = "";
    }

    setImageData(null);
    setDimensions({
      width: 1080,
      height: 1080,
    });
    setTransform({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    });
    setBackgroundColor("#ffffff");
    setOutputFormat("image/png");
    setQuality(0.92);
    setLockAspectRatio(true);
    setShowGuides(true);
    setShowSafeArea(true);
    setIsDraggingImage(false);
    setIsDraggingFile(false);
    setErrorMessage("");
    setSuccessMessage("");
    resetFileInput();
  }

  return (
    <div className="flex flex-col gap-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Maximize2 size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Image Resizer</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Resize images with a smart artboard editor. Upload an image, choose
          custom dimensions or presets, drag to reposition, zoom smoothly, use
          transform guides, and download the final image instantly.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-[0.9fr_1.35fr] gap-6">
          {/* LEFT PANEL */}
          <div className="flex flex-col gap-5">
            {/* UPLOAD */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={openFilePicker}
              className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition ${
                isDraggingFile
                  ? "border-[var(--primary)] bg-[#f4edff]"
                  : "border-[var(--border)] hover:bg-[#f8f4ff]"
              }`}
            >
              {isProcessing && !hasImage ? (
                <Loader2
                  size={36}
                  className="mx-auto mb-4 text-[var(--primary)] animate-spin"
                />
              ) : (
                <Upload
                  size={36}
                  className="mx-auto mb-4 text-[var(--primary)]"
                />
              )}

              <h2 className="text-lg font-semibold mb-2">
                Choose image or drop image here
              </h2>

              <p className="text-sm text-[var(--text-secondary)]">
                JPG, PNG, WEBP, GIF, or BMP. Max {MAX_FILE_SIZE_MB} MB.
              </p>
            </div>

            {/* FEEDBACK */}
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

            {/* FILE INFO */}
            {hasImage && (
              <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center shrink-0">
                    <ImageIcon size={22} className="text-[var(--primary)]" />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold truncate" title={imageData.name}>
                      {imageData.name}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Original: {originalSizeText} • {formatBytes(imageData.size)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* DIMENSIONS */}
            {hasImage && (
              <div className="border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Crop size={20} className="text-[var(--primary)]" />
                    <h3 className="font-semibold">Artboard Size</h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLockAspectRatio((current) => !current)}
                    className="btn-secondary inline-flex items-center justify-center gap-2 px-3 py-2 text-sm"
                  >
                    {lockAspectRatio ? <Lock size={15} /> : <Unlock size={15} />}
                    {lockAspectRatio ? "Locked" : "Free"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Width
                    </label>
                    <input
                      type="number"
                      min={MIN_DIMENSION}
                      max={MAX_DIMENSION}
                      value={dimensions.width}
                      onChange={(event) =>
                        updateDimension("width", event.target.value)
                      }
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Height
                    </label>
                    <input
                      type="number"
                      min={MIN_DIMENSION}
                      max={MAX_DIMENSION}
                      value={dimensions.height}
                      onChange={(event) =>
                        updateDimension("height", event.target.value)
                      }
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={resetToOriginalSize}
                    className="btn-secondary inline-flex items-center justify-center gap-2"
                  >
                    <RefreshCcw size={16} />
                    Original Size
                  </button>

                  <button
                    type="button"
                    onClick={resetTransform}
                    className="btn-secondary inline-flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={16} />
                    Reset Transform
                  </button>
                </div>
              </div>
            )}

            {/* TRANSFORM */}
            {hasImage && (
              <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersHorizontal
                    size={20}
                    className="text-[var(--primary)]"
                  />
                  <h3 className="font-semibold">Transform Controls</h3>
                </div>

                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-sm font-semibold">
                    Smooth Zoom: {zoomPercent}%
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => applyScale(transform.scale * 0.9)}
                      className="btn-secondary px-3 py-2"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyScale(transform.scale * 1.1)}
                      className="btn-secondary px-3 py-2"
                    >
                      <ZoomIn size={16} />
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min={MIN_SCALE}
                  max={MAX_SCALE}
                  step="0.01"
                  value={transform.scale}
                  onChange={(event) => applyScale(Number(event.target.value))}
                  className="w-full accent-[var(--primary)]"
                />

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={fitImageToArtboard}
                    className="btn-secondary inline-flex items-center justify-center gap-2"
                  >
                    <Maximize2 size={16} />
                    Fit
                  </button>

                  <button
                    type="button"
                    onClick={fillArtboard}
                    className="btn-secondary inline-flex items-center justify-center gap-2"
                  >
                    <Crop size={16} />
                    Fill
                  </button>

                  <button
                    type="button"
                    onClick={centerImage}
                    className="btn-secondary inline-flex items-center justify-center gap-2"
                  >
                    <Move size={16} />
                    Center
                  </button>

                  <button
                    type="button"
                    onClick={rotateImage}
                    className="btn-secondary inline-flex items-center justify-center gap-2"
                  >
                    <RotateCw size={16} />
                    Rotate
                  </button>
                </div>
              </div>
            )}

            {/* PRESETS */}
            {hasImage && (
              <div className="border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} className="text-[var(--primary)]" />
                  <h3 className="font-semibold">Quick Presets</h3>
                </div>

                <div className="space-y-4">
                  {PRESETS.map((group) => (
                    <div key={group.group}>
                      <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">
                        {group.group}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {group.items.map((preset) => (
                          <button
                            key={`${group.group}-${preset.label}`}
                            type="button"
                            onClick={() =>
                              setPreset(preset.width, preset.height)
                            }
                            className="text-xs px-3 py-2 rounded-xl bg-gray-50 hover:bg-[#f4edff] hover:text-[var(--primary)] transition border border-[var(--border)]"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EXPORT */}
            {hasImage && (
              <div className="border border-[var(--border)] rounded-2xl p-5">
                <h3 className="font-semibold mb-4">Export Settings</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Format
                    </label>
                    <select
                      value={outputFormat}
                      onChange={(event) => setOutputFormat(event.target.value)}
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] bg-white"
                    >
                      {OUTPUT_FORMATS.map((format) => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Background
                    </label>
                    <select
                      value={backgroundColor}
                      onChange={(event) =>
                        setBackgroundColor(event.target.value)
                      }
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] bg-white"
                    >
                      <option value="transparent">Transparent</option>
                      <option value="#ffffff">White</option>
                      <option value="#000000">Black</option>
                    </select>
                  </div>
                </div>

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
                      onChange={(event) =>
                        setQuality(Number(event.target.value))
                      }
                      className="w-full accent-[var(--primary)]"
                    />
                  </div>
                )}

                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  {outputBackgroundNote}
                </p>
              </div>
            )}

            {/* ACTIONS */}
            {hasImage && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={downloadImage}
                  disabled={isProcessing}
                  className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                    isProcessing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Download size={18} />
                  )}
                  {isProcessing ? "Exporting..." : "Download Image"}
                </button>

                <button
                  type="button"
                  onClick={resetTool}
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Reset Tool
                </button>
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Smart Artboard</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Drag image, scroll to zoom, use transform guide to position.
                </p>
              </div>

              {hasImage && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGuides((current) => !current)}
                    className="btn-secondary px-3 py-2 text-sm"
                  >
                    Guides
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSafeArea((current) => !current)}
                    className="btn-secondary px-3 py-2 text-sm"
                  >
                    Safe Area
                  </button>
                </div>
              )}
            </div>

            <div className="border border-[var(--border)] rounded-2xl p-4 bg-gray-100 min-h-[560px] flex items-center justify-center overflow-auto">
              {!hasImage ? (
                <div className="text-center">
                  <ImageIcon
                    size={58}
                    className="mx-auto mb-4 text-gray-300"
                  />
                  <p className="text-[var(--text-secondary)]">
                    Upload an image to see the smart artboard.
                  </p>
                </div>
              ) : (
                <div
                  ref={artboardRef}
                  onPointerDown={handleArtboardPointerDown}
                  onPointerMove={handleArtboardPointerMove}
                  onPointerUp={handleArtboardPointerUp}
                  onPointerCancel={handleArtboardPointerUp}
                  onWheel={handleWheelZoom}
                  className={`relative overflow-hidden rounded-xl shadow-2xl border border-gray-300 select-none ${
                    isDraggingImage
                      ? "cursor-grabbing"
                      : "cursor-grab"
                  }`}
                  style={previewArtboardStyle}
                >
                  {/* Image Layer */}
                  {imageBoxStyle && (
                    <>
                      <img
                        src={imageData.url}
                        alt={imageData.name}
                        draggable="false"
                        className="absolute object-fill pointer-events-none select-none"
                        style={imageBoxStyle}
                      />

                      {/* Photoshop-like transform guide */}
                      <div
                        className="absolute pointer-events-none"
                        style={imageBoxStyle}
                      >
                        <div className="absolute inset-0 border-2 border-[var(--primary)] shadow-[0_0_0_1px_rgba(255,255,255,0.9)]">
                          <span className="absolute -top-2 -left-2 w-4 h-4 rounded-sm bg-white border-2 border-[var(--primary)]" />
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-sm bg-white border-2 border-[var(--primary)]" />
                          <span className="absolute -top-2 -right-2 w-4 h-4 rounded-sm bg-white border-2 border-[var(--primary)]" />

                          <span className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 rounded-sm bg-white border-2 border-[var(--primary)]" />
                          <span className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 rounded-sm bg-white border-2 border-[var(--primary)]" />

                          <span className="absolute -bottom-2 -left-2 w-4 h-4 rounded-sm bg-white border-2 border-[var(--primary)]" />
                          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-sm bg-white border-2 border-[var(--primary)]" />
                          <span className="absolute -bottom-2 -right-2 w-4 h-4 rounded-sm bg-white border-2 border-[var(--primary)]" />

                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] text-white text-[10px] font-semibold px-2 py-1 whitespace-nowrap">
                            {zoomPercent}% • {transform.rotation}°
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Artboard Guides */}
                  {showGuides && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/70" />
                      <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/70" />
                      <div className="absolute top-1/3 left-0 right-0 border-t border-white/70" />
                      <div className="absolute top-2/3 left-0 right-0 border-t border-white/70" />

                      <div className="absolute left-1/2 top-0 bottom-0 border-l border-[var(--primary)]/70" />
                      <div className="absolute top-1/2 left-0 right-0 border-t border-[var(--primary)]/70" />
                    </div>
                  )}

                  {showSafeArea && (
                    <div className="absolute inset-[8%] border border-dashed border-white/80 pointer-events-none rounded-sm">
                      <span className="absolute -top-6 left-0 text-[10px] bg-black/60 text-white rounded px-2 py-1">
                        Safe Area
                      </span>
                    </div>
                  )}

                  {/* Artboard Info */}
                  <div className="absolute left-3 bottom-3 bg-black/65 text-white rounded-xl px-3 py-2 text-xs pointer-events-none">
                    <p>{outputSizeText}</p>
                    <p>
                      X {Math.round(transform.offsetX)} / Y{" "}
                      {Math.round(transform.offsetY)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {hasImage && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <InfoCard label="Original" value={originalSizeText} />
                <InfoCard label="Output" value={outputSizeText} />
                <InfoCard label="Zoom" value={`${zoomPercent}%`} />
                <InfoCard label="Ratio" value={aspectRatio.toFixed(2)} />
              </div>
            )}

            {hasImage && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Smarter editing tips
                </h3>
                <p className="text-sm text-blue-800">
                  Drag the image inside the artboard to reposition it. Scroll
                  over the artboard for smooth zoom. Use Fit, Fill, Center, and
                  Rotate for fast adjustments. The transform guide is only for
                  editing and will not appear in the downloaded image.
                </p>
              </div>
            )}

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
      </section>

      <SuggestedTools currentToolId="image-resizer" />
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-4 text-center">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="font-bold text-[var(--primary)] break-all">{value}</p>
    </div>
  );
}

function validateImageFile(file) {
  if (!file) return "Please upload an image file.";

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Please upload a valid JPG, PNG, WEBP, GIF, or BMP image.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Image must be under ${MAX_FILE_SIZE_MB} MB.`;
  }

  return "";
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();

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

function getFitScale(imageData, dimensions) {
  if (!imageData) return 1;

  return clampNumber(
    Math.min(dimensions.width / imageData.width, dimensions.height / imageData.height),
    MIN_SCALE,
    MAX_SCALE
  );
}

function getFillScale(imageData, dimensions) {
  if (!imageData) return 1;

  return clampNumber(
    Math.max(dimensions.width / imageData.width, dimensions.height / imageData.height),
    MIN_SCALE,
    MAX_SCALE
  );
}

function normalizeRotation(rotation) {
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
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

function getFileBaseName(fileName) {
  return String(fileName || "image").replace(/\.[^/.]+$/, "");
}

function clampNumber(value, min, max) {
  const number = Number(value);

  if (Number.isNaN(number)) return min;

  return Math.min(max, Math.max(min, number));
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