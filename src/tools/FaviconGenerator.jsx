import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  Image as ImageIcon,
  Type,
  Palette,
  Settings2,
  AlertCircle,
  CheckCircle,
  Package,
  Eye,
} from "lucide-react";
import JSZip from "jszip";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Favicon Generator",
  path: "/favicon-generator",
  category: "Image Tools",
  description:
    "Create favicons from your logo or text. Generate multiple favicon sizes and download a ready-to-use favicon package.",
  metaTitle: "Favicon Generator | Create Website Favicon Online Free",
  metaDescription:
    "Create website favicons online for free. Upload your logo or create a text favicon, generate multiple sizes, and download favicon.ico and PNG files.",
};

const PNG_SIZES = [16, 32, 48, 64, 128, 180, 192, 512];
const ICO_SIZES = [16, 32, 48, 64];

const FONT_OPTIONS = [
  "Arial",
  "Inter",
  "Verdana",
  "Georgia",
  "Times New Roman",
  "Trebuchet MS",
  "Courier New",
];

const BACKGROUND_COLORS = [
  { label: "Purple", value: "#9B6CE3" },
  { label: "Dark Purple", value: "#7D4EDB" },
  { label: "Blue", value: "#6EC3E3" },
  { label: "Lavender", value: "#C49BF5" },
  { label: "Dark", value: "#333333" },
  { label: "White", value: "#ffffff" },
];

const TEXT_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Dark", value: "#333333" },
  { label: "Purple", value: "#9B6CE3" },
  { label: "Blue", value: "#6EC3E3" },
];

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image."));
    image.src = url;
  });

const canvasToBlob = (canvas, type = "image/png", quality = 1) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not create image file."));
      },
      type,
      quality
    );
  });

const blobToArrayBuffer = (blob) => blob.arrayBuffer();

const createIcoBlob = async (pngBlobItems) => {
  const images = await Promise.all(
    pngBlobItems.map(async ({ size, blob }) => ({
      size,
      buffer: await blobToArrayBuffer(blob),
    }))
  );

  const headerSize = 6;
  const directorySize = images.length * 16;
  let offset = headerSize + directorySize;

  const totalSize =
    offset + images.reduce((sum, item) => sum + item.buffer.byteLength, 0);

  const icoBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(icoBuffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);

  images.forEach((item, index) => {
    const entryOffset = headerSize + index * 16;
    const imageSize = item.buffer.byteLength;

    view.setUint8(entryOffset, item.size >= 256 ? 0 : item.size);
    view.setUint8(entryOffset + 1, item.size >= 256 ? 0 : item.size);
    view.setUint8(entryOffset + 2, 0);
    view.setUint8(entryOffset + 3, 0);
    view.setUint16(entryOffset + 4, 1, true);
    view.setUint16(entryOffset + 6, 32, true);
    view.setUint32(entryOffset + 8, imageSize, true);
    view.setUint32(entryOffset + 12, offset, true);

    new Uint8Array(icoBuffer, offset, imageSize).set(
      new Uint8Array(item.buffer)
    );

    offset += imageSize;
  });

  return new Blob([icoBuffer], { type: "image/x-icon" });
};

