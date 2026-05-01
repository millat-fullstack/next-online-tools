import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Copy,
  FileText,
  Languages,
  ScanText,
  Settings2,
  Wand2,
  Sparkles,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Image to Text Converter",
  path: "/image-to-text-converter",
  category: "Image Tools",
  description:
    "Extract text from images online using OCR. Upload an image and convert it into editable text.",
  metaTitle: "Image to Text Converter | Extract Text from Images Online Free",
  metaDescription:
    "Convert images to editable text online for free. Upload JPG, PNG, WEBP, BMP, or GIF images and extract text using browser-based OCR.",
};

export default function ImageToTextConverter() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [extractedText, setExtractedText] = useState("");

  const [language, setLanguage] = useState("eng");
  const [ocrArea, setOcrArea] = useState("full");
  const [ocrMode, setOcrMode] = useState("auto");
  const [enhanceImage, setEnhanceImage] = useState(true);

  const [progress, setProgress] = useState(0);
  const [confidence, setConfidence] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

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

  const isValidImageFile = (selectedFile) => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/bmp",
      "image/gif",
    ];

    return validTypes.includes(selectedFile.type);
  };

  const clearResult = () => {
    setExtractedText("");
    setConfidence(null);
    setProgress(0);
  };

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  const handleFile = (selectedFile) => {
    clearFeedback();
    clearResult();

    if (!selectedFile) return;

    if (!isValidImageFile(selectedFile)) {
      setError("Please upload a valid image file: JPG, PNG, WEBP, BMP, or GIF.");
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("File is too large. Please upload an image under 10MB.");
      return;
    }

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    const newImageUrl = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setImageUrl(newImageUrl);
    setSuccess("Image uploaded successfully. Ready to extract text.");
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

  const applyPreset = (type) => {
    clearResult();
    clearFeedback();

    if (type === "poster") {
      setOcrArea("top");
      setOcrMode("poster");
      setEnhanceImage(true);
      setSuccess("Poster preset applied. Extract again to apply.");
      return;
    }

    if (type === "document") {
      setOcrArea("full");
      setOcrMode("document");
      setEnhanceImage(true);
      setSuccess("Document preset applied. Extract again to apply.");
      return;
    }

    setOcrArea("full");
    setOcrMode("auto");
    setEnhanceImage(true);
    setSuccess("Auto preset applied. Extract again to apply.");
  };

  const getTesseractLanguage = () => {
    if (language.includes("+")) {
      return language.split("+");
    }

    return language;
  };

  const getCropSettings = (img) => {
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = img.naturalWidth;
    let sourceHeight = img.naturalHeight;

    if (ocrArea === "top") {
      sourceY = 0;
      sourceHeight =
        ocrMode === "poster"
          ? Math.round(img.naturalHeight * 0.38)
          : Math.round(img.naturalHeight * 0.55);
    }

    if (ocrArea === "middle") {
      sourceY = Math.round(img.naturalHeight * 0.25);
      sourceHeight = Math.round(img.naturalHeight * 0.5);
    }

    if (ocrArea === "bottom") {
      sourceY = Math.round(img.naturalHeight * 0.55);
      sourceHeight = Math.round(img.naturalHeight * 0.45);
    }

    return {
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
    };
  };

  const preprocessImageForOCR = async () => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");

      img.onload = () => {
        try {
          const { sourceX, sourceY, sourceWidth, sourceHeight } =
            getCropSettings(img);

          const scale = ocrMode === "poster" ? 3 : 2;

          const canvas = document.createElement("canvas");
          canvas.width = sourceWidth * scale;
          canvas.height = sourceHeight * scale;

          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Canvas is not supported."));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            canvas.width,
            canvas.height
          );

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
            const colorSpread = Math.max(r, g, b) - Math.min(r, g, b);

            if (ocrMode === "poster") {
              const likelyWhiteText =
                brightness > 175 &&
                r > 150 &&
                g > 150 &&
                b > 150 &&
                colorSpread < 120;

              if (likelyWhiteText) {
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
              } else {
                data[i] = 255;
                data[i + 1] = 255;
                data[i + 2] = 255;
              }
            } else if (ocrMode === "document") {
              const threshold = 165;
              const value = brightness > threshold ? 255 : 0;

              data[i] = value;
              data[i + 1] = value;
              data[i + 2] = value;
            } else if (enhanceImage) {
              let gray = brightness;

              gray = (gray - 128) * 1.45 + 128;
              gray = Math.max(0, Math.min(255, gray));

              data[i] = gray;
              data[i + 1] = gray;
              data[i + 2] = gray;
            }
          }

          if (enhanceImage || ocrMode !== "auto") {
            ctx.putImageData(imageData, 0, 0);
          }

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Could not preprocess image."));
                return;
              }

              resolve(blob);
            },
            "image/png",
            1
          );
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error("Could not load image for OCR."));
      };

      img.src = imageUrl;
    });
  };

  const cleanExtractedText = (text) => {
    return text
      .replace(/[|_~`^{}\[\]\\]/g, "")
      .replace(/[^\S\r\n]+/g, " ")
      .replace(/\n\s+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\s+|\s+$/g, "");
  };

  const getPageSegMode = () => {
    if (ocrMode === "poster") return "6";
    if (ocrMode === "document") return "3";
    return "11";
  };

  const handleExtractText = async () => {
    clearFeedback();
    clearResult();

    if (!file || !imageUrl) {
      setError("Please upload an image first.");
      return;
    }

    setIsProcessing(true);

    let worker = null;

    try {
      const { createWorker } = await import("tesseract.js");

      const processedImage = await preprocessImageForOCR();

      worker = await createWorker(getTesseractLanguage(), 1, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            setProgress(Math.round(message.progress * 100));
          }
        },
      });

      await worker.setParameters({
        tessedit_pageseg_mode: getPageSegMode(),
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
      });

      const result = await worker.recognize(processedImage);

      const rawText = result?.data?.text || "";
      const resultConfidence = result?.data?.confidence;
      const cleanedText = cleanExtractedText(rawText);

      if (!cleanedText) {
        setError(
          "No readable text was found. Try a clearer image, different OCR mode, or another OCR area."
        );
        return;
      }

      setExtractedText(cleanedText);
      setConfidence(
        typeof resultConfidence === "number"
          ? Math.round(resultConfidence)
          : null
      );
      setProgress(100);
      setSuccess("Text extracted successfully.");
    } catch (err) {
      setError(
        "Text extraction failed. Try another OCR mode, language, or clearer image."
      );
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // Ignore termination error
        }
      }

      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!extractedText) return;

    try {
      await navigator.clipboard.writeText(extractedText);
      setSuccess("Extracted text copied to clipboard.");
      setError("");
    } catch {
      setError("Could not copy text. Please copy it manually.");
    }
  };

  const handleDownload = () => {
    if (!extractedText) return;

    const blob = new Blob([extractedText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "extracted-text.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    setFile(null);
    setImageUrl("");
    setExtractedText("");

    setLanguage("eng");
    setOcrArea("full");
    setOcrMode("auto");
    setEnhanceImage(true);

    setProgress(0);
    setConfidence(null);

    setIsDragging(false);
    setIsProcessing(false);

    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const wordCount = extractedText.trim()
    ? extractedText.trim().split(/\s+/).length
    : 0;

  const characterCount = extractedText.length;

  const lineCount = extractedText.trim()
    ? extractedText.split(/\n+/).filter(Boolean).length
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* TOOL HEADER */}
      <section className="bg-white border rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <ScanText className="w-7 h-7 text-[var(--primary)]" />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-3">
              Image to Text Converter
            </h1>
            <p className="text-[var(--text-secondary)]">
              Upload an image and extract editable text using OCR. Works with
              screenshots, posters, documents, banners, JPG, PNG, WEBP, BMP, and
              GIF images.
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

          <h2 className="text-xl font-semibold mb-2">Upload Image</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-5">
            Drag and drop your image here, or click the button below.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/bmp,image/gif"
            onChange={handleInputChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Choose Image
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

        {/* QUICK PRESETS */}
        <div className="mt-6 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="font-semibold">Quick Presets</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => applyPreset("auto")}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              Auto OCR
            </button>

            <button
              type="button"
              onClick={() => applyPreset("poster")}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              Poster / Banner Text
            </button>

            <button
              type="button"
              onClick={() => applyPreset("document")}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              Document / Screenshot
            </button>
          </div>

          <p className="text-sm text-[var(--text-secondary)] mt-3">
            For your World Tourism Day image, choose{" "}
            <strong>Poster / Banner Text</strong>, keep language as{" "}
            <strong>English</strong>, then extract again.
          </p>
        </div>

        {/* SETTINGS */}
        <div className="grid lg:grid-cols-4 gap-5 mt-6">
          <div className="border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Languages className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-semibold">OCR Language</h3>
            </div>

            <label className="block text-sm font-medium mb-2">
              Select language
            </label>

            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                clearResult();
                setSuccess(file ? "Language changed. Extract again to apply." : "");
                setError("");
              }}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            >
              <option value="eng">English</option>
              <option value="ita">Italian</option>
              <option value="eng+ita">English + Italian</option>
              <option value="ben">Bangla</option>
              <option value="hin">Hindi</option>
              <option value="ara">Arabic</option>
            </select>

            <p className="text-sm text-[var(--text-secondary)] mt-3">
              Select the language used in your image for better accuracy.
            </p>
          </div>

          <div className="border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-semibold">OCR Area</h3>
            </div>

            <label className="block text-sm font-medium mb-2">
              Select scan area
            </label>

            <select
              value={ocrArea}
              onChange={(e) => {
                setOcrArea(e.target.value);
                clearResult();
                setSuccess(file ? "OCR area changed. Extract again to apply." : "");
                setError("");
              }}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            >
              <option value="full">Full Image</option>
              <option value="top">Top Text Area</option>
              <option value="middle">Middle Area</option>
              <option value="bottom">Bottom Area</option>
            </select>

            <p className="text-sm text-[var(--text-secondary)] mt-3">
              Use top area for posters where the main heading is at the top.
            </p>
          </div>

          <div className="border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-semibold">OCR Mode</h3>
            </div>

            <label className="block text-sm font-medium mb-2">
              Select OCR mode
            </label>

            <select
              value={ocrMode}
              onChange={(e) => {
                setOcrMode(e.target.value);
                clearResult();
                setSuccess(file ? "OCR mode changed. Extract again to apply." : "");
                setError("");
              }}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            >
              <option value="auto">Auto / Normal Text</option>
              <option value="poster">Poster / Heading Text</option>
              <option value="document">Document / Paragraph Text</option>
            </select>

            <p className="text-sm text-[var(--text-secondary)] mt-3">
              Poster mode is best for large white text on colorful backgrounds.
            </p>
          </div>

          <div className="border rounded-2xl p-5 bg-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-semibold">Enhancement</h3>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="enhanceImage"
                type="checkbox"
                checked={enhanceImage}
                onChange={(e) => {
                  setEnhanceImage(e.target.checked);
                  clearResult();
                  setSuccess(
                    file ? "Enhancement changed. Extract again to apply." : ""
                  );
                  setError("");
                }}
                className="w-4 h-4 accent-[var(--primary)]"
              />

              <label htmlFor="enhanceImage" className="text-sm font-medium">
                Enhance before OCR
              </label>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mt-3">
              Improves contrast and prepares the image before text extraction.
            </p>
          </div>
        </div>

        {/* PROGRESS */}
        {isProcessing && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Extracting text...</p>
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

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={handleExtractText}
            disabled={!file || isProcessing}
            className={`btn-primary inline-flex items-center justify-center gap-2 ${
              !file || isProcessing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Zap className="w-4 h-4" />
            {isProcessing ? "Extracting..." : "Extract Text"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          {extractedText && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Text
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download TXT
              </button>
            </>
          )}
        </div>
      </section>

      {/* STATS */}
      {file && (
        <section className="bg-white border rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Result Details</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">File Size</p>
              <p className="text-2xl font-bold">{formatBytes(file.size)}</p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">Words</p>
              <p className="text-2xl font-bold">{wordCount}</p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">Characters</p>
              <p className="text-2xl font-bold">{characterCount}</p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">Lines</p>
              <p className="text-2xl font-bold">{lineCount}</p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                OCR Confidence
              </p>
              <p className="text-2xl font-bold">
                {confidence !== null ? `${confidence}%` : "-"}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* PREVIEW */}
      {file && (
        <section className="bg-white border rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Preview & Extracted Text</h2>

          <div className="grid lg:grid-cols-2 gap-5">
            <div className="border rounded-2xl p-5 bg-gray-50">
              <h3 className="font-semibold mb-3">Original Image</h3>

              <div className="min-h-80 rounded-2xl border bg-white flex items-center justify-center p-3">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Uploaded preview"
                    className="max-h-96 w-auto rounded-xl shadow-sm"
                  />
                ) : (
                  <div className="text-center p-6">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 text-[var(--primary)]" />
                    <p className="text-sm text-[var(--text-secondary)]">
                      Image preview will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-2xl p-5 bg-gray-50">
              <h3 className="font-semibold mb-3">Extracted Text</h3>

              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                placeholder="Extracted text will appear here..."
                className="w-full min-h-80 border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[var(--primary)]/20 resize-y bg-white"
              />
            </div>
          </div>
        </section>
      )}

      {/* SUGGESTED TOOLS */}
      <SuggestedTools currentToolId="image-to-text-converter" />
    </div>
  );
}