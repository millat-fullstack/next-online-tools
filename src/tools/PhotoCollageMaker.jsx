import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Shuffle,
  Trash2,
  Image as ImageIcon,
  LayoutGrid,
  Sparkles,
  SlidersHorizontal,
  CheckCircle,
  AlertCircle,
  Loader2,
  ZoomIn,
  ZoomOut,
  Move,
  Palette,
  Clock3,
  Copy,
  Settings2,
  Images,
  Eye,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Photo Collage Maker",
  path: "/photo-collage-maker",
  category: "Image Tools",
  description:
    "Create beautiful photo collages online. Choose a template, upload photos, customize spacing, background, border, and download instantly.",
  metaTitle: "Photo Collage Maker Online | Create Photo Collages Free",
  metaDescription:
    "Create beautiful photo collages online for free. Choose a template, upload photos, customize spacing, background, border, corner radius, and download your collage instantly.",
};

const MAX_FILE_SIZE_MB = 12;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILES = 30;

const OUTPUT_PRESETS = [
  { label: "Instagram Square", width: 1080, height: 1080 },
  { label: "Instagram Story", width: 1080, height: 1920 },
  { label: "Facebook Post", width: 1200, height: 630 },
  { label: "YouTube Thumbnail", width: 1280, height: 720 },
  { label: "Pinterest Pin", width: 1000, height: 1500 },
  { label: "A4 Portrait", width: 1240, height: 1754 },
];

const OUTPUT_FORMATS = [
  { value: "image/png", label: "PNG", extension: "png" },
  { value: "image/jpeg", label: "JPG", extension: "jpg" },
  { value: "image/webp", label: "WEBP", extension: "webp" },
];

const DESIGN_PRESETS = [
  {
    id: "clean-white",
    label: "Clean White",
    backgroundColor: "#ffffff",
    gap: 18,
    cornerRadius: 24,
    borderWidth: 0,
    borderColor: "#ffffff",
    useShadow: false,
  },
  {
    id: "premium-soft",
    label: "Premium Soft",
    backgroundColor: "#f4edff",
    gap: 24,
    cornerRadius: 34,
    borderWidth: 0,
    borderColor: "#ffffff",
    useShadow: true,
  },
  {
    id: "minimal-black",
    label: "Minimal Black",
    backgroundColor: "#111827",
    gap: 16,
    cornerRadius: 18,
    borderWidth: 0,
    borderColor: "#111827",
    useShadow: false,
  },
  {
    id: "social-card",
    label: "Social Card",
    backgroundColor: "#f8fafc",
    gap: 20,
    cornerRadius: 28,
    borderWidth: 6,
    borderColor: "#ffffff",
    useShadow: true,
  },
  {
    id: "polaroid",
    label: "Polaroid Feel",
    backgroundColor: "#f3f4f6",
    gap: 34,
    cornerRadius: 8,
    borderWidth: 14,
    borderColor: "#ffffff",
    useShadow: true,
  },
];

