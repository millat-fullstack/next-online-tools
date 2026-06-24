import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Clock3,
  Download,
  Eye,
  FileText,
  Hash,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "PDF Page Number Adder",
  path: "/pdf-page-number-adder",
  category: "PDF Tools",
  description:
    "Add page numbers to PDF files online with custom position, style, start page, and instant download.",
  metaTitle: "PDF Page Number Adder - Add Page Numbers to PDF Online",
  metaDescription:
    "Add page numbers to PDF files online. Choose position, format, start page, start number, font size, color, and download the numbered PDF.",
};

const POSITION_OPTIONS = [
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "top-center", label: "Top Center" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
];

const FORMAT_OPTIONS = [
  { value: "page-of-total", label: "Page 1 of 10" },
  { value: "number", label: "1" },
  { value: "number-total", label: "1 / 10" },
  { value: "dash-number", label: "- 1 -" },
  { value: "page-number", label: "Page 1" },
];

const MIN_PROCESSING_TIME_MS = 850;
const MAX_PROCESSING_TIME_MS = 12000;

export default function PdfPageNumberAdder() {
  const fileInputRef = useRef(null);
  const outputUrlRef = useRef("");

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);

  const [position, setPosition] = useState("bottom-center");
  const [format, setFormat] = useState("page-of-total");
  const [startPage, setStartPage] = useState(1);
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [margin, setMargin] = useState(30);
  const [fontColor, setFontColor] = useState("#111827");
  const [bold, setBold] = useState(false);
  const [skipPages, setSkipPages] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [outputUrl, setOutputUrl] = useState("");
  const [outputName, setOutputName] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => revokeOutputUrl();
  }, []);

  const pageCount = fileInfo?.pages || 0;

  const eligiblePageCount = useMemo(() => {
    if (!pageCount) return 0;

    const skipSet = parsePageList(skipPages, pageCount);
    let count = 0;

    for (let page = 1; page <= pageCount; page += 1) {
      if (page < startPage) continue;
      if (skipSet.has(page)) continue;
      count += 1;
    }

    return count;
  }, [pageCount, skipPages, startPage]);

  const sampleNumberText = useMemo(() => {
    return buildPageNumberText({
      format,
      pageNumber: startNumber,
      totalPages: Math.max(eligiblePageCount, 1),
    });
  }, [format, startNumber, eligiblePageCount]);

  async function handlePdfUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");
    setProcessingTimeMs(0);
    revokeOutputUrl();

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a valid PDF file.");
      event.target.value = "";
      return;
    }

    try {
      const bytes = await file.arrayBuffer();
      const { PDFDocument } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPageCount();

      setPdfFile(file);
      setPdfBytes(bytes);
      setFileInfo({
        name: file.name,
        size: file.size,
        pages,
      });
      setStartPage(1);
      setStartNumber(1);
      setSuccess("PDF loaded. Choose settings and add page numbers.");
    } catch {
      setError("Could not read this PDF. Please try another valid PDF file.");
      setPdfFile(null);
      setPdfBytes(null);
      setFileInfo(null);
    } finally {
      event.target.value = "";
    }
  }

  async function addPageNumbers() {
    if (!pdfBytes || !fileInfo) {
      setError("Please upload a PDF first.");
      return;
    }

    setError("");
    setSuccess("");
    revokeOutputUrl();
    setIsProcessing(true);
    setProgress(8);
    setProcessingTimeMs(0);

    const startedAt = performance.now();
    const estimatedMs = estimateProcessingTime(fileInfo.pages, fileInfo.size);
    const progressTimer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const nextProgress = Math.min(94, Math.max(8, Math.round((elapsed / estimatedMs) * 94)));
      setProgress(nextProgress);
    }, 90);

    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const safeStartPage = clampInteger(startPage, 1, pages.length);
      const safeStartNumber = clampInteger(startNumber, -99999, 999999);
      const safeFontSize = clampInteger(fontSize, 6, 96);
      const safeMargin = clampInteger(margin, 0, 300);
      const color = hexToRgb(fontColor);
      const skipSet = parsePageList(skipPages, pages.length);
      const eligiblePages = pages
        .map((_, index) => index + 1)
        .filter((pageNumber) => pageNumber >= safeStartPage && !skipSet.has(pageNumber));

      let currentNumber = safeStartNumber;

      pages.forEach((page, pageIndex) => {
        const actualPageNumber = pageIndex + 1;

        if (actualPageNumber < safeStartPage || skipSet.has(actualPageNumber)) return;

        const pageNumberText = buildPageNumberText({
          format,
          pageNumber: currentNumber,
          totalPages: eligiblePages.length,
        });

        drawPageNumber({
          page,
          font,
          text: pageNumberText,
          fontSize: safeFontSize,
          color: rgb(color.r, color.g, color.b),
          margin: safeMargin,
          position,
        });

        currentNumber += 1;
      });

      await waitRemaining(startedAt, estimatedMs);

      const outputBytes = await pdfDoc.save();
      const blob = new Blob([outputBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const outputFileName = buildOutputName(fileInfo.name);

      outputUrlRef.current = url;
      setOutputUrl(url);
      setOutputName(outputFileName);
      setProgress(100);
      setProcessingTimeMs(Math.max(1, Math.round(performance.now() - startedAt)));
      setSuccess("Page numbers added successfully.");
    } catch {
      setError("Could not add page numbers to this PDF. Please try another file.");
    } finally {
      window.clearInterval(progressTimer);
      window.setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 500);
    }
  }

  function downloadOutput() {
    if (!outputUrl) return;

    const link = document.createElement("a");
    link.href = outputUrl;
    link.download = outputName || "numbered.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function resetTool() {
    revokeOutputUrl();
    setPdfFile(null);
    setPdfBytes(null);
    setFileInfo(null);
    setPosition("bottom-center");
    setFormat("page-of-total");
    setStartPage(1);
    setStartNumber(1);
    setFontSize(12);
    setMargin(30);
    setFontColor("#111827");
    setBold(false);
    setSkipPages("");
    setIsProcessing(false);
    setProgress(0);
    setProcessingTimeMs(0);
    setSuccess("");
    setError("");
  }

  function revokeOutputUrl() {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
    }

    outputUrlRef.current = "";
    setOutputUrl("");
    setOutputName("");
  }

  return (
    <div className="flex flex-col gap-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handlePdfUpload}
        className="hidden"
      />

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Hash size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">PDF Page Number Adder</h1>

        <p className="text-[var(--text-secondary)] max-w-3xl">
          Upload a PDF, choose a page number style and position, then download a
          clean numbered PDF. Processing happens in your browser.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="grid xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-6">
          <div className="flex flex-col gap-4 min-w-0">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Upload PDF</h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Choose the PDF file you want to number.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Upload size={18} />
                  Choose PDF
                </button>
              </div>

              {fileInfo ? (
                <div className="mt-5 grid sm:grid-cols-3 gap-3">
                  <InfoBox label="File" value={fileInfo.name} />
                  <InfoBox label="Pages" value={fileInfo.pages} />
                  <InfoBox label="Size" value={formatBytes(fileInfo.size)} />
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-gray-50 p-8 text-center">
                  <FileText size={38} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    No PDF selected yet.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h2 className="text-xl font-bold mb-4">Page Number Settings</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Position">
                  <select
                    value={position}
                    onChange={(event) => setPosition(event.target.value)}
                    className="tool-input"
                  >
                    {POSITION_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Format">
                  <select
                    value={format}
                    onChange={(event) => setFormat(event.target.value)}
                    className="tool-input"
                  >
                    {FORMAT_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Start numbering from page">
                  <input
                    type="number"
                    min="1"
                    max={pageCount || 9999}
                    value={startPage}
                    onChange={(event) => setStartPage(Number(event.target.value))}
                    className="tool-input"
                  />
                </Field>

                <Field label="Number starts at">
                  <input
                    type="number"
                    value={startNumber}
                    onChange={(event) => setStartNumber(Number(event.target.value))}
                    className="tool-input"
                  />
                </Field>

                <Field label="Font size">
                  <input
                    type="number"
                    min="6"
                    max="96"
                    value={fontSize}
                    onChange={(event) => setFontSize(Number(event.target.value))}
                    className="tool-input"
                  />
                </Field>

                <Field label="Margin">
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={margin}
                    onChange={(event) => setMargin(Number(event.target.value))}
                    className="tool-input"
                  />
                </Field>

                <Field label="Color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fontColor}
                      onChange={(event) => setFontColor(event.target.value)}
                      className="h-11 w-14 rounded-xl border border-[var(--border)] bg-white p-1"
                    />
                    <input
                      type="text"
                      value={fontColor}
                      onChange={(event) => setFontColor(normalizeHexInput(event.target.value))}
                      className="tool-input flex-1"
                    />
                  </div>
                </Field>

                <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-semibold">
                  <input
                    type="checkbox"
                    checked={bold}
                    onChange={(event) => setBold(event.target.checked)}
                    className="accent-[var(--primary)]"
                  />
                  Bold page number
                </label>
              </div>

              <div className="mt-4">
                <Field label="Skip pages (optional)">
                  <input
                    type="text"
                    value={skipPages}
                    onChange={(event) => setSkipPages(event.target.value)}
                    placeholder="Example: 1, 3, 5-7"
                    className="tool-input"
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex gap-3">
              <ShieldCheck size={18} className="text-blue-700 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-5">
                Your PDF is processed in the browser. No paid API is required.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 min-w-0">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">Preview</h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Sample position and final PDF preview after processing.
                  </p>
                </div>

                <span className="rounded-full border border-[var(--border)] bg-[#f8f4ff] px-3 py-1 text-xs font-bold text-[var(--primary)]">
                  {eligiblePageCount || 0} numbered pages
                </span>
              </div>

              <div className="relative h-[360px] rounded-2xl border border-[var(--border)] bg-gray-50 overflow-hidden">
                <div className="absolute inset-8 rounded-xl bg-white shadow-sm border border-gray-200">
                  <NumberPreview
                    text={sampleNumberText}
                    position={position}
                    color={fontColor}
                    fontSize={fontSize}
                    margin={margin}
                    bold={bold}
                  />
                </div>
              </div>
            </div>

            {(isProcessing || processingTimeMs > 0) && (
              <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {isProcessing ? (
                      <Loader2 size={18} className="animate-spin text-[var(--primary)]" />
                    ) : (
                      <Clock3 size={18} className="text-[var(--primary)]" />
                    )}
                    <p className="font-semibold text-sm">
                      {isProcessing ? "Adding page numbers..." : "Processing completed"}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-[var(--primary)]">
                    {isProcessing ? `${progress}%` : `${(processingTimeMs / 1000).toFixed(1)}s`}
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
              <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {success && !error && (
              <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
                <Check size={18} className="shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            {outputUrl ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)] bg-gray-50 flex items-center gap-2">
                  <Eye size={18} className="text-[var(--primary)]" />
                  <p className="font-semibold">Numbered PDF Preview</p>
                </div>

                <iframe
                  src={outputUrl}
                  title="Numbered PDF preview"
                  className="w-full h-[520px] bg-white"
                />
              </div>
            ) : null}

            <div className="grid sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={addPageNumbers}
                disabled={!pdfFile || isProcessing}
                className={`btn-primary inline-flex items-center justify-center gap-2 ${
                  !pdfFile || isProcessing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Hash size={18} />}
                {isProcessing ? "Working..." : "Add Numbers"}
              </button>

              <button
                type="button"
                onClick={downloadOutput}
                disabled={!outputUrl}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  !outputUrl ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download
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
      </section>

      <style>{`
        .tool-input {
          width: 100%;
          height: 44px;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 0 0.9rem;
          background: white;
          outline: none;
          font-weight: 600;
        }
        .tool-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(155, 108, 227, 0.16);
        }
      `}</style>

      <SuggestedTools currentToolId="pdf-page-number-adder" />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-2">{label}</span>
      {children}
    </label>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[#fbf9ff] p-4 min-w-0">
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="font-bold mt-1 truncate" title={String(value)}>
        {value}
      </p>
    </div>
  );
}

function NumberPreview({ text, position, color, fontSize, margin, bold }) {
  const style = getPreviewPositionStyle(position, margin);

  return (
    <div
      className="absolute"
      style={{
        ...style,
        color,
        fontSize: `${clampInteger(fontSize, 6, 96)}px`,
        fontWeight: bold ? 800 : 500,
      }}
    >
      {text}
    </div>
  );
}

function getPreviewPositionStyle(position, margin) {
  const previewMargin = clampInteger(margin, 0, 300) / 2.5 + 10;
  const isTop = position.startsWith("top");
  const isBottom = position.startsWith("bottom");
  const isLeft = position.endsWith("left");
  const isRight = position.endsWith("right");
  const isCenter = position.endsWith("center");

  const style = {};

  if (isTop) style.top = previewMargin;
  if (isBottom) style.bottom = previewMargin;
  if (isLeft) style.left = previewMargin;
  if (isRight) style.right = previewMargin;
  if (isCenter) {
    style.left = "50%";
    style.transform = "translateX(-50%)";
  }

  return style;
}

function drawPageNumber({ page, font, text, fontSize, color, margin, position }) {
  const { width, height } = page.getSize();
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const textHeight = font.heightAtSize(fontSize);
  const safeMargin = Math.max(0, margin);

  let x = safeMargin;
  let y = safeMargin;

  if (position.endsWith("center")) x = width / 2 - textWidth / 2;
  if (position.endsWith("right")) x = width - safeMargin - textWidth;
  if (position.endsWith("left")) x = safeMargin;

  if (position.startsWith("top")) y = height - safeMargin - textHeight;
  if (position.startsWith("bottom")) y = safeMargin;

  page.drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color,
  });
}

function buildPageNumberText({ format, pageNumber, totalPages }) {
  if (format === "number") return `${pageNumber}`;
  if (format === "number-total") return `${pageNumber} / ${totalPages}`;
  if (format === "dash-number") return `- ${pageNumber} -`;
  if (format === "page-number") return `Page ${pageNumber}`;

  return `Page ${pageNumber} of ${totalPages}`;
}

function parsePageList(value, maxPage) {
  const pages = new Set();

  String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      if (part.includes("-")) {
        const [startRaw, endRaw] = part.split("-");
        const start = clampInteger(Number(startRaw), 1, maxPage);
        const end = clampInteger(Number(endRaw), 1, maxPage);
        const min = Math.min(start, end);
        const max = Math.max(start, end);

        for (let page = min; page <= max; page += 1) {
          pages.add(page);
        }

        return;
      }

      const page = Number(part);
      if (Number.isFinite(page) && page >= 1 && page <= maxPage) {
        pages.add(Math.floor(page));
      }
    });

  return pages;
}

function hexToRgb(hex) {
  const clean = normalizeHexInput(hex).replace("#", "");
  const bigint = parseInt(clean, 16);

  return {
    r: ((bigint >> 16) & 255) / 255,
    g: ((bigint >> 8) & 255) / 255,
    b: (bigint & 255) / 255,
  };
}

function normalizeHexInput(value) {
  const clean = String(value || "").trim();

  if (/^#[0-9a-f]{6}$/i.test(clean)) return clean;
  if (/^[0-9a-f]{6}$/i.test(clean)) return `#${clean}`;

  return "#111827";
}

function estimateProcessingTime(pages, fileSize) {
  const estimated =
    MIN_PROCESSING_TIME_MS + Number(pages || 0) * 45 + Number(fileSize || 0) / 50000;

  return clampInteger(estimated, MIN_PROCESSING_TIME_MS, MAX_PROCESSING_TIME_MS);
}

function waitRemaining(startedAt, minimumMs) {
  const elapsed = performance.now() - startedAt;
  const remaining = Math.max(0, minimumMs - elapsed);

  return new Promise((resolve) => window.setTimeout(resolve, remaining));
}

function buildOutputName(name) {
  const cleanName = String(name || "document.pdf").replace(/\.pdf$/i, "");

  return `${cleanName}-numbered.pdf`;
}

function formatBytes(bytes) {
  const size = Number(bytes || 0);

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function clampInteger(value, min, max) {
  const number = Math.round(Number(value));

  if (!Number.isFinite(number)) return min;

  return Math.min(max, Math.max(min, number));
}
