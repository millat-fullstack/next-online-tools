import { useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileImage,
  Images,
  Trash2,
  SlidersHorizontal,
  FileText,
  Archive,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import jsPDF from "jspdf";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "JPG to PDF Converter",
  path: "/jpg-to-pdf-converter",
  category: "PDF Tools",
  description:
    "Convert JPG images to PDF in seconds. Easily adjust orientation and margins.",
  metaTitle: "JPG to PDF Converter Online Free | Convert Images to PDF",
  metaDescription:
    "Convert JPG images to PDF online for free. Upload or drop JPG images, adjust orientation, page size, margins, image fit, and download a PDF instantly.",
};

const MAX_FILES = 20;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const PAGE_SIZES = [
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
];

const ORIENTATION_OPTIONS = [
  {
    value: "auto",
    label: "Auto",
    description: "Match each image shape",
  },
  {
    value: "portrait",
    label: "Portrait",
    description: "Vertical PDF pages",
  },
  {
    value: "landscape",
    label: "Landscape",
    description: "Horizontal PDF pages",
  },
];

const FIT_OPTIONS = [
  {
    value: "contain",
    label: "Fit Page",
    description: "Keep full image visible",
  },
  {
    value: "cover",
    label: "Fill Page",
    description: "Fill page, may crop edges",
  },
];

