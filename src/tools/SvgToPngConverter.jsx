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
  Settings2,
  Palette,
  Maximize,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "SVG to PNG Converter",
  path: "/svg-to-png-converter",
  category: "Image Tools",
  description:
    "Convert SVG files to PNG online for free. Upload SVG, choose output size and background, then download PNG instantly.",
  metaTitle: "SVG to PNG Converter | Convert SVG to PNG Online Free",
  metaDescription:
    "Convert SVG files to PNG online for free. Fast browser-based SVG to PNG converter with custom size, scale, transparent background, and instant download.",
};

export default function SvgToPngConverter() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [svgText, setSvgText] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [pngUrl, setPngUrl] = useState("");
  const [pngBlob, setPngBlob] = useState(null);
  const [pngName, setPngName] = useState("");

  const [originalWidth, setOriginalWidth] = useState(512);
  const [originalHeight, setOriginalHeight] = useState(512);
  const [outputWidth, setOutputWidth] = useState(512);
  const [outputHeight, setOutputHeight] = useState(512);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [scale, setScale] = useState(1);
  const [backgroundMode, setBackgroundMode] = useState("transparent");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (pngUrl) URL.revokeObjectURL(pngUrl);
    };
  }, [originalUrl, pngUrl]);

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

  const getBaseName = (name) => {
    return name.replace(/\.[^/.]+$/, "");
  };

  const clearOutput = () => {
    if (pngUrl) {
      URL.revokeObjectURL(pngUrl);
    }

    setPngUrl("");
    setPngBlob(null);
    setPngName("");
  };

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  const isValidSvgFile = (selectedFile) => {
    return (
      selectedFile.type === "image/svg+xml" ||
      selectedFile.name.toLowerCase().endsWith(".svg")
    );
  };

  const parseNumber = (value) => {
    if (!value) return null;

    const stringValue = String(value).trim();

    if (stringValue.includes("%")) return null;

    const parsed = parseFloat(stringValue);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const getSvgDimensions = (text) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "image/svg+xml");
      const svg = doc.querySelector("svg");

      if (!svg) {
        return { width: 512, height: 512 };
      }

      const width = parseNumber(svg.getAttribute("width"));
      const height = parseNumber(svg.getAttribute("height"));
      const viewBox = svg.getAttribute("viewBox");

      if (width && height) {
        return {
          width: Math.round(width),
          height: Math.round(height),
        };
      }

      if (viewBox) {
        const values = viewBox
          .trim()
          .split(/[\s,]+/)
          .map((value) => Number(value));

        if (values.length === 4 && values[2] > 0 && values[3] > 0) {
          return {
            width: Math.round(values[2]),
            height: Math.round(values[3]),
          };
        }
      }

      if (width && !height) {
        return {
          width: Math.round(width),
          height: Math.round(width),
        };
      }

      if (!width && height) {
        return {
          width: Math.round(height),
          height: Math.round(height),
        };
      }

      return { width: 512, height: 512 };
    } catch {
      return { width: 512, height: 512 };
    }
  };

  const normalizeSvgText = (text) => {
    let normalized = text.trim();

    if (!normalized.includes("xmlns=")) {
      normalized = normalized.replace(
        "<svg",
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
    }

    return normalized;
  };

  const loadImageFromSvg = (text) => {
    return new Promise((resolve, reject) => {
      const svgBlob = new Blob([normalizeSvgText(text)], {
        type: "image/svg+xml;charset=utf-8",
      });

      const url = URL.createObjectURL(svgBlob);
      const image = new window.Image();

      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not load SVG image."));
      };

      image.src = url;
    });
  };

  const handleFile = (selectedFile) => {
    clearFeedback();
    clearOutput();

    if (!selectedFile) return;

    if (!isValidSvgFile(selectedFile)) {
      setError("Please upload a valid SVG file.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("File is too large. Please upload an SVG file under 5MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = String(reader.result || "");

        if (!text.includes("<svg")) {
          setError("This file does not look like a valid SVG file.");
          return;
        }

        if (originalUrl) {
          URL.revokeObjectURL(originalUrl);
        }

        const svgBlob = new Blob([normalizeSvgText(text)], {
          type: "image/svg+xml;charset=utf-8",
        });

        const newOriginalUrl = URL.createObjectURL(svgBlob);
        const dimensions = getSvgDimensions(text);

        setFile(selectedFile);
        setSvgText(text);
        setOriginalUrl(newOriginalUrl);
        setOriginalWidth(dimensions.width);
        setOriginalHeight(dimensions.height);
        setOutputWidth(dimensions.width);
        setOutputHeight(dimensions.height);
        setScale(1);
        setSuccess("SVG uploaded successfully. Ready to convert.");
      } catch {
        setError("Could not read this SVG file. Please try another file.");
      }
    };

    reader.onerror = () => {
      setError("Failed to read the SVG file.");
    };

    reader.readAsText(selectedFile);
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

  const handleWidthChange = (value) => {
    const width = Math.max(1, Number(value) || 1);
    setOutputWidth(width);
    clearOutput();

    if (keepAspectRatio && originalWidth && originalHeight) {
      const ratio = originalHeight / originalWidth;
      setOutputHeight(Math.round(width * ratio));
    }
  };

  const handleHeightChange = (value) => {
    const height = Math.max(1, Number(value) || 1);
    setOutputHeight(height);
    clearOutput();

    if (keepAspectRatio && originalWidth && originalHeight) {
      const ratio = originalWidth / originalHeight;
      setOutputWidth(Math.round(height * ratio));
    }
  };

  const handleConvert = async () => {
    clearFeedback();
    clearOutput();

    if (!file || !svgText) {
      setError("Please upload an SVG file first.");
      return;
    }

    const width = Math.max(1, Number(outputWidth) || originalWidth || 512);
    const height = Math.max(1, Number(outputHeight) || originalHeight || 512);
    const finalScale = Math.max(1, Number(scale) || 1);

    const finalWidth = Math.round(width * finalScale);
    const finalHeight = Math.round(height * finalScale);

    if (finalWidth > 8000 || finalHeight > 8000) {
      setError("Output size is too large. Please use a smaller size or scale.");
      return;
    }

    setIsConverting(true);

    try {
      const image = await loadImageFromSvg(svgText);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas is not supported.");
      }

      canvas.width = finalWidth;
      canvas.height = finalHeight;

      if (backgroundMode !== "transparent") {
        ctx.fillStyle =
          backgroundMode === "white" ? "#ffffff" : backgroundColor;
        ctx.fillRect(0, 0, finalWidth, finalHeight);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, finalWidth, finalHeight);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((pngBlob) => {
          if (pngBlob) resolve(pngBlob);
          else reject(new Error("Could not create PNG."));
        }, "image/png");
      });

      const url = URL.createObjectURL(blob);
      const name = `${getBaseName(file.name)}-${finalWidth}x${finalHeight}.png`;

      setPngBlob(blob);
      setPngUrl(url);
      setPngName(name);
      setSuccess("SVG converted to PNG successfully.");
    } catch {
      setError(
        "Conversion failed. For best results, use a self-contained SVG without external images, scripts, or remote fonts."
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!pngUrl) return;

    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = pngName || "converted-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (pngUrl) URL.revokeObjectURL(pngUrl);

    setFile(null);
    setSvgText("");
    setOriginalUrl("");
    setPngUrl("");
    setPngBlob(null);
    setPngName("");
    setOriginalWidth(512);
    setOriginalHeight(512);
    setOutputWidth(512);
    setOutputHeight(512);
    setKeepAspectRatio(true);
    setScale(1);
    setBackgroundMode("transparent");
    setBackgroundColor("#ffffff");
    setIsDragging(false);
    setIsConverting(false);
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getSizeChange = () => {
    if (!file || !pngBlob) return "-";

    const difference = pngBlob.size - file.size;
    const percentage = Math.abs((difference / file.size) * 100).toFixed(1);

    if (difference > 0) return `${percentage}% larger`;
    if (difference < 0) return `${percentage}% smaller`;

    return "Same size";
  };

  const finalOutputWidth = Math.round(
    Math.max(1, Number(outputWidth) || originalWidth || 512) *
      Math.max(1, Number(scale) || 1)
  );

  const finalOutputHeight = Math.round(
    Math.max(1, Number(outputHeight) || originalHeight || 512) *
      Math.max(1, Number(scale) || 1)
  );

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <FileImage size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">SVG to PNG Converter</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Convert SVG files into high-quality PNG images. Upload your SVG,
          choose output size, scale, and background, then download instantly.
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

              <h2 className="text-xl font-semibold mb-2">Upload SVG File</h2>

              <p className="text-sm text-[var(--text-secondary)] mb-5">
                Drag and drop your SVG file here, or click the button below.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,image/svg+xml"
                onChange={handleInputChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Upload size={18} />
                Choose SVG File
              </button>

              {file && (
                <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {/* SETTINGS */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Output Settings</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Width px
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={outputWidth}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Height px
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={outputHeight}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm font-medium cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={keepAspectRatio}
                  onChange={(e) => {
                    setKeepAspectRatio(e.target.checked);
                    clearOutput();
                  }}
                  className="w-4 h-4 accent-[var(--primary)]"
                />
                Keep original aspect ratio
              </label>

              <div className="mt-5">
                <label className="block text-sm font-semibold mb-2">
                  Scale
                </label>

                <select
                  value={scale}
                  onChange={(e) => {
                    setScale(Number(e.target.value));
                    clearOutput();
                  }}
                  className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                >
                  <option value={1}>1x - Normal</option>
                  <option value={2}>2x - Retina</option>
                  <option value={3}>3x - High Resolution</option>
                  <option value={4}>4x - Ultra High Resolution</option>
                </select>
              </div>

              <div className="mt-5 bg-[#f8f4ff] border border-[var(--border)] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Maximize size={18} className="text-[var(--primary)]" />
                  <p className="font-semibold">Final Output Size</p>
                </div>

                <p className="text-sm text-[var(--text-secondary)]">
                  {finalOutputWidth} × {finalOutputHeight}px
                </p>
              </div>
            </div>

            {/* BACKGROUND */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Palette size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Background</h3>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBackgroundMode("transparent");
                    clearOutput();
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                    backgroundMode === "transparent"
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                      : "border-[var(--border)] bg-white"
                  }`}
                >
                  Transparent
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBackgroundMode("white");
                    clearOutput();
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                    backgroundMode === "white"
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                      : "border-[var(--border)] bg-white"
                  }`}
                >
                  White
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBackgroundMode("custom");
                    clearOutput();
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                    backgroundMode === "custom"
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                      : "border-[var(--border)] bg-white"
                  }`}
                >
                  Custom
                </button>
              </div>

              {backgroundMode === "custom" && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2">
                    Custom Color
                  </label>

                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => {
                      setBackgroundColor(e.target.value);
                      clearOutput();
                    }}
                    className="w-full h-12 border rounded-xl p-1 bg-white"
                  />
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleConvert}
                disabled={!file || isConverting}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !file || isConverting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Zap size={18} />
                {isConverting ? "Converting..." : "Convert to PNG"}
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
                For best results, use a self-contained SVG file. SVGs with
                external images, scripts, or remote fonts may not convert
                correctly in the browser.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* PREVIEW */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Preview</h2>
              </div>

              <div className="grid gap-5">
                <div className="border border-[var(--border)] rounded-2xl p-5 bg-gray-50">
                  <h3 className="font-semibold mb-3">Original SVG</h3>

                  <div className="min-h-72 rounded-2xl border bg-white flex items-center justify-center p-4">
                    {originalUrl ? (
                      <img
                        src={originalUrl}
                        alt="Original SVG preview"
                        className="max-h-80 w-auto object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <FileImage
                          size={42}
                          className="mx-auto mb-3 text-gray-300"
                        />
                        <p className="text-[var(--text-secondary)]">
                          SVG preview will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-[var(--border)] rounded-2xl p-5 bg-gray-50">
                  <h3 className="font-semibold mb-3">Converted PNG</h3>

                  <div
                    className="min-h-72 rounded-2xl border flex items-center justify-center p-4"
                    style={{
                      background:
                        backgroundMode === "transparent"
                          ? "linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)"
                          : "#ffffff",
                      backgroundSize: "20px 20px",
                      backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                    }}
                  >
                    {pngUrl ? (
                      <img
                        src={pngUrl}
                        alt="Converted PNG preview"
                        className="max-h-80 w-auto object-contain rounded-xl shadow-sm"
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon
                          size={42}
                          className="mx-auto mb-3 text-gray-300"
                        />
                        <p className="text-[var(--text-secondary)]">
                          Converted PNG preview will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* DOWNLOAD */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!pngUrl}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !pngUrl ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download PNG
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
              <StatCard
                label="Original Size"
                value={file ? formatBytes(file.size) : "-"}
              />

              <StatCard
                label="PNG Size"
                value={pngBlob ? formatBytes(pngBlob.size) : "-"}
              />

              <StatCard
                label="Original Dimensions"
                value={file ? `${originalWidth} × ${originalHeight}` : "-"}
              />

              <StatCard
                label="Output Dimensions"
                value={pngUrl ? `${finalOutputWidth} × ${finalOutputHeight}` : "-"}
              />

              <StatCard label="Format" value="PNG" />

              <StatCard label="Size Result" value={getSizeChange()} green />
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="svg-to-png-converter" />
    </div>
  );
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