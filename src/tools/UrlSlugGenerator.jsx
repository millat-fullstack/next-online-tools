import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Link,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Sparkles,
  FileText,
  Wand2,
  Settings2,
  BarChart3,
  Eye,
  Info,
  BookOpen,
  ListChecks,
  CheckCircle,
  AlertCircle,
  Globe,
  Hash,
  Scissors,
  ShieldCheck,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Clean URL Slug Generator",
  path: "/clean-url-slug-generator",
  category: "SEO Tools",
  description:
    "Generate clean, SEO-friendly, and user-friendly URL slugs from titles, text, article names, product names, or page headings.",
  metaTitle: "Clean URL Slug Generator | SEO Friendly Slug Maker",
  metaDescription:
    "Create clean URL slugs online for blog posts, pages, products, and SEO URLs. Convert titles into lowercase, hyphen-separated, user-friendly slugs instantly.",
};

const SITE_URL = "https://nextonlinetools.com";
const canonicalUrl = `${SITE_URL}${
  toolData.path.startsWith("/tool") ? toolData.path : `/tool${toolData.path}`
}`;

const SAMPLE_TEXT = "How to Convert JPG to PDF Online for Free";
const DEFAULT_BASE_URL = "https://example.com/blog/";
const DEFAULT_MAX_LENGTH = 80;

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "by",
  "from",
  "at",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "this",
  "that",
  "these",
  "those",
  "your",
  "you",
  "we",
  "our",
  "how",
  "why",
  "what",
  "when",
  "where",
  "which",
  "can",
  "do",
  "does",
  "did",
  "into",
]);

