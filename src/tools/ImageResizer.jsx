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
  Clock3,
  Eye,
  ChevronDown,
  Info,
  FileImage,
  PanelTopOpen,
  Settings2,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Image Resizer",
  path: "/image-resizer",
  category: "Design Tools",
  description:
    "Resize images online with a clean smart artboard, presets, drag positioning, zoom, format options, and instant download.",
  metaTitle: "Image Resizer Tool - Resize Images Easily | Next Online Tools",
  metaDescription:
    "Resize images online for free. Upload an image, choose dimensions or presets, drag and fit it on the artboard, then download PNG, JPG, or WEBP.",
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
    group: "Most Used",
    items: [
      { label: "Original Size", width: "original", height: "original" },
      { label: "Square 1080", width: 1080, height: 1080 },
      { label: "HD 1280 × 720", width: 1280, height: 720 },
      { label: "Full HD 1920 × 1080", width: 1920, height: 1080 },
    ],
  },
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
    group: "Documents",
    items: [
      { label: "A4 Portrait", width: 1240, height: 1754 },
      { label: "Profile Photo", width: 800, height: 800 },
      { label: "Product Image", width: 1000, height: 1000 },
    ],
  },
];

const OUTPUT_FORMATS = [
  { value: "image/png", label: "PNG", extension: "png" },
  { value: "image/jpeg", label: "JPG", extension: "jpg" },
  { value: "image/webp", label: "WEBP", extension: "webp" },
];

