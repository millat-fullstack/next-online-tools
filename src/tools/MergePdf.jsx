import { useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  FileText,
  FilePlus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle,
  Layers,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Merge PDF",
  path: "/merge-pdf",
  category: "PDF Tools",
  description:
    "Merge multiple PDF files online for free. Upload PDFs, arrange the order, combine them, and download one merged PDF.",
  metaTitle: "Merge PDF Online Free | Combine PDF Files",
  metaDescription:
    "Merge PDF files online for free. Upload multiple PDFs, reorder files, combine pages, and download one merged PDF instantly in your browser.",
};

export default function MergePdf() {
  const fileInputRef = useRef(null);

  const [pdfFiles, setPdfFiles] = useState([]);
  const [mergedUrl, setMergedUrl] = useState("");
  const [mergedBlob, setMergedBlob] = useState(null);
  const [mergedFileName, setMergedFileName] = useState("");
  const [mergedPages, setMergedPages] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [progress, setProgress] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearOutput = () => {
    if (mergedUrl) {
      URL.revokeObjectURL(mergedUrl);
    }

    setMergedUrl("");
    setMergedBlob(null);
    setMergedFileName("");
    setMergedPages(0);
    setProgress(0);
  };

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  const isValidPdfFile = (file) => {
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  };

  const getPdfPageCount = async (file) => {
    const { PDFDocument } = await import("pdf-lib");
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return pdfDoc.getPageCount();
  };

  const handleFiles = async (files) => {
    clearFeedback();
    clearOutput();

    const selectedFiles = Array.from(files || []);

    if (!selectedFiles.length) return;

    const validFiles = selectedFiles.filter(isValidPdfFile);

    if (!validFiles.length) {
      setError("Please upload valid PDF files only.");
      return;
    }

    const maxFileSize = 80 * 1024 * 1024;
    const tooLarge = validFiles.find((file) => file.size > maxFileSize);

    if (tooLarge) {
      setError("One or more PDF files are too large. Please use files under 80MB each.");
      return;
    }

    try {
      setProgress(0);

      const items = await Promise.all(
        validFiles.map(async (file, index) => {
          let pageCount = 0;

          try {
            pageCount = await getPdfPageCount(file);
          } catch {
            throw new Error(
              `${file.name} could not be loaded. It may be password-protected, encrypted, or corrupted.`
            );
          }

          return {
            id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
            file,
            name: file.name,
            size: file.size,
            pages: pageCount,
          };
        })
      );

      setPdfFiles((prev) => [...prev, ...items]);
      setSuccess(`${items.length} PDF file${items.length > 1 ? "s" : ""} added successfully.`);
    } catch (err) {
      setError(err.message || "Could not read one or more PDF files.");
    }
  };

  const handleInputChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const moveFile = (index, direction) => {
    clearOutput();

    setPdfFiles((prev) => {
      const updated = [...prev];
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= updated.length) {
        return updated;
      }

      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

      return updated;
    });
  };

  const removeFile = (id) => {
    clearOutput();
    setPdfFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMergePdf = async () => {
    clearFeedback();
    clearOutput();

    if (pdfFiles.length < 2) {
      setError("Please upload at least two PDF files to merge.");
      return;
    }

    setIsMerging(true);
    setProgress(0);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const mergedPdf = await PDFDocument.create();

      let totalPages = 0;

      for (let i = 0; i < pdfFiles.length; i += 1) {
        const item = pdfFiles[i];
        const arrayBuffer = await item.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        const pageIndices = pdfDoc.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);

        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });

        totalPages += pageIndices.length;
        setProgress(Math.round(((i + 1) / pdfFiles.length) * 100));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setMergedBlob(blob);
      setMergedUrl(url);
      setMergedFileName("merged-pdf.pdf");
      setMergedPages(totalPages);
      setSuccess("PDF files merged successfully. You can now download the merged PDF.");
    } catch {
      setError(
        "Could not merge these PDF files. Password-protected, encrypted, corrupted, or very large PDFs may not merge correctly."
      );
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownload = () => {
    if (!mergedUrl) return;

    const link = document.createElement("a");
    link.href = mergedUrl;
    link.download = mergedFileName || "merged-pdf.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    clearOutput();

    setPdfFiles([]);
    setIsDragging(false);
    setIsMerging(false);
    setProgress(0);
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const totalInputSize = useMemo(() => {
    return pdfFiles.reduce((sum, item) => sum + item.size, 0);
  }, [pdfFiles]);

  const totalInputPages = useMemo(() => {
    return pdfFiles.reduce((sum, item) => sum + item.pages, 0);
  }, [pdfFiles]);

  const getSizeResult = () => {
    if (!mergedBlob || !totalInputSize) return "-";

    const difference = mergedBlob.size - totalInputSize;
    const percentage = Math.abs((difference / totalInputSize) * 100).toFixed(1);

    if (difference > 0) return `${percentage}% larger`;
    if (difference < 0) return `${percentage}% smaller`;

    return "Same size";
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Layers size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Merge PDF</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload multiple PDF files, arrange them in the correct order, and merge
          them into one PDF directly in your browser.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* UPLOAD */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${
                isDragging
                  ? "border-[var(--primary)] bg-[var(--primary)]/5"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-white border shadow-sm flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-[var(--primary)]" />
              </div>

              <h2 className="text-xl font-semibold mb-2">Upload PDF Files</h2>

              <p className="text-sm text-[var(--text-secondary)] mb-5">
                Drag and drop PDF files here, or click the button below.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                onChange={handleInputChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Upload size={18} />
                Choose PDF Files
              </button>
            </div>

            {/* FILE ORDER */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">PDF File Order</h3>
              </div>

              {pdfFiles.length ? (
                <div className="flex flex-col gap-3">
                  {pdfFiles.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 border border-[var(--border)] rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {index + 1}. {item.name}
                        </p>

                        <p className="text-xs text-[var(--text-secondary)]">
                          {item.pages} page{item.pages !== 1 ? "s" : ""} •{" "}
                          {formatBytes(item.size)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveFile(index, -1)}
                          disabled={index === 0}
                          className="w-9 h-9 rounded-lg border bg-white flex items-center justify-center disabled:opacity-40"
                          title="Move up"
                        >
                          <ArrowUp size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveFile(index, 1)}
                          disabled={index === pdfFiles.length - 1}
                          className="w-9 h-9 rounded-lg border bg-white flex items-center justify-center disabled:opacity-40"
                          title="Move down"
                        >
                          <ArrowDown size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeFile(item.id)}
                          className="w-9 h-9 rounded-lg border bg-white text-red-600 flex items-center justify-center"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                  <FilePlus size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-[var(--text-secondary)]">
                    Uploaded PDF files will appear here.
                  </p>
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleMergePdf}
                disabled={pdfFiles.length < 2 || isMerging}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  pdfFiles.length < 2 || isMerging
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <Zap size={18} />
                {isMerging ? "Merging..." : "Merge PDF"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>

            {isMerging && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Merging PDFs...</p>
                  <p className="text-sm font-medium">{progress}%</p>
                </div>

                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all"
                    style={{ width: `${progress}%` }}
                  />
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

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-sm text-yellow-800">
                This tool merges PDF files in your browser. Your files are not
                uploaded to a server. Password-protected, encrypted, or corrupted
                PDFs may not merge correctly.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* RESULT PREVIEW */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Merged PDF Result</h2>
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-5 bg-gray-50 min-h-[260px] flex items-center justify-center">
                {mergedUrl ? (
                  <div className="w-full text-center">
                    <div className="w-20 h-20 rounded-2xl bg-white border shadow-sm flex items-center justify-center mx-auto mb-4">
                      <FileText size={38} className="text-[var(--primary)]" />
                    </div>

                    <h3 className="font-semibold mb-1">{mergedFileName}</h3>

                    <p className="text-sm text-[var(--text-secondary)]">
                      {mergedPages} merged page{mergedPages !== 1 ? "s" : ""} •{" "}
                      {formatBytes(mergedBlob?.size || 0)}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Layers size={44} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-[var(--text-secondary)]">
                      Merged PDF result will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* DOWNLOAD */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!mergedUrl}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !mergedUrl ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download Merged PDF
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Clear All
              </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="PDF Files" value={pdfFiles.length} />
              <StatCard label="Total Pages" value={totalInputPages} />
              <StatCard label="Input Size" value={formatBytes(totalInputSize)} />
              <StatCard
                label="Merged Size"
                value={mergedBlob ? formatBytes(mergedBlob.size) : "-"}
              />
              <StatCard label="Output Format" value="PDF" />
              <StatCard label="Size Result" value={getSizeResult()} green />
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="merge-pdf" />
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  if (!bytes) return "0 B";

  const sizes = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes.length - 1
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${sizes[index]}`;
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