import { useState, useRef, useMemo } from "react";
import JSZip from "jszip";
import { Upload, Download, RotateCcw, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Extract Images from Google Docs",
  path: "/extract-images-from-google-docs",
  category: "Document Tools",
  description:
    "Extract images from Google Docs by uploading a DOCX file. Preview and download all images instantly.",
  metaTitle: "Extract Images from Google Docs | Download Images from DOCX",
  metaDescription:
    "Extract images from Google Docs online for free. Download your Google Doc as DOCX, upload it, preview images, and download all extracted images as ZIP.",
};

export default function ExtractImagesFromGoogleDocs() {
  const fileInputRef = useRef(null);

  const [inputFile, setInputFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileUpload = async (file) => {
    setError("");
    setSuccess("");
    setImages([]);
    
    if (!file) return;

    if (!file.name.endsWith(".docx")) {
      setError("Please upload a valid DOCX file.");
      return;
    }

    setIsGenerating(true);

    try {
      const zip = await JSZip.loadAsync(file);
      const mediaFolder = zip.folder("word/media");
      if (!mediaFolder) {
        setError("No images found in the DOCX file.");
        return;
      }

      const imageFiles = [];
      mediaFolder.forEach((relativePath, zipEntry) => {
        if (zipEntry.name.match(/\.(jpg|jpeg|png|gif|bmp)$/i)) {
          const img = zipEntry.async("blob").then((blob) => ({
            src: URL.createObjectURL(blob),
            name: zipEntry.name,
            size: blob.size,
          }));
          imageFiles.push(img);
        }
      });

      const imagesData = await Promise.all(imageFiles);
      setImages(imagesData);
      setSuccess("Images extracted successfully.");
    } catch (err) {
      setError("Failed to extract images. Please try another DOCX file.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAll = () => {
    if (images.length === 0) {
      setError("No images available to download.");
      return;
    }

    const zip = new JSZip();
    images.forEach((image, index) => {
      fetch(image.src)
        .then((res) => res.blob())
        .then((blob) => {
          zip.file(image.name, blob);
          if (index === images.length - 1) {
            zip.generateAsync({ type: "blob" }).then((content) => {
              const link = document.createElement("a");
              link.href = URL.createObjectURL(content);
              link.download = "extracted-images.zip";
              link.click();
            });
          }
        });
    });
  };

  const handleDownloadImage = (image) => {
    fetch(image.src)
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = image.name;
        link.click();
      });
  };

  const resetTool = () => {
    setInputFile(null);
    setError("");
    setSuccess("");
    setImages([]);
    setIsGenerating(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <FileText size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Extract Images from Google Docs</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload a DOCX file downloaded from Google Docs and extract all images from it. You can preview and download them instantly.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Upload size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-semibold">Upload DOCX</h2>
                </div>

                <span className="text-xs text-[var(--text-secondary)]">
                  {inputFile ? inputFile.name : "No file uploaded"}
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setInputFile(file);
                    handleFileUpload(file);
                  }
                }}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                Choose DOCX File
              </button>

              <button
                onClick={resetTool}
                className="btn-secondary inline-flex items-center justify-center gap-2 mt-4"
              >
                <RotateCcw size={18} />
                Reset
              </button>

              {error && (
                <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl mt-4">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl mt-4">
                  <CheckCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{success}</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Extracted Images</h2>
              </div>

              {isGenerating ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Extracting images, please wait...
                </p>
              ) : images.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                  <ImageIcon size={42} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-[var(--text-secondary)]">
                    No images extracted yet. Upload a DOCX to begin.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="text-center">
                      <img
                        src={image.src}
                        alt={`Extracted ${image.name}`}
                        className="max-w-full max-h-32 object-contain mb-2"
                      />
                      <p className="text-xs text-[var(--text-secondary)]">{image.name}</p>
                      <button
                        onClick={() => handleDownloadImage(image)}
                        className="btn-primary text-xs"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length > 0 && (
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleDownloadAll}
                    className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Download All as ZIP
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="extract-images-from-google-docs" />
    </div>
  );
}