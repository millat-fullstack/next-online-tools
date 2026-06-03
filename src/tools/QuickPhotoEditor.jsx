// src/tools/QuickPhotoEditor.jsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Undo2,
  Redo2,
  Type,
  Square,
  Circle as CircleIcon,
  ArrowUpRight,
  PenLine,
  EyeOff,
  Copy,
  SlidersHorizontal,
  Settings2,
  MousePointer2,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Move,
  Maximize2,
  Eye,
  Trash2,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Quick Photo Editor",
  path: "/quick-photo-editor",
  category: "Image Tools",
  description:
    "Edit photos online with text, draw, blur, patch, clone, shapes, resize, and quick export.",
  metaTitle: "Quick Photo Editor Online | Edit, Retouch, Blur, Draw & Add Text",
  metaDescription:
    "Edit photos online for free. Upload a photo, add text, draw, blur private areas, patch small marks, clone details, resize, and download as PNG, JPG, or WEBP.",
};

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_CANVAS_LONG_SIDE = 2200;
const MIN_PROCESSING_TIME_MS = 6000;
const MAX_HISTORY = 30;

const TOOLS = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "text", label: "Text", icon: Type },
  { id: "draw", label: "Draw", icon: PenLine },
  { id: "blur", label: "Blur", icon: EyeOff },
  { id: "patch", label: "Patch", icon: Sparkles },
  { id: "clone", label: "Clone", icon: Copy },
  { id: "restore", label: "Restore", icon: RotateCcw },
  { id: "rectangle", label: "Rectangle", icon: Square },
  { id: "circle", label: "Circle", icon: CircleIcon },
  { id: "arrow", label: "Arrow", icon: ArrowUpRight },
];

const SIZE_PRESETS = [
  { id: "original", label: "Original Size", width: null, height: null },
  { id: "instagram-square", label: "Instagram Square", width: 1080, height: 1080 },
  { id: "instagram-story", label: "Instagram Story", width: 1080, height: 1920 },
  { id: "facebook-post", label: "Facebook Post", width: 1200, height: 630 },
  { id: "youtube-thumbnail", label: "YouTube Thumbnail", width: 1280, height: 720 },
  { id: "linkedin-post", label: "LinkedIn Post", width: 1200, height: 627 },
  { id: "pinterest-pin", label: "Pinterest Pin", width: 1000, height: 1500 },
  { id: "product-square", label: "Product Image", width: 1000, height: 1000 },
];

const OUTPUT_FORMATS = [
  { value: "image/png", label: "PNG", extension: "png" },
  { value: "image/jpeg", label: "JPG", extension: "jpg" },
  { value: "image/webp", label: "WEBP", extension: "webp" },
];

const TEXT_PRESETS = [
  {
    label: "White Bold",
    color: "#ffffff",
    background: "#111827",
    fontSize: 48,
    bold: true,
    shadow: true,
  },
  {
    label: "Black Label",
    color: "#111827",
    background: "#ffffff",
    fontSize: 44,
    bold: true,
    shadow: true,
  },
  {
    label: "Sale Red",
    color: "#ffffff",
    background: "#ef4444",
    fontSize: 52,
    bold: true,
    shadow: true,
  },
  {
    label: "Premium Purple",
    color: "#ffffff",
    background: "#9b6ce3",
    fontSize: 46,
    bold: true,
    shadow: true,
  },
  {
    label: "Yellow Highlight",
    color: "#111827",
    background: "#facc15",
    fontSize: 44,
    bold: true,
    shadow: false,
  },
];

