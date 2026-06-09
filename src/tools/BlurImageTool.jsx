import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Upload,
  Download,
  RotateCcw,
  Undo2,
  Redo2,
  Copy,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Square,
  ShieldCheck,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  SlidersHorizontal,
  Image as ImageIcon,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Blur Image Online",
  path: "/blur-image",
  category: "Image Tools",
  description:
    "Blur images online quickly with full image blur, selected area blur, and pixel privacy blur.",
  metaTitle: "Blur Image Online | Add Blur to Photos Free",
  metaDescription:
    "Blur images online for free. Upload a photo, quickly blur the full image or selected areas, pixelate private information, and download instantly.",
};

const SITE_URL = "https://nextonlinetools.com";
const canonicalUrl = `${SITE_URL}${toolData.path.startsWith("/tool") ? toolData.path : `/tool${toolData.path}`}`;

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_LONG_SIDE = 2400;
const MAX_HISTORY = 25;

const MODES = [
  {
    id: "full",
    label: "Full Blur",
    description: "Blur the whole image instantly.",
    icon: Sparkles,
  },
  {
    id: "area",
    label: "Area Blur",
    description: "Drag on the image to blur only one area.",
    icon: Square,
  },
  {
    id: "pixel",
    label: "Pixelate Area",
    description: "Hide text, faces, numbers, or private details.",
    icon: ShieldCheck,
  },
];

const OUTPUT_FORMATS = [
  { value: "image/png", label: "PNG", extension: "png" },
  { value: "image/jpeg", label: "JPG", extension: "jpg" },
  { value: "image/webp", label: "WEBP", extension: "webp" },
];

