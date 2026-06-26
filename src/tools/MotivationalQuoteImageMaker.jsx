import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Upload,
  Download,
  RotateCcw,
  Zap,
  Palette,
  Settings2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Type,
  Trash2,
  Sparkles,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  SlidersHorizontal,
  Clock3,
  FileImage,
  Loader2,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Motivational Quote Image Maker",
  path: "/motivational-quote-image-maker",
  category: "Image Tools",
  description:
    "Create and download motivational quote images for Instagram, Facebook, Pinterest, stories, and social media posts.",
  metaTitle:
    "Motivational Quote Image Maker | Create Quote Images Online Free",
  metaDescription:
    "Create motivational quote images online for free. Add your quote, choose a background, customize fonts and colors, select social media sizes, and download as PNG or JPG.",
};

const MAX_BACKGROUND_SIZE_MB = 5;
const DEFAULT_QUOTE =
  "Believe in yourself and keep moving forward. Great things take time.";
const DEFAULT_AUTHOR = "";

const SIZE_PRESETS = [
  {
    id: "instagram-square",
    label: "Instagram Post",
    size: "1080 × 1080",
    width: 1080,
    height: 1080,
  },
  {
    id: "instagram-story",
    label: "Story / Reel",
    size: "1080 × 1920",
    width: 1080,
    height: 1920,
  },
  {
    id: "facebook-post",
    label: "Facebook Post",
    size: "1200 × 630",
    width: 1200,
    height: 630,
  },
  {
    id: "pinterest-pin",
    label: "Pinterest Pin",
    size: "1000 × 1500",
    width: 1000,
    height: 1500,
  },
  {
    id: "youtube-community",
    label: "YouTube / Wide",
    size: "1280 × 720",
    width: 1280,
    height: 720,
  },
  {
    id: "linkedin-square",
    label: "LinkedIn Post",
    size: "1200 × 1200",
    width: 1200,
    height: 1200,
  },
  {
    id: "custom",
    label: "Custom Size",
    size: "Custom",
    width: 1080,
    height: 1080,
  },
];

const GRADIENT_PRESETS = [
  {
    id: "sunset",
    name: "Sunset Drive",
    colors: ["#ff7e5f", "#feb47b"],
  },
  {
    id: "purple",
    name: "Purple Focus",
    colors: ["#7f00ff", "#e100ff"],
  },
  {
    id: "ocean",
    name: "Ocean Calm",
    colors: ["#2193b0", "#6dd5ed"],
  },
  {
    id: "midnight",
    name: "Midnight",
    colors: ["#141e30", "#243b55"],
  },
  {
    id: "luxury",
    name: "Luxury Dark",
    colors: ["#000000", "#434343"],
  },
  {
    id: "fresh",
    name: "Fresh Green",
    colors: ["#11998e", "#38ef7d"],
  },
  {
    id: "rose",
    name: "Rose Gold",
    colors: ["#f953c6", "#b91d73"],
  },
  {
    id: "light",
    name: "Soft Light",
    colors: ["#fdfbfb", "#ebedee"],
  },
];

const FONT_OPTIONS = [
  {
    value: "Georgia, serif",
    label: "Elegant Serif",
  },
  {
    value: "Arial, sans-serif",
    label: "Clean Sans",
  },
  {
    value: "Verdana, sans-serif",
    label: "Friendly Sans",
  },
  {
    value: "'Trebuchet MS', sans-serif",
    label: "Modern",
  },
  {
    value: "Impact, sans-serif",
    label: "Bold Impact",
  },
  {
    value: "'Comic Sans MS', cursive",
    label: "Casual Handwritten",
  },
  {
    value: "'Courier New', monospace",
    label: "Typewriter",
  },
];

