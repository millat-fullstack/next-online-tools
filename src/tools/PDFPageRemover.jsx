import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Loader2,
  RotateCcw,
  Scissors,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import SuggestedTools from "../components/sidebar/SuggestedTools";

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
} catch {
  // The app bundler may already configure the PDF.js worker.
}

export const toolData = {
  title: "PDF Page Remover",
  path: "/pdf-page-remover",
  category: "PDF Tools",
  description:
    "Remove or delete unwanted pdf pages from a full PDF online. Upload a PDF, view all pages, select pages to remove, and download a clean PDF.",
  metaTitle: "PDF Page Remover Online Free | Delete Pages from PDF",
  metaDescription:
    "Remove pages from PDF online for free. Upload a PDF, preview all pages, select pages to delete, and download a clean PDF instantly.",
};

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPE = "application/pdf";

export default function PDFPageRemover() {
  const fileInputRef = useRef(null);

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pages, setPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [outputName, setOutputName] = useState("cleaned-pdf.pdf");

  const [processedBlob, setProcessedBlob] = useState(null);
  const [processedUrl, setProcessedUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);

  const [fullPreview, setFullPreview] = useState(null);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPhase, setProcessingPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [downloadTimeMs, setDownloadTimeMs] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasPdf = Boolean(pdfBytes && totalPages);
  const selectedCount = selectedPages.size;
  const finalPageCount = Math.max(0, totalPages - selectedCount);
  const readyToDownload = Boolean(processedBlob && processedUrl);

  const selectedPagesText = useMemo(() => {
    return selectedCount ? formatPagesAsRange(selectedPages) : "None";
  }, [selectedPages, selectedCount]);

  useEffect(() => {
    return () => {
      if (processedUrl) URL.revokeObjectURL(processedUrl);
    };
  }, []);

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
    if (processedUrl) {
      URL.revokeObjectURL(processedUrl);
    }

    setProcessedBlob(null);
    setProcessedUrl("");
    setResultSize(0);
    setProcessingTimeMs(0);
    setDownloadTimeMs(0);
  }

  function validatePdf(file) {
    if (!file) return "Please choose a PDF file.";

    const isPdf = file.type === ACCEPTED_TYPE || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return "Please upload a valid PDF file.";
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `PDF must be under ${MAX_FILE_SIZE_MB} MB.`;
    }

    return "";
  }

  async function handlePdfFile(file) {
    if (isProcessing || isLoadingPdf) return;

    clearFeedback();
    clearOutput();
    setFullPreview(null);
    setSelectedPages(new Set());
    setPages([]);

    const validationError = validatePdf(file);

    if (validationError) {
      setError(validationError);
      resetFileInput();
      return;
    }

    setIsLoadingPdf(true);
    setProcessingPhase("Uploading PDF...");
    setProgress(5);

    const startTime = performance.now();

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());

      setProcessingPhase("Reading PDF pages...");
      setProgress(18);

      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
      const pdf = await loadingTask.promise;
      const pageCount = pdf.numPages;
      const renderedPages = [];

      setPdfFile(file);
      setPdfBytes(bytes);
      setFileName(file.name);
      setFileSize(file.size);
      setTotalPages(pageCount);
      setOutputName(createDefaultOutputName(file.name));

      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        setProcessingPhase(`Rendering page ${pageNumber} of ${pageCount}...`);
        setProgress(20 + Math.round((pageNumber / Math.max(1, pageCount)) * 72));

        const pageImage = await renderPdfPageToImage(pdf, pageNumber, 0.34, "image/jpeg", 0.82);

        renderedPages.push({
          pageNumber,
          image: pageImage.dataUrl,
          width: pageImage.width,
          height: pageImage.height,
        });

        if (pageNumber === 1 || pageNumber % 8 === 0 || pageNumber === pageCount) {
          setPages([...renderedPages]);
        }

        await wait(8);
      }

      setPages(renderedPages);
      setProgress(100);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));
      setProcessingTimeMs(actualTime);
      setSuccess(`PDF uploaded and ${pageCount} page${pageCount === 1 ? "" : "s"} loaded in ${(actualTime / 1000).toFixed(1)}s.`);
    } catch (loadError) {
      console.error("PDF Page Remover load error:", loadError);
      resetTool(false);
      setError("Could not upload this PDF properly. It may be encrypted, password-protected, damaged, or too complex for browser preview.");
    } finally {
      setIsLoadingPdf(false);
      resetFileInput();
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  function handleInputChange(event) {
    handlePdfFile(event.target.files?.[0]);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDraggingUpload(false);
    handlePdfFile(event.dataTransfer.files?.[0]);
  }

  function handleDragOver(event) {
    event.preventDefault();

    if (!isProcessing && !isLoadingPdf) {
      setIsDraggingUpload(true);
    }
  }

  function handleDragLeave() {
    setIsDraggingUpload(false);
  }

  function togglePageSelection(pageNumber) {
    if (!hasPdf || isProcessing || isLoadingPdf) return;

    clearFeedback();
    clearOutput();

    setSelectedPages((current) => {
      const next = new Set(current);

      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        if (next.size + 1 >= totalPages) {
          setError("You must keep at least one page in the PDF.");
          return current;
        }

        next.add(pageNumber);
      }

      return next;
    });
  }

  function clearSelection() {
    clearFeedback();
    clearOutput();
    setSelectedPages(new Set());
    setSuccess("Selection cleared.");
  }

  async function openFullPage(pageNumber) {
    if (!pdfBytes) return;

    setFullPreview({
      pageNumber,
      image: "",
      loading: true,
    });

    try {
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
      const pdf = await loadingTask.promise;
      const pageImage = await renderPdfPageToImage(pdf, pageNumber, 1.25, "image/jpeg", 0.9);

      setFullPreview({
        pageNumber,
        image: pageImage.dataUrl,
        loading: false,
      });
    } catch {
      setFullPreview(null);
      setError("Could not open full page preview.");
    }
  }

  async function createCleanPdfBlob() {
    if (!pdfBytes || !totalPages) {
      throw new Error("Please upload a PDF first.");
    }

    if (!selectedCount) {
      throw new Error("Please select at least one page to remove.");
    }

    if (selectedCount >= totalPages) {
      throw new Error("You must keep at least one page in the PDF.");
    }

    setIsProcessing(true);
    setProcessingPhase("Removing selected pages...");
    setProgress(8);

    const startTime = performance.now();

    try {
      const sourcePdf = await PDFDocument.load(pdfBytes.slice());
      const newPdf = await PDFDocument.create();
      const keepIndexes = [];

      for (let index = 0; index < totalPages; index += 1) {
        const pageNumber = index + 1;

        if (!selectedPages.has(pageNumber)) {
          keepIndexes.push(index);
        }
      }

      setProcessingPhase("Copying remaining pages...");
      setProgress(35);

      const copiedPages = await newPdf.copyPages(sourcePdf, keepIndexes);

      copiedPages.forEach((page, index) => {
        newPdf.addPage(page);
        setProgress(35 + Math.round(((index + 1) / Math.max(1, copiedPages.length)) * 42));
      });

      newPdf.setProducer("NextOnlineTools PDF Page Remover");
      newPdf.setCreator("NextOnlineTools.com");

      setProcessingPhase("Creating clean PDF...");
      setProgress(88);

      const cleanPdfBytes = await newPdf.save({ useObjectStreams: true });
      const blob = new Blob([cleanPdfBytes], { type: "application/pdf" });

      setProgress(100);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));

      return {
        blob,
        timeMs: actualTime,
      };
    } finally {
      setIsProcessing(false);
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  async function removeSelectedPages() {
    clearFeedback();
    clearOutput();

    try {
      const result = await createCleanPdfBlob();
      const url = URL.createObjectURL(result.blob);

      setProcessedBlob(result.blob);
      setProcessedUrl(url);
      setResultSize(result.blob.size);
      setProcessingTimeMs(result.timeMs);
      setSuccess(`${selectedCount} page${selectedCount === 1 ? "" : "s"} removed in ${(result.timeMs / 1000).toFixed(1)}s. The clean PDF is ready to download.`);
    } catch (removeError) {
      setError(removeError?.message || "Could not remove the selected pages. Please try again.");
    }
  }

  async function downloadCleanPdf() {
    clearFeedback();

    try {
      let blob = processedBlob;

      if (!blob) {
        const result = await createCleanPdfBlob();
        blob = result.blob;

        const url = URL.createObjectURL(blob);
        setProcessedBlob(blob);
        setProcessedUrl(url);
        setResultSize(blob.size);
        setProcessingTimeMs(result.timeMs);
      }

      setIsProcessing(true);
      setProcessingPhase("Preparing download...");
      setProgress(35);

      const startTime = performance.now();

      await wait(160);
      setProgress(75);

      await saveBlob(blob, normalizePdfFileName(outputName));

      setProgress(100);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));
      setDownloadTimeMs(actualTime);
      setSuccess(`Download started in ${(actualTime / 1000).toFixed(1)}s. Check your file manager/downloads folder.`);
    } catch (downloadError) {
      setError(downloadError?.message || "Could not start the download.");
    } finally {
      setIsProcessing(false);
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  function resetTool(showMessage = true) {
    clearOutput();
    setPdfFile(null);
    setPdfBytes(null);
    setFileName("");
    setFileSize(0);
    setTotalPages(0);
    setPages([]);
    setSelectedPages(new Set());
    setOutputName("cleaned-pdf.pdf");
    setFullPreview(null);
    setIsDraggingUpload(false);
    setIsLoadingPdf(false);
    setIsProcessing(false);
    setProcessingPhase("");
    setProgress(0);
    setProcessingTimeMs(0);
    setDownloadTimeMs(0);
    setError("");
    setSuccess(showMessage ? "Tool reset successfully." : "");
    resetFileInput();
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Scissors size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">PDF Page Remover</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload a PDF, view all pages below, select pages to remove, and download
          a clean PDF without the removed pages.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="flex flex-col gap-5">
          {!hasPdf && (
            <label
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`min-h-[300px] border-2 border-dashed rounded-3xl p-8 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                isDraggingUpload
                  ? "border-[var(--primary)] bg-[#f8f4ff]"
                  : "border-[var(--border)] bg-gray-50 hover:bg-[#f8f4ff]"
              } ${isLoadingPdf || isProcessing ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleInputChange}
                className="hidden"
                disabled={isLoadingPdf || isProcessing}
              />

              <Upload size={44} className="text-[var(--primary)] mb-4" />

              <h2 className="text-xl font-bold mb-2">Upload PDF</h2>

              <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-5">
                Choose or drop a PDF file. Max {MAX_FILE_SIZE_MB} MB.
              </p>

              <span className="btn-primary inline-flex items-center gap-2">
                <Upload size={17} />
                Choose PDF
              </span>
            </label>
          )}

          {hasPdf && (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-[var(--primary)] shrink-0" />
                    <h2 className="text-xl font-bold truncate">Uploaded PDF</h2>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">
                    {fileName} • {formatBytes(fileSize)} • {totalPages} page{totalPages === 1 ? "" : "s"}
                  </p>

                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Selected to remove: <strong className="text-red-600">{selectedPagesText}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoadingPdf || isProcessing}
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <Upload size={17} />
                    Replace PDF
                  </button>

                  <button
                    type="button"
                    onClick={clearSelection}
                    disabled={!selectedCount || isLoadingPdf || isProcessing}
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RotateCcw size={17} />
                    Clear Selection
                  </button>

                  <button
                    type="button"
                    onClick={removeSelectedPages}
                    disabled={!selectedCount || selectedCount >= totalPages || isLoadingPdf || isProcessing}
                    className="btn-primary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
                    Remove All Selected Pages
                  </button>

                  <button
                    type="button"
                    onClick={downloadCleanPdf}
                    disabled={!selectedCount || selectedCount >= totalPages || isLoadingPdf || isProcessing}
                    className="btn-primary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download size={17} />
                    {readyToDownload ? "Download Clean PDF" : "Create & Download"}
                  </button>

                  <button
                    type="button"
                    onClick={() => resetTool()}
                    disabled={isLoadingPdf || isProcessing}
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <RotateCcw size={17} />
                    Reset
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={isLoadingPdf || isProcessing}
                  />
                </div>
              </div>

              <div className="mt-4 grid md:grid-cols-[1fr_auto] gap-3 items-end">
                <label className="block">
                  <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">
                    Output file name
                  </span>
                  <input
                    value={outputName}
                    onChange={(event) => setOutputName(event.target.value)}
                    className="w-full h-11 rounded-xl border border-[var(--border)] bg-white px-3 outline-none focus:border-[var(--primary)]"
                    placeholder="cleaned-pdf.pdf"
                  />
                </label>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <SummaryPill label="Remove" value={selectedCount} danger={selectedCount > 0} />
                  <SummaryPill label="Keep" value={finalPageCount} />
                  <SummaryPill label="Ready" value={readyToDownload ? "Yes" : "No"} />
                </div>
              </div>
            </div>
          )}

          {(isLoadingPdf || isProcessing) && (
            <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4">
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                <span>{processingPhase || "Processing..."}</span>
                <span>{progress}%</span>
              </div>

              <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start justify-between gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>

              {(processingTimeMs > 0 || downloadTimeMs > 0) && (
                <span className="font-bold shrink-0">
                  {((downloadTimeMs || processingTimeMs) / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          )}

          {readyToDownload && (
            <div className="rounded-2xl border border-green-100 bg-green-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-green-800">
              <div>
                <p className="font-bold">Clean PDF is ready</p>
                <p className="text-sm mt-1">
                  Final file size: {formatBytes(resultSize)} • Pages kept: {finalPageCount}
                </p>
              </div>

              <button
                type="button"
                onClick={downloadCleanPdf}
                disabled={isProcessing || isLoadingPdf}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download Clean PDF
              </button>
            </div>
          )}

          {hasPdf && (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Eye size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-bold">All PDF Pages</h2>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Hover on a page and click “Select to remove”. Use the eye icon to view the full page.
                  </p>
                </div>

                <div className="text-sm font-semibold text-[var(--text-secondary)]">
                  {pages.length}/{totalPages} pages shown
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
                {pages.map((page) => {
                  const isSelected = selectedPages.has(page.pageNumber);
                  const isRemovedPreview = readyToDownload && isSelected;

                  return (
                    <div
                      key={page.pageNumber}
                      className={`group rounded-2xl border p-3 transition ${
                        isSelected
                          ? "border-red-300 bg-red-50"
                          : "border-[var(--border)] bg-[#fafafa] hover:border-[var(--primary)] hover:bg-[#f8f4ff]"
                      }`}
                    >
                      <div className="relative rounded-xl border border-[var(--border)] bg-white overflow-hidden min-h-[190px] flex items-center justify-center">
                        <img
                          src={page.image}
                          alt={`PDF page ${page.pageNumber}`}
                          className={`w-full h-full object-contain ${isRemovedPreview ? "opacity-45 grayscale" : ""}`}
                          loading="lazy"
                        />

                        <button
                          type="button"
                          onClick={() => openFullPage(page.pageNumber)}
                          className="absolute top-2 right-2 h-9 w-9 rounded-xl border border-[var(--border)] bg-white/95 shadow-sm inline-flex items-center justify-center hover:bg-[#f4edff] hover:text-[var(--primary)] transition"
                          title={`View page ${page.pageNumber}`}
                          aria-label={`View page ${page.pageNumber}`}
                        >
                          <Eye size={17} />
                        </button>

                        <div className={`absolute inset-0 flex items-center justify-center transition ${
                          isSelected
                            ? "bg-red-600/12 opacity-100"
                            : "bg-black/35 opacity-0 group-hover:opacity-100"
                        }`}>
                          <button
                            type="button"
                            onClick={() => togglePageSelection(page.pageNumber)}
                            disabled={isLoadingPdf || isProcessing}
                            className={`rounded-full px-4 py-2 text-xs font-black shadow transition ${
                              isSelected
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-white text-red-600 hover:bg-red-50"
                            }`}
                          >
                            {isSelected ? "Selected to remove" : "Select to remove"}
                          </button>
                        </div>

                        {isRemovedPreview && (
                          <div className="absolute bottom-2 left-2 rounded-full bg-red-600 text-white px-3 py-1 text-[11px] font-black">
                            Removed from output
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className={`text-sm font-black ${isSelected ? "text-red-700" : ""}`}>
                          Page {page.pageNumber}
                        </p>

                        <button
                          type="button"
                          onClick={() => togglePageSelection(page.pageNumber)}
                          className={`text-xs font-bold ${
                            isSelected ? "text-red-700" : "text-[var(--primary)]"
                          }`}
                        >
                          {isSelected ? "Undo" : "Remove"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="text-blue-700 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Your PDF is processed in your browser. This tool removes full pages only and does not unlock protected PDFs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {fullPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--border)]">
              <h3 className="font-bold">Page {fullPreview.pageNumber} Preview</h3>

              <button
                type="button"
                onClick={() => setFullPreview(null)}
                className="w-10 h-10 rounded-xl border border-[var(--border)] hover:bg-[#f8f4ff] flex items-center justify-center"
                aria-label="Close preview"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 bg-[#f8f4ff] max-h-[82vh] overflow-auto flex items-center justify-center">
              {fullPreview.loading ? (
                <div className="min-h-[360px] flex flex-col items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-[var(--primary)] mb-3" />
                  <p className="font-semibold">Opening full page...</p>
                </div>
              ) : (
                <img
                  src={fullPreview.image}
                  alt={`PDF page ${fullPreview.pageNumber} full preview`}
                  className="max-w-full rounded-xl border border-[var(--border)] bg-white shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <SuggestedTools currentToolId="pdf-page-remover" />
    </div>
  );
}

function SummaryPill({ label, value, danger = false }) {
  return (
    <div className="min-w-[80px] rounded-xl border border-[var(--border)] bg-[#fafafa] px-3 py-2">
      <p className="text-[11px] text-[var(--text-secondary)] font-semibold">{label}</p>
      <p className={`text-lg font-black ${danger ? "text-red-600" : "text-[var(--primary)]"}`}>
        {value}
      </p>
    </div>
  );
}

async function renderPdfPageToImage(pdf, pageNumber, scale, mimeType = "image/jpeg", quality = 0.85) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });

  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return {
    dataUrl: canvas.toDataURL(mimeType, quality),
    width: canvas.width,
    height: canvas.height,
  };
}

function createDefaultOutputName(name) {
  const baseName = String(name || "document.pdf").replace(/\.pdf$/i, "");
  return normalizePdfFileName(`${baseName}-cleaned.pdf`);
}

function normalizePdfFileName(name) {
  const cleanName = String(name || "cleaned-pdf.pdf")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanName) return "cleaned-pdf.pdf";

  return cleanName.toLowerCase().endsWith(".pdf") ? cleanName : `${cleanName}.pdf`;
}

function formatPagesAsRange(pagesSet) {
  const pages = Array.from(pagesSet || []).sort((a, b) => a - b);

  if (!pages.length) return "None";

  const ranges = [];
  let start = pages[0];
  let previous = pages[0];

  for (let index = 1; index <= pages.length; index += 1) {
    const current = pages[index];

    if (current === previous + 1) {
      previous = current;
      continue;
    }

    ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
    start = current;
    previous = current;
  }

  return ranges.join(", ");
}

async function saveBlob(blob, filename) {
  const safeBlob = blob instanceof Blob ? blob : new Blob([blob], { type: "application/pdf" });
  const safeName = normalizePdfFileName(filename);
  const file = new File([safeBlob], safeName, { type: "application/pdf" });

  const canShareFile =
    isIosLikeDevice() &&
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function" &&
    navigator.canShare({ files: [file] });

  if (canShareFile) {
    await navigator.share({
      files: [file],
      title: safeName,
    });
    return;
  }

  const url = URL.createObjectURL(safeBlob);
  const link = document.createElement("a");

  link.href = url;
  link.download = safeName;
  link.rel = "noopener";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function isIosLikeDevice() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";

  return (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1)
  );
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);

  if (!value) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** index;

  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
