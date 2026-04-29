// src/tools/ColorPicker.jsx
import { useState, useRef, useEffect } from "react";
import { Upload, Copy, RotateCcw, Pipette, Check } from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Color Picker",
  path: "/tool/color-picker",
  category: "Design Tools",
  description: "Pick colors from images with precision. Get HEX, RGB, and HSL values instantly.",
  metaTitle: "Color Picker Tool - Pick Colors from Images | Next Online Tools",
  metaDescription: "Pick colors from images online. Get HEX, RGB, and HSL color codes instantly. Perfect for designers and developers.",
};

export default function ColorPicker() {
  const canvasRef = useRef(null);
  const magnifierRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [picked, setPicked] = useState(false);
  const [imgObj, setImgObj] = useState(null);
  const [color, setColor] = useState("#9B6CE3");
  const [rgb, setRgb] = useState({ r: 155, g: 108, b: 227 });
  const [hsl, setHsl] = useState({ h: 265, s: 61, l: 66 });
  const [copiedFormat, setCopiedFormat] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const imageInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const imageUrlRef = useRef(null);

  // Handlers that deal with file input / drop / paste — only attach once
  useEffect(() => {
    function loadImage(file) {
      if (!file) return;
      console.log("Loading image:", file.name, file.size);
      setError("");
      setIsLoading(true);
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      imageUrlRef.current && URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = objectUrl;

      img.onload = () => {
        console.log("Image loaded successfully:", img.width, "x", img.height);
        setImgObj(img);
        setImageLoaded(true);
        setPicked(false);
        setIsLoading(false);
      };
      img.onerror = () => {
        console.error("Failed to load image");
        setError("Failed to load image. Please try another file.");
        setIsLoading(false);
      };
      img.src = objectUrl;
    }

    const dropZone = dropZoneRef.current;
    const inputEl = imageInputRef.current;

    function onDrop(e) {
      e.preventDefault();
      if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
    }
    function onDragOver(e) { e.preventDefault(); }
    function onDropZoneClick() { inputEl && inputEl.click(); }
    function onInputChange(e) {
      if (e.target.files[0]) loadImage(e.target.files[0]);
      e.target.value = "";
    }
    function onPaste(e) {
      const items = e.clipboardData.items || [];
      for (let item of items) {
        if (item.type && item.type.startsWith("image/")) {
          loadImage(item.getAsFile());
          break;
        }
      }
    }

    dropZone && dropZone.addEventListener("click", onDropZoneClick);
    dropZone && dropZone.addEventListener("dragover", onDragOver);
    dropZone && dropZone.addEventListener("drop", onDrop);
    inputEl && inputEl.addEventListener("change", onInputChange);
    document.addEventListener("paste", onPaste);

    return () => {
      dropZone && dropZone.removeEventListener("click", onDropZoneClick);
      dropZone && dropZone.removeEventListener("dragover", onDragOver);
      dropZone && dropZone.removeEventListener("drop", onDrop);
      inputEl && inputEl.removeEventListener("change", onInputChange);
      document.removeEventListener("paste", onPaste);
      imageUrlRef.current && URL.revokeObjectURL(imageUrlRef.current);
    };
  }, []);

  // Canvas + magnifier interactions — attach/cleanup when canvas or state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const magnifier = magnifierRef.current;
    if (!canvas || !magnifier) return;
    const ctx = canvas.getContext("2d");
    const mtx = magnifier.getContext("2d");

    function updateCodes(hex) {
      setColor(hex);
      const newRgb = hexToRgb(hex);
      setRgb(newRgb);
      setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
    }

    function updateMagnifier(e) {
      if (!imageLoaded || picked) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);

      const zoom = 15;
      const size = magnifier.width / zoom;

      mtx.clearRect(0, 0, magnifier.width, magnifier.height);
      mtx.imageSmoothingEnabled = false;
      mtx.drawImage(canvas, x - size / 2, y - size / 2, size, size, 0, 0, magnifier.width, magnifier.height);

      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
      updateCodes(hex);

      mtx.save();

      const cx = Math.floor(magnifier.width / 2);
      const cy = Math.floor(magnifier.height / 2);

      mtx.strokeStyle = "rgba(255,255,255,0.95)";
      mtx.lineWidth = 2;
      mtx.beginPath();
      mtx.moveTo(cx, 0); mtx.lineTo(cx, magnifier.height);
      mtx.moveTo(0, cy); mtx.lineTo(magnifier.width, cy);
      mtx.stroke();

      mtx.strokeStyle = "rgba(0,0,0,0.6)";
      mtx.lineWidth = 1;
      mtx.beginPath();
      mtx.moveTo(cx, 0); mtx.lineTo(cx, magnifier.height);
      mtx.moveTo(0, cy); mtx.lineTo(magnifier.width, cy);
      mtx.stroke();

      mtx.beginPath();
      mtx.fillStyle = "rgba(255,255,255,0.95)";
      mtx.arc(cx, cy, 4, 0, Math.PI * 2);
      mtx.fill();
      mtx.beginPath();
      mtx.fillStyle = "rgba(0,0,0,0.6)";
      mtx.arc(cx, cy, 2, 0, Math.PI * 2);
      mtx.fill();

      mtx.restore();

      magnifier.style.display = "block";
      let left = e.clientX + 20, top = e.clientY + 20;
      if (left + magnifier.width > window.innerWidth) left = e.clientX - magnifier.width - 20;
      if (top + magnifier.height > window.innerHeight) top = e.clientY - magnifier.height - 20;
      magnifier.style.left = `${left}px`;
      magnifier.style.top = `${top}px`;
    }

    function pickColor(e) {
      if (!imageLoaded) return;
      setPicked(true);
      magnifier.style.display = "none";

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);

      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
      updateCodes(hex);
    }

    function onMouseLeave() {
      if (!picked) magnifier.style.display = "none";
    }

    canvas.addEventListener("mousemove", updateMagnifier);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("click", pickColor);

    return () => {
      canvas.removeEventListener("mousemove", updateMagnifier);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("click", pickColor);
    };
  }, [imageLoaded, picked]);

  // Handle canvas sizing after image loads
  useEffect(() => {
    if (imageLoaded && imgObj && canvasRef.current) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        console.log("Canvas sizing effect triggered", { imageLoaded, imgObj });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        // Get the container width for proper sizing
        const container = canvas.parentElement;
        const maxWidth = container ? Math.max(container.clientWidth - 32, 300) : 600; // Minimum 300px
        const maxHeight = 400; // Reduced from 500

        let width = imgObj.width;
        let height = imgObj.height;

        console.log("Original image size:", { width, height });
        console.log("Container size:", { maxWidth, maxHeight });

        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width *= ratio;
        height *= ratio;

        console.log("Scaled image size:", { width, height, ratio });

        // Set canvas display size
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // Set canvas drawing size (important for high DPI)
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;

        // Scale the drawing context so everything draws at the correct size
        ctx.scale(devicePixelRatio, devicePixelRatio);

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(imgObj, 0, 0, width, height);
        console.log("Image drawn to canvas");
      }, 100);
    }
  }, [imageLoaded, imgObj]);

  const DEFAULT_COLOR = {
    color: "#9B6CE3",
    rgb: { r: 155, g: 108, b: 227 },
    hsl: { h: 265, s: 61, l: 66 },
  };

  function resetTool() {
    setImageLoaded(false);
    setPicked(false);
    setImgObj(null);
    setColor(DEFAULT_COLOR.color);
    setRgb(DEFAULT_COLOR.rgb);
    setHsl(DEFAULT_COLOR.hsl);
    setCopiedFormat("");
    setError("");
    setIsLoading(false);
    if (imageInputRef.current) imageInputRef.current.value = "";

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.width = "";
      canvas.style.height = "";
    }

    const m = magnifierRef.current;
    if (m) m.style.display = "none";
  }

  function rgbToHex(r,g,b){ return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); }
  function hexToRgb(hex){
    let r = parseInt(hex.slice(1,3),16);
    let g = parseInt(hex.slice(3,5),16);
    let b = parseInt(hex.slice(5,7),16);
    return {r,g,b};
  }
  function rgbToHsl(r,g,b){
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h=0,s=0,l=(max+min)/2;
    if(max!==min){
      const d=max-min;
      s=l>0.5?d/(2-max-min):d/(max+min);
      switch(max){
        case r:h=(g-b)/d+(g<b?6:0);break;
        case g:h=(b-r)/d+2;break;
        case b:h=(r-g)/d+4;break;
      }
      h/=6;
    }
    return {h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)};
  }

  function copyText(text, format) {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(""), 2000);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Pipette size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">
          Color Picker
        </h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Pick colors directly from images with precision. Get HEX, RGB, and HSL values instantly. Upload, paste, or drag & drop images.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        {/* Upload Area */}
        {!imageLoaded && (
          <div className="mb-8">
            <label
              ref={dropZoneRef}
              className="block border-2 border-dashed border-[var(--border)] rounded-2xl p-8 text-center cursor-pointer hover:bg-[#f8f4ff] transition"
            >
              <Upload size={36} className="mx-auto mb-4 text-[var(--primary)]" />
              <h2 className="text-xl font-semibold mb-2">
                Upload Image
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Click to upload or drag & drop • Paste with Ctrl+V
              </p>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                hidden
              />
            </label>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg mb-4">
            {error}
          </p>
        )}

        {/* Canvas and Color Panel */}
        {imageLoaded && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left - Canvas Preview */}
            <div className="lg:col-span-2">
              <h3 className="font-semibold mb-3">Image Preview</h3>
              <div className="border border-[var(--border)] rounded-2xl p-4 bg-gray-50 flex items-center justify-center overflow-hidden min-h-[200px] w-full">
                {isLoading && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-2"></div>
                    <p className="text-sm text-[var(--text-secondary)]">Loading image...</p>
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className="rounded-xl border border-[var(--border)] cursor-crosshair shadow-sm"
                  style={{
                    display: imageLoaded && !isLoading ? 'block' : 'none',
                    maxWidth: '100%',
                    maxHeight: '400px'
                  }}
                />
                {imageLoaded && !isLoading && (
                  <canvas
                    ref={magnifierRef}
                    width="250"
                    height="250"
                    className="fixed rounded-full border-4 border-white hidden pointer-events-none z-50 shadow-lg"
                  />
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-3">
                💡 Hover to preview • Click to pick color
              </p>
            </div>

            {/* Right - Color Info */}
            <div>
              <h3 className="font-semibold mb-3">Picked Color</h3>

              {/* Color Preview */}
              <div
                className="w-full h-24 rounded-2xl flex items-center justify-center text-white font-bold text-lg border-4 border-white shadow-md mb-4 transition"
                style={{ background: color }}
              >
                {color.toUpperCase()}
              </div>

              {/* Color Values */}
              <div className="space-y-3">
                {/* HEX */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">HEX</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono font-semibold text-sm">
                      {color.toUpperCase()}
                    </code>
                    <button
                      onClick={() => copyText(color, "hex")}
                      className={`p-1.5 rounded transition ${
                        copiedFormat === "hex"
                          ? "bg-green-500 text-white"
                          : "bg-white border border-[var(--border)] hover:bg-gray-100"
                      }`}
                      title="Copy HEX"
                    >
                      {copiedFormat === "hex" ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* RGB */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">RGB</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono font-semibold text-sm">
                      rgb({rgb.r}, {rgb.g}, {rgb.b})
                    </code>
                    <button
                      onClick={() => copyText(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, "rgb")}
                      className={`p-1.5 rounded transition ${
                        copiedFormat === "rgb"
                          ? "bg-green-500 text-white"
                          : "bg-white border border-[var(--border)] hover:bg-gray-100"
                      }`}
                      title="Copy RGB"
                    >
                      {copiedFormat === "rgb" ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* HSL */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">HSL</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono font-semibold text-sm">
                      hsl({hsl.h}, {hsl.s}%, {hsl.l}%)
                    </code>
                    <button
                      onClick={() => copyText(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, "hsl")}
                      className={`p-1.5 rounded transition ${
                        copiedFormat === "hsl"
                          ? "bg-green-500 text-white"
                          : "bg-white border border-[var(--border)] hover:bg-gray-100"
                      }`}
                      title="Copy HSL"
                    >
                      {copiedFormat === "hsl" ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* RGB Values */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-red-50 p-2 rounded text-center">
                    <p className="text-xs text-gray-600">R</p>
                    <p className="font-semibold text-red-600">{rgb.r}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded text-center">
                    <p className="text-xs text-gray-600">G</p>
                    <p className="font-semibold text-green-600">{rgb.g}</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <p className="text-xs text-gray-600">B</p>
                    <p className="font-semibold text-blue-600">{rgb.b}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {imageLoaded && (
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="btn-primary flex-1"
            >
              <Upload size={18} />
              Upload New
            </button>
            <button
              onClick={resetTool}
              className="btn-secondary flex-1"
            >
              <RotateCcw size={18} />
              Reset
            </button>
          </div>
        )}
      </section>

      <SuggestedTools currentToolId="color-picker" />
    </div>
  );
}