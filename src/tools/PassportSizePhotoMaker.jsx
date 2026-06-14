import { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Crop as CropIcon,
  Settings2,
  Palette,
  SlidersHorizontal,
  FileImage,
  Loader2,
  Sparkles,
  Clock3,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Passport Size Photo Maker",
  path: "/passport-size-photo-maker",
  category: "Image Tools",
  description:
    "Create passport size photos online. Upload, drag to fit, crop, tone up, add optional border, choose copies, and download.",
  metaTitle: "Passport Size Photo Maker | Create Passport Photo Online Free",
  metaDescription:
    "Create passport size photos online for free. Upload your photo, crop it, choose passport photo size, add optional border, choose copies, and download a ready JPG image.",
};

const PHOTO_PRESETS = [
  {
    id: "2x2",
    label: "2 × 2 inch",
    width: 600,
    height: 600,
    note: "Square passport/visa style at 300 DPI",
  },
  {
    id: "35x45",
    label: "35 × 45 mm",
    width: 413,
    height: 531,
    note: "Common passport photo size",
  },
  {
    id: "40x50",
    label: "40 × 50 mm",
    width: 472,
    height: 591,
    note: "Standard ID/photo size",
  },
  {
    id: "50x50",
    label: "50 × 50 mm",
    width: 591,
    height: 591,
    note: "Square visa/photo size",
  },
  {
    id: "custom",
    label: "Custom Size",
    width: 600,
    height: 600,
    note: "Set your own width and height",
  },
];

const BACKGROUND_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Light Blue", value: "#dff3ff" },
  { label: "Light Gray", value: "#f3f4f6" },
  { label: "Off White", value: "#fafafa" },
];

const COPY_OPTIONS = [1, 2, 4, 6, 8, 10];
const MIN_PROCESSING_TIME_MS = 6000;

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new window.Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));

    image.src = url;
  });

const getRadianAngle = (degreeValue) => {
  return (degreeValue * Math.PI) / 180;
};

const rotateSize = (width, height, rotation) => {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) +
      Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) +
      Math.abs(Math.cos(rotRad) * height),
  };
};

const getProcessedPassportCanvas = async ({
  imageSrc,
  pixelCrop,
  rotation,
  outputWidth,
  outputHeight,
  backgroundColor,
  toneUp,
  borderEnabled,
  borderColor,
  borderWidth,
}) => {
  const image = await createImage(imageSrc);
  const rotRad = getRadianAngle(rotation);

  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  if (!tempCtx) {
    throw new Error("Canvas is not supported.");
  }

  tempCanvas.width = Math.round(bBoxWidth);
  tempCanvas.height = Math.round(bBoxHeight);

  tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
  tempCtx.rotate(rotRad);
  tempCtx.translate(-image.width / 2, -image.height / 2);
  tempCtx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    throw new Error("Canvas is not supported.");
  }

  croppedCanvas.width = Math.max(1, Math.round(pixelCrop.width));
  croppedCanvas.height = Math.max(1, Math.round(pixelCrop.height));

  croppedCtx.drawImage(
    tempCanvas,
    Math.round(pixelCrop.x),
    Math.round(pixelCrop.y),
    Math.round(pixelCrop.width),
    Math.round(pixelCrop.height),
    0,
    0,
    croppedCanvas.width,
    croppedCanvas.height
  );

  const finalCanvas = document.createElement("canvas");
  const finalCtx = finalCanvas.getContext("2d");

  if (!finalCtx) {
    throw new Error("Canvas is not supported.");
  }

  finalCanvas.width = outputWidth;
  finalCanvas.height = outputHeight;

  finalCtx.fillStyle = backgroundColor;
  finalCtx.fillRect(0, 0, outputWidth, outputHeight);

  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = "high";

  finalCtx.filter = toneUp
    ? "brightness(1.04) contrast(1.08) saturate(1.06)"
    : "none";

  finalCtx.drawImage(croppedCanvas, 0, 0, outputWidth, outputHeight);
  finalCtx.filter = "none";

  if (borderEnabled && Number(borderWidth) > 0) {
    const safeBorderWidth = Math.min(
      Math.max(1, Number(borderWidth)),
      Math.min(outputWidth, outputHeight) / 5
    );

    finalCtx.save();
    finalCtx.strokeStyle = borderColor || "#111827";
    finalCtx.lineWidth = safeBorderWidth;
    finalCtx.strokeRect(
      safeBorderWidth / 2,
      safeBorderWidth / 2,
      outputWidth - safeBorderWidth,
      outputHeight - safeBorderWidth
    );
    finalCtx.restore();
  }

  return finalCanvas;
};

