import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Undo2,
  Redo2,
  MousePointer2,
  Type,
  ArrowUpRight,
  Square,
  Circle,
  PenLine,
  Highlighter,
  EyeOff,
  Smile,
  Palette,
  Trash2,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Minus,
  ListOrdered,
  BoxSelect,
  Clock3,
  SlidersHorizontal,
  Settings2,
  X,
  Sparkles,
  Eye,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Screenshot Editor",
  path: "/screenshot-editor",
  category: "Image Tools",
  description:
    "Edit screenshots online with arrows, text, shapes, highlights, blur, emojis, step numbers, and instant download.",
  metaTitle: "Screenshot Editor Online | Annotate, Mark & Edit Screenshots",
  metaDescription:
    "Edit screenshots online for free. Upload, paste, or drop a screenshot, then add arrows, text, shapes, highlights, blur, emojis, and step numbers. Download instantly.",
};

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_CANVAS_LONG_SIDE = 2400;
const MAX_HISTORY = 60;

const DEFAULT_STYLE = {
  strokeColor: "#ef4444",
  fillColor: "rgba(239,68,68,0.14)",
  textColor: "#ffffff",
  textBackground: "#ef4444",
  strokeWidth: 6,
  fontSize: 42,
  opacity: 0.95,
  blurStrength: 10,
};

const TOOL_OPTIONS = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "text", label: "Text", icon: Type },
  { id: "arrow", label: "Arrow", icon: ArrowUpRight },
  { id: "line", label: "Line", icon: Minus },
  { id: "rectangle", label: "Rectangle", icon: Square },
  { id: "circle", label: "Circle", icon: Circle },
  { id: "pen", label: "Draw", icon: PenLine },
  { id: "highlight", label: "Highlight", icon: Highlighter },
  { id: "blur", label: "Blur", icon: EyeOff },
  { id: "emoji", label: "Emoji", icon: Smile },
  { id: "step", label: "Step", icon: ListOrdered },
  { id: "spotlight", label: "Spotlight", icon: BoxSelect },
];

const STYLE_PRESETS = [
  {
    label: "Red Markup",
    strokeColor: "#ef4444",
    fillColor: "rgba(239,68,68,0.14)",
    textBackground: "#ef4444",
  },
  {
    label: "Yellow Highlight",
    strokeColor: "#f59e0b",
    fillColor: "rgba(250,204,21,0.35)",
    textBackground: "#f59e0b",
  },
  {
    label: "Blue Pro",
    strokeColor: "#2563eb",
    fillColor: "rgba(37,99,235,0.14)",
    textBackground: "#2563eb",
  },
  {
    label: "Green Success",
    strokeColor: "#16a34a",
    fillColor: "rgba(22,163,74,0.14)",
    textBackground: "#16a34a",
  },
  {
    label: "Dark Callout",
    strokeColor: "#111827",
    fillColor: "rgba(17,24,39,0.16)",
    textBackground: "#111827",
  },
];

const EMOJI_OPTIONS = [
  "✅",
  "❌",
  "⚠️",
  "🔥",
  "👀",
  "👉",
  "👈",
  "👍",
  "😍",
  "😮",
  "💡",
  "🎯",
  "📌",
  "⭐",
  "🚀",
  "💰",
  "📦",
  "🛒",
];

const OUTPUT_FORMATS = [
  { value: "image/png", label: "PNG", extension: "png" },
  { value: "image/jpeg", label: "JPG", extension: "jpg" },
  { value: "image/webp", label: "WEBP", extension: "webp" },
];

