import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  FileImage,
  SlidersHorizontal,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "AVIF to JPG Converter",
  path: "/avif-to-jpg-converter",
  category: "Image Tools",
  description:
    "Convert AVIF images to JPG online for free with quality control and instant download.",
  metaTitle: "AVIF to JPG Converter | Convert AVIF Images to JPG Online Free",
  metaDescription:
    "Convert AVIF images to JPG online for free. Fast browser-based AVIF to JPG converter with image preview, quality control, and instant download.",
};

export default function AvifToJpgConverter() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [convertedUrl, setConvertedUrl] = useState("");
  const [convertedBlob, setConvertedBlob] = useState(null);
  const [convertedName, setConvertedName] = useState("");
  const [quality, setQuality] = useState(90);
  const [imageInfo, setImageInfo] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    };
  }, [originalUrl, convertedUrl]);

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "0 B";

    const sizes = ["B", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${sizes[index]}`;
  };

  const getBaseName = (name) => {
    return name.replace(/\.[^/.]+$/, "");
  };

  const isValidAvifFile = (selectedFile) => {
    const fileName = selectedFile.name.toLowerCase();

    return fileName.endsWith(".avif") || selectedFile.type === "image/avif";
  };

  const clearConvertedOutput = () => {
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
    }

    setConvertedUrl("");
    setConvertedBlob(null);
    setConvertedName("");
  };

  const getSizeChange = () => {
    if (!file || !convertedBlob) return null;

    const difference = convertedBlob.size - file.size;
    const percentage = Math.abs((difference / file.size) * 100).toFixed(1);

    if (difference > 0) return `${percentage}% larger`;
    if (difference < 0) return `${percentage}% smaller`;

    return "Same size";
  };

  const loadImageInfo = (url) => {
    const img = document.createElement("img");

    img.onload = () => {
      setImageInfo({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      setImageInfo(null);
    };

    img.src = url;
  };

  const handleFile = (selectedFile) => {
    setError("");
    setSuccess("");
    clearConvertedOutput();
    setImageInfo(null);

    if (!selectedFile) return;

    if (!isValidAvifFile(selectedFile)) {
      setError("Please upload a valid AVIF image file.");
      return;
    }

    const maxSize = 25 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("File is too large. Please upload an AVIF image under 25MB.");
      return;
    }

    if (originalUrl) {
      URL.revokeObjectURL(originalUrl);
    }

    const newOriginalUrl = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setOriginalUrl(newOriginalUrl);
    setSuccess("AVIF image loaded successfully. Ready to convert.");

    loadImageInfo(newOriginalUrl);
  };

  const handleInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    handleFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const selectedFile = e.dataTransfer.files?.[0];
    handleFile(selectedFile);
  };

  const handleConvert = async () => {
    setError("");
    setSuccess("");

    if (!file || !originalUrl) {
      setError("Please upload an AVIF image first.");
      return;
    }

    setIsConverting(true);
    clearConvertedOutput();

    try {
      const img = document.createElement("img");

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = originalUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas is not supported.");
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const jpgBlob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Could not create JPG file."));
          },
          "image/jpeg",
          quality / 100
        );
      });

      const jpgUrl = URL.createObjectURL(jpgBlob);
      const jpgName = `${getBaseName(file.name)}.jpg`;

      setConvertedBlob(jpgBlob);
      setConvertedUrl(jpgUrl);
      setConvertedName(jpgName);
      setSuccess("Conversion completed successfully. Your JPG is ready.");
    } catch (err) {
      setError(
        "Conversion failed. Your browser may not support AVIF decoding, or the file may be damaged."
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedUrl) return;

    const link = document.createElement("a");
    link.href = convertedUrl;
    link.download = convertedName || "converted-image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    if (originalUrl) {
      URL.revokeObjectURL(originalUrl);
    }

    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
    }

    setFile(null);
    setOriginalUrl("");
    setConvertedUrl("");
    setConvertedBlob(null);
    setConvertedName("");
    setQuality(90);
    setImageInfo(null);
    setIsDragging(false);
    setIsConverting(false);
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* TOOL HEADER */}
      <section className="bg-white border rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <ImageIcon className="w-7 h-7 text-[var(--primary)]" />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-3">AVIF to JPG Converter</h1>
            <p className="text-[var(--text-secondary)]">
              Convert AVIF images to JPG in seconds. Upload your image, adjust
              JPG quality, preview the result, and download instantly.
            </p>
          </div>
        </div>
      </section>

      {/* TOOL BODY */}
      <section className="bg-white border rounded-2xl shadow-sm p-6">
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

          <h2 className="text-xl font-semibold mb-2">Upload AVIF Image</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-5">
            Drag and drop your AVIF image here, or click the button below.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".avif,image/avif"
            onChange={handleInputChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Choose AVIF File
          </button>

          {file && (
            <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">
              Selected: {file.name}
            </p>
          )}
        </div>

        {/* FEEDBACK */}
        {error && (
          <div className="mt-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        {/* SETTINGS */}
        <div className="grid md:grid-cols-2 gap-5 mt-6">
          <div className="border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-semibold">JPG Quality</h3>
            </div>

            <label className="block text-sm font-medium mb-2">
              Quality: {quality}%
            </label>

            <input
              type="range"
              min="40"
              max="100"
              value={quality}
              onChange={(e) => {
                setQuality(Number(e.target.value));
                clearConvertedOutput();
                setSuccess(file ? "Quality changed. Convert again to apply." : "");
              }}
              className="w-full accent-[var(--primary)]"
            />

            <p className="text-sm text-[var(--text-secondary)] mt-3">
              Higher quality gives better image output but can increase the JPG
              file size.
            </p>
          </div>

          <div className="border rounded-2xl p-5 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <FileImage className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-semibold">No Extra Dependency</h3>
            </div>

            <p className="text-sm text-[var(--text-secondary)]">
              This converter uses browser image decoding and canvas export. No
              paid API, backend, or extra package is required.
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={handleConvert}
            disabled={!file || isConverting}
            className={`btn-primary inline-flex items-center justify-center gap-2 ${
              !file || isConverting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Zap className="w-4 h-4" />
            {isConverting ? "Converting..." : "Convert to JPG"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          {convertedUrl && (
            <button
              type="button"
              onClick={handleDownload}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download JPG
            </button>
          )}
        </div>
      </section>

      {/* STATS */}
      {file && (
        <section className="bg-white border rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">File Details</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Original Format
              </p>
              <p className="text-2xl font-bold">AVIF</p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Output Format
              </p>
              <p className="text-2xl font-bold">JPG</p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Original Size
              </p>
              <p className="text-2xl font-bold">{formatBytes(file.size)}</p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Converted Size
              </p>
              <p className="text-2xl font-bold">
                {convertedBlob ? formatBytes(convertedBlob.size) : "-"}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">Dimensions</p>
              <p className="text-xl font-bold">
                {imageInfo
                  ? `${imageInfo.width} × ${imageInfo.height}px`
                  : "Not available"}
              </p>
            </div>

            <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Size Result
              </p>
              <p className="text-xl font-bold">
                {convertedBlob ? getSizeChange() : "Convert first"}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* PREVIEW */}
      {file && (
        <section className="bg-white border rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Preview</h2>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="border rounded-2xl p-5 bg-gray-50">
              <h3 className="font-semibold mb-3">Original AVIF</h3>

              <div className="min-h-64 rounded-2xl border bg-white flex items-center justify-center p-3">
                {originalUrl ? (
                  <img
                    src={originalUrl}
                    alt="Original AVIF Preview"
                    className="max-h-80 w-auto rounded-xl shadow-sm"
                    onError={() => {
                      setImageInfo(null);
                    }}
                  />
                ) : (
                  <div className="text-center p-6">
                    <FileImage className="w-12 h-12 mx-auto mb-3 text-[var(--primary)]" />
                    <p className="text-sm text-[var(--text-secondary)]">
                      Original AVIF preview will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-2xl p-5 bg-gray-50">
              <h3 className="font-semibold mb-3">Converted JPG</h3>

              <div className="min-h-64 rounded-2xl border bg-white flex items-center justify-center p-3">
                {convertedUrl ? (
                  <img
                    src={convertedUrl}
                    alt="Converted JPG Preview"
                    className="max-h-80 w-auto rounded-xl shadow-sm"
                  />
                ) : (
                  <div className="text-center p-6">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 text-[var(--primary)]" />
                    <p className="text-sm text-[var(--text-secondary)]">
                      Converted JPG preview will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SUGGESTED TOOLS */}
      <SuggestedTools currentToolId="avif-to-jpg-converter" />
    </div>
  );
}