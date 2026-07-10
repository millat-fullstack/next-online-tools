// src/tools/SmartPhotoEditor.jsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  RotateCw,
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  CaseSensitive,
  ZoomIn,
  ZoomOut,
  Move,
  Hand,
  PanelLeft,
  Scissors,
  Shapes,
  Pipette,
  Triangle,
  Star,
  Hexagon,
  ChevronDown,
  ChevronUp,
  Layers,
  Crop,
  Lock,
  Unlock,
  Eraser,
  X,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Smart Photo Editor",
  path: "/smart-photo-editor",
  category: "Image Tools",
  description:
    "Edit photos online with transparent artboards, drag-and-drop image layers, quality-preserving resize, text, drawing, blur, patch, clone, shapes, and export.",
  metaTitle: "Smart Photo Editor Online | Edit, Retouch, Blur, Draw & Add Text",
  metaDescription:
    "Edit photos online for free with transparent artboards, drag-and-drop layers, quality-preserving resize, text, blur, patch, clone, and PNG, JPG, or WEBP export.",
};

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_CANVAS_LONG_SIDE = 5000;
const MIN_PROCESSING_TIME_MS = 6000;
const MAX_HISTORY = 30;
const SNAP_DISTANCE = 10;
const BACKGROUND_LAYER_NAME = "Artboard Background";

const TOOLS = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "hand", label: "Hand Tool", icon: Hand },
  { id: "marquee", label: "Marquee Tool", icon: Crop },
  { id: "text", label: "Text", icon: Type },
  { id: "draw", label: "Draw", icon: PenLine },
  { id: "blur", label: "Blur", icon: EyeOff },
  { id: "patch", label: "Patch Tool", icon: Sparkles },
  { id: "eraser", label: "Eraser Tool", icon: Eraser },
  { id: "clone", label: "Clone", icon: Copy },
  { id: "restore", label: "Restore", icon: RotateCcw },
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

const PRINT_SIZE_PRESETS = [
  { id: "none", label: "Choose print size", width: null, height: null },
  { id: "a4-portrait", label: "A4 Portrait", width: 2480, height: 3508 },
  { id: "a4-landscape", label: "A4 Landscape", width: 3508, height: 2480 },
  { id: "letter-portrait", label: "Letter Portrait", width: 2550, height: 3300 },
  { id: "letter-landscape", label: "Letter Landscape", width: 3300, height: 2550 },
  { id: "a5-portrait", label: "A5 Portrait", width: 1748, height: 2480 },
  { id: "a5-landscape", label: "A5 Landscape", width: 2480, height: 1748 },
  { id: "business-card", label: "Business Card", width: 1050, height: 600 },
];

const SHAPE_INCH_DPI = 300;

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
    label: "Normal Text",
    color: "#111827",
    background: "#ffffff",
    fontSize: 48,
    bold: false,
    shadow: false,
    hasBackground: false,
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

const TEXT_CASE_OPTIONS = [
  { value: "none", label: "Normal" },
  { value: "uppercase", label: "UPPERCASE" },
  { value: "lowercase", label: "lowercase" },
  { value: "capitalize", label: "Capitalize" },
  { value: "title", label: "Title Case" },
];

const FONT_WEIGHT_OPTIONS = [
  { value: 300, label: "Light" },
  { value: 400, label: "Regular" },
  { value: 500, label: "Medium" },
  { value: 600, label: "Semi Bold" },
  { value: 700, label: "Bold" },
  { value: 800, label: "Extra Bold" },
  { value: 900, label: "Black" },
];

const TEXT_ALIGN_OPTIONS = [
  { value: "left", label: "Left", icon: AlignLeft },
  { value: "center", label: "Center", icon: AlignCenter },
  { value: "right", label: "Right", icon: AlignRight },
];

const TEXT_TOOL_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect x='5' y='4' width='22' height='5' rx='1.5' fill='%23111827'/%3E%3Crect x='13.5' y='8' width='5' height='20' rx='1.5' fill='%23111827'/%3E%3Cpath d='M4 28h24' stroke='%23ffffff' stroke-width='2'/%3E%3C/svg%3E\") 16 16, text";


const SHAPE_TYPES = [
  { id: "rectangle", label: "Rectangle", icon: Square },
  { id: "triangle", label: "Triangle", icon: Triangle },
  { id: "circle", label: "Circle", icon: CircleIcon },
  { id: "star", label: "Star", icon: Star },
  { id: "hexagon", label: "Hexagon", icon: Hexagon },
  { id: "arrow", label: "Arrow", icon: ArrowUpRight },
];

const SELECTION_MODES = [
  { id: "rectSelect", label: "Rectangular", icon: Square },
  { id: "ellipseSelect", label: "Circle", icon: CircleIcon },
  { id: "squareSelect", label: "Square", icon: Square },
  { id: "freeSelect", label: "Lasso", icon: Scissors },
  { id: "pointSelect", label: "Polygonal Lasso", icon: Star },
];

const GRADIENT_TEMPLATES = [
  { id: "purple-green", label: "Purple Green", start: "#7c3aed", end: "#22c55e", angle: 135 },
  { id: "blue-cyan", label: "Blue Cyan", start: "#2563eb", end: "#06b6d4", angle: 120 },
  { id: "sunset", label: "Sunset", start: "#f97316", end: "#ec4899", angle: 135 },
  { id: "gold", label: "Gold", start: "#f59e0b", end: "#fef3c7", angle: 90 },
  { id: "dark", label: "Dark", start: "#111827", end: "#4b5563", angle: 135 },
];



