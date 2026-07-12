// src/tools/FacebookTextFormatter.jsx

import { useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Facebook,
  Type,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Bold,
  Italic,
  Sparkles,
  Eye,
  BarChart3,
  ShieldCheck,
  Wand2,
  FileText,
  Info,
  BookOpen,
  ListChecks,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Facebook Text Formatter",
  path: "/facebook-text-formatter",
  category: "Social Media Tools",
  description:
    "Create copyable bold, italic, and stylish Unicode text for Facebook posts, comments, bios, and captions with a live preview and character counter.",
  metaTitle:
    "Facebook Text Formatter | Bold, Italic & Stylish Unicode Fonts",
  metaDescription:
    "Format Facebook text with copyable Unicode bold, italic, bold italic, script, Fraktur, double-struck, monospace, fullwidth, circled, and small caps styles.",
};

const SITE_URL = "https://nextonlinetools.com";
const canonicalUrl = `${SITE_URL}/tool${toolData.path}`;
const PREVIEW_COLLAPSE_AT = 480;

const SAMPLE_TEXT =
  "Small improvements create big results.\n\nStay consistent, keep learning, and make every step count.\n\nWhat are you working on today?";

const PRIMARY_STYLES = [
  {
    id: "bold",
    label: "Bold",
    icon: Bold,
    example: "𝗕𝗼𝗹𝗱",
  },
  {
    id: "italic",
    label: "Italic",
    icon: Italic,
    example: "𝘐𝘵𝘢𝘭𝘪𝘤",
  },
  {
    id: "boldItalic",
    label: "Bold Italic",
    icon: Sparkles,
    example: "𝘽𝙤𝙡𝙙",
  },
];

const STYLISH_FONTS = [
  {
    id: "script",
    label: "Script",
    example: "𝒮𝒸𝓇𝒾𝓅𝓉",
    description: "Elegant handwritten style",
  },
  {
    id: "boldScript",
    label: "Bold Script",
    example: "𝓑𝓸𝓵𝓭",
    description: "Decorative bold lettering",
  },
  {
    id: "fraktur",
    label: "Fraktur",
    example: "𝔉𝔯𝔞𝔨𝔱𝔲𝔯",
    description: "Classic blackletter style",
  },
  {
    id: "doubleStruck",
    label: "Double Struck",
    example: "𝔻𝕠𝕦𝕓𝕝𝕖",
    description: "Outlined mathematical style",
  },
  {
    id: "monospace",
    label: "Monospace",
    example: "𝙼𝚘𝚗𝚘",
    description: "Clean technical lettering",
  },
  {
    id: "fullwidth",
    label: "Fullwidth",
    example: "Ｆｕｌｌ",
    description: "Wide attention-grabbing text",
  },
  {
    id: "circled",
    label: "Circled",
    example: "Ⓒⓘⓡⓒⓛⓔⓓ",
    description: "Letters inside circles",
  },
  {
    id: "smallCaps",
    label: "Small Caps",
    example: "Sᴍᴀʟʟ Cᴀᴘs",
    description: "Compact heading style",
  },
];

const ALL_STYLES = [...PRIMARY_STYLES, ...STYLISH_FONTS];

