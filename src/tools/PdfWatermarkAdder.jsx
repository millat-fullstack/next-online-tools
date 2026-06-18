import { useEffect, useMemo, useRef, useState } from "react";
import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
} from "pdf-lib";
import {
  Upload,
  Download,
  RotateCcw,
  FileText,
  Type,
  Image as ImageIcon,
  SlidersHorizontal,
  Layers,
  Eye,
  Clock3,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "PDF Watermark Adder",
  path: "/pdf-watermark-adder",
  category: "PDF Tools",
  description:
    "Add text or image watermarks to PDF files online with opacity, position, rotation, page range, repeated pattern, preview, and download.",
  metaTitle: "Add Watermark to PDF Online - Text & Image Watermark Tool",
  metaDescription:
    "Add text or image watermark to PDF files online. Customize opacity, rotation, position, size, page range, repeated watermark pattern, and download your watermarked PDF.",
};

const MAX_PDF_SIZE_MB = 80;
const MAX_IMAGE_SIZE_MB = 8;

const TEXT_PRESETS = [
  "CONFIDENTIAL",
  "DRAFT",
  "SAMPLE",
  "COPY",
  "PAID",
  "DO NOT COPY",
  "APPROVED",
  "REVIEW",
];

const POSITION_OPTIONS = [
  { value: "center", label: "Center" },
  { value: "top-left", label: "Top Left" },
  { value: "top-center", label: "Top Center" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "custom", label: "Custom" },
];

const PAGE_RANGE_OPTIONS = [
  { value: "all", label: "All Pages" },
  { value: "first", label: "First Page Only" },
  { value: "last", label: "Last Page Only" },
  { value: "odd", label: "Odd Pages" },
  { value: "even", label: "Even Pages" },
  { value: "custom", label: "Custom Range" },
];

const FONT_OPTIONS = [
  { value: StandardFonts.Helvetica, label: "Helvetica" },
  { value: StandardFonts.HelveticaBold, label: "Helvetica Bold" },
  { value: StandardFonts.TimesRoman, label: "Times Roman" },
  { value: StandardFonts.TimesRomanBold, label: "Times Bold" },
  { value: StandardFonts.Courier, label: "Courier" },
  { value: StandardFonts.CourierBold, label: "Courier Bold" },
];

const EMPTY_PDF = {
  name: "",
  size: 0,
  bytes: null,
  pageCount: 0,
  firstPageWidth: 595,
  firstPageHeight: 842,
};

