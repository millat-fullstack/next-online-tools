import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Loader2,
  Maximize2,
  RotateCcw,
  RotateCcwSquare,
  RotateCwSquare,
  Trash2,
  Upload,
} from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Rotate PDF Online",
  path: "/rotate-pdf",
  category: "PDF Tools",
  description:
    "Rotate PDF pages online. Upload a PDF, rotate selected pages, preview, and download a corrected PDF.",
  metaTitle: "Rotate PDF Online Free | Rotate PDF Pages",
  metaDescription:
    "Rotate PDF pages online for free. Select pages, rotate left or right, preview the full PDF, and download the corrected PDF.",
};

const MAX_FILE_SIZE_MB = 80;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const THUMBNAIL_SCALE = 0.42;
const MIN_PROCESSING_TIME_MS = 900;
const MAX_PROCESSING_TIME_MS = 14000;

setupPdfWorker();

export default function RotatePdfTool() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPageIds, setSelectedPageIds] = useState([]);

  const [rotatedPdfBlob, setRotatedPdfBlob] = useState(null);
  const [rotatedPdfUrl, setRotatedPdfUrl] = useState("");
  const [showFullPreview, setShowFullPreview] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rangeText, setRangeText] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPhase, setProcessingPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [downloadProcessingTimeMs, setDownloadProcessingTimeMs] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedCount = selectedPageIds.length;
  const hasRotation = pages.some((page) => normalizeRotation(page.rotation) !== normalizeRotation(page.originalRotation || 0));
  const allSelected = pages.length > 0 && selectedPageIds.length === pages.length;

  const estimatedProcessingTime = useMemo(() => {
    if (!pages.length) return MIN_PROCESSING_TIME_MS;

    const fileMb = file?.size ? file.size / (1024 * 1024) : 0;
    const estimated = MIN_PROCESSING_TIME_MS + pages.length * 90 + fileMb * 80;

    return clampNumber(Math.round(estimated), MIN_PROCESSING_TIME_MS, MAX_PROCESSING_TIME_MS);
  }, [file?.size, pages.length]);

  const selectedPagesText = selectedCount
    ? `${selectedCount} page${selectedCount === 1 ? "" : "s"} selected`
    : "No pages selected";

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
    if (rotatedPdfUrl) {
      URL.revokeObjectURL(rotatedPdfUrl);
    }

    setRotatedPdfBlob(null);
    setRotatedPdfUrl("");
    setShowFullPreview(false);
    setProcessingTimeMs(0);
    setDownloadProcessingTimeMs(0);
    setProgress(0);
    setProcessingPhase("");
  }

  function validateFile(nextFile) {
    if (!nextFile) return "Please choose a PDF file.";

    const fileName = nextFile.name.toLowerCase();
    const isPdf = nextFile.type === "application/pdf" || fileName.endsWith(".pdf");

    if (!isPdf) {
      return "Please upload a valid PDF file.";
    }

    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      return `PDF must be under ${MAX_FILE_SIZE_MB} MB.`;
    }

    return "";
  }

  async function handleFiles(fileList) {
    const nextFile = Array.from(fileList || [])[0];

    if (!nextFile || isLoadingPdf || isProcessing) return;

    clearFeedback();
    clearOutput();

    const validationError = validateFile(nextFile);

    if (validationError) {
      setError(validationError);
      resetFileInput();
      return;
    }

    setIsLoadingPdf(true);
    setProcessingPhase("Reading PDF...");
    setProgress(8);

    try {
      const arrayBuffer = await nextFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice().buffer });
      const pdfDocument = await loadingTask.promise;
      const totalPages = pdfDocument.numPages;

      if (!totalPages) {
        throw new Error("No pages found.");
      }

      setProcessingPhase("Creating page thumbnails...");

      const sourcePdf = await PDFDocument.load(bytes.slice().buffer);
      const pdfPages = sourcePdf.getPages();

      const nextPages = [];

      for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
        setProgress(Math.round((pageIndex / totalPages) * 85));

        const pdfPage = await pdfDocument.getPage(pageIndex);
        const originalRotation = normalizeRotation(pdfPages[pageIndex - 1]?.getRotation?.().angle || 0);
        const thumbnailUrl = await renderPdfPageThumbnail(pdfPage, THUMBNAIL_SCALE);

        nextPages.push({
          id: `page-${pageIndex}`,
          pageNumber: pageIndex,
          thumbnailUrl,
          originalRotation,
          rotation: originalRotation,
          width: Math.round(pdfPage.view?.[2] || 0),
          height: Math.round(pdfPage.view?.[3] || 0),
        });
      }

      setFile(nextFile);
      setPdfBytes(bytes);
      setPdfInfo({
        pages: totalPages,
        name: nextFile.name,
        size: nextFile.size,
      });
      setPages(nextPages);
      setSelectedPageIds(nextPages.map((page) => page.id));
      setProgress(100);
      setProcessingPhase("PDF ready.");
      setSuccess(`${totalPages} page${totalPages === 1 ? "" : "s"} loaded. Select pages and rotate.`);
    } catch (loadError) {
      console.error("Rotate PDF loading error:", loadError);
      setFile(null);
      setPdfBytes(null);
      setPdfInfo(null);
      setPages([]);
      setSelectedPageIds([]);
      setError("Could not read this PDF. Please try another file.");
    } finally {
      setIsLoadingPdf(false);
      resetFileInput();
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  function handleFileInputChange(event) {
    handleFiles(event.target.files);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  function handleDragOver(event) {
    event.preventDefault();

    if (!isLoadingPdf && !isProcessing) {
      setIsDragging(true);
    }
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function togglePage(pageId) {
    if (isProcessing) return;

    clearOutput();
    clearFeedback();

    setSelectedPageIds((current) =>
      current.includes(pageId)
        ? current.filter((id) => id !== pageId)
        : [...current, pageId]
    );
  }

  function selectAllPages() {
    setSelectedPageIds(pages.map((page) => page.id));
    clearOutput();
    clearFeedback();
  }

  function clearSelection() {
    setSelectedPageIds([]);
    clearOutput();
    clearFeedback();
  }

  function selectOddPages() {
    setSelectedPageIds(pages.filter((page) => page.pageNumber % 2 === 1).map((page) => page.id));
    clearOutput();
    clearFeedback();
  }

  function selectEvenPages() {
    setSelectedPageIds(pages.filter((page) => page.pageNumber % 2 === 0).map((page) => page.id));
    clearOutput();
    clearFeedback();
  }

  function applyRangeSelection() {
    if (!rangeText.trim()) {
      setError("Enter a page range like 1-3, 5, 8.");
      return;
    }

    const pageNumbers = parsePageRange(rangeText, pages.length);

    if (!pageNumbers.length) {
      setError("No valid pages found in that range.");
      return;
    }

    const nextIds = pages
      .filter((page) => pageNumbers.includes(page.pageNumber))
      .map((page) => page.id);

    setSelectedPageIds(nextIds);
    clearOutput();
    setError("");
    setSuccess(`${nextIds.length} page${nextIds.length === 1 ? "" : "s"} selected from range.`);
  }

  function rotatePage(pageId, amount) {
    if (isProcessing) return;

    clearOutput();
    clearFeedback();

    setPages((current) =>
      current.map((page) =>
        page.id === pageId
          ? {
              ...page,
              rotation: normalizeRotation(page.rotation + amount),
            }
          : page
      )
    );
  }

  function rotateSelected(amount) {
    if (!selectedPageIds.length) {
      setError("Select at least one page first.");
      return;
    }

    clearOutput();
    clearFeedback();

    setPages((current) =>
      current.map((page) =>
        selectedPageIds.includes(page.id)
          ? {
              ...page,
              rotation: normalizeRotation(page.rotation + amount),
            }
          : page
      )
    );
  }

  function rotateAll(amount) {
    if (!pages.length) return;

    clearOutput();
    clearFeedback();

    setPages((current) =>
      current.map((page) => ({
        ...page,
        rotation: normalizeRotation(page.rotation + amount),
      }))
    );

    if (!selectedPageIds.length) {
      setSelectedPageIds(pages.map((page) => page.id));
    }
  }

  function resetSelectedRotation() {
    if (!selectedPageIds.length) {
      setError("Select at least one page first.");
      return;
    }

    clearOutput();
    clearFeedback();

    setPages((current) =>
      current.map((page) =>
        selectedPageIds.includes(page.id)
          ? {
              ...page,
              rotation: normalizeRotation(page.originalRotation || 0),
            }
          : page
      )
    );
  }

  function resetAllRotation() {
    clearOutput();
    clearFeedback();

    setPages((current) =>
      current.map((page) => ({
        ...page,
        rotation: normalizeRotation(page.originalRotation || 0),
      }))
    );
  }

  async function createRotatedPdf({ openPreview = false } = {}) {
    if (!pdfBytes || !pages.length) {
      setError("Please upload a PDF first.");
      return null;
    }

    setIsProcessing(true);
    setError("");
    setSuccess("");
    setProgress(0);
    setProcessingPhase("Preparing rotated PDF...");

    if (rotatedPdfUrl) {
      URL.revokeObjectURL(rotatedPdfUrl);
    }

    setRotatedPdfBlob(null);
    setRotatedPdfUrl("");
    setDownloadProcessingTimeMs(0);

    const startTime = performance.now();

    try {
      await wait(90);
      setProgress(18);
      setProcessingPhase("Applying page rotations...");

      const pdfDocument = await PDFDocument.load(pdfBytes.slice().buffer);
      const pdfPages = pdfDocument.getPages();

      pages.forEach((pageState, index) => {
        const pdfPage = pdfPages[index];

        if (pdfPage) {
          pdfPage.setRotation(degrees(normalizeRotation(pageState.rotation)));
        }
      });

      setProgress(68);
      setProcessingPhase("Creating new PDF file...");

      await waitRemaining(startTime, estimatedProcessingTime);

      const outputBytes = await pdfDocument.save();
      const blob = new Blob([outputBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const actualProcessingTime = Math.max(1, Math.round(performance.now() - startTime));

      setRotatedPdfBlob(blob);
      setRotatedPdfUrl(url);
      setProcessingTimeMs(actualProcessingTime);
      setProgress(100);
      setProcessingPhase("Rotated PDF ready.");
      setShowFullPreview(openPreview);
      setSuccess(`Rotated PDF created in ${(actualProcessingTime / 1000).toFixed(1)}s.`);

      return { blob, url };
    } catch (pdfError) {
      console.error("Rotate PDF creation error:", pdfError);
      setError("Could not create the rotated PDF. Please try again.");
      return null;
    } finally {
      setIsProcessing(false);
      window.setTimeout(() => setProgress(0), 800);
    }
  }

  async function checkFullPreview() {
    if (rotatedPdfBlob && rotatedPdfUrl) {
      setShowFullPreview(true);
      return;
    }

    await createRotatedPdf({ openPreview: true });
  }

  async function handleDownload() {
    if (!rotatedPdfBlob || !rotatedPdfUrl) {
      const result = await createRotatedPdf({ openPreview: false });

      if (!result?.url) return;

      await startPdfDownload(result.url, result.blob);
      return;
    }

    await startPdfDownload(rotatedPdfUrl, rotatedPdfBlob);
  }

  async function startPdfDownload(url, blob) {
    setIsProcessing(true);
    setProgress(0);
    setProcessingPhase("Preparing download...");
    setError("");
    setSuccess("");

    const startTime = performance.now();

    try {
      await wait(180);
      setProgress(45);
      setProcessingPhase("Creating download file...");

      await wait(260);
      setProgress(82);
      setProcessingPhase("Starting download...");

      const link = document.createElement("a");
      const baseName = getFileBaseName(file?.name || "rotated-pdf");

      link.href = url;
      link.download = `${baseName}-rotated.pdf`;
      link.rel = "noopener";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));

      setDownloadProcessingTimeMs(actualTime);
      setProgress(100);
      setProcessingPhase("Download started.");
      setSuccess(`Download started in ${(actualTime / 1000).toFixed(1)}s.`);
    } catch {
      setError("Could not start the download. Please try again.");
    } finally {
      setIsProcessing(false);
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  function resetTool() {
    pages.forEach((page) => {
      if (page.thumbnailUrl) {
        URL.revokeObjectURL(page.thumbnailUrl);
      }
    });

    if (rotatedPdfUrl) {
      URL.revokeObjectURL(rotatedPdfUrl);
    }

    setFile(null);
    setPdfBytes(null);
    setPdfInfo(null);
    setPages([]);
    setSelectedPageIds([]);

    setRotatedPdfBlob(null);
    setRotatedPdfUrl("");
    setShowFullPreview(false);

    setSettingsOpen(false);
    setRangeText("");

    setIsDragging(false);
    setIsLoadingPdf(false);
    setIsProcessing(false);
    setProcessingPhase("");
    setProgress(0);
    setProcessingTimeMs(0);
    setDownloadProcessingTimeMs(0);

    setError("");
    setSuccess("");

    resetFileInput();
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <RotateCwSquare size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Rotate PDF Online</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload a PDF, select pages, rotate them left or right, preview the final
          PDF, and download the corrected file.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="flex flex-col gap-5">
          <label
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
              isDragging
                ? "border-[var(--primary)] bg-[#f4edff]"
                : "border-[var(--border)] hover:bg-[#f8f4ff]"
            } ${(isLoadingPdf || isProcessing) ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <Upload size={38} className="mx-auto mb-4 text-[var(--primary)]" />

            <h2 className="text-xl font-semibold mb-2">
              Choose or drop a PDF here
            </h2>

            <p className="text-sm text-[var(--text-secondary)]">
              Maximum file size: <strong>{MAX_FILE_SIZE_MB} MB</strong>. Your PDF
              is processed in your browser.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isLoadingPdf || isProcessing}
            />
          </label>

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

          {pages.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-[var(--border)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">PDF Pages</h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {pdfInfo?.name} • {pages.length} page{pages.length === 1 ? "" : "s"} • {selectedPagesText}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={selectAllPages}
                    disabled={allSelected || isProcessing}
                    className="small-action-btn"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={clearSelection}
                    disabled={!selectedCount || isProcessing}
                    className="small-action-btn"
                  >
                    Clear Selection
                  </button>

                  <button
                    type="button"
                    onClick={resetTool}
                    disabled={isProcessing}
                    className="small-action-btn text-red-600"
                  >
                    <Trash2 size={15} />
                    Clear PDF
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-5 flex flex-col gap-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <ActionButton
                    label="Rotate Selected Left"
                    icon={RotateCcwSquare}
                    onClick={() => rotateSelected(-90)}
                    disabled={!selectedCount || isProcessing}
                  />

                  <ActionButton
                    label="Rotate Selected Right"
                    icon={RotateCwSquare}
                    onClick={() => rotateSelected(90)}
                    disabled={!selectedCount || isProcessing}
                  />

                  <ActionButton
                    label="Rotate All Left"
                    icon={RotateCcwSquare}
                    onClick={() => rotateAll(-90)}
                    disabled={isProcessing}
                    secondary
                  />

                  <ActionButton
                    label="Rotate All Right"
                    icon={RotateCwSquare}
                    onClick={() => rotateAll(90)}
                    disabled={isProcessing}
                    secondary
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={resetSelectedRotation}
                    disabled={!selectedCount || isProcessing}
                    className="btn-secondary inline-flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <RotateCcw size={18} />
                    Reset Selected
                  </button>

                  <button
                    type="button"
                    onClick={resetAllRotation}
                    disabled={!hasRotation || isProcessing}
                    className="btn-secondary inline-flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <RotateCcw size={18} />
                    Reset All
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsOpen((current) => !current)}
                    disabled={isProcessing}
                    className="btn-secondary inline-flex items-center justify-center gap-2"
                  >
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${settingsOpen ? "rotate-180" : ""}`}
                    />
                    More Options
                  </button>
                </div>

                {settingsOpen && (
                  <div className="rounded-2xl border border-[var(--border)] bg-[#fafafa] p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold mb-3">Quick page selection</p>

                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" onClick={selectOddPages} className="btn-secondary text-sm">Odd Pages</button>
                          <button type="button" onClick={selectEvenPages} className="btn-secondary text-sm">Even Pages</button>
                        </div>
                      </div>

                      <div>
                        <p className="font-semibold mb-3">Select page range</p>

                        <div className="flex gap-2">
                          <input
                            value={rangeText}
                            onChange={(event) => setRangeText(event.target.value)}
                            placeholder="Example: 1-3, 5, 8"
                            className="flex-1 h-11 rounded-xl border border-[var(--border)] px-3 outline-none focus:border-[var(--primary)]"
                          />

                          <button
                            type="button"
                            onClick={applyRangeSelection}
                            className="btn-primary px-4"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {pages.map((page) => (
                    <PageCard
                      key={page.id}
                      page={page}
                      isSelected={selectedPageIds.includes(page.id)}
                      onToggle={() => togglePage(page.id)}
                      onRotateLeft={() => rotatePage(page.id, -90)}
                      onRotateRight={() => rotatePage(page.id, 90)}
                      disabled={isProcessing}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {(isLoadingPdf || isProcessing) && (
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                <span>{processingPhase || "Processing PDF..."}</span>
                <span>{progress}%</span>
              </div>

              <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!isLoadingPdf && !isProcessing && (processingTimeMs > 0 || downloadProcessingTimeMs > 0) && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-800">
              <span className="font-semibold">
                {downloadProcessingTimeMs > 0 ? "Download processing completed" : "PDF processing completed"}
              </span>
              <span className="font-bold">
                {((downloadProcessingTimeMs || processingTimeMs) / 1000).toFixed(1)}s
              </span>
            </div>
          )}

          {pages.length > 0 && (
            <div className="grid sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => createRotatedPdf({ openPreview: false })}
                disabled={isProcessing || isLoadingPdf}
                className={`btn-primary inline-flex items-center justify-center gap-2 sm:col-span-1 ${
                  (isProcessing || isLoadingPdf) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                Create PDF
              </button>

              <button
                type="button"
                onClick={checkFullPreview}
                disabled={isProcessing || isLoadingPdf}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  (isProcessing || isLoadingPdf) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Maximize2 size={18} />
                Check Full PDF Preview
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={isProcessing || isLoadingPdf}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  (isProcessing || isLoadingPdf) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download PDF
              </button>
            </div>
          )}

          {rotatedPdfUrl && showFullPreview && (
            <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white">
              <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Full PDF Preview</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Review the rotated PDF before saving it.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isProcessing}
                  className={`btn-primary inline-flex items-center justify-center gap-2 ${
                    isProcessing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Download size={18} />
                  Download
                </button>
              </div>

              <iframe
                src={rotatedPdfUrl}
                title="Rotated PDF Preview"
                className="w-full h-[720px] bg-gray-50"
              />
            </div>
          )}
        </div>
      </section>

      <style>{`
        .small-action-btn {
          min-height: 38px;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          background: white;
          padding: 0.45rem 0.75rem;
          font-size: 0.85rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          transition: 160ms ease;
        }
        .small-action-btn:hover:not(:disabled) {
          background: #f8f4ff;
          color: var(--primary);
        }
        .small-action-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>

      <SuggestedTools currentToolId="rotate-pdf" />
    </div>
  );
}

function ActionButton({ label, icon: Icon, onClick, disabled, secondary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${secondary ? "btn-secondary" : "btn-primary"} inline-flex items-center justify-center gap-2 disabled:opacity-40`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

function PageCard({
  page,
  isSelected,
  onToggle,
  onRotateLeft,
  onRotateRight,
  disabled,
}) {
  return (
    <div
      className={`rounded-2xl border overflow-hidden bg-white transition ${
        isSelected
          ? "border-[var(--primary)] ring-2 ring-[rgba(155,108,227,0.18)]"
          : "border-[var(--border)]"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="w-full text-left"
      >
        <div className="relative bg-[#f8f4ff] h-52 flex items-center justify-center">
          <div className="absolute left-2 top-2 rounded-full bg-white/95 border border-[var(--border)] px-2.5 py-1 text-xs font-bold text-[var(--primary)] shadow-sm">
            Page {page.pageNumber}
          </div>

          {isSelected && (
            <div className="absolute right-2 top-2 rounded-full bg-[var(--primary)] text-white px-2.5 py-1 text-xs font-bold shadow-sm">
              Selected
            </div>
          )}

          <img
            src={page.thumbnailUrl}
            alt={`PDF page ${page.pageNumber}`}
            className="max-w-[86%] max-h-[86%] rounded shadow-md object-contain bg-white"
            style={{
              transform: `rotate(${page.rotation - page.originalRotation}deg)`,
              transition: "transform 180ms ease",
            }}
          />
        </div>
      </button>

      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-xs text-[var(--text-secondary)]">
            Rotation: <strong>{normalizeRotation(page.rotation)}°</strong>
          </p>

          <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className="text-xs font-bold text-[var(--primary)] disabled:opacity-40"
          >
            {isSelected ? "Unselect" : "Select"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onRotateLeft}
            disabled={disabled}
            className="small-action-btn"
          >
            <RotateCcwSquare size={15} />
            Left
          </button>

          <button
            type="button"
            onClick={onRotateRight}
            disabled={disabled}
            className="small-action-btn"
          >
            <RotateCwSquare size={15} />
            Right
          </button>
        </div>
      </div>
    </div>
  );
}

function setupPdfWorker() {
  if (typeof window === "undefined" || !pdfjsLib.GlobalWorkerOptions) return;

  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  } catch {
    if (pdfjsLib.version) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }
  }
}

async function renderPdfPageThumbnail(page, scale) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not supported.");
  }

  const outputScale = Math.min(2, window.devicePixelRatio || 1);

  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return canvas.toDataURL("image/jpeg", 0.82);
}

function parsePageRange(input, totalPages) {
  const result = new Set();
  const parts = String(input || "").split(",");

  parts.forEach((rawPart) => {
    const part = rawPart.trim();

    if (!part) return;

    if (part.includes("-")) {
      const [startRaw, endRaw] = part.split("-");
      const start = Number(startRaw);
      const end = Number(endRaw);

      if (!Number.isInteger(start) || !Number.isInteger(end)) return;

      const min = Math.max(1, Math.min(start, end));
      const max = Math.min(totalPages, Math.max(start, end));

      for (let page = min; page <= max; page += 1) {
        result.add(page);
      }

      return;
    }

    const pageNumber = Number(part);

    if (Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      result.add(pageNumber);
    }
  });

  return Array.from(result).sort((a, b) => a - b);
}

function normalizeRotation(value) {
  const normalized = ((Number(value || 0) % 360) + 360) % 360;

  return normalized;
}

function getFileBaseName(fileName) {
  return String(fileName || "rotated-pdf").replace(/\.[^/.]+$/, "");
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitRemaining(startTime, minimumMs) {
  const elapsed = performance.now() - startTime;
  const remaining = Math.max(0, minimumMs - elapsed);

  if (remaining > 0) {
    await wait(remaining);
  }
}

function clampNumber(value, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) return min;

  return Math.min(max, Math.max(min, number));
}