export default function FacebookTextFormatter() {
  const textareaRef = useRef(null);

  const [text, setText] = useState("");
  const [storedSelection, setStoredSelection] = useState({
    start: 0,
    end: 0,
  });
  const [activeStyle, setActiveStyle] = useState("");
  const [pendingStyle, setPendingStyle] = useState("");
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const characterCount = useMemo(() => Array.from(text).length, [text]);

  const wordCount = useMemo(() => {
    const clean = text.trim();
    return clean ? clean.split(/\s+/u).length : 0;
  }, [text]);

  const lineCount = useMemo(() => {
    return text ? text.split(/\r\n|\r|\n/).length : 0;
  }, [text]);

  const previewText = useMemo(() => {
    return Array.from(text).slice(0, PREVIEW_COLLAPSE_AT).join("");
  }, [text]);

  const isPreviewCollapsed = characterCount > PREVIEW_COLLAPSE_AT;

  const seoJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Facebook Text Formatter",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    url: canonicalUrl,
    description: toolData.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Facebook bold Unicode text",
      "Facebook italic Unicode text",
      "Stylish Unicode fonts",
      "Live Facebook post preview",
      "Character counter",
      "Copy formatted text",
      "Browser-only processing",
    ],
  };

  function clearFeedback() {
    setCopied(false);
    setSuccess("");
    setError("");
  }

  function updateSelection() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const nextSelection = {
      start: textarea.selectionStart || 0,
      end: textarea.selectionEnd || 0,
    };

    const selectedText = text.slice(nextSelection.start, nextSelection.end);
    const detectedStyle = selectedText
      ? detectStyleForText(selectedText)
      : detectStyleNearCursor(text, nextSelection.start);

    setStoredSelection(nextSelection);
    setActiveStyle(detectedStyle);

    if (nextSelection.start !== nextSelection.end) {
      setPendingStyle("");
    } else {
      setPendingStyle(detectedStyle);
    }
  }

  function getSelectionRange() {
    const textarea = textareaRef.current;

    if (!textarea) return storedSelection;

    const liveSelection = {
      start: textarea.selectionStart || 0,
      end: textarea.selectionEnd || 0,
    };

    if (liveSelection.start !== liveSelection.end) {
      return liveSelection;
    }

    if (
      document.activeElement !== textarea &&
      storedSelection.start !== storedSelection.end
    ) {
      return storedSelection;
    }

    return liveSelection;
  }

  function handleTextChange(nextValue) {
    const previousValue = text;

    if (pendingStyle) {
      const change = getTextChange(previousValue, nextValue);

      if (change.insertedText) {
        const styledInsertion = transformText(
          change.insertedText,
          pendingStyle
        );
        const finalText = `${nextValue.slice(
          0,
          change.start
        )}${styledInsertion}${nextValue.slice(change.nextEnd)}`;
        const nextCursor = change.start + styledInsertion.length;

        setText(finalText);
        setActiveStyle(pendingStyle);
        clearFeedback();

        window.setTimeout(() => {
          textareaRef.current?.focus();
          textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
          setStoredSelection({
            start: nextCursor,
            end: nextCursor,
          });
        }, 0);
        return;
      }
    }

    setText(nextValue);
    clearFeedback();
    window.setTimeout(updateSelection, 0);
  }

  function applyStyle(styleId) {
    clearFeedback();

    const { start, end } = getSelectionRange();
    const hasSelection = start !== end;

    if (!hasSelection) {
      if (!text.trim()) {
        const nextStyle = pendingStyle === styleId ? "" : styleId;
        setPendingStyle(nextStyle);
        setActiveStyle(nextStyle);
        setSuccess(
          nextStyle
            ? `${getStyleLabel(styleId)} is active. Start typing.`
            : `${getStyleLabel(styleId)} is off.`
        );
        window.setTimeout(() => textareaRef.current?.focus(), 0);
        return;
      }

      const plainText = convertStyledUnicodeToPlainText(text);
      const alreadyStyled = detectStyleForText(text) === styleId;
      const nextText = alreadyStyled
        ? plainText
        : transformText(plainText, styleId);

      setText(nextText);
      setPendingStyle("");
      setActiveStyle(alreadyStyled ? "" : styleId);
      setSuccess(
        alreadyStyled
          ? `${getStyleLabel(styleId)} removed from the full text.`
          : `${getStyleLabel(styleId)} applied to the full text.`
      );
      return;
    }

    const before = text.slice(0, start);
    const selected = text.slice(start, end);
    const after = text.slice(end);
    const alreadyStyled = detectStyleForText(selected) === styleId;
    const nextSelected = alreadyStyled
      ? convertStyledUnicodeToPlainText(selected)
      : transformText(selected, styleId);
    const nextText = `${before}${nextSelected}${after}`;
    const nextEnd = start + nextSelected.length;

    setText(nextText);
    setPendingStyle("");
    setActiveStyle(alreadyStyled ? "" : styleId);
    setSuccess(
      alreadyStyled
        ? `${getStyleLabel(styleId)} removed from the selection.`
        : `${getStyleLabel(styleId)} applied to the selection.`
    );

    window.setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start, nextEnd);
      setStoredSelection({ start, end: nextEnd });
    }, 0);
  }

  async function copyFormattedText() {
    clearFeedback();

    if (!text.trim()) {
      setError("Type or paste text before copying.");
      return;
    }

    try {
      await copyToClipboard(text);
      setCopied(true);
      setSuccess("Formatted Facebook text copied.");

      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Copy failed. Please select and copy the text manually.");
    }
  }

  function removeStyles() {
    if (!text) return;

    setText(convertStyledUnicodeToPlainText(text));
    setActiveStyle("");
    setPendingStyle("");
    setSuccess("Unicode styles removed.");
    setError("");
    setCopied(false);
  }

  function addSample() {
    setText(SAMPLE_TEXT);
    setActiveStyle("");
    setPendingStyle("");
    setSuccess("Sample Facebook post added.");
    setError("");
    setCopied(false);
  }

  function clearText() {
    setText("");
    setStoredSelection({ start: 0, end: 0 });
    setActiveStyle("");
    setPendingStyle("");
    setCopied(false);
    setSuccess("");
    setError("");
    textareaRef.current?.focus();
  }

  function resetTool() {
    clearText();
  }

  return (
    <div className="flex flex-col gap-8">
      <Helmet>
        <title>{toolData.metaTitle}</title>
        <meta name="description" content={toolData.metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={toolData.metaTitle} />
        <meta
          property="og:description"
          content={toolData.metaDescription}
        />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={toolData.metaTitle} />
        <meta
          name="twitter:description"
          content={toolData.metaDescription}
        />

        <script type="application/ld+json">
          {JSON.stringify(seoJsonLd)}
        </script>
      </Helmet>

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#eef4ff] flex items-center justify-center mb-4">
          <Facebook size={28} className="text-[#1877F2]" />
        </div>

        <p className="text-xs uppercase tracking-[0.24em] text-[var(--primary)] font-bold mb-2">
          Unicode Text Styling
        </p>

        <h1 className="text-3xl font-bold mb-3">
          Facebook Text Formatter
        </h1>

        <p className="text-[var(--text-secondary)] max-w-3xl">
          Create copyable bold, italic, bold italic, and stylish Unicode
          text for Facebook posts, comments, bios, captions, and group
          content. Select part of your text to style it, or style the full
          text instantly.
        </p>
      </section>

      <section className="card p-4 sm:p-6 lg:p-8">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] gap-6">
          <div className="min-w-0 flex flex-col gap-5">
            <div className="border border-[var(--border)] rounded-2xl overflow-visible bg-white">
              <div className="p-5 pb-4">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-semibold">
                    Facebook Text
                  </h2>
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Select words to format them. With no selection, a style
                  applies to the full text. On an empty editor, activate a
                  style and begin typing.
                </p>
              </div>

              <div
                className="border-y border-[var(--border)] bg-[#fafafa] px-3 py-2"
                onMouseDown={(event) => event.preventDefault()}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {PRIMARY_STYLES.map((style) => {
                    const Icon = style.icon;
                    const active =
                      activeStyle === style.id ||
                      pendingStyle === style.id;

                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => applyStyle(style.id)}
                        title={`${style.label} — ${style.example}`}
                        aria-label={style.label}
                        className={`h-10 min-w-10 rounded-xl border px-3 inline-flex items-center justify-center gap-2 transition ${
                          active
                            ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)] shadow-sm"
                            : "border-transparent bg-white text-[var(--text-secondary)] hover:border-[var(--border)] hover:text-[var(--primary)]"
                        }`}
                      >
                        <Icon size={18} />
                        <span className="hidden sm:inline text-xs font-bold">
                          {style.label}
                        </span>
                      </button>
                    );
                  })}

                  <span className="h-7 w-px bg-[var(--border)] mx-1" />

                  <button
                    type="button"
                    onClick={removeStyles}
                    disabled={!text}
                    title="Remove Unicode styles"
                    className="h-10 w-10 rounded-xl border border-transparent bg-white text-[var(--text-secondary)] hover:border-[var(--border)] hover:text-[var(--primary)] disabled:opacity-40 inline-flex items-center justify-center transition"
                  >
                    <RotateCcw size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={clearText}
                    disabled={!text}
                    title="Clear text"
                    className="h-10 w-10 rounded-xl border border-transparent bg-white text-[var(--text-secondary)] hover:border-red-200 hover:text-red-600 disabled:opacity-40 inline-flex items-center justify-center transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                value={text}
                onChange={(event) => handleTextChange(event.target.value)}
                onSelect={updateSelection}
                onClick={updateSelection}
                onKeyUp={updateSelection}
                onFocus={updateSelection}
                rows={12}
                placeholder="Type or paste your Facebook post here..."
                className="facebook-unicode-text block w-full min-h-[330px] resize-y border-0 bg-white px-5 py-5 text-base leading-7 outline-none rounded-b-2xl"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wand2 size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Stylish Fonts</h2>
              </div>

              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Click a font to style selected words or the complete text.
                Use decorative styles sparingly for easier reading.
              </p>

              <div
                className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3"
                onMouseDown={(event) => event.preventDefault()}
              >
                {STYLISH_FONTS.map((style) => {
                  const active =
                    activeStyle === style.id ||
                    pendingStyle === style.id;

                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => applyStyle(style.id)}
                      className={`min-w-0 rounded-2xl border p-4 text-left transition duration-200 ${
                        active
                          ? "border-[var(--primary)] bg-[#f4edff] shadow-sm -translate-y-0.5"
                          : "border-[var(--border)] bg-white hover:border-[var(--primary)] hover:bg-[#faf8ff] hover:-translate-y-0.5"
                      }`}
                    >
                      <span className="facebook-unicode-text block text-lg font-semibold truncate">
                        {style.example}
                      </span>
                      <span className="block mt-2 text-sm font-bold">
                        {style.label}
                      </span>
                      <span className="block mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                        {style.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyFormattedText}
                disabled={!text.trim()}
                className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : "Copy Formatted Text"}
              </button>

              <button
                type="button"
                onClick={addSample}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Add Sample
              </button>

              <button
                type="button"
                onClick={resetTool}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>

            {(success || error) && (
              <div
                className={`rounded-xl border p-4 text-sm ${
                  error
                    ? "border-red-100 bg-red-50 text-red-700"
                    : "border-green-100 bg-green-50 text-green-700"
                }`}
              >
                {error || success}
              </div>
            )}
          </div>

          <div className="min-w-0 flex flex-col gap-5">
            <div className="lg:sticky lg:top-5 flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Eye size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-semibold">Preview</h2>
                </div>

                <FacebookPreview
                  text={previewText}
                  hasText={Boolean(text)}
                  collapsed={isPreviewCollapsed}
                  onCopy={copyFormattedText}
                  copied={copied}
                />
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={20} className="text-[var(--primary)]" />
                  <h3 className="font-semibold">Character Count</h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <MetricCard
                    label="Characters"
                    value={characterCount}
                  />
                  <MetricCard label="Words" value={wordCount} />
                  <MetricCard label="Lines" value={lineCount} />
                </div>

                <p className="text-xs text-[var(--text-secondary)] mt-4 leading-5">
                  Counts update live and include spaces, emoji, and Unicode
                  styled characters.
                </p>
              </div>

              <div className="border border-green-200 bg-green-50 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={20}
                    className="shrink-0 mt-0.5 text-green-700"
                  />
                  <div>
                    <p className="text-sm font-bold text-green-900">
                      Private browser processing
                    </p>
                    <p className="text-xs leading-5 text-green-800 mt-1">
                      Your text is formatted inside your browser and does
                      not need to be uploaded to a server.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-blue-100 bg-blue-50 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Info
                    size={20}
                    className="shrink-0 mt-0.5 text-blue-700"
                  />
                  <p className="text-xs leading-5 text-blue-800">
                    These are Unicode characters, not real HTML fonts.
                    Appearance can vary slightly by device. Excessive
                    decorative text may be harder for screen readers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">
            Format Facebook Text Online
          </h2>
        </div>

        <div className="space-y-4 leading-7 text-[var(--text-secondary)]">
          <p>
            Facebook does not provide normal bold or italic controls for
            every post, comment, bio, or caption. This formatter converts
            ordinary letters into copyable Unicode characters that can be
            pasted into many Facebook text fields.
          </p>

          <p>
            For the best readability, use bold or italic for hooks,
            headings, names, and short phrases. Decorative styles work best
            for short titles rather than complete long posts.
          </p>
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <ListChecks size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">
            Facebook Text Formatter FAQ
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FaqItem
            question="Can I make Facebook text bold?"
            answer="Yes. Select text and apply the Unicode Bold style, then copy and paste the result into a Facebook post, comment, bio, group post, or caption."
          />
          <FaqItem
            question="Can I format only one word or sentence?"
            answer="Yes. Highlight only the text you want to change before choosing a style. With no selection, the style applies to the full text."
          />
          <FaqItem
            question="Are these real fonts?"
            answer="No. The formatter uses Unicode characters that resemble different font styles, so the text remains copyable without HTML or a font file."
          />
        </div>
      </section>

      <style>{`
        .facebook-unicode-text {
          font-family:
            "Segoe UI",
            "Segoe UI Symbol",
            "Noto Sans Math",
            "Noto Sans Symbols 2",
            "Arial Unicode MS",
            Arial,
            sans-serif;
        }
      `}</style>

      <SuggestedTools currentToolId="facebook-text-formatter" />
    </div>
  );
}

