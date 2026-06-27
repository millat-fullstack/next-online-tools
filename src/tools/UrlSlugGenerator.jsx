import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronDown,
  Copy,
  FileText,
  Globe,
  Link,
  RotateCcw,
  Settings2,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Clean URL Slug Generator",
  path: "/clean-url-slug-generator",
  category: "SEO Tools",
  description:
    "Generate clean, SEO-friendly URL slugs from titles, page names, product names, or article headings.",
  metaTitle: "Clean URL Slug Generator | SEO Friendly Slug Maker",
  metaDescription:
    "Create clean URL slugs online for free. Convert titles into lowercase, hyphen-separated, user-friendly slugs instantly.",
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
    label: "Standard",
    description: "Best default for most URLs.",
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
    label: "Short SEO",
    description: "Removes common words and keeps it shorter.",
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
    label: "Unicode",
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
    label: "Product",
    description: "Keeps model numbers, sizes, and product names clear.",
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [urlPreviewOpen, setUrlPreviewOpen] = useState(false);
  const [variantsOpen, setVariantsOpen] = useState(false);
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
  }, [
    inputText,
    separator,
    lowercase,
    removeStopWords,
    removeNumbers,
    keepUnicode,
    maxLength,
  ]);

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

    return {
      words,
      characters,
      hasUppercase,
      hasSpecialChars,
      isGoodLength: characters > 0 && characters <= 80,
    };
  }, [slug, separator, keepUnicode]);

  const slugScore = useMemo(() => {
    if (!slug) return 0;

    let score = 0;

    if (!slugStats.hasUppercase) score += 25;
    if (!slug.includes("--") && !slug.includes("__")) score += 25;
    if (!slugStats.hasSpecialChars) score += 25;
    if (slugStats.isGoodLength) score += 25;

    return score;
  }, [slug, slugStats]);

  const slugStatus = slugScore >= 90 ? "Excellent" : slugScore >= 70 ? "Good" : slug ? "Needs review" : "Waiting";

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
        "Title to slug converter",
        "Hyphen and underscore options",
        "Stop word remover",
        "Unicode slug support",
        "Copy slug and full URL",
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
    clearFeedback();
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
    setSettingsOpen(false);
    setUrlPreviewOpen(false);
    setVariantsOpen(false);
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
    applyPreset(variant);
    setSuccess(`${variant.label} selected.`);
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
      setSuccess(`${targetLabel} copied.`);

      window.setTimeout(() => {
        setCopiedTarget("");
      }, 1500);
    } catch {
      setError("Copy failed. Please copy manually.");
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
      </Helmet>

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Link size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Clean URL Slug Generator</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Paste a title and instantly create a clean SEO-friendly URL slug.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_420px] gap-5">
          <div className="flex flex-col gap-5">
            <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-semibold">Title or Text</h2>
                </div>

                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  Auto converts while typing
                </span>
              </div>

              <textarea
                value={inputText}
                onChange={(event) => handleInputChange(event.target.value)}
                placeholder="Example: How to Convert JPG to PDF Online for Free"
                rows="6"
                className="w-full border border-[var(--border)] rounded-2xl px-4 py-4 bg-white outline-none focus:border-[var(--primary)] resize-none leading-7"
              />

              <div className="grid sm:grid-cols-3 gap-3 mt-4">
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

            <div className="border border-[var(--border)] rounded-2xl bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setSettingsOpen((current) => !current)}
                className="w-full p-5 flex items-center justify-between gap-3 text-left hover:bg-[#f8f4ff] transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f4edff] flex items-center justify-center shrink-0">
                    <Settings2 size={20} className="text-[var(--primary)]" />
                  </div>

                  <div>
                    <h3 className="font-semibold">Slug Options</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {separator === "-" ? "Hyphen" : "Underscore"} • Max {maxLength} chars
                    </p>
                  </div>
                </div>

                <ChevronDown
                  size={20}
                  className={`text-[var(--primary)] transition-transform ${
                    settingsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {settingsOpen && (
                <div className="border-t border-[var(--border)] bg-[#fafafa] p-5">
                  <div className="mb-5">
                    <p className="font-semibold mb-3">Quick presets</p>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {SLUG_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className="rounded-xl border border-[var(--border)] bg-white p-3 text-left hover:bg-[#f8f4ff] transition"
                        >
                          <div className="flex items-center gap-2">
                            <Wand2 size={16} className="text-[var(--primary)]" />
                            <span className="font-semibold text-sm">{preset.label}</span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {preset.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormControl label="Separator">
                      <select
                        value={separator}
                        onChange={(event) => setSeparator(event.target.value)}
                        className="tool-input"
                      >
                        <option value="-">Hyphen - recommended</option>
                        <option value="_">Underscore _</option>
                      </select>
                    </FormControl>

                    <FormControl label="Max Length">
                      <input
                        type="number"
                        min="20"
                        max="150"
                        value={maxLength}
                        onChange={(event) =>
                          setMaxLength(safeNumber(event.target.value, DEFAULT_MAX_LENGTH))
                        }
                        className="tool-input"
                      />
                    </FormControl>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mt-4">
                    <ToggleOption
                      checked={lowercase}
                      onChange={() => setLowercase((value) => !value)}
                      title="Lowercase"
                    />

                    <ToggleOption
                      checked={removeStopWords}
                      onChange={() => setRemoveStopWords((value) => !value)}
                      title="Remove stop words"
                    />

                    <ToggleOption
                      checked={removeNumbers}
                      onChange={() => setRemoveNumbers((value) => !value)}
                      title="Remove numbers"
                    />

                    <ToggleOption
                      checked={keepUnicode}
                      onChange={() => setKeepUnicode((value) => !value)}
                      title="Keep Unicode"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border border-[var(--border)] rounded-2xl bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setVariantsOpen((current) => !current)}
                className="w-full p-5 flex items-center justify-between gap-3 text-left hover:bg-[#f8f4ff] transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f4edff] flex items-center justify-center shrink-0">
                    <Wand2 size={20} className="text-[var(--primary)]" />
                  </div>

                  <div>
                    <h3 className="font-semibold">Slug Variants</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Optional quick alternatives
                    </p>
                  </div>
                </div>

                <ChevronDown
                  size={20}
                  className={`text-[var(--primary)] transition-transform ${
                    variantsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {variantsOpen && (
                <div className="border-t border-[var(--border)] bg-[#fafafa] p-5">
                  {variants.length ? (
                    <div className="space-y-3">
                      {variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="rounded-xl border border-[var(--border)] bg-white p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm">{variant.label}</p>
                              <p className="text-sm break-all text-[var(--text-secondary)] mt-1">
                                {variant.value}
                              </p>
                            </div>

                            <div className="flex gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => useVariant(variant)}
                                className="text-xs font-bold text-[var(--primary)] hover:underline"
                              >
                                Use
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopy(variant.value, variant.label)}
                                className="text-[var(--primary)] hover:opacity-75"
                                title={`Copy ${variant.label}`}
                              >
                                {copiedTarget === variant.label ? (
                                  <Check size={18} />
                                ) : (
                                  <Copy size={18} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-secondary)]">
                      Enter a title to see slug variants.
                    </p>
                  )}
                </div>
              )}
            </div>

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

          <div className="lg:sticky lg:top-4 h-fit flex flex-col gap-5">
            <div className="border border-[var(--border)] rounded-2xl p-5 bg-gray-50">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-semibold">Generated Slug</h2>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {slugStats.characters} characters • {slugStats.words} words
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    slugScore >= 90
                      ? "bg-green-50 text-green-700"
                      : slugScore >= 70
                        ? "bg-yellow-50 text-yellow-700"
                        : slug
                          ? "bg-red-50 text-red-700"
                          : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {slugStatus}
                </span>
              </div>

              <div className="bg-white border border-[var(--border)] rounded-2xl p-4 min-h-[98px] flex items-center">
                {slug ? (
                  <p className="text-lg font-semibold break-all text-[var(--primary)]">
                    {slug}
                  </p>
                ) : (
                  <p className="text-[var(--text-secondary)]">
                    Your slug will appear here.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleCopy(slug, "Slug")}
                disabled={!slug}
                className={`btn-primary w-full mt-4 inline-flex items-center justify-center gap-2 ${
                  !slug ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {copiedTarget === "Slug" ? <Check size={18} /> : <Copy size={18} />}
                {copiedTarget === "Slug" ? "Copied" : "Copy Slug"}
              </button>
            </div>

            <div className="border border-[var(--border)] rounded-2xl bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setUrlPreviewOpen((current) => !current)}
                className="w-full p-5 flex items-center justify-between gap-3 text-left hover:bg-[#f8f4ff] transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f4edff] flex items-center justify-center shrink-0">
                    <Globe size={20} className="text-[var(--primary)]" />
                  </div>

                  <div>
                    <h3 className="font-semibold">Full URL Preview</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Optional URL with your domain
                    </p>
                  </div>
                </div>

                <ChevronDown
                  size={20}
                  className={`text-[var(--primary)] transition-transform ${
                    urlPreviewOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {urlPreviewOpen && (
                <div className="border-t border-[var(--border)] bg-[#fafafa] p-5">
                  <FormControl label="Base URL">
                    <input
                      value={baseUrl}
                      onChange={(event) => setBaseUrl(event.target.value)}
                      placeholder="https://example.com/blog/"
                      className="tool-input"
                    />
                  </FormControl>

                  <div className="bg-white border border-[var(--border)] rounded-2xl p-4 mt-4">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">
                      Preview
                    </p>

                    {fullUrl ? (
                      <p className="text-sm break-all text-green-700 font-medium">
                        {fullUrl}
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)]">
                        Generate a slug to see full URL preview.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(fullUrl, "Full URL")}
                    disabled={!fullUrl}
                    className={`btn-secondary w-full mt-4 inline-flex items-center justify-center gap-2 ${
                      !fullUrl ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {copiedTarget === "Full URL" ? (
                      <Check size={18} />
                    ) : (
                      <Copy size={18} />
                    )}
                    {copiedTarget === "Full URL" ? "Copied" : "Copy Full URL"}
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="text-sm font-bold mb-2">Quick check</p>

              <div className="space-y-2 text-sm">
                <CheckLine good={Boolean(slug) && !slugStats.hasUppercase}>
                  Lowercase format
                </CheckLine>
                <CheckLine good={Boolean(slug) && !slugStats.hasSpecialChars}>
                  No unwanted characters
                </CheckLine>
                <CheckLine good={Boolean(slug) && slugStats.isGoodLength}>
                  Easy-to-read length
                </CheckLine>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="clean-url-slug-generator" />

      <style>{`
        .tool-input {
          width: 100%;
          height: 44px;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 0 0.9rem;
          background: white;
          outline: none;
          font-weight: 600;
        }
        .tool-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(155, 108, 227, 0.16);
        }
      `}</style>
    </div>
  );
}

function FormControl({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-2">{label}</span>
      {children}
    </label>
  );
}

function ToggleOption({ checked, onChange, title }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`rounded-xl border p-3 text-left transition ${
        checked
          ? "border-[var(--primary)] bg-[#f8f4ff] text-[var(--primary)]"
          : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            checked
              ? "bg-[var(--primary)] border-[var(--primary)] text-white"
              : "border-[var(--border)] text-transparent"
          }`}
        >
          <Check size={13} />
        </span>

        <span className="font-semibold text-sm">{title}</span>
      </div>
    </button>
  );
}

function CheckLine({ good, children }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle
        size={17}
        className={`shrink-0 mt-0.5 ${good ? "text-green-600" : "text-gray-300"}`}
      />
      <span className={good ? "text-green-700" : "text-[var(--text-secondary)]"}>
        {children}
      </span>
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
  const safeMaxLength = Math.min(
    Math.max(Number(maxLength) || DEFAULT_MAX_LENGTH, 20),
    150
  );

  if (Array.from(slug).length <= safeMaxLength) {
    return slug;
  }

  const parts = slug.split(separator).filter(Boolean);
  const selectedParts = [];
  let currentLength = 0;

  for (const part of parts) {
    const nextLength =
      currentLength + Array.from(part).length + (selectedParts.length ? 1 : 0);

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