export default function PdfWatermarkAdder() {
  const pdfInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const outputUrlRef = useRef("");

  const [pdfFile, setPdfFile] = useState(EMPTY_PDF);
  const [watermarkType, setWatermarkType] = useState("text");

  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [fontName, setFontName] = useState(StandardFonts.HelveticaBold);
  const [fontSize, setFontSize] = useState(56);
  const [textColor, setTextColor] = useState("#777777");

  const [imageBytes, setImageBytes] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [imageMimeType, setImageMimeType] = useState("");
  const [imageSizePercent, setImageSizePercent] = useState(35);

  const [opacity, setOpacity] = useState(20);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState("center");
  const [customX, setCustomX] = useState(50);
  const [customY, setCustomY] = useState(50);
  const [repeatWatermark, setRepeatWatermark] = useState(false);
  const [repeatGap, setRepeatGap] = useState(180);
  const [layerMode, setLayerMode] = useState("above");

  const [pageRangeMode, setPageRangeMode] = useState("all");
  const [customPageRange, setCustomPageRange] = useState("1-3,5");

  const [outputBlob, setOutputBlob] = useState(null);
  const [outputSize, setOutputSize] = useState(0);
  const [outputPageCount, setOutputPageCount] = useState(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [estimatedTimeMs, setEstimatedTimeMs] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [openPanels, setOpenPanels] = useState({
    type: true,
    settings: true,
    position: false,
    pages: false,
    advanced: false,
  });

  useEffect(() => {
    return () => {
      if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const hasPdf = Boolean(pdfFile.bytes);
  const hasOutput = Boolean(outputBlob);

  const selectedPages = useMemo(() => {
    if (!hasPdf) return [];

    return getSelectedPageIndexes(
      pageRangeMode,
      customPageRange,
      pdfFile.pageCount
    );
  }, [hasPdf, pageRangeMode, customPageRange, pdfFile.pageCount]);

  const estimatedProcessingTime = useMemo(() => {
    if (!hasPdf) return 0;

    return estimateProcessingTime({
      pageCount: selectedPages.length || pdfFile.pageCount,
      fileSize: pdfFile.size,
      hasImage: watermarkType === "image" && Boolean(imageBytes),
      repeatWatermark,
    });
  }, [
    hasPdf,
    selectedPages.length,
    pdfFile.pageCount,
    pdfFile.size,
    watermarkType,
    imageBytes,
    repeatWatermark,
  ]);

  const previewStyle = useMemo(() => {
    const ratio = pdfFile.firstPageWidth / pdfFile.firstPageHeight;

    return {
      aspectRatio: `${ratio}`,
    };
  }, [pdfFile.firstPageWidth, pdfFile.firstPageHeight]);

  const previewWatermarkStyle = useMemo(() => {
    const opacityValue = opacity / 100;
    const fontScale = clampNumber(fontSize / 56, 0.55, 2.2);
    const coords = getPreviewPosition(position, customX, customY);

    return {
      left: `${coords.left}%`,
      top: `${coords.top}%`,
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      opacity: opacityValue,
      color: textColor,
      fontSize: `${Math.round(28 * fontScale)}px`,
      fontWeight: 800,
      whiteSpace: "nowrap",
    };
  }, [opacity, fontSize, position, customX, customY, rotation, textColor]);

  function clearOutput() {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = "";
    }

    setOutputBlob(null);
    setOutputSize(0);
    setOutputPageCount(0);
    setProcessingTimeMs(0);
    setProgress(0);
    setSuccess("");
    setError("");
  }

  function togglePanel(panel) {
    setOpenPanels((current) => ({
      ...current,
      [panel]: !current[panel],
    }));
  }

  function updateSetting(setter, value) {
    setter(value);
    clearOutput();
  }

  async function handlePdfUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");
    clearOutput();

    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Please upload a valid PDF file.");
      resetPdfInput();
      return;
    }

    if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
      setError(`PDF must be under ${MAX_PDF_SIZE_MB} MB.`);
      resetPdfInput();
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      setPdfFile({
        name: file.name,
        size: file.size,
        bytes,
        pageCount: pages.length,
        firstPageWidth: width,
        firstPageHeight: height,
      });

      setSuccess("PDF loaded successfully.");
    } catch {
      setError(
        "Could not load this PDF. Password-protected or damaged PDFs may not be supported."
      );
      setPdfFile(EMPTY_PDF);
    } finally {
      resetPdfInput();
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    clearOutput();

    const isSupported = ["image/png", "image/jpeg", "image/jpg"].includes(
      file.type
    );

    if (!isSupported) {
      setError("Please upload a PNG or JPG image watermark.");
      resetImageInput();
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_IMAGE_SIZE_MB} MB.`);
      resetImageInput();
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const previewUrl = URL.createObjectURL(file);

      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);

      setImageBytes(new Uint8Array(arrayBuffer));
      setImagePreviewUrl(previewUrl);
      setImageName(file.name);
      setImageMimeType(file.type);
      setWatermarkType("image");
      setSuccess("Image watermark added.");
    } catch {
      setError("Could not read this image. Please try another PNG or JPG.");
    } finally {
      resetImageInput();
    }
  }

  function removeImageWatermark() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);

    setImageBytes(null);
    setImagePreviewUrl("");
    setImageName("");
    setImageMimeType("");
    setWatermarkType("text");
    clearOutput();
  }

  function resetPdfInput() {
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }

  function resetImageInput() {
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function applyWatermark() {
    if (!hasPdf) {
      setError("Please upload a PDF first.");
      return;
    }

    if (watermarkType === "text" && !watermarkText.trim()) {
      setError("Please enter watermark text.");
      return;
    }

    if (watermarkType === "image" && !imageBytes) {
      setError("Please upload a PNG or JPG watermark image.");
      return;
    }

    if (!selectedPages.length) {
      setError("No pages selected. Please check your page range.");
      return;
    }

    setError("");
    setSuccess("");
    setIsProcessing(true);
    setProgress(5);
    setProcessingTimeMs(0);

    const estimate = estimatedProcessingTime || estimatedProcessingTime;
    setEstimatedTimeMs(estimate);

    const startTime = performance.now();
    const progressTimer = startProgress(estimate);

    try {
      const pdfDoc = await PDFDocument.load(pdfFile.bytes, {
        ignoreEncryption: true,
      });

      const pages = pdfDoc.getPages();

      if (layerMode === "behind") {
        await addWatermarkToPages(pdfDoc, pages, selectedPages, "behind");
      } else {
        await addWatermarkToPages(pdfDoc, pages, selectedPages, "above");
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = URL.createObjectURL(blob);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));

      setOutputBlob(blob);
      setOutputSize(blob.size);
      setOutputPageCount(pages.length);
      setProcessingTimeMs(actualTime);
      setProgress(100);
      setSuccess(`Watermark added in ${(actualTime / 1000).toFixed(1)}s.`);
    } catch {
      setError("Could not add watermark. Please try another PDF or settings.");
    } finally {
      window.clearInterval(progressTimer);
      window.setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 500);
    }
  }

  async function addWatermarkToPages(pdfDoc, pages, pageIndexes) {
    const opacityValue = clampNumber(opacity / 100, 0.01, 1);
    const color = hexToPdfRgb(textColor);

    let embeddedFont = null;
    let embeddedImage = null;
    let imageDimensions = null;

    if (watermarkType === "text") {
      embeddedFont = await pdfDoc.embedFont(fontName);
    }

    if (watermarkType === "image") {
      if (imageMimeType === "image/png") {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      } else {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      }

      imageDimensions = {
        width: embeddedImage.width,
        height: embeddedImage.height,
      };
    }

    pageIndexes.forEach((pageIndex) => {
      const page = pages[pageIndex];
      const { width, height } = page.getSize();

      if (repeatWatermark) {
        drawRepeatedWatermark({
          page,
          width,
          height,
          embeddedFont,
          embeddedImage,
          imageDimensions,
          opacityValue,
          color,
        });

        return;
      }

      drawSingleWatermark({
        page,
        width,
        height,
        embeddedFont,
        embeddedImage,
        imageDimensions,
        opacityValue,
        color,
      });
    });
  }

  function drawSingleWatermark({
    page,
    width,
    height,
    embeddedFont,
    embeddedImage,
    imageDimensions,
    opacityValue,
    color,
  }) {
    if (watermarkType === "text") {
      const safeFontSize = clampNumber(fontSize, 8, 220);
      const text = watermarkText.trim();
      const textWidth = embeddedFont.widthOfTextAtSize(text, safeFontSize);
      const textHeight = safeFontSize;
      const { x, y } = getPdfPosition({
        position,
        customX,
        customY,
        pageWidth: width,
        pageHeight: height,
        itemWidth: textWidth,
        itemHeight: textHeight,
      });

      page.drawText(text, {
        x,
        y,
        size: safeFontSize,
        font: embeddedFont,
        color,
        opacity: opacityValue,
        rotate: degrees(rotation),
      });

      return;
    }

    if (embeddedImage && imageDimensions) {
      const imageWidth = width * (clampNumber(imageSizePercent, 5, 95) / 100);
      const imageHeight = imageWidth * (imageDimensions.height / imageDimensions.width);
      const { x, y } = getPdfPosition({
        position,
        customX,
        customY,
        pageWidth: width,
        pageHeight: height,
        itemWidth: imageWidth,
        itemHeight: imageHeight,
      });

      page.drawImage(embeddedImage, {
        x,
        y,
        width: imageWidth,
        height: imageHeight,
        opacity: opacityValue,
        rotate: degrees(rotation),
      });
    }
  }

  function drawRepeatedWatermark({
    page,
    width,
    height,
    embeddedFont,
    embeddedImage,
    imageDimensions,
    opacityValue,
    color,
  }) {
    const gap = clampNumber(repeatGap, 80, 420);
    const rotationValue = degrees(rotation);

    if (watermarkType === "text") {
      const safeFontSize = clampNumber(fontSize, 8, 180);
      const text = watermarkText.trim();
      const textWidth = embeddedFont.widthOfTextAtSize(text, safeFontSize);

      for (let y = -gap; y < height + gap; y += gap) {
        for (let x = -gap; x < width + gap; x += gap + textWidth * 0.35) {
          page.drawText(text, {
            x,
            y,
            size: safeFontSize,
            font: embeddedFont,
            color,
            opacity: opacityValue,
            rotate: rotationValue,
          });
        }
      }

      return;
    }

    if (embeddedImage && imageDimensions) {
      const imageWidth = width * (clampNumber(imageSizePercent, 5, 95) / 100);
      const imageHeight = imageWidth * (imageDimensions.height / imageDimensions.width);

      for (let y = -gap; y < height + gap; y += gap) {
        for (let x = -gap; x < width + gap; x += gap + imageWidth * 0.35) {
          page.drawImage(embeddedImage, {
            x,
            y,
            width: imageWidth,
            height: imageHeight,
            opacity: opacityValue,
            rotate: rotationValue,
          });
        }
      }
    }
  }

  function startProgress(durationMs) {
    const start = Date.now();

    return window.setInterval(() => {
      const elapsed = Date.now() - start;
      const nextProgress = Math.min(92, Math.round((elapsed / durationMs) * 92));
      setProgress(Math.max(5, nextProgress));
    }, 90);
  }

  function downloadOutput() {
    if (!outputBlob) {
      setError("Please apply watermark first.");
      return;
    }

    const url = URL.createObjectURL(outputBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `watermarked-${getFileBaseName(pdfFile.name)}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function resetTool() {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = "";
    }

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);

    setPdfFile(EMPTY_PDF);
    setWatermarkType("text");
    setWatermarkText("CONFIDENTIAL");
    setFontName(StandardFonts.HelveticaBold);
    setFontSize(56);
    setTextColor("#777777");

    setImageBytes(null);
    setImagePreviewUrl("");
    setImageName("");
    setImageMimeType("");
    setImageSizePercent(35);

    setOpacity(20);
    setRotation(-45);
    setPosition("center");
    setCustomX(50);
    setCustomY(50);
    setRepeatWatermark(false);
    setRepeatGap(180);
    setLayerMode("above");

    setPageRangeMode("all");
    setCustomPageRange("1-3,5");

    setOutputBlob(null);
    setOutputSize(0);
    setOutputPageCount(0);

    setIsProcessing(false);
    setProgress(0);
    setProcessingTimeMs(0);
    setEstimatedTimeMs(0);

    setError("");
    setSuccess("");
    resetPdfInput();
    resetImageInput();
  }

  return (
    <div className="flex flex-col gap-8">
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handlePdfUpload}
        className="hidden"
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleImageUpload}
        className="hidden"
      />

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <FileText size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">PDF Watermark Adder</h1>

        <p className="text-[var(--text-secondary)] max-w-3xl">
          Add text or image watermarks to PDF files with opacity, rotation,
          position, repeated patterns, page ranges, preview, processing time,
          and browser-based download.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        {!hasPdf ? (
          <div
            onClick={() => pdfInputRef.current?.click()}
            className="min-h-[360px] border-2 border-dashed border-[var(--border)] rounded-3xl bg-gray-50 hover:bg-[#f8f4ff] cursor-pointer transition flex flex-col items-center justify-center text-center p-8"
          >
            <Upload size={48} className="text-[var(--primary)] mb-4" />
            <h2 className="text-2xl font-bold mb-2">Upload PDF</h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-xl mb-5">
              Choose a PDF file to add watermark. Max file size{" "}
              {MAX_PDF_SIZE_MB} MB. Files are processed inside your browser.
            </p>
            <button type="button" className="btn-primary inline-flex items-center gap-2">
              <Upload size={18} />
              Choose PDF
            </button>
          </div>
        ) : (
          <div className="grid xl:grid-cols-[minmax(0,1fr)_430px] gap-6">
            <div className="flex flex-col gap-4 min-w-0">
              <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold truncate">{pdfFile.name}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {pdfFile.pageCount} pages • {formatBytes(pdfFile.size)} • First page{" "}
                    {Math.round(pdfFile.firstPageWidth)}×{Math.round(pdfFile.firstPageHeight)} pt
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"
                  >
                    <Upload size={16} />
                    Change PDF
                  </button>

                  <button
                    type="button"
                    onClick={resetTool}
                    className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"
                  >
                    <RotateCcw size={16} />
                    Reset
                  </button>
                </div>
              </div>

              <ToolPanel
                title="Watermark Type"
                icon={Layers}
                open={openPanels.type}
                onToggle={() => togglePanel("type")}
                badge={watermarkType === "text" ? "Text" : "Image"}
              >
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateSetting(setWatermarkType, "text")}
                    className={`rounded-xl border p-4 text-left transition ${
                      watermarkType === "text"
                        ? "border-[var(--primary)] bg-[#f8f4ff] text-[var(--primary)]"
                        : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                    }`}
                  >
                    <Type size={20} className="mb-2" />
                    <p className="font-semibold">Text Watermark</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Add CONFIDENTIAL, DRAFT, COPY, or custom text.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSetting(setWatermarkType, "image")}
                    className={`rounded-xl border p-4 text-left transition ${
                      watermarkType === "image"
                        ? "border-[var(--primary)] bg-[#f8f4ff] text-[var(--primary)]"
                        : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                    }`}
                  >
                    <ImageIcon size={20} className="mb-2" />
                    <p className="font-semibold">Image / Logo</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Add a PNG or JPG logo watermark.
                    </p>
                  </button>
                </div>
              </ToolPanel>

              <ToolPanel
                title={watermarkType === "text" ? "Text Settings" : "Image Settings"}
                icon={watermarkType === "text" ? Type : ImageIcon}
                open={openPanels.settings}
                onToggle={() => togglePanel("settings")}
                badge={watermarkType === "text" ? watermarkText : imageName || "Upload"}
              >
                {watermarkType === "text" ? (
                  <div className="space-y-4">
                    <InputField
                      label="Watermark Text"
                      value={watermarkText}
                      onChange={(value) => updateSetting(setWatermarkText, value)}
                      placeholder="CONFIDENTIAL"
                    />

                    <div>
                      <p className="text-sm font-semibold mb-2">Quick text</p>
                      <div className="flex flex-wrap gap-2">
                        {TEXT_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => updateSetting(setWatermarkText, preset)}
                            className="px-3 py-2 rounded-xl border border-[var(--border)] bg-white hover:bg-[#f8f4ff] text-xs font-semibold"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <SelectField
                        label="Font"
                        value={fontName}
                        onChange={(value) => updateSetting(setFontName, value)}
                        options={FONT_OPTIONS}
                      />

                      <ColorField
                        label="Text Color"
                        value={textColor}
                        onChange={(value) => updateSetting(setTextColor, value)}
                      />

                      <RangeField
                        label={`Font Size: ${fontSize}px`}
                        min="10"
                        max="160"
                        step="1"
                        value={fontSize}
                        onChange={(value) => updateSetting(setFontSize, Number(value))}
                      />

                      <RangeField
                        label={`Opacity: ${opacity}%`}
                        min="1"
                        max="100"
                        step="1"
                        value={opacity}
                        onChange={(value) => updateSetting(setOpacity, Number(value))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full rounded-2xl border-2 border-dashed border-[var(--border)] bg-white hover:bg-[#f8f4ff] p-6 text-center transition"
                    >
                      <Upload size={32} className="mx-auto mb-3 text-[var(--primary)]" />
                      <p className="font-semibold">Upload PNG or JPG watermark</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Transparent PNG logo works best. Max {MAX_IMAGE_SIZE_MB} MB.
                      </p>
                    </button>

                    {imagePreviewUrl && (
                      <div className="rounded-2xl border border-[var(--border)] bg-gray-50 p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={imagePreviewUrl}
                            alt={imageName}
                            className="w-14 h-14 object-contain rounded-lg bg-white border border-[var(--border)]"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{imageName}</p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {imageMimeType}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={removeImageWatermark}
                          className="text-red-600 inline-flex items-center gap-1 text-sm font-semibold"
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      <RangeField
                        label={`Image Size: ${imageSizePercent}%`}
                        min="5"
                        max="95"
                        step="1"
                        value={imageSizePercent}
                        onChange={(value) =>
                          updateSetting(setImageSizePercent, Number(value))
                        }
                      />

                      <RangeField
                        label={`Opacity: ${opacity}%`}
                        min="1"
                        max="100"
                        step="1"
                        value={opacity}
                        onChange={(value) => updateSetting(setOpacity, Number(value))}
                      />
                    </div>
                  </div>
                )}
              </ToolPanel>

              <ToolPanel
                title="Position & Rotation"
                icon={SlidersHorizontal}
                open={openPanels.position}
                onToggle={() => togglePanel("position")}
                badge={`${position} • ${rotation}°`}
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <SelectField
                    label="Position"
                    value={position}
                    onChange={(value) => updateSetting(setPosition, value)}
                    options={POSITION_OPTIONS}
                  />

                  <RangeField
                    label={`Rotation: ${rotation}°`}
                    min="-90"
                    max="90"
                    step="1"
                    value={rotation}
                    onChange={(value) => updateSetting(setRotation, Number(value))}
                  />

                  {position === "custom" && (
                    <>
                      <RangeField
                        label={`Custom X: ${customX}%`}
                        min="0"
                        max="100"
                        step="1"
                        value={customX}
                        onChange={(value) => updateSetting(setCustomX, Number(value))}
                      />

                      <RangeField
                        label={`Custom Y: ${customY}%`}
                        min="0"
                        max="100"
                        step="1"
                        value={customY}
                        onChange={(value) => updateSetting(setCustomY, Number(value))}
                      />
                    </>
                  )}
                </div>
              </ToolPanel>

              <ToolPanel
                title="Page Range"
                icon={FileText}
                open={openPanels.pages}
                onToggle={() => togglePanel("pages")}
                badge={`${selectedPages.length || 0} pages`}
              >
                <div className="space-y-4">
                  <SelectField
                    label="Apply Watermark To"
                    value={pageRangeMode}
                    onChange={(value) => updateSetting(setPageRangeMode, value)}
                    options={PAGE_RANGE_OPTIONS}
                  />

                  {pageRangeMode === "custom" && (
                    <InputField
                      label="Custom Range"
                      value={customPageRange}
                      onChange={(value) => updateSetting(setCustomPageRange, value)}
                      placeholder="1-3,5,8-10"
                    />
                  )}

                  <p className="text-xs text-[var(--text-secondary)] leading-5">
                    Selected pages: {selectedPages.length || 0} of {pdfFile.pageCount}.
                    Custom range example: 1-3,5,8-10.
                  </p>
                </div>
              </ToolPanel>

              <ToolPanel
                title="Advanced"
                icon={Layers}
                open={openPanels.advanced}
                onToggle={() => togglePanel("advanced")}
                badge={repeatWatermark ? "Repeated" : "Single"}
              >
                <div className="space-y-4">
                  <ToggleField
                    label="Repeat watermark pattern"
                    checked={repeatWatermark}
                    onChange={(value) => updateSetting(setRepeatWatermark, value)}
                  />

                  {repeatWatermark && (
                    <RangeField
                      label={`Pattern Gap: ${repeatGap}px`}
                      min="80"
                      max="420"
                      step="10"
                      value={repeatGap}
                      onChange={(value) => updateSetting(setRepeatGap, Number(value))}
                    />
                  )}

                  <SelectField
                    label="Layer"
                    value={layerMode}
                    onChange={(value) => updateSetting(setLayerMode, value)}
                    options={[
                      { value: "above", label: "Above Content" },
                      { value: "behind", label: "Behind Content" },
                    ]}
                  />

                  <p className="text-xs text-[var(--text-secondary)] leading-5">
                    Above content is more visible. Behind content can be softer,
                    but may not show if the PDF has filled backgrounds.
                  </p>
                </div>
              </ToolPanel>
            </div>

            <aside className="flex flex-col gap-4 xl:sticky xl:top-4 h-fit">
              <div className="border border-[var(--border)] rounded-3xl bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Eye size={19} className="text-[var(--primary)]" />
                      <h2 className="text-xl font-semibold">Preview</h2>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Shows watermark placement on first page size.
                    </p>
                  </div>

                  <div className="text-right text-xs text-[var(--text-secondary)] shrink-0">
                    <p>{selectedPages.length} pages</p>
                    <p>Est. {Math.ceil(estimatedProcessingTime / 1000)}s</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-gray-100 p-4 min-h-[420px] flex items-center justify-center overflow-auto">
                  <div
                    className="relative bg-white shadow-xl border border-gray-300 overflow-hidden w-full max-w-[320px]"
                    style={previewStyle}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(#f8fafc_1px,transparent_1px),linear-gradient(90deg,#f8fafc_1px,transparent_1px)] bg-[length:28px_28px]" />
                    <div className="absolute left-5 right-5 top-7 h-3 bg-gray-200 rounded" />
                    <div className="absolute left-5 right-12 top-14 h-2 bg-gray-100 rounded" />
                    <div className="absolute left-5 right-8 top-20 h-2 bg-gray-100 rounded" />
                    <div className="absolute left-5 right-14 top-26 h-2 bg-gray-100 rounded" />

                    {repeatWatermark ? (
                      <PreviewRepeatedWatermark
                        watermarkType={watermarkType}
                        text={watermarkText}
                        imagePreviewUrl={imagePreviewUrl}
                        style={previewWatermarkStyle}
                        imageSizePercent={imageSizePercent}
                      />
                    ) : watermarkType === "image" && imagePreviewUrl ? (
                      <img
                        src={imagePreviewUrl}
                        alt="Watermark preview"
                        className="absolute max-w-[70%] max-h-[55%] object-contain"
                        style={{
                          left: previewWatermarkStyle.left,
                          top: previewWatermarkStyle.top,
                          transform: previewWatermarkStyle.transform,
                          opacity: opacity / 100,
                        }}
                      />
                    ) : (
                      <div className="absolute pointer-events-none select-none" style={previewWatermarkStyle}>
                        {watermarkText || "WATERMARK"}
                      </div>
                    )}

                    <div className="absolute bottom-4 right-4 text-[10px] text-gray-400">
                      Page 1 preview
                    </div>
                  </div>
                </div>

                {(isProcessing || processingTimeMs > 0) && (
                  <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4 mt-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {isProcessing ? (
                          <Loader2 size={18} className="animate-spin text-[var(--primary)]" />
                        ) : (
                          <Clock3 size={18} className="text-[var(--primary)]" />
                        )}
                        <p className="font-semibold text-sm">
                          {isProcessing ? "Processing PDF..." : "Processing completed"}
                        </p>
                      </div>

                      <span className="text-xs font-bold text-[var(--primary)]">
                        {isProcessing
                          ? `Est. ${(estimatedTimeMs / 1000).toFixed(1)}s`
                          : `${(processingTimeMs / 1000).toFixed(1)}s`}
                      </span>
                    </div>

                    {isProcessing && (
                      <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary)] transition-all duration-200"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <MessageBox type="error" message={error} />
                )}

                {success && (
                  <MessageBox type="success" message={success} />
                )}

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={applyWatermark}
                    disabled={isProcessing}
                    className={`btn-primary inline-flex items-center justify-center gap-2 ${
                      isProcessing ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    Apply
                  </button>

                  <button
                    type="button"
                    onClick={downloadOutput}
                    disabled={!hasOutput || isProcessing}
                    className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                      !hasOutput || isProcessing ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Download size={18} />
                    Download
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <StatCard label="Pages" value={outputPageCount || pdfFile.pageCount} />
                  <StatCard
                    label="Output Size"
                    value={outputSize ? formatBytes(outputSize) : "-"}
                  />
                  <StatCard
                    label="Watermark"
                    value={watermarkType === "text" ? "Text" : "Image"}
                  />
                  <StatCard
                    label="Opacity"
                    value={`${opacity}%`}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex gap-3">
                <ShieldCheck size={18} className="text-blue-700 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-5">
                  Your PDF is processed in your browser. Please watermark only
                  PDFs you own or have permission to edit.
                </p>
              </div>
            </aside>
          </div>
        )}
      </section>

      <SuggestedTools currentToolId="pdf-watermark-adder" />
    </div>
  );
}

function ToolPanel({ title, icon: Icon, open, onToggle, badge, children }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-[#f8f4ff]"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Icon size={19} className="text-[var(--primary)] shrink-0" />
          <span className="font-semibold truncate">{title}</span>
        </span>

        <span className="flex items-center gap-2 shrink-0">
          {badge && (
            <span className="text-xs text-[var(--primary)] bg-[#f4edff] rounded-full px-2 py-1 max-w-[160px] truncate">
              {badge}
            </span>
          )}
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {open && <div className="border-t border-[var(--border)] p-4">{children}</div>}
    </div>
  );
}

function PreviewRepeatedWatermark({
  watermarkType,
  text,
  imagePreviewUrl,
  style,
  imageSizePercent,
}) {
  const items = [];

  for (let row = -1; row < 5; row += 1) {
    for (let col = -1; col < 5; col += 1) {
      items.push({ row, col });
    }
  }

  return (
    <>
      {items.map(({ row, col }) => {
        const left = 10 + col * 28;
        const top = 8 + row * 26;

        if (watermarkType === "image" && imagePreviewUrl) {
          return (
            <img
              key={`${row}-${col}`}
              src={imagePreviewUrl}
              alt=""
              className="absolute object-contain"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${Math.max(18, imageSizePercent * 0.55)}%`,
                transform: style.transform,
                opacity: style.opacity,
              }}
            />
          );
        }

        return (
          <div
            key={`${row}-${col}`}
            className="absolute pointer-events-none select-none"
            style={{
              ...style,
              left: `${left}%`,
              top: `${top}%`,
              fontSize: "15px",
            }}
          >
            {text || "WATERMARK"}
          </div>
        );
      })}
    </>
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
          <option key={`${option.value}-${option.label}`} value={option.value}>
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

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-3 text-center">
      <p className="text-[11px] text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="text-sm font-bold text-[var(--primary)] break-all">{value}</p>
    </div>
  );
}