export default function ScreenshotEditor() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const screenshotUrlRef = useRef("");

  const pointerRef = useRef({
    mode: null,
    pointerId: null,
    startPoint: null,
    startAnnotations: null,
    selectedStart: null,
  });

  const [screenshot, setScreenshot] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [draftAnnotation, setDraftAnnotation] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const [activeTool, setActiveTool] = useState("select");
  const [activePanel, setActivePanel] = useState("");

  const [style, setStyle] = useState(DEFAULT_STYLE);
  const [textValue, setTextValue] = useState("Add note");
  const [selectedEmoji, setSelectedEmoji] = useState("✅");
  const [nextStepNumber, setNextStepNumber] = useState(1);

  const [historyPast, setHistoryPast] = useState([]);
  const [historyFuture, setHistoryFuture] = useState([]);

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [editorZoom, setEditorZoom] = useState(1);
  const [showGuides, setShowGuides] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(true);

  const [outputFormat, setOutputFormat] = useState("image/png");
  const [quality, setQuality] = useState(0.94);
  const [exportProgress, setExportProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [lastOutputSize, setLastOutputSize] = useState(0);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const hasScreenshot = Boolean(screenshot?.element);

  const selectedAnnotation = useMemo(() => {
    return annotations.find((item) => item.id === selectedId) || null;
  }, [annotations, selectedId]);

  const selectedOutputFormat = useMemo(() => {
    return (
      OUTPUT_FORMATS.find((item) => item.value === outputFormat) ||
      OUTPUT_FORMATS[0]
    );
  }, [outputFormat]);

  const estimatedProcessingTimeMs = useMemo(() => {
    if (!screenshot) return 0;

    const megapixels = (screenshot.width * screenshot.height) / 1000000;
    const annotationCost = annotations.length * 35;
    const estimated = 500 + megapixels * 260 + annotationCost;

    return Math.min(12000, Math.max(700, Math.round(estimated)));
  }, [screenshot, annotations.length]);

  const canvasDisplayWidth = useMemo(() => {
    if (!screenshot) return 0;

    const baseWidth = Math.max(360, Math.min(screenshot.width, 1100));

    return baseWidth * editorZoom;
  }, [screenshot, editorZoom]);

  const handleImageFile = useCallback(async (file) => {
    setErrorMessage("");
    setSuccessMessage("");
    setProcessingTimeMs(0);
    setLastOutputSize(0);
    setExportProgress(0);
    setActivePanel("");

    const validationError = validateImageFile(file);

    if (validationError) {
      setErrorMessage(validationError);
      resetFileInput();
      return;
    }

    setIsLoadingImage(true);

    try {
      if (screenshotUrlRef.current) {
        URL.revokeObjectURL(screenshotUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(file);
      screenshotUrlRef.current = objectUrl;

      const loadedImage = await loadImage(objectUrl);
      const naturalWidth = loadedImage.naturalWidth || loadedImage.width;
      const naturalHeight = loadedImage.naturalHeight || loadedImage.height;

      const scaleRatio = Math.min(
        1,
        MAX_CANVAS_LONG_SIDE / Math.max(naturalWidth, naturalHeight)
      );

      const canvasWidth = Math.max(1, Math.round(naturalWidth * scaleRatio));
      const canvasHeight = Math.max(1, Math.round(naturalHeight * scaleRatio));

      setScreenshot({
        element: loadedImage,
        url: objectUrl,
        name: file.name || "screenshot",
        size: file.size,
        type: file.type || "image",
        naturalWidth,
        naturalHeight,
        width: canvasWidth,
        height: canvasHeight,
      });

      setAnnotations([]);
      setDraftAnnotation(null);
      setSelectedId(null);
      setHistoryPast([]);
      setHistoryFuture([]);
      setNextStepNumber(1);
      setEditorZoom(1);

      setSuccessMessage(
        "Screenshot loaded. Use the compact top toolbar to add arrows, text, shapes, blur, emojis, or highlights."
      );
    } catch {
      setErrorMessage("Could not load this screenshot. Please try another image.");

      if (screenshotUrlRef.current) {
        URL.revokeObjectURL(screenshotUrlRef.current);
        screenshotUrlRef.current = "";
      }

      setScreenshot(null);
    } finally {
      setIsLoadingImage(false);
      resetFileInput();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (screenshotUrlRef.current) {
        URL.revokeObjectURL(screenshotUrlRef.current);
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
    const canvas = canvasRef.current;

    if (!canvas || !screenshot) return;

    renderCanvas({
      canvas,
      screenshot,
      annotations,
      draftAnnotation,
      selectedId,
      showGuides,
      showSafeArea,
      includeEditorGuides: true,
    });
  }, [
    screenshot,
    annotations,
    draftAnnotation,
    selectedId,
    showGuides,
    showSafeArea,
  ]);

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

  function commitAnnotations(nextAnnotations) {
    clearExportStats();

    setHistoryPast((current) =>
      [...current, cloneAnnotations(annotations)].slice(-MAX_HISTORY)
    );
    setHistoryFuture([]);
    setAnnotations(nextAnnotations);
  }

  function undo() {
    if (!historyPast.length) return;

    const previous = historyPast[historyPast.length - 1];
    const remaining = historyPast.slice(0, -1);

    setHistoryFuture((current) =>
      [cloneAnnotations(annotations), ...current].slice(0, MAX_HISTORY)
    );
    setHistoryPast(remaining);
    setAnnotations(previous);
    setSelectedId(null);
    clearExportStats();
  }

  function redo() {
    if (!historyFuture.length) return;

    const next = historyFuture[0];
    const remaining = historyFuture.slice(1);

    setHistoryPast((current) =>
      [...current, cloneAnnotations(annotations)].slice(-MAX_HISTORY)
    );
    setHistoryFuture(remaining);
    setAnnotations(next);
    setSelectedId(null);
    clearExportStats();
  }

  function deleteSelected() {
    if (!selectedId) return;

    commitAnnotations(annotations.filter((item) => item.id !== selectedId));
    setSelectedId(null);
  }

  function clearAllAnnotations() {
    if (!annotations.length) return;

    commitAnnotations([]);
    setSelectedId(null);
    setNextStepNumber(1);
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

  function handlePointerDown(event) {
    if (!hasScreenshot) return;

    const point = getCanvasPoint(event);

    if (!point) return;

    event.preventDefault();

    if (activeTool === "select") {
      const selected = getAnnotationAtPoint(point, annotations);

      setSelectedId(selected?.id || null);

      if (selected) {
        pointerRef.current = {
          mode: "move",
          pointerId: event.pointerId,
          startPoint: point,
          startAnnotations: cloneAnnotations(annotations),
          selectedStart: cloneAnnotation(selected),
        };

        event.currentTarget.setPointerCapture?.(event.pointerId);
      }

      return;
    }

    if (activeTool === "text") {
      const textAnnotation = createTextAnnotation(point);

      commitAnnotations([...annotations, textAnnotation]);
      setSelectedId(textAnnotation.id);
      setActiveTool("select");
      return;
    }

    if (activeTool === "emoji") {
      const emojiAnnotation = createEmojiAnnotation(point);

      commitAnnotations([...annotations, emojiAnnotation]);
      setSelectedId(emojiAnnotation.id);
      setActiveTool("select");
      return;
    }

    if (activeTool === "step") {
      const stepAnnotation = createStepAnnotation(point);

      commitAnnotations([...annotations, stepAnnotation]);
      setSelectedId(stepAnnotation.id);
      setNextStepNumber((current) => current + 1);
      setActiveTool("select");
      return;
    }

    const draft = createDraftAnnotation(activeTool, point);

    setDraftAnnotation(draft);

    pointerRef.current = {
      mode: "draw",
      pointerId: event.pointerId,
      startPoint: point,
      startAnnotations: null,
      selectedStart: null,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    const point = getCanvasPoint(event);

    if (!point || !pointerRef.current.mode) return;

    event.preventDefault();

    if (pointerRef.current.mode === "move" && selectedId) {
      const startPoint = pointerRef.current.startPoint;
      const selectedStart = pointerRef.current.selectedStart;

      if (!startPoint || !selectedStart) return;

      const dx = point.x - startPoint.x;
      const dy = point.y - startPoint.y;

      setAnnotations((current) =>
        current.map((item) =>
          item.id === selectedId ? moveAnnotation(selectedStart, dx, dy) : item
        )
      );

      clearExportStats();
      return;
    }

    if (pointerRef.current.mode === "draw" && draftAnnotation) {
      const startPoint = pointerRef.current.startPoint;

      if (!startPoint) return;

      setDraftAnnotation(updateDraftAnnotation(draftAnnotation, startPoint, point));
    }
  }

  function handlePointerUp(event) {
    if (!pointerRef.current.mode) return;

    event.preventDefault();

    if (pointerRef.current.mode === "move") {
      const startAnnotations = pointerRef.current.startAnnotations;

      if (startAnnotations) {
        setHistoryPast((current) => [...current, startAnnotations].slice(-MAX_HISTORY));
        setHistoryFuture([]);
      }
    }

    if (pointerRef.current.mode === "draw" && draftAnnotation) {
      const finalAnnotation = normalizeAnnotation(draftAnnotation);

      if (isValidAnnotation(finalAnnotation)) {
        commitAnnotations([...annotations, finalAnnotation]);
        setSelectedId(finalAnnotation.id);
      }

      setDraftAnnotation(null);
      setActiveTool("select");
    }

    pointerRef.current = {
      mode: null,
      pointerId: null,
      startPoint: null,
      startAnnotations: null,
      selectedStart: null,
    };

    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  function createTextAnnotation(point) {
    return {
      id: makeId(),
      type: "text",
      x: point.x,
      y: point.y,
      text: textValue.trim() || "Text",
      color: style.textColor,
      background: style.textBackground,
      fontSize: style.fontSize,
      opacity: style.opacity,
    };
  }

  function createEmojiAnnotation(point) {
    return {
      id: makeId(),
      type: "emoji",
      x: point.x,
      y: point.y,
      emoji: selectedEmoji,
      fontSize: Math.max(42, style.fontSize * 1.35),
      opacity: style.opacity,
    };
  }

  function createStepAnnotation(point) {
    return {
      id: makeId(),
      type: "step",
      x: point.x,
      y: point.y,
      number: nextStepNumber,
      radius: Math.max(24, style.fontSize * 0.75),
      fill: style.strokeColor,
      color: "#ffffff",
      opacity: style.opacity,
    };
  }

  function createDraftAnnotation(type, point) {
    const base = {
      id: makeId(),
      type,
      stroke: style.strokeColor,
      fill: style.fillColor,
      strokeWidth: style.strokeWidth,
      opacity: style.opacity,
      blurStrength: style.blurStrength,
    };

    if (type === "arrow" || type === "line") {
      return {
        ...base,
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: point.y,
      };
    }

    if (type === "pen") {
      return {
        ...base,
        type: "freehand",
        points: [point],
      };
    }

    return {
      ...base,
      x: point.x,
      y: point.y,
      w: 0,
      h: 0,
    };
  }

  function updateDraftAnnotation(annotation, startPoint, point) {
    if (annotation.type === "arrow" || annotation.type === "line") {
      return {
        ...annotation,
        x2: point.x,
        y2: point.y,
      };
    }

    if (annotation.type === "freehand") {
      return {
        ...annotation,
        points: [...annotation.points, point],
      };
    }

    return {
      ...annotation,
      x: startPoint.x,
      y: startPoint.y,
      w: point.x - startPoint.x,
      h: point.y - startPoint.y,
    };
  }

  function updateStyle(key, value) {
    clearExportStats();

    setStyle((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function applyStylePreset(preset) {
    setStyle((current) => ({
      ...current,
      strokeColor: preset.strokeColor,
      fillColor: preset.fillColor,
      textBackground: preset.textBackground,
    }));
  }

  async function exportScreenshot() {
    if (!screenshot) {
      setErrorMessage("Upload a screenshot first.");
      return;
    }

    setIsExporting(true);
    setErrorMessage("");
    setSuccessMessage("");
    setExportProgress(5);

    const startTime = performance.now();

    try {
      await wait(80);
      setExportProgress(25);

      const canvas = document.createElement("canvas");

      renderCanvas({
        canvas,
        screenshot,
        annotations,
        draftAnnotation: null,
        selectedId: null,
        showGuides: false,
        showSafeArea: false,
        includeEditorGuides: false,
        exportFormat: outputFormat,
      });

      setExportProgress(70);

      const blob = await canvasToBlob(canvas, outputFormat, quality);

      setExportProgress(90);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `edited-${getFileBaseName(screenshot.name)}.${
        selectedOutputFormat.extension
      }`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      const actualProcessingTime = Math.max(
        1,
        Math.round(performance.now() - startTime)
      );

      setProcessingTimeMs(actualProcessingTime);
      setLastOutputSize(blob.size);
      setExportProgress(100);
      setSuccessMessage(
        `Screenshot exported in ${(actualProcessingTime / 1000).toFixed(1)}s.`
      );
    } catch {
      setErrorMessage("Could not export the screenshot. Please try again.");
    } finally {
      setIsExporting(false);

      window.setTimeout(() => {
        setExportProgress(0);
      }, 900);
    }
  }

  function resetTool() {
    if (screenshotUrlRef.current) {
      URL.revokeObjectURL(screenshotUrlRef.current);
      screenshotUrlRef.current = "";
    }

    setScreenshot(null);
    setAnnotations([]);
    setDraftAnnotation(null);
    setSelectedId(null);
    setActiveTool("select");
    setActivePanel("");
    setStyle(DEFAULT_STYLE);
    setTextValue("Add note");
    setSelectedEmoji("✅");
    setNextStepNumber(1);
    setHistoryPast([]);
    setHistoryFuture([]);
    setIsDraggingFile(false);
    setIsLoadingImage(false);
    setIsExporting(false);
    setEditorZoom(1);
    setShowGuides(true);
    setShowSafeArea(true);
    setOutputFormat("image/png");
    setQuality(0.94);
    setExportProgress(0);
    setProcessingTimeMs(0);
    setLastOutputSize(0);
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

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <ImageIcon size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Screenshot Editor</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Paste, upload, or drag any screenshot and edit it with a compact
          top toolbar. Add arrows, text, shapes, highlights, blur, emojis,
          and step numbers without blocking the artboard.
        </p>
      </section>

      <section className="card p-4 sm:p-5">
        {!hasScreenshot && (
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
              <Loader2 size={40} className="mx-auto mb-4 text-[var(--primary)] animate-spin" />
            ) : (
              <Upload size={40} className="mx-auto mb-4 text-[var(--primary)]" />
            )}

            <h2 className="text-xl font-semibold mb-2">
              Upload, drop, or paste screenshot
            </h2>

            <p className="text-sm text-[var(--text-secondary)]">
              JPG, PNG, WEBP, GIF, BMP. You can also use{" "}
              <strong>Ctrl + V</strong>. Max {MAX_FILE_SIZE_MB} MB.
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
              title="Upload new screenshot"
            >
              <Upload size={16} />
              Upload
            </button>

            <div className="w-px h-8 bg-[var(--border)] mx-1" />

            {TOOL_OPTIONS.map((tool) => {
              const Icon = tool.icon;

              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    setActiveTool(tool.id);

                    if (tool.id === "text") setActivePanel("text");
                    if (tool.id === "emoji") setActivePanel("emoji");
                  }}
                  className={`w-10 h-10 rounded-xl border inline-flex items-center justify-center transition ${
                    activeTool === tool.id
                      ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                      : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                  }`}
                  title={tool.label}
                >
                  <Icon size={18} />
                </button>
              );
            })}

            <div className="w-px h-8 bg-[var(--border)] mx-1" />

            <button
              type="button"
              onClick={undo}
              disabled={!historyPast.length}
              className={`w-10 h-10 rounded-xl border inline-flex items-center justify-center ${
                !historyPast.length
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-[#f8f4ff]"
              }`}
              title="Undo"
            >
              <Undo2 size={18} />
            </button>

            <button
              type="button"
              onClick={redo}
              disabled={!historyFuture.length}
              className={`w-10 h-10 rounded-xl border inline-flex items-center justify-center ${
                !historyFuture.length
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-[#f8f4ff]"
              }`}
              title="Redo"
            >
              <Redo2 size={18} />
            </button>

            <button
              type="button"
              onClick={deleteSelected}
              disabled={!selectedId}
              className={`w-10 h-10 rounded-xl border inline-flex items-center justify-center ${
                !selectedId
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-red-50 hover:text-red-600"
              }`}
              title="Delete selected"
            >
              <Trash2 size={18} />
            </button>

            <button
              type="button"
              onClick={clearAllAnnotations}
              disabled={!annotations.length}
              className={`w-10 h-10 rounded-xl border inline-flex items-center justify-center ${
                !annotations.length
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-red-50 hover:text-red-600"
              }`}
              title="Clear annotations"
            >
              <X size={18} />
            </button>

            <div className="w-px h-8 bg-[var(--border)] mx-1" />

            <button
              type="button"
              onClick={() =>
                setActivePanel(activePanel === "style" ? "" : "style")
              }
              className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm ${
                activePanel === "style"
                  ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                  : "border-[var(--border)] hover:bg-[#f8f4ff]"
              }`}
            >
              <Palette size={17} />
              Style
            </button>

            <button
              type="button"
              onClick={() =>
                setActivePanel(activePanel === "text" ? "" : "text")
              }
              className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm ${
                activePanel === "text"
                  ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                  : "border-[var(--border)] hover:bg-[#f8f4ff]"
              }`}
            >
              <Type size={17} />
              Text
            </button>

            <button
              type="button"
              onClick={() =>
                setActivePanel(activePanel === "emoji" ? "" : "emoji")
              }
              className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm ${
                activePanel === "emoji"
                  ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                  : "border-[var(--border)] hover:bg-[#f8f4ff]"
              }`}
            >
              <Smile size={17} />
              Emoji
            </button>

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
              onClick={exportScreenshot}
              disabled={!hasScreenshot || isExporting}
              className={`btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm ${
                !hasScreenshot || isExporting
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isExporting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Download size={17} />
              )}
              {isExporting ? "Exporting..." : "Download"}
            </button>
          </div>

          {/* DROPDOWN PANELS */}
          {activePanel && (
            <div className="mt-3 border border-[var(--border)] rounded-2xl bg-[#fafafa] p-4">
              {activePanel === "style" && (
                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4">
                  <div>
                    <p className="text-sm font-semibold mb-3">Style Presets</p>
                    <div className="flex flex-wrap gap-2">
                      {STYLE_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyStylePreset(preset)}
                          className="px-3 py-2 rounded-xl border border-[var(--border)] bg-white hover:bg-[#f4edff] text-sm"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-4 gap-3">
                    <ColorInput
                      label="Stroke"
                      value={style.strokeColor}
                      onChange={(value) => updateStyle("strokeColor", value)}
                    />

                    <ColorInput
                      label="Fill"
                      value={style.fillColor}
                      onChange={(value) => updateStyle("fillColor", value)}
                    />

                    <ColorInput
                      label="Text"
                      value={style.textColor}
                      onChange={(value) => updateStyle("textColor", value)}
                    />

                    <ColorInput
                      label="Text BG"
                      value={style.textBackground}
                      onChange={(value) => updateStyle("textBackground", value)}
                    />
                  </div>

                  <div className="lg:col-span-2 grid md:grid-cols-4 gap-4">
                    <RangeInput
                      label={`Stroke: ${style.strokeWidth}px`}
                      min={1}
                      max={28}
                      step={1}
                      value={style.strokeWidth}
                      onChange={(value) =>
                        updateStyle("strokeWidth", Number(value))
                      }
                    />

                    <RangeInput
                      label={`Font: ${style.fontSize}px`}
                      min={14}
                      max={120}
                      step={1}
                      value={style.fontSize}
                      onChange={(value) =>
                        updateStyle("fontSize", Number(value))
                      }
                    />

                    <RangeInput
                      label={`Opacity: ${Math.round(style.opacity * 100)}%`}
                      min={0.15}
                      max={1}
                      step={0.01}
                      value={style.opacity}
                      onChange={(value) =>
                        updateStyle("opacity", Number(value))
                      }
                    />

                    <RangeInput
                      label={`Blur: ${style.blurStrength}px`}
                      min={2}
                      max={28}
                      step={1}
                      value={style.blurStrength}
                      onChange={(value) =>
                        updateStyle("blurStrength", Number(value))
                      }
                    />
                  </div>
                </div>
              )}

              {activePanel === "text" && (
                <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Text content
                    </label>
                    <input
                      type="text"
                      value={textValue}
                      onChange={(event) => setTextValue(event.target.value)}
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] bg-white"
                      placeholder="Enter text"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTool("text")}
                    className="btn-primary inline-flex items-center justify-center gap-2"
                  >
                    <Type size={17} />
                    Click Canvas to Add Text
                  </button>
                </div>
              )}

              {activePanel === "emoji" && (
                <div>
                  <p className="text-sm font-semibold mb-3">
                    Choose emoji, then click the screenshot to place it.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setSelectedEmoji(emoji);
                          setActiveTool("emoji");
                        }}
                        className={`text-2xl rounded-xl border p-3 transition ${
                          selectedEmoji === emoji
                            ? "border-[var(--primary)] bg-[#f8f4ff]"
                            : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
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
                        clearExportStats();
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
                        clearExportStats();
                      }}
                    />
                  )}

                  <RangeInput
                    label={`Editor Zoom: ${Math.round(editorZoom * 100)}%`}
                    min={0.35}
                    max={2}
                    step={0.01}
                    value={editorZoom}
                    onChange={(value) => setEditorZoom(Number(value))}
                  />

                  <div className="flex gap-2 items-end">
                    <button
                      type="button"
                      onClick={() => setShowGuides((current) => !current)}
                      className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      Guides
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSafeArea((current) => !current)}
                      className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
                    >
                      Safe
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FEEDBACK */}
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
                  <span>Creating final screenshot...</span>
                  <span>{exportProgress}%</span>
                </div>

                <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  Estimated processing time:{" "}
                  {estimatedProcessingTimeMs
                    ? Math.ceil(estimatedProcessingTimeMs / 1000)
                    : 1}
                  s
                </p>
              </div>
            )}
          </div>
        )}

        {/* ARTBOARD */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border border-[var(--border)] rounded-2xl bg-[#eef0f5] min-h-[680px] overflow-auto p-4 sm:p-6 flex items-center justify-center ${
            isDraggingFile ? "ring-2 ring-[var(--primary)]" : ""
          }`}
        >
          {!hasScreenshot ? (
            <div className="text-center">
              <ImageIcon size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-[var(--text-secondary)]">
                Upload, drop, or paste a screenshot to start editing.
              </p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="rounded-xl shadow-2xl border border-gray-300 bg-white touch-none"
              style={{
                width: `${canvasDisplayWidth}px`,
                maxWidth: "none",
                cursor: activeTool === "select" ? "default" : "crosshair",
              }}
            />
          )}
        </div>

        {/* BOTTOM STATS */}
        {hasScreenshot && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
            <InfoCard
              label="Screenshot"
              value={`${screenshot.width} × ${screenshot.height}`}
            />
            <InfoCard label="Objects" value={annotations.length} />
            <InfoCard label="Tool" value={activeTool} />
            <InfoCard label="Zoom" value={`${Math.round(editorZoom * 100)}%`} />
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
        )}

        {selectedAnnotation && (
          <div className="mt-4 bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Selected object: <strong>{selectedAnnotation.type}</strong>
            </p>

            <button
              type="button"
              onClick={deleteSelected}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Delete Selected
            </button>
          </div>
        )}
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-4">Edit Screenshots Online</h2>
        <div className="text-[var(--text-secondary)] leading-7 space-y-3">
          <p>
            This Screenshot Editor helps you annotate screenshots for tutorials,
            bug reports, ecommerce feedback, client instructions, and social
            media content. You can add arrows, text, shapes, blur sensitive
            details, highlight important areas, and export the final screenshot
            directly from your browser.
          </p>
          <p>
            The compact top toolbar keeps the screenshot artboard large and easy
            to edit, while dropdown panels keep advanced settings available
            without taking too much space.
          </p>
        </div>
      </section>

      <SuggestedTools currentToolId="screenshot-editor" />
    </div>
  );
}

function renderCanvas({
  canvas,
  screenshot,
  annotations,
  draftAnnotation,
  selectedId,
  showGuides,
  showSafeArea,
  includeEditorGuides,
  exportFormat = "image/png",
}) {
  canvas.width = screenshot.width;
  canvas.height = screenshot.height;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (exportFormat === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(screenshot.element, 0, 0, canvas.width, canvas.height);

  const allAnnotations = draftAnnotation
    ? [...annotations, draftAnnotation]
    : annotations;

  allAnnotations
    .filter((item) => item.type === "blur")
    .forEach((annotation) => drawAnnotation(ctx, annotation, screenshot));

  allAnnotations
    .filter((item) => item.type !== "blur")
    .forEach((annotation) => drawAnnotation(ctx, annotation, screenshot));

  if (includeEditorGuides) {
    if (showGuides || showSafeArea) {
      drawEditorGuides(ctx, canvas.width, canvas.height, showGuides, showSafeArea);
    }

    const selected = allAnnotations.find((item) => item.id === selectedId);

    if (selected) {
      drawSelectionGuide(ctx, selected);
    }
  }
}

function drawAnnotation(ctx, item, screenshot) {
  ctx.save();
  ctx.globalAlpha = item.opacity ?? 1;

  if (item.type === "rectangle") drawRectangle(ctx, item);
  if (item.type === "circle") drawCircle(ctx, item);
  if (item.type === "highlight") drawHighlight(ctx, item);
  if (item.type === "blur") drawBlur(ctx, item, screenshot);
  if (item.type === "spotlight") drawSpotlight(ctx, item, screenshot);
  if (item.type === "arrow") drawArrow(ctx, item);
  if (item.type === "line") drawLine(ctx, item);
  if (item.type === "freehand") drawFreehand(ctx, item);
  if (item.type === "text") drawText(ctx, item);
  if (item.type === "emoji") drawEmoji(ctx, item);
  if (item.type === "step") drawStep(ctx, item);

  ctx.restore();
}

function drawRectangle(ctx, item) {
  const box = normalizeBox(item);

  ctx.lineWidth = item.strokeWidth;
  ctx.strokeStyle = item.stroke;
  ctx.fillStyle = item.fill;

  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
}

function drawCircle(ctx, item) {
  const box = normalizeBox(item);

  ctx.lineWidth = item.strokeWidth;
  ctx.strokeStyle = item.stroke;
  ctx.fillStyle = item.fill;

  ctx.beginPath();
  ctx.ellipse(
    box.x + box.w / 2,
    box.y + box.h / 2,
    Math.abs(box.w / 2),
    Math.abs(box.h / 2),
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();
}

function drawHighlight(ctx, item) {
  const box = normalizeBox(item);

  ctx.fillStyle = item.fill || "rgba(250,204,21,0.35)";
  ctx.fillRect(box.x, box.y, box.w, box.h);
}

function drawBlur(ctx, item, screenshot) {
  const box = normalizeBox(item);

  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.filter = `blur(${item.blurStrength || 10}px)`;
  ctx.drawImage(screenshot.element, 0, 0, screenshot.width, screenshot.height);
  ctx.restore();

  ctx.save();
  ctx.lineWidth = Math.max(2, item.strokeWidth || 4);
  ctx.strokeStyle = item.stroke || "#ef4444";
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.restore();
}

function drawSpotlight(ctx, item, screenshot) {
  const box = normalizeBox(item);

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.56)";
  ctx.beginPath();
  ctx.rect(0, 0, screenshot.width, screenshot.height);
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.fill("evenodd");
  ctx.restore();

  ctx.save();
  ctx.lineWidth = item.strokeWidth || 4;
  ctx.strokeStyle = item.stroke || "#ffffff";
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.restore();
}

function drawArrow(ctx, item) {
  drawLine(ctx, item);

  const angle = Math.atan2(item.y2 - item.y1, item.x2 - item.x1);
  const headLength = Math.max(18, item.strokeWidth * 4);

  ctx.fillStyle = item.stroke;
  ctx.beginPath();
  ctx.moveTo(item.x2, item.y2);
  ctx.lineTo(
    item.x2 - headLength * Math.cos(angle - Math.PI / 6),
    item.y2 - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    item.x2 - headLength * Math.cos(angle + Math.PI / 6),
    item.y2 - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

function drawLine(ctx, item) {
  ctx.lineWidth = item.strokeWidth;
  ctx.strokeStyle = item.stroke;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(item.x1, item.y1);
  ctx.lineTo(item.x2, item.y2);
  ctx.stroke();
}

function drawFreehand(ctx, item) {
  if (!item.points?.length) return;

  ctx.lineWidth = item.strokeWidth;
  ctx.strokeStyle = item.stroke;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(item.points[0].x, item.points[0].y);

  item.points.forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });

  ctx.stroke();
}

function drawText(ctx, item) {
  ctx.font = `700 ${item.fontSize}px Arial, sans-serif`;
  ctx.textBaseline = "top";

  const metrics = ctx.measureText(item.text);
  const paddingX = item.fontSize * 0.35;
  const paddingY = item.fontSize * 0.22;
  const width = metrics.width + paddingX * 2;
  const height = item.fontSize * 1.28;

  ctx.fillStyle = item.background;
  roundRect(ctx, item.x, item.y, width, height, item.fontSize * 0.2);
  ctx.fill();

  ctx.fillStyle = item.color;
  ctx.fillText(item.text, item.x + paddingX, item.y + paddingY);
}

function drawEmoji(ctx, item) {
  ctx.font = `${item.fontSize}px Arial, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(item.emoji, item.x, item.y);
}

function drawStep(ctx, item) {
  ctx.fillStyle = item.fill;
  ctx.beginPath();
  ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = Math.max(3, item.radius * 0.12);
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.fillStyle = item.color;
  ctx.font = `800 ${item.radius * 1.05}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(item.number), item.x, item.y + 1);
}

function drawEditorGuides(ctx, width, height, showGuides, showSafeArea) {
  ctx.save();

  if (showGuides) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(155,108,227,0.85)";

    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.beginPath();
    ctx.moveTo(width / 3, 0);
    ctx.lineTo(width / 3, height);
    ctx.moveTo((width * 2) / 3, 0);
    ctx.lineTo((width * 2) / 3, height);
    ctx.moveTo(0, height / 3);
    ctx.lineTo(width, height / 3);
    ctx.moveTo(0, (height * 2) / 3);
    ctx.lineTo(width, (height * 2) / 3);
    ctx.stroke();
  }

  if (showSafeArea) {
    ctx.setLineDash([12, 8]);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(width * 0.08, height * 0.08, width * 0.84, height * 0.84);
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function drawSelectionGuide(ctx, item) {
  const box = getAnnotationBox(item);

  if (!box) return;

  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#9b6ce3";
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.setLineDash([]);

  const handles = [
    [box.x, box.y],
    [box.x + box.w / 2, box.y],
    [box.x + box.w, box.y],
    [box.x, box.y + box.h / 2],
    [box.x + box.w, box.y + box.h / 2],
    [box.x, box.y + box.h],
    [box.x + box.w / 2, box.y + box.h],
    [box.x + box.w, box.y + box.h],
  ];

  handles.forEach(([x, y]) => {
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#9b6ce3";
    ctx.lineWidth = 2;
    ctx.fillRect(x - 6, y - 6, 12, 12);
    ctx.strokeRect(x - 6, y - 6, 12, 12);
  });

  ctx.restore();
}

function ColorInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">
        {label}
      </span>
      <input
        type="color"
        value={createColorInputValue(value)}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-11 rounded-xl border border-[var(--border)] bg-white p-1"
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
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

function cloneAnnotation(annotation) {
  return JSON.parse(JSON.stringify(annotation));
}

function cloneAnnotations(items) {
  return JSON.parse(JSON.stringify(items));
}

function normalizeBox(item) {
  const x = Math.min(item.x, item.x + item.w);
  const y = Math.min(item.y, item.y + item.h);
  const w = Math.abs(item.w);
  const h = Math.abs(item.h);

  return { x, y, w, h };
}

function normalizeAnnotation(item) {
  if (
    ["rectangle", "circle", "highlight", "blur", "spotlight"].includes(
      item.type
    )
  ) {
    return {
      ...item,
      ...normalizeBox(item),
    };
  }

  return item;
}

function isValidAnnotation(item) {
  if (!item) return false;

  if (
    ["rectangle", "circle", "highlight", "blur", "spotlight"].includes(
      item.type
    )
  ) {
    return Math.abs(item.w) > 8 && Math.abs(item.h) > 8;
  }

  if (item.type === "arrow" || item.type === "line") {
    return Math.hypot(item.x2 - item.x1, item.y2 - item.y1) > 12;
  }

  if (item.type === "freehand") {
    return item.points?.length > 2;
  }

  return true;
}

function moveAnnotation(item, dx, dy) {
  if (
    ["rectangle", "circle", "highlight", "blur", "spotlight"].includes(
      item.type
    )
  ) {
    return { ...item, x: item.x + dx, y: item.y + dy };
  }

  if (item.type === "arrow" || item.type === "line") {
    return {
      ...item,
      x1: item.x1 + dx,
      y1: item.y1 + dy,
      x2: item.x2 + dx,
      y2: item.y2 + dy,
    };
  }

  if (item.type === "freehand") {
    return {
      ...item,
      points: item.points.map((point) => ({
        x: point.x + dx,
        y: point.y + dy,
      })),
    };
  }

  return { ...item, x: item.x + dx, y: item.y + dy };
}

function getAnnotationAtPoint(point, annotations) {
  for (let i = annotations.length - 1; i >= 0; i -= 1) {
    if (isPointInsideAnnotation(point, annotations[i])) {
      return annotations[i];
    }
  }

  return null;
}

function isPointInsideAnnotation(point, item) {
  const box = getAnnotationBox(item);

  if (!box) return false;

  return (
    point.x >= box.x - 10 &&
    point.x <= box.x + box.w + 10 &&
    point.y >= box.y - 10 &&
    point.y <= box.y + box.h + 10
  );
}

function getAnnotationBox(item) {
  if (
    ["rectangle", "circle", "highlight", "blur", "spotlight"].includes(
      item.type
    )
  ) {
    return normalizeBox(item);
  }

  if (item.type === "arrow" || item.type === "line") {
    return {
      x: Math.min(item.x1, item.x2),
      y: Math.min(item.y1, item.y2),
      w: Math.abs(item.x2 - item.x1),
      h: Math.abs(item.y2 - item.y1),
    };
  }

  if (item.type === "freehand") {
    const xs = item.points.map((point) => point.x);
    const ys = item.points.map((point) => point.y);

    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    };
  }

  if (item.type === "text") {
    return {
      x: item.x,
      y: item.y,
      w: Math.max(90, item.text.length * item.fontSize * 0.62),
      h: item.fontSize * 1.35,
    };
  }

  if (item.type === "emoji") {
    return {
      x: item.x - item.fontSize / 2,
      y: item.y - item.fontSize / 2,
      w: item.fontSize,
      h: item.fontSize,
    };
  }

  if (item.type === "step") {
    return {
      x: item.x - item.radius,
      y: item.y - item.radius,
      w: item.radius * 2,
      h: item.radius * 2,
    };
  }

  return null;
}

function roundRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

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
  return String(fileName || "screenshot").replace(/\.[^/.]+$/, "");
}

function createColorInputValue(value) {
  if (String(value).startsWith("#")) return value;
  return "#ef4444";
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