const getSheetCanvas = ({ photoCanvas, copies }) => {
  if (copies <= 1) return photoCanvas;

  const photoWidth = photoCanvas.width;
  const photoHeight = photoCanvas.height;
  const columns = copies === 2 ? 2 : copies <= 4 ? 2 : copies <= 6 ? 3 : 4;
  const rows = Math.ceil(copies / columns);
  const gap = Math.max(16, Math.round(Math.min(photoWidth, photoHeight) * 0.06));
  const margin = gap;

  const sheetCanvas = document.createElement("canvas");
  const sheetCtx = sheetCanvas.getContext("2d");

  if (!sheetCtx) {
    throw new Error("Canvas is not supported.");
  }

  sheetCanvas.width = columns * photoWidth + (columns + 1) * gap;
  sheetCanvas.height = rows * photoHeight + (rows + 1) * gap;

  sheetCtx.fillStyle = "#ffffff";
  sheetCtx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);

  for (let index = 0; index < copies; index += 1) {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const x = margin + column * (photoWidth + gap);
    const y = margin + row * (photoHeight + gap);

    sheetCtx.drawImage(photoCanvas, x, y, photoWidth, photoHeight);
  }

  return sheetCanvas;
};

const canvasToBlob = (canvas, quality) => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create passport photo."));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      quality / 100
    );
  });
};

const wait = (ms) => {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
};

async function ensureMinimumProcessingTime({ startTime, minimumMs, setProgress }) {
  while (performance.now() - startTime < minimumMs) {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(96, 18 + Math.round((elapsed / minimumMs) * 78));

    setProgress(progress);
    await wait(160);
  }
}

