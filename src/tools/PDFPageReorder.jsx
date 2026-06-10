import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Upload,
  FileText,
  Download,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Eye,
  X,
  Info,
  BookOpen,
  ListChecks,
  GripVertical,
  ArrowUp,
  ArrowDown,
  MoveUp,
  MoveDown,
  Shuffle,
  RefreshCcw,
  Layers,
  MousePointerClick,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import SuggestedTools from "../components/sidebar/SuggestedTools";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const toolData = {
  title: "PDF Page Reorder",
  path: "/pdf-page-reorder",
  category: "PDF Tools",
  description:
    "Reorder PDF pages online. Upload a PDF, drag pages into a new order, preview pages, and download the reordered PDF directly from your browser.",
  metaTitle: "PDF Page Reorder | Rearrange PDF Pages Online Free",
  metaDescription:
    "Reorder PDF pages online for free. Upload your PDF, drag pages into the right order, preview pages, and download a clean reordered PDF instantly.",
};

const SITE_URL = "https://nextonlinetools.com";
const canonicalUrl = `${SITE_URL}${
  toolData.path.startsWith("/tool") ? toolData.path : `/tool${toolData.path}`
}`;

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_THUMBNAIL_PAGES = 120;
const ACCEPTED_TYPE = "application/pdf";

export default function PDFPageReorder() {
  const fileInputRef = useRef(null);
  const processedUrlRef = useRef("");

  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pageOrder, setPageOrder] = useState([]);
  const [draggedPageId, setDraggedPageId] = useState(null);
  const [previewPage, setPreviewPage] = useState(null);
  const [manualOrder, setManualOrder] = useState("");
  const [outputName, setOutputName] = useState("reordered-pdf.pdf");
  const [processedUrl, setProcessedUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const hasPdf = Boolean(pdfBytes && totalPages);
  const isChanged = useMemo(() => {
    return pageOrder.some((page, index) => page.pageNumber !== index + 1);
  }, [pageOrder]);

  const fileSizeText = useMemo(() => formatBytes(fileSize), [fileSize]);
  const resultSizeText = useMemo(() => formatBytes(resultSize), [resultSize]);
  const orderSummary = useMemo(() => {
    if (!pageOrder.length) return "No PDF loaded";

    const firstPages = pageOrder.slice(0, 8).map((page) => page.pageNumber);
    const suffix = pageOrder.length > 8 ? ", ..." : "";

    return `${firstPages.join(", ")}${suffix}`;
  }, [pageOrder]);

  const seoJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "PDF Page Reorder",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      "@id": canonicalUrl,
      url: canonicalUrl,
      description:
        "Reorder PDF pages online by dragging page thumbnails and downloading a clean reordered PDF from your browser.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Reorder PDF pages",
        "Drag and drop PDF pages",
        "Move PDF pages up or down",
        "Reverse PDF page order",
        "Preview PDF pages",
        "Download reordered PDF",
        "Browser-based PDF processing",
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
          name: "Can I reorder PDF pages online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Upload a PDF, drag the page thumbnails into a new order, and download the reordered PDF.",
          },
        },
        {
          "@type": "Question",
          name: "Are my PDF files uploaded to a server?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. This PDF page reorder tool processes your PDF directly in your browser.",
          },
        },
        {
          "@type": "Question",
          name: "Can I reverse the order of PDF pages?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can use the Reverse Order button to flip the PDF page order quickly.",
          },
        },
        {
          "@type": "Question",
          name: "Will this tool remove any PDF pages?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. This tool only rearranges page order. It keeps all pages unless you use a separate PDF page remover tool.",
          },
        },
      ],
    };
  }, []);

  useEffect(() => {
    return () => {
      if (processedUrlRef.current) {
        URL.revokeObjectURL(processedUrlRef.current);
      }
    };
  }, []);

  function clearFeedback() {
    setSuccess("");
    setError("");
  }

  function clearProcessedOutput() {
    if (processedUrlRef.current) {
      URL.revokeObjectURL(processedUrlRef.current);
      processedUrlRef.current = "";
    }

    setProcessedUrl("");
    setResultSize(0);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleFile(file) {
    clearFeedback();
    clearProcessedOutput();

    const validationError = validatePdfFile(file);

    if (validationError) {
      setError(validationError);
      resetFileInput();
      return;
    }

    setIsLoading(true);

    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pageCount = pdf.getPageCount();

      if (!pageCount) {
        throw new Error("Empty PDF");
      }

      const thumbnails = await renderPdfThumbnails(bytes, pageCount);
      const pages = Array.from({ length: pageCount }, (_, index) => ({
        id: `page-${index + 1}`,
        pageNumber: index + 1,
        thumbnail: thumbnails[index] || "",
      }));

      setFileName(file.name || "document.pdf");
      setFileSize(file.size || bytes.byteLength || 0);
      setPdfBytes(bytes);
      setTotalPages(pageCount);
      setPageOrder(pages);
      setManualOrder(pages.map((page) => page.pageNumber).join(", "));
      setOutputName(`${getFileBaseName(file.name || "document")}-reordered.pdf`);
      setPreviewPage(null);
      setDraggedPageId(null);
      setSuccess("PDF loaded. Drag pages or use move buttons to reorder.");
    } catch (err) {
      setError(
        err?.message?.toLowerCase?.().includes("encrypted")
          ? "This PDF may be password-protected or encrypted. Please use an unlocked PDF."
          : "Could not load this PDF. Please try another PDF file."
      );
      setPdfBytes(null);
      setTotalPages(0);
      setPageOrder([]);
      setManualOrder("");
      setFileName("");
      setFileSize(0);
    } finally {
      setIsLoading(false);
      resetFileInput();
    }
  }

  function handleFileInputChange(event) {
    const file = event.target.files?.[0];

    if (file) {
      handleFile(file);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDraggingFile(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDraggingFile(true);
  }

  function handleDragLeave() {
    setIsDraggingFile(false);
  }

  function updatePageOrder(nextOrder, message = "Page order updated.") {
    setPageOrder(nextOrder);
    setManualOrder(nextOrder.map((page) => page.pageNumber).join(", "));
    setSuccess(message);
    setError("");
    clearProcessedOutput();
  }

  function movePage(index, direction) {
    if (index < 0 || index >= pageOrder.length) return;

    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= pageOrder.length) return;

    const nextOrder = [...pageOrder];
    const [page] = nextOrder.splice(index, 1);
    nextOrder.splice(nextIndex, 0, page);

    updatePageOrder(nextOrder, `Page ${page.pageNumber} moved.`);
  }

  function movePageToStart(index) {
    if (index <= 0 || index >= pageOrder.length) return;

    const nextOrder = [...pageOrder];
    const [page] = nextOrder.splice(index, 1);
    nextOrder.unshift(page);

    updatePageOrder(nextOrder, `Page ${page.pageNumber} moved to start.`);
  }

  function movePageToEnd(index) {
    if (index < 0 || index >= pageOrder.length - 1) return;

    const nextOrder = [...pageOrder];
    const [page] = nextOrder.splice(index, 1);
    nextOrder.push(page);

    updatePageOrder(nextOrder, `Page ${page.pageNumber} moved to end.`);
  }

  function handlePageDragStart(pageId) {
    setDraggedPageId(pageId);
  }

  function handlePageDragOver(event) {
    event.preventDefault();
  }

  function handlePageDrop(targetPageId) {
    if (!draggedPageId || draggedPageId === targetPageId) {
      setDraggedPageId(null);
      return;
    }

    const fromIndex = pageOrder.findIndex((page) => page.id === draggedPageId);
    const toIndex = pageOrder.findIndex((page) => page.id === targetPageId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedPageId(null);
      return;
    }

    const nextOrder = [...pageOrder];
    const [movedPage] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, movedPage);

    updatePageOrder(nextOrder, `Page ${movedPage.pageNumber} moved to position ${toIndex + 1}.`);
    setDraggedPageId(null);
  }

  function resetOrder() {
    if (!pageOrder.length) return;

    const nextOrder = [...pageOrder].sort((a, b) => a.pageNumber - b.pageNumber);
    updatePageOrder(nextOrder, "Original PDF page order restored.");
  }

  function reverseOrder() {
    if (!pageOrder.length) return;

    updatePageOrder([...pageOrder].reverse(), "PDF page order reversed.");
  }

  function applyManualOrder() {
    clearFeedback();
    clearProcessedOutput();

    if (!hasPdf) {
      setError("Please upload a PDF first.");
      return;
    }

    const parsed = parsePageOrderInput(manualOrder, totalPages);

    if (parsed.error) {
      setError(parsed.error);
      return;
    }

    const byPageNumber = new Map(pageOrder.map((page) => [page.pageNumber, page]));
    const nextOrder = parsed.pages.map((pageNumber) => byPageNumber.get(pageNumber));

    updatePageOrder(nextOrder, "Custom page order applied.");
  }

  async function createReorderedPdf() {
    clearFeedback();
    clearProcessedOutput();

    if (!hasPdf) {
      setError("Please upload a PDF first.");
      return;
    }

    if (!pageOrder.length || pageOrder.length !== totalPages) {
      setError("Page order is incomplete. Please reset order and try again.");
      return;
    }

    setIsProcessing(true);

    try {
      const sourcePdf = await PDFDocument.load(pdfBytes);
      const outputPdf = await PDFDocument.create();
      const copiedPages = await outputPdf.copyPages(
        sourcePdf,
        pageOrder.map((page) => page.pageNumber - 1)
      );

      copiedPages.forEach((page) => outputPdf.addPage(page));

      const outputBytes = await outputPdf.save();
      const blob = new Blob([outputBytes], { type: ACCEPTED_TYPE });
      const url = URL.createObjectURL(blob);

      processedUrlRef.current = url;
      setProcessedUrl(url);
      setResultSize(blob.size);
      setSuccess("Reordered PDF is ready. Download it below.");
    } catch {
      setError("Could not create the reordered PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  function downloadReorderedPdf() {
    if (!processedUrl) {
      createReorderedPdf();
      return;
    }

    const link = document.createElement("a");
    link.href = processedUrl;
    link.download = normalizePdfFileName(outputName || "reordered-pdf.pdf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function resetTool() {
    clearProcessedOutput();
    setFileName("");
    setFileSize(0);
    setPdfBytes(null);
    setTotalPages(0);
    setPageOrder([]);
    setDraggedPageId(null);
    setPreviewPage(null);
    setManualOrder("");
    setOutputName("reordered-pdf.pdf");
    setIsDraggingFile(false);
    setIsLoading(false);
    setIsProcessing(false);
    setSuccess("");
    setError("");
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
        accept="application/pdf,.pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Shuffle size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">PDF Page Reorder</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Reorder PDF pages online in your browser. Upload a PDF, drag pages into
          the correct order, preview pages, and download a clean reordered PDF
          without uploading your file to a server.
        </p>
      </section>

      <section className="card p-6 sm:p-8">
        {!hasPdf && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFilePicker}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition min-h-[320px] flex flex-col items-center justify-center ${
              isDraggingFile
                ? "border-[var(--primary)] bg-[#f4edff]"
                : "border-[var(--border)] hover:bg-[#f8f4ff]"
            }`}
          >
            <Upload size={46} className="mx-auto mb-4 text-[var(--primary)]" />

            <h2 className="text-2xl font-bold mb-2">Upload PDF to Reorder Pages</h2>

            <p className="text-sm text-[var(--text-secondary)] max-w-xl">
              Drag and drop a PDF here or click to choose a file. Max file size:
              <strong> {MAX_FILE_SIZE_MB} MB</strong>. Your PDF is processed in
              your browser.
            </p>

            <button
              type="button"
              className="btn-primary mt-6 inline-flex items-center justify-center gap-2"
            >
              <Upload size={18} />
              Choose PDF
            </button>
          </div>
        )}

        {hasPdf && (
          <div className="grid xl:grid-cols-[330px_1fr] gap-6">
            <aside className="flex flex-col gap-4">
              <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
                <div className="flex items-start gap-3">
                  <FileText size={22} className="text-[var(--primary)] shrink-0 mt-1" />
                  <div className="min-w-0">
                    <h2 className="font-bold break-all">{fileName}</h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {totalPages} pages • {fileSizeText}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <InfoCard label="Pages" value={totalPages} />
                  <InfoCard label="Changed" value={isChanged ? "Yes" : "No"} green={isChanged} />
                </div>
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-5 bg-[#f8f4ff]">
                <h3 className="font-bold mb-3">Quick Actions</h3>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={resetOrder}
                    className="btn-secondary inline-flex items-center justify-center gap-2 px-3 py-2 text-sm"
                  >
                    <RefreshCcw size={16} />
                    Original
                  </button>

                  <button
                    type="button"
                    onClick={reverseOrder}
                    className="btn-secondary inline-flex items-center justify-center gap-2 px-3 py-2 text-sm"
                  >
                    <Shuffle size={16} />
                    Reverse
                  </button>
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  Drag page cards to reorder, or use the move buttons on each page.
                </p>
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
                <h3 className="font-bold mb-3">Manual Page Order</h3>

                <textarea
                  value={manualOrder}
                  onChange={(event) => {
                    setManualOrder(event.target.value);
                    clearFeedback();
                  }}
                  rows="4"
                  className="w-full border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--primary)] resize-none"
                  placeholder="Example: 3, 1, 2, 4-8"
                />

                <button
                  type="button"
                  onClick={applyManualOrder}
                  className="btn-secondary w-full mt-3 inline-flex items-center justify-center gap-2"
                >
                  <Layers size={17} />
                  Apply Custom Order
                </button>

                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  Include every page exactly once. Example: <strong>3, 1, 2, 4-8</strong>.
                </p>
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
                <h3 className="font-bold mb-3">Output File</h3>

                <input
                  type="text"
                  value={outputName}
                  onChange={(event) => setOutputName(event.target.value)}
                  className="w-full border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)]"
                />

                <button
                  type="button"
                  onClick={processedUrl ? downloadReorderedPdf : createReorderedPdf}
                  disabled={isProcessing}
                  className={`btn-primary w-full mt-4 inline-flex items-center justify-center gap-2 ${
                    isProcessing ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  <Download size={18} />
                  {isProcessing
                    ? "Creating PDF..."
                    : processedUrl
                      ? "Download Reordered PDF"
                      : "Create Reordered PDF"}
                </button>

                {processedUrl && (
                  <p className="text-xs text-green-700 mt-3">
                    Ready • {resultSizeText}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={openFilePicker}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                Upload Another PDF
              </button>

              <button
                type="button"
                onClick={resetTool}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Reset Tool
              </button>
            </aside>

            <main className="flex flex-col gap-4">
              {(error || success || isLoading || isProcessing) && (
                <div className="grid md:grid-cols-2 gap-3">
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

                  {(isLoading || isProcessing) && (
                    <div className="flex items-start gap-3 text-sm text-blue-700 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                      <Info size={18} className="shrink-0 mt-0.5" />
                      <p>{isLoading ? "Loading PDF pages..." : "Creating your reordered PDF..."}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-bold">Drag Pages to Reorder</h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Current order: {orderSummary}
                    </p>
                  </div>

                  {totalPages > MAX_THUMBNAIL_PAGES && (
                    <span className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
                      First {MAX_THUMBNAIL_PAGES} thumbnails rendered for performance
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {pageOrder.map((page, index) => (
                    <div
                      key={page.id}
                      draggable
                      onDragStart={() => handlePageDragStart(page.id)}
                      onDragOver={handlePageDragOver}
                      onDrop={() => handlePageDrop(page.id)}
                      className={`rounded-2xl border bg-white overflow-hidden transition ${
                        draggedPageId === page.id
                          ? "border-[var(--primary)] opacity-60 scale-[0.98]"
                          : "border-[var(--border)] hover:border-[var(--primary)]"
                      }`}
                    >
                      <div className="bg-[#f8f4ff] border-b border-[var(--border)] px-3 py-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical size={16} className="text-[var(--text-secondary)] shrink-0 cursor-grab" />
                          <span className="text-sm font-bold truncate">
                            Position {index + 1}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPreviewPage(page)}
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:bg-white"
                          title="Preview page"
                        >
                          <Eye size={16} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPreviewPage(page)}
                        className="w-full aspect-[3/4] bg-gray-100 flex items-center justify-center p-2"
                      >
                        {page.thumbnail ? (
                          <img
                            src={page.thumbnail}
                            alt={`PDF page ${page.pageNumber}`}
                            className="max-w-full max-h-full object-contain shadow-sm bg-white"
                          />
                        ) : (
                          <div className="text-center text-[var(--text-secondary)]">
                            <FileText size={34} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-xs">Page {page.pageNumber}</p>
                          </div>
                        )}
                      </button>

                      <div className="p-3">
                        <p className="text-sm font-semibold text-center mb-3">
                          Original Page {page.pageNumber}
                        </p>

                        <div className="grid grid-cols-4 gap-1">
                          <SmallIconButton
                            title="Move to start"
                            disabled={index === 0}
                            onClick={() => movePageToStart(index)}
                          >
                            <MoveUp size={15} />
                          </SmallIconButton>

                          <SmallIconButton
                            title="Move up"
                            disabled={index === 0}
                            onClick={() => movePage(index, -1)}
                          >
                            <ArrowUp size={15} />
                          </SmallIconButton>

                          <SmallIconButton
                            title="Move down"
                            disabled={index === pageOrder.length - 1}
                            onClick={() => movePage(index, 1)}
                          >
                            <ArrowDown size={15} />
                          </SmallIconButton>

                          <SmallIconButton
                            title="Move to end"
                            disabled={index === pageOrder.length - 1}
                            onClick={() => movePageToEnd(index)}
                          >
                            <MoveDown size={15} />
                          </SmallIconButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={20} className="text-blue-700 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Privacy note: your PDF is processed directly in your browser.
                    This tool only changes page order and does not upload your PDF to a server.
                  </p>
                </div>
              </div>
            </main>
          </div>
        )}
      </section>

      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">Reorder PDF Pages Online</h2>
        </div>

        <div className="text-[var(--text-secondary)] leading-7 space-y-4">
          <p>
            PDF Page Reorder helps you rearrange PDF pages quickly without installing software.
            Upload a PDF, drag page thumbnails into the correct order, and create a new PDF file.
          </p>

          <p>
            This tool is useful when scanned pages are in the wrong order, a document needs a new
            section arrangement, or you want to reverse PDF page order. It keeps all pages and only
            changes their sequence.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <FeatureCard
            icon={MousePointerClick}
            title="Drag and Drop"
            text="Move PDF pages visually with simple page thumbnail cards."
          />

          <FeatureCard
            icon={Shuffle}
            title="Quick Reorder"
            text="Restore original order, reverse order, or apply a custom manual order."
          />

          <FeatureCard
            icon={ShieldCheck}
            title="Browser Based"
            text="Your PDF is processed locally in your browser for better privacy."
          />
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <ListChecks size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">PDF Page Reorder FAQ</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FaqItem
            question="How do I reorder pages in a PDF?"
            answer="Upload your PDF, drag the page cards into the new order, then create and download the reordered PDF."
          />

          <FaqItem
            question="Can I reverse PDF page order?"
            answer="Yes. Use the Reverse button to flip the order of all PDF pages instantly."
          />

          <FaqItem
            question="Does this tool delete any pages?"
            answer="No. This tool keeps every page and only changes the page sequence."
          />

          <FaqItem
            question="Is my PDF uploaded to your server?"
            answer="No. The PDF is processed in your browser, which means your file stays on your device."
          />

          <FaqItem
            question="Can I manually type a page order?"
            answer="Yes. You can enter a custom order like 3, 1, 2, 4-8. Every page must be included exactly once."
          />

          <FaqItem
            question="Can I use this on mobile?"
            answer="Yes. On mobile, you can use the move up and move down buttons if drag and drop is not comfortable."
          />
        </div>
      </section>

      {previewPage && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xl font-bold">Original Page {previewPage.pageNumber}</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Preview before downloading reordered PDF.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewPage(null)}
                className="w-10 h-10 rounded-xl border border-[var(--border)] inline-flex items-center justify-center hover:bg-[#f8f4ff]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-100 rounded-2xl p-4 flex items-center justify-center">
              {previewPage.thumbnail ? (
                <img
                  src={previewPage.thumbnail}
                  alt={`Preview PDF page ${previewPage.pageNumber}`}
                  className="max-w-full max-h-[70vh] bg-white shadow-lg"
                />
              ) : (
                <div className="py-16 text-center text-[var(--text-secondary)]">
                  <FileText size={54} className="mx-auto mb-3 text-gray-300" />
                  <p>Thumbnail preview was skipped for performance.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SuggestedTools currentToolId="pdf-page-reorder" />
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

function SmallIconButton({ children, disabled, title, onClick }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`h-8 rounded-lg border border-[var(--border)] inline-flex items-center justify-center ${
        disabled ? "opacity-35 cursor-not-allowed" : "hover:bg-[#f8f4ff]"
      }`}
    >
      {children}
    </button>
  );
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
      <Icon size={22} className="text-[var(--primary)] mb-3" />
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)]">{text}</p>
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

function validatePdfFile(file) {
  if (!file) return "Please upload a PDF file.";

  const isPdf = file.type === ACCEPTED_TYPE || file.name?.toLowerCase?.().endsWith(".pdf");

  if (!isPdf) {
    return "Please upload a valid PDF file.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `PDF file must be under ${MAX_FILE_SIZE_MB} MB.`;
  }

  return "";
}

async function renderPdfThumbnails(bytes, totalPages) {
  const thumbnails = [];
  const renderCount = Math.min(totalPages, MAX_THUMBNAIL_PAGES);
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
  const pdf = await loadingTask.promise;

  for (let pageNumber = 1; pageNumber <= renderCount; pageNumber += 1) {
    try {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(0.45, 180 / baseViewport.width);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      thumbnails[pageNumber - 1] = canvas.toDataURL("image/jpeg", 0.78);
    } catch {
      thumbnails[pageNumber - 1] = "";
    }
  }

  return thumbnails;
}

function parsePageOrderInput(input, totalPages) {
  const raw = String(input || "").trim();

  if (!raw) {
    return { error: "Please enter a page order." };
  }

  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  const pages = [];

  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      pages.push(Number(part));
      continue;
    }

    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);

    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      const step = start <= end ? 1 : -1;

      for (let page = start; step > 0 ? page <= end : page >= end; page += step) {
        pages.push(page);
      }

      continue;
    }

    return {
      error: "Invalid order format. Use numbers and ranges like 3, 1, 2, 4-8.",
    };
  }

  if (pages.length !== totalPages) {
    return {
      error: `Custom order must include all ${totalPages} pages exactly once.`,
    };
  }

  const seen = new Set();

  for (const page of pages) {
    if (page < 1 || page > totalPages) {
      return {
        error: `Page ${page} is outside this PDF. Use pages between 1 and ${totalPages}.`,
      };
    }

    if (seen.has(page)) {
      return {
        error: `Page ${page} is repeated. Each page must be included once.`,
      };
    }

    seen.add(page);
  }

  return { pages };
}

function normalizePdfFileName(name) {
  const cleanName = String(name || "reordered-pdf.pdf").trim() || "reordered-pdf.pdf";
  return cleanName.toLowerCase().endsWith(".pdf") ? cleanName : `${cleanName}.pdf`;
}

function getFileBaseName(fileName) {
  return String(fileName || "document").replace(/\.[^/.]+$/, "");
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const sizeIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, sizeIndex);

  return `${size.toFixed(sizeIndex === 0 ? 0 : 1)} ${units[sizeIndex]}`;
}