export default function FaviconGenerator() {
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState("logo");
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");

  const [text, setText] = useState("N");
  const [font, setFont] = useState("Arial");
  const [fontWeight, setFontWeight] = useState("700");
  const [backgroundColor, setBackgroundColor] = useState("#9B6CE3");
  const [textColor, setTextColor] = useState("#ffffff");
  const [rounded, setRounded] = useState(false);
  const [padding, setPadding] = useState(12);

  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [icoBlob, setIcoBlob] = useState(null);
  const [zipBlob, setZipBlob] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedModeLabel = mode === "logo" ? "Use Your Logo" : "Create One";

  useEffect(() => {
    return () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
      previewUrls.forEach((item) => URL.revokeObjectURL(item.url));
      if (zipBlob) URL.revokeObjectURL(URL.createObjectURL(zipBlob));
    };
  }, []);

  const clearGenerated = () => {
    previewUrls.forEach((item) => URL.revokeObjectURL(item.url));

    setGeneratedFiles([]);
    setPreviewUrls([]);
    setIcoBlob(null);
    setZipBlob(null);
  };

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  const isValidImageFile = (file) => {
    const validTypes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    return validTypes.includes(file.type);
  };

  const handleLogoFile = (selectedFile) => {
    clearFeedback();
    clearGenerated();

    if (!selectedFile) return;

    if (!isValidImageFile(selectedFile)) {
      setError("Please upload a valid logo file: PNG, JPG, SVG, or WEBP.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("File is too large. Please upload a logo under 5MB.");
      return;
    }

    if (logoUrl) URL.revokeObjectURL(logoUrl);

    const newLogoUrl = URL.createObjectURL(selectedFile);

    setLogoFile(selectedFile);
    setLogoUrl(newLogoUrl);
    setSuccess("Logo uploaded successfully. Ready to generate favicon files.");
  };

  const handleInputChange = (e) => {
    handleLogoFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleLogoFile(e.dataTransfer.files?.[0]);
  };

  const drawRoundedRect = (ctx, x, y, width, height, radius) => {
    const r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  };

  const createLogoCanvas = async (size) => {
    const image = await createImage(logoUrl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Canvas is not supported.");

    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    if (rounded) {
      ctx.save();
      drawRoundedRect(ctx, 0, 0, size, size, size * 0.2);
      ctx.clip();
    }

    const safePadding = Math.round((Number(padding) / 100) * size);
    const maxWidth = size - safePadding * 2;
    const maxHeight = size - safePadding * 2;

    const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
    const drawWidth = image.width * ratio;
    const drawHeight = image.height * ratio;
    const x = (size - drawWidth) / 2;
    const y = (size - drawHeight) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, x, y, drawWidth, drawHeight);

    if (rounded) {
      ctx.restore();
    }

    return canvas;
  };

  const createTextCanvas = async (size) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Canvas is not supported.");

    canvas.width = size;
    canvas.height = size;

    if (rounded) {
      ctx.save();
      drawRoundedRect(ctx, 0, 0, size, size, size * 0.22);
      ctx.clip();
    }

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);

    const safeText = text.trim().slice(0, 3) || "N";
    const fontSize =
      safeText.length === 1
        ? Math.round(size * 0.62)
        : safeText.length === 2
        ? Math.round(size * 0.48)
        : Math.round(size * 0.36);

    ctx.fillStyle = textColor;
    ctx.font = `${fontWeight} ${fontSize}px ${font}, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(safeText, size / 2, size / 2 + size * 0.02);

    if (rounded) {
      ctx.restore();
    }

    return canvas;
  };

  const generatePngBlobs = async () => {
    const items = [];

    for (const size of PNG_SIZES) {
      const canvas =
        mode === "logo" ? await createLogoCanvas(size) : await createTextCanvas(size);

      const blob = await canvasToBlob(canvas, "image/png", 1);

      items.push({
        size,
        name: `favicon-${size}x${size}.png`,
        blob,
      });
    }

    return items;
  };

  const handleGenerate = async () => {
    clearFeedback();
    clearGenerated();

    if (mode === "logo" && !logoUrl) {
      setError("Please upload your logo first.");
      return;
    }

    if (mode === "text" && !text.trim()) {
      setError("Please enter text or initials first.");
      return;
    }

    setIsGenerating(true);

    try {
      const pngItems = await generatePngBlobs();

      const icoItems = pngItems.filter((item) => ICO_SIZES.includes(item.size));
      const faviconIco = await createIcoBlob(icoItems);

      const zip = new JSZip();

      pngItems.forEach((item) => {
        zip.file(item.name, item.blob);
      });

      zip.file("favicon.ico", faviconIco);

      const htmlCode = `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png">`;

      zip.file("favicon-html-code.txt", htmlCode);

      const packageBlob = await zip.generateAsync({ type: "blob" });

      const previews = pngItems.map((item) => ({
        size: item.size,
        url: URL.createObjectURL(item.blob),
      }));

      setGeneratedFiles(pngItems);
      setPreviewUrls(previews);
      setIcoBlob(faviconIco);
      setZipBlob(packageBlob);
      setSuccess("Favicon package generated successfully.");
    } catch (err) {
      setError("Could not generate favicon files. Please try another image or text.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadBlob = (blob, filename) => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = () => {
    downloadBlob(zipBlob, "favicon-package.zip");
  };

  const handleDownloadIco = () => {
    downloadBlob(icoBlob, "favicon.ico");
  };

  const handleReset = () => {
    if (logoUrl) URL.revokeObjectURL(logoUrl);

    clearGenerated();

    setMode("logo");
    setLogoFile(null);
    setLogoUrl("");
    setText("N");
    setFont("Arial");
    setFontWeight("700");
    setBackgroundColor("#9B6CE3");
    setTextColor("#ffffff");
    setRounded(false);
    setPadding(12);
    setIsGenerating(false);
    setIsDragging(false);
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const packageStats = useMemo(() => {
    const pngCount = generatedFiles.length;
    const icoCount = icoBlob ? 1 : 0;
    const totalFiles = pngCount + icoCount + (zipBlob ? 1 : 0);

    return {
      pngCount,
      icoCount,
      totalFiles,
    };
  }, [generatedFiles, icoBlob, zipBlob]);

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <ImageIcon size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Favicon Generator</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Create favicons for your website using your logo or custom text.
          Generate favicon.ico and multiple PNG sizes in one ready-to-use
          favicon package.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* MODE SELECTOR */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode("logo");
                  clearGenerated();
                  clearFeedback();
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  mode === "logo"
                    ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/10"
                    : "border-[var(--border)] bg-white"
                }`}
              >
                <Upload size={22} className="text-[var(--primary)] mb-2" />
                <h3 className="font-semibold">Use Your Logo</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Upload logo and generate favicon files.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("text");
                  clearGenerated();
                  clearFeedback();
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  mode === "text"
                    ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/10"
                    : "border-[var(--border)] bg-white"
                }`}
              >
                <Type size={22} className="text-[var(--primary)] mb-2" />
                <h3 className="font-semibold">Create One</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Type text and design your favicon.
                </p>
              </button>
            </div>

            {/* LOGO MODE */}
            {mode === "logo" && (
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

                <h2 className="text-xl font-semibold mb-2">Upload Logo</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-5">
                  Upload PNG, JPG, SVG, or WEBP. Transparent PNG or SVG gives
                  the best favicon result.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleInputChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Upload size={18} />
                  Choose Logo
                </button>

                {logoFile && (
                  <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">
                    Selected: {logoFile.name}
                  </p>
                )}
              </div>
            )}

            {/* TEXT MODE */}
            {mode === "text" && (
              <div className="border border-[var(--border)] rounded-2xl p-5 bg-[#f8f4ff]">
                <div className="flex items-center gap-2 mb-4">
                  <Type size={20} className="text-[var(--primary)]" />
                  <h3 className="font-semibold">Create Text Favicon</h3>
                </div>

                <label className="block text-sm font-semibold mb-2">
                  Text / Initials
                </label>

                <input
                  type="text"
                  value={text}
                  maxLength={3}
                  onChange={(e) => {
                    setText(e.target.value);
                    clearGenerated();
                  }}
                  placeholder="N"
                  className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                />

                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Font
                    </label>

                    <select
                      value={font}
                      onChange={(e) => {
                        setFont(e.target.value);
                        clearGenerated();
                      }}
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                    >
                      {FONT_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Font Weight
                    </label>

                    <select
                      value={fontWeight}
                      onChange={(e) => {
                        setFontWeight(e.target.value);
                        clearGenerated();
                      }}
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                    >
                      <option value="400">Regular</option>
                      <option value="600">Semi Bold</option>
                      <option value="700">Bold</option>
                      <option value="800">Extra Bold</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Favicon Settings</h3>
              </div>

              {mode === "text" && (
                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Background Color
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {BACKGROUND_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => {
                            setBackgroundColor(color.value);
                            clearGenerated();
                          }}
                          className={`border rounded-xl px-2 py-2 text-xs font-medium ${
                            backgroundColor === color.value
                              ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                              : "border-gray-200"
                          }`}
                        >
                          <span
                            className="inline-block w-4 h-4 rounded-full border mr-1 align-middle"
                            style={{ backgroundColor: color.value }}
                          />
                          {color.label}
                        </button>
                      ))}
                    </div>

                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => {
                        setBackgroundColor(e.target.value);
                        clearGenerated();
                      }}
                      className="w-full h-11 border rounded-xl p-1 bg-white mt-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Text Color
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      {TEXT_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => {
                            setTextColor(color.value);
                            clearGenerated();
                          }}
                          className={`border rounded-xl px-2 py-2 text-xs font-medium ${
                            textColor === color.value
                              ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                              : "border-gray-200"
                          }`}
                        >
                          <span
                            className="inline-block w-4 h-4 rounded-full border mr-1 align-middle"
                            style={{ backgroundColor: color.value }}
                          />
                          {color.label}
                        </button>
                      ))}
                    </div>

                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => {
                        setTextColor(e.target.value);
                        clearGenerated();
                      }}
                      className="w-full h-11 border rounded-xl p-1 bg-white mt-3"
                    />
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rounded}
                    onChange={(e) => {
                      setRounded(e.target.checked);
                      clearGenerated();
                    }}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                  Rounded favicon shape
                </label>

                {mode === "logo" && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Logo Padding: {padding}%
                    </label>

                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={padding}
                      onChange={(e) => {
                        setPadding(Number(e.target.value));
                        clearGenerated();
                      }}
                      className="w-full accent-[var(--primary)]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  isGenerating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Zap size={18} />
                {isGenerating ? "Generating..." : "Generate Favicon"}
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
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* LIVE MAIN PREVIEW */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Preview</h2>
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-5 bg-gray-50 min-h-[220px] flex items-center justify-center">
                {mode === "logo" && logoUrl ? (
                  <div className="text-center">
                    <div className="w-28 h-28 mx-auto rounded-2xl border bg-white flex items-center justify-center p-3 overflow-hidden">
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-3">
                      Logo preview
                    </p>
                  </div>
                ) : mode === "text" ? (
                  <div className="text-center">
                    <div
                      className={`w-28 h-28 mx-auto border flex items-center justify-center ${
                        rounded ? "rounded-3xl" : "rounded-xl"
                      }`}
                      style={{ backgroundColor }}
                    >
                      <span
                        style={{
                          color: textColor,
                          fontFamily: font,
                          fontWeight,
                        }}
                        className="text-5xl leading-none"
                      >
                        {(text.trim() || "N").slice(0, 3)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-3">
                      Text favicon preview
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon size={42} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-[var(--text-secondary)]">
                      Upload a logo or create a text favicon.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* GENERATED PREVIEWS */}
            <div>
              <div className="flex justify-between items-start gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Package size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-semibold">Generated Files</h2>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Mode: {selectedModeLabel}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={!zipBlob}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    zipBlob
                      ? "bg-white text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary)]/5"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                >
                  <Download size={14} />
                  ZIP
                </button>
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-4 bg-[#f8f4ff]">
                {previewUrls.length ? (
                  <div className="grid grid-cols-4 gap-3">
                    {previewUrls.map((item) => (
                      <div
                        key={item.size}
                        className="bg-white border border-[var(--border)] rounded-xl p-3 text-center"
                      >
                        <div className="h-14 flex items-center justify-center">
                          <img
                            src={item.url}
                            alt={`${item.size} favicon`}
                            width={Math.min(item.size, 48)}
                            height={Math.min(item.size, 48)}
                            className="object-contain"
                          />
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-2">
                          {item.size}×{item.size}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-[var(--text-secondary)]">
                      Generated favicon sizes will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* DOWNLOAD BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={!zipBlob}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !zipBlob ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download Package
              </button>

              <button
                type="button"
                onClick={handleDownloadIco}
                disabled={!icoBlob}
                className={`btn-secondary flex-1 inline-flex items-center justify-center gap-2 ${
                  !icoBlob ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download ICO
              </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-[var(--border)] rounded-2xl p-4 text-center">
                <p className="text-xs text-[var(--text-secondary)]">PNG Files</p>
                <p className="text-xl font-bold text-[var(--primary)]">
                  {packageStats.pngCount}
                </p>
              </div>

              <div className="bg-white border border-[var(--border)] rounded-2xl p-4 text-center">
                <p className="text-xs text-[var(--text-secondary)]">ICO File</p>
                <p className="text-xl font-bold text-[var(--primary)]">
                  {packageStats.icoCount}
                </p>
              </div>

              <div className="bg-white border border-[var(--border)] rounded-2xl p-4 text-center">
                <p className="text-xs text-[var(--text-secondary)]">Sizes</p>
                <p className="text-xl font-bold text-green-600">
                  {PNG_SIZES.length}
                </p>
              </div>
            </div>

            {/* NOTE */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-sm text-yellow-800">
                This tool creates standard favicon PNG sizes and a favicon.ico
                file. Add the generated files to your website root or public
                folder, then use the HTML code included in the ZIP package.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="favicon-generator" />
    </div>
  );
}