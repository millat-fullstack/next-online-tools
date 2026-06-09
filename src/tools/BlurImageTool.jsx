import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Upload,
  Download,
  RotateCcw,
  Undo2,
  Redo2,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Square,
  Circle as CircleIcon,
  MousePointer2,
  PenLine,
  Trash2,
  Wand2,
  ZoomIn,
  ZoomOut,
  Move,
  SlidersHorizontal,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Blur Image Online",
  path: "/blur-image",
  category: "Image Tools",
  description:
    "Blur images online with full blur, selective blur, brush blur, pixel blur, focus blur, and motion blur effects.",
  metaTitle: "Blur Image Online | Add Blur to Photos Free",
  metaDescription:
    "Blur images online for free. Upload a photo, choose full blur, selective blur, pixel blur, brush blur, focus blur, or motion blur, then download instantly.",
};

const SITE_URL = "https://nextonlinetools.com";
const canonicalUrl = `${SITE_URL}${toolData.path.startsWith("/tool") ? toolData.path : `/tool${toolData.path}`}`;

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_CANVAS_LONG_SIDE = 2400;
const MAX_HISTORY = 35;

const OUTPUT_FORMATS = [
  { value: "image/png", label: "PNG", extension: "png" },
  { value: "image/jpeg", label: "JPG", extension: "jpg" },
  { value: "image/webp", label: "WEBP", extension: "webp" },
];

const BLUR_TOOLS = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "areaBlur", label: "Area Blur", icon: Square },
  { id: "brushBlur", label: "Brush Blur", icon: PenLine },
  { id: "pixelArea", label: "Pixel Area", icon: ShieldCheck },
  { id: "pixelBrush", label: "Pixel Brush", icon: Wand2 },
  { id: "hand", label: "Hand", icon: Move },
];

const QUICK_PRESETS = [
  {
    id: "soft-full",
    label: "Soft Full Blur",
    description: "Light blur on the whole image.",
    settings: { fullBlurEnabled: true, fullBlurStrength: 6, motionBlurEnabled: false, focusBlurEnabled: false },
  },
  {
    id: "strong-full",
    label: "Strong Full Blur",
    description: "Strong blur for background images.",
    settings: { fullBlurEnabled: true, fullBlurStrength: 18, motionBlurEnabled: false, focusBlurEnabled: false },
  },
  {
    id: "privacy-pixel",
    label: "Privacy Pixel",
    description: "Best for hiding text, faces, numbers, or private details.",
    tool: "pixelArea",
    settings: { pixelSize: 22, selectionShape: "rect" },
  },
  {
    id: "portrait-focus",
    label: "Portrait Focus",
    description: "Blur outside the center portrait area.",
    settings: { focusBlurEnabled: true, focusPreset: "portrait", focusBlurStrength: 18, fullBlurEnabled: false, motionBlurEnabled: false },
  },
  {
    id: "product-focus",
    label: "Product Focus",
    description: "Keep product area sharp and blur the background.",
    settings: { focusBlurEnabled: true, focusPreset: "product", focusBlurStrength: 16, fullBlurEnabled: false, motionBlurEnabled: false },
  },
  {
    id: "motion-style",
    label: "Motion Style",
    description: "Add directional movement effect.",
    settings: { motionBlurEnabled: true, motionBlurAmount: 18, motionBlurAngle: 0, fullBlurEnabled: false, focusBlurEnabled: false },
  },
];

const FOCUS_PRESETS = [
  { id: "center", label: "Center Focus" },
  { id: "portrait", label: "Portrait Focus" },
  { id: "product", label: "Product Focus" },
  { id: "horizontal", label: "Horizontal Focus" },
  { id: "vertical", label: "Vertical Focus" },
];

