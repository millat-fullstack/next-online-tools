import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Upload,
  FileText,
  Trash2,
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
  Layers,
  MousePointerClick,
  Scissors,
  Sparkles,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import SuggestedTools from "../components/sidebar/SuggestedTools";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const toolData = {
  title: "PDF Page Remover",
  path: "/pdf-page-remover",
  category: "PDF Tools",
  description:
    "Remove unwanted pages from PDF files online. Upload a PDF, select pages to delete, and download a clean PDF directly from your browser.",
  metaTitle: "PDF Page Remover | Delete Pages from PDF Online Free",
  metaDescription:
    "Remove unwanted pages from a PDF online for free. Upload your PDF, select pages to delete, preview pages, and download a clean PDF instantly.",
};

const SITE_URL = "https://nextonlinetools.com";
const canonicalUrl = `${SITE_URL}${
  toolData.path.startsWith("/tool") ? toolData.path : `/tool${toolData.path}`
}`;

const MAX_FILE_SIZE_MB = 50;
const MAX_THUMBNAIL_PAGES = 120;
const ACCEPTED_TYPE = "application/pdf";

export default function PDFPageRemover() {
  const fileInputRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [pageRange, setPageRange] = useState("");
  const [outputName, setOutputName] = useState("cleaned-pdf.pdf");
  const [previewPage, setPreviewPage] = useState(null);
  const [processedUrl, setProcessedUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const selectedCount = selectedPages.size;
  const finalPageCount = Math.max(0, totalPages - selectedCount);
  const hasPdf = Boolean(pdfBytes && totalPages);

  const selectedPagesText = useMemo(() => {
    return selectedCount ? formatPagesAsRange(selectedPages) : "None";
  }, [selectedPages, selectedCount]);

  const fileSizeText = useMemo(() => formatBytes(fileSize), [fileSize]);
  const resultSizeText = useMemo(() => formatBytes(resultSize), [resultSize]);

  const seoJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: toolData.title,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      "@id": canonicalUrl,
      url: canonicalUrl,
      description:
        "Remove unwanted PDF pages directly in your browser and download a clean PDF file.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Remove pages from PDF",
        "Delete PDF page ranges",
        "PDF page preview thumbnails",
        "Browser-based PDF processing",
        "Download clean PDF file",
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
          name: "Can I remove pages from a PDF online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Upload your PDF, select the pages you want to remove, and download a new PDF without those pages.",
          },
        },
        {
          "@type": "Question",
          name: "Are my PDF files uploaded to a server?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. This PDF page remover is designed to process PDF files directly in your browser.",
          },
        },
        {
          "@type": "Question",
          name: "Can I remove multiple PDF pages at once?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can click page thumbnails or enter page numbers and ranges such as 1,3,5-8.",
          },
        },
        {
          "@type": "Question",
          name: "Can I remove every page from a PDF?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. A valid PDF must keep at least one page, so the tool will stop you from deleting all pages.",
          },
        },
      ],
    };
  }, []);

  useEffect(() => {
    return () => {
      if (processedUrl) URL.revokeObjectURL(processedUrl);
    };
  }, [processedUrl]);

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function resetResult() {
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    setProcessedUrl("");
    setResultSize(0);
  }

  async function handleFile(file) {
    clearFeedback();
    resetResult();
    setPreviewPage(null);

    if (!file) return;

    const isPdf = file.type === ACCEPTED_TYPE || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Please upload a valid PDF file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Please upload a PDF smaller than ${MAX_FILE_SIZE_MB} MB for smooth browser processing.`);
      return;
    }

    try {
      setIsLoading(true);

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
      const pdf = await loadingTask.promise;
      const pages = pdf.numPages;

      setFileName(file.name);
      setFileSize(file.size);
      setPdfBytes(bytes);
      setTotalPages(pages);
      setSelectedPages(new Set());
      setPageRange("");
      setOutputName(createDefaultOutputName(file.name));

      const thumbnailLimit = Math.min(pages, MAX_THUMBNAIL_PAGES);
      const renderedThumbnails = [];

      for (let pageNumber = 1; pageNumber <= thumbnailLimit; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 0.32 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await page.render({ canvasContext: context, viewport }).promise;

        renderedThumbnails.push({
          pageNumber,
          image: canvas.toDataURL("image/jpeg", 0.82),
        });
      }

      setThumbnails(renderedThumbnails);
      setSuccess(
        pages > MAX_THUMBNAIL_PAGES
          ? `PDF loaded. Showing first ${MAX_THUMBNAIL_PAGES} page previews. You can still remove later pages using the range box.`
          : "PDF loaded. Select the pages you want to remove."
      );
    } catch (err) {
      console.error(err);
      resetTool(false);
      setError(
        "Could not read this PDF. It may be encrypted, password-protected, damaged, or too complex for browser preview."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputChange(event) {
    const file = event.target.files?.[0];
    handleFile(file);
    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  }

  function togglePage(pageNumber) {
    clearFeedback();
    resetResult();

    setSelectedPages((current) => {
      const next = new Set(current);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      setPageRange(formatPagesAsRange(next));
      return next;
    });
  }

  function applyRangeSelection() {
    clearFeedback();
    resetResult();

    if (!hasPdf) {
      setError("Please upload a PDF first.");
      return;
    }

    if (!pageRange.trim()) {
      setSelectedPages(new Set());
      setSuccess("Page selection cleared.");
      return;
    }

    const result = parsePageRange(pageRange, totalPages);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    if (result.pages.size >= totalPages) {
      setError("You must keep at least one page in the PDF.");
      return;
    }

    setSelectedPages(result.pages);
    setPageRange(formatPagesAsRange(result.pages));
    setSuccess(`${result.pages.size} page${result.pages.size === 1 ? "" : "s"} selected for removal.`);
  }

  function selectPages(type) {
    clearFeedback();
    resetResult();

    if (!hasPdf) {
      setError("Please upload a PDF first.");
      return;
    }

    const next = new Set();

    if (type === "clear") {
      setSelectedPages(next);
      setPageRange("");
      setSuccess("Selection cleared.");
      return;
    }

    if (type === "odd") {
      for (let page = 1; page <= totalPages; page += 2) next.add(page);
    }

    if (type === "even") {
      for (let page = 2; page <= totalPages; page += 2) next.add(page);
    }

    if (type === "first") next.add(1);
    if (type === "last") next.add(totalPages);

    if (next.size >= totalPages) {
      setError("This selection would remove all pages. Please keep at least one page.");
      return;
    }

    setSelectedPages(next);
    setPageRange(formatPagesAsRange(next));
    setSuccess(`${next.size} page${next.size === 1 ? "" : "s"} selected for removal.`);
  }

  async function removeSelectedPages() {
    clearFeedback();
    resetResult();

    if (!pdfBytes || !totalPages) {
      setError("Please upload a PDF first.");
      return;
    }

    if (!selectedCount) {
      setError("Please select at least one page to remove.");
      return;
    }

    if (selectedCount >= totalPages) {
      setError("You must keep at least one page in the PDF.");
      return;
    }

    try {
      setIsProcessing(true);

      const sourcePdf = await PDFDocument.load(pdfBytes.slice());
      const newPdf = await PDFDocument.create();
      const keepPageIndexes = [];

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
        const pageNumber = pageIndex + 1;
        if (!selectedPages.has(pageNumber)) keepPageIndexes.push(pageIndex);
      }

      const copiedPages = await newPdf.copyPages(sourcePdf, keepPageIndexes);
      copiedPages.forEach((page) => newPdf.addPage(page));

      newPdf.setProducer("NextOnlineTools PDF Page Remover");
      newPdf.setCreator("NextOnlineTools.com");

      const newBytes = await newPdf.save({ useObjectStreams: true });
      const blob = new Blob([newBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setProcessedUrl(url);
      setResultSize(blob.size);
      setSuccess("Pages removed successfully. Your clean PDF is ready to download.");
    } catch (err) {
      console.error(err);
      setError("Could not create the new PDF. Please try a different file or fewer pages.");
    } finally {
      setIsProcessing(false);
    }
  }

  function resetTool(showMessage = true) {
    resetResult();
    setFileName("");
    setFileSize(0);
    setPdfBytes(null);
    setTotalPages(0);
    setThumbnails([]);
    setSelectedPages(new Set());
    setPageRange("");
    setOutputName("cleaned-pdf.pdf");
    setPreviewPage(null);
    setIsDragging(false);
    setIsLoading(false);
    setIsProcessing(false);

    if (showMessage) {
      setError("");
      setSuccess("Tool reset successfully.");
    }
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

      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Scissors size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">PDF Page Remover</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Remove unwanted pages from your PDF in seconds. Upload a PDF, select
          the pages you want to delete, and download a clean PDF file directly
          from your browser.
        </p>
      </section>

      {/* TOOL */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-[390px_1fr] gap-6">
          {/* LEFT PANEL */}
          <div className="flex flex-col gap-5">
            <div
              role="button"
              tabIndex="0"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                isDragging
                  ? "border-[var(--primary)] bg-[#f8f4ff]"
                  : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleInputChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mx-auto mb-4">
                <Upload size={26} className="text-[var(--primary)]" />
              </div>

              <h2 className="text-xl font-semibold mb-2">
                {hasPdf ? "Change PDF" : "Upload PDF"}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Drag and drop a PDF here, or click to choose a file.
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-3">
                Max file size: {MAX_FILE_SIZE_MB} MB
              </p>
            </div>

            {hasPdf && (
              <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
                <div className="flex items-start gap-3">
                  <FileText size={22} className="text-[var(--primary)] shrink-0 mt-1" />
                  <div className="min-w-0">
                    <h3 className="font-semibold break-words">{fileName}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {fileSizeText} • {totalPages} page{totalPages === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border border-[var(--border)] rounded-2xl p-5 bg-[#f8f4ff]">
              <div className="flex items-center gap-2 mb-4">
                <Layers size={20} className="text-[var(--primary)]" />
                <h2 className="font-semibold">Pages to Remove</h2>
              </div>

              <label className="block text-sm font-medium mb-2">
                Enter page numbers or ranges
              </label>
              <input
                type="text"
                value={pageRange}
                onChange={(event) => {
                  setPageRange(event.target.value);
                  clearFeedback();
                }}
                placeholder="Example: 1, 3, 5-8"
                disabled={!hasPdf}
                className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)] disabled:opacity-60"
              />

              <button
                type="button"
                onClick={applyRangeSelection}
                disabled={!hasPdf}
                className={`btn-primary w-full mt-3 inline-flex items-center justify-center gap-2 ${
                  !hasPdf ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <MousePointerClick size={18} />
                Apply Page Range
              </button>

              <p className="text-xs text-[var(--text-secondary)] mt-3">
                Use formats like 2, 4, 7-10. The selected pages will be deleted
                from the final PDF.
              </p>
            </div>

            <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-[var(--primary)]" />
                <h2 className="font-semibold">Quick Select</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ActionButton label="Odd Pages" disabled={!hasPdf} onClick={() => selectPages("odd")} />
                <ActionButton label="Even Pages" disabled={!hasPdf} onClick={() => selectPages("even")} />
                <ActionButton label="First Page" disabled={!hasPdf} onClick={() => selectPages("first")} />
                <ActionButton label="Last Page" disabled={!hasPdf} onClick={() => selectPages("last")} />
              </div>

              <button
                type="button"
                onClick={() => selectPages("clear")}
                disabled={!hasPdf || !selectedCount}
                className={`btn-secondary w-full mt-3 inline-flex items-center justify-center gap-2 ${
                  !hasPdf || !selectedCount ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <RotateCcw size={18} />
                Clear Selection
              </button>
            </div>

            <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <Download size={20} className="text-[var(--primary)]" />
                <h2 className="font-semibold">Output PDF</h2>
              </div>

              <label className="block text-sm font-medium mb-2">File name</label>
              <input
                type="text"
                value={outputName}
                onChange={(event) => setOutputName(event.target.value)}
                placeholder="cleaned-pdf.pdf"
                className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
              />

              <div className="grid grid-cols-2 gap-3 mt-4 text-center">
                <SummaryCard label="Remove" value={selectedCount} danger={selectedCount > 0} />
                <SummaryCard label="Final Pages" value={finalPageCount || 0} green={finalPageCount > 0} />
              </div>

              <button
                type="button"
                onClick={removeSelectedPages}
                disabled={!hasPdf || !selectedCount || isProcessing}
                className={`btn-primary w-full mt-4 inline-flex items-center justify-center gap-2 ${
                  !hasPdf || !selectedCount || isProcessing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Trash2 size={18} />
                {isProcessing ? "Removing Pages..." : "Remove Selected Pages"}
              </button>

              {processedUrl && (
                <a
                  href={processedUrl}
                  download={normalizePdfFileName(outputName)}
                  className="btn-secondary w-full mt-3 inline-flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download Clean PDF
                </a>
              )}

              <button
                type="button"
                onClick={() => resetTool()}
                className="w-full mt-3 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition"
              >
                Reset tool
              </button>
            </div>

            {processedUrl && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                <p className="text-sm text-green-800">
                  Clean PDF ready. New file size: <strong>{resultSizeText}</strong>
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="text-blue-700 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Privacy note: your PDF is processed in your browser. Only upload
                  files that you own or have permission to edit.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex flex-col gap-5">
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

            <div className="border border-[var(--border)] rounded-2xl p-5 bg-white min-h-[560px]">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Eye size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-semibold">PDF Page Preview</h2>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Click a page to select it for removal. Selected pages are highlighted.
                  </p>
                </div>

                {hasPdf && (
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-red-600">
                      Removing: {selectedPagesText}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Keep at least one page
                    </p>
                  </div>
                )}
              </div>

              {isLoading && (
                <div className="min-h-[420px] flex items-center justify-center text-center">
                  <div>
                    <div className="w-12 h-12 border-4 border-[#eadcff] border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-semibold">Loading PDF preview...</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Large files may take a few seconds.
                    </p>
                  </div>
                </div>
              )}

              {!isLoading && !hasPdf && (
                <div className="min-h-[420px] flex items-center justify-center text-center bg-gray-50 rounded-2xl border border-dashed border-[var(--border)]">
                  <div className="px-6">
                    <FileText size={58} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="font-semibold mb-2">No PDF selected</h3>
                    <p className="text-sm text-[var(--text-secondary)] max-w-md">
                      Upload a PDF to preview its pages and choose which pages to delete.
                    </p>
                  </div>
                </div>
              )}

              {!isLoading && hasPdf && (
                <>
                  {totalPages > MAX_THUMBNAIL_PAGES && (
                    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <p className="text-sm text-yellow-800">
                        This PDF has {totalPages} pages. For browser performance,
                        thumbnails are shown for the first {MAX_THUMBNAIL_PAGES} pages.
                        To remove later pages, use the page range box.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                    {thumbnails.map((page) => {
                      const isSelected = selectedPages.has(page.pageNumber);

                      return (
                        <div
                          key={page.pageNumber}
                          className={`rounded-2xl border p-3 transition ${
                            isSelected
                              ? "border-red-400 bg-red-50"
                              : "border-[var(--border)] bg-gray-50 hover:bg-[#f8f4ff]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => togglePage(page.pageNumber)}
                            className="w-full text-left"
                            aria-label={`Select page ${page.pageNumber} for removal`}
                          >
                            <div className="relative bg-white rounded-xl overflow-hidden border border-[var(--border)] min-h-[170px] flex items-center justify-center">
                              <img
                                src={page.image}
                                alt={`PDF page ${page.pageNumber}`}
                                className="w-full h-full object-contain"
                                loading="lazy"
                              />

                              {isSelected && (
                                <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                                  <span className="rounded-full bg-red-600 text-white px-3 py-1 text-xs font-semibold">
                                    Remove
                                  </span>
                                </div>
                              )}
                            </div>
                          </button>

                          <div className="flex items-center justify-between gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => togglePage(page.pageNumber)}
                              className={`text-sm font-semibold ${
                                isSelected ? "text-red-700" : "text-[var(--text-primary)]"
                              }`}
                            >
                              Page {page.pageNumber}
                            </button>

                            <button
                              type="button"
                              onClick={() => setPreviewPage(page)}
                              className="text-xs text-[var(--primary)] font-semibold hover:underline"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <ListChecks size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">How to Remove Pages from a PDF</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <InfoCard
            title="1. Upload PDF"
            text="Choose the PDF file from your device. The file is prepared for browser preview."
          />
          <InfoCard
            title="2. Select Pages"
            text="Click page thumbnails or enter page numbers such as 1,3,5-8."
          />
          <InfoCard
            title="3. Remove Pages"
            text="The tool creates a new PDF without the selected pages."
          />
          <InfoCard
            title="4. Download"
            text="Download the clean PDF and review the final file before sharing."
          />
        </div>
      </section>

      {/* SEO CONTENT */}
      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">Delete PDF Pages Online</h2>
        </div>

        <div className="text-[var(--text-secondary)] leading-7 space-y-4">
          <p>
            This PDF Page Remover helps you delete unwanted pages from a PDF file
            online. It is useful for removing blank pages, duplicate pages,
            wrong scanned pages, old cover pages, or extra document sections.
          </p>

          <p>
            You can select pages visually from the preview grid or type a page
            range manually. After removing the selected pages, the tool creates a
            clean new PDF that you can download instantly.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <InfoCard
            title="Remove PDF Pages"
            text="Delete one page, multiple pages, or page ranges from a PDF file."
          />
          <InfoCard
            title="Preview Before Removing"
            text="View PDF page thumbnails before choosing which pages to delete."
          />
          <InfoCard
            title="Private Browser Tool"
            text="Your file is processed on your device, with no paid API required."
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <Info size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">PDF Page Remover FAQ</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FaqItem
            question="Can I remove multiple pages from a PDF?"
            answer="Yes. Select multiple page thumbnails or enter a range like 2,4,7-10."
          />
          <FaqItem
            question="Can I delete all pages from a PDF?"
            answer="No. A PDF must keep at least one page, so the tool prevents deleting every page."
          />
          <FaqItem
            question="Does this tool upload my PDF?"
            answer="No. It is designed to process the PDF directly in your browser."
          />
          <FaqItem
            question="Can I remove pages from password-protected PDFs?"
            answer="No. This tool does not unlock or bypass protected PDF files."
          />
          <FaqItem
            question="Will the PDF file size become smaller?"
            answer="Often yes, because removed pages are no longer included. The final size depends on the PDF content."
          />
          <FaqItem
            question="Is this a secure redaction tool?"
            answer="No. It removes full pages only. For sensitive legal redaction, use a dedicated redaction workflow and review the final file carefully."
          />
        </div>
      </section>

      {previewPage && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold">Page {previewPage.pageNumber} Preview</h3>
              <button
                type="button"
                onClick={() => setPreviewPage(null)}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
                aria-label="Close preview"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 bg-gray-50 max-h-[78vh] overflow-auto flex items-center justify-center">
              <img
                src={previewPage.image}
                alt={`PDF page ${previewPage.pageNumber} large preview`}
                className="max-w-full rounded-xl border border-[var(--border)] bg-white"
              />
            </div>
          </div>
        </div>
      )}

      <SuggestedTools currentToolId="pdf-page-remover" />
    </div>
  );
}

function ActionButton({ label, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border border-[var(--border)] bg-white p-3 text-sm font-semibold hover:bg-[#f8f4ff] transition ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {label}
    </button>
  );
}

function SummaryCard({ label, value, green = false, danger = false }) {
  return (
    <div className="border border-[var(--border)] rounded-xl p-3 bg-white">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p
        className={`text-xl font-bold ${
          danger ? "text-red-600" : green ? "text-green-600" : "text-[var(--primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-6">{text}</p>
    </div>
  );
}

function FaqItem({ question, answer }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-6">{answer}</p>
    </div>
  );
}

function parsePageRange(input, totalPages) {
  const pages = new Set();
  const cleanInput = String(input || "").trim();

  if (!cleanInput) {
    return { ok: true, pages };
  }

  const parts = cleanInput.split(",").map((part) => part.trim()).filter(Boolean);

  if (!parts.length) {
    return { ok: false, message: "Please enter a valid page range." };
  }

  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      const page = Number(part);

      if (page < 1 || page > totalPages) {
        return {
          ok: false,
          message: `Page ${page} is outside this PDF. Use pages between 1 and ${totalPages}.`,
        };
      }

      pages.add(page);
      continue;
    }

    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);

    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);

      if (start > end) {
        return { ok: false, message: `Invalid range ${part}. Start page must be smaller than end page.` };
      }

      if (start < 1 || end > totalPages) {
        return {
          ok: false,
          message: `Range ${part} is outside this PDF. Use pages between 1 and ${totalPages}.`,
        };
      }

      for (let page = start; page <= end; page += 1) pages.add(page);
      continue;
    }

    return {
      ok: false,
      message: "Invalid page range. Use a format like 1,3,5-8.",
    };
  }

  return { ok: true, pages };
}

function formatPagesAsRange(pagesSet) {
  const pages = Array.from(pagesSet || []).sort((a, b) => a - b);

  if (!pages.length) return "";

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

function createDefaultOutputName(name) {
  const base = String(name || "document.pdf").replace(/\.pdf$/i, "");
  return normalizePdfFileName(`${base}-cleaned.pdf`);
}

function normalizePdfFileName(name) {
  const cleanName = String(name || "cleaned-pdf.pdf")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanName) return "cleaned-pdf.pdf";
  return cleanName.toLowerCase().endsWith(".pdf") ? cleanName : `${cleanName}.pdf`;
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);

  if (!value) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** index;

  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
