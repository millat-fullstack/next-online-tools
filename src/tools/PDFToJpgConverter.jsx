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
  Images,
  Trash2,
  SlidersHorizontal,
  Archive,
  Image as ImageIcon,
} from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import JSZip from "jszip";
import SuggestedTools from "../components/sidebar/SuggestedTools";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export const toolData = {
  title: "PDF to JPG Converter",
  path: "/pdf-to-jpg-converter",
  category: "PDF Tools",
  description:
    "Convert PDF files to high-quality JPG images. Download every PDF page as JPG or save all pages in one ZIP file.",
  metaTitle: "PDF to JPG Converter Online Free | Convert PDF Pages to Images",
  metaDescription:
    "Convert PDF to JPG online for free. Upload a PDF, choose image quality and resolution, convert every page to JPG, and download images individually or as a ZIP file.",
};

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const SCALE_OPTIONS = [
  {
    value: 1.5,
    label: "Standard",
    description: "Good quality, smaller files",
  },
  {
    value: 2,
    label: "High",
    description: "Best balance for most PDFs",
  },
  {
    value: 3,
    label: "Ultra",
    description: "Sharper images, larger files",
  },
];

export default function PDFToJpgConverter() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [pageCount, setPageCount] = useState(0);

  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState(0.92);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  const [convertedImages, setConvertedImages] = useState([]);
  const [zipBlob, setZipBlob] = useState(null);
  const [zipUrl, setZipUrl] = useState("");
  const [zipSize, setZipSize] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [progress, setProgress] = useState(0);
  const [processingPhase, setProcessingPhase] = useState("");
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [selectedPageNumber, setSelectedPageNumber] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedScale = useMemo(() => {
    return SCALE_OPTIONS.find((item) => item.value === Number(scale)) || SCALE_OPTIONS[1];
  }, [scale]);

  const estimatedProcessingTime = useMemo(() => {
    if (!file || !pageCount) return 0;

    const sizeMb = file.size / (1024 * 1024);
    const estimated = 1400 + pageCount * 650 + sizeMb * 120 + Number(scale) * 500;

    return Math.min(45000, Math.max(2000, Math.round(estimated)));
  }, [file, pageCount, scale]);

  const totalJpgSize = useMemo(() => {
    return convertedImages.reduce((sum, image) => sum + image.blob.size, 0);
  }, [convertedImages]);

  const selectedImage = useMemo(() => {
    if (!convertedImages.length) return null;

    return (
      convertedImages.find((image) => image.pageNumber === selectedPageNumber) ||
      convertedImages[0]
    );
  }, [convertedImages, selectedPageNumber]);

  const canConvert = Boolean(file && pdfData && !isLoadingPdf && !isProcessing);

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearOutput() {
    convertedImages.forEach((image) => {
      if (image.url) {
        URL.revokeObjectURL(image.url);
      }
    });

    if (zipUrl) {
      URL.revokeObjectURL(zipUrl);
    }

    setConvertedImages([]);
    setZipBlob(null);
    setZipUrl("");
    setZipSize(0);
    setProgress(0);
    setProcessingPhase("");
    setProcessingTimeMs(0);
    setSelectedPageNumber(null);
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
    clearOutput();

    const validationError = validatePdfFile(selectedFile);

    if (validationError) {
      setError(validationError);
      resetFileInput();
      return;
    }

    setFile(selectedFile);
    setPdfData(null);
    setPageCount(0);
    setIsLoadingPdf(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const typedArray = new Uint8Array(buffer);

      const loadingTask = getDocument({
        data: typedArray,
        disableAutoFetch: true,
        disableStream: true,
        isEvalSupported: false,
        useSystemFonts: true,
      });

      const loadedPdf = await loadingTask.promise;

      setPdfData(loadedPdf);
      setPageCount(loadedPdf.numPages);
      setSuccess("PDF loaded successfully. Choose your output settings and convert.");
    } catch (err) {
      console.error("PDF load error:", err);

      setFile(null);
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

  function handleFileInputChange(event) {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      handleSelectedFile(selectedFile);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    if (isProcessing || isLoadingPdf) return;

    const selectedFile = event.dataTransfer.files?.[0];

    if (selectedFile) {
      handleSelectedFile(selectedFile);
    }
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

  function handleSettingChange(setter, value) {
    setter(value);
    clearFeedback();
    clearOutput();
  }

  async function convertPDFToJPG() {
    if (!pdfData || !file) {
      setError("Please upload and load a PDF first.");
      return;
    }

    clearFeedback();
    clearOutput();

    setIsProcessing(true);
    setProgress(0);
    setProcessingPhase("Preparing PDF pages...");

    const startTime = performance.now();

    try {
      const nextImages = [];
      const zip = new JSZip();
      const cleanBaseName = getFileBaseName(file.name);

      for (let pageNumber = 1; pageNumber <= pdfData.numPages; pageNumber += 1) {
        setProcessingPhase(`Converting page ${pageNumber} of ${pdfData.numPages}...`);
        const page = await pdfData.getPage(pageNumber);
        const viewport = page.getViewport({ scale: Number(scale) });

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

        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport,
          background: backgroundColor,
        }).promise;

        const jpgBlob = await canvasToBlob(canvas, "image/jpeg", Number(quality));
        const imageUrl = URL.createObjectURL(jpgBlob);
        const fileName = `${cleanBaseName}-page-${String(pageNumber).padStart(
          2,
          "0"
        )}.jpg`;

        zip.file(fileName, jpgBlob);

        nextImages.push({
          id: `${pageNumber}-${fileName}`,
          pageNumber,
          fileName,
          blob: jpgBlob,
          url: imageUrl,
          width: canvas.width,
          height: canvas.height,
        });

        canvas.width = 0;
        canvas.height = 0;

        setProgress(Math.round((pageNumber / pdfData.numPages) * 90));
      }

      setProcessingPhase("Preparing Download All file...");
      const generatedZipBlob = await zip.generateAsync(
        {
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: {
            level: 6,
          },
        },
        (metadata) => {
          const zipProgress = 90 + Math.round((metadata.percent || 0) * 0.1);
          setProgress(Math.min(100, zipProgress));
        }
      );

      const generatedZipUrl = URL.createObjectURL(generatedZipBlob);
      const actualProcessingTime = Math.max(
        1,
        Math.round(performance.now() - startTime)
      );

      setConvertedImages(nextImages);
      setZipBlob(generatedZipBlob);
      setZipUrl(generatedZipUrl);
      setZipSize(generatedZipBlob.size);
      setProcessingTimeMs(actualProcessingTime);
      setProgress(100);
      setSelectedPageNumber(nextImages[0]?.pageNumber || null);
      setProcessingPhase("Conversion completed.");

      setSuccess(
        `${nextImages.length} JPG image${
          nextImages.length === 1 ? "" : "s"
        } created successfully.`
      );
    } catch (err) {
      console.error("PDF to JPG conversion error:", err);
      setError(
        "Could not convert this PDF to JPG. Try a smaller PDF or a lower resolution setting."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function downloadImage(image) {
    if (!image) {
      setError("Please select a page first.");
      return;
    }

    setSuccess(`Downloading page ${image.pageNumber}...`);

    const link = document.createElement("a");

    link.href = image.url;
    link.download = image.fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function downloadZip() {
    if (!zipBlob || !zipUrl) {
      setError("Please convert your PDF first.");
      return;
    }

    setSuccess("Downloading all pages...");

    const link = document.createElement("a");

    link.href = zipUrl;
    link.download = `${getFileBaseName(file?.name || "pdf-pages")}-jpg-images.zip`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function removeFile() {
    if (isProcessing || isLoadingPdf) return;

    if (pdfData && typeof pdfData.destroy === "function") {
      pdfData.destroy().catch(() => {});
    }

    setFile(null);
    setPdfData(null);
    setPageCount(0);
    clearOutput();
    clearFeedback();
    resetFileInput();
  }

  function handleReset() {
    if (pdfData && typeof pdfData.destroy === "function") {
      pdfData.destroy().catch(() => {});
    }

    clearOutput();

    setFile(null);
    setPdfData(null);
    setPageCount(0);

    setScale(2);
    setQuality(0.92);
    setBackgroundColor("#ffffff");

    setIsDragging(false);
    setIsLoadingPdf(false);
    setIsProcessing(false);

    setProgress(0);
    setProcessingPhase("");
    setProcessingTimeMs(0);
    setSelectedPageNumber(null);

    setError("");
    setSuccess("");

    resetFileInput();
  }

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <ImageIcon size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">PDF to JPG Converter</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Convert PDF files to high-quality JPG images in your browser. Upload a
          PDF, choose image quality and resolution, then download each page as
          JPG or save all pages in one ZIP file.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
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
                Choose file or drop PDF here
              </h2>

              <p className="text-sm text-[var(--text-secondary)]">
                Upload one PDF file. Max file size:{" "}
                <strong>{MAX_FILE_SIZE_MB} MB</strong>.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileInputChange}
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
                        {formatBytes(file.size)} •{" "}
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

            {/* SETTINGS */}
            {file && (
              <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersHorizontal size={20} className="text-[var(--primary)]" />
                  <h3 className="font-semibold">JPG Output Settings</h3>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  {SCALE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSettingChange(setScale, option.value)}
                      disabled={isProcessing}
                      className={`rounded-2xl border p-4 text-left transition ${
                        Number(scale) === option.value
                          ? "border-[var(--primary)] bg-white text-[var(--primary)]"
                          : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                      } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-5">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <label className="text-sm font-semibold">
                        JPG Quality: {Math.round(quality * 100)}%
                      </label>
                    </div>

                    <input
                      type="range"
                      min="0.6"
                      max="1"
                      step="0.01"
                      value={quality}
                      onChange={(event) =>
                        handleSettingChange(setQuality, Number(event.target.value))
                      }
                      disabled={isProcessing}
                      className="w-full accent-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Page Background
                    </label>

                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(event) =>
                        handleSettingChange(setBackgroundColor, event.target.value)
                      }
                      disabled={isProcessing}
                      className="w-full h-12 border border-[var(--border)] rounded-xl p-1 bg-white"
                    />
                  </div>
                </div>


              </div>
            )}

            {/* ACTIONS */}
            {file && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={convertPDFToJPG}
                  disabled={!canConvert}
                  className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                    !canConvert ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Zap size={18} />
                  )}
                  {isProcessing ? "Converting..." : "Convert PDF to JPG"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isProcessing || isLoadingPdf}
                  className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                    isProcessing || isLoadingPdf
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>
            )}

            {/* PROGRESS */}
            {isProcessing && (
              <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                  <span>{processingPhase || "Rendering PDF pages to JPG..."}</span>
                  <span>{progress}%</span>
                </div>

                <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  {processingPhase || "High-resolution conversion may take longer for large PDFs."}
                </p>
              </div>
            )}

            {!isProcessing && processingTimeMs > 0 && convertedImages.length > 0 && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-800">
                <span className="font-semibold">Processing completed</span>
                <span className="font-bold">{(processingTimeMs / 1000).toFixed(1)}s</span>
              </div>
            )}

            {/* OUTPUT GRID */}
            {convertedImages.length > 0 && (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Images size={20} className="text-[var(--primary)]" />
                    <h3 className="font-semibold">Converted JPG Pages</h3>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)]">
                    {convertedImages.length} page{convertedImages.length === 1 ? "" : "s"} ready
                  </p>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3">
                  {convertedImages.map((image) => (
                    <ImageCard
                      key={image.id}
                      image={image}
                      selected={selectedImage?.pageNumber === image.pageNumber}
                      onSelect={() => setSelectedPageNumber(image.pageNumber)}
                    />
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={downloadZip}
                    className="btn-primary inline-flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Download All
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadImage(selectedImage)}
                    className="btn-secondary inline-flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Download Page {selectedImage?.pageNumber || 1}
                  </button>
                </div>
              </div>
            )}
        </div>
      </section>

      <SuggestedTools currentToolId="pdf-to-jpg-converter" />
    </div>
  );
}

function ImageCard({ image, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group overflow-hidden rounded-2xl border bg-white text-left transition ${
        selected
          ? "border-[var(--primary)] ring-2 ring-[rgba(155,108,227,0.18)]"
          : "border-[var(--border)] hover:border-[var(--primary)]"
      }`}
      title={`Select page ${image.pageNumber}`}
    >
      <div className="h-28 bg-[#f8f4ff] flex items-center justify-center">
        <img
          src={image.url}
          alt={`PDF page ${image.pageNumber}`}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <div className="p-2">
        <p className="text-xs font-bold truncate">Page {image.pageNumber}</p>
        <p className="text-[11px] text-[var(--text-secondary)] truncate">
          {formatBytes(image.blob.size)}
        </p>
      </div>
    </button>
  );
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create image file."));
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
  return String(fileName || "pdf-pages").replace(/\.[^/.]+$/, "");
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