export default function BlurImageTool() {
  const fileInputRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const baseCanvasRef = useRef(document.createElement("canvas"));
  const outputUrlRef = useRef("");
  const imageUrlRef = useRef("");

  const pointerRef = useRef({
    active: false,
    mode: "",
    startPoint: null,
    lastPoint: null,
    startClient: null,
    startPan: null,
  });

  const [imageInfo, setImageInfo] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [activeTool, setActiveTool] = useState("areaBlur");
  const [selectionShape, setSelectionShape] = useState("rect");
  const [blurStrength, setBlurStrength] = useState(12);
  const [brushSize, setBrushSize] = useState(70);
  const [pixelSize, setPixelSize] = useState(16);

  const [fullBlurEnabled, setFullBlurEnabled] = useState(false);
  const [fullBlurStrength, setFullBlurStrength] = useState(8);

  const [focusBlurEnabled, setFocusBlurEnabled] = useState(false);
  const [focusPreset, setFocusPreset] = useState("center");
  const [focusBlurStrength, setFocusBlurStrength] = useState(16);

  const [motionBlurEnabled, setMotionBlurEnabled] = useState(false);
  const [motionBlurAmount, setMotionBlurAmount] = useState(14);
  const [motionBlurAngle, setMotionBlurAngle] = useState(0);

  const [effects, setEffects] = useState([]);
  const [draftEffect, setDraftEffect] = useState(null);
  const [selectedEffectId, setSelectedEffectId] = useState(null);

  const [historyPast, setHistoryPast] = useState([]);
  const [historyFuture, setHistoryFuture] = useState([]);

  const [showBefore, setShowBefore] = useState(false);
  const [showBrushPreview, setShowBrushPreview] = useState(true);
  const [cursorPoint, setCursorPoint] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [outputFormat, setOutputFormat] = useState("image/png");
  const [quality, setQuality] = useState(0.94);
  const [isExporting, setIsExporting] = useState(false);
  const [lastOutputSize, setLastOutputSize] = useState(0);

  const hasImage = Boolean(imageInfo);

  const selectedOutputFormat = useMemo(() => {
    return OUTPUT_FORMATS.find((item) => item.value === outputFormat) || OUTPUT_FORMATS[0];
  }, [outputFormat]);

  const selectedEffect = useMemo(() => {
    return effects.find((effect) => effect.id === selectedEffectId) || null;
  }, [effects, selectedEffectId]);

  const previewSize = useMemo(() => {
    if (!imageInfo) return { width: 0, height: 0 };

    const maxWidth = imageInfo.width >= imageInfo.height ? 1040 : 680;
    const baseWidth = Math.min(maxWidth, imageInfo.width);
    const scale = baseWidth / imageInfo.width;

    return {
      width: imageInfo.width * scale * zoom,
      height: imageInfo.height * scale * zoom,
    };
  }, [imageInfo, zoom]);

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
        "Blur images online with full image blur, selective blur, brush blur, pixel blur, focus blur, and motion blur effects.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Blur full image online",
        "Blur selected area of image",
        "Pixelate private information",
        "Brush blur tool",
        "Background focus blur",
        "Motion blur effect",
        "Download blurred image as PNG, JPG, or WEBP",
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
          name: "Can I blur only part of an image?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Upload your image, choose Area Blur, Brush Blur, Pixel Area, or Pixel Brush, then select the part you want to blur.",
          },
        },
        {
          "@type": "Question",
          name: "Is my image uploaded to a server?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. This blur image tool processes your photo in your browser. Your image is not uploaded to a server.",
          },
        },
        {
          "@type": "Question",
          name: "Can I pixelate private information?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Use the Pixel Area or Pixel Brush option to create a mosaic effect over faces, phone numbers, addresses, or other private details.",
          },
        },
      ],
    };
  }, []);

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

      const image = await loadImage(objectUrl);
      const naturalWidth = image.naturalWidth || image.width;
      const naturalHeight = image.naturalHeight || image.height;
      const scale = Math.min(1, MAX_CANVAS_LONG_SIDE / Math.max(naturalWidth, naturalHeight));
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

      setEffects([]);
      setDraftEffect(null);
      setSelectedEffectId(null);
      setHistoryPast([]);
      setHistoryFuture([]);
      setShowBefore(false);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setFullBlurEnabled(false);
      setFocusBlurEnabled(false);
      setMotionBlurEnabled(false);
      setOutputFormat(getDefaultOutputFormat(file.type));
      setLastOutputSize(0);
      setSuccessMessage("Image loaded. Choose a blur type and start editing.");
    } catch {
      setErrorMessage("Could not load this image. Please try another file.");
    } finally {
      setIsLoadingImage(false);
      resetFileInput();
    }
  }, []);

  useEffect(() => {
    renderPreviewCanvas();
  }, [
    imageInfo,
    effects,
    draftEffect,
    selectedEffectId,
    showBefore,
    fullBlurEnabled,
    fullBlurStrength,
    focusBlurEnabled,
    focusPreset,
    focusBlurStrength,
    motionBlurEnabled,
    motionBlurAmount,
    motionBlurAngle,
    cursorPoint,
    activeTool,
    brushSize,
    showBrushPreview,
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

    return () => document.removeEventListener("paste", handlePaste);
  }, [handleImageFile]);

  useEffect(() => {
    function handleKeyDown(event) {
      const target = event.target;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName);

      if (isTyping) return;

      const key = event.key.toLowerCase();
      const hasModifier = event.ctrlKey || event.metaKey;

      if (hasModifier && key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      if ((hasModifier && key === "z" && event.shiftKey) || (hasModifier && key === "y")) {
        event.preventDefault();
        redo();
        return;
      }

      if (hasModifier && key === "c") {
        event.preventDefault();
        copyEditedImageToClipboard();
        return;
      }

      if (hasModifier && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        setZoom((current) => clampNumber(Number((current + 0.1).toFixed(2)), 0.15, 8));
        return;
      }

      if (hasModifier && event.key === "-") {
        event.preventDefault();
        setZoom((current) => clampNumber(Number((current - 0.1).toFixed(2)), 0.15, 8));
        return;
      }

      if (hasModifier && event.key === "0") {
        event.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedEffectId) {
          event.preventDefault();
          deleteSelectedEffect();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEffectId, effects, fullBlurEnabled, fullBlurStrength, focusBlurEnabled, focusPreset, focusBlurStrength, motionBlurEnabled, motionBlurAmount, motionBlurAngle]);

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

    setLastOutputSize(0);
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

  function captureSnapshot() {
    return {
      effects: cloneJson(effects),
      fullBlurEnabled,
      fullBlurStrength,
      focusBlurEnabled,
      focusPreset,
      focusBlurStrength,
      motionBlurEnabled,
      motionBlurAmount,
      motionBlurAngle,
    };
  }

  function restoreSnapshot(snapshot) {
    setEffects(cloneJson(snapshot.effects || []));
    setFullBlurEnabled(Boolean(snapshot.fullBlurEnabled));
    setFullBlurStrength(Number(snapshot.fullBlurStrength || 8));
    setFocusBlurEnabled(Boolean(snapshot.focusBlurEnabled));
    setFocusPreset(snapshot.focusPreset || "center");
    setFocusBlurStrength(Number(snapshot.focusBlurStrength || 16));
    setMotionBlurEnabled(Boolean(snapshot.motionBlurEnabled));
    setMotionBlurAmount(Number(snapshot.motionBlurAmount || 14));
    setMotionBlurAngle(Number(snapshot.motionBlurAngle || 0));
    setSelectedEffectId(null);
    setDraftEffect(null);
    clearOutput();
  }

  function pushHistory() {
    setHistoryPast((current) => [...current, captureSnapshot()].slice(-MAX_HISTORY));
    setHistoryFuture([]);
  }

  function undo() {
    if (!historyPast.length) return;

    const previous = historyPast[historyPast.length - 1];
    const remaining = historyPast.slice(0, -1);

    setHistoryFuture((current) => [captureSnapshot(), ...current].slice(0, MAX_HISTORY));
    setHistoryPast(remaining);
    restoreSnapshot(previous);
  }

  function redo() {
    if (!historyFuture.length) return;

    const next = historyFuture[0];
    const remaining = historyFuture.slice(1);

    setHistoryPast((current) => [...current, captureSnapshot()].slice(-MAX_HISTORY));
    setHistoryFuture(remaining);
    restoreSnapshot(next);
  }

  function applyPreset(preset) {
    if (!hasImage) {
      setErrorMessage("Please upload an image first.");
      return;
    }

    pushHistory();

    if (preset.settings?.fullBlurEnabled !== undefined) setFullBlurEnabled(preset.settings.fullBlurEnabled);
    if (preset.settings?.fullBlurStrength !== undefined) setFullBlurStrength(preset.settings.fullBlurStrength);
    if (preset.settings?.focusBlurEnabled !== undefined) setFocusBlurEnabled(preset.settings.focusBlurEnabled);
    if (preset.settings?.focusPreset) setFocusPreset(preset.settings.focusPreset);
    if (preset.settings?.focusBlurStrength !== undefined) setFocusBlurStrength(preset.settings.focusBlurStrength);
    if (preset.settings?.motionBlurEnabled !== undefined) setMotionBlurEnabled(preset.settings.motionBlurEnabled);
    if (preset.settings?.motionBlurAmount !== undefined) setMotionBlurAmount(preset.settings.motionBlurAmount);
    if (preset.settings?.motionBlurAngle !== undefined) setMotionBlurAngle(preset.settings.motionBlurAngle);
    if (preset.settings?.pixelSize !== undefined) setPixelSize(preset.settings.pixelSize);
    if (preset.settings?.selectionShape) setSelectionShape(preset.settings.selectionShape);

    if (preset.tool) {
      setActiveTool(preset.tool);
    }

    clearOutput();
    setSuccessMessage(`${preset.label} applied.`);
  }

  function updateGlobalSetting(setter, value) {
    if (!hasImage) {
      setter(value);
      return;
    }

    pushHistory();
    setter(value);
    clearOutput();
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
    if (!hasImage) return;

    const point = getCanvasPoint(event);

    if (!point) return;

    event.preventDefault();
    setErrorMessage("");

    if (activeTool === "hand" || event.buttons === 4 || event.shiftKey && event.code === "Space") {
      startPan(event);
      return;
    }

    if (event.nativeEvent?.getModifierState?.("Space")) {
      startPan(event);
      return;
    }

    if (activeTool === "select") {
      const selected = getEffectAtPoint(point, effects);
      setSelectedEffectId(selected?.id || null);
      return;
    }

    if (activeTool === "areaBlur" || activeTool === "pixelArea") {
      pointerRef.current = {
        active: true,
        mode: activeTool,
        startPoint: point,
        lastPoint: point,
        startClient: null,
        startPan: null,
      };

      setDraftEffect({
        id: createId(),
        type: activeTool === "areaBlur" ? "areaBlur" : "areaPixel",
        shape: selectionShape,
        x: point.x,
        y: point.y,
        w: 0,
        h: 0,
        strength: blurStrength,
        pixelSize,
      });

      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }

    if (activeTool === "brushBlur" || activeTool === "pixelBrush") {
      pointerRef.current = {
        active: true,
        mode: activeTool,
        startPoint: point,
        lastPoint: point,
        startClient: null,
        startPan: null,
      };

      setDraftEffect({
        id: createId(),
        type: activeTool === "brushBlur" ? "brushBlur" : "brushPixel",
        points: [point],
        strength: blurStrength,
        brushSize,
        pixelSize,
      });

      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
  }

  function startPan(event) {
    pointerRef.current = {
      active: true,
      mode: "pan",
      startPoint: null,
      lastPoint: null,
      startClient: { x: event.clientX, y: event.clientY },
      startPan: { ...pan },
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!hasImage) return;

    const point = getCanvasPoint(event);

    if (point) {
      setCursorPoint(point);
    }

    if (!pointerRef.current.active) return;

    event.preventDefault();

    if (pointerRef.current.mode === "pan") {
      const startClient = pointerRef.current.startClient;
      const startPanValue = pointerRef.current.startPan;

      if (!startClient || !startPanValue) return;

      setPan({
        x: startPanValue.x + (event.clientX - startClient.x),
        y: startPanValue.y + (event.clientY - startClient.y),
      });

      return;
    }

    if (!point) return;

    if ((pointerRef.current.mode === "areaBlur" || pointerRef.current.mode === "pixelArea") && draftEffect) {
      const startPoint = pointerRef.current.startPoint;
      const nextDraft = {
        ...draftEffect,
        x: startPoint.x,
        y: startPoint.y,
        w: point.x - startPoint.x,
        h: point.y - startPoint.y,
      };

      if (event.shiftKey) {
        const side = Math.max(Math.abs(nextDraft.w), Math.abs(nextDraft.h));
        nextDraft.w = nextDraft.w < 0 ? -side : side;
        nextDraft.h = nextDraft.h < 0 ? -side : side;
      }

      setDraftEffect(nextDraft);
      return;
    }

    if ((pointerRef.current.mode === "brushBlur" || pointerRef.current.mode === "pixelBrush") && draftEffect) {
      setDraftEffect((current) => {
        if (!current) return current;

        const lastPoint = current.points[current.points.length - 1];
        const distance = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);

        if (distance < Math.max(4, brushSize * 0.12)) return current;

        return {
          ...current,
          points: [...current.points, point],
        };
      });
    }
  }

  function handlePointerLeave() {
    setCursorPoint(null);
  }

  function handlePointerUp(event) {
    if (!pointerRef.current.active) return;

    event.preventDefault();

    if (pointerRef.current.mode === "areaBlur" || pointerRef.current.mode === "pixelArea") {
      const finalEffect = normalizeEffect(draftEffect);

      if (finalEffect && finalEffect.w > 8 && finalEffect.h > 8) {
        pushHistory();
        setEffects((current) => [...current, finalEffect]);
        setSelectedEffectId(finalEffect.id);
        clearOutput();
        setSuccessMessage(finalEffect.type === "areaBlur" ? "Selected area blurred." : "Selected area pixelated.");
      }

      setDraftEffect(null);
    }

    if (pointerRef.current.mode === "brushBlur" || pointerRef.current.mode === "pixelBrush") {
      if (draftEffect?.points?.length) {
        pushHistory();
        setEffects((current) => [...current, draftEffect]);
        setSelectedEffectId(draftEffect.id);
        clearOutput();
        setSuccessMessage(draftEffect.type === "brushBlur" ? "Brush blur added." : "Pixel brush added.");
      }

      setDraftEffect(null);
    }

    pointerRef.current = {
      active: false,
      mode: "",
      startPoint: null,
      lastPoint: null,
      startClient: null,
      startPan: null,
    };

    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  function handleWheel(event) {
    if (!hasImage || !event.ctrlKey && !event.metaKey) return;

    event.preventDefault();

    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    setZoom((current) => clampNumber(Number((current + delta).toFixed(2)), 0.15, 8));
  }

  function updateSelectedEffect(updates) {
    if (!selectedEffectId) return;

    pushHistory();

    setEffects((current) =>
      current.map((effect) =>
        effect.id === selectedEffectId
          ? {
              ...effect,
              ...updates,
            }
          : effect
      )
    );

    clearOutput();
  }

  function deleteSelectedEffect() {
    if (!selectedEffectId) return;

    pushHistory();
    setEffects((current) => current.filter((effect) => effect.id !== selectedEffectId));
    setSelectedEffectId(null);
    clearOutput();
    setSuccessMessage("Selected blur effect removed.");
  }

  function resetAllEffects() {
    if (!hasImage) return;

    pushHistory();
    setEffects([]);
    setDraftEffect(null);
    setSelectedEffectId(null);
    setFullBlurEnabled(false);
    setFocusBlurEnabled(false);
    setMotionBlurEnabled(false);
    setFullBlurStrength(8);
    setFocusBlurStrength(16);
    setMotionBlurAmount(14);
    setMotionBlurAngle(0);
    clearOutput();
    setSuccessMessage("All blur effects reset.");
  }

  function renderPreviewCanvas() {
    const canvas = previewCanvasRef.current;

    if (!canvas || !hasImage) return;

    canvas.width = imageInfo.width;
    canvas.height = imageInfo.height;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showBefore) {
      ctx.drawImage(baseCanvasRef.current, 0, 0);
      drawOverlayHelpers(ctx, canvas.width, canvas.height);
      return;
    }

    const finalCanvas = renderFinalCanvas({ includeDraft: true });
    ctx.drawImage(finalCanvas, 0, 0);
    drawOverlayHelpers(ctx, canvas.width, canvas.height);
  }

  function drawOverlayHelpers(ctx, width, height) {
    if (draftEffect) {
      if (draftEffect.type === "areaBlur" || draftEffect.type === "areaPixel") {
        drawEffectBox(ctx, normalizeEffect(draftEffect), "#9b6ce3", "Selection");
      }
    }

    if (selectedEffect) {
      if (selectedEffect.type === "areaBlur" || selectedEffect.type === "areaPixel") {
        drawEffectBox(ctx, selectedEffect, "#9b6ce3", "Selected");
      }

      if (selectedEffect.type === "brushBlur" || selectedEffect.type === "brushPixel") {
        drawBrushPathBox(ctx, selectedEffect, "#9b6ce3", "Selected Brush");
      }
    }

    if (
      showBrushPreview &&
      cursorPoint &&
      ["brushBlur", "pixelBrush"].includes(activeTool) &&
      !pointerRef.current.active
    ) {
      drawBrushCursor(ctx, cursorPoint, brushSize, activeTool === "pixelBrush" ? "#ef4444" : "#9b6ce3");
    }

    drawCanvasCenterGuides(ctx, width, height);
  }

  function renderFinalCanvas({ includeDraft = false } = {}) {
    if (!hasImage) {
      throw new Error("No image loaded.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = imageInfo.width;
    canvas.height = imageInfo.height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas is not supported.");
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseCanvasRef.current, 0, 0);

    if (fullBlurEnabled) {
      applyFullBlur(canvas, baseCanvasRef.current, fullBlurStrength);
    }

    if (motionBlurEnabled) {
      applyMotionBlur(canvas, baseCanvasRef.current, motionBlurAmount, motionBlurAngle);
    }

    if (focusBlurEnabled) {
      applyFocusBlur(canvas, baseCanvasRef.current, focusPreset, focusBlurStrength);
    }

    const allEffects = includeDraft && draftEffect ? [...effects, normalizeEffect(draftEffect)] : effects;

    allEffects.forEach((effect) => {
      if (!effect) return;

      if (effect.type === "areaBlur") {
        applyAreaBlur(canvas, effect, effect.strength || blurStrength);
      }

      if (effect.type === "areaPixel") {
        applyAreaPixel(canvas, effect, effect.pixelSize || pixelSize);
      }

      if (effect.type === "brushBlur") {
        applyBrushBlurEffect(canvas, effect);
      }

      if (effect.type === "brushPixel") {
        applyBrushPixelEffect(canvas, effect);
      }
    });

    return canvas;
  }

  async function exportImage({ downloadAfterCreate = true } = {}) {
    if (!hasImage) {
      setErrorMessage("Please upload an image first.");
      return;
    }

    setIsExporting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const canvas = renderFinalCanvas();
      const blob = await canvasToBlob(canvas, outputFormat, quality);

      if (outputUrlRef.current) {
        URL.revokeObjectURL(outputUrlRef.current);
      }

      outputUrlRef.current = URL.createObjectURL(blob);
      setLastOutputSize(blob.size);
      setSuccessMessage("Blurred image is ready.");

      if (downloadAfterCreate) {
        downloadBlob(blob);
      }
    } catch {
      setErrorMessage("Could not create the blurred image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  function downloadBlob(blob) {
    if (!blob && !outputUrlRef.current) {
      setErrorMessage("Please create the blurred image first.");
      return;
    }

    const link = document.createElement("a");
    const fileName = getFileBaseName(imageInfo?.name || "image");

    link.href = blob ? URL.createObjectURL(blob) : outputUrlRef.current;
    link.download = `blurred-${fileName}.${selectedOutputFormat.extension}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (blob) {
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }
  }

  async function copyEditedImageToClipboard() {
    if (!hasImage) return;

    try {
      if (!navigator.clipboard || !window.ClipboardItem) {
        setErrorMessage("Image clipboard copy is not supported in this browser.");
        return;
      }

      const canvas = renderFinalCanvas();
      const blob = await canvasToBlob(canvas, "image/png", 1);

      await navigator.clipboard.write([
        new window.ClipboardItem({
          "image/png": blob,
        }),
      ]);

      setSuccessMessage("Edited image copied to clipboard.");
    } catch {
      setErrorMessage("Could not copy image. Please download it instead.");
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

    baseCanvasRef.current = document.createElement("canvas");
    setImageInfo(null);
    setIsDraggingFile(false);
    setIsLoadingImage(false);
    setErrorMessage("");
    setSuccessMessage("");
    setActiveTool("areaBlur");
    setSelectionShape("rect");
    setBlurStrength(12);
    setBrushSize(70);
    setPixelSize(16);
    setFullBlurEnabled(false);
    setFullBlurStrength(8);
    setFocusBlurEnabled(false);
    setFocusPreset("center");
    setFocusBlurStrength(16);
    setMotionBlurEnabled(false);
    setMotionBlurAmount(14);
    setMotionBlurAngle(0);
    setEffects([]);
    setDraftEffect(null);
    setSelectedEffectId(null);
    setHistoryPast([]);
    setHistoryFuture([]);
    setShowBefore(false);
    setShowBrushPreview(true);
    setCursorPoint(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setOutputFormat("image/png");
    setQuality(0.94);
    setIsExporting(false);
    setLastOutputSize(0);
    resetFileInput();
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
          <EyeOff size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Blur Image Online</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload a photo and add blur quickly. Blur the full image, selected areas,
          private information, background, or create focus and motion blur effects.
        </p>
      </section>

      <section className="card p-4 sm:p-5">
        {!hasImage && (
          <div
            onClick={openFilePicker}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition min-h-[360px] flex flex-col items-center justify-center ${
              isDraggingFile
                ? "border-[var(--primary)] bg-[#f4edff]"
                : "border-[var(--border)] hover:bg-[#f8f4ff]"
            }`}
          >
            {isLoadingImage ? (
              <Loader2 size={48} className="mx-auto mb-4 text-[var(--primary)] animate-spin" />
            ) : (
              <Upload size={48} className="mx-auto mb-4 text-[var(--primary)]" />
            )}

            <h2 className="text-2xl font-bold mb-2">Upload, drop, or paste image</h2>

            <p className="text-sm text-[var(--text-secondary)] max-w-xl">
              Supports JPG, PNG, WEBP, GIF, BMP, and other common image formats. You can also paste an image with <strong>Ctrl + V</strong>. Max file size: <strong>{MAX_FILE_SIZE_MB} MB</strong>.
            </p>

            <div className="mt-5 bg-white border border-[var(--border)] rounded-2xl px-5 py-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Your image is processed in your browser and is not uploaded to a server.
              </p>
            </div>
          </div>
        )}

        {hasImage && (
          <div className="grid xl:grid-cols-[340px_minmax(0,1fr)] gap-5">
            <aside className="border border-[var(--border)] rounded-2xl bg-white overflow-hidden">
              <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Image</p>
                    <h2 className="font-bold truncate max-w-[220px]">{imageInfo.name}</h2>
                  </div>

                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="w-10 h-10 rounded-xl border border-[var(--border)] inline-flex items-center justify-center hover:bg-[#f8f4ff]"
                    title="Upload another image"
                  >
                    <Upload size={18} />
                  </button>
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  {imageInfo.width} × {imageInfo.height}px • {formatBytes(imageInfo.size)}
                </p>
              </div>

              <div className="p-4 border-b border-[var(--border)]">
                <p className="text-sm font-semibold mb-3">Quick Presets</p>

                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="border border-[var(--border)] rounded-xl p-3 text-left hover:bg-[#f8f4ff] transition"
                    >
                      <p className="text-sm font-semibold">{preset.label}</p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-4">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 border-b border-[var(--border)]">
                <p className="text-sm font-semibold mb-3">Blur Tools</p>

                <div className="grid grid-cols-3 gap-2">
                  {BLUR_TOOLS.map((tool) => {
                    const Icon = tool.icon;

                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => {
                          setActiveTool(tool.id);
                          setSelectedEffectId(null);
                        }}
                        className={`rounded-xl border p-3 text-center transition ${
                          activeTool === tool.id
                            ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                            : "border-[var(--border)] hover:bg-[#f8f4ff]"
                        }`}
                        title={tool.label}
                      >
                        <Icon size={19} className="mx-auto mb-1" />
                        <span className="text-[11px] font-semibold">{tool.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-b border-[var(--border)] space-y-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-[var(--primary)]" />
                  <p className="text-sm font-semibold">Tool Settings</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectionShape("rect")}
                    className={`rounded-xl border px-3 py-2 inline-flex items-center justify-center gap-2 text-sm font-semibold ${
                      selectionShape === "rect"
                        ? "border-[var(--primary)] bg-[#f4edff]"
                        : "border-[var(--border)] hover:bg-[#f8f4ff]"
                    }`}
                  >
                    <Square size={16} /> Rect
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectionShape("circle")}
                    className={`rounded-xl border px-3 py-2 inline-flex items-center justify-center gap-2 text-sm font-semibold ${
                      selectionShape === "circle"
                        ? "border-[var(--primary)] bg-[#f4edff]"
                        : "border-[var(--border)] hover:bg-[#f8f4ff]"
                    }`}
                  >
                    <CircleIcon size={16} /> Circle
                  </button>
                </div>

                <RangeInput
                  label={`Blur Strength: ${blurStrength}px`}
                  min={1}
                  max={50}
                  step={1}
                  value={blurStrength}
                  onChange={(value) => setBlurStrength(Number(value))}
                />

                <RangeInput
                  label={`Brush Size: ${brushSize}px`}
                  min={8}
                  max={260}
                  step={1}
                  value={brushSize}
                  onChange={(value) => setBrushSize(Number(value))}
                />

                <RangeInput
                  label={`Pixel Size: ${pixelSize}px`}
                  min={4}
                  max={80}
                  step={1}
                  value={pixelSize}
                  onChange={(value) => setPixelSize(Number(value))}
                />

                <label className="flex items-center justify-between gap-3 bg-[#fafafa] border border-[var(--border)] rounded-xl p-3 cursor-pointer">
                  <span className="text-sm font-semibold">Brush Preview</span>
                  <input
                    type="checkbox"
                    checked={showBrushPreview}
                    onChange={(event) => setShowBrushPreview(event.target.checked)}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </label>
              </div>

              <div className="p-4 border-b border-[var(--border)] space-y-4">
                <p className="text-sm font-semibold">Global Blur Effects</p>

                <label className="flex items-center justify-between gap-3 bg-[#fafafa] border border-[var(--border)] rounded-xl p-3 cursor-pointer">
                  <span className="text-sm font-semibold">Full Image Blur</span>
                  <input
                    type="checkbox"
                    checked={fullBlurEnabled}
                    onChange={(event) => updateGlobalSetting(setFullBlurEnabled, event.target.checked)}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </label>

                {fullBlurEnabled && (
                  <RangeInput
                    label={`Full Blur: ${fullBlurStrength}px`}
                    min={1}
                    max={50}
                    step={1}
                    value={fullBlurStrength}
                    onChange={(value) => updateGlobalSetting(setFullBlurStrength, Number(value))}
                  />
                )}

                <label className="flex items-center justify-between gap-3 bg-[#fafafa] border border-[var(--border)] rounded-xl p-3 cursor-pointer">
                  <span className="text-sm font-semibold">Focus Blur</span>
                  <input
                    type="checkbox"
                    checked={focusBlurEnabled}
                    onChange={(event) => updateGlobalSetting(setFocusBlurEnabled, event.target.checked)}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </label>

                {focusBlurEnabled && (
                  <>
                    <select
                      value={focusPreset}
                      onChange={(event) => updateGlobalSetting(setFocusPreset, event.target.value)}
                      className="w-full border border-[var(--border)] rounded-xl px-3 py-3 bg-white outline-none focus:border-[var(--primary)]"
                    >
                      {FOCUS_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>

                    <RangeInput
                      label={`Focus Blur: ${focusBlurStrength}px`}
                      min={1}
                      max={50}
                      step={1}
                      value={focusBlurStrength}
                      onChange={(value) => updateGlobalSetting(setFocusBlurStrength, Number(value))}
                    />
                  </>
                )}

                <label className="flex items-center justify-between gap-3 bg-[#fafafa] border border-[var(--border)] rounded-xl p-3 cursor-pointer">
                  <span className="text-sm font-semibold">Motion Blur</span>
                  <input
                    type="checkbox"
                    checked={motionBlurEnabled}
                    onChange={(event) => updateGlobalSetting(setMotionBlurEnabled, event.target.checked)}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </label>

                {motionBlurEnabled && (
                  <>
                    <RangeInput
                      label={`Motion Amount: ${motionBlurAmount}px`}
                      min={2}
                      max={70}
                      step={1}
                      value={motionBlurAmount}
                      onChange={(value) => updateGlobalSetting(setMotionBlurAmount, Number(value))}
                    />

                    <RangeInput
                      label={`Angle: ${motionBlurAngle}°`}
                      min={-180}
                      max={180}
                      step={1}
                      value={motionBlurAngle}
                      onChange={(value) => updateGlobalSetting(setMotionBlurAngle, Number(value))}
                    />
                  </>
                )}
              </div>

              {selectedEffect && (
                <div className="p-4 border-b border-[var(--border)] space-y-4 bg-[#f8f4ff]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Selected Effect</p>

                    <button
                      type="button"
                      onClick={deleteSelectedEffect}
                      className="w-9 h-9 rounded-xl border border-[var(--border)] bg-white inline-flex items-center justify-center hover:bg-red-50 text-red-600"
                      title="Delete selected effect"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {(selectedEffect.type === "areaBlur" || selectedEffect.type === "brushBlur") && (
                    <RangeInput
                      label={`Strength: ${selectedEffect.strength || blurStrength}px`}
                      min={1}
                      max={50}
                      step={1}
                      value={selectedEffect.strength || blurStrength}
                      onChange={(value) => updateSelectedEffect({ strength: Number(value) })}
                    />
                  )}

                  {(selectedEffect.type === "areaPixel" || selectedEffect.type === "brushPixel") && (
                    <RangeInput
                      label={`Pixel Size: ${selectedEffect.pixelSize || pixelSize}px`}
                      min={4}
                      max={80}
                      step={1}
                      value={selectedEffect.pixelSize || pixelSize}
                      onChange={(value) => updateSelectedEffect({ pixelSize: Number(value) })}
                    />
                  )}
                </div>
              )}

              <div className="p-4 space-y-4">
                <p className="text-sm font-semibold">Export</p>

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
                    onChange={(value) => {
                      setQuality(Number(value));
                      clearOutput();
                    }}
                  />
                )}

                <button
                  type="button"
                  onClick={() => exportImage({ downloadAfterCreate: true })}
                  disabled={isExporting}
                  className={`btn-primary w-full inline-flex items-center justify-center gap-2 ${
                    isExporting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  {isExporting ? "Creating..." : "Download Blurred Image"}
                </button>

                {lastOutputSize ? (
                  <p className="text-xs text-center text-[var(--text-secondary)]">
                    Last output: {formatBytes(lastOutputSize)}
                  </p>
                ) : null}
              </div>
            </aside>

            <main className="min-w-0 flex flex-col gap-4">
              <div className="border border-[var(--border)] rounded-2xl bg-white p-3 flex flex-wrap items-center gap-2">
                <IconButton disabled={!historyPast.length} title="Undo (Ctrl + Z)" onClick={undo}>
                  <Undo2 size={18} />
                </IconButton>

                <IconButton disabled={!historyFuture.length} title="Redo (Ctrl + Shift + Z)" onClick={redo}>
                  <Redo2 size={18} />
                </IconButton>

                <IconButton disabled={!selectedEffectId} title="Delete selected effect" onClick={deleteSelectedEffect}>
                  <Trash2 size={18} />
                </IconButton>

                <div className="w-px h-8 bg-[var(--border)] mx-1" />

                <IconButton title="Zoom out" onClick={() => setZoom((current) => clampNumber(Number((current - 0.1).toFixed(2)), 0.15, 8))}>
                  <ZoomOut size={18} />
                </IconButton>

                <div className="min-w-[150px] flex items-center gap-2">
                  <input
                    type="range"
                    min="0.15"
                    max="8"
                    step="0.01"
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="w-full accent-[var(--primary)]"
                  />
                  <span className="text-xs font-semibold w-14 text-right">{Math.round(zoom * 100)}%</span>
                </div>

                <IconButton title="Zoom in" onClick={() => setZoom((current) => clampNumber(Number((current + 0.1).toFixed(2)), 0.15, 8))}>
                  <ZoomIn size={18} />
                </IconButton>

                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="h-10 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold hover:bg-[#f8f4ff]"
                >
                  Fit
                </button>

                <div className="w-px h-8 bg-[var(--border)] mx-1" />

                <button
                  type="button"
                  onClick={() => setShowBefore((current) => !current)}
                  className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm font-semibold ${
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
                  onClick={copyEditedImageToClipboard}
                  className="h-10 rounded-xl border border-[var(--border)] px-3 inline-flex items-center gap-2 text-sm font-semibold hover:bg-[#f8f4ff]"
                >
                  <Copy size={17} />
                  Copy
                </button>

                <button
                  type="button"
                  onClick={resetAllEffects}
                  className="h-10 rounded-xl border border-[var(--border)] px-3 inline-flex items-center gap-2 text-sm font-semibold hover:bg-[#f8f4ff]"
                >
                  <RotateCcw size={17} />
                  Reset Effects
                </button>
              </div>

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

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative border border-[var(--border)] rounded-2xl bg-[#eef0f5] min-h-[720px] overflow-auto flex items-center justify-center p-6 ${
                  isDraggingFile ? "ring-2 ring-[var(--primary)]" : ""
                }`}
              >
                <div
                  style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
                  className="transition-transform duration-75"
                >
                  <canvas
                    ref={previewCanvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onPointerLeave={handlePointerLeave}
                    onWheel={handleWheel}
                    className="rounded-2xl shadow-2xl bg-white touch-none"
                    style={{
                      width: `${previewSize.width}px`,
                      height: `${previewSize.height}px`,
                      maxWidth: "none",
                      cursor:
                        activeTool === "hand"
                          ? "grab"
                          : activeTool === "select"
                            ? "default"
                            : ["brushBlur", "pixelBrush"].includes(activeTool)
                              ? "none"
                              : "crosshair",
                    }}
                  />
                </div>

                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur border border-[var(--border)] rounded-2xl px-4 py-3 text-xs text-[var(--text-secondary)] shadow-sm">
                  <p><strong>Tip:</strong> Ctrl + mouse wheel to zoom. Use Hand tool to move the artboard.</p>
                  <p>Ctrl + Z undo • Ctrl + Shift + Z redo • Delete removes selected effect.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <InfoCard label="Effects" value={effects.length} />
                <InfoCard label="Tool" value={activeTool} />
                <InfoCard label="Zoom" value={`${Math.round(zoom * 100)}%`} />
                <InfoCard label="Format" value={selectedOutputFormat.label} />
                <InfoCard label="Privacy" value="Browser Only" green />
              </div>
            </main>
          </div>
        )}

        {hasImage && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <p className="text-sm text-blue-800">
              Privacy note: your image is processed directly in your browser. Please edit only images you own or have permission to use. Do not use blur tools to falsify documents, alter IDs, hide illegal content, or mislead people.
            </p>
          </div>
        )}

        {hasImage && (
          <button
            type="button"
            onClick={resetTool}
            className="btn-secondary w-full mt-4 inline-flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Reset Everything
          </button>
        )}
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-4">Blur Photos Online for Free</h2>

        <div className="text-[var(--text-secondary)] leading-7 space-y-3">
          <p>
            This Blur Image Online tool helps you add blur effects to photos directly in your browser. You can blur the full image, blur a selected area, use a brush to blur specific parts, pixelate private information, or create a background focus effect.
          </p>

          <p>
            It is useful for hiding faces, addresses, phone numbers, license plates, screenshots, private messages, and sensitive details. You can also use full blur, focus blur, and motion blur to create stylish backgrounds for social media, banners, thumbnails, and product images.
          </p>

          <p>
            The tool supports quick presets, before/after preview, zoom controls, undo and redo, keyboard shortcuts, and export options for PNG, JPG, and WEBP.
          </p>
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-5">Blur Image Tool FAQ</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <FaqItem
            question="Can I blur only part of an image?"
            answer="Yes. Use Area Blur, Brush Blur, Pixel Area, or Pixel Brush to blur only the selected part of your photo."
          />

          <FaqItem
            question="Can I pixelate private information?"
            answer="Yes. Use Pixel Area or Pixel Brush to create a mosaic effect over private details like faces, phone numbers, addresses, or screenshots."
          />

          <FaqItem
            question="Is my image uploaded to a server?"
            answer="No. This tool processes your image in your browser, so your photo stays on your device."
          />

          <FaqItem
            question="Can I blur an image background?"
            answer="Yes. You can use Full Image Blur for background images or Focus Blur to keep the center area clear while blurring the surrounding background."
          />

          <FaqItem
            question="Can I download the blurred image?"
            answer="Yes. You can download the final blurred image as PNG, JPG, or WEBP."
          />

          <FaqItem
            question="Is this blur image tool free?"
            answer="Yes. It is a free browser-based blur image tool and does not need a paid API."
          />
        </div>
      </section>

      <SuggestedTools currentToolId="blur-image" />
    </div>
  );
}

