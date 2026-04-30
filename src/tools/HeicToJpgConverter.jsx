import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  Image,
  AlertCircle,
  CheckCircle,
  FileImage,
  SlidersHorizontal,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "HEIC to JPG Converter",
  path: "/heic-to-jpg-converter",
  category: "Image Tools",
  description:
    "Convert HEIC and HEIF images to JPG online for free. Fast, secure, and browser-based.",
  metaTitle: "HEIC to JPG Converter | Convert HEIC Images to JPG Online Free",
  metaDescription:
    "Convert HEIC and HEIF images to JPG online for free. Fast browser-based HEIC to JPG converter with quality control and instant download.",
};

export default function HeicToJpgConverter() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [convertedUrl, setConvertedUrl] = useState("");
  const [convertedBlob, setConvertedBlob] = useState(null);
  const [convertedName, setConvertedName] = useState("");
  const [quality, setQuality] = useState(90);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (convertedUrl) {
        URL.revokeObjectURL(convertedUrl);
      }
    };
  }, [convertedUrl]);

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "0 B";

    const sizes = ["B", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${sizes[index]}`;
  };

  const getBaseName = (name) => {
    return name.replace(/\.[^/.]+$/, "");
  };

  const getSizeChange = () => {
    if (!file || !convertedBlob) return null;

    const difference = convertedBlob.size - file.size;
    const percentage = Math.abs((difference / file.size) * 100).toFixed(1);

    if (difference > 0) {
      return `${percentage}% larger`;
    }

    if (difference < 0) {
      return `${percentage}% smaller`;
    }

    return "Same size";
  };

  const isValidHeicFile = (selectedFile) => {
    const fileName = selectedFile.name.toLowerCase();

    return (
      fileName.endsWith(".heic") ||
      fileName.endsWith(".heif") ||
      selectedFile.type === "image/heic" ||
      selectedFile.type === "image/heif"
    );
  };

  const clearConvertedOutput = () => {
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
    }

    setConvertedUrl("");
    setConvertedBlob(null);
    setConvertedName("");
  };

  const handleFile = (selectedFile) => {
    setError("");
    setSuccess("");
    clearConvertedOutput();

    if (!selectedFile) return;

    if (!isValidHeicFile(selectedFile)) {
      setError("Please upload a valid HEIC or HEIF image file.");
      return;
    }

    const maxSize = 25 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("File is too large. Please upload a HEIC image under 25MB.");
      return;
    }

    setFile(selectedFile);
    setSuccess("HEIC image loaded successfully. Ready to convert.");
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

    if (!file) {
      setError("Please upload a HEIC or HEIF image first.");
      return;
    }

    setIsConverting(true);
    clearConvertedOutput();

    try {
      const heic2anyModule = await import("heic2any");
      const heic2any = heic2anyModule.default;

      const result = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: quality / 100,
      });

      const jpgBlob = Array.isArray(result) ? result[0] : result;
      const jpgUrl = URL.createObjectURL(jpgBlob);
      const jpgName = `${getBaseName(file.name)}.jpg`;

      setConvertedBlob(jpgBlob);
      setConvertedUrl(jpgUrl);
      setConvertedName(jpgName);
      setSuccess("Conversion completed successfully. Your JPG is ready.");
    } catch (err) {
      setError(
        "Conversion failed. Please try another HEIC file. Some damaged HEIC files may not be supported."
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
    clearConvertedOutput();

    setFile(null);
    setQuality(90);
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
            <Image className="w-7 h-7 text-[var(--primary)]" />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-3">HEIC to JPG Converter</h1>
            <p className="text-[var(--text-secondary)]">
              Convert iPhone HEIC and HEIF photos to JPG in seconds. This tool
              works directly in your browser with quality control and instant
              download.
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

          <h2 className="text-xl font-semibold mb-2">Upload HEIC Image</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-5">
            Drag and drop your HEIC or HEIF image here, or click the button
            below.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".heic,.heif,image/heic,image/heif"
            onChange={handleInputChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Choose HEIC File
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
              Higher quality gives better image output but may create a larger
              file size.
            </p>
          </div>

          <div className="border rounded-2xl p-5 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <FileImage className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-semibold">Browser-Based Conversion</h3>
            </div>

            <p className="text-sm text-[var(--text-secondary)]">
              Your image is converted locally in the browser. No backend or paid
              API is required.
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
              <p className="text-2xl font-bold">HEIC</p>
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

          {convertedBlob && (
            <div className="mt-4 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-xl p-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Size result: {getSizeChange()}
              </p>
            </div>
          )}
        </section>
      )}

      {/* PREVIEW */}
      {file && (
        <section className="bg-white border rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Preview</h2>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="border rounded-2xl p-5 bg-gray-50">
              <h3 className="font-semibold mb-3">Original HEIC</h3>

              <div className="min-h-64 rounded-2xl border bg-white flex items-center justify-center p-6 text-center">
                <div>
                  <FileImage className="w-12 h-12 mx-auto mb-3 text-[var(--primary)]" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-2">
                    HEIC preview is not supported in many browsers. Convert it
                    to see the JPG preview.
                  </p>
                </div>
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
                    <Image className="w-12 h-12 mx-auto mb-3 text-[var(--primary)]" />
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
      <SuggestedTools currentToolId="heic-to-jpg-converter" />
    </div>
  );
}