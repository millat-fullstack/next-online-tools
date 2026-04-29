import React, { useState, useRef } from "react";
import { Cropper } from "react-cropper";
import "../styles/cropper.min.css";
import { Download, RotateCcw, Image } from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Image Cropper Tool",
  path: "/image-cropper-tool",
  category: "Design Tools",
  description:
    "Upload an image, crop it using various selection types, and download the cropped image in JPG/PNG format.",
  metaTitle: "Image Cropper Tool | Crop Images Smoothly Online",
  metaDescription:
    "Upload, crop, and download your image using free crop or square crop selection methods. Available in JPG/PNG formats.",
};

export default function ImageCropperTool() {
  const [image, setImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [cropType, setCropType] = useState("square");
  const [cropperKey, setCropperKey] = useState(0);
  const [error, setError] = useState("");

  const cropperRef = useRef(null);
  const croppedCanvasRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setError("Please upload a valid image.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result);
      setCroppedImage(null);
      croppedCanvasRef.current = null;
      setError("");
      setCropperKey((prev) => prev + 1);
    };

    reader.readAsDataURL(file);
  };

  const handleCropTypeChange = (type) => {
    setCropType(type);
    setCroppedImage(null);
    croppedCanvasRef.current = null;
    setError("");

    // Remount cropper so previous crop box disappears
    setCropperKey((prev) => prev + 1);
  };

  const handleCrop = () => {
    const cropper = cropperRef.current?.cropper;

    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });

    if (!canvas) {
      setError("Please select an area to crop first.");
      return;
    }

    const croppedDataUrl = canvas.toDataURL("image/png");

    croppedCanvasRef.current = canvas;
    setCroppedImage(croppedDataUrl);
    setError("");
  };

  const handleDownload = (format = "image/jpeg") => {
    if (!croppedCanvasRef.current) return;

    const extension = format === "image/jpeg" ? "jpg" : "png";
    const quality = format === "image/jpeg" ? 0.92 : undefined;

    const dataUrl = croppedCanvasRef.current.toDataURL(format, quality);

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `cropped_image.${extension}`;
    link.click();
  };

  const resetTool = () => {
    setImage(null);
    setCroppedImage(null);
    croppedCanvasRef.current = null;
    setCropType("square");
    setError("");
    setCropperKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Image size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Image Cropper Tool</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload an image, crop it using square crop or free crop, and download
          the cropped image in JPG or PNG format.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        {/* Image Upload */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Image size={20} className="text-[var(--primary)]" />
            <h2 className="text-xl font-semibold">Upload Image</h2>
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full p-4 rounded-2xl border border-[var(--border)] bg-white outline-none focus:border-[var(--primary)] transition"
          />

          {error && (
            <p className="mt-5 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">
              {error}
            </p>
          )}
        </div>

        {image && (
          <div className="mt-6">
            {/* Crop Type Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <button
                onClick={() => handleCropTypeChange("square")}
                className={`btn-secondary ${
                  cropType === "square"
                    ? "bg-[#6EC3E3] text-white border-[#6EC3E3]"
                    : ""
                }`}
              >
                Square Crop
              </button>

              <button
                onClick={() => handleCropTypeChange("free")}
                className={`btn-secondary ${
                  cropType === "free"
                    ? "bg-[#6EC3E3] text-white border-[#6EC3E3]"
                    : ""
                }`}
              >
                Free Crop
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              {/* Cropper Area */}
              <div className="w-full">
                <Cropper
                  key={cropperKey}
                  ref={cropperRef}
                  src={image}
                  style={{
                    height: 440,
                    width: "100%",
                    borderRadius: "18px",
                    overflow: "hidden",
                  }}
                  aspectRatio={cropType === "square" ? 1 : NaN}
                  initialAspectRatio={cropType === "square" ? 1 : NaN}
                  guides={true}
                  viewMode={1}
                  autoCrop={cropType === "square"}
                  autoCropArea={0.8}
                  dragMode="crop"
                  movable={true}
                  zoomable={true}
                  scalable={true}
                  rotatable={false}
                  cropBoxMovable={true}
                  cropBoxResizable={true}
                  background={false}
                  responsive={true}
                  checkOrientation={false}
                />

                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  {cropType === "free"
                    ? "Free Crop: click and drag on the image to draw your own square or rectangle crop area."
                    : "Square Crop: adjust the square crop box and click Crop Image."}
                </p>
              </div>

              {/* Right Side Preview Only */}
              <div className="border border-[var(--border)] rounded-2xl bg-white p-4 flex flex-col">
                <h3 className="font-semibold mb-3 text-center">
                  Cropped Preview
                </h3>

                <div className="w-full h-[260px] flex justify-center items-center rounded-xl bg-[#fafafa] border border-[var(--border)] overflow-hidden">
                  {croppedImage ? (
                    <img
                      src={croppedImage}
                      alt="Cropped Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <p className="text-center text-sm text-[var(--text-secondary)] px-4">
                      No preview yet. Select an area and click Crop Image.
                    </p>
                  )}
                </div>

                {croppedImage && (
                  <div className="mt-4 space-y-3">
                    <button
                      onClick={() => handleDownload("image/jpeg")}
                      className="btn-primary w-full"
                    >
                      <Download size={18} />
                      Download JPG
                    </button>

                    <button
                      onClick={() => handleDownload("image/png")}
                      className="btn-secondary w-full"
                    >
                      <Download size={18} />
                      Download PNG
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button onClick={handleCrop} className="btn-primary w-full">
                Crop Image
              </button>

              <button onClick={resetTool} className="btn-secondary">
                <RotateCcw size={18} />
                Reset
              </button>
            </div>
          </div>
        )}
      </section>

      <SuggestedTools currentToolId="image-cropper-tool" />
    </div>
  );
}