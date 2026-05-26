import { useMemo, useState } from "react";
import {
  Type,
  Copy,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Trash2,
  FileText,
  Hash,
  Clock3,
  Target,
  BarChart3,
  Search,
  MessageSquare,
  BookOpen,
  ListChecks,
  Sparkles,
  ClipboardList,
  Info,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Character Counter",
  path: "/character-counter",
  category: "Text Tools",
  description:
    "Count characters, words, sentences, paragraphs, reading time, keyword density, and text limits for SEO, social media, ads, and writing.",
  metaTitle:
    "Character Counter | Count Characters, Words & SEO Text Length",
  metaDescription:
    "Free online character counter and word counter. Count characters, words, sentences, paragraphs, reading time, keyword density, meta title length, meta description length, and social media text limits.",
};

const SAMPLE_TEXT =
  "Write better content with a fast character counter. Check your words, characters, reading time, keyword density, and SEO text length before publishing.";

const TARGET_PRESETS = [
  {
    id: "general",
    label: "General Text",
    description: "Best for articles, notes, captions, and normal writing.",
    min: 1,
    idealMin: 1,
    idealMax: 10000,
    max: 10000,
  },
  {
    id: "meta-title",
    label: "SEO Meta Title",
    description: "Useful for checking page title length before publishing.",
    min: 30,
    idealMin: 50,
    idealMax: 60,
    max: 70,
  },
  {
    id: "meta-description",
    label: "SEO Meta Description",
    description: "Useful for checking search snippet description length.",
    min: 70,
    idealMin: 120,
    idealMax: 160,
    max: 180,
  },
  {
    id: "google-ads-headline",
    label: "Google Ads Headline",
    description: "Common short ad headline writing target.",
    min: 1,
    idealMin: 15,
    idealMax: 30,
    max: 30,
  },
  {
    id: "google-ads-description",
    label: "Google Ads Description",
    description: "Common ad description writing target.",
    min: 1,
    idealMin: 60,
    idealMax: 90,
    max: 90,
  },
  {
    id: "youtube-title",
    label: "YouTube Title",
    description: "Useful for checking video title length.",
    min: 20,
    idealMin: 40,
    idealMax: 70,
    max: 100,
  },
  {
    id: "x-post",
    label: "X / Twitter Post",
    description: "Useful for short social media posts.",
    min: 1,
    idealMin: 40,
    idealMax: 240,
    max: 280,
  },
  {
    id: "instagram-caption",
    label: "Instagram Caption",
    description: "Useful for product captions and social media posts.",
    min: 1,
    idealMin: 80,
    idealMax: 400,
    max: 2200,
  },
  {
    id: "linkedin-post",
    label: "LinkedIn Post",
    description: "Useful for professional posts and personal branding.",
    min: 1,
    idealMin: 150,
    idealMax: 1200,
    max: 3000,
  },
  {
    id: "sms",
    label: "SMS Message",
    description: "Useful for checking short SMS campaign text.",
    min: 1,
    idealMin: 1,
    idealMax: 160,
    max: 160,
  },
];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "he",
  "her",
  "his",
  "i",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "our",
  "she",
  "that",
  "the",
  "their",
  "this",
  "to",
  "was",
  "we",
  "were",
  "will",
  "with",
  "you",
  "your",
]);

