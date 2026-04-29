import { useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  Copy,
  Link,
  Type,
  CheckCircle,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Text to Slug Generator",
  path: "/text-to-slug-generator",
  category: "Text Tools",
  description:
    "Convert any title, heading, or sentence into a clean SEO-friendly URL slug instantly.",
  metaTitle: "Text to Slug Generator - Create SEO Friendly Slugs | Next Online Tools",
  metaDescription:
    "Generate clean SEO-friendly URL slugs from text online. Fast, simple, free, and browser-based.",
};

export default function TextToSlugGenerator() {
  const [inputText, setInputText] = useState("");
  const [slug, setSlug] = useState("");
  const [separator, setSeparator] = useState("-");
  const [lowercase, setLowercase] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  const generateSlugValue = (text) => {
    let value = text.trim();

    if (lowercase) {
      value = value.toLowerCase();
    }

    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-zA-Z0-9\s_-]/g, "")
      .replace(/[\s_-]+/g, separator)
      .replace(new RegExp(`^\\${separator}+|\\${separator}+$`, "g"), "");
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
      setError("Could not generate a slug from this text. Try using letters or numbers.");
      return;
    }

    setSlug(generatedSlug);
  };

  const handleCopy = async () => {
    if (!slug) return;

    try {
      await navigator.clipboard.writeText(slug);
      setCopied(true);

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

    const reduction =
      inputLength > 0 && slugLength > 0
        ? Math.max(0, Math.round(((inputLength - slugLength) / inputLength) * 100))
        : 0;

    return {
      inputLength,
      slugLength,
      words,
      reduction,
    };
  }, [inputText, slug]);

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Zap size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Text to Slug Generator</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Convert titles, blog headings, product names, or any text into a clean,
          SEO-friendly URL slug. Perfect for websites, blogs, and online tools.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-[1.4fr_0.8fr] gap-6">
          {/* INPUT AREA */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Type size={20} className="text-[var(--primary)]" />
              <h2 className="text-xl font-semibold">Enter Your Text</h2>
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
              className="w-full min-h-[180px] p-4 rounded-2xl border border-[var(--border)] bg-white outline-none resize-none focus:border-[var(--primary)] focus:ring-4 focus:ring-purple-100 transition"
            />

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
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
          </div>

          {/* SETTINGS */}
          <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Link size={20} className="text-[var(--primary)]" />
              <h3 className="font-semibold">Slug Settings</h3>
            </div>

            <div className="space-y-5">
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

              <button
                onClick={handleGenerate}
                className="btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                Convert to Slug
              </button>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <p className="mt-5 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">
            {error}
          </p>
        )}

        {/* RESULT */}
        {slug && (
          <>
            <div className="mt-8 grid lg:grid-cols-2 gap-6">
              {/* ORIGINAL PREVIEW */}
              <div>
                <h3 className="font-semibold mb-3">Original Text</h3>

                <div className="border border-[var(--border)] rounded-2xl p-4 bg-[#f8f4ff] min-h-[160px]">
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap break-words">
                    {inputText}
                  </p>
                </div>
              </div>

              {/* SLUG PREVIEW */}
              <div>
                <h3 className="font-semibold mb-3">Generated Slug</h3>

                <div className="border border-[var(--border)] rounded-2xl p-4 bg-white min-h-[160px]">
                  <div className="bg-[#f8f4ff] border border-dashed border-[#d7c4f5] rounded-xl p-4">
                    <p className="text-[var(--primary)] font-semibold break-all">
                      {slug}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleCopy}
                      className="btn-primary inline-flex items-center justify-center gap-2"
                    >
                      {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                      {copied ? "Copied" : "Copy Slug"}
                    </button>

                    <button
                      onClick={handleDownload}
                      className="btn-secondary inline-flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* STATS */}
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                  Words
                </p>
                <p className="text-xl font-bold text-[var(--primary)]">
                  {stats.words}
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
          </>
        )}
      </section>

      <SuggestedTools currentToolId="text-to-slug-generator" />
    </div>
  );
}