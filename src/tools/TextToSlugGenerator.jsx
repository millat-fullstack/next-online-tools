import { useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  Copy,
  Link,
  Type,
  Check,
  AlertCircle,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Text to Slug Generator",
  path: "/text-to-slug-generator",
  category: "Text Tools",
  description:
    "Convert any title, heading, or sentence into a clean SEO-friendly URL slug instantly.",
  metaTitle:
    "Text to Slug Generator - Create SEO Friendly Slugs | Next Online Tools",
  metaDescription:
    "Generate clean SEO-friendly URL slugs from text online. Fast, simple, free, and browser-based.",
};

export default function TextToSlugGenerator() {
  const [inputText, setInputText] = useState("");
  const [slug, setSlug] = useState("");
  const [separator, setSeparator] = useState("-");
  const [lowercase, setLowercase] = useState(true);
  const [removeStopWords, setRemoveStopWords] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  const generateSlugValue = (text) => {
    let value = text.trim();

    if (lowercase) {
      value = value.toLowerCase();
    }

    if (removeStopWords) {
      value = removeCommonStopWords(value);
    }

    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/['’]/g, "")
      .replace(/[^a-zA-Z0-9\s_-]/g, "")
      .replace(/[\s_-]+/g, separator)
      .replace(new RegExp(`^${escapeRegExp(separator)}+`), "")
      .replace(new RegExp(`${escapeRegExp(separator)}+$`), "");
  };

  const handleGenerate = () => {
    setError("");
    setCopied(false);

    if (!inputText.trim()) {
      setSlug("");
      setError("Please enter some text first.");
      return;
    }

    const generatedSlug = generateSlugValue(inputText);

    if (!generatedSlug) {
      setSlug("");
      setError(
        "Could not generate a slug from this text. Try using letters or numbers."
      );
      return;
    }

    setSlug(generatedSlug);
  };

  const handleCopy = async () => {
    if (!slug) return;

    try {
      await navigator.clipboard.writeText(slug);
      setCopied(true);
      setError("");

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setError("Copy failed. Please copy the slug manually.");
    }
  };

  const handleDownload = () => {
    if (!slug) return;

    const blob = new Blob([slug], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "generated-slug.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleUploadTextFile = (e) => {
    const file = e.target.files?.[0];

    setError("");
    setCopied(false);
    setSlug("");

    if (!file) return;

    if (!file.type.includes("text") && !file.name.endsWith(".txt")) {
      setError("Please upload a valid .txt file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setInputText(String(reader.result || ""));
    };

    reader.onerror = () => {
      setError("Failed to read the file. Please try another text file.");
    };

    reader.readAsText(file);
  };

  const resetTool = () => {
    setInputText("");
    setSlug("");
    setSeparator("-");
    setLowercase(true);
    setRemoveStopWords(false);
    setError("");
    setCopied(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const stats = useMemo(() => {
    const inputLength = inputText.length;
    const slugLength = slug.length;

    const words = inputText.trim()
      ? inputText.trim().split(/\s+/).filter(Boolean).length
      : 0;

    const slugWords = slug ? slug.split(separator).filter(Boolean).length : 0;

    const reduction =
      inputLength > 0 && slugLength > 0
        ? Math.max(
            0,
            Math.round(((inputLength - slugLength) / inputLength) * 100)
          )
        : 0;

    return {
      inputLength,
      slugLength,
      words,
      slugWords,
      reduction,
    };
  }, [inputText, slug, separator]);

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Link size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Text to Slug Generator</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Convert titles, blog headings, product names, or any text into a
          clean, SEO-friendly URL slug for websites, blogs, and online tools.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN - INPUT */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Type size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-semibold">Input Text</h2>
                </div>

                <span className="text-xs text-[var(--text-secondary)]">
                  {inputText.length} characters
                </span>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setSlug("");
                  setError("");
                  setCopied(false);
                }}
                placeholder="Enter your title or text here..."
                rows="12"
                className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              />
            </div>

            {/* SETTINGS */}
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Link size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Slug Settings</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Separator
                  </label>

                  <select
                    value={separator}
                    onChange={(e) => {
                      setSeparator(e.target.value);
                      setSlug("");
                      setCopied(false);
                    }}
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  >
                    <option value="-">Hyphen -</option>
                    <option value="_">Underscore _</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end gap-3">
                  <label className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lowercase}
                      onChange={(e) => {
                        setLowercase(e.target.checked);
                        setSlug("");
                        setCopied(false);
                      }}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                    Convert to lowercase
                  </label>

                  <label className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removeStopWords}
                      onChange={(e) => {
                        setRemoveStopWords(e.target.checked);
                        setSlug("");
                        setCopied(false);
                      }}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                    Remove common words
                  </label>
                </div>
              </div>
            </div>

            {/* LEFT ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGenerate}
                disabled={!inputText.trim()}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !inputText.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Zap size={18} />
                Convert to Slug
              </button>

              <label className="btn-secondary cursor-pointer inline-flex items-center justify-center gap-2">
                <Upload size={18} />
                Upload TXT
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleUploadTextFile}
                  className="hidden"
                />
              </label>

              <button
                onClick={resetTool}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - OUTPUT */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-start gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-semibold">Generated Slug</h2>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    SEO-friendly URL text will appear here.
                  </p>
                </div>

                {/* SMALL COPY BUTTON */}
                <button
                  onClick={handleCopy}
                  disabled={!slug}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    slug
                      ? copied
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-white text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary)]/5"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                  title="Copy generated slug"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-4 bg-gray-50">
                <textarea
                  value={slug}
                  readOnly
                  rows="12"
                  placeholder="your-seo-friendly-slug-will-appear-here"
                  className="w-full p-4 border border-[var(--border)] rounded-xl outline-none bg-white resize-none font-mono text-[var(--primary)] font-semibold break-all"
                />
              </div>
            </div>

            {/* OUTPUT ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownload}
                disabled={!slug}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !slug ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download Slug
              </button>

              <button
                onClick={resetTool}
                className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Clear All
              </button>
            </div>

            {/* ORIGINAL PREVIEW */}
            <div>
              <h3 className="font-semibold mb-3">Original Preview</h3>

              <div className="border border-[var(--border)] rounded-2xl p-4 bg-[#f8f4ff] min-h-[120px]">
                {inputText ? (
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap break-words">
                    {inputText}
                  </p>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Your original text preview will appear here.
                  </p>
                )}
              </div>
            </div>

            {/* EMPTY STATE */}
            {!slug && (
              <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                <Link size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="text-[var(--text-secondary)]">
                  Enter text and click “Convert to Slug”.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              Input Characters
            </p>
            <p className="text-xl font-bold text-[var(--primary)]">
              {stats.inputLength}
            </p>
          </div>

          <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              Slug Characters
            </p>
            <p className="text-xl font-bold text-[var(--primary)]">
              {stats.slugLength}
            </p>
          </div>

          <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              Input Words
            </p>
            <p className="text-xl font-bold text-[var(--primary)]">
              {stats.words}
            </p>
          </div>

          <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              Slug Words
            </p>
            <p className="text-xl font-bold text-[var(--primary)]">
              {stats.slugWords}
            </p>
          </div>

          <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              Length Reduction
            </p>
            <p className="text-xl font-bold text-green-600">
              {stats.reduction}%
            </p>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="text-to-slug-generator" />
    </div>
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeCommonStopWords(text) {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "how",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "with",
    "your",
  ]);

  return text
    .split(/\s+/)
    .filter((word) => !stopWords.has(word.toLowerCase()))
    .join(" ");
}