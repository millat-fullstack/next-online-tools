// src/components/CaseConverter.jsx
import { useState } from "react";

export default function CaseConverter() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");

  // Functions for text case conversions
  const toUpperCase = () => setOutputText(inputText.toUpperCase());
  const toLowerCase = () => setOutputText(inputText.toLowerCase());
  const toTitleCase = () =>
    setOutputText(
      inputText
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  const toSentenceCase = () =>
    setOutputText(
      inputText
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())
    );
  const toToggleCase = () =>
    setOutputText(
      inputText
        .split("")
        .map((c) =>
          c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
        )
        .join("")
    );

  // Copy output to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText);
    alert("Copied to clipboard!");
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-lg space-y-6">
      <h2 className="text-2xl font-bold text-primary text-center">
        Text Case Converter
      </h2>

      <textarea
        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none h-32"
        placeholder="Enter your text here..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={toUpperCase}
          className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primaryHover transition"
        >
          UPPERCASE
        </button>
        <button
          onClick={toLowerCase}
          className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primaryHover transition"
        >
          lowercase
        </button>
        <button
          onClick={toTitleCase}
          className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primaryHover transition"
        >
          Title Case
        </button>
        <button
          onClick={toSentenceCase}
          className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primaryHover transition"
        >
          Sentence case
        </button>
        <button
          onClick={toToggleCase}
          className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primaryHover transition"
        >
          Toggle Case
        </button>
      </div>

      {outputText && (
        <div className="relative">
          <textarea
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none h-32 bg-gray-50"
            value={outputText}
            readOnly
          />
          <button
            onClick={copyToClipboard}
            className="absolute top-2 right-2 px-3 py-1 bg-primary text-white rounded-full hover:bg-primaryHover transition"
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}