export default function BlurImageTool() {
  const fileInputRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const baseCanvasRef = useRef(document.createElement("canvas"));
  const outputUrlRef = useRef("");
  const imageUrlRef = useRef("");
  const renderFrameRef = useRef(0);

  const pointerRef = useRef({
    active: false,
    startPoint: null,
  });

  const [imageInfo, setImageInfo] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [mode, setMode] = useState("full");
  const [fullBlurEnabled, setFullBlurEnabled] = useState(true);
  const [fullBlurStrength, setFullBlurStrength] = useState(10);
  const [areaBlurStrength, setAreaBlurStrength] = useState(14);
  const [pixelSize, setPixelSize] = useState(18);

  const [effects, setEffects] = useState([]);
  const [draftSelection, setDraftSelection] = useState(null);
  const [historyPast, setHistoryPast] = useState([]);
  const [historyFuture, setHistoryFuture] = useState([]);

  const [showBefore, setShowBefore] = useState(false);
  const [outputFormat, setOutputFormat] = useState("image/png");
  const [quality, setQuality] = useState(0.94);
  const [lastOutputSize, setLastOutputSize] = useState(0);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const hasImage = Boolean(imageInfo);

  const selectedOutputFormat = useMemo(() => {
    return OUTPUT_FORMATS.find((item) => item.value === outputFormat) || OUTPUT_FORMATS[0];
  }, [outputFormat]);

  const previewSize = useMemo(() => {
    if (!imageInfo) return { width: 0, height: 0 };

    const maxWidth = imageInfo.width >= imageInfo.height ? 1050 : 680;
    const width = Math.min(maxWidth, imageInfo.width);
    const scale = width / imageInfo.width;

    return {
      width: Math.round(imageInfo.width * scale),
      height: Math.round(imageInfo.height * scale),
    };
  }, [imageInfo]);

  const activeBlurLabel = useMemo(() => {
    if (!hasImage) return "Upload image first";
    if (mode === "full") return fullBlurEnabled ? `${fullBlurStrength}px full blur` : "Original image";
    if (mode === "area") return `Drag to add ${areaBlurStrength}px area blur`;
    return `Drag to pixelate at ${pixelSize}px`;
  }, [areaBlurStrength, fullBlurEnabled, fullBlurStrength, hasImage, mode, pixelSize]);

  const seoJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Blur Image Online",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      "@id": canonicalUrl,
      url: canonicalUrl,
      description:
        "Blur images online quickly with full image blur, selected area blur, and pixel privacy blur.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Blur full image online",
        "Blur selected area of image",
        "Pixelate private information",
        "Download blurred image as PNG, JPG, or WEBP",
        "Browser-based image processing",
      ],
    };
  }, []);

  const faqJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How do I blur an image online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Upload your image, choose Full Blur or Area Blur, adjust the strength, and download the blurred image.",
          },
        },
        {
          "@type": "Question",
          name: "Can I blur only part of an image?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Use Area Blur or Pixelate Area, then drag over the part of the image you want to hide or blur.",
          },
        },
        {
          "@type": "Question",
          name: "Is my image uploaded to a server?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. This tool processes your image in your browser, so the image does not need to be uploaded to a server.",
          },
        },
      ],
    };
  }, []);

  const renderPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const baseCanvas = baseCanvasRef.current;

    if (!canvas || !hasImage || !baseCanvas.width || !baseCanvas.height) return;

    canvas.width = baseCanvas.width;
    canvas.height = baseCanvas.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawBlurResult(ctx, baseCanvas, {
      showBefore,
      fullBlurEnabled,
      fullBlurStrength,
      effects,
      draftSelection,
    });
  }, [draftSelection, effects, fullBlurEnabled, fullBlurStrength, hasImage, showBefore]);

  useEffect(() => {
    window.cancelAnimationFrame(renderFrameRef.current);
    renderFrameRef.current = window.requestAnimationFrame(renderPreview);

    return () => {
      window.cancelAnimationFrame(renderFrameRef.current);
    };
  }, [renderPreview]);

  useEffect(() => {
    function handlePaste(event) {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type?.startsWith("image/"));

      if (!imageItem) return;

      const file = imageItem.getAsFile();
      if (file) handleImageFile(file);
    }

    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
      if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    };
  }, []);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function resetFileInput() {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function clearOutput() {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = "";
    }

    setLastOutputSize(0);
  }

  function pushHistory() {
    setHistoryPast((current) =>
      [
        ...current,
        {
          fullBlurEnabled,
          fullBlurStrength,
          areaBlurStrength,
          pixelSize,
          effects: cloneJson(effects),
        },
      ].slice(-MAX_HISTORY)
    );
    setHistoryFuture([]);
  }

  function restoreState(snapshot) {
    if (!snapshot) return;

    setFullBlurEnabled(snapshot.fullBlurEnabled);
    setFullBlurStrength(snapshot.fullBlurStrength);
    setAreaBlurStrength(snapshot.areaBlurStrength);
    setPixelSize(snapshot.pixelSize);
    setEffects(cloneJson(snapshot.effects));
    setDraftSelection(null);
    clearOutput();
  }

  function undo() {
    if (!historyPast.length) return;

    const previous = historyPast[historyPast.length - 1];
    const remaining = historyPast.slice(0, -1);

    setHistoryFuture((current) => [
      {
        fullBlurEnabled,
        fullBlurStrength,
        areaBlurStrength,
        pixelSize,
        effects: cloneJson(effects),
      },
      ...current,
    ].slice(0, MAX_HISTORY));

    setHistoryPast(remaining);
    restoreState(previous);
  }

  function redo() {
    if (!historyFuture.length) return;

    const next = historyFuture[0];
    const remaining = historyFuture.slice(1);

    setHistoryPast((current) =>
      [
        ...current,
        {
          fullBlurEnabled,
          fullBlurStrength,
          areaBlurStrength,
          pixelSize,
          effects: cloneJson(effects),
        },
      ].slice(-MAX_HISTORY)
    );

    setHistoryFuture(remaining);
    restoreState(next);
  }

  async function handleImageFile(file) {
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
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);

      const objectUrl = URL.createObjectURL(file);
      imageUrlRef.current = objectUrl;

      const image = await loadImage(objectUrl);
      const naturalWidth = image.naturalWidth || image.width;
      const naturalHeight = image.naturalHeight || image.height;
      const scale = Math.min(1, MAX_IMAGE_LONG_SIDE / Math.max(naturalWidth, naturalHeight));
      const width = Math.max(1, Math.round(naturalWidth * scale));
      const height = Math.max(1, Math.round(naturalHeight * scale));

      const baseCanvas = baseCanvasRef.current;
      baseCanvas.width = width;
      baseCanvas.height = height;

      const ctx = baseCanvas.getContext("2d");
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, width, height);

      setImageInfo({
        name: file.name || "image",
        size: file.size,
        type: file.type,
        width,
        height,
        naturalWidth,
        naturalHeight,
      });

      setMode("full");
      setFullBlurEnabled(true);
      setFullBlurStrength(10);
      setAreaBlurStrength(14);
      setPixelSize(18);
      setEffects([]);
      setDraftSelection(null);
      setHistoryPast([]);
      setHistoryFuture([]);
      setShowBefore(false);
      setOutputFormat(getDefaultOutputFormat(file.type));
      setSuccessMessage("Image uploaded. A quick full blur is applied. Adjust strength or download instantly.");
    } catch {
      setErrorMessage("Could not load this image. Please try another file.");
      setImageInfo(null);
    } finally {
      setIsLoadingImage(false);
      resetFileInput();
    }
  }

  function handleFileInputChange(event) {
    const file = event.target.files?.[0];
    if (file) handleImageFile(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDraggingFile(false);

    const file = event.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDraggingFile(true);
  }

  function handleDragLeave() {
    setIsDraggingFile(false);
  }

  function getCanvasPoint(event) {
    const canvas = previewCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handlePointerDown(event) {
    if (!hasImage || mode === "full") return;

    const point = getCanvasPoint(event);
    if (!point) return;

    event.preventDefault();
    pointerRef.current = {
      active: true,
      startPoint: point,
    };

    setDraftSelection({
      x: point.x,
      y: point.y,
      w: 0,
      h: 0,
      type: mode,
      strength: areaBlurStrength,
      pixelSize,
    });

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!pointerRef.current.active || !hasImage || mode === "full") return;

    const point = getCanvasPoint(event);
    if (!point) return;

    event.preventDefault();

    const start = pointerRef.current.startPoint;
    const selection = normalizeBox({
      x: start.x,
      y: start.y,
      w: point.x - start.x,
      h: point.y - start.y,
    });

    setDraftSelection({
      ...selection,
      type: mode,
      strength: areaBlurStrength,
      pixelSize,
    });
  }

  function handlePointerUp(event) {
    if (!pointerRef.current.active) return;

    event.preventDefault();

    const selection = draftSelection ? normalizeBox(draftSelection) : null;

    if (selection && selection.w >= 8 && selection.h >= 8) {
      pushHistory();
      setEffects((current) => [
        ...current,
        {
          id: createId(),
          type: mode,
          x: selection.x,
          y: selection.y,
          w: selection.w,
          h: selection.h,
          strength: areaBlurStrength,
          pixelSize,
        },
      ]);
      setSuccessMessage(mode === "pixel" ? "Pixel area added." : "Blur area added.");
      clearOutput();
    }

    setDraftSelection(null);
    pointerRef.current = {
      active: false,
      startPoint: null,
    };

    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  function applyPreset(presetId) {
    if (!hasImage) {
      setErrorMessage("Please upload an image first.");
      return;
    }

    pushHistory();
    setErrorMessage("");
    setSuccessMessage("");

    if (presetId === "soft") {
      setMode("full");
      setFullBlurEnabled(true);
      setFullBlurStrength(6);
      setSuccessMessage("Soft full blur applied.");
    }

    if (presetId === "strong") {
      setMode("full");
      setFullBlurEnabled(true);
      setFullBlurStrength(18);
      setSuccessMessage("Strong full blur applied.");
    }

    if (presetId === "privacy") {
      setMode("pixel");
      setPixelSize(24);
      setSuccessMessage("Privacy pixel mode selected. Drag over the area you want to hide.");
    }

    if (presetId === "area") {
      setMode("area");
      setAreaBlurStrength(16);
      setSuccessMessage("Area blur mode selected. Drag over the area you want to blur.");
    }

    clearOutput();
  }

  function handleFullBlurStrengthChange(value) {
    if (!hasImage) return;

    if (!fullBlurEnabled) {
      pushHistory();
      setFullBlurEnabled(true);
    }

    setFullBlurStrength(Number(value));
    clearOutput();
  }

  function toggleFullBlur() {
    if (!hasImage) return;

    pushHistory();
    setFullBlurEnabled((current) => !current);
    clearOutput();
  }

  function deleteLastEffect() {
    if (!effects.length) return;

    pushHistory();
    setEffects((current) => current.slice(0, -1));
    setSuccessMessage("Last blur area removed.");
    clearOutput();
  }

  function clearAllBlur() {
    if (!hasImage) return;

    pushHistory();
    setFullBlurEnabled(false);
    setEffects([]);
    setDraftSelection(null);
    setSuccessMessage("All blur effects cleared.");
    clearOutput();
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

    baseCanvasRef.current = document.createElement("canvas");
    setImageInfo(null);
    setMode("full");
    setFullBlurEnabled(true);
    setFullBlurStrength(10);
    setAreaBlurStrength(14);
    setPixelSize(18);
    setEffects([]);
    setDraftSelection(null);
    setHistoryPast([]);
    setHistoryFuture([]);
    setShowBefore(false);
    setOutputFormat("image/png");
    setQuality(0.94);
    setLastOutputSize(0);
    setErrorMessage("");
    setSuccessMessage("");
    resetFileInput();
  }

  function createFinalCanvas() {
    if (!hasImage) throw new Error("No image selected.");

    const baseCanvas = baseCanvasRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = baseCanvas.width;
    canvas.height = baseCanvas.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported.");

    if (outputFormat === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawBlurResult(ctx, baseCanvas, {
      showBefore: false,
      fullBlurEnabled,
      fullBlurStrength,
      effects,
      draftSelection: null,
    });

    return canvas;
  }

  async function downloadImage() {
    if (!hasImage) {
      setErrorMessage("Please upload an image first.");
      return;
    }

    setIsExporting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await wait(40);
      const finalCanvas = createFinalCanvas();
      const blob = await canvasToBlob(finalCanvas, outputFormat, quality);
      const fileName = `${getFileBaseName(imageInfo.name)}-blurred.${selectedOutputFormat.extension}`;

      setLastOutputSize(blob.size);
      downloadBlob(blob, fileName);
      setSuccessMessage(`Blurred image downloaded. Output size: ${formatBytes(blob.size)}.`);
    } catch {
      setErrorMessage("Could not download the blurred image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  async function copyImage() {
    if (!hasImage) {
      setErrorMessage("Please upload an image first.");
      return;
    }

    if (!navigator.clipboard || !window.ClipboardItem) {
      setErrorMessage("Your browser does not support image copy. Please use Download instead.");
      return;
    }

    try {
      const finalCanvas = createFinalCanvas();
      const blob = await canvasToBlob(finalCanvas, "image/png", 1);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setSuccessMessage("Blurred image copied to clipboard.");
    } catch {
      setErrorMessage("Copy failed. Please use Download instead.");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Helmet>
        <title>{toolData.metaTitle}</title>
        <meta name="description" content={toolData.metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={toolData.metaTitle} />
        <meta property="og:description" content={toolData.metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={toolData.metaTitle} />
        <meta name="twitter:description" content={toolData.metaDescription} />
        <script type="application/ld+json">{JSON.stringify(seoJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Sparkles size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Blur Image Online</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload a photo and add blur quickly. Blur the full image instantly, drag to blur
          one area, or pixelate private details like faces, numbers, addresses, or screenshots.
        </p>
      </section>

      <section className="card p-4 sm:p-5">
        <div className="grid lg:grid-cols-[340px_1fr] gap-5">
          <aside className="flex flex-col gap-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={openFilePicker}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition bg-white ${
                isDraggingFile
                  ? "border-[var(--primary)] bg-[#f4edff]"
                  : "border-[var(--border)] hover:bg-[#f8f4ff]"
              }`}
            >
              {isLoadingImage ? (
                <Loader2 size={36} className="mx-auto mb-3 text-[var(--primary)] animate-spin" />
              ) : (
                <Upload size={36} className="mx-auto mb-3 text-[var(--primary)]" />
              )}

              <h2 className="font-bold mb-1">Upload Image</h2>
              <p className="text-xs text-[var(--text-secondary)] leading-5">
                Drop, click, or paste with Ctrl + V. Max {MAX_FILE_SIZE_MB} MB.
              </p>
            </div>

            {hasImage && (
              <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Image</p>
                <p className="font-semibold break-all">{imageInfo.name}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {imageInfo.width} × {imageInfo.height}px • {formatBytes(imageInfo.size)}
                </p>
              </div>
            )}

            <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal size={18} className="text-[var(--primary)]" />
                <h2 className="font-bold">Quick Blur</h2>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset("soft")}
                  disabled={!hasImage}
                  className="btn-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Soft Blur
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("strong")}
                  disabled={!hasImage}
                  className="btn-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Strong Blur
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("area")}
                  disabled={!hasImage}
                  className="btn-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Area Blur
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("privacy")}
                  disabled={!hasImage}
                  className="btn-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Privacy Pixel
                </button>
              </div>
            </div>

            <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
              <h2 className="font-bold mb-3">Blur Mode</h2>

              <div className="flex flex-col gap-2">
                {MODES.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id)}
                      disabled={!hasImage}
                      className={`rounded-2xl border p-3 text-left transition disabled:opacity-40 disabled:cursor-not-allowed ${
                        mode === item.id
                          ? "border-[var(--primary)] bg-[#f4edff]"
                          : "border-[var(--border)] hover:bg-[#f8f4ff]"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <Icon size={17} className="text-[var(--primary)]" />
                        {item.label}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
              <h2 className="font-bold mb-3">Settings</h2>

              {mode === "full" && (
                <>
                  <label className="flex items-center justify-between gap-3 border border-[var(--border)] rounded-xl p-3 cursor-pointer mb-4">
                    <span className="font-semibold text-sm">Full Image Blur</span>
                    <input
                      type="checkbox"
                      checked={fullBlurEnabled}
                      onChange={toggleFullBlur}
                      disabled={!hasImage}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                  </label>

                  <RangeInput
                    label={`Blur Strength: ${fullBlurStrength}px`}
                    min={0}
                    max={36}
                    step={1}
                    value={fullBlurStrength}
                    disabled={!hasImage || !fullBlurEnabled}
                    onChange={handleFullBlurStrengthChange}
                  />
                </>
              )}

              {mode === "area" && (
                <RangeInput
                  label={`Area Blur: ${areaBlurStrength}px`}
                  min={2}
                  max={36}
                  step={1}
                  value={areaBlurStrength}
                  disabled={!hasImage}
                  onChange={(value) => {
                    setAreaBlurStrength(Number(value));
                    clearOutput();
                  }}
                />
              )}

              {mode === "pixel" && (
                <RangeInput
                  label={`Pixel Size: ${pixelSize}px`}
                  min={4}
                  max={64}
                  step={1}
                  value={pixelSize}
                  disabled={!hasImage}
                  onChange={(value) => {
                    setPixelSize(Number(value));
                    clearOutput();
                  }}
                />
              )}

              <p className="text-xs text-[var(--text-secondary)] mt-4 leading-5">
                {activeBlurLabel}
              </p>
            </div>

            <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
              <h2 className="font-bold mb-3">Actions</h2>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <IconButton title="Undo" disabled={!historyPast.length} onClick={undo}>
                  <Undo2 size={18} />
                </IconButton>
                <IconButton title="Redo" disabled={!historyFuture.length} onClick={redo}>
                  <Redo2 size={18} />
                </IconButton>
                <IconButton title="Delete last area" disabled={!effects.length} onClick={deleteLastEffect}>
                  <Trash2 size={18} />
                </IconButton>
              </div>

              <button
                type="button"
                onClick={clearAllBlur}
                disabled={!hasImage}
                className="btn-secondary w-full inline-flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw size={17} />
                Clear Blur
              </button>
            </div>

            <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
              <h2 className="font-bold mb-3">Download</h2>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Format</label>
                  <select
                    value={outputFormat}
                    onChange={(event) => {
                      setOutputFormat(event.target.value);
                      clearOutput();
                    }}
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  >
                    {OUTPUT_FORMATS.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(outputFormat === "image/jpeg" || outputFormat === "image/webp") && (
                  <RangeInput
                    label={`Quality: ${Math.round(quality * 100)}%`}
                    min={0.6}
                    max={1}
                    step={0.01}
                    value={quality}
                    onChange={(value) => setQuality(Number(value))}
                  />
                )}
              </div>

              <button
                type="button"
                onClick={downloadImage}
                disabled={!hasImage || isExporting}
                className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                {isExporting ? "Creating..." : "Download Image"}
              </button>

              <button
                type="button"
                onClick={copyImage}
                disabled={!hasImage}
                className="btn-secondary w-full mt-2 inline-flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Copy size={17} />
                Copy Image
              </button>

              {lastOutputSize ? (
                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  Last output: {formatBytes(lastOutputSize)}
                </p>
              ) : null}
            </div>
          </aside>

          <main className="flex flex-col gap-4">
            {(errorMessage || successMessage) && (
              <div className="grid md:grid-cols-2 gap-3">
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
              </div>
            )}

            <div className="border border-[var(--border)] rounded-2xl bg-white p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="font-bold">Preview</h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {mode === "full" ? "Adjust the slider and download." : "Drag on the image to add blur."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBefore((current) => !current)}
                    disabled={!hasImage}
                    className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                      showBefore
                        ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                        : "border-[var(--border)] hover:bg-[#f8f4ff]"
                    }`}
                  >
                    {showBefore ? <Eye size={17} /> : <EyeOff size={17} />}
                    {showBefore ? "Before" : "After"}
                  </button>

                  <button
                    type="button"
                    onClick={resetTool}
                    className="h-10 rounded-xl border border-[var(--border)] px-3 inline-flex items-center gap-2 text-sm hover:bg-[#f8f4ff]"
                  >
                    <RotateCcw size={17} />
                    Reset
                  </button>
                </div>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`min-h-[620px] rounded-2xl border border-[var(--border)] bg-[#f3f4f6] overflow-auto flex items-center justify-center p-4 ${
                  isDraggingFile ? "ring-2 ring-[var(--primary)]" : ""
                }`}
              >
                {!hasImage ? (
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="text-center max-w-sm p-8 rounded-2xl border-2 border-dashed border-[var(--border)] bg-white hover:bg-[#f8f4ff] transition"
                  >
                    <ImageIcon size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="font-bold mb-2">Upload an image to start</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      The tool will apply a quick blur immediately after upload.
                    </p>
                  </button>
                ) : (
                  <canvas
                    ref={previewCanvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className="bg-white shadow-2xl touch-none"
                    style={{
                      width: `${previewSize.width}px`,
                      height: `${previewSize.height}px`,
                      maxWidth: "none",
                      cursor: mode === "full" ? "default" : "crosshair",
                    }}
                  />
                )}
              </div>
            </div>

            {hasImage && (
              <div className="grid sm:grid-cols-4 gap-3">
                <InfoCard label="Mode" value={MODES.find((item) => item.id === mode)?.label || "Full Blur"} />
                <InfoCard label="Blur Areas" value={effects.filter((item) => item.type === "area").length} />
                <InfoCard label="Pixel Areas" value={effects.filter((item) => item.type === "pixel").length} />
                <InfoCard label="Size" value={`${imageInfo.width}×${imageInfo.height}`} />
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <p className="text-sm text-blue-800 leading-7">
                Privacy note: Your image is processed in your browser. Please edit only images you own or have permission to use. Do not use this tool to mislead people or falsify documents.
              </p>
            </div>
          </main>
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-4">Blur Images Online Quickly</h2>

        <div className="text-[var(--text-secondary)] leading-7 space-y-3">
          <p>
            This Blur Image tool helps you add blur to photos without installing software.
            You can blur the full image, blur only a selected part, or pixelate private
            information in screenshots and photos.
          </p>

          <p>
            Use full blur for backgrounds, area blur for faces or objects, and pixel blur
            when you need to hide personal details like phone numbers, addresses, IDs, or private messages.
          </p>
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-5">Blur Image FAQ</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <FaqItem
            question="Can I blur only part of an image?"
            answer="Yes. Choose Area Blur, then drag over the part of the image you want to blur."
          />
          <FaqItem
            question="Can I pixelate private information?"
            answer="Yes. Choose Privacy Pixel or Pixelate Area, then drag over text, faces, numbers, or private details."
          />
          <FaqItem
            question="Is my image uploaded to a server?"
            answer="No. The image is processed inside your browser using canvas."
          />
          <FaqItem
            question="Which format can I download?"
            answer="You can download the final blurred image as PNG, JPG, or WEBP."
          />
        </div>
      </section>

      <SuggestedTools currentToolId="blur-image" />
    </div>
  );
}

function RangeInput({ label, min, max, step, value, onChange, disabled = false }) {
  return (
    <div className={disabled ? "opacity-50" : ""}>
      <label className="text-sm font-semibold mb-2 block">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full accent-[var(--primary)] disabled:cursor-not-allowed"
      />
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
      className={`h-10 rounded-xl border inline-flex items-center justify-center ${
        disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-[#f8f4ff]"
      }`}
    >
      {children}
    </button>
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

function FaqItem({ question, answer }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-6">{answer}</p>
    </div>
  );
}

function drawBlurResult(ctx, baseCanvas, options) {
  const { showBefore, fullBlurEnabled, fullBlurStrength, effects, draftSelection } = options;

  ctx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);

  if (showBefore) {
    ctx.drawImage(baseCanvas, 0, 0);
    return;
  }

  if (fullBlurEnabled && fullBlurStrength > 0) {
    ctx.save();
    ctx.filter = `blur(${fullBlurStrength}px)`;
    const overscan = Math.ceil(fullBlurStrength * 2);
    ctx.drawImage(
      baseCanvas,
      -overscan,
      -overscan,
      baseCanvas.width + overscan * 2,
      baseCanvas.height + overscan * 2
    );
    ctx.restore();
  } else {
    ctx.drawImage(baseCanvas, 0, 0);
  }

  effects.forEach((effect) => {
    if (effect.type === "area") {
      applyAreaBlur(ctx, baseCanvas, effect, effect.strength || 14);
    }

    if (effect.type === "pixel") {
      applyPixelArea(ctx, baseCanvas, effect, effect.pixelSize || 18);
    }
  });

  if (draftSelection) {
    const box = normalizeBox(draftSelection);

    ctx.save();
    ctx.strokeStyle = draftSelection.type === "pixel" ? "#2563eb" : "#9b6ce3";
    ctx.fillStyle = "rgba(155,108,227,0.12)";
    ctx.lineWidth = Math.max(2, baseCanvas.width * 0.0015);
    ctx.setLineDash([10, 8]);
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.restore();
  }
}

function applyAreaBlur(ctx, baseCanvas, boxInput, strength) {
  const box = clampBoxToCanvas(normalizeBox(boxInput), baseCanvas);
  if (box.w < 1 || box.h < 1) return;

  const temp = document.createElement("canvas");
  temp.width = Math.max(1, Math.round(box.w));
  temp.height = Math.max(1, Math.round(box.h));

  const tempCtx = temp.getContext("2d");
  if (!tempCtx) return;

  tempCtx.filter = `blur(${strength}px)`;
  const overscan = Math.ceil(strength * 2);

  tempCtx.drawImage(
    baseCanvas,
    box.x - overscan,
    box.y - overscan,
    box.w + overscan * 2,
    box.h + overscan * 2,
    -overscan,
    -overscan,
    box.w + overscan * 2,
    box.h + overscan * 2
  );

  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.drawImage(temp, box.x, box.y, box.w, box.h);
  ctx.restore();
}

function applyPixelArea(ctx, baseCanvas, boxInput, pixelSize) {
  const box = clampBoxToCanvas(normalizeBox(boxInput), baseCanvas);
  if (box.w < 1 || box.h < 1) return;

  const safePixelSize = Math.max(2, Number(pixelSize || 18));
  const tinyWidth = Math.max(1, Math.ceil(box.w / safePixelSize));
  const tinyHeight = Math.max(1, Math.ceil(box.h / safePixelSize));
  const temp = document.createElement("canvas");

  temp.width = tinyWidth;
  temp.height = tinyHeight;

  const tempCtx = temp.getContext("2d");
  if (!tempCtx) return;

  tempCtx.imageSmoothingEnabled = true;
  tempCtx.drawImage(baseCanvas, box.x, box.y, box.w, box.h, 0, 0, tinyWidth, tinyHeight);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(temp, 0, 0, tinyWidth, tinyHeight, box.x, box.y, box.w, box.h);
  ctx.restore();
}

function normalizeBox(box) {
  const x = Math.min(box.x, box.x + box.w);
  const y = Math.min(box.y, box.y + box.h);
  const w = Math.abs(box.w);
  const h = Math.abs(box.h);

  return { ...box, x, y, w, h };
}

function clampBoxToCanvas(box, canvas) {
  const x = clampNumber(box.x, 0, canvas.width);
  const y = clampNumber(box.y, 0, canvas.height);
  const right = clampNumber(box.x + box.w, 0, canvas.width);
  const bottom = clampNumber(box.y + box.h, 0, canvas.height);

  return {
    ...box,
    x,
    y,
    w: Math.max(1, right - x),
    h: Math.max(1, bottom - y),
  };
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

function downloadBlob(blob, fileName) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function getDefaultOutputFormat(fileType) {
  if (fileType === "image/jpeg") return "image/jpeg";
  if (fileType === "image/webp") return "image/webp";
  return "image/png";
}

function getFileBaseName(fileName) {
  return String(fileName || "image").replace(/\.[^/.]+$/, "");
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function clampNumber(value, min, max) {
  const number = Number(value);

  if (Number.isNaN(number)) return min;

  return Math.min(max, Math.max(min, number));
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, index);

  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