const TEMPLATE_PRESETS = [
  {
    id: "dark-success",
    name: "Dark Success",
    backgroundMode: "gradient",
    gradientId: "midnight",
    textColor: "#ffffff",
    authorColor: "#d8d8d8",
    textAlign: "center",
    textPosition: "center",
    fontFamily: "Georgia, serif",
    fontWeight: "700",
    textShadow: true,
    textBoxEnabled: false,
    overlayOpacity: 15,
  },
  {
    id: "sunrise-energy",
    name: "Sunrise Energy",
    backgroundMode: "gradient",
    gradientId: "sunset",
    textColor: "#ffffff",
    authorColor: "#fff4ea",
    textAlign: "center",
    textPosition: "center",
    fontFamily: "'Trebuchet MS', sans-serif",
    fontWeight: "800",
    textShadow: true,
    textBoxEnabled: false,
    overlayOpacity: 10,
  },
  {
    id: "minimal-white",
    name: "Minimal White",
    backgroundMode: "solid",
    gradientId: "light",
    solidColor: "#ffffff",
    textColor: "#222222",
    authorColor: "#666666",
    textAlign: "center",
    textPosition: "center",
    fontFamily: "Georgia, serif",
    fontWeight: "600",
    textShadow: false,
    textBoxEnabled: false,
    overlayOpacity: 0,
  },
  {
    id: "luxury-gold",
    name: "Luxury Gold",
    backgroundMode: "gradient",
    gradientId: "luxury",
    textColor: "#f7d774",
    authorColor: "#ffffff",
    textAlign: "center",
    textPosition: "center",
    fontFamily: "Georgia, serif",
    fontWeight: "700",
    textShadow: true,
    textBoxEnabled: true,
    textBoxColor: "#000000",
    textBoxOpacity: 35,
    overlayOpacity: 20,
  },
  {
    id: "fitness-bold",
    name: "Fitness Bold",
    backgroundMode: "gradient",
    gradientId: "purple",
    textColor: "#ffffff",
    authorColor: "#ffffff",
    textAlign: "center",
    textPosition: "center",
    fontFamily: "Impact, sans-serif",
    fontWeight: "800",
    textShadow: true,
    textBoxEnabled: false,
    overlayOpacity: 18,
  },
  {
    id: "calm-mindset",
    name: "Calm Mindset",
    backgroundMode: "gradient",
    gradientId: "ocean",
    textColor: "#ffffff",
    authorColor: "#eefaff",
    textAlign: "center",
    textPosition: "center",
    fontFamily: "Verdana, sans-serif",
    fontWeight: "700",
    textShadow: true,
    textBoxEnabled: true,
    textBoxColor: "#003344",
    textBoxOpacity: 22,
    overlayOpacity: 12,
  },
];

