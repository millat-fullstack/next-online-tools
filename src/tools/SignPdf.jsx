import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  PenLine,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Type,
  Upload,
  ZoomIn,
  ZoomOut,
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
  title: "Sign PDF",
  path: "/sign-pdf",
  category: "PDF Tools",
  description:
    "Add a visual signature to your PDF online. Draw, type, or upload a signature, place it on the PDF, and download the signed file.",
  metaTitle: "Sign PDF Online Free | Add Signature to PDF",
  metaDescription:
    "Sign PDF files online for free. Draw, type, or upload your signature, place it on any PDF page, and download the signed PDF instantly.",
};

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const DEFAULT_SIGNATURE_WIDTH_RATIO = 0.34;
const DEFAULT_SIGNATURE_HEIGHT_RATIO = 0.1;

const TYPE_FONTS = [
  { label: "Handwriting", value: "Brush Script MT, Segoe Script, cursive" },
  { label: "Elegant", value: "Georgia, serif" },
  { label: "Classic", value: "Times New Roman, serif" },
  { label: "Modern", value: "Arial, sans-serif" },
];

export default function SignPdf() {
  const pdfInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const drawContextRef = useRef(null);
  const drawingRef = useRef(false);

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [pdfName, setPdfName] = useState("");
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewZoom, setPreviewZoom] = useState(1.15);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [renderingPreview, setRenderingPreview] = useState(false);

  const [signatureTab, setSignatureTab] = useState("draw");
  const [drawColor, setDrawColor] = useState("#111111");
  const [drawThickness, setDrawThickness] = useState(3);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  const [typedName, setTypedName] = useState("Your Name");
  const [typedFont, setTypedFont] = useState(TYPE_FONTS[0].value);
  const [typedColor, setTypedColor] = useState("#111111");

  const [signatureItems, setSignatureItems] = useState([]);
  const [selectedSignatureId, setSelectedSignatureId] = useState("");
  const [dragState, setDragState] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPhase, setProcessingPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [signedPdfBlob, setSignedPdfBlob] = useState(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);

  const currentPageSignatures = useMemo(() => {
    return signatureItems.filter((item) => item.page === currentPage);
  }, [signatureItems, currentPage]);

  const selectedSignature = useMemo(() => {
    return signatureItems.find((item) => item.id === selectedSignatureId) || null;
  }, [signatureItems, selectedSignatureId]);

  const hasPdf = Boolean(pdfBytes && pdfFile);

  useEffect(() => {
    return () => {
      if (signedPdfUrl) URL.revokeObjectURL(signedPdfUrl);
    };
  }, []);

  useEffect(() => {
    if (!pdfBytes || !currentPage) return;

    let cancelled = false;

    async function renderPage() {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;

      setRenderingPreview(true);
      setError("");

      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale: previewZoom });

        const context = canvas.getContext("2d");
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        if (!cancelled) {
          setPreviewSize({
            width: Math.floor(viewport.width),
            height: Math.floor(viewport.height),
          });
        }

        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;
      } catch (previewError) {
        console.error("PDF preview error:", previewError);
        if (!cancelled) {
          setError("Could not render this PDF page. Try another PDF file.");
        }
      } finally {
        if (!cancelled) {
          setRenderingPreview(false);
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdfBytes, currentPage, previewZoom]);

  useEffect(() => {
    prepareDrawCanvas();
  }, [signatureTab]);

  useEffect(() => {
    if (!dragState) return;

    function handlePointerMove(event) {
      event.preventDefault();

      const deltaXRatio = (event.clientX - dragState.startClientX) / Math.max(1, dragState.previewWidth);
      const deltaYRatio = (event.clientY - dragState.startClientY) / Math.max(1, dragState.previewHeight);

      setSignatureItems((current) =>
        current.map((item) => {
          if (item.id !== dragState.id) return item;

          if (dragState.mode === "move") {
            return clampSignature({
              ...item,
              x: dragState.original.x + deltaXRatio,
              y: dragState.original.y + deltaYRatio,
            });
          }

          if (dragState.mode === "resize") {
            const nextWidth = Math.max(0.05, dragState.original.width + deltaXRatio);
            const aspectRatio = dragState.original.height / Math.max(0.01, dragState.original.width);
            const nextHeight = Math.max(0.025, nextWidth * aspectRatio);

            return clampSignature({
              ...item,
              width: nextWidth,
              height: nextHeight,
            });
          }

          return item;
        })
      );
    }

    function handlePointerUp() {
      setDragState(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragState]);

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function resetPdfInput() {
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }

  function resetImageInput() {
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function clearSignedOutput() {
    if (signedPdfUrl) URL.revokeObjectURL(signedPdfUrl);

    setSignedPdfBlob(null);
    setSignedPdfUrl("");
    setProcessingTimeMs(0);
  }

  function validatePdfFile(file) {
    if (!file) return "Please choose a PDF file.";

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return "Please upload a valid PDF file.";
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `PDF must be under ${MAX_FILE_SIZE_MB} MB.`;
    }

    return "";
  }

  async function handlePdfFile(file) {
    if (isProcessing) return;

    clearFeedback();
    clearSignedOutput();

    const validationError = validatePdfFile(file);

    if (validationError) {
      setError(validationError);
      resetPdfInput();
      return;
    }

    setIsProcessing(true);
    setProcessingPhase("Loading PDF...");
    setProgress(15);

    const startTime = performance.now();

    try {
      const bytes = await file.arrayBuffer();
      setProgress(45);

      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
      const pdf = await loadingTask.promise;

      setPdfFile(file);
      setPdfBytes(bytes);
      setPdfName(file.name);
      setPdfPageCount(pdf.numPages);
      setCurrentPage(1);
      setSignatureItems([]);
      setSelectedSignatureId("");
      setProgress(100);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));
      setProcessingTimeMs(actualTime);
      setSuccess(`PDF loaded in ${(actualTime / 1000).toFixed(1)}s. Add your signature now.`);
    } catch (loadError) {
      console.error("PDF load error:", loadError);
      setError("Could not read this PDF. Try another PDF file.");
    } finally {
      setIsProcessing(false);
      resetPdfInput();
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  function handlePdfInput(event) {
    handlePdfFile(event.target.files?.[0]);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDraggingUpload(false);
    handlePdfFile(event.dataTransfer.files?.[0]);
  }

  function handleDragOver(event) {
    event.preventDefault();
    if (!isProcessing) setIsDraggingUpload(true);
  }

  function handleDragLeave() {
    setIsDraggingUpload(false);
  }

  function prepareDrawCanvas() {
    const canvas = drawCanvasRef.current;

    if (!canvas) return;

    const width = 520;
    const height = 180;
    const outputScale = window.devicePixelRatio || 1;

    canvas.width = width * outputScale;
    canvas.height = height * outputScale;
    canvas.style.width = "100%";
    canvas.style.height = "180px";

    const ctx = canvas.getContext("2d");
    ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawThickness;
    drawContextRef.current = ctx;
    setHasDrawnSignature(false);
  }

  function getDrawPoint(event) {
    const canvas = drawCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / Math.max(1, rect.width)) * 520,
      y: ((event.clientY - rect.top) / Math.max(1, rect.height)) * 180,
    };
  }

  function handleDrawPointerDown(event) {
    event.preventDefault();

    const ctx = drawContextRef.current;
    if (!ctx) return;

    const point = getDrawPoint(event);
    drawingRef.current = true;
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawThickness;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    setHasDrawnSignature(true);
  }

  function handleDrawPointerMove(event) {
    if (!drawingRef.current) return;

    event.preventDefault();

    const ctx = drawContextRef.current;
    if (!ctx) return;

    const point = getDrawPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  function handleDrawPointerUp() {
    drawingRef.current = false;
  }

  function clearDrawSignature() {
    prepareDrawCanvas();
  }

  function addDrawSignature() {
    const canvas = drawCanvasRef.current;

    if (!canvas || !hasDrawnSignature) {
      setError("Draw your signature first.");
      return;
    }

    const dataUrl = trimCanvasToDataUrl(canvas);

    addSignatureToCurrentPage(dataUrl, "drawn-signature.png");
  }

  function addTypedSignature() {
    const cleanName = String(typedName || "").trim();

    if (!cleanName) {
      setError("Type your name first.");
      return;
    }

    const dataUrl = createTypedSignatureDataUrl(cleanName, typedFont, typedColor);
    addSignatureToCurrentPage(dataUrl, "typed-signature.png");
  }

  async function handleSignatureImageInput(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const validImage =
      file.type.startsWith("image/") ||
      /\.(png|jpg|jpeg|webp)$/i.test(file.name);

    if (!validImage) {
      setError("Please upload a PNG, JPG, JPEG, or WebP signature image.");
      resetImageInput();
      return;
    }

    try {
      const dataUrl = await imageFileToPngDataUrl(file);
      addSignatureToCurrentPage(dataUrl, file.name);
      resetImageInput();
    } catch {
      setError("Could not read this signature image.");
      resetImageInput();
    }
  }

  function addSignatureToCurrentPage(dataUrl, label) {
    if (!hasPdf) {
      setError("Upload a PDF first.");
      return;
    }

    const width = DEFAULT_SIGNATURE_WIDTH_RATIO;
    const height = DEFAULT_SIGNATURE_HEIGHT_RATIO;

    const item = {
      id: createId(),
      page: currentPage,
      dataUrl,
      label,
      x: 0.5 - width / 2,
      y: 0.74,
      width,
      height,
    };

    setSignatureItems((current) => [...current, item]);
    setSelectedSignatureId(item.id);
    clearSignedOutput();
    setError("");
    setSuccess("Signature added. Drag it to position and resize from the corner.");
  }

  function startMoveSignature(event, item) {
    event.preventDefault();
    event.stopPropagation();

    setSelectedSignatureId(item.id);
    setDragState({
      id: item.id,
      mode: "move",
      startClientX: event.clientX,
      startClientY: event.clientY,
      previewWidth: previewSize.width,
      previewHeight: previewSize.height,
      original: {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      },
    });
  }

  function startResizeSignature(event, item) {
    event.preventDefault();
    event.stopPropagation();

    setSelectedSignatureId(item.id);
    setDragState({
      id: item.id,
      mode: "resize",
      startClientX: event.clientX,
      startClientY: event.clientY,
      previewWidth: previewSize.width,
      previewHeight: previewSize.height,
      original: {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      },
    });
  }

  function deleteSelectedSignature() {
    if (!selectedSignatureId) return;

    clearSignedOutput();
    setSignatureItems((current) => current.filter((item) => item.id !== selectedSignatureId));
    setSelectedSignatureId("");
    setSuccess("Signature removed.");
  }

  function resetTool() {
    clearSignedOutput();
    setPdfFile(null);
    setPdfBytes(null);
    setPdfName("");
    setPdfPageCount(0);
    setCurrentPage(1);
    setPreviewZoom(1.15);
    setPreviewSize({ width: 0, height: 0 });
    setRenderingPreview(false);
    setSignatureTab("draw");
    setDrawColor("#111111");
    setDrawThickness(3);
    setHasDrawnSignature(false);
    setTypedName("Your Name");
    setTypedFont(TYPE_FONTS[0].value);
    setTypedColor("#111111");
    setSignatureItems([]);
    setSelectedSignatureId("");
    setDragState(null);
    setIsProcessing(false);
    setProcessingPhase("");
    setProgress(0);
    setProcessingTimeMs(0);
    setError("");
    setSuccess("");
    setIsDraggingUpload(false);
    resetPdfInput();
    resetImageInput();
  }

  async function exportSignedPdf() {
    if (!pdfBytes || !signatureItems.length) {
      setError("Add at least one signature before downloading.");
      return;
    }

    setIsProcessing(true);
    setProcessingPhase("Preparing signed PDF...");
    setProgress(8);
    setProcessingTimeMs(0);
    setError("");
    setSuccess("");
    clearSignedOutput();

    const startTime = performance.now();

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes.slice(0));
      const pages = pdfDoc.getPages();

      for (let index = 0; index < signatureItems.length; index += 1) {
        const item = signatureItems[index];
        const page = pages[item.page - 1];

        if (!page) continue;

        setProcessingPhase(`Adding signature ${index + 1} of ${signatureItems.length}...`);
        setProgress(15 + Math.round((index / Math.max(1, signatureItems.length)) * 70));

        const imageBytes = dataUrlToUint8Array(item.dataUrl);
        const isJpg = item.dataUrl.startsWith("data:image/jpeg") || item.dataUrl.startsWith("data:image/jpg");
        const embeddedImage = isJpg
          ? await pdfDoc.embedJpg(imageBytes)
          : await pdfDoc.embedPng(imageBytes);

        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();

        const drawWidth = item.width * pageWidth;
        const drawHeight = item.height * pageHeight;
        const drawX = item.x * pageWidth;
        const drawY = pageHeight - (item.y * pageHeight) - drawHeight;

        page.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: drawWidth,
          height: drawHeight,
        });
      }

      setProcessingPhase("Creating final PDF...");
      setProgress(92);

      const signedBytes = await pdfDoc.save();
      const blob = new Blob([signedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setSignedPdfBlob(blob);
      setSignedPdfUrl(url);
      setProgress(100);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));
      setProcessingTimeMs(actualTime);
      setSuccess(`Signed PDF created in ${(actualTime / 1000).toFixed(1)}s. Download is ready.`);
    } catch (exportError) {
      console.error("Sign PDF export error:", exportError);
      setError("Could not create the signed PDF. Try a smaller PDF or a different signature image.");
    } finally {
      setIsProcessing(false);
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  async function downloadSignedPdf() {
    if (!signedPdfBlob) {
      await exportSignedPdf();
      return;
    }

    try {
      await saveBlob(signedPdfBlob, getSignedPdfName(pdfName));
      setSuccess("Download started.");
    } catch {
      setError("Could not start the download.");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <PenLine size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Sign PDF</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Add a visual signature to your PDF. Draw, type, or upload a signature,
          place it on any page, and download the signed PDF.
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
              } ${isProcessing ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handlePdfInput}
                className="hidden"
                disabled={isProcessing}
              />

              <Upload size={44} className="text-[var(--primary)] mb-4" />

              <h2 className="text-xl font-bold mb-2">Upload PDF</h2>

              <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-5">
                Choose or drop one PDF file. Max {MAX_FILE_SIZE_MB} MB.
              </p>

              <span className="btn-primary inline-flex items-center gap-2">
                <Upload size={17} />
                Choose PDF
              </span>
            </label>
          )}

          {hasPdf && (
            <>
              <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText size={20} className="text-[var(--primary)]" />
                      <h2 className="text-xl font-bold">PDF Loaded</h2>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">
                      {pdfName} • {pdfPageCount} page{pdfPageCount === 1 ? "" : "s"} • {formatBytes(pdfFile?.size)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={isProcessing}
                      className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                    >
                      <Upload size={17} />
                      Replace PDF
                    </button>

                    <button
                      type="button"
                      onClick={resetTool}
                      disabled={isProcessing}
                      className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                    >
                      <RotateCcw size={17} />
                      Reset
                    </button>

                    <button
                      type="button"
                      onClick={exportSignedPdf}
                      disabled={isProcessing || !signatureItems.length}
                      className="btn-primary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? <Loader2 size={17} className="animate-spin" /> : <PenLine size={17} />}
                      Create Signed PDF
                    </button>

                    <button
                      type="button"
                      onClick={downloadSignedPdf}
                      disabled={isProcessing || !signatureItems.length}
                      className="btn-primary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={17} />
                      Download
                    </button>

                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handlePdfInput}
                      className="hidden"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </div>

              <div className="grid xl:grid-cols-[minmax(0,1fr)_390px] gap-5">
                <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
                  <div className="p-4 border-b border-[var(--border)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Eye size={20} className="text-[var(--primary)]" />
                        <h2 className="text-xl font-bold">PDF Preview</h2>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Drag signature to move. Use the corner handle to resize.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={currentPage <= 1}
                        className="small-tool-btn disabled:opacity-40"
                      >
                        Prev
                      </button>

                      <span className="h-10 px-3 rounded-xl border border-[var(--border)] bg-[#fafafa] inline-flex items-center justify-center text-sm font-bold">
                        Page {currentPage} / {pdfPageCount}
                      </span>

                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.min(pdfPageCount, page + 1))}
                        disabled={currentPage >= pdfPageCount}
                        className="small-tool-btn disabled:opacity-40"
                      >
                        Next
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewZoom((zoom) => Math.max(0.75, Number((zoom - 0.1).toFixed(2))))}
                        className="small-icon-btn"
                        title="Zoom out"
                      >
                        <ZoomOut size={17} />
                      </button>

                      <span className="text-xs font-bold text-[var(--primary)] min-w-12 text-center">
                        {Math.round(previewZoom * 100)}%
                      </span>

                      <button
                        type="button"
                        onClick={() => setPreviewZoom((zoom) => Math.min(2.2, Number((zoom + 0.1).toFixed(2))))}
                        className="small-icon-btn"
                        title="Zoom in"
                      >
                        <ZoomIn size={17} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#111827] p-4 sm:p-6 overflow-auto">
                    <div
                      className="relative mx-auto bg-white shadow-2xl"
                      style={{
                        width: previewSize.width ? `${previewSize.width}px` : "auto",
                        height: previewSize.height ? `${previewSize.height}px` : "auto",
                      }}
                    >
                      <canvas ref={previewCanvasRef} className="block bg-white" />

                      {renderingPreview && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <Loader2 size={28} className="animate-spin text-[var(--primary)]" />
                        </div>
                      )}

                      <div className="absolute inset-0">
                        {currentPageSignatures.map((item) => (
                          <SignatureOverlay
                            key={item.id}
                            item={item}
                            previewSize={previewSize}
                            selected={selectedSignatureId === item.id}
                            onPointerDown={(event) => startMoveSignature(event, item)}
                            onResizePointerDown={(event) => startResizeSignature(event, item)}
                            onSelect={() => setSelectedSignatureId(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="xl:sticky xl:top-4 h-fit flex flex-col gap-5">
                  <SignaturePanel
                    signatureTab={signatureTab}
                    setSignatureTab={setSignatureTab}
                    drawCanvasRef={drawCanvasRef}
                    drawColor={drawColor}
                    setDrawColor={setDrawColor}
                    drawThickness={drawThickness}
                    setDrawThickness={setDrawThickness}
                    onDrawPointerDown={handleDrawPointerDown}
                    onDrawPointerMove={handleDrawPointerMove}
                    onDrawPointerUp={handleDrawPointerUp}
                    onClearDraw={clearDrawSignature}
                    onAddDraw={addDrawSignature}
                    typedName={typedName}
                    setTypedName={setTypedName}
                    typedFont={typedFont}
                    setTypedFont={setTypedFont}
                    typedColor={typedColor}
                    setTypedColor={setTypedColor}
                    onAddTyped={addTypedSignature}
                    imageInputRef={imageInputRef}
                    onSignatureImageInput={handleSignatureImageInput}
                  />

                  <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                    <h2 className="text-xl font-bold mb-4">Signature Actions</h2>

                    <div className="space-y-3">
                      <InfoRow label="Total signatures" value={signatureItems.length} />
                      <InfoRow label="Selected page" value={currentPage} />
                      <InfoRow label="Selected signature" value={selectedSignature ? "Yes" : "None"} />
                    </div>

                    <button
                      type="button"
                      onClick={deleteSelectedSignature}
                      disabled={!selectedSignature}
                      className="mt-4 w-full rounded-xl border border-red-200 bg-red-50 text-red-600 h-11 font-bold inline-flex items-center justify-center gap-2 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={17} />
                      Delete Selected
                    </button>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck size={20} className="text-[var(--primary)]" />
                      <h2 className="text-xl font-bold">Privacy & Note</h2>
                    </div>

                    <p className="text-sm text-[var(--text-secondary)] leading-6">
                      Your PDF and signature are processed in your browser and are not uploaded or stored. This tool adds a visual signature, not a certificate-based digital signature.
                    </p>
                  </div>
                </div>
              </div>

              {signedPdfUrl && (
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-green-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Signed PDF ready</p>
                      <p className="text-sm mt-1">
                        {processingTimeMs > 0 ? `Created in ${(processingTimeMs / 1000).toFixed(1)}s.` : "Download is ready."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={downloadSignedPdf}
                    className="btn-primary inline-flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Download Signed PDF
                  </button>
                </div>
              )}
            </>
          )}

          {isProcessing && (
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

              {processingTimeMs > 0 && (
                <span className="font-bold shrink-0">
                  {(processingTimeMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <style>{`
        .small-tool-btn {
          min-height: 40px;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          background: white;
          padding: 0.45rem 0.85rem;
          font-size: 0.85rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          transition: 160ms ease;
        }
        .small-tool-btn:hover:not(:disabled) {
          background: #f8f4ff;
          color: var(--primary);
        }
        .small-icon-btn {
          height: 40px;
          width: 40px;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          background: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: 160ms ease;
        }
        .small-icon-btn:hover:not(:disabled) {
          background: #f8f4ff;
          color: var(--primary);
        }
      `}</style>

      <SuggestedTools currentToolId="sign-pdf" />
    </div>
  );
}

function SignaturePanel({
  signatureTab,
  setSignatureTab,
  drawCanvasRef,
  drawColor,
  setDrawColor,
  drawThickness,
  setDrawThickness,
  onDrawPointerDown,
  onDrawPointerMove,
  onDrawPointerUp,
  onClearDraw,
  onAddDraw,
  typedName,
  setTypedName,
  typedFont,
  setTypedFont,
  typedColor,
  setTypedColor,
  onAddTyped,
  imageInputRef,
  onSignatureImageInput,
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="text-xl font-bold">Create Signature</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Draw, type, or upload a visual signature.
        </p>
      </div>

      <div className="p-3 border-b border-[var(--border)] grid grid-cols-3 gap-2">
        <TabButton active={signatureTab === "draw"} onClick={() => setSignatureTab("draw")} icon={<PenLine size={16} />} label="Draw" />
        <TabButton active={signatureTab === "type"} onClick={() => setSignatureTab("type")} icon={<Type size={16} />} label="Type" />
        <TabButton active={signatureTab === "upload"} onClick={() => setSignatureTab("upload")} icon={<ImageIcon size={16} />} label="Upload" />
      </div>

      <div className="p-4">
        {signatureTab === "draw" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[#fafafa] p-3">
              <canvas
                ref={drawCanvasRef}
                onPointerDown={onDrawPointerDown}
                onPointerMove={onDrawPointerMove}
                onPointerUp={onDrawPointerUp}
                onPointerLeave={onDrawPointerUp}
                className="rounded-xl bg-white border border-[var(--border)] touch-none cursor-crosshair"
              />
            </div>

            <div className="grid grid-cols-[1fr_120px] gap-3">
              <label className="block">
                <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Color</span>
                <input
                  type="color"
                  value={drawColor}
                  onChange={(event) => setDrawColor(event.target.value)}
                  className="w-full h-11 rounded-xl border border-[var(--border)] bg-white p-1"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Thickness</span>
                <select
                  value={drawThickness}
                  onChange={(event) => setDrawThickness(Number(event.target.value))}
                  className="w-full h-11 rounded-xl border border-[var(--border)] bg-white px-3 outline-none focus:border-[var(--primary)]"
                >
                  <option value={2}>Thin</option>
                  <option value={3}>Normal</option>
                  <option value={5}>Bold</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={onClearDraw} className="btn-secondary inline-flex items-center justify-center gap-2">
                <RotateCcw size={17} />
                Clear
              </button>

              <button type="button" onClick={onAddDraw} className="btn-primary inline-flex items-center justify-center gap-2">
                <PenLine size={17} />
                Add
              </button>
            </div>
          </div>
        )}

        {signatureTab === "type" && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Name</span>
              <input
                value={typedName}
                onChange={(event) => setTypedName(event.target.value)}
                className="w-full h-11 rounded-xl border border-[var(--border)] bg-white px-3 outline-none focus:border-[var(--primary)]"
                placeholder="Type your name"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Style</span>
              <select
                value={typedFont}
                onChange={(event) => setTypedFont(event.target.value)}
                className="w-full h-11 rounded-xl border border-[var(--border)] bg-white px-3 outline-none focus:border-[var(--primary)]"
              >
                {TYPE_FONTS.map((font) => (
                  <option key={font.label} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Color</span>
              <input
                type="color"
                value={typedColor}
                onChange={(event) => setTypedColor(event.target.value)}
                className="w-full h-11 rounded-xl border border-[var(--border)] bg-white p-1"
              />
            </label>

            <div className="rounded-2xl border border-[var(--border)] bg-[#fafafa] p-4 text-center">
              <p
                className="text-4xl leading-tight"
                style={{
                  fontFamily: typedFont,
                  color: typedColor,
                }}
              >
                {typedName || "Your Name"}
              </p>
            </div>

            <button type="button" onClick={onAddTyped} className="btn-primary w-full inline-flex items-center justify-center gap-2">
              <Type size={17} />
              Add Typed Signature
            </button>
          </div>
        )}

        {signatureTab === "upload" && (
          <div className="space-y-4">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp"
              onChange={onSignatureImageInput}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="min-h-[170px] w-full rounded-2xl border-2 border-dashed border-[var(--border)] bg-[#fafafa] hover:bg-[#f8f4ff] transition flex flex-col items-center justify-center text-center p-6"
            >
              <ImageIcon size={36} className="text-[var(--primary)] mb-3" />
              <span className="font-bold">Upload Signature Image</span>
              <span className="text-sm text-[var(--text-secondary)] mt-1">
                PNG, JPG, or WebP. Transparent PNG works best.
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 transition ${
        active
          ? "bg-[var(--primary)] text-white"
          : "bg-[#fafafa] border border-[var(--border)] hover:bg-[#f8f4ff] hover:text-[var(--primary)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SignatureOverlay({ item, previewSize, selected, onPointerDown, onResizePointerDown, onSelect }) {
  const left = item.x * previewSize.width;
  const top = item.y * previewSize.height;
  const width = item.width * previewSize.width;
  const height = item.height * previewSize.height;

  return (
    <div
      onPointerDown={onPointerDown}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className={`absolute cursor-move select-none touch-none ${
        selected ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-white" : "ring-1 ring-black/20"
      }`}
      style={{
        left,
        top,
        width,
        height,
      }}
      title="Drag to move"
    >
      <img
        src={item.dataUrl}
        alt="Signature"
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />

      {selected && (
        <button
          type="button"
          onPointerDown={onResizePointerDown}
          className="absolute -right-2 -bottom-2 h-5 w-5 rounded-full bg-[var(--primary)] border-2 border-white cursor-nwse-resize shadow"
          title="Resize signature"
          aria-label="Resize signature"
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[#fafafa] px-3 py-2">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-black text-[var(--primary)]">{value}</span>
    </div>
  );
}

function clampSignature(item) {
  const width = Math.min(Math.max(item.width, 0.05), 0.95);
  const height = Math.min(Math.max(item.height, 0.025), 0.6);
  const x = clampNumber(item.x, 0, 1 - width);
  const y = clampNumber(item.y, 0, 1 - height);

  return {
    ...item,
    x,
    y,
    width,
    height,
  };
}

function trimCanvasToDataUrl(canvas) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = pixels[(y * width + x) * 4 + 3];

      if (alpha > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX > maxX || minY > maxY) {
    return canvas.toDataURL("image/png");
  }

  const padding = 24;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width, maxX + padding);
  maxY = Math.min(height, maxY + padding);

  const trimWidth = maxX - minX;
  const trimHeight = maxY - minY;
  const output = document.createElement("canvas");

  output.width = trimWidth;
  output.height = trimHeight;

  const outCtx = output.getContext("2d");
  outCtx.drawImage(canvas, minX, minY, trimWidth, trimHeight, 0, 0, trimWidth, trimHeight);

  return output.toDataURL("image/png");
}

function createTypedSignatureDataUrl(name, font, color) {
  const canvas = document.createElement("canvas");
  const width = 900;
  const height = 240;
  const ctx = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);
  ctx.font = `92px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, width / 2, height / 2);

  return trimCanvasToDataUrl(canvas);
}

function imageFileToPngDataUrl(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const maxWidth = 1000;
        const ratio = Math.min(1, maxWidth / Math.max(1, image.naturalWidth || image.width));
        const width = Math.max(1, Math.round((image.naturalWidth || image.width) * ratio));
        const height = Math.max(1, Math.round((image.naturalHeight || image.height) * ratio));

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed."));
    };

    image.src = objectUrl;
  });
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

async function saveBlob(blob, filename) {
  const safeBlob = blob instanceof Blob ? blob : new Blob([blob], { type: "application/pdf" });
  const safeName = sanitizeDownloadFileName(filename || "signed-pdf.pdf");
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

function getSignedPdfName(fileName) {
  const baseName = String(fileName || "document.pdf").replace(/\.pdf$/i, "");
  return `${baseName}-signed.pdf`;
}

function sanitizeDownloadFileName(fileName) {
  const cleanName = String(fileName || "download")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  return cleanName || "download";
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
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const sizeIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, sizeIndex);

  return `${size.toFixed(sizeIndex === 0 ? 0 : 1)} ${units[sizeIndex]}`;
}

function clampNumber(value, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) return min;

  return Math.min(max, Math.max(min, number));
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}