export default function QuickPhotoEditor() {
  const fileInputRef = useRef(null);
  const visibleCanvasRef = useRef(null);
  const workingCanvasRef = useRef(document.createElement("canvas"));
  const originalCanvasRef = useRef(document.createElement("canvas"));
  const cloneSnapshotRef = useRef(null);

  const imageUrlRef = useRef("");
  const outputUrlRef = useRef("");

  const pointerRef = useRef({
    active: false,
    mode: "",
    startPoint: null,
    lastPoint: null,
    selectedStart: null,
    cloneStartTarget: null,
  });

  const [imageInfo, setImageInfo] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 1000 });
  const [draftSize, setDraftSize] = useState({ width: 1000, height: 1000 });

  const [activeTool, setActiveTool] = useState("select");
  const [activePanel, setActivePanel] = useState("");

  const [objects, setObjects] = useState([]);
  const [draftObject, setDraftObject] = useState(null);
  const [selectedObjectId, setSelectedObjectId] = useState(null);

  const [historyPast, setHistoryPast] = useState([]);
  const [historyFuture, setHistoryFuture] = useState([]);

  const [brushSize, setBrushSize] = useState(36);
  const [brushOpacity, setBrushOpacity] = useState(0.85);
  const [brushColor, setBrushColor] = useState("#ef4444");
  const [blurStrength, setBlurStrength] = useState(10);
  const [patchStrength, setPatchStrength] = useState(0.85);

  const [textValue, setTextValue] = useState("Add text");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textBackground, setTextBackground] = useState("#111827");
  const [fontSize, setFontSize] = useState(48);
  const [boldText, setBoldText] = useState(true);
  const [textShadow, setTextShadow] = useState(true);

  const [shapeFill, setShapeFill] = useState("rgba(239,68,68,0.12)");
  const [shapeStroke, setShapeStroke] = useState("#ef4444");
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(6);

  const [cloneSource, setCloneSource] = useState(null);
  const [isSettingCloneSource, setIsSettingCloneSource] = useState(false);

  const [showOriginal, setShowOriginal] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [previewZoom, setPreviewZoom] = useState(1);

  const [outputFormat, setOutputFormat] = useState("image/png");
  const [quality, setQuality] = useState(0.94);

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [exportProgress, setExportProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [lastOutputSize, setLastOutputSize] = useState(0);
  const [outputPreviewUrl, setOutputPreviewUrl] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const hasImage = Boolean(imageInfo);

  const selectedObject = useMemo(() => {
    return objects.find((item) => item.id === selectedObjectId) || null;
  }, [objects, selectedObjectId]);

  const selectedOutputFormat = useMemo(() => {
    return OUTPUT_FORMATS.find((item) => item.value === outputFormat) || OUTPUT_FORMATS[0];
  }, [outputFormat]);

  const previewWidth = useMemo(() => {
    if (!canvasSize.width) return 0;

    const isLandscape = canvasSize.width >= canvasSize.height;
    const maxWidth = isLandscape ? 1120 : 650;

    return Math.min(maxWidth, canvasSize.width) * previewZoom;
  }, [canvasSize, previewZoom]);

  const processText = processingTimeMs
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

      const imageElement = await loadImage(objectUrl);

      const naturalWidth = imageElement.naturalWidth || imageElement.width;
      const naturalHeight = imageElement.naturalHeight || imageElement.height;

      const scale = Math.min(
        1,
        MAX_CANVAS_LONG_SIDE / Math.max(naturalWidth, naturalHeight)
      );

      const width = Math.max(1, Math.round(naturalWidth * scale));
      const height = Math.max(1, Math.round(naturalHeight * scale));

      setupCanvasFromImage({
        imageElement,
        width,
        height,
      });

      setImageInfo({
        name: file.name || "photo",
        size: file.size,
        type: file.type,
        width,
        height,
        naturalWidth,
        naturalHeight,
      });

      setCanvasSize({ width, height });
      setDraftSize({ width, height });
      setObjects([]);
      setDraftObject(null);
      setSelectedObjectId(null);
      setHistoryPast([]);
      setHistoryFuture([]);
      setCloneSource(null);
      setIsSettingCloneSource(false);
      setShowOriginal(false);
      setPreviewZoom(1);
      setOutputFormat(getDefaultOutputFormat(file.type));

      setSuccessMessage(
        "Photo loaded. Use the top toolbar to add text, draw, blur, patch, clone, or resize."
      );
    } catch {
      setErrorMessage("Could not load this photo. Please try another image.");

      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = "";
      }

      setImageInfo(null);
    } finally {
      setIsLoadingImage(false);
      resetFileInput();
    }
  }, []);

  useEffect(() => {
    renderVisibleCanvas();
  }, [
    imageInfo,
    canvasSize,
    objects,
    draftObject,
    selectedObjectId,
    showOriginal,
    showGuides,
    cloneSource,
    activeTool,
  ]);

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

  function setupCanvasFromImage({ imageElement, width, height }) {
    const workingCanvas = workingCanvasRef.current;
    const originalCanvas = originalCanvasRef.current;

    workingCanvas.width = width;
    workingCanvas.height = height;
    originalCanvas.width = width;
    originalCanvas.height = height;

    const workingCtx = workingCanvas.getContext("2d");
    const originalCtx = originalCanvas.getContext("2d");

    workingCtx.clearRect(0, 0, width, height);
    originalCtx.clearRect(0, 0, width, height);

    workingCtx.imageSmoothingEnabled = true;
    workingCtx.imageSmoothingQuality = "high";
    originalCtx.imageSmoothingEnabled = true;
    originalCtx.imageSmoothingQuality = "high";

    workingCtx.drawImage(imageElement, 0, 0, width, height);
    originalCtx.drawImage(imageElement, 0, 0, width, height);
  }

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

  function renderVisibleCanvas() {
    const canvas = visibleCanvasRef.current;

    if (!canvas || !hasImage) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showOriginal) {
      ctx.drawImage(originalCanvasRef.current, 0, 0);
      return;
    }

    ctx.drawImage(workingCanvasRef.current, 0, 0);
    drawObjects(ctx, objects);

    if (draftObject) {
      drawObject(ctx, draftObject);
    }

    if (showGuides) {
      drawEditorGuides(ctx, canvas.width, canvas.height);
    }

    if (cloneSource && activeTool === "clone") {
      drawCloneSourceMarker(ctx, cloneSource);
    }

    if (selectedObject) {
      drawSelectionBox(ctx, selectedObject);
    }
  }

  function renderFinalCanvas({ includeObjects = true } = {}) {
    const canvas = document.createElement("canvas");

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas is not supported.");
    }

    if (outputFormat === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(workingCanvasRef.current, 0, 0);

    if (includeObjects) {
      drawObjects(ctx, objects);
    }

    return canvas;
  }

  function captureSnapshot() {
    return {
      bitmap: workingCanvasRef.current.toDataURL("image/png"),
      original: originalCanvasRef.current.toDataURL("image/png"),
      objects: cloneObjects(objects),
      canvasSize: { ...canvasSize },
    };
  }

  function pushHistory() {
    setHistoryPast((current) => [...current, captureSnapshot()].slice(-MAX_HISTORY));
    setHistoryFuture([]);
  }

  async function restoreSnapshot(snapshot) {
    const workingImage = await loadImage(snapshot.bitmap);
    const originalImage = await loadImage(snapshot.original);

    workingCanvasRef.current.width = snapshot.canvasSize.width;
    workingCanvasRef.current.height = snapshot.canvasSize.height;
    originalCanvasRef.current.width = snapshot.canvasSize.width;
    originalCanvasRef.current.height = snapshot.canvasSize.height;

    workingCanvasRef.current.getContext("2d").drawImage(workingImage, 0, 0);
    originalCanvasRef.current.getContext("2d").drawImage(originalImage, 0, 0);

    setCanvasSize(snapshot.canvasSize);
    setDraftSize(snapshot.canvasSize);
    setObjects(cloneObjects(snapshot.objects));
    setSelectedObjectId(null);
    clearOutput();

    window.setTimeout(renderVisibleCanvas, 0);
  }

  async function undo() {
    if (!historyPast.length) return;

    const previous = historyPast[historyPast.length - 1];
    const remaining = historyPast.slice(0, -1);

    setHistoryFuture((current) => [captureSnapshot(), ...current].slice(0, MAX_HISTORY));
    setHistoryPast(remaining);

    await restoreSnapshot(previous);
  }

  async function redo() {
    if (!historyFuture.length) return;

    const next = historyFuture[0];
    const remaining = historyFuture.slice(1);

    setHistoryPast((current) => [...current, captureSnapshot()].slice(-MAX_HISTORY));
    setHistoryFuture(remaining);

    await restoreSnapshot(next);
  }

  function getCanvasPoint(event) {
    const canvas = visibleCanvasRef.current;

    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return null;

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handlePointerDown(event) {
    if (!hasImage || showOriginal) return;

    const point = getCanvasPoint(event);

    if (!point) return;

    event.preventDefault();

    if (activeTool === "select") {
      const selected = getObjectAtPoint(point, objects);

      setSelectedObjectId(selected?.id || null);

      if (selected) {
        pushHistory();

        pointerRef.current = {
          active: true,
          mode: "move-object",
          startPoint: point,
          lastPoint: point,
          selectedStart: cloneObject(selected),
          cloneStartTarget: null,
        };

        event.currentTarget.setPointerCapture?.(event.pointerId);
      }

      return;
    }

    if (activeTool === "text") {
      pushHistory();

      const textObject = createTextObject(point);

      setObjects((current) => [...current, textObject]);
      setSelectedObjectId(textObject.id);
      setActiveTool("select");
      clearOutput();
      return;
    }

    if (["rectangle", "circle", "arrow"].includes(activeTool)) {
      setDraftObject(createDraftObject(activeTool, point));

      pointerRef.current = {
        active: true,
        mode: "draw-object",
        startPoint: point,
        lastPoint: point,
        selectedStart: null,
        cloneStartTarget: null,
      };

      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }

    if (activeTool === "clone" && (isSettingCloneSource || !cloneSource)) {
      setCloneSource(point);
      setIsSettingCloneSource(false);
      setSuccessMessage("Clone source selected. Now brush over the area you want to edit.");
      window.setTimeout(renderVisibleCanvas, 0);
      return;
    }

    if (["draw", "blur", "patch", "clone", "restore"].includes(activeTool)) {
      if (activeTool === "clone" && !cloneSource) {
        setErrorMessage("Please set a clone source first.");
        return;
      }

      pushHistory();
      clearOutput();

      if (activeTool === "clone") {
        cloneSnapshotRef.current = cloneCanvas(workingCanvasRef.current);
      }

      pointerRef.current = {
        active: true,
        mode: "brush",
        startPoint: point,
        lastPoint: point,
        selectedStart: null,
        cloneStartTarget: point,
      };

      applyBrush(point, point);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
  }

  function handlePointerMove(event) {
    if (!pointerRef.current.active || !hasImage || showOriginal) return;

    const point = getCanvasPoint(event);

    if (!point) return;

    event.preventDefault();

    if (pointerRef.current.mode === "move-object" && selectedObjectId) {
      const startPoint = pointerRef.current.startPoint;
      const selectedStart = pointerRef.current.selectedStart;

      const dx = point.x - startPoint.x;
      const dy = point.y - startPoint.y;

      setObjects((current) =>
        current.map((item) =>
          item.id === selectedObjectId ? moveObject(selectedStart, dx, dy) : item
        )
      );

      clearOutput();
      return;
    }

    if (pointerRef.current.mode === "draw-object" && draftObject) {
      setDraftObject(updateDraftObject(draftObject, pointerRef.current.startPoint, point));
      return;
    }

    if (pointerRef.current.mode === "brush") {
      applyBrush(pointerRef.current.lastPoint || point, point);
      pointerRef.current.lastPoint = point;
    }
  }

  function handlePointerUp(event) {
    if (!pointerRef.current.active) return;

    event.preventDefault();

    if (pointerRef.current.mode === "draw-object" && draftObject) {
      const finalObject = normalizeObject(draftObject);

      if (isValidObject(finalObject)) {
        pushHistory();
        setObjects((current) => [...current, finalObject]);
        setSelectedObjectId(finalObject.id);
      }

      setDraftObject(null);
      setActiveTool("select");
      clearOutput();
    }

    pointerRef.current = {
      active: false,
      mode: "",
      startPoint: null,
      lastPoint: null,
      selectedStart: null,
      cloneStartTarget: null,
    };

    cloneSnapshotRef.current = null;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    window.setTimeout(renderVisibleCanvas, 0);
  }

  function createTextObject(point) {
    return {
      id: createId(),
      type: "text",
      x: point.x,
      y: point.y,
      text: textValue.trim() || "Text",
      color: textColor,
      background: textBackground,
      fontSize,
      bold: boldText,
      shadow: textShadow,
      opacity: 1,
    };
  }

  function createDraftObject(type, point) {
    if (type === "arrow") {
      return {
        id: createId(),
        type,
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: point.y,
        stroke: shapeStroke,
        strokeWidth: shapeStrokeWidth,
        opacity: brushOpacity,
      };
    }

    return {
      id: createId(),
      type,
      x: point.x,
      y: point.y,
      w: 0,
      h: 0,
      fill: shapeFill,
      stroke: shapeStroke,
      strokeWidth: shapeStrokeWidth,
      opacity: brushOpacity,
    };
  }

  function updateDraftObject(object, startPoint, point) {
    if (object.type === "arrow") {
      return {
        ...object,
        x2: point.x,
        y2: point.y,
      };
    }

    return {
      ...object,
      x: startPoint.x,
      y: startPoint.y,
      w: point.x - startPoint.x,
      h: point.y - startPoint.y,
    };
  }

  function applyBrush(fromPoint, toPoint) {
    const workingCanvas = workingCanvasRef.current;
    const ctx = workingCanvas.getContext("2d");

    if (!ctx) return;

    if (activeTool === "draw") {
      drawBrushLine(ctx, fromPoint, toPoint, {
        color: brushColor,
        size: brushSize,
        opacity: brushOpacity,
      });
    }

    if (activeTool === "blur") {
      applyBlurBrush(workingCanvas, toPoint, {
        size: brushSize,
        strength: blurStrength,
      });
    }

    if (activeTool === "patch") {
      applyPatchBrush(workingCanvas, toPoint, {
        size: brushSize,
        strength: patchStrength,
      });
    }

    if (activeTool === "restore") {
      applyRestoreBrush(workingCanvas, originalCanvasRef.current, toPoint, {
        size: brushSize,
      });
    }

    if (activeTool === "clone") {
      applyCloneBrush({
        targetCanvas: workingCanvas,
        sourceCanvas: cloneSnapshotRef.current || workingCanvas,
        targetPoint: toPoint,
        cloneSource,
        cloneStartTarget: pointerRef.current.cloneStartTarget,
        brushSize,
        opacity: brushOpacity,
      });
    }

    renderVisibleCanvas();
  }

  function applyTextPreset(preset) {
    setTextColor(preset.color);
    setTextBackground(preset.background);
    setFontSize(preset.fontSize);
    setBoldText(preset.bold);
    setTextShadow(preset.shadow);
  }

  function deleteSelectedObject() {
    if (!selectedObjectId) return;

    pushHistory();

    setObjects((current) => current.filter((item) => item.id !== selectedObjectId));
    setSelectedObjectId(null);
    clearOutput();
  }

  function applySizePreset(presetId) {
    if (!imageInfo) return;

    const preset = SIZE_PRESETS.find((item) => item.id === presetId);

    if (!preset) return;

    if (preset.id === "original") {
      setDraftSize({
        width: imageInfo.width,
        height: imageInfo.height,
      });
      return;
    }

    setDraftSize({
      width: preset.width,
      height: preset.height,
    });
  }

  function applyCanvasResize() {
    if (!hasImage) return;

    const nextWidth = clampNumber(draftSize.width, 100, 5000);
    const nextHeight = clampNumber(draftSize.height, 100, 5000);

    if (nextWidth === canvasSize.width && nextHeight === canvasSize.height) {
      return;
    }

    pushHistory();

    const scaleX = nextWidth / canvasSize.width;
    const scaleY = nextHeight / canvasSize.height;

    workingCanvasRef.current = resizeCanvas(workingCanvasRef.current, nextWidth, nextHeight);
    originalCanvasRef.current = resizeCanvas(originalCanvasRef.current, nextWidth, nextHeight);

    setObjects((current) => current.map((object) => scaleObject(object, scaleX, scaleY)));

    setCanvasSize({
      width: nextWidth,
      height: nextHeight,
    });

    clearOutput();

    window.setTimeout(renderVisibleCanvas, 0);
  }

  async function exportImage({ downloadAfterCreate = true } = {}) {
    if (!hasImage) {
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

      const exportCanvas = renderFinalCanvas();

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
      setSuccessMessage(`Photo edited in ${(actualProcessingTime / 1000).toFixed(1)}s.`);

      if (downloadAfterCreate) {
        downloadBlob(blob);
      }
    } catch {
      setErrorMessage("Could not export the edited photo. Please try again.");
    } finally {
      setIsExporting(false);

      window.setTimeout(() => {
        setExportProgress(0);
      }, 900);
    }
  }

  function downloadBlob(blob) {
    if (!blob && !outputPreviewUrl) {
      setErrorMessage("Please create the edited image first.");
      return;
    }

    const link = document.createElement("a");
    const fileName = getFileBaseName(imageInfo?.name || "photo");

    link.href = blob ? URL.createObjectURL(blob) : outputPreviewUrl;
    link.download = `edited-${fileName}.${selectedOutputFormat.extension}`;

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

    workingCanvasRef.current = document.createElement("canvas");
    originalCanvasRef.current = document.createElement("canvas");

    setImageInfo(null);
    setCanvasSize({ width: 1000, height: 1000 });
    setDraftSize({ width: 1000, height: 1000 });
    setActiveTool("select");
    setActivePanel("");
    setObjects([]);
    setDraftObject(null);
    setSelectedObjectId(null);
    setHistoryPast([]);
    setHistoryFuture([]);
    setCloneSource(null);
    setIsSettingCloneSource(false);
    setShowOriginal(false);
    setPreviewZoom(1);
    setOutputFormat("image/png");
    setQuality(0.94);
    setIsDraggingFile(false);
    setIsLoadingImage(false);
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

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Sparkles size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Quick Photo Editor</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Edit photos quickly with text, draw, blur, patch, clone, restore,
          shapes, and resize tools. Your photo is processed locally in your
          browser.
        </p>
      </section>

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
              Upload, drop, or paste photo
            </h2>

            <p className="text-sm text-[var(--text-secondary)]">
              Supports JPG, PNG, WEBP, GIF, and BMP. You can also paste an image
              with <strong>Ctrl + V</strong>. Max file size:{" "}
              <strong>{MAX_FILE_SIZE_MB} MB</strong>.
            </p>
          </div>
        )}

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

            {TOOLS.map((tool) => {
              const Icon = tool.icon;

              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    setActiveTool(tool.id);

                    if (tool.id === "text") setActivePanel("text");

                    if (["draw", "blur", "patch", "clone", "restore"].includes(tool.id)) {
                      setActivePanel("brush");
                    }
                  }}
                  disabled={!hasImage}
                  className={`w-10 h-10 rounded-xl border inline-flex items-center justify-center ${
                    !hasImage
                      ? "opacity-40 cursor-not-allowed"
                      : activeTool === tool.id
                        ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                        : "border-[var(--border)] hover:bg-[#f8f4ff]"
                  }`}
                  title={tool.label}
                >
                  <Icon size={18} />
                </button>
              );
            })}

            <div className="w-px h-8 bg-[var(--border)] mx-1" />

            <IconButton disabled={!historyPast.length} title="Undo" onClick={undo}>
              <Undo2 size={18} />
            </IconButton>

            <IconButton disabled={!historyFuture.length} title="Redo" onClick={redo}>
              <Redo2 size={18} />
            </IconButton>

            <IconButton
              disabled={!selectedObjectId}
              title="Delete selected object"
              onClick={deleteSelectedObject}
            >
              <Trash2 size={18} />
            </IconButton>

            <button
              type="button"
              onClick={() => setShowOriginal((current) => !current)}
              disabled={!hasImage}
              className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm ${
                !hasImage
                  ? "opacity-40 cursor-not-allowed"
                  : showOriginal
                    ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                    : "border-[var(--border)] hover:bg-[#f8f4ff]"
              }`}
            >
              <Eye size={17} />
              Before
            </button>

            <ToolbarButton
              active={activePanel === "text"}
              icon={<Type size={17} />}
              label="Text"
              onClick={() => setActivePanel(activePanel === "text" ? "" : "text")}
            />

            <ToolbarButton
              active={activePanel === "brush"}
              icon={<SlidersHorizontal size={17} />}
              label="Brush"
              onClick={() => setActivePanel(activePanel === "brush" ? "" : "brush")}
            />

            <ToolbarButton
              active={activePanel === "size"}
              icon={<Maximize2 size={17} />}
              label="Size"
              onClick={() => setActivePanel(activePanel === "size" ? "" : "size")}
            />

            <ToolbarButton
              active={activePanel === "export"}
              icon={<Settings2 size={17} />}
              label="Export"
              onClick={() => setActivePanel(activePanel === "export" ? "" : "export")}
            />

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => exportImage({ downloadAfterCreate: true })}
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

          {activePanel && (
            <div className="mt-3 border border-[var(--border)] rounded-2xl bg-[#fafafa] p-4">
              {activePanel === "text" && (
                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Text
                    </label>
                    <input
                      type="text"
                      value={textValue}
                      onChange={(event) => setTextValue(event.target.value)}
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] bg-white"
                      placeholder="Enter text"
                    />

                    <p className="text-xs text-[var(--text-secondary)] mt-2">
                      Choose Text tool, then click on the photo to place text.
                    </p>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {TEXT_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyTextPreset(preset)}
                          className="px-3 py-2 rounded-xl border border-[var(--border)] bg-white hover:bg-[#f4edff] text-sm font-semibold"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <ColorInput label="Text" value={textColor} onChange={setTextColor} />
                    <ColorInput label="Background" value={textBackground} onChange={setTextBackground} />

                    <RangeInput
                      label={`Font: ${fontSize}px`}
                      min={14}
                      max={130}
                      step={1}
                      value={fontSize}
                      onChange={(value) => setFontSize(Number(value))}
                    />

                    <label className="flex items-center justify-between gap-3 bg-white border border-[var(--border)] rounded-xl p-4 cursor-pointer">
                      <span className="font-semibold text-sm">Bold</span>
                      <input
                        type="checkbox"
                        checked={boldText}
                        onChange={(event) => setBoldText(event.target.checked)}
                        className="w-4 h-4 accent-[var(--primary)]"
                      />
                    </label>
                  </div>
                </div>
              )}

              {activePanel === "brush" && (
                <div className="grid md:grid-cols-5 gap-4">
                  <ColorInput label="Brush Color" value={brushColor} onChange={setBrushColor} />

                  <RangeInput
                    label={`Brush: ${brushSize}px`}
                    min={4}
                    max={180}
                    step={1}
                    value={brushSize}
                    onChange={(value) => setBrushSize(Number(value))}
                  />

                  <RangeInput
                    label={`Opacity: ${Math.round(brushOpacity * 100)}%`}
                    min={0.1}
                    max={1}
                    step={0.01}
                    value={brushOpacity}
                    onChange={(value) => setBrushOpacity(Number(value))}
                  />

                  <RangeInput
                    label={`Blur: ${blurStrength}px`}
                    min={2}
                    max={32}
                    step={1}
                    value={blurStrength}
                    onChange={(value) => setBlurStrength(Number(value))}
                  />

                  <RangeInput
                    label={`Patch: ${Math.round(patchStrength * 100)}%`}
                    min={0.2}
                    max={1}
                    step={0.01}
                    value={patchStrength}
                    onChange={(value) => setPatchStrength(Number(value))}
                  />

                  <div className="md:col-span-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTool("clone");
                        setIsSettingCloneSource(true);
                        setSuccessMessage("Click a clean area on the photo to set the clone source.");
                      }}
                      disabled={!hasImage}
                      className="btn-secondary inline-flex items-center justify-center gap-2"
                    >
                      <Copy size={16} />
                      Set Clone Source
                    </button>

                    <button
                      type="button"
                      onClick={() => setCloneSource(null)}
                      disabled={!cloneSource}
                      className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                        !cloneSource ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <RotateCcw size={16} />
                      Clear Source
                    </button>

                    <p className="text-sm text-[var(--text-secondary)] self-center">
                      Clone source:{" "}
                      {cloneSource
                        ? `${Math.round(cloneSource.x)}, ${Math.round(cloneSource.y)}`
                        : "not set"}
                    </p>
                  </div>
                </div>
              )}

              {activePanel === "size" && (
                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
                  <div>
                    <p className="text-sm font-semibold mb-3">Size presets</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applySizePreset(preset.id)}
                          className="px-3 py-2 rounded-xl border border-[var(--border)] bg-white hover:bg-[#f4edff] text-sm font-semibold"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Width
                      </label>
                      <input
                        type="number"
                        value={draftSize.width}
                        min="100"
                        max="5000"
                        onChange={(event) =>
                          setDraftSize((current) => ({
                            ...current,
                            width: Number(event.target.value),
                          }))
                        }
                        className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Height
                      </label>
                      <input
                        type="number"
                        value={draftSize.height}
                        min="100"
                        max="5000"
                        onChange={(event) =>
                          setDraftSize((current) => ({
                            ...current,
                            height: Number(event.target.value),
                          }))
                        }
                        className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={applyCanvasResize}
                      className="btn-primary self-end"
                    >
                      Apply Size
                    </button>
                  </div>
                </div>
              )}

              {activePanel === "export" && (
                <div className="grid md:grid-cols-5 gap-4">
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

                  {(outputFormat === "image/jpeg" || outputFormat === "image/webp") && (
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

                  <RangeInput
                    label={`Preview Zoom: ${Math.round(previewZoom * 100)}%`}
                    min={0.35}
                    max={2}
                    step={0.01}
                    value={previewZoom}
                    onChange={(value) => setPreviewZoom(Number(value))}
                  />

                  <InfoCard label="Processing" value={processText} green={Boolean(processingTimeMs)} />

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
                  <span>Creating final edited photo...</span>
                  <span>{exportProgress}%</span>
                </div>

                <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  Premium processing time: minimum 6 seconds for final output.
                </p>
              </div>
            )}
          </div>
        )}

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border border-[var(--border)] rounded-2xl bg-[#eef0f5] min-h-[700px] overflow-auto p-4 sm:p-6 flex items-center justify-center ${
            isDraggingFile ? "ring-2 ring-[var(--primary)]" : ""
          }`}
        >
          {!hasImage ? (
            <div className="text-center">
              <ImageIcon size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-[var(--text-secondary)]">
                Upload, drop, or paste a photo to start editing.
              </p>
            </div>
          ) : (
            <canvas
              ref={visibleCanvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="rounded-2xl shadow-2xl bg-white touch-none"
              style={{
                width: `${previewWidth}px`,
                maxWidth: "none",
                cursor:
                  activeTool === "select"
                    ? "default"
                    : activeTool === "text"
                      ? "text"
                      : "crosshair",
              }}
            />
          )}
        </div>

        {hasImage && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
            <InfoCard label="Canvas" value={`${canvasSize.width}×${canvasSize.height}`} />
            <InfoCard label="Tool" value={activeTool} />
            <InfoCard label="Objects" value={objects.length} />
            <InfoCard label="Clone Source" value={cloneSource ? "Set" : "Not Set"} />
            <InfoCard label="Process Time" value={processText} green={Boolean(processingTimeMs)} />
            <InfoCard
              label="Output Size"
              value={lastOutputSize ? formatBytes(lastOutputSize) : "-"}
              green={Boolean(lastOutputSize)}
            />
          </div>
        )}

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
                alt="Final edited preview"
                className="max-w-[280px] rounded-xl"
              />
            </div>
          </div>
        )}

        {hasImage && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <p className="text-sm text-blue-800">
              Clone tool: click “Set Clone Source”, choose a clean area, then
              brush over the area you want to fix. Patch tool works best for
              small marks, dust, and minor background cleanup. Use this tool only
              on photos you own or have permission to edit.
            </p>
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

      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-4">Edit Photos Online</h2>

        <div className="text-[var(--text-secondary)] leading-7 space-y-3">
          <p>
            Quick Photo Editor helps you edit photos online with simple tools
            like text, drawing, blur, patch, clone, restore, shapes, and resize.
            It is useful for ecommerce product photos, social media graphics,
            personal photos, and quick design corrections.
          </p>

          <p>
            Use the blur tool to hide private information, the patch tool to
            clean small spots, and the clone tool to copy clean texture from one
            area to another. Your photo is processed locally in your browser.
          </p>

          <p>
            Please edit only photos you own or have permission to use. Do not use
            this tool to remove watermarks, falsify documents, alter IDs, or
            mislead people.
          </p>
        </div>
      </section>

      <SuggestedTools currentToolId="quick-photo-editor" />
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

function ColorInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold mb-2 block">{label}</span>
      <input
        type="color"
        value={normalizeColor(value)}
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
      <p className={`font-bold break-all ${green ? "text-green-600" : "text-[var(--primary)]"}`}>
        {value}
      </p>
    </div>
  );
}