const COLLAGE_TEMPLATES = [
  {
    id: "two-side",
    label: "2 Side by Side",
    required: 2,
    frames: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  {
    id: "two-stack",
    label: "2 Top Bottom",
    required: 2,
    frames: [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  {
    id: "three-horizontal",
    label: "3 Horizontal",
    required: 3,
    frames: [
      { x: 0, y: 0, w: 1 / 3, h: 1 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
    ],
  },
  {
    id: "three-feature",
    label: "3 Feature",
    required: 3,
    frames: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
    ],
  },
  {
    id: "four-grid",
    label: "4 Grid",
    required: 4,
    frames: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: "four-magazine",
    label: "4 Magazine",
    required: 4,
    frames: [
      { x: 0, y: 0, w: 0.6, h: 0.65 },
      { x: 0.6, y: 0, w: 0.4, h: 0.32 },
      { x: 0.6, y: 0.32, w: 0.4, h: 0.33 },
      { x: 0, y: 0.65, w: 1, h: 0.35 },
    ],
  },
  {
    id: "five-editorial",
    label: "5 Editorial",
    required: 5,
    frames: [
      { x: 0, y: 0, w: 0.58, h: 0.58 },
      { x: 0.58, y: 0, w: 0.42, h: 0.29 },
      { x: 0.58, y: 0.29, w: 0.42, h: 0.29 },
      { x: 0, y: 0.58, w: 0.5, h: 0.42 },
      { x: 0.5, y: 0.58, w: 0.5, h: 0.42 },
    ],
  },
  {
    id: "six-grid",
    label: "6 Grid",
    required: 6,
    frames: [
      { x: 0, y: 0, w: 1 / 3, h: 0.5 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 0.5 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 },
      { x: 0, y: 0.5, w: 1 / 3, h: 0.5 },
      { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
      { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
    ],
  },
  {
    id: "nine-grid",
    label: "9 Grid",
    required: 9,
    frames: Array.from({ length: 9 }, (_, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);

      return {
        x: col / 3,
        y: row / 3,
        w: 1 / 3,
        h: 1 / 3,
      };
    }),
  },
];

export default function PhotoCollageMaker() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageUrlsRef = useRef([]);
  const dragRef = useRef({
    active: false,
    frameIndex: null,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  const [photos, setPhotos] = useState([]);
  const [templateId, setTemplateId] = useState("four-grid");
  const [placements, setPlacements] = useState([]);
  const [activePanel, setActivePanel] = useState("");

  const [dimensions, setDimensions] = useState({
    width: 1080,
    height: 1080,
  });

  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [gap, setGap] = useState(18);
  const [cornerRadius, setCornerRadius] = useState(26);
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState("#ffffff");
  const [useShadow, setUseShadow] = useState(false);

  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [outputFormat, setOutputFormat] = useState("image/png");
  const [quality, setQuality] = useState(0.94);
  const [exportProgress, setExportProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [lastOutputSize, setLastOutputSize] = useState(0);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedTemplate = useMemo(() => {
    return (
      COLLAGE_TEMPLATES.find((template) => template.id === templateId) ||
      COLLAGE_TEMPLATES[0]
    );
  }, [templateId]);

  const selectedPlacement = placements[selectedFrameIndex] || null;

  const selectedPhoto = useMemo(() => {
    if (!selectedPlacement?.photoId) return null;
    return photos.find((photo) => photo.id === selectedPlacement.photoId) || null;
  }, [photos, selectedPlacement]);

  const selectedOutputFormat = useMemo(() => {
    return (
      OUTPUT_FORMATS.find((format) => format.value === outputFormat) ||
      OUTPUT_FORMATS[0]
    );
  }, [outputFormat]);

  const filledFrames = useMemo(() => {
    return placements.filter((item) => item.photoId).length;
  }, [placements]);

  const estimatedProcessingTimeMs = useMemo(() => {
    const megapixels = (dimensions.width * dimensions.height) / 1000000;
    const photoCost = Math.max(1, filledFrames) * 90;
    const estimated = 600 + megapixels * 260 + photoCost;

    return Math.min(12000, Math.max(900, Math.round(estimated)));
  }, [dimensions, filledFrames]);

  const previewWidth = useMemo(() => {
    const isLandscape = dimensions.width >= dimensions.height;
    const maxWidth = isLandscape ? 1040 : 620;
    return Math.min(maxWidth, dimensions.width);
  }, [dimensions]);

  const hasPhotos = photos.length > 0;

  const handlePhotoFiles = useCallback(
    async (fileList) => {
      const incomingFiles = Array.from(fileList || []);

      if (!incomingFiles.length) return;

      setErrorMessage("");
      setSuccessMessage("");
      clearExportStats();
      setIsProcessingFiles(true);

      try {
        const remainingSlots = Math.max(0, MAX_FILES - photos.length);
        const validFiles = [];
        let rejectedCount = 0;

        incomingFiles.forEach((file) => {
          const validationError = validateImageFile(file);

          if (validationError) {
            rejectedCount += 1;
            return;
          }

          validFiles.push(file);
        });

        const acceptedFiles = validFiles.slice(0, remainingSlots);
        const skippedByLimit = Math.max(0, validFiles.length - acceptedFiles.length);

        if (!acceptedFiles.length) {
          setErrorMessage(
            photos.length >= MAX_FILES
              ? `Maximum ${MAX_FILES} photos are allowed.`
              : "Please upload valid image files."
          );
          resetFileInput();
          return;
        }

        const loadedPhotos = [];

        for (const file of acceptedFiles) {
          const objectUrl = URL.createObjectURL(file);
          imageUrlsRef.current.push(objectUrl);

          const imageElement = await loadImage(objectUrl);

          loadedPhotos.push({
            id: makeId(),
            name: file.name || "photo",
            size: file.size,
            type: file.type,
            url: objectUrl,
            element: imageElement,
            width: imageElement.naturalWidth || imageElement.width,
            height: imageElement.naturalHeight || imageElement.height,
          });
        }

        setPhotos((currentPhotos) => {
          const nextPhotos = [...currentPhotos, ...loadedPhotos];

          setPlacements((currentPlacements) =>
            autoFillPlacements({
              template: selectedTemplate,
              photos: nextPhotos,
              currentPlacements,
            })
          );

          return nextPhotos;
        });

        const messages = [];
        messages.push(`${loadedPhotos.length} photo(s) added.`);

        if (rejectedCount > 0) {
          messages.push(`${rejectedCount} invalid file(s) ignored.`);
        }

        if (skippedByLimit > 0) {
          messages.push(`${skippedByLimit} file(s) skipped because the limit is ${MAX_FILES}.`);
        }

        setSuccessMessage(messages.join(" "));
      } catch {
        setErrorMessage("Could not load one or more photos. Please try again.");
      } finally {
        setIsProcessingFiles(false);
        resetFileInput();
      }
    },
    [photos.length, selectedTemplate]
  );

  useEffect(() => {
    setPlacements((currentPlacements) =>
      autoFillPlacements({
        template: selectedTemplate,
        photos,
        currentPlacements,
      })
    );

    setSelectedFrameIndex(0);
    clearExportStats();
  }, [selectedTemplate, photos]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    drawCollage({
      canvas,
      photos,
      template: selectedTemplate,
      placements,
      dimensions,
      backgroundColor,
      gap,
      cornerRadius,
      borderWidth,
      borderColor,
      useShadow,
      selectedFrameIndex,
      includeEditorGuides: true,
      outputFormat,
    });
  }, [
    photos,
    selectedTemplate,
    placements,
    dimensions,
    backgroundColor,
    gap,
    cornerRadius,
    borderWidth,
    borderColor,
    useShadow,
    selectedFrameIndex,
    outputFormat,
  ]);

  useEffect(() => {
    function handlePaste(event) {
      const files = Array.from(event.clipboardData?.files || []);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length) {
        handlePhotoFiles(imageFiles);
      }
    }

    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePhotoFiles]);

  useEffect(() => {
    return () => {
      imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

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
    handlePhotoFiles(event.target.files);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDraggingFile(false);
    handlePhotoFiles(event.dataTransfer.files);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDraggingFile(true);
  }

  function handleDragLeave() {
    setIsDraggingFile(false);
  }

  function updateDimension(type, value) {
    const number = clampNumber(Number(value), 100, 5000);

    setDimensions((current) => ({
      ...current,
      [type]: number,
    }));

    clearExportStats();
  }

  function applyOutputPreset(preset) {
    setDimensions({
      width: preset.width,
      height: preset.height,
    });

    clearExportStats();
  }

  function applyDesignPreset(preset) {
    setBackgroundColor(preset.backgroundColor);
    setGap(preset.gap);
    setCornerRadius(preset.cornerRadius);
    setBorderWidth(preset.borderWidth);
    setBorderColor(preset.borderColor);
    setUseShadow(preset.useShadow);
    clearExportStats();
  }

  function updatePlacement(frameIndex, updates) {
    setPlacements((currentPlacements) =>
      currentPlacements.map((placement, index) =>
        index === frameIndex ? { ...placement, ...updates } : placement
      )
    );

    clearExportStats();
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

  function getFrameIndexAtPoint(point) {
    for (let index = selectedTemplate.frames.length - 1; index >= 0; index -= 1) {
      const box = getFramePixelBox({
        frame: selectedTemplate.frames[index],
        dimensions,
        gap,
      });

      if (
        point.x >= box.x &&
        point.x <= box.x + box.w &&
        point.y >= box.y &&
        point.y <= box.y + box.h
      ) {
        return index;
      }
    }

    return -1;
  }

  function handleCanvasPointerDown(event) {
    const point = getCanvasPoint(event);

    if (!point) return;

    const frameIndex = getFrameIndexAtPoint(point);

    if (frameIndex === -1) return;

    event.preventDefault();

    setSelectedFrameIndex(frameIndex);

    const placement = placements[frameIndex];

    if (!placement?.photoId) return;

    dragRef.current = {
      active: true,
      frameIndex,
      startX: point.x,
      startY: point.y,
      startOffsetX: placement.offsetX || 0,
      startOffsetY: placement.offsetY || 0,
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

    updatePlacement(dragRef.current.frameIndex, {
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
    const point = getCanvasPoint(event);

    if (!point) return;

    const frameIndex = getFrameIndexAtPoint(point);

    if (frameIndex === -1) return;

    event.preventDefault();

    setSelectedFrameIndex(frameIndex);

    const placement = placements[frameIndex];

    if (!placement?.photoId) return;

    const factor = Math.exp(-event.deltaY * 0.0015);
    const nextZoom = clampNumber((placement.zoom || 1) * factor, 0.3, 4);

    updatePlacement(frameIndex, {
      zoom: nextZoom,
    });
  }

  function usePhotoInSelectedFrame(photoId) {
    updatePlacement(selectedFrameIndex, {
      photoId,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });

    setSuccessMessage(`Photo placed in frame ${selectedFrameIndex + 1}.`);
  }

  function removePhotoFromFrame(frameIndex) {
    updatePlacement(frameIndex, {
      photoId: null,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });
  }

  function removePhoto(photoId) {
    const photoToRemove = photos.find((photo) => photo.id === photoId);

    if (photoToRemove?.url) {
      URL.revokeObjectURL(photoToRemove.url);
      imageUrlsRef.current = imageUrlsRef.current.filter((url) => url !== photoToRemove.url);
    }

    setPhotos((currentPhotos) => currentPhotos.filter((photo) => photo.id !== photoId));
    setPlacements((currentPlacements) =>
      currentPlacements.map((placement) =>
        placement.photoId === photoId
          ? { ...placement, photoId: null, zoom: 1, offsetX: 0, offsetY: 0 }
          : placement
      )
    );

    clearExportStats();
  }

  function shufflePhotos() {
    if (!photos.length) return;

    const shuffledPhotos = [...photos].sort(() => Math.random() - 0.5);

    setPlacements((currentPlacements) =>
      selectedTemplate.frames.map((_, index) => ({
        photoId: shuffledPhotos[index % shuffledPhotos.length]?.id || null,
        zoom: currentPlacements[index]?.zoom || 1,
        offsetX: 0,
        offsetY: 0,
      }))
    );

    clearExportStats();
    setSuccessMessage("Photos shuffled across the collage.");
  }

  function resetSelectedPhotoPosition() {
    if (!selectedPlacement) return;

    updatePlacement(selectedFrameIndex, {
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });
  }

  function clearAllPhotos() {
    imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    imageUrlsRef.current = [];

    setPhotos([]);
    setPlacements(
      selectedTemplate.frames.map(() => ({
        photoId: null,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      }))
    );

    setSelectedFrameIndex(0);
    clearExportStats();
    setSuccessMessage("");
    setErrorMessage("");
  }

  async function exportCollage() {
    if (!filledFrames) {
      setErrorMessage("Please add at least one photo to create a collage.");
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

      const exportCanvas = document.createElement("canvas");

      drawCollage({
        canvas: exportCanvas,
        photos,
        template: selectedTemplate,
        placements,
        dimensions,
        backgroundColor,
        gap,
        cornerRadius,
        borderWidth,
        borderColor,
        useShadow,
        selectedFrameIndex: -1,
        includeEditorGuides: false,
        outputFormat,
      });

      setExportProgress(70);

      const blob = await canvasToBlob(exportCanvas, outputFormat, quality);

      setExportProgress(90);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `photo-collage-${dimensions.width}x${dimensions.height}.${selectedOutputFormat.extension}`;

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
        `Photo collage created in ${(actualProcessingTime / 1000).toFixed(1)}s.`
      );
    } catch {
      setErrorMessage("Could not create the collage. Please try again.");
    } finally {
      setIsExporting(false);

      window.setTimeout(() => {
        setExportProgress(0);
      }, 800);
    }
  }

  function resetTool() {
    imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    imageUrlsRef.current = [];

    setPhotos([]);
    setTemplateId("four-grid");
    setPlacements([]);
    setActivePanel("");
    setDimensions({ width: 1080, height: 1080 });
    setBackgroundColor("#ffffff");
    setGap(18);
    setCornerRadius(26);
    setBorderWidth(0);
    setBorderColor("#ffffff");
    setUseShadow(false);
    setSelectedFrameIndex(0);
    setIsDraggingFile(false);
    setIsProcessingFiles(false);
    setIsExporting(false);
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
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <LayoutGrid size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Photo Collage Maker</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Create beautiful photo collages online. Choose a template, upload
          photos, apply a design preset, adjust the layout, and download your
          final collage with processing time and output size.
        </p>
      </section>

      <section className="card p-4 sm:p-5">
        {!hasPhotos && (
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
            {isProcessingFiles ? (
              <Loader2
                size={40}
                className="mx-auto mb-4 text-[var(--primary)] animate-spin"
              />
            ) : (
              <Upload size={40} className="mx-auto mb-4 text-[var(--primary)]" />
            )}

            <h2 className="text-xl font-semibold mb-2">
              Upload, drop, or paste photos
            </h2>

            <p className="text-sm text-[var(--text-secondary)]">
              Add up to {MAX_FILES} photos. You can also paste images with{" "}
              <strong>Ctrl + V</strong>. Max {MAX_FILE_SIZE_MB} MB each.
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
            >
              <Upload size={16} />
              Upload Photos
            </button>

            <div className="min-w-[190px]">
              <select
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
                className="h-10 w-full border border-[var(--border)] rounded-xl px-3 bg-white outline-none focus:border-[var(--primary)] text-sm font-semibold"
                title="Choose template"
              >
                {COLLAGE_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label} - {template.required} photos
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() =>
                setActivePanel(activePanel === "templates" ? "" : "templates")
              }
              className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm ${
                activePanel === "templates"
                  ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                  : "border-[var(--border)] hover:bg-[#f8f4ff]"
              }`}
            >
              <LayoutGrid size={17} />
              Templates
            </button>

            <button
              type="button"
              onClick={() =>
                setActivePanel(activePanel === "design" ? "" : "design")
              }
              className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm ${
                activePanel === "design"
                  ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                  : "border-[var(--border)] hover:bg-[#f8f4ff]"
              }`}
            >
              <Sparkles size={17} />
              Design
            </button>

            <button
              type="button"
              onClick={() =>
                setActivePanel(activePanel === "photos" ? "" : "photos")
              }
              className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm ${
                activePanel === "photos"
                  ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                  : "border-[var(--border)] hover:bg-[#f8f4ff]"
              }`}
            >
              <Images size={17} />
              Photos
            </button>

            <button
              type="button"
              onClick={() =>
                setActivePanel(activePanel === "frame" ? "" : "frame")
              }
              className={`h-10 rounded-xl border px-3 inline-flex items-center gap-2 text-sm ${
                activePanel === "frame"
                  ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                  : "border-[var(--border)] hover:bg-[#f8f4ff]"
              }`}
            >
              <Move size={17} />
              Frame
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

            <div className="w-px h-8 bg-[var(--border)] mx-1" />

            <button
              type="button"
              onClick={shufflePhotos}
              disabled={!photos.length}
              className={`w-10 h-10 rounded-xl border inline-flex items-center justify-center ${
                !photos.length
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-[#f8f4ff]"
              }`}
              title="Shuffle photos"
            >
              <Shuffle size={18} />
            </button>

            <button
              type="button"
              onClick={resetSelectedPhotoPosition}
              disabled={!selectedPhoto}
              className={`w-10 h-10 rounded-xl border inline-flex items-center justify-center ${
                !selectedPhoto
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-[#f8f4ff]"
              }`}
              title="Reset selected photo position"
            >
              <RotateCcw size={18} />
            </button>

            <button
              type="button"
              onClick={clearAllPhotos}
              disabled={!photos.length}
              className={`w-10 h-10 rounded-xl border inline-flex items-center justify-center ${
                !photos.length
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-red-50 hover:text-red-600"
              }`}
              title="Clear all photos"
            >
              <Trash2 size={18} />
            </button>

            <div className="flex-1" />

            <button
              type="button"
              onClick={exportCollage}
              disabled={!filledFrames || isExporting}
              className={`btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm ${
                !filledFrames || isExporting
                  ? "opacity-50 cursor-not-allowed"
                  : ""
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

          {/* DROPDOWN PANELS */}
          {activePanel && (
            <div className="mt-3 border border-[var(--border)] rounded-2xl bg-[#fafafa] p-4">
              {activePanel === "templates" && (
                <div>
                  <p className="text-sm font-semibold mb-3">
                    Choose a collage template
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {COLLAGE_TEMPLATES.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        active={templateId === template.id}
                        onClick={() => setTemplateId(template.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activePanel === "design" && (
                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Design presets
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {DESIGN_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyDesignPreset(preset)}
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
                        clearExportStats();
                      }}
                    />

                    <ColorInput
                      label="Border"
                      value={borderColor}
                      onChange={(value) => {
                        setBorderColor(value);
                        clearExportStats();
                      }}
                    />

                    <label className="flex items-center justify-between gap-3 bg-white border border-[var(--border)] rounded-xl p-4 cursor-pointer">
                      <span className="font-semibold text-sm">Soft Shadow</span>
                      <input
                        type="checkbox"
                        checked={useShadow}
                        onChange={(event) => {
                          setUseShadow(event.target.checked);
                          clearExportStats();
                        }}
                        className="w-4 h-4 accent-[var(--primary)]"
                      />
                    </label>
                  </div>

                  <div className="lg:col-span-2 grid md:grid-cols-3 gap-4">
                    <RangeInput
                      label={`Spacing: ${gap}px`}
                      min={0}
                      max={80}
                      step={1}
                      value={gap}
                      onChange={(value) => {
                        setGap(Number(value));
                        clearExportStats();
                      }}
                    />

                    <RangeInput
                      label={`Corner Radius: ${cornerRadius}px`}
                      min={0}
                      max={120}
                      step={1}
                      value={cornerRadius}
                      onChange={(value) => {
                        setCornerRadius(Number(value));
                        clearExportStats();
                      }}
                    />

                    <RangeInput
                      label={`Border: ${borderWidth}px`}
                      min={0}
                      max={24}
                      step={1}
                      value={borderWidth}
                      onChange={(value) => {
                        setBorderWidth(Number(value));
                        clearExportStats();
                      }}
                    />
                  </div>
                </div>
              )}

              {activePanel === "photos" && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <p className="text-sm font-semibold">
                        Uploaded photos
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Select a frame first, then click a photo to place it.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="btn-secondary inline-flex items-center justify-center gap-2"
                    >
                      <Upload size={16} />
                      Add More
                    </button>
                  </div>

                  {!photos.length ? (
                    <div className="text-center py-8 bg-white border border-dashed border-[var(--border)] rounded-xl">
                      <ImageIcon size={36} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-[var(--text-secondary)]">
                        No photos uploaded yet.
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {photos.map((photo) => (
                        <PhotoThumb
                          key={photo.id}
                          photo={photo}
                          onUse={() => usePhotoInSelectedFrame(photo.id)}
                          onRemove={() => removePhoto(photo.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activePanel === "frame" && (
                <div className="grid md:grid-cols-[1fr_1.2fr] gap-5">
                  <div>
                    <p className="text-sm font-semibold mb-2">
                      Selected frame
                    </p>

                    <div className="bg-white border border-[var(--border)] rounded-xl p-4">
                      <p className="font-semibold">
                        Frame {selectedFrameIndex + 1} of{" "}
                        {selectedTemplate.frames.length}
                      </p>

                      {selectedPhoto ? (
                        <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">
                          {selectedPhoto.name}
                        </p>
                      ) : (
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                          Empty frame. Choose a photo from the Photos panel.
                        </p>
                      )}
                    </div>

                    {selectedPhoto && (
                      <button
                        type="button"
                        onClick={() => removePhotoFromFrame(selectedFrameIndex)}
                        className="btn-secondary mt-3 inline-flex items-center justify-center gap-2 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                        Remove from Frame
                      </button>
                    )}
                  </div>

                  <div>
                    {selectedPhoto ? (
                      <>
                        <RangeInput
                          label={`Zoom: ${Math.round(
                            (selectedPlacement?.zoom || 1) * 100
                          )}%`}
                          min={0.3}
                          max={4}
                          step={0.01}
                          value={selectedPlacement?.zoom || 1}
                          onChange={(value) =>
                            updatePlacement(selectedFrameIndex, {
                              zoom: Number(value),
                            })
                          }
                        />

                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <button
                            type="button"
                            onClick={() =>
                              updatePlacement(selectedFrameIndex, {
                                zoom: clampNumber(
                                  (selectedPlacement?.zoom || 1) * 0.9,
                                  0.3,
                                  4
                                ),
                              })
                            }
                            className="btn-secondary inline-flex items-center justify-center gap-2"
                          >
                            <ZoomOut size={16} />
                            Zoom Out
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updatePlacement(selectedFrameIndex, {
                                zoom: clampNumber(
                                  (selectedPlacement?.zoom || 1) * 1.1,
                                  0.3,
                                  4
                                ),
                              })
                            }
                            className="btn-secondary inline-flex items-center justify-center gap-2"
                          >
                            <ZoomIn size={16} />
                            Zoom In
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 bg-white border border-dashed border-[var(--border)] rounded-xl">
                        <ImageIcon size={34} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-[var(--text-secondary)]">
                          This frame is empty.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activePanel === "export" && (
                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
                  <div>
                    <p className="text-sm font-semibold mb-3">
                      Output size
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-semibold mb-2 block">
                          Width
                        </label>
                        <input
                          type="number"
                          value={dimensions.width}
                          min="100"
                          max="5000"
                          onChange={(event) =>
                            updateDimension("width", event.target.value)
                          }
                          className="w-full border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-2 block">
                          Height
                        </label>
                        <input
                          type="number"
                          value={dimensions.height}
                          min="100"
                          max="5000"
                          onChange={(event) =>
                            updateDimension("height", event.target.value)
                          }
                          className="w-full border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {OUTPUT_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyOutputPreset(preset)}
                          className="text-xs px-3 py-2 rounded-xl bg-white hover:bg-[#f4edff] hover:text-[var(--primary)] transition border border-[var(--border)]"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
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
                  <span>Creating collage...</span>
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
                  {Math.ceil(estimatedProcessingTimeMs / 1000)}s
                </p>
              </div>
            )}
          </div>
        )}

        {/* ARTBOARD */}
        <div
          className={`border border-[var(--border)] rounded-2xl bg-[#eef0f5] min-h-[690px] overflow-auto p-4 sm:p-6 flex items-center justify-center ${
            isDraggingFile ? "ring-2 ring-[var(--primary)]" : ""
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {!hasPhotos ? (
            <div className="text-center">
              <ImageIcon size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-[var(--text-secondary)]">
                Upload, drop, or paste photos to create your collage.
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
                cursor: selectedPhoto ? "grab" : "default",
              }}
            />
          )}
        </div>

        {/* BOTTOM STATUS */}
        {hasPhotos && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
            <InfoCard label="Template" value={selectedTemplate.label} />
            <InfoCard
              label="Frames"
              value={`${filledFrames}/${selectedTemplate.frames.length}`}
            />
            <InfoCard
              label="Selected"
              value={`Frame ${selectedFrameIndex + 1}`}
            />
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
            <InfoCard
              label="Canvas"
              value={`${dimensions.width}×${dimensions.height}`}
            />
          </div>
        )}

        {hasPhotos && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Eye size={20} className="text-blue-700 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Click any frame to select it. Drag inside a frame to reposition
                the photo. Scroll over a frame to zoom. Use the compact toolbar
                above so the collage preview stays large and comfortable.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-4">Create Photo Collages Online</h2>

        <div className="text-[var(--text-secondary)] leading-7 space-y-3">
          <p>
            This Photo Collage Maker helps you create beautiful image collages
            for Instagram, Facebook, YouTube thumbnails, Pinterest pins, family
            memories, ecommerce products, and marketing posts. Choose a
            template, upload photos, apply a design preset, and download the
            final collage instantly.
          </p>

          <p>
            Your photos are processed locally in your browser. No paid API is
            required.
          </p>
        </div>
      </section>

      <SuggestedTools currentToolId="photo-collage-maker" />
    </div>
  );
}

function TemplateCard({ template, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-3 text-left transition ${
        active
          ? "border-[var(--primary)] bg-[#f8f4ff] text-[var(--primary)]"
          : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
      }`}
    >
      <div className="relative h-20 rounded-xl bg-gray-100 overflow-hidden mb-2 border border-[var(--border)]">
        {template.frames.map((frame, index) => (
          <span
            key={index}
            className="absolute bg-white border border-gray-300"
            style={{
              left: `${frame.x * 100}%`,
              top: `${frame.y * 100}%`,
              width: `${frame.w * 100}%`,
              height: `${frame.h * 100}%`,
            }}
          />
        ))}
      </div>

      <p className="text-sm font-semibold">{template.label}</p>
      <p className="text-xs text-[var(--text-secondary)] mt-1">
        {template.required} photos
      </p>
    </button>
  );
}

function PhotoThumb({ photo, onUse, onRemove }) {
  return (
    <div className="relative group rounded-xl overflow-hidden border border-[var(--border)] bg-gray-50 w-24 shrink-0">
      <button type="button" onClick={onUse} className="block w-full">
        <img
          src={photo.url}
          alt={photo.name}
          className="w-full aspect-square object-cover"
          draggable="false"
        />
      </button>

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 w-7 h-7 rounded-full bg-white/90 border border-red-100 text-red-600 hidden group-hover:flex items-center justify-center"
        title="Remove photo"
      >
        <Trash2 size={14} />
      </button>
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

function autoFillPlacements({ template, photos, currentPlacements }) {
  return template.frames.map((_, index) => {
    const existing = currentPlacements[index];

    if (existing?.photoId && photos.some((photo) => photo.id === existing.photoId)) {
      return existing;
    }

    return {
      photoId: photos[index]?.id || null,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    };
  });
}

function drawCollage({
  canvas,
  photos,
  template,
  placements,
  dimensions,
  backgroundColor,
  gap,
  cornerRadius,
  borderWidth,
  borderColor,
  useShadow,
  selectedFrameIndex,
  includeEditorGuides,
  outputFormat,
}) {
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (outputFormat === "image/jpeg" && backgroundColor === "transparent") {
    ctx.fillStyle = "#ffffff";
  } else {
    ctx.fillStyle = backgroundColor;
  }

  ctx.fillRect(0, 0, canvas.width, canvas.height);

  template.frames.forEach((frame, frameIndex) => {
    const box = getFramePixelBox({ frame, dimensions, gap });
    const placement = placements[frameIndex];
    const photo = photos.find((item) => item.id === placement?.photoId);

    if (useShadow) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.18)";
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = "#ffffff";
      roundedRectPath(ctx, box.x, box.y, box.w, box.h, cornerRadius);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    roundedRectPath(ctx, box.x, box.y, box.w, box.h, cornerRadius);
    ctx.clip();

    if (photo) {
      drawPhotoCover(ctx, {
        photo,
        box,
        zoom: placement.zoom || 1,
        offsetX: placement.offsetX || 0,
        offsetY: placement.offsetY || 0,
      });
    } else {
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(box.x, box.y, box.w, box.h);

      ctx.fillStyle = "#9ca3af";
      ctx.font = `${Math.max(18, dimensions.width * 0.018)}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`Photo ${frameIndex + 1}`, box.x + box.w / 2, box.y + box.h / 2);
    }

    ctx.restore();

    if (borderWidth > 0) {
      ctx.save();
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = borderColor;
      roundedRectPath(ctx, box.x, box.y, box.w, box.h, cornerRadius);
      ctx.stroke();
      ctx.restore();
    }

    if (includeEditorGuides && frameIndex === selectedFrameIndex) {
      ctx.save();
      ctx.lineWidth = Math.max(4, dimensions.width * 0.004);
      ctx.strokeStyle = "#9b6ce3";
      ctx.setLineDash([18, 12]);
      roundedRectPath(ctx, box.x + 4, box.y + 4, box.w - 8, box.h - 8, cornerRadius);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#9b6ce3";
      ctx.font = `700 ${Math.max(18, dimensions.width * 0.018)}px Arial, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`Frame ${frameIndex + 1}`, box.x + 18, box.y + 18);
      ctx.restore();
    }
  });
}

function drawPhotoCover(ctx, { photo, box, zoom, offsetX, offsetY }) {
  const baseScale = Math.max(box.w / photo.width, box.h / photo.height);
  const finalScale = baseScale * zoom;

  const drawWidth = photo.width * finalScale;
  const drawHeight = photo.height * finalScale;

  const x = box.x + box.w / 2 - drawWidth / 2 + offsetX;
  const y = box.y + box.h / 2 - drawHeight / 2 + offsetY;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(photo.element, x, y, drawWidth, drawHeight);
}

function getFramePixelBox({ frame, dimensions, gap }) {
  const halfGap = gap / 2;

  return {
    x: frame.x * dimensions.width + halfGap,
    y: frame.y * dimensions.height + halfGap,
    w: Math.max(1, frame.w * dimensions.width - gap),
    h: Math.max(1, frame.h * dimensions.height - gap),
  };
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

function validateImageFile(file) {
  if (!file) return "Please upload an image file.";

  if (!file.type.startsWith("image/")) {
    return "Please upload a valid image file.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Each photo must be under ${MAX_FILE_SIZE_MB} MB.`;
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

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not export collage."));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
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