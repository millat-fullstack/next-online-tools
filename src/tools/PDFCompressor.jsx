import { useState, useRef, useEffect } from "react";
import { Upload, Download, RotateCcw, Zap, CheckCircle, AlertCircle } from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist"; // Correctly importing getDocument and GlobalWorkerOptions from pdfjs-dist
import jsPDF from "jspdf";

// Set up the workerSrc path for pdf.js
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js`;

export const toolData = {
  title: "Compress PDF",
  path: "/compress-pdf",
  category: "PDF Tools",
  description:
    "Compress PDF files online by reducing file size while keeping pages easy to view and share.",
  metaTitle: "Compress PDF Online Free | Reduce PDF File Size",
  metaDescription:
    "Compress PDF files online for free. Reduce PDF file size in your browser with adjustable compression quality and instant download.",
};

const QUALITY_OPTIONS = {
  low: 0.3,
  medium: 0.5,
  high: 0.7,
};

export default function PDFCompressor() {
  const [file, setFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [compressedPdf, setCompressedPdf] = useState(null);
  const [compressionLevel, setCompressionLevel] = useState("medium");
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [reductionPercentage, setReductionPercentage] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef(null);

  // Handle file change (PDF upload)
  const handleFileChange = (e) => {
    setError("");
    setSuccess("");
    setCompressedPdf(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setReductionPercentage(0);

    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }

    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    loadPDF(selectedFile);
  };

  // Load the PDF file using pdf.js
  const loadPDF = async (file) => {
    const fileReader = new FileReader();
    fileReader.onload = async () => {
      const typedArray = new Uint8Array(fileReader.result);
      console.log("Typed Array: ", typedArray); // Debugging to check the file data

      try {
        const pdf = await getDocument(typedArray).promise;
        setPdfData(pdf);
        console.log("PDF loaded successfully:", pdf);
      } catch (error) {
        console.error("Error loading PDF:", error);
        setError("Failed to load the PDF. Please try another file.");
      }
    };
    fileReader.readAsArrayBuffer(file);
  };

  // Compress the loaded PDF
  const compressPDF = async () => {
    if (!file || !pdfData) return;

    setIsProcessing(true);
    setSuccess("");
    setError("");

    try {
      const pdf = pdfData;
      const doc = new jsPDF();

      const compressionFactor = QUALITY_OPTIONS[compressionLevel];
      console.log(`Compression Factor: ${compressionFactor}`);

      // Process all pages of the PDF
      const totalPages = pdf.numPages;
      const pages = [];

      console.log(`Total Pages: ${totalPages}`);

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        console.log(`Processing Page ${i}...`);

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        const viewport = page.getViewport({ scale: compressionFactor });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render page on canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        console.log(`Page ${i} rendered successfully.`);
        
        const imgData = canvas.toDataURL("image/jpeg", compressionFactor); // Compressed image
        console.log(`Page ${i} Image Data URL generated.`);

        // Add image to PDF
        doc.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);

        if (i < totalPages) {
          doc.addPage(); // Add page separator for multi-page PDFs
        }

        pages.push(imgData);
      }

      // Save the compressed PDF
      const compressedBlob = doc.output("blob");
      setCompressedPdf(compressedBlob);

      // Calculate size reductions
      setCompressedSize(compressedBlob.size);
      const reduction = Math.round(
        ((originalSize - compressedBlob.size) / originalSize) * 100
      );
      setReductionPercentage(reduction);

      setSuccess("PDF successfully compressed!");
    } catch (err) {
      console.error("Error while compressing the PDF:", err);
      setError("Error while compressing the PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle downloading the compressed PDF
  const handleDownload = () => {
    if (!compressedPdf) return;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(compressedPdf);
    link.download = "compressed.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset the tool
  const handleReset = () => {
    setFile(null);
    setPdfData(null);
    setCompressedPdf(null);
    setCompressionLevel("medium");
    setOriginalSize(0);
    setCompressedSize(0);
    setReductionPercentage(0);
    setError("");
    setSuccess("");
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Upload size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">PDF Compressor</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Compress PDF files online by reducing file size while keeping pages
          easy to view and share. Select your preferred compression level and
          download the compressed PDF.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-[1.4fr_0.8fr] gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">Upload Your PDF</h3>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />

              <p className="mt-3 text-xs text-[var(--text-secondary)]">
                Max file size: 50MB. Only PDF files are allowed.
              </p>
            </div>

            {/* Compression Level */}
            <div className="mt-5">
              <h3 className="font-semibold text-lg">Compression Level</h3>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {["low", "medium", "high"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setCompressionLevel(level)}
                    className={`btn-primary w-full text-sm ${
                      compressionLevel === level
                        ? "bg-[var(--primary)] text-white"
                        : ""
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Compress Button */}
            <div className="mt-5">
              <button
                onClick={compressPDF}
                disabled={isProcessing || !file}
                className={`btn-primary w-full text-sm ${
                  isProcessing || !file ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isProcessing ? "Compressing..." : "Compress PDF"}
              </button>
            </div>

            {/* Reset Button */}
            <div className="mt-3">
              <button
                onClick={handleReset}
                className="btn-secondary w-full text-sm"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mt-5 flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="mt-5 flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* PDF Info */}
            {file && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg">PDF Information</h3>
                </div>
                <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-4">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Original File Size: {formatBytes(originalSize)}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Compression Level: {compressionLevel}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Pages: {pdfData ? pdfData.numPages : "Loading..."}
                  </p>
                </div>
              </div>
            )}

            {/* Compressed PDF Stats */}
            {compressedPdf && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg">Compressed PDF</h3>
                </div>

                <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-4">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Compressed Size: {formatBytes(compressedSize)}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Reduction: {reductionPercentage}%
                  </p>
                </div>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={handleDownload}
                    disabled={!compressedPdf}
                    className="btn-primary w-full text-sm"
                  >
                    <Download size={18} />
                    Download Compressed PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="compress-pdf" />
    </div>
  );
}

// Helper function to format bytes to human-readable form
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  if (!bytes) return "0 B";

  const sizes = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes.length - 1
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${sizes[index]}`;
};