function drawObjects(ctx, objects) {
  objects.forEach((object) => drawObject(ctx, object));
}

function drawObject(ctx, object) {
  ctx.save();
  ctx.globalAlpha = object.opacity ?? 1;

  if (object.type === "text") drawTextObject(ctx, object);
  if (object.type === "rectangle") drawRectangleObject(ctx, object);
  if (object.type === "circle") drawCircleObject(ctx, object);
  if (object.type === "arrow") drawArrowObject(ctx, object);

  ctx.restore();
}

function drawTextObject(ctx, object) {
  ctx.font = `${object.bold ? "800" : "500"} ${object.fontSize}px Arial, sans-serif`;
  ctx.textBaseline = "top";

  const metrics = ctx.measureText(object.text);
  const paddingX = object.fontSize * 0.35;
  const paddingY = object.fontSize * 0.22;
  const width = metrics.width + paddingX * 2;
  const height = object.fontSize * 1.32;

  if (object.shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = object.fontSize * 0.22;
    ctx.shadowOffsetY = object.fontSize * 0.08;
  }

  ctx.fillStyle = object.background;
  roundRect(ctx, object.x, object.y, width, height, object.fontSize * 0.22);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.fillStyle = object.color;
  ctx.fillText(object.text, object.x + paddingX, object.y + paddingY);
}