export default function SmartPhotoEditor() {
  const mainFileInputRef = useRef(null);
  const addImageInputRef = useRef(null);
  const textEditorRef = useRef(null);
  const toolbarRef = useRef(null);
  const quickBarRef = useRef(null);
  const optionsPanelRef = useRef(null);
  const editorClipboardRef = useRef(null);
  const spacePressedRef = useRef(false);
  const colorPreviewThrottleRef = useRef(0);
  const guideThrottleRef = useRef(0);
  const renderFrameRef = useRef(null);
  const dragDepthRef = useRef(0);

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
    resizeHandle: null,
  });

  const [imageInfo, setImageInfo] = useState(null);
  const [selectedSizePreset, setSelectedSizePreset] = useState("original");
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 630 });
  const [draftSize, setDraftSize] = useState({ width: 1200, height: 630 });
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState("#ffffff");
  const [transparentArtboard, setTransparentArtboard] = useState(false);
  const [keepQuality, setKeepQuality] = useState(true);
  const [pickedColor, setPickedColor] = useState("#9b6ce3");
  const [gradientStartColor, setGradientStartColor] = useState("#7c3aed");
  const [gradientEndColor, setGradientEndColor] = useState("#22c55e");
  const [gradientAngle, setGradientAngle] = useState(135);
  const [textBackgroundGradient, setTextBackgroundGradient] = useState(null);
  const [shapeFillGradient, setShapeFillGradient] = useState(null);
  const [selectionActionBox, setSelectionActionBox] = useState(null);
  const [pointSelectionReady, setPointSelectionReady] = useState(false);

  const [activeTool, setActiveTool] = useState("select");
  const [activePanel, setActivePanel] = useState("");
  const [toolPopupOpen, setToolPopupOpen] = useState(false);
  const [popupTop, setPopupTop] = useState(12);
  const [popupLeft, setPopupLeft] = useState(88);
  const [popupMaxHeight, setPopupMaxHeight] = useState(560);
  const [topBarOpen, setTopBarOpen] = useState(true);
  const [colorPickerTarget, setColorPickerTarget] = useState(null);
  const [imageInputMode, setImageInputMode] = useState("add");
  const [printSizePreset, setPrintSizePreset] = useState("none");
  const [shapeSizeModal, setShapeSizeModal] = useState(null);
  const [exactShapeSize, setExactShapeSize] = useState({ width: 300, height: 180 });
  const [exactShapeUnit, setExactShapeUnit] = useState("px");
  const [topBarDropdown, setTopBarDropdown] = useState("");

  const [objects, setObjects] = useState([]);
  const [draftObject, setDraftObject] = useState(null);
  const [selectionRect, setSelectionRect] = useState(null);
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [selectedObjectIds, setSelectedObjectIds] = useState([]);
  const [lockedObjectIds, setLockedObjectIds] = useState([]);
  const [activeSelection, setActiveSelection] = useState(null);
  const [freeSelectionDraft, setFreeSelectionDraft] = useState(null);

  const [historyPast, setHistoryPast] = useState([]);
  const [historyFuture, setHistoryFuture] = useState([]);

  const [brushSize, setBrushSize] = useState(36);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushColor, setBrushColor] = useState("#ef4444");
  const [blurStrength, setBlurStrength] = useState(10);

  const [textValue, setTextValue] = useState("Add text");
  const [textColor, setTextColor] = useState("#111827");
  const [textBackground, setTextBackground] = useState("#ffffff");
  const [textHasBackground, setTextHasBackground] = useState(false);
  const [textFontFamily, setTextFontFamily] = useState("Arial, sans-serif");
  const [fontSize, setFontSize] = useState(48);
  const [fontWeight, setFontWeight] = useState(500);
  const [textAlign, setTextAlign] = useState("center");
  const [textCase, setTextCase] = useState("none");
  const [textBoxWidth, setTextBoxWidth] = useState(360);
  const [textBoxHeight, setTextBoxHeight] = useState(120);
  const [boldText, setBoldText] = useState(false);
  const [textShadow, setTextShadow] = useState(false);
  const [textFocusRequest, setTextFocusRequest] = useState(0);

  const [shapeType, setShapeType] = useState("rectangle");
  const [shapeFillEnabled, setShapeFillEnabled] = useState(true);
  const [shapeStrokeEnabled, setShapeStrokeEnabled] = useState(true);
  const [shapeFillColor, setShapeFillColor] = useState("#ef4444");
  const [shapeStrokeColor, setShapeStrokeColor] = useState("#ef4444");
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(6);

  const [patchTargetBox, setPatchTargetBox] = useState(null);
  const [patchTargetSelection, setPatchTargetSelection] = useState(null);
  const [patchSourcePreviewBox, setPatchSourcePreviewBox] = useState(null);
  const [isSettingPatchTarget, setIsSettingPatchTarget] = useState(false);
  const [patchStrength, setPatchStrength] = useState(1);
  const [patchFeather, setPatchFeather] = useState(18);

  const [cloneSourceBox, setCloneSourceBox] = useState(null);
  const [cloneSourceSelection, setCloneSourceSelection] = useState(null);
  const [cloneTargetPreviewBox, setCloneTargetPreviewBox] = useState(null);
  const [isSettingCloneSource, setIsSettingCloneSource] = useState(false);
  const [showCloneSourceGuide, setShowCloneSourceGuide] = useState(false);
  const [cloneStrength, setCloneStrength] = useState(1);
  const [cloneFeather, setCloneFeather] = useState(8);

  const [showOriginal, setShowOriginal] = useState(false);
  const [showGuides] = useState(true);
  const [guideInfo, setGuideInfo] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [brushPreviewPoint, setBrushPreviewPoint] = useState(null);
  const [artboardPan, setArtboardPan] = useState({ x: 0, y: 0 });

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

  const selectedObjects = useMemo(() => {
    const activeIds = selectedObjectIds.length
      ? selectedObjectIds
      : selectedObjectId
        ? [selectedObjectId]
        : [];

    return objects.filter((item) => activeIds.includes(item.id));
  }, [objects, selectedObjectId, selectedObjectIds]);

  const selectedLocked = useMemo(() => {
    const activeIds = selectedObjectIds.length
      ? selectedObjectIds
      : selectedObjectId
        ? [selectedObjectId]
        : [];

    return activeIds.some((id) => lockedObjectIds.includes(id));
  }, [lockedObjectIds, selectedObjectId, selectedObjectIds]);

  const selectedKeepQuality = useMemo(() => {
    const editableItems = selectedObjects.filter((item) => item.type !== "background");

    if (!editableItems.length) return keepQuality;

    return editableItems.every((item) => item.keepQuality !== false);
  }, [selectedObjects, keepQuality]);

  const allLayersKeepQuality = useMemo(() => {
    const editableItems = objects.filter((item) => item.type !== "background");

    if (!editableItems.length) return keepQuality;

    return editableItems.every((item) => item.keepQuality !== false);
  }, [objects, keepQuality]);

  const selectedObjectBox = useMemo(() => {
    return selectedObject ? getObjectBox(selectedObject) : null;
  }, [selectedObject]);

  const selectedGroupBox = useMemo(() => {
    return selectedObjects.length > 1 ? getGroupBox(selectedObjects) : selectedObjectBox;
  }, [selectedObjects, selectedObjectBox]);

  const quickSelectedOpacity = useMemo(() => {
    if (!selectedObjects.length) return 100;

    const opacityValue = selectedObjects[0]?.opacity ?? 1;
    return Math.round(clampNumber(opacityValue, 0, 1) * 100);
  }, [selectedObjects]);

  const quickSelectedColor = useMemo(() => {
    if (!selectedObjects.length) return shapeFillColor;

    const item = selectedObjects[0];

    if (item?.type === "background") return item.color || canvasBackgroundColor;
    if (item?.type === "text") return item.color || textColor;
    if (item?.type === "arrow") return item.stroke || shapeStrokeColor;
    if (SHAPE_TYPES.some((shape) => shape.id === item?.type)) {
      return item.fill || shapeFillColor;
    }

    return shapeFillColor;
  }, [selectedObjects, shapeFillColor, shapeStrokeColor, textColor, canvasBackgroundColor]);

  const quickSelectedFontSize = selectedObject?.type === "text"
    ? Math.round(Number(selectedObject.fontSize || fontSize))
    : fontSize;

  const quickSelectedStrokeWidth = selectedObject?.strokeWidth || shapeStrokeWidth;

  const quickSelectedRotation = useMemo(() => {
    if (!selectedObjects.length) return 0;

    const rotationValue = Number(selectedObjects[0]?.rotation || 0);
    const normalized = ((rotationValue % 360) + 360) % 360;

    return Math.round(normalized);
  }, [selectedObjects]);

  const topBarSizeEditable = Boolean(
    selectedObjects.length &&
      selectedGroupBox &&
      selectedObjects.every((item) =>
        item.type === "background" ||
        item.type === "image" ||
        item.type === "text" ||
        item.type === "arrow" ||
        SHAPE_TYPES.some((shape) => shape.id === item.type)
      )
  );

  const quickSelectedWidthValue = topBarSizeEditable
    ? formatSizeForUnit(selectedGroupBox.w, exactShapeUnit)
    : "";

  const quickSelectedHeightValue = topBarSizeEditable
    ? formatSizeForUnit(selectedGroupBox.h, exactShapeUnit)
    : "";

  const selectedOutputFormat = useMemo(() => {
    return OUTPUT_FORMATS.find((item) => item.value === outputFormat) || OUTPUT_FORMATS[0];
  }, [outputFormat]);

  useEffect(() => {
    if (selectedObject?.type !== "text") return;

    setTextValue(selectedObject.text || "");
    setTextColor(selectedObject.color || "#ffffff");
    setTextBackground(selectedObject.background || "#111827");
    setTextHasBackground(selectedObject.hasBackground !== false);
    setTextFontFamily(selectedObject.fontFamily || "Arial, sans-serif");
    setFontSize(Number(selectedObject.fontSize || 48));
    setFontWeight(Number(selectedObject.fontWeight || (selectedObject.bold ? 800 : 500)));
    setTextAlign(selectedObject.textAlign || "center");
    setTextCase(selectedObject.textCase || "none");
    setTextBoxWidth(Number(selectedObject.w || 360));
    setTextBoxHeight(Number(selectedObject.h || 120));
    setBoldText(Boolean(selectedObject.bold || Number(selectedObject.fontWeight || 0) >= 700));
    setTextShadow(Boolean(selectedObject.shadow));
  }, [selectedObjectId]);

  useEffect(() => {
    if (!textFocusRequest) return;
    if (!toolPopupOpen || activePanel !== "text" || selectedObject?.type !== "text") return;

    const timer = window.setTimeout(() => {
      textEditorRef.current?.focus();
      textEditorRef.current?.select();
    }, 80);

    return () => window.clearTimeout(timer);
  }, [textFocusRequest, toolPopupOpen, activePanel, selectedObjectId, selectedObject?.type]);

  useEffect(() => {
    setSelectedObjectIds((current) =>
      current.filter((id) => objects.some((item) => item.id === id))
    );
  }, [objects]);

  useEffect(() => {
    setLockedObjectIds((current) =>
      current.filter((id) => objects.some((item) => item.id === id))
    );
  }, [objects]);

  useEffect(() => {
    if (!selectedObjectId) {
      if (selectedObjectIds.length) {
        setSelectedObjectIds([]);
      }
      return;
    }

    if (selectedObjectIds.length <= 1 && selectedObjectIds[0] !== selectedObjectId) {
      setSelectedObjectIds([selectedObjectId]);
    }
  }, [selectedObjectId]);

  const previewWidth = useMemo(() => {
    if (!canvasSize.width) return 0;

    const isLandscape = canvasSize.width >= canvasSize.height;
    const maxWidth = isLandscape ? 1120 : 650;

    return Math.min(maxWidth, canvasSize.width) * previewZoom;
  }, [canvasSize, previewZoom]);

  const previewHeight = useMemo(() => {
    if (!canvasSize.width || !previewWidth) return 0;
    return (canvasSize.height / canvasSize.width) * previewWidth;
  }, [canvasSize, previewWidth]);

  const settingsMode = activePanel || activeTool;

  const shouldShowSettings = toolPopupOpen && [
    "select",
    "move",
    "hand",
    "marquee",
    "image",
    "text",
    "draw",
    "blur",
    "eraser",
    "restore",
    "rectangle",
    "triangle",
    "circle",
    "star",
    "hexagon",
    "arrow",
    "patch",
    "clone",
    "size",
    "export",
    "shape",
    "color",
    "freeSelect",
    "rectSelect",
    "ellipseSelect",
    "squareSelect",
    "pointSelect",
    "selectModes",
    "marqueeModes",
    "crop",
    "layers",
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

      const baseBox = getImageFitBox({
        imageWidth: naturalWidth,
        imageHeight: naturalHeight,
        canvasWidth: uploadCanvasSize.width,
        canvasHeight: uploadCanvasSize.height,
      });

      const shouldUseTransparentArtboard =
        transparentArtboard ||
        (selectedSizePreset === "original" && supportsTransparentFormat(file.type));

      setupBlankCanvas({
        width: uploadCanvasSize.width,
        height: uploadCanvasSize.height,
        transparent: shouldUseTransparentArtboard,
        backgroundColor: canvasBackgroundColor,
      });

      const backgroundLayer = createBackgroundLayer(
        uploadCanvasSize.width,
        uploadCanvasSize.height,
        canvasBackgroundColor,
        shouldUseTransparentArtboard
      );

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
        keepQuality,
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
      setTransparentArtboard(shouldUseTransparentArtboard);
      setObjects([backgroundLayer, baseImageObject]);
      setLockedObjectIds([backgroundLayer.id]);
      setDraftObject(null);
    setSelectionRect(null);
      setSelectedObjectId(baseImageObject.id);
      setSelectedObjectIds([baseImageObject.id]);
      setActiveSelection(null);
      setFreeSelectionDraft(null);
      setHistoryPast([]);
      setHistoryFuture([]);
      setPatchTargetBox(null);
      setPatchTargetSelection(null);
      setPatchSourcePreviewBox(null);
      setIsSettingPatchTarget(false);
      setCloneSourceBox(null);
      setCloneSourceSelection(null);
      setCloneTargetPreviewBox(null);
      setIsSettingCloneSource(false);
      setShowCloneSourceGuide(false);
      setGuideInfo(buildGuideInfo(getObjectBox(baseImageObject), uploadCanvasSize, "Drag image to adjust"));
      setShowOriginal(false);
      setPreviewZoom(getInitialPreviewZoom(uploadCanvasSize));
      setArtboardPan({ x: 0, y: 0 });
      setActiveTool("select");
      setActivePanel("");
      setToolPopupOpen(false);
      setColorPickerTarget(null);
      setOutputFormat(getDefaultOutputFormat(file.type));

      setSuccessMessage("");
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
  }, [draftSize, selectedSizePreset, canvasBackgroundColor, transparentArtboard, keepQuality]);

  useEffect(() => {
    if (renderFrameRef.current) {
      window.cancelAnimationFrame(renderFrameRef.current);
    }

    renderFrameRef.current = window.requestAnimationFrame(() => {
      renderVisibleCanvas();
      renderFrameRef.current = null;
    });

    return () => {
      if (renderFrameRef.current) {
        window.cancelAnimationFrame(renderFrameRef.current);
        renderFrameRef.current = null;
      }
    };
  }, [
    imageInfo,
    canvasSize,
    objects,
    draftObject,
    selectionRect,
    selectedObjectId,
    selectedObjectIds,
    activeSelection,
    freeSelectionDraft,
    showOriginal,
    showGuides,
    guideInfo,
    patchTargetBox,
    patchTargetSelection,
    patchSourcePreviewBox,
    cloneSourceBox,
    cloneSourceSelection,
    cloneTargetPreviewBox,
    showCloneSourceGuide,
    activeTool,
    brushPreviewPoint,
    brushSize,
    brushColor,
    brushOpacity,
  ]);

  useEffect(() => {
    function handlePaste(event) {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type?.startsWith("image/"));

      if (!imageItem) return;

      const file = imageItem.getAsFile();

      if (file) {
        if (hasImage) {
          addImageFileAsLayer(file, "Pasted image added as a new layer.");
        } else {
          handleMainImageFile(file);
        }
      }
    }

    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handleMainImageFile, hasImage]);

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
      if (!hasImage || showOriginal) return;

      const isTyping = isEditableTarget(event.target);

      if (!isTyping && event.code === "Space") {
        spacePressedRef.current = true;
      }

      if (isTyping) return;

      const isModifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (!isModifier && key === "v") {
        event.preventDefault();
        setActiveTool("select");
        setActivePanel("");
        setToolPopupOpen(false);
        setSuccessMessage("Select tool activated.");
        return;
      }

      if (isModifier && key === "d") {
        event.preventDefault();

        if (selectedObjectIds.length || selectedObjectId) {
          duplicateSelectedObjects();
        } else if (editorClipboardRef.current) {
          pasteEditorClipboard();
        } else if (activeSelection?.path?.length) {
          clearFreeSelectionManually("Free selection deselected.");
        } else {
          setErrorMessage("Select an item first, then press Ctrl/Cmd + D to duplicate it.");
        }
        return;
      }

      if (isModifier && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }

      if (isModifier && key === "c") {
        event.preventDefault();
        copyEditorSelection();
        return;
      }

      if (isModifier && key === "x") {
        event.preventDefault();
        cutEditorSelection();
        return;
      }

      if (isModifier && key === "v") {
        if (editorClipboardRef.current) {
          event.preventDefault();
          pasteEditorClipboard();
        }
        return;
      }

      if (isModifier && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        setPreviewZoom((current) => clampNumber(current + 0.12, 0.1, 8));
        return;
      }

      if (isModifier && (event.key === "-" || event.key === "_")) {
        event.preventDefault();
        setPreviewZoom((current) => clampNumber(current - 0.12, 0.1, 8));
        return;
      }

      if (isModifier && event.key === "0") {
        event.preventDefault();
        setPreviewZoom(1);
        setArtboardPan({ x: 0, y: 0 });
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && (selectedObjectId || selectedObjectIds.length)) {
        event.preventDefault();
        deleteSelectedObject();
        return;
      }

      const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

      if (selectedObjectId && arrowKeys.includes(event.key)) {
        event.preventDefault();

        const step = event.shiftKey ? 10 : 1;
        const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
        const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;

        moveSelectedObjectByKeyboard(dx, dy, { withHistory: !event.repeat });
      }
    }

    function handleKeyUp(event) {
      if (event.code === "Space") {
        spacePressedRef.current = false;
      }
    }

    function handleDocumentPointerDown(event) {
      const target = event.target;
      const quickBar = quickBarRef.current;

      if (topBarDropdown && !quickBar?.contains(target)) {
        setTopBarDropdown("");
      }

      if (!toolPopupOpen) return;

      const panel = optionsPanelRef.current;
      const toolbar = toolbarRef.current;

      if (panel?.contains(target) || toolbar?.contains(target)) return;

      setToolPopupOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("pointerdown", handleDocumentPointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, [hasImage, showOriginal, selectedObjectId, selectedObjectIds, objects, canvasSize, historyPast, historyFuture, activeSelection, toolPopupOpen, topBarDropdown]);

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

  function createBackgroundLayer(
    width = canvasSize.width,
    height = canvasSize.height,
    color = canvasBackgroundColor,
    transparent = transparentArtboard
  ) {
    return {
      id: createId(),
      type: "background",
      name: BACKGROUND_LAYER_NAME,
      x: 0,
      y: 0,
      w: width,
      h: height,
      color: normalizeColor(color),
      opacity: 1,
      transparent: Boolean(transparent),
      isBackground: true,
    };
  }

  function getBackgroundLayer() {
    return objects.find((item) => item.type === "background") || null;
  }

  function toggleTransparentArtboard(nextValue = !transparentArtboard) {
    const nextTransparent = Boolean(nextValue);

    if (hasImage) {
      pushHistory();
    }

    setTransparentArtboard(nextTransparent);
    setObjects((current) => {
      const hasBackground = current.some((item) => item.type === "background");

      if (!hasBackground && hasImage) {
        return [
          createBackgroundLayer(
            canvasSize.width,
            canvasSize.height,
            canvasBackgroundColor,
            nextTransparent
          ),
          ...current,
        ];
      }

      return current.map((item) =>
        item.type === "background"
          ? { ...item, transparent: nextTransparent }
          : item
      );
    });

    if (nextTransparent && outputFormat === "image/jpeg") {
      setOutputFormat("image/png");
    }

    setSuccessMessage(
      nextTransparent
        ? "Transparent artboard enabled. Export as PNG or WEBP to keep transparency."
        : "Solid artboard background enabled."
    );
    clearOutput();
  }

  function setKeepQualityForAll(nextValue = !keepQuality) {
    const nextKeepQuality = Boolean(nextValue);

    if (hasImage) {
      pushHistory();
    }

    setKeepQuality(nextKeepQuality);
    setObjects((current) =>
      current.map((item) =>
        item.type === "background"
          ? item
          : { ...item, keepQuality: nextKeepQuality }
      )
    );
    setSuccessMessage(
      nextKeepQuality
        ? "Keep Quality enabled for all layers. High-quality resampling will be used while resizing."
        : "Keep Quality disabled for all layers."
    );
    clearOutput();
  }

  function toggleLayerKeepQuality(id, nextValue = null) {
    const item = objects.find((layer) => layer.id === id);

    if (!item || item.type === "background") return;

    const nextKeepQuality =
      typeof nextValue === "boolean" ? nextValue : item.keepQuality === false;

    pushHistory();
    setObjects((current) =>
      current.map((layer) =>
        layer.id === id
          ? { ...layer, keepQuality: nextKeepQuality }
          : layer
      )
    );
    clearOutput();
  }

  function toggleSelectedKeepQuality() {
    const activeIds = getActiveSelectedIds();
    const editableIds = activeIds.filter((id) =>
      objects.some((item) => item.id === id && item.type !== "background")
    );

    if (!editableIds.length) {
      setKeepQualityForAll(!keepQuality);
      return;
    }

    const nextKeepQuality = !selectedKeepQuality;
    pushHistory();
    setObjects((current) =>
      current.map((item) =>
        editableIds.includes(item.id)
          ? { ...item, keepQuality: nextKeepQuality }
          : item
      )
    );
    setSuccessMessage(
      nextKeepQuality
        ? "Keep Quality enabled for the selected layer(s)."
        : "Keep Quality disabled for the selected layer(s)."
    );
    clearOutput();
  }

  function updateLiveGuideInfo(info) {
    const now = performance.now();

    if (now - guideThrottleRef.current < 70) return;

    guideThrottleRef.current = now;
    setGuideInfo(info);
  }

  function sampleVisibleColor(point) {
    const canvas = visibleCanvasRef.current || workingCanvasRef.current;

    if (!canvas || !point) return pickedColor;

    try {
      return sampleColorAtPoint(canvas, point);
    } catch {
      return pickedColor;
    }
  }

  function setupBlankCanvas({ width, height, transparent = false, backgroundColor = "#ffffff" }) {
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

    // Background is controlled by the locked Artboard Background layer.
    // Keeping this canvas transparent makes background changes instant.
  }

  function changeArtboardBackgroundColor(nextColor, { withHistory = false, allowLocked = false } = {}) {
    const color = normalizeColor(nextColor);
    const backgroundLayer = getBackgroundLayer();

    if (!backgroundLayer) {
      setCanvasBackgroundColor(color);
      return;
    }

    setSelectedObjectId(backgroundLayer.id);
    setSelectedObjectIds([backgroundLayer.id]);

    if (isObjectLocked(backgroundLayer.id) && !allowLocked) {
      setErrorMessage("Unlock the Artboard Background layer from Layers before changing its color.");
      setGuideInfo(buildGuideInfo(getObjectBox(backgroundLayer), canvasSize, "Background layer locked"));
      return;
    }

    if (withHistory) {
      pushHistory();
    }

    setCanvasBackgroundColor(color);
    setTransparentArtboard(false);

    setObjects((current) =>
      current.map((item) =>
        item.id === backgroundLayer.id
          ? {
              ...item,
              color,
              transparent: false,
            }
          : item
      )
    );

    setGuideInfo(buildGuideInfo(getObjectBox(backgroundLayer), canvasSize, "Background color changed instantly"));
    clearOutput();
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
    setSelectedObjectIds([]);
    setDraftObject(null);
    setSelectionRect(null);
    setGuideInfo(null);
    setPatchTargetBox(null);
    setPatchTargetSelection(null);
    setPatchSourcePreviewBox(null);
    setIsSettingPatchTarget(false);
    setCloneTargetPreviewBox(null);
    setShowCloneSourceGuide(false);
    setColorPickerTarget(null);
    setSelectionActionBox(null);
  }

  function clearFreeSelectionManually(message = "Free selection cleared.") {
    setActiveSelection(null);
    setFreeSelectionDraft(null);
    setSelectionRect(null);
    setPatchTargetSelection(null);
    setCloneSourceSelection(null);
    setGuideInfo(null);
    setSelectionActionBox(null);
    setSuccessMessage(message);
  }

  function startSolidColorPage() {
    const nextSize = {
      width: clampNumber(
        Number(draftSize.width) || 1200,
        100,
        MAX_CANVAS_LONG_SIDE
      ),
      height: clampNumber(
        Number(draftSize.height) || 1200,
        100,
        MAX_CANVAS_LONG_SIDE
      ),
    };

    pushHistory();

    setupBlankCanvas({
      width: nextSize.width,
      height: nextSize.height,
      transparent: true,
      backgroundColor: canvasBackgroundColor,
    });

    const backgroundLayer = createBackgroundLayer(
      nextSize.width,
      nextSize.height,
      canvasBackgroundColor,
      transparentArtboard
    );

    setImageInfo({
      name: transparentArtboard ? "Transparent artboard" : "Solid color page",
      size: 0,
      type: transparentArtboard ? "transparent-artboard" : "solid-color",
      width: nextSize.width,
      height: nextSize.height,
      naturalWidth: nextSize.width,
      naturalHeight: nextSize.height,
      isSolidColorPage: true,
    });

    setCanvasSize(nextSize);
    setDraftSize(nextSize);
    setObjects([backgroundLayer]);
    setLockedObjectIds([backgroundLayer.id]);
    setDraftObject(null);
    setSelectionRect(null);
    setSelectedObjectId(null);
    setSelectedObjectIds([]);
    setActiveSelection(null);
    setFreeSelectionDraft(null);
    setSelectionRect(null);
      setSelectionRect(null);
      setHistoryPast([]);
    setHistoryFuture([]);
    setPatchTargetBox(null);
    setPatchTargetSelection(null);
    setPatchSourcePreviewBox(null);
    setIsSettingPatchTarget(false);
    setCloneSourceBox(null);
    setCloneSourceSelection(null);
    setCloneTargetPreviewBox(null);
    setIsSettingCloneSource(false);
    setShowCloneSourceGuide(false);
    setGuideInfo(null);
    setShowOriginal(false);
    setPreviewZoom(getInitialPreviewZoom(nextSize));
    setArtboardPan({ x: 0, y: 0 });
    setActiveTool("select");
    setActivePanel("");
    setToolPopupOpen(false);
    setColorPickerTarget(null);
    setOutputFormat("image/png");
    setErrorMessage("");
    setSuccessMessage("");
    clearOutput();
  }

  function openMainFilePicker() {
    mainFileInputRef.current?.click();
  }

  function openAddImagePicker(mode = "add") {
    if (!hasImage) {
      setErrorMessage("Please upload a photo or start with a colored page first.");
      return;
    }

    if (mode === "replace" && selectedObject?.type !== "image") {
      setErrorMessage("Please select an image layer to replace.");
      return;
    }

    setImageInputMode(mode);
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

      if (imageInputMode === "replace" && selectedObject?.type === "image") {
        const updatedImageObject = {
          ...selectedObject,
          src,
          element: imageElement,
          name: file.name || selectedObject.name || "replaced-image",
        };

        pushHistory();
        setObjects((current) =>
          current.map((item) =>
            item.id === selectedObject.id ? updatedImageObject : item
          )
        );
        setGuideInfo(buildGuideInfo(getObjectBox(updatedImageObject), canvasSize, "Image replaced"));
        setActiveTool("select");
        setActivePanel("image");
        setToolPopupOpen(true);
        clearOutput();
        setSuccessMessage("Selected image replaced. Size and position were kept.");
        return;
      }

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
        keepQuality,
      };

      pushHistory();

      setObjects((current) => [...current, imageObject]);
      setSelectedObjectId(imageObject.id);
      setSelectedObjectIds([imageObject.id]);
      setActiveTool("select");
      setActivePanel("image");
      setToolPopupOpen(true);
      setGuideInfo(buildGuideInfo(getObjectBox(imageObject), canvasSize, "Image added"));
      clearOutput();
      setSuccessMessage("Image added. Drag it to position. Use Image settings to resize.");
    } catch {
      setErrorMessage("Could not add this image. Please try another file.");
    } finally {
      setImageInputMode("add");
      resetAddImageInput();
    }
  }


  async function addImageFileAsLayer(
    file,
    message = "Image added as a new layer.",
    centerPoint = null
  ) {
    const validationError = validateImageFile(file);

    if (validationError) {
      setErrorMessage(validationError);
      return false;
    }

    try {
      const src = await readFileAsDataUrl(file);
      await addImageLayerFromSource({
        src,
        name: file.name || "dropped-image",
        message,
        centerPoint,
      });
      return true;
    } catch {
      setErrorMessage("Could not add this image. Please try another file.");
      return false;
    }
  }

  async function addImageLayerFromSource({
    src,
    name = "copied-selection",
    message = "Image layer added.",
    x = null,
    y = null,
    w = null,
    h = null,
    centerPoint = null,
  }) {
    const imageElement = await loadImage(src);

    const imageWidth = imageElement.naturalWidth || imageElement.width;
    const imageHeight = imageElement.naturalHeight || imageElement.height;

    const shouldUseExactBox = Number.isFinite(Number(x)) && Number.isFinite(Number(y)) && Number(w) > 0 && Number(h) > 0;
    const maxLayerSize = Math.min(canvasSize.width, canvasSize.height) * 0.42;
    const scale = shouldUseExactBox ? 1 : Math.min(1, maxLayerSize / Math.max(imageWidth, imageHeight));

    const layerWidth = shouldUseExactBox ? Math.max(20, Number(w)) : Math.max(20, imageWidth * scale);
    const layerHeight = shouldUseExactBox ? Math.max(20, Number(h)) : Math.max(20, imageHeight * scale);
    const targetCenterX = Number.isFinite(Number(centerPoint?.x))
      ? clampNumber(Number(centerPoint.x), 0, canvasSize.width)
      : canvasSize.width / 2;
    const targetCenterY = Number.isFinite(Number(centerPoint?.y))
      ? clampNumber(Number(centerPoint.y), 0, canvasSize.height)
      : canvasSize.height / 2;

    const imageObject = {
      id: createId(),
      type: "image",
      src,
      element: imageElement,
      name,
      x: shouldUseExactBox ? Number(x) : targetCenterX - layerWidth / 2,
      y: shouldUseExactBox ? Number(y) : targetCenterY - layerHeight / 2,
      w: layerWidth,
      h: layerHeight,
      opacity: 1,
      keepQuality,
    };

    pushHistory();

    setObjects((current) => [...current, imageObject]);
    setSelectedObjectId(imageObject.id);
    setSelectedObjectIds([imageObject.id]);
    setActiveTool("select");
    setActivePanel("image");
    setToolPopupOpen(true);
    setGuideInfo(buildGuideInfo(getObjectBox(imageObject), canvasSize, "Image layer added"));
    clearOutput();
    setSuccessMessage(message);
  }

  async function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDraggingFile(false);

    const files = Array.from(event.dataTransfer?.files || []).filter((file) =>
      file.type?.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name || "")
    );

    if (!files.length) {
      setErrorMessage("Drop a valid image file such as PNG, JPG, WEBP, GIF, or BMP.");
      return;
    }

    if (!hasImage) {
      await handleMainImageFile(files[0]);
      return;
    }

    const dropPoint = getCanvasPoint(event);
    let addedCount = 0;

    for (let index = 0; index < files.length; index += 1) {
      const offsetPoint = dropPoint
        ? {
            x: dropPoint.x + index * 24,
            y: dropPoint.y + index * 24,
          }
        : null;
      const added = await addImageFileAsLayer(
        files[index],
        files.length > 1
          ? `Dropped image ${index + 1} of ${files.length} as a new layer.`
          : "Dropped image added as a new layer.",
        offsetPoint
      );

      if (added) addedCount += 1;
    }

    if (addedCount > 1) {
      setSuccessMessage(`${addedCount} dropped images were added as separate layers.`);
    }
  }

  function handleDragEnter(event) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setIsDraggingFile(true);
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    setIsDraggingFile(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDraggingFile(false);
    }
  }

  function handleArtboardPointerDown(event) {
    if (event.target === visibleCanvasRef.current) return;

    setSelectedObjectId(null);
    setSelectedObjectIds([]);
    setDraftObject(null);
    setSelectionRect(null);
    setActiveSelection(null);
    setFreeSelectionDraft(null);
    setSelectionRect(null);
    setSelectionRect(null);
    setPatchTargetBox(null);
    setPatchTargetSelection(null);
    setPatchSourcePreviewBox(null);
    setCloneTargetPreviewBox(null);
    setShowCloneSourceGuide(false);
    setGuideInfo(null);
    setActivePanel("");
    setToolPopupOpen(false);
    setColorPickerTarget(null);
  }

  function renderVisibleCanvas() {
    const canvas = visibleCanvasRef.current;

    if (!canvas || !hasImage) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackgroundLayer(ctx, objects, canvas.width, canvas.height, canvasBackgroundColor);

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
      if (patchTargetSelection?.path?.length) {
        drawFreeSelection(ctx, patchTargetSelection.path, "#ef4444", "Problem Area");
      } else {
        drawAreaBox(ctx, patchTargetBox, "#ef4444", "Problem Area");
      }
    }

    if (activeTool === "patch" && patchSourcePreviewBox) {
      drawAreaBox(ctx, patchSourcePreviewBox, "#16a34a", "Good Texture");
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

    if (activeSelection?.path?.length) {
      drawFreeSelection(ctx, activeSelection.path, "#0ea5e9", "Selection");
    }

    if (freeSelectionDraft?.path?.length) {
      drawFreeSelection(ctx, freeSelectionDraft.path, "#0ea5e9", "Free Select");
    }

    if (selectionRect) {
      drawMarqueeSelection(ctx, selectionRect);
    }

    if (draftObject) {
      drawObject(ctx, draftObject);
    }

    if (["draw", "blur", "restore", "eraser"].includes(activeTool) && brushPreviewPoint) {
      drawBrushPreview(ctx, brushPreviewPoint, brushSize, brushColor, brushOpacity);
    }

    if (showGuides) {
      drawEditorGuides(ctx, canvas.width, canvas.height);
    }

    if (selectedObjects.length > 1) {
      drawGroupSelectionBox(ctx, selectedObjects);
    } else if (selectedObject) {
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

    drawBackgroundLayer(ctx, objects, canvas.width, canvas.height, canvasBackgroundColor);
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
      transparentArtboard,
      keepQuality,
      lockedObjectIds: [...lockedObjectIds],
      activeSelection: activeSelection ? cloneFreeSelection(activeSelection) : null,
      patchTargetBox: patchTargetBox ? { ...patchTargetBox } : null,
      patchTargetSelection: patchTargetSelection ? cloneFreeSelection(patchTargetSelection) : null,
      cloneSourceBox: cloneSourceBox ? { ...cloneSourceBox } : null,
      cloneSourceSelection: cloneSourceSelection ? cloneFreeSelection(cloneSourceSelection) : null,
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
    setTransparentArtboard(Boolean(snapshot.transparentArtboard));
    setKeepQuality(snapshot.keepQuality !== false);
    setObjects(hydratedObjects);
    setLockedObjectIds(snapshot.lockedObjectIds || []);
    setActiveSelection(snapshot.activeSelection || null);
    setFreeSelectionDraft(null);
    setSelectionRect(null);
    setPatchTargetBox(snapshot.patchTargetBox || null);
    setPatchTargetSelection(snapshot.patchTargetSelection || null);
    setPatchSourcePreviewBox(null);
    setCloneSourceBox(snapshot.cloneSourceBox || null);
    setCloneSourceSelection(snapshot.cloneSourceSelection || null);
    setCloneTargetPreviewBox(null);
    setShowCloneSourceGuide(Boolean(snapshot.showCloneSourceGuide));
    setGuideInfo(null);
    setSelectedObjectId(null);
    setSelectedObjectIds([]);
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

  function startColorPicker(target, label) {
    if (!hasImage) {
      setErrorMessage("Please upload a photo first.");
      return;
    }

    setColorPickerTarget({ target, label });
    setToolPopupOpen(false);
    setActivePanel("");
    setActiveTool("colorPicker");
    setSuccessMessage(`Color picker ready. Move over the image to preview color, then click to use it for ${label}.`);
  }

  function handleColorPick(point) {
    try {
      const color = sampleVisibleColor(point);

      setPickedColor(color);

      if (colorPickerTarget?.target === "quick") {
        updateQuickColor(color);
        setBrushColor(color);
        setShapeFillColor(color);
        setShapeStrokeColor(color);
        setTextColor(color);
        navigator.clipboard?.writeText?.(color).catch(() => {});
      }

      if (colorPickerTarget?.target === "textColor") updateTextSetting("color", color);
      if (colorPickerTarget?.target === "textBackground") updateTextSetting("background", color);
      if (colorPickerTarget?.target === "brushColor") setBrushColor(color);
      if (colorPickerTarget?.target === "shapeFill") updateShapeSetting("fill", color);
      if (colorPickerTarget?.target === "shapeStroke") updateShapeSetting("stroke", color);

      setColorPickerTarget(null);
      setActiveTool("select");
      setActivePanel("");
      setSuccessMessage(`Picked ${color}. Color copied and ready to use.`);
      setToolPopupOpen(false);
      clearOutput();
    } catch {
      setColorPickerTarget(null);
      setErrorMessage("Could not pick a color from this point. Please try again.");
    }
  }


  async function copyPickedColorToUse() {
    const color = normalizeColor(pickedColor);

    try {
      await navigator.clipboard?.writeText?.(color);
    } catch {
      fallbackCopyText(color);
    }

    updateQuickColor(color);
    setBrushColor(color);
    setShapeFillColor(color);
    setShapeStrokeColor(color);
    setTextColor(color);
    setSuccessMessage(`${color} copied and applied to the active color.`);
    clearOutput();
  }

  function getCurrentGradient(overrides = {}) {
    return {
      type: "linear",
      start: normalizeColor(overrides.start ?? gradientStartColor),
      end: normalizeColor(overrides.end ?? gradientEndColor),
      angle: clampNumber(Number(overrides.angle ?? gradientAngle), 0, 360),
    };
  }

  function applyGradientTemplate(template) {
    setGradientStartColor(template.start);
    setGradientEndColor(template.end);
    setGradientAngle(template.angle);
    updateQuickGradient({
      type: "linear",
      start: template.start,
      end: template.end,
      angle: template.angle,
    });
  }

  function updateGradientPart(field, value) {
    const next = {
      start: field === "start" ? value : gradientStartColor,
      end: field === "end" ? value : gradientEndColor,
      angle: field === "angle" ? value : gradientAngle,
    };

    if (field === "start") setGradientStartColor(value);
    if (field === "end") setGradientEndColor(value);
    if (field === "angle") setGradientAngle(Number(value));

    updateQuickGradient(getCurrentGradient(next));
  }

  function updateQuickGradient(gradient = getCurrentGradient()) {
    const cleanGradient = {
      type: "linear",
      start: normalizeColor(gradient.start),
      end: normalizeColor(gradient.end),
      angle: clampNumber(Number(gradient.angle), 0, 360),
    };

    setTextBackgroundGradient(cleanGradient);
    setShapeFillGradient(cleanGradient);

    if (!selectedObjects.length) {
      setTextHasBackground(true);
      setSuccessMessage("Gradient ready for new text backgrounds and shapes.");
      return;
    }

    updateSelectedItems((item) => {
      if (item.type === "text") {
        return {
          hasBackground: true,
          backgroundGradient: cleanGradient,
        };
      }

      if (SHAPE_TYPES.some((shape) => shape.id === item.type)) {
        return {
          fillEnabled: true,
          fillGradient: cleanGradient,
        };
      }

      if (item.type === "arrow") {
        return {
          stroke: cleanGradient.start,
        };
      }

      return {};
    }, "Gradient updated");
  }

  function clearSelectedGradient() {
    setTextBackgroundGradient(null);
    setShapeFillGradient(null);

    if (!selectedObjects.length) {
      setSuccessMessage("Gradient cleared for new objects.");
      return;
    }

    updateSelectedItems((item) => {
      if (item.type === "text") return { backgroundGradient: null };
      if (SHAPE_TYPES.some((shape) => shape.id === item.type)) return { fillGradient: null };
      return {};
    }, "Gradient cleared");
  }

  async function copyCurrentSelectionAndHide() {
    await copyEditorSelection();
    setToolPopupOpen(false);
    setSelectionActionBox(null);
  }

  function handlePointerDown(event) {
    if (!hasImage || showOriginal) return;

    if (spacePressedRef.current) {
      event.preventDefault();
      setErrorMessage("");

      pointerRef.current = {
        active: true,
        mode: "pan-artboard",
        startPoint: { x: event.clientX, y: event.clientY },
        lastPoint: null,
        selectedStart: { ...artboardPan },
        dragStartBox: null,
        resizeHandle: null,
      };

      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }

    const point = getCanvasPoint(event);

    if (!point) return;

    event.preventDefault();
    setErrorMessage("");

    if (colorPickerTarget) {
      handleColorPick(point);
      return;
    }

    if (activeTool === "hand") {
      pointerRef.current = {
        active: true,
        mode: "pan-artboard",
        startPoint: { x: event.clientX, y: event.clientY },
        lastPoint: null,
        selectedStart: { ...artboardPan },
        dragStartBox: null,
        resizeHandle: null,
      };

      event.currentTarget.setPointerCapture?.(event.pointerId);
      setGuideInfo(null);
      return;
    }

    if (activeTool === "select") {
      handleSelectPointerDown(event, point);
      return;
    }

    if (activeTool === "move") {
      handleMoveToolPointerDown(event, point);
      return;
    }

    if (["rectSelect", "squareSelect", "ellipseSelect"].includes(activeTool) || activeTool === "crop") {
      handleRectSelectPointerDown(event, point);
      return;
    }

    if (activeTool === "freeSelect") {
      handleFreeSelectPointerDown(event, point);
      return;
    }

    if (activeTool === "pointSelect") {
      handlePointSelectPointerDown(event, point);
      return;
    }

    if (activeTool === "text") {
      handleTextPointerDown(point);
      return;
    }

    if (SHAPE_TYPES.some((shape) => shape.id === activeTool)) {
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

    if (["draw", "blur", "restore", "eraser"].includes(activeTool)) {
      handleBrushPointerDown(event, point);
    }
  }

  function handleSelectPointerDown(event, point) {
    const selected = getObjectAtPoint(point, objects);

    if (!selected) {
      setSelectedObjectId(null);
      setSelectedObjectIds([]);
      setDraftObject(null);
      setGuideInfo(buildGuideInfo({ x: point.x, y: point.y, w: 1, h: 1 }, canvasSize, "Drag to select multiple items"));
      setColorPickerTarget(null);
      setSelectionRect({ x: point.x, y: point.y, w: 0, h: 0 });

      pointerRef.current = {
        active: true,
        mode: "marquee-select",
        startPoint: point,
        lastPoint: point,
        selectedStart: event.shiftKey ? [...selectedObjectIds] : [],
        dragStartBox: null,
        resizeHandle: null,
      };

      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }

    const currentlySelectedIds = selectedObjectIds.length
      ? selectedObjectIds
      : selectedObjectId
        ? [selectedObjectId]
        : [];

    const multiSelectKey = event.shiftKey || event.metaKey || event.ctrlKey;

    if (multiSelectKey) {
      const nextIds = currentlySelectedIds.includes(selected.id)
        ? currentlySelectedIds.filter((id) => id !== selected.id)
        : [...currentlySelectedIds, selected.id];

      if (!nextIds.length) {
        setSelectedObjectId(null);
        setSelectedObjectIds([]);
        setGuideInfo(null);
        return;
      }

      setSelectedObjectId(selected.id);
      setSelectedObjectIds(nextIds);
      setToolPopupOpen(true);
      setActivePanel("select");

      const nextObjects = objects.filter((item) => nextIds.includes(item.id));
      const nextBox = getGroupBox(nextObjects) || getObjectBox(selected);

      setGuideInfo(
        buildGuideInfo(
          nextBox,
          canvasSize,
          nextObjects.length > 1 ? `${nextObjects.length} items selected` : "Selected"
        )
      );
      return;
    }

    if (event.detail >= 2 && selected.type === "text") {
      setSelectedObjectId(selected.id);
      setSelectedObjectIds([selected.id]);
      setActiveTool("select");
      setActivePanel("text");
      setToolPopupOpen(true);
      setTextFocusRequest((current) => current + 1);
      setGuideInfo(buildGuideInfo(getObjectBox(selected), canvasSize, "Edit text"));
      return;
    }

    const nextIds = currentlySelectedIds.includes(selected.id) && currentlySelectedIds.length > 1
      ? currentlySelectedIds
      : [selected.id];

    setSelectedObjectId(selected.id);
    setSelectedObjectIds(nextIds);
    setToolPopupOpen(true);

    if (nextIds.length > 1) {
      setActivePanel("select");
    } else if (selected.type === "text") {
      setActivePanel("text");
    } else if (selected.type === "image") {
      setActivePanel("image");
    } else if (SHAPE_TYPES.some((shape) => shape.id === selected.type)) {
      setActivePanel("shape");
    } else {
      setActivePanel("");
    }

    const selectedItemsForAction = objects.filter((item) => nextIds.includes(item.id));
    const selectedBox = nextIds.length > 1
      ? getGroupBox(selectedItemsForAction)
      : getObjectBox(selected);
    const resizeHandle = getResizeHandleAtBox(point, selectedBox, previewZoom, canvasSize);

    const shouldAltDragCopy = event.altKey && !resizeHandle;

    if (shouldAltDragCopy) {
      if (activeSelectionHasBackground(nextIds)) {
        setErrorMessage("The Artboard Background layer cannot be copied by Alt + drag.");
        return;
      }

      if (activeSelectionHasLockedItem(nextIds)) {
        setErrorMessage("This layer is locked. Unlock it before copying by Alt + drag.");
        return;
      }

      const duplicatedItems = duplicateObjectsForDrag(selectedItemsForAction);

      if (!duplicatedItems.length) return;

      const duplicatedIds = duplicatedItems.map((item) => item.id);
      const duplicatedBox = duplicatedItems.length > 1
        ? getGroupBox(duplicatedItems)
        : getObjectBox(duplicatedItems[0]);

      pushHistory();

      setObjects((current) => [...current, ...duplicatedItems]);
      setSelectedObjectId(duplicatedIds[duplicatedIds.length - 1]);
      setSelectedObjectIds(duplicatedIds);
      setActivePanel(duplicatedItems.length > 1 ? "select" : duplicatedItems[0]?.type === "text" ? "text" : duplicatedItems[0]?.type === "image" ? "image" : "shape");
      setToolPopupOpen(true);

      pointerRef.current = {
        active: true,
        mode: duplicatedItems.length > 1 ? "move-group" : "move-object",
        startPoint: point,
        lastPoint: point,
        selectedStart: duplicatedItems.length > 1
          ? duplicatedItems.map(cloneObject)
          : cloneObject(duplicatedItems[0]),
        dragStartBox: duplicatedBox,
        resizeHandle: null,
        selectedIds: duplicatedIds,
      };

      setGuideInfo(
        buildGuideInfo(
          duplicatedBox,
          canvasSize,
          event.shiftKey ? "Copied • Shift keeps movement straight" : "Copied • Drag to place"
        )
      );
      event.currentTarget.setPointerCapture?.(event.pointerId);
      clearOutput();
      return;
    }

    pushHistory();

    pointerRef.current = {
      active: true,
      mode: nextIds.length > 1
        ? resizeHandle
          ? "resize-group"
          : "move-group"
        : resizeHandle
          ? "resize-object"
          : "move-object",
      startPoint: point,
      lastPoint: point,
      selectedStart: nextIds.length > 1
        ? selectedItemsForAction.map(cloneObject)
        : cloneObject(selected),
      dragStartBox: selectedBox,
      resizeHandle,
      selectedIds: nextIds,
    };

    if (activeSelectionHasLockedItem(nextIds)) {
      setGuideInfo(buildGuideInfo(selectedBox, canvasSize, "Locked layer • select it from Layers or top bar to unlock"));
      setSuccessMessage("This layer is locked. It can be selected but not moved, resized, or edited.");
      pointerRef.current = {
        active: false,
        mode: "",
        startPoint: null,
        lastPoint: null,
        selectedStart: null,
        dragStartBox: null,
        resizeHandle: null,
      };
      return;
    }

    setGuideInfo(
      buildGuideInfo(
        selectedBox,
        canvasSize,
        resizeHandle
          ? nextIds.length > 1
            ? "Resize selected items • Shift = keep ratio • Alt = center scale"
            : selected.type === "text"
              ? "Drag corner to scale text • Alt = center scale"
              : "Drag corner to resize • Alt = center scale"
          : nextIds.length > 1
            ? "Move selected items"
            : selected.isBaseImage
              ? "Drag image to adjust"
              : "Selected"
      )
    );
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleMoveToolPointerDown(event, point) {
    if (activeSelection?.path?.length && pointInBox(point, activeSelection.box)) {
      pointerRef.current = {
        active: true,
        mode: "move-active-selection",
        startPoint: point,
        lastPoint: point,
        selectedStart: cloneFreeSelection(activeSelection),
        dragStartBox: activeSelection.box,
        resizeHandle: null,
      };

      setSelectionActionBox(activeSelection.box);
      setGuideInfo(buildGuideInfo(activeSelection.box, canvasSize, "Move selection outline"));
      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }

    const selected = getObjectAtPoint(point, objects);

    if (!selected) {
      setGuideInfo(buildGuideInfo({ x: point.x, y: point.y, w: 1, h: 1 }, canvasSize, "Move Tool: click a layer or selection"));
      return;
    }

    const currentlySelectedIds = selectedObjectIds.length
      ? selectedObjectIds
      : selectedObjectId
        ? [selectedObjectId]
        : [];

    const nextIds = currentlySelectedIds.includes(selected.id)
      ? currentlySelectedIds
      : [selected.id];

    setSelectedObjectId(selected.id);
    setSelectedObjectIds(nextIds);

    const selectedItemsForAction = objects.filter((item) => nextIds.includes(item.id));
    const selectedBox = nextIds.length > 1
      ? getGroupBox(selectedItemsForAction)
      : getObjectBox(selected);

    if (activeSelectionHasLockedItem(nextIds)) {
      setGuideInfo(buildGuideInfo(selectedBox, canvasSize, "Locked layer selected"));
      setSuccessMessage("This layer is locked. Unlock it before moving.");
      return;
    }

    if (event.altKey) {
      if (activeSelectionHasBackground(nextIds)) {
        setErrorMessage("The Artboard Background layer cannot be copied by Alt + drag.");
        return;
      }

      const duplicatedItems = duplicateObjectsForDrag(selectedItemsForAction);

      if (!duplicatedItems.length) return;

      const duplicatedIds = duplicatedItems.map((item) => item.id);
      const duplicatedBox = duplicatedItems.length > 1
        ? getGroupBox(duplicatedItems)
        : getObjectBox(duplicatedItems[0]);

      pushHistory();
      setObjects((current) => [...current, ...duplicatedItems]);
      setSelectedObjectId(duplicatedIds[duplicatedIds.length - 1]);
      setSelectedObjectIds(duplicatedIds);

      pointerRef.current = {
        active: true,
        mode: duplicatedItems.length > 1 ? "move-group" : "move-object",
        startPoint: point,
        lastPoint: point,
        selectedStart: duplicatedItems.length > 1
          ? duplicatedItems.map(cloneObject)
          : cloneObject(duplicatedItems[0]),
        dragStartBox: duplicatedBox,
        resizeHandle: null,
        selectedIds: duplicatedIds,
      };

      setGuideInfo(buildGuideInfo(duplicatedBox, canvasSize, event.shiftKey ? "Copied • Shift keeps movement straight" : "Copied • Drag to place"));
      event.currentTarget.setPointerCapture?.(event.pointerId);
      clearOutput();
      return;
    }

    pushHistory();

    pointerRef.current = {
      active: true,
      mode: nextIds.length > 1 ? "move-group" : "move-object",
      startPoint: point,
      lastPoint: point,
      selectedStart: nextIds.length > 1
        ? selectedItemsForAction.map(cloneObject)
        : cloneObject(selected),
      dragStartBox: selectedBox,
      resizeHandle: null,
      selectedIds: nextIds,
    };

    setGuideInfo(buildGuideInfo(selectedBox, canvasSize, nextIds.length > 1 ? "Move selected layers" : "Move layer"));
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleFreeSelectPointerDown(event, point) {
    commitBaseImageToCanvasIfNeeded({ withHistory: true });
    setSelectedObjectId(null);
    setSelectedObjectIds([]);
    setLockedObjectIds([]);
    setActiveSelection(null);
    setPatchTargetSelection(null);
    setCloneSourceSelection(null);

    const startSelection = {
      id: createId(),
      type: "free-selection",
      path: [point],
      box: { x: point.x, y: point.y, w: 1, h: 1 },
    };

    setFreeSelectionDraft(startSelection);

    pointerRef.current = {
      active: true,
      mode: "free-select",
      startPoint: point,
      lastPoint: point,
      selectedStart: startSelection,
      dragStartBox: startSelection.box,
      resizeHandle: null,
    };

    setGuideInfo(buildGuideInfo(startSelection.box, canvasSize, "Draw selection"));
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleRectSelectPointerDown(event, point) {
    commitBaseImageToCanvasIfNeeded({ withHistory: false });
    setSelectedObjectId(null);
    setSelectedObjectIds([]);
    setLockedObjectIds([]);
    setActiveSelection(null);
    setFreeSelectionDraft(null);
    setSelectionRect({ x: point.x, y: point.y, w: 0, h: 0 });
    setPatchTargetBox(null);
    setPatchTargetSelection(null);
    setPatchSourcePreviewBox(null);
    setCloneTargetPreviewBox(null);

    pointerRef.current = {
      active: true,
      mode: "rect-area-select",
      startPoint: point,
      lastPoint: point,
      selectedStart: null,
      dragStartBox: null,
      resizeHandle: null,
      selectionShape: activeTool,
    };

    setGuideInfo(buildGuideInfo({ x: point.x, y: point.y, w: 1, h: 1 }, canvasSize, activeTool === "ellipseSelect" ? "Circle Select" : activeTool === "squareSelect" ? "Square Select" : "Rectangular Select"));
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointSelectPointerDown(event, point) {
    commitBaseImageToCanvasIfNeeded({ withHistory: false });
    setSelectedObjectId(null);
    setSelectedObjectIds([]);

    const currentPath = freeSelectionDraft?.type === "point-selection"
      ? freeSelectionDraft.path
      : [];

    if (event.detail >= 2 && currentPath.length >= 2) {
      const finalPath = [...currentPath, point];
      const finalSelection = normalizeFreeSelection({
        id: createId(),
        type: "point-selection",
        path: finalPath,
        box: getPathBox(finalPath),
      });

      setActiveSelection(finalSelection);
      setSelectionActionBox(finalSelection.box);
      setFreeSelectionDraft(null);
      setPointSelectionReady(false);
      setActiveTool("select");
      setToolPopupOpen(false);
      setGuideInfo(buildGuideInfo(finalSelection.box, canvasSize, "Polygonal Lasso selection ready"));
      setSuccessMessage("Selection ready. Use the Copy button or press Ctrl + C, then Ctrl + V to paste.");
      return;
    }

    const nextPath = [...currentPath, point];
    const nextSelection = {
      id: freeSelectionDraft?.id || createId(),
      type: "point-selection",
      path: nextPath,
      box: getPathBox(nextPath),
    };

    setFreeSelectionDraft(nextSelection);
    setPointSelectionReady(nextPath.length >= 3);
    setGuideInfo(buildGuideInfo(nextSelection.box, canvasSize, nextPath.length >= 3 ? "Double-click to finish" : "Add polygon points"));
    setSuccessMessage(nextPath.length >= 3 ? "Double-click the last point to finish selection." : "Click around the area to create keypoints.");
  }

  function finishPointSelection() {
    if (!freeSelectionDraft?.path?.length || freeSelectionDraft.path.length < 3) {
      setErrorMessage("Add at least 3 keypoints first.");
      return;
    }

    const finalSelection = normalizeFreeSelection(freeSelectionDraft);
    setActiveSelection(finalSelection);
    setSelectionActionBox(finalSelection.box);
    setFreeSelectionDraft(null);
    setPointSelectionReady(false);
    setActiveTool("select");
    setToolPopupOpen(false);
    setGuideInfo(buildGuideInfo(finalSelection.box, canvasSize, "Polygonal Lasso selection ready"));
    setSuccessMessage("Selection ready. Use the Copy button or press Ctrl + C, then Ctrl + V to paste.");
  }

  function handleTextPointerDown(point) {
    commitBaseImageToCanvasIfNeeded({ withHistory: true });
    pushHistory();

    const textObject = createTextObject(point);

    setObjects((current) => [...current.filter((item) => !item.isBaseImage), textObject]);
    setSelectedObjectId(textObject.id);
    setSelectedObjectIds([textObject.id]);
    setActiveTool("select");
    setActivePanel("text");
    setToolPopupOpen(true);
    setTextFocusRequest((current) => current + 1);
    setGuideInfo(buildGuideInfo(getObjectBox(textObject), canvasSize, "Text added • Double-click text anytime to edit"));
    clearOutput();
  }

  function handleShapePointerDown(event, point) {
    if (event.detail >= 2) {
      openExactShapeSizeModal(point);
      return;
    }

    commitBaseImageToCanvasIfNeeded({ withHistory: true });

    setDraftObject(createDraftObject(activeTool, point));

    pointerRef.current = {
      active: true,
      mode: "draw-object",
      startPoint: point,
      lastPoint: point,
      selectedStart: null,
      dragStartBox: null,
      resizeHandle: null,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePatchPointerDown(event, point) {
    commitBaseImageToCanvasIfNeeded({ withHistory: true });

    if ((isSettingPatchTarget || !patchTargetBox) && activeSelection?.path?.length) {
      setPatchTargetBox(activeSelection.box);
      setPatchTargetSelection(activeSelection);
      setPatchSourcePreviewBox(null);
      setIsSettingPatchTarget(false);
      setGuideInfo(buildGuideInfo(activeSelection.box, canvasSize, "Problem area selected"));
      setSuccessMessage("Problem area selected. Drag this outline over a good texture area to repair it.");
      return;
    }

    if (isSettingPatchTarget || !patchTargetBox) {
      setPatchTargetBox(null);
      setPatchTargetSelection(null);
      setPatchSourcePreviewBox(null);
      setGuideInfo(null);

      const startSelection = {
        id: createId(),
        type: "patch-problem-selection",
        path: [point],
        box: { x: point.x, y: point.y, w: 1, h: 1 },
      };

      setFreeSelectionDraft(startSelection);

      pointerRef.current = {
        active: true,
        mode: "patch-draw-target",
        startPoint: point,
        lastPoint: point,
        selectedStart: startSelection,
        dragStartBox: startSelection.box,
        resizeHandle: null,
      };

      setGuideInfo(buildGuideInfo(startSelection.box, canvasSize, "Draw around problem area"));
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
        "Drag to a good texture area"
      )
    );

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleClonePointerDown(event, point) {
    commitBaseImageToCanvasIfNeeded({ withHistory: true });

    if ((isSettingCloneSource || !cloneSourceBox) && activeSelection?.path?.length) {
      setCloneSourceBox(activeSelection.box);
      setCloneSourceSelection(activeSelection);
      setCloneTargetPreviewBox(null);
      setIsSettingCloneSource(false);
      setShowCloneSourceGuide(true);
      setGuideInfo(buildGuideInfo(activeSelection.box, canvasSize, "Free clone source"));
      setSuccessMessage("Free selection saved as clone source. Click or drag where you want to paste it. Press Ctrl/Cmd + D to hide the selection when done.");
      return;
    }

    if (isSettingCloneSource || !cloneSourceBox) {
      setCloneSourceBox(null);
      setCloneSourceSelection(null);
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
      resizeHandle: null,
    };

    applyBrush(point, point);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!hasImage || showOriginal) return;

    const point = getCanvasPoint(event);

    if (point && colorPickerTarget && !pointerRef.current.active) {
      const now = performance.now();

      if (now - colorPreviewThrottleRef.current > 80) {
        colorPreviewThrottleRef.current = now;

        const nextColor = sampleVisibleColor(point);
        if (nextColor !== pickedColor) {
          setPickedColor(nextColor);
        }
      }
    }

    if (point && ["draw", "blur", "restore", "eraser"].includes(activeTool)) {
      setBrushPreviewPoint(point);
    }

    if (!pointerRef.current.active) return;

    if (pointerRef.current.mode === "pan-artboard") {
      event.preventDefault();

      const startPoint = pointerRef.current.startPoint;
      const startPan = pointerRef.current.selectedStart || { x: 0, y: 0 };

      setArtboardPan({
        x: startPan.x + event.clientX - startPoint.x,
        y: startPan.y + event.clientY - startPoint.y,
      });
      return;
    }

    if (!point) return;

    event.preventDefault();

    if (pointerRef.current.mode === "marquee-select") {
      const startPoint = pointerRef.current.startPoint;
      const nextBox = normalizeBox({
        x: startPoint.x,
        y: startPoint.y,
        w: point.x - startPoint.x,
        h: point.y - startPoint.y,
      });

      setSelectionRect(nextBox);
      updateLiveGuideInfo(buildGuideInfo(nextBox, canvasSize, "Selecting items"));
      pointerRef.current.lastPoint = point;
      return;
    }

    if (pointerRef.current.mode === "rect-area-select") {
      const startPoint = pointerRef.current.startPoint;
      const selectionShape = pointerRef.current.selectionShape || activeTool;
      let rawW = point.x - startPoint.x;
      let rawH = point.y - startPoint.y;

      if (selectionShape === "squareSelect" || (selectionShape === "ellipseSelect" && event.shiftKey)) {
        const size = Math.max(Math.abs(rawW), Math.abs(rawH));
        rawW = Math.sign(rawW || 1) * size;
        rawH = Math.sign(rawH || 1) * size;
      }

      const nextBox = normalizeBox({
        x: startPoint.x,
        y: startPoint.y,
        w: rawW,
        h: rawH,
      });

      setSelectionRect(clampBoxToCanvas(nextBox, workingCanvasRef.current));
      updateLiveGuideInfo(buildGuideInfo(nextBox, canvasSize, selectionShape === "ellipseSelect" ? "Circle selection" : selectionShape === "squareSelect" ? "Square selection" : "Rectangular selection"));
      pointerRef.current.lastPoint = point;
      return;
    }

    if (pointerRef.current.mode === "free-select" && freeSelectionDraft) {
      const lastPoint = pointerRef.current.lastPoint || point;

      if (spacePressedRef.current) {
        const dx = point.x - lastPoint.x;
        const dy = point.y - lastPoint.y;
        const movedSelection = moveFreeSelection(freeSelectionDraft, dx, dy);
        setFreeSelectionDraft(movedSelection);
        updateLiveGuideInfo(buildGuideInfo(movedSelection.box, canvasSize, "Moving selection"));
        pointerRef.current.lastPoint = point;
        return;
      }

      if (distanceBetweenPoints(lastPoint, point) >= 2) {
        const nextSelection = addPointToFreeSelection(freeSelectionDraft, point);
        setFreeSelectionDraft(nextSelection);
        updateLiveGuideInfo(buildGuideInfo(nextSelection.box, canvasSize, "Free Select"));
        pointerRef.current.lastPoint = point;
      }

      return;
    }

    if (pointerRef.current.mode === "move-active-selection") {
      const startPoint = pointerRef.current.startPoint;
      const startSelection = pointerRef.current.selectedStart;

      if (!startPoint || !startSelection) return;

      const rawDx = point.x - startPoint.x;
      const rawDy = point.y - startPoint.y;
      const { dx, dy } = event.shiftKey ? lockDragAxis(rawDx, rawDy) : { dx: rawDx, dy: rawDy };
      const movedSelection = moveFreeSelection(startSelection, dx, dy);

      setActiveSelection(movedSelection);
      setSelectionActionBox(movedSelection.box);
      updateLiveGuideInfo(buildGuideInfo(movedSelection.box, canvasSize, "Moving selection"));
      return;
    }

    if (pointerRef.current.mode === "patch-draw-target" && freeSelectionDraft) {
      const lastPoint = pointerRef.current.lastPoint || point;

      if (distanceBetweenPoints(lastPoint, point) >= 2) {
        const nextSelection = addPointToFreeSelection(freeSelectionDraft, point);
        setFreeSelectionDraft(nextSelection);
        updateLiveGuideInfo(buildGuideInfo(nextSelection.box, canvasSize, "Draw around problem area"));
        pointerRef.current.lastPoint = point;
      }

      return;
    }

    if (pointerRef.current.mode === "resize-group") {
      resizeSelectedGroup(point, { shiftKey: event.shiftKey, altKey: event.altKey });
      return;
    }

    if (pointerRef.current.mode === "move-group") {
      moveSelectedGroup(point, { shiftKey: event.shiftKey });
      return;
    }

    if (pointerRef.current.mode === "resize-object" && selectedObjectId) {
      resizeSelectedObject(point, { shiftKey: event.shiftKey, altKey: event.altKey });
      return;
    }

    if (pointerRef.current.mode === "move-object" && selectedObjectId) {
      moveSelectedObject(point, { shiftKey: event.shiftKey });
      return;
    }

    if (pointerRef.current.mode === "patch-draw-target" && freeSelectionDraft) {
      const finalSelection = normalizeFreeSelection(freeSelectionDraft);

      if (finalSelection.path.length >= 3 && finalSelection.box.w > 8 && finalSelection.box.h > 8) {
        setPatchTargetBox(finalSelection.box);
        setPatchTargetSelection(finalSelection);
        setPatchSourcePreviewBox(null);
        setIsSettingPatchTarget(false);
        setActiveSelection(finalSelection);
        setSelectionActionBox(finalSelection.box);
        updateLiveGuideInfo(buildGuideInfo(finalSelection.box, canvasSize, "Problem area selected"));
        setSuccessMessage("Problem area selected. Drag this outline over a good texture area to repair it.");
      } else {
        setErrorMessage("Patch selection is too small. Draw around the problem area again.");
      }

      setFreeSelectionDraft(null);
      setActiveTool("patch");
    }

    if (pointerRef.current.mode === "draw-object" && draftObject) {
      if (spacePressedRef.current && pointerRef.current.lastPoint) {
        const dx = point.x - pointerRef.current.lastPoint.x;
        const dy = point.y - pointerRef.current.lastPoint.y;
        const movedDraft = translateDraftObject(draftObject, dx, dy);
        setDraftObject(movedDraft);
        updateLiveGuideInfo(buildGuideInfo(getObjectBox(normalizeObject(movedDraft)), canvasSize, "Moving selection"));
        pointerRef.current.startPoint = translatePoint(pointerRef.current.startPoint, dx, dy);
        pointerRef.current.lastPoint = point;
        return;
      }

      const nextDraft = updateDraftObject(draftObject, pointerRef.current.startPoint, point, {
        shiftKey: event.shiftKey,
      });
      setDraftObject(nextDraft);
      const draftBox = getObjectBox(normalizeObject(nextDraft));
      const referenceBoxes = objects.map(getObjectBox).filter(Boolean);
      const snapResult = draftBox ? snapBoxToGuides(draftBox, canvasSize, referenceBoxes) : null;
      updateLiveGuideInfo(buildGuideInfo(draftBox, canvasSize, snapResult?.message || "Drawing", snapResult));
      pointerRef.current.lastPoint = point;
      return;
    }

    if (pointerRef.current.mode === "set-patch-target" && draftObject) {
      if (spacePressedRef.current && pointerRef.current.lastPoint) {
        const dx = point.x - pointerRef.current.lastPoint.x;
        const dy = point.y - pointerRef.current.lastPoint.y;
        const movedDraft = translateDraftObject(draftObject, dx, dy);
        setDraftObject(movedDraft);
        updateLiveGuideInfo(buildGuideInfo(getObjectBox(normalizeObject(movedDraft)), canvasSize, "Moving patch selection"));
        pointerRef.current.startPoint = translatePoint(pointerRef.current.startPoint, dx, dy);
        pointerRef.current.lastPoint = point;
        return;
      }

      const nextDraft = updateDraftObject(draftObject, pointerRef.current.startPoint, point, {
        shiftKey: event.shiftKey,
      });
      setDraftObject(nextDraft);
      updateLiveGuideInfo(buildGuideInfo(getObjectBox(normalizeObject(nextDraft)), canvasSize, "Patch Source"));
      pointerRef.current.lastPoint = point;
      return;
    }

    if (pointerRef.current.mode === "drag-patch-source" && pointerRef.current.dragStartBox) {
      const rawDx = point.x - pointerRef.current.startPoint.x;
      const rawDy = point.y - pointerRef.current.startPoint.y;
      const { dx, dy } = event.shiftKey ? lockDragAxis(rawDx, rawDy) : { dx: rawDx, dy: rawDy };
      const rawBox = translateBox(pointerRef.current.dragStartBox, dx, dy);
      const snapResult = snapBoxToGuides(rawBox, canvasSize);
      const nextBox = clampBoxToCanvas(snapResult.box, workingCanvasRef.current);

      setPatchSourcePreviewBox(nextBox);
      updateLiveGuideInfo(buildGuideInfo(nextBox, canvasSize, snapResult.message || "Patch target"));
      return;
    }

    if (pointerRef.current.mode === "set-clone-source" && draftObject) {
      if (spacePressedRef.current && pointerRef.current.lastPoint) {
        const dx = point.x - pointerRef.current.lastPoint.x;
        const dy = point.y - pointerRef.current.lastPoint.y;
        const movedDraft = translateDraftObject(draftObject, dx, dy);
        setDraftObject(movedDraft);
        updateLiveGuideInfo(buildGuideInfo(getObjectBox(normalizeObject(movedDraft)), canvasSize, "Moving clone selection"));
        pointerRef.current.startPoint = translatePoint(pointerRef.current.startPoint, dx, dy);
        pointerRef.current.lastPoint = point;
        return;
      }

      const nextDraft = updateDraftObject(draftObject, pointerRef.current.startPoint, point, {
        shiftKey: event.shiftKey,
      });
      setDraftObject(nextDraft);
      updateLiveGuideInfo(buildGuideInfo(getObjectBox(normalizeObject(nextDraft)), canvasSize, "Clone Source"));
      pointerRef.current.lastPoint = point;
      return;
    }

    if (pointerRef.current.mode === "drag-clone-target" && pointerRef.current.dragStartBox) {
      const rawDx = point.x - pointerRef.current.startPoint.x;
      const rawDy = point.y - pointerRef.current.startPoint.y;
      const { dx, dy } = event.shiftKey ? lockDragAxis(rawDx, rawDy) : { dx: rawDx, dy: rawDy };
      const rawBox = translateBox(pointerRef.current.dragStartBox, dx, dy);
      const snapResult = snapBoxToGuides(rawBox, canvasSize);
      const nextBox = clampBoxToCanvas(snapResult.box, workingCanvasRef.current);

      setCloneTargetPreviewBox(nextBox);
      updateLiveGuideInfo(buildGuideInfo(nextBox, canvasSize, snapResult.message || "Paste Here"));
      return;
    }

    if (pointerRef.current.mode === "brush") {
      applyBrush(pointerRef.current.lastPoint || point, point);
      pointerRef.current.lastPoint = point;
    }
  }

  function moveSelectedGroup(point, options = {}) {
    const startPoint = pointerRef.current.startPoint;
    const selectedStarts = pointerRef.current.selectedStart;
    const dragStartBox = pointerRef.current.dragStartBox;
    const selectedIds = pointerRef.current.selectedIds || selectedObjectIds;

    if (!startPoint || !Array.isArray(selectedStarts) || !dragStartBox) return;
    if (activeSelectionHasLockedItem(selectedIds)) {
      setErrorMessage("This layer is locked. Unlock it before moving or resizing.");
      return;
    }

    const rawDx = point.x - startPoint.x;
    const rawDy = point.y - startPoint.y;
    const { dx, dy } = options.shiftKey
      ? lockDragAxis(rawDx, rawDy)
      : { dx: rawDx, dy: rawDy };

    const movedGroupBox = translateBox(dragStartBox, dx, dy);
    const referenceBoxes = objects
      .filter((item) => !selectedIds.includes(item.id))
      .map(getObjectBox)
      .filter(Boolean);
    const snapResult = snapBoxToGuides(movedGroupBox, canvasSize, referenceBoxes);
    const snapDx = snapResult.box.x - movedGroupBox.x;
    const snapDy = snapResult.box.y - movedGroupBox.y;

    const movedObjects = selectedStarts.map((item) =>
      moveObject(item, dx + snapDx, dy + snapDy)
    );

    setObjects((current) =>
      current.map((item) => {
        const moved = movedObjects.find((candidate) => candidate.id === item.id);
        return moved || item;
      })
    );

    setGuideInfo(
      buildGuideInfo(
        snapResult.box,
        canvasSize,
        snapResult.message || `Moving ${movedObjects.length} items`,
        snapResult
      )
    );
    clearOutput();
  }

  function resizeSelectedGroup(point, options = {}) {
    const selectedStarts = pointerRef.current.selectedStart;
    const dragStartBox = pointerRef.current.dragStartBox;
    const resizeHandle = pointerRef.current.resizeHandle;
    const selectedIds = pointerRef.current.selectedIds || selectedObjectIds;

    if (!Array.isArray(selectedStarts) || !dragStartBox || !resizeHandle) return;
    if (activeSelectionHasLockedItem(selectedIds)) {
      setErrorMessage("This layer is locked. Unlock it before moving or resizing.");
      return;
    }

    const nextBox = resizeBoxFromHandle(dragStartBox, point, resizeHandle, {
      keepRatio: options.shiftKey,
      fromCenter: options.altKey,
    });

    if (nextBox.w < 12 || nextBox.h < 12) return;

    const referenceBoxes = objects
      .filter((item) => !selectedIds.includes(item.id))
      .map(getObjectBox)
      .filter(Boolean);
    const snapResult = snapBoxToGuides(nextBox, canvasSize, referenceBoxes);
    const resizedObjects = selectedStarts.map((item) =>
      transformObjectInGroup(item, dragStartBox, snapResult.box)
    );

    setObjects((current) =>
      current.map((item) => {
        const resized = resizedObjects.find((candidate) => candidate.id === item.id);
        return resized || item;
      })
    );

    setGuideInfo(
      buildGuideInfo(
        snapResult.box,
        canvasSize,
        snapResult.message || `Resizing ${resizedObjects.length} items`,
        snapResult
      )
    );
    clearOutput();
  }

  function moveSelectedObject(point, options = {}) {
    const startPoint = pointerRef.current.startPoint;
    const selectedStart = pointerRef.current.selectedStart;
    const activeId = pointerRef.current.selectedIds?.[0] || selectedObjectId;

    if (!startPoint || !selectedStart || !activeId) return;

    if (isObjectLocked(activeId)) {
      setErrorMessage("This layer is locked. Unlock it before moving.");
      return;
    }

    const rawDx = point.x - startPoint.x;
    const rawDy = point.y - startPoint.y;
    const { dx, dy } = options.shiftKey
      ? lockDragAxis(rawDx, rawDy)
      : { dx: rawDx, dy: rawDy };

    const moved = moveObject(selectedStart, dx, dy);
    const movedBox = getObjectBox(moved);
    const referenceBoxes = objects
      .filter((item) => item.id !== activeId)
      .map(getObjectBox)
      .filter(Boolean);

    const snapResult = snapBoxToGuides(movedBox, canvasSize, referenceBoxes);

    const snapDx = snapResult.box.x - movedBox.x;
    const snapDy = snapResult.box.y - movedBox.y;

    const finalMoved = moveObject(selectedStart, dx + snapDx, dy + snapDy);
    const finalBox = getObjectBox(finalMoved);

    setObjects((current) =>
      current.map((item) => (item.id === activeId ? finalMoved : item))
    );

    setGuideInfo(
      buildGuideInfo(finalBox, canvasSize, snapResult.message || "Moving", snapResult)
    );
    clearOutput();
  }

  function resizeSelectedObject(point, options = {}) {
    const selectedStart = pointerRef.current.selectedStart;
    const dragStartBox = pointerRef.current.dragStartBox;
    const resizeHandle = pointerRef.current.resizeHandle;
    const activeId = pointerRef.current.selectedIds?.[0] || selectedObjectId;

    if (!selectedStart || !dragStartBox || !resizeHandle || !activeId) return;

    if (isObjectLocked(activeId)) {
      setErrorMessage("This layer is locked. Unlock it before resizing.");
      return;
    }

    const nextBox = resizeBoxFromHandle(dragStartBox, point, resizeHandle, {
      keepRatio: options.shiftKey,
      fromCenter: options.altKey,
    });

    if (nextBox.w < 12 || nextBox.h < 12) return;

    const referenceBoxes = objects
      .filter((item) => item.id !== activeId)
      .map(getObjectBox)
      .filter(Boolean);
    const snapResult = snapBoxToGuides(nextBox, canvasSize, referenceBoxes);
    const resizedObject = resizeObjectToBox(selectedStart, snapResult.box);
    const finalBox = getObjectBox(resizedObject);

    setObjects((current) =>
      current.map((item) => (item.id === activeId ? resizedObject : item))
    );

    if (resizedObject.type === "text") {
      setTextBoxWidth(Math.round(resizedObject.w));
      setTextBoxHeight(Math.round(resizedObject.h));
      setFontSize(Math.round(resizedObject.fontSize));
    }

    setGuideInfo(
      buildGuideInfo(
        finalBox,
        canvasSize,
        snapResult.message || (resizedObject.type === "text" ? "Text scaled" : "Resizing"),
        snapResult
      )
    );
    clearOutput();
  }

  function moveSelectedObjectByKeyboard(dx, dy, { withHistory = true } = {}) {
    const activeIds = selectedObjectIds.length
      ? selectedObjectIds
      : selectedObjectId
        ? [selectedObjectId]
        : [];

    if (!activeIds.length) return;

    const selectedItems = objects.filter((item) => activeIds.includes(item.id));
    if (!selectedItems.length) return;

    if (activeSelectionHasLockedItem(activeIds)) {
      setErrorMessage("This layer is locked. Unlock it before moving.");
      return;
    }

    if (withHistory) {
      pushHistory();
    }

    if (selectedItems.length > 1) {
      const groupBox = getGroupBox(selectedItems);
      const movedGroupBox = translateBox(groupBox, dx, dy);
      const referenceBoxes = objects
        .filter((item) => !activeIds.includes(item.id))
        .map(getObjectBox)
        .filter(Boolean);
      const snapResult = snapBoxToGuides(movedGroupBox, canvasSize, referenceBoxes);
      const snapDx = snapResult.box.x - movedGroupBox.x;
      const snapDy = snapResult.box.y - movedGroupBox.y;
      const movedObjects = selectedItems.map((item) => moveObject(item, dx + snapDx, dy + snapDy));

      setObjects((current) =>
        current.map((item) => {
          const moved = movedObjects.find((candidate) => candidate.id === item.id);
          return moved || item;
        })
      );

      setGuideInfo(
        buildGuideInfo(snapResult.box, canvasSize, snapResult.message || "Keyboard move", snapResult)
      );
      clearOutput();
      return;
    }

    const selected = selectedItems[0];
    const moved = moveObject(selected, dx, dy);
    const movedBox = getObjectBox(moved);
    const referenceBoxes = objects
      .filter((item) => item.id !== selected.id)
      .map(getObjectBox)
      .filter(Boolean);
    const snapResult = snapBoxToGuides(movedBox, canvasSize, referenceBoxes);
    const snapDx = snapResult.box.x - movedBox.x;
    const snapDy = snapResult.box.y - movedBox.y;
    const finalMoved = moveObject(selected, dx + snapDx, dy + snapDy);
    const finalBox = getObjectBox(finalMoved);

    setObjects((current) =>
      current.map((item) => (item.id === selected.id ? finalMoved : item))
    );

    setGuideInfo(
      buildGuideInfo(finalBox, canvasSize, snapResult.message || "Keyboard move", snapResult)
    );
    clearOutput();
  }

  async function cropSelectionToLayer(cropBox) {
    try {
      const sourceCanvas = renderFinalCanvas({ includeObjects: true });
      const croppedImage = createSelectionImageFromBox(sourceCanvas, cropBox);

      editorClipboardRef.current = {
        type: "image",
        src: croppedImage.src,
        width: croppedImage.width,
        height: croppedImage.height,
        name: "cropped-selection",
      };

      await addImageLayerFromSource({
        src: croppedImage.src,
        name: "cropped-selection",
        x: cropBox.x,
        y: cropBox.y,
        w: cropBox.w,
        h: cropBox.h,
        message: "Cropped area copied and pasted as a new layer.",
      });
    } catch {
      setErrorMessage("Could not crop this area. Please try again.");
    }
  }

  function handlePointerUp(event) {
    if (!pointerRef.current.active) return;

    event.preventDefault();

    if (pointerRef.current.mode === "marquee-select") {
      const finalBox = selectionRect ? normalizeBox(selectionRect) : null;
      const previousIds = Array.isArray(pointerRef.current.selectedStart)
        ? pointerRef.current.selectedStart
        : [];

      if (finalBox && finalBox.w > 6 && finalBox.h > 6) {
        const selectedIds = objects
          .filter((item) => item.type !== "background" && boxesIntersect(finalBox, getObjectBox(item)))
          .map((item) => item.id);

        const nextIds = event.shiftKey
          ? Array.from(new Set([...previousIds, ...selectedIds]))
          : selectedIds;

        setSelectedObjectIds(nextIds);
        setSelectedObjectId(nextIds[nextIds.length - 1] || null);

        const selectedItems = objects.filter((item) => nextIds.includes(item.id));
        const groupBox = getGroupBox(selectedItems);

        setActiveTool("select");
        setActivePanel(nextIds.length > 1 ? "select" : selectedItems[0]?.type === "text" ? "text" : selectedItems[0]?.type === "image" ? "image" : selectedItems[0] ? "shape" : "");
        setToolPopupOpen(Boolean(nextIds.length));
        setGuideInfo(
          groupBox
            ? buildGuideInfo(groupBox, canvasSize, `${nextIds.length} item${nextIds.length === 1 ? "" : "s"} selected`)
            : null
        );
      } else if (!event.shiftKey) {
        setSelectedObjectIds([]);
        setSelectedObjectId(null);
        setGuideInfo(null);
      }

      setSelectionRect(null);
    }

    if (pointerRef.current.mode === "rect-area-select") {
      const finalBox = selectionRect ? clampBoxToCanvas(normalizeBox(selectionRect), workingCanvasRef.current) : null;

      if (finalBox && finalBox.w > 10 && finalBox.h > 10) {
        const selectionShape = pointerRef.current.selectionShape || activeTool;
        const path = createSelectionPathFromBox(finalBox, selectionShape);
        const finalSelection = {
          id: createId(),
          type: selectionShape === "ellipseSelect" ? "ellipse-selection" : selectionShape === "squareSelect" ? "square-selection" : "rect-selection",
          path,
          box: finalBox,
        };

        setActiveSelection(finalSelection);
        setSelectionActionBox(finalBox);
        setToolPopupOpen(false);
        setGuideInfo(buildGuideInfo(finalBox, canvasSize, "Rectangle selection ready"));
        setSuccessMessage("Selection ready. Use the Copy button or press Ctrl + C, then Ctrl + V to paste.");
      } else {
        setErrorMessage("Selection is too small. Drag a bigger area.");
      }

      setSelectionRect(null);
      setActiveTool("select");
    }

    if (pointerRef.current.mode === "free-select" && freeSelectionDraft) {
      const finalSelection = normalizeFreeSelection(freeSelectionDraft);

      if (finalSelection.path.length >= 3 && finalSelection.box.w > 8 && finalSelection.box.h > 8) {
        setActiveSelection(finalSelection);
        setSelectionActionBox(finalSelection.box);
        setToolPopupOpen(false);
        setGuideInfo(buildGuideInfo(finalSelection.box, canvasSize, "Free selection ready"));
        setSuccessMessage("Selection ready. Use the Copy button or press Ctrl + C, then Ctrl + V to paste.");
      } else {
        setErrorMessage("Selection is too small. Draw a bigger area.");
      }

      setFreeSelectionDraft(null);
      setActiveTool("select");
    }

    if (pointerRef.current.mode === "draw-object" && draftObject) {
      const finalObject = normalizeObject(draftObject);

      if (isValidObject(finalObject)) {
        pushHistory();
        setObjects((current) => [...current.filter((item) => !item.isBaseImage), finalObject]);
        setSelectedObjectId(finalObject.id);
        setSelectedObjectIds([finalObject.id]);
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
        setPatchTargetSelection(null);
        setPatchSourcePreviewBox(null);
        setIsSettingPatchTarget(false);
        setGuideInfo(buildGuideInfo(targetBox, canvasSize, "Patch source selected"));
        setSuccessMessage(
          "Patch source selected. Drag this selected area over the place you want to cover."
        );
      } else {
        setErrorMessage("Patch source is too small. Drag a bigger area.");
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
        targetSelection: patchTargetSelection,
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
        "Patch applied and blended. Select another clean source area to patch again."
      );
    }

    if (pointerRef.current.mode === "set-clone-source" && draftObject) {
      const sourceBox = clampBoxToCanvas(
        normalizeBox(draftObject),
        workingCanvasRef.current
      );

      if (sourceBox.w > 10 && sourceBox.h > 10) {
        setCloneSourceBox(sourceBox);
        setCloneSourceSelection(null);
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
        sourceSelection: cloneSourceSelection,
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
      resizeHandle: null,
    };

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    window.setTimeout(renderVisibleCanvas, 0);
  }

  function createTextObject(point) {
    const width = clampNumber(textBoxWidth, 80, canvasSize.width * 2);
    const height = clampNumber(textBoxHeight, 36, canvasSize.height * 2);

    return {
      id: createId(),
      type: "text",
      x: point.x - width / 2,
      y: point.y - height / 2,
      w: width,
      h: height,
      text: textValue.trim() || "Text",
      color: textColor,
      background: textBackground,
      backgroundGradient: textBackgroundGradient,
      hasBackground: textHasBackground,
      fontFamily: textFontFamily,
      fontSize,
      fontWeight,
      textAlign,
      textCase,
      bold: fontWeight >= 700 || boldText,
      shadow: textShadow,
      rotation: 0,
      opacity: 1,
      keepQuality,
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
        rotation: 0,
        opacity: brushOpacity,
        keepQuality,
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
      fillGradient: shapeFillGradient,
      stroke: shapeStrokeColor,
      strokeWidth: shapeStrokeWidth,
      fillEnabled: shapeFillEnabled,
      strokeEnabled: shapeStrokeEnabled,
      rotation: 0,
      opacity: brushOpacity,
      keepQuality,
    };
  }

  function updateDraftObject(object, startPoint, point, options = {}) {
    if (!object) return null;

    let dx = point.x - startPoint.x;
    let dy = point.y - startPoint.y;

    if (options.shiftKey) {
      if (object.type === "arrow") {
        const locked = lockDragAxis(dx, dy);
        dx = locked.dx;
        dy = locked.dy;
      } else {
        const size = Math.max(Math.abs(dx), Math.abs(dy));
        dx = Math.sign(dx || 1) * size;
        dy = Math.sign(dy || 1) * size;
      }
    }

    if (object.type === "arrow") {
      return {
        ...object,
        x2: startPoint.x + dx,
        y2: startPoint.y + dy,
      };
    }

    return {
      ...object,
      x: startPoint.x,
      y: startPoint.y,
      w: dx,
      h: dy,
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

    if (activeTool === "eraser") {
      applyEraserBrush(workingCanvas, fromPoint, toPoint, {
        size: brushSize,
        opacity: brushOpacity,
      });
    }

    renderVisibleCanvas();
  }

  function applyTextPreset(preset) {
    const nextFontWeight = preset.bold ? 800 : 500;

    setTextColor(preset.color);
    setTextBackground(preset.background);
    setTextBackgroundGradient(null);
    setTextHasBackground(preset.hasBackground);
    setTextFontFamily(preset.fontFamily);
    setFontSize(preset.fontSize);
    setFontWeight(nextFontWeight);
    setBoldText(preset.bold);
    setTextShadow(preset.shadow);

    if (selectedObject?.type === "text") {
      updateSelectedObject({
        color: preset.color,
        background: preset.background,
        backgroundGradient: null,
        hasBackground: preset.hasBackground,
        fontFamily: preset.fontFamily,
        fontSize: preset.fontSize,
        fontWeight: nextFontWeight,
        bold: preset.bold,
        shadow: preset.shadow,
      });
    }
  }

  function updateSelectedItems(updater, message = "Updated") {
    const activeIds = getActiveSelectedIds();

    if (!activeIds.length) return;

    if (activeSelectionHasLockedItem(activeIds)) {
      setErrorMessage("This layer is locked. Unlock it from the top bar or Layers panel before editing.");
      return;
    }

    const updatesById = {};

    setObjects((current) =>
      current.map((item) => {
        if (!activeIds.includes(item.id)) return item;

        const nextUpdates =
          typeof updater === "function" ? updater(item) : updater;

        updatesById[item.id] = {
          ...item,
          ...nextUpdates,
        };

        return updatesById[item.id];
      })
    );

    const nextSelected = selectedObjectId ? updatesById[selectedObjectId] : null;

    if (nextSelected?.type === "text") {
      if (nextSelected.color) setTextColor(nextSelected.color);
      if (nextSelected.fontSize) setFontSize(Math.round(nextSelected.fontSize));
      if (nextSelected.fontWeight) setFontWeight(Number(nextSelected.fontWeight));
    }

    if (nextSelected && SHAPE_TYPES.some((shape) => shape.id === nextSelected.type)) {
      if (nextSelected.fill) setShapeFillColor(nextSelected.fill);
      if (nextSelected.stroke) setShapeStrokeColor(nextSelected.stroke);
      if (nextSelected.strokeWidth) setShapeStrokeWidth(Number(nextSelected.strokeWidth));
    }

    if (nextSelected?.type === "arrow") {
      if (nextSelected.stroke) setShapeStrokeColor(nextSelected.stroke);
      if (nextSelected.strokeWidth) setShapeStrokeWidth(Number(nextSelected.strokeWidth));
    }

    setGuideInfo(
      buildGuideInfo(
        selectedGroupBox,
        canvasSize,
        activeIds.length > 1 ? `${activeIds.length} items ${message.toLowerCase()}` : message
      )
    );
    clearOutput();
  }

  function updateQuickColor(value) {
    const color = normalizeColor(value);

    if (!selectedObjects.length) {
      setTextColor(color);
      setShapeFillColor(color);
      setShapeStrokeColor(color);
      setBrushColor(color);
      return;
    }

    if (selectedObjects.some((item) => item.type === "background")) {
      setCanvasBackgroundColor(color);
    }

    updateSelectedItems((item) => {
      if (item.type === "background") {
        return {
          color,
        };
      }

      if (item.type === "text") return { color };
      if (item.type === "arrow") return { stroke: color };
      if (SHAPE_TYPES.some((shape) => shape.id === item.type)) {
        return { fill: color, fillGradient: null, stroke: item.stroke || color };
      }

      return {};
    }, "Color updated");
  }

  function updateQuickOpacity(percentValue) {
    const nextOpacity = clampNumber(Number(percentValue) / 100, 0, 1);

    if (!selectedObjects.length) {
      setBrushOpacity(nextOpacity);
      return;
    }

    updateSelectedItems({ opacity: nextOpacity }, "Transparency updated");
  }

  function updateQuickFontSize(value) {
    const nextSize = clampNumber(Number(value), 8, 220);

    if (selectedObject?.type !== "text") {
      setFontSize(nextSize);
      return;
    }

    updateSelectedItems({ fontSize: nextSize }, "Text size updated");
  }

  function updateQuickStrokeWidth(value) {
    const nextWidth = clampNumber(Number(value), 1, 80);

    if (!selectedObjects.length) {
      setShapeStrokeWidth(nextWidth);
      return;
    }

    updateSelectedItems((item) =>
      SHAPE_TYPES.some((shape) => shape.id === item.type) || item.type === "arrow"
        ? { strokeWidth: nextWidth }
        : {}
    , "Stroke updated");
  }

  function updateSelectedRotation(value) {
    const activeIds = getActiveSelectedIds();

    if (!activeIds.length) {
      setErrorMessage("Select an item first to rotate it.");
      return;
    }

    if (activeSelectionHasLockedItem(activeIds)) {
      setErrorMessage("This layer is locked. Unlock it before rotating.");
      return;
    }

    const nextRotation = normalizeRotation(value);

    updateSelectedItems({ rotation: nextRotation }, "Rotation updated");
  }

  function rotateSelectedBy(delta) {
    const activeIds = getActiveSelectedIds();

    if (!activeIds.length) {
      setErrorMessage("Select an item first to rotate it.");
      return;
    }

    const baseRotation = Number(selectedObjects[0]?.rotation || 0);

    updateSelectedRotation(baseRotation + delta);
  }

  function duplicateObjectsForDrag(sourceItems) {
    return sourceItems
      .filter((item) => item.type !== "background")
      .map((item) => offsetCopiedObject(cloneObject(item), 0, 0));
  }

  function updateSelectedObjectSize(dimension, value) {
    if (!selectedObjects.length || !selectedGroupBox || !topBarSizeEditable) return;

    const activeIds = selectedObjects.map((item) => item.id);

    if (activeSelectionHasLockedItem(activeIds)) {
      setErrorMessage("This layer is locked. Unlock it before changing size.");
      return;
    }

    const nextPixelValue = sizeInputToPixels(value, exactShapeUnit);

    if (!Number.isFinite(nextPixelValue) || nextPixelValue <= 0) return;

    const nextBox = {
      ...selectedGroupBox,
      [dimension]: clampNumber(nextPixelValue, 1, 20000),
    };

    if (selectedObjects.length > 1) {
      const resizedObjects = selectedObjects.map((item) =>
        transformObjectInGroup(item, selectedGroupBox, nextBox)
      );

      setObjects((current) =>
        current.map((item) => {
          const resized = resizedObjects.find((candidate) => candidate.id === item.id);
          return resized || item;
        })
      );

      setGuideInfo(
        buildGuideInfo(
          nextBox,
          canvasSize,
          `${dimension === "w" ? "Group width" : "Group height"} updated`
        )
      );

      clearOutput();
      return;
    }

    const resizedObject = resizeObjectToBox(selectedObjects[0], nextBox);

    setObjects((current) =>
      current.map((item) => (item.id === selectedObjects[0].id ? resizedObject : item))
    );

    setGuideInfo(
      buildGuideInfo(
        getObjectBox(resizedObject),
        canvasSize,
        `${dimension === "w" ? "Width" : "Height"} updated`
      )
    );

    clearOutput();
  }

  function updateSelectedObject(updates) {
    if (!selectedObjectId) return;

    if (isObjectLocked(selectedObjectId)) {
      setErrorMessage("This layer is locked. Unlock it before editing.");
      return;
    }

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

  function updateSelectedTransform(updates) {
    const activeIds = selectedObjectIds.length
      ? selectedObjectIds
      : selectedObjectId
        ? [selectedObjectId]
        : [];

    const activeObjects = objects.filter((item) => activeIds.includes(item.id));
    const activeBox = activeObjects.length > 1 ? getGroupBox(activeObjects) : selectedObjectBox;

    if (!activeIds.length || !activeBox) return;

    if (activeSelectionHasLockedItem(activeIds)) {
      setErrorMessage("This layer is locked. Unlock it before changing position or size.");
      return;
    }

    const nextBox = {
      x: clampNumber(
        updates.x ?? activeBox.x,
        -canvasSize.width * 2,
        canvasSize.width * 3
      ),
      y: clampNumber(
        updates.y ?? activeBox.y,
        -canvasSize.height * 2,
        canvasSize.height * 3
      ),
      w: clampNumber(
        updates.w ?? activeBox.w,
        1,
        canvasSize.width * 4
      ),
      h: clampNumber(
        updates.h ?? activeBox.h,
        1,
        canvasSize.height * 4
      ),
    };

    const nextObjects = objects.map((item) => {
      if (!activeIds.includes(item.id)) return item;

      return activeObjects.length > 1
        ? transformObjectInGroup(item, activeBox, nextBox)
        : resizeObjectToBox(item, nextBox);
    });

    const nextSelected = nextObjects.find((item) => item.id === selectedObjectId);

    setObjects(nextObjects);
    setGuideInfo(buildGuideInfo(nextBox, canvasSize, activeObjects.length > 1 ? "Group size updated" : "Exact size updated"));

    if (nextSelected?.type === "text") {
      setTextBoxWidth(Math.round(nextSelected.w || nextBox.w));
      setTextBoxHeight(Math.round(nextSelected.h || nextBox.h));
      setFontSize(Math.round(nextSelected.fontSize || fontSize));
    }

    clearOutput();
  }

  function openSelectedStylePanel() {
    if (selectedObjects.length > 1) {
      setActiveTool("select");
      setActivePanel("select");
      setToolPopupOpen(true);
      return;
    }

    if (!selectedObject) return;

    if (selectedObject.type === "image") {
      setActiveTool("select");
      setActivePanel("image");
      setToolPopupOpen(true);
      return;
    }

    if (selectedObject.type === "text") {
      setActiveTool("select");
      setActivePanel("text");
      setToolPopupOpen(true);
      return;
    }

    if (SHAPE_TYPES.map((shape) => shape.id).includes(selectedObject.type)) {
      setActiveTool(selectedObject.type);
      setActivePanel("shape");
      setToolPopupOpen(true);
    }
  }

  function updateTextSetting(key, value) {
    if (key === "text") setTextValue(value);
    if (key === "color") setTextColor(value);
    if (key === "background") setTextBackground(value);
    if (key === "hasBackground") setTextHasBackground(value);
    if (key === "fontFamily") setTextFontFamily(value);
    if (key === "fontSize") setFontSize(value);
    if (key === "fontWeight") {
      setFontWeight(Number(value));
      setBoldText(Number(value) >= 700);
    }
    if (key === "textAlign") setTextAlign(value);
    if (key === "textCase") setTextCase(value);
    if (key === "w") setTextBoxWidth(Number(value));
    if (key === "h") setTextBoxHeight(Number(value));
    if (key === "bold") {
      setBoldText(value);
      setFontWeight(value ? 800 : 500);
    }
    if (key === "shadow") setTextShadow(value);

    if (selectedObject?.type === "text") {
      const updates =
        key === "bold"
          ? { bold: value, fontWeight: value ? 800 : 500 }
          : key === "fontWeight"
            ? { fontWeight: Number(value), bold: Number(value) >= 700 }
            : { [key]: value };

      updateSelectedObject(updates);
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
      SHAPE_TYPES.some((shape) => shape.id === selectedObject.type)
    ) {
      updateSelectedObject({ [key]: value });
    }
  }

  function getActiveSelectedIds() {
    return selectedObjectIds.length
      ? selectedObjectIds
      : selectedObjectId
        ? [selectedObjectId]
        : [];
  }

  function activeSelectionHasBackground(ids = getActiveSelectedIds()) {
    return ids.some((id) => objects.some((item) => item.id === id && item.type === "background"));
  }


  function isObjectLocked(id) {
    return lockedObjectIds.includes(id);
  }

  function activeSelectionHasLockedItem(ids = getActiveSelectedIds()) {
    return ids.some((id) => isObjectLocked(id));
  }

  function toggleLockSelected() {
    const activeIds = getActiveSelectedIds();

    if (!activeIds.length) {
      setErrorMessage("Select a layer or item first to lock or unlock.");
      return;
    }

    const shouldUnlock = activeIds.every((id) => lockedObjectIds.includes(id));

    setLockedObjectIds((current) => {
      const currentSet = new Set(current);

      activeIds.forEach((id) => {
        if (shouldUnlock) currentSet.delete(id);
        else currentSet.add(id);
      });

      return Array.from(currentSet);
    });

    setSuccessMessage(
      shouldUnlock
        ? "Selected layer unlocked. You can edit it again."
        : "Selected layer locked. You can still select it from Layers to unlock."
    );
    setGuideInfo(
      buildGuideInfo(
        selectedGroupBox || selectedObjectBox,
        canvasSize,
        shouldUnlock ? "Unlocked" : "Locked"
      )
    );
  }

  function reorderSelectedObjects(action) {
    const activeIds = getActiveSelectedIds();

    if (!activeIds.length) return;

    if (activeSelectionHasBackground(activeIds)) {
      setErrorMessage("The Artboard Background layer must stay at the bottom. Unlock it only to change color.");
      return;
    }

    if (activeSelectionHasLockedItem(activeIds)) {
      setErrorMessage("This layer is locked. Unlock it before reordering.");
      return;
    }

    pushHistory();

    setObjects((current) => {
      const selectedSet = new Set(activeIds);

      if (action === "front") {
        return [
          ...current.filter((item) => !selectedSet.has(item.id)),
          ...current.filter((item) => selectedSet.has(item.id)),
        ];
      }

      if (action === "back") {
        return [
          ...current.filter((item) => selectedSet.has(item.id)),
          ...current.filter((item) => !selectedSet.has(item.id)),
        ];
      }

      const next = [...current];

      if (action === "up") {
        for (let index = next.length - 2; index >= 0; index -= 1) {
          if (selectedSet.has(next[index].id) && !selectedSet.has(next[index + 1].id)) {
            [next[index], next[index + 1]] = [next[index + 1], next[index]];
          }
        }
      }

      if (action === "down") {
        for (let index = 1; index < next.length; index += 1) {
          if (selectedSet.has(next[index].id) && !selectedSet.has(next[index - 1].id)) {
            [next[index], next[index - 1]] = [next[index - 1], next[index]];
          }
        }
      }

      return next;
    });

    setGuideInfo(
      buildGuideInfo(
        selectedGroupBox,
        canvasSize,
        action === "front"
          ? "Brought to front"
          : action === "back"
            ? "Sent to back"
            : action === "up"
              ? "Brought up"
              : "Sent down"
      )
    );
    clearOutput();
  }


  function alignSelectedObjects(mode) {
    const activeIds = getActiveSelectedIds();
    const selectedItems = objects.filter((item) => activeIds.includes(item.id));

    if (!selectedItems.length) {
      setErrorMessage("Select an item first to use alignment.");
      return;
    }

    if (activeSelectionHasLockedItem(activeIds)) {
      setErrorMessage("This layer is locked. Unlock it before aligning.");
      return;
    }

    const referenceBox = selectedItems.length > 1
      ? getGroupBox(selectedItems)
      : { x: 0, y: 0, w: canvasSize.width, h: canvasSize.height };

    if (!referenceBox) return;

    pushHistory();

    const alignedObjects = selectedItems.map((item) => {
      const box = getObjectBox(item);

      if (!box) return item;

      let dx = 0;
      let dy = 0;

      if (mode === "left") dx = referenceBox.x - box.x;
      if (mode === "center") dx = referenceBox.x + referenceBox.w / 2 - (box.x + box.w / 2);
      if (mode === "right") dx = referenceBox.x + referenceBox.w - (box.x + box.w);
      if (mode === "top") dy = referenceBox.y - box.y;
      if (mode === "middle") dy = referenceBox.y + referenceBox.h / 2 - (box.y + box.h / 2);
      if (mode === "bottom") dy = referenceBox.y + referenceBox.h - (box.y + box.h);

      return moveObject(item, dx, dy);
    });

    setObjects((current) =>
      current.map((item) => {
        const aligned = alignedObjects.find((candidate) => candidate.id === item.id);
        return aligned || item;
      })
    );

    const nextGroupBox = getGroupBox(alignedObjects);
    setGuideInfo(
      buildGuideInfo(
        nextGroupBox || referenceBox,
        canvasSize,
        selectedItems.length > 1 ? `Aligned ${mode}` : `Aligned ${mode} to artboard`
      )
    );
    clearOutput();
  }

  function deleteSelectedObject() {
    const activeIds = selectedObjectIds.length
      ? selectedObjectIds
      : selectedObjectId
        ? [selectedObjectId]
        : [];

    if (!activeIds.length) return;

    if (activeSelectionHasBackground(activeIds)) {
      setErrorMessage("The Artboard Background layer cannot be deleted. Unlock it to change color.");
      return;
    }

    if (activeSelectionHasLockedItem(activeIds)) {
      setErrorMessage("This layer is locked. Unlock it before deleting.");
      return;
    }

    pushHistory();

    setObjects((current) => current.filter((item) => !activeIds.includes(item.id)));
    setLockedObjectIds((current) => current.filter((id) => !activeIds.includes(id)));
    setSelectedObjectId(null);
    setSelectedObjectIds([]);
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

  function applyPrintSizePreset(presetId) {
    setPrintSizePreset(presetId);

    const preset = PRINT_SIZE_PRESETS.find((item) => item.id === presetId);

    if (!preset || !preset.width || !preset.height) return;

    const nextSize = {
      width: preset.width,
      height: preset.height,
    };

    setSelectedSizePreset("custom");
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

    workingCanvasRef.current = resizeCanvas(
      workingCanvasRef.current,
      nextWidth,
      nextHeight,
      keepQuality
    );
    originalCanvasRef.current = resizeCanvas(
      originalCanvasRef.current,
      nextWidth,
      nextHeight,
      keepQuality
    );

    setObjects((current) =>
      current.map((object) =>
        object.type === "background"
          ? {
              ...object,
              x: 0,
              y: 0,
              w: nextWidth,
              h: nextHeight,
            }
          : scaleObject(object, scaleX, scaleY)
      )
    );

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


  async function copyEditorSelection() {
    if (!hasImage) return;

    try {
      if (activeSelection?.path?.length) {
        const selectionCanvas = renderFinalCanvas();
        const selectionImage = await createSelectionImageFromCanvas(selectionCanvas, activeSelection);

        editorClipboardRef.current = {
          type: "image",
          src: selectionImage.src,
          width: selectionImage.width,
          height: selectionImage.height,
          name: "copied-selection",
        };

        setSelectionActionBox(null);
        setToolPopupOpen(false);
        setSuccessMessage("Selected image area copied. Press Ctrl + V to paste it as a new layer.");
        return;
      }

      if (selectedObjects.length > 1) {
        editorClipboardRef.current = {
          type: "objects",
          objects: selectedObjects.map(cloneObject),
        };

        setSuccessMessage(`${selectedObjects.length} items copied. Press Ctrl + V or Ctrl + D to paste them.`);
        return;
      }

      if (selectedObject) {
        editorClipboardRef.current = {
          type: "object",
          object: cloneObject(selectedObject),
        };

        setSuccessMessage(`${selectedObject.type} copied. Press Ctrl + V or Ctrl + D to paste it.`);
        return;
      }

      setErrorMessage("Select an object or draw a Marquee/Lasso area first, then press Ctrl + C.");
    } catch {
      setErrorMessage("Could not copy the selected area. Please try again.");
    }
  }

  async function cutEditorSelection() {
    if (!hasImage) return;

    if (activeSelection?.path?.length) {
      await copyEditorSelection();
      eraseSelectionFromCanvas(activeSelection);
      return;
    }

    const activeIds = getActiveSelectedIds();

    if (activeIds.length) {
      if (activeSelectionHasLockedItem(activeIds)) {
        setErrorMessage("This layer is locked. Unlock it before cutting.");
        return;
      }

      await copyEditorSelection();
      deleteSelectedObject();
      setSuccessMessage("Selection cut. Press Ctrl+V to paste.");
      return;
    }

    setErrorMessage("Select an area or layer first, then press Ctrl+X.");
  }

  function eraseSelectionFromCanvas(selection) {
    if (!selection?.path?.length) return;

    pushHistory();

    const ctx = workingCanvasRef.current.getContext("2d");

    if (!ctx) return;

    ctx.save();
    ctx.beginPath();

    selection.path.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });

    ctx.closePath();
    ctx.clip();
    ctx.clearRect(selection.box.x - 2, selection.box.y - 2, selection.box.w + 4, selection.box.h + 4);
    ctx.restore();

    setActiveSelection(null);
    setFreeSelectionDraft(null);
    setSelectionActionBox(null);
    setGuideInfo(null);
    clearOutput();
    setSuccessMessage("Selected pixels cut from the image. Press Ctrl+V to paste the copied area.");
    window.setTimeout(renderVisibleCanvas, 0);
  }

  async function pasteEditorClipboard() {
    const clipboardItem = editorClipboardRef.current;

    if (!clipboardItem) {
      setErrorMessage("Nothing copied yet. Use Marquee/Lasso or select an object, then press Ctrl + C.");
      return;
    }

    try {
      if (clipboardItem.type === "image") {
        await addImageLayerFromSource({
          src: clipboardItem.src,
          name: clipboardItem.name || "pasted-selection",
          message: "Copied image area pasted as a new layer. Press Ctrl+V again to paste another copy.",
        });
        setSelectionActionBox(null);
        return;
      }

      if (clipboardItem.type === "objects" && clipboardItem.objects?.length) {
        const pastedObjects = [];

        for (const item of clipboardItem.objects) {
          const hydrated = await hydrateCopiedObject(item);
          pastedObjects.push(offsetCopiedObject(hydrated, 28, 28));
        }

        pushHistory();
        setObjects((current) => [...current, ...pastedObjects]);
        setSelectedObjectIds(pastedObjects.map((item) => item.id));
        setSelectedObjectId(pastedObjects[pastedObjects.length - 1]?.id || null);
        setActiveTool("select");
        setActivePanel("select");
        setToolPopupOpen(true);
        setGuideInfo(buildGuideInfo(getGroupBox(pastedObjects), canvasSize, "Pasted group"));
        clearOutput();
        setSuccessMessage(`${pastedObjects.length} copied items pasted. Press Ctrl+V again to paste another copy.`);
        return;
      }

      if (clipboardItem.type === "object" && clipboardItem.object) {
        const pasted = await hydrateCopiedObject(clipboardItem.object);
        const nextObject = offsetCopiedObject(pasted, 28, 28);

        pushHistory();
        setObjects((current) => [...current, nextObject]);
        setSelectedObjectId(nextObject.id);
        setSelectedObjectIds([nextObject.id]);
        setActiveTool("select");
        setActivePanel(nextObject.type === "text" ? "text" : nextObject.type === "image" ? "image" : "shape");
        setToolPopupOpen(true);
        setGuideInfo(buildGuideInfo(getObjectBox(nextObject), canvasSize, "Pasted"));
        clearOutput();
        setSuccessMessage("Copied item pasted. Press Ctrl+V again to paste another copy.");
      }
    } catch {
      setErrorMessage("Could not paste the copied item. Please try again.");
    }
  }
  async function duplicateSelectedObjects() {
    const activeIds = selectedObjectIds.length
      ? selectedObjectIds
      : selectedObjectId
        ? [selectedObjectId]
        : [];
    const selectedItems = objects.filter((item) => activeIds.includes(item.id));

    if (!selectedItems.length) return;

    if (activeSelectionHasBackground(activeIds)) {
      setErrorMessage("The Artboard Background layer cannot be duplicated.");
      return;
    }

    if (activeSelectionHasLockedItem(activeIds)) {
      setErrorMessage("This layer is locked. Unlock it before duplicating.");
      return;
    }

    try {
      const duplicated = [];

      for (const item of selectedItems) {
        const hydrated = await hydrateCopiedObject(item);
        duplicated.push(offsetCopiedObject(hydrated, 28, 28));
      }

      pushHistory();
      setObjects((current) => [...current, ...duplicated]);
      setSelectedObjectIds(duplicated.map((item) => item.id));
      setSelectedObjectId(duplicated[duplicated.length - 1]?.id || null);
      setActiveTool("select");
      setActivePanel(duplicated.length > 1 ? "select" : duplicated[0]?.type === "text" ? "text" : duplicated[0]?.type === "image" ? "image" : "shape");
      setToolPopupOpen(true);
      setGuideInfo(buildGuideInfo(getGroupBox(duplicated), canvasSize, duplicated.length > 1 ? "Duplicated group" : "Duplicated"));
      clearOutput();
      setSuccessMessage(`Duplicated ${duplicated.length} item${duplicated.length === 1 ? "" : "s"}. Press Ctrl/Cmd + D again for another copy.`);
    } catch {
      setErrorMessage("Could not duplicate the selected item. Please try again.");
    }
  }

  async function duplicateLayerById(id) {
    const item = objects.find((layer) => layer.id === id);

    if (!item) return;

    if (item.type === "background") {
      setErrorMessage("The Artboard Background layer cannot be duplicated.");
      return;
    }

    if (isObjectLocked(id)) {
      setErrorMessage("Unlock this layer before duplicating it.");
      return;
    }

    try {
      const hydrated = await hydrateCopiedObject(item);
      const duplicated = offsetCopiedObject(hydrated, 28, 28);

      pushHistory();
      setObjects((current) => [...current, duplicated]);
      setSelectedObjectId(duplicated.id);
      setSelectedObjectIds([duplicated.id]);
      setActiveTool("select");
      setActivePanel("layers");
      setToolPopupOpen(true);
      setGuideInfo(buildGuideInfo(getObjectBox(duplicated), canvasSize, "Layer duplicated"));
      clearOutput();
      setSuccessMessage("Layer duplicated.");
    } catch {
      setErrorMessage("Could not duplicate this layer.");
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
    setSelectedSizePreset("original");
    setCanvasSize({ width: 1200, height: 630 });
    setDraftSize({ width: 1200, height: 630 });
    setCanvasBackgroundColor("#ffffff");
    setTransparentArtboard(false);
    setKeepQuality(true);
    setPickedColor("#9b6ce3");
    setGradientStartColor("#7c3aed");
    setGradientEndColor("#22c55e");
    setGradientAngle(135);
    setTextBackgroundGradient(null);
    setShapeFillGradient(null);
    setSelectionActionBox(null);
    setActiveTool("select");
    setActivePanel("");
    setToolPopupOpen(false);
    setObjects([]);
    setLockedObjectIds([]);
    setDraftObject(null);
    setSelectionRect(null);
    setSelectedObjectId(null);
    setSelectedObjectIds([]);
    setActiveSelection(null);
    setFreeSelectionDraft(null);
    setSelectionRect(null);
    editorClipboardRef.current = null;
    setHistoryPast([]);
    setHistoryFuture([]);
    setPatchTargetBox(null);
    setPatchTargetSelection(null);
    setPatchSourcePreviewBox(null);
    setIsSettingPatchTarget(false);
    setCloneSourceBox(null);
    setCloneSourceSelection(null);
    setCloneTargetPreviewBox(null);
    setIsSettingCloneSource(false);
    setShowCloneSourceGuide(false);
    setShowOriginal(false);
    setPreviewZoom(1);
    setArtboardPan({ x: 0, y: 0 });
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
    setColorPickerTarget(null);
    setPrintSizePreset("none");
    setShapeSizeModal(null);
    setExactShapeSize({ width: 300, height: 180 });
    setExactShapeUnit("px");
    setTopBarDropdown("");
    resetMainFileInput();
    resetAddImageInput();
  }

  function getLeftNavigationSafeEdge(viewportHeight) {
    if (typeof document === "undefined") return 0;

    try {
      const candidates = Array.from(
        document.querySelectorAll("aside, nav, [data-sidebar], .sidebar")
      );

      return candidates.reduce((maxRight, element) => {
        const rect = element.getBoundingClientRect?.();
        const style = window.getComputedStyle?.(element);

        if (!rect || rect.width < 120 || rect.height < viewportHeight * 0.4) {
          return maxRight;
        }

        if (rect.left <= 4 && style?.display !== "none" && style?.visibility !== "hidden") {
          return Math.max(maxRight, rect.right);
        }

        return maxRight;
      }, 0);
    } catch {
      return 0;
    }
  }

  function updatePopupPositionFromEvent(event) {
    const buttonRect = event?.currentTarget?.getBoundingClientRect?.();

    if (!buttonRect || typeof window === "undefined") {
      setPopupTop(96);
      setPopupLeft(96);
      setPopupMaxHeight(520);
      return;
    }

    const viewportWidth = window.innerWidth || 1280;
    const viewportHeight = window.innerHeight || 800;
    const panelWidth = Math.min(440, Math.max(280, viewportWidth - 28));
    const sidebarSafeLeft = getLeftNavigationSafeEdge(viewportHeight) + 12;
    const safeTop = viewportWidth < 768 ? 72 : 96;
    const safeLeft = viewportWidth < 768 ? 12 : Math.max(84, sidebarSafeLeft);
    const desiredHeight = Math.min(560, viewportHeight - safeTop - 20);
    const rawTop = buttonRect.top - 12;
    const nextTop = clampNumber(
      rawTop,
      safeTop,
      Math.max(safeTop, viewportHeight - desiredHeight - 12)
    );
    const rawLeft = viewportWidth < 768
      ? 12
      : Math.max(buttonRect.right + 18, safeLeft);

    const nextLeft = clampNumber(
      rawLeft,
      12,
      Math.max(12, viewportWidth - panelWidth - 12)
    );

    setPopupTop(nextTop);
    setPopupLeft(nextLeft);
    setPopupMaxHeight(Math.max(260, viewportHeight - nextTop - 16));
  }

  function activateTool(toolId, event = null) {
    updatePopupPositionFromEvent(event);

    setColorPickerTarget(null);
    setActiveTool(toolId);
    setActivePanel("");
    setShowOriginal(false);
    setGuideInfo(null);

    if (toolId === "select") {
      setActivePanel("");
      setToolPopupOpen(false);
      setSuccessMessage("Select tool active. Click items to select or drag empty space to select multiple layers.");
      return;
    }

    if (toolId === "hand") {
      setToolPopupOpen(false);
      setSuccessMessage("Hand Tool active. Drag the artboard to pan. You can also hold Space and drag anytime.");
      return;
    }

    if (toolId === "marquee") {
      const isOpen = toolPopupOpen && activePanel === "marqueeModes";
      setActivePanel(isOpen ? "" : "marqueeModes");
      setToolPopupOpen(!isOpen);
      setSuccessMessage(isOpen ? "" : "Choose Rectangular, Circle, Square, Lasso, or Polygonal Lasso.");
      return;
    }

    if (toolId === "hand") {
      setToolPopupOpen(false);
      setSuccessMessage("Hold Space and drag the artboard to pan.");
      return;
    }

    if (["draw", "blur", "restore", "eraser", "patch", "clone", "text", ...SHAPE_TYPES.map((shape) => shape.id)].includes(toolId)) {
      commitBaseImageToCanvasIfNeeded({ withHistory: true });
    }

    const toolsNeedingPopup = ["draw", "blur", "eraser", "patch", "clone", "text", "restore"];
    setToolPopupOpen(toolsNeedingPopup.includes(toolId));

    if (SHAPE_TYPES.map((shape) => shape.id).includes(toolId)) {
      setShapeType(toolId);
    }

    if (toolId === "patch") {
      if (!patchTargetBox) {
        setIsSettingPatchTarget(true);
        setSuccessMessage(activeSelection ? "Selection is ready. Click the artboard to use it as the problem area." : "Draw a freeform selection around the problem area, then drag it to good texture.");
      } else {
        setSuccessMessage("Drag the problem area outline over a good texture area to repair it.");
      }
    }

    if (toolId === "clone") {
      if (!cloneSourceBox) {
        setIsSettingCloneSource(true);
        setShowCloneSourceGuide(true);
        setSuccessMessage(activeSelection ? "Selection is ready. Click the artboard to use it as clone source." : "Select the area you want to clone.");
      } else {
        setShowCloneSourceGuide(false);
        setSuccessMessage("Same clone source is ready. Click or drag anywhere to paste it again.");
      }
    }
  }

  function activateSelectionMode(modeId) {
    setActiveTool(modeId);
    setActivePanel("");
    setToolPopupOpen(false);
    setSelectedObjectId(null);
    setSelectedObjectIds([]);
    setActiveSelection(null);
    setFreeSelectionDraft(null);
    setSelectionRect(null);
    setPointSelectionReady(false);
    setSelectionActionBox(null);

    if (modeId === "rectSelect") {
      setSuccessMessage("Rectangular Marquee active. Drag an area, then press Ctrl+C, Ctrl+V, or Ctrl+X.");
    }

    if (modeId === "ellipseSelect") {
      setSuccessMessage("Circle Marquee active. Drag an area, then press Ctrl+C, Ctrl+V, or Ctrl+X.");
    }

    if (modeId === "squareSelect") {
      setSuccessMessage("Square Marquee active. Drag an area, then press Ctrl+C, Ctrl+V, or Ctrl+X.");
    }

    if (modeId === "freeSelect") {
      setSuccessMessage("Lasso active. Draw around an area, then press Ctrl+C, Ctrl+V, or Ctrl+X.");
    }

    if (modeId === "pointSelect") {
      setSuccessMessage("Polygonal Lasso active. Click around the area, then double-click or use Finish.");
    }

    commitBaseImageToCanvasIfNeeded({ withHistory: false });
  }

  function handleWorkspaceWheel(event) {
    if (!hasImage) return;

    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      setPreviewZoom((current) => clampNumber(current + direction * 0.12, 0.1, 8));
    }
  }

  function openExactShapeSizeModal(point) {
    const selectedShape = SHAPE_TYPES.some((shape) => shape.id === activeTool)
      ? activeTool
      : shapeType;

    setShapeType(selectedShape);
    setShapeSizeModal({ point, shape: selectedShape });
    setToolPopupOpen(false);
    setActivePanel("");
    setGuideInfo(buildGuideInfo({ x: point.x, y: point.y, w: 1, h: 1 }, canvasSize, "Exact shape size"));
  }

  function insertExactShapeBySize() {
    if (!shapeSizeModal?.point) return;

    const shape = shapeSizeModal.shape || shapeType || "rectangle";
    const width = convertShapeSizeToPixels(exactShapeSize.width, exactShapeUnit);
    const height = convertShapeSizeToPixels(exactShapeSize.height, exactShapeUnit);

    if (width < 1 || height < 1) {
      setErrorMessage("Enter a valid width and height first.");
      return;
    }

    commitBaseImageToCanvasIfNeeded({ withHistory: true });
    pushHistory();

    const point = shapeSizeModal.point;
    const baseObject = shape === "arrow"
      ? {
          id: createId(),
          type: "arrow",
          x1: point.x - width / 2,
          y1: point.y - height / 2,
          x2: point.x + width / 2,
          y2: point.y + height / 2,
          stroke: shapeStrokeColor,
          strokeWidth: shapeStrokeWidth,
          strokeEnabled: true,
          rotation: 0,
          opacity: brushOpacity,
          keepQuality,
        }
      : {
          id: createId(),
          type: shape,
          x: point.x - width / 2,
          y: point.y - height / 2,
          w: width,
          h: height,
          fill: shapeFillColor,
          fillGradient: shapeFillGradient,
          stroke: shapeStrokeColor,
          strokeWidth: shapeStrokeWidth,
          fillEnabled: shapeFillEnabled,
          strokeEnabled: shapeStrokeEnabled,
          rotation: 0,
          opacity: brushOpacity,
          keepQuality,
        };

    const finalObject = normalizeObject(baseObject);

    setObjects((current) => [...current.filter((item) => !item.isBaseImage), finalObject]);
    setSelectedObjectId(finalObject.id);
    setSelectedObjectIds([finalObject.id]);
    setActiveTool("select");
    setActivePanel("shape");
    setToolPopupOpen(true);
    setShapeSizeModal(null);
    setGuideInfo(buildGuideInfo(getObjectBox(finalObject), canvasSize, `Inserted ${Math.round(width)}×${Math.round(height)}px shape`));
    clearOutput();
  }

  function activateShapeTool(nextShape) {
    setShapeType(nextShape);
    setActiveTool(nextShape);
    setActivePanel("shape");
    setToolPopupOpen(true);
    setShowOriginal(false);
    setGuideInfo(null);

    if (hasImage) {
      commitBaseImageToCanvasIfNeeded({ withHistory: true });
    }
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

      <style>{`
        .smart-photo-editor-workspace {
          scrollbar-gutter: stable both-edges;
          scrollbar-width: thin;
          scrollbar-color: #9b6ce3 #e5e7eb;
        }
        .smart-photo-editor-workspace::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        .smart-photo-editor-workspace::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 999px;
        }
        .smart-photo-editor-workspace::-webkit-scrollbar-thumb {
          background: #9b6ce3;
          border: 3px solid #e5e7eb;
          border-radius: 999px;
        }
        .smart-photo-editor-workspace::-webkit-scrollbar-corner {
          background: #e5e7eb;
        }
        .smart-photo-editor-toolbar-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .smart-photo-editor-toolbar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.28);
          border-radius: 999px;
        }
        .smart-photo-editor-options-scroll {
          scrollbar-width: thin;
          scrollbar-color: #9b6ce3 #f1e9ff;
        }
        .smart-photo-editor-options-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .smart-photo-editor-options-scroll::-webkit-scrollbar-track {
          background: #f1e9ff;
          border-radius: 999px;
        }
        .smart-photo-editor-options-scroll::-webkit-scrollbar-thumb {
          background: #9b6ce3;
          border: 2px solid #f1e9ff;
          border-radius: 999px;
        }
        .smart-photo-editor-popover {
          transform-origin: top center;
          animation: smartPhotoPopoverIn 150ms ease-out;
        }
        .smart-photo-editor-transparent-canvas {
          background-color: #ffffff;
          background-image:
            linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
            linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
            linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
          background-size: 24px 24px;
          background-position: 0 0, 0 12px, 12px -12px, -12px 0;
        }
        .smart-photo-editor-drop-overlay {
          animation: smartPhotoDropPulse 900ms ease-in-out infinite alternate;
        }
        @keyframes smartPhotoPopoverIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes smartPhotoDropPulse {
          from { opacity: 0.88; }
          to { opacity: 1; }
        }
      `}</style>

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Sparkles size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Smart Photo Editor</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Choose a canvas size, upload a photo, or start with a colored or transparent artboard,
          then edit with text, image layers, blur, patch, clone, shapes, and export.
        </p>
      </section>

      <section className="card overflow-hidden">
        {!hasImage ? (
          <div className="p-4 sm:p-5">
            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
              <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
                <h2 className="text-xl font-bold mb-2">Choose Artboard Size First</h2>

                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Select the final size before uploading, or start with a solid colored page when you do not have a photo.
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

                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[#fafafa] p-4">
                  <label className="text-sm font-semibold mb-2 block">Print Size</label>
                  <select
                    value={printSizePreset}
                    onChange={(event) => applyPrintSizePreset(event.target.value)}
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  >
                    {PRINT_SIZE_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.width ? `${preset.label} — ${preset.width} × ${preset.height}px` : preset.label}
                      </option>
                    ))}
                  </select>
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
                        setPrintSizePreset("none");
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
                        setPrintSizePreset("none");
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

                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4">
                  <h3 className="font-bold mb-2">Start with a blank artboard</h3>
                  <p className="text-xs text-[var(--text-secondary)] mb-3">
                    Use a solid color or a transparent checkerboard, then add text, shapes, logos, and image layers.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className={`flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-3 text-sm font-semibold transition ${
                      transparentArtboard
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-[var(--border)]"
                    }`}>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-8 w-8 rounded-lg border border-[var(--border)] smart-photo-editor-transparent-canvas" />
                        Transparent
                      </span>
                      <input
                        type="checkbox"
                        checked={transparentArtboard}
                        onChange={(event) => setTransparentArtboard(event.target.checked)}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                    </label>

                    <label className={`flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-3 text-sm font-semibold ${
                      transparentArtboard ? "opacity-55" : "border-[var(--border)]"
                    }`}>
                      <span>Artboard color</span>
                      <input
                        type="color"
                        value={normalizeHexForInput(canvasBackgroundColor)}
                        onChange={(event) => {
                          setCanvasBackgroundColor(event.target.value);
                          setTransparentArtboard(false);
                        }}
                        disabled={transparentArtboard}
                        className="h-9 w-10 rounded-lg border border-[var(--border)] bg-white disabled:cursor-not-allowed"
                      />
                    </label>
                  </div>

                  <label className={`mt-3 flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-3 text-sm font-semibold transition ${
                    keepQuality
                      ? "border-[var(--primary)] text-[var(--primary)]"
                      : "border-[var(--border)]"
                  }`}>
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle size={17} />
                      Keep quality for new layers
                    </span>
                    <input
                      type="checkbox"
                      checked={keepQuality}
                      onChange={(event) => setKeepQuality(event.target.checked)}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={startSolidColorPage}
                    className="btn-primary mt-3 w-full inline-flex items-center justify-center gap-2"
                  >
                    {transparentArtboard ? (
                      <span className="h-5 w-5 rounded border border-white/70 smart-photo-editor-transparent-canvas" />
                    ) : (
                      <Sparkles size={18} />
                    )}
                    {transparentArtboard ? "Start Transparent Artboard" : "Start Colored Artboard"}
                  </button>
                </div>
              </div>

              <div
                onDrop={handleDrop}
                onDragEnter={handleDragEnter}
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
          </div>
        ) : (
          <div className="grid lg:grid-cols-[72px_minmax(0,1fr)] min-h-[760px] bg-[#f3f4f6]">
            <aside className="relative z-40 border-r border-[var(--border)] bg-[#111827] p-2">
              <div ref={toolbarRef} className="sticky top-3 smart-photo-editor-toolbar-scroll flex max-h-[calc(100vh-2rem)] flex-col gap-2 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={openMainFilePicker}
                  title="Upload / Replace"
                  className="w-12 h-12 rounded-xl bg-white/10 text-white hover:bg-white/20 inline-flex items-center justify-center"
                >
                  <Upload size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const isImagePanelOpen = toolPopupOpen && activePanel === "image";
                    setActiveTool("select");
                    setActivePanel(isImagePanelOpen ? "" : "image");
                    setToolPopupOpen(!isImagePanelOpen);
                    if (!isImagePanelOpen) openAddImagePicker();
                  }}
                  title="Add Image"
                  className="w-12 h-12 rounded-xl bg-white/10 text-white hover:bg-white/20 inline-flex items-center justify-center"
                >
                  <Images size={20} />
                </button>

                <div className="h-px bg-white/15 my-1" />

                {TOOLS.map((tool) => {
                  const Icon = tool.icon;

                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={(event) => activateTool(tool.id, event)}
                      title={tool.label}
                      className={`w-12 h-12 rounded-xl inline-flex items-center justify-center transition ${
                        activeTool === tool.id && !activePanel
                          ? "bg-white text-[#111827]"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      <Icon size={20} />
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={(event) => {
                    updatePopupPositionFromEvent(event);
                    const isShapePanelOpen = toolPopupOpen && settingsMode === "shape";
                    setActiveTool(isShapePanelOpen ? "select" : "select");
                    setActivePanel(isShapePanelOpen ? "" : "shape");
                    setToolPopupOpen(!isShapePanelOpen);
                    setShowOriginal(false);
                  }}
                  title="Shape Tool"
                  className={`w-12 h-12 rounded-xl inline-flex items-center justify-center transition ${
                    (settingsMode === "shape" || SHAPE_TYPES.some((shape) => shape.id === activeTool)) && toolPopupOpen
                      ? "bg-white text-[#111827]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <Shapes size={20} />
                </button>

                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => startColorPicker("quick", "active color")}
                    title={`Eyedropper Tool: pick color from image`}
                    className={`relative w-12 h-9 rounded-xl inline-flex items-center justify-center transition ${
                      colorPickerTarget?.target === "quick"
                        ? "bg-white text-[#111827]"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    <Pipette size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={copyPickedColorToUse}
                    title={`Copy and use ${pickedColor}`}
                    className="w-12 h-3.5 rounded-md border border-white/60 shadow"
                    style={{ backgroundColor: pickedColor }}
                    aria-label="Copy eyedropper color"
                  />
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    updatePopupPositionFromEvent(event);
                    const isLayersPanelOpen = toolPopupOpen && activePanel === "layers";
                    setActiveTool("select");
                    setActivePanel(isLayersPanelOpen ? "" : "layers");
                    setToolPopupOpen(!isLayersPanelOpen);
                    setShowOriginal(false);
                  }}
                  title="Layers"
                  className={`w-12 h-12 rounded-xl inline-flex items-center justify-center transition ${
                    activePanel === "layers" && toolPopupOpen
                      ? "bg-white text-[#111827]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <Layers size={20} />
                </button>

                <div className="h-px bg-white/15 my-1" />

                <button
                  type="button"
                  onClick={(event) => {
                    updatePopupPositionFromEvent(event);
                    const isExportPanelOpen = toolPopupOpen && activePanel === "export";
                    setActiveTool("select");
                    setActivePanel(isExportPanelOpen ? "" : "export");
                    setToolPopupOpen(!isExportPanelOpen);
                  }}
                  title="Export Settings"
                  className={`w-12 h-12 rounded-xl inline-flex items-center justify-center ${
                    activePanel === "export"
                      ? "bg-white text-[#111827]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <Settings2 size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowOriginal((current) => !current);
                    setActivePanel("");
                    setToolPopupOpen(false);
                  }}
                  title="Before / Original"
                  className={`w-12 h-12 rounded-xl inline-flex items-center justify-center ${
                    showOriginal
                      ? "bg-white text-[#111827]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <Eye size={20} />
                </button>

                <div className="h-px bg-white/15 my-1" />

                <button
                  type="button"
                  onClick={undo}
                  disabled={!historyPast.length}
                  title="Undo"
                  className={`w-12 h-12 rounded-xl text-white inline-flex items-center justify-center ${
                    !historyPast.length ? "opacity-30 cursor-not-allowed" : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <Undo2 size={20} />
                </button>

                <button
                  type="button"
                  onClick={redo}
                  disabled={!historyFuture.length}
                  title="Redo"
                  className={`w-12 h-12 rounded-xl text-white inline-flex items-center justify-center ${
                    !historyFuture.length ? "opacity-30 cursor-not-allowed" : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <Redo2 size={20} />
                </button>

                <button
                  type="button"
                  onClick={deleteSelectedObject}
                  disabled={!selectedObjectId && !selectedObjectIds.length}
                  title="Delete selected item"
                  className={`w-12 h-12 rounded-xl text-white inline-flex items-center justify-center ${
                    (!selectedObjectId && !selectedObjectIds.length) ? "opacity-30 cursor-not-allowed" : "bg-red-500/80 hover:bg-red-500"
                  }`}
                >
                  <Trash2 size={20} />
                </button>
              </div>

              {shouldShowSettings && (
                <div
                  ref={optionsPanelRef}
                  className="smart-photo-editor-options-scroll smart-photo-editor-popover fixed w-[min(440px,calc(100vw-24px))] overflow-auto rounded-2xl border border-[var(--border)] bg-white shadow-2xl p-4"
                  style={{
                    top: `${popupTop}px`,
                    left: `${popupLeft}px`,
                    maxHeight: `${popupMaxHeight}px`,
                    zIndex: 10000,
                  }}
                >
                  <div className="mb-4 flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <PanelLeft size={18} className="mt-0.5 shrink-0 text-[var(--primary)]" />
                      <div className="min-w-0">
                        <p className="font-bold capitalize">
                          {settingsMode === "shape" ? "Shape" : settingsMode === "freeSelect" ? "Lasso" : settingsMode === "marqueeModes" ? "Marquee" : settingsMode === "color" ? "Eyedropper" : settingsMode} Options
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          Adjust the active tool, then continue editing on the artboard.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setToolPopupOpen(false);
                        setActivePanel("");
                      }}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] transition hover:border-[var(--primary)] hover:bg-[#f8f4ff] hover:text-[var(--primary)]"
                      title="Close options"
                      aria-label="Close options"
                    >
                      <X size={17} />
                    </button>
                  </div>

                  {settingsMode === "marqueeModes" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {SELECTION_MODES.map((mode) => {
                          const ModeIcon = mode.icon;

                          return (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => activateSelectionMode(mode.id)}
                              className="rounded-xl border border-[var(--border)] bg-white px-3 py-4 text-center transition hover:border-[var(--primary)] hover:bg-[#f8f4ff]"
                              title={mode.label}
                            >
                              <ModeIcon size={22} className="mx-auto mb-2 text-[var(--primary)]" />
                              <span className="text-xs font-bold">{mode.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {pointSelectionReady && (
                        <button
                          type="button"
                          onClick={finishPointSelection}
                          className="btn-primary w-full"
                        >
                          Finish Polygonal Lasso
                        </button>
                      )}
                    </div>
                  )}

                  {settingsMode === "select" && (
                    <div className="space-y-4">
                      <InfoCard
                        label="Selected"
                        value={selectedObjects.length > 1 ? `${selectedObjects.length} items${selectedLocked ? " • Locked" : ""}` : selectedObject ? `${selectedObject.type}${selectedLocked ? " • Locked" : ""}` : "None"}
                      />

                      {(selectedObjectId || selectedObjectIds.length > 0) && (
                        <label className={`flex items-center justify-between gap-3 rounded-xl border bg-white p-3 text-sm font-semibold transition ${
                          selectedKeepQuality
                            ? "border-[var(--primary)] text-[var(--primary)]"
                            : "border-[var(--border)]"
                        }`}>
                          <span className="inline-flex items-center gap-2">
                            <CheckCircle size={17} />
                            Keep quality
                          </span>
                          <input
                            type="checkbox"
                            checked={selectedKeepQuality}
                            onChange={toggleSelectedKeepQuality}
                            className="h-4 w-4 accent-[var(--primary)]"
                          />
                        </label>
                      )}

                      {(selectedObject && selectedObjectBox) || (selectedObjects.length > 1 && selectedGroupBox) ? (
                        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div>
                              <p className="font-bold">Exact Position & Size</p>
                              <p className="text-xs text-[var(--text-secondary)]">
                                Fix any selected item accurately anytime.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={openSelectedStylePanel}
                              className="px-3 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold hover:bg-[#f8f4ff]"
                            >
                              Edit Style
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <NumberField
                              label="X"
                              value={Math.round((selectedObjects.length > 1 ? selectedGroupBox : selectedObjectBox).x)}
                              onChange={(value) => updateSelectedTransform({ x: value })}
                            />
                            <NumberField
                              label="Y"
                              value={Math.round((selectedObjects.length > 1 ? selectedGroupBox : selectedObjectBox).y)}
                              onChange={(value) => updateSelectedTransform({ y: value })}
                            />
                            <NumberField
                              label="Width"
                              value={Math.round((selectedObjects.length > 1 ? selectedGroupBox : selectedObjectBox).w)}
                              onChange={(value) => updateSelectedTransform({ w: value })}
                            />
                            <NumberField
                              label="Height"
                              value={Math.round((selectedObjects.length > 1 ? selectedGroupBox : selectedObjectBox).h)}
                              onChange={(value) => updateSelectedTransform({ h: value })}
                            />
                          </div>

                          <RangeInput
                            label={`Opacity: ${Math.round((selectedObject.opacity ?? 1) * 100)}%`}
                            min={0.05}
                            max={1}
                            step={0.01}
                            value={selectedObject.opacity ?? 1}
                            onChange={(value) => updateSelectedObject({ opacity: Number(value) })}
                          />

                          {selectedObject.type === "image" && (
                            <button
                              type="button"
                              onClick={() => openAddImagePicker("replace")}
                              className="btn-secondary w-full inline-flex items-center justify-center gap-2 mt-3"
                            >
                              <Images size={17} />
                              Replace Selected Image
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[#fafafa] p-4 text-sm text-[var(--text-secondary)]">
                          Select any image, text, shape, or arrow to change position, replace image, or fix exact size.
                        </div>
                      )}

                      <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4 text-sm text-[var(--text-secondary)] leading-7">
                        <p className="font-semibold text-[var(--text-primary)] mb-1">Keyboard editing</p>
                        <p>Arrow keys move selected items.</p>
                        <p>Shift + Arrow moves faster.</p>
                        <p>Delete or Backspace removes the selected item.</p>
                        <p>Hold Shift while dragging to keep movement straight.</p>
                        <p>Ctrl/Cmd + C copies selected object or Free Select area.</p>
                        <p>Ctrl/Cmd + V pastes copied item as a new layer.</p>
                        <p>Ctrl/Cmd + D hides Free Select manually.</p>
                        <p>Alt + drag copies the selected item. Alt + Shift keeps the copied item moving straight.</p>
                        <p>Alt + corner drag scales images/text/shapes from center.</p>
                        <p>Use the rotate control in the top bar to rotate any selected item.</p>
                        <p>Ctrl/Cmd + +/- zooms the artboard.</p>
                      </div>
                    </div>
                  )}

                  {settingsMode === "move" && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4 text-sm text-[var(--text-secondary)] leading-7">
                        <p className="font-semibold text-[var(--text-primary)] mb-1">Move Tool</p>
                        <p>Moves selected layers, selection outlines, and guides inside the editor.</p>
                        <p>It does not pan the artboard. Hold Space and drag to pan the artboard.</p>
                        <p>Locked layers can be selected, but cannot be moved until unlocked.</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setArtboardPan({ x: 0, y: 0 })}
                        className="btn-secondary w-full"
                      >
                        Reset Artboard Position
                      </button>
                    </div>
                  )}

                  {settingsMode === "freeSelect" && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 leading-7">
                        <p className="font-bold mb-1">Free Select</p>
                        <p>Draw around any image area to make a custom selection.</p>
                        <p>Hold Space while drawing to move the selection before releasing.</p>
                        <p>The custom selection stays visible until you press Ctrl/Cmd + D or click Deselect Selection below.</p>
                        <p>After selecting, press Ctrl/Cmd + C to copy it, or use Patch/Clone.</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => clearFreeSelectionManually("Free selection deselected.")}
                        disabled={!activeSelection && !freeSelectionDraft}
                        className={`btn-secondary w-full inline-flex items-center justify-center gap-2 ${
                          !activeSelection && !freeSelectionDraft ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        Deselect Selection / Ctrl+D
                      </button>

                      <InfoCard
                        label="Selection"
                        value={
                          activeSelection
                            ? `${Math.round(activeSelection.box.w)}×${Math.round(activeSelection.box.h)}px`
                            : "Not Set"
                        }
                      />
                    </div>
                  )}

                  {settingsMode === "image" && (
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={() => openAddImagePicker("add")}
                        className="btn-primary w-full inline-flex items-center justify-center gap-2"
                      >
                        <Images size={17} />
                        Add Logo / Image
                      </button>

                      {selectedObject?.type === "image" && (
                        <button
                          type="button"
                          onClick={() => openAddImagePicker("replace")}
                          className="btn-secondary w-full inline-flex items-center justify-center gap-2"
                        >
                          <Images size={17} />
                          Replace Selected Image
                        </button>
                      )}

                      <p className="text-xs text-[var(--text-secondary)]">
                        Add logos, product images, stickers, or overlays. Select an image layer to resize and adjust opacity.
                      </p>

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
                        <label className={`flex items-center justify-between gap-3 rounded-xl border bg-white p-3 text-sm font-semibold transition ${
                          selectedObject.keepQuality !== false
                            ? "border-[var(--primary)] text-[var(--primary)]"
                            : "border-[var(--border)]"
                        }`}>
                          <span className="inline-flex items-center gap-2">
                            <CheckCircle size={17} />
                            Keep quality while resizing
                          </span>
                          <input
                            type="checkbox"
                            checked={selectedObject.keepQuality !== false}
                            onChange={(event) => toggleLayerKeepQuality(selectedObject.id, event.target.checked)}
                            className="h-4 w-4 accent-[var(--primary)]"
                          />
                        </label>
                      )}

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
                  )}

                  {settingsMode === "text" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold mb-2 block">Text</label>
                        <textarea
                          ref={textEditorRef}
                          value={textValue}
                          onChange={(event) => updateTextSetting("text", event.target.value)}
                          rows={4}
                          className="w-full border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] bg-white resize-y"
                          placeholder="Enter text. Press Enter for a new line."
                        />
                        <p className="text-xs text-[var(--text-secondary)] mt-2">
                          Press Enter for multiple lines. Resize the text box below to improve spacing and centering.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
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

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-semibold mb-2 block">Font</label>
                          <select
                            value={textFontFamily}
                            onChange={(event) => updateTextSetting("fontFamily", event.target.value)}
                            className="w-full border border-[var(--border)] rounded-xl px-3 py-3 bg-white outline-none focus:border-[var(--primary)]"
                          >
                            {FONT_OPTIONS.map((font) => (
                              <option key={font.value} value={font.value}>
                                {font.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-sm font-semibold mb-2 block">Case</label>
                          <select
                            value={textCase}
                            onChange={(event) => updateTextSetting("textCase", event.target.value)}
                            className="w-full border border-[var(--border)] rounded-xl px-3 py-3 bg-white outline-none focus:border-[var(--primary)]"
                          >
                            {TEXT_CASE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-2 block">Text Alignment</label>
                        <div className="grid grid-cols-3 gap-2">
                          {TEXT_ALIGN_OPTIONS.map((option) => {
                            const AlignIcon = option.icon;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => updateTextSetting("textAlign", option.value)}
                                className={`h-11 rounded-xl border inline-flex items-center justify-center gap-2 ${
                                  textAlign === option.value
                                    ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                                    : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                                }`}
                              >
                                <AlignIcon size={17} />
                                <span className="text-xs font-semibold">{option.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <ColorInput
                          label="Text Color"
                          value={textColor}
                          onChange={(value) => updateTextSetting("color", value)}
                          onPick={() => startColorPicker("textColor", "text color")}
                        />

                        <ColorInput
                          label="Background"
                          value={textBackground}
                          onChange={(value) => updateTextSetting("background", value)}
                          onPick={() => startColorPicker("textBackground", "text background")}
                          disabled={!textHasBackground}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
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

                      <RangeInput
                        label={`Font Size: ${fontSize}px`}
                        min={14}
                        max={180}
                        step={1}
                        value={fontSize}
                        onChange={(value) => updateTextSetting("fontSize", Number(value))}
                      />

                      <div>
                        <label className="text-sm font-semibold mb-2 block">
                          Font Weight: {fontWeight}
                        </label>
                        <select
                          value={fontWeight}
                          onChange={(event) => updateTextSetting("fontWeight", Number(event.target.value))}
                          className="w-full border border-[var(--border)] rounded-xl px-3 py-3 bg-white outline-none focus:border-[var(--primary)]"
                        >
                          {FONT_WEIGHT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label} - {option.value}
                            </option>
                          ))}
                        </select>
                      </div>

                      <RangeInput
                        label={`Text Box Width: ${Math.round(textBoxWidth)}px`}
                        min={60}
                        max={canvasSize.width * 2}
                        step={1}
                        value={textBoxWidth}
                        onChange={(value) => updateTextSetting("w", Number(value))}
                      />

                      <RangeInput
                        label={`Text Box Height: ${Math.round(textBoxHeight)}px`}
                        min={30}
                        max={canvasSize.height * 2}
                        step={1}
                        value={textBoxHeight}
                        onChange={(value) => updateTextSetting("h", Number(value))}
                      />
                    </div>
                  )}

                  {["draw", "blur", "restore", "eraser"].includes(settingsMode) && (
                    <div className="space-y-4">
                      <InfoCard label="Active Tool" value={activeTool === "eraser" ? "Eraser Tool" : activeTool} />

                      {settingsMode === "eraser" && (
                        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800 leading-7">
                          <p className="font-bold mb-1">Eraser Tool</p>
                          <p>Permanently erases pixels from the editable image layer.</p>
                          <p>Use Undo if you erase too much.</p>
                        </div>
                      )}

                      {settingsMode === "draw" && (
                        <ColorInput label="Brush Color" value={brushColor} onChange={setBrushColor} onPick={() => startColorPicker("brushColor", "brush color")} />
                      )}

                      <RangeInput
                        label={`Brush: ${brushSize}px`}
                        min={4}
                        max={220}
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

                      {settingsMode === "blur" && (
                        <RangeInput
                          label={`Blur: ${blurStrength}px`}
                          min={2}
                          max={40}
                          step={1}
                          value={blurStrength}
                          onChange={(value) => setBlurStrength(Number(value))}
                        />
                      )}
                    </div>
                  )}

                  {settingsMode === "color" && (
                    <div className="space-y-4">
                      <p className="text-sm text-[var(--text-secondary)] leading-7">
                        Pick a color source first, then click anywhere on the artboard image. It helps you match text, brush, and shape colors quickly.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => startColorPicker("textColor", "text color")}
                          className="px-4 py-3 rounded-xl border border-[var(--border)] bg-white text-left hover:bg-[#f8f4ff]"
                        >
                          <p className="font-semibold text-sm">Pick Text Color</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">Match text with your image.</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => startColorPicker("textBackground", "text background")}
                          className="px-4 py-3 rounded-xl border border-[var(--border)] bg-white text-left hover:bg-[#f8f4ff]"
                        >
                          <p className="font-semibold text-sm">Pick Text Background</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">Use image colors behind text.</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => startColorPicker("brushColor", "brush color")}
                          className="px-4 py-3 rounded-xl border border-[var(--border)] bg-white text-left hover:bg-[#f8f4ff]"
                        >
                          <p className="font-semibold text-sm">Pick Brush Color</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">Great for drawing and retouch marks.</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => startColorPicker("shapeFill", "shape fill color")}
                          className="px-4 py-3 rounded-xl border border-[var(--border)] bg-white text-left hover:bg-[#f8f4ff]"
                        >
                          <p className="font-semibold text-sm">Pick Shape Fill</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">Fill shapes with an exact sampled color.</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => startColorPicker("shapeStroke", "shape stroke color")}
                          className="px-4 py-3 rounded-xl border border-[var(--border)] bg-white text-left hover:bg-[#f8f4ff] sm:col-span-2"
                        >
                          <p className="font-semibold text-sm">Pick Shape Stroke</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">Useful for borders, arrows, and outlines.</p>
                        </button>
                      </div>
                    </div>
                  )}

                  {[...SHAPE_TYPES.map((shape) => shape.id), "shape"].includes(settingsMode) && (
                    <div className="space-y-4">
                      <p className="text-sm text-[var(--text-secondary)] leading-7">
                        Choose a shape, then drag on the artboard. Hold Shift while drawing for a straight line or perfect square/circle.
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {SHAPE_TYPES.map((shape) => {
                          const ShapeIcon = shape.icon;

                          return (
                            <button
                              key={shape.id}
                              type="button"
                              onClick={() => activateShapeTool(shape.id)}
                              className={`px-3 py-3 rounded-xl border text-sm font-semibold inline-flex items-center justify-center gap-2 ${
                                activeTool === shape.id
                                  ? "border-[var(--primary)] bg-[#f4edff]"
                                  : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                              }`}
                            >
                              <ShapeIcon size={16} />
                              {shape.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center justify-between gap-3 bg-white border border-[var(--border)] rounded-xl p-4 cursor-pointer">
                          <span className="font-semibold text-sm">Fill</span>
                          <input
                            type="checkbox"
                            checked={shapeFillEnabled}
                            disabled={activeTool === "arrow" || selectedObject?.type === "arrow"}
                            onChange={(event) =>
                              updateShapeSetting("fillEnabled", event.target.checked)
                            }
                            className="w-4 h-4 accent-[var(--primary)]"
                          />
                        </label>

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
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <ColorInput
                          label="Fill Color"
                          value={shapeFillColor}
                          onChange={(value) => updateShapeSetting("fill", value)}
                          onPick={() => startColorPicker("shapeFill", "shape fill color")}
                          disabled={!shapeFillEnabled || activeTool === "arrow" || selectedObject?.type === "arrow"}
                        />

                        <ColorInput
                          label="Stroke Color"
                          value={shapeStrokeColor}
                          onChange={(value) => updateShapeSetting("stroke", value)}
                          onPick={() => startColorPicker("shapeStroke", "shape stroke color")}
                          disabled={!shapeStrokeEnabled}
                        />
                      </div>

                      <RangeInput
                        label={`Stroke: ${shapeStrokeWidth}px`}
                        min={1}
                        max={60}
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
                  )}

                  {settingsMode === "patch" && (
                    <div className="space-y-4">
                      <ol className="text-sm text-[var(--text-secondary)] leading-7 list-decimal pl-5">
                        <li>Select the unwanted area first. Use Free Select for an organic shape.</li>
                        <li>Click or drag any clean/flat area.</li>
                        <li>Release to make the unwanted area look like that clean area.</li>
                      </ol>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTool("patch");
                          setActivePanel("");
                          commitBaseImageToCanvasIfNeeded({ withHistory: true });
                          setPatchTargetBox(null);
                          setPatchTargetSelection(null);
                          setPatchSourcePreviewBox(null);
                          setIsSettingPatchTarget(true);
                          setGuideInfo(null);
                          setSuccessMessage("Select the area you want to remove.");
                        }}
                        className="btn-primary w-full inline-flex items-center justify-center gap-2"
                      >
                        <Sparkles size={16} />
                        New Patch Selection
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!activeSelection) {
                            setErrorMessage("Use Free Select first, then choose this option.");
                            return;
                          }

                          setPatchTargetBox(activeSelection.box);
                          setPatchTargetSelection(activeSelection);
                          setPatchSourcePreviewBox(null);
                          setIsSettingPatchTarget(false);
                          setGuideInfo(buildGuideInfo(activeSelection.box, canvasSize, "Free patch target"));
                          setSuccessMessage("Free selection set as patch target. Click or drag a clean area to apply it. Press Ctrl/Cmd + D to hide the selection when done.");
                        }}
                        disabled={!activeSelection}
                        className={`btn-secondary w-full inline-flex items-center justify-center gap-2 ${
                          !activeSelection ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        Use Free Selection as Patch Target
                      </button>

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
                        max={100}
                        step={1}
                        value={patchFeather}
                        onChange={(value) => setPatchFeather(Number(value))}
                      />
                    </div>
                  )}

                  {settingsMode === "clone" && (
                    <div className="space-y-4">
                      <ol className="text-sm text-[var(--text-secondary)] leading-7 list-decimal pl-5">
                        <li>Select the area you want to copy. Use Free Select for an organic shape.</li>
                        <li>Click or drag anywhere to paste the same clone.</li>
                        <li>Use New Clone Selection to choose another clone area.</li>
                      </ol>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTool("clone");
                          setActivePanel("");
                          commitBaseImageToCanvasIfNeeded({ withHistory: true });
                          setCloneSourceBox(null);
                          setCloneSourceSelection(null);
                          setCloneTargetPreviewBox(null);
                          setShowCloneSourceGuide(true);
                          setIsSettingCloneSource(true);
                          setGuideInfo(null);
                          setSuccessMessage("Select the new area you want to clone.");
                        }}
                        className="btn-primary w-full inline-flex items-center justify-center gap-2"
                      >
                        <Copy size={16} />
                        New Clone Selection
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!activeSelection) {
                            setErrorMessage("Use Free Select first, then choose this option.");
                            return;
                          }

                          setCloneSourceBox(activeSelection.box);
                          setCloneSourceSelection(activeSelection);
                          setCloneTargetPreviewBox(null);
                          setIsSettingCloneSource(false);
                          setShowCloneSourceGuide(true);
                          setGuideInfo(buildGuideInfo(activeSelection.box, canvasSize, "Free clone source"));
                          setSuccessMessage("Free selection saved as clone source. Click or drag where you want to paste it. Press Ctrl/Cmd + D to hide the selection when done.");
                        }}
                        disabled={!activeSelection}
                        className={`btn-secondary w-full inline-flex items-center justify-center gap-2 ${
                          !activeSelection ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        Use Free Selection as Clone Source
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
                        className={`btn-secondary w-full inline-flex items-center justify-center gap-2 ${
                          !cloneSourceBox ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Copy size={16} />
                        Use Same Clone
                      </button>

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
                        max={100}
                        step={1}
                        value={cloneFeather}
                        onChange={(value) => setCloneFeather(Number(value))}
                      />
                    </div>
                  )}

                  {settingsMode === "layers" && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">Layers</p>
                            <p className="mt-1 text-xs text-[var(--text-secondary)]">
                              Select a layer, then use the compact icon controls below it.
                            </p>
                          </div>

                          <label
                            className={`inline-flex shrink-0 items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-bold transition ${
                              allLayersKeepQuality
                                ? "border-[var(--primary)] text-[var(--primary)]"
                                : "border-[var(--border)] text-[var(--text-secondary)]"
                            }`}
                            title="Use high-quality resampling for every editable layer"
                          >
                            <CheckCircle size={15} />
                            All quality
                            <input
                              type="checkbox"
                              checked={allLayersKeepQuality}
                              onChange={(event) => setKeepQualityForAll(event.target.checked)}
                              className="h-4 w-4 accent-[var(--primary)]"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-[500px] overflow-auto pr-1">
                        {objects.length ? (
                          [...objects].reverse().map((item, reverseIndex) => {
                            const layerIndex = objects.length - 1 - reverseIndex;
                            const isSelected = selectedObjectIds.includes(item.id) || selectedObjectId === item.id;
                            const isLocked = lockedObjectIds.includes(item.id);
                            const label = getLayerDisplayName(item, layerIndex);
                            const isBackgroundLayer = item.type === "background";

                            const selectLayer = (event) => {
                              const activeIds = selectedObjectIds.length
                                ? selectedObjectIds
                                : selectedObjectId
                                  ? [selectedObjectId]
                                  : [];

                              if (event.shiftKey && !isBackgroundLayer) {
                                const nextIds = activeIds.includes(item.id)
                                  ? activeIds.filter((id) => id !== item.id)
                                  : [...activeIds, item.id];

                                setSelectedObjectIds(nextIds);
                                setSelectedObjectId(nextIds[nextIds.length - 1] || null);
                                setGuideInfo(
                                  buildGuideInfo(
                                    getGroupBox(objects.filter((layer) => nextIds.includes(layer.id))) || getObjectBox(item),
                                    canvasSize,
                                    `${nextIds.length} layer${nextIds.length === 1 ? "" : "s"} selected`
                                  )
                                );
                              } else {
                                setSelectedObjectId(item.id);
                                setSelectedObjectIds([item.id]);
                                setGuideInfo(buildGuideInfo(getObjectBox(item), canvasSize, label));
                              }

                              setActiveTool("select");
                              clearOutput();
                            };

                            return (
                              <div
                                key={item.id}
                                role="button"
                                tabIndex={0}
                                onClick={selectLayer}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    selectLayer(event);
                                  }
                                }}
                                className={`w-full rounded-xl border p-3 text-left transition ${
                                  isSelected
                                    ? "border-[var(--primary)] bg-[#f4edff]"
                                    : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-sm truncate">{label}</p>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                                      {isBackgroundLayer ? "Background color layer" : item.isBaseImage ? "Base photo" : item.type} • Layer {layerIndex + 1}{isLocked ? " • Locked" : ""}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {isLocked && <Lock size={14} className="text-[var(--primary)]" />}
                                    {isSelected && (
                                      <span className="text-xs font-bold text-[var(--primary)]">
                                        Selected
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-3 grid grid-cols-6 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setSelectedObjectId(item.id);
                                      setSelectedObjectIds([item.id]);
                                      window.setTimeout(toggleLockSelected, 0);
                                    }}
                                    className={`inline-flex h-9 items-center justify-center rounded-lg border bg-white transition hover:bg-[#f8f4ff] ${
                                      isLocked
                                        ? "border-[var(--primary)] text-[var(--primary)]"
                                        : "border-[var(--border)]"
                                    }`}
                                    title={isLocked ? "Unlock layer" : "Lock layer"}
                                    aria-label={isLocked ? "Unlock layer" : "Lock layer"}
                                  >
                                    {isLocked ? <Unlock size={15} /> : <Lock size={15} />}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleLayerKeepQuality(item.id);
                                    }}
                                    disabled={isBackgroundLayer}
                                    className={`inline-flex h-9 items-center justify-center rounded-lg border bg-white transition hover:bg-[#f8f4ff] disabled:opacity-35 ${
                                      item.keepQuality !== false && !isBackgroundLayer
                                        ? "border-[var(--primary)] text-[var(--primary)]"
                                        : "border-[var(--border)]"
                                    }`}
                                    title={item.keepQuality === false ? "Enable keep quality" : "Keep quality enabled"}
                                    aria-label={item.keepQuality === false ? "Enable keep quality" : "Disable keep quality"}
                                  >
                                    <CheckCircle size={15} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      duplicateLayerById(item.id);
                                    }}
                                    disabled={isLocked || isBackgroundLayer}
                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white transition hover:bg-[#f8f4ff] disabled:opacity-35"
                                    title="Duplicate layer"
                                    aria-label="Duplicate layer"
                                  >
                                    <Copy size={15} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setSelectedObjectId(item.id);
                                      setSelectedObjectIds([item.id]);
                                      window.setTimeout(() => reorderSelectedObjects("up"), 0);
                                    }}
                                    disabled={isLocked || isBackgroundLayer}
                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white transition hover:bg-[#f8f4ff] disabled:opacity-35"
                                    title="Bring layer up"
                                    aria-label="Bring layer up"
                                  >
                                    <ChevronUp size={16} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setSelectedObjectId(item.id);
                                      setSelectedObjectIds([item.id]);
                                      window.setTimeout(() => reorderSelectedObjects("down"), 0);
                                    }}
                                    disabled={isLocked || isBackgroundLayer}
                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white transition hover:bg-[#f8f4ff] disabled:opacity-35"
                                    title="Send layer down"
                                    aria-label="Send layer down"
                                  >
                                    <ChevronDown size={16} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setSelectedObjectId(item.id);
                                      setSelectedObjectIds([item.id]);
                                      window.setTimeout(deleteSelectedObject, 0);
                                    }}
                                    disabled={isLocked || isBackgroundLayer}
                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-35"
                                    title="Delete layer"
                                    aria-label="Delete layer"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>

                                {isBackgroundLayer && isSelected && (
                                  <div className="mt-3 space-y-2 rounded-xl border border-[var(--border)] bg-white p-3">
                                    <label className="flex items-center justify-between gap-3 text-xs font-bold text-[var(--text-secondary)]">
                                      <span className="inline-flex items-center gap-2">
                                        <span className="h-7 w-7 rounded-md border border-[var(--border)] smart-photo-editor-transparent-canvas" />
                                        Transparent artboard
                                      </span>
                                      <input
                                        type="checkbox"
                                        checked={transparentArtboard}
                                        onClick={(event) => event.stopPropagation()}
                                        onChange={(event) => toggleTransparentArtboard(event.target.checked)}
                                        className="h-4 w-4 accent-[var(--primary)]"
                                      />
                                    </label>

                                    <div className={`flex items-center justify-between gap-3 ${transparentArtboard ? "opacity-45" : ""}`}>
                                      <span className="text-xs font-bold text-[var(--text-secondary)]">
                                        Background color
                                      </span>
                                      <input
                                        type="color"
                                        value={normalizeColor(item.color || canvasBackgroundColor)}
                                        onClick={(event) => event.stopPropagation()}
                                        onChange={(event) => {
                                          event.stopPropagation();
                                          changeArtboardBackgroundColor(event.target.value);
                                        }}
                                        disabled={isLocked || transparentArtboard}
                                        className="h-9 w-12 rounded-lg border border-[var(--border)] bg-white disabled:opacity-40"
                                      />
                                    </div>
                                    {isLocked && !transparentArtboard && (
                                      <p className="text-xs text-[var(--text-secondary)]">
                                        Unlock the background layer before changing its color.
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-2xl border border-[var(--border)] bg-gray-50 p-4 text-sm text-[var(--text-secondary)]">
                            No layers yet. Add text, shapes, logos, or images.
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {settingsMode === "crop" && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4">
                        <p className="font-bold">Crop Copy</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          Drag a perfect crop selection. The cropped area is copied and pasted as a movable image layer on the artboard.
                        </p>
                      </div>
                    </div>
                  )}

                  {settingsMode === "size" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold mb-2 block">Print Size</label>
                        <select
                          value={printSizePreset}
                          onChange={(event) => applyPrintSizePreset(event.target.value)}
                          className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                        >
                          {PRINT_SIZE_PRESETS.map((preset) => (
                            <option key={preset.id} value={preset.id}>
                              {preset.width ? `${preset.label} — ${preset.width} × ${preset.height}px` : preset.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
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

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-semibold mb-2 block">Width</label>
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
                          <label className="text-sm font-semibold mb-2 block">Height</label>
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
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className={`flex items-center justify-between gap-2 rounded-xl border bg-white p-3 text-sm font-semibold transition ${
                          transparentArtboard
                            ? "border-[var(--primary)] text-[var(--primary)]"
                            : "border-[var(--border)]"
                        }`}>
                          <span className="inline-flex items-center gap-2">
                            <span className="h-6 w-6 rounded-md border border-[var(--border)] smart-photo-editor-transparent-canvas" />
                            Transparent
                          </span>
                          <input
                            type="checkbox"
                            checked={transparentArtboard}
                            onChange={(event) => toggleTransparentArtboard(event.target.checked)}
                            className="h-4 w-4 accent-[var(--primary)]"
                          />
                        </label>

                        <label className={`flex items-center justify-between gap-2 rounded-xl border bg-white p-3 text-sm font-semibold transition ${
                          keepQuality
                            ? "border-[var(--primary)] text-[var(--primary)]"
                            : "border-[var(--border)]"
                        }`}>
                          <span className="inline-flex items-center gap-2">
                            <CheckCircle size={16} />
                            Keep quality
                          </span>
                          <input
                            type="checkbox"
                            checked={keepQuality}
                            onChange={(event) => setKeepQualityForAll(event.target.checked)}
                            className="h-4 w-4 accent-[var(--primary)]"
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={applyCanvasResize}
                        className="btn-primary w-full"
                      >
                        Apply Size
                      </button>
                    </div>
                  )}

                  {settingsMode === "export" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold mb-2 block">Format</label>
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

                      {transparentArtboard && outputFormat === "image/jpeg" && (
                        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs leading-5 text-yellow-800">
                          JPG cannot keep transparency. The transparent area will export as white.
                        </div>
                      )}

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
            </aside>

            <div className="min-w-0 flex flex-col">
              <div className="border-b border-[var(--border)] bg-white/95 backdrop-blur px-4 py-3 flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Artboard</p>
                  <p className="font-bold text-sm">
                    {canvasSize.width} × {canvasSize.height}px
                  </p>
                </div>

                <div className="h-8 w-px bg-[var(--border)]" />

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${
                      transparentArtboard
                        ? "border-[var(--primary)] bg-[#f4edff]"
                        : "border-[var(--border)] bg-white"
                    }`}
                    title={transparentArtboard ? "Transparent artboard" : "Solid artboard"}
                  >
                    {transparentArtboard ? (
                      <span className="h-5 w-5 rounded border border-[var(--border)] smart-photo-editor-transparent-canvas" />
                    ) : (
                      <Square size={17} className="text-[var(--primary)]" />
                    )}
                  </span>
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${
                      allLayersKeepQuality
                        ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                        : "border-[var(--border)] bg-white text-[var(--text-secondary)]"
                    }`}
                    title={allLayersKeepQuality ? "Keep quality enabled" : "Some layers have keep quality disabled"}
                  >
                    <CheckCircle size={17} />
                  </span>
                </div>

                <div className="flex-1" />

                <button
                  type="button"
                  onClick={() => exportImage({ downloadAfterCreate: true })}
                  disabled={isExporting}
                  className={`btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm ${
                    isExporting ? "opacity-50 cursor-not-allowed" : ""
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

              <div
                ref={quickBarRef}
                className={`sticky top-0 z-[70] overflow-visible border-b border-[var(--border)] bg-white/95 px-4 backdrop-blur transition-all duration-200 ${
                  topBarOpen ? "pb-2" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setTopBarOpen((current) => !current);
                    setTopBarDropdown("");
                  }}
                  className="w-full py-2 flex items-center justify-between gap-3 text-left"
                >
                  <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                    Quick editing bar
                  </span>

                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--primary)]">
                    {topBarOpen ? "Hide" : "Show"}
                    {topBarOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>

                {topBarOpen && (
                  <div className="relative flex min-h-[64px] flex-wrap items-center gap-2 overflow-visible pb-2 whitespace-normal">
                    <div className="h-11 shrink-0 rounded-xl border border-[var(--border)] bg-[#f8f4ff] px-3 py-2 text-xs font-semibold text-[var(--primary)] inline-flex items-center">
                      {selectedObjects.length > 1
                        ? `${selectedObjects.length} items selected`
                        : selectedObject
                          ? `${selectedObject.type === "background" ? "background" : selectedObject.type} selected${selectedLocked ? " • Locked" : ""}`
                          : "Select an item to edit quickly"}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleTransparentArtboard(!transparentArtboard)}
                      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                        transparentArtboard
                          ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                          : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                      }`}
                      title={transparentArtboard ? "Disable transparent artboard" : "Use transparent artboard"}
                      aria-label={transparentArtboard ? "Disable transparent artboard" : "Use transparent artboard"}
                    >
                      <span className="h-6 w-6 rounded-md border border-current smart-photo-editor-transparent-canvas" />
                    </button>

                    <button
                      type="button"
                      onClick={toggleSelectedKeepQuality}
                      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                        selectedKeepQuality
                          ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                          : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                      }`}
                      title={
                        selectedObjectId || selectedObjectIds.length
                          ? "Keep quality for selected layer(s)"
                          : "Keep quality for all layers"
                      }
                      aria-label="Toggle keep quality"
                    >
                      <CheckCircle size={18} />
                    </button>

                    {(selectedObjectId || selectedObjectIds.length > 0) && (
                      <button
                        type="button"
                        onClick={toggleLockSelected}
                        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                          selectedLocked
                            ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                            : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                        }`}
                        title={selectedLocked ? "Unlock selected layer" : "Lock selected layer"}
                        aria-label={selectedLocked ? "Unlock selected layer" : "Lock selected layer"}
                      >
                        {selectedLocked ? <Unlock size={17} /> : <Lock size={17} />}
                      </button>
                    )}


                    {topBarSizeEditable && (
                      <div className="h-11 shrink-0 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-2 py-2 text-xs font-semibold">
                        <span className="font-bold text-[var(--primary)]">{selectedObjects.length > 1 ? "Group Size" : "Size"}</span>

                        <label className="inline-flex items-center gap-1">
                          <span>W</span>
                          <input
                            type="number"
                            min="0.01"
                            step={exactShapeUnit === "in" ? "0.01" : "1"}
                            value={quickSelectedWidthValue}
                            onChange={(event) => updateSelectedObjectSize("w", event.target.value)}
                            className="w-20 rounded-lg border border-[var(--border)] px-2 py-1 outline-none focus:border-[var(--primary)]"
                            title={selectedObjects.length > 1 ? "Selected group width" : `Selected ${selectedObject?.type || "item"} width`}
                          />
                        </label>

                        <label className="inline-flex items-center gap-1">
                          <span>H</span>
                          <input
                            type="number"
                            min="0.01"
                            step={exactShapeUnit === "in" ? "0.01" : "1"}
                            value={quickSelectedHeightValue}
                            onChange={(event) => updateSelectedObjectSize("h", event.target.value)}
                            className="w-20 rounded-lg border border-[var(--border)] px-2 py-1 outline-none focus:border-[var(--primary)]"
                            title={selectedObjects.length > 1 ? "Selected group height" : `Selected ${selectedObject?.type || "item"} height`}
                          />
                        </label>

                        <select
                          value={exactShapeUnit}
                          onChange={(event) => setExactShapeUnit(event.target.value)}
                          className="h-8 rounded-lg border border-[var(--border)] bg-white px-2 outline-none focus:border-[var(--primary)]"
                          title="Size unit"
                        >
                          <option value="px">px</option>
                          <option value="in">inch</option>
                        </select>
                      </div>
                    )}

                    {(selectedObjectId || selectedObjectIds.length > 0) && (
                      <div className="h-11 shrink-0 inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-white px-2 py-2 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => rotateSelectedBy(-15)}
                          className="h-8 w-8 rounded-lg hover:bg-[#f8f4ff] inline-flex items-center justify-center"
                          title="Rotate left 15°"
                        >
                          <RotateCcw size={16} />
                        </button>

                        <RotateCw size={16} className="text-[var(--primary)]" />

                        <input
                          type="number"
                          min="-360"
                          max="360"
                          step="1"
                          value={quickSelectedRotation}
                          onChange={(event) => updateSelectedRotation(event.target.value)}
                          className="w-16 rounded-lg border border-[var(--border)] px-2 py-1 outline-none focus:border-[var(--primary)]"
                          title="Rotation angle"
                        />
                        <span>°</span>

                        <button
                          type="button"
                          onClick={() => rotateSelectedBy(15)}
                          className="h-8 w-8 rounded-lg hover:bg-[#f8f4ff] inline-flex items-center justify-center"
                          title="Rotate right 15°"
                        >
                          <RotateCw size={16} />
                        </button>
                      </div>
                    )}

                    <label
                      className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] bg-white transition hover:bg-[#f8f4ff]"
                      title="Active color"
                    >
                      <input
                        type="color"
                        value={quickSelectedColor}
                        onChange={(event) => updateQuickColor(event.target.value)}
                        className="h-7 w-7 cursor-pointer rounded-lg border border-[var(--border)] bg-white"
                        aria-label="Active color"
                      />
                    </label>

                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setTopBarDropdown((current) => current === "gradient" ? "" : "gradient")}
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                          topBarDropdown === "gradient"
                            ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                            : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                        }`}
                        title="Gradient options"
                        aria-label="Gradient options"
                      >
                        <PalettePreview start={gradientStartColor} end={gradientEndColor} angle={gradientAngle} />
                      </button>

                      {topBarDropdown === "gradient" && (
                        <div className="smart-photo-editor-popover absolute left-0 top-12 z-[220] w-[320px] rounded-2xl border border-[var(--border)] bg-white p-3 shadow-2xl">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold">Gradient</p>
                              <p className="text-xs text-[var(--text-secondary)]">Apply a smooth two-color fill.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setTopBarDropdown("")}
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] hover:bg-[#f8f4ff]"
                              title="Close gradient"
                              aria-label="Close gradient"
                            >
                              <X size={15} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <label className="text-xs font-bold">
                              Start
                              <input
                                type="color"
                                value={gradientStartColor}
                                onChange={(event) => updateGradientPart("start", event.target.value)}
                                className="mt-1 w-full h-10 rounded-xl border border-[var(--border)] bg-white p-1"
                              />
                            </label>

                            <label className="text-xs font-bold">
                              End
                              <input
                                type="color"
                                value={gradientEndColor}
                                onChange={(event) => updateGradientPart("end", event.target.value)}
                                className="mt-1 w-full h-10 rounded-xl border border-[var(--border)] bg-white p-1"
                              />
                            </label>
                          </div>

                          <label className="mt-3 block text-xs font-bold">
                            Angle
                            <input
                              type="number"
                              min="0"
                              max="360"
                              value={gradientAngle}
                              onChange={(event) => updateGradientPart("angle", event.target.value)}
                              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--primary)]"
                            />
                          </label>

                          <div className="mt-3 grid grid-cols-5 gap-2">
                            {GRADIENT_TEMPLATES.map((template) => (
                              <button
                                key={template.id}
                                type="button"
                                onClick={() => applyGradientTemplate(template)}
                                title={template.label}
                                className="h-9 rounded-xl border border-white shadow"
                                style={{ background: `linear-gradient(${template.angle}deg, ${template.start}, ${template.end})` }}
                              />
                            ))}
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => { updateQuickGradient(); setTopBarDropdown(""); }}
                              className="rounded-xl bg-[var(--primary)] px-3 py-2 text-xs font-bold text-white"
                            >
                              Apply
                            </button>

                            <button
                              type="button"
                              onClick={() => { clearSelectedGradient(); setTopBarDropdown(""); }}
                              className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-bold hover:bg-[#f8f4ff]"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <label className="h-11 shrink-0 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold">
                      BG Layer
                      <input
                        type="color"
                        value={canvasBackgroundColor}
                        onChange={(event) => changeArtboardBackgroundColor(event.target.value)}
                        className="w-8 h-8 rounded-lg border border-[var(--border)] bg-white"
                      />
                    </label>

                    <label className="h-11 shrink-0 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold min-w-[190px]">
                      Transparency
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={quickSelectedOpacity}
                        onChange={(event) => updateQuickOpacity(event.target.value)}
                        className="w-24 accent-[var(--primary)]"
                      />
                      <span className="w-9 text-right">{quickSelectedOpacity}%</span>
                    </label>

                    {selectedObject?.type === "text" && (
                      <label className="h-11 shrink-0 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold">
                        Text size
                        <input
                          type="number"
                          value={quickSelectedFontSize}
                          min="8"
                          max="220"
                          onChange={(event) => updateQuickFontSize(event.target.value)}
                          className="w-20 rounded-lg border border-[var(--border)] px-2 py-1 outline-none focus:border-[var(--primary)]"
                        />
                      </label>
                    )}

                    {(selectedObject && (SHAPE_TYPES.some((shape) => shape.id === selectedObject.type) || selectedObject.type === "arrow")) && (
                      <label className="h-11 shrink-0 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold">
                        Stroke
                        <input
                          type="number"
                          value={quickSelectedStrokeWidth}
                          min="1"
                          max="80"
                          onChange={(event) => updateQuickStrokeWidth(event.target.value)}
                          className="w-20 rounded-lg border border-[var(--border)] px-2 py-1 outline-none focus:border-[var(--primary)]"
                        />
                      </label>
                    )}

                    {(selectedObjectId || selectedObjectIds.length > 0) && (
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setTopBarDropdown((current) => current === "align" ? "" : "align")}
                          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                            topBarDropdown === "align"
                              ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                              : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                          }`}
                          title="Alignment options"
                          aria-label="Alignment options"
                        >
                          <AlignCenter size={18} />
                        </button>

                        {topBarDropdown === "align" && (
                          <div className="smart-photo-editor-popover absolute right-0 top-12 z-[240] w-[270px] rounded-2xl border border-[var(--border)] bg-white p-3 shadow-2xl">
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div>
                                <p className="font-bold">Align layers</p>
                                <p className="text-xs text-[var(--text-secondary)]">
                                  Align one item to the artboard or multiple items to their group.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setTopBarDropdown("")}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] hover:bg-[#f8f4ff]"
                                title="Close alignment"
                                aria-label="Close alignment"
                              >
                                <X size={15} />
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: "left", label: "Align left", icon: AlignLeft, rotate: false },
                                { id: "center", label: "Center horizontally", icon: AlignCenter, rotate: false },
                                { id: "right", label: "Align right", icon: AlignRight, rotate: false },
                                { id: "top", label: "Align top", icon: AlignLeft, rotate: true },
                                { id: "middle", label: "Center vertically", icon: AlignCenter, rotate: true },
                                { id: "bottom", label: "Align bottom", icon: AlignRight, rotate: true },
                              ].map((option) => {
                                const AlignIcon = option.icon;

                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                      alignSelectedObjects(option.id);
                                      setTopBarDropdown("");
                                    }}
                                    className="group inline-flex h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-white transition hover:border-[var(--primary)] hover:bg-[#f8f4ff] hover:text-[var(--primary)]"
                                    title={option.label}
                                    aria-label={option.label}
                                  >
                                    <AlignIcon size={19} className={option.rotate ? "rotate-90" : ""} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {(selectedObjectId || selectedObjectIds.length > 0) && (
                      <div className="flex shrink-0 items-center gap-2">
                        <button type="button" onClick={copyEditorSelection} className="h-11 w-11 rounded-xl border border-[var(--border)] inline-flex items-center justify-center hover:bg-[#f8f4ff]" title="Copy"><Copy size={17} /></button>
                        <button type="button" onClick={pasteEditorClipboard} className="h-11 w-11 rounded-xl border border-[var(--border)] inline-flex items-center justify-center hover:bg-[#f8f4ff]" title="Paste"><Copy size={17} className="rotate-180" /></button>
                        <button type="button" onClick={duplicateSelectedObjects} className="h-11 w-11 rounded-xl border border-[var(--border)] inline-flex items-center justify-center hover:bg-[#f8f4ff]" title="Duplicate"><Images size={17} /></button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setTopBarDropdown((current) => current === "arrange" ? "" : "arrange")}
                            className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                              topBarDropdown === "arrange"
                                ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                                : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                            }`}
                            title="Layer order"
                            aria-label="Layer order"
                          >
                            <Layers size={18} />
                          </button>

                          {topBarDropdown === "arrange" && (
                            <div className="smart-photo-editor-popover absolute right-0 top-12 z-[240] w-[250px] rounded-2xl border border-[var(--border)] bg-white p-3 shadow-2xl">
                              <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-bold">Layer order</p>
                                  <p className="text-xs text-[var(--text-secondary)]">Move selected layers through the stack.</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setTopBarDropdown("")}
                                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] hover:bg-[#f8f4ff]"
                                  title="Close layer order"
                                  aria-label="Close layer order"
                                >
                                  <X size={15} />
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => { reorderSelectedObjects("up"); setTopBarDropdown(""); }} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-3 text-xs font-bold transition hover:border-[var(--primary)] hover:bg-[#f8f4ff]"><ChevronUp size={16} />Bring up</button>
                                <button type="button" onClick={() => { reorderSelectedObjects("down"); setTopBarDropdown(""); }} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-3 text-xs font-bold transition hover:border-[var(--primary)] hover:bg-[#f8f4ff]"><ChevronDown size={16} />Send down</button>
                                <button type="button" onClick={() => { reorderSelectedObjects("front"); setTopBarDropdown(""); }} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-3 text-xs font-bold transition hover:border-[var(--primary)] hover:bg-[#f8f4ff]"><Layers size={16} />To front</button>
                                <button type="button" onClick={() => { reorderSelectedObjects("back"); setTopBarDropdown(""); }} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-3 text-xs font-bold transition hover:border-[var(--primary)] hover:bg-[#f8f4ff]"><Layers size={16} className="rotate-180" />To back</button>
                              </div>
                            </div>
                          )}
                        </div>

                        <button type="button" onClick={deleteSelectedObject} className="h-11 w-11 rounded-xl border border-red-200 bg-red-50 text-red-700 inline-flex items-center justify-center hover:bg-red-100" title="Delete"><Trash2 size={17} /></button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {false && (errorMessage || successMessage || isExporting) && (
                <div className="grid md:grid-cols-2 gap-3 p-4 pb-0">
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
                    </div>
                  )}
                </div>
              )}

              <div className="relative flex-1 min-h-[560px]">
                <div
                  onPointerDown={handleArtboardPointerDown}
                  onDrop={handleDrop}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onWheel={handleWorkspaceWheel}
                  onContextMenu={(event) => event.preventDefault()}
                  className={`smart-photo-editor-workspace absolute inset-0 overflow-auto p-4 sm:p-8 ${
                    isDraggingFile ? "ring-2 ring-[var(--primary)]" : ""
                  }`}
                >
                  {isDraggingFile && (
                    <div className="smart-photo-editor-drop-overlay pointer-events-none sticky left-1/2 top-6 z-[90] flex w-[min(440px,calc(100%-2rem))] -translate-x-1/2 items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--primary)] bg-white/95 px-5 py-4 text-center shadow-2xl backdrop-blur">
                      <Upload size={22} className="shrink-0 text-[var(--primary)]" />
                      <div>
                        <p className="font-bold text-[var(--primary)]">Drop image to add a new layer</p>
                        <p className="text-xs text-[var(--text-secondary)]">Multiple files are supported.</p>
                      </div>
                    </div>
                  )}

                  <div
                    className="flex items-center justify-center"
                    style={{
                      minWidth: `${Math.max(previewWidth + 180, 640)}px`,
                      minHeight: `${Math.max(previewHeight + 180, 520)}px`,
                    }}
                  >
                    <div
                      className="relative"
                      style={{
                        transform: `translate(${artboardPan.x}px, ${artboardPan.y}px)`,
                        transition: pointerRef.current.mode === "pan-artboard" ? "none" : "transform 120ms ease",
                      }}
                    >
                  <canvas
                    ref={visibleCanvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onPointerLeave={() => setBrushPreviewPoint(null)}
                    onContextMenu={(event) => event.preventDefault()}
                    className={`touch-none border border-[var(--border)] shadow-xl ${
                      transparentArtboard ? "smart-photo-editor-transparent-canvas" : "bg-white"
                    }`}
                    style={{
                      width: `${previewWidth}px`,
                      maxWidth: "none",
                      cursor:
                        colorPickerTarget
                          ? "copy"
                          : spacePressedRef.current
                            ? "grab"
                            : activeTool === "hand"
                            ? "grab"
                            : activeTool === "select"
                            ? "default"
                            : activeTool === "text"
                              ? TEXT_TOOL_CURSOR
                              : "crosshair",
                    }}
                    />
                    {selectionActionBox && activeSelection?.path?.length && (
                      <div
                        className="absolute z-30 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white/95 px-2 py-2 shadow-xl backdrop-blur"
                        style={{
                          left: `${clampNumber((selectionActionBox.x / canvasSize.width) * previewWidth, 0, Math.max(0, previewWidth - 160))}px`,
                          top: `${Math.max(0, (selectionActionBox.y / canvasSize.width) * previewWidth - 46)}px`,
                        }}
                      >
                        <button
                          type="button"
                          onClick={copyCurrentSelectionAndHide}
                          className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-bold"
                        >
                          Copy Ctrl+C
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectionActionBox(null);
                            setActiveSelection(null);
                          }}
                          className="px-2 py-1.5 rounded-lg border border-[var(--border)] text-xs font-bold hover:bg-[#f8f4ff]"
                        >
                          Hide
                        </button>
                      </div>
                    )}
                    </div>
                  </div>
                </div>

                {isExporting && (
                  <div className="absolute top-4 left-1/2 z-40 w-[min(620px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-white/95 p-4 shadow-2xl backdrop-blur">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-sm font-bold">Creating your final design</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          Rendering layers, smoothing edges, and preparing download.
                        </p>
                      </div>
                      <span className="text-sm font-bold text-[var(--primary)]">{exportProgress}%</span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1e9ff]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),#22c55e)] transition-all duration-300"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white/95 px-2 py-2 shadow-xl backdrop-blur">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((current) => clampNumber(current - 0.1, 0.1, 8))}
                    className="w-10 h-10 rounded-xl border border-[var(--border)] hover:bg-[#f8f4ff] inline-flex items-center justify-center"
                    title="Zoom out"
                  >
                    <ZoomOut size={18} />
                  </button>

                  <span className="min-w-14 text-center text-xs font-bold text-[var(--text-secondary)]">
                    {Math.round(previewZoom * 100)}%
                  </span>

                  <button
                    type="button"
                    onClick={() => setPreviewZoom((current) => clampNumber(current + 0.1, 0.1, 8))}
                    className="w-10 h-10 rounded-xl border border-[var(--border)] hover:bg-[#f8f4ff] inline-flex items-center justify-center"
                    title="Zoom in"
                  >
                    <ZoomIn size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPreviewZoom(1);
                      setArtboardPan({ x: 0, y: 0 });
                    }}
                    className="h-10 rounded-xl border border-[var(--border)] px-3 text-xs font-bold hover:bg-[#f8f4ff]"
                    title="Reset zoom and artboard position"
                  >
                    100%
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        <div className="p-4 border-t border-[var(--border)] bg-white">
          <button
            type="button"
            onClick={resetTool}
            className="btn-secondary w-full inline-flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Reset Everything
          </button>
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-4">Edit Photos Online</h2>

        <div className="text-[var(--text-secondary)] leading-7 space-y-3">
          <p>
            Smart Photo Editor helps you choose a canvas size before uploading,
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

      {shapeSizeModal && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold">Insert Shape by Size</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Choose pixel or inch size. The selected shape will be placed exactly on the artboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShapeSizeModal(null)}
                className="h-9 w-9 rounded-xl border border-[var(--border)] inline-flex items-center justify-center hover:bg-[#f8f4ff]"
                aria-label="Close shape size box"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <label className="block col-span-1">
                <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Unit</span>
                <select
                  value={exactShapeUnit}
                  onChange={(event) => setExactShapeUnit(event.target.value)}
                  className="w-full h-11 rounded-xl border border-[var(--border)] bg-white px-3 outline-none focus:border-[var(--primary)]"
                >
                  <option value="px">px</option>
                  <option value="in">inch</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Width</span>
                <input
                  type="number"
                  min="1"
                  step={exactShapeUnit === "in" ? "0.1" : "1"}
                  value={exactShapeSize.width}
                  onChange={(event) => setExactShapeSize((current) => ({ ...current, width: Number(event.target.value) }))}
                  className="w-full h-11 rounded-xl border border-[var(--border)] bg-white px-3 outline-none focus:border-[var(--primary)]"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Height</span>
                <input
                  type="number"
                  min="1"
                  step={exactShapeUnit === "in" ? "0.1" : "1"}
                  value={exactShapeSize.height}
                  onChange={(event) => setExactShapeSize((current) => ({ ...current, height: Number(event.target.value) }))}
                  className="w-full h-11 rounded-xl border border-[var(--border)] bg-white px-3 outline-none focus:border-[var(--primary)]"
                />
              </label>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[#f8f4ff] p-3 text-xs text-[var(--text-secondary)] mb-4">
              Inch mode uses 300 pixels per inch for print-friendly sizing.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setShapeSizeModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={insertExactShapeBySize} className="btn-primary">
                Insert Shape
              </button>
            </div>
          </div>
        </div>
      )}

      <SuggestedTools currentToolId="smart-photo-editor" />
    </div>
  );
}

function PalettePreview({ start, end, angle }) {
  return (
    <span
      className="inline-block h-5 w-5 rounded-md border border-white shadow"
      style={{ background: `linear-gradient(${Number(angle || 0)}deg, ${start}, ${end})` }}
    />
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">
        {label}
      </span>
      <input
        type="number"
        value={Number.isFinite(Number(value)) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white outline-none focus:border-[var(--primary)] text-sm font-semibold"
      />
    </label>
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

function ColorInput({ label, value, onChange, disabled = false, onPick = null }) {
  const cleanColor = normalizeColor(value);

  async function copyHex() {
    try {
      await navigator.clipboard?.writeText?.(cleanColor);
    } catch {
      fallbackCopyText(cleanColor);
    }
  }

  return (
    <div className={`block ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-semibold block">{label}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copyHex}
            disabled={disabled}
            title={`Copy ${cleanColor}`}
            className="w-8 h-8 rounded-lg border border-[var(--border)] bg-white inline-flex items-center justify-center hover:bg-[#f8f4ff] disabled:cursor-not-allowed"
          >
            <Copy size={14} />
          </button>
          {onPick && (
            <button
              type="button"
              onClick={onPick}
              disabled={disabled}
              title="Pick color from image"
              className="w-8 h-8 rounded-lg border border-[var(--border)] bg-white inline-flex items-center justify-center hover:bg-[#f8f4ff] disabled:cursor-not-allowed"
            >
              <Pipette size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[54px_minmax(0,1fr)] gap-2">
        <input
          type="color"
          value={normalizeHexForInput(cleanColor)}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="w-full h-12 rounded-xl border border-[var(--border)] bg-white p-1 disabled:cursor-not-allowed"
          title={`Click to choose color or copy ${cleanColor}`}
        />
        <input
          type="text"
          value={cleanColor}
          onChange={(event) => {
            const nextValue = event.target.value.trim();
            if (/^#[0-9a-fA-F]{0,6}$/.test(nextValue)) {
              onChange(nextValue.length === 7 ? nextValue : cleanColor);
            }
          }}
          onClick={copyHex}
          disabled={disabled}
          title="Click to copy hex code"
          className="h-12 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-bold outline-none focus:border-[var(--primary)] disabled:cursor-not-allowed"
        />
      </div>
    </div>
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

function fillCanvasBackground(ctx, width, height, color = "#ffffff", gradient = null) {
  ctx.fillStyle = getFillStyle(ctx, color || "#ffffff", { x: 0, y: 0, w: width, h: height }, gradient);
  ctx.fillRect(0, 0, width, height);
}

function getFillStyle(ctx, fallbackColor, box, gradient = null) {
  if (!gradient?.start || !gradient?.end) return fallbackColor;

  const angle = ((Number(gradient.angle) || 0) * Math.PI) / 180;
  const centerX = box.x + box.w / 2;
  const centerY = box.y + box.h / 2;
  const length = Math.max(1, Math.hypot(box.w, box.h));
  const x1 = centerX - Math.cos(angle) * length / 2;
  const y1 = centerY - Math.sin(angle) * length / 2;
  const x2 = centerX + Math.cos(angle) * length / 2;
  const y2 = centerY + Math.sin(angle) * length / 2;

  const canvasGradient = ctx.createLinearGradient(x1, y1, x2, y2);
  canvasGradient.addColorStop(0, normalizeColor(gradient.start));
  canvasGradient.addColorStop(1, normalizeColor(gradient.end));

  return canvasGradient;
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function createSelectionPathFromBox(box, mode = "rectSelect") {
  const normalized = normalizeBox(box);

  if (mode === "ellipseSelect") {
    const path = [];
    const steps = 56;
    const centerX = normalized.x + normalized.w / 2;
    const centerY = normalized.y + normalized.h / 2;
    const radiusX = normalized.w / 2;
    const radiusY = normalized.h / 2;

    for (let index = 0; index < steps; index += 1) {
      const angle = (Math.PI * 2 * index) / steps;
      path.push({
        x: centerX + Math.cos(angle) * radiusX,
        y: centerY + Math.sin(angle) * radiusY,
      });
    }

    return path;
  }

  return [
    { x: normalized.x, y: normalized.y },
    { x: normalized.x + normalized.w, y: normalized.y },
    { x: normalized.x + normalized.w, y: normalized.y + normalized.h },
    { x: normalized.x, y: normalized.y + normalized.h },
  ];
}

function drawBackgroundLayer(ctx, objects, width, height, fallbackColor = "#ffffff") {
  const background = objects.find((object) => object.type === "background");

  if (background?.transparent) {
    return;
  }

  fillCanvasBackground(ctx, width, height, fallbackColor || "#ffffff");

  if (!background) return;

  const box = getObjectBox(background) || { x: 0, y: 0, w: width, h: height };

  ctx.save();
  ctx.globalAlpha = clampNumber(background.opacity ?? 1, 0, 1);
  ctx.fillStyle = background.color || fallbackColor || "#ffffff";
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.restore();
}

function drawObjects(ctx, objects) {
  objects.forEach((object) => {
    if (object.type === "background") return;
    drawObject(ctx, object);
  });
}

function drawObject(ctx, object) {
  if (!object) return;

  ctx.save();
  ctx.globalAlpha = object.opacity ?? 1;

  const rotation = Number(object.rotation || 0);
  const box = getObjectBox(object);

  if (rotation && box) {
    ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-(box.x + box.w / 2), -(box.y + box.h / 2));
  }

  if (object.type === "image") drawImageObject(ctx, object);
  if (object.type === "text") drawTextObject(ctx, object);
  if (object.type === "rectangle") drawRectangleObject(ctx, object);
  if (object.type === "triangle") drawTriangleObject(ctx, object);
  if (object.type === "circle") drawCircleObject(ctx, object);
  if (object.type === "star") drawStarObject(ctx, object);
  if (object.type === "hexagon") drawHexagonObject(ctx, object);
  if (object.type === "arrow") drawArrowObject(ctx, object);
  if (object.type === "crop-area") drawAreaBox(ctx, normalizeBox(object), "#22c55e", "Crop Area");
  if (object.type === "patch-target") drawAreaBox(ctx, normalizeBox(object), "#16a34a", "Patch Source");
  if (object.type === "clone-source") drawAreaBox(ctx, normalizeBox(object), "#9b6ce3", "Clone Source");

  ctx.restore();
}

function drawImageObject(ctx, object) {
  if (!object.element) return;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = object.keepQuality === false ? "medium" : "high";
  ctx.drawImage(object.element, object.x, object.y, object.w, object.h);
}

function drawTextObject(ctx, object) {
  const fontFamily = object.fontFamily || "Arial, sans-serif";
  const fontSize = Number(object.fontSize || 48);
  const fontWeight = Number(object.fontWeight || (object.bold ? 800 : 500));
  const hasBackground = object.hasBackground !== false;
  const textAlign = object.textAlign || "center";
  const paddingX = Math.max(10, fontSize * 0.35);
  const paddingY = Math.max(8, fontSize * 0.22);
  const boxWidth = Math.max(40, Number(object.w || 260));
  const boxHeight = Math.max(30, Number(object.h || fontSize * 1.45));
  const text = applyTextCase(object.text || "", object.textCase || "none");

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = textAlign;

  const maxTextWidth = Math.max(20, boxWidth - paddingX * 2);
  const lines = getWrappedTextLines(ctx, text, maxTextWidth);
  const lineHeight = fontSize * 1.18;
  const totalTextHeight = lines.length * lineHeight;
  const firstLineY = object.y + boxHeight / 2 - totalTextHeight / 2 + lineHeight / 2;

  if (hasBackground) {
    ctx.shadowColor = "transparent";
    ctx.fillStyle = getFillStyle(ctx, object.background || "#111827", {
      x: object.x,
      y: object.y,
      w: boxWidth,
      h: boxHeight,
    }, object.backgroundGradient);
    roundRect(ctx, object.x, object.y, boxWidth, boxHeight, fontSize * 0.22);
    ctx.fill();
  }

  if (object.shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.32)";
    ctx.shadowBlur = fontSize * 0.22;
    ctx.shadowOffsetY = fontSize * 0.08;
  } else {
    ctx.shadowColor = "transparent";
  }

  ctx.fillStyle = object.color || "#ffffff";

  const textX =
    textAlign === "left"
      ? object.x + paddingX
      : textAlign === "right"
        ? object.x + boxWidth - paddingX
        : object.x + boxWidth / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, textX, firstLineY + index * lineHeight);
  });

  ctx.shadowColor = "transparent";
  ctx.textAlign = "left";
}

function drawRectangleObject(ctx, object) {
  const box = normalizeBox(object);

  if (object.fillEnabled !== false) {
    ctx.fillStyle = getFillStyle(ctx, object.fill || "rgba(239,68,68,0.12)", box, object.fillGradient);
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
    ctx.fillStyle = getFillStyle(ctx, object.fill || "rgba(239,68,68,0.12)", box, object.fillGradient);
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

function drawTriangleObject(ctx, object) {
  const box = normalizeBox(object);
  const points = [
    { x: box.x + box.w / 2, y: box.y },
    { x: box.x + box.w, y: box.y + box.h },
    { x: box.x, y: box.y + box.h },
  ];

  drawPolygonShape(ctx, object, points);
}

function drawStarObject(ctx, object) {
  const box = normalizeBox(object);
  const centerX = box.x + box.w / 2;
  const centerY = box.y + box.h / 2;
  const outerRadius = Math.max(1, Math.min(box.w, box.h) / 2);
  const innerRadius = outerRadius * 0.45;
  const points = [];

  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;

    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }

  drawPolygonShape(ctx, object, points);
}

function drawHexagonObject(ctx, object) {
  const box = normalizeBox(object);
  const centerX = box.x + box.w / 2;
  const centerY = box.y + box.h / 2;
  const radiusX = Math.max(1, box.w / 2);
  const radiusY = Math.max(1, box.h / 2);
  const points = [];

  for (let index = 0; index < 6; index += 1) {
    const angle = Math.PI / 6 + (index * Math.PI) / 3;

    points.push({
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
    });
  }

  drawPolygonShape(ctx, object, points);
}

function drawPolygonShape(ctx, object, points) {
  if (!points.length) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.closePath();

  if (object.fillEnabled !== false) {
    const box = getPathBox(points);
    ctx.fillStyle = getFillStyle(ctx, object.fill || "#ef4444", box, object.fillGradient);
    ctx.fill();
  }

  if (object.strokeEnabled !== false) {
    ctx.strokeStyle = object.stroke || "#ef4444";
    ctx.lineWidth = object.strokeWidth || 6;
    ctx.stroke();
  }
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

function applyEraserBrush(canvas, fromPoint, toPoint, options) {
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.globalAlpha = clampNumber(options.opacity ?? 1, 0.05, 1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1, Number(options.size || 20));
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

function applyPatchFromSource({ canvas, sourceBox, targetBox, targetSelection = null, opacity, feather }) {
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

  if (targetSelection?.path?.length) {
    maskCanvasWithSelectionPath(temp, targetSelection.path, targetSelection.box);
  }

  if (safeFeather > 0) {
    softenCanvasEdges(temp, safeFeather);
  }

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(temp, target.x, target.y, target.w, target.h);
  ctx.restore();
}

function applyCloneAreaFromSource({ canvas, sourceBox, targetBox, sourceSelection = null, opacity, feather }) {
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

  if (sourceSelection?.path?.length) {
    maskCanvasWithSelectionPath(temp, sourceSelection.path, sourceSelection.box);
  }

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

  const customLines = guideInfo.guideLines || [];

  if (customLines.length) {
    customLines.forEach((line) => {
      ctx.beginPath();

      if (line.type === "vertical") {
        ctx.moveTo(line.value, line.start ?? 0);
        ctx.lineTo(line.value, line.end ?? height);
      }

      if (line.type === "horizontal") {
        ctx.moveTo(line.start ?? 0, line.value);
        ctx.lineTo(line.end ?? width, line.value);
      }

      ctx.stroke();
    });
  } else {
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

  if (box.x < 0 || box.y < 0 || box.x + box.w > ctx.canvas.width || box.y + box.h > ctx.canvas.height) {
    const visibleBox = {
      x: clampNumber(box.x, 1, ctx.canvas.width - 2),
      y: clampNumber(box.y, 1, ctx.canvas.height - 2),
      w: clampNumber(box.w, 1, ctx.canvas.width - clampNumber(box.x, 1, ctx.canvas.width - 2) - 1),
      h: clampNumber(box.h, 1, ctx.canvas.height - clampNumber(box.y, 1, ctx.canvas.height - 2) - 1),
    };
    ctx.strokeStyle = "rgba(155,108,227,0.55)";
    ctx.strokeRect(visibleBox.x, visibleBox.y, visibleBox.w, visibleBox.h);
    ctx.strokeStyle = "#9b6ce3";
  }

  ctx.setLineDash([]);

  ctx.fillStyle = color;
  ctx.font = "700 18px Arial, sans-serif";
  ctx.fillText(label, box.x + 8, box.y + 8);
  ctx.restore();
}

function drawFreeSelection(ctx, path, color = "#0ea5e9", label = "Selection") {
  if (!path?.length) return;

  const box = getPathBox(path);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = "rgba(14,165,233,0.12)";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 6]);

  ctx.beginPath();
  path.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });

  if (path.length > 2) ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = color;
  ctx.font = "700 16px Arial, sans-serif";
  ctx.fillText(label, box.x + 8, Math.max(18, box.y - 8));
  ctx.restore();
}

function drawBrushPreview(ctx, point, size, color, opacity = 1) {
  if (!point) return;

  ctx.save();
  ctx.strokeStyle = color || "#ef4444";
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.globalAlpha = Math.max(0.35, opacity);
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.arc(point.x, point.y, Math.max(2, size / 2), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawMarqueeSelection(ctx, box) {
  if (!box) return;

  const normalized = normalizeBox(box);

  ctx.save();
  ctx.fillStyle = "rgba(155,108,227,0.12)";
  ctx.strokeStyle = "#9b6ce3";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.fillRect(normalized.x, normalized.y, normalized.w, normalized.h);
  ctx.strokeRect(normalized.x, normalized.y, normalized.w, normalized.h);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawSelectionBox(ctx, object) {
  const box = getObjectBox(object);

  if (!box) return;

  const canvasWidth = ctx.canvas?.width || box.x + box.w;
  const canvasHeight = ctx.canvas?.height || box.y + box.h;
  const handleSize = clampNumber(Math.min(Math.abs(box.w), Math.abs(box.h)) * 0.075, 24, 48);
  const visibleBox = getCanvasVisibleBox(box, canvasWidth, canvasHeight);

  ctx.save();
  ctx.strokeStyle = "#9b6ce3";
  ctx.lineWidth = 4;
  ctx.setLineDash([9, 6]);
  ctx.strokeRect(box.x, box.y, box.w, box.h);

  if (visibleBox && boxIsPartlyOutsideCanvas(box, canvasWidth, canvasHeight)) {
    ctx.strokeStyle = "rgba(155,108,227,0.68)";
    ctx.strokeRect(visibleBox.x, visibleBox.y, visibleBox.w, visibleBox.h);
    ctx.strokeStyle = "#9b6ce3";
  }

  ctx.setLineDash([]);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#9b6ce3";

  const handles = getVisibleBoxHandles(box, handleSize, canvasWidth, canvasHeight);
  handles.forEach((handle) => drawHandle(ctx, handle.x, handle.y, handleSize, handle.id));

  if (visibleBox && boxIsPartlyOutsideCanvas(box, canvasWidth, canvasHeight)) {
    drawVisibleEdgeHandles(ctx, visibleBox, handleSize);
  }

  ctx.restore();
}

function drawGroupSelectionBox(ctx, objects) {
  const box = getGroupBox(objects);

  if (!box) return;

  const canvasWidth = ctx.canvas?.width || box.x + box.w;
  const canvasHeight = ctx.canvas?.height || box.y + box.h;
  const handleSize = clampNumber(Math.min(Math.abs(box.w), Math.abs(box.h)) * 0.07, 24, 50);
  const visibleBox = getCanvasVisibleBox(box, canvasWidth, canvasHeight);

  ctx.save();
  ctx.strokeStyle = "#9b6ce3";
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 7]);
  ctx.strokeRect(box.x, box.y, box.w, box.h);

  if (visibleBox && boxIsPartlyOutsideCanvas(box, canvasWidth, canvasHeight)) {
    ctx.strokeStyle = "rgba(155,108,227,0.68)";
    ctx.strokeRect(visibleBox.x, visibleBox.y, visibleBox.w, visibleBox.h);
    ctx.strokeStyle = "#9b6ce3";
  }

  ctx.setLineDash([]);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#9b6ce3";

  const handles = getVisibleBoxHandles(box, handleSize, canvasWidth, canvasHeight);
  handles.forEach((handle) => drawHandle(ctx, handle.x, handle.y, handleSize, handle.id));

  if (visibleBox && boxIsPartlyOutsideCanvas(box, canvasWidth, canvasHeight)) {
    drawVisibleEdgeHandles(ctx, visibleBox, handleSize);
  }

  ctx.fillStyle = "#111827";
  ctx.font = "700 15px Arial, sans-serif";
  ctx.fillText(`${objects.length} items selected`, clampNumber(visibleBox?.x ?? box.x, 8, canvasWidth - 150), clampNumber((visibleBox?.y ?? box.y) - 10, 18, canvasHeight - 8));
  ctx.restore();
}

function boxIsPartlyOutsideCanvas(box, canvasWidth, canvasHeight) {
  return box.x < 0 || box.y < 0 || box.x + box.w > canvasWidth || box.y + box.h > canvasHeight;
}

function getCanvasVisibleBox(box, canvasWidth, canvasHeight) {
  const x1 = clampNumber(box.x, 1, Math.max(1, canvasWidth - 1));
  const y1 = clampNumber(box.y, 1, Math.max(1, canvasHeight - 1));
  const x2 = clampNumber(box.x + box.w, 1, Math.max(1, canvasWidth - 1));
  const y2 = clampNumber(box.y + box.h, 1, Math.max(1, canvasHeight - 1));
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.max(1, Math.abs(x2 - x1));
  const height = Math.max(1, Math.abs(y2 - y1));

  return { x: left, y: top, w: width, h: height };
}

function drawVisibleEdgeHandles(ctx, box, size) {
  const cornerSize = clampNumber(size * 1.05, 22, 42);
  const edgeHandles = [
    { id: "nw", x: box.x, y: box.y },
    { id: "n", x: box.x + box.w / 2, y: box.y },
    { id: "ne", x: box.x + box.w, y: box.y },
    { id: "e", x: box.x + box.w, y: box.y + box.h / 2 },
    { id: "se", x: box.x + box.w, y: box.y + box.h },
    { id: "s", x: box.x + box.w / 2, y: box.y + box.h },
    { id: "sw", x: box.x, y: box.y + box.h },
    { id: "w", x: box.x, y: box.y + box.h / 2 },
  ];

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 3;
  edgeHandles.forEach((handle) => drawHandle(ctx, handle.x, handle.y, cornerSize, handle.id));
  ctx.restore();
}

function drawHandle(ctx, x, y, size, id = "") {
  const isSide = ["n", "e", "s", "w"].includes(id);
  const width = isSide && (id === "n" || id === "s") ? size * 1.55 : size;
  const height = isSide && (id === "e" || id === "w") ? size * 1.55 : size;
  const radius = Math.min(10, Math.min(width, height) * 0.28);

  ctx.save();
  ctx.shadowColor = "rgba(124,58,237,0.34)";
  ctx.shadowBlur = Math.max(6, size * 0.22);
  ctx.lineWidth = Math.max(4, size * 0.16);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#8b5cf6";

  roundedRectPath(ctx, x - width / 2, y - height / 2, width, height, radius);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#8b5cf6";
  ctx.font = `900 ${Math.max(12, Math.round(size * 0.52))}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const arrows = {
    n: "↕",
    s: "↕",
    e: "↔",
    w: "↔",
    nw: "↖",
    ne: "↗",
    sw: "↙",
    se: "↘",
  };

  ctx.fillText(arrows[id] || "", x, y + 1);
  ctx.restore();
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const safeRadius = Math.max(0, Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2));

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

function getObjectAtPoint(point, objects) {
  for (let i = objects.length - 1; i >= 0; i -= 1) {
    if (objects[i]?.type === "background") continue;
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

  if (object.type === "background") {
    return {
      x: Number.isFinite(Number(object.x)) ? Number(object.x) : 0,
      y: Number.isFinite(Number(object.y)) ? Number(object.y) : 0,
      w: Math.max(1, Number(object.w || 1)),
      h: Math.max(1, Number(object.h || 1)),
    };
  }

  if (object.type === "image") {
    return {
      x: object.x,
      y: object.y,
      w: object.w,
      h: object.h,
    };
  }

  if (object.type === "text") {
    return {
      x: object.x,
      y: object.y,
      w: Math.max(40, Number(object.w || 260)),
      h: Math.max(30, Number(object.h || Number(object.fontSize || 48) * 1.45)),
    };
  }

  if (["rectangle", "triangle", "circle", "star", "hexagon"].includes(object.type)) {
    return normalizeBox(object);
  }

  if (object.type === "patch-target" || object.type === "clone-source" || object.type === "crop-area") {
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

function getLayerDisplayName(item, index = 0) {
  if (!item) return `Layer ${index + 1}`;

  if (item.isBaseImage) return item.name || "Base Photo";
  if (item.type === "image") return item.name || `Image Layer ${index + 1}`;
  if (item.type === "text") {
    const text = String(item.text || "Text").trim();
    return text ? `Text: ${text.slice(0, 28)}` : `Text Layer ${index + 1}`;
  }
  if (item.type === "rectangle") return `Rectangle ${index + 1}`;
  if (item.type === "triangle") return `Triangle ${index + 1}`;
  if (item.type === "circle") return `Circle ${index + 1}`;
  if (item.type === "star") return `Star ${index + 1}`;
  if (item.type === "hexagon") return `Hexagon ${index + 1}`;
  if (item.type === "arrow") return `Arrow ${index + 1}`;

  return `${item.type || "Layer"} ${index + 1}`;
}

function moveObject(object, dx, dy) {
  if (object.type === "background") {
    return {
      ...object,
      x: Number(object.x || 0) + dx,
      y: Number(object.y || 0) + dy,
    };
  }

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

  if (object.type === "background") {
    return {
      ...object,
      x: Number(object.x || 0) * scaleX,
      y: Number(object.y || 0) * scaleY,
      w: Number(object.w || 1) * scaleX,
      h: Number(object.h || 1) * scaleY,
    };
  }

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
      w: Number(object.w || 260) * scaleX,
      h: Number(object.h || 80) * scaleY,
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
    object.type === "triangle" ||
    object.type === "circle" ||
    object.type === "star" ||
    object.type === "hexagon" ||
    object.type === "patch-target" ||
    object.type === "clone-source" ||
    object.type === "crop-area"
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

function addPointToFreeSelection(selection, point) {
  const path = [...(selection.path || []), point];
  return normalizeFreeSelection({ ...selection, path });
}

function normalizeFreeSelection(selection) {
  const path = (selection?.path || []).map((point) => ({ x: point.x, y: point.y }));
  return {
    ...selection,
    path,
    box: getPathBox(path),
  };
}

function cloneFreeSelection(selection) {
  if (!selection) return null;
  return normalizeFreeSelection({
    ...selection,
    id: selection.id,
    path: (selection.path || []).map((point) => ({ x: point.x, y: point.y })),
  });
}

function moveFreeSelection(selection, dx, dy) {
  return normalizeFreeSelection({
    ...selection,
    path: (selection.path || []).map((point) => ({
      x: point.x + dx,
      y: point.y + dy,
    })),
  });
}

function getPathBox(path) {
  if (!path?.length) return { x: 0, y: 0, w: 1, h: 1 };

  const xs = path.map((point) => point.x);
  const ys = path.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    w: Math.max(1, maxX - minX),
    h: Math.max(1, maxY - minY),
  };
}

function translatePoint(point, dx, dy) {
  return {
    x: point.x + dx,
    y: point.y + dy,
  };
}

function translateDraftObject(object, dx, dy) {
  if (!object) return object;

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

async function createSelectionImageFromCanvas(sourceCanvas, selection) {
  const box = clampBoxToCanvas(selection.box, sourceCanvas);
  const temp = document.createElement("canvas");
  temp.width = Math.max(1, Math.round(box.w));
  temp.height = Math.max(1, Math.round(box.h));

  const tempCtx = temp.getContext("2d");
  tempCtx.drawImage(sourceCanvas, box.x, box.y, box.w, box.h, 0, 0, temp.width, temp.height);
  maskCanvasWithSelectionPath(temp, selection.path, box);

  return {
    src: temp.toDataURL("image/png"),
    width: temp.width,
    height: temp.height,
  };
}

function createSelectionImageFromBox(sourceCanvas, box) {
  const cropBox = clampBoxToCanvas(box, sourceCanvas);
  const temp = document.createElement("canvas");
  temp.width = Math.max(1, Math.round(cropBox.w));
  temp.height = Math.max(1, Math.round(cropBox.h));

  const tempCtx = temp.getContext("2d");
  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = "high";
  tempCtx.drawImage(
    sourceCanvas,
    cropBox.x,
    cropBox.y,
    cropBox.w,
    cropBox.h,
    0,
    0,
    temp.width,
    temp.height
  );

  return {
    src: temp.toDataURL("image/png"),
    width: temp.width,
    height: temp.height,
  };
}

function maskCanvasWithSelectionPath(canvas, path, sourceBox) {
  if (!path?.length) return;

  const ctx = canvas.getContext("2d");
  const scaleX = canvas.width / Math.max(1, sourceBox.w);
  const scaleY = canvas.height / Math.max(1, sourceBox.h);

  const mask = document.createElement("canvas");
  mask.width = canvas.width;
  mask.height = canvas.height;

  const maskCtx = mask.getContext("2d");
  maskCtx.fillStyle = "#000";
  maskCtx.beginPath();

  path.forEach((point, index) => {
    const x = (point.x - sourceBox.x) * scaleX;
    const y = (point.y - sourceBox.y) * scaleY;

    if (index === 0) maskCtx.moveTo(x, y);
    else maskCtx.lineTo(x, y);
  });

  maskCtx.closePath();
  maskCtx.fill();

  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0);
  ctx.restore();
}

async function hydrateCopiedObject(object) {
  const copy = cloneObject(object);
  copy.id = createId();

  if (copy.type === "image" && copy.src) {
    copy.element = await loadImage(copy.src);
  }

  return copy;
}

function offsetCopiedObject(object, dx, dy) {
  if (object.type === "arrow") {
    return {
      ...object,
      id: createId(),
      x1: object.x1 + dx,
      y1: object.y1 + dy,
      x2: object.x2 + dx,
      y2: object.y2 + dy,
    };
  }

  return {
    ...object,
    id: createId(),
    x: object.x + dx,
    y: object.y + dy,
  };
}

function distanceBetweenPoints(a, b) {
  if (!a || !b) return 0;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function boxesIntersect(a, b) {
  if (!a || !b) return false;

  return !(
    b.x > a.x + a.w ||
    b.x + b.w < a.x ||
    b.y > a.y + a.h ||
    b.y + b.h < a.y
  );
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

function isShapeObjectType(type) {
  return ["rectangle", "triangle", "circle", "star", "hexagon", "arrow"].includes(type);
}

function getResizeHandleAtPoint(point, object, zoom = 1, canvasSize = null) {
  if (!point || !object) return null;

  if (!["image", "text", "rectangle", "triangle", "circle", "star", "hexagon", "arrow"].includes(object.type)) {
    return null;
  }

  return getResizeHandleAtBox(point, getObjectBox(object), zoom, canvasSize);
}

function getResizeHandleAtBox(point, box, zoom = 1, canvasSize = null) {
  if (!point || !box) return null;

  const hitSize = Math.max(28, 42 / Math.max(0.25, Number(zoom) || 1));
  const canvasWidth = canvasSize?.width || box.x + box.w;
  const canvasHeight = canvasSize?.height || box.y + box.h;
  const handles = getVisibleBoxHandles(box, hitSize, canvasWidth, canvasHeight);

  const found = handles.find(
    (handle) =>
      Math.abs(point.x - handle.x) <= hitSize &&
      Math.abs(point.y - handle.y) <= hitSize
  );

  return found?.id || null;
}

function getVisibleBoxHandles(box, handleSize = 10, canvasWidth = Infinity, canvasHeight = Infinity) {
  const safeHandleSize = clampNumber(handleSize, 22, 52);
  const edgePadding = Math.max(12, safeHandleSize * 0.8);
  const minX = Number.isFinite(canvasWidth) ? edgePadding : box.x;
  const minY = Number.isFinite(canvasHeight) ? edgePadding : box.y;
  const maxX = Number.isFinite(canvasWidth) ? Math.max(edgePadding, canvasWidth - edgePadding) : box.x + box.w;
  const maxY = Number.isFinite(canvasHeight) ? Math.max(edgePadding, canvasHeight - edgePadding) : box.y + box.h;
  const left = box.x;
  const centerX = box.x + box.w / 2;
  const right = box.x + box.w;
  const top = box.y;
  const centerY = box.y + box.h / 2;
  const bottom = box.y + box.h;

  return [
    { id: "nw", x: clampNumber(left, minX, maxX), y: clampNumber(top, minY, maxY) },
    { id: "n", x: clampNumber(centerX, minX, maxX), y: clampNumber(top, minY, maxY) },
    { id: "ne", x: clampNumber(right, minX, maxX), y: clampNumber(top, minY, maxY) },
    { id: "e", x: clampNumber(right, minX, maxX), y: clampNumber(centerY, minY, maxY) },
    { id: "se", x: clampNumber(right, minX, maxX), y: clampNumber(bottom, minY, maxY) },
    { id: "s", x: clampNumber(centerX, minX, maxX), y: clampNumber(bottom, minY, maxY) },
    { id: "sw", x: clampNumber(left, minX, maxX), y: clampNumber(bottom, minY, maxY) },
    { id: "w", x: clampNumber(left, minX, maxX), y: clampNumber(centerY, minY, maxY) },
  ];
}

function getGroupBox(objects) {
  const boxes = (objects || []).map(getObjectBox).filter(Boolean);

  if (!boxes.length) return null;

  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.w));
  const maxY = Math.max(...boxes.map((box) => box.y + box.h));

  return {
    x: minX,
    y: minY,
    w: Math.max(1, maxX - minX),
    h: Math.max(1, maxY - minY),
  };
}

function transformObjectInGroup(object, startGroupBox, nextGroupBox) {
  const objectBox = getObjectBox(object);

  if (!objectBox || !startGroupBox) return object;

  const scaleX = nextGroupBox.w / Math.max(1, startGroupBox.w);
  const scaleY = nextGroupBox.h / Math.max(1, startGroupBox.h);

  const nextBox = {
    x: nextGroupBox.x + (objectBox.x - startGroupBox.x) * scaleX,
    y: nextGroupBox.y + (objectBox.y - startGroupBox.y) * scaleY,
    w: Math.max(1, objectBox.w * scaleX),
    h: Math.max(1, objectBox.h * scaleY),
  };

  return resizeObjectToBox(object, nextBox);
}


function resizeBoxFromHandle(startBox, point, handle, { keepRatio = false, fromCenter = false } = {}) {
  const minSize = 12;

  if (fromCenter) {
    const centerX = startBox.x + startBox.w / 2;
    const centerY = startBox.y + startBox.h / 2;
    const affectsWidth = handle.includes("e") || handle.includes("w");
    const affectsHeight = handle.includes("n") || handle.includes("s");

    let halfW = affectsWidth
      ? Math.max(minSize / 2, Math.abs(point.x - centerX))
      : Math.max(minSize / 2, startBox.w / 2);

    let halfH = affectsHeight
      ? Math.max(minSize / 2, Math.abs(point.y - centerY))
      : Math.max(minSize / 2, startBox.h / 2);

    if ((handle === "n" || handle === "s") && !keepRatio) {
      halfW = Math.max(minSize / 2, startBox.w / 2);
    }

    if ((handle === "e" || handle === "w") && !keepRatio) {
      halfH = Math.max(minSize / 2, startBox.h / 2);
    }

    if (keepRatio && startBox.w > 0 && startBox.h > 0) {
      const scale = Math.max(
        halfW / Math.max(1, startBox.w / 2),
        halfH / Math.max(1, startBox.h / 2)
      );

      halfW = Math.max(minSize / 2, (startBox.w / 2) * scale);
      halfH = Math.max(minSize / 2, (startBox.h / 2) * scale);
    }

    return {
      x: centerX - halfW,
      y: centerY - halfH,
      w: halfW * 2,
      h: halfH * 2,
    };
  }

  const right = startBox.x + startBox.w;
  const bottom = startBox.y + startBox.h;
  let x = startBox.x;
  let y = startBox.y;
  let w = startBox.w;
  let h = startBox.h;

  if (handle === "nw") {
    x = Math.min(point.x, right - minSize);
    y = Math.min(point.y, bottom - minSize);
    w = right - x;
    h = bottom - y;
  }

  if (handle === "n") {
    y = Math.min(point.y, bottom - minSize);
    h = bottom - y;
  }

  if (handle === "ne") {
    y = Math.min(point.y, bottom - minSize);
    w = Math.max(minSize, point.x - startBox.x);
    h = bottom - y;
  }

  if (handle === "e") {
    w = Math.max(minSize, point.x - startBox.x);
  }

  if (handle === "sw") {
    x = Math.min(point.x, right - minSize);
    w = right - x;
    h = Math.max(minSize, point.y - startBox.y);
  }

  if (handle === "s") {
    h = Math.max(minSize, point.y - startBox.y);
  }

  if (handle === "se") {
    w = Math.max(minSize, point.x - startBox.x);
    h = Math.max(minSize, point.y - startBox.y);
  }

  if (handle === "w") {
    x = Math.min(point.x, right - minSize);
    w = right - x;
  }

  if (keepRatio && startBox.w > 0 && startBox.h > 0) {
    const ratio = startBox.w / startBox.h;
    const scale = Math.max(w / startBox.w, h / startBox.h);
    w = Math.max(minSize, startBox.w * scale);
    h = Math.max(minSize, w / ratio);

    if (handle === "n" || handle === "s") {
      w = Math.max(minSize, h * ratio);
      x = startBox.x + (startBox.w - w) / 2;
    }

    if (handle === "e" || handle === "w") {
      h = Math.max(minSize, w / ratio);
      y = startBox.y + (startBox.h - h) / 2;
    }

    if (handle.includes("n")) y = bottom - h;
    if (handle.includes("w")) x = right - w;
  }

  return { x, y, w, h };
}

function resizeObjectToBox(object, box) {
  const startBox = getObjectBox(object) || box;

  if (object.type === "background") {
    return {
      ...object,
      x: Number.isFinite(Number(box.x)) ? box.x : 0,
      y: Number.isFinite(Number(box.y)) ? box.y : 0,
      w: Math.max(1, box.w),
      h: Math.max(1, box.h),
    };
  }

  if (object.type === "text") {
    const scaleX = box.w / Math.max(1, startBox.w);
    const scaleY = box.h / Math.max(1, startBox.h);
    const scale = Math.max(scaleX, scaleY);

    return {
      ...object,
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      fontSize: clampNumber(Number(object.fontSize || 48) * scale, 8, 500),
    };
  }

  if (object.type === "image") {
    return {
      ...object,
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
    };
  }

  if (["rectangle", "triangle", "circle", "star", "hexagon"].includes(object.type)) {
    return {
      ...object,
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
    };
  }

  if (object.type === "arrow") {
    const startBox = getObjectBox(object) || box;
    const scaleX = box.w / Math.max(1, startBox.w || 1);
    const scaleY = box.h / Math.max(1, startBox.h || 1);

    return {
      ...object,
      x1: box.x + (object.x1 - startBox.x) * scaleX,
      y1: box.y + (object.y1 - startBox.y) * scaleY,
      x2: box.x + (object.x2 - startBox.x) * scaleX,
      y2: box.y + (object.y2 - startBox.y) * scaleY,
    };
  }

  return object;
}

function clampBoxToCanvas(box, canvas) {
  const x = clampNumber(box.x, 0, Math.max(0, canvas.width - 1));
  const y = clampNumber(box.y, 0, Math.max(0, canvas.height - 1));
  const w = clampNumber(box.w, 1, Math.max(1, canvas.width - x));
  const h = clampNumber(box.h, 1, Math.max(1, canvas.height - y));

  return { x, y, w, h };
}

function snapBoxToGuides(box, canvasSize, referenceBoxes = []) {
  const resultBox = { ...box };
  const guideLines = [];
  let centerX = false;
  let centerY = false;
  let message = "";

  const canvasCenterX = canvasSize.width / 2;
  const canvasCenterY = canvasSize.height / 2;

  function snapVertical(targetValue, nextX, label = "Aligned") {
    resultBox.x = nextX;
    centerX = true;
    message = label;
    guideLines.push({ type: "vertical", value: targetValue, label });
  }

  function snapHorizontal(targetValue, nextY, label = "Aligned") {
    resultBox.y = nextY;
    centerY = true;
    message = label;
    guideLines.push({ type: "horizontal", value: targetValue, label });
  }

  const boxCenterX = box.x + box.w / 2;
  const boxCenterY = box.y + box.h / 2;

  if (Math.abs(boxCenterX - canvasCenterX) <= SNAP_DISTANCE) {
    snapVertical(canvasCenterX, canvasCenterX - box.w / 2, "Canvas vertical center");
  }

  if (Math.abs(boxCenterY - canvasCenterY) <= SNAP_DISTANCE) {
    snapHorizontal(canvasCenterY, canvasCenterY - box.h / 2, "Canvas horizontal center");
  }

  referenceBoxes.forEach((referenceBox) => {
    const refCenterX = referenceBox.x + referenceBox.w / 2;
    const refCenterY = referenceBox.y + referenceBox.h / 2;

    const verticalCandidates = [
      { value: referenceBox.x, nextX: referenceBox.x, label: "Left edges aligned" },
      { value: referenceBox.x + referenceBox.w, nextX: referenceBox.x + referenceBox.w - box.w, label: "Right edges aligned" },
      { value: refCenterX, nextX: refCenterX - box.w / 2, label: "Object vertical center" },
    ];

    const horizontalCandidates = [
      { value: referenceBox.y, nextY: referenceBox.y, label: "Top edges aligned" },
      { value: referenceBox.y + referenceBox.h, nextY: referenceBox.y + referenceBox.h - box.h, label: "Bottom edges aligned" },
      { value: refCenterY, nextY: refCenterY - box.h / 2, label: "Object horizontal center" },
    ];

    if (!centerX) {
      const match = verticalCandidates.find((candidate) =>
        Math.abs((candidate.label.includes("Right") ? box.x + box.w : candidate.label.includes("center") || candidate.label.includes("Center") ? boxCenterX : box.x) - candidate.value) <= SNAP_DISTANCE
      );

      if (match) {
        snapVertical(match.value, match.nextX, match.label);
      }
    }

    if (!centerY) {
      const match = horizontalCandidates.find((candidate) =>
        Math.abs((candidate.label.includes("Bottom") ? box.y + box.h : candidate.label.includes("center") || candidate.label.includes("Center") ? boxCenterY : box.y) - candidate.value) <= SNAP_DISTANCE
      );

      if (match) {
        snapHorizontal(match.value, match.nextY, match.label);
      }
    }

    if (Math.abs(box.w - referenceBox.w) <= SNAP_DISTANCE) {
      resultBox.w = referenceBox.w;
      message = message || "Matched width";
      guideLines.push({
        type: "horizontal",
        value: referenceBox.y + referenceBox.h + 10,
        start: referenceBox.x,
        end: referenceBox.x + referenceBox.w,
        label: "Same width",
      });
    }

    if (Math.abs(box.h - referenceBox.h) <= SNAP_DISTANCE) {
      resultBox.h = referenceBox.h;
      message = message || "Matched height";
      guideLines.push({
        type: "vertical",
        value: referenceBox.x + referenceBox.w + 10,
        start: referenceBox.y,
        end: referenceBox.y + referenceBox.h,
        label: "Same height",
      });
    }
  });

  if (!message) {
    if (centerX && centerY) message = "Center aligned";
    else if (centerX) message = "Vertical aligned";
    else if (centerY) message = "Horizontal aligned";
  }

  return {
    box: resultBox,
    centerX,
    centerY,
    guideLines,
    message,
  };
}

function buildGuideInfo(box, canvasSize, message = "", snapResult = null) {
  if (!box) return null;

  const boxCenterX = box.x + box.w / 2;
  const boxCenterY = box.y + box.h / 2;

  const centerX =
    snapResult?.centerX ||
    Math.abs(boxCenterX - canvasSize.width / 2) <= SNAP_DISTANCE;
  const centerY =
    snapResult?.centerY ||
    Math.abs(boxCenterY - canvasSize.height / 2) <= SNAP_DISTANCE;

  const guideLines = snapResult?.guideLines || [];

  return {
    box,
    centerX,
    centerY,
    guideLines,
    message: snapResult?.message || message,
  };
}

function isValidObject(object) {
  if (!object) return false;

  if (["rectangle", "triangle", "circle", "star", "hexagon"].includes(object.type)) {
    return object.w > 8 && object.h > 8;
  }

  if (object.type === "arrow") {
    return Math.hypot(object.x2 - object.x1, object.y2 - object.y1) > 12;
  }

  return true;
}

function resizeCanvas(sourceCanvas, width, height, keepQuality = true) {
  const targetWidth = Math.max(1, Math.round(width));
  const targetHeight = Math.max(1, Math.round(height));

  function drawScaled(source, nextWidth, nextHeight, quality = "high") {
    const nextCanvas = document.createElement("canvas");
    nextCanvas.width = Math.max(1, Math.round(nextWidth));
    nextCanvas.height = Math.max(1, Math.round(nextHeight));

    const nextContext = nextCanvas.getContext("2d");
    nextContext.imageSmoothingEnabled = true;
    nextContext.imageSmoothingQuality = quality === "medium" ? "medium" : "high";
    nextContext.drawImage(source, 0, 0, nextCanvas.width, nextCanvas.height);
    return nextCanvas;
  }

  if (!keepQuality) {
    return drawScaled(sourceCanvas, targetWidth, targetHeight, "medium");
  }

  let currentCanvas = sourceCanvas;

  // Progressive downscaling avoids throwing away too many pixels in one pass.
  while (
    currentCanvas.width > targetWidth * 2 ||
    currentCanvas.height > targetHeight * 2
  ) {
    const nextWidth = Math.max(targetWidth, Math.round(currentCanvas.width / 2));
    const nextHeight = Math.max(targetHeight, Math.round(currentCanvas.height / 2));
    currentCanvas = drawScaled(currentCanvas, nextWidth, nextHeight, "high");
  }

  return drawScaled(currentCanvas, targetWidth, targetHeight, "high");
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

function getImageFitBox({ imageWidth, imageHeight, canvasWidth, canvasHeight }) {
  const scale = Math.min(
    canvasWidth / Math.max(1, imageWidth),
    canvasHeight / Math.max(1, imageHeight),
    1
  );

  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    x: canvasWidth / 2 - width / 2,
    y: canvasHeight / 2 - height / 2,
    w: width,
    h: height,
  };
}

function getInitialPreviewZoom(size) {
  const width = Number(size?.width || 1200);
  const height = Number(size?.height || 630);
  const scale = Math.min(1, 760 / Math.max(width, height), 560 / Math.max(1, height));

  return clampNumber(scale, 0.25, 1);
}

function supportsTransparentFormat(fileType) {
  return ["image/png", "image/webp", "image/gif", "image/avif"].includes(fileType);
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

function lockDragAxis(dx, dy) {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { dx, dy: 0 };
  }

  return { dx: 0, dy };
}

function applyTextCase(text, textCase) {
  const value = String(text || "");

  if (textCase === "uppercase") return value.toUpperCase();
  if (textCase === "lowercase") return value.toLowerCase();

  if (textCase === "capitalize") {
    return value.replace(/\b\p{L}/gu, (match) => match.toUpperCase());
  }

  if (textCase === "title") {
    return value
      .toLowerCase()
      .replace(/\b\p{L}/gu, (match) => match.toUpperCase());
  }

  return value;
}

function getWrappedTextLines(ctx, text, maxWidth) {
  const manualLines = String(text || "").split(/\r\n|\r|\n/);
  const lines = [];

  manualLines.forEach((manualLine) => {
    const words = manualLine.split(/(\s+)/).filter((word) => word.length > 0);

    if (!words.length) {
      lines.push("");
      return;
    }

    let line = "";

    words.forEach((word) => {
      const nextLine = `${line}${word}`;

      if (line && ctx.measureText(nextLine.trim()).width > maxWidth) {
        lines.push(line.trimEnd());
        line = word.trimStart();
      } else {
        line = nextLine;
      }
    });

    lines.push(line.trimEnd());
  });

  return lines.length ? lines : [""];
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

function sampleColorAtPoint(canvas, point) {
  const ctx = canvas.getContext("2d");
  const x = clampNumber(Math.round(point.x), 0, canvas.width - 1);
  const y = clampNumber(Math.round(point.y), 0, canvas.height - 1);
  const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;

  return rgbToHex(r, g, b);
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((value) => Number(value).toString(16).padStart(2, "0"))
    .join("")}`;
}

function convertShapeSizeToPixels(value, unit = "px") {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) return 0;

  if (unit === "in") {
    return clampNumber(number * SHAPE_INCH_DPI, 1, 5000);
  }

  return clampNumber(number, 1, 5000);
}

function normalizeColor(value) {
  const cleanValue = String(value || "").trim();

  if (/^#[0-9a-fA-F]{3}$/.test(cleanValue)) {
    return `#${cleanValue[1]}${cleanValue[1]}${cleanValue[2]}${cleanValue[2]}${cleanValue[3]}${cleanValue[3]}`.toLowerCase();
  }

  if (/^#[0-9a-fA-F]{6}$/.test(cleanValue)) {
    return cleanValue.toLowerCase();
  }

  return "#ef4444";
}

function normalizeHexForInput(value) {
  return normalizeColor(value);
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

function normalizeRotation(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return 0;

  return Math.round((((number % 360) + 360) % 360) * 100) / 100;
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

function formatSizeForUnit(pixelValue, unit = "px") {
  const pixels = Math.max(0, Number(pixelValue || 0));

  if (unit === "in") {
    return Number((pixels / SHAPE_INCH_DPI).toFixed(2));
  }

  return Math.round(pixels);
}

function sizeInputToPixels(value, unit = "px") {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return NaN;

  if (unit === "in") {
    return numericValue * SHAPE_INCH_DPI;
  }

  return numericValue;
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