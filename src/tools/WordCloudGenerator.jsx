import { useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  Copy,
  Check,
  Cloud,
  Type,
  Palette,
  Settings2,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Word Cloud Generator",
  path: "/word-cloud-generator",
  category: "Text Tools",
  description:
    "Transform your text into beautiful visual word clouds. Paste your content and generate a visual summary of the most frequent words.",
  metaTitle: "Word Cloud Generator | Create Word Clouds Online Free",
  metaDescription:
    "Create beautiful word clouds online for free. Paste text, customize colors, remove common words, and download your word cloud as an image.",
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "but",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "for",
  "from",
  "had",
  "has",
  "have",
  "he",
  "her",
  "his",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "she",
  "so",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "this",
  "to",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "will",
  "with",
  "you",
  "your",
]);

const COLOR_THEMES = {
  purple: ["#9B6CE3", "#7D4EDB", "#C49BF5", "#6EC3E3", "#333333"],
  blue: ["#2563eb", "#0ea5e9", "#38bdf8", "#1d4ed8", "#0f172a"],
  green: ["#16a34a", "#22c55e", "#84cc16", "#059669", "#14532d"],
  dark: ["#111827", "#374151", "#4b5563", "#6b7280", "#9ca3af"],
  warm: ["#f97316", "#ef4444", "#f59e0b", "#fb7185", "#7c2d12"],
};

