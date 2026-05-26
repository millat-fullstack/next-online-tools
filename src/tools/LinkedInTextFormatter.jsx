import { useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Linkedin,
  Type,
  Copy,
  Check,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Trash2,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  AlignLeft,
  FileText,
  BarChart3,
  Eye,
  Wand2,
  List,
  Scissors,
  Info,
  BookOpen,
  ListChecks,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "LinkedIn Text Formatter",
  path: "/linkedin-text-formatter",
  category: "Social Media Tools",
  description:
    "Format LinkedIn posts with bold, italic, underline, strikethrough, monospace, bullets, and other copyable Unicode text styles.",
  metaTitle:
    "LinkedIn Text Formatter | Bold, Italic & Styled Text Generator",
  metaDescription:
    "Format LinkedIn posts with bold, italic, underline, strikethrough, monospace, bullets, and other Unicode text styles. Copy and paste styled text into LinkedIn posts, comments, and profiles.",
};

const LINKEDIN_POST_LIMIT = 3000;
const SEE_MORE_PREVIEW_LIMIT = 210;

const SAMPLE_POST =
  "Big lesson from building online tools:\n\nSimple tools win when they solve one clear problem fast.\n\nMake it useful. Make it easy. Make it reliable.\n\nWhat is one small tool you use every week?";

const SITE_URL = "https://nextonlinetools.com";
const canonicalUrl = `${SITE_URL}${toolData.path.startsWith("/tool") ? toolData.path : `/tool${toolData.path}`}`;

const STYLE_OPTIONS = [
  {
    id: "bold",
    label: "Bold",
    icon: Bold,
    example: "𝗕𝗼𝗹𝗱",
    description: "Best for hooks, headings, and key points.",
  },
  {
    id: "italic",
    label: "Italic",
    icon: Italic,
    example: "𝘐𝘵𝘢𝘭𝘪𝘤",
    description: "Best for soft emphasis and reflections.",
  },
  {
    id: "boldItalic",
    label: "Bold Italic",
    icon: Sparkles,
    example: "𝘽𝙤𝙡𝙙",
    description: "Best for strong emphasis.",
  },
  {
    id: "underline",
    label: "Underline",
    icon: Underline,
    example: "U̲n̲d̲e̲r̲l̲i̲n̲e̲",
    description: "Best for short highlighted words.",
  },
  {
    id: "strikethrough",
    label: "Strikethrough",
    icon: Strikethrough,
    example: "S̶t̶r̶i̶k̶e̶",
    description: "Best for before/after or contrast posts.",
  },
  {
    id: "monospace",
    label: "Monospace",
    icon: Code,
    example: "𝙼𝚘𝚗𝚘",
    description: "Best for technical or clean text.",
  },
  {
    id: "fullwidth",
    label: "Fullwidth",
    icon: AlignLeft,
    example: "Ｆｕｌｌ",
    description: "Best for short titles.",
  },
  {
    id: "smallCaps",
    label: "Small Caps",
    icon: Type,
    example: "Sᴍᴀʟʟ",
    description: "Best for compact headings.",
  },
];

const QUICK_ACTIONS = [
  {
    id: "boldFirstLine",
    label: "Bold First Line",
    icon: Bold,
    description: "Turn your first line into a stronger hook.",
  },
  {
    id: "addBullets",
    label: "Add Bullets",
    icon: List,
    description: "Add bullet points to selected lines.",
  },
  {
    id: "cleanSpacing",
    label: "Clean Spacing",
    icon: Scissors,
    description: "Remove extra spaces and repeated blank lines.",
  },
  {
    id: "plainText",
    label: "Remove Styles",
    icon: RotateCcw,
    description: "Convert styled Unicode back to plain text where possible.",
  },
];