export default function PassportSizePhotoMaker() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [outputUrl, setOutputUrl] = useState("");
  const [outputBlob, setOutputBlob] = useState(null);
  const [outputName, setOutputName] = useState("");

  const [presetId, setPresetId] = useState("35x45");
  const [customWidth, setCustomWidth] = useState(600);
  const [customHeight, setCustomHeight] = useState(600);

  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [quality, setQuality] = useState(92);
  const [toneUp, setToneUp] = useState(false);
  const [borderEnabled, setBorderEnabled] = useState(false);
  const [borderColor, setBorderColor] = useState("#ffffff");
  const [borderWidth, setBorderWidth] = useState(10);
  const [copies, setCopies] = useState(1);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropDone, setCropDone] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [isCreatingPreview, setIsCreatingPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    };
  }, [imageUrl, outputUrl]);

  const selectedPreset =
    PHOTO_PRESETS.find((preset) => preset.id === presetId) || PHOTO_PRESETS[0];

  const outputWidth =
    presetId === "custom"
      ? Math.max(100, Math.min(3000, Number(customWidth) || 600))
      : selectedPreset.width;

  const outputHeight =
    presetId === "custom"
      ? Math.max(100, Math.min(3000, Number(customHeight) || 600))
      : selectedPreset.height;

  const aspectRatio = outputWidth / outputHeight;

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
    return String(name || "photo").replace(/\.[^/.]+$/, "");
  };

  const isValidImageFile = (selectedFile) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/bmp"];
    return validTypes.includes(selectedFile.type);
  };

  const clearOutput = () => {
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
    }

    setOutputUrl("");
    setOutputBlob(null);
    setOutputName("");
    setCropDone(false);
    setProcessingTimeMs(0);
  };

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  const handleDesignChange = () => {
    clearFeedback();
    clearOutput();
  };

  const handleFile = (selectedFile) => {
    clearFeedback();
    clearOutput();

    if (!selectedFile) return;

    if (!isValidImageFile(selectedFile)) {
      setError("Please upload a valid image file: JPG, PNG, WEBP, or BMP.");
      return;
    }

    const maxSize = 15 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("File is too large. Please upload an image under 15MB.");
      return;
    }

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    const newImageUrl = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setImageUrl(newImageUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1.1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setCropDone(false);
    setSuccess("Photo uploaded. Drag the photo to fit perfectly, then click Done & Preview.");
  };

  const handleInputChange = (event) => {
    const selectedFile = event.target.files?.[0];
    handleFile(selectedFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const selectedFile = event.dataTransfer.files?.[0];
    handleFile(selectedFile);
  };

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const buildOutputCanvas = async () => {
    if (!file || !imageUrl) {
      throw new Error("Please upload a photo first.");
    }

    if (!croppedAreaPixels) {
      throw new Error("Please adjust the crop area first.");
    }

    const photoCanvas = await getProcessedPassportCanvas({
      imageSrc: imageUrl,
      pixelCrop: croppedAreaPixels,
      rotation,
      outputWidth,
      outputHeight,
      backgroundColor,
      toneUp,
      borderEnabled,
      borderColor,
      borderWidth,
    });

    return getSheetCanvas({
      photoCanvas,
      copies,
    });
  };

  const createPreview = async () => {
    clearFeedback();

    if (!file || !imageUrl) {
      setError("Please upload a photo first.");
      return;
    }

    if (!croppedAreaPixels) {
      setError("Please adjust the crop area first.");
      return;
    }

    setIsCreatingPreview(true);

    try {
      const finalCanvas = await buildOutputCanvas();
      const blob = await canvasToBlob(finalCanvas, quality);
      const url = URL.createObjectURL(blob);
      const name = `${getBaseName(file.name)}-${copies > 1 ? `${copies}-copies-sheet` : "passport-photo"}.jpg`;

      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }

      setOutputBlob(blob);
      setOutputUrl(url);
      setOutputName(name);
      setCropDone(true);
      setSuccess("Preview is ready. Check it carefully, then download when satisfied.");
    } catch {
      setError("Could not create the preview. Please adjust the crop and try again.");
    } finally {
      setIsCreatingPreview(false);
    }
  };

  const handleDownload = async () => {
    clearFeedback();

    if (!file || !imageUrl) {
      setError("Please upload a photo first.");
      return;
    }

    if (!croppedAreaPixels) {
      setError("Please adjust the crop area first.");
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(8);
    setProcessingTimeMs(0);

    const startTime = performance.now();

    try {
      const finalCanvas = await buildOutputCanvas();
      setDownloadProgress(18);

      const blob = await canvasToBlob(finalCanvas, quality);
      setDownloadProgress(28);

      await ensureMinimumProcessingTime({
        startTime,
        minimumMs: MIN_PROCESSING_TIME_MS,
        setProgress: setDownloadProgress,
      });

      const actualProcessingTime = Math.max(
        MIN_PROCESSING_TIME_MS,
        Math.round(performance.now() - startTime)
      );

      const url = URL.createObjectURL(blob);
      const name = `${getBaseName(file.name)}-${copies > 1 ? `${copies}-copies-sheet` : "passport-photo"}.jpg`;

      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }

      setOutputBlob(blob);
      setOutputUrl(url);
      setOutputName(name);
      setCropDone(true);
      setProcessingTimeMs(actualProcessingTime);
      setDownloadProgress(100);

      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(`Downloaded successfully in ${(actualProcessingTime / 1000).toFixed(1)}s.`);
    } catch {
      setError("Could not download the photo. Please adjust the crop and try again.");
    } finally {
      setIsDownloading(false);
      window.setTimeout(() => setDownloadProgress(0), 900);
    }
  };

  const handleResetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1.1);
    setRotation(0);
    clearOutput();
  };

  const handleReset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (outputUrl) URL.revokeObjectURL(outputUrl);

    setFile(null);
    setImageUrl("");
    setOutputUrl("");
    setOutputBlob(null);
    setOutputName("");

    setPresetId("35x45");
    setCustomWidth(600);
    setCustomHeight(600);
    setBackgroundColor("#ffffff");
    setQuality(92);
    setToneUp(false);
    setBorderEnabled(false);
    setBorderColor("#ffffff");
    setBorderWidth(10);
    setCopies(1);

    setCrop({ x: 0, y: 0 });
    setZoom(1.1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setCropDone(false);

    setIsDragging(false);
    setIsCreatingPreview(false);
    setIsDownloading(false);
    setDownloadProgress(0);
    setProcessingTimeMs(0);
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* TOOL HEADER */}
      <section className="bg-white border border-[var(--border)] rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <FileImage className="w-7 h-7 text-[var(--primary)]" />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-3">Passport Size Photo Maker</h1>
            <p className="text-[var(--text-secondary)] max-w-3xl">
              Upload your photo, drag it to fit perfectly, apply a quick professional tone,
              add an optional border, choose how many copies you need, preview exactly, and download.
            </p>
          </div>
        </div>
      </section>

      {/* UPLOAD */}
      {!imageUrl && (
        <section className="bg-white border border-[var(--border)] rounded-2xl shadow-sm p-6">
          <div
            onDrop={handleDrop}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={`border-2 border-dashed p-8 text-center transition ${
              isDragging
                ? "border-[var(--primary)] bg-[var(--primary)]/5"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-white border shadow-sm flex items-center justify-center mx-auto mb-4">
              <Upload className="w-7 h-7 text-[var(--primary)]" />
            </div>

            <h2 className="text-xl font-semibold mb-2">Upload Photo</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-5">
              Drag and drop your photo here, or click the button below. Supports JPG, PNG, WEBP, and BMP.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/bmp"
              onChange={handleInputChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Choose Photo
            </button>
          </div>
        </section>
      )}

      {/* FEEDBACK */}
      {(error || success || isDownloading) && (
        <section className="grid gap-3">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {isDownloading && (
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-xl p-4">
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                <span>Preparing final download...</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-3">
                Final file downloads after the processing time is completed.
              </p>
            </div>
          )}
        </section>
      )}

      {/* EDITOR */}
      {imageUrl && (
        <section className="bg-white border border-[var(--border)] rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <CropIcon className="w-5 h-5 text-[var(--primary)]" />
              <h2 className="text-xl font-bold">Drag, Fit & Preview</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Change Photo
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/bmp"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          <div className="grid xl:grid-cols-[1.35fr_0.85fr] gap-6">
            <div>
              <div className="relative w-full h-[460px] bg-[#111827] overflow-hidden border border-gray-200">
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspectRatio}
                  onCropChange={(nextCrop) => {
                    setCrop(nextCrop);
                    clearOutput();
                  }}
                  onZoomChange={(nextZoom) => {
                    setZoom(nextZoom);
                    clearOutput();
                  }}
                  onRotationChange={(nextRotation) => {
                    setRotation(nextRotation);
                    clearOutput();
                  }}
                  onCropComplete={handleCropComplete}
                  showGrid={true}
                  restrictPosition={false}
                />
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  Drag the photo inside the crop box. Zoom in/out until the face and shoulders fit correctly.
                </p>

                <button
                  type="button"
                  onClick={handleResetCrop}
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Crop
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Panel title="Photo Size" icon={Settings2}>
                <select
                  value={presetId}
                  onChange={(event) => {
                    setPresetId(event.target.value);
                    handleDesignChange();
                  }}
                  className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                  {PHOTO_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>

                <p className="text-sm text-[var(--text-secondary)] mt-3">
                  Output: <strong>{outputWidth} × {outputHeight}px</strong>
                </p>

                {presetId === "custom" && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <InputNumber
                      label="Width px"
                      value={customWidth}
                      onChange={(value) => {
                        setCustomWidth(value);
                        handleDesignChange();
                      }}
                    />
                    <InputNumber
                      label="Height px"
                      value={customHeight}
                      onChange={(value) => {
                        setCustomHeight(value);
                        handleDesignChange();
                      }}
                    />
                  </div>
                )}
              </Panel>

              <Panel title="Professional Finish" icon={Sparkles}>
                <label className="flex items-center justify-between gap-3 border border-[var(--border)] rounded-xl p-3 cursor-pointer bg-white">
                  <span>
                    <span className="font-semibold text-sm block">Quick Tone Up</span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      Soft brightness, contrast, and color improvement.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={toneUp}
                    onChange={(event) => {
                      setToneUp(event.target.checked);
                      handleDesignChange();
                    }}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </label>
              </Panel>

              <Panel title="Background & Border" icon={Palette}>
                <div className="grid grid-cols-2 gap-2">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        setBackgroundColor(color.value);
                        handleDesignChange();
                      }}
                      className={`border rounded-xl px-3 py-2 text-sm font-medium ${
                        backgroundColor === color.value
                          ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className="inline-block w-4 h-4 border mr-2 align-middle"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <label>
                    <span className="text-sm font-medium mb-2 block">Custom BG</span>
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(event) => {
                        setBackgroundColor(event.target.value);
                        handleDesignChange();
                      }}
                      className="w-full h-11 border border-[var(--border)] p-1 bg-white"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-medium mb-2 block">Border Color</span>
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(event) => {
                        setBorderColor(event.target.value);
                        handleDesignChange();
                      }}
                      disabled={!borderEnabled}
                      className="w-full h-11 border border-[var(--border)] p-1 bg-white disabled:opacity-50"
                    />
                  </label>
                </div>

                <label className="flex items-center justify-between gap-3 mt-4 border border-[var(--border)] rounded-xl p-3 cursor-pointer bg-white">
                  <span className="font-semibold text-sm">Add Border</span>
                  <input
                    type="checkbox"
                    checked={borderEnabled}
                    onChange={(event) => {
                      setBorderEnabled(event.target.checked);
                      handleDesignChange();
                    }}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </label>

                {borderEnabled && (
                  <RangeInput
                    label={`Border Width: ${borderWidth}px`}
                    min={1}
                    max={60}
                    step={1}
                    value={borderWidth}
                    onChange={(value) => {
                      setBorderWidth(Number(value));
                      handleDesignChange();
                    }}
                  />
                )}
              </Panel>

              <Panel title="Adjust & Copies" icon={SlidersHorizontal}>
                <RangeInput
                  label={`Zoom: ${zoom.toFixed(1)}x`}
                  min={1}
                  max={4}
                  step={0.1}
                  value={zoom}
                  onChange={(value) => {
                    setZoom(Number(value));
                    clearOutput();
                  }}
                />

                <RangeInput
                  label={`Rotation: ${rotation}°`}
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={(value) => {
                    setRotation(Number(value));
                    clearOutput();
                  }}
                />

                <RangeInput
                  label={`JPG Quality: ${quality}%`}
                  min={60}
                  max={100}
                  step={1}
                  value={quality}
                  onChange={(value) => {
                    setQuality(Number(value));
                    handleDesignChange();
                  }}
                />

                <div className="mt-4">
                  <label className="text-sm font-semibold mb-2 block">Copies</label>
                  <div className="grid grid-cols-3 gap-2">
                    {COPY_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setCopies(option);
                          handleDesignChange();
                        }}
                        className={`border rounded-xl px-3 py-2 text-sm font-semibold ${
                          copies === option
                            ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                            : "border-[var(--border)] hover:bg-gray-50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </Panel>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={createPreview}
              disabled={isCreatingPreview || isDownloading}
              className={`btn-primary inline-flex items-center justify-center gap-2 ${
                isCreatingPreview || isDownloading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isCreatingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {isCreatingPreview ? "Creating..." : "Done & Preview"}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || isCreatingPreview}
              className={`btn-primary inline-flex items-center justify-center gap-2 ${
                isDownloading || isCreatingPreview ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isDownloading ? "Processing..." : "Download JPG"}
            </button>

            <InfoPill label="Selected Size" value={selectedPreset.label} />
            <InfoPill label="Output" value={copies > 1 ? `${copies} copies sheet` : "Single photo"} />
          </div>
        </section>
      )}

      {/* FINAL PREVIEW */}
      {imageUrl && (
        <section className="bg-white border border-[var(--border)] rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold">Final Preview</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                This preview shows exactly what will be downloaded. No rounded preview styling is added.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <InfoPill label="Photo Size" value={`${outputWidth}×${outputHeight}px`} />
              <InfoPill label="Copies" value={copies} />
              <InfoPill
                label="Processing"
                value={processingTimeMs ? `${(processingTimeMs / 1000).toFixed(1)}s` : "-"}
                icon={Clock3}
              />
            </div>
          </div>

          <div className="border border-[var(--border)] bg-gray-50 p-4 min-h-[360px] flex items-center justify-center overflow-auto">
            {outputUrl ? (
              <img
                src={outputUrl}
                alt={copies > 1 ? "Passport photo copies sheet preview" : "Passport size photo preview"}
                className="max-h-[520px] w-auto border border-gray-200 bg-white"
                style={{ borderRadius: 0 }}
              />
            ) : (
              <div className="text-center p-6">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-[var(--primary)]" />
                <p className="text-sm text-[var(--text-secondary)] max-w-md">
                  After adjusting the photo, click <strong>Done & Preview</strong>. If you choose more than one copy, this preview will show the full copy sheet.
                </p>
              </div>
            )}
          </div>

          {outputBlob && (
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <InfoPill label="Final Size" value={formatBytes(outputBlob.size)} />
              <InfoPill label="File Name" value={outputName || "passport-photo.jpg"} />
              <InfoPill label="Preview Status" value={cropDone ? "Ready" : "Update needed"} />
            </div>
          )}

          <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              Please check the official passport or visa photo requirements before submission. Different countries may require different sizes, background colors, and head position rules.
            </p>
          </div>
        </section>
      )}

      <SuggestedTools currentToolId="passport-size-photo-maker" />
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-[var(--primary)]" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InputNumber({ label, value, onChange }) {
  return (
    <label>
      <span className="block text-sm font-medium mb-2">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
      />
    </label>
  );
}

function RangeInput({ label, min, max, step, value, onChange }) {
  return (
    <div className="mt-4">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full accent-[var(--primary)]"
      />
    </div>
  );
}

function InfoPill({ label, value, icon: Icon }) {
  return (
    <div className="border border-[var(--border)] rounded-xl px-4 py-3 bg-white min-w-0">
      <p className="text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1">
        {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
        {label}
      </p>
      <p className="font-bold text-[var(--primary)] break-words">{value}</p>
    </div>
  );
}
