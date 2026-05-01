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
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Passport Size Photo Maker",
  path: "/passport-size-photo-maker",
  category: "Image Tools",
  description:
    "Create passport size photos online. Upload, crop, choose size, set background color, and download.",
  metaTitle: "Passport Size Photo Maker | Create Passport Photo Online Free",
  metaDescription:
    "Create passport size photos online for free. Upload your photo, crop it, choose passport photo size, background color, and download a ready JPG image.",
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

const getPassportPhotoBlob = async ({
  imageSrc,
  pixelCrop,
  rotation,
  outputWidth,
  outputHeight,
  backgroundColor,
  quality,
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

  tempCanvas.width = bBoxWidth;
  tempCanvas.height = bBoxHeight;

  tempCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
  tempCtx.rotate(rotRad);
  tempCtx.translate(-image.width / 2, -image.height / 2);
  tempCtx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    throw new Error("Canvas is not supported.");
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    tempCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
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

  finalCtx.drawImage(croppedCanvas, 0, 0, outputWidth, outputHeight);

  return new Promise((resolve, reject) => {
    finalCanvas.toBlob(
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

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    return name.replace(/\.[^/.]+$/, "");
  };

  const isValidImageFile = (selectedFile) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/bmp"];
    return validTypes.includes(selectedFile.type);
  };

  const getSizeChange = () => {
    if (!file || !outputBlob) return "-";

    const difference = outputBlob.size - file.size;
    const percentage = Math.abs((difference / file.size) * 100).toFixed(1);

    if (difference > 0) return `${percentage}% larger`;
    if (difference < 0) return `${percentage}% smaller`;

    return "Same size";
  };

  const clearOutput = () => {
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
    }

    setOutputUrl("");
    setOutputBlob(null);
    setOutputName("");
  };

  const clearFeedback = () => {
    setError("");
    setSuccess("");
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
    setSuccess("Photo uploaded successfully. Adjust crop and create photo.");
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

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCreatePhoto = async () => {
    clearFeedback();
    clearOutput();

    if (!file || !imageUrl) {
      setError("Please upload a photo first.");
      return;
    }

    if (!croppedAreaPixels) {
      setError("Please adjust the crop area first.");
      return;
    }

    setIsProcessing(true);

    try {
      const blob = await getPassportPhotoBlob({
        imageSrc: imageUrl,
        pixelCrop: croppedAreaPixels,
        rotation,
        outputWidth,
        outputHeight,
        backgroundColor,
        quality,
      });

      const url = URL.createObjectURL(blob);
      const name = `${getBaseName(file.name)}-passport-photo.jpg`;

      setOutputBlob(blob);
      setOutputUrl(url);
      setOutputName(name);
      setSuccess("Passport size photo created successfully.");
    } catch (err) {
      setError("Could not create the photo. Please try another image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputUrl) return;

    const link = document.createElement("a");
    link.href = outputUrl;
    link.download = outputName || "passport-size-photo.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    setCrop({ x: 0, y: 0 });
    setZoom(1.1);
    setRotation(0);
    setCroppedAreaPixels(null);

    setIsDragging(false);
    setIsProcessing(false);
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
            <FileImage className="w-7 h-7 text-[var(--primary)]" />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-3">
              Passport Size Photo Maker
            </h1>
            <p className="text-[var(--text-secondary)]">
              Upload your photo, crop it, choose a passport photo size, set JPG
              quality, and download a ready-to-use passport-style photo.
            </p>
          </div>
        </div>
      </section>

      {/* UPLOAD */}
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

          <h2 className="text-xl font-semibold mb-2">Upload Photo</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-5">
            Drag and drop your photo here, or click the button below.
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
      </section>

      {/* EDITOR */}
      {imageUrl && (
        <section className="bg-white border rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CropIcon className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-xl font-bold">Crop Your Photo</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="relative w-full h-[430px] bg-gray-900 rounded-2xl overflow-hidden">
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={handleCropComplete}
                  showGrid={true}
                />
              </div>

              <p className="text-sm text-[var(--text-secondary)] mt-3">
                Tip: Keep your face centered and leave enough space around the
                head and shoulders.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Settings2 className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="font-semibold">Photo Size</h3>
                </div>

                <label className="block text-sm font-medium mb-2">
                  Select size
                </label>

                <select
                  value={presetId}
                  onChange={(e) => {
                    setPresetId(e.target.value);
                    clearOutput();
                  }}
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                  {PHOTO_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>

                <p className="text-sm text-[var(--text-secondary)] mt-3">
                  Output: {outputWidth} × {outputHeight}px
                </p>

                {presetId === "custom" && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Width px
                      </label>
                      <input
                        type="number"
                        value={customWidth}
                        onChange={(e) => {
                          setCustomWidth(e.target.value);
                          clearOutput();
                        }}
                        className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Height px
                      </label>
                      <input
                        type="number"
                        value={customHeight}
                        onChange={(e) => {
                          setCustomHeight(e.target.value);
                          clearOutput();
                        }}
                        className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="font-semibold">Background Color</h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        setBackgroundColor(color.value);
                        clearOutput();
                      }}
                      className={`border rounded-xl px-3 py-2 text-sm font-medium ${
                        backgroundColor === color.value
                          ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                          : "border-gray-200"
                      }`}
                    >
                      <span
                        className="inline-block w-4 h-4 rounded-full border mr-2 align-middle"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.label}
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-medium mt-4 mb-2">
                  Custom color
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

                <p className="text-xs text-[var(--text-secondary)] mt-3">
                  Note: This does not automatically remove complex photo
                  backgrounds. Use a plain background photo for best results.
                </p>
              </div>

              <div className="border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersHorizontal className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="font-semibold">Adjustments</h3>
                </div>

                <label className="block text-sm font-medium mb-2">
                  Zoom: {zoom.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => {
                    setZoom(Number(e.target.value));
                    clearOutput();
                  }}
                  className="w-full accent-[var(--primary)] mb-4"
                />

                <label className="block text-sm font-medium mb-2">
                  Rotation: {rotation}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={rotation}
                  onChange={(e) => {
                    setRotation(Number(e.target.value));
                    clearOutput();
                  }}
                  className="w-full accent-[var(--primary)] mb-4"
                />

                <label className="block text-sm font-medium mb-2">
                  JPG Quality: {quality}%
                </label>
                <input
                  type="range"
                  min="60"
                  max="100"
                  step="1"
                  value={quality}
                  onChange={(e) => {
                    setQuality(Number(e.target.value));
                    clearOutput();
                  }}
                  className="w-full accent-[var(--primary)]"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="button"
              onClick={handleCreatePhoto}
              disabled={isProcessing}
              className={`btn-primary inline-flex items-center justify-center gap-2 ${
                isProcessing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Zap className="w-4 h-4" />
              {isProcessing ? "Creating..." : "Create Passport Photo"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>

            {outputUrl && (
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
      )}

      {/* RESULT DETAILS */}
      {file && (
        <section className="bg-white border rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Photo Details</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Selected Size
              </p>
              <p className="text-xl font-bold">{selectedPreset.label}</p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Output Pixels
              </p>
              <p className="text-xl font-bold">
                {outputWidth} × {outputHeight}
              </p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Original Size
              </p>
              <p className="text-xl font-bold">{formatBytes(file.size)}</p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Final Size
              </p>
              <p className="text-xl font-bold">
                {outputBlob ? formatBytes(outputBlob.size) : "-"}
              </p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Size Change
              </p>
              <p className="text-xl font-bold">{getSizeChange()}</p>
            </div>
          </div>
        </section>
      )}

      {/* PREVIEW */}
      {imageUrl && (
        <section className="bg-white border rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Preview</h2>

          <div className="grid lg:grid-cols-2 gap-5">
            <div className="border rounded-2xl p-5 bg-gray-50">
              <h3 className="font-semibold mb-3">Original Photo</h3>

              <div className="min-h-80 rounded-2xl border bg-white flex items-center justify-center p-3">
                <img
                  src={imageUrl}
                  alt="Original preview"
                  className="max-h-96 w-auto rounded-xl shadow-sm"
                />
              </div>
            </div>

            <div className="border rounded-2xl p-5 bg-gray-50">
              <h3 className="font-semibold mb-3">Passport Size Photo</h3>

              <div className="min-h-80 rounded-2xl border bg-white flex items-center justify-center p-3">
                {outputUrl ? (
                  <img
                    src={outputUrl}
                    alt="Passport size preview"
                    className="max-h-96 w-auto rounded-xl shadow-sm"
                  />
                ) : (
                  <div className="text-center p-6">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 text-[var(--primary)]" />
                    <p className="text-sm text-[var(--text-secondary)]">
                      Final passport photo preview will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              Please check the official passport or visa photo requirements
              before submission. Different countries may require different photo
              sizes, background colors, and head position rules.
            </p>
          </div>
        </section>
      )}

      {/* SUGGESTED TOOLS */}
      <SuggestedTools currentToolId="passport-size-photo-maker" />
    </div>
  );
}