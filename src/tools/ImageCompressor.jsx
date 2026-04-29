// src/pages/ImageCompressor.jsx
import { useEffect, useRef, useState } from "react";
import { Upload, Download, RotateCcw, Zap } from "lucide-react";
import Compressor from "compressorjs";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Image Compressor",
  path: "/image-compressor",
  category: "Design Tools",
  description:
    "Compress images directly in your browser with adjustable quality control. Fast, secure, and no server uploads needed.",
  metaTitle: "Image Compressor Tool - Compress Images Online | Next Online Tools",
  metaDescription:
    "Compress images online with quality control. Reduce file size instantly in your browser. Fast, secure, and free.",
};

const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getExtensionFromMime(mimeType) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function getBaseFileName(name = "image") {
  return name.replace(/\.[^/.]+$/, "");
}

function getOutputMime(fileType, outputFormat) {
  if (outputFormat === "jpeg") return "image/jpeg";
  if (outputFormat === "webp") return "image/webp";
  if (outputFormat === "original") return fileType;

  // Auto mode:
  // PNG usually compresses better when converted to JPEG,
  // but transparency will be replaced with a white background.
  if (fileType === "image/png") return "image/jpeg";
  if (fileType === "image/webp") return "image/webp";
  return "image/jpeg";
}

export default function ImageCompressor() {
  const [file, setFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);
  const [compressedData, setCompressedData] = useState(null);

  const [quality, setQuality] = useState(0.7);
  const [maxDimension, setMaxDimension] = useState(1920);
  const [outputFormat, setOutputFormat] = useState("auto");

  const [isCompressing, setIsCompressing] = useState(false);
  const [sizeInfo, setSizeInfo] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (compressedData?.url) URL.revokeObjectURL(compressedData.url);
    };
  }, [originalPreview, compressedData]);

  const clearCompressedOnly = () => {
    if (compressedData?.url) URL.revokeObjectURL(compressedData.url);
    setCompressedData(null);
    setSizeInfo(null);
    setNote("");
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    setError("");
    setNote("");
    clearCompressedOnly();

    if (!selectedFile) return;

    if (!SUPPORTED_TYPES.includes(selectedFile.type)) {
      setFile(null);
      setError("Please upload a JPG, PNG, or WEBP image. GIF/SVG compression is not supported in this tool.");
      return;
    }

    if (originalPreview) URL.revokeObjectURL(originalPreview);

    setFile(selectedFile);
    setOriginalPreview(URL.createObjectURL(selectedFile));
  };

  const handleCompress = () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setIsCompressing(true);
    setError("");
    setNote("");
    clearCompressedOnly();

    const outputMime = getOutputMime(file.type, outputFormat);

    const options = {
      quality,
      mimeType: outputMime,
      checkOrientation: true,
      strict: true,

      // Important:
      // This allows PNG to be converted when needed.
      // Your old convertSize: Infinity disabled this.
      convertTypes: ["image/png"],
      convertSize: 0,

      // If converting transparent PNG to JPEG, fill transparent area with white.
      beforeDraw(context, canvas) {
        if (outputMime === "image/jpeg") {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
      },

      success(result) {
        const compressedBlob = result;
        const compressedUrl = URL.createObjectURL(compressedBlob);

        const outputExt = getExtensionFromMime(compressedBlob.type || outputMime);
        const outputName = `compressed-${getBaseFileName(file.name)}.${outputExt}`;

        const originalBytes = file.size;
        const compressedBytes = compressedBlob.size;

        const rawReduction =
          originalBytes > 0
            ? ((originalBytes - compressedBytes) / originalBytes) * 100
            : 0;

        const reduction = Math.max(0, Math.round(rawReduction));

        setCompressedData({
          url: compressedUrl,
          blob: compressedBlob,
          name: outputName,
          type: compressedBlob.type || outputMime,
        });

        setSizeInfo({
          original: formatSize(originalBytes),
          compressed: formatSize(compressedBytes),
          reduction,
          originalBytes,
          compressedBytes,
        });

        if (compressedBytes >= originalBytes) {
          setNote(
            "This image is already optimized at the current settings. Try lowering quality, changing output format, or using a smaller max dimension."
          );
        } else if (file.type === "image/png" && outputMime === "image/jpeg") {
          setNote(
            "PNG was converted to JPEG for better compression. Transparent areas are filled with white."
          );
        }

        setIsCompressing(false);
      },

      error(err) {
        console.error("Compression Error:", err);
        setError("Failed to compress image. Please try another JPG, PNG, or WEBP file.");
        setIsCompressing(false);
      },
    };

    if (maxDimension > 0) {
      options.maxWidth = maxDimension;
      options.maxHeight = maxDimension;
    }

    new Compressor(file, options);
  };

  const handleDownload = () => {
    if (!compressedData?.url) return;

    const link = document.createElement("a");
    link.href = compressedData.url;
    link.download = compressedData.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetTool = () => {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    if (compressedData?.url) URL.revokeObjectURL(compressedData.url);

    setFile(null);
    setOriginalPreview(null);
    setCompressedData(null);
    setSizeInfo(null);
    setQuality(0.7);
    setMaxDimension(1920);
    setOutputFormat("auto");
    setError("");
    setNote("");

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Zap size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Image Compressor</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Compress images directly in your browser with adjustable quality, output format,
          and resize control. No server upload needed.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <label className="block border-2 border-dashed border-[var(--border)] rounded-2xl p-8 text-center cursor-pointer hover:bg-[#f8f4ff] transition">
          <Upload size={36} className="mx-auto mb-4 text-[var(--primary)]" />
          <h2 className="text-xl font-semibold mb-2">Upload Image</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Select a JPG, PNG, or WEBP image to compress
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </p>
        )}

        {file && (
          <div className="mt-6">
            <div className="grid lg:grid-cols-3 gap-5 mb-6">
              {/* Quality */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  Quality: {Math.round(quality * 100)}%
                </label>

                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => {
                    setQuality(parseFloat(e.target.value));
                    clearCompressedOnly();
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                />

                <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-2">
                  <span>Smaller</span>
                  <span>Better Quality</span>
                </div>
              </div>

              {/* Max Dimension */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  Max Image Size
                </label>

                <select
                  value={maxDimension}
                  onChange={(e) => {
                    setMaxDimension(Number(e.target.value));
                    clearCompressedOnly();
                  }}
                  className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                >
                  <option value={0}>Keep Original Dimension</option>
                  <option value={4096}>Max 4096px</option>
                  <option value={2560}>Max 2560px</option>
                  <option value={1920}>Max 1920px Recommended</option>
                  <option value={1280}>Max 1280px</option>
                  <option value={800}>Max 800px</option>
                </select>
              </div>

              {/* Output Format */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  Output Format
                </label>

                <select
                  value={outputFormat}
                  onChange={(e) => {
                    setOutputFormat(e.target.value);
                    clearCompressedOnly();
                  }}
                  className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                >
                  <option value="auto">Auto Best Compression</option>
                  <option value="original">Keep Original Format</option>
                  <option value="jpeg">Convert to JPG</option>
                  <option value="webp">Convert to WEBP</option>
                </select>
              </div>
            </div>

            <div className="mb-5 text-sm text-[var(--text-secondary)] bg-[#f8f4ff] border border-[var(--border)] rounded-xl p-4">
              <p>
                <strong>File:</strong> {file.name}
              </p>
              <p>
                <strong>Original Size:</strong> {formatSize(file.size)}
              </p>
              <p className="mt-2">
                For stronger compression, use <strong>70% quality</strong>,{" "}
                <strong>Max 1920px</strong>, and <strong>Auto Best Compression</strong>.
              </p>
            </div>

            {!compressedData && (
              <button
                onClick={handleCompress}
                disabled={isCompressing}
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCompressing ? "Compressing..." : "Compress Image"}
              </button>
            )}
          </div>
        )}

        {compressedData && sizeInfo && (
          <>
            <div className="mt-6 grid lg:grid-cols-2 gap-6">
              {/* Original Preview */}
              <div>
                <h3 className="font-semibold mb-3">Original Preview</h3>

                <div className="border border-[var(--border)] rounded-2xl p-4 bg-[#f8f4ff] overflow-hidden">
                  <img
                    src={originalPreview}
                    alt="Original Preview"
                    className="w-full max-h-[280px] rounded-xl object-contain bg-white"
                  />

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-[var(--text-secondary)]">Name:</span>
                      <span className="font-medium text-right break-all">{file.name}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Size:</span>
                      <span className="font-semibold">{sizeInfo.original}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Type:</span>
                      <span className="font-semibold">{file.type}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compressed Preview */}
              <div>
                <h3 className="font-semibold mb-3">Compressed Result</h3>

                <div className="border border-[var(--border)] rounded-2xl p-4 bg-white overflow-hidden">
                  <img
                    src={compressedData.url}
                    alt="Compressed Preview"
                    className="w-full max-h-[280px] rounded-xl object-contain bg-[#f8f4ff]"
                  />

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-[var(--text-secondary)]">Name:</span>
                      <span className="font-medium text-right break-all">
                        {compressedData.name}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Size:</span>
                      <span className="font-semibold text-[var(--primary)]">
                        {sizeInfo.compressed}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Type:</span>
                      <span className="font-semibold">{compressedData.type}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Reduction:</span>
                      <span
                        className={`font-semibold ${
                          sizeInfo.reduction > 0 ? "text-green-600" : "text-orange-500"
                        }`}
                      >
                        {sizeInfo.reduction}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {note && (
              <p className="mt-4 text-sm text-orange-700 bg-orange-50 border border-orange-100 p-3 rounded-lg">
                {note}
              </p>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button onClick={handleDownload} className="btn-primary">
                <Download size={18} />
                Download Compressed
              </button>

              <button
                onClick={handleCompress}
                disabled={isCompressing}
                className="btn-secondary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCompressing ? "Compressing..." : "Compress Again"}
              </button>

              <button onClick={resetTool} className="btn-secondary">
                <RotateCcw size={18} />
                Reset
              </button>
            </div>
          </>
        )}
      </section>

      <SuggestedTools currentToolId="image-compressor" />
    </div>
  );
}