export default function CharacterCounter() {
  const [text, setText] = useState("");
  const [targetId, setTargetId] = useState("general");
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const selectedTarget = useMemo(() => {
    return (
      TARGET_PRESETS.find((target) => target.id === targetId) ||
      TARGET_PRESETS[0]
    );
  }, [targetId]);

  const stats = useMemo(() => {
    return analyzeText(text);
  }, [text]);

  const targetStatus = useMemo(() => {
    return getTargetStatus(stats.characters, selectedTarget);
  }, [stats.characters, selectedTarget]);

  const keywordDensity = useMemo(() => {
    return getKeywordDensity(stats.wordsArray, 10);
  }, [stats.wordsArray]);

  const copiedSummary = useMemo(() => {
    return [
      "Character Counter Results",
      `Characters: ${stats.characters}`,
      `Characters without spaces: ${stats.charactersNoSpaces}`,
      `Words: ${stats.words}`,
      `Sentences: ${stats.sentences}`,
      `Paragraphs: ${stats.paragraphs}`,
      `Lines: ${stats.lines}`,
      `Reading time: ${formatMinutes(stats.readingMinutes)}`,
      `Speaking time: ${formatMinutes(stats.speakingMinutes)}`,
      `Selected target: ${selectedTarget.label}`,
      `Target status: ${targetStatus.label}`,
    ].join("\n");
  }, [stats, selectedTarget, targetStatus]);

  function clearFeedback() {
    setSuccess("");
    setError("");
    setCopied(false);
  }

  function handleTextChange(value) {
    setText(value);
    clearFeedback();
  }

  function handleTargetChange(value) {
    setTargetId(value);
    clearFeedback();
  }

  async function handleCopyStats() {
    if (!text.trim()) {
      setError("Please enter or paste text first.");
      setSuccess("");
      return;
    }

    try {
      await copyToClipboard(copiedSummary);
      setCopied(true);
      setError("");
      setSuccess("Text statistics copied successfully.");

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setError("Copy failed. Please copy the results manually.");
      setSuccess("");
    }
  }

  async function handleCopyText() {
    if (!text.trim()) {
      setError("Please enter or paste text first.");
      setSuccess("");
      return;
    }

    try {
      await copyToClipboard(text);
      setCopied(true);
      setError("");
      setSuccess("Text copied successfully.");

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setError("Copy failed. Please copy the text manually.");
      setSuccess("");
    }
  }

  function handleSampleText() {
    setText(SAMPLE_TEXT);
    setError("");
    setSuccess("Sample text added.");
    setCopied(false);
  }

  function handleClear() {
    setText("");
    setError("");
    setSuccess("");
    setCopied(false);
  }

  function handleReset() {
    setText("");
    setTargetId("general");
    setError("");
    setSuccess("");
    setCopied(false);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Type size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Character Counter</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Count characters, words, sentences, paragraphs, reading time, speaking
          time, keyword density, and SEO or social media text limits instantly.
          Paste your text, choose a writing target, and improve your content
          before publishing.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* TEXT INPUT */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-semibold">Your Text</h2>
                </div>

                <span className="text-xs text-[var(--text-secondary)]">
                  Instant analysis
                </span>
              </div>

              <textarea
                value={text}
                onChange={(event) => handleTextChange(event.target.value)}
                placeholder="Paste or type your text here to count characters, words, reading time, and SEO length..."
                rows="15"
                className="w-full border border-[var(--border)] rounded-2xl px-4 py-4 bg-white outline-none focus:border-[var(--primary)] resize-none leading-7"
              />

              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleSampleText}
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  Add Sample
                </button>

                <button
                  type="button"
                  onClick={handleCopyText}
                  disabled={!text.trim()}
                  className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                    !text.trim() ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Copy size={18} />
                  Copy Text
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!text}
                  className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                    !text ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Trash2 size={18} />
                  Clear
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>
            </div>

            {/* TARGET SELECTOR */}
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Writing Target</h3>
              </div>

              <label className="block text-sm font-semibold mb-2">
                Choose a text length target
              </label>

              <select
                value={targetId}
                onChange={(event) => handleTargetChange(event.target.value)}
                className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
              >
                {TARGET_PRESETS.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.label}
                  </option>
                ))}
              </select>

              <div className="mt-4 bg-white border border-[var(--border)] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{selectedTarget.label}</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {selectedTarget.description}
                    </p>
                  </div>

                  <StatusPill status={targetStatus.status} label={targetStatus.label} />
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                    <span>{stats.characters} characters</span>
                    <span>Limit: {selectedTarget.max}</span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-gray-100 border border-[var(--border)] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${targetStatus.barClass}`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((stats.characters / selectedTarget.max) * 100)
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    Ideal range: {selectedTarget.idealMin}–
                    {selectedTarget.idealMax} characters
                  </p>
                </div>
              </div>
            </div>

            {/* FEEDBACK */}
            {error && (
              <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            {/* COPY RESULTS */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Copy Results</h3>
              </div>

              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Copy a clean summary of your text statistics for content review,
                SEO writing, or reporting.
              </p>

              <button
                type="button"
                onClick={handleCopyStats}
                disabled={!text.trim()}
                className={`btn-primary inline-flex items-center justify-center gap-2 ${
                  !text.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : "Copy Statistics"}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* MAIN STATS */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Text Statistics</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Characters" value={stats.characters} />
                <StatCard
                  label="Without Spaces"
                  value={stats.charactersNoSpaces}
                />
                <StatCard label="Words" value={stats.words} green />
                <StatCard label="Sentences" value={stats.sentences} />
                <StatCard label="Paragraphs" value={stats.paragraphs} />
                <StatCard label="Lines" value={stats.lines} />
                <StatCard
                  label="Reading Time"
                  value={formatMinutes(stats.readingMinutes)}
                  green
                />
                <StatCard
                  label="Speaking Time"
                  value={formatMinutes(stats.speakingMinutes)}
                />
              </div>
            </div>

            {/* EXTRA STATS */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Hash size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Detailed Analysis</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <MiniStat label="Unique Words" value={stats.uniqueWords} />
                <MiniStat
                  label="Avg. Word Length"
                  value={
                    stats.averageWordLength
                      ? stats.averageWordLength.toFixed(1)
                      : "0"
                  }
                />
                <MiniStat label="Spaces" value={stats.spaces} />
                <MiniStat label="Numbers" value={stats.numbers} />
                <MiniStat
                  label="Longest Word"
                  value={stats.longestWord || "-"}
                />
                <MiniStat
                  label="Text Case"
                  value={detectTextCase(text)}
                />
              </div>
            </div>

            {/* KEYWORD DENSITY */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Search size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Keyword Density</h3>
              </div>

              {keywordDensity.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {keywordDensity.map((item) => (
                    <div key={item.word}>
                      <div className="flex justify-between gap-3 text-sm mb-1">
                        <span className="font-semibold break-all">
                          {item.word}
                        </span>
                        <span className="text-[var(--text-secondary)]">
                          {item.count} × • {item.percent.toFixed(1)}%
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-[var(--primary)]"
                          style={{
                            width: `${Math.min(100, item.percent * 8)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                  <Search size={38} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    Keyword density will appear after you enter enough text.
                  </p>
                </div>
              )}
            </div>

            {/* TEXT LIMIT GUIDE */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Info size={18} className="text-blue-700" />
                <h3 className="font-semibold text-blue-900">
                  SEO and social media length checker
                </h3>
              </div>

              <p className="text-sm text-blue-800">
                Use the writing target selector to check if your text is short,
                ideal, or too long for meta titles, meta descriptions, ads,
                captions, SMS, and social media posts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO CONTENT SECTION */}
      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">
            Free Online Character Counter for SEO, Writing, and Social Media
          </h2>
        </div>

        <div className="prose max-w-none text-[var(--text-secondary)]">
          <p>
            This character counter helps writers, students, marketers, SEO
            editors, ecommerce owners, and social media managers measure text
            length instantly. You can count total characters, characters without
            spaces, words, sentences, paragraphs, reading time, speaking time,
            and keyword density in one place.
          </p>

          <p>
            It is useful when writing meta titles, meta descriptions, product
            descriptions, ad copy, Instagram captions, LinkedIn posts, YouTube
            titles, SMS messages, and short website content. The tool runs in
            your browser and does not need a paid API.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <InfoCard
            title="For SEO"
            text="Check meta title and meta description length before publishing a page."
          />

          <InfoCard
            title="For Social Media"
            text="Write captions and posts with a clear character limit target."
          />

          <InfoCard
            title="For Writing"
            text="Measure words, paragraphs, reading time, and text structure quickly."
          />
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <ListChecks size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">Character Counter FAQ</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FaqItem
            question="What does this character counter count?"
            answer="It counts total characters, characters without spaces, words, sentences, paragraphs, lines, spaces, numbers, reading time, speaking time, and keyword density."
          />

          <FaqItem
            question="Can I use it for SEO meta titles?"
            answer="Yes. Choose the SEO Meta Title target to check whether your page title is within a practical writing range."
          />

          <FaqItem
            question="Can I use it for meta descriptions?"
            answer="Yes. Choose the SEO Meta Description target to check whether your description is too short, ideal, or too long."
          />

          <FaqItem
            question="Does this tool store my text?"
            answer="No. The counter works directly in your browser and does not need a server or paid API."
          />

          <FaqItem
            question="Is this also a word counter?"
            answer="Yes. It works as both a character counter and a word counter."
          />

          <FaqItem
            question="Can it check social media character limits?"
            answer="Yes. It includes targets for X/Twitter posts, Instagram captions, LinkedIn posts, YouTube titles, SMS, and ad copy."
          />
        </div>
      </section>

      <SuggestedTools currentToolId="character-counter" />
    </div>
  );
}

function StatCard({ label, value, green = false }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-4 text-center">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p
        className={`text-2xl font-bold break-all ${
          green ? "text-green-600" : "text-[var(--primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-[#f8f4ff] border border-[var(--border)] p-3">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="font-semibold break-all">{value}</p>
    </div>
  );
}

function StatusPill({ status, label }) {
  const className =
    status === "good"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "warning"
        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
        : status === "danger"
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)]">{text}</p>
    </div>
  );
}

function FaqItem({ question, answer }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-sm text-[var(--text-secondary)]">{answer}</p>
    </div>
  );
}

function analyzeText(text) {
  const cleanText = String(text || "");
  const characters = Array.from(cleanText).length;
  const charactersNoSpaces = Array.from(cleanText.replace(/\s/g, "")).length;
  const wordsArray = getWords(cleanText);
  const words = wordsArray.length;
  const sentences = countSentences(cleanText);
  const paragraphs = countParagraphs(cleanText);
  const lines = cleanText ? cleanText.split(/\r\n|\r|\n/).length : 0;
  const spaces = (cleanText.match(/ /g) || []).length;
  const numbers = (cleanText.match(/\d/g) || []).length;
  const uniqueWords = new Set(wordsArray.map((word) => word.toLowerCase())).size;
  const averageWordLength =
    words > 0
      ? wordsArray.reduce((sum, word) => sum + Array.from(word).length, 0) /
        words
      : 0;
  const longestWord =
    wordsArray.length > 0
      ? wordsArray.reduce((longest, word) =>
          Array.from(word).length > Array.from(longest).length ? word : longest
        )
      : "";

  return {
    characters,
    charactersNoSpaces,
    words,
    wordsArray,
    sentences,
    paragraphs,
    lines,
    spaces,
    numbers,
    uniqueWords,
    averageWordLength,
    longestWord,
    readingMinutes: words / 200,
    speakingMinutes: words / 130,
  };
}

function getWords(text) {
  const matches = String(text || "").match(
    /[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu
  );

  return matches || [];
}

function countSentences(text) {
  const cleanText = String(text || "").trim();

  if (!cleanText) return 0;

  const matches = cleanText.match(/[^.!?।]+[.!?।]+/g);

  if (matches) {
    return matches.length;
  }

  return 1;
}

function countParagraphs(text) {
  const cleanText = String(text || "").trim();

  if (!cleanText) return 0;

  return cleanText.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).length;
}

function getKeywordDensity(wordsArray, limit = 10) {
  if (!wordsArray.length) return [];

  const frequency = new Map();

  wordsArray.forEach((word) => {
    const cleanWord = word.toLowerCase();

    if (cleanWord.length < 3 || STOP_WORDS.has(cleanWord)) {
      return;
    }

    frequency.set(cleanWord, (frequency.get(cleanWord) || 0) + 1);
  });

  return Array.from(frequency.entries())
    .map(([word, count]) => ({
      word,
      count,
      percent: (count / wordsArray.length) * 100,
    }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

function getTargetStatus(characterCount, target) {
  if (!characterCount) {
    return {
      status: "neutral",
      label: "Waiting",
      barClass: "bg-gray-300",
    };
  }

  if (characterCount > target.max) {
    return {
      status: "danger",
      label: "Too Long",
      barClass: "bg-red-500",
    };
  }

  if (characterCount < target.min) {
    return {
      status: "warning",
      label: "Too Short",
      barClass: "bg-yellow-500",
    };
  }

  if (
    characterCount >= target.idealMin &&
    characterCount <= target.idealMax
  ) {
    return {
      status: "good",
      label: "Ideal",
      barClass: "bg-green-500",
    };
  }

  return {
    status: "warning",
    label: "Acceptable",
    barClass: "bg-yellow-500",
  };
}

function formatMinutes(minutes) {
  if (!minutes) return "0 min";

  if (minutes < 1) {
    return "<1 min";
  }

  return `${Math.ceil(minutes)} min`;
}

function detectTextCase(text) {
  const cleanText = String(text || "").replace(/[^a-zA-Z]/g, "");

  if (!cleanText) return "-";

  if (cleanText === cleanText.toUpperCase()) {
    return "UPPERCASE";
  }

  if (cleanText === cleanText.toLowerCase()) {
    return "lowercase";
  }

  return "Mixed";
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const successful = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!successful) {
    throw new Error("Copy failed.");
  }
}