// src/tools/ProfilePictureMaker.jsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  RotateCw,
  Image as ImageIcon,
  UserRound,
  Sparkles,
  Settings2,
  SlidersHorizontal,
  Loader2,
  CheckCircle,
  AlertCircle,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crop,
  Eye,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Profile Picture Maker",
  path: "/profile-picture-maker",
  category: "Image Tools",
  description:
    "Create perfect profile pictures online. Upload a photo, choose a profile size, add a circle frame, border, background, shadow, and download instantly.",
  metaTitle: "Profile Picture Maker Online | Create Perfect Profile Photos Free",
  metaDescription:
    "Create a perfect profile picture online for free. Upload your photo, crop it, add a circle frame, border, background, shadow, and download for Facebook, Instagram, LinkedIn, WhatsApp, and more.",
};

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MIN_PROCESSING_TIME_MS = 6000;

const SIZE_PRESETS = [
  {
    id: "facebook",
    label: "Facebook Profile Picture",
    width: 800,
    height: 800,
  },
  {
    id: "instagram",
    label: "Instagram Profile Picture",
    width: 1080,
    height: 1080,
  },
  {
    id: "linkedin",
    label: "LinkedIn Profile Picture",
    width: 800,
    height: 800,
  },
  {
    id: "whatsapp",
    label: "WhatsApp DP",
    width: 800,
    height: 800,
  },
  {
    id: "youtube",
    label: "YouTube Profile Picture",
    width: 800,
    height: 800,
  },
  {
    id: "tiktok",
    label: "TikTok Profile Picture",
    width: 1080,
    height: 1080,
  },
  {
    id: "business",
    label: "Business Profile / Logo",
    width: 1024,
    height: 1024,
  },
  {
    id: "custom",
    label: "Custom Square",
    width: 1000,
    height: 1000,
  },
];

const SHAPES = [
  {
    id: "circle",
    label: "Circle",
  },
  {
    id: "rounded",
    label: "Rounded Square",
  },
  {
    id: "square",
    label: "Square",
  },
];

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

const STYLE_PRESETS = [
  {
    id: "clean-white",
    label: "Clean White",
    shape: "circle",
    backgroundMode: "solid",
    backgroundColor: "#ffffff",
    gradientColor: "#f4edff",
    ringColor: "#ffffff",
    ringWidth: 0,
    ringGap: 0,
    padding: 48,
    cornerRadius: 90,
    shadow: false,
  },
  {
    id: "premium-purple",
    label: "Premium Purple",
    shape: "circle",
    backgroundMode: "gradient",
    backgroundColor: "#f4edff",
    gradientColor: "#9b6ce3",
    ringColor: "#9b6ce3",
    ringWidth: 14,
    ringGap: 10,
    padding: 64,
    cornerRadius: 90,
    shadow: true,
  },
  {
    id: "linkedin-pro",
    label: "LinkedIn Pro",
    shape: "circle",
    backgroundMode: "solid",
    backgroundColor: "#ffffff",
    gradientColor: "#dbeafe",
    ringColor: "#2563eb",
    ringWidth: 12,
    ringGap: 8,
    padding: 58,
    cornerRadius: 90,
    shadow: true,
  },
  {
    id: "dark-luxury",
    label: "Dark Luxury",
    shape: "circle",
    backgroundMode: "solid",
    backgroundColor: "#111827",
    gradientColor: "#374151",
    ringColor: "#facc15",
    ringWidth: 12,
    ringGap: 10,
    padding: 66,
    cornerRadius: 90,
    shadow: true,
  },
  {
    id: "soft-gradient",
    label: "Soft Gradient",
    shape: "rounded",
    backgroundMode: "gradient",
    backgroundColor: "#fdf2f8",
    gradientColor: "#d8b4fe",
    ringColor: "#ffffff",
    ringWidth: 10,
    ringGap: 8,
    padding: 58,
    cornerRadius: 90,
    shadow: true,
  },
  {
    id: "minimal-black",
    label: "Minimal Black",
    shape: "square",
    backgroundMode: "solid",
    backgroundColor: "#000000",
    gradientColor: "#111827",
    ringColor: "#ffffff",
    ringWidth: 0,
    ringGap: 0,
    padding: 0,
    cornerRadius: 0,
    shadow: false,
  },
];