function MessageBox({ type, message }) {
  const isError = type === "error";

  return (
    <div
      className={`flex items-start gap-3 text-sm p-4 rounded-xl border mt-4 ${
        isError
          ? "text-red-700 bg-red-50 border-red-100"
          : "text-green-700 bg-green-50 border-green-100"
      }`}
    >
      {isError ? (
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
      ) : (
        <CheckCircle size={18} className="shrink-0 mt-0.5" />
      )}
      <p>{message}</p>
    </div>
  );
}

/* ---------------- PDF helpers ---------------- */

function getPdfPosition({
  position,
  customX,
  customY,
  pageWidth,
  pageHeight,
  itemWidth,
  itemHeight,
}) {
  const margin = Math.min(pageWidth, pageHeight) * 0.08;

  const positions = {
    center: {
      x: (pageWidth - itemWidth) / 2,
      y: (pageHeight - itemHeight) / 2,
    },
    "top-left": {
      x: margin,
      y: pageHeight - margin - itemHeight,
    },
    "top-center": {
      x: (pageWidth - itemWidth) / 2,
      y: pageHeight - margin - itemHeight,
    },
    "top-right": {
      x: pageWidth - margin - itemWidth,
      y: pageHeight - margin - itemHeight,
    },
    "bottom-left": {
      x: margin,
      y: margin,
    },
    "bottom-center": {
      x: (pageWidth - itemWidth) / 2,
      y: margin,
    },
    "bottom-right": {
      x: pageWidth - margin - itemWidth,
      y: margin,
    },
    custom: {
      x: (pageWidth * customX) / 100 - itemWidth / 2,
      y: (pageHeight * customY) / 100 - itemHeight / 2,
    },
  };

  return positions[position] || positions.center;
}

