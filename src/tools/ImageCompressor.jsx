import { useState, useRef } from "react";
import Compressor from "compressorjs"; // Using Compressor.js for advanced compression

export default function ImageCompressor() {
  const [file, setFile] = useState(null);
  const [compressed, setCompressed] = useState(null);
  const [quality, setQuality] = useState(0.9);  // Default compression quality
  const [isCompressing, setIsCompressing] = useState(false);
  const [sizeInfo, setSizeInfo] = useState(null);
  const canvasRef = useRef(null);

  // Handle file upload
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

  // Compress the uploaded image
  const handleCompress = () => {
    if (!file) return alert("Please select an image first.");
    setIsCompressing(true);

    new Compressor(file, {
      quality: quality, // Set quality based on slider value
      success(result) {
        setCompressed(URL.createObjectURL(result));
        setSizeInfo({
          original: (file.size / 1024).toFixed(1),
          compressed: (result.size / 1024).toFixed(1),
        });
        setIsCompressing(false);
      },
      error(err) {
        console.error("Compression Error:", err);
        setIsCompressing(false);
      },
    });
  };

  // Download the compressed image
  const handleDownload = () => {
    if (!compressed) return;
    const link = document.createElement("a");
    link.href = compressed;
    const ext = compressed.includes("image/webp") ? "webp" : file.name.split(".").pop();
    link.download = `compressed-${file.name.replace(/\.[^/.]+$/, "")}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    </div>
  );
}