const SYMBOL_REPLACEMENTS = [
  [/&/g, " and "],
  [/@/g, " at "],
  [/\+/g, " plus "],
  [/%/g, " percent "],
  [/=/g, " equals "],
  [/\$/g, " dollar "],
  [/€/g, " euro "],
  [/£/g, " pound "],
  [/৳/g, " taka "],
  [/\#/g, " "],
];

const SLUG_PRESETS = [
  {
    id: "standard",
    label: "Standard SEO",
    description: "Lowercase, hyphen-separated, clean URL slug.",
    settings: {
      separator: "-",
      lowercase: true,
      removeStopWords: false,
      removeNumbers: false,
      keepUnicode: false,
      maxLength: 80,
    },
  },
  {
    id: "short",
    label: "Short SEO Slug",
    description: "Shorter slug with common stop words removed.",
    settings: {
      separator: "-",
      lowercase: true,
      removeStopWords: true,
      removeNumbers: false,
      keepUnicode: false,
      maxLength: 55,
    },
  },
  {
    id: "unicode",
    label: "Unicode Slug",
    description: "Better for Bangla or non-English titles.",
    settings: {
      separator: "-",
      lowercase: true,
      removeStopWords: false,
      removeNumbers: false,
      keepUnicode: true,
      maxLength: 80,
    },
  },
  {
    id: "product",
    label: "Product Slug",
    description: "Keeps numbers for product names, sizes, and models.",
    settings: {
      separator: "-",
      lowercase: true,
      removeStopWords: true,
      removeNumbers: false,
      keepUnicode: false,
      maxLength: 90,
    },
  },
];

export default function CleanUrlSlugGenerator() {
  const [inputText, setInputText] = useState("");
  const [separator, setSeparator] = useState("-");
  const [lowercase, setLowercase] = useState(true);
  const [removeStopWords, setRemoveStopWords] = useState(false);
  const [removeNumbers, setRemoveNumbers] = useState(false);
  const [keepUnicode, setKeepUnicode] = useState(false);
  const [maxLength, setMaxLength] = useState(DEFAULT_MAX_LENGTH);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [copiedTarget, setCopiedTarget] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const slug = useMemo(() => {
    return generateSlug(inputText, {
      separator,
      lowercase,
      removeStopWords,
      removeNumbers,
      keepUnicode,
      maxLength,
    });
  }, [inputText, separator, lowercase, removeStopWords, removeNumbers, keepUnicode, maxLength]);

  const fullUrl = useMemo(() => {
    if (!slug) return "";
    return `${normalizeBaseUrl(baseUrl)}${slug}`;
  }, [baseUrl, slug]);

  const slugStats = useMemo(() => {
    const words = slug ? slug.split(separator).filter(Boolean).length : 0;
    const characters = Array.from(slug).length;
    const hasUppercase = /[A-Z]/.test(slug);
    const hasSpecialChars = keepUnicode
      ? /[^\p{L}\p{N}\-_]/u.test(slug)
      : /[^a-z0-9\-_]/i.test(slug);
    const isGoodLength = characters > 0 && characters <= 80;

    return {
      words,
      characters,
      hasUppercase,
      hasSpecialChars,
      isGoodLength,
    };
  }, [slug, separator, keepUnicode]);

  const qualityItems = useMemo(() => {
    return [
      {
        label: "Uses clean lowercase format",
        good: Boolean(slug) && !slugStats.hasUppercase,
      },
      {
        label: "Uses readable word separators",
        good: Boolean(slug) && !slug.includes("--") && !slug.includes("__"),
      },
      {
        label: "Avoids unnecessary special characters",
        good: Boolean(slug) && !slugStats.hasSpecialChars,
      },
      {
        label: "Slug length is easy to scan",
        good: Boolean(slug) && slugStats.isGoodLength,
      },
      {
        label: "Ready to copy and use in a URL",
        good: Boolean(slug),
      },
    ];
  }, [slug, slugStats]);

  const variants = useMemo(() => {
    if (!inputText.trim()) return [];

    return SLUG_PRESETS.map((preset) => ({
      ...preset,
      value: generateSlug(inputText, preset.settings),
    })).filter((item) => item.value);
  }, [inputText]);

  const seoJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Clean URL Slug Generator",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      "@id": canonicalUrl,
      url: canonicalUrl,
      description:
        "Generate clean, SEO-friendly URL slugs from page titles, blog titles, product names, and text.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "SEO URL slug generator",
        "Clean title to slug converter",
        "Hyphen and underscore slug options",
        "Stop word remover",
        "Unicode slug support",
        "Copy slug and full URL",
      ],
    };
  }, []);

  const faqJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is a URL slug?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A URL slug is the readable part of a web address that usually comes after the domain name. It helps users and search engines understand what the page is about.",
          },
        },
        {
          "@type": "Question",
          name: "What makes a slug SEO friendly?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A clean SEO friendly slug is usually short, readable, lowercase, separated with hyphens, and focused on the main topic of the page.",
          },
        },
        {
          "@type": "Question",
          name: "Should I use hyphens or underscores in URL slugs?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Hyphens are generally preferred for readable URL slugs because they clearly separate words for users and search engines.",
          },
        },
      ],
    };
  }, []);

  function clearFeedback() {
    setSuccess("");
    setError("");
    setCopiedTarget("");
  }

  function handleInputChange(value) {
    setInputText(value);
    clearFeedback();
  }

  function handleSample() {
    setInputText(SAMPLE_TEXT);
    setSuccess("Sample title added.");
    setError("");
    setCopiedTarget("");
  }

  function handleClear() {
    setInputText("");
    setSuccess("");
    setError("");
    setCopiedTarget("");
  }

  function handleReset() {
    setInputText("");
    setSeparator("-");
    setLowercase(true);
    setRemoveStopWords(false);
    setRemoveNumbers(false);
    setKeepUnicode(false);
    setMaxLength(DEFAULT_MAX_LENGTH);
    setBaseUrl(DEFAULT_BASE_URL);
    setSuccess("");
    setError("");
    setCopiedTarget("");
  }

  function applyPreset(preset) {
    setSeparator(preset.settings.separator);
    setLowercase(preset.settings.lowercase);
    setRemoveStopWords(preset.settings.removeStopWords);
    setRemoveNumbers(preset.settings.removeNumbers);
    setKeepUnicode(preset.settings.keepUnicode);
    setMaxLength(preset.settings.maxLength);
    setSuccess(`${preset.label} preset applied.`);
    setError("");
    setCopiedTarget("");
  }

  function useVariant(variant) {
    setSeparator(variant.settings.separator);
    setLowercase(variant.settings.lowercase);
    setRemoveStopWords(variant.settings.removeStopWords);
    setRemoveNumbers(variant.settings.removeNumbers);
    setKeepUnicode(variant.settings.keepUnicode);
    setMaxLength(variant.settings.maxLength);
    setSuccess(`${variant.label} selected.`);
    setError("");
    setCopiedTarget("");
  }

  async function handleCopy(text, targetLabel) {
    clearFeedback();

    if (!text) {
      setError("Please type or paste a title first.");
      return;
    }

    try {
      await copyToClipboard(text);
      setCopiedTarget(targetLabel);
      setSuccess(`${targetLabel} copied successfully.`);

      window.setTimeout(() => {
        setCopiedTarget("");
      }, 1500);
    } catch {
      setError("Copy failed. Please copy the text manually.");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Helmet>
        <title>{toolData.metaTitle}</title>
        <meta name="description" content={toolData.metaDescription} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={toolData.metaTitle} />
        <meta property="og:description" content={toolData.metaDescription} />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={toolData.metaTitle} />
        <meta name="twitter:description" content={toolData.metaDescription} />

        <script type="application/ld+json">{JSON.stringify(seoJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Link size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Clean URL Slug Generator</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Smart, fast, and easy to use online tool built to generate clean,
          search engine friendly, and user friendly URL slugs from titles,
          page names, article headings, product names, or text.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* INPUT */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-semibold">Enter Title or Text</h2>
                </div>

                <span className="text-xs text-[var(--text-secondary)]">
                  Title to slug converter
                </span>
              </div>

              <textarea
                value={inputText}
                onChange={(event) => handleInputChange(event.target.value)}
                placeholder="Example: How to Convert JPG to PDF Online for Free"
                rows="8"
                className="w-full border border-[var(--border)] rounded-2xl px-4 py-4 bg-white outline-none focus:border-[var(--primary)] resize-none leading-7"
              />

              <div className="grid sm:grid-cols-4 gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleSample}
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  Sample
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(slug, "Slug")}
                  disabled={!slug}
                  className={`btn-primary inline-flex items-center justify-center gap-2 ${
                    !slug ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {copiedTarget === "Slug" ? <Check size={18} /> : <Copy size={18} />}
                  {copiedTarget === "Slug" ? "Copied" : "Copy"}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!inputText}
                  className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                    !inputText ? "opacity-50 cursor-not-allowed" : ""
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

            {/* SMART PRESETS */}
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wand2 size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Smart Slug Presets</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {SLUG_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-2xl border border-[var(--border)] bg-white p-4 text-left hover:bg-[#f8f4ff] transition"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={17} className="text-[var(--primary)]" />
                      <span className="font-semibold text-sm">{preset.label}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* SETTINGS */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Slug Settings</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Separator</label>
                  <select
                    value={separator}
                    onChange={(event) => setSeparator(event.target.value)}
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  >
                    <option value="-">Hyphen - recommended</option>
                    <option value="_">Underscore _</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Max Length</label>
                  <input
                    type="number"
                    min="20"
                    max="150"
                    value={maxLength}
                    onChange={(event) => setMaxLength(safeNumber(event.target.value, DEFAULT_MAX_LENGTH))}
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <ToggleOption
                  checked={lowercase}
                  onChange={() => setLowercase((value) => !value)}
                  title="Convert to lowercase"
                  description="Recommended for clean and consistent URLs."
                />

                <ToggleOption
                  checked={removeStopWords}
                  onChange={() => setRemoveStopWords((value) => !value)}
                  title="Remove common stop words"
                  description="Makes long English titles shorter."
                />

                <ToggleOption
                  checked={removeNumbers}
                  onChange={() => setRemoveNumbers((value) => !value)}
                  title="Remove numbers"
                  description="Useful when dates or numbers are not needed."
                />

                <ToggleOption
                  checked={keepUnicode}
                  onChange={() => setKeepUnicode((value) => !value)}
                  title="Keep Unicode letters"
                  description="Useful for Bangla or non-English slugs."
                />
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
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* OUTPUT */}
            <div className="border border-[var(--border)] rounded-2xl p-5 bg-gray-50">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Eye size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-semibold">Generated Slug</h2>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(slug, "Slug")}
                  disabled={!slug}
                  title="Copy slug"
                  className={`text-[var(--primary)] hover:opacity-75 transition ${
                    !slug ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                >
                  {copiedTarget === "Slug" ? <Check size={22} /> : <Copy size={22} />}
                </button>
              </div>

              <div className="bg-white border border-[var(--border)] rounded-2xl p-4 min-h-[96px] flex items-center">
                {slug ? (
                  <p className="text-lg font-semibold break-all text-[var(--primary)]">
                    {slug}
                  </p>
                ) : (
                  <p className="text-[var(--text-secondary)]">
                    Your clean URL slug will appear here.
                  </p>
                )}
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium mb-2 block">Optional URL Preview</label>
                <input
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  placeholder="https://example.com/blog/"
                  className="w-full border border-[var(--border)] rounded-xl px-3 py-3 bg-white outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="bg-white border border-[var(--border)] rounded-2xl p-4 mt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Full URL Preview</p>
                    {fullUrl ? (
                      <p className="text-sm break-all text-green-700 font-medium">{fullUrl}</p>
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)]">
                        Full URL preview will appear after generating a slug.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(fullUrl, "Full URL")}
                    disabled={!fullUrl}
                    title="Copy full URL"
                    className={`text-[var(--primary)] hover:opacity-75 transition shrink-0 ${
                      !fullUrl ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                  >
                    {copiedTarget === "Full URL" ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Characters" value={slugStats.characters} />
              <StatCard label="Words" value={slugStats.words} />
              <StatCard label="Separator" value={separator === "-" ? "Hyphen" : "Underscore"} />
              <StatCard label="Max Length" value={maxLength} green />
            </div>

            {/* QUALITY CHECK */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Slug Quality Guide</h3>
              </div>

              <div className="space-y-3">
                {qualityItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-3 text-sm">
                    {item.good ? (
                      <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <Info size={18} className="text-gray-400 shrink-0 mt-0.5" />
                    )}
                    <span className={item.good ? "text-green-700" : "text-[var(--text-secondary)]"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* VARIANTS */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Scissors size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Slug Variants</h3>
              </div>

              {variants.length ? (
                <div className="space-y-3">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="bg-white border border-[var(--border)] rounded-2xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-sm">{variant.label}</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {variant.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => useVariant(variant)}
                          className="text-xs font-semibold text-[var(--primary)] hover:underline"
                        >
                          Use
                        </button>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm break-all text-[var(--text-secondary)] min-w-0">
                          {variant.value}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopy(variant.value, variant.label)}
                          title={`Copy ${variant.label}`}
                          className="text-[var(--primary)] hover:opacity-75 transition shrink-0"
                        >
                          {copiedTarget === variant.label ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  Enter a title to see clean slug variations.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SEO CONTENT */}
      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">
            Generate Clean SEO Friendly URL Slugs Online
          </h2>
        </div>

        <div className="text-[var(--text-secondary)] leading-7 space-y-4">
          <p>
            A clean URL slug makes a page address easier to read, share, and
            understand. This Clean URL Slug Generator converts long titles,
            blog headings, product names, and page names into short, readable,
            and search engine friendly URL slugs.
          </p>

          <p>
            You can create lowercase slugs, choose hyphen or underscore
            separators, remove common stop words, set a maximum length, keep or
            remove numbers, and generate Unicode-friendly slugs for non-English
            text when needed.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <InfoCard
            icon={Hash}
            title="Title to Slug Converter"
            text="Paste any title and instantly turn it into a clean URL slug."
          />

          <InfoCard
            icon={Globe}
            title="SEO Friendly URL"
            text="Create readable slugs for blog posts, landing pages, and products."
          />

          <InfoCard
            icon={Copy}
            title="Copy and Use"
            text="Copy the slug or full URL preview with one click."
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <ListChecks size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">Clean URL Slug Generator FAQ</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FaqItem
            question="What is a URL slug?"
            answer="A URL slug is the readable part of a web address that identifies a specific page, blog post, product, or article."
          />

          <FaqItem
            question="How do I make a URL slug SEO friendly?"
            answer="Keep it short, readable, lowercase, and focused on the main keywords. Hyphens are commonly used to separate words."
          />

          <FaqItem
            question="Can I use this tool for blog post URLs?"
            answer="Yes. You can use it to create clean slugs for blog posts, pages, product pages, categories, and landing pages."
          />

          <FaqItem
            question="Does this tool support Bangla or non-English text?"
            answer="Yes. Turn on the Keep Unicode letters option to create cleaner slugs from Bangla or other non-English text."
          />

          <FaqItem
            question="Should I remove stop words from a slug?"
            answer="Sometimes. Removing common words can make long English slugs shorter, but keep words that are important for meaning."
          />

          <FaqItem
            question="Is this slug generator private?"
            answer="Yes. The tool runs in your browser and does not require a paid API or server upload to generate slugs."
          />
        </div>
      </section>

      <SuggestedTools currentToolId="clean-url-slug-generator" />
    </div>
  );
}

function ToggleOption({ checked, onChange, title, description }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`rounded-2xl border p-4 text-left transition ${
        checked
          ? "border-[var(--primary)] bg-[#f8f4ff]"
          : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            checked
              ? "bg-[var(--primary)] border-[var(--primary)] text-white"
              : "border-[var(--border)] text-transparent"
          }`}
        >
          <Check size={13} />
        </span>

        <span>
          <span className="block font-semibold text-sm">{title}</span>
          <span className="block text-xs text-[var(--text-secondary)] mt-1">
            {description}
          </span>
        </span>
      </div>
    </button>
  );
}

function StatCard({ label, value, green = false }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-4 text-center">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p
        className={`text-xl font-bold break-all ${
          green ? "text-green-600" : "text-[var(--primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoCard({ icon: Icon, title, text }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className="text-[var(--primary)]" />
        <h3 className="font-semibold">{title}</h3>
      </div>
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

function generateSlug(text, options = {}) {
  const {
    separator = "-",
    lowercase = true,
    removeStopWords = false,
    removeNumbers = false,
    keepUnicode = false,
    maxLength = DEFAULT_MAX_LENGTH,
  } = options;

  let value = String(text || "").trim();

  if (!value) return "";

  value = value.replace(/https?:\/\//gi, " ");
  value = value.replace(/www\./gi, " ");

  SYMBOL_REPLACEMENTS.forEach(([pattern, replacement]) => {
    value = value.replace(pattern, replacement);
  });

  value = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`]/g, "")
    .replace(/[“”]/g, "")
    .replace(/[–—]/g, "-");

  if (lowercase) {
    value = value.toLowerCase();
  }

  if (removeNumbers) {
    value = value.replace(/[0-9]/g, " ");
  }

  if (keepUnicode) {
    value = value.replace(/[^\p{L}\p{N}]+/gu, separator);
  } else {
    value = value.replace(/[^a-zA-Z0-9]+/g, separator);
  }

  value = trimRepeatedSeparators(value, separator);

  if (removeStopWords && !keepUnicode) {
    value = value
      .split(separator)
      .filter((word) => word && !STOP_WORDS.has(word.toLowerCase()))
      .join(separator);
  }

  value = trimRepeatedSeparators(value, separator);
  value = limitSlugLength(value, Number(maxLength) || DEFAULT_MAX_LENGTH, separator);
  value = trimRepeatedSeparators(value, separator);

  return value;
}

function trimRepeatedSeparators(value, separator) {
  const escapedSeparator = escapeRegExp(separator);
  const repeatedSeparatorRegex = new RegExp(`${escapedSeparator}{2,}`, "g");
  const edgeSeparatorRegex = new RegExp(`^${escapedSeparator}+|${escapedSeparator}+$`, "g");

  return String(value || "")
    .replace(repeatedSeparatorRegex, separator)
    .replace(edgeSeparatorRegex, "");
}

function limitSlugLength(slug, maxLength, separator) {
  const safeMaxLength = Math.min(Math.max(Number(maxLength) || DEFAULT_MAX_LENGTH, 20), 150);

  if (Array.from(slug).length <= safeMaxLength) {
    return slug;
  }

  const parts = slug.split(separator).filter(Boolean);
  const selectedParts = [];
  let currentLength = 0;

  for (const part of parts) {
    const nextLength = currentLength + Array.from(part).length + (selectedParts.length ? 1 : 0);

    if (nextLength > safeMaxLength) break;

    selectedParts.push(part);
    currentLength = nextLength;
  }

  if (selectedParts.length) {
    return selectedParts.join(separator);
  }

  return Array.from(slug).slice(0, safeMaxLength).join("");
}

function normalizeBaseUrl(value) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) return "";

  return cleanValue.endsWith("/") ? cleanValue : `${cleanValue}/`;
}

function safeNumber(value, fallback) {
  const number = Number(value);

  if (Number.isNaN(number)) return fallback;

  return Math.min(Math.max(number, 20), 150);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