function getPreviewPosition(position, customX, customY) {
  const positions = {
    center: { left: 50, top: 50 },
    "top-left": { left: 22, top: 18 },
    "top-center": { left: 50, top: 18 },
    "top-right": { left: 78, top: 18 },
    "bottom-left": { left: 22, top: 82 },
    "bottom-center": { left: 50, top: 82 },
    "bottom-right": { left: 78, top: 82 },
    custom: { left: customX, top: 100 - customY },
  };

  return positions[position] || positions.center;
}

function getSelectedPageIndexes(mode, customRange, pageCount) {
  const indexes = [];

  if (!pageCount) return indexes;

  if (mode === "all") {
    return Array.from({ length: pageCount }, (_, index) => index);
  }

  if (mode === "first") return [0];

  if (mode === "last") return [pageCount - 1];

  if (mode === "odd") {
    return Array.from({ length: pageCount }, (_, index) => index).filter(
      (index) => (index + 1) % 2 === 1
    );
  }

  if (mode === "even") {
    return Array.from({ length: pageCount }, (_, index) => index).filter(
      (index) => (index + 1) % 2 === 0
    );
  }

  return parseCustomPageRange(customRange, pageCount);
}

function parseCustomPageRange(value, pageCount) {
  const selected = new Set();

  String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      if (part.includes("-")) {
        const [startRaw, endRaw] = part.split("-");
        const start = Number(startRaw);
        const end = Number(endRaw);

        if (!Number.isFinite(start) || !Number.isFinite(end)) return;

        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(pageCount, Math.max(start, end));

        for (let page = min; page <= max; page += 1) {
          selected.add(page - 1);
        }

        return;
      }

      const page = Number(part);

      if (Number.isFinite(page) && page >= 1 && page <= pageCount) {
        selected.add(page - 1);
      }
    });

  return Array.from(selected).sort((a, b) => a - b);
}

function hexToPdfRgb(hex) {
  const { red, green, blue } = hexToRgbParts(hex);
  return rgb(red / 255, green / 255, blue / 255);
}

function hexToRgbParts(hex) {
  const clean = String(hex || "#777777").replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => char + char)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6);

  return {
    red: parseInt(normalized.slice(0, 2), 16),
    green: parseInt(normalized.slice(2, 4), 16),
    blue: parseInt(normalized.slice(4, 6), 16),
  };
}

function estimateProcessingTime({ pageCount, fileSize, hasImage, repeatWatermark }) {
  const fileMb = fileSize / (1024 * 1024);
  const calculated =
    900 +
    pageCount * (repeatWatermark ? 160 : 75) +
    fileMb * 140 +
    (hasImage ? 700 : 0);

  return clampNumber(Math.round(calculated), 900, 9000);
}

function getFileBaseName(fileName) {
  return String(fileName || "document").replace(/\.[^/.]+$/, "");
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
