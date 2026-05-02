import { useState } from "react";
import { Type, Copy, RotateCcw, ArrowRight, Check } from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Case Converter",
  path: "/case-converter",
  category: "Text Tools",
  description:
    "Convert text to uppercase, lowercase, title case, sentence case, and more. Copy your result with a single click.",
  metaTitle: "Case Converter Tool - Convert Text Easily | Next Online Tools",
  metaDescription:
    "Easily convert text to uppercase, lowercase, title case, sentence case, and more. Simple, fast, and free online tool to adjust your text formatting.",
};

export default function CaseConverter() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [lastConversion, setLastConversion] = useState("");

  const handleConversion = (type) => {
    let result = "";

    if (type === "upper") {
      result = inputText.toUpperCase();
      setLastConversion("UPPERCASE");
    }

    if (type === "lower") {
      result = inputText.toLowerCase();
      setLastConversion("lowercase");
    }

    if (type === "title") {
      result = toTitle(inputText);
      setLastConversion("Title Case");
    }

    if (type === "sentence") {
      result = toSentence(inputText);
      setLastConversion("Sentence case");
    }

    if (type === "camel") {
      result = toCamel(inputText);
      setLastConversion("camelCase");
    }

    if (type === "snake") {
      result = toSnake(inputText);
      setLastConversion("snake_case");
    }

    if (type === "kebab") {
      result = toKebab(inputText);
      setLastConversion("kebab-case");
    }

    setOutputText(result);
    setCopySuccess(false);
  };

  const copyToClipboard = async () => {
    if (!outputText) return;

    try {
      await navigator.clipboard.writeText(outputText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      setCopySuccess(false);
    }
  };

  const resetTool = () => {
    setInputText("");
    setOutputText("");
    setLastConversion("");
    setCopySuccess(false);
  };

  const inputWords = countWords(inputText);
  const outputWords = countWords(outputText);
  const outputLines = outputText ? outputText.split("\n").length : 0;

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Type size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Case Converter</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Convert text to different cases including uppercase, lowercase, title
          case, sentence case, camelCase, snake_case, and kebab-case.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN - INPUT */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">Input Text</h3>

                <span className="text-xs text-[var(--text-secondary)]">
                  {inputText.length} characters
                </span>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setCopySuccess(false);
                }}
                rows="12"
                className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
                placeholder="Type or paste your text here..."
              />
            </div>

            {/* Conversion Buttons */}
            <div>
              <h3 className="font-semibold mb-4">Conversion Options</h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleConversion("upper")}
                  disabled={!inputText}
                  className={`btn-primary text-sm ${
                    !inputText ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  UPPERCASE
                </button>

                <button
                  onClick={() => handleConversion("lower")}
                  disabled={!inputText}
                  className={`btn-primary text-sm ${
                    !inputText ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  lowercase
                </button>

                <button
                  onClick={() => handleConversion("title")}
                  disabled={!inputText}
                  className={`btn-primary text-sm ${
                    !inputText ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Title Case
                </button>

                <button
                  onClick={() => handleConversion("sentence")}
                  disabled={!inputText}
                  className={`btn-primary text-sm ${
                    !inputText ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Sentence case
                </button>

                <button
                  onClick={() => handleConversion("camel")}
                  disabled={!inputText}
                  className={`btn-primary text-sm ${
                    !inputText ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  camelCase
                </button>

                <button
                  onClick={() => handleConversion("snake")}
                  disabled={!inputText}
                  className={`btn-primary text-sm ${
                    !inputText ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  snake_case
                </button>

                <button
                  onClick={() => handleConversion("kebab")}
                  disabled={!inputText}
                  className={`btn-primary text-sm ${
                    !inputText ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  kebab-case
                </button>

                <button onClick={resetTool} className="btn-secondary text-sm">
                  <RotateCcw size={16} />
                  Reset
                </button>
              </div>
            </div>

            {/* Input Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 border border-[var(--border)] p-4 rounded-xl">
                <p className="text-xs text-[var(--text-secondary)]">Input Words</p>
                <p className="text-xl font-bold text-[var(--primary)]">
                  {inputWords}
                </p>
              </div>

              <div className="bg-gray-50 border border-[var(--border)] p-4 rounded-xl">
                <p className="text-xs text-[var(--text-secondary)]">
                  Input Characters
                </p>
                <p className="text-xl font-bold text-[var(--primary)]">
                  {inputText.length}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - OUTPUT */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-start gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Output Text</h3>
                    <ArrowRight size={16} className="text-[var(--primary)]" />
                  </div>

                  <p className="text-xs text-[var(--text-secondary)]">
                    Format:{" "}
                    <span className="font-medium text-[var(--primary)]">
                      {lastConversion || "Not selected"}
                    </span>
                  </p>
                </div>

                {/* Small Copy Button */}
                <button
                  onClick={copyToClipboard}
                  disabled={!outputText}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    outputText
                      ? copySuccess
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-white text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary)]/5"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                  title="Copy output text"
                >
                  {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                  {copySuccess ? "Copied" : "Copy"}
                </button>
              </div>

              <textarea
                value={outputText}
                readOnly
                rows="12"
                className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none bg-gray-50 resize-none font-mono"
                placeholder="Converted text will appear here..."
              />
            </div>

            {/* Output Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 border border-[var(--border)] p-4 rounded-xl text-center">
                <p className="text-xs text-[var(--text-secondary)]">Words</p>
                <p className="text-xl font-bold text-[var(--primary)]">
                  {outputWords}
                </p>
              </div>

              <div className="bg-gray-50 border border-[var(--border)] p-4 rounded-xl text-center">
                <p className="text-xs text-[var(--text-secondary)]">
                  Characters
                </p>
                <p className="text-xl font-bold text-[var(--primary)]">
                  {outputText.length}
                </p>
              </div>

              <div className="bg-gray-50 border border-[var(--border)] p-4 rounded-xl text-center">
                <p className="text-xs text-[var(--text-secondary)]">Lines</p>
                <p className="text-xl font-bold text-[var(--primary)]">
                  {outputLines}
                </p>
              </div>

              <div className="bg-gray-50 border border-[var(--border)] p-4 rounded-xl text-center">
                <p className="text-xs text-[var(--text-secondary)]">Change</p>
                <p className="text-xl font-bold text-green-600">
                  {outputText
                    ? `${Math.abs(inputText.length - outputText.length)}`
                    : "0"}
                </p>
              </div>
            </div>

            {/* Output Empty Message */}
            {!outputText && (
              <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                <Type size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="text-[var(--text-secondary)]">
                  Select a conversion option to generate output.
                </p>
              </div>
            )}

            {outputText && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={copyToClipboard} className="btn-primary flex-1">
                  {copySuccess ? (
                    <>
                      <Check size={18} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy Result
                    </>
                  )}
                </button>

                <button onClick={resetTool} className="btn-secondary flex-1">
                  <RotateCcw size={18} />
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="case-converter" />
    </div>
  );
}

// Helper Functions
function countWords(str) {
  return str.trim() ? str.trim().split(/\s+/).length : 0;
}

function toTitle(str) {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });
}

function toSentence(str) {
  if (!str) return "";

  return str
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s*\w)/g, (letter) => letter.toUpperCase());
}

function toCamel(str) {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (match) => match.toLowerCase());
}

function toSnake(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
}

function toKebab(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}