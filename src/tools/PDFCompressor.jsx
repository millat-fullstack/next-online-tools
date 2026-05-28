import { useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Archive,
  SlidersHorizontal,
  Trash2,
  Clock3,
  Info,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import jsPDF from "jspdf";

GlobalWorkerOptions.workerSrc = pdfWorker;

export const toolData = {
  title: "Compress PDF",
  path: "/compress-pdf",
  category: "PDF Tools",
  description:
    "Compress PDF files online by reducing file size while keeping pages easy to view and share.",
  metaTitle: "Compress PDF Online Free | Reduce PDF File Size",
  metaDescription:
    "Compress PDF files online for free. Reduce PDF file size in your browser with adjustable compression quality, progress tracking, and instant download.",
};

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const COMPRESSION_OPTIONS = {
  low: {
    label: "Strong Compression",
    shortLabel: "Smallest",
    description: "Smallest file size with lower visual quality.",
    scale: 0.75,
    imageQuality: 0.42,
  },
  medium: {
    label: "Recommended",
    shortLabel: "Balanced",
    description: "Good balance between file size and readability.",
    scale: 1,
    imageQuality: 0.58,
  },
  high: {
    label: "Better Quality",
    shortLabel: "Quality",
    description: "Better quality with less file size reduction.",
    scale: 1.35,
    imageQuality: 0.75,
  },
};

export default function PDFCompressor() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [compressedPdf, setCompressedPdf] = useState(null);
  const [compressedPdfUrl, setCompressedPdfUrl] = useState("");

  const [compressionLevel, setCompressionLevel] = useState("medium");

  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [reductionPercentage, setReductionPercentage] = useState(0);

  const [pageCount, setPageCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedCompression = COMPRESSION_OPTIONS[compressionLevel];

  const estimatedProcessingTime = useMemo(() => {
    if (!pageCount) return 0;

    const sizeMb = originalSize / (1024 * 1024);
    const estimated = 1800 + pageCount * 750 + sizeMb * 150;

    return Math.min(30000, Math.max(2500, Math.round(estimated)));
  }, [pageCount, originalSize]);

  const canCompress = Boolean(file && pdfData && !isLoadingPdf && !isProcessing);

  function clearCompressedOutput() {
    if (compressedPdfUrl) {
      URL.revokeObjectURL(compressedPdfUrl);
    }

    setCompressedPdf(null);
    setCompressedPdfUrl("");
    setCompressedSize(0);
    setReductionPercentage(0);
    setProcessingTimeMs(0);
    setProgress(0);
  }

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function validatePdfFile(selectedFile) {
    if (!selectedFile) {
      return "Please upload a PDF file.";
    }

    const fileName = selectedFile.name.toLowerCase();
    const isPdf =
      selectedFile.type === "application/pdf" || fileName.endsWith(".pdf");

    if (!isPdf) {
      return "Please upload a valid PDF file.";
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      return `PDF file must be under ${MAX_FILE_SIZE_MB} MB.`;
    }

    return "";
  }

  async function handleSelectedFile(selectedFile) {
    clearFeedback();
    clearCompressedOutput();

    const validationError = validatePdfFile(selectedFile);

    if (validationError) {
      setError(validationError);
      resetFileInput();
      return;
    }

    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    setPdfData(null);
    setPageCount(0);
    setIsLoadingPdf(true);

    try {
      const loadedPdf = await loadPDF(selectedFile);

      setPdfData(loadedPdf);
      setPageCount(loadedPdf.numPages);
      setSuccess("PDF loaded successfully. Choose a compression level and start compression.");
    } catch (err) {
      console.error("Error loading PDF:", err);

      setFile(null);
      setOriginalSize(0);
      setPdfData(null);
      setPageCount(0);
      setError(
        "Failed to load the PDF. The file may be corrupted, password-protected, or unsupported."
      );
    } finally {
      setIsLoadingPdf(false);
      resetFileInput();
    }
  }

  async function loadPDF(selectedFile) {
    const buffer = await selectedFile.arrayBuffer();
    const typedArray = new Uint8Array(buffer);

    const loadingTask = getDocument({
      data: typedArray,
      disableAutoFetch: true,
      disableStream: true,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    return loadingTask.promise;
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];
    handleSelectedFile(selectedFile);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    if (isProcessing || isLoadingPdf) return;

    const selectedFile = event.dataTransfer.files?.[0];
    handleSelectedFile(selectedFile);
  }

  function handleDragOver(event) {
    event.preventDefault();

    if (!isProcessing && !isLoadingPdf) {
      setIsDragging(true);
    }
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleCompressionLevelChange(level) {
    setCompressionLevel(level);
    clearFeedback();
    clearCompressedOutput();
  }

  async function compressPDF() {
    if (!file || !pdfData) {
      setError("Please upload and load a PDF first.");
      return;
    }

    clearFeedback();
    clearCompressedOutput();

    setIsProcessing(true);
    setProgress(0);

    const startTime = performance.now();

    try {
      const settings = COMPRESSION_OPTIONS[compressionLevel];
      const totalPages = pdfData.numPages;

      let compressedDoc = null;

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        const page = await pdfData.getPage(pageNumber);
        const viewport = page.getViewport({ scale: settings.scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", {
          alpha: false,
          willReadFrequently: false,
        });

        if (!context) {
          throw new Error("Canvas is not supported in this browser.");
        }

        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        const imageData = canvas.toDataURL("image/jpeg", settings.imageQuality);
        const orientation = canvas.width > canvas.height ? "landscape" : "portrait";

        if (!compressedDoc) {
          compressedDoc = new jsPDF({
            orientation,
            unit: "px",
            format: [canvas.width, canvas.height],
            compress: true,
            hotfixes: ["px_scaling"],
          });
        } else {
          compressedDoc.addPage([canvas.width, canvas.height], orientation);
        }

        compressedDoc.addImage(
          imageData,
          "JPEG",
          0,
          0,
          canvas.width,
          canvas.height,
          undefined,
          "FAST"
        );

        canvas.width = 0;
        canvas.height = 0;

        setProgress(Math.round((pageNumber / totalPages) * 100));
      }

      if (!compressedDoc) {
        throw new Error("Could not create compressed PDF.");
      }

      const compressedBlob = compressedDoc.output("blob");
      const generatedUrl = URL.createObjectURL(compressedBlob);

      const reduction = Math.round(
        ((originalSize - compressedBlob.size) / originalSize) * 100
      );

      const actualProcessingTime = Math.max(
        1,
        Math.round(performance.now() - startTime)
      );

      setCompressedPdf(compressedBlob);
      setCompressedPdfUrl(generatedUrl);
      setCompressedSize(compressedBlob.size);
      setReductionPercentage(reduction);
      setProcessingTimeMs(actualProcessingTime);
      setProgress(100);

      if (compressedBlob.size < originalSize) {
        setSuccess(`PDF compressed successfully. Size reduced by ${reduction}%.`);
      } else {
        setSuccess(
          "PDF processed successfully, but the new file is not smaller. This usually happens with already optimized or text-based PDFs."
        );
      }
    } catch (err) {
      console.error("Error while compressing the PDF:", err);
      setError(
        "Error while compressing the PDF. Try a smaller file, a different compression level, or a non-password-protected PDF."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDownload() {
    if (!compressedPdfUrl || !compressedPdf) {
      setError("Please compress a PDF first.");
      return;
    }

    const cleanName = getFileBaseName(file?.name || "compressed");
    const link = document.createElement("a");

    link.href = compressedPdfUrl;
    link.download = `${cleanName}-compressed.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function removeFile() {
    if (isProcessing || isLoadingPdf) return;

    if (pdfData && typeof pdfData.destroy === "function") {
      pdfData.destroy().catch(() => {});
    }

    clearCompressedOutput();

    setFile(null);
    setPdfData(null);
    setOriginalSize(0);
    setPageCount(0);
    setProgress(0);
    setProcessingTimeMs(0);
    setError("");
    setSuccess("");
    resetFileInput();
  }

  function handleReset() {
    if (pdfData && typeof pdfData.destroy === "function") {
      pdfData.destroy().catch(() => {});
    }

    if (compressedPdfUrl) {
      URL.revokeObjectURL(compressedPdfUrl);
    }

    setFile(null);
    setPdfData(null);
    setCompressedPdf(null);
    setCompressedPdfUrl("");

    setCompressionLevel("medium");

    setOriginalSize(0);
    setCompressedSize(0);
    setReductionPercentage(0);

    setPageCount(0);
    setProgress(0);
    setProcessingTimeMs(0);

    setIsDragging(false);
    setIsLoadingPdf(false);
    setIsProcessing(false);

    setError("");
    setSuccess("");

    resetFileInput();
  }

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Archive size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Compress PDF</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Compress PDF files online by converting pages into optimized images
          and rebuilding a smaller PDF in your browser. Choose a compression
          level, track progress, and download the compressed PDF instantly.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-[1.35fr_0.85fr] gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* UPLOAD AREA */}
            <label
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                isDragging
                  ? "border-[var(--primary)] bg-[#f4edff]"
                  : "border-[var(--border)] hover:bg-[#f8f4ff]"
              } ${isProcessing || isLoadingPdf ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {isLoadingPdf ? (
                <Loader2
                  size={38}
                  className="mx-auto mb-4 text-[var(--primary)] animate-spin"
                />
              ) : (
                <Upload size={38} className="mx-auto mb-4 text-[var(--primary)]" />
              )}

              <h2 className="text-xl font-semibold mb-2">
                {isLoadingPdf ? "Loading PDF..." : "Upload PDF File"}
              </h2>

              <p className="text-sm text-[var(--text-secondary)]">
                Select or drag one PDF file. Max file size:{" "}
                <strong>{MAX_FILE_SIZE_MB} MB</strong>.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={isProcessing || isLoadingPdf}
              />
            </label>

            {/* SELECTED FILE */}
            {file && (
              <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center shrink-0">
                      <FileText size={22} className="text-[var(--primary)]" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold truncate" title={file.name}>
                        {file.name}
                      </p>

                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {formatBytes(originalSize)} •{" "}
                        {pageCount ? `${pageCount} page(s)` : "Loading pages..."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeFile}
                    disabled={isProcessing || isLoadingPdf}
                    className={`inline-flex items-center gap-1 text-sm font-semibold text-red-600 ${
                      isProcessing || isLoadingPdf
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* COMPRESSION SETTINGS */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Compression Level</h3>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {Object.entries(COMPRESSION_OPTIONS).map(([level, option]) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleCompressionLevelChange(level)}
                    disabled={isProcessing}
                    className={`rounded-2xl border p-4 text-left transition ${
                      compressionLevel === level
                        ? "border-[var(--primary)] bg-[#f8f4ff] text-[var(--primary)]"
                        : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                    } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <p className="font-semibold">{option.shortLabel}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 text-sm">
                <InfoBox label="Mode" value={selectedCompression.shortLabel} />
                <InfoBox label="Pages" value={pageCount || "-"} />
                <InfoBox label="Original" value={formatBytes(originalSize)} />
                <InfoBox
                  label="Est. Time"
                  value={
                    estimatedProcessingTime
                      ? `${Math.ceil(estimatedProcessingTime / 1000)}s`
                      : "-"
                  }
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={compressPDF}
                disabled={!canCompress}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !canCompress ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isProcessing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Zap size={18} />
                )}
                {isProcessing ? "Compressing..." : "Compress PDF"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isProcessing || isLoadingPdf}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  isProcessing || isLoadingPdf ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>

            {/* PROGRESS */}
            {isProcessing && (
              <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                  <span>Compressing PDF pages...</span>
                  <span>{progress}%</span>
                </div>

                <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  Large PDFs may take longer because each page is rendered and
                  optimized in your browser.
                </p>
              </div>
            )}

            {/* FEEDBACK */}
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

            {/* NOTE */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-sm text-yellow-800">
                This browser-based compressor is best for scanned PDFs and
                image-heavy PDFs. Text-based PDFs may become image-based after
                compression, so text selection and links may not be preserved.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* RESULT */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Download size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Compressed PDF</h2>
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-6 bg-gray-50 min-h-[300px] flex items-center justify-center">
                {compressedPdf ? (
                  <div className="text-center w-full">
                    <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>

                    <h3 className="font-semibold mb-2">PDF Ready</h3>

                    <p className="text-sm text-[var(--text-secondary)] mb-5">
                      Your compressed PDF is ready to download.
                    </p>

                    <button
                      type="button"
                      onClick={handleDownload}
                      className="btn-primary w-full inline-flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Download Compressed PDF
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Archive size={54} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-[var(--text-secondary)]">
                      Compressed PDF will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Original Size" value={formatBytes(originalSize)} />
              <StatCard
                label="Compressed Size"
                value={compressedSize ? formatBytes(compressedSize) : "-"}
                green={Boolean(compressedSize && compressedSize < originalSize)}
              />
              <StatCard
                label="Reduction"
                value={compressedPdf ? `${reductionPercentage}%` : "-"}
                green={reductionPercentage > 0}
              />
              <StatCard label="Pages" value={pageCount || "-"} />
              <StatCard
                label="Processing Time"
                value={
                  processingTimeMs
                    ? `${(processingTimeMs / 1000).toFixed(1)}s`
                    : estimatedProcessingTime
                      ? `Est. ${Math.ceil(estimatedProcessingTime / 1000)}s`
                      : "-"
                }
                green={Boolean(processingTimeMs)}
              />
              <StatCard
                label="Level"
                value={selectedCompression.shortLabel}
              />
            </div>

            {/* EXPLANATION */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Why some PDFs do not get smaller
                  </h3>

                  <p className="text-sm text-blue-800">
                    If your PDF is already optimized or mostly text/vector
                    content, compression may not reduce the file size. Strong
                    compression usually works best on scanned or image-heavy PDF
                    files.
                  </p>
                </div>
              </div>
            </div>

            {/* PRIVACY */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock3 size={18} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Browser-based processing</h3>
              </div>

              <p className="text-sm text-[var(--text-secondary)]">
                Your PDF is processed locally in your browser. No paid API is
                required.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="compress-pdf" />
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-xl p-3 text-center">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="font-semibold text-[var(--primary)] break-all">{value}</p>
    </div>
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

function getFileBaseName(fileName) {
  return String(fileName || "compressed").replace(/\.[^/.]+$/, "");
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const sizeIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const size = bytes / Math.pow(1024, sizeIndex);

  return `${size.toFixed(sizeIndex === 0 ? 0 : 2)} ${units[sizeIndex]}`;
}