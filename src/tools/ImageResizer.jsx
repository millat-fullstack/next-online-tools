import { useState, useRef, useEffect } from "react";
import { Send, Loader } from "lucide-react"; // Lucide icons for loading and submit

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
    if (!img) return alert("Upload and resize an image first!");
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "resized." + imgType.split("/")[1];
    link.href = canvas.toDataURL(imgType);
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#f8f6fb] p-6 space-y-6">
      <h1 className="text-3xl text-center font-bold text-[#6b4de6]">📏 Image Resizer Tool</h1>

      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
        {/* Left Panel */}
        <div className="flex-1 bg-white rounded-2xl p-6 shadow-md space-y-4">
          <h2 className="text-xl font-semibold text-[#6b4de6]">Upload & Resize</h2>

          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:bg-gray-50"
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
            }}
          >
            <p>Click or drag & drop image here</p>
            <input type="file" ref={fileInputRef} accept="image/*" hidden onChange={(e) => e.target.files[0] && loadImage(e.target.files[0])} />
          </div>

          {/* Custom size */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              placeholder="Width"
              className="border border-gray-300 rounded p-2 w-24"
              value={dimensions.width}
              onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
            />
            x
            <input
              type="number"
              placeholder="Height"
              className="border border-gray-300 rounded p-2 w-24"
              value={dimensions.height}
              onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
            />
            <button onClick={handleResize} className="bg-[#8d6bcb] hover:bg-[#7552b6] text-white rounded px-4 py-2 font-semibold">Resize</button>
            <button onClick={resetImage} className="bg-[#6EC3E3] hover:bg-[#4aa9d0] text-white rounded px-4 py-2 font-semibold">Reset</button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-2">
            <label className="font-semibold">Zoom:</label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.01"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <h3 className="font-semibold text-[#6b4de6]">Quick Presets</h3>
            <div className="flex flex-wrap gap-2">
              {/* Facebook */}
              <button onClick={() => setPreset(820, 312)} className="bg-[#3b5998] text-white px-3 py-1 rounded">FB Cover</button>
              <button onClick={() => setPreset(1200, 628)} className="bg-[#3b5998] text-white px-3 py-1 rounded">FB Ad</button>
              <button onClick={() => setPreset(1080, 1080)} className="bg-[#3b5998] text-white px-3 py-1 rounded">FB Post</button>
              {/* Instagram */}
              <button onClick={() => setPreset(1080, 1080)} className="bg-[#C13584] text-white px-3 py-1 rounded">IG Square</button>
              <button onClick={() => setPreset(1080, 1350)} className="bg-[#C13584] text-white px-3 py-1 rounded">IG Portrait</button>
              <button onClick={() => setPreset(1080, 566)} className="bg-[#C13584] text-white px-3 py-1 rounded">IG Landscape</button>
              {/* YouTube */}
              <button onClick={() => setPreset(2560, 1440)} className="bg-[#FF0000] text-white px-3 py-1 rounded">YT Channel Art</button>
              <button onClick={() => setPreset(1280, 720)} className="bg-[#FF0000] text-white px-3 py-1 rounded">YT Thumbnail</button>
            </div>
          </div>

          <button onClick={downloadImage} className="mt-4 bg-[#9B6CE3] hover:bg-[#7D4EDB] text-white rounded px-4 py-2 font-semibold w-full">⬇️ Download Resized Image</button>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-white rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-semibold text-[#6b4de6]">Preview</h2>
          <canvas
            ref={canvasRef}
            className="w-full rounded-lg mt-4 border border-gray-300 cursor-grab"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>
    </div>
  );
}