export default function ProfilePictureMaker() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageUrlRef = useRef("");
  const outputUrlRef = useRef("");

  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  const [photo, setPhoto] = useState(null);

  const [sizePresetId, setSizePresetId] = useState("facebook");
  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 800,
  });

  const [shape, setShape] = useState("circle");
  const [backgroundMode, setBackgroundMode] = useState("solid");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [gradientColor, setGradientColor] = useState("#f4edff");

  const [ringColor, setRingColor] = useState("#9b6ce3");
  const [ringWidth, setRingWidth] = useState(10);
  const [ringGap, setRingGap] = useState(8);
  const [padding, setPadding] = useState(56);
  const [cornerRadius, setCornerRadius] = useState(90);
  const [shadow, setShadow] = useState(true);

  const [transform, setTransform] = useState({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
  });

  const [activePanel, setActivePanel] = useState("");

  const [outputFormat, setOutputFormat] = useState("image/png");
  const [quality, setQuality] = useState(0.94);

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [exportProgress, setExportProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [lastOutputSize, setLastOutputSize] = useState(0);
  const [outputPreviewUrl, setOutputPreviewUrl] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const hasPhoto = Boolean(photo?.element);

  const selectedSizePreset = useMemo(() => {
    return SIZE_PRESETS.find((item) => item.id === sizePresetId) || SIZE_PRESETS[0];
  }, [sizePresetId]);

  const selectedOutputFormat = useMemo(() => {
    return OUTPUT_FORMATS.find((item) => item.value === outputFormat) || OUTPUT_FORMATS[0];
  }, [outputFormat]);

  const previewWidth = useMemo(() => {
    return Math.min(620, dimensions.width);
  }, [dimensions.width]);

  const estimatedProcessingTimeText = useMemo(() => {
    return `${Math.ceil(MIN_PROCESSING_TIME_MS / 1000)}s minimum`;
  }, []);

  const handlePhotoFile = useCallback(async (file) => {
    setErrorMessage("");
    setSuccessMessage("");
    clearOutput();

    const validationError = validateImageFile(file);

    if (validationError) {
      setErrorMessage(validationError);
      resetFileInput();
      return;
    }

    setIsLoadingPhoto(true);

    try {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(file);
      imageUrlRef.current = objectUrl;

      const imageElement = await loadImage(objectUrl);

      setPhoto({
        element: imageElement,
        url: objectUrl,
        name: file.name || "profile-photo",
        size: file.size,
        type: file.type,
        width: imageElement.naturalWidth || imageElement.width,
        height: imageElement.naturalHeight || imageElement.height,
      });

      setTransform({
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
      });

      setSuccessMessage(
        "Photo loaded. Drag inside the profile frame, scroll to zoom, then create your profile picture."
      );
    } catch {
      setErrorMessage("Could not load this photo. Please try another image.");

      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = "";
      }

      setPhoto(null);
    } finally {
      setIsLoadingPhoto(false);
      resetFileInput();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    drawProfilePicture({
      canvas,
      photo,
      dimensions,
      shape,
      backgroundMode,
      backgroundColor,
      gradientColor,
      ringColor,
      ringWidth,
      ringGap,
      padding,
      cornerRadius,
      shadow,
      transform,
      outputFormat,
      includeEditorGuides: true,
    });
  }, [
    photo,
    dimensions,
    shape,
    backgroundMode,
    backgroundColor,
    gradientColor,
    ringColor,
    ringWidth,
    ringGap,
    padding,
    cornerRadius,
    shadow,
    transform,
    outputFormat,
  ]);

  useEffect(() => {
    function handlePaste(event) {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type?.startsWith("image/"));

      if (!imageItem) return;

      const file = imageItem.getAsFile();

      if (file) {
        handlePhotoFile(file);
      }
    }

    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePhotoFile]);

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
      handlePhotoFile(file);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDraggingFile(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handlePhotoFile(file);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDraggingFile(true);
  }

  function handleDragLeave() {
    setIsDraggingFile(false);
  }

  function handleSizePresetChange(nextPresetId) {
    const preset = SIZE_PRESETS.find((item) => item.id === nextPresetId);

    if (!preset) return;

    setSizePresetId(nextPresetId);
    setDimensions({
      width: preset.width,
      height: preset.height,
    });
    clearOutput();
  }

  function applyStylePreset(preset) {
    setShape(preset.shape);
    setBackgroundMode(preset.backgroundMode);
    setBackgroundColor(preset.backgroundColor);
    setGradientColor(preset.gradientColor);
    setRingColor(preset.ringColor);
    setRingWidth(preset.ringWidth);
    setRingGap(preset.ringGap);
    setPadding(preset.padding);
    setCornerRadius(preset.cornerRadius);
    setShadow(preset.shadow);
    clearOutput();
  }

  function updateTransform(updates) {
    setTransform((current) => ({
      ...current,
      ...updates,
    }));

    clearOutput();
  }

  function getCanvasPoint(event) {
    const canvas = canvasRef.current;

    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return null;

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handleCanvasPointerDown(event) {
    if (!hasPhoto) return;

    const point = getCanvasPoint(event);

    if (!point) return;

    event.preventDefault();

    dragRef.current = {
      active: true,
      startX: point.x,
      startY: point.y,
      startOffsetX: transform.offsetX,
      startOffsetY: transform.offsetY,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleCanvasPointerMove(event) {
    if (!dragRef.current.active) return;

    const point = getCanvasPoint(event);

    if (!point) return;

    event.preventDefault();

    const dx = point.x - dragRef.current.startX;
    const dy = point.y - dragRef.current.startY;

    updateTransform({
      offsetX: dragRef.current.startOffsetX + dx,
      offsetY: dragRef.current.startOffsetY + dy,
    });
  }

  function handleCanvasPointerUp(event) {
    if (!dragRef.current.active) return;

    dragRef.current.active = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  function handleCanvasWheel(event) {
    if (!hasPhoto) return;

    event.preventDefault();

    const factor = Math.exp(-event.deltaY * 0.0015);
    const nextZoom = clampNumber(transform.zoom * factor, 0.35, 5);

    updateTransform({
      zoom: nextZoom,
    });
  }

  function fitPhoto() {
    if (!photo) return;

    const frameBox = getFrameBox({
      dimensions,
      padding,
      ringWidth,
      ringGap,
    });

    const coverScale = Math.max(frameBox.w / photo.width, frameBox.h / photo.height);
    const containScale = Math.min(frameBox.w / photo.width, frameBox.h / photo.height);
    const fitZoom = clampNumber(containScale / coverScale, 0.35, 5);

    updateTransform({
      zoom: fitZoom,
      offsetX: 0,
      offsetY: 0,
    });
  }

  function fillPhoto() {
    updateTransform({
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });
  }

  function centerPhoto() {
    updateTransform({
      offsetX: 0,
      offsetY: 0,
    });
  }

  function rotatePhoto() {
    updateTransform({
      rotation: normalizeRotation(transform.rotation + 90),
    });
  }

  async function createProfilePicture({ downloadAfterCreate = false } = {}) {
    if (!hasPhoto) {
      setErrorMessage("Please upload a photo first.");
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

      drawProfilePicture({
        canvas: exportCanvas,
        photo,
        dimensions,
        shape,
        backgroundMode,
        backgroundColor,
        gradientColor,
        ringColor,
        ringWidth,
        ringGap,
        padding,
        cornerRadius,
        shadow,
        transform,
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
        `Profile picture created in ${(actualProcessingTime / 1000).toFixed(1)}s.`
      );

      if (downloadAfterCreate) {
        downloadBlob(blob);
      }
    } catch {
      setErrorMessage("Could not create the profile picture. Please try again.");
    } finally {
      setIsExporting(false);

      window.setTimeout(() => {
        setExportProgress(0);
      }, 900);
    }
  }

  function downloadBlob(blob) {
    if (!blob && !outputPreviewUrl) {
      setErrorMessage("Please create the profile picture first.");
      return;
    }

    const link = document.createElement("a");

    link.href = blob ? URL.createObjectURL(blob) : outputPreviewUrl;
    link.download = `profile-picture-${dimensions.width}x${dimensions.height}.${selectedOutputFormat.extension}`;

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

    setPhoto(null);
    setSizePresetId("facebook");
    setDimensions({
      width: 800,
      height: 800,
    });
    setShape("circle");
    setBackgroundMode("solid");
    setBackgroundColor("#ffffff");
    setGradientColor("#f4edff");
    setRingColor("#9b6ce3");
    setRingWidth(10);
    setRingGap(8);
    setPadding(56);
    setCornerRadius(90);
    setShadow(true);
    setTransform({
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    });
    setActivePanel("");
    setOutputFormat("image/png");
    setQuality(0.94);
    setIsDraggingFile(false);
    setIsLoadingPhoto(false);
    setIsExporting(false);
    setExportProgress(0);
    setProcessingTimeMs(0);
    setLastOutputSize(0);
    setOutputPreviewUrl("");
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
          <UserRound size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Profile Picture Maker</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload a photo, choose a profile size, add a circle frame, border,
          background, and shadow, then create a perfect profile picture for
          Facebook, Instagram, LinkedIn, WhatsApp, YouTube, and more.
        </p>
      </section>

      {/* Tool */}
      <section className="card p-4 sm:p-5">
        {!hasPhoto && (
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
            {isLoadingPhoto ? (
              <Loader2
                size={40}
                className="mx-auto mb-4 text-[var(--primary)] animate-spin"
              />
            ) : (
              <Upload size={40} className="mx-auto mb-4 text-[var(--primary)]" />
            )}

            <h2 className="text-xl font-semibold mb-2">
              Upload, drop, or paste your photo
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

            <div className="min-w-[220px]">
              <select
                value={sizePresetId}
                onChange={(event) => handleSizePresetChange(event.target.value)}
                className="h-10 w-full border border-[var(--border)] rounded-xl px-3 bg-white outline-none focus:border-[var(--primary)] text-sm font-semibold"
              >
                {SIZE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label} - {preset.width}×{preset.height}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[140px]">
              <select
                value={shape}
                onChange={(event) => {
                  setShape(event.target.value);
                  clearOutput();
                }}
                className="h-10 w-full border border-[var(--border)] rounded-xl px-3 bg-white outline-none focus:border-[var(--primary)] text-sm font-semibold"
              >
                {SHAPES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <ToolbarButton
              active={activePanel === "style"}
              icon={<Sparkles size={17} />}
              label="Style"
              onClick={() => setActivePanel(activePanel === "style" ? "" : "style")}
            />

            <ToolbarButton
              active={activePanel === "adjust"}
              icon={<SlidersHorizontal size={17} />}
              label="Adjust"
              onClick={() => setActivePanel(activePanel === "adjust" ? "" : "adjust")}
            />

            <ToolbarButton
              active={activePanel === "export"}
              icon={<Settings2 size={17} />}
              label="Export"
              onClick={() => setActivePanel(activePanel === "export" ? "" : "export")}
            />

            <div className="w-px h-8 bg-[var(--border)] mx-1" />

            <IconButton
              disabled={!hasPhoto}
              title="Zoom out"
              onClick={() =>
                updateTransform({
                  zoom: clampNumber(transform.zoom * 0.9, 0.35, 5),
                })
              }
            >
              <ZoomOut size={18} />
            </IconButton>

            <IconButton
              disabled={!hasPhoto}
              title="Zoom in"
              onClick={() =>
                updateTransform({
                  zoom: clampNumber(transform.zoom * 1.1, 0.35, 5),
                })
              }
            >
              <ZoomIn size={18} />
            </IconButton>

            <IconButton disabled={!hasPhoto} title="Fit photo" onClick={fitPhoto}>
              <Maximize2 size={18} />
            </IconButton>

            <IconButton disabled={!hasPhoto} title="Fill frame" onClick={fillPhoto}>
              <Crop size={18} />
            </IconButton>

            <IconButton disabled={!hasPhoto} title="Center photo" onClick={centerPhoto}>
              <Move size={18} />
            </IconButton>

            <IconButton disabled={!hasPhoto} title="Rotate photo" onClick={rotatePhoto}>
              <RotateCw size={18} />
            </IconButton>

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => createProfilePicture({ downloadAfterCreate: true })}
              disabled={!hasPhoto || isExporting}
              className={`btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm ${
                !hasPhoto || isExporting ? "opacity-50 cursor-not-allowed" : ""
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

          {/* Dropdown Panels */}
          {activePanel && (
            <div className="mt-3 border border-[var(--border)] rounded-2xl bg-[#fafafa] p-4">
              {activePanel === "style" && (
                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
                  <div>
                    <p className="text-sm font-semibold mb-3">Style presets</p>

                    <div className="flex flex-wrap gap-2">
                      {STYLE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyStylePreset(preset)}
                          className="px-3 py-2 rounded-xl border border-[var(--border)] bg-white hover:bg-[#f4edff] hover:text-[var(--primary)] text-sm font-semibold"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ColorInput
                      label="Background"
                      value={backgroundColor}
                      onChange={(value) => {
                        setBackgroundColor(value);
                        clearOutput();
                      }}
                    />

                    <ColorInput
                      label="Gradient"
                      value={gradientColor}
                      onChange={(value) => {
                        setGradientColor(value);
                        clearOutput();
                      }}
                    />

                    <ColorInput
                      label="Ring"
                      value={ringColor}
                      onChange={(value) => {
                        setRingColor(value);
                        clearOutput();
                      }}
                    />

                    <label className="block">
                      <span className="text-sm font-semibold mb-2 block">
                        Background
                      </span>
                      <select
                        value={backgroundMode}
                        onChange={(event) => {
                          setBackgroundMode(event.target.value);
                          clearOutput();
                        }}
                        className="w-full h-12 border border-[var(--border)] rounded-xl px-3 bg-white"
                      >
                        <option value="solid">Solid</option>
                        <option value="gradient">Gradient</option>
                        <option value="transparent">Transparent</option>
                      </select>
                    </label>
                  </div>

                  <div className="lg:col-span-2 grid md:grid-cols-4 gap-4">
                    <RangeInput
                      label={`Padding: ${padding}px`}
                      min={0}
                      max={220}
                      step={1}
                      value={padding}
                      onChange={(value) => {
                        setPadding(Number(value));
                        clearOutput();
                      }}
                    />

                    <RangeInput
                      label={`Ring: ${ringWidth}px`}
                      min={0}
                      max={60}
                      step={1}
                      value={ringWidth}
                      onChange={(value) => {
                        setRingWidth(Number(value));
                        clearOutput();
                      }}
                    />

                    <RangeInput
                      label={`Ring Gap: ${ringGap}px`}
                      min={0}
                      max={60}
                      step={1}
                      value={ringGap}
                      onChange={(value) => {
                        setRingGap(Number(value));
                        clearOutput();
                      }}
                    />

                    <RangeInput
                      label={`Radius: ${cornerRadius}px`}
                      min={0}
                      max={220}
                      step={1}
                      value={cornerRadius}
                      onChange={(value) => {
                        setCornerRadius(Number(value));
                        clearOutput();
                      }}
                    />
                  </div>

                  <label className="lg:col-span-2 flex items-center justify-between gap-3 bg-white border border-[var(--border)] rounded-xl p-4 cursor-pointer">
                    <span className="font-semibold text-sm">Soft Shadow</span>
                    <input
                      type="checkbox"
                      checked={shadow}
                      onChange={(event) => {
                        setShadow(event.target.checked);
                        clearOutput();
                      }}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                  </label>
                </div>
              )}

              {activePanel === "adjust" && (
                <div className="grid md:grid-cols-4 gap-4">
                  <RangeInput
                    label={`Photo Zoom: ${Math.round(transform.zoom * 100)}%`}
                    min={0.35}
                    max={5}
                    step={0.01}
                    value={transform.zoom}
                    onChange={(value) =>
                      updateTransform({
                        zoom: Number(value),
                      })
                    }
                  />

                  <RangeInput
                    label={`X Position: ${Math.round(transform.offsetX)}px`}
                    min={-dimensions.width}
                    max={dimensions.width}
                    step={1}
                    value={transform.offsetX}
                    onChange={(value) =>
                      updateTransform({
                        offsetX: Number(value),
                      })
                    }
                  />

                  <RangeInput
                    label={`Y Position: ${Math.round(transform.offsetY)}px`}
                    min={-dimensions.height}
                    max={dimensions.height}
                    step={1}
                    value={transform.offsetY}
                    onChange={(value) =>
                      updateTransform({
                        offsetY: Number(value),
                      })
                    }
                  />

                  <RangeInput
                    label={`Rotation: ${transform.rotation}°`}
                    min={0}
                    max={359}
                    step={1}
                    value={transform.rotation}
                    onChange={(value) =>
                      updateTransform({
                        rotation: Number(value),
                      })
                    }
                  />
                </div>
              )}

              {activePanel === "export" && (
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
              )}
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
                  <span>Creating final profile picture...</span>
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
          className={`border border-[var(--border)] rounded-2xl bg-[#eef0f5] min-h-[680px] overflow-auto p-4 sm:p-6 flex items-center justify-center ${
            isDraggingFile ? "ring-2 ring-[var(--primary)]" : ""
          }`}
        >
          {!hasPhoto ? (
            <div className="text-center">
              <ImageIcon size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-[var(--text-secondary)]">
                Upload, drop, or paste a photo to start creating your profile
                picture.
              </p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
              onWheel={handleCanvasWheel}
              className="rounded-2xl shadow-2xl bg-white touch-none"
              style={{
                width: `${previewWidth}px`,
                maxWidth: "none",
                cursor: "grab",
              }}
            />
          )}
        </div>

        {/* Stats */}
        {hasPhoto && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
            <InfoCard label="Preset" value={selectedSizePreset.label} />
            <InfoCard label="Canvas" value={`${dimensions.width}×${dimensions.height}`} />
            <InfoCard label="Shape" value={shape} />
            <InfoCard label="Zoom" value={`${Math.round(transform.zoom * 100)}%`} />
            <InfoCard
              label="Process Time"
              value={
                processingTimeMs
                  ? `${(processingTimeMs / 1000).toFixed(1)}s`
                  : estimatedProcessingTimeText
              }
              green={Boolean(processingTimeMs)}
            />
            <InfoCard
              label="Output Size"
              value={lastOutputSize ? formatBytes(lastOutputSize) : "-"}
              green={Boolean(lastOutputSize)}
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

            <div className="mt-4 flex justify-center bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-4">
              <img
                src={outputPreviewUrl}
                alt="Final profile preview"
                className="max-w-[220px] rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Help Note */}
        {hasPhoto && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Eye size={20} className="text-blue-700 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Drag the photo inside the frame to reposition it. Scroll over
                the preview to zoom. Use Fit, Fill, Center, and Rotate from the
                top toolbar for quick adjustment. Your photo is processed
                locally in your browser.
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
        <h2 className="text-2xl font-bold mb-4">
          Create Profile Pictures Online
        </h2>

        <div className="text-[var(--text-secondary)] leading-7 space-y-3">
          <p>
            This Profile Picture Maker helps you create a clean and professional
            profile photo for Facebook, Instagram, LinkedIn, WhatsApp, YouTube,
            TikTok, business pages, and personal branding.
          </p>

          <p>
            Upload your photo, choose a profile size, select a circle or square
            frame, customize the background and border, then download your final
            image in PNG, JPG, or WEBP.
          </p>

          <p>
            Your image is processed locally in your browser. No paid API is
            required.
          </p>
        </div>
      </section>

      <SuggestedTools currentToolId="profile-picture-maker" />
    </div>
  );
}

function ToolbarButton({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm ${
        active
          ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
          : "border-[var(--border)] hover:bg-[#f8f4ff]"
      }`}
    >
      {icon}
      {label}
    </button>
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

function drawProfilePicture({
  canvas,
  photo,
  dimensions,
  shape,
  backgroundMode,
  backgroundColor,
  gradientColor,
  ringColor,
  ringWidth,
  ringGap,
  padding,
  cornerRadius,
  shadow,
  transform,
  outputFormat,
  includeEditorGuides,
}) {
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground({
    ctx,
    dimensions,
    backgroundMode,
    backgroundColor,
    gradientColor,
    outputFormat,
  });

  const frameBox = getFrameBox({
    dimensions,
    padding,
    ringWidth,
    ringGap,
  });

  const ringBox = expandBox(frameBox, ringGap + ringWidth / 2);

  if (shadow) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = dimensions.width * 0.045;
    ctx.shadowOffsetY = dimensions.width * 0.018;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    createShapePath(ctx, ringBox, shape, cornerRadius);
    ctx.fill();
    ctx.restore();
  }

  if (ringWidth > 0) {
    ctx.save();
    ctx.lineWidth = ringWidth;
    ctx.strokeStyle = ringColor;
    createShapePath(ctx, ringBox, shape, cornerRadius);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  createShapePath(ctx, frameBox, shape, cornerRadius);
  ctx.clip();

  if (photo?.element) {
    drawPhotoInsideFrame(ctx, {
      photo,
      frameBox,
      transform,
    });
  } else {
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(frameBox.x, frameBox.y, frameBox.w, frameBox.h);

    ctx.fillStyle = "#9ca3af";
    ctx.font = `700 ${Math.max(24, dimensions.width * 0.035)}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Upload Photo", dimensions.width / 2, dimensions.height / 2);
  }

  ctx.restore();

  if (includeEditorGuides) {
    drawEditorGuides(ctx, dimensions, frameBox, shape, cornerRadius);
  }
}

function drawBackground({
  ctx,
  dimensions,
  backgroundMode,
  backgroundColor,
  gradientColor,
  outputFormat,
}) {
  if (backgroundMode === "transparent" && outputFormat !== "image/jpeg") {
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    return;
  }

  if (backgroundMode === "transparent" && outputFormat === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    return;
  }

  if (backgroundMode === "gradient") {
    const gradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height);

    gradient.addColorStop(0, backgroundColor);
    gradient.addColorStop(1, gradientColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    return;
  }

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);
}

function drawPhotoInsideFrame(ctx, { photo, frameBox, transform }) {
  const baseScale = Math.max(frameBox.w / photo.width, frameBox.h / photo.height);
  const finalScale = baseScale * transform.zoom;

  const drawWidth = photo.width * finalScale;
  const drawHeight = photo.height * finalScale;

  const centerX = frameBox.x + frameBox.w / 2 + transform.offsetX;
  const centerY = frameBox.y + frameBox.h / 2 + transform.offsetY;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(photo.element, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
}

function getFrameBox({ dimensions, padding, ringWidth, ringGap }) {
  const minSide = Math.min(dimensions.width, dimensions.height);
  const safeInset = clampNumber(
    padding + ringWidth + ringGap,
    0,
    minSide / 2 - 8
  );

  return {
    x: safeInset,
    y: safeInset,
    w: dimensions.width - safeInset * 2,
    h: dimensions.height - safeInset * 2,
  };
}

function expandBox(box, amount) {
  return {
    x: box.x - amount,
    y: box.y - amount,
    w: box.w + amount * 2,
    h: box.h + amount * 2,
  };
}

function createShapePath(ctx, box, shape, cornerRadius) {
  ctx.beginPath();

  if (shape === "circle") {
    ctx.ellipse(
      box.x + box.w / 2,
      box.y + box.h / 2,
      Math.abs(box.w / 2),
      Math.abs(box.h / 2),
      0,
      0,
      Math.PI * 2
    );
    ctx.closePath();
    return;
  }

  if (shape === "rounded") {
    roundedRectPath(ctx, box.x, box.y, box.w, box.h, cornerRadius);
    return;
  }

  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.closePath();
}

function drawEditorGuides(ctx, dimensions, frameBox, shape, cornerRadius) {
  ctx.save();

  ctx.strokeStyle = "rgba(155,108,227,0.75)";
  ctx.lineWidth = Math.max(2, dimensions.width * 0.003);
  ctx.setLineDash([18, 12]);
  createShapePath(ctx, frameBox, shape, cornerRadius);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = Math.max(1, dimensions.width * 0.002);

  ctx.beginPath();
  ctx.moveTo(dimensions.width / 2, 0);
  ctx.lineTo(dimensions.width / 2, dimensions.height);
  ctx.moveTo(0, dimensions.height / 2);
  ctx.lineTo(dimensions.width, dimensions.height / 2);
  ctx.stroke();

  ctx.fillStyle = "#9b6ce3";
  ctx.beginPath();
  ctx.arc(
    dimensions.width / 2,
    dimensions.height / 2,
    Math.max(5, dimensions.width * 0.008),
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function ColorInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold mb-2 block">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-12 rounded-xl border border-[var(--border)] bg-white p-1"
      />
    </label>
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