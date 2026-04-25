import { useState, useRef, Suspense, lazy } from "react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export default function ImageCompressor() {
  const [file, setFile] = useState(null);
  const [compressed, setCompressed] = useState(null);
  const [quality, setQuality] = useState(0.9);
  const [isCompressing, setIsCompressing] = useState(false);
  const [sizeInfo, setSizeInfo] = useState(null);
  const canvasRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }
    setFile(selectedFile);
    setCompressed(null);
    setSizeInfo(null);
  };

  const handleCompress = () => {
    if (!file) return alert("Please select an image first.");

    setIsCompressing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        let { width, height } = img;
        const maxDimension = 1920;

        // 1️⃣ Resize large images proportionally
        if (width > maxDimension || height > maxDimension) {
          const scale = maxDimension / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        let mimeType = file.type;
        let useWebP = false;

        // 2️⃣ Detect WebP support
        const testCanvas = document.createElement("canvas");
        if (
          testCanvas.toDataURL("image/webp").indexOf("data:image/webp") === 0
        ) {
          useWebP = true;
        }

        // 3️⃣ Use WebP if supported (except GIF)
        if (useWebP && file.type !== "image/gif") {
          mimeType = "image/webp";
        }

        // 4️⃣ Adjust quality dynamically
        let dynamicQuality = quality;
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 5) dynamicQuality = 0.75;
        else if (fileSizeMB > 2) dynamicQuality = 0.85;
        else dynamicQuality = 0.9;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setCompressed(url);
              setSizeInfo({
                original: (file.size / 1024).toFixed(1),
                compressed: (blob.size / 1024).toFixed(1),
              });
            }
            setIsCompressing(false);
          },
          mimeType,
          dynamicQuality
        );
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!compressed) return;
    const link = document.createElement("a");
    link.href = compressed;
    const ext = compressed.includes("image/webp") ? "webp" : file.name.split(".").pop();
    link.download = `compressed-${file.name.replace(/\.[^/.]+$/, "")}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      if (compressed) URL.revokeObjectURL(compressed);
    }, 1500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-[#333333]">
      <h1 className="text-3xl font-bold text-center mb-4 text-[#9B6CE3]">
        Image Compressor
      </h1>
      <p className="text-center text-[#666666] mb-6">
        Compress images directly in the browser. No uploads, fully secure.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl shadow p-6 space-y-4">
        {/* Upload */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full border border-gray-300 rounded-lg p-2 text-sm text-[#333333] cursor-pointer"
        />

        {/* Quality Slider */}
        {file && (
          <div>
            <label className="block mb-1 text-[#333333] font-medium">
              Quality: {Math.round(quality * 100)}%
            </label>
            <input
              type="range"
              min="0.7"
              max="1"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full accent-[#9B6CE3]"
            />
          </div>
        )}

        {/* Compress Button */}
        {file && (
          <button
            onClick={handleCompress}
            disabled={isCompressing}
            className={`w-full py-2 rounded-xl font-medium transition ${
              isCompressing
                ? "bg-gray-300 cursor-not-allowed text-gray-600"
                : "bg-[#9B6CE3] hover:bg-[#7D4EDB] text-white"
            }`}
          >
            {isCompressing ? "Compressing..." : "Compress Image"}
          </button>
        )}

        {/* File Info */}
        {sizeInfo && (
          <div className="text-center text-sm text-[#666666]">
            <p>Original Size: {sizeInfo.original} KB</p>
            <p>Compressed Size: {sizeInfo.compressed} KB</p>
          </div>
        )}

        {/* Compressed Preview */}
        {compressed && (
          <div className="text-center mt-4">
            <img
              src={compressed}
              alt="Compressed Preview"
              className="mx-auto max-h-64 rounded-lg shadow"
            />
            <button
              onClick={handleDownload}
              className="mt-3 px-4 py-2 rounded-xl font-medium border border-[#9B6CE3] text-[#9B6CE3] hover:bg-[#9B6CE3] hover:text-white transition"
            >
              Download Compressed Image
            </button>
          </div>
        )}
      </div>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />


      {/* Suggested Tools */}
      <SuggestedTools currentToolPath="/image-compressor" />
    </div>
  );
}
