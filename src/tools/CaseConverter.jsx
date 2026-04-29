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

  // Case conversion functions
  const toUpperCase = () => {
    setOutputText(inputText.toUpperCase());
    setLastConversion("UPPERCASE");
  };
  const toLowerCase = () => {
    setOutputText(inputText.toLowerCase());
    setLastConversion("lowercase");
  };
  const toTitleCase = () => {
    setOutputText(toTitle(inputText));
    setLastConversion("Title Case");
  };
  const toSentenceCase = () => {
    setOutputText(toSentence(inputText));
    setLastConversion("Sentence case");
  };
  const toCamelCase = () => {
    setOutputText(toCamel(inputText));
    setLastConversion("camelCase");
  };
  const toSnakeCase = () => {
    setOutputText(toSnake(inputText));
    setLastConversion("snake_case");
  };
  const toKebabCase = () => {
    setOutputText(toKebab(inputText));
    setLastConversion("kebab-case");
  };

  // Copy to clipboard function with visual feedback
  const copyToClipboard = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Reset the input and output
  const resetTool = () => {
    setInputText("");
    setOutputText("");
    setLastConversion("");
    setCopySuccess(false);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Type size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">
          Case Converter
        </h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Convert text to different cases including uppercase, lowercase, title case, camelCase, snake_case, and more. Perfect for coding, writing, and text formatting.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        {/* Input Area */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">Input Text</h3>
            <span className="text-xs text-[var(--text-secondary)]">
              {inputText.length} characters
            </span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows="6"
            className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
            placeholder="Type or paste your text here..."
          />
        </div>

        {/* Conversion Buttons */}
        <div className="mb-8">
          <h3 className="font-semibold mb-4">Conversion Options</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <button
              onClick={toUpperCase}
              className="btn-primary text-sm"
              title="Convert to UPPERCASE"
            >
              UPPERCASE
            </button>
            <button
              onClick={toLowerCase}
              className="btn-primary text-sm"
              title="Convert to lowercase"
            >
              lowercase
            </button>
            <button
              onClick={toTitleCase}
              className="btn-primary text-sm"
              title="Convert to Title Case"
            >
              Title Case
            </button>
            <button
              onClick={toSentenceCase}
              className="btn-primary text-sm"
              title="Convert to Sentence case"
            >
              Sentence case
            </button>
            <button
              onClick={toCamelCase}
              className="btn-primary text-sm"
              title="Convert to camelCase"
            >
              camelCase
            </button>
            <button
              onClick={toSnakeCase}
              className="btn-primary text-sm"
              title="Convert to snake_case"
            >
              snake_case
            </button>
            <button
              onClick={toKebabCase}
              className="btn-primary text-sm"
              title="Convert to kebab-case"
            >
              kebab-case
            </button>
            <button
              onClick={resetTool}
              className="btn-secondary text-sm"
              title="Clear all text"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </div>

        {/* Output Area */}
        {outputText && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-semibold text-lg">Converted Text</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Format: <span className="font-medium text-[var(--primary)]">{lastConversion}</span>
                </p>
              </div>
              <span className="text-xs text-[var(--text-secondary)]">
                {outputText.length} characters
              </span>
            </div>
            <div className="bg-gray-50 p-4 border border-[var(--border)] rounded-2xl mb-4">
              <textarea
                value={outputText}
                readOnly
                rows="6"
                className="w-full p-4 border border-[var(--border)] rounded-xl outline-none bg-white resize-none font-mono"
                placeholder="Converted text will appear here"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-[var(--text-secondary)]">Words</p>
                <p className="text-lg font-bold text-[var(--primary)]">
                  {outputText.trim().split(/\s+/).filter(w => w).length}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-[var(--text-secondary)]">Characters</p>
                <p className="text-lg font-bold text-[var(--primary)]">
                  {outputText.length}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-[var(--text-secondary)]">Lines</p>
                <p className="text-lg font-bold text-[var(--primary)]">
                  {outputText.split('\n').length}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-[var(--text-secondary)]">Saved</p>
                <p className="text-lg font-bold text-green-600">
                  {Math.max(0, (inputText.length - outputText.length))} bytes
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={copyToClipboard}
                className={`btn-primary flex-1 ${copySuccess ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
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
              <button
                onClick={resetTool}
                className="btn-secondary flex-1"
              >
                <RotateCcw size={18} />
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!outputText && inputText && (
          <div className="text-center py-8">
            <p className="text-[var(--text-secondary)]">Select a conversion option above to get started</p>
          </div>
        )}

        {!inputText && (
          <div className="text-center py-8">
            <Type size={40} className="mx-auto mb-3 text-[var(--border)]" />
            <p className="text-[var(--text-secondary)]">Paste your text above to convert it</p>
          </div>
        )}
      </section>

      <SuggestedTools currentToolId="case-converter" />
    </div>
  );
}

// Helper Functions
function toTitle(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function toSentence(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function toCamel(str) {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (match) => match.toLowerCase());
}

function toSnake(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
}

function toKebab(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]/g, "");
}