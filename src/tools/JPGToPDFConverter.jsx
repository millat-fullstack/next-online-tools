import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  ChevronDown,
  Download,
  Eye,
  FileImage,
  FileText,
  Images,
  Loader2,
  Maximize2,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import jsPDF from "jspdf";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "JPG to PDF Converter",
  path: "/jpg-to-pdf-converter",
  category: "PDF Tools",
  description:
    "Convert JPG, PNG, or WEBP images to one high-quality PDF with ordered page preview and full PDF view.",
  metaTitle: "JPG to PDF Converter Online Free | Convert Images to PDF",
  metaDescription:
    "Convert JPG, PNG, or WEBP images to PDF online. Upload images, arrange pages, preview the full PDF, and download a high-quality PDF.",
};

const MAX_FILES = 20;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MIN_PROCESSING_TIME_MS = 900;
const MAX_PROCESSING_TIME_MS = 14000;

const PAGE_SIZES = [
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
];

const ORIENTATION_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
];

const FIT_OPTIONS = [
  { value: "contain", label: "Fit Page" },
  { value: "cover", label: "Fill Page" },
];

export default function JpgToPdfConverter() {
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [orientation, setOrientation] = useState("auto");
  const [pageSize, setPageSize] = useState("a4");
  const [marginMm, setMarginMm] = useState(10);
  const [fitMode, setFitMode] = useState("contain");
  const [imageQuality, setImageQuality] = useState(0.96);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [showFullPdfView, setShowFullPdfView] = useState(false);
  const [fullPageImage, setFullPageImage] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingPhase, setProcessingPhase] = useState("");
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [downloadProcessingTimeMs, setDownloadProcessingTimeMs] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalImageSize = useMemo(() => {
    return images.reduce((sum, image) => sum + image.file.size, 0);
  }, [images]);

  const estimatedProcessingTime = useMemo(() => {
    if (!images.length) return 0;

    const sizeMb = totalImageSize / (1024 * 1024);
    const estimated = MIN_PROCESSING_TIME_MS + images.length * 420 + sizeMb * 160;

    return clampNumber(Math.round(estimated), MIN_PROCESSING_TIME_MS, MAX_PROCESSING_TIME_MS);
  }, [images.length, totalImageSize]);

  const canConvert = images.length > 0 && !isProcessing;

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearPdfOutput() {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }

    setPdfBlob(null);
    setPdfUrl("");
    setShowFullPdfView(false);
    setProgress(0);
    setProcessingPhase("");
    setProcessingTimeMs(0);
    setDownloadProcessingTimeMs(0);
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
    const isSupportedImage =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp" ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".webp");

    if (!isSupportedImage) {
      return "Only JPG, PNG, or WEBP images are allowed.";
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Each image must be under ${MAX_FILE_SIZE_MB} MB.`;
    }

    return "";
  }

  function addFiles(fileList) {
    if (isProcessing) return;

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
          ? `Maximum ${MAX_FILES} images are allowed.`
          : "Please upload valid JPG, PNG, or WEBP images."
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
          updateImage(item.id, { status: "error" });
        });
    });

    const messages = [`${acceptedFiles.length} image${acceptedFiles.length === 1 ? "" : "s"} added.`];

    if (rejectedCount > 0) {
      messages.push(`${rejectedCount} unsupported file${rejectedCount === 1 ? "" : "s"} ignored.`);
    }

    if (skippedByLimit > 0) {
      messages.push(`${skippedByLimit} file${skippedByLimit === 1 ? "" : "s"} skipped because the limit is ${MAX_FILES}.`);
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
    setSettingsOpen(false);
    setFullPageImage(null);
    resetFileInput();
  }

  function handleSettingChange(setter, value) {
    setter(value);
    clearFeedback();
    clearPdfOutput();
  }

  async function convertToPdf({ openPreview = false } = {}) {
    if (!images.length) {
      setError("Please upload at least one image first.");
      return null;
    }

    clearFeedback();
    clearPdfOutput();

    setIsProcessing(true);
    setProgress(0);
    setProcessingPhase("Preparing images for PDF...");

    const startTime = performance.now();

    try {
      let pdfDocument = null;

      for (let index = 0; index < images.length; index += 1) {
        const imageItem = images[index];

        setProcessingPhase(`Adding page ${index + 1} of ${images.length}...`);

        updateImage(imageItem.id, { status: "processing" });

        const imageDataUrl = await fileToDataUrl(imageItem.file);
        const loadedImage = await loadImage(imageDataUrl);

        const imageWidth = loadedImage.naturalWidth || loadedImage.width;
        const imageHeight = loadedImage.naturalHeight || loadedImage.height;
        const pageOrientation = getPageOrientation(orientation, imageWidth, imageHeight);

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
        const safeMargin = Math.min(Number(marginMm) || 0, Math.floor(Math.min(pageWidth, pageHeight) / 3));
        const contentWidth = Math.max(1, pageWidth - safeMargin * 2);
        const contentHeight = Math.max(1, pageHeight - safeMargin * 2);

        const optimizedImageDataUrl = imageToJpegDataUrl(loadedImage, imageQuality, 4096);
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
          "SLOW"
        );

        updateImage(imageItem.id, {
          status: "done",
          width: imageWidth,
          height: imageHeight,
        });

        setProgress(Math.round(((index + 1) / images.length) * 82));
      }

      if (!pdfDocument) {
        throw new Error("Could not create PDF.");
      }

      setProcessingPhase("Finalizing high-quality PDF...");
      setProgress(90);

      await waitRemaining(startTime, estimatedProcessingTime);

      const generatedBlob = pdfDocument.output("blob");
      const generatedUrl = URL.createObjectURL(generatedBlob);
      const actualProcessingTime = Math.max(1, Math.round(performance.now() - startTime));

      setPdfBlob(generatedBlob);
      setPdfUrl(generatedUrl);
      setProcessingTimeMs(actualProcessingTime);
      setProgress(100);
      setProcessingPhase("PDF ready.");
      setShowFullPdfView(openPreview);
      setSuccess(
        `PDF created successfully from ${images.length} image${images.length === 1 ? "" : "s"} in ${(actualProcessingTime / 1000).toFixed(1)}s.`
      );

      return { blob: generatedBlob, url: generatedUrl };
    } catch (err) {
      console.error("JPG to PDF conversion error:", err);

      setImages((currentImages) =>
        currentImages.map((image) => ({
          ...image,
          status: image.status === "processing" ? "ready" : image.status,
        }))
      );

      setError("Could not convert images to PDF. Please try again.");
      return null;
    } finally {
      setIsProcessing(false);
      window.setTimeout(() => setProgress(0), 800);
    }
  }

  async function handleCheckFullPdfView() {
    if (pdfBlob && pdfUrl) {
      setShowFullPdfView(true);
      return;
    }

    await convertToPdf({ openPreview: true });
  }

  async function handleDownload() {
    if (!pdfBlob || !pdfUrl) {
      setError("Please convert images to PDF first.");
      return;
    }

    setError("");
    setSuccess("");
    setIsProcessing(true);
    setProgress(0);
    setProcessingPhase("Preparing PDF download...");

    const startTime = performance.now();

    try {
      await wait(160);
      setProgress(45);
      setProcessingPhase("Creating download file...");

      await wait(260);
      setProgress(82);
      setProcessingPhase("Starting download...");

      const link = document.createElement("a");

      link.href = pdfUrl;
      link.download =
        images.length === 1
          ? `${getFileBaseName(images[0].name)}.pdf`
          : "converted-images.pdf";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const actualProcessingTime = Math.max(1, Math.round(performance.now() - startTime));

      setDownloadProcessingTimeMs(actualProcessingTime);
      setProgress(100);
      setSuccess(`Download started in ${(actualProcessingTime / 1000).toFixed(1)}s.`);
    } catch {
      setError("Could not start the download. Please try again.");
    } finally {
      setIsProcessing(false);
      window.setTimeout(() => setProgress(0), 800);
    }
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
    setImageQuality(0.96);
    setSettingsOpen(false);
    setFullPageImage(null);
    setShowFullPdfView(false);

    setPdfBlob(null);
    setPdfUrl("");

    setIsDragging(false);
    setIsProcessing(false);
    setProgress(0);
    setProcessingPhase("");
    setProcessingTimeMs(0);
    setDownloadProcessingTimeMs(0);

    setError("");
    setSuccess("");

    resetFileInput();
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <FileImage size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">JPG to PDF Converter</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Convert JPG, PNG, or WEBP images into one clean high-quality PDF.
          Arrange pages, preview the final PDF, and download when ready.
        </p>
      </section>

      <section className="card p-6 sm:p-8">
        <div className="flex flex-col gap-5">
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
              Choose or drop images here
            </h2>

            <p className="text-sm text-[var(--text-secondary)]">
              Upload up to {MAX_FILES} JPG, PNG, or WEBP images. Each image must be
              under <strong>{MAX_FILE_SIZE_MB} MB</strong>.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isProcessing}
            />
          </label>

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

          {images.length > 0 && (
            <div className="border border-[var(--border)] rounded-2xl bg-white overflow-visible">
              <button
                type="button"
                onClick={() => setSettingsOpen((current) => !current)}
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 text-left hover:bg-[#f8f4ff] transition"
                disabled={isProcessing}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f4edff] flex items-center justify-center shrink-0">
                    <SlidersHorizontal size={20} className="text-[var(--primary)]" />
                  </div>

                  <div>
                    <h3 className="font-semibold">PDF Settings</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Default high-quality settings are ready. Open only if you need to change them.
                    </p>
                  </div>
                </div>

                <ChevronDown
                  size={20}
                  className={`text-[var(--primary)] transition-transform ${
                    settingsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {settingsOpen && (
                <div className="border-t border-[var(--border)] bg-[#fafafa] p-5">
                  <div className="grid sm:grid-cols-3 gap-3">
                    {ORIENTATION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSettingChange(setOrientation, option.value)}
                        disabled={isProcessing}
                        className={`rounded-2xl border p-4 text-left transition ${
                          orientation === option.value
                            ? "border-[var(--primary)] bg-white text-[var(--primary)]"
                            : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                        }`}
                      >
                        <p className="font-semibold">{option.label}</p>
                      </button>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mt-5">
                    <FormControl label="Page Size">
                      <select
                        value={pageSize}
                        onChange={(event) => handleSettingChange(setPageSize, event.target.value)}
                        disabled={isProcessing}
                        className="tool-input"
                      >
                        {PAGE_SIZES.map((size) => (
                          <option key={size.value} value={size.value}>
                            {size.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>

                    <FormControl label="Image Fit">
                      <select
                        value={fitMode}
                        onChange={(event) => handleSettingChange(setFitMode, event.target.value)}
                        disabled={isProcessing}
                        className="tool-input"
                      >
                        {FIT_OPTIONS.map((fit) => (
                          <option key={fit.value} value={fit.value}>
                            {fit.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>

                    <FormControl label={`Margin: ${marginMm}mm`}>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={marginMm}
                        onChange={(event) => handleSettingChange(setMarginMm, Number(event.target.value))}
                        disabled={isProcessing}
                        className="w-full accent-[var(--primary)]"
                      />
                    </FormControl>

                    <FormControl label={`Image Quality: ${Math.round(imageQuality * 100)}%`}>
                      <input
                        type="range"
                        min="0.75"
                        max="1"
                        step="0.01"
                        value={imageQuality}
                        onChange={(event) => handleSettingChange(setImageQuality, Number(event.target.value))}
                        disabled={isProcessing}
                        className="w-full accent-[var(--primary)]"
                      />
                    </FormControl>
                  </div>
                </div>
              )}
            </div>
          )}

          {images.length > 0 && (
            <div className="grid sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => convertToPdf({ openPreview: false })}
                disabled={!canConvert}
                className={`btn-primary sm:col-span-2 inline-flex items-center justify-center gap-2 ${
                  !canConvert ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                {isProcessing ? "Converting..." : "Convert to PDF"}
              </button>

              <button
                type="button"
                onClick={handleCheckFullPdfView}
                disabled={isProcessing || !images.length}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  isProcessing || !images.length ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Maximize2 size={18} />
                Check Full PDF View
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
            </div>
          )}

          {isProcessing && (
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                <span>{processingPhase || "Processing..."}</span>
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

          {!isProcessing && (processingTimeMs > 0 || downloadProcessingTimeMs > 0) && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-800">
              <span className="font-semibold">
                {downloadProcessingTimeMs > 0 ? "Download processing completed" : "PDF processing completed"}
              </span>
              <span className="font-bold">
                {((downloadProcessingTimeMs || processingTimeMs) / 1000).toFixed(1)}s
              </span>
            </div>
          )}

          {images.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Images size={20} className="text-[var(--primary)]" />
                  <h3 className="font-semibold">PDF Pages</h3>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className={`text-sm font-semibold text-[var(--primary)] ${
                    isProcessing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Add more
                </button>
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
                    onFullView={() => setFullPageImage(image)}
                  />
                ))}
              </div>
            </div>
          )}

          {pdfUrl && showFullPdfView && (
            <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white">
              <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Full PDF Preview</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Review the complete PDF before saving it.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isProcessing}
                  className={`btn-primary inline-flex items-center justify-center gap-2 ${
                    isProcessing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Download size={18} />
                  Download
                </button>
              </div>

              <iframe
                src={pdfUrl}
                title="Converted PDF Preview"
                className="w-full h-[720px] bg-gray-50"
              />
            </div>
          )}

          {!images.length && (
            <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
              <FileImage size={42} className="mx-auto mb-3 text-gray-300" />
              <p className="text-[var(--text-secondary)]">
                Upload images to create a PDF.
              </p>
            </div>
          )}
        </div>
      </section>

      {fullPageImage && (
        <div className="fixed inset-0 z-50 bg-black/75 p-4 flex items-center justify-center">
          <div className="w-full max-w-5xl max-h-[92vh] rounded-2xl bg-white overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Page Full View</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {fullPageImage.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFullPageImage(null)}
                className="h-10 w-10 rounded-xl border border-[var(--border)] inline-flex items-center justify-center hover:bg-[#f8f4ff]"
                aria-label="Close full page view"
              >
                <X size={18} />
              </button>
            </div>

            <div className="h-[78vh] bg-[#f8f4ff] flex items-center justify-center p-4">
              <img
                src={fullPageImage.previewUrl}
                alt={fullPageImage.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .tool-input {
          width: 100%;
          height: 44px;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 0 0.9rem;
          background: white;
          outline: none;
          font-weight: 600;
        }
        .tool-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(155, 108, 227, 0.16);
        }
      `}</style>

      <SuggestedTools currentToolId="jpg-to-pdf-converter" />
    </div>
  );
}

function FormControl({ label, children }) {
  return (
    <label className="block rounded-2xl border border-[var(--border)] bg-white p-4">
      <span className="block text-sm font-semibold mb-3">{label}</span>
      {children}
    </label>
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
  onFullView,
}) {
  const statusText = {
    ready: "Ready",
    processing: "Converting",
    done: "Added to PDF",
    error: "Could not read",
  }[image.status];

  return (
    <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="relative bg-[#f8f4ff] h-56 flex items-center justify-center">
        <div className="absolute left-3 top-3 z-10 rounded-full bg-white/95 border border-[var(--border)] px-3 py-1 text-xs font-bold text-[var(--primary)] shadow-sm">
          Page {index + 1}
        </div>

        <div className="absolute right-3 top-3 z-10 flex gap-1">
          <PreviewActionButton
            title="Move page up"
            disabled={isProcessing || index === 0}
            onClick={onMoveUp}
          >
            <ArrowUp size={14} />
          </PreviewActionButton>

          <PreviewActionButton
            title="Move page down"
            disabled={isProcessing || index === total - 1}
            onClick={onMoveDown}
          >
            <ArrowDown size={14} />
          </PreviewActionButton>

          <PreviewActionButton
            title="Remove page"
            disabled={isProcessing}
            onClick={onRemove}
            danger
          >
            <X size={14} />
          </PreviewActionButton>
        </div>

        <img
          src={image.previewUrl}
          alt={image.name}
          className="max-h-full max-w-full object-contain"
        />

        <button
          type="button"
          onClick={onFullView}
          disabled={isProcessing}
          className={`absolute bottom-3 right-3 z-10 h-10 w-10 rounded-xl border border-[var(--border)] bg-white/95 shadow-sm inline-flex items-center justify-center transition ${
            isProcessing
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-[#f4edff] hover:text-[var(--primary)]"
          }`}
          title={`View page ${index + 1} full size`}
          aria-label={`View page ${index + 1} full size`}
        >
          <Eye size={18} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" title={image.name}>
              {image.name}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {formatBytes(image.size)} • {statusText}
            </p>
          </div>

          {image.width > 0 && image.height > 0 && (
            <span className="text-xs text-[var(--text-secondary)] shrink-0">
              {image.width}×{image.height}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewActionButton({ children, title, disabled, onClick, danger = false }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 rounded-lg border border-[var(--border)] bg-white/95 shadow-sm inline-flex items-center justify-center transition ${
        disabled
          ? "opacity-40 cursor-not-allowed"
          : danger
            ? "hover:bg-red-50 hover:text-red-600"
            : "hover:bg-[#f4edff] hover:text-[var(--primary)]"
      }`}
    >
      {children}
    </button>
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

function imageToJpegDataUrl(image, quality, maxLongSide = 4096) {
  const originalWidth = image.naturalWidth || image.width;
  const originalHeight = image.naturalHeight || image.height;
  const ratio = Math.min(1, maxLongSide / Math.max(originalWidth, originalHeight));
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(originalWidth * ratio));
  canvas.height = Math.max(1, Math.round(originalHeight * ratio));

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
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

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitRemaining(startTime, minimumMs) {
  const elapsed = performance.now() - startTime;
  const remaining = Math.max(0, minimumMs - elapsed);

  if (remaining > 0) {
    await wait(remaining);
  }
}

function clampNumber(value, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) return min;

  return Math.min(max, Math.max(min, number));
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