function FacebookPreview({ text, hasText, collapsed, onCopy, copied }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[#f0f2f5] p-3 sm:p-4">
      <div className="rounded-xl border border-[#d8dadf] bg-white shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#e7f3ff] flex items-center justify-center">
              <Facebook size={21} className="text-[#1877F2]" />
            </div>

            <div className="min-w-0">
              <p className="font-semibold leading-tight">Your Name</p>
              <p className="text-xs text-[#65676b] mt-1">
                Just now · Public
              </p>
            </div>
          </div>

          {hasText ? (
            <div className="facebook-unicode-text whitespace-pre-wrap break-words text-[15px] leading-6 mt-4 text-[#050505]">
              {renderTextWithClickableLinks(text)}
              {collapsed && (
                <span className="font-semibold text-[#65676b]">
                  {" "}
                  ... See more
                </span>
              )}
            </div>
          ) : (
            <div className="min-h-[250px] flex items-center justify-center text-center">
              <div>
                <Type size={52} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-[var(--text-secondary)]">
                  Your Facebook-style text preview will appear here.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#e4e6eb] px-4 py-2.5">
          <div className="grid grid-cols-3 text-xs font-semibold text-[#65676b]">
            <span className="text-center py-1">Like</span>
            <span className="text-center py-1">Comment</span>
            <span className="text-center py-1">Share</span>
          </div>
        </div>

        <div className="border-t border-[#e4e6eb] p-3">
          <button
            type="button"
            onClick={onCopy}
            disabled={!hasText}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy Formatted Text"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[#fafafa] p-3 text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[11px] text-[var(--text-secondary)] mt-1">
        {label}
      </p>
    </div>
  );
}

function FaqItem({ question, answer }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <h3 className="font-bold">{question}</h3>
      <p className="text-sm leading-6 text-[var(--text-secondary)] mt-2">
        {answer}
      </p>
    </div>
  );
}

function getStyleLabel(styleId) {
  return (
    ALL_STYLES.find((style) => style.id === styleId)?.label ||
    "Style"
  );
}

function getTextChange(previousValue, nextValue) {
  let start = 0;

  while (
    start < previousValue.length &&
    start < nextValue.length &&
    previousValue[start] === nextValue[start]
  ) {
    start += 1;
  }

  let previousEnd = previousValue.length;
  let nextEnd = nextValue.length;

  while (
    previousEnd > start &&
    nextEnd > start &&
    previousValue[previousEnd - 1] === nextValue[nextEnd - 1]
  ) {
    previousEnd -= 1;
    nextEnd -= 1;
  }

  return {
    start,
    previousEnd,
    nextEnd,
    insertedText: nextValue.slice(start, nextEnd),
  };
}

function transformText(value, styleId) {
  const plain = convertStyledUnicodeToPlainText(value);
  const transformer = STYLE_TRANSFORMS[styleId];
  return transformer ? transformer(plain) : plain;
}

function detectStyleNearCursor(value, cursor) {
  if (!value || cursor <= 0) return "";

  const before = value.slice(0, cursor);
  const character = Array.from(before).pop() || "";

  return detectStyleForText(character);
}

function detectStyleForText(value) {
  if (!value) return "";

  const plain = convertStyledUnicodeToPlainText(value);

  for (const style of ALL_STYLES) {
    const styled = transformTextWithoutPlainify(plain, style.id);

    if (styled === value && styled !== plain) {
      return style.id;
    }
  }

  return "";
}

function transformTextWithoutPlainify(value, styleId) {
  const transformer = STYLE_TRANSFORMS[styleId];
  return transformer ? transformer(value) : value;
}

const SCRIPT_UPPER =
  "𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵";
const SCRIPT_LOWER =
  "𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏";
const FRAKTUR_UPPER =
  "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ";
const FRAKTUR_LOWER =
  "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷";
const DOUBLE_UPPER =
  "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ";
const DOUBLE_LOWER =
  "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫";
const SMALL_CAPS =
  "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘQʀꜱᴛᴜᴠᴡxʏᴢ";

const STYLE_TRANSFORMS = {
  bold: (value) =>
    transformByRanges(value, 0x1d400, 0x1d41a, 0x1d7ce),
  italic: (value) =>
    transformByRanges(value, 0x1d434, 0x1d44e, null, {
      h: "ℎ",
    }),
  boldItalic: (value) =>
    transformByRanges(value, 0x1d468, 0x1d482, null),
  script: (value) =>
    transformWithAlphabet(value, SCRIPT_UPPER, SCRIPT_LOWER),
  boldScript: (value) =>
    transformByRanges(value, 0x1d4d0, 0x1d4ea, null),
  fraktur: (value) =>
    transformWithAlphabet(value, FRAKTUR_UPPER, FRAKTUR_LOWER),
  doubleStruck: (value) =>
    transformWithAlphabet(
      value,
      DOUBLE_UPPER,
      DOUBLE_LOWER,
      codePointString(0x1d7d8, 10)
    ),
  monospace: (value) =>
    transformByRanges(value, 0x1d670, 0x1d68a, 0x1d7f6),
  fullwidth: transformFullwidth,
  circled: transformCircled,
  smallCaps: transformSmallCaps,
};

const REVERSE_STYLE_MAP = buildReverseStyleMap();

function buildReverseStyleMap() {
  const reverse = new Map();
  const plainCharacters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (const styleId of Object.keys(STYLE_TRANSFORMS)) {
    for (const character of plainCharacters) {
      const styled = STYLE_TRANSFORMS[styleId](character);

      if (styled !== character && !reverse.has(styled)) {
        reverse.set(styled, character);
      }
    }
  }

  return reverse;
}

function convertStyledUnicodeToPlainText(value) {
  return Array.from(String(value || ""))
    .map((character) => REVERSE_STYLE_MAP.get(character) || character)
    .join("");
}

function transformByRanges(
  value,
  upperStart,
  lowerStart,
  digitStart = null,
  overrides = {}
) {
  return Array.from(String(value || ""))
    .map((character) => {
      if (overrides[character]) return overrides[character];

      const code = character.codePointAt(0);

      if (code >= 65 && code <= 90) {
        return String.fromCodePoint(upperStart + code - 65);
      }

      if (code >= 97 && code <= 122) {
        return String.fromCodePoint(lowerStart + code - 97);
      }

      if (digitStart !== null && code >= 48 && code <= 57) {
        return String.fromCodePoint(digitStart + code - 48);
      }

      return character;
    })
    .join("");
}

function transformWithAlphabet(
  value,
  upperAlphabet,
  lowerAlphabet,
  digitAlphabet = ""
) {
  const upper = Array.from(upperAlphabet);
  const lower = Array.from(lowerAlphabet);
  const digits = Array.from(digitAlphabet);

  return Array.from(String(value || ""))
    .map((character) => {
      const code = character.codePointAt(0);

      if (code >= 65 && code <= 90) {
        return upper[code - 65] || character;
      }

      if (code >= 97 && code <= 122) {
        return lower[code - 97] || character;
      }

      if (digits.length && code >= 48 && code <= 57) {
        return digits[code - 48] || character;
      }

      return character;
    })
    .join("");
}

function transformFullwidth(value) {
  return Array.from(String(value || ""))
    .map((character) => {
      const code = character.codePointAt(0);

      if (code === 32) return "　";

      if (code >= 33 && code <= 126) {
        return String.fromCodePoint(code + 0xfee0);
      }

      return character;
    })
    .join("");
}

function transformCircled(value) {
  const circledDigits = [
    "⓪",
    "①",
    "②",
    "③",
    "④",
    "⑤",
    "⑥",
    "⑦",
    "⑧",
    "⑨",
  ];

  return Array.from(String(value || ""))
    .map((character) => {
      const code = character.codePointAt(0);

      if (code >= 65 && code <= 90) {
        return String.fromCodePoint(0x24b6 + code - 65);
      }

      if (code >= 97 && code <= 122) {
        return String.fromCodePoint(0x24d0 + code - 97);
      }

      if (code >= 48 && code <= 57) {
        return circledDigits[code - 48];
      }

      return character;
    })
    .join("");
}

function transformSmallCaps(value) {
  const smallCaps = Array.from(SMALL_CAPS);

  return Array.from(String(value || ""))
    .map((character) => {
      const code = character.toLowerCase().codePointAt(0);

      if (code >= 97 && code <= 122) {
        return smallCaps[code - 97] || character;
      }

      return character;
    })
    .join("");
}

function codePointString(start, length) {
  return Array.from({ length }, (_, index) =>
    String.fromCodePoint(start + index)
  ).join("");
}

function renderTextWithClickableLinks(value) {
  const urlPattern =
    /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]\}])/giu;
  const pieces = String(value || "").split(urlPattern);

  return pieces.map((piece, index) => {
    if (!piece) return null;

    if (/^(?:https?:\/\/|www\.)/iu.test(piece)) {
      const href = piece.startsWith("www.")
        ? `https://${piece}`
        : piece;

      return (
        <a
          key={`${piece}-${index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1877F2] hover:underline"
        >
          {piece}
        </a>
      );
    }

    return <span key={`${index}-${piece.slice(0, 8)}`}>{piece}</span>;
  });
}

async function copyToClipboard(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const successful = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!successful) {
    throw new Error("Copy failed.");
  }
}
