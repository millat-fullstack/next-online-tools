import { useState } from "react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "JPG to PDF Converter",
  path: "/jpg-to-pdf-converter",
  category: "File Conversion",
  description: "Convert JPG images to PDF in seconds. Easily adjust orientation and margins.",
};

export default function JpgToPdf() {
  const [image, setImage] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [error, setError] = useState("");
  const [orientation, setOrientation] = useState("portrait"); // Options: "portrait", "landscape"
  const [margins, setMargins] = useState(10); // Margin in px

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "image/jpeg") {
      setImage(file);
      setError(""); // Reset error on valid file
    } else {
      setError("Please upload a valid JPG image.");
    }
  };

  const handleDownload = () => {
    if (pdf) {
      const link = document.createElement("a");
      link.href = pdf;
      link.download = "converted.pdf";
      link.click();
    }
  };

  const handleReset = () => {
    setImage(null);
    setPdf(null);
    setError("");
  };

  const generatePdf = () => {
    if (!image) {
      setError("Please upload an image first.");
      return;
    }

    // Placeholder: Replace with actual JPG to PDF conversion logic
    const pdfUrl = URL.createObjectURL(image); // Dummy placeholder for actual logic
    setPdf(pdfUrl);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* TOOL HEADER */}
      <section className="bg-white border rounded-2xl shadow-sm p-6">
        <h1 className="text-3xl font-bold mb-3">JPG to PDF Converter</h1>
        <p className="text-[var(--text-secondary)]">
          Convert your JPG images to PDF easily. Adjust orientation and margins.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="bg-white border rounded-2xl shadow-sm p-6">
        {/* File Upload Section */}
        <label className="block text-sm font-medium mb-2">Upload JPG Image</label>
        <input
          type="file"
          accept="image/jpeg"
          onChange={handleFileUpload}
          className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 mb-5"
        />
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Settings for Orientation and Margins */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Orientation</label>
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 mb-4"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>

          <label className="block text-sm font-medium mb-2">Margins (px)</label>
          <input
            type="number"
            value={margins}
            onChange={(e) => setMargins(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </section>

      {/* Preview Section */}
      {image && (
        <section className="bg-white border rounded-2xl shadow-sm p-6 mt-6">
          <h3 className="text-xl font-bold mb-4">Preview</h3>
          <div className="flex gap-4">
            {/* Original Image */}
            <div className="w-1/2">
              <h4 className="text-sm font-medium mb-2">Original Image</h4>
              <img
                src={URL.createObjectURL(image)}
                alt="Original"
                className="w-full rounded-2xl shadow-md"
              />
            </div>

            {/* Converted PDF */}
            <div className="w-1/2">
              <h4 className="text-sm font-medium mb-2">Converted PDF</h4>
              {pdf ? (
                <iframe
                  src={pdf}
                  width="100%"
                  height="300px"
                  title="Converted PDF"
                  className="rounded-2xl shadow-md"
                />
              ) : (
                <p>No PDF generated yet.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Buttons */}
      <section className="mt-6 flex justify-between">
        <button
          onClick={generatePdf}
          className="bg-blue-500 text-white py-2 px-6 rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          Convert to PDF
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-300 text-black py-2 px-6 rounded-xl hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          Reset
        </button>
      </section>

      {/* Download Button */}
      {pdf && (
        <section className="mt-4 flex justify-center">
          <button
            onClick={handleDownload}
            className="bg-green-500 text-white py-2 px-6 rounded-xl hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-200"
          >
            Download PDF
          </button>
        </section>
      )}

      {/* Suggested Tools */}
      <SuggestedTools currentToolId="jpg-to-pdf" />
    </div>
  );
}