export default function JpgToPdfConverter() {
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [orientation, setOrientation] = useState("auto");
  const [pageSize, setPageSize] = useState("a4");
  const [marginMm, setMarginMm] = useState(10);
  const [fitMode, setFitMode] = useState("contain");
  const [imageQuality, setImageQuality] = useState(0.92);

  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfSize, setPdfSize] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalImageSize = useMemo(() => {
    return images.reduce((sum, image) => sum + image.file.size, 0);
  }, [images]);

  const estimatedProcessingTime = useMemo(() => {
    if (!images.length) return 0;

    const sizeMb = totalImageSize / (1024 * 1024);
    const estimated = 1200 + images.length * 350 + sizeMb * 120;

    return Math.min(12000, Math.max(1500, Math.round(estimated)));
  }, [images.length, totalImageSize]);

  const canConvert = images.length > 0 && !isProcessing;

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function clearPdfOutput() {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }

    setPdfBlob(null);
    setPdfUrl("");
    setPdfSize(0);
    setProgress(0);
    setProcessingTimeMs(0);
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function createImageItem(file) {
    return {
      id: makeId(file),
      file,
      name: file.name,
      size: file.size,
      previewUrl: URL.createObjectURL(file),
      width: 0,
      height: 0,
      status: "ready",
    };
  }

  function validateFile(file) {
    if (!file) return "No file selected.";

    const fileName = file.name.toLowerCase();
    const isJpg =
      file.type === "image/jpeg" ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg");

    if (!isJpg) {
      return "Only JPG/JPEG images are allowed.";
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Each image must be under ${MAX_FILE_SIZE_MB} MB.`;
    }

    return "";
  }

  function addFiles(fileList) {
    clearFeedback();
    clearPdfOutput();

    const incomingFiles = Array.from(fileList || []);

    if (!incomingFiles.length) return;

    const validFiles = [];
    let rejectedCount = 0;

    incomingFiles.forEach((file) => {
      const validationError = validateFile(file);

      if (validationError) {
        rejectedCount += 1;
        return;
      }

      validFiles.push(file);
    });

    const remainingSlots = Math.max(0, MAX_FILES - images.length);
    const acceptedFiles = validFiles.slice(0, remainingSlots);
    const skippedByLimit = Math.max(0, validFiles.length - acceptedFiles.length);

    if (!acceptedFiles.length) {
      setError(
        images.length >= MAX_FILES
          ? `Maximum ${MAX_FILES} JPG images are allowed.`
          : "Please upload valid JPG/JPEG images."
      );
      resetFileInput();
      return;
    }

    const newItems = acceptedFiles.map(createImageItem);

    setImages((currentImages) => [...currentImages, ...newItems]);

    newItems.forEach((item) => {
      loadImage(item.previewUrl)
        .then((image) => {
          updateImage(item.id, {
            width: image.naturalWidth || image.width,
            height: image.naturalHeight || image.height,
          });
        })
        .catch(() => {
          updateImage(item.id, {
            status: "error",
          });
        });
    });

    const messages = [];

    messages.push(`${acceptedFiles.length} JPG image(s) added.`);

    if (rejectedCount > 0) {
      messages.push(`${rejectedCount} invalid file(s) ignored.`);
    }

    if (skippedByLimit > 0) {
      messages.push(
        `${skippedByLimit} file(s) skipped because the limit is ${MAX_FILES}.`
      );
    }

    setSuccess(messages.join(" "));
    resetFileInput();
  }

  function handleFileInputChange(event) {
    addFiles(event.target.files);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    if (isProcessing) return;

    addFiles(event.dataTransfer.files);
  }

  function handleDragOver(event) {
    event.preventDefault();

    if (!isProcessing) {
      setIsDragging(true);
    }
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function updateImage(id, updates) {
    setImages((currentImages) =>
      currentImages.map((image) => {
        if (image.id !== id) return image;
        return { ...image, ...updates };
      })
    );
  }

  function removeImage(id) {
    if (isProcessing) return;

    clearFeedback();
    clearPdfOutput();

    setImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === id);

      if (imageToRemove?.previewUrl) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return currentImages.filter((image) => image.id !== id);
    });
  }

  function moveImage(id, direction) {
    if (isProcessing) return;

    clearPdfOutput();

    setImages((currentImages) => {
      const index = currentImages.findIndex((image) => image.id === id);

      if (index === -1) return currentImages;

      const nextIndex = direction === "up" ? index - 1 : index + 1;

      if (nextIndex < 0 || nextIndex >= currentImages.length) {
        return currentImages;
      }

      const updatedImages = [...currentImages];
      const [selectedImage] = updatedImages.splice(index, 1);

      updatedImages.splice(nextIndex, 0, selectedImage);

      return updatedImages;
    });
  }

  function clearAllImages() {
    if (isProcessing) return;

    images.forEach((image) => {
      if (image.previewUrl) {
        URL.revokeObjectURL(image.previewUrl);
      }
    });

    clearPdfOutput();

    setImages([]);
    setError("");
    setSuccess("");
    resetFileInput();
  }

  function handleSettingChange(setter, value) {
    setter(value);
    clearFeedback();
    clearPdfOutput();
  }

  async function convertToPdf() {
    if (!images.length) {
      setError("Please upload at least one JPG image first.");
      return;
    }

    clearFeedback();
    clearPdfOutput();

    setIsProcessing(true);
    setProgress(0);

    const startTime = performance.now();

    try {
      let pdfDocument = null;

      for (let index = 0; index < images.length; index += 1) {
        const imageItem = images[index];

        updateImage(imageItem.id, {
          status: "processing",
        });

        const imageDataUrl = await fileToDataUrl(imageItem.file);
        const loadedImage = await loadImage(imageDataUrl);

        const imageWidth = loadedImage.naturalWidth || loadedImage.width;
        const imageHeight = loadedImage.naturalHeight || loadedImage.height;

        const pageOrientation = getPageOrientation(
          orientation,
          imageWidth,
          imageHeight
        );

        if (!pdfDocument) {
          pdfDocument = new jsPDF({
            orientation: pageOrientation,
            unit: "mm",
            format: pageSize,
            compress: true,
          });
        } else {
          pdfDocument.addPage(pageSize, pageOrientation);
        }

        const pageWidth = pdfDocument.internal.pageSize.getWidth();
        const pageHeight = pdfDocument.internal.pageSize.getHeight();

        const safeMargin = Math.min(
          Number(marginMm),
          Math.floor(Math.min(pageWidth, pageHeight) / 3)
        );

        const contentWidth = Math.max(1, pageWidth - safeMargin * 2);
        const contentHeight = Math.max(1, pageHeight - safeMargin * 2);

        const optimizedImageDataUrl = imageToJpegDataUrl(
          loadedImage,
          imageQuality,
          2400
        );

        const imagePlacement = getImagePlacement({
          imageWidth,
          imageHeight,
          contentWidth,
          contentHeight,
          margin: safeMargin,
          fitMode,
        });

        pdfDocument.addImage(
          optimizedImageDataUrl,
          "JPEG",
          imagePlacement.x,
          imagePlacement.y,
          imagePlacement.width,
          imagePlacement.height,
          undefined,
          "FAST"
        );

        updateImage(imageItem.id, {
          status: "done",
          width: imageWidth,
          height: imageHeight,
        });

        setProgress(Math.round(((index + 1) / images.length) * 100));
      }

      if (!pdfDocument) {
        throw new Error("Could not create PDF.");
      }

      const generatedBlob = pdfDocument.output("blob");
      const generatedUrl = URL.createObjectURL(generatedBlob);

      const actualProcessingTime = Math.max(
        1,
        Math.round(performance.now() - startTime)
      );

      setPdfBlob(generatedBlob);
      setPdfUrl(generatedUrl);
      setPdfSize(generatedBlob.size);
      setProcessingTimeMs(actualProcessingTime);
      setProgress(100);
      setSuccess(
        `PDF created successfully from ${images.length} image${
          images.length === 1 ? "" : "s"
        }.`
      );
    } catch (err) {
      console.error("JPG to PDF conversion error:", err);

      setImages((currentImages) =>
        currentImages.map((image) => ({
          ...image,
          status: image.status === "processing" ? "ready" : image.status,
        }))
      );

      setError("Could not convert JPG images to PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDownload() {
    if (!pdfBlob || !pdfUrl) {
      setError("Please convert JPG images to PDF first.");
      return;
    }

    const link = document.createElement("a");

    link.href = pdfUrl;
    link.download =
      images.length === 1
        ? `${getFileBaseName(images[0].name)}.pdf`
        : "converted-jpg-images.pdf";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleReset() {
    images.forEach((image) => {
      if (image.previewUrl) {
        URL.revokeObjectURL(image.previewUrl);
      }
    });

    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }

    setImages([]);
    setOrientation("auto");
    setPageSize("a4");
    setMarginMm(10);
    setFitMode("contain");
    setImageQuality(0.92);

    setPdfBlob(null);
    setPdfUrl("");
    setPdfSize(0);

    setIsDragging(false);
    setIsProcessing(false);
    setProgress(0);
    setProcessingTimeMs(0);

    setError("");
    setSuccess("");

    resetFileInput();
  }

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <FileImage size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">JPG to PDF Converter</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Convert JPG images to PDF in seconds. Easily adjust orientation,
          margins, page size, image fit, and quality before downloading your PDF.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-[1.35fr_0.85fr] gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* UPLOAD AREA */}
            <label
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                isDragging
                  ? "border-[var(--primary)] bg-[#f4edff]"
                  : "border-[var(--border)] hover:bg-[#f8f4ff]"
              } ${isProcessing ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <Upload size={38} className="mx-auto mb-4 text-[var(--primary)]" />

              <h2 className="text-xl font-semibold mb-2">
                Choose file or drop JPG images here
              </h2>

              <p className="text-sm text-[var(--text-secondary)]">
                Upload up to {MAX_FILES} JPG/JPEG images. Each image must be
                under <strong>{MAX_FILE_SIZE_MB} MB</strong>.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,.jpg,.jpeg"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isProcessing}
              />
            </label>

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

            {/* SETTINGS */}
            {images.length > 0 && (
              <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersHorizontal
                    size={20}
                    className="text-[var(--primary)]"
                  />
                  <h3 className="font-semibold">PDF Settings</h3>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  {ORIENTATION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        handleSettingChange(setOrientation, option.value)
                      }
                      disabled={isProcessing}
                      className={`rounded-2xl border p-4 text-left transition ${
                        orientation === option.value
                          ? "border-[var(--primary)] bg-white text-[var(--primary)]"
                          : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                      }`}
                    >
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Page Size
                    </label>

                    <select
                      value={pageSize}
                      onChange={(event) =>
                        handleSettingChange(setPageSize, event.target.value)
                      }
                      disabled={isProcessing}
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                    >
                      {PAGE_SIZES.map((size) => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Image Fit
                    </label>

                    <select
                      value={fitMode}
                      onChange={(event) =>
                        handleSettingChange(setFitMode, event.target.value)
                      }
                      disabled={isProcessing}
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                    >
                      {FIT_OPTIONS.map((fit) => (
                        <option key={fit.value} value={fit.value}>
                          {fit.label} — {fit.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <label className="text-sm font-semibold">
                        Margin: {marginMm}mm
                      </label>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={marginMm}
                      onChange={(event) =>
                        handleSettingChange(setMarginMm, Number(event.target.value))
                      }
                      disabled={isProcessing}
                      className="w-full accent-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <label className="text-sm font-semibold">
                        Image Quality: {Math.round(imageQuality * 100)}%
                      </label>
                    </div>

                    <input
                      type="range"
                      min="0.6"
                      max="1"
                      step="0.01"
                      value={imageQuality}
                      onChange={(event) =>
                        handleSettingChange(
                          setImageQuality,
                          Number(event.target.value)
                        )
                      }
                      disabled={isProcessing}
                      className="w-full accent-[var(--primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 text-sm">
                  <InfoBox label="Images" value={images.length} />
                  <InfoBox label="Total Size" value={formatBytes(totalImageSize)} />
                  <InfoBox
                    label="Orientation"
                    value={
                      orientation.charAt(0).toUpperCase() + orientation.slice(1)
                    }
                  />
                  <InfoBox
                    label="Est. Time"
                    value={`${Math.ceil(estimatedProcessingTime / 1000)}s`}
                  />
                </div>
              </div>
            )}

            {/* ACTIONS */}
            {images.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={convertToPdf}
                  disabled={!canConvert}
                  className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                    !canConvert ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Zap size={18} />
                  )}
                  {isProcessing
                    ? "Converting..."
                    : images.length > 1
                      ? "Convert Images to PDF"
                      : "Convert JPG to PDF"}
                </button>

                <button
                  type="button"
                  onClick={clearAllImages}
                  disabled={isProcessing}
                  className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                    isProcessing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Trash2 size={18} />
                  Clear
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isProcessing}
                  className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                    isProcessing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>
            )}

            {/* PROGRESS */}
            {isProcessing && (
              <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                  <span>Creating PDF...</span>
                  <span>{progress}%</span>
                </div>

                <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* IMAGE LIST */}
            {images.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Images size={20} className="text-[var(--primary)]" />
                  <h3 className="font-semibold">Selected JPG Images</h3>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <ImageCard
                      key={image.id}
                      image={image}
                      index={index}
                      total={images.length}
                      isProcessing={isProcessing}
                      onRemove={() => removeImage(image.id)}
                      onMoveUp={() => moveImage(image.id, "up")}
                      onMoveDown={() => moveImage(image.id, "down")}
                    />
                  ))}
                </div>
              </div>
            )}

            {!images.length && (
              <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                <FileImage size={42} className="mx-auto mb-3 text-gray-300" />
                <p className="text-[var(--text-secondary)]">
                  Upload JPG images to create a PDF.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* RESULT */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">PDF Result</h2>
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-6 bg-gray-50 min-h-[360px] flex items-center justify-center">
                {pdfUrl ? (
                  <div className="w-full text-center">
                    <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>

                    <h3 className="font-semibold mb-2">PDF Ready</h3>

                    <p className="text-sm text-[var(--text-secondary)] mb-5">
                      Your JPG images have been converted into a PDF.
                    </p>

                    <button
                      type="button"
                      onClick={handleDownload}
                      className="btn-primary w-full inline-flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Download PDF
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Archive size={54} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-[var(--text-secondary)]">
                      Converted PDF will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* PDF PREVIEW */}
            {pdfUrl && (
              <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white">
                <div className="p-4 border-b border-[var(--border)]">
                  <h3 className="font-semibold">PDF Preview</h3>
                </div>

                <iframe
                  src={pdfUrl}
                  title="Converted PDF Preview"
                  className="w-full h-[420px] bg-gray-50"
                />
              </div>
            )}

            {/* STATS */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Images" value={images.length || "-"} />
              <StatCard label="Page Size" value={pageSize.toUpperCase()} />
              <StatCard
                label="Margin"
                value={`${marginMm}mm`}
              />
              <StatCard
                label="PDF Size"
                value={pdfSize ? formatBytes(pdfSize) : "-"}
                green={Boolean(pdfSize)}
              />
              <StatCard
                label="Processing Time"
                value={
                  processingTimeMs
                    ? `${(processingTimeMs / 1000).toFixed(1)}s`
                    : estimatedProcessingTime
                      ? `Est. ${Math.ceil(estimatedProcessingTime / 1000)}s`
                      : "-"
                }
                green={Boolean(processingTimeMs)}
              />
              <StatCard
                label="Fit Mode"
                value={fitMode === "contain" ? "Fit" : "Fill"}
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <h3 className="font-semibold text-blue-900 mb-2">
                Browser-based JPG to PDF conversion
              </h3>

              <p className="text-sm text-blue-800">
                Your JPG images are converted to PDF directly in your browser.
                No paid API is required.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="jpg-to-pdf-converter" />
    </div>
  );
}

function ImageCard({
  image,
  index,
  total,
  isProcessing,
  onRemove,
  onMoveUp,
  onMoveDown,
}) {
  const statusText = {
    ready: "Ready",
    processing: "Converting",
    done: "Added to PDF",
    error: "Could not read",
  }[image.status];

  return (
    <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white">
      <div className="relative bg-[#f8f4ff] h-44 flex items-center justify-center">
        <img
          src={image.previewUrl}
          alt={image.name}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <div className="p-4">
        <p className="font-semibold text-sm truncate" title={image.name}>
          {index + 1}. {image.name}
        </p>

        <div className="flex items-center justify-between gap-3 mt-2 text-xs text-[var(--text-secondary)]">
          <span>{formatBytes(image.size)}</span>
          <span>{statusText}</span>
        </div>

        {image.width > 0 && image.height > 0 && (
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {image.width} × {image.height}px
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isProcessing || index === 0}
            className={`btn-secondary inline-flex items-center justify-center gap-1 text-xs ${
              isProcessing || index === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Move up"
          >
            <ArrowUp size={14} />
          </button>

          <button
            type="button"
            onClick={onMoveDown}
            disabled={isProcessing || index === total - 1}
            className={`btn-secondary inline-flex items-center justify-center gap-1 text-xs ${
              isProcessing || index === total - 1
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            title="Move down"
          >
            <ArrowDown size={14} />
          </button>

          <button
            type="button"
            onClick={onRemove}
            disabled={isProcessing}
            className={`btn-secondary inline-flex items-center justify-center gap-1 text-xs hover:text-red-600 ${
              isProcessing ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Remove image"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-xl p-3 text-center">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="font-semibold text-[var(--primary)] break-all">{value}</p>
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

function getPageOrientation(selectedOrientation, imageWidth, imageHeight) {
  if (selectedOrientation === "portrait") return "portrait";
  if (selectedOrientation === "landscape") return "landscape";

  return imageWidth > imageHeight ? "landscape" : "portrait";
}

function getImagePlacement({
  imageWidth,
  imageHeight,
  contentWidth,
  contentHeight,
  margin,
  fitMode,
}) {
  const imageRatio = imageWidth / imageHeight;
  const contentRatio = contentWidth / contentHeight;

  let width = contentWidth;
  let height = contentHeight;

  if (fitMode === "cover") {
    if (imageRatio > contentRatio) {
      height = contentHeight;
      width = contentHeight * imageRatio;
    } else {
      width = contentWidth;
      height = contentWidth / imageRatio;
    }
  } else {
    if (imageRatio > contentRatio) {
      width = contentWidth;
      height = contentWidth / imageRatio;
    } else {
      height = contentHeight;
      width = contentHeight * imageRatio;
    }
  }

  return {
    x: margin + (contentWidth - width) / 2,
    y: margin + (contentHeight - height) / 2,
    width,
    height,
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function imageToJpegDataUrl(image, quality, maxLongSide = 2400) {
  const originalWidth = image.naturalWidth || image.width;
  const originalHeight = image.naturalHeight || image.height;

  const ratio = Math.min(
    1,
    maxLongSide / Math.max(originalWidth, originalHeight)
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(originalWidth * ratio));
  canvas.height = Math.max(1, Math.round(originalHeight * ratio));

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", quality);
}

function makeId(file) {
  const randomPart =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${file.name}-${file.size}-${file.lastModified}-${randomPart}`;
}

function getFileBaseName(fileName) {
  return String(fileName || "converted").replace(/\.[^/.]+$/, "");
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const sizeIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const size = bytes / Math.pow(1024, sizeIndex);

  return `${size.toFixed(sizeIndex === 0 ? 0 : 1)} ${units[sizeIndex]}`;
}