export default function MotivationalQuoteImageMaker() {
  const fileInputRef = useRef(null);

  const [quoteText, setQuoteText] = useState(DEFAULT_QUOTE);
  const [authorText, setAuthorText] = useState(DEFAULT_AUTHOR);

  const [sizePreset, setSizePreset] = useState("instagram-square");
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1080);

  const [backgroundMode, setBackgroundMode] = useState("gradient");
  const [gradientId, setGradientId] = useState("midnight");
  const [solidColor, setSolidColor] = useState("#111827");
  const [backgroundImageDataUrl, setBackgroundImageDataUrl] = useState("");
  const [backgroundImageName, setBackgroundImageName] = useState("");

  const [overlayColor, setOverlayColor] = useState("#000000");
  const [overlayOpacity, setOverlayOpacity] = useState(15);

  const [fontFamily, setFontFamily] = useState("Georgia, serif");
  const [fontWeight, setFontWeight] = useState("700");
  const [fontSize, setFontSize] = useState(62);
  const [authorSize, setAuthorSize] = useState(28);
  const [lineHeight, setLineHeight] = useState(1.22);
  const [textColor, setTextColor] = useState("#ffffff");
  const [authorColor, setAuthorColor] = useState("#e5e7eb");
  const [textAlign, setTextAlign] = useState("center");
  const [textPosition, setTextPosition] = useState("center");
  const [textShadow, setTextShadow] = useState(true);
  const [quoteMarks, setQuoteMarks] = useState(true);

  const [textBoxEnabled, setTextBoxEnabled] = useState(false);
  const [textBoxColor, setTextBoxColor] = useState("#000000");
  const [textBoxOpacity, setTextBoxOpacity] = useState(25);

  const [brandText, setBrandText] = useState("");
  const [brandColor, setBrandColor] = useState("#ffffff");

  const [livePreviewDataUrl, setLivePreviewDataUrl] = useState("");
  const [isPreviewRendering, setIsPreviewRendering] = useState(false);

  const [pngDataUrl, setPngDataUrl] = useState("");
  const [jpgDataUrl, setJpgDataUrl] = useState("");
  const [createdWidth, setCreatedWidth] = useState(0);
  const [createdHeight, setCreatedHeight] = useState(0);
  const [pngSize, setPngSize] = useState(0);
  const [jpgSize, setJpgSize] = useState(0);

  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [lastEstimatedTimeMs, setLastEstimatedTimeMs] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedSize = useMemo(() => {
    const preset = SIZE_PRESETS.find((item) => item.id === sizePreset);

    if (preset?.id === "custom") {
      return {
        ...preset,
        width: clampNumber(customWidth, 300, 2500),
        height: clampNumber(customHeight, 300, 2500),
      };
    }

    return preset || SIZE_PRESETS[0];
  }, [sizePreset, customWidth, customHeight]);

  const selectedGradient = useMemo(() => {
    return (
      GRADIENT_PRESETS.find((gradient) => gradient.id === gradientId) ||
      GRADIENT_PRESETS[0]
    );
  }, [gradientId]);

  const estimatedProcessingTime = useMemo(() => {
    return getProcessingDelayMs(
      selectedSize.width,
      selectedSize.height,
      Boolean(backgroundImageDataUrl)
    );
  }, [selectedSize.width, selectedSize.height, backgroundImageDataUrl]);

  const wordCount = useMemo(() => {
    return quoteText.trim() ? quoteText.trim().split(/\s+/).length : 0;
  }, [quoteText]);

  useEffect(() => {
    let cancelled = false;

    async function renderLivePreview() {
      if (!quoteText.trim()) {
        setLivePreviewDataUrl("");
        return;
      }

      setIsPreviewRendering(true);

      try {
        const result = await createQuoteImage();
        if (!cancelled) {
          setLivePreviewDataUrl(result.pngDataUrl);
        }
      } catch {
        if (!cancelled) {
          setLivePreviewDataUrl("");
        }
      } finally {
        if (!cancelled) {
          setIsPreviewRendering(false);
        }
      }
    }

    const timer = window.setTimeout(renderLivePreview, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    quoteText,
    authorText,
    brandText,
    brandColor,
    selectedSize.width,
    selectedSize.height,
    backgroundMode,
    gradientId,
    solidColor,
    backgroundImageDataUrl,
    overlayColor,
    overlayOpacity,
    fontFamily,
    fontWeight,
    fontSize,
    authorSize,
    lineHeight,
    textColor,
    authorColor,
    textAlign,
    textPosition,
    textShadow,
    quoteMarks,
    textBoxEnabled,
    textBoxColor,
    textBoxOpacity,
  ]);

  const previewStyle = useMemo(() => {
    if (backgroundMode === "solid") {
      return {
        background: solidColor,
      };
    }

    if (backgroundMode === "image" && backgroundImageDataUrl) {
      return {
        backgroundImage: `linear-gradient(rgba(0,0,0,${
          overlayOpacity / 100
        }), rgba(0,0,0,${
          overlayOpacity / 100
        })), url(${backgroundImageDataUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }

    return {
      background: `linear-gradient(135deg, ${selectedGradient.colors[0]}, ${selectedGradient.colors[1]})`,
    };
  }, [
    backgroundMode,
    solidColor,
    backgroundImageDataUrl,
    overlayOpacity,
    selectedGradient,
  ]);

  function clearOutput() {
    setPngDataUrl("");
    setJpgDataUrl("");
    setCreatedWidth(0);
    setCreatedHeight(0);
    setPngSize(0);
    setJpgSize(0);
    setProcessingTimeMs(0);
    setProgress(0);
    setSuccess("");
    setError("");
  }

  function handleInputChange(setter, value) {
    setter(value);
    clearOutput();
  }

  function applyTemplate(template) {
    setBackgroundMode(template.backgroundMode);
    setGradientId(template.gradientId || "midnight");

    if (template.solidColor) {
      setSolidColor(template.solidColor);
    }

    setTextColor(template.textColor);
    setAuthorColor(template.authorColor);
    setTextAlign(template.textAlign);
    setTextPosition(template.textPosition);
    setFontFamily(template.fontFamily);
    setFontWeight(template.fontWeight);
    setTextShadow(template.textShadow);
    setTextBoxEnabled(template.textBoxEnabled);
    setOverlayOpacity(template.overlayOpacity);

    if (typeof template.textBoxColor === "string") {
      setTextBoxColor(template.textBoxColor);
    }

    if (typeof template.textBoxOpacity === "number") {
      setTextBoxOpacity(template.textBoxOpacity);
    }

    clearOutput();
  }

  function handleRandomDesign() {
    const randomTemplate =
      TEMPLATE_PRESETS[Math.floor(Math.random() * TEMPLATE_PRESETS.length)];
    const randomSize = [54, 58, 62, 68, 74][Math.floor(Math.random() * 5)];

    applyTemplate(randomTemplate);
    setFontSize(randomSize);
    setAuthorSize(Math.max(22, Math.round(randomSize * 0.45)));
  }

  async function handleBackgroundUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    const isValidType = ["image/jpeg", "image/png", "image/webp"].includes(
      file.type
    );

    if (!isValidType) {
      setError("Please upload a valid JPG, PNG, or WEBP background image.");
      resetFileInput();
      return;
    }

    if (file.size > MAX_BACKGROUND_SIZE_MB * 1024 * 1024) {
      setError(`Background image must be under ${MAX_BACKGROUND_SIZE_MB} MB.`);
      resetFileInput();
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      setBackgroundImageDataUrl(dataUrl);
      setBackgroundImageName(file.name);
      setBackgroundMode("image");
      clearOutput();
      setSuccess("Background image added successfully.");
    } catch {
      setError("Could not read this image. Please try a different file.");
    } finally {
      resetFileInput();
    }
  }

  function removeBackgroundImage() {
    setBackgroundImageDataUrl("");
    setBackgroundImageName("");
    setBackgroundMode("gradient");
    clearOutput();
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleCreateImage() {
    setError("");
    setSuccess("");
    setProgress(0);
    setProcessingTimeMs(0);

    if (!quoteText.trim()) {
      setError("Please enter a motivational quote first.");
      return;
    }

    setIsCreating(true);

    const processingDelay = getProcessingDelayMs(
      selectedSize.width,
      selectedSize.height,
      Boolean(backgroundImageDataUrl)
    );

    setLastEstimatedTimeMs(processingDelay);

    const startTime = performance.now();

    try {
      const processingDelayPromise = startSmartProgress(processingDelay);
      const renderPromise = createQuoteImage();

      const result = await renderPromise;

      await processingDelayPromise;

      setProgress(100);
      setPngDataUrl(result.pngDataUrl);
      setJpgDataUrl(result.jpgDataUrl);
      setCreatedWidth(result.width);
      setCreatedHeight(result.height);
      setPngSize(result.pngSize);
      setJpgSize(result.jpgSize);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));
      setProcessingTimeMs(actualTime);
      setSuccess(`Final image created in ${(actualTime / 1000).toFixed(1)}s.`);
    } catch {
      setError("Could not create the final image. Please try again.");
    } finally {
      window.setTimeout(() => {
        setIsCreating(false);
      }, 350);
    }
  }

  async function startSmartProgress(delayMs) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const timer = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const nextProgress = Math.min(96, Math.round((elapsed / delayMs) * 96));

        setProgress(nextProgress);

        if (elapsed >= delayMs) {
          window.clearInterval(timer);
          resolve();
        }
      }, 120);
    });
  }

  async function createQuoteImage() {
    const width = selectedSize.width;
    const height = selectedSize.height;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas is not supported.");
    }

    await drawBackground(ctx, width, height);
    drawOverlay(ctx, width, height);
    drawQuoteContent(ctx, width, height);
    drawBrandText(ctx, width, height);

    const pngOutput = canvas.toDataURL("image/png");
    const jpgOutput = canvas.toDataURL("image/jpeg", 0.92);

    return {
      pngDataUrl: pngOutput,
      jpgDataUrl: jpgOutput,
      pngSize: estimateDataUrlSize(pngOutput),
      jpgSize: estimateDataUrlSize(jpgOutput),
      width,
      height,
    };
  }

  async function drawBackground(ctx, width, height) {
    if (backgroundMode === "image" && backgroundImageDataUrl) {
      const image = await loadImage(backgroundImageDataUrl);
      drawImageCover(ctx, image, width, height);
      return;
    }

    if (backgroundMode === "solid") {
      ctx.fillStyle = solidColor;
      ctx.fillRect(0, 0, width, height);
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, selectedGradient.colors[0]);
    gradient.addColorStop(1, selectedGradient.colors[1]);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    drawSoftPattern(ctx, width, height);
  }

  function drawOverlay(ctx, width, height) {
    if (overlayOpacity <= 0) return;

    ctx.save();
    ctx.fillStyle = hexToRgba(overlayColor, overlayOpacity / 100);
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function drawQuoteContent(ctx, width, height) {
    const padding = Math.round(width * 0.09);
    const maxTextWidth = width - padding * 2;
    const cleanQuote = quoteMarks
      ? `“${quoteText.trim()}”`
      : quoteText.trim();

    const safeFontSize = getResponsiveFontSize(width, height, fontSize);
    const safeAuthorSize = getResponsiveFontSize(width, height, authorSize);
    const lineGap = safeFontSize * lineHeight;

    ctx.save();

    ctx.textAlign = textAlign;
    ctx.textBaseline = "middle";
    ctx.font = `${fontWeight} ${safeFontSize}px ${fontFamily}`;

    const lines = wrapText(ctx, cleanQuote, maxTextWidth);
    const authorLine = authorText.trim() ? `— ${authorText.trim()}` : "";
    const authorGap = authorLine ? safeAuthorSize * 1.7 : 0;
    const totalTextHeight = lines.length * lineGap + authorGap;

    const centerY = getTextCenterY(textPosition, height, totalTextHeight);
    const startY = centerY - totalTextHeight / 2 + lineGap / 2;
    const textX = getTextX(textAlign, width, padding);

    if (textBoxEnabled) {
      drawTextBox(
        ctx,
        width,
        startY,
        totalTextHeight,
        padding,
        textBoxColor,
        textBoxOpacity
      );
    }

    if (textShadow) {
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = Math.round(safeFontSize * 0.18);
      ctx.shadowOffsetY = Math.round(safeFontSize * 0.08);
    }

    ctx.fillStyle = textColor;

    lines.forEach((line, index) => {
      ctx.fillText(line, textX, startY + index * lineGap);
    });

    if (authorLine) {
      ctx.shadowBlur = textShadow ? Math.round(safeAuthorSize * 0.12) : 0;
      ctx.font = `600 ${safeAuthorSize}px ${fontFamily}`;
      ctx.fillStyle = authorColor;
      ctx.fillText(authorLine, textX, startY + lines.length * lineGap + authorGap);
    }

    ctx.restore();
  }

  function drawBrandText(ctx, width, height) {
    if (!brandText.trim()) return;

    const brandFontSize = Math.max(18, Math.round(width * 0.026));
    const bottomPadding = Math.round(height * 0.045);

    ctx.save();
    ctx.font = `600 ${brandFontSize}px Arial, sans-serif`;
    ctx.fillStyle = brandColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = Math.round(brandFontSize * 0.3);
    ctx.shadowOffsetY = 2;

    ctx.fillText(brandText.trim(), width / 2, height - bottomPadding);
    ctx.restore();
  }

  function drawTextBox(
    ctx,
    width,
    startY,
    totalTextHeight,
    padding,
    boxColor,
    opacity
  ) {
    const boxX = padding * 0.55;
    const boxWidth = width - padding * 1.1;
    const boxPaddingY = Math.round(totalTextHeight * 0.22);
    const boxY = startY - boxPaddingY;
    const boxHeight = totalTextHeight + boxPaddingY * 2;
    const radius = Math.round(width * 0.025);

    ctx.save();
    ctx.fillStyle = hexToRgba(boxColor, opacity / 100);
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, radius);
    ctx.fill();
    ctx.restore();
  }

  async function handleDownload(format) {
    setError("");
    setSuccess("");
    setProgress(0);
    setProcessingTimeMs(0);

    if (!quoteText.trim()) {
      setError("Please enter a motivational quote first.");
      return;
    }

    setIsCreating(true);

    const processingDelay = getProcessingDelayMs(
      selectedSize.width,
      selectedSize.height,
      Boolean(backgroundImageDataUrl)
    );

    setLastEstimatedTimeMs(processingDelay);

    const startTime = performance.now();

    try {
      const processingDelayPromise = startSmartProgress(processingDelay);
      const result = await createQuoteImage();
      await processingDelayPromise;

      setProgress(100);
      setPngDataUrl(result.pngDataUrl);
      setJpgDataUrl(result.jpgDataUrl);
      setCreatedWidth(result.width);
      setCreatedHeight(result.height);
      setPngSize(result.pngSize);
      setJpgSize(result.jpgSize);

      const dataUrl = format === "jpg" ? result.jpgDataUrl : result.pngDataUrl;
      const filename = `motivational-quote-${result.width}x${result.height}.${format}`;
      await downloadDataUrl(dataUrl, filename, format === "jpg" ? "image/jpeg" : "image/png");

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));
      setProcessingTimeMs(actualTime);
      setSuccess(`Final ${format.toUpperCase()} image downloaded in ${(actualTime / 1000).toFixed(1)}s.`);
    } catch (downloadError) {
      if (downloadError?.name === "AbortError") {
        setSuccess("Download cancelled.");
      } else {
        setError("Could not download the final image. Please try again.");
      }
    } finally {
      window.setTimeout(() => setIsCreating(false), 350);
    }
  }

  function handleReset() {
    setQuoteText(DEFAULT_QUOTE);
    setAuthorText(DEFAULT_AUTHOR);

    setSizePreset("instagram-square");
    setCustomWidth(1080);
    setCustomHeight(1080);

    setBackgroundMode("gradient");
    setGradientId("midnight");
    setSolidColor("#111827");
    setBackgroundImageDataUrl("");
    setBackgroundImageName("");

    setOverlayColor("#000000");
    setOverlayOpacity(15);

    setFontFamily("Georgia, serif");
    setFontWeight("700");
    setFontSize(62);
    setAuthorSize(28);
    setLineHeight(1.22);
    setTextColor("#ffffff");
    setAuthorColor("#e5e7eb");
    setTextAlign("center");
    setTextPosition("center");
    setTextShadow(true);
    setQuoteMarks(true);

    setTextBoxEnabled(false);
    setTextBoxColor("#000000");
    setTextBoxOpacity(25);

    setBrandText("");
    setBrandColor("#ffffff");

    setLivePreviewDataUrl("");
    setPngDataUrl("");
    setJpgDataUrl("");
    setCreatedWidth(0);
    setCreatedHeight(0);
    setPngSize(0);
    setJpgSize(0);

    setIsCreating(false);
    setProgress(0);
    setProcessingTimeMs(0);
    setLastEstimatedTimeMs(0);

    setError("");
    setSuccess("");
    resetFileInput();
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <ImageIcon size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">
          Motivational Quote Image Maker
        </h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Create clean quote images for social media. Add your text first,
          adjust only what you need, preview the design, and download as PNG or JPG.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_430px] gap-5 lg:gap-6">
          <div className="order-1 flex flex-col gap-5">
            <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Quote size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Quote Text</h2>
              </div>

              <TextAreaField
                label="Motivational Quote"
                value={quoteText}
                onChange={(value) => handleInputChange(setQuoteText, value)}
                placeholder="Type your motivational quote here..."
                rows={5}
              />
            </div>

            <CollapsibleSection
              title="Optional Details"
              subtitle="Author name and brand text are hidden by default."
              icon={Quote}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <InputField
                  label="Author / Name"
                  value={authorText}
                  onChange={(value) => handleInputChange(setAuthorText, value)}
                  placeholder="Optional"
                />

                <InputField
                  label="Brand / Handle / Website"
                  value={brandText}
                  onChange={(value) => handleInputChange(setBrandText, value)}
                  placeholder="@yourbrand or yourwebsite.com"
                />

                <ColorField
                  label="Brand Text Color"
                  value={brandColor}
                  onChange={(value) => handleInputChange(setBrandColor, value)}
                />
              </div>
            </CollapsibleSection>

            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCreateImage}
                disabled={isCreating}
                className={`btn-primary inline-flex items-center justify-center gap-2 ${
                  isCreating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                {isCreating ? "Creating..." : "Create Image"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isCreating}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  isCreating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>

            {isCreating && (
              <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                  <span>Processing final image...</span>
                  <span>{progress}%</span>
                </div>

                <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  Estimated time: {Math.ceil(lastEstimatedTimeMs / 1000)}s
                </p>
              </div>
            )}

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

            <CollapsibleSection
              title="Image Size"
              subtitle={`${selectedSize.label} • ${selectedSize.width}×${selectedSize.height}`}
              icon={FileImage}
            >
              <div className="grid sm:grid-cols-2 gap-3">
                {SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleInputChange(setSizePreset, preset.id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      sizePreset === preset.id
                        ? "border-[var(--primary)] bg-[#f8f4ff] text-[var(--primary)]"
                        : "border-[var(--border)] bg-white"
                    }`}
                  >
                    <p className="text-sm font-semibold">{preset.label}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {preset.size}
                    </p>
                  </button>
                ))}
              </div>

              {sizePreset === "custom" && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <InputField
                    label="Custom Width"
                    type="number"
                    value={customWidth}
                    onChange={(value) =>
                      handleInputChange(setCustomWidth, Number(value))
                    }
                    placeholder="1080"
                  />

                  <InputField
                    label="Custom Height"
                    type="number"
                    value={customHeight}
                    onChange={(value) =>
                      handleInputChange(setCustomHeight, Number(value))
                    }
                    placeholder="1080"
                  />
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Quick Templates"
              subtitle="Apply ready-made design styles."
              icon={Sparkles}
            >
              <button
                type="button"
                onClick={handleRandomDesign}
                className="btn-secondary inline-flex items-center justify-center gap-2 mb-4"
              >
                <Sparkles size={16} />
                Random Design
              </button>

              <div className="grid sm:grid-cols-2 gap-3">
                {TEMPLATE_PRESETS.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="rounded-xl border border-[var(--border)] bg-white p-3 text-left hover:bg-[#f8f4ff] transition"
                  >
                    <p className="font-semibold text-sm">{template.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Background, font, color, and layout.
                    </p>
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Background"
              subtitle={backgroundMode === "image" ? "Image background" : backgroundMode}
              icon={Palette}
            >
              <div className="grid grid-cols-3 gap-3 mb-4">
                <ModeButton
                  label="Gradient"
                  isActive={backgroundMode === "gradient"}
                  onClick={() => handleInputChange(setBackgroundMode, "gradient")}
                />

                <ModeButton
                  label="Solid"
                  isActive={backgroundMode === "solid"}
                  onClick={() => handleInputChange(setBackgroundMode, "solid")}
                />

                <ModeButton
                  label="Image"
                  isActive={backgroundMode === "image"}
                  onClick={() => handleInputChange(setBackgroundMode, "image")}
                />
              </div>

              {backgroundMode === "gradient" && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {GRADIENT_PRESETS.map((gradient) => (
                    <button
                      key={gradient.id}
                      type="button"
                      onClick={() => handleInputChange(setGradientId, gradient.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        gradientId === gradient.id
                          ? "border-[var(--primary)]"
                          : "border-[var(--border)]"
                      }`}
                    >
                      <div
                        className="h-10 rounded-lg mb-2"
                        style={{
                          background: `linear-gradient(135deg, ${gradient.colors[0]}, ${gradient.colors[1]})`,
                        }}
                      />
                      <p className="text-sm font-semibold">{gradient.name}</p>
                    </button>
                  ))}
                </div>
              )}

              {backgroundMode === "solid" && (
                <ColorField
                  label="Solid Background Color"
                  value={solidColor}
                  onChange={(value) => handleInputChange(setSolidColor, value)}
                />
              )}

              {backgroundMode === "image" && (
                <div>
                  <label className="block border-2 border-dashed border-[var(--border)] rounded-2xl p-6 text-center cursor-pointer hover:bg-[#f8f4ff] transition">
                    <Upload
                      size={32}
                      className="mx-auto mb-3 text-[var(--primary)]"
                    />
                    <p className="font-semibold">Upload Background Image</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      JPG, PNG, or WEBP. Max {MAX_BACKGROUND_SIZE_MB} MB.
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleBackgroundUpload}
                      className="hidden"
                    />
                  </label>

                  {backgroundImageName && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#f8f4ff] border border-[var(--border)] p-3">
                      <p className="text-sm truncate">{backgroundImageName}</p>

                      <button
                        type="button"
                        onClick={removeBackgroundImage}
                        className="text-red-600 inline-flex items-center gap-1 text-sm font-semibold"
                      >
                        <Trash2 size={15} />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 mt-5">
                <ColorField
                  label="Overlay Color"
                  value={overlayColor}
                  onChange={(value) => handleInputChange(setOverlayColor, value)}
                />

                <RangeField
                  label={`Overlay Opacity: ${overlayOpacity}%`}
                  min="0"
                  max="80"
                  step="1"
                  value={overlayOpacity}
                  onChange={(value) =>
                    handleInputChange(setOverlayOpacity, Number(value))
                  }
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Text Style"
              subtitle="Font, colors, size, position, and alignment."
              icon={Type}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <SelectField
                  label="Font Family"
                  value={fontFamily}
                  onChange={(value) => handleInputChange(setFontFamily, value)}
                  options={FONT_OPTIONS}
                />

                <SelectField
                  label="Font Weight"
                  value={fontWeight}
                  onChange={(value) => handleInputChange(setFontWeight, value)}
                  options={[
                    { value: "400", label: "Regular" },
                    { value: "600", label: "Semi Bold" },
                    { value: "700", label: "Bold" },
                    { value: "800", label: "Extra Bold" },
                  ]}
                />

                <RangeField
                  label={`Quote Font Size: ${fontSize}px`}
                  min="32"
                  max="110"
                  step="1"
                  value={fontSize}
                  onChange={(value) =>
                    handleInputChange(setFontSize, Number(value))
                  }
                />

                <RangeField
                  label={`Author Font Size: ${authorSize}px`}
                  min="16"
                  max="52"
                  step="1"
                  value={authorSize}
                  onChange={(value) =>
                    handleInputChange(setAuthorSize, Number(value))
                  }
                />

                <RangeField
                  label={`Line Height: ${lineHeight}`}
                  min="1"
                  max="1.8"
                  step="0.02"
                  value={lineHeight}
                  onChange={(value) =>
                    handleInputChange(setLineHeight, Number(value))
                  }
                />

                <SelectField
                  label="Text Position"
                  value={textPosition}
                  onChange={(value) => handleInputChange(setTextPosition, value)}
                  options={[
                    { value: "top", label: "Top" },
                    { value: "center", label: "Center" },
                    { value: "bottom", label: "Bottom" },
                  ]}
                />

                <ColorField
                  label="Quote Text Color"
                  value={textColor}
                  onChange={(value) => handleInputChange(setTextColor, value)}
                />

                <ColorField
                  label="Author Text Color"
                  value={authorColor}
                  onChange={(value) => handleInputChange(setAuthorColor, value)}
                />
              </div>

              <div className="mt-5">
                <label className="block text-sm font-semibold mb-2">
                  Text Alignment
                </label>

                <div className="grid grid-cols-3 gap-3">
                  <AlignButton
                    label="Left"
                    icon={AlignLeft}
                    isActive={textAlign === "left"}
                    onClick={() => handleInputChange(setTextAlign, "left")}
                  />

                  <AlignButton
                    label="Center"
                    icon={AlignCenter}
                    isActive={textAlign === "center"}
                    onClick={() => handleInputChange(setTextAlign, "center")}
                  />

                  <AlignButton
                    label="Right"
                    icon={AlignRight}
                    isActive={textAlign === "right"}
                    onClick={() => handleInputChange(setTextAlign, "right")}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-5">
                <ToggleField
                  label="Quote Marks"
                  checked={quoteMarks}
                  onChange={(value) => handleInputChange(setQuoteMarks, value)}
                />

                <ToggleField
                  label="Text Shadow"
                  checked={textShadow}
                  onChange={(value) => handleInputChange(setTextShadow, value)}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Readable Text Box"
              subtitle="Optional box behind the quote."
              icon={SlidersHorizontal}
            >
              <ToggleField
                label="Add background box behind quote"
                checked={textBoxEnabled}
                onChange={(value) => handleInputChange(setTextBoxEnabled, value)}
              />

              {textBoxEnabled && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <ColorField
                    label="Text Box Color"
                    value={textBoxColor}
                    onChange={(value) =>
                      handleInputChange(setTextBoxColor, value)
                    }
                  />

                  <RangeField
                    label={`Text Box Opacity: ${textBoxOpacity}%`}
                    min="5"
                    max="80"
                    step="1"
                    value={textBoxOpacity}
                    onChange={(value) =>
                      handleInputChange(setTextBoxOpacity, Number(value))
                    }
                  />
                </div>
              )}
            </CollapsibleSection>
          </div>

          <div className="order-2 lg:sticky lg:top-4 h-fit flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-start gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ImageIcon size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-semibold">Preview</h2>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {selectedSize.width} × {selectedSize.height}px
                  </p>
                </div>
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-3 sm:p-4 bg-gray-50 min-h-[320px] sm:min-h-[520px] flex items-center justify-center overflow-auto relative">
                {isPreviewRendering && (
                  <div className="absolute top-3 right-3 z-10 rounded-full bg-white/90 border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--primary)] shadow-sm">
                    Updating...
                  </div>
                )}

                {livePreviewDataUrl ? (
                  <div className="w-full text-center">
                    <div className="inline-block bg-white rounded-2xl border border-[var(--border)] p-2 sm:p-3 shadow-sm">
                      <img
                        src={livePreviewDataUrl}
                        alt="Live motivational quote preview"
                        className="max-w-full h-auto rounded-xl"
                        style={{ maxHeight: "min(68vh, 520px)" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-[var(--text-secondary)] px-4">
                    Enter a quote to prepare the live preview.
                  </div>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDownload("png")}
                disabled={isCreating}
                className={`btn-primary inline-flex items-center justify-center gap-2 ${
                  isCreating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download PNG
              </button>

              <button
                type="button"
                onClick={() => handleDownload("jpg")}
                disabled={isCreating}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  isCreating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download JPG
              </button>
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="motivational-quote-image-maker" />
    </div>
  );
}

function CollapsibleSection({ title, subtitle, icon: Icon, children }) {
  return (
    <details className="group border border-[var(--border)] rounded-2xl bg-white overflow-hidden">
      <summary className="list-none cursor-pointer p-5 flex items-center justify-between gap-3 hover:bg-[#f8f4ff] transition">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#f4edff] flex items-center justify-center shrink-0">
            <Icon size={20} className="text-[var(--primary)]" />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold">{title}</h3>
            {subtitle && (
              <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <ChevronDown
          size={20}
          className="text-[var(--primary)] transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-[var(--border)] bg-[#fafafa] p-5">
        {children}
      </div>
    </details>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 5 }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)] resize-none"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>

      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-12 border border-[var(--border)] rounded-xl p-1 bg-white"
      />
    </div>
  );
}

function RangeField({ label, min, max, step, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>

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

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-white p-4 cursor-pointer">
      <span className="text-sm font-semibold">{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="w-4 h-4 accent-[var(--primary)]"
      />
    </label>
  );
}

function ModeButton({ label, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-sm font-semibold transition ${
        isActive
          ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
          : "border-[var(--border)] bg-white"
      }`}
    >
      {label}
    </button>
  );
}

function AlignButton({ label, icon: Icon, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-sm font-semibold transition ${
        isActive
          ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
          : "border-[var(--border)] bg-white"
      }`}
    >
      <Icon size={18} className="mx-auto mb-1" />
      {label}
    </button>
  );
}

function StatCard({ label, value, green = false }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-4 text-center">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p
        className={`text-xl font-bold break-all ${
          green ? "text-green-600" : "text-[var(--primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function getProcessingDelayMs(width, height, hasBackgroundImage) {
  const megapixels = (width * height) / 1000000;
  const calculatedDelay = 1800 + megapixels * 650 + (hasBackgroundImage ? 1200 : 0);

  return Math.min(8000, Math.max(2500, Math.round(calculatedDelay)));
}

function getResponsiveFontSize(width, height, baseSize) {
  const scale = Math.min(width, height) / 1080;
  return Math.max(18, Math.round(baseSize * scale));
}

function getTextCenterY(position, height, totalTextHeight) {
  if (position === "top") {
    return height * 0.28 + totalTextHeight * 0.1;
  }

  if (position === "bottom") {
    return height * 0.72 - totalTextHeight * 0.1;
  }

  return height / 2;
}

function getTextX(textAlign, width, padding) {
  if (textAlign === "left") return padding;
  if (textAlign === "right") return width - padding;
  return width / 2;
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawSoftPattern(ctx, width, height) {
  ctx.save();

  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#ffffff";

  const circleCount = 8;

  for (let index = 0; index < circleCount; index += 1) {
    const radius = Math.min(width, height) * (0.08 + index * 0.018);
    const x = (width / circleCount) * index + radius;
    const y = index % 2 === 0 ? height * 0.2 : height * 0.78;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawImageCover(ctx, image, canvasWidth, canvasHeight) {
  const imageRatio = image.width / image.height;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth = canvasWidth;
  let drawHeight = canvasHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imageRatio;
    offsetX = (canvasWidth - drawWidth) / 2;
  } else {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imageRatio;
    offsetY = (canvasHeight - drawHeight) / 2;
  }

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function roundRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height
  );
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function hexToRgba(hex, alpha) {
  const cleanHex = String(hex || "#000000").replace("#", "");
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((char) => char + char)
          .join("")
      : cleanHex;

  const red = parseInt(fullHex.slice(0, 2), 16);
  const green = parseInt(fullHex.slice(2, 4), 16);
  const blue = parseInt(fullHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function estimateDataUrlSize(dataUrl) {
  if (!dataUrl) return 0;

  const base64 = dataUrl.split(",")[1] || "";
  return Math.round((base64.length * 3) / 4);
}

async function downloadDataUrl(dataUrl, filename, mimeType = "image/png") {
  const blob = dataUrlToBlob(dataUrl, mimeType);
  const file = new File([blob], filename, { type: mimeType });

  const canShareFile =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function" &&
    navigator.canShare({ files: [file] });

  if (canShareFile) {
    await navigator.share({
      files: [file],
      title: filename,
    });
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
}

function dataUrlToBlob(dataUrl, fallbackType = "image/png") {
  const [header, base64] = String(dataUrl || "").split(",");
  const mimeMatch = /data:([^;]+);base64/.exec(header || "");
  const mimeType = mimeMatch?.[1] || fallbackType;
  const binary = atob(base64 || "");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
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