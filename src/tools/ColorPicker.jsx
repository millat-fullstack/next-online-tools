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
  Palette,
  SlidersHorizontal,
  MousePointer2,
  Sparkles,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Color Picker",
  path: "/tool/color-picker",
  category: "Design Tools",
  description:
    "Pick colors from images with precision. Get HEX, RGB, RGBA, HSL, and CMYK values instantly.",
  metaTitle: "Color Picker Tool - Pick Colors from Images | Next Online Tools",
  metaDescription:
    "Pick colors from images online. Upload, paste, or drop an image and get HEX, RGB, RGBA, HSL, and CMYK color codes instantly. Perfect for designers, developers, and creators.",
};

const MAX_FILE_SIZE_MB = 12;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_CANVAS_LONG_SIDE = 2400;
const MAGNIFIER_SIZE = 220;

const DEFAULT_COLOR = {
  hex: "#9B6CE3",
  rgb: { r: 155, g: 108, b: 227, a: 255 },
};

export default function ColorPicker() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const magnifierRef = useRef(null);
  const imageUrlRef = useRef("");

  const [imageData, setImageData] = useState(null);
  const [imageElement, setImageElement] = useState(null);

  const [color, setColor] = useState(DEFAULT_COLOR.hex);
  const [rgb, setRgb] = useState(DEFAULT_COLOR.rgb);

  const [paletteColors, setPaletteColors] = useState([]);
  const [savedColors, setSavedColors] = useState([]);

  const [copiedFormat, setCopiedFormat] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMagnifier, setShowMagnifier] = useState(true);
  const [magnifierPosition, setMagnifierPosition] = useState({
    left: 0,
    top: 0,
    visible: false,
  });

  const [zoomLevel, setZoomLevel] = useState(14);
  const [pickedPoint, setPickedPoint] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hsl = useMemo(() => {
    return rgbToHsl(rgb.r, rgb.g, rgb.b);
  }, [rgb]);

  const cmyk = useMemo(() => {
    return rgbToCmyk(rgb.r, rgb.g, rgb.b);
  }, [rgb]);

  const rgbaText = useMemo(() => {
    const alpha = Number((rgb.a / 255).toFixed(2));
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }, [rgb]);

  const rgbText = useMemo(() => {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }, [rgb]);

  const hslText = useMemo(() => {
    return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  }, [hsl]);

  const cmykText = useMemo(() => {
    return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
  }, [cmyk]);

  const readableTextColor = useMemo(() => {
    return getReadableTextColor(rgb.r, rgb.g, rgb.b);
  }, [rgb]);

  const contrastSuggestion = useMemo(() => {
    const blackRatio = getContrastRatio(
      { r: rgb.r, g: rgb.g, b: rgb.b },
      { r: 0, g: 0, b: 0 }
    );
    const whiteRatio = getContrastRatio(
      { r: rgb.r, g: rgb.g, b: rgb.b },
      { r: 255, g: 255, b: 255 }
    );

    return whiteRatio >= blackRatio
      ? {
          label: "White text works better",
          color: "#ffffff",
          ratio: whiteRatio,
        }
      : {
          label: "Black text works better",
          color: "#000000",
          ratio: blackRatio,
        };
  }, [rgb]);

  const hasImage = Boolean(imageData && imageElement);

  const handleImageFile = useCallback(async (file) => {
    setError("");
    setSuccess("");
    setCopiedFormat("");
    setPickedPoint(null);
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

      setSuccess("Image loaded successfully. Hover over the image and click to pick a color.");
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

    const extractedPalette = extractPalette(ctx, canvasWidth, canvasHeight);
    setPaletteColors(extractedPalette);

    const centerPixel = ctx.getImageData(
      Math.floor(canvasWidth / 2),
      Math.floor(canvasHeight / 2),
      1,
      1
    ).data;

    updateCurrentColor(centerPixel[0], centerPixel[1], centerPixel[2], centerPixel[3]);
  }, [imageElement]);

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function updateCurrentColor(r, g, b, a = 255) {
    const hex = rgbToHex(r, g, b);

    setColor(hex);
    setRgb({
      r,
      g,
      b,
      a,
    });
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

    const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height);

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

    updateCurrentColor(nextColor.r, nextColor.g, nextColor.b, nextColor.a);

    if (showMagnifier) {
      drawMagnifier(point);

      const nextPosition = getMagnifierPosition(event.clientX, event.clientY);

      setMagnifierPosition({
        ...nextPosition,
        visible: true,
      });
    }
  }

  function handlePointerLeave() {
    setMagnifierPosition((current) => ({
      ...current,
      visible: false,
    }));
  }

  function handlePickColor(event) {
    if (!hasImage) return;

    const point = getCanvasPoint(event);
    const nextColor = readColorAtPoint(point);

    if (!point || !nextColor) return;

    const nextHex = rgbToHex(nextColor.r, nextColor.g, nextColor.b);

    updateCurrentColor(nextColor.r, nextColor.g, nextColor.b, nextColor.a);
    setPickedPoint(point);
    addSavedColor(nextHex);
    setSuccess(`${nextHex.toUpperCase()} picked from image.`);
  }

  function drawMagnifier(point) {
    const canvas = canvasRef.current;
    const magnifier = magnifierRef.current;

    if (!canvas || !magnifier || !point) return;

    const mtx = magnifier.getContext("2d");

    if (!mtx) return;

    const sampleSize = Math.max(8, Math.floor(MAGNIFIER_SIZE / zoomLevel));
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

    return {
      left,
      top,
    };
  }

  function addSavedColor(hexValue) {
    setSavedColors((currentColors) => {
      const cleanHex = hexValue.toUpperCase();
      const withoutDuplicate = currentColors.filter((item) => item !== cleanHex);

      return [cleanHex, ...withoutDuplicate].slice(0, 12);
    });
  }

  function handlePaletteColorClick(hexValue) {
    const nextRgb = hexToRgb(hexValue);

    updateCurrentColor(nextRgb.r, nextRgb.g, nextRgb.b, 255);
    addSavedColor(hexValue);
    setSuccess(`${hexValue.toUpperCase()} selected from palette.`);
  }

  async function copyText(text, format) {
    try {
      await copyToClipboard(text);

      setCopiedFormat(format);
      setError("");
      setSuccess(`${format.toUpperCase()} copied successfully.`);

      window.setTimeout(() => {
        setCopiedFormat("");
      }, 1600);
    } catch {
      setError("Copy failed. Please copy the color code manually.");
    }
  }

  async function copyAllFormats() {
    const text = [
      `HEX: ${color.toUpperCase()}`,
      `RGB: ${rgbText}`,
      `RGBA: ${rgbaText}`,
      `HSL: ${hslText}`,
      `CMYK: ${cmykText}`,
    ].join("\n");

    await copyText(text, "all");
  }

  async function useNativeEyeDropper() {
    setError("");
    setSuccess("");

    if (!("EyeDropper" in window)) {
      setError("Your browser does not support the native EyeDropper API yet.");
      return;
    }

    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      const nextRgb = hexToRgb(result.sRGBHex);

      updateCurrentColor(nextRgb.r, nextRgb.g, nextRgb.b, 255);
      addSavedColor(result.sRGBHex);
      setSuccess(`${result.sRGBHex.toUpperCase()} picked with browser eyedropper.`);
    } catch {
      setError("EyeDropper was cancelled or could not pick a color.");
    }
  }

  function clearSavedColors() {
    setSavedColors([]);
    setSuccess("");
    setError("");
  }

  function resetTool() {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = "";
    }

    setImageData(null);
    setImageElement(null);

    setColor(DEFAULT_COLOR.hex);
    setRgb(DEFAULT_COLOR.rgb);

    setPaletteColors([]);
    setSavedColors([]);
    setCopiedFormat("");

    setIsDragging(false);
    setIsLoading(false);
    setShowMagnifier(true);
    setMagnifierPosition({
      left: 0,
      top: 0,
      visible: false,
    });
    setZoomLevel(14);
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

      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Pipette size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Color Picker</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Pick colors directly from images with precision. Upload, paste, or
          drag and drop an image to get HEX, RGB, RGBA, HSL, and CMYK color
          values instantly.
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <ImageIcon size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-semibold">Image Preview</h2>
                </div>

                {hasImage && (
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="btn-secondary inline-flex items-center justify-center gap-2"
                  >
                    <Upload size={16} />
                    Upload New
                  </button>
                )}
              </div>

              <div className="bg-gray-50 border border-[var(--border)] rounded-2xl min-h-[360px] flex items-center justify-center overflow-hidden p-4 checkerboard-bg">
                {hasImage ? (
                  <div className="relative max-w-full">
                    <canvas
                      ref={canvasRef}
                      onPointerMove={handlePointerMove}
                      onPointerLeave={handlePointerLeave}
                      onPointerDown={handlePickColor}
                      className="max-w-full max-h-[520px] rounded-xl border border-[var(--border)] shadow-sm cursor-crosshair bg-white touch-none"
                    />

                    {pickedPoint && (
                      <div
                        className="absolute w-4 h-4 rounded-full border-2 border-white shadow pointer-events-none"
                        style={{
                          left: `calc(${(pickedPoint.x / (canvasRef.current?.width || 1)) * 100}% - 8px)`,
                          top: `calc(${(pickedPoint.y / (canvasRef.current?.height || 1)) * 100}% - 8px)`,
                          backgroundColor: color,
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon size={54} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-[var(--text-secondary)]">
                      Upload an image to start picking colors.
                    </p>
                  </div>
                )}
              </div>

              {hasImage && (
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-xl p-3">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">
                      Image
                    </p>
                    <p className="font-semibold text-sm truncate" title={imageData.name}>
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
                      Hover to preview • Click to save color
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Works with mouse, touchpad, and pointer devices.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SETTINGS */}
            {hasImage && (
              <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersHorizontal size={20} className="text-[var(--primary)]" />
                  <h3 className="font-semibold">Picker Settings</h3>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="flex items-center justify-between gap-3 bg-white border border-[var(--border)] rounded-xl p-4 cursor-pointer">
                    <span className="font-semibold text-sm">Show Magnifier</span>
                    <input
                      type="checkbox"
                      checked={showMagnifier}
                      onChange={(event) => setShowMagnifier(event.target.checked)}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                  </label>

                  <div className="bg-white border border-[var(--border)] rounded-xl p-4">
                    <div className="flex justify-between gap-3 mb-2">
                      <span className="font-semibold text-sm">
                        Magnifier Zoom
                      </span>
                      <span className="text-sm text-[var(--primary)] font-semibold">
                        {zoomLevel}×
                      </span>
                    </div>

                    <input
                      type="range"
                      min="8"
                      max="24"
                      step="1"
                      value={zoomLevel}
                      onChange={(event) => setZoomLevel(Number(event.target.value))}
                      className="w-full accent-[var(--primary)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PALETTE */}
            {paletteColors.length > 0 && (
              <div className="border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Palette size={20} className="text-[var(--primary)]" />
                  <h3 className="font-semibold">Detected Image Palette</h3>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                  {paletteColors.map((paletteColor) => (
                    <button
                      key={paletteColor}
                      type="button"
                      onClick={() => handlePaletteColorClick(paletteColor)}
                      className="group rounded-2xl border border-[var(--border)] bg-white p-2 hover:border-[var(--primary)] transition"
                      title={`Select ${paletteColor}`}
                    >
                      <span
                        className="block h-12 rounded-xl border border-black/10"
                        style={{ backgroundColor: paletteColor }}
                      />
                      <span className="block text-[10px] mt-2 font-mono truncate">
                        {paletteColor}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                    className="text-sm font-semibold text-red-600 inline-flex items-center gap-1"
                  >
                    <Trash2 size={15} />
                    Clear
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {savedColors.map((savedColor) => (
                    <button
                      key={savedColor}
                      type="button"
                      onClick={() => handlePaletteColorClick(savedColor)}
                      className="rounded-2xl border border-[var(--border)] bg-white p-2 hover:border-[var(--primary)] transition"
                    >
                      <span
                        className="block h-12 rounded-xl border border-black/10"
                        style={{ backgroundColor: savedColor }}
                      />
                      <span className="block text-[10px] mt-2 font-mono">
                        {savedColor}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* COLOR PREVIEW */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pipette size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Picked Color</h2>
              </div>

              <div
                className="rounded-2xl border border-[var(--border)] p-6 min-h-[220px] flex items-center justify-center text-center shadow-sm"
                style={{
                  backgroundColor: color,
                  color: readableTextColor,
                }}
              >
                <div>
                  <p className="text-3xl font-bold font-mono">
                    {color.toUpperCase()}
                  </p>
                  <p className="text-sm mt-2 opacity-90">{rgbText}</p>
                  <p className="text-sm mt-1 opacity-90">
                    {contrastSuggestion.label}
                  </p>
                </div>
              </div>
            </div>

            {/* COPY VALUES */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Copy size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Color Codes</h3>
              </div>

              <div className="flex flex-col gap-3">
                <ColorCodeRow
                  label="HEX"
                  value={color.toUpperCase()}
                  copied={copiedFormat === "hex"}
                  onCopy={() => copyText(color.toUpperCase(), "hex")}
                />

                <ColorCodeRow
                  label="RGB"
                  value={rgbText}
                  copied={copiedFormat === "rgb"}
                  onCopy={() => copyText(rgbText, "rgb")}
                />

                <ColorCodeRow
                  label="RGBA"
                  value={rgbaText}
                  copied={copiedFormat === "rgba"}
                  onCopy={() => copyText(rgbaText, "rgba")}
                />

                <ColorCodeRow
                  label="HSL"
                  value={hslText}
                  copied={copiedFormat === "hsl"}
                  onCopy={() => copyText(hslText, "hsl")}
                />

                <ColorCodeRow
                  label="CMYK"
                  value={cmykText}
                  copied={copiedFormat === "cmyk"}
                  onCopy={() => copyText(cmykText, "cmyk")}
                />
              </div>

              <button
                type="button"
                onClick={copyAllFormats}
                className="btn-primary w-full mt-4 inline-flex items-center justify-center gap-2"
              >
                {copiedFormat === "all" ? <Check size={18} /> : <Copy size={18} />}
                {copiedFormat === "all" ? "Copied" : "Copy All Formats"}
              </button>
            </div>

            {/* CHANNEL VALUES */}
            <div className="grid grid-cols-4 gap-3">
              <ChannelCard label="R" value={rgb.r} className="text-red-600 bg-red-50" />
              <ChannelCard
                label="G"
                value={rgb.g}
                className="text-green-600 bg-green-50"
              />
              <ChannelCard
                label="B"
                value={rgb.b}
                className="text-blue-600 bg-blue-50"
              />
              <ChannelCard
                label="A"
                value={rgb.a}
                className="text-gray-700 bg-gray-50"
              />
            </div>

            {/* NATIVE EYEDROPPER */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Eye size={20} className="text-blue-700 shrink-0 mt-0.5" />

                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Browser Eyedropper
                  </h3>

                  <p className="text-sm text-blue-800 mb-4">
                    On supported browsers, you can pick a color from anywhere on
                    your screen.
                  </p>

                  <button
                    type="button"
                    onClick={useNativeEyeDropper}
                    className="btn-secondary inline-flex items-center justify-center gap-2 bg-white"
                  >
                    <Pipette size={16} />
                    Use Browser Eyedropper
                  </button>
                </div>
              </div>
            </div>

            {/* CONTRAST */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <MousePointer2 size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Readability Suggestion</h3>
              </div>

              <div
                className="rounded-xl p-4 border border-[var(--border)]"
                style={{
                  backgroundColor: color,
                  color: contrastSuggestion.color,
                }}
              >
                <p className="font-bold">Sample Text Preview</p>
                <p className="text-sm mt-1">
                  Contrast ratio: {contrastSuggestion.ratio.toFixed(2)}
                </p>
              </div>
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
              showMagnifier && magnifierPosition.visible && hasImage
                ? "block"
                : "none",
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

function ChannelCard({ label, value, className }) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] p-4 text-center ${className}`}>
      <p className="text-xs font-semibold opacity-80">{label}</p>
      <p className="text-xl font-bold">{value}</p>
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

function extractPalette(ctx, width, height) {
  try {
    const colorMap = new Map();
    const sampleTarget = 7000;
    const step = Math.max(1, Math.ceil(Math.sqrt((width * height) / sampleTarget)));

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const alpha = pixel[3];

        if (alpha < 40) continue;

        const r = Math.round(pixel[0] / 32) * 32;
        const g = Math.round(pixel[1] / 32) * 32;
        const b = Math.round(pixel[2] / 32) * 32;

        const safeR = clampNumber(r, 0, 255);
        const safeG = clampNumber(g, 0, 255);
        const safeB = clampNumber(b, 0, 255);

        const hex = rgbToHex(safeR, safeG, safeB).toUpperCase();

        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }
    }

    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([hex]) => hex)
      .slice(0, 12);
  } catch {
    return [];
  }
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

function rgbToHsl(r, g, b) {
  let nextR = r / 255;
  let nextG = g / 255;
  let nextB = b / 255;

  const max = Math.max(nextR, nextG, nextB);
  const min = Math.min(nextR, nextG, nextB);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;

    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case nextR:
        h = (nextG - nextB) / d + (nextG < nextB ? 6 : 0);
        break;
      case nextG:
        h = (nextB - nextR) / d + 2;
        break;
      case nextB:
        h = (nextR - nextG) / d + 4;
        break;
      default:
        h = 0;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function rgbToCmyk(r, g, b) {
  const nextR = r / 255;
  const nextG = g / 255;
  const nextB = b / 255;

  const k = 1 - Math.max(nextR, nextG, nextB);

  if (k === 1) {
    return {
      c: 0,
      m: 0,
      y: 0,
      k: 100,
    };
  }

  return {
    c: Math.round(((1 - nextR - k) / (1 - k)) * 100),
    m: Math.round(((1 - nextG - k) / (1 - k)) * 100),
    y: Math.round(((1 - nextB - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
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

function getContrastRatio(colorA, colorB) {
  const luminanceA = getRelativeLuminance(colorA);
  const luminanceB = getRelativeLuminance(colorB);

  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);

  return (lighter + 0.05) / (darker + 0.05);
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