const QUICK_ACTIONS = [
  { id: "fit", label: "Fit", icon: Maximize2 },
  { id: "fill", label: "Fill", icon: Crop },
  { id: "center", label: "Center", icon: Move },
  { id: "rotate", label: "Rotate", icon: RotateCw },
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
  const [customBackground, setCustomBackground] = useState("#ffffff");
  const [outputFormat, setOutputFormat] = useState("image/png");
  const [quality, setQuality] = useState(0.92);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  const [showGuides, setShowGuides] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [showImageFrame, setShowImageFrame] = useState(true);

  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [exportProgress, setExportProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [lastOutputSize, setLastOutputSize] = useState(0);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [openSections, setOpenSections] = useState({
    resize: true,
    transform: false,
    export: false,
    guides: false,
    details: false,
  });

  const hasImage = Boolean(imageData?.element);

  const selectedOutputFormat = useMemo(() => {
    return (
      OUTPUT_FORMATS.find((format) => format.value === outputFormat) ||
      OUTPUT_FORMATS[0]
    );
  }, [outputFormat]);

  const imageAspectRatio = useMemo(() => {
    if (!imageData?.width || !imageData?.height) return 1;
    return imageData.width / imageData.height;
  }, [imageData]);

  const outputAspectRatio = useMemo(() => {
    if (!dimensions.width || !dimensions.height) return 1;
    return dimensions.width / dimensions.height;
  }, [dimensions]);

  const zoomPercent = Math.round(transform.scale * 100);

  const originalSizeText = imageData
    ? `${imageData.width} × ${imageData.height}px`
    : "-";

  const outputSizeText = `${dimensions.width} × ${dimensions.height}px`;

  const estimatedProcessingTimeMs = useMemo(() => {
    const megapixels = (dimensions.width * dimensions.height) / 1000000;
    const scaleCost = Math.max(1, transform.scale);
    const estimated = 650 + megapixels * 260 + scaleCost * 120;

    return Math.min(9000, Math.max(900, Math.round(estimated)));
  }, [dimensions, transform.scale]);

  const outputBackgroundNote =
    backgroundColor === "transparent"
      ? outputFormat === "image/jpeg"
        ? "JPG does not support transparency, so white will be used."
        : "Transparent background will be preserved."
      : "Solid background will be used.";

  const artboardBackgroundStyle = useMemo(() => {
    const finalBackground =
      backgroundColor === "custom" ? customBackground : backgroundColor;

    if (finalBackground !== "transparent") {
      return {
        backgroundColor: finalBackground,
      };
    }

    return {
      backgroundColor: "#ffffff",
      backgroundImage:
        "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
      backgroundSize: "20px 20px",
      backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
    };
  }, [backgroundColor, customBackground]);

  const previewArtboardStyle = useMemo(() => {
    const isLandscape = dimensions.width >= dimensions.height;

    return {
      width: isLandscape ? "min(100%, 900px)" : "min(100%, 520px)",
      aspectRatio: `${dimensions.width} / ${dimensions.height}`,
      ...artboardBackgroundStyle,
    };
  }, [dimensions, artboardBackgroundStyle]);

  const imageBoxStyle = useMemo(() => {
    if (!imageData) return null;

    const imageWidth = imageData.width * transform.scale;
    const imageHeight = imageData.height * transform.scale;

    const centerX = dimensions.width / 2 + transform.offsetX;
    const centerY = dimensions.height / 2 + transform.offsetY;

    return {
      left: `${(centerX / dimensions.width) * 100}%`,
      top: `${(centerY / dimensions.height) * 100}%`,
      width: `${(imageWidth / dimensions.width) * 100}%`,
      height: `${(imageHeight / dimensions.height) * 100}%`,
      transform: `translate(-50%, -50%) rotate(${transform.rotation}deg)`,
      transformOrigin: "center center",
      transition: isDraggingImage
        ? "none"
        : "left 120ms ease, top 120ms ease, width 160ms ease, height 160ms ease, transform 160ms ease",
    };
  }, [imageData, transform, dimensions, isDraggingImage]);

  const handleImageFile = useCallback(async (file) => {
    setErrorMessage("");
    setSuccessMessage("");
    clearExportStats();

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
      setBackgroundColor(file.type === "image/png" || file.type === "image/webp" ? "transparent" : "#ffffff");
      setOpenSections({
        resize: true,
        transform: false,
        export: false,
        guides: false,
        details: false,
      });

      setSuccessMessage("Image loaded. Resize, drag to position, then download.");
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

  useEffect(() => {
    function isEditableTarget(target) {
      const tagName = target?.tagName?.toLowerCase();

      return (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      );
    }

    function handleKeyDown(event) {
      if (!hasImage || isEditableTarget(event.target)) return;

      const step = event.shiftKey ? 10 : 1;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveImageBy(-step, 0);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveImageBy(step, 0);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveImageBy(0, -step);
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveImageBy(0, step);
      }

      if ((event.ctrlKey || event.metaKey) && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        applyScale(transform.scale * 1.08);
      }

      if ((event.ctrlKey || event.metaKey) && (event.key === "-" || event.key === "_")) {
        event.preventDefault();
        applyScale(transform.scale * 0.92);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasImage, transform.scale]);

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearExportStats() {
    setProcessingTimeMs(0);
    setLastOutputSize(0);
    setExportProgress(0);
  }

  function toggleSection(section) {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
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

    clearExportStats();
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
    const factor = Math.exp(-event.deltaY * 0.0014);
    const nextScale = clampNumber(transform.scale * factor, MIN_SCALE, MAX_SCALE);

    applyScale(nextScale, point);
  }

  function applyScale(nextScale, anchorPoint = null) {
    clearExportStats();

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

  function moveImageBy(dx, dy) {
    clearExportStats();

    setTransform((current) => ({
      ...current,
      offsetX: current.offsetX + dx,
      offsetY: current.offsetY + dy,
    }));
  }

  function updateDimension(type, value) {
    clearExportStats();

    const nextValue = clampNumber(Number(value), MIN_DIMENSION, MAX_DIMENSION);

    setDimensions((current) => {
      if (!lockAspectRatio || !imageData) {
        return {
          ...current,
          [type]: nextValue,
        };
      }

      if (type === "width") {
        return {
          width: nextValue,
          height: Math.max(MIN_DIMENSION, Math.round(nextValue / imageAspectRatio)),
        };
      }

      return {
        width: Math.max(MIN_DIMENSION, Math.round(nextValue * imageAspectRatio)),
        height: nextValue,
      };
    });
  }

  function applyPreset(preset) {
    if (!preset) return;

    clearExportStats();

    if (preset.width === "original" && imageData) {
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
      return;
    }

    setDimensions({ width: preset.width, height: preset.height });

    if (imageData) {
      const nextScale = getFitScale(imageData, {
        width: preset.width,
        height: preset.height,
      });

      setTransform({
        scale: nextScale,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
      });
    }
  }

  function quickScaleOutput(multiplier) {
    if (!imageData) return;

    const width = clampNumber(Math.round(imageData.width * multiplier), MIN_DIMENSION, MAX_DIMENSION);
    const height = clampNumber(Math.round(imageData.height * multiplier), MIN_DIMENSION, MAX_DIMENSION);

    applyPreset({ width, height });
  }

  function fitImageToArtboard() {
    if (!imageData) return;

    clearExportStats();

    setTransform((current) => ({
      ...current,
      scale: getFitScale(imageData, dimensions),
      offsetX: 0,
      offsetY: 0,
    }));
  }

  function fillArtboard() {
    if (!imageData) return;

    clearExportStats();

    setTransform((current) => ({
      ...current,
      scale: getFillScale(imageData, dimensions),
      offsetX: 0,
      offsetY: 0,
    }));
  }

  function centerImage() {
    clearExportStats();

    setTransform((current) => ({
      ...current,
      offsetX: 0,
      offsetY: 0,
    }));
  }

  function resetTransform() {
    if (!imageData) return;

    clearExportStats();

    setTransform({
      scale: getFitScale(imageData, dimensions),
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    });
  }

  function resetToOriginalSize() {
    if (!imageData) return;

    clearExportStats();

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
    clearExportStats();

    setTransform((current) => ({
      ...current,
      rotation: normalizeRotation(current.rotation + 90),
    }));
  }

  function handleQuickAction(actionId) {
    if (actionId === "fit") fitImageToArtboard();
    if (actionId === "fill") fillArtboard();
    if (actionId === "center") centerImage();
    if (actionId === "rotate") rotateImage();
  }

  async function downloadImage() {
    if (!imageData?.element) {
      setErrorMessage("Upload and resize an image first.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");
    setExportProgress(5);

    const startTime = performance.now();

    try {
      await wait(120);
      setExportProgress(25);

      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas is not supported.");
      }

      const finalBackground =
        backgroundColor === "custom" ? customBackground : backgroundColor;

      if (finalBackground !== "transparent" || outputFormat === "image/jpeg") {
        ctx.fillStyle =
          finalBackground === "transparent" ? "#ffffff" : finalBackground;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      setExportProgress(45);

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

      setExportProgress(72);

      const blob = await canvasToBlob(canvas, outputFormat, quality);
      setLastOutputSize(blob.size);

      setExportProgress(90);

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

      const actualProcessingTime = Math.max(
        1,
        Math.round(performance.now() - startTime)
      );

      setProcessingTimeMs(actualProcessingTime);
      setExportProgress(100);
      setSuccessMessage(
        `Image created in ${(actualProcessingTime / 1000).toFixed(1)}s.`
      );
    } catch {
      setErrorMessage("Could not export this image. Please try again.");
    } finally {
      setIsProcessing(false);

      window.setTimeout(() => {
        setExportProgress(0);
      }, 800);
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
    setCustomBackground("#ffffff");
    setOutputFormat("image/png");
    setQuality(0.92);
    setLockAspectRatio(true);
    setShowGuides(true);
    setShowSafeArea(false);
    setShowImageFrame(true);
    setIsDraggingImage(false);
    setIsDraggingFile(false);
    setIsProcessing(false);
    setExportProgress(0);
    setProcessingTimeMs(0);
    setLastOutputSize(0);
    setErrorMessage("");
    setSuccessMessage("");
    setOpenSections({
      resize: true,
      transform: false,
      export: false,
      guides: false,
      details: false,
    });
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

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Maximize2 size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Image Resizer</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload an image, choose a size, drag or zoom it on the artboard, and download a clean resized image.
          Advanced options are hidden inside simple dropdown panels.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        {!hasImage ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFilePicker}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition min-h-[420px] flex flex-col items-center justify-center ${
              isDraggingFile
                ? "border-[var(--primary)] bg-[#f4edff]"
                : "border-[var(--border)] bg-gray-50 hover:bg-[#f8f4ff]"
            }`}
          >
            {isProcessing ? (
              <Loader2
                size={48}
                className="mx-auto mb-5 text-[var(--primary)] animate-spin"
              />
            ) : (
              <Upload size={48} className="mx-auto mb-5 text-[var(--primary)]" />
            )}

            <h2 className="text-2xl font-bold mb-3">
              Upload image to resize
            </h2>

            <p className="text-sm text-[var(--text-secondary)] max-w-lg mb-6">
              Drag and drop an image here, or click to choose one. Supports JPG, PNG, WEBP, GIF, and BMP.
              Max file size: <strong>{MAX_FILE_SIZE_MB} MB</strong>.
            </p>

            <button type="button" className="btn-primary inline-flex items-center gap-2">
              <ImageIcon size={18} />
              Choose Image
            </button>
          </div>
        ) : (
          <div className="grid xl:grid-cols-[minmax(0,1.35fr)_390px] gap-6">
            <div className="min-w-0 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Live Preview</h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Drag image to position. Scroll over preview to zoom. Arrow keys move image by 1px.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="btn-secondary inline-flex items-center justify-center gap-2 px-3 py-2 text-sm"
                  >
                    <Upload size={16} />
                    Change Image
                  </button>

                  <button
                    type="button"
                    onClick={downloadImage}
                    disabled={isProcessing}
                    className={`btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm ${
                      isProcessing ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isProcessing ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Download size={17} />
                    )}
                    {isProcessing ? "Creating..." : "Download"}
                  </button>
                </div>
              </div>

              {(errorMessage || successMessage || isProcessing) && (
                <div className="grid md:grid-cols-2 gap-3">
                  {errorMessage && (
                    <MessageBox type="error" message={errorMessage} />
                  )}

                  {successMessage && (
                    <MessageBox type="success" message={successMessage} />
                  )}

                  {isProcessing && (
                    <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-4 md:col-span-2">
                      <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                        <span>Creating final image...</span>
                        <span>{exportProgress}%</span>
                      </div>

                      <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary)] transition-all duration-300"
                          style={{ width: `${exportProgress}%` }}
                        />
                      </div>

                      <p className="text-xs text-[var(--text-secondary)] mt-3">
                        Estimated processing time: {Math.ceil(estimatedProcessingTimeMs / 1000)}s
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative border border-[var(--border)] rounded-3xl bg-[#eef0f5] min-h-[640px] overflow-auto p-5 sm:p-8 flex items-center justify-center ${
                  isDraggingFile ? "ring-2 ring-[var(--primary)]" : ""
                }`}
              >
                <div className="relative p-6">
                  <div
                    ref={artboardRef}
                    onPointerDown={handleArtboardPointerDown}
                    onPointerMove={handleArtboardPointerMove}
                    onPointerUp={handleArtboardPointerUp}
                    onPointerCancel={handleArtboardPointerUp}
                    onWheel={handleWheelZoom}
                    className={`relative overflow-hidden shadow-2xl border border-gray-300 select-none ${
                      isDraggingImage ? "cursor-grabbing" : "cursor-grab"
                    }`}
                    style={previewArtboardStyle}
                  >
                    {imageBoxStyle && (
                      <>
                        <img
                          src={imageData.url}
                          alt={imageData.name}
                          draggable="false"
                          className="absolute object-fill pointer-events-none select-none"
                          style={imageBoxStyle}
                        />

                        {showImageFrame && (
                          <div
                            className="absolute pointer-events-none"
                            style={imageBoxStyle}
                          >
                            <div className="absolute inset-0 border-2 border-[var(--primary)] shadow-[0_0_0_1px_rgba(255,255,255,0.95)]">
                              <TransformHandle position="-top-2 -left-2" />
                              <TransformHandle position="-top-2 -right-2" />
                              <TransformHandle position="-bottom-2 -left-2" />
                              <TransformHandle position="-bottom-2 -right-2" />

                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] text-white text-[10px] font-semibold px-2 py-1 whitespace-nowrap">
                                {zoomPercent}% • {transform.rotation}°
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <GuideOverlay
                      showGuides={showGuides}
                      showSafeArea={showSafeArea}
                      dimensions={dimensions}
                    />

                    <div className="absolute left-3 bottom-3 bg-black/70 text-white rounded-xl px-3 py-2 text-xs pointer-events-none">
                      <p>{outputSizeText}</p>
                      <p>
                        X {Math.round(transform.offsetX)} / Y{" "}
                        {Math.round(transform.offsetY)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white/95 px-2 py-2 shadow-xl backdrop-blur">
                  <button
                    type="button"
                    onClick={() => applyScale(transform.scale * 0.9)}
                    className="w-10 h-10 rounded-xl border border-[var(--border)] hover:bg-[#f8f4ff] inline-flex items-center justify-center"
                    title="Zoom out image"
                  >
                    <ZoomOut size={18} />
                  </button>

                  <span className="min-w-14 text-center text-xs font-bold text-[var(--text-secondary)]">
                    {zoomPercent}%
                  </span>

                  <button
                    type="button"
                    onClick={() => applyScale(transform.scale * 1.1)}
                    className="w-10 h-10 rounded-xl border border-[var(--border)] hover:bg-[#f8f4ff] inline-flex items-center justify-center"
                    title="Zoom in image"
                  >
                    <ZoomIn size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleQuickAction(action.id)}
                      className="btn-secondary inline-flex items-center justify-center gap-2"
                    >
                      <Icon size={16} />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4">
                <div className="flex items-start gap-3">
                  <FileImage size={22} className="text-[var(--primary)] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-bold truncate" title={imageData.name}>
                      {imageData.name}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {originalSizeText} • {formatBytes(imageData.size)}
                    </p>
                  </div>
                </div>
              </div>

              <CollapsiblePanel
                title="Resize"
                icon={Crop}
                open={openSections.resize}
                onToggle={() => toggleSection("resize")}
                badge={outputSizeText}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <NumberInput
                      label="Width"
                      value={dimensions.width}
                      min={MIN_DIMENSION}
                      max={MAX_DIMENSION}
                      onChange={(value) => updateDimension("width", value)}
                      info="Most professional web images use 1200-1920px width. Social media posts often use 1080px or 1200px."
                    />

                    <NumberInput
                      label="Height"
                      value={dimensions.height}
                      min={MIN_DIMENSION}
                      max={MAX_DIMENSION}
                      onChange={(value) => updateDimension("height", value)}
                      info="Keep aspect ratio locked for normal resizing. Unlock only when you need an exact custom canvas."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setLockAspectRatio((current) => !current)}
                    className="btn-secondary w-full inline-flex items-center justify-center gap-2"
                  >
                    {lockAspectRatio ? <Lock size={16} /> : <Unlock size={16} />}
                    {lockAspectRatio ? "Aspect Ratio Locked" : "Aspect Ratio Free"}
                  </button>

                  <div>
                    <p className="text-sm font-semibold mb-2">Quick resize</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => quickScaleOutput(0.25)} className="small-option-btn">25%</button>
                      <button type="button" onClick={() => quickScaleOutput(0.5)} className="small-option-btn">50%</button>
                      <button type="button" onClick={resetToOriginalSize} className="small-option-btn">Original</button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2">Size presets</p>
                    <div className="space-y-3 max-h-[260px] overflow-auto pr-1">
                      {PRESETS.map((group) => (
                        <div key={group.group}>
                          <p className="text-xs font-bold text-[var(--text-secondary)] mb-2">
                            {group.group}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {group.items.map((preset) => (
                              <button
                                key={`${group.group}-${preset.label}`}
                                type="button"
                                onClick={() => applyPreset(preset)}
                                className="text-xs px-3 py-2 rounded-xl bg-white hover:bg-[#f4edff] hover:text-[var(--primary)] transition border border-[var(--border)]"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsiblePanel>

              <CollapsiblePanel
                title="Image Position"
                icon={SlidersHorizontal}
                open={openSections.transform}
                onToggle={() => toggleSection("transform")}
                badge={`${zoomPercent}%`}
              >
                <div className="space-y-4">
                  <RangeInput
                    label={`Zoom: ${zoomPercent}%`}
                    min={MIN_SCALE}
                    max={MAX_SCALE}
                    step={0.005}
                    value={transform.scale}
                    onChange={(value) => applyScale(Number(value))}
                  />

                  <RangeInput
                    label={`Rotation: ${transform.rotation}°`}
                    min={0}
                    max={359}
                    step={1}
                    value={transform.rotation}
                    onChange={(value) => {
                      clearExportStats();
                      setTransform((current) => ({
                        ...current,
                        rotation: normalizeRotation(Number(value)),
                      }));
                    }}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <NumberInput
                      label="X Position"
                      value={Math.round(transform.offsetX)}
                      onChange={(value) => {
                        clearExportStats();
                        setTransform((current) => ({ ...current, offsetX: Number(value) }));
                      }}
                      info="Use X and Y for exact positioning. Arrow keys also move the image by 1px."
                    />

                    <NumberInput
                      label="Y Position"
                      value={Math.round(transform.offsetY)}
                      onChange={(value) => {
                        clearExportStats();
                        setTransform((current) => ({ ...current, offsetY: Number(value) }));
                      }}
                      info="Positive Y moves down. Negative Y moves up."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={fitImageToArtboard} className="btn-secondary">Fit Image</button>
                    <button type="button" onClick={fillArtboard} className="btn-secondary">Fill Canvas</button>
                    <button type="button" onClick={centerImage} className="btn-secondary">Center</button>
                    <button type="button" onClick={resetTransform} className="btn-secondary">Reset</button>
                  </div>
                </div>
              </CollapsiblePanel>

              <CollapsiblePanel
                title="Export"
                icon={Settings2}
                open={openSections.export}
                onToggle={() => toggleSection("export")}
                badge={selectedOutputFormat.label}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Format</label>
                      <select
                        value={outputFormat}
                        onChange={(event) => {
                          setOutputFormat(event.target.value);
                          clearExportStats();
                        }}
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
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <label className="text-sm font-semibold block">Quality</label>
                        <InfoTip text="90-95% is a good professional setting. Lower quality makes smaller files but may reduce sharpness." />
                      </div>

                      <input
                        type="range"
                        min="0.6"
                        max="1"
                        step="0.01"
                        value={quality}
                        disabled={outputFormat === "image/png"}
                        onChange={(event) => {
                          setQuality(Number(event.target.value));
                          clearExportStats();
                        }}
                        className="w-full accent-[var(--primary)] disabled:opacity-40"
                      />

                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {outputFormat === "image/png" ? "PNG keeps quality automatically." : `${Math.round(quality * 100)}%`}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Background</label>
                    <select
                      value={backgroundColor}
                      onChange={(event) => {
                        setBackgroundColor(event.target.value);
                        clearExportStats();
                      }}
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] bg-white"
                    >
                      <option value="transparent">Transparent</option>
                      <option value="#ffffff">White</option>
                      <option value="#000000">Black</option>
                      <option value="custom">Custom Color</option>
                    </select>

                    {backgroundColor === "custom" && (
                      <input
                        type="color"
                        value={customBackground}
                        onChange={(event) => {
                          setCustomBackground(event.target.value);
                          clearExportStats();
                        }}
                        className="w-full h-12 border border-[var(--border)] rounded-xl p-1 bg-white mt-3"
                      />
                    )}

                    <p className="text-xs text-[var(--text-secondary)] mt-2">
                      {outputBackgroundNote}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={downloadImage}
                    disabled={isProcessing}
                    className={`btn-primary w-full inline-flex items-center justify-center gap-2 ${
                      isProcessing ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    {isProcessing ? "Creating..." : "Create & Download"}
                  </button>
                </div>
              </CollapsiblePanel>

              <CollapsiblePanel
                title="View Guides"
                icon={Eye}
                open={openSections.guides}
                onToggle={() => toggleSection("guides")}
                badge={showGuides ? "On" : "Off"}
              >
                <div className="space-y-3">
                  <ToggleRow label="Center guides" checked={showGuides} onChange={setShowGuides} />
                  <ToggleRow label="Safe area" checked={showSafeArea} onChange={setShowSafeArea} />
                  <ToggleRow label="Image frame" checked={showImageFrame} onChange={setShowImageFrame} />
                </div>
              </CollapsiblePanel>

              <CollapsiblePanel
                title="Details"
                icon={PanelTopOpen}
                open={openSections.details}
                onToggle={() => toggleSection("details")}
                badge={processingTimeMs ? `${(processingTimeMs / 1000).toFixed(1)}s` : "Info"}
              >
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard label="Original" value={originalSizeText} />
                  <InfoCard label="Output" value={outputSizeText} />
                  <InfoCard label="Zoom" value={`${zoomPercent}%`} />
                  <InfoCard label="Ratio" value={outputAspectRatio.toFixed(2)} />
                  <InfoCard
                    label="Process Time"
                    value={
                      processingTimeMs
                        ? `${(processingTimeMs / 1000).toFixed(1)}s`
                        : `Est. ${Math.ceil(estimatedProcessingTimeMs / 1000)}s`
                    }
                    green={Boolean(processingTimeMs)}
                  />
                  <InfoCard
                    label="Output Size"
                    value={lastOutputSize ? formatBytes(lastOutputSize) : "-"}
                  />
                </div>
              </CollapsiblePanel>

              <button
                type="button"
                onClick={resetTool}
                className="btn-secondary w-full inline-flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Reset Tool
              </button>
            </aside>
          </div>
        )}
      </section>

      <style>{`
        .small-option-btn {
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 0.65rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 700;
          background: white;
        }
        .small-option-btn:hover {
          background: #f4edff;
          color: var(--primary);
        }
      `}</style>

      <SuggestedTools currentToolId="image-resizer" />
    </div>
  );
}

function CollapsiblePanel({ title, icon: Icon, open, onToggle, badge, children }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-[#f8f4ff]"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Icon size={19} className="text-[var(--primary)] shrink-0" />
          <span className="font-bold truncate">{title}</span>
        </span>

        <span className="flex items-center gap-2 shrink-0">
          {badge && (
            <span className="text-xs font-semibold text-[var(--primary)] bg-[#f4edff] rounded-full px-2 py-1">
              {badge}
            </span>
          )}
          <ChevronDown
            size={18}
            className={`transition ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--border)] p-4">
          {children}
        </div>
      )}
    </div>
  );
}

function NumberInput({ label, value, min, max, onChange, info }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="text-sm font-semibold block">{label}</label>
        {info && <InfoTip text={info} />}
      </div>
      <input
        type="number"
        min={min}
        max={max}
        value={Number.isFinite(Number(value)) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] bg-white"
      />
    </div>
  );
}

function InfoTip({ text }) {
  return (
    <span className="relative group inline-flex">
      <span className="w-6 h-6 rounded-full border border-[var(--border)] bg-white inline-flex items-center justify-center text-[var(--primary)] cursor-help">
        <Info size={14} />
      </span>
      <span className="pointer-events-none absolute right-0 top-8 z-30 hidden w-64 rounded-xl bg-[#111827] text-white text-xs leading-5 p-3 shadow-xl group-hover:block">
        {text}
      </span>
    </span>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-gray-50 px-4 py-3 cursor-pointer">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="w-4 h-4 accent-[var(--primary)]"
      />
    </label>
  );
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

function GuideOverlay({ showGuides, showSafeArea, dimensions }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {showGuides && (
        <>
          <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-[var(--primary)]/85" />
          <div className="absolute top-1/2 left-0 right-0 border-t-2 border-[var(--primary)]/85" />
          <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/70" />
          <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/70" />
          <div className="absolute top-1/3 left-0 right-0 border-t border-white/70" />
          <div className="absolute top-2/3 left-0 right-0 border-t border-white/70" />
          <div className="absolute left-1/2 top-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--primary)] shadow" />
          <span className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-[var(--primary)] text-white text-[10px] font-semibold px-2 py-1">
            {Math.round(dimensions.width / 2)}px center
          </span>
        </>
      )}

      {showSafeArea && (
        <div className="absolute inset-[8%] border border-dashed border-white/90 rounded-sm">
          <span className="absolute -top-6 left-0 text-[10px] bg-black/65 text-white rounded px-2 py-1">
            Safe Area
          </span>
        </div>
      )}

      <div className="absolute inset-0 border border-white/60" />
    </div>
  );
}

function TransformHandle({ position }) {
  return (
    <span
      className={`absolute ${position} w-4 h-4 rounded-sm bg-white border-2 border-[var(--primary)] shadow`}
    />
  );
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

  const lowerName = String(file.name || "").toLowerCase();
  const hasValidExtension = /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(lowerName);

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type) && !hasValidExtension) {
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
    Math.min(
      dimensions.width / imageData.width,
      dimensions.height / imageData.height
    ),
    MIN_SCALE,
    MAX_SCALE
  );
}

function getFillScale(imageData, dimensions) {
  if (!imageData) return 1;

  return clampNumber(
    Math.max(
      dimensions.width / imageData.width,
      dimensions.height / imageData.height
    ),
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

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
