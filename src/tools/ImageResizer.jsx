import { useState, useRef, useEffect } from "react";
import { Upload, Download, RotateCcw, Maximize2, Loader } from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

// Tool metadata for Image Resizer
export const toolData = {
  title: "Image Resizer",
  path: "/image-resizer",
  category: "Design Tools",
  description:
    "Upload and resize images with custom dimensions, zoom, drag, and presets for social media.",
  metaTitle: "Image Resizer Tool - Resize Images Easily | Next Online Tools",
  metaDescription:
    "Resize images online with custom width/height, drag, zoom, and quick presets for Facebook, Instagram, and YouTube. Download resized images instantly.",
};

export default function ImageResizer() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [img, setImg] = useState(null);
  const [imgType, setImgType] = useState("image/png");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false); // Processing state
  const [errorMessage, setErrorMessage] = useState(""); // Error message for invalid files

  // Handle image load
  const loadImage = (file) => {
    setErrorMessage("");
    setIsProcessing(true);
    setImgType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        setImg(image);
        setDimensions({ width: image.width, height: image.height });
        setScale(1);
        setOffset({ x: 0, y: 0 });
        setIsProcessing(false);
      };
      image.onerror = () => {
        setIsProcessing(false);
        setErrorMessage("Failed to load image. Please try again.");
      };
      image.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Draw image on canvas
  const drawImage = () => {
    if (!img) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const w = parseInt(dimensions.width);
    const h = parseInt(dimensions.height);

    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h); // Clear previous image

    const iw = img.width * scale;
    const ih = img.height * scale;
    const dx = offset.x + (w - iw) / 2;
    const dy = offset.y + (h - ih) / 2;

    ctx.drawImage(img, dx, dy, iw, ih);
  };

  // Redraw when dependencies change
  useEffect(() => {
    if (img) {
      console.log("Drawing image...");
      drawImage();
    }
  }, [img, scale, offset, dimensions]);

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPos({ x: e.nativeEvent.offsetX - offset.x, y: e.nativeEvent.offsetY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.nativeEvent.offsetX - startPos.x,
      y: e.nativeEvent.offsetY - startPos.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Preset setter
  const setPreset = (w, h) => {
    setDimensions({ width: w, height: h });
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Reset
  const resetImage = () => {
    if (!img) return;
    setDimensions({ width: img.width, height: img.height });
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Handle resizing of the image
  const handleResize = () => {
    if (img) {
      drawImage();
    }
  };

  // Download
  const downloadImage = () => {
    if (!img) {
      setErrorMessage("Upload and resize an image first!");
      return;
    }
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "resized-" + Date.now() + "." + imgType.split("/")[1];
    link.href = canvas.toDataURL(imgType);
    link.click();
  };

  const resetTool = () => {
    setImg(null);
    setDimensions({ width: 0, height: 0 });
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Maximize2 size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">
          Image Resizer
        </h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload and resize images with custom dimensions, zoom, drag, and presets for social media platforms. Download instantly.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Controls */}
          <div className="flex flex-col gap-6">
            {/* Upload Area */}
            <div>
              <h3 className="font-semibold mb-3">Upload Image</h3>
              <label className="block border-2 border-dashed border-[var(--border)] rounded-2xl p-8 text-center cursor-pointer hover:bg-[#f8f4ff] transition">
                <Upload size={36} className="mx-auto mb-4 text-[var(--primary)]" />
                <h2 className="text-lg font-semibold mb-2">
                  Select Image
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Click or drag & drop image here
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  hidden
                  onChange={(e) => e.target.files[0] && loadImage(e.target.files[0])}
                />
              </label>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                {errorMessage}
              </p>
            )}

            {/* Custom Dimensions */}
            {img && (
              <div>
                <h3 className="font-semibold mb-3">Custom Dimensions</h3>
                <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-sm text-[var(--text-secondary)] block mb-1">Width</label>
                      <input
                        type="number"
                        placeholder="Width"
                        className="w-full border border-[var(--border)] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        value={dimensions.width}
                        onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm text-[var(--text-secondary)] block mb-1">Height</label>
                      <input
                        type="number"
                        placeholder="Height"
                        className="w-full border border-[var(--border)] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        value={dimensions.height}
                        onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    Current: {parseInt(dimensions.width) || 0}×{parseInt(dimensions.height) || 0}px
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResize}
                      className="btn-primary flex-1"
                    >
                      Apply Resize
                    </button>
                    <button
                      onClick={resetImage}
                      className="btn-secondary flex-1"
                    >
                      Reset Size
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Zoom Control */}
            {img && (
              <div>
                <h3 className="font-semibold mb-3">Zoom: {(scale * 100).toFixed(0)}%</h3>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.05"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                  />
                  <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-2">
                    <span>10%</span>
                    <span>300%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Presets */}
            {img && (
              <div>
                <h3 className="font-semibold mb-3">Quick Presets</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Facebook</p>
                      <div className="flex gap-1">
                        <button onClick={() => setPreset(820, 312)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-[var(--primary)] hover:text-white transition border border-[var(--border)]">Cover</button>
                        <button onClick={() => setPreset(1080, 1080)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-[var(--primary)] hover:text-white transition border border-[var(--border)]">Post</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Instagram</p>
                      <div className="flex gap-1">
                        <button onClick={() => setPreset(1080, 1080)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-[var(--primary)] hover:text-white transition border border-[var(--border)]">Square</button>
                        <button onClick={() => setPreset(1080, 1350)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-[var(--primary)] hover:text-white transition border border-[var(--border)]">Post</button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">YouTube</p>
                      <div className="flex gap-1">
                        <button onClick={() => setPreset(1280, 720)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-[var(--primary)] hover:text-white transition border border-[var(--border)]">Thumb</button>
                        <button onClick={() => setPreset(2560, 1440)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-[var(--primary)] hover:text-white transition border border-[var(--border)]">Art</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Twitter</p>
                      <div className="flex gap-1">
                        <button onClick={() => setPreset(1500, 500)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-[var(--primary)] hover:text-white transition border border-[var(--border)]">Header</button>
                        <button onClick={() => setPreset(1024, 512)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-[var(--primary)] hover:text-white transition border border-[var(--border)]">Card</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Download Button */}
            {img && (
              <button
                onClick={downloadImage}
                className="btn-primary w-full"
              >
                <Download size={18} />
                Download Resized Image
              </button>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold">Preview</h3>
            <div className="border border-[var(--border)] rounded-2xl p-4 bg-gray-50 flex-1 flex items-center justify-center overflow-hidden">
              {!img ? (
                <p className="text-[var(--text-secondary)]">Upload an image to see preview</p>
              ) : (
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full rounded-xl border border-[var(--border)] cursor-grab active:cursor-grabbing shadow-sm"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              )}
            </div>
            
            {img && (
              <button
                onClick={resetTool}
                className="btn-secondary w-full"
              >
                <RotateCcw size={18} />
                Reset Tool
              </button>
            )}
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="image-resizer" />
    </div>
  );
}