export default function WordCloudGenerator() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const [inputText, setInputText] = useState("");
  const [wordList, setWordList] = useState([]);
  const [maxWords, setMaxWords] = useState(50);
  const [minWordLength, setMinWordLength] = useState(3);
  const [removeStopWords, setRemoveStopWords] = useState(true);
  const [theme, setTheme] = useState("purple");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(52);
  const [rotationMode, setRotationMode] = useState("mixed");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const processWords = (text) => {
    const words = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
      .split(/\s+/)
      .map((word) => word.replace(/^[-']+|[-']+$/g, ""))
      .filter(Boolean)
      .filter((word) => word.length >= Number(minWordLength))
      .filter((word) => {
        if (!removeStopWords) return true;
        return !STOP_WORDS.has(word);
      });

    const frequencyMap = new Map();

    words.forEach((word) => {
      frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1);
    });

    return Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, Number(maxWords));
  };

  const drawWordCloud = async (list) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      throw new Error("Canvas not found.");
    }

    const WordCloudModule = await import("wordcloud");
    const WordCloud = WordCloudModule.default || WordCloudModule;

    const colors = COLOR_THEMES[theme] || COLOR_THEMES.purple;

    const rotateRatio =
      rotationMode === "straight" ? 0 : rotationMode === "vertical" ? 1 : 0.35;

    const minRotation =
      rotationMode === "vertical" ? Math.PI / 2 : rotationMode === "mixed" ? -Math.PI / 4 : 0;

    const maxRotation =
      rotationMode === "vertical" ? Math.PI / 2 : rotationMode === "mixed" ? Math.PI / 4 : 0;

    const weightedList = list.map(([word, count]) => [
      word,
      Math.max(10, count * Number(fontSize)),
    ]);

    return new Promise((resolve) => {
      WordCloud(canvas, {
        list: weightedList,
        backgroundColor,
        clearCanvas: true,
        gridSize: Math.round(12 * (canvas.width / 1024)),
        weightFactor: (size) => Math.sqrt(size) * 2.5,
        fontFamily: "Arial, sans-serif",
        color: () => colors[Math.floor(Math.random() * colors.length)],
        rotateRatio,
        minRotation,
        maxRotation,
        rotationSteps: 2,
        drawOutOfBound: false,
        shrinkToFit: true,
        ellipticity: 0.75,
        wait: 0,
      });

      setTimeout(resolve, 400);
    });
  };

  const handleGenerate = async () => {
    setError("");
    setSuccess("");
    setCopied(false);

    if (!inputText.trim()) {
      setWordList([]);
      setError("Please enter or upload some text first.");
      return;
    }

    const list = processWords(inputText);

    if (!list.length) {
      setWordList([]);
      setError(
        "No words found. Try lowering the minimum word length or turning off stop word removal."
      );
      return;
    }

    setIsGenerating(true);

    try {
      setWordList(list);
      await drawWordCloud(list);
      setSuccess("Word cloud generated successfully.");
    } catch {
      setError("Could not generate the word cloud. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;

    if (!canvas || !wordList.length) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");

    link.href = url;
    link.download = "word-cloud.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyWords = async () => {
    if (!wordList.length) return;

    const text = wordList.map(([word, count]) => `${word}: ${count}`).join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError("");

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setError("Copy failed. Please copy the word list manually.");
    }
  };

  const handleUploadTextFile = (e) => {
    const file = e.target.files?.[0];

    setError("");
    setSuccess("");
    setCopied(false);
    setWordList([]);

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
    setWordList([]);
    setMaxWords(50);
    setMinWordLength(3);
    setRemoveStopWords(true);
    setTheme("purple");
    setBackgroundColor("#ffffff");
    setFontSize(52);
    setRotationMode("mixed");
    setCopied(false);
    setError("");
    setSuccess("");
    setIsGenerating(false);

    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const stats = useMemo(() => {
    const totalCharacters = inputText.length;
    const totalWords = inputText.trim()
      ? inputText.trim().split(/\s+/).filter(Boolean).length
      : 0;

    const uniqueWords = processWords(inputText).length;
    const topWord = wordList.length ? wordList[0][0] : "-";
    const topCount = wordList.length ? wordList[0][1] : 0;

    return {
      totalCharacters,
      totalWords,
      uniqueWords,
      topWord,
      topCount,
    };
  }, [inputText, wordList, maxWords, minWordLength, removeStopWords]);

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Cloud size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Word Cloud Generator</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Transform your text into a beautiful visual word cloud. Paste your
          content, customize the style, and download the result as a PNG image.
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
                  setWordList([]);
                  setError("");
                  setSuccess("");
                  setCopied(false);
                }}
                placeholder="Paste your article, essay, keywords, research notes, or content here..."
                rows="12"
                className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              />
            </div>

            {/* SETTINGS */}
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Word Cloud Settings</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Max Words
                  </label>

                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={maxWords}
                    onChange={(e) => {
                      setMaxWords(e.target.value);
                      setWordList([]);
                    }}
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Minimum Word Length
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={minWordLength}
                    onChange={(e) => {
                      setMinWordLength(e.target.value);
                      setWordList([]);
                    }}
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Color Theme
                  </label>

                  <select
                    value={theme}
                    onChange={(e) => {
                      setTheme(e.target.value);
                      setWordList([]);
                    }}
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  >
                    <option value="purple">Purple Brand</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="dark">Dark</option>
                    <option value="warm">Warm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Rotation Style
                  </label>

                  <select
                    value={rotationMode}
                    onChange={(e) => {
                      setRotationMode(e.target.value);
                      setWordList([]);
                    }}
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  >
                    <option value="mixed">Mixed</option>
                    <option value="straight">Straight</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Background Color
                  </label>

                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => {
                      setBackgroundColor(e.target.value);
                      setWordList([]);
                    }}
                    className="w-full h-12 border border-[var(--border)] rounded-xl p-1 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Font Size Strength: {fontSize}
                  </label>

                  <input
                    type="range"
                    min="30"
                    max="90"
                    value={fontSize}
                    onChange={(e) => {
                      setFontSize(e.target.value);
                      setWordList([]);
                    }}
                    className="w-full accent-[var(--primary)] mt-4"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm font-medium cursor-pointer mt-5">
                <input
                  type="checkbox"
                  checked={removeStopWords}
                  onChange={(e) => {
                    setRemoveStopWords(e.target.checked);
                    setWordList([]);
                  }}
                  className="w-4 h-4 accent-[var(--primary)]"
                />
                Remove common words like “the”, “and”, “is”
              </label>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGenerate}
                disabled={!inputText.trim() || isGenerating}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !inputText.trim() || isGenerating
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <Zap size={18} />
                {isGenerating ? "Generating..." : "Generate Word Cloud"}
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
              <div className="flex justify-between items-start gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Cloud size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-semibold">Word Cloud Output</h2>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Your generated word cloud preview will appear below.
                  </p>
                </div>

                <button
                  onClick={handleCopyWords}
                  disabled={!wordList.length}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    wordList.length
                      ? copied
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-white text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary)]/5"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                  title="Copy word frequency list"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-4 bg-gray-50">
                <canvas
                  ref={canvasRef}
                  width="900"
                  height="600"
                  className="w-full rounded-xl border border-[var(--border)] bg-white"
                />

                {!wordList.length && (
                  <div className="text-center py-8">
                    <Cloud size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-[var(--text-secondary)]">
                      Enter text and click “Generate Word Cloud”.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownload}
                disabled={!wordList.length}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !wordList.length ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download PNG
              </button>

              <button
                onClick={resetTool}
                className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Clear All
              </button>
            </div>

            {/* TOP WORDS */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Top Words</h3>
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-4 bg-[#f8f4ff] min-h-[180px]">
                {wordList.length ? (
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-auto pr-1">
                    {wordList.slice(0, 15).map(([word, count], index) => (
                      <div
                        key={`${word}-${index}`}
                        className="flex items-center justify-between gap-3 bg-white border border-[var(--border)] rounded-xl px-3 py-2"
                      >
                        <span className="text-sm font-medium break-all">
                          {index + 1}. {word}
                        </span>

                        <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded-lg">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Top word frequency list will appear here after generation.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              Characters
            </p>
            <p className="text-xl font-bold text-[var(--primary)]">
              {stats.totalCharacters}
            </p>
          </div>

          <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              Total Words
            </p>
            <p className="text-xl font-bold text-[var(--primary)]">
              {stats.totalWords}
            </p>
          </div>

          <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              Cloud Words
            </p>
            <p className="text-xl font-bold text-[var(--primary)]">
              {wordList.length}
            </p>
          </div>

          <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              Top Word
            </p>
            <p className="text-xl font-bold text-[var(--primary)] break-all">
              {stats.topWord}
            </p>
          </div>

          <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              Top Count
            </p>
            <p className="text-xl font-bold text-green-600">
              {stats.topCount}
            </p>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="word-cloud-generator" />
    </div>
  );
}