function IconButton({ children, disabled = false, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-10 h-10 rounded-xl border border-[var(--border)] inline-flex items-center justify-center ${
        disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-[#f8f4ff]"
      }`}
    >
      {children}
    </button>
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
      <p className={`font-bold break-all ${green ? "text-green-600" : "text-[var(--primary)]"}`}>{value}</p>
    </div>
  );
}

function FaqItem({ question, answer }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-sm text-[var(--text-secondary)]">{answer}</p>
    </div>
  );
}

function applyFullBlur(targetCanvas, sourceCanvas, strength) {
  const ctx = targetCanvas.getContext("2d");

  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  ctx.save();
  ctx.filter = `blur(${strength}px)`;
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.restore();
}

function applyMotionBlur(targetCanvas, sourceCanvas, amount, angleDegrees) {
  const ctx = targetCanvas.getContext("2d");
  const steps = Math.max(6, Math.min(32, Math.round(amount)));
  const angle = (angleDegrees * Math.PI) / 180;
  const dx = Math.cos(angle) * amount;
  const dy = Math.sin(angle) * amount;

  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  ctx.save();
  ctx.globalAlpha = 1 / steps;

  for (let i = 0; i < steps; i += 1) {
    const t = steps === 1 ? 0 : i / (steps - 1) - 0.5;
    ctx.drawImage(sourceCanvas, dx * t, dy * t);
  }

  ctx.restore();
}

function applyFocusBlur(targetCanvas, sourceCanvas, preset, strength) {
  const ctx = targetCanvas.getContext("2d");
  const width = targetCanvas.width;
  const height = targetCanvas.height;
  const focusBox = getFocusBox(preset, width, height);

  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.filter = `blur(${strength}px)`;
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  roundRect(ctx, focusBox.x, focusBox.y, focusBox.w, focusBox.h, Math.min(focusBox.w, focusBox.h) * 0.08);
  ctx.clip();
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.restore();

  featherFocusEdges(ctx, sourceCanvas, focusBox, Math.min(width, height) * 0.045);
}

function featherFocusEdges(ctx, sourceCanvas, box, feather) {
  if (feather <= 1) return;

  const temp = document.createElement("canvas");
  temp.width = sourceCanvas.width;
  temp.height = sourceCanvas.height;

  const tempCtx = temp.getContext("2d");
  tempCtx.drawImage(sourceCanvas, 0, 0);

  const mask = document.createElement("canvas");
  mask.width = sourceCanvas.width;
  mask.height = sourceCanvas.height;

  const maskCtx = mask.getContext("2d");
  maskCtx.fillStyle = "transparent";
  maskCtx.clearRect(0, 0, mask.width, mask.height);
  maskCtx.fillStyle = "#000";
  roundRect(maskCtx, box.x + feather, box.y + feather, box.w - feather * 2, box.h - feather * 2, Math.min(box.w, box.h) * 0.05);
  maskCtx.fill();
  maskCtx.filter = `blur(${feather}px)`;
  maskCtx.drawImage(mask, 0, 0);

  tempCtx.globalCompositeOperation = "destination-in";
  tempCtx.drawImage(mask, 0, 0);

  ctx.drawImage(temp, 0, 0);
}

function getFocusBox(preset, width, height) {
  if (preset === "portrait") {
    return {
      x: width * 0.27,
      y: height * 0.12,
      w: width * 0.46,
      h: height * 0.76,
    };
  }

  if (preset === "product") {
    return {
      x: width * 0.2,
      y: height * 0.18,
      w: width * 0.6,
      h: height * 0.64,
    };
  }

  if (preset === "horizontal") {
    return {
      x: width * 0.08,
      y: height * 0.35,
      w: width * 0.84,
      h: height * 0.3,
    };
  }

  if (preset === "vertical") {
    return {
      x: width * 0.35,
      y: height * 0.08,
      w: width * 0.3,
      h: height * 0.84,
    };
  }

  return {
    x: width * 0.22,
    y: height * 0.22,
    w: width * 0.56,
    h: height * 0.56,
  };
}

function applyAreaBlur(canvas, effect, strength) {
  const ctx = canvas.getContext("2d");
  const box = clampBox(normalizeEffect(effect), canvas.width, canvas.height);

  if (box.w <= 1 || box.h <= 1) return;

  const source = cloneCanvas(canvas);
  const padding = Math.max(6, strength * 2);
  const sx = clampNumber(box.x - padding, 0, canvas.width - 1);
  const sy = clampNumber(box.y - padding, 0, canvas.height - 1);
  const sw = clampNumber(box.w + padding * 2, 1, canvas.width - sx);
  const sh = clampNumber(box.h + padding * 2, 1, canvas.height - sy);

  const temp = document.createElement("canvas");
  temp.width = Math.max(1, Math.round(sw));
  temp.height = Math.max(1, Math.round(sh));

  const tempCtx = temp.getContext("2d");
  tempCtx.filter = `blur(${strength}px)`;
  tempCtx.drawImage(source, sx, sy, sw, sh, 0, 0, temp.width, temp.height);

  ctx.save();
  beginEffectClip(ctx, box, effect.shape);
  ctx.clip();
  ctx.drawImage(temp, sx, sy, sw, sh);
  ctx.restore();
}

function applyAreaPixel(canvas, effect, pixelSize) {
  const ctx = canvas.getContext("2d");
  const box = clampBox(normalizeEffect(effect), canvas.width, canvas.height);

  if (box.w <= 1 || box.h <= 1) return;

  const source = cloneCanvas(canvas);
  const smallWidth = Math.max(1, Math.round(box.w / pixelSize));
  const smallHeight = Math.max(1, Math.round(box.h / pixelSize));

  const small = document.createElement("canvas");
  small.width = smallWidth;
  small.height = smallHeight;

  const smallCtx = small.getContext("2d");
  smallCtx.imageSmoothingEnabled = true;
  smallCtx.drawImage(source, box.x, box.y, box.w, box.h, 0, 0, smallWidth, smallHeight);

  const pixelated = document.createElement("canvas");
  pixelated.width = Math.max(1, Math.round(box.w));
  pixelated.height = Math.max(1, Math.round(box.h));

  const pixelCtx = pixelated.getContext("2d");
  pixelCtx.imageSmoothingEnabled = false;
  pixelCtx.drawImage(small, 0, 0, smallWidth, smallHeight, 0, 0, pixelated.width, pixelated.height);

  ctx.save();
  beginEffectClip(ctx, box, effect.shape);
  ctx.clip();
  ctx.drawImage(pixelated, box.x, box.y, box.w, box.h);
  ctx.restore();
}

function applyBrushBlurEffect(canvas, effect) {
  const points = effect.points || [];

  points.forEach((point) => {
    applyBrushBlur(canvas, point, effect.brushSize || 70, effect.strength || 12);
  });
}

function applyBrushPixelEffect(canvas, effect) {
  const points = effect.points || [];

  points.forEach((point) => {
    applyPixelBrush(canvas, point, effect.brushSize || 70, effect.pixelSize || 16);
  });
}

function applyBrushBlur(canvas, point, size, strength) {
  const ctx = canvas.getContext("2d");
  const radius = size / 2;
  const padding = Math.max(6, strength * 2);
  const region = clampBox(
    {
      x: point.x - radius - padding,
      y: point.y - radius - padding,
      w: size + padding * 2,
      h: size + padding * 2,
    },
    canvas.width,
    canvas.height
  );

  const source = cloneCanvas(canvas);
  const temp = document.createElement("canvas");
  temp.width = Math.max(1, Math.round(region.w));
  temp.height = Math.max(1, Math.round(region.h));

  const tempCtx = temp.getContext("2d");
  tempCtx.filter = `blur(${strength}px)`;
  tempCtx.drawImage(source, region.x, region.y, region.w, region.h, 0, 0, temp.width, temp.height);

  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(temp, region.x, region.y, region.w, region.h);
  ctx.restore();
}

function applyPixelBrush(canvas, point, size, pixelSize) {
  const effect = {
    type: "areaPixel",
    shape: "circle",
    x: point.x - size / 2,
    y: point.y - size / 2,
    w: size,
    h: size,
    pixelSize,
  };

  applyAreaPixel(canvas, effect, pixelSize);
}

function beginEffectClip(ctx, box, shape) {
  ctx.beginPath();

  if (shape === "circle") {
    ctx.ellipse(box.x + box.w / 2, box.y + box.h / 2, Math.abs(box.w / 2), Math.abs(box.h / 2), 0, 0, Math.PI * 2);
    return;
  }

  ctx.rect(box.x, box.y, box.w, box.h);
}

function drawEffectBox(ctx, effect, color, label) {
  if (!effect) return;

  const box = normalizeEffect(effect);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = Math.max(2, ctx.canvas.width * 0.0014);
  ctx.setLineDash([12, 8]);

  beginEffectClip(ctx, box, effect.shape);
  ctx.fill();
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.font = `700 ${Math.max(14, ctx.canvas.width * 0.014)}px Arial, sans-serif`;
  ctx.fillText(label, box.x + 8, Math.max(20, box.y + 22));
  ctx.restore();
}

function drawBrushPathBox(ctx, effect, color, label) {
  const points = effect.points || [];

  if (!points.length) return;

  const radius = (effect.brushSize || 70) / 2;
  const minX = Math.min(...points.map((point) => point.x)) - radius;
  const minY = Math.min(...points.map((point) => point.y)) - radius;
  const maxX = Math.max(...points.map((point) => point.x)) + radius;
  const maxY = Math.max(...points.map((point) => point.y)) + radius;

  drawEffectBox(
    ctx,
    {
      shape: "rect",
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
    },
    color,
    label
  );
}

function drawBrushCursor(ctx, point, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = Math.max(2, ctx.canvas.width * 0.0012);
  ctx.beginPath();
  ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCanvasCenterGuides(ctx, width, height) {
  ctx.save();
  ctx.strokeStyle = "rgba(155,108,227,0.18)";
  ctx.lineWidth = Math.max(1, width * 0.001);
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
  ctx.restore();
}

function getEffectAtPoint(point, effects) {
  for (let i = effects.length - 1; i >= 0; i -= 1) {
    const effect = effects[i];

    if (effect.type === "areaBlur" || effect.type === "areaPixel") {
      const box = normalizeEffect(effect);

      if (pointInBox(point, box)) {
        return effect;
      }
    }

    if (effect.type === "brushBlur" || effect.type === "brushPixel") {
      const radius = (effect.brushSize || 70) / 2;
      const hit = (effect.points || []).some((item) => Math.hypot(point.x - item.x, point.y - item.y) <= radius);

      if (hit) return effect;
    }
  }

  return null;
}

function normalizeEffect(effect) {
  if (!effect) return null;

  if (effect.type !== "areaBlur" && effect.type !== "areaPixel" && !Object.prototype.hasOwnProperty.call(effect, "w")) {
    return effect;
  }

  const x = Math.min(effect.x, effect.x + effect.w);
  const y = Math.min(effect.y, effect.y + effect.h);
  const w = Math.abs(effect.w);
  const h = Math.abs(effect.h);

  return {
    ...effect,
    x,
    y,
    w,
    h,
  };
}

function pointInBox(point, box) {
  return point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h;
}

function clampBox(box, width, height) {
  const x = clampNumber(box.x, 0, Math.max(0, width - 1));
  const y = clampNumber(box.y, 0, Math.max(0, height - 1));
  const w = clampNumber(box.w, 1, Math.max(1, width - x));
  const h = clampNumber(box.h, 1, Math.max(1, height - y));

  return { ...box, x, y, w, h };
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

function cloneCanvas(sourceCanvas) {
  const canvas = document.createElement("canvas");
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(sourceCanvas, 0, 0);

  return canvas;
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

function getDefaultOutputFormat(fileType) {
  if (fileType === "image/jpeg") return "image/jpeg";
  if (fileType === "image/webp") return "image/webp";
  return "image/png";
}

function getFileBaseName(fileName) {
  return String(fileName || "image").replace(/\.[^/.]+$/, "");
}

function clampNumber(value, min, max) {
  const number = Number(value);

  if (Number.isNaN(number)) return min;

  return Math.min(max, Math.max(min, number));
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

function formatBytes(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const sizeIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, sizeIndex);

  return `${size.toFixed(sizeIndex === 0 ? 0 : 1)} ${units[sizeIndex]}`;
}
