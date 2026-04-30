import { useState, useRef } from 'react';
import { saveAs } from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist';

export const toolData = {
  title: "PDF to JPG Converter",
  path: "/pdf-to-jpg-converter",
  category: "File Conversion",
  description: "Convert PDF files to JPG images quickly. Get high-quality image output for every PDF page.",
};

export default function PDFToJpgConverter() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadLink, setDownloadLink] = useState(null);

  const canvasRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setDownloadLink(null); // Reset download link
  };

  const convertPDFToJPG = async () => {
    if (!file) return alert('Please select a PDF file first.');
    setIsProcessing(true);
    setProgress(0);

    const fileReader = new FileReader();
    fileReader.onload = async function () {
      const typedArray = new Uint8Array(this.result);
      const pdf = await pdfjsLib.getDocument(typedArray).promise;

      const zip = new JSZip();
      let pageCount = pdf.numPages;

      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;

        const imgData = canvas.toDataURL('image/jpeg', 0.9); // Convert to JPG with 90% quality
        const base64Data = imgData.split(',')[1];

        // Add image to ZIP
        zip.file(`page_${pageNum}.jpg`, base64Data, { base64: true });

        // Update progress
        setProgress(((pageNum / pageCount) * 100).toFixed(0));
      }

      // Save ZIP file
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'pdf_images.zip');
      
      setDownloadLink(URL.createObjectURL(content)); // Set the download link
      setIsProcessing(false);
    };

    fileReader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-4">PDF to JPG Converter</h1>
      <p className="text-center mb-6">Convert PDF pages to JPG images without uploading anything to the cloud.</p>

      {/* File Input */}
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="block w-full mb-4"
      />

      {/* Processing State */}
      {isProcessing && (
        <div className="text-center">
          <p>Processing...</p>
          <progress value={progress} max="100" className="w-full"></progress>
        </div>
      )}

      {/* Convert Button */}
      <button
        onClick={convertPDFToJPG}
        disabled={isProcessing}
        className="btn-primary w-full mt-6"
      >
        {isProcessing ? 'Converting...' : 'Convert PDF to JPG'}
      </button>

      {/* Download Link */}
      {downloadLink && (
        <div className="mt-6 text-center">
          <a
            href={downloadLink}
            download="pdf_images.zip"
            className="btn-primary"
          >
            Download ZIP of Images
          </a>
        </div>
      )}
    </div>
  );
}