export default function LinkedInTextFormatter() {
  const textareaRef = useRef(null);

  const [postText, setPostText] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("bold");
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const characterCount = useMemo(() => {
    return Array.from(postText).length;
  }, [postText]);

  const remainingCharacters = LINKEDIN_POST_LIMIT - characterCount;

  const limitPercent = Math.min(
    100,
    Math.round((characterCount / LINKEDIN_POST_LIMIT) * 100)
  );

  const lineCount = useMemo(() => {
    return postText ? postText.split(/\r\n|\r|\n/).length : 0;
  }, [postText]);

  const wordCount = useMemo(() => {
    const matches = postText.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu);
    return matches ? matches.length : 0;
  }, [postText]);

  const paragraphCount = useMemo(() => {
    const cleanText = postText.trim();

    if (!cleanText) return 0;

    return cleanText.split(/\n\s*\n/).filter(Boolean).length;
  }, [postText]);

  const hookPreview = useMemo(() => {
    return Array.from(postText).slice(0, SEE_MORE_PREVIEW_LIMIT).join("");
  }, [postText]);

  const limitStatus = useMemo(() => {
    if (!characterCount) {
      return {
        label: "Waiting",
        status: "neutral",
        barClass: "bg-gray-300",
      };
    }

    if (characterCount > LINKEDIN_POST_LIMIT) {
      return {
        label: "Too Long",
        status: "danger",
        barClass: "bg-red-500",
      };
    }

    if (characterCount >= 2500) {
      return {
        label: "Near Limit",
        status: "warning",
        barClass: "bg-yellow-500",
      };
    }

    return {
      label: "Good",
      status: "good",
      barClass: "bg-green-500",
    };
  }, [characterCount]);

  const seoJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "LinkedIn Text Formatter",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      "@id": canonicalUrl,
      url: canonicalUrl,
      description:
        "Format LinkedIn posts with bold, italic, underline, strikethrough, monospace, bullets, and copyable Unicode text styles.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "LinkedIn bold text generator",
        "LinkedIn italic text generator",
        "Underline and strikethrough text",
        "LinkedIn character counter",
        "Copy formatted LinkedIn post",
        "Unicode text formatter",
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
          name: "Can LinkedIn posts have bold or italic text?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "LinkedIn posts do not have a normal rich text editor for bold or italic formatting. This tool creates Unicode styled text that can be copied and pasted into LinkedIn posts, comments, and profiles.",
          },
        },
        {
          "@type": "Question",
          name: "What is the LinkedIn post character limit?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "LinkedIn posts have a 3000-character limit. This tool includes a live LinkedIn post character counter.",
          },
        },
        {
          "@type": "Question",
          name: "Is Unicode styled text accessible?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Unicode styled text can be harder for screen readers and some devices. Use it sparingly for hooks, headings, and short phrases rather than formatting an entire post.",
          },
        },
      ],
    };
  }, []);

  function clearFeedback() {
    setSuccess("");
    setError("");
    setCopied(false);
  }

  function handleTextChange(value) {
    setPostText(value);
    clearFeedback();
  }

  function getSelectionRange() {
    const textarea = textareaRef.current;

    if (!textarea) {
      return {
        start: 0,
        end: 0,
      };
    }

    return {
      start: textarea.selectionStart || 0,
      end: textarea.selectionEnd || 0,
    };
  }

  function applyStyle(styleId = selectedStyle) {
    clearFeedback();

    if (!postText.trim()) {
      setError("Please type or paste your LinkedIn post first.");
      return;
    }

    const { start, end } = getSelectionRange();
    const hasSelection = start !== end;

    const before = postText.slice(0, start);
    const selected = hasSelection ? postText.slice(start, end) : postText;
    const after = postText.slice(end);

    const styledText = transformText(selected, styleId);
    const nextText = hasSelection ? `${before}${styledText}${after}` : styledText;

    setSelectedStyle(styleId);
    setPostText(nextText);
    setSuccess(
      hasSelection
        ? `${getStyleLabel(styleId)} applied to selected text.`
        : `${getStyleLabel(styleId)} applied to the full post.`
    );

    window.setTimeout(() => {
      if (!textareaRef.current) return;

      textareaRef.current.focus();

      if (hasSelection) {
        textareaRef.current.setSelectionRange(start, start + styledText.length);
      }
    }, 0);
  }

  function handleQuickAction(actionId) {
    clearFeedback();

    if (!postText.trim()) {
      setError("Please type or paste your LinkedIn post first.");
      return;
    }

    if (actionId === "boldFirstLine") {
      const lines = postText.split(/\r\n|\r|\n/);
      const firstNonEmptyIndex = lines.findIndex((line) => line.trim());

      if (firstNonEmptyIndex === -1) {
        setError("No first line found.");
        return;
      }

      lines[firstNonEmptyIndex] = transformText(lines[firstNonEmptyIndex], "bold");

      setPostText(lines.join("\n"));
      setSuccess("First line formatted in bold.");
      return;
    }

    if (actionId === "addBullets") {
      const { start, end } = getSelectionRange();
      const hasSelection = start !== end;

      const before = postText.slice(0, start);
      const selected = hasSelection ? postText.slice(start, end) : postText;
      const after = postText.slice(end);

      const bulleted = addBulletsToLines(selected);

      setPostText(hasSelection ? `${before}${bulleted}${after}` : bulleted);
      setSuccess(
        hasSelection
          ? "Bullets added to selected lines."
          : "Bullets added to the full post."
      );
      return;
    }

    if (actionId === "cleanSpacing") {
      setPostText(cleanPostSpacing(postText));
      setSuccess("Extra spacing cleaned.");
      return;
    }

    if (actionId === "plainText") {
      setPostText(convertStyledUnicodeToPlainText(postText));
      setSuccess("Styled Unicode removed where possible.");
    }
  }

  async function handleCopyPost() {
    clearFeedback();

    if (!postText.trim()) {
      setError("Please type or paste your LinkedIn post first.");
      return;
    }

    try {
      await copyToClipboard(postText);

      setCopied(true);
      setSuccess("Formatted LinkedIn text copied successfully.");

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setError("Copy failed. Please copy the text manually.");
    }
  }

  function handleSamplePost() {
    setPostText(SAMPLE_POST);
    setSuccess("Sample LinkedIn post added.");
    setError("");
    setCopied(false);
  }

  function handleClear() {
    setPostText("");
    setSuccess("");
    setError("");
    setCopied(false);
  }

  function handleReset() {
    setPostText("");
    setSelectedStyle("bold");
    setSuccess("");
    setError("");
    setCopied(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <Helmet>
        <title>{toolData.metaTitle}</title>
        <meta name="description" content={toolData.metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={toolData.metaTitle} />
        <meta property="og:description" content={toolData.metaDescription} />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={toolData.metaTitle} />
        <meta name="twitter:description" content={toolData.metaDescription} />

        <script type="application/ld+json">
          {JSON.stringify({
            ...seoJsonLd,
            url: canonicalUrl,
            "@id": canonicalUrl,
          })}
        </script>

        <script type="application/ld+json">
          {JSON.stringify(faqJsonLd)}
        </script>
      </Helmet>

      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Linkedin size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">
          LinkedIn Text Formatter
        </h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Format your LinkedIn posts with bold, italic, underline,
          strikethrough, monospace, bullets, and other copyable Unicode text
          styles. Write your post, highlight any part, apply a style, and copy
          the formatted text for LinkedIn.
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
                  <h2 className="text-xl font-semibold">LinkedIn Post Text</h2>
                </div>

                <span className="text-xs text-[var(--text-secondary)]">
                  Select text to format only that part
                </span>
              </div>

              <textarea
                ref={textareaRef}
                value={postText}
                onChange={(event) => handleTextChange(event.target.value)}
                placeholder="Type or paste your LinkedIn post here. Select a word, sentence, or heading, then click a formatting style..."
                rows="14"
                className="w-full border border-[var(--border)] rounded-2xl px-4 py-4 bg-white outline-none focus:border-[var(--primary)] resize-none leading-7"
              />

              <div className="grid sm:grid-cols-4 gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleSamplePost}
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  Sample
                </button>

                <button
                  type="button"
                  onClick={handleCopyPost}
                  disabled={!postText.trim()}
                  className={`btn-primary inline-flex items-center justify-center gap-2 ${
                    !postText.trim() ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? "Copied" : "Copy"}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!postText}
                  className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                    !postText ? "opacity-50 cursor-not-allowed" : ""
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

            {/* STYLE BUTTONS */}
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Type size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Text Styles</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {STYLE_OPTIONS.map((style) => {
                  const Icon = style.icon;

                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => applyStyle(style.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selectedStyle === style.id
                          ? "border-[var(--primary)] bg-white text-[var(--primary)]"
                          : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Icon size={18} />
                          <span className="font-semibold">{style.label}</span>
                        </div>

                        <span className="text-sm">{style.example}</span>
                      </div>

                      <p className="text-xs text-[var(--text-secondary)]">
                        {style.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-[var(--text-secondary)] mt-4">
                Tip: Select a word or heading inside the post box, then click a
                style. If nothing is selected, the style applies to the full
                post.
              </p>
            </div>

            {/* QUICK ACTIONS */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wand2 size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Quick Post Formatting</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleQuickAction(action.id)}
                      className="rounded-2xl border border-[var(--border)] bg-white p-4 text-left hover:bg-[#f8f4ff] transition"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={18} className="text-[var(--primary)]" />
                        <span className="font-semibold text-sm">
                          {action.label}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--text-secondary)]">
                        {action.description}
                      </p>
                    </button>
                  );
                })}
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

            {/* ACCESSIBILITY NOTE */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-sm text-yellow-800">
                Use styled Unicode text sparingly. It can make hooks and short
                headings stand out, but formatting an entire post may reduce
                readability and accessibility for some users.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* PREVIEW */}
            <div>
              <div className="flex justify-between items-start gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Eye size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-semibold">Formatted Preview</h2>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Copy this formatted text and paste it into LinkedIn.
                  </p>
                </div>

                <StatusPill
                  status={limitStatus.status}
                  label={limitStatus.label}
                />
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-5 bg-gray-50 min-h-[420px]">
                {postText ? (
                  <div className="bg-white border border-[var(--border)] rounded-2xl p-5 whitespace-pre-wrap leading-7 min-h-[360px]">
                    {postText}
                  </div>
                ) : (
                  <div className="min-h-[360px] flex items-center justify-center text-center">
                    <div>
                      <Linkedin
                        size={54}
                        className="mx-auto mb-3 text-gray-300"
                      />
                      <p className="text-[var(--text-secondary)]">
                        Your formatted LinkedIn text will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CHARACTER LIMIT */}
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">LinkedIn Character Counter</h3>
              </div>

              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                <span>
                  {characterCount} / {LINKEDIN_POST_LIMIT} characters
                </span>
                <span>
                  {remainingCharacters >= 0
                    ? `${remainingCharacters} remaining`
                    : `${Math.abs(remainingCharacters)} over limit`}
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${limitStatus.barClass}`}
                  style={{ width: `${limitPercent}%` }}
                />
              </div>

              <p className="text-xs text-[var(--text-secondary)] mt-3">
                LinkedIn post limit: {LINKEDIN_POST_LIMIT} characters.
              </p>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Characters" value={characterCount} />
              <StatCard
                label="Remaining"
                value={remainingCharacters}
                green={remainingCharacters >= 0}
              />
              <StatCard label="Words" value={wordCount} />
              <StatCard label="Lines" value={lineCount} />
              <StatCard label="Paragraphs" value={paragraphCount} />
              <StatCard
                label="Preview Hook"
                value={`${Math.min(
                  characterCount,
                  SEE_MORE_PREVIEW_LIMIT
                )}/${SEE_MORE_PREVIEW_LIMIT}`}
                green
              />
            </div>

            {/* SEE MORE PREVIEW */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Linkedin size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">LinkedIn Feed Hook Preview</h3>
              </div>

              <div className="bg-white border border-[var(--border)] rounded-2xl p-4">
                {hookPreview ? (
                  <p className="whitespace-pre-wrap leading-7">
                    {hookPreview}
                    {characterCount > SEE_MORE_PREVIEW_LIMIT ? (
                      <span className="text-[var(--primary)] font-semibold">
                        {" "}
                        ...see more
                      </span>
                    ) : null}
                  </p>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">
                    The first part of your post will appear here.
                  </p>
                )}
              </div>

              <p className="text-xs text-[var(--text-secondary)] mt-3">
                Make the first 1–2 lines strong so people want to click “see
                more.”
              </p>
            </div>

            {/* COPY CTA */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Copy size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Ready to Use</h3>
              </div>

              <p className="text-sm text-[var(--text-secondary)] mb-4">
                After formatting your LinkedIn post, copy it and paste it into
                LinkedIn posts, comments, messages, or profile sections.
              </p>

              <button
                type="button"
                onClick={handleCopyPost}
                disabled={!postText.trim()}
                className={`btn-primary w-full inline-flex items-center justify-center gap-2 ${
                  !postText.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : "Copy Formatted Text"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SEO CONTENT */}
      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">
            Format LinkedIn Posts with Bold, Italic, and Styled Text
          </h2>
        </div>

        <div className="text-[var(--text-secondary)] leading-7 space-y-4">
          <p>
            This LinkedIn Text Formatter helps you create copyable styled text
            for LinkedIn posts, comments, headlines, and profile sections. You
            can make selected words bold, italic, underlined, strikethrough, or
            monospace using Unicode text styles.
          </p>

          <p>
            The tool is useful for writing stronger LinkedIn hooks, separating
            sections, highlighting important phrases, and making posts easier to
            scan. It also includes a LinkedIn character counter so you can check
            your post length before publishing.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <InfoCard
            title="Bold LinkedIn Text"
            text="Use bold Unicode text for hooks, headings, and important points."
          />

          <InfoCard
            title="LinkedIn Character Counter"
            text="Track your post length against LinkedIn’s 3,000-character limit."
          />

          <InfoCard
            title="Copy and Paste"
            text="Copy the formatted result and paste it directly into LinkedIn."
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <ListChecks size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">LinkedIn Text Formatter FAQ</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FaqItem
            question="Can I make text bold on LinkedIn?"
            answer="LinkedIn does not provide normal rich text formatting for regular posts, but you can copy and paste Unicode bold text created by this tool."
          />

          <FaqItem
            question="Can I format only part of my LinkedIn post?"
            answer="Yes. Select a word, sentence, or heading in the text box, then click a style button. If nothing is selected, the style applies to the full post."
          />

          <FaqItem
            question="Does styled text count toward LinkedIn’s character limit?"
            answer="Yes. Styled Unicode characters still count as characters, so this tool includes a live character counter."
          />

          <FaqItem
            question="Is this tool safe to use?"
            answer="Yes. It runs in your browser, does not need a paid API, and does not upload your text to a server."
          />

          <FaqItem
            question="Should I format my whole LinkedIn post?"
            answer="Usually no. For readability and accessibility, it is better to style only hooks, headings, and short key phrases."
          />

          <FaqItem
            question="Can I use this for LinkedIn comments and profiles?"
            answer="Yes. You can copy the styled Unicode text and try it in LinkedIn posts, comments, messages, headlines, and profile sections."
          />
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-blue-700 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              This tool creates Unicode styled text, not real HTML formatting.
              That is why it can be copied and pasted into platforms that do not
              normally support bold or italic post formatting.
            </p>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="linkedin-text-formatter" />
    </div>
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

function getStyleLabel(styleId) {
  const style = STYLE_OPTIONS.find((item) => item.id === styleId);
  return style?.label || "Style";
}

function transformText(text, styleId) {
  if (styleId === "underline") {
    return addCombiningMark(text, "\u0332");
  }

  if (styleId === "strikethrough") {
    return addCombiningMark(text, "\u0336");
  }

  if (styleId === "smallCaps") {
    return toSmallCaps(text);
  }

  if (styleId === "fullwidth") {
    return toFullwidth(text);
  }

  return Array.from(text)
    .map((char) => transformCharacter(char, styleId))
    .join("");
}

function transformCharacter(char, styleId) {
  const code = char.codePointAt(0);

  if (code >= 65 && code <= 90) {
    const index = code - 65;

    if (styleId === "bold") return fromCodePoint(0x1d400 + index);
    if (styleId === "italic") return fromCodePoint(0x1d434 + index);
    if (styleId === "boldItalic") return fromCodePoint(0x1d468 + index);
    if (styleId === "monospace") return fromCodePoint(0x1d670 + index);
  }

  if (code >= 97 && code <= 122) {
    const index = code - 97;

    if (styleId === "bold") return fromCodePoint(0x1d41a + index);
    if (styleId === "italic") return fromCodePoint(0x1d44e + index);
    if (styleId === "boldItalic") return fromCodePoint(0x1d482 + index);
    if (styleId === "monospace") return fromCodePoint(0x1d68a + index);
  }

  if (code >= 48 && code <= 57) {
    const index = code - 48;

    if (styleId === "bold") return fromCodePoint(0x1d7ce + index);
    if (styleId === "monospace") return fromCodePoint(0x1d7f6 + index);
  }

  return char;
}

function addCombiningMark(text, mark) {
  return Array.from(text)
    .map((char) => {
      if (/\s/.test(char)) return char;
      return `${char}${mark}`;
    })
    .join("");
}

function toFullwidth(text) {
  return Array.from(text)
    .map((char) => {
      const code = char.codePointAt(0);

      if (code === 32) return "\u3000";

      if (code >= 33 && code <= 126) {
        return fromCodePoint(code + 0xfee0);
      }

      return char;
    })
    .join("");
}

function toSmallCaps(text) {
  const smallCapsMap = {
    a: "ᴀ",
    b: "ʙ",
    c: "ᴄ",
    d: "ᴅ",
    e: "ᴇ",
    f: "ғ",
    g: "ɢ",
    h: "ʜ",
    i: "ɪ",
    j: "ᴊ",
    k: "ᴋ",
    l: "ʟ",
    m: "ᴍ",
    n: "ɴ",
    o: "ᴏ",
    p: "ᴘ",
    q: "ǫ",
    r: "ʀ",
    s: "s",
    t: "ᴛ",
    u: "ᴜ",
    v: "ᴠ",
    w: "ᴡ",
    x: "x",
    y: "ʏ",
    z: "ᴢ",
  };

  return Array.from(text)
    .map((char) => {
      const lower = char.toLowerCase();
      return smallCapsMap[lower] || char;
    })
    .join("");
}

function addBulletsToLines(text) {
  return String(text || "")
    .split(/\r\n|\r|\n/)
    .map((line) => {
      if (!line.trim()) return line;
      if (/^\s*[•\-–—*]\s+/.test(line)) return line;
      return `• ${line.trim()}`;
    })
    .join("\n");
}

function cleanPostSpacing(text) {
  return String(text || "")
    .replace(/[ \t]+$/gm, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function convertStyledUnicodeToPlainText(text) {
  let output = String(text || "");

  output = output.replace(/[\u0332\u0336]/g, "");

  const reverseMap = buildReverseMap();

  output = Array.from(output)
    .map((char) => reverseMap.get(char) || char)
    .join("");

  output = output.replace(/\u3000/g, " ");

  output = Array.from(output)
    .map((char) => {
      const code = char.codePointAt(0);

      if (code >= 0xff01 && code <= 0xff5e) {
        return fromCodePoint(code - 0xfee0);
      }

      return char;
    })
    .join("");

  const smallCapsReverse = {
    "ᴀ": "a",
    "ʙ": "b",
    "ᴄ": "c",
    "ᴅ": "d",
    "ᴇ": "e",
    "ғ": "f",
    "ɢ": "g",
    "ʜ": "h",
    "ɪ": "i",
    "ᴊ": "j",
    "ᴋ": "k",
    "ʟ": "l",
    "ᴍ": "m",
    "ɴ": "n",
    "ᴏ": "o",
    "ᴘ": "p",
    "ǫ": "q",
    "ʀ": "r",
    "ᴛ": "t",
    "ᴜ": "u",
    "ᴠ": "v",
    "ᴡ": "w",
    "ʏ": "y",
    "ᴢ": "z",
  };

  output = Array.from(output)
    .map((char) => smallCapsReverse[char] || char)
    .join("");

  return output;
}

function buildReverseMap() {
  const reverseMap = new Map();
  const styles = ["bold", "italic", "boldItalic", "monospace"];
  const plainChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  styles.forEach((styleId) => {
    Array.from(plainChars).forEach((char) => {
      const styled = transformCharacter(char, styleId);

      if (styled !== char) {
        reverseMap.set(styled, char);
      }
    });
  });

  return reverseMap;
}

function fromCodePoint(codePoint) {
  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return "";
  }
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