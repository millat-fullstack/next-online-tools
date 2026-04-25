// src/pages/ColorPicker.jsx
import { useState, useRef, useEffect } from "react";

export default function ColorPicker() {
  const canvasRef = useRef(null);
  const magnifierRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [picked, setPicked] = useState(false);
  const [imgObj, setImgObj] = useState(null);
  const [color, setColor] = useState("#9B6CE3");
  const [rgb, setRgb] = useState({ r: 155, g: 108, b: 227 });
  const [hsl, setHsl] = useState({ h: 265, s: 61, l: 66 });

  const imageInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const imageUrlRef = useRef(null);

  // Handlers that deal with file input / drop / paste — only attach once
  useEffect(() => {
    function loadImage(file) {
      if (!file) return;
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      imageUrlRef.current && URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = objectUrl;

      img.onload = () => {
        setImgObj(img);
        setImageLoaded(true);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const maxWidth = canvas.clientWidth;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;

        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width *= ratio;
        height *= ratio;

        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
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
      // clear value so same file can be picked again
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
  }, []); // run once

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

      // read pixel from main canvas
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
      updateCodes(hex);

      // draw crosshair + center marker on magnifier (no info box)
      mtx.save();

      const cx = Math.floor(magnifier.width / 2);
      const cy = Math.floor(magnifier.height / 2);

      // outer crosshair (white)
      mtx.strokeStyle = "rgba(255,255,255,0.95)";
      mtx.lineWidth = 2;
      mtx.beginPath();
      mtx.moveTo(cx, 0); mtx.lineTo(cx, magnifier.height);
      mtx.moveTo(0, cy); mtx.lineTo(magnifier.width, cy);
      mtx.stroke();

      // inner darker line for contrast
      mtx.strokeStyle = "rgba(0,0,0,0.6)";
      mtx.lineWidth = 1;
      mtx.beginPath();
      mtx.moveTo(cx, 0); mtx.lineTo(cx, magnifier.height);
      mtx.moveTo(0, cy); mtx.lineTo(magnifier.width, cy);
      mtx.stroke();

      // center marker (ring)
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

  const DEFAULT_COLOR = {
    color: "#9B6CE3",
    rgb: { r: 155, g: 108, b: 227 },
    hsl: { h: 265, s: 61, l: 66 },
  };

  function resetPick() {
    setPicked(false);
    setColor(DEFAULT_COLOR.color);
    setRgb(DEFAULT_COLOR.rgb);
    setHsl(DEFAULT_COLOR.hsl);

    // ensure magnifier hidden until user moves over canvas again
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

  function copyText(text) {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  }

  return (
    <div className="min-h-screen bg-bgLight p-6 flex flex-col gap-8">
      <h1 className="text-3xl font-bold text-center text-primary">🎨 Color Picker Tool</h1>
      <p className="text-center text-textSecondary max-w-xl mx-auto">
        Upload, paste, or drag & drop an image. Hover to preview. Click to pick color.
      </p>

      <div className="flex flex-col md:flex-row gap-6 max-w-screen-2xl mx-auto">
        {/* Left panel */}
        <div className="flex-[1.4] bg-white p-4 rounded-xl shadow-md">
          {!imageLoaded && (
            <div
              ref={dropZoneRef}
              className="border-2 border-dashed border-primary p-10 text-center cursor-pointer rounded-lg hover:bg-gray-50 transition mb-4"
            >
              <p>Click or drag & drop image here<br />Or paste screenshot (Ctrl+V)</p>
            </div>
          )}

          <input type="file" ref={imageInputRef} accept="image/*" hidden />

          <canvas ref={canvasRef} className="w-full rounded-lg max-h-[600px] bg-gray-50" />
          <canvas ref={magnifierRef} width="250" height="250" className="fixed rounded-full border-2 border-textPrimary hidden pointer-events-none z-50" />
        </div>

        {/* Right panel */}
        <div className="flex-[1.2] bg-white p-6 rounded-xl shadow-md flex flex-col gap-4">
          <h3 className="text-xl font-semibold text-primary">Picked Color</h3>
          <div
            className="h-32 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ background: color }}
          >
            {color.toUpperCase()}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
              <span>HEX: {color.toUpperCase()}</span>
              <button onClick={() => copyText(color)} className="px-3 py-1 bg-primary text-white rounded hover:bg-primaryHover transition">Copy</button>
            </div>
            <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
              <span>RGB: {rgb.r}, {rgb.g}, {rgb.b}</span>
              <button onClick={() => copyText(`rgb(${rgb.r},${rgb.g},${rgb.b})`)} className="px-3 py-1 bg-primary text-white rounded hover:bg-primaryHover transition">Copy</button>
            </div>
            <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
              <span>HSL: {hsl.h}, {hsl.s}%, {hsl.l}%</span>
              <button onClick={() => copyText(`hsl(${hsl.h},${hsl.s}%,${hsl.l}%)`)} className="px-3 py-1 bg-primary text-white rounded hover:bg-primaryHover transition">Copy</button>
            </div>
          </div>

          <button onClick={resetPick} className="mt-4 px-4 py-2 bg-secondary text-white rounded hover:bg-primaryHover transition">
            Reset Pick
          </button>

          {/* Manual color picker */}
        </div>
      </div>
    </div>
  );
}