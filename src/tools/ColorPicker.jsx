// src/tools/ColorPicker.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Copy,
  RotateCcw,
  Pipette,
  Check,
  Eye,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Trash2,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Color Picker",
  path: "/tool/color-picker",
  category: "Design Tools",
  description:
    "Pick precise HEX colors from images with zoom, hover preview, magnifier, and saved color history.",
  metaTitle: "Color Picker Tool - Pick Colors from Images | Next Online Tools",
  metaDescription:
    "Pick precise HEX colors from images online. Upload, paste, or drop an image, zoom in for accuracy, preview colors, and copy saved picks instantly.",
};

const MAX_FILE_SIZE_MB = 12;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_CANVAS_LONG_SIDE = 2400;
const MAGNIFIER_SIZE = 180;
const MAGNIFIER_ZOOM = 14;

const DEFAULT_COLOR = {
  hex: "#9B6CE3",
  rgb: { r: 155, g: 108, b: 227, a: 255 },
};

export default function ColorPicker() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const magnifierRef = useRef(null);
  const previewViewportRef = useRef(null);
  const imageUrlRef = useRef("");

  const [imageData, setImageData] = useState(null);
  const [imageElement, setImageElement] = useState(null);

  const [pickedColor, setPickedColor] = useState(DEFAULT_COLOR.hex);
  const [pickedRgb, setPickedRgb] = useState(DEFAULT_COLOR.rgb);

  const [previewColor, setPreviewColor] = useState(DEFAULT_COLOR.hex);
  const [previewRgb, setPreviewRgb] = useState(DEFAULT_COLOR.rgb);

  const [savedColors, setSavedColors] = useState([]);

  const [copiedFormat, setCopiedFormat] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [imageZoom, setImageZoom] = useState(1);
  const [canvasDisplaySize, setCanvasDisplaySize] = useState({ width: 0, height: 0 });
  const [magnifierPosition, setMagnifierPosition] = useState({
    left: 0,
    top: 0,
    visible: false,
  });

  const [pickedPoint, setPickedPoint] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasImage = Boolean(imageData && imageElement);

  const pickedTextColor = useMemo(() => {
    return getReadableTextColor(pickedRgb.r, pickedRgb.g, pickedRgb.b);
  }, [pickedRgb]);

  const previewTextColor = useMemo(() => {
    return getReadableTextColor(previewRgb.r, previewRgb.g, previewRgb.b);
  }, [previewRgb]);

  const handleImageFile = useCallback(async (file) => {
    setError("");
    setSuccess("");
    setCopiedFormat("");
    setPickedPoint(null);
    setImageZoom(1);
    setMagnifierPosition((current) => ({ ...current, visible: false }));

    const validationError = validateImageFile(file);

    if (validationError) {
      setError(validationError);
      resetFileInput();
      return;
    }

    setIsLoading(true);

    try {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(file);
      imageUrlRef.current = objectUrl;

      const loadedImage = await loadImage(objectUrl);

      setImageElement(loadedImage);
      setImageData({
        name: file.name,
        size: file.size,
        type: file.type || "image",
        url: objectUrl,
        naturalWidth: loadedImage.naturalWidth || loadedImage.width,
        naturalHeight: loadedImage.naturalHeight || loadedImage.height,
      });

      setSuccess(
        "Image loaded successfully. Move over the image to preview colors, then click to pick and copy."
      );
    } catch {
      setError("Failed to load this image. Please try another file.");

      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = "";
      }

      setImageData(null);
      setImageElement(null);
    } finally {
      setIsLoading(false);
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

  const updateCanvasDisplaySize = useCallback(() => {
    const canvas = canvasRef.current;
    const viewport = previewViewportRef.current;

    if (!canvas || !viewport || !canvas.width || !canvas.height) return;

    const availableWidth = Math.max(180, viewport.clientWidth - 32);
    const availableHeight = 520;
    const fitScale = Math.min(
      1,
      availableWidth / canvas.width,
      availableHeight / canvas.height
    );

    setCanvasDisplaySize({
      width: Math.max(1, Math.round(canvas.width * fitScale)),
      height: Math.max(1, Math.round(canvas.height * fitScale)),
    });
  }, []);

  useEffect(() => {
    const viewport = previewViewportRef.current;

    if (typeof ResizeObserver === "undefined" || !viewport) {
      window.addEventListener("resize", updateCanvasDisplaySize);
      return () => window.removeEventListener("resize", updateCanvasDisplaySize);
    }

    const observer = new ResizeObserver(updateCanvasDisplaySize);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [hasImage, updateCanvasDisplaySize]);

  useEffect(() => {
    if (!imageElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!ctx) {
      setError("Canvas is not supported in this browser.");
      return;
    }

    const naturalWidth = imageElement.naturalWidth || imageElement.width;
    const naturalHeight = imageElement.naturalHeight || imageElement.height;

    const scaleRatio = Math.min(
      1,
      MAX_CANVAS_LONG_SIDE / Math.max(naturalWidth, naturalHeight)
    );

    const canvasWidth = Math.max(1, Math.round(naturalWidth * scaleRatio));
    const canvasHeight = Math.max(1, Math.round(naturalHeight * scaleRatio));

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(imageElement, 0, 0, canvasWidth, canvasHeight);

    window.requestAnimationFrame(updateCanvasDisplaySize);
  }, [imageElement, updateCanvasDisplaySize]);

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function setPickedColorFromRgba(r, g, b, a = 255) {
    const hex = rgbToHex(r, g, b).toUpperCase();

    setPickedColor(hex);
    setPickedRgb({ r, g, b, a });

    return hex;
  }

  function setPreviewColorFromRgba(r, g, b, a = 255) {
    const hex = rgbToHex(r, g, b).toUpperCase();

    setPreviewColor(hex);
    setPreviewRgb({ r, g, b, a });

    return hex;
  }

  function handleFileInputChange(event) {
    const file = event.target.files?.[0];

    if (file) {
      handleImageFile(file);
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleImageFile(file);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function getCanvasPoint(event) {
    const canvas = canvasRef.current;

    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return null;

    const x = Math.floor(
      ((event.clientX - rect.left) / rect.width) * canvas.width
    );

    const y = Math.floor(
      ((event.clientY - rect.top) / rect.height) * canvas.height
    );

    return {
      x: clampNumber(x, 0, canvas.width - 1),
      y: clampNumber(y, 0, canvas.height - 1),
    };
  }

  function readColorAtPoint(point) {
    const canvas = canvasRef.current;

    if (!canvas || !point) return null;

    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!ctx) return null;

    const pixel = ctx.getImageData(point.x, point.y, 1, 1).data;

    return {
      r: pixel[0],
      g: pixel[1],
      b: pixel[2],
      a: pixel[3],
    };
  }

  function handlePointerMove(event) {
    if (!hasImage) return;

    const point = getCanvasPoint(event);
    const nextColor = readColorAtPoint(point);

    if (!point || !nextColor) return;

    setPreviewColorFromRgba(
      nextColor.r,
      nextColor.g,
      nextColor.b,
      nextColor.a
    );

    drawMagnifier(point);

    const nextPosition = getMagnifierPosition(event.clientX, event.clientY);

    setMagnifierPosition({
      ...nextPosition,
      visible: true,
    });
  }

  function handlePointerLeave() {
    setMagnifierPosition((current) => ({
      ...current,
      visible: false,
    }));
  }

  async function handlePickColor(event) {
    if (!hasImage) return;

    event.preventDefault();

    const point = getCanvasPoint(event);
    const nextColor = readColorAtPoint(point);

    if (!point || !nextColor) return;

    const nextHex = setPickedColorFromRgba(
      nextColor.r,
      nextColor.g,
      nextColor.b,
      nextColor.a
    );

    setPreviewColorFromRgba(
      nextColor.r,
      nextColor.g,
      nextColor.b,
      nextColor.a
    );

    setPickedPoint(point);
    addSavedColor(nextHex);

    try {
      await copyToClipboard(nextHex);

      setCopiedFormat("hex");
      setError("");
      setSuccess(`${nextHex} picked and copied to clipboard.`);

      window.setTimeout(() => {
        setCopiedFormat("");
      }, 1600);
    } catch {
      setError("");
      setSuccess(`${nextHex} picked. Copy failed, please copy manually.`);
    }
  }

  function drawMagnifier(point) {
    const canvas = canvasRef.current;
    const magnifier = magnifierRef.current;

    if (!canvas || !magnifier || !point) return;

    const mtx = magnifier.getContext("2d");

    if (!mtx) return;

    const sampleSize = Math.max(8, Math.floor(MAGNIFIER_SIZE / MAGNIFIER_ZOOM));
    const sx = clampNumber(point.x - sampleSize / 2, 0, canvas.width - sampleSize);
    const sy = clampNumber(point.y - sampleSize / 2, 0, canvas.height - sampleSize);

    mtx.clearRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE);
    mtx.imageSmoothingEnabled = false;

    mtx.drawImage(
      canvas,
      sx,
      sy,
      sampleSize,
      sampleSize,
      0,
      0,
      MAGNIFIER_SIZE,
      MAGNIFIER_SIZE
    );

    drawMagnifierCrosshair(mtx, MAGNIFIER_SIZE);
  }

  function getMagnifierPosition(clientX, clientY) {
    let left = clientX + 22;
    let top = clientY + 22;

    if (left + MAGNIFIER_SIZE > window.innerWidth) {
      left = clientX - MAGNIFIER_SIZE - 22;
    }

    if (top + MAGNIFIER_SIZE > window.innerHeight) {
      top = clientY - MAGNIFIER_SIZE - 22;
    }

    return { left, top };
  }

  function addSavedColor(hexValue) {
    setSavedColors((currentColors) => {
      const cleanHex = hexValue.toUpperCase();
      const withoutDuplicate = currentColors.filter((item) => item !== cleanHex);

      return [cleanHex, ...withoutDuplicate].slice(0, 12);
    });
  }

  async function handleSavedColorSelect(hexValue) {
    const nextHex = hexValue.toUpperCase();
    const nextRgb = hexToRgb(nextHex);

    setPickedColorFromRgba(nextRgb.r, nextRgb.g, nextRgb.b, 255);
    setPreviewColorFromRgba(nextRgb.r, nextRgb.g, nextRgb.b, 255);
    addSavedColor(nextHex);

    try {
      await copyToClipboard(nextHex);

      setCopiedFormat("hex");
      setError("");
      setSuccess(`${nextHex} selected and copied to clipboard.`);

      window.setTimeout(() => {
        setCopiedFormat("");
      }, 1600);
    } catch {
      setSuccess(`${nextHex} selected. Copy failed, please copy manually.`);
    }
  }

  async function copyText(text, format = "hex", successLabel = "HEX") {
    try {
      await copyToClipboard(text);

      setCopiedFormat(format);
      setError("");
      setSuccess(`${successLabel} copied successfully.`);

      window.setTimeout(() => {
        setCopiedFormat("");
      }, 1600);
    } catch {
      setError("Copy failed. Please copy the color code manually.");
    }
  }

  async function copySavedColor(hexValue) {
    const nextHex = hexValue.toUpperCase();
    await copyText(nextHex, `saved:${nextHex}`, nextHex);
  }

  function clearSavedColors() {
    setSavedColors([]);
    setSuccess("");
    setError("");
  }

  function updateImageZoom(nextValue) {
    const nextZoom = clampNumber(Number(nextValue), 0.5, 4);
    setImageZoom(nextZoom);
  }

  function resetImageZoom() {
    setImageZoom(1);

    window.requestAnimationFrame(() => {
      const viewport = previewViewportRef.current;
      if (!viewport) return;
      viewport.scrollTo({ left: 0, top: 0, behavior: "smooth" });
    });
  }

  function resetTool() {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = "";
    }

    setImageData(null);
    setImageElement(null);

    setPickedColor(DEFAULT_COLOR.hex);
    setPickedRgb(DEFAULT_COLOR.rgb);
    setPreviewColor(DEFAULT_COLOR.hex);
    setPreviewRgb(DEFAULT_COLOR.rgb);

    setSavedColors([]);
    setCopiedFormat("");

    setIsDragging(false);
    setIsLoading(false);
    setImageZoom(1);
    setCanvasDisplaySize({ width: 0, height: 0 });
    setMagnifierPosition({
      left: 0,
      top: 0,
      visible: false,
    });
    setPickedPoint(null);

    setError("");
    setSuccess("");

    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
    }

    const magnifier = magnifierRef.current;

    if (magnifier) {
      const mtx = magnifier.getContext("2d");
      mtx?.clearRect(0, 0, magnifier.width, magnifier.height);
    }

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

      <style>{`
        .color-picker-image-viewport {
          scrollbar-width: thin;
          scrollbar-color: #9b6ce3 #eee7fb;
          scroll-behavior: smooth;
        }

        .color-picker-image-viewport::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        .color-picker-image-viewport::-webkit-scrollbar-track {
          background: #eee7fb;
          border-radius: 999px;
        }

        .color-picker-image-viewport::-webkit-scrollbar-thumb {
          background: #9b6ce3;
          border: 2px solid #eee7fb;
          border-radius: 999px;
        }
      `}</style>

      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Pipette size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Color Picker</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Pick precise HEX colors from images. Zoom in for pixel-level accuracy,
          move over the image to preview, then click to save and copy the color.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-[1.35fr_0.85fr] gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* UPLOAD AREA */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={openFilePicker}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                isDragging
                  ? "border-[var(--primary)] bg-[#f4edff]"
                  : "border-[var(--border)] hover:bg-[#f8f4ff]"
              }`}
            >
              {isLoading ? (
                <div className="w-10 h-10 rounded-full border-4 border-[var(--border)] border-t-[var(--primary)] animate-spin mx-auto mb-4" />
              ) : (
                <Upload size={38} className="mx-auto mb-4 text-[var(--primary)]" />
              )}

              <h2 className="text-xl font-semibold mb-2">
                Choose image or drop image here
              </h2>

              <p className="text-sm text-[var(--text-secondary)]">
                Supports JPG, PNG, WEBP, GIF, BMP. You can also paste an image
                with <strong>Ctrl + V</strong>. Max file size:{" "}
                <strong>{MAX_FILE_SIZE_MB} MB</strong>.
              </p>
            </div>

            {/* FEEDBACK */}
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

            {/* CANVAS PREVIEW */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-semibold">Image Preview</h2>
                  </div>

                  {hasImage && (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-2 py-1.5 shadow-sm">
                        <button
                          type="button"
                          onClick={() => updateImageZoom(imageZoom - 0.1)}
                          disabled={imageZoom <= 0.5}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[#f4edff] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-35"
                          title="Zoom out"
                          aria-label="Zoom out"
                        >
                          <ZoomOut size={16} />
                        </button>

                        <input
                          type="range"
                          min="50"
                          max="400"
                          step="10"
                          value={Math.round(imageZoom * 100)}
                          onChange={(event) => updateImageZoom(Number(event.target.value) / 100)}
                          className="w-24 sm:w-32 accent-[var(--primary)]"
                          aria-label="Image zoom"
                        />

                        <span className="w-12 text-center text-xs font-bold text-[var(--primary)]">
                          {Math.round(imageZoom * 100)}%
                        </span>

                        <button
                          type="button"
                          onClick={() => updateImageZoom(imageZoom + 0.1)}
                          disabled={imageZoom >= 4}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[#f4edff] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-35"
                          title="Zoom in"
                          aria-label="Zoom in"
                        >
                          <ZoomIn size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={resetImageZoom}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[#f4edff] hover:text-[var(--primary)]"
                          title="Fit image"
                          aria-label="Fit image"
                        >
                          <Maximize2 size={16} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={openFilePicker}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] transition hover:border-[var(--primary)] hover:bg-[#f8f4ff] hover:text-[var(--primary)]"
                        title="Upload new image"
                        aria-label="Upload new image"
                      >
                        <Upload size={17} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div
                ref={previewViewportRef}
                className="color-picker-image-viewport bg-gray-50 border border-[var(--border)] rounded-2xl min-h-[360px] max-h-[620px] overflow-auto p-4"
              >
                {hasImage ? (
                  <div className="w-max min-w-full min-h-[328px] flex items-center justify-center">
                    <div
                      className="relative shrink-0 transition-[width,height] duration-200 ease-out"
                      style={{
                        width: `${Math.max(1, canvasDisplaySize.width * imageZoom)}px`,
                        height: `${Math.max(1, canvasDisplaySize.height * imageZoom)}px`,
                      }}
                    >
                      <canvas
                        ref={canvasRef}
                        onPointerMove={handlePointerMove}
                        onPointerLeave={handlePointerLeave}
                        onPointerDown={handlePickColor}
                        className="block h-full w-full rounded-xl border border-[var(--border)] shadow-sm cursor-crosshair bg-white touch-none"
                      />

                      {pickedPoint && (
                        <div
                          className="absolute w-4 h-4 rounded-full border-2 border-white shadow pointer-events-none"
                          style={{
                            left: `calc(${(pickedPoint.x / (canvasRef.current?.width || 1)) * 100}% - 8px)`,
                            top: `calc(${(pickedPoint.y / (canvasRef.current?.height || 1)) * 100}% - 8px)`,
                            backgroundColor: pickedColor,
                          }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[328px] flex items-center justify-center text-center">
                    <div>
                      <ImageIcon size={54} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-[var(--text-secondary)]">
                        Upload an image to start picking colors.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {hasImage && (
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-xl p-3">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">
                      Image
                    </p>
                    <p
                      className="font-semibold text-sm truncate"
                      title={imageData.name}
                    >
                      {imageData.name}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {imageData.naturalWidth} × {imageData.naturalHeight}px •{" "}
                      {formatBytes(imageData.size)}
                    </p>
                  </div>

                  <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-xl p-3">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">
                      How to use
                    </p>
                    <p className="font-semibold text-sm">
                      Move over image to preview • Click to pick and copy
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Hover preview changes while moving. Picked color changes
                      only after click/tap.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SAVED COLORS */}
            {savedColors.length > 0 && (
              <div className="border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-[var(--primary)]" />
                    <h3 className="font-semibold">Saved Picked Colors</h3>
                  </div>

                  <button
                    type="button"
                    onClick={clearSavedColors}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50"
                    title="Clear saved colors"
                    aria-label="Clear saved colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {savedColors.map((savedColor) => {
                    const savedCopyKey = `saved:${savedColor}`;
                    const savedCopied = copiedFormat === savedCopyKey;

                    return (
                      <div
                        key={savedColor}
                        className="group relative rounded-2xl border border-[var(--border)] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md"
                      >
                        <button
                          type="button"
                          onClick={() => handleSavedColorSelect(savedColor)}
                          className="w-full p-2 text-left"
                          title={`Select ${savedColor}`}
                        >
                          <span
                            className="block h-12 rounded-xl border border-black/10"
                            style={{ backgroundColor: savedColor }}
                          />
                          <span className="block text-[10px] mt-2 font-mono text-center">
                            {savedColor}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            copySavedColor(savedColor);
                          }}
                          className={`absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/70 bg-white/95 shadow transition duration-200 focus:opacity-100 ${
                            savedCopied
                              ? "opacity-100 text-green-600"
                              : "opacity-0 text-[var(--text-secondary)] group-hover:opacity-100 hover:text-[var(--primary)]"
                          }`}
                          title={`Copy ${savedColor}`}
                          aria-label={`Copy ${savedColor}`}
                        >
                          {savedCopied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* HOVER PREVIEW */}
            {hasImage && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Eye size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-semibold">Hover Preview</h2>
                </div>

                <div
                  className="rounded-2xl border border-[var(--border)] p-5 min-h-[135px] flex items-center justify-center text-center shadow-sm"
                  style={{
                    backgroundColor: previewColor,
                    color: previewTextColor,
                  }}
                >
                  <div>
                    <p className="text-2xl font-bold font-mono">
                      {previewColor.toUpperCase()}
                    </p>
                    <p className="text-sm mt-2 opacity-90">
                      Move over image to preview. Click to copy.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PICKED COLOR */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pipette size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Picked Color</h2>
              </div>

              <div
                className="rounded-2xl border border-[var(--border)] p-6 min-h-[220px] flex items-center justify-center text-center shadow-sm"
                style={{
                  backgroundColor: pickedColor,
                  color: pickedTextColor,
                }}
              >
                <div>
                  <p className="text-3xl font-bold font-mono">
                    {pickedColor.toUpperCase()}
                  </p>
                  <p className="text-sm mt-2 opacity-90">
                    Copy the HEX value below when you are ready.
                  </p>
                </div>
              </div>
            </div>

            {/* COPY VALUE */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Copy size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Color Code</h3>
              </div>

              <ColorCodeRow
                label="HEX"
                value={pickedColor.toUpperCase()}
                copied={copiedFormat === "hex"}
                onCopy={() => copyText(pickedColor.toUpperCase(), "hex", "HEX")}
              />
            </div>

            {/* ACTIONS */}
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={openFilePicker}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                Upload Image
              </button>

              <button
                type="button"
                onClick={resetTool}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>
          </div>
        </div>

        <canvas
          ref={magnifierRef}
          width={MAGNIFIER_SIZE}
          height={MAGNIFIER_SIZE}
          className="fixed rounded-full border-4 border-white pointer-events-none z-50 shadow-2xl bg-white"
          style={{
            display:
              magnifierPosition.visible && hasImage ? "block" : "none",
            left: magnifierPosition.left,
            top: magnifierPosition.top,
            width: MAGNIFIER_SIZE,
            height: MAGNIFIER_SIZE,
          }}
        />
      </section>

      <SuggestedTools currentToolId="color-picker" />
    </div>
  );
}

function ColorCodeRow({ label, value, copied, onCopy }) {
  return (
    <div className="bg-gray-50 border border-[var(--border)] rounded-xl p-3">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>

      <div className="flex items-center justify-between gap-2">
        <code className="font-mono font-semibold text-sm break-all">{value}</code>

        <button
          type="button"
          onClick={onCopy}
          className={`p-2 rounded-lg transition shrink-0 ${
            copied
              ? "bg-green-500 text-white"
              : "bg-white border border-[var(--border)] hover:bg-gray-100"
          }`}
          title={`Copy ${label}`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
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
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function drawMagnifierCrosshair(ctx, size) {
  const center = Math.floor(size / 2);

  ctx.save();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(center, 0);
  ctx.lineTo(center, size);
  ctx.moveTo(0, center);
  ctx.lineTo(size, center);
  ctx.stroke();

  ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(center, 0);
  ctx.lineTo(center, size);
  ctx.moveTo(0, center);
  ctx.lineTo(size, center);
  ctx.stroke();

  ctx.beginPath();
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.arc(center, center, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.arc(center, center, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((value) => {
        const hex = clampNumber(value, 0, 255).toString(16);
        return hex.length === 1 ? `0${hex}` : hex;
      })
      .join("")
  );
}

function hexToRgb(hex) {
  const cleanHex = String(hex || "#000000").replace("#", "");

  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((char) => char + char)
          .join("")
      : cleanHex.padEnd(6, "0").slice(0, 6);

  return {
    r: parseInt(fullHex.slice(0, 2), 16),
    g: parseInt(fullHex.slice(2, 4), 16),
    b: parseInt(fullHex.slice(4, 6), 16),
  };
}

function getReadableTextColor(r, g, b) {
  const luminance = getRelativeLuminance({ r, g, b });

  return luminance > 0.45 ? "#111827" : "#ffffff";
}

function getRelativeLuminance({ r, g, b }) {
  const values = [r, g, b].map((value) => {
    const channel = value / 255;

    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
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

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const successful = document.execCommand("copy");

  document.body.removeChild(textarea);

  if (!successful) {
    throw new Error("Copy failed.");
  }
}