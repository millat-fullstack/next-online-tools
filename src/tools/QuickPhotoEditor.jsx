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
  Settings2,
  MousePointer2,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Maximize2,
  Eye,
  Trash2,
  Images,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Quick Photo Editor",
  path: "/quick-photo-editor",
  category: "Image Tools",
  description:
    "Edit photos online with text, image layers, draw, blur, patch, clone, shapes, resize, and quick export.",
  metaTitle: "Quick Photo Editor Online | Edit, Retouch, Blur, Draw & Add Text",
  metaDescription:
    "Edit photos online for free. Upload a photo, choose canvas size, drag image on artboard, add text, blur, patch, clone, resize, and download as PNG, JPG, or WEBP.",
};

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_CANVAS_LONG_SIDE = 2200;
const MIN_PROCESSING_TIME_MS = 6000;
const MAX_HISTORY = 30;
const SNAP_DISTANCE = 10;

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
  { id: "facebook-post", label: "Facebook Post", width: 1200, height: 630 },
  { id: "instagram-square", label: "Instagram Square", width: 1080, height: 1080 },
  { id: "instagram-story", label: "Instagram Story", width: 1080, height: 1920 },
  { id: "youtube-thumbnail", label: "YouTube Thumbnail", width: 1280, height: 720 },
  { id: "linkedin-post", label: "LinkedIn Post", width: 1200, height: 627 },
  { id: "pinterest-pin", label: "Pinterest Pin", width: 1000, height: 1500 },
  { id: "product-square", label: "Product Image", width: 1000, height: 1000 },
  { id: "original", label: "Original Image Size", width: null, height: null },
  { id: "custom", label: "Custom Size", width: 1200, height: 1200 },
];

const OUTPUT_FORMATS = [
  { value: "image/png", label: "PNG", extension: "png" },
  { value: "image/jpeg", label: "JPG", extension: "jpg" },
  { value: "image/webp", label: "WEBP", extension: "webp" },
];

const FONT_OPTIONS = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Inter / System", value: "Inter, Arial, sans-serif" },
  { label: "Poppins", value: "Poppins, Arial, sans-serif" },
  { label: "Montserrat", value: "Montserrat, Arial, sans-serif" },
  { label: "Roboto", value: "Roboto, Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

const TEXT_PRESETS = [
  {
    label: "White Bold",
    color: "#ffffff",
    background: "#111827",
    fontSize: 48,
    bold: true,
    shadow: true,
    hasBackground: true,
    fontFamily: "Arial, sans-serif",
  },
  {
    label: "No Background",
    color: "#ffffff",
    background: "#111827",
    fontSize: 54,
    bold: true,
    shadow: true,
    hasBackground: false,
    fontFamily: "Arial, sans-serif",
  },
  {
    label: "Black Label",
    color: "#111827",
    background: "#ffffff",
    fontSize: 44,
    bold: true,
    shadow: true,
    hasBackground: true,
    fontFamily: "Arial, sans-serif",
  },
  {
    label: "Sale Red",
    color: "#ffffff",
    background: "#ef4444",
    fontSize: 52,
    bold: true,
    shadow: true,
    hasBackground: true,
    fontFamily: "Poppins, Arial, sans-serif",
  },
  {
    label: "Premium Purple",
    color: "#ffffff",
    background: "#9b6ce3",
    fontSize: 46,
    bold: true,
    shadow: true,
    hasBackground: true,
    fontFamily: "Montserrat, Arial, sans-serif",
  },
  {
    label: "Yellow Highlight",
    color: "#111827",
    background: "#facc15",
    fontSize: 44,
    bold: true,
    shadow: false,
    hasBackground: true,
    fontFamily: "Arial, sans-serif",
  },
];

export default function QuickPhotoEditor() {
  const mainFileInputRef = useRef(null);
  const addImageInputRef = useRef(null);

  const visibleCanvasRef = useRef(null);
  const workingCanvasRef = useRef(document.createElement("canvas"));
  const originalCanvasRef = useRef(document.createElement("canvas"));

  const imageUrlRef = useRef("");
  const outputUrlRef = useRef("");

  const pointerRef = useRef({
    active: false,
    mode: "",
    startPoint: null,
    lastPoint: null,
    selectedStart: null,
    dragStartBox: null,
  });

  const [imageInfo, setImageInfo] = useState(null);
  const [selectedSizePreset, setSelectedSizePreset] = useState("facebook-post");
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 630 });
  const [draftSize, setDraftSize] = useState({ width: 1200, height: 630 });

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

  const [textValue, setTextValue] = useState("Add text");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textBackground, setTextBackground] = useState("#111827");
  const [textHasBackground, setTextHasBackground] = useState(true);
  const [textFontFamily, setTextFontFamily] = useState("Arial, sans-serif");
  const [fontSize, setFontSize] = useState(48);
  const [boldText, setBoldText] = useState(true);
  const [textShadow, setTextShadow] = useState(true);

  const [shapeType, setShapeType] = useState("rectangle");
  const [shapeFillEnabled, setShapeFillEnabled] = useState(true);
  const [shapeStrokeEnabled, setShapeStrokeEnabled] = useState(true);
  const [shapeFillColor, setShapeFillColor] = useState("rgba(239,68,68,0.12)");
  const [shapeStrokeColor, setShapeStrokeColor] = useState("#ef4444");
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(6);

  const [patchTargetBox, setPatchTargetBox] = useState(null);
  const [patchSourcePreviewBox, setPatchSourcePreviewBox] = useState(null);
  const [isSettingPatchTarget, setIsSettingPatchTarget] = useState(false);
  const [patchStrength, setPatchStrength] = useState(1);
  const [patchFeather, setPatchFeather] = useState(18);

  const [cloneSourceBox, setCloneSourceBox] = useState(null);
  const [cloneTargetPreviewBox, setCloneTargetPreviewBox] = useState(null);
  const [isSettingCloneSource, setIsSettingCloneSource] = useState(false);
  const [showCloneSourceGuide, setShowCloneSourceGuide] = useState(false);
  const [cloneStrength, setCloneStrength] = useState(1);
  const [cloneFeather, setCloneFeather] = useState(8);

  const [showOriginal, setShowOriginal] = useState(false);
  const [showGuides] = useState(true);
  const [guideInfo, setGuideInfo] = useState(null);
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

  const settingsMode = activePanel || activeTool;

  const shouldShowSettings = [
    "image",
    "text",
    "draw",
    "blur",
    "restore",
    "rectangle",
    "circle",
    "arrow",
    "patch",
    "clone",
    "size",
    "export",
  ].includes(settingsMode);

  const processText = processingTimeMs
    ? `${(processingTimeMs / 1000).toFixed(1)}s`
    : "6s minimum";

  const handleMainImageFile = useCallback(async (file) => {
    setErrorMessage("");
    setSuccessMessage("");
    clearOutput();

    const validationError = validateImageFile(file);

    if (validationError) {
      setErrorMessage(validationError);
      resetMainFileInput();
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

      const uploadCanvasSize = getUploadCanvasSize({
        presetId: selectedSizePreset,
        draftSize,
        naturalWidth,
        naturalHeight,
      });

      const baseBox = getImageCoverBox({
        imageWidth: naturalWidth,
        imageHeight: naturalHeight,
        canvasWidth: uploadCanvasSize.width,
        canvasHeight: uploadCanvasSize.height,
      });

      setupBlankCanvas({
        width: uploadCanvasSize.width,
        height: uploadCanvasSize.height,
      });

      const baseImageObject = {
        id: createId(),
        type: "image",
        isBaseImage: true,
        src: objectUrl,
        element: imageElement,
        name: file.name || "photo",
        x: baseBox.x,
        y: baseBox.y,
        w: baseBox.w,
        h: baseBox.h,
        opacity: 1,
      };

      setImageInfo({
        name: file.name || "photo",
        size: file.size,
        type: file.type,
        width: uploadCanvasSize.width,
        height: uploadCanvasSize.height,
        naturalWidth,
        naturalHeight,
      });

      setCanvasSize(uploadCanvasSize);
      setDraftSize(uploadCanvasSize);
      setObjects([baseImageObject]);
      setDraftObject(null);
      setSelectedObjectId(baseImageObject.id);
      setHistoryPast([]);
      setHistoryFuture([]);
      setPatchTargetBox(null);
      setPatchSourcePreviewBox(null);
      setIsSettingPatchTarget(false);
      setCloneSourceBox(null);
      setCloneTargetPreviewBox(null);
      setIsSettingCloneSource(false);
      setShowCloneSourceGuide(false);
      setGuideInfo(buildGuideInfo(getObjectBox(baseImageObject), uploadCanvasSize, "Drag image to adjust"));
      setShowOriginal(false);
      setPreviewZoom(1);
      setActiveTool("select");
      setActivePanel("image");
      setOutputFormat(getDefaultOutputFormat(file.type));

      setSuccessMessage(
        "Photo loaded on your selected artboard. Drag the image to adjust it before editing."
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
      resetMainFileInput();
    }
  }, [draftSize, selectedSizePreset]);

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
    guideInfo,
    patchTargetBox,
    patchSourcePreviewBox,
    cloneSourceBox,
    cloneTargetPreviewBox,
    showCloneSourceGuide,
    activeTool,
  ]);

  useEffect(() => {
    function handlePaste(event) {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type?.startsWith("image/"));

      if (!imageItem) return;

      const file = imageItem.getAsFile();

      if (file) {
        handleMainImageFile(file);
      }
    }

    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handleMainImageFile]);

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

  function setupBlankCanvas({ width, height }) {
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

    workingCtx.fillStyle = "#ffffff";
    workingCtx.fillRect(0, 0, width, height);

    originalCtx.fillStyle = "#ffffff";
    originalCtx.fillRect(0, 0, width, height);
  }

  function commitBaseImageToCanvasIfNeeded({ withHistory = true } = {}) {
    const baseImage = objects.find((item) => item.isBaseImage);

    if (!baseImage) return false;

    if (withHistory) {
      pushHistory();
    }

    const workingCtx = workingCanvasRef.current.getContext("2d");
    const originalCtx = originalCanvasRef.current.getContext("2d");

    drawImageObject(workingCtx, baseImage);
    drawImageObject(originalCtx, baseImage);

    setObjects((current) => current.filter((item) => !item.isBaseImage));

    if (selectedObjectId === baseImage.id) {
      setSelectedObjectId(null);
    }

    setGuideInfo(null);
    clearOutput();

    return true;
  }

  function resetMainFileInput() {
    if (mainFileInputRef.current) {
      mainFileInputRef.current.value = "";
    }
  }

  function resetAddImageInput() {
    if (addImageInputRef.current) {
      addImageInputRef.current.value = "";
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

  function clearSelections() {
    setSelectedObjectId(null);
    setDraftObject(null);
    setGuideInfo(null);
    setPatchTargetBox(null);
    setPatchSourcePreviewBox(null);
    setIsSettingPatchTarget(false);
    setCloneTargetPreviewBox(null);
    setShowCloneSourceGuide(false);
  }

  function openMainFilePicker() {
    mainFileInputRef.current?.click();
  }

  function openAddImagePicker() {
    if (!hasImage) {
      setErrorMessage("Please upload a main photo first.");
      return;
    }

    addImageInputRef.current?.click();
  }

  function handleMainFileInputChange(event) {
    const file = event.target.files?.[0];

    if (file) {
      handleMainImageFile(file);
    }
  }

  async function handleAddImageInputChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateImageFile(file);

    if (validationError) {
      setErrorMessage(validationError);
      resetAddImageInput();
      return;
    }

    try {
      const src = await readFileAsDataUrl(file);
      const imageElement = await loadImage(src);

      const imageWidth = imageElement.naturalWidth || imageElement.width;
      const imageHeight = imageElement.naturalHeight || imageElement.height;

      const maxLayerSize = Math.min(canvasSize.width, canvasSize.height) * 0.32;
      const scale = Math.min(1, maxLayerSize / Math.max(imageWidth, imageHeight));

      const layerWidth = Math.max(40, imageWidth * scale);
      const layerHeight = Math.max(40, imageHeight * scale);

      const imageObject = {
        id: createId(),
        type: "image",
        src,
        element: imageElement,
        name: file.name || "added-image",
        x: canvasSize.width / 2 - layerWidth / 2,
        y: canvasSize.height / 2 - layerHeight / 2,
        w: layerWidth,
        h: layerHeight,
        opacity: 1,
      };

      pushHistory();

      setObjects((current) => [...current, imageObject]);
      setSelectedObjectId(imageObject.id);
      setActiveTool("select");
      setActivePanel("image");
      setGuideInfo(buildGuideInfo(getObjectBox(imageObject), canvasSize, "Image added"));
      clearOutput();
      setSuccessMessage("Image added. Drag it to position. Use Image settings to resize.");
    } catch {
      setErrorMessage("Could not add this image. Please try another file.");
    } finally {
      resetAddImageInput();
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDraggingFile(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleMainImageFile(file);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDraggingFile(true);
  }

  function handleDragLeave() {
    setIsDraggingFile(false);
  }

  function handleArtboardPointerDown(event) {
    if (event.target === event.currentTarget) {
      clearSelections();
    }
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

    if (activeTool === "patch" && patchTargetBox && patchSourcePreviewBox) {
      drawPatchLivePreview(
        ctx,
        workingCanvasRef.current,
        patchSourcePreviewBox,
        patchTargetBox,
        patchStrength
      );
    }

    if (activeTool === "patch" && patchTargetBox) {
      drawAreaBox(ctx, patchTargetBox, "#ef4444", "Patch Target");
    }

    if (activeTool === "patch" && patchSourcePreviewBox) {
      drawAreaBox(ctx, patchSourcePreviewBox, "#16a34a", "Clean Source");
    }

    if (activeTool === "clone" && cloneSourceBox && cloneTargetPreviewBox) {
      drawCloneLivePreview(
        ctx,
        workingCanvasRef.current,
        cloneSourceBox,
        cloneTargetPreviewBox,
        cloneStrength
      );
    }

    if (activeTool === "clone" && cloneSourceBox && showCloneSourceGuide) {
      drawAreaBox(ctx, cloneSourceBox, "#9b6ce3", "Saved Clone Source");
    }

    if (activeTool === "clone" && cloneTargetPreviewBox) {
      drawAreaBox(ctx, cloneTargetPreviewBox, "#2563eb", "Paste Here");
    }

    if (draftObject) {
      drawObject(ctx, draftObject);
    }

    if (showGuides) {
      drawEditorGuides(ctx, canvas.width, canvas.height);
    }

    if (selectedObject) {
      drawSelectionBox(ctx, selectedObject);
    }

    if (guideInfo) {
      drawSmartGuide(ctx, guideInfo, canvas.width, canvas.height);
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
      objects: serializeObjects(objects),
      canvasSize: { ...canvasSize },
      draftSize: { ...draftSize },
      selectedSizePreset,
      patchTargetBox: patchTargetBox ? { ...patchTargetBox } : null,
      cloneSourceBox: cloneSourceBox ? { ...cloneSourceBox } : null,
      showCloneSourceGuide,
    };
  }

  function pushHistory() {
    setHistoryPast((current) => [...current, captureSnapshot()].slice(-MAX_HISTORY));
    setHistoryFuture([]);
  }

  async function restoreSnapshot(snapshot) {
    const workingImage = await loadImage(snapshot.bitmap);
    const originalImage = await loadImage(snapshot.original);
    const hydratedObjects = await hydrateObjects(snapshot.objects);

    workingCanvasRef.current.width = snapshot.canvasSize.width;
    workingCanvasRef.current.height = snapshot.canvasSize.height;
    originalCanvasRef.current.width = snapshot.canvasSize.width;
    originalCanvasRef.current.height = snapshot.canvasSize.height;

    workingCanvasRef.current.getContext("2d").drawImage(workingImage, 0, 0);
    originalCanvasRef.current.getContext("2d").drawImage(originalImage, 0, 0);

    setCanvasSize(snapshot.canvasSize);
    setDraftSize(snapshot.draftSize || snapshot.canvasSize);
    setSelectedSizePreset(snapshot.selectedSizePreset || "custom");
    setObjects(hydratedObjects);
    setPatchTargetBox(snapshot.patchTargetBox || null);
    setPatchSourcePreviewBox(null);
    setCloneSourceBox(snapshot.cloneSourceBox || null);
    setCloneTargetPreviewBox(null);
    setShowCloneSourceGuide(Boolean(snapshot.showCloneSourceGuide));
    setGuideInfo(null);
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
    setErrorMessage("");

    if (activeTool === "select") {
      handleSelectPointerDown(event, point);
      return;
    }

    if (activeTool === "text") {
      handleTextPointerDown(point);
      return;
    }

    if (["rectangle", "circle", "arrow"].includes(activeTool)) {
      handleShapePointerDown(event, point);
      return;
    }

    if (activeTool === "patch") {
      handlePatchPointerDown(event, point);
      return;
    }

    if (activeTool === "clone") {
      handleClonePointerDown(event, point);
      return;
    }

    if (["draw", "blur", "restore"].includes(activeTool)) {
      handleBrushPointerDown(event, point);
    }
  }

  function handleSelectPointerDown(event, point) {
    const selected = getObjectAtPoint(point, objects);

    setSelectedObjectId(selected?.id || null);

    if (!selected) {
      clearSelections();
      return;
    }

    pushHistory();

    pointerRef.current = {
      active: true,
      mode: "move-object",
      startPoint: point,
      lastPoint: point,
      selectedStart: cloneObject(selected),
      dragStartBox: getObjectBox(selected),
    };

    setGuideInfo(buildGuideInfo(getObjectBox(selected), canvasSize, selected.isBaseImage ? "Drag image to adjust" : "Selected"));
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleTextPointerDown(point) {
    commitBaseImageToCanvasIfNeeded({ withHistory: true });
    pushHistory();

    const textObject = createTextObject(point);

    setObjects((current) => [...current.filter((item) => !item.isBaseImage), textObject]);
    setSelectedObjectId(textObject.id);
    setActiveTool("select");
    setActivePanel("text");
    setGuideInfo(buildGuideInfo(getObjectBox(textObject), canvasSize, "Text added"));
    clearOutput();
  }

  function handleShapePointerDown(event, point) {
    commitBaseImageToCanvasIfNeeded({ withHistory: true });

    setDraftObject(createDraftObject(activeTool, point));

    pointerRef.current = {
      active: true,
      mode: "draw-object",
      startPoint: point,
      lastPoint: point,
      selectedStart: null,
      dragStartBox: null,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePatchPointerDown(event, point) {
    commitBaseImageToCanvasIfNeeded({ withHistory: true });

    if (isSettingPatchTarget || !patchTargetBox) {
      setPatchTargetBox(null);
      setPatchSourcePreviewBox(null);
      setGuideInfo(null);

      setDraftObject({
        id: createId(),
        type: "patch-target",
        x: point.x,
        y: point.y,
        w: 0,
        h: 0,
      });

      pointerRef.current = {
        active: true,
        mode: "set-patch-target",
        startPoint: point,
        lastPoint: point,
        selectedStart: null,
        dragStartBox: null,
      };

      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }

    const startSourceBox = pointInBox(point, patchTargetBox)
      ? { ...patchTargetBox }
      : centerBoxAtPoint(patchTargetBox, point);

    const clampedSourceBox = clampBoxToCanvas(
      startSourceBox,
      workingCanvasRef.current
    );

    pointerRef.current = {
      active: true,
      mode: "drag-patch-source",
      startPoint: point,
      lastPoint: point,
      selectedStart: null,
      dragStartBox: clampedSourceBox,
    };

    setPatchSourcePreviewBox(clampedSourceBox);
    setGuideInfo(
      buildGuideInfo(
        clampedSourceBox,
        canvasSize,
        pointInBox(point, patchTargetBox)
          ? "Drag to clean area"
          : "Clean source selected"
      )
    );

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleClonePointerDown(event, point) {
    commitBaseImageToCanvasIfNeeded({ withHistory: true });

    if (isSettingCloneSource || !cloneSourceBox) {
      setCloneSourceBox(null);
      setCloneTargetPreviewBox(null);
      setShowCloneSourceGuide(true);
      setGuideInfo(null);

      setDraftObject({
        id: createId(),
        type: "clone-source",
        x: point.x,
        y: point.y,
        w: 0,
        h: 0,
      });

      pointerRef.current = {
        active: true,
        mode: "set-clone-source",
        startPoint: point,
        lastPoint: point,
        selectedStart: null,
        dragStartBox: null,
      };

      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }

    const startTargetBox =
      showCloneSourceGuide && pointInBox(point, cloneSourceBox)
        ? { ...cloneSourceBox }
        : centerBoxAtPoint(cloneSourceBox, point);

    const clampedTargetBox = clampBoxToCanvas(
      startTargetBox,
      workingCanvasRef.current
    );

    pointerRef.current = {
      active: true,
      mode: "drag-clone-target",
      startPoint: point,
      lastPoint: point,
      selectedStart: null,
      dragStartBox: clampedTargetBox,
    };

    setCloneTargetPreviewBox(clampedTargetBox);
    setGuideInfo(buildGuideInfo(clampedTargetBox, canvasSize, "Paste clone here"));

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleBrushPointerDown(event, point) {
    commitBaseImageToCanvasIfNeeded({ withHistory: true });
    pushHistory();
    clearOutput();

    pointerRef.current = {
      active: true,
      mode: "brush",
      startPoint: point,
      lastPoint: point,
      selectedStart: null,
      dragStartBox: null,
    };

    applyBrush(point, point);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!pointerRef.current.active || !hasImage || showOriginal) return;

    const point = getCanvasPoint(event);

    if (!point) return;

    event.preventDefault();

    if (pointerRef.current.mode === "move-object" && selectedObjectId) {
      moveSelectedObject(point);
      return;
    }

    if (pointerRef.current.mode === "draw-object" && draftObject) {
      const nextDraft = updateDraftObject(draftObject, pointerRef.current.startPoint, point);
      setDraftObject(nextDraft);
      setGuideInfo(buildGuideInfo(getObjectBox(normalizeObject(nextDraft)), canvasSize, "Drawing"));
      return;
    }

    if (pointerRef.current.mode === "set-patch-target" && draftObject) {
      const nextDraft = updateDraftObject(draftObject, pointerRef.current.startPoint, point);
      setDraftObject(nextDraft);
      setGuideInfo(buildGuideInfo(getObjectBox(normalizeObject(nextDraft)), canvasSize, "Patch Target"));
      return;
    }

    if (pointerRef.current.mode === "drag-patch-source" && pointerRef.current.dragStartBox) {
      const dx = point.x - pointerRef.current.startPoint.x;
      const dy = point.y - pointerRef.current.startPoint.y;
      const rawBox = translateBox(pointerRef.current.dragStartBox, dx, dy);
      const snapResult = snapBoxToGuides(rawBox, canvasSize);
      const nextBox = clampBoxToCanvas(snapResult.box, workingCanvasRef.current);

      setPatchSourcePreviewBox(nextBox);
      setGuideInfo(buildGuideInfo(nextBox, canvasSize, snapResult.message || "Clean Source"));
      return;
    }

    if (pointerRef.current.mode === "set-clone-source" && draftObject) {
      const nextDraft = updateDraftObject(draftObject, pointerRef.current.startPoint, point);
      setDraftObject(nextDraft);
      setGuideInfo(buildGuideInfo(getObjectBox(normalizeObject(nextDraft)), canvasSize, "Clone Source"));
      return;
    }

    if (pointerRef.current.mode === "drag-clone-target" && pointerRef.current.dragStartBox) {
      const dx = point.x - pointerRef.current.startPoint.x;
      const dy = point.y - pointerRef.current.startPoint.y;
      const rawBox = translateBox(pointerRef.current.dragStartBox, dx, dy);
      const snapResult = snapBoxToGuides(rawBox, canvasSize);
      const nextBox = clampBoxToCanvas(snapResult.box, workingCanvasRef.current);

      setCloneTargetPreviewBox(nextBox);
      setGuideInfo(buildGuideInfo(nextBox, canvasSize, snapResult.message || "Paste Here"));
      return;
    }

    if (pointerRef.current.mode === "brush") {
      applyBrush(pointerRef.current.lastPoint || point, point);
      pointerRef.current.lastPoint = point;
    }
  }

  function moveSelectedObject(point) {
    const startPoint = pointerRef.current.startPoint;
    const selectedStart = pointerRef.current.selectedStart;

    if (!startPoint || !selectedStart) return;

    const dx = point.x - startPoint.x;
    const dy = point.y - startPoint.y;

    const moved = moveObject(selectedStart, dx, dy);
    const movedBox = getObjectBox(moved);
    const snapResult = snapBoxToGuides(movedBox, canvasSize);

    const snapDx = snapResult.box.x - movedBox.x;
    const snapDy = snapResult.box.y - movedBox.y;

    const finalMoved = moveObject(selectedStart, dx + snapDx, dy + snapDy);

    setObjects((current) =>
      current.map((item) => (item.id === selectedObjectId ? finalMoved : item))
    );

    setGuideInfo(buildGuideInfo(getObjectBox(finalMoved), canvasSize, snapResult.message || "Moving"));
    clearOutput();
  }

  function handlePointerUp(event) {
    if (!pointerRef.current.active) return;

    event.preventDefault();

    if (pointerRef.current.mode === "draw-object" && draftObject) {
      const finalObject = normalizeObject(draftObject);

      if (isValidObject(finalObject)) {
        pushHistory();
        setObjects((current) => [...current.filter((item) => !item.isBaseImage), finalObject]);
        setSelectedObjectId(finalObject.id);
        setGuideInfo(buildGuideInfo(getObjectBox(finalObject), canvasSize, "Shape added"));
      }

      setDraftObject(null);
      setActiveTool("select");
      setActivePanel("shape");
      clearOutput();
    }

    if (pointerRef.current.mode === "set-patch-target" && draftObject) {
      const targetBox = clampBoxToCanvas(
        normalizeBox(draftObject),
        workingCanvasRef.current
      );

      if (targetBox.w > 10 && targetBox.h > 10) {
        setPatchTargetBox(targetBox);
        setPatchSourcePreviewBox(null);
        setIsSettingPatchTarget(false);
        setGuideInfo(buildGuideInfo(targetBox, canvasSize, "Patch Target"));
        setSuccessMessage(
          "Patch target selected. Now click or drag any clean/flat area to apply the patch."
        );
      } else {
        setErrorMessage("Patch target is too small. Drag a bigger area.");
      }

      setDraftObject(null);
    }

    if (
      pointerRef.current.mode === "drag-patch-source" &&
      patchTargetBox &&
      patchSourcePreviewBox
    ) {
      pushHistory();

      applyPatchFromSource({
        canvas: workingCanvasRef.current,
        sourceBox: patchSourcePreviewBox,
        targetBox: patchTargetBox,
        opacity: patchStrength,
        feather: patchFeather,
      });

      setPatchTargetBox(null);
      setPatchSourcePreviewBox(null);
      setDraftObject(null);
      setGuideInfo(null);
      setIsSettingPatchTarget(false);
      clearOutput();

      setSuccessMessage(
        "Patch applied. Selection is hidden. Select another area to patch again."
      );
    }

    if (pointerRef.current.mode === "set-clone-source" && draftObject) {
      const sourceBox = clampBoxToCanvas(
        normalizeBox(draftObject),
        workingCanvasRef.current
      );

      if (sourceBox.w > 10 && sourceBox.h > 10) {
        setCloneSourceBox(sourceBox);
        setCloneTargetPreviewBox(null);
        setIsSettingCloneSource(false);
        setShowCloneSourceGuide(true);
        setGuideInfo(buildGuideInfo(sourceBox, canvasSize, "Clone Source"));

        setSuccessMessage(
          "Clone source selected. Click or drag anywhere to paste it."
        );
      } else {
        setErrorMessage("Clone source is too small. Drag a bigger area.");
      }

      setDraftObject(null);
    }

    if (
      pointerRef.current.mode === "drag-clone-target" &&
      cloneSourceBox &&
      cloneTargetPreviewBox
    ) {
      pushHistory();

      applyCloneAreaFromSource({
        canvas: workingCanvasRef.current,
        sourceBox: cloneSourceBox,
        targetBox: cloneTargetPreviewBox,
        opacity: cloneStrength,
        feather: cloneFeather,
      });

      setCloneTargetPreviewBox(null);
      setDraftObject(null);
      setGuideInfo(null);
      setShowCloneSourceGuide(false);
      clearOutput();

      setSuccessMessage(
        "Clone pasted. Same clone source is saved. Click anywhere to paste it again, or choose New Clone Selection."
      );
    }

    pointerRef.current = {
      active: false,
      mode: "",
      startPoint: null,
      lastPoint: null,
      selectedStart: null,
      dragStartBox: null,
    };

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
      hasBackground: textHasBackground,
      fontFamily: textFontFamily,
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
        stroke: shapeStrokeColor,
        strokeWidth: shapeStrokeWidth,
        strokeEnabled: true,
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
      fill: shapeFillColor,
      stroke: shapeStrokeColor,
      strokeWidth: shapeStrokeWidth,
      fillEnabled: shapeFillEnabled,
      strokeEnabled: shapeStrokeEnabled,
      opacity: brushOpacity,
    };
  }

  function updateDraftObject(object, startPoint, point) {
    if (!object) return null;

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

    if (activeTool === "restore") {
      applyRestoreBrush(workingCanvas, originalCanvasRef.current, toPoint, {
        size: brushSize,
      });
    }

    renderVisibleCanvas();
  }

  function applyTextPreset(preset) {
    setTextColor(preset.color);
    setTextBackground(preset.background);
    setTextHasBackground(preset.hasBackground);
    setTextFontFamily(preset.fontFamily);
    setFontSize(preset.fontSize);
    setBoldText(preset.bold);
    setTextShadow(preset.shadow);

    if (selectedObject?.type === "text") {
      updateSelectedObject({
        color: preset.color,
        background: preset.background,
        hasBackground: preset.hasBackground,
        fontFamily: preset.fontFamily,
        fontSize: preset.fontSize,
        bold: preset.bold,
        shadow: preset.shadow,
      });
    }
  }

  function updateSelectedObject(updates) {
    if (!selectedObjectId) return;

    const nextObjects = objects.map((item) =>
      item.id === selectedObjectId
        ? {
            ...item,
            ...updates,
          }
        : item
    );

    const nextSelected = nextObjects.find((item) => item.id === selectedObjectId);

    setObjects(nextObjects);
    setGuideInfo(nextSelected ? buildGuideInfo(getObjectBox(nextSelected), canvasSize, "Updated") : null);
    clearOutput();
  }

  function updateTextSetting(key, value) {
    if (key === "text") setTextValue(value);
    if (key === "color") setTextColor(value);
    if (key === "background") setTextBackground(value);
    if (key === "hasBackground") setTextHasBackground(value);
    if (key === "fontFamily") setTextFontFamily(value);
    if (key === "fontSize") setFontSize(value);
    if (key === "bold") setBoldText(value);
    if (key === "shadow") setTextShadow(value);

    if (selectedObject?.type === "text") {
      updateSelectedObject({ [key]: value });
    }
  }

  function updateShapeSetting(key, value) {
    if (key === "fill") setShapeFillColor(value);
    if (key === "stroke") setShapeStrokeColor(value);
    if (key === "strokeWidth") setShapeStrokeWidth(value);
    if (key === "fillEnabled") setShapeFillEnabled(value);
    if (key === "strokeEnabled") setShapeStrokeEnabled(value);

    if (
      selectedObject &&
      ["rectangle", "circle", "arrow"].includes(selectedObject.type)
    ) {
      updateSelectedObject({ [key]: value });
    }
  }

  function deleteSelectedObject() {
    if (!selectedObjectId) return;

    pushHistory();

    setObjects((current) => current.filter((item) => item.id !== selectedObjectId));
    setSelectedObjectId(null);
    setGuideInfo(null);
    clearOutput();
  }

  function applySizePreset(presetId) {
    const preset = SIZE_PRESETS.find((item) => item.id === presetId);

    if (!preset) return;

    setSelectedSizePreset(presetId);

    if (preset.id === "original") {
      if (imageInfo) {
        setDraftSize({
          width: imageInfo.width,
          height: imageInfo.height,
        });
      }

      return;
    }

    const nextSize = {
      width: preset.width,
      height: preset.height,
    };

    setDraftSize(nextSize);

    if (!hasImage) {
      setCanvasSize(nextSize);
    }
  }

  function applyCanvasResize() {
    if (!hasImage) {
      const nextWidth = clampNumber(draftSize.width, 100, 5000);
      const nextHeight = clampNumber(draftSize.height, 100, 5000);

      setSelectedSizePreset("custom");
      setDraftSize({ width: nextWidth, height: nextHeight });
      setCanvasSize({ width: nextWidth, height: nextHeight });
      return;
    }

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

    if (patchTargetBox) {
      setPatchTargetBox(scaleBox(patchTargetBox, scaleX, scaleY));
    }

    if (patchSourcePreviewBox) {
      setPatchSourcePreviewBox(scaleBox(patchSourcePreviewBox, scaleX, scaleY));
    }

    if (cloneSourceBox) {
      setCloneSourceBox(scaleBox(cloneSourceBox, scaleX, scaleY));
    }

    if (cloneTargetPreviewBox) {
      setCloneTargetPreviewBox(scaleBox(cloneTargetPreviewBox, scaleX, scaleY));
    }

    setSelectedSizePreset("custom");
    setCanvasSize({
      width: nextWidth,
      height: nextHeight,
    });

    setGuideInfo(null);
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
    setSelectedSizePreset("facebook-post");
    setCanvasSize({ width: 1200, height: 630 });
    setDraftSize({ width: 1200, height: 630 });
    setActiveTool("select");
    setActivePanel("");
    setObjects([]);
    setDraftObject(null);
    setSelectedObjectId(null);
    setHistoryPast([]);
    setHistoryFuture([]);
    setPatchTargetBox(null);
    setPatchSourcePreviewBox(null);
    setIsSettingPatchTarget(false);
    setCloneSourceBox(null);
    setCloneTargetPreviewBox(null);
    setIsSettingCloneSource(false);
    setShowCloneSourceGuide(false);
    setShowOriginal(false);
    setPreviewZoom(1);
    setGuideInfo(null);
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
    resetMainFileInput();
    resetAddImageInput();
  }

  function activateTool(toolId) {
    setActiveTool(toolId);
    setActivePanel("");
    setShowOriginal(false);
    setGuideInfo(null);

    if (["rectangle", "circle", "arrow"].includes(toolId)) {
      setShapeType(toolId);
    }

    if (["draw", "blur", "restore", "patch", "clone", "text", "rectangle", "circle", "arrow"].includes(toolId)) {
      commitBaseImageToCanvasIfNeeded({ withHistory: true });
    }

    if (toolId === "patch") {
      if (!patchTargetBox) {
        setIsSettingPatchTarget(true);
        setSuccessMessage("Select the area you want to remove, then click or drag a clean area.");
      } else {
        setSuccessMessage("Click or drag any clean/flat area to apply the patch.");
      }
    }

    if (toolId === "clone") {
      if (!cloneSourceBox) {
        setIsSettingCloneSource(true);
        setShowCloneSourceGuide(true);
        setSuccessMessage("Select the area you want to clone.");
      } else {
        setShowCloneSourceGuide(false);
        setSuccessMessage("Same clone source is ready. Click or drag anywhere to paste it again.");
      }
    }
  }

  function activateShapeTool(nextShape) {
    setShapeType(nextShape);
    activateTool(nextShape);
    setActivePanel("");
  }

  return (
    <div className="flex flex-col gap-8">
      <input
        ref={mainFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/*"
        onChange={handleMainFileInputChange}
        className="hidden"
      />

      <input
        ref={addImageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/*"
        onChange={handleAddImageInputChange}
        className="hidden"
      />

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Sparkles size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Quick Photo Editor</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Choose your canvas size before uploading, place your photo on the artboard,
          drag to adjust, then edit with text, image layers, blur, patch, clone, shapes, and export.
        </p>
      </section>

      <section className="card p-4 sm:p-5">
        {!hasImage && (
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5 mb-5">
            <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
              <h2 className="text-xl font-bold mb-2">Choose Artboard Size First</h2>

              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Select the final size before uploading. Your image will be placed on this artboard,
                and you can drag it to adjust perfectly.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applySizePreset(preset.id)}
                    className={`border rounded-2xl p-4 text-left transition ${
                      selectedSizePreset === preset.id
                        ? "border-[var(--primary)] bg-[#f4edff]"
                        : "border-[var(--border)] hover:bg-[#f8f4ff]"
                    }`}
                  >
                    <p className="font-semibold">{preset.label}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {preset.id === "original"
                        ? "Use uploaded image size"
                        : `${preset.width} × ${preset.height}px`}
                    </p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Custom Width</label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    value={draftSize.width}
                    onChange={(event) => {
                      const nextWidth = Number(event.target.value);
                      setSelectedSizePreset("custom");
                      setDraftSize((current) => ({
                        ...current,
                        width: nextWidth,
                      }));
                      setCanvasSize((current) => ({
                        ...current,
                        width: nextWidth,
                      }));
                    }}
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Custom Height</label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    value={draftSize.height}
                    onChange={(event) => {
                      const nextHeight = Number(event.target.value);
                      setSelectedSizePreset("custom");
                      setDraftSize((current) => ({
                        ...current,
                        height: nextHeight,
                      }));
                      setCanvasSize((current) => ({
                        ...current,
                        height: nextHeight,
                      }));
                    }}
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white"
                  />
                </div>
              </div>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={openMainFilePicker}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[360px] ${
                isDraggingFile
                  ? "border-[var(--primary)] bg-[#f4edff]"
                  : "border-[var(--border)] hover:bg-[#f8f4ff]"
              }`}
            >
              {isLoadingImage ? (
                <Loader2
                  size={44}
                  className="mx-auto mb-4 text-[var(--primary)] animate-spin"
                />
              ) : (
                <Upload size={44} className="mx-auto mb-4 text-[var(--primary)]" />
              )}

              <h2 className="text-xl font-semibold mb-2">
                Upload, drop, or paste photo
              </h2>

              <p className="text-sm text-[var(--text-secondary)] max-w-md">
                Supports JPG, PNG, WEBP, GIF, and BMP. You can also paste an image
                with <strong> Ctrl + V</strong>. Max file size:{" "}
                <strong>{MAX_FILE_SIZE_MB} MB</strong>.
              </p>

              <div className="mt-5 bg-white border border-[var(--border)] rounded-2xl px-5 py-3">
                <p className="text-xs text-[var(--text-secondary)]">Selected Artboard</p>
                <p className="font-bold text-[var(--primary)]">
                  {selectedSizePreset === "original"
                    ? "Original uploaded image size"
                    : `${draftSize.width} × ${draftSize.height}px`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="sticky top-3 z-30 rounded-2xl border border-[var(--border)] bg-white/95 backdrop-blur shadow-sm p-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openMainFilePicker}
              className="btn-secondary inline-flex items-center justify-center gap-2 px-3 py-2 text-sm"
            >
              <Upload size={16} />
              Upload
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePanel("image");
                setActiveTool("select");
                openAddImagePicker();
              }}
              disabled={!hasImage}
              className={`btn-secondary inline-flex items-center justify-center gap-2 px-3 py-2 text-sm ${
                !hasImage ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <Images size={16} />
              Add Image
            </button>

            <div className="w-px h-8 bg-[var(--border)] mx-1" />

            {TOOLS.map((tool) => {
              const Icon = tool.icon;

              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => activateTool(tool.id)}
                  disabled={!hasImage}
                  className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm ${
                    !hasImage
                      ? "opacity-40 cursor-not-allowed"
                      : activeTool === tool.id && !activePanel
                        ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                        : "border-[var(--border)] hover:bg-[#f8f4ff]"
                  }`}
                  title={tool.label}
                >
                  <Icon size={17} />
                  <span className="hidden lg:inline">{tool.label}</span>
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
              onClick={() => {
                setShowOriginal((current) => !current);
                setActivePanel("");
              }}
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

            <button
              type="button"
              onClick={() => {
                setActivePanel("size");
                setActiveTool("select");
              }}
              disabled={!hasImage}
              className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm ${
                !hasImage
                  ? "opacity-40 cursor-not-allowed"
                  : activePanel === "size"
                    ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                    : "border-[var(--border)] hover:bg-[#f8f4ff]"
              }`}
            >
              <Maximize2 size={17} />
              Size
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePanel("export");
                setActiveTool("select");
              }}
              disabled={!hasImage}
              className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm ${
                !hasImage
                  ? "opacity-40 cursor-not-allowed"
                  : activePanel === "export"
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

          {hasImage && shouldShowSettings && (
            <div className="mt-3 border border-[var(--border)] rounded-2xl bg-[#fafafa] p-4">
              {settingsMode === "image" && (
                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
                  <div>
                    <p className="text-sm font-semibold mb-3">Image layer</p>

                    <button
                      type="button"
                      onClick={openAddImagePicker}
                      className="btn-primary inline-flex items-center justify-center gap-2"
                    >
                      <Images size={17} />
                      Add Logo / Image
                    </button>

                    <p className="text-xs text-[var(--text-secondary)] mt-3">
                      The first uploaded photo starts as a draggable base image.
                      Drag it to adjust on the selected artboard before using patch, clone, blur, or draw.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <InfoCard
                      label="Selected"
                      value={
                        selectedObject?.type === "image"
                          ? selectedObject.isBaseImage
                            ? "Base Photo"
                            : "Image Layer"
                          : "None"
                      }
                    />

                    {selectedObject?.type === "image" && (
                      <>
                        <RangeInput
                          label={`Width: ${Math.round(selectedObject.w)}px`}
                          min={20}
                          max={canvasSize.width * 3}
                          step={1}
                          value={selectedObject.w}
                          onChange={(value) => {
                            const nextWidth = Number(value);
                            const ratio = selectedObject.h / selectedObject.w;

                            updateSelectedObject({
                              w: nextWidth,
                              h: nextWidth * ratio,
                            });
                          }}
                        />

                        <RangeInput
                          label={`Height: ${Math.round(selectedObject.h)}px`}
                          min={20}
                          max={canvasSize.height * 3}
                          step={1}
                          value={selectedObject.h}
                          onChange={(value) =>
                            updateSelectedObject({
                              h: Number(value),
                            })
                          }
                        />

                        <RangeInput
                          label={`Opacity: ${Math.round((selectedObject.opacity || 1) * 100)}%`}
                          min={0.1}
                          max={1}
                          step={0.01}
                          value={selectedObject.opacity || 1}
                          onChange={(value) =>
                            updateSelectedObject({
                              opacity: Number(value),
                            })
                          }
                        />
                      </>
                    )}
                  </div>
                </div>
              )}

              {settingsMode === "text" && (
                <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Text
                    </label>
                    <input
                      type="text"
                      value={textValue}
                      onChange={(event) => updateTextSetting("text", event.target.value)}
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] bg-white"
                      placeholder="Enter text"
                    />

                    <p className="text-xs text-[var(--text-secondary)] mt-2">
                      Choose Text, then click on the photo. You can place text with or without background.
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
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Font
                      </label>
                      <select
                        value={textFontFamily}
                        onChange={(event) => updateTextSetting("fontFamily", event.target.value)}
                        className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                      >
                        {FONT_OPTIONS.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <ColorInput
                      label="Text Color"
                      value={textColor}
                      onChange={(value) => updateTextSetting("color", value)}
                    />

                    <label className="flex items-center justify-between gap-3 bg-white border border-[var(--border)] rounded-xl p-4 cursor-pointer">
                      <span className="font-semibold text-sm">Background</span>
                      <input
                        type="checkbox"
                        checked={textHasBackground}
                        onChange={(event) =>
                          updateTextSetting("hasBackground", event.target.checked)
                        }
                        className="w-4 h-4 accent-[var(--primary)]"
                      />
                    </label>

                    <ColorInput
                      label="Background Color"
                      value={textBackground}
                      onChange={(value) => updateTextSetting("background", value)}
                      disabled={!textHasBackground}
                    />

                    <RangeInput
                      label={`Font: ${fontSize}px`}
                      min={14}
                      max={130}
                      step={1}
                      value={fontSize}
                      onChange={(value) => updateTextSetting("fontSize", Number(value))}
                    />

                    <label className="flex items-center justify-between gap-3 bg-white border border-[var(--border)] rounded-xl p-4 cursor-pointer">
                      <span className="font-semibold text-sm">Bold</span>
                      <input
                        type="checkbox"
                        checked={boldText}
                        onChange={(event) => updateTextSetting("bold", event.target.checked)}
                        className="w-4 h-4 accent-[var(--primary)]"
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 bg-white border border-[var(--border)] rounded-xl p-4 cursor-pointer">
                      <span className="font-semibold text-sm">Shadow</span>
                      <input
                        type="checkbox"
                        checked={textShadow}
                        onChange={(event) => updateTextSetting("shadow", event.target.checked)}
                        className="w-4 h-4 accent-[var(--primary)]"
                      />
                    </label>
                  </div>
                </div>
              )}

              {["draw", "blur", "restore"].includes(settingsMode) && (
                <div className="grid md:grid-cols-5 gap-4">
                  <InfoCard label="Active Tool" value={activeTool} />

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
                </div>
              )}

              {["rectangle", "circle", "arrow"].includes(settingsMode) && (
                <div className="grid lg:grid-cols-[1fr_1.5fr] gap-5">
                  <div>
                    <p className="text-sm font-semibold mb-2">Shape tool</p>
                    <p className="text-sm text-[var(--text-secondary)] leading-7">
                      Choose a shape, then drag on the artboard. You can use fill, stroke,
                      or both. Stroke width can be increased or decreased.
                    </p>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => activateShapeTool("rectangle")}
                        className={`px-3 py-2 rounded-xl border text-sm font-semibold ${
                          activeTool === "rectangle"
                            ? "border-[var(--primary)] bg-[#f4edff]"
                            : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                        }`}
                      >
                        Rectangle
                      </button>

                      <button
                        type="button"
                        onClick={() => activateShapeTool("circle")}
                        className={`px-3 py-2 rounded-xl border text-sm font-semibold ${
                          activeTool === "circle"
                            ? "border-[var(--primary)] bg-[#f4edff]"
                            : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                        }`}
                      >
                        Circle
                      </button>

                      <button
                        type="button"
                        onClick={() => activateShapeTool("arrow")}
                        className={`px-3 py-2 rounded-xl border text-sm font-semibold ${
                          activeTool === "arrow"
                            ? "border-[var(--primary)] bg-[#f4edff]"
                            : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                        }`}
                      >
                        Arrow
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-5 gap-4">
                    <InfoCard label="Shape" value={shapeType} />

                    <label className="flex items-center justify-between gap-3 bg-white border border-[var(--border)] rounded-xl p-4 cursor-pointer">
                      <span className="font-semibold text-sm">Fill</span>
                      <input
                        type="checkbox"
                        checked={shapeFillEnabled}
                        disabled={activeTool === "arrow"}
                        onChange={(event) =>
                          updateShapeSetting("fillEnabled", event.target.checked)
                        }
                        className="w-4 h-4 accent-[var(--primary)]"
                      />
                    </label>

                    <ColorInput
                      label="Fill Color"
                      value={shapeFillColor}
                      onChange={(value) => updateShapeSetting("fill", value)}
                      disabled={!shapeFillEnabled || activeTool === "arrow"}
                    />

                    <label className="flex items-center justify-between gap-3 bg-white border border-[var(--border)] rounded-xl p-4 cursor-pointer">
                      <span className="font-semibold text-sm">Stroke</span>
                      <input
                        type="checkbox"
                        checked={shapeStrokeEnabled}
                        onChange={(event) =>
                          updateShapeSetting("strokeEnabled", event.target.checked)
                        }
                        className="w-4 h-4 accent-[var(--primary)]"
                      />
                    </label>

                    <ColorInput
                      label="Stroke Color"
                      value={shapeStrokeColor}
                      onChange={(value) => updateShapeSetting("stroke", value)}
                      disabled={!shapeStrokeEnabled}
                    />

                    <RangeInput
                      label={`Stroke: ${shapeStrokeWidth}px`}
                      min={1}
                      max={40}
                      step={1}
                      value={shapeStrokeWidth}
                      onChange={(value) =>
                        updateShapeSetting("strokeWidth", Number(value))
                      }
                    />

                    <RangeInput
                      label={`Opacity: ${Math.round(brushOpacity * 100)}%`}
                      min={0.1}
                      max={1}
                      step={0.01}
                      value={brushOpacity}
                      onChange={(value) => setBrushOpacity(Number(value))}
                    />
                  </div>
                </div>
              )}

              {settingsMode === "patch" && (
                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
                  <div>
                    <p className="text-sm font-semibold mb-2">Patch tool</p>

                    <ol className="text-sm text-[var(--text-secondary)] leading-7 list-decimal pl-5">
                      <li>Select the unwanted area first.</li>
                      <li>Click or drag any clean/flat area.</li>
                      <li>Release to make the unwanted area look like that clean area.</li>
                    </ol>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTool("patch");
                          setActivePanel("");
                          commitBaseImageToCanvasIfNeeded({ withHistory: true });
                          setPatchTargetBox(null);
                          setPatchSourcePreviewBox(null);
                          setIsSettingPatchTarget(true);
                          setGuideInfo(null);
                          setSuccessMessage("Select the area you want to remove.");
                        }}
                        className="btn-primary inline-flex items-center justify-center gap-2"
                      >
                        <Sparkles size={16} />
                        New Patch Selection
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPatchTargetBox(null);
                          setPatchSourcePreviewBox(null);
                          setGuideInfo(null);
                          setSuccessMessage("Patch selection cleared.");
                        }}
                        disabled={!patchTargetBox}
                        className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                          !patchTargetBox ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <RotateCcw size={16} />
                        Clear Patch
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <InfoCard
                      label="Target"
                      value={
                        patchTargetBox
                          ? `${Math.round(patchTargetBox.w)}×${Math.round(patchTargetBox.h)}`
                          : "Not Set"
                      }
                    />

                    <RangeInput
                      label={`Strength: ${Math.round(patchStrength * 100)}%`}
                      min={0.2}
                      max={1}
                      step={0.01}
                      value={patchStrength}
                      onChange={(value) => setPatchStrength(Number(value))}
                    />

                    <RangeInput
                      label={`Feather: ${patchFeather}px`}
                      min={0}
                      max={80}
                      step={1}
                      value={patchFeather}
                      onChange={(value) => setPatchFeather(Number(value))}
                    />

                    <RangeInput
                      label={`Zoom: ${Math.round(previewZoom * 100)}%`}
                      min={0.35}
                      max={2}
                      step={0.01}
                      value={previewZoom}
                      onChange={(value) => setPreviewZoom(Number(value))}
                    />
                  </div>
                </div>
              )}

              {settingsMode === "clone" && (
                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
                  <div>
                    <p className="text-sm font-semibold mb-2">Clone tool</p>

                    <ol className="text-sm text-[var(--text-secondary)] leading-7 list-decimal pl-5">
                      <li>Select the area you want to copy.</li>
                      <li>Click or drag anywhere to paste the same clone.</li>
                      <li>Use New Clone Selection to choose another clone area.</li>
                    </ol>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTool("clone");
                          setActivePanel("");
                          commitBaseImageToCanvasIfNeeded({ withHistory: true });
                          setCloneSourceBox(null);
                          setCloneTargetPreviewBox(null);
                          setShowCloneSourceGuide(true);
                          setIsSettingCloneSource(true);
                          setGuideInfo(null);
                          setSuccessMessage("Select the new area you want to clone.");
                        }}
                        className="btn-primary inline-flex items-center justify-center gap-2"
                      >
                        <Copy size={16} />
                        New Clone Selection
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTool("clone");
                          setActivePanel("");
                          setShowCloneSourceGuide(true);
                          setSuccessMessage(
                            "Saved clone source is visible. Click or drag anywhere to paste it again."
                          );
                        }}
                        disabled={!cloneSourceBox}
                        className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                          !cloneSourceBox ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Eye size={16} />
                        Show Saved Clone
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTool("clone");
                          setActivePanel("");
                          setShowCloneSourceGuide(false);
                          setSuccessMessage(
                            "Same clone source is ready. Click or drag anywhere to paste it again."
                          );
                        }}
                        disabled={!cloneSourceBox}
                        className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                          !cloneSourceBox ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Copy size={16} />
                        Use Same Clone
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCloneSourceBox(null);
                          setCloneTargetPreviewBox(null);
                          setShowCloneSourceGuide(false);
                          setGuideInfo(null);
                          setSuccessMessage("Clone source cleared.");
                        }}
                        disabled={!cloneSourceBox}
                        className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                          !cloneSourceBox ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <RotateCcw size={16} />
                        Clear Clone
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <InfoCard
                      label="Source"
                      value={
                        cloneSourceBox
                          ? `${Math.round(cloneSourceBox.w)}×${Math.round(cloneSourceBox.h)}`
                          : "Not Set"
                      }
                    />

                    <RangeInput
                      label={`Strength: ${Math.round(cloneStrength * 100)}%`}
                      min={0.2}
                      max={1}
                      step={0.01}
                      value={cloneStrength}
                      onChange={(value) => setCloneStrength(Number(value))}
                    />

                    <RangeInput
                      label={`Feather: ${cloneFeather}px`}
                      min={0}
                      max={80}
                      step={1}
                      value={cloneFeather}
                      onChange={(value) => setCloneFeather(Number(value))}
                    />

                    <RangeInput
                      label={`Zoom: ${Math.round(previewZoom * 100)}%`}
                      min={0.35}
                      max={2}
                      step={0.01}
                      value={previewZoom}
                      onChange={(value) => setPreviewZoom(Number(value))}
                    />
                  </div>
                </div>
              )}

              {settingsMode === "size" && (
                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
                  <div>
                    <p className="text-sm font-semibold mb-3">Size presets</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applySizePreset(preset.id)}
                          className={`px-3 py-2 rounded-xl border text-sm font-semibold ${
                            selectedSizePreset === preset.id
                              ? "border-[var(--primary)] bg-[#f4edff]"
                              : "border-[var(--border)] bg-white hover:bg-[#f4edff]"
                          }`}
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
                        onChange={(event) => {
                          setSelectedSizePreset("custom");
                          setDraftSize((current) => ({
                            ...current,
                            width: Number(event.target.value),
                          }));
                        }}
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
                        onChange={(event) => {
                          setSelectedSizePreset("custom");
                          setDraftSize((current) => ({
                            ...current,
                            height: Number(event.target.value),
                          }));
                        }}
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

              {settingsMode === "export" && (
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
          onPointerDown={handleArtboardPointerDown}
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
                Choose a size above, then upload your photo to start editing.
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
            <InfoCard label="Patch" value={patchTargetBox ? "Target Set" : "Not Set"} />
            <InfoCard label="Clone" value={cloneSourceBox ? "Source Saved" : "Not Set"} />
            <InfoCard label="Process Time" value={processText} green={Boolean(processingTimeMs)} />
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
              Tip: Text can now be used with or without background, and shapes can use fill,
              stroke, or both. Click outside the artboard to hide active selections.
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
            Quick Photo Editor helps you choose a canvas size before uploading,
            place your image on the artboard, drag it to adjust, then edit with
            image layers, text, drawing, blur, patch, clone, resize, and export.
          </p>

          <p>
            The text tool supports font choices, background on or off, text color,
            background color, shadow, bold style, and font size. The shape tool supports
            rectangle, circle, and arrow with fill color, stroke color, stroke width, and opacity.
          </p>

          <p>
            Please edit only photos you own or have permission to use. Do not use
            this tool to remove watermarks, falsify documents, alter IDs, or mislead people.
          </p>
        </div>
      </section>

      <SuggestedTools currentToolId="quick-photo-editor" />
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

function ColorInput({ label, value, onChange, disabled = false }) {
  return (
    <label className={`block ${disabled ? "opacity-50" : ""}`}>
      <span className="text-sm font-semibold mb-2 block">{label}</span>
      <input
        type="color"
        value={normalizeColor(value)}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full h-12 rounded-xl border border-[var(--border)] bg-white p-1 disabled:cursor-not-allowed"
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
  if (!object) return;

  ctx.save();
  ctx.globalAlpha = object.opacity ?? 1;

  if (object.type === "image") drawImageObject(ctx, object);
  if (object.type === "text") drawTextObject(ctx, object);
  if (object.type === "rectangle") drawRectangleObject(ctx, object);
  if (object.type === "circle") drawCircleObject(ctx, object);
  if (object.type === "arrow") drawArrowObject(ctx, object);
  if (object.type === "patch-target") drawAreaBox(ctx, normalizeBox(object), "#ef4444", "Patch Target");
  if (object.type === "clone-source") drawAreaBox(ctx, normalizeBox(object), "#9b6ce3", "Clone Source");

  ctx.restore();
}

function drawImageObject(ctx, object) {
  if (!object.element) return;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(object.element, object.x, object.y, object.w, object.h);
}

function drawTextObject(ctx, object) {
  const fontFamily = object.fontFamily || "Arial, sans-serif";
  const fontSize = Number(object.fontSize || 48);
  const hasBackground = object.hasBackground !== false;

  ctx.font = `${object.bold ? "800" : "500"} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "top";

  const metrics = ctx.measureText(object.text);
  const paddingX = fontSize * 0.35;
  const paddingY = fontSize * 0.22;
  const width = metrics.width + paddingX * 2;
  const height = fontSize * 1.32;

  if (object.shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = fontSize * 0.22;
    ctx.shadowOffsetY = fontSize * 0.08;
  }

  if (hasBackground) {
    ctx.fillStyle = object.background || "#111827";
    roundRect(ctx, object.x, object.y, width, height, fontSize * 0.22);
    ctx.fill();
  }

  ctx.shadowColor = object.shadow ? "rgba(0,0,0,0.32)" : "transparent";
  ctx.fillStyle = object.color || "#ffffff";
  ctx.fillText(
    object.text,
    object.x + (hasBackground ? paddingX : 0),
    object.y + (hasBackground ? paddingY : 0)
  );

  ctx.shadowColor = "transparent";
}

function drawRectangleObject(ctx, object) {
  const box = normalizeBox(object);

  if (object.fillEnabled !== false) {
    ctx.fillStyle = object.fill || "rgba(239,68,68,0.12)";
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }

  if (object.strokeEnabled !== false) {
    ctx.strokeStyle = object.stroke || "#ef4444";
    ctx.lineWidth = object.strokeWidth || 6;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
  }
}

function drawCircleObject(ctx, object) {
  const box = normalizeBox(object);

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

  if (object.fillEnabled !== false) {
    ctx.fillStyle = object.fill || "rgba(239,68,68,0.12)";
    ctx.fill();
  }

  if (object.strokeEnabled !== false) {
    ctx.strokeStyle = object.stroke || "#ef4444";
    ctx.lineWidth = object.strokeWidth || 6;
    ctx.stroke();
  }
}

function drawArrowObject(ctx, object) {
  ctx.strokeStyle = object.stroke || "#ef4444";
  ctx.fillStyle = object.stroke || "#ef4444";
  ctx.lineWidth = object.strokeWidth || 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(object.x1, object.y1);
  ctx.lineTo(object.x2, object.y2);
  ctx.stroke();

  const angle = Math.atan2(object.y2 - object.y1, object.x2 - object.x1);
  const head = Math.max(18, (object.strokeWidth || 6) * 4);

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

  if (!ctx) return;

  const radius = size / 2;
  const requestedRegionSize = Math.max(2, size * 2);
  const regionWidth = Math.min(requestedRegionSize, canvas.width);
  const regionHeight = Math.min(requestedRegionSize, canvas.height);

  const sx = clampNumber(point.x - regionWidth / 2, 0, canvas.width - regionWidth);
  const sy = clampNumber(point.y - regionHeight / 2, 0, canvas.height - regionHeight);

  const temp = document.createElement("canvas");
  temp.width = regionWidth;
  temp.height = regionHeight;

  const tempCtx = temp.getContext("2d");

  tempCtx.filter = `blur(${strength}px)`;
  tempCtx.drawImage(canvas, sx, sy, regionWidth, regionHeight, 0, 0, regionWidth, regionHeight);

  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(temp, sx, sy, regionWidth, regionHeight);
  ctx.restore();
}

function applyRestoreBrush(targetCanvas, originalCanvas, point, { size }) {
  const ctx = targetCanvas.getContext("2d");

  if (!ctx) return;

  const radius = size / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(originalCanvas, 0, 0);
  ctx.restore();
}

function applyPatchFromSource({ canvas, sourceBox, targetBox, opacity, feather }) {
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  const source = clampBoxToCanvas(sourceBox, canvas);
  const target = clampBoxToCanvas(targetBox, canvas);
  const safeFeather = Math.max(0, feather);

  const temp = document.createElement("canvas");
  temp.width = Math.max(1, Math.round(target.w));
  temp.height = Math.max(1, Math.round(target.h));

  const tempCtx = temp.getContext("2d");

  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = "high";
  tempCtx.drawImage(
    canvas,
    source.x,
    source.y,
    source.w,
    source.h,
    0,
    0,
    temp.width,
    temp.height
  );

  if (safeFeather > 0) {
    softenCanvasEdges(temp, safeFeather);
  }

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(temp, target.x, target.y, target.w, target.h);
  ctx.restore();
}

function applyCloneAreaFromSource({ canvas, sourceBox, targetBox, opacity, feather }) {
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  const source = clampBoxToCanvas(sourceBox, canvas);
  const target = clampBoxToCanvas(targetBox, canvas);
  const safeFeather = Math.max(0, feather);

  const temp = document.createElement("canvas");
  temp.width = Math.max(1, Math.round(target.w));
  temp.height = Math.max(1, Math.round(target.h));

  const tempCtx = temp.getContext("2d");

  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = "high";
  tempCtx.drawImage(
    canvas,
    source.x,
    source.y,
    source.w,
    source.h,
    0,
    0,
    temp.width,
    temp.height
  );

  if (safeFeather > 0) {
    softenCanvasEdges(temp, safeFeather);
  }

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(temp, target.x, target.y, target.w, target.h);
  ctx.restore();
}

function drawPatchLivePreview(ctx, sourceCanvas, sourceBox, targetBox, opacity) {
  const source = clampBoxToCanvas(sourceBox, sourceCanvas);
  const target = clampBoxToCanvas(targetBox, sourceCanvas);

  ctx.save();
  ctx.globalAlpha = Math.min(0.92, Math.max(0.35, opacity));
  ctx.drawImage(
    sourceCanvas,
    source.x,
    source.y,
    source.w,
    source.h,
    target.x,
    target.y,
    target.w,
    target.h
  );
  ctx.restore();
}

function drawCloneLivePreview(ctx, sourceCanvas, sourceBox, targetBox, opacity) {
  const source = clampBoxToCanvas(sourceBox, sourceCanvas);
  const target = clampBoxToCanvas(targetBox, sourceCanvas);

  ctx.save();
  ctx.globalAlpha = Math.min(0.92, Math.max(0.35, opacity));
  ctx.drawImage(
    sourceCanvas,
    source.x,
    source.y,
    source.w,
    source.h,
    target.x,
    target.y,
    target.w,
    target.h
  );
  ctx.restore();
}

function drawEditorGuides(ctx, width, height) {
  ctx.save();
  ctx.strokeStyle = "rgba(155,108,227,0.28)";
  ctx.lineWidth = Math.max(1, width * 0.0012);

  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  ctx.restore();
}

function drawSmartGuide(ctx, guideInfo, width, height) {
  if (!guideInfo?.box) return;

  const box = guideInfo.box;

  ctx.save();

  ctx.strokeStyle = "#9b6ce3";
  ctx.fillStyle = "#9b6ce3";
  ctx.lineWidth = Math.max(2, width * 0.0015);
  ctx.setLineDash([10, 7]);

  if (guideInfo.centerX) {
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
  }

  if (guideInfo.centerY) {
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.strokeRect(box.x, box.y, box.w, box.h);

  const label = `${guideInfo.message || "Position"}  X:${Math.round(box.x)}  Y:${Math.round(box.y)}  W:${Math.round(box.w)}  H:${Math.round(box.h)}`;
  const labelX = clampNumber(box.x, 8, width - 280);
  const labelY = clampNumber(box.y - 34, 8, height - 34);

  ctx.font = "700 16px Arial, sans-serif";
  const textWidth = ctx.measureText(label).width;

  ctx.fillStyle = "rgba(17,24,39,0.9)";
  roundRect(ctx, labelX, labelY, textWidth + 18, 28, 8);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, labelX + 9, labelY + 7);

  ctx.restore();
}

function drawAreaBox(ctx, box, color, label) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.setLineDash([]);

  ctx.fillStyle = color;
  ctx.font = "700 18px Arial, sans-serif";
  ctx.fillText(label, box.x + 8, box.y + 8);
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

  const handleSize = Math.max(10, Math.min(box.w, box.h) * 0.04);

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#9b6ce3";
  drawHandle(ctx, box.x, box.y, handleSize);
  drawHandle(ctx, box.x + box.w, box.y, handleSize);
  drawHandle(ctx, box.x, box.y + box.h, handleSize);
  drawHandle(ctx, box.x + box.w, box.y + box.h, handleSize);

  ctx.restore();
}

function drawHandle(ctx, x, y, size) {
  ctx.beginPath();
  ctx.rect(x - size / 2, y - size / 2, size, size);
  ctx.fill();
  ctx.stroke();
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
  if (!object) return null;

  if (object.type === "image") {
    return {
      x: object.x,
      y: object.y,
      w: object.w,
      h: object.h,
    };
  }

  if (object.type === "text") {
    const fontSize = Number(object.fontSize || 48);
    const hasBackground = object.hasBackground !== false;
    const estimatedWidth = Math.max(
      90,
      String(object.text || "").length * fontSize * 0.62 + (hasBackground ? fontSize * 0.7 : 0)
    );

    return {
      x: object.x,
      y: object.y,
      w: estimatedWidth,
      h: hasBackground ? fontSize * 1.35 : fontSize * 1.05,
    };
  }

  if (object.type === "rectangle" || object.type === "circle") {
    return normalizeBox(object);
  }

  if (object.type === "patch-target" || object.type === "clone-source") {
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

  if (object.type === "image") {
    return {
      ...object,
      x: object.x * scaleX,
      y: object.y * scaleY,
      w: object.w * scaleX,
      h: object.h * scaleY,
    };
  }

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
  if (!object) return object;

  if (
    object.type === "rectangle" ||
    object.type === "circle" ||
    object.type === "patch-target" ||
    object.type === "clone-source"
  ) {
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

function pointInBox(point, box) {
  if (!point || !box) return false;

  return (
    point.x >= box.x &&
    point.x <= box.x + box.w &&
    point.y >= box.y &&
    point.y <= box.y + box.h
  );
}

function translateBox(box, dx, dy) {
  return {
    ...box,
    x: box.x + dx,
    y: box.y + dy,
  };
}

function centerBoxAtPoint(box, point) {
  return {
    ...box,
    x: point.x - box.w / 2,
    y: point.y - box.h / 2,
  };
}

function scaleBox(box, scaleX, scaleY) {
  return {
    x: box.x * scaleX,
    y: box.y * scaleY,
    w: box.w * scaleX,
    h: box.h * scaleY,
  };
}

function clampBoxToCanvas(box, canvas) {
  const x = clampNumber(box.x, 0, Math.max(0, canvas.width - 1));
  const y = clampNumber(box.y, 0, Math.max(0, canvas.height - 1));
  const w = clampNumber(box.w, 1, Math.max(1, canvas.width - x));
  const h = clampNumber(box.h, 1, Math.max(1, canvas.height - y));

  return { x, y, w, h };
}

function snapBoxToGuides(box, canvasSize) {
  const resultBox = { ...box };
  let centerX = false;
  let centerY = false;
  let message = "";

  const boxCenterX = box.x + box.w / 2;
  const boxCenterY = box.y + box.h / 2;
  const canvasCenterX = canvasSize.width / 2;
  const canvasCenterY = canvasSize.height / 2;

  if (Math.abs(boxCenterX - canvasCenterX) <= SNAP_DISTANCE) {
    resultBox.x = canvasCenterX - box.w / 2;
    centerX = true;
  }

  if (Math.abs(boxCenterY - canvasCenterY) <= SNAP_DISTANCE) {
    resultBox.y = canvasCenterY - box.h / 2;
    centerY = true;
  }

  if (centerX && centerY) message = "Center aligned";
  else if (centerX) message = "Vertical center";
  else if (centerY) message = "Horizontal center";

  return {
    box: resultBox,
    centerX,
    centerY,
    message,
  };
}

function buildGuideInfo(box, canvasSize, message = "") {
  if (!box) return null;

  const boxCenterX = box.x + box.w / 2;
  const boxCenterY = box.y + box.h / 2;

  const centerX = Math.abs(boxCenterX - canvasSize.width / 2) <= SNAP_DISTANCE;
  const centerY = Math.abs(boxCenterY - canvasSize.height / 2) <= SNAP_DISTANCE;

  return {
    box,
    centerX,
    centerY,
    message,
  };
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

function getUploadCanvasSize({ presetId, draftSize, naturalWidth, naturalHeight }) {
  if (presetId === "original") {
    const scale = Math.min(
      1,
      MAX_CANVAS_LONG_SIDE / Math.max(naturalWidth, naturalHeight)
    );

    return {
      width: Math.max(1, Math.round(naturalWidth * scale)),
      height: Math.max(1, Math.round(naturalHeight * scale)),
    };
  }

  return {
    width: clampNumber(draftSize.width, 100, 5000),
    height: clampNumber(draftSize.height, 100, 5000),
  };
}

function getImageCoverBox({ imageWidth, imageHeight, canvasWidth, canvasHeight }) {
  const imageRatio = imageWidth / imageHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let width;
  let height;

  if (imageRatio > canvasRatio) {
    height = canvasHeight;
    width = canvasHeight * imageRatio;
  } else {
    width = canvasWidth;
    height = canvasWidth / imageRatio;
  }

  return {
    x: canvasWidth / 2 - width / 2,
    y: canvasHeight / 2 - height / 2,
    w: width,
    h: height,
  };
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

function softenCanvasEdges(canvas, feather) {
  const ctx = canvas.getContext("2d");

  if (!ctx || feather <= 0) return;

  const width = canvas.width;
  const height = canvas.height;
  const safeFeather = Math.min(feather, width / 2, height / 2);
  const mask = document.createElement("canvas");

  mask.width = width;
  mask.height = height;

  const maskCtx = mask.getContext("2d");

  maskCtx.fillStyle = "#000";
  maskCtx.fillRect(0, 0, width, height);
  maskCtx.globalCompositeOperation = "destination-out";

  const top = maskCtx.createLinearGradient(0, 0, 0, safeFeather);
  top.addColorStop(0, "rgba(0,0,0,1)");
  top.addColorStop(1, "rgba(0,0,0,0)");
  maskCtx.fillStyle = top;
  maskCtx.fillRect(0, 0, width, safeFeather);

  const bottom = maskCtx.createLinearGradient(0, height - safeFeather, 0, height);
  bottom.addColorStop(0, "rgba(0,0,0,0)");
  bottom.addColorStop(1, "rgba(0,0,0,1)");
  maskCtx.fillStyle = bottom;
  maskCtx.fillRect(0, height - safeFeather, width, safeFeather);

  const left = maskCtx.createLinearGradient(0, 0, safeFeather, 0);
  left.addColorStop(0, "rgba(0,0,0,1)");
  left.addColorStop(1, "rgba(0,0,0,0)");
  maskCtx.fillStyle = left;
  maskCtx.fillRect(0, 0, safeFeather, height);

  const right = maskCtx.createLinearGradient(width - safeFeather, 0, width, 0);
  right.addColorStop(0, "rgba(0,0,0,0)");
  right.addColorStop(1, "rgba(0,0,0,1)");
  maskCtx.fillStyle = right;
  maskCtx.fillRect(width - safeFeather, 0, safeFeather, height);

  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0);
  ctx.restore();
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
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

function serializeObjects(objects) {
  return objects.map((object) => {
    if (object.type === "image") {
      const { element, ...rest } = object;
      return rest;
    }

    return JSON.parse(JSON.stringify(object));
  });
}

async function hydrateObjects(objects) {
  const hydrated = [];

  for (const object of objects || []) {
    if (object.type === "image" && object.src) {
      const element = await loadImage(object.src);
      hydrated.push({
        ...object,
        element,
      });
    } else {
      hydrated.push(JSON.parse(JSON.stringify(object)));
    }
  }

  return hydrated;
}

function cloneObject(object) {
  if (object.type === "image") {
    return {
      ...object,
    };
  }

  return JSON.parse(JSON.stringify(object));
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