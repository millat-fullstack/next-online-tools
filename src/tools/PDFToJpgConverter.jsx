import { useState, useRef } from "react";
import { Loader } from "lucide-react"; // Using lucide icon for loader

// Importing pdf.js from pdfjs-dist
import { getDocument } from "pdfjs-dist";

export const toolData = {
  title: "PDF to JPG Converter",
  path: "/pdf-to-jpg",
  category: "File Conversion",
  description:
    "Convert PDF files into high-quality JPG images. Extract images from each PDF page instantly.",
  metaTitle: "PDF to JPG Converter Tool - Convert PDF to Images | Next Online Tools",
  metaDescription:
    "Convert PDF documents into JPG images for easy sharing, viewing, and editing. Download individual page images in seconds.",
};

export default function PDFToJpgConverter() {
  const fileInputRef = useRef(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversionTime, setConversionTime] = useState(null); // Track conversion time
  const [progress, setProgress] = useState(0); // Progress percentage

  // Handle PDF file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setImages([]); // Clear previous images if any
      setProgress(0); // Reset progress bar
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  // Convert PDF to JPG
  const convertPdfToJpg = () => {
    if (!pdfFile) return;

    const startTime = new Date().getTime(); // Record start time
    setLoading(true);
    const fileReader = new FileReader();
    fileReader.onload = async () => {
      const typedarray = new Uint8Array(fileReader.result);

      // Using pdf.js to load the document
      const pdf = await getDocument(typedarray).promise;
      const imagesArr = [];
      const totalPages = pdf.numPages;

      console.log("PDF Loaded: ", pdf);

      // Loop through each page and convert to JPG
      for (let i = 0; i < totalPages; i++) {
        const page = await pdf.getPage(i + 1);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render the page on the canvas
        console.log(`Rendering page ${i + 1}...`);
        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        // Convert canvas to JPG
        const imgUrl = canvas.toDataURL("image/jpeg", 0.9);
        imagesArr.push(imgUrl);

        // Update progress
        setProgress(((i + 1) / totalPages) * 100);
        console.log(`Page ${i + 1} converted!`);
      }

      // Calculate conversion time
      const endTime = new Date().getTime();
      const timeTaken = ((endTime - startTime) / 1000).toFixed(2); // in seconds
      setConversionTime(timeTaken);

      setImages(imagesArr);
      setLoading(false);
    };

    fileReader.readAsArrayBuffer(pdfFile);
  };

  // Download JPG images
  const handleDownload = (index) => {
    const link = document.createElement("a");
    link.href = images[index];
    link.download = `page-${index + 1}.jpg`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#f8f6fb] p-6 space-y-6">
      <h1 className="text-3xl text-center font-bold text-[#6b4de6]">📄 PDF to JPG Converter</h1>

      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
        {/* Left Panel */}
        <div className="flex-1 bg-white rounded-2xl p-6 shadow-md space-y-4">
          <h2 className="text-xl font-semibold text-[#6b4de6]">Upload PDF</h2>
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:bg-gray-50"
            onClick={() => fileInputRef.current.click()}
          >
            <p>Click or drag & drop PDF here</p>
            <input
              type="file"
              accept="application/pdf"
              hidden
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          {/* Convert Button */}
          {pdfFile && !loading && (
            <button
              onClick={convertPdfToJpg}
              className="bg-[#8d6bcb] hover:bg-[#7552b6] text-white rounded px-4 py-2 font-semibold w-full"
            >
              Convert PDF to JPG
            </button>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-4">
              <Loader size={30} className="animate-spin" />
            </div>
          )}

          {/* Conversion Time */}
          {conversionTime && !loading && (
            <div className="text-sm text-center text-[var(--text-secondary)] mt-4">
              Conversion Time: {conversionTime} seconds
            </div>
          )}

          {/* Progress Bar */}
          {loading && (
            <div className="mt-4">
              <div className="text-sm text-center text-[var(--text-secondary)]">
                Converting: {Math.round(progress)}%
              </div>
              <div className="w-full bg-gray-300 h-2 rounded-full">
                <div
                  className="bg-[#6b4de6] h-2 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel (Preview) */}
        <div className="flex-1 bg-white rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-semibold text-[#6b4de6]">Preview</h2>
          {images.length > 0 ? (
            <div className="space-y-4">
              {images.map((img, index) => (
                <div key={index} className="mb-4">
                  <img
                    src={img}
                    alt={`Page ${index + 1}`}
                    className="w-full h-auto rounded-md shadow-md"
                  />
                  <button
                    onClick={() => handleDownload(index)}
                    className="mt-3 px-4 py-2 rounded-xl font-medium border border-[#9B6CE3] text-[#9B6CE3] hover:bg-[#9B6CE3] hover:text-white transition"
                  >
                    Download Page {index + 1}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-secondary)]">No preview available.</p>
          )}
        </div>
      </div>
    </div>
  );
}