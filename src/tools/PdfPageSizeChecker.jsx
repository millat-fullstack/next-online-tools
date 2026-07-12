// src/tools/PdfPageSizeChecker.jsx

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Helmet } from "react-helmet-async";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Copy,
  Download,
  Eye,
  FileText,
  Grid3X3,
  Info,
  KeyRound,
  Layers3,
  Loader2,
  Maximize2,
  Ruler,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const toolData = {
  title: "PDF Page Size Checker",
  path: "/tool/pdf-page-size-checker",
  category: "PDF Tools",
  description:
    "Check every PDF page size in pixels, inches, centimetres, millimetres, and points. Detect A4, Letter, mixed page sizes, and orientation privately in your browser.",
  metaTitle:
    "PDF Page Size Checker – Pixels, Inches, CM, MM & Points",
  metaDescription:
    "Upload a PDF and check every page size in pixels, inches, centimetres, millimetres, or PDF points. Detect A4, Letter, orientation, and mixed page sizes.",
};

const SITE_URL = "https://nextonlinetools.com";
const canonicalUrl = `${SITE_URL}${toolData.path}`;

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const THUMBNAIL_TARGET_WIDTH = 220;
const STANDARD_SIZE_TOLERANCE_MM = 2.2;

const UNIT_OPTIONS = [
  { value: "px", label: "Pixels" },
  { value: "in", label: "Inches" },
  { value: "cm", label: "Centimetres" },
  { value: "mm", label: "Millimetres" },
  { value: "pt", label: "PDF Points" },
];

const DPI_OPTIONS = [72, 96, 150, 300];

const STANDARD_PAGE_SIZES = [
  { name: "A0", widthMm: 841, heightMm: 1189 },
  { name: "A1", widthMm: 594, heightMm: 841 },
  { name: "A2", widthMm: 420, heightMm: 594 },
  { name: "A3", widthMm: 297, heightMm: 420 },
  { name: "A4", widthMm: 210, heightMm: 297 },
  { name: "A5", widthMm: 148, heightMm: 210 },
  { name: "A6", widthMm: 105, heightMm: 148 },
  { name: "B4", widthMm: 250, heightMm: 353 },
  { name: "B5", widthMm: 176, heightMm: 250 },
  { name: "US Letter", widthMm: 215.9, heightMm: 279.4 },
  { name: "US Legal", widthMm: 215.9, heightMm: 355.6 },
  { name: "Tabloid", widthMm: 279.4, heightMm: 431.8 },
  { name: "Ledger", widthMm: 431.8, heightMm: 279.4 },
  { name: "Executive", widthMm: 184.15, heightMm: 266.7 },
  { name: "Business Card", widthMm: 88.9, heightMm: 50.8 },
];

export default function PdfPageSizeChecker() {
  const fileInputRef = useRef(null);
  const loadingTaskRef = useRef(null);
  const pdfDocumentRef = useRef(null);
  const fileBytesRef = useRef(null);
  const loadRequestRef = useRef(0);

  const [fileInfo, setFileInfo] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPageNumber, setSelectedPageNumber] = useState(null);
  const [hoveredPageNumber, setHoveredPageNumber] = useState(null);
  const [hoverPopup, setHoverPopup] = useState({
    visible: false,
    left: 0,
    top: 0,
  });

  const [unit, setUnit] = useState("px");
  const [dpi, setDpi] = useState(96);
  const [customDpi, setCustomDpi] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchPage, setSearchPage] = useState("");
  const [showDifferentOnly, setShowDifferentOnly] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [metadataProgress, setMetadataProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedType, setCopiedType] = useState("");

  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const activeDpi = useMemo(() => {
    if (dpi !== "custom") return Number(dpi);
    return clampNumber(Number(customDpi) || 96, 10, 2400);
  }, [dpi, customDpi]);

  const selectedPage = useMemo(() => {
    return (
      pages.find((page) => page.pageNumber === selectedPageNumber) || null
    );
  }, [pages, selectedPageNumber]);

  const pageGroups = useMemo(() => {
    const groups = new Map();

    pages.forEach((page) => {
      const key = getPageGroupKey(page);
      const current = groups.get(key) || {
        key,
        standardName: page.standardName,
        orientation: page.orientation,
        widthPt: page.widthPt,
        heightPt: page.heightPt,
        pages: [],
      };

      current.pages.push(page.pageNumber);
      groups.set(key, current);
    });

    return Array.from(groups.values()).sort(
      (groupA, groupB) => groupB.pages.length - groupA.pages.length
    );
  }, [pages]);

  const mostCommonGroup = pageGroups[0] || null;

  const orientationCounts = useMemo(() => {
    return pages.reduce(
      (counts, page) => {
        counts[page.orientation] =
          (counts[page.orientation] || 0) + 1;
        return counts;
      },
      { Portrait: 0, Landscape: 0, Square: 0 }
    );
  }, [pages]);

  const differentPageNumbers = useMemo(() => {
    if (!mostCommonGroup) return new Set();

    const commonKey = mostCommonGroup.key;

    return new Set(
      pages
        .filter((page) => getPageGroupKey(page) !== commonKey)
        .map((page) => page.pageNumber)
    );
  }, [pages, mostCommonGroup]);

  const filterOptions = useMemo(() => {
    const standardNames = Array.from(
      new Set(pages.map((page) => page.standardName))
    );

    return [
      { value: "all", label: "All Pages" },
      { value: "portrait", label: "Portrait" },
      { value: "landscape", label: "Landscape" },
      { value: "square", label: "Square" },
      ...standardNames.map((name) => ({
        value: `size:${name}`,
        label: name,
      })),
    ];
  }, [pages]);

  const filteredPages = useMemo(() => {
    const pageQuery = Number(searchPage);

    return pages.filter((page) => {
      if (
        Number.isFinite(pageQuery) &&
        pageQuery > 0 &&
        page.pageNumber !== pageQuery
      ) {
        return false;
      }

      if (
        showDifferentOnly &&
        !differentPageNumbers.has(page.pageNumber)
      ) {
        return false;
      }

      if (filter === "portrait" && page.orientation !== "Portrait") {
        return false;
      }

      if (
        filter === "landscape" &&
        page.orientation !== "Landscape"
      ) {
        return false;
      }

      if (filter === "square" && page.orientation !== "Square") {
        return false;
      }

      if (
        filter.startsWith("size:") &&
        page.standardName !== filter.slice(5)
      ) {
        return false;
      }

      return true;
    });
  }, [
    pages,
    filter,
    searchPage,
    showDifferentOnly,
    differentPageNumbers,
  ]);

  const seoJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: toolData.title,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    url: canonicalUrl,
    description: toolData.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Check every PDF page size",
      "Pixels at selectable DPI",
      "Inches, centimetres, millimetres, and points",
      "A4 and standard paper-size detection",
      "Mixed page-size detection",
      "Browser-only PDF processing",
    ],
  };

  useEffect(() => {
    return () => {
      destroyCurrentPdf();
    };
  }, []);

  useEffect(() => {
    if (
      selectedPageNumber &&
      !filteredPages.some(
        (page) => page.pageNumber === selectedPageNumber
      )
    ) {
      setSelectedPageNumber(filteredPages[0]?.pageNumber || null);
    }
  }, [filteredPages, selectedPageNumber]);

  function clearFeedback() {
    setError("");
    setSuccess("");
    setCopiedType("");
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
    setPasswordRequired(false);
    setPassword("");
    setPasswordError("");

    const validationError = validatePdfFile(file);

    if (validationError) {
      setError(validationError);
      resetFileInput();
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      fileBytesRef.current = new Uint8Array(arrayBuffer);

      setFileInfo({
        name: file.name || "document.pdf",
        size: file.size,
        type: file.type || "application/pdf",
      });

      await loadPdfFromStoredBytes("");
    } catch {
      setError("Could not read this PDF. Please try another file.");
      setFileInfo(null);
      fileBytesRef.current = null;
    } finally {
      resetFileInput();
    }
  }

  async function loadPdfFromStoredBytes(nextPassword = "") {
    if (!fileBytesRef.current) return;

    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;

    setIsLoadingPdf(true);
    setMetadataProgress(0);
    setPages([]);
    setSelectedPageNumber(null);
    setHoveredPageNumber(null);
    setHoverPopup((current) => ({ ...current, visible: false }));
    setError("");
    setSuccess("");
    setPasswordError("");

    await destroyCurrentPdf();

    try {
      const bytes = new Uint8Array(fileBytesRef.current);
      const loadingTask = pdfjsLib.getDocument({
        data: bytes,
        password: nextPassword || undefined,
        isEvalSupported: false,
        useWorkerFetch: false,
      });

      loadingTaskRef.current = loadingTask;

      const pdfDocument = await loadingTask.promise;

      if (requestId !== loadRequestRef.current) {
        await pdfDocument.destroy();
        return;
      }

      pdfDocumentRef.current = pdfDocument;

      const pageMetadata = [];

      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
        if (requestId !== loadRequestRef.current) return;

        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({
          scale: 1,
          rotation: page.rotate,
        });

        const widthPt = Math.abs(viewport.width);
        const heightPt = Math.abs(viewport.height);
        const widthIn = widthPt / 72;
        const heightIn = heightPt / 72;
        const widthMm = widthIn * 25.4;
        const heightMm = heightIn * 25.4;
        const standardName = detectStandardPageSize(
          widthMm,
          heightMm
        );
        const orientation = getOrientation(widthPt, heightPt);

        pageMetadata.push({
          pageNumber,
          widthPt,
          heightPt,
          widthIn,
          heightIn,
          widthCm: widthIn * 2.54,
          heightCm: heightIn * 2.54,
          widthMm,
          heightMm,
          standardName,
          orientation,
          rotation: normalizeRotation(page.rotate),
          aspectRatio:
            heightPt > 0 ? widthPt / heightPt : 0,
          userUnit: Number(page.userUnit || 1),
          view: Array.isArray(page.view) ? [...page.view] : null,
        });

        setMetadataProgress(
          Math.round((pageNumber / pdfDocument.numPages) * 100)
        );

        if (pageNumber % 12 === 0) {
          await waitForFrame();
        }
      }

      if (requestId !== loadRequestRef.current) return;

      setPages(pageMetadata);
      setSelectedPageNumber(pageMetadata[0]?.pageNumber || null);
      setPasswordRequired(false);
      setPassword("");
      setPasswordError("");
      setSuccess(
        `${pdfDocument.numPages} page${
          pdfDocument.numPages === 1 ? "" : "s"
        } analysed locally in your browser.`
      );
    } catch (loadError) {
      const exceptionName = String(loadError?.name || "");
      const exceptionMessage = String(loadError?.message || "");

      if (
        exceptionName === "PasswordException" ||
        /password/i.test(exceptionMessage)
      ) {
        setPasswordRequired(true);
        setPasswordError(
          nextPassword
            ? "That password did not open the PDF. Please try again."
            : "This PDF is password protected. Enter its password to continue."
        );
      } else {
        setError(
          "This PDF could not be opened. It may be corrupted, unsupported, or incomplete."
        );
        setPages([]);
      }
    } finally {
      if (requestId === loadRequestRef.current) {
        setIsLoadingPdf(false);
      }
    }
  }

  async function destroyCurrentPdf() {
    const loadingTask = loadingTaskRef.current;
    const pdfDocument = pdfDocumentRef.current;

    loadingTaskRef.current = null;
    pdfDocumentRef.current = null;

    try {
      await loadingTask?.destroy?.();
    } catch {
      // Ignore cleanup errors.
    }

    try {
      await pdfDocument?.destroy?.();
    } catch {
      // Ignore cleanup errors.
    }
  }

  function handleInputChange(event) {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsDragging(false);
  }

  function handlePageHover(event, pageNumber) {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(hover: none)").matches
    ) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const popupWidth = 300;
    const popupHeight = 250;
    const gap = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = rect.right + gap;
    let top = rect.top;

    if (left + popupWidth > viewportWidth - 12) {
      left = rect.left - popupWidth - gap;
    }

    if (left < 12) {
      left = clampNumber(
        rect.left + rect.width / 2 - popupWidth / 2,
        12,
        viewportWidth - popupWidth - 12
      );
      top = rect.bottom + gap;
    }

    if (top + popupHeight > viewportHeight - 12) {
      top = viewportHeight - popupHeight - 12;
    }

    top = Math.max(12, top);

    setHoveredPageNumber(pageNumber);
    setHoverPopup({
      visible: true,
      left,
      top,
    });
  }

  function hidePageHover() {
    setHoveredPageNumber(null);
    setHoverPopup((current) => ({
      ...current,
      visible: false,
    }));
  }

  function selectPage(pageNumber) {
    setSelectedPageNumber(pageNumber);
  }

  function selectPreviousPage() {
    if (!selectedPage) return;

    const currentIndex = filteredPages.findIndex(
      (page) => page.pageNumber === selectedPage.pageNumber
    );
    const previousPage = filteredPages[currentIndex - 1];

    if (previousPage) {
      setSelectedPageNumber(previousPage.pageNumber);
    }
  }

  function selectNextPage() {
    if (!selectedPage) return;

    const currentIndex = filteredPages.findIndex(
      (page) => page.pageNumber === selectedPage.pageNumber
    );
    const nextPage = filteredPages[currentIndex + 1];

    if (nextPage) {
      setSelectedPageNumber(nextPage.pageNumber);
    }
  }

  async function copySelectedSize() {
    if (!selectedPage) return;

    const displaySize = formatPageDimensions(
      selectedPage,
      unit,
      activeDpi
    );
    const text = `Page ${selectedPage.pageNumber}: ${displaySize} · ${selectedPage.standardName} · ${selectedPage.orientation}`;

    await copyValue(text, "size", "Selected page size copied.");
  }

  async function copySelectedDetails() {
    if (!selectedPage) return;

    const text = createPageDetailsText(selectedPage, activeDpi);
    await copyValue(
      text,
      "details",
      "Selected page details copied."
    );
  }

  async function copyFullReport() {
    if (!pages.length) return;

    const text = pages
      .map((page) => createPageDetailsText(page, activeDpi))
      .join("\n\n");

    await copyValue(text, "report", "Full page-size report copied.");
  }

  function downloadCsvReport() {
    if (!pages.length) return;

    const rows = [
      [
        "Page",
        "Standard Size",
        "Orientation",
        "Width (pt)",
        "Height (pt)",
        "Width (in)",
        "Height (in)",
        "Width (cm)",
        "Height (cm)",
        "Width (mm)",
        "Height (mm)",
        `Width (px at ${activeDpi} DPI)`,
        `Height (px at ${activeDpi} DPI)`,
        "Rotation",
      ],
      ...pages.map((page) => [
        page.pageNumber,
        page.standardName,
        page.orientation,
        page.widthPt.toFixed(2),
        page.heightPt.toFixed(2),
        page.widthIn.toFixed(3),
        page.heightIn.toFixed(3),
        page.widthCm.toFixed(2),
        page.heightCm.toFixed(2),
        page.widthMm.toFixed(2),
        page.heightMm.toFixed(2),
        Math.round(page.widthIn * activeDpi),
        Math.round(page.heightIn * activeDpi),
        page.rotation,
      ]),
    ];

    const csv = rows
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${getFileBaseName(
      fileInfo?.name || "pdf"
    )}-page-sizes.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccess("CSV page-size report downloaded.");
    setError("");
  }

  async function copyValue(value, type, message) {
    try {
      await copyToClipboard(value);
      setCopiedType(type);
      setSuccess(message);
      setError("");

      window.setTimeout(() => setCopiedType(""), 1600);
    } catch {
      setError("Copy failed. Please copy the information manually.");
      setSuccess("");
    }
  }

  async function resetTool() {
    loadRequestRef.current += 1;
    await destroyCurrentPdf();

    fileBytesRef.current = null;

    setFileInfo(null);
    setPages([]);
    setSelectedPageNumber(null);
    setHoveredPageNumber(null);
    setHoverPopup({
      visible: false,
      left: 0,
      top: 0,
    });

    setUnit("px");
    setDpi(96);
    setCustomDpi("");
    setFilter("all");
    setSearchPage("");
    setShowDifferentOnly(false);

    setIsDragging(false);
    setIsLoadingPdf(false);
    setMetadataProgress(0);
    setError("");
    setSuccess("");
    setCopiedType("");

    setPasswordRequired(false);
    setPassword("");
    setPasswordError("");

    resetFileInput();
  }

  const hoveredPage =
    pages.find((page) => page.pageNumber === hoveredPageNumber) ||
    null;

  return (
    <div className="flex flex-col gap-8">
      <Helmet>
        <title>{toolData.metaTitle}</title>
        <meta name="description" content={toolData.metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={toolData.metaTitle} />
        <meta
          property="og:description"
          content={toolData.metaDescription}
        />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={toolData.metaTitle} />
        <meta
          name="twitter:description"
          content={toolData.metaDescription}
        />

        <script type="application/ld+json">
          {JSON.stringify(seoJsonLd)}
        </script>
      </Helmet>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleInputChange}
        className="hidden"
      />

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Ruler size={28} className="text-[var(--primary)]" />
        </div>

        <p className="text-xs uppercase tracking-[0.22em] text-[var(--primary)] font-bold mb-2">
          Page Dimensions & Paper Sizes
        </p>

        <h1 className="text-3xl font-bold mb-3">
          PDF Page Size Checker
        </h1>

        <p className="text-[var(--text-secondary)] max-w-3xl">
          Upload a PDF to view every page, detect standard paper sizes,
          find mixed dimensions, and check sizes in pixels, inches,
          centimetres, millimetres, or PDF points.
        </p>
      </section>

      {!fileInfo ? (
        <section className="card p-5 sm:p-8">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFilePicker}
            className={`min-h-[390px] rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition flex items-center justify-center ${
              isDragging
                ? "border-[var(--primary)] bg-[#f4edff]"
                : "border-[var(--border)] bg-white hover:border-[var(--primary)] hover:bg-[#faf8ff]"
            }`}
          >
            <div>
              <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-[#f4edff] flex items-center justify-center">
                <Upload
                  size={30}
                  className="text-[var(--primary)]"
                />
              </div>

              <h2 className="text-2xl font-bold">
                Upload or drop a PDF
              </h2>

              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)] max-w-lg">
                The PDF is analysed locally in your browser. Maximum file
                size: <strong>{MAX_FILE_SIZE_MB} MB</strong>.
              </p>

              <button
                type="button"
                className="btn-primary mt-6 inline-flex items-center justify-center gap-2"
              >
                <FileText size={18} />
                Choose PDF
              </button>
            </div>
          </div>

          {error && (
            <FeedbackMessage type="error" message={error} />
          )}
        </section>
      ) : (
        <section className="card overflow-hidden">
          <div className="border-b border-[var(--border)] bg-white p-4 sm:p-5">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="min-w-0 flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <FileText size={23} />
                </div>

                <div className="min-w-0">
                  <p
                    className="font-bold truncate"
                    title={fileInfo.name}
                  >
                    {fileInfo.name}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {formatBytes(fileInfo.size)}
                    {pages.length
                      ? ` · ${pages.length} page${
                          pages.length === 1 ? "" : "s"
                        }`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                  <Upload size={17} />
                  Replace PDF
                </button>

                <button
                  type="button"
                  onClick={resetTool}
                  className="h-11 w-11 rounded-xl border border-[var(--border)] bg-white text-red-600 hover:bg-red-50 inline-flex items-center justify-center"
                  title="Remove PDF"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {isLoadingPdf ? (
            <div className="min-h-[520px] p-8 flex items-center justify-center">
              <div className="w-full max-w-md text-center">
                <Loader2
                  size={48}
                  className="mx-auto animate-spin text-[var(--primary)]"
                />
                <h2 className="mt-5 text-xl font-bold">
                  Analysing PDF pages
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Reading page sizes and orientation locally…
                </p>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all"
                    style={{ width: `${metadataProgress}%` }}
                  />
                </div>

                <p className="mt-2 text-xs font-bold text-[var(--primary)]">
                  {metadataProgress}%
                </p>
              </div>
            </div>
          ) : passwordRequired ? (
            <div className="min-h-[480px] p-6 flex items-center justify-center">
              <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <KeyRound size={22} />
                </div>

                <h2 className="mt-4 text-xl font-bold">
                  Password-protected PDF
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  Enter the document password. It is used only inside your
                  browser and is not stored.
                </p>

                <form
                  className="mt-5 space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();

                    if (!password) {
                      setPasswordError("Enter the PDF password.");
                      return;
                    }

                    loadPdfFromStoredBytes(password);
                  }}
                >
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordError("");
                    }}
                    placeholder="PDF password"
                    autoComplete="off"
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[#f4edff]"
                  />

                  {passwordError && (
                    <p className="text-xs text-red-600">
                      {passwordError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="btn-primary w-full inline-flex items-center justify-center gap-2"
                  >
                    <KeyRound size={17} />
                    Open PDF
                  </button>
                </form>
              </div>
            </div>
          ) : pages.length ? (
            <>
              <div className="border-b border-[var(--border)] bg-[#fafafa] p-4 sm:p-5">
                <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
                  <SummaryCard
                    label="Pages"
                    value={pages.length}
                    icon={FileText}
                  />
                  <SummaryCard
                    label="Different Sizes"
                    value={pageGroups.length}
                    icon={Layers3}
                    warning={pageGroups.length > 1}
                  />
                  <SummaryCard
                    label="Portrait"
                    value={orientationCounts.Portrait}
                    icon={Grid3X3}
                  />
                  <SummaryCard
                    label="Landscape"
                    value={orientationCounts.Landscape}
                    icon={Maximize2}
                  />
                  <SummaryCard
                    label="Most Common"
                    value={mostCommonGroup?.standardName || "—"}
                    icon={Ruler}
                  />
                </div>

                <div
                  className={`mt-4 rounded-xl border p-3 text-sm flex items-start gap-2 ${
                    pageGroups.length > 1
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : "border-green-200 bg-green-50 text-green-800"
                  }`}
                >
                  {pageGroups.length > 1 ? (
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle size={18} className="mt-0.5 shrink-0" />
                  )}

                  <p>
                    {pageGroups.length > 1
                      ? `This PDF contains ${pageGroups.length} different page sizes.`
                      : "All pages use the same displayed page size."}
                  </p>
                </div>
              </div>

              <div className="border-b border-[var(--border)] bg-white p-4 sm:p-5">
                <div className="grid md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.2fr] gap-3">
                  <div>
                    <label className="text-xs font-bold block mb-2">
                      Display unit
                    </label>
                    <select
                      value={unit}
                      onChange={(event) => setUnit(event.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-3 outline-none focus:border-[var(--primary)]"
                    >
                      {UNIT_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-2">
                      Pixel DPI
                    </label>
                    <select
                      value={dpi}
                      disabled={unit !== "px"}
                      onChange={(event) =>
                        setDpi(
                          event.target.value === "custom"
                            ? "custom"
                            : Number(event.target.value)
                        )
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-3 outline-none focus:border-[var(--primary)] disabled:opacity-50"
                    >
                      {DPI_OPTIONS.map((dpiValue) => (
                        <option key={dpiValue} value={dpiValue}>
                          {dpiValue} DPI
                        </option>
                      ))}
                      <option value="custom">Custom DPI</option>
                    </select>
                  </div>

                  {dpi === "custom" && unit === "px" ? (
                    <div>
                      <label className="text-xs font-bold block mb-2">
                        Custom DPI
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="2400"
                        value={customDpi}
                        onChange={(event) =>
                          setCustomDpi(event.target.value)
                        }
                        placeholder="96"
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-3 outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold block mb-2">
                        Page filter
                      </label>
                      <select
                        value={filter}
                        onChange={(event) =>
                          setFilter(event.target.value)
                        }
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-3 outline-none focus:border-[var(--primary)]"
                      >
                        {filterOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold block mb-2">
                      Find page
                    </label>
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                      />
                      <input
                        type="number"
                        min="1"
                        max={pages.length}
                        value={searchPage}
                        onChange={(event) =>
                          setSearchPage(event.target.value)
                        }
                        placeholder="Page number"
                        className="w-full rounded-xl border border-[var(--border)] bg-white py-3 pl-9 pr-10 outline-none focus:border-[var(--primary)]"
                      />
                      {searchPage && (
                        <button
                          type="button"
                          onClick={() => setSearchPage("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-gray-100 inline-flex items-center justify-center"
                          title="Clear page search"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDifferentOnly}
                      disabled={pageGroups.length <= 1}
                      onChange={(event) =>
                        setShowDifferentOnly(event.target.checked)
                      }
                      className="h-4 w-4 accent-[var(--primary)] disabled:opacity-50"
                    />
                    Show pages different from the most common size
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyFullReport}
                      className="btn-secondary inline-flex items-center justify-center gap-2"
                    >
                      {copiedType === "report" ? (
                        <Check size={17} />
                      ) : (
                        <Clipboard size={17} />
                      )}
                      Copy Report
                    </button>

                    <button
                      type="button"
                      onClick={downloadCsvReport}
                      className="btn-secondary inline-flex items-center justify-center gap-2"
                    >
                      <Download size={17} />
                      Download CSV
                    </button>
                  </div>
                </div>

                {unit === "px" && (
                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800 flex items-start gap-2">
                    <Info size={16} className="mt-0.5 shrink-0" />
                    <p>
                      PDF pages are stored in points and physical units.
                      Pixel dimensions are calculated at {activeDpi} DPI.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] min-h-[680px]">
                <div className="min-w-0 border-b xl:border-b-0 xl:border-r border-[var(--border)] bg-[#f3f4f6] p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-xl font-bold">
                        All PDF Pages
                      </h2>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Showing {filteredPages.length} of {pages.length} pages
                      </p>
                    </div>
                  </div>

                  {filteredPages.length ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4">
                      {filteredPages.map((page) => (
                        <PageThumbnail
                          key={page.pageNumber}
                          pdfDocument={pdfDocumentRef.current}
                          page={page}
                          selected={
                            selectedPageNumber === page.pageNumber
                          }
                          isDifferent={differentPageNumbers.has(
                            page.pageNumber
                          )}
                          unit={unit}
                          dpi={activeDpi}
                          onSelect={() =>
                            selectPage(page.pageNumber)
                          }
                          onHover={(event) =>
                            handlePageHover(event, page.pageNumber)
                          }
                          onLeave={hidePageHover}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="min-h-[360px] rounded-2xl border border-dashed border-[var(--border)] bg-white flex items-center justify-center p-8 text-center">
                      <div>
                        <Search
                          size={44}
                          className="mx-auto text-gray-300"
                        />
                        <p className="mt-3 font-bold">
                          No pages match this filter
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setFilter("all");
                            setSearchPage("");
                            setShowDifferentOnly(false);
                          }}
                          className="mt-4 text-sm font-bold text-[var(--primary)] hover:underline"
                        >
                          Clear filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <aside className="min-w-0 bg-white p-4 sm:p-5">
                  <div className="xl:sticky xl:top-5">
                    <SelectedPagePanel
                      page={selectedPage}
                      unit={unit}
                      dpi={activeDpi}
                      canGoPrevious={
                        selectedPage &&
                        filteredPages.findIndex(
                          (page) =>
                            page.pageNumber ===
                            selectedPage.pageNumber
                        ) > 0
                      }
                      canGoNext={
                        selectedPage &&
                        filteredPages.findIndex(
                          (page) =>
                            page.pageNumber ===
                            selectedPage.pageNumber
                        ) <
                          filteredPages.length - 1
                      }
                      copiedType={copiedType}
                      onPrevious={selectPreviousPage}
                      onNext={selectNextPage}
                      onCopySize={copySelectedSize}
                      onCopyDetails={copySelectedDetails}
                    />
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className="min-h-[420px] p-8 flex items-center justify-center text-center">
              <div>
                <AlertCircle
                  size={46}
                  className="mx-auto text-red-400"
                />
                <p className="mt-4 font-bold">
                  No pages could be analysed
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Try another PDF file.
                </p>
              </div>
            </div>
          )}

          {(error || success) && (
            <div className="border-t border-[var(--border)] p-4 sm:p-5">
              <FeedbackMessage
                type={error ? "error" : "success"}
                message={error || success}
              />
            </div>
          )}
        </section>
      )}

      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-4">
          How PDF Page Measurements Work
        </h2>

        <div className="grid md:grid-cols-2 gap-5">
          <InfoCard
            title="Native PDF measurements"
            text="A PDF page is normally measured in points. One inch equals 72 PDF points. The tool converts those dimensions into physical units."
          />
          <InfoCard
            title="Pixel measurements"
            text="A PDF does not have one permanent pixel size. Pixel dimensions depend on the DPI you select, such as 72, 96, 150, or 300 DPI."
          />
          <InfoCard
            title="Standard paper detection"
            text="The checker compares page dimensions with common sizes such as A4, Letter, Legal, A3, A5, Tabloid, and Ledger."
          />
          <InfoCard
            title="Displayed orientation"
            text="Page rotation is included so portrait and landscape results match how each page appears in the PDF."
          />
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={22}
            className="mt-0.5 shrink-0 text-green-700"
          />
          <div>
            <h2 className="text-xl font-bold">
              Private browser processing
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
              Your PDF, thumbnails, filename, password, and page
              measurements are processed inside your browser. This tool
              does not need to upload or store the document.
            </p>
          </div>
        </div>
      </section>

      {hoveredPage && hoverPopup.visible && (
        <div
          className="fixed z-[10000] w-[300px] pointer-events-none rounded-2xl border border-[var(--border)] bg-white p-4 shadow-2xl animate-[pdfSizePopupIn_140ms_ease-out]"
          style={{
            left: hoverPopup.left,
            top: hoverPopup.top,
          }}
        >
          <p className="font-bold">
            Page {hoveredPage.pageNumber}
          </p>

          <div className="mt-3 space-y-2 text-xs">
            <HoverRow
              label="Current size"
              value={formatPageDimensions(
                hoveredPage,
                unit,
                activeDpi
              )}
              strong
            />
            <HoverRow
              label="Pixels"
              value={`${Math.round(
                hoveredPage.widthIn * activeDpi
              )} × ${Math.round(
                hoveredPage.heightIn * activeDpi
              )} px`}
            />
            <HoverRow
              label="Inches"
              value={`${formatDecimal(
                hoveredPage.widthIn,
                2
              )} × ${formatDecimal(
                hoveredPage.heightIn,
                2
              )} in`}
            />
            <HoverRow
              label="Centimetres"
              value={`${formatDecimal(
                hoveredPage.widthCm,
                2
              )} × ${formatDecimal(
                hoveredPage.heightCm,
                2
              )} cm`}
            />
            <HoverRow
              label="PDF points"
              value={`${formatDecimal(
                hoveredPage.widthPt,
                2
              )} × ${formatDecimal(
                hoveredPage.heightPt,
                2
              )} pt`}
            />
            <HoverRow
              label="Standard"
              value={hoveredPage.standardName}
            />
            <HoverRow
              label="Orientation"
              value={hoveredPage.orientation}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes pdfSizePopupIn {
          from {
            opacity: 0;
            transform: translateY(4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .pdf-page-size-thumbnail canvas {
          display: block;
          max-width: 100%;
          height: auto;
        }
      `}</style>

      <SuggestedTools currentToolId="pdf-page-size-checker" />
    </div>
  );
}

function PageThumbnail({
  pdfDocument,
  page,
  selected,
  isDifferent,
  unit,
  dpi,
  onSelect,
  onHover,
  onLeave,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [renderState, setRenderState] = useState("idle");

  useEffect(() => {
    const element = containerRef.current;

    if (!element || shouldRender) return;

    if (!("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "500px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [shouldRender]);

  useEffect(() => {
    if (!shouldRender || !pdfDocument || !canvasRef.current) return;

    let cancelled = false;

    async function renderThumbnail() {
      setRenderState("loading");

      try {
        const pdfPage = await pdfDocument.getPage(page.pageNumber);
        if (cancelled) return;

        const baseViewport = pdfPage.getViewport({
          scale: 1,
          rotation: pdfPage.rotate,
        });
        const scale = Math.min(
          1.8,
          THUMBNAIL_TARGET_WIDTH / Math.max(1, baseViewport.width)
        );
        const viewport = pdfPage.getViewport({
          scale,
          rotation: pdfPage.rotate,
        });
        const outputScale = Math.min(
          window.devicePixelRatio || 1,
          2
        );
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", {
          alpha: false,
        });

        canvas.width = Math.max(
          1,
          Math.floor(viewport.width * outputScale)
        );
        canvas.height = Math.max(
          1,
          Math.floor(viewport.height * outputScale)
        );
        canvas.style.width = `${Math.round(viewport.width)}px`;
        canvas.style.height = `${Math.round(viewport.height)}px`;

        const transform =
          outputScale !== 1
            ? [outputScale, 0, 0, outputScale, 0, 0]
            : null;

        context.save();
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.restore();

        renderTaskRef.current = pdfPage.render({
          canvasContext: context,
          transform,
          viewport,
          background: "#ffffff",
        });

        await renderTaskRef.current.promise;

        if (!cancelled) {
          setRenderState("ready");
        }
      } catch (renderError) {
        if (
          String(renderError?.name || "") !== "RenderingCancelledException" &&
          !cancelled
        ) {
          setRenderState("error");
        }
      }
    }

    renderThumbnail();

    return () => {
      cancelled = true;

      try {
        renderTaskRef.current?.cancel?.();
      } catch {
        // Ignore render cancellation errors.
      }
    };
  }, [shouldRender, pdfDocument, page.pageNumber]);

  return (
    <button
      ref={containerRef}
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`pdf-page-size-thumbnail group min-w-0 rounded-2xl border bg-white p-2.5 text-left transition duration-200 ${
        selected
          ? "border-[var(--primary)] ring-4 ring-[#eee7ff] shadow-md -translate-y-0.5"
          : "border-[var(--border)] hover:border-[var(--primary)] hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <div className="relative min-h-[190px] rounded-xl border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center">
        {renderState !== "ready" && (
          <div className="absolute inset-0 flex items-center justify-center">
            {renderState === "error" ? (
              <AlertCircle size={26} className="text-red-400" />
            ) : (
              <Loader2
                size={25}
                className="animate-spin text-[var(--primary)]"
              />
            )}
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={`max-h-[260px] shadow-sm transition-opacity ${
            renderState === "ready" ? "opacity-100" : "opacity-0"
          }`}
        />

        <span className="absolute left-2 top-2 rounded-lg bg-gray-900/85 px-2 py-1 text-[10px] font-bold text-white">
          Page {page.pageNumber}
        </span>

        {isDifferent && (
          <span className="absolute right-2 top-2 rounded-lg bg-amber-500 px-2 py-1 text-[9px] font-bold text-white">
            DIFFERENT
          </span>
        )}

        {selected && (
          <span className="absolute right-2 bottom-2 h-7 w-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow">
            <Check size={15} />
          </span>
        )}

        <span className="absolute left-2 bottom-2 rounded-lg bg-white/95 border border-gray-200 px-2 py-1 text-[9px] font-bold text-gray-800 shadow-sm">
          {page.standardName}
        </span>
      </div>

      <div className="px-1 pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold truncate">
            {page.standardName}
          </p>
          <span className="text-[10px] rounded-full bg-gray-100 px-2 py-1 font-semibold text-[var(--text-secondary)]">
            {page.orientation}
          </span>
        </div>

        <p className="mt-2 font-mono text-xs break-all text-[var(--primary)] font-bold">
          {formatPageDimensions(page, unit, dpi)}
        </p>

        <p className="mt-2 text-[10px] text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity">
          Hover for details · Click to select
        </p>
      </div>
    </button>
  );
}

function SelectedPagePanel({
  page,
  unit,
  dpi,
  canGoPrevious,
  canGoNext,
  copiedType,
  onPrevious,
  onNext,
  onCopySize,
  onCopyDetails,
}) {
  if (!page) {
    return (
      <div className="min-h-[430px] rounded-2xl border border-dashed border-[var(--border)] bg-gray-50 p-6 flex items-center justify-center text-center">
        <div>
          <Eye size={46} className="mx-auto text-gray-300" />
          <p className="mt-3 font-bold">Select a page</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Click a thumbnail to keep its measurements visible here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)] font-bold">
            Selected Page
          </p>
          <h2 className="text-2xl font-bold mt-1">
            Page {page.pageNumber}
          </h2>
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="h-10 w-10 rounded-xl border border-[var(--border)] bg-white inline-flex items-center justify-center disabled:opacity-35"
            title="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className="h-10 w-10 rounded-xl border border-[var(--border)] bg-white inline-flex items-center justify-center disabled:opacity-35"
            title="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-[#f4edff] border border-[#e6d9ff] p-5">
        <p className="text-xs font-bold text-[var(--primary)]">
          Current unit
        </p>
        <p className="mt-2 text-2xl font-bold font-mono break-all">
          {formatPageDimensions(page, unit, dpi)}
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {page.standardName} · {page.orientation}
        </p>
      </div>

      <div className="mt-5 space-y-2">
        <DetailRow
          label={`Pixels at ${dpi} DPI`}
          value={`${Math.round(page.widthIn * dpi)} × ${Math.round(
            page.heightIn * dpi
          )} px`}
        />
        <DetailRow
          label="Inches"
          value={`${formatDecimal(
            page.widthIn,
            3
          )} × ${formatDecimal(page.heightIn, 3)} in`}
        />
        <DetailRow
          label="Centimetres"
          value={`${formatDecimal(
            page.widthCm,
            2
          )} × ${formatDecimal(page.heightCm, 2)} cm`}
        />
        <DetailRow
          label="Millimetres"
          value={`${formatDecimal(
            page.widthMm,
            2
          )} × ${formatDecimal(page.heightMm, 2)} mm`}
        />
        <DetailRow
          label="PDF Points"
          value={`${formatDecimal(
            page.widthPt,
            2
          )} × ${formatDecimal(page.heightPt, 2)} pt`}
        />
        <DetailRow label="Standard" value={page.standardName} />
        <DetailRow label="Orientation" value={page.orientation} />
        <DetailRow label="Page Rotation" value={`${page.rotation}°`} />
        <DetailRow
          label="Aspect Ratio"
          value={formatAspectRatio(page.widthPt, page.heightPt)}
        />
      </div>

      <div className="mt-5 grid gap-2">
        <button
          type="button"
          onClick={onCopySize}
          className="btn-primary w-full inline-flex items-center justify-center gap-2"
        >
          {copiedType === "size" ? (
            <Check size={17} />
          ) : (
            <Copy size={17} />
          )}
          {copiedType === "size" ? "Copied" : "Copy Current Size"}
        </button>

        <button
          type="button"
          onClick={onCopyDetails}
          className="btn-secondary w-full inline-flex items-center justify-center gap-2"
        >
          {copiedType === "details" ? (
            <Check size={17} />
          ) : (
            <Clipboard size={17} />
          )}
          {copiedType === "details"
            ? "Copied"
            : "Copy All Measurements"}
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, warning = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        warning
          ? "border-amber-200 bg-amber-50"
          : "border-[var(--border)] bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon
          size={17}
          className={
            warning ? "text-amber-700" : "text-[var(--primary)]"
          }
        />
        <p className="text-xs font-semibold text-[var(--text-secondary)]">
          {label}
        </p>
      </div>
      <p className="mt-2 text-xl font-bold truncate" title={String(value)}>
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-3 flex items-center justify-between gap-3">
      <span className="text-xs text-[var(--text-secondary)]">
        {label}
      </span>
      <code className="text-xs font-bold text-right break-all">
        {value}
      </code>
    </div>
  );
}

function HoverRow({ label, value, strong = false }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span
        className={`text-right break-all ${
          strong ? "font-bold text-[var(--primary)]" : "font-semibold"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {text}
      </p>
    </div>
  );
}

function FeedbackMessage({ type, message }) {
  const isError = type === "error";

  return (
    <div
      className={`mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm ${
        isError
          ? "border-red-100 bg-red-50 text-red-700"
          : "border-green-100 bg-green-50 text-green-700"
      }`}
    >
      {isError ? (
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle size={18} className="mt-0.5 shrink-0" />
      )}
      <p>{message}</p>
    </div>
  );
}

function validatePdfFile(file) {
  if (!file) return "Please choose a PDF file.";

  const isPdf =
    file.type === "application/pdf" ||
    /\.pdf$/i.test(file.name || "");

  if (!isPdf) {
    return "Please upload a valid PDF file.";
  }

  if (file.size <= 0) {
    return "This PDF file is empty.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `PDF must be ${MAX_FILE_SIZE_MB} MB or smaller.`;
  }

  return "";
}

function detectStandardPageSize(widthMm, heightMm) {
  let bestMatch = null;

  STANDARD_PAGE_SIZES.forEach((size) => {
    const directDifference =
      Math.abs(widthMm - size.widthMm) +
      Math.abs(heightMm - size.heightMm);
    const rotatedDifference =
      Math.abs(widthMm - size.heightMm) +
      Math.abs(heightMm - size.widthMm);
    const difference = Math.min(
      directDifference,
      rotatedDifference
    );

    const withinTolerance =
      (Math.abs(widthMm - size.widthMm) <=
        STANDARD_SIZE_TOLERANCE_MM &&
        Math.abs(heightMm - size.heightMm) <=
          STANDARD_SIZE_TOLERANCE_MM) ||
      (Math.abs(widthMm - size.heightMm) <=
        STANDARD_SIZE_TOLERANCE_MM &&
        Math.abs(heightMm - size.widthMm) <=
          STANDARD_SIZE_TOLERANCE_MM);

    if (
      withinTolerance &&
      (!bestMatch || difference < bestMatch.difference)
    ) {
      bestMatch = {
        name: size.name,
        difference,
      };
    }
  });

  return bestMatch?.name || "Custom";
}

function getOrientation(width, height) {
  const tolerance = Math.max(width, height) * 0.01;

  if (Math.abs(width - height) <= tolerance) {
    return "Square";
  }

  return width > height ? "Landscape" : "Portrait";
}

function getPageGroupKey(page) {
  return [
    Math.round(page.widthPt * 2) / 2,
    Math.round(page.heightPt * 2) / 2,
    page.orientation,
  ].join(":");
}

function formatPageDimensions(page, unit, dpi) {
  if (!page) return "—";

  if (unit === "px") {
    return `${Math.round(page.widthIn * dpi)} × ${Math.round(
      page.heightIn * dpi
    )} px`;
  }

  if (unit === "in") {
    return `${formatDecimal(
      page.widthIn,
      3
    )} × ${formatDecimal(page.heightIn, 3)} in`;
  }

  if (unit === "cm") {
    return `${formatDecimal(
      page.widthCm,
      2
    )} × ${formatDecimal(page.heightCm, 2)} cm`;
  }

  if (unit === "mm") {
    return `${formatDecimal(
      page.widthMm,
      2
    )} × ${formatDecimal(page.heightMm, 2)} mm`;
  }

  return `${formatDecimal(
    page.widthPt,
    2
  )} × ${formatDecimal(page.heightPt, 2)} pt`;
}

function createPageDetailsText(page, dpi) {
  return [
    `Page ${page.pageNumber}`,
    `Standard: ${page.standardName}`,
    `Orientation: ${page.orientation}`,
    `Pixels at ${dpi} DPI: ${Math.round(
      page.widthIn * dpi
    )} × ${Math.round(page.heightIn * dpi)} px`,
    `Inches: ${formatDecimal(
      page.widthIn,
      3
    )} × ${formatDecimal(page.heightIn, 3)} in`,
    `Centimetres: ${formatDecimal(
      page.widthCm,
      2
    )} × ${formatDecimal(page.heightCm, 2)} cm`,
    `Millimetres: ${formatDecimal(
      page.widthMm,
      2
    )} × ${formatDecimal(page.heightMm, 2)} mm`,
    `PDF Points: ${formatDecimal(
      page.widthPt,
      2
    )} × ${formatDecimal(page.heightPt, 2)} pt`,
    `Rotation: ${page.rotation}°`,
  ].join("\n");
}

function formatAspectRatio(width, height) {
  if (!width || !height) return "—";

  const ratio = width / height;

  return ratio >= 1
    ? `${formatDecimal(ratio, 3)} : 1`
    : `1 : ${formatDecimal(1 / ratio, 3)}`;
}

function normalizeRotation(value) {
  const number = Number(value) || 0;
  return ((number % 360) + 360) % 360;
}

function formatDecimal(value, decimals) {
  return Number(value || 0)
    .toFixed(decimals)
    .replace(/\.?0+$/, "");
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;

  if (!value) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );
  const size = value / 1024 ** index;

  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function getFileBaseName(filename) {
  return String(filename || "pdf")
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "pdf";
}

function escapeCsvValue(value) {
  const text = String(value ?? "");

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function waitForFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const successful = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!successful) {
    throw new Error("Copy failed.");
  }
}