function drawRectangleObject(ctx, object) {
  const box = normalizeBox(object);

  ctx.fillStyle = object.fill;
  ctx.strokeStyle = object.stroke;
  ctx.lineWidth = object.strokeWidth;

  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
}

function drawCircleObject(ctx, object) {
  const box = normalizeBox(object);

  ctx.fillStyle = object.fill;
  ctx.strokeStyle = object.stroke;
  ctx.lineWidth = object.strokeWidth;

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

function drawArrowObject(ctx, object) {
  ctx.strokeStyle = object.stroke;
  ctx.fillStyle = object.stroke;
  ctx.lineWidth = object.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(object.x1, object.y1);
  ctx.lineTo(object.x2, object.y2);
  ctx.stroke();

  const angle = Math.atan2(object.y2 - object.y1, object.x2 - object.x1);
  const head = Math.max(18, object.strokeWidth * 4);

  ctx.beginPath();
  ctx.moveTo(object.x2, object.y2);
  ctx.lineTo(
    object.x2 - head * Math.cos(angle - Math.PI / 6),
    object.y2 - head * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    object.x2 - head * Math.cos(angle + Math.PI / 6),
    object.y2 - head * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

function drawBrushLine(ctx, fromPoint, toPoint, { color, size, opacity }) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(fromPoint.x, fromPoint.y);
  ctx.lineTo(toPoint.x, toPoint.y);
  ctx.stroke();
  ctx.restore();
}

function applyBlurBrush(canvas, point, { size, strength }) {
  const ctx = canvas.getContext("2d");
  const radius = size / 2;
  const regionSize = size * 2;

  const sx = clampNumber(point.x - regionSize / 2, 0, canvas.width - regionSize);
  const sy = clampNumber(point.y - regionSize / 2, 0, canvas.height - regionSize);

  const temp = document.createElement("canvas");
  temp.width = regionSize;
  temp.height = regionSize;

  const tempCtx = temp.getContext("2d");
  tempCtx.filter = `blur(${strength}px)`;
  tempCtx.drawImage(canvas, sx, sy, regionSize, regionSize, 0, 0, regionSize, regionSize);

  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(temp, sx, sy);
  ctx.restore();
}

function applyPatchBrush(canvas, point, { size, strength }) {
  const ctx = canvas.getContext("2d");
  const radius = size / 2;
  const sourceOffset = size * 0.85;
  const regionSize = size * 1.8;

  const sx = clampNumber(point.x - sourceOffset, 0, canvas.width - regionSize);
  const sy = clampNumber(point.y - sourceOffset, 0, canvas.height - regionSize);

  const temp = document.createElement("canvas");
  temp.width = regionSize;
  temp.height = regionSize;

  const tempCtx = temp.getContext("2d");
  tempCtx.globalAlpha = strength;
  tempCtx.filter = `blur(${Math.max(2, size * 0.08)}px)`;
  tempCtx.drawImage(canvas, sx, sy, regionSize, regionSize, 0, 0, regionSize, regionSize);

  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(temp, point.x - regionSize / 2, point.y - regionSize / 2);
  ctx.restore();
}

function applyRestoreBrush(targetCanvas, originalCanvas, point, { size }) {
  const ctx = targetCanvas.getContext("2d");
  const radius = size / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(originalCanvas, 0, 0);
  ctx.restore();
}

function applyCloneBrush({
  targetCanvas,
  sourceCanvas,
  targetPoint,
  cloneSource,
  cloneStartTarget,
  brushSize,
  opacity,
}) {
  if (!cloneSource || !cloneStartTarget) return;

  const ctx = targetCanvas.getContext("2d");
  const radius = brushSize / 2;

  const dx = targetPoint.x - cloneStartTarget.x;
  const dy = targetPoint.y - cloneStartTarget.y;

  const sourceX = cloneSource.x + dx;
  const sourceY = cloneSource.y + dy;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.arc(targetPoint.x, targetPoint.y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(
    sourceCanvas,
    sourceX - radius,
    sourceY - radius,
    brushSize,
    brushSize,
    targetPoint.x - radius,
    targetPoint.y - radius,
    brushSize,
    brushSize
  );
  ctx.restore();
}

function drawEditorGuides(ctx, width, height) {
  ctx.save();
  ctx.strokeStyle = "rgba(155,108,227,0.45)";
  ctx.lineWidth = Math.max(1, width * 0.0015);

  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  ctx.restore();
}

function drawCloneSourceMarker(ctx, source) {
  ctx.save();
  ctx.strokeStyle = "#9b6ce3";
  ctx.fillStyle = "rgba(155,108,227,0.18)";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(source.x, source.y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(source.x - 24, source.y);
  ctx.lineTo(source.x + 24, source.y);
  ctx.moveTo(source.x, source.y - 24);
  ctx.lineTo(source.x, source.y + 24);
  ctx.stroke();

  ctx.restore();
}

function drawSelectionBox(ctx, object) {
  const box = getObjectBox(object);

  if (!box) return;

  ctx.save();
  ctx.strokeStyle = "#9b6ce3";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.setLineDash([]);
  ctx.restore();
}

function getObjectAtPoint(point, objects) {
  for (let i = objects.length - 1; i >= 0; i -= 1) {
    const box = getObjectBox(objects[i]);

    if (!box) continue;

    if (
      point.x >= box.x - 12 &&
      point.x <= box.x + box.w + 12 &&
      point.y >= box.y - 12 &&
      point.y <= box.y + box.h + 12
    ) {
      return objects[i];
    }
  }

  return null;
}

function getObjectBox(object) {
  if (object.type === "text") {
    return {
      x: object.x,
      y: object.y,
      w: Math.max(90, object.text.length * object.fontSize * 0.62),
      h: object.fontSize * 1.35,
    };
  }

  if (object.type === "rectangle" || object.type === "circle") {
    return normalizeBox(object);
  }

  if (object.type === "arrow") {
    return {
      x: Math.min(object.x1, object.x2),
      y: Math.min(object.y1, object.y2),
      w: Math.abs(object.x2 - object.x1),
      h: Math.abs(object.y2 - object.y1),
    };
  }

  return null;
}

function moveObject(object, dx, dy) {
  if (object.type === "arrow") {
    return {
      ...object,
      x1: object.x1 + dx,
      y1: object.y1 + dy,
      x2: object.x2 + dx,
      y2: object.y2 + dy,
    };
  }

  return {
    ...object,
    x: object.x + dx,
    y: object.y + dy,
  };
}

function scaleObject(object, scaleX, scaleY) {
  const averageScale = (scaleX + scaleY) / 2;

  if (object.type === "text") {
    return {
      ...object,
      x: object.x * scaleX,
      y: object.y * scaleY,
      fontSize: object.fontSize * averageScale,
    };
  }

  if (object.type === "arrow") {
    return {
      ...object,
      x1: object.x1 * scaleX,
      y1: object.y1 * scaleY,
      x2: object.x2 * scaleX,
      y2: object.y2 * scaleY,
      strokeWidth: object.strokeWidth * averageScale,
    };
  }

  return {
    ...object,
    x: object.x * scaleX,
    y: object.y * scaleY,
    w: object.w * scaleX,
    h: object.h * scaleY,
    strokeWidth: object.strokeWidth * averageScale,
  };
}

function normalizeObject(object) {
  if (object.type === "rectangle" || object.type === "circle") {
    return {
      ...object,
      ...normalizeBox(object),
    };
  }

  return object;
}

function normalizeBox(object) {
  const x = Math.min(object.x, object.x + object.w);
  const y = Math.min(object.y, object.y + object.h);
  const w = Math.abs(object.w);
  const h = Math.abs(object.h);

  return { x, y, w, h };
}

function isValidObject(object) {
  if (!object) return false;

  if (object.type === "rectangle" || object.type === "circle") {
    return object.w > 8 && object.h > 8;
  }

  if (object.type === "arrow") {
    return Math.hypot(object.x2 - object.x1, object.y2 - object.y1) > 12;
  }

  return true;
}

function resizeCanvas(sourceCanvas, width, height) {
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sourceCanvas, 0, 0, width, height);

  return canvas;
}

function cloneCanvas(sourceCanvas) {
  const canvas = document.createElement("canvas");

  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  canvas.getContext("2d").drawImage(sourceCanvas, 0, 0);

  return canvas;
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

function getDefaultOutputFormat(fileType) {
  if (fileType === "image/jpeg") return "image/jpeg";
  if (fileType === "image/webp") return "image/webp";
  return "image/png";
}

function normalizeColor(value) {
  if (String(value).startsWith("#")) return value;
  return "#ef4444";
}

function cloneObject(object) {
  return JSON.parse(JSON.stringify(object));
}

function cloneObjects(objects) {
  return JSON.parse(JSON.stringify(objects));
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

function getFileBaseName(fileName) {
  return String(fileName || "photo").replace(/\.[^/.]+$/, "");
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