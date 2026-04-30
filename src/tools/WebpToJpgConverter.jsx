import { useState } from "react";
import { Upload, Download, Image as ImageIcon, RotateCcw } from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "WEBP to JPG Converter",
  path: "/webp-to-jpg-converter",
  category: "Image Tools",
  description: "Convert WEBP images to JPG format quickly in your browser.",
};

export default function WebpToJpgConverter() {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState("");

  function handleFileChange(e) {
    const file = e.target.files[0];

    setError("");
    setDownloadUrl(null);

    if (!file) return;

    if (!file.type.includes("webp")) {
      setError("Please upload a WEBP image file.");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      setPreview(reader.result);
      convertWebpToJpg(reader.result, file.name);
    };

    reader.readAsDataURL(file);
  }

  function convertWebpToJpg(imageSrc, originalName) {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const jpgUrl = canvas.toDataURL("image/jpeg", 0.92);
      setDownloadUrl(jpgUrl);
    };

    img.onerror = () => {
      setError("Could not convert this image. Please try another WEBP file.");
    };

    img.src = imageSrc;
  }

  function resetTool() {
    setPreview(null);
    setFileName("");
    setDownloadUrl(null);
    setError("");
  }

  const outputName = fileName
    ? fileName.replace(/\.[^/.]+$/, "") + ".jpg"
    : "converted-image.jpg";

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <ImageIcon size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">
          WEBP to JPG Converter
        </h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Convert WEBP images to JPG format instantly. This tool works directly
          in your browser, so no paid API is needed.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <label className="block border-2 border-dashed border-[var(--border)] rounded-2xl p-8 text-center cursor-pointer hover:bg-[#f8f4ff]">
          <Upload
            size={36}
            className="mx-auto mb-4 text-[var(--primary)]"
          />

          <h2 className="text-xl font-semibold mb-2">
            Upload WEBP Image
          </h2>

          <p className="text-sm text-[var(--text-secondary)]">
            Select a .webp image from your device
          </p>

          <input
            type="file"
            accept="image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {error && (
          <p className="mt-4 text-sm text-red-500">
            {error}
          </p>
        )}

        {preview && (
          <div className="mt-6 grid lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Preview</h3>

              <div className="border border-[var(--border)] rounded-2xl p-4 bg-[#f8f4ff]">
                <img
                  src={preview}
                  alt="WEBP preview"
                  className="max-h-[320px] mx-auto rounded-xl"
                />
              </div>

              <p className="text-sm text-[var(--text-secondary)] mt-3">
                File: {fileName}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Converted JPG</h3>

              <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
                <p className="text-sm text-[var(--text-secondary)] mb-5">
                  Your JPG file is ready to download.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      download={outputName}
                      className="btn-primary"
                    >
                      <Download size={18} />
                      Download JPG
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={resetTool}
                    className="btn-secondary"
                  >
                    <RotateCcw size={18} />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <SuggestedTools currentToolId="webp-to-jpg-converter" />
    </div>
  );
}