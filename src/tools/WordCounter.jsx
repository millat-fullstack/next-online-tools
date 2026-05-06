import { useMemo, useRef, useState } from "react";
import {
  Type,
  Copy,
  Download,
  RotateCcw,
  Upload,
  Check,
  AlertCircle,
  BarChart3,
  Clock,
  FileText,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Word Counter",
  path: "/word-counter",
  category: "Text Tools",
  description:
    "Quickly count words, characters, sentences, and paragraphs in any text.",
  metaTitle: "Word Counter Tool | Count Words Online Free",
  metaDescription:
    "Free online word counter tool. Count words, characters, sentences, paragraphs, reading time, and speaking time instantly.",
};

export default function WordCounter() {
  const fileInputRef = useRef(null);

  const [inputText, setInputText] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const stats = useMemo(() => {
    const trimmedText = inputText.trim();

    const words = getWords(inputText);
    const sentences = getSentences(inputText);
    const paragraphs = getParagraphs(inputText);

    const characters = inputText.length;
    const charactersNoSpaces = inputText.replace(/\s/g, "").length;
    const spaces = (inputText.match(/\s/g) || []).length;
    const lines = inputText ? inputText.split(/\r\n|\r|\n/).length : 0;

    const readingSeconds =
      words.length > 0 ? Math.round((words.length / 200) * 60) : 0;

    const speakingSeconds =
      words.length > 0 ? Math.round((words.length / 130) * 60) : 0;

    const longestWord =
      words.length > 0
        ? words.reduce((longest, current) =>
            current.length > longest.length ? current : longest
          )
        : "-";

    return {
      words: words.length,
      characters,
      charactersNoSpaces,
      spaces,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      lines,
      readingSeconds,
      speakingSeconds,
      longestWord,
    };
  }, [inputText]);

  const handleCopy = async () => {
    if (!inputText.trim()) return;

    try {
      await navigator.clipboard.writeText(inputText);
      setCopied(true);
      setError("");
      setSuccess("Text copied successfully.");

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setError("Copy failed. Please copy the text manually.");
      setSuccess("");
    }
  };

  const handleDownload = () => {
    if (!inputText.trim()) {
      setError("Please enter some text before downloading.");
      setSuccess("");
      return;
    }

    const content = `Word Counter Result

Words: ${stats.words}
Characters with spaces: ${stats.characters}
Characters without spaces: ${stats.charactersNoSpaces}
Spaces: ${stats.spaces}
Sentences: ${stats.sentences}
Paragraphs: ${stats.paragraphs}
Lines: ${stats.lines}
Reading Time: ${formatTime(stats.readingSeconds)}
Speaking Time: ${formatTime(stats.speakingSeconds)}
Longest Word: ${stats.longestWord}

Text:
${inputText}`;

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "word-counter-result.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setSuccess("Word count result downloaded successfully.");
    setError("");
  };

  const handleUploadTextFile = (e) => {
    const file = e.target.files?.[0];

    setError("");
    setSuccess("");
    setCopied(false);

    if (!file) return;

    if (!file.type.includes("text") && !file.name.endsWith(".txt")) {
      setError("Please upload a valid .txt file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setInputText(String(reader.result || ""));
      setSuccess("Text file uploaded successfully.");
    };

    reader.onerror = () => {
      setError("Failed to read the file. Please try another text file.");
    };

    reader.readAsText(file);
  };

  const resetTool = () => {
    setInputText("");
    setCopied(false);
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Type size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Word Counter</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Paste or type your text and instantly count words, characters,
          sentences, paragraphs, lines, reading time, and speaking time.
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
                  <FileText size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-semibold">Enter Your Text</h2>
                </div>

                <span className="text-xs text-[var(--text-secondary)]">
                  {stats.characters} characters
                </span>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setCopied(false);
                  setError("");
                  setSuccess("");
                }}
                placeholder="Paste or type your text here..."
                rows="14"
                className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
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
                onClick={handleCopy}
                disabled={!inputText.trim()}
                className={`btn-primary inline-flex items-center justify-center gap-2 ${
                  !inputText.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : "Copy Text"}
              </button>

              <button
                onClick={handleDownload}
                disabled={!inputText.trim()}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  !inputText.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download
              </button>

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

            {success && (
              <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
                <Check size={18} className="shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Text Statistics</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Words" value={stats.words} />
                <StatCard label="Characters" value={stats.characters} />
                <StatCard
                  label="No Spaces"
                  value={stats.charactersNoSpaces}
                />
                <StatCard label="Spaces" value={stats.spaces} />
                <StatCard label="Sentences" value={stats.sentences} />
                <StatCard label="Paragraphs" value={stats.paragraphs} />
                <StatCard label="Text Lines" value={stats.lines} />
              </div>
            </div>

            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Reading Details</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white border border-[var(--border)] rounded-xl p-4">
                  <p className="text-xs text-[var(--text-secondary)]">
                    Reading Time
                  </p>
                  <p className="text-xl font-bold text-[var(--primary)]">
                    {formatTime(stats.readingSeconds)}
                  </p>
                </div>

                <div className="bg-white border border-[var(--border)] rounded-xl p-4">
                  <p className="text-xs text-[var(--text-secondary)]">
                    Speaking Time
                  </p>
                  <p className="text-xl font-bold text-[var(--primary)]">
                    {formatTime(stats.speakingSeconds)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                Longest Word
              </p>

              <p className="text-xl font-bold text-[var(--primary)] break-all">
                {stats.longestWord}
              </p>
            </div>

            {!inputText && (
              <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                <Type size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-[var(--text-secondary)]">
                  Paste your text to see instant word count results.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="word-counter" />
    </div>
  );
}

function getWords(text) {
  const cleanedText = text.replace(/[—–]/g, " ");

  return (
    cleanedText.match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu) || []
  );
}

function getSentences(text) {
  const trimmedText = text.trim();

  if (!trimmedText) return [];

  return (
    trimmedText
      .replace(/\s+/g, " ")
      .match(/[^.!?।]+[.!?।]+|[^.!?।]+$/g) || []
  )
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function getParagraphs(text) {
  const trimmedText = text.trim();

  if (!trimmedText) return [];

  return trimmedText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function formatTime(seconds) {
  if (!seconds) return "0 sec";

  if (seconds < 60) {
    return `${seconds} sec`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds} sec`;
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-50 border border-[var(--border)] rounded-2xl p-4 text-center">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[var(--primary)]">{value}</p>
    </div>
  );
}