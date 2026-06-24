import { useEffect, useMemo, useRef, useState } from "react";
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
  Hash,
  Save,
  MessageCircle,
  ThumbsUp,
  Repeat2,
  Send,
  Image as ImageIcon,
  X,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "LinkedIn Text Formatter",
  path: "/linkedin-text-formatter",
  category: "Social Media Tools",
  description:
    "Format and optimize LinkedIn posts with bold, italic, underline, strikethrough, Unicode text styles, templates, hook score, post preview, and character counter.",
  metaTitle:
    "LinkedIn Text Formatter & Post Optimizer | Bold, Italic & Styled Text",
  metaDescription:
    "Format LinkedIn posts with bold, italic, underline, strikethrough, Unicode styles, templates, hook preview, hook score, optional image preview, and character counter.",
};

const LINKEDIN_POST_LIMIT = 3000;
const SEE_MORE_PREVIEW_LIMIT = 210;
const LOCAL_STORAGE_KEY = "nextOnlineToolsLinkedInFormatterDraft";

const SAMPLE_POST =
  "Big lesson from building online tools:\n\nSimple tools win when they solve one clear problem fast.\n\nMake it useful. Make it easy. Make it reliable.\n\nWhat is one small tool you use every week?";

const SITE_URL = "https://nextonlinetools.com";
const canonicalUrl = `${SITE_URL}${toolData.path.startsWith("/tool") ? toolData.path : `/tool${toolData.path}`}`;

const POST_MODES = [
  {
    id: "post",
    label: "LinkedIn Post",
    limit: LINKEDIN_POST_LIMIT,
    helper: "Best for normal feed posts, founder updates, tips, lessons, and storytelling.",
  },
  {
    id: "comment",
    label: "LinkedIn Comment",
    limit: 1250,
    helper: "Best for short opinions, thoughtful replies, and discussion comments.",
  },
  {
    id: "headline",
    label: "Profile Headline",
    limit: 220,
    helper: "Best for short professional positioning and profile headline ideas.",
  },
  {
    id: "about",
    label: "About Section Draft",
    limit: 2600,
    helper: "Best for longer profile summaries before you paste and refine on LinkedIn.",
  },
  {
    id: "message",
    label: "LinkedIn Message",
    limit: 1000,
    helper: "Best for clean outreach messages, follow-ups, and networking notes.",
  },
];

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
    description: "Add bullets to selected lines or the full post.",
  },
  {
    id: "cleanSpacing",
    label: "Clean Spacing",
    icon: Scissors,
    description: "Remove extra spaces and repeated blank lines.",
  },
  {
    id: "cleanHashtags",
    label: "Clean Hashtags",
    icon: Hash,
    description: "Fix multi-word hashtags into LinkedIn-friendly format.",
  },
  {
    id: "addCTA",
    label: "Add CTA",
    icon: MessageCircle,
    description: "Add a clean engagement question at the end.",
  },
  {
    id: "plainText",
    label: "Remove Styles",
    icon: RotateCcw,
    description: "Convert styled Unicode back to plain text where possible.",
  },
];

const BULLET_STYLES = [
  { id: "dot", label: "• Standard", symbol: "•" },
  { id: "arrow", label: "→ Arrow", symbol: "→" },
  { id: "check", label: "✓ Check", symbol: "✓" },
  { id: "star", label: "★ Star", symbol: "★" },
  { id: "fire", label: "🔥 Fire", symbol: "🔥" },
];

const CTA_OPTIONS = [
  "What would you add?",
  "Which point do you agree with most?",
  "Save this for later.",
  "What is your experience with this?",
  "Follow for more practical tips.",
];

const POST_TEMPLATES = [
  {
    id: "lesson",
    title: "Lesson Learned Post",
    description: "A simple reflective post with a strong lesson.",
    text:
      "I learned this the hard way:\n\n[Write your main lesson here]\n\nAt first, I thought:\n• [Old belief]\n• [Old mistake]\n\nBut now I understand:\n• [New lesson]\n• [Better approach]\n\nWhat I would do differently:\n1. [Point one]\n2. [Point two]\n3. [Point three]\n\nWhat is one lesson you learned recently?",
  },
  {
    id: "tips",
    title: "Tips/List Post",
    description: "Best for educational or practical LinkedIn content.",
    text:
      "[Number] simple ways to improve [topic]:\n\n1. [Tip one]\n2. [Tip two]\n3. [Tip three]\n4. [Tip four]\n5. [Tip five]\n\nThe key is not to do everything at once.\n\nStart with one small improvement and stay consistent.\n\nWhich one would you try first?",
  },
  {
    id: "story",
    title: "Personal Story Post",
    description: "Use a small story to create connection.",
    text:
      "A few months ago, I made a mistake.\n\n[Write the short story here]\n\nThe problem was not the mistake itself.\nThe real problem was what I ignored before it happened.\n\nHere is what it taught me:\n\n• [Lesson one]\n• [Lesson two]\n• [Lesson three]\n\nSometimes the best growth comes from the moments we did not plan.\n\nHave you ever experienced something similar?",
  },
  {
    id: "launch",
    title: "Product Launch Post",
    description: "Useful for launching a tool, feature, product, or service.",
    text:
      "We just launched something new.\n\n[Product/tool name] helps [target audience] to [main benefit].\n\nWhy we built it:\n• [Problem one]\n• [Problem two]\n• [Problem three]\n\nWhat it can do:\n✓ [Feature one]\n✓ [Feature two]\n✓ [Feature three]\n\nSimple goal: make [task] faster, easier, and more useful.\n\nTry it here: [link]\n\nWhat should we improve next?",
  },
  {
    id: "beforeAfter",
    title: "Before vs After Post",
    description: "Great for transformation, mistakes, and improvement stories.",
    text:
      "Before, I used to think:\n\n[Old way of thinking]\n\nAfter working on this, I realized:\n\n[New way of thinking]\n\nThe difference came from three small changes:\n\n1. [Change one]\n2. [Change two]\n3. [Change three]\n\nProgress usually starts when we stop overcomplicating the process.\n\nWhat changed your thinking recently?",
  },
  {
    id: "hiring",
    title: "Hiring Post",
    description: "A clear template for hiring or team expansion posts.",
    text:
      "We are hiring.\n\nRole: [Job title]\nLocation: [Location/Remote/Hybrid]\nType: [Full-time/Part-time/Contract]\n\nWhat we are looking for:\n• [Skill one]\n• [Skill two]\n• [Skill three]\n\nYou will work on:\n• [Responsibility one]\n• [Responsibility two]\n• [Responsibility three]\n\nInterested candidates can send their CV/portfolio to: [email/link]\n\nPlease share this with someone who may be a good fit.",
  },
];

export default function LinkedInTextFormatter() {
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);

  const [postText, setPostText] = useState("");
  const [textSelection, setTextSelection] = useState({ start: 0, end: 0 });
  const [selectedStyle, setSelectedStyle] = useState("bold");
  const [selectedMode, setSelectedMode] = useState("post");
  const [selectedBullet, setSelectedBullet] = useState("dot");
  const [previewImage, setPreviewImage] = useState("");
  const [copiedType, setCopiedType] = useState("");
  const [activeToolbarMenu, setActiveToolbarMenu] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const activeMode = useMemo(() => {
    return POST_MODES.find((mode) => mode.id === selectedMode) || POST_MODES[0];
  }, [selectedMode]);

  const activeBullet = useMemo(() => {
    return BULLET_STYLES.find((bullet) => bullet.id === selectedBullet) || BULLET_STYLES[0];
  }, [selectedBullet]);

  const characterCount = useMemo(() => {
    return Array.from(postText).length;
  }, [postText]);

  const remainingCharacters = activeMode.limit - characterCount;

  const limitPercent = Math.min(
    100,
    Math.round((characterCount / activeMode.limit) * 100)
  );


  const hookPreview = useMemo(() => {
    return Array.from(postText).slice(0, SEE_MORE_PREVIEW_LIMIT).join("");
  }, [postText]);

  const hashtags = useMemo(() => extractHashtags(postText), [postText]);
  const hookScore = useMemo(() => analyzeHook(postText), [postText]);
  const styleDensity = useMemo(() => calculateStyledDensity(postText), [postText]);

  const limitStatus = useMemo(() => {
    if (!characterCount) {
      return {
        label: "Waiting",
        status: "neutral",
        barClass: "bg-gray-300",
      };
    }

    if (characterCount > activeMode.limit) {
      return {
        label: "Too Long",
        status: "danger",
        barClass: "bg-red-500",
      };
    }

    if (characterCount >= activeMode.limit * 0.85) {
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
  }, [characterCount, activeMode.limit]);

  const seoJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "LinkedIn Text Formatter & Post Optimizer",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      "@id": canonicalUrl,
      url: canonicalUrl,
      description:
        "Format LinkedIn posts with bold, italic, underline, strikethrough, Unicode text styles, templates, hook score, post preview, and character counter.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "LinkedIn bold text generator",
        "LinkedIn italic text generator",
        "LinkedIn post templates",
        "LinkedIn hook score",
        "Optional image preview",
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
            text: "This tool uses a 3000-character limit for LinkedIn posts and includes a live counter to help users stay within the limit.",
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
        {
          "@type": "Question",
          name: "Can this tool improve my LinkedIn post?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The tool includes a hook score, templates, spacing cleaner, CTA helper, hashtag cleaner, optional image preview, and copy options.",
          },
        },
      ],
    };
  }, []);

  useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(LOCAL_STORAGE_KEY);

      if (savedDraft) {
        setPostText(savedDraft);
      }
    } catch {
      // Local storage may be blocked in private browser modes.
    }
  }, []);

  function clearFeedback() {
    setSuccess("");
    setError("");
    setCopiedType("");
  }

  function updateText(nextText, message = "") {
    setPostText(nextText);
    setSuccess(message);
    setError("");
    setCopiedType("");
  }

  function handleTextChange(value) {
    setPostText(value);
    clearFeedback();
  }

  function updateStoredSelection() {
    const textarea = textareaRef.current;

    if (!textarea) return;

    setTextSelection({
      start: textarea.selectionStart || 0,
      end: textarea.selectionEnd || 0,
    });
  }

  function getSelectionRange() {
    const textarea = textareaRef.current;

    if (!textarea) {
      return {
        start: 0,
        end: 0,
      };
    }

    const liveSelection = {
      start: textarea.selectionStart || 0,
      end: textarea.selectionEnd || 0,
    };

    if (liveSelection.start !== liveSelection.end) {
      return liveSelection;
    }

    if (
      document.activeElement !== textarea &&
      textSelection.start !== textSelection.end
    ) {
      return {
        start: Math.max(0, Math.min(textSelection.start, postText.length)),
        end: Math.max(0, Math.min(textSelection.end, postText.length)),
      };
    }

    return liveSelection;
  }

  function applyStyle(styleId = selectedStyle) {
    clearFeedback();

    if (!postText.trim()) {
      setError("Please type or paste your LinkedIn text first.");
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
    updateText(
      nextText,
      hasSelection
        ? `${getStyleLabel(styleId)} applied to selected text.`
        : `${getStyleLabel(styleId)} applied to the full text.`
    );

    window.setTimeout(() => {
      if (!textareaRef.current) return;

      textareaRef.current.focus();

      if (hasSelection) {
        textareaRef.current.setSelectionRange(start, start + styledText.length);
        setTextSelection({ start, end: start + styledText.length });
      }
    }, 0);
  }

  function handleQuickAction(actionId) {
    clearFeedback();

    if (!postText.trim()) {
      setError("Please type or paste your LinkedIn text first.");
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
      updateText(lines.join("\n"), "First line formatted in bold.");
      return;
    }

    if (actionId === "addBullets") {
      const { start, end } = getSelectionRange();
      const hasSelection = start !== end;

      const before = postText.slice(0, start);
      const selected = hasSelection ? postText.slice(start, end) : postText;
      const after = postText.slice(end);

      const bulleted = addBulletsToLines(selected, activeBullet.symbol);

      updateText(
        hasSelection ? `${before}${bulleted}${after}` : bulleted,
        hasSelection
          ? "Bullets added to selected lines."
          : "Bullets added to the full text."
      );
      return;
    }

    if (actionId === "cleanSpacing") {
      updateText(cleanPostSpacing(postText), "Extra spacing cleaned.");
      return;
    }

    if (actionId === "cleanHashtags") {
      updateText(cleanHashtags(postText), "Hashtags cleaned.");
      return;
    }

    if (actionId === "addCTA") {
      const nextText = addRandomCTA(postText);
      updateText(nextText, "A clean CTA was added to the end.");
      return;
    }

    if (actionId === "plainText") {
      updateText(convertStyledUnicodeToPlainText(postText), "Styled Unicode removed where possible.");
    }
  }

  async function handleCopyVariant(copyType) {
    clearFeedback();

    if (!postText.trim()) {
      setError("Please type or paste your LinkedIn text first.");
      return;
    }

    const textToCopy = getCopyText(copyType, postText);

    if (!textToCopy.trim()) {
      setError("Nothing found to copy for this option.");
      return;
    }

    try {
      await copyToClipboard(textToCopy);
      setCopiedType(copyType);
      setSuccess(getCopySuccessMessage(copyType));

      window.setTimeout(() => {
        setCopiedType("");
      }, 1500);
    } catch {
      setError("Copy failed. Please copy the text manually.");
    }
  }

  function handleSamplePost() {
    updateText(SAMPLE_POST, "Sample LinkedIn post added.");
  }

  function handleTemplate(templateText, templateTitle) {
    updateText(templateText, `${templateTitle} template added.`);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function handleSaveDraft() {
    clearFeedback();

    if (!postText.trim()) {
      setError("Please type or paste your LinkedIn text before saving a draft.");
      return;
    }

    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, postText);
      setSuccess("Draft saved in this browser.");
    } catch {
      setError("Draft could not be saved. Your browser may be blocking local storage.");
    }
  }

  function handleLoadDraft() {
    clearFeedback();

    try {
      const savedDraft = window.localStorage.getItem(LOCAL_STORAGE_KEY);

      if (!savedDraft) {
        setError("No saved draft found in this browser.");
        return;
      }

      setPostText(savedDraft);
      setSuccess("Saved draft loaded.");
    } catch {
      setError("Draft could not be loaded. Your browser may be blocking local storage.");
    }
  }

  function handleClearDraft() {
    clearFeedback();

    try {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      setSuccess("Saved browser draft cleared.");
    } catch {
      setError("Saved draft could not be cleared.");
    }
  }

  function handlePreviewImageChange(event) {
    clearFeedback();

    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setPreviewImage(String(reader.result || ""));
      setSuccess("Preview image added.");
    };

    reader.onerror = () => {
      setError("Image could not be loaded. Please try another image.");
    };

    reader.readAsDataURL(file);
  }

  function handleRemovePreviewImage() {
    setPreviewImage("");
    setSuccess("Preview image removed.");
    setError("");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }

  function handleClear() {
    setPostText("");
    setSuccess("");
    setError("");
    setCopiedType("");
  }

  function handleReset() {
    setPostText("");
    setSelectedStyle("bold");
    setSelectedMode("post");
    setSelectedBullet("dot");
    setPreviewImage("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    setSuccess("");
    setError("");
    setCopiedType("");
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

        <script type="application/ld+json">
          {JSON.stringify({
            ...seoJsonLd,
            url: canonicalUrl,
            "@id": canonicalUrl,
          })}
        </script>

        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Linkedin size={28} className="text-[var(--primary)]" />
        </div>

        <p className="text-xs uppercase tracking-[0.24em] text-[var(--primary)] font-bold mb-2">
          Formatter + Optimizer
        </p>

        <h1 className="text-3xl font-bold mb-3">
          LinkedIn Text Formatter & Post Optimizer
        </h1>

        <p className="text-[var(--text-secondary)] max-w-3xl">
          Format LinkedIn posts with bold, italic, underline, strikethrough,
          monospace, bullets, and copyable Unicode styles. Use templates, hook
          score, hashtag cleaner, optional image preview card, and copy
          options to prepare a stronger LinkedIn post faster.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        {/* PROFESSIONAL WORKSPACE BAR */}
        <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[#fbf9ff] px-5 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--primary)] font-bold">
                Corporate writing workspace
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Formatting controls are now placed directly above the textboard as icon-only actions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {POST_MODES.map((mode) => {
                const ModeIcon = getPostModeIcon(mode.id);

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setSelectedMode(mode.id);
                      setActiveToolbarMenu("");
                      clearFeedback();
                    }}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      selectedMode === mode.id
                        ? "border-[var(--primary)] bg-white text-[var(--primary)] shadow-sm"
                        : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    }`}
                    title={mode.helper}
                  >
                    <ModeIcon size={15} />
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* INPUT */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-semibold">LinkedIn Content</h2>
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[#f8f4ff] px-3 py-2 text-xs font-semibold text-[var(--primary)]">
                  {(() => {
                    const ModeIcon = getPostModeIcon(selectedMode);
                    return <ModeIcon size={15} />;
                  })()}
                  {activeMode.label}
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] mb-4">
                {activeMode.helper} Select text to format only that part.
              </p>

              <div className="relative mb-0">
                <div className="rounded-t-2xl border border-b-0 border-[var(--border)] bg-white px-3 py-2">
                  <div
                    onMouseDown={(event) => event.preventDefault()}
                    className="flex items-center gap-1 overflow-x-auto whitespace-nowrap"
                  >
                    <ToolbarIconButton
                      icon={Sparkles}
                      label="Templates"
                      active={activeToolbarMenu === "templates"}
                      onClick={() =>
                        setActiveToolbarMenu((current) =>
                          current === "templates" ? "" : "templates"
                        )
                      }
                    />

                    <ToolbarDivider />

                    {STYLE_OPTIONS.map((style) => {
                      const Icon = style.icon;

                      return (
                        <ToolbarIconButton
                          key={style.id}
                          icon={Icon}
                          label={style.label}
                          active={selectedStyle === style.id}
                          onClick={() => {
                            setActiveToolbarMenu("");
                            applyStyle(style.id);
                          }}
                        />
                      );
                    })}

                    <ToolbarDivider />

                    {BULLET_STYLES.map((bullet) => (
                      <button
                        key={bullet.id}
                        type="button"
                        onClick={() => {
                          setSelectedBullet(bullet.id);
                          setActiveToolbarMenu("");
                          clearFeedback();
                        }}
                        className={`h-9 w-9 shrink-0 rounded-xl border text-sm font-bold transition ${
                          selectedBullet === bullet.id
                            ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                            : "border-transparent bg-white text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[#f8f4ff] hover:text-[var(--primary)]"
                        }`}
                        title={bullet.label}
                        aria-label={`Use ${bullet.label} bullet style`}
                      >
                        {bullet.symbol}
                      </button>
                    ))}

                    <ToolbarIconButton
                      icon={List}
                      label="Add bullets"
                      onClick={() => {
                        setActiveToolbarMenu("");
                        handleQuickAction("addBullets");
                      }}
                    />

                    <ToolbarDivider />

                    <ToolbarIconButton
                      icon={Bold}
                      label="Bold first line"
                      onClick={() => {
                        setActiveToolbarMenu("");
                        handleQuickAction("boldFirstLine");
                      }}
                    />
                    <ToolbarIconButton
                      icon={Scissors}
                      label="Clean spacing"
                      onClick={() => {
                        setActiveToolbarMenu("");
                        handleQuickAction("cleanSpacing");
                      }}
                    />
                    <ToolbarIconButton
                      icon={Hash}
                      label="Clean hashtags"
                      onClick={() => {
                        setActiveToolbarMenu("");
                        handleQuickAction("cleanHashtags");
                      }}
                    />
                    <ToolbarIconButton
                      icon={MessageCircle}
                      label="Add CTA"
                      onClick={() => {
                        setActiveToolbarMenu("");
                        handleQuickAction("addCTA");
                      }}
                    />
                    <ToolbarIconButton
                      icon={RotateCcw}
                      label="Remove styles"
                      onClick={() => {
                        setActiveToolbarMenu("");
                        handleQuickAction("plainText");
                      }}
                    />

                    <ToolbarDivider />

                    <ToolbarIconButton
                      icon={Save}
                      label="Save draft"
                      onClick={() => {
                        setActiveToolbarMenu("");
                        handleSaveDraft();
                      }}
                    />
                    <ToolbarIconButton
                      icon={FileText}
                      label="Load draft"
                      onClick={() => {
                        setActiveToolbarMenu("");
                        handleLoadDraft();
                      }}
                    />
                    <ToolbarIconButton
                      icon={Copy}
                      label="Copy formatted"
                      disabled={!postText.trim()}
                      active={copiedType === "formatted"}
                      onClick={() => {
                        setActiveToolbarMenu("");
                        handleCopyVariant("formatted");
                      }}
                    />
                  </div>
                </div>

                {activeToolbarMenu === "templates" && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-2xl">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">LinkedIn post templates</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          Choose a professional structure and edit it inside the textboard.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveToolbarMenu("")}
                        className="h-8 w-8 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[#f8f4ff]"
                        aria-label="Close templates"
                      >
                        ×
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[360px] overflow-auto pr-1">
                      {POST_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => {
                            setActiveToolbarMenu("");
                            handleTemplate(template.text, template.title);
                          }}
                          className="rounded-xl border border-[var(--border)] bg-white p-3 text-left transition hover:border-[var(--primary)] hover:bg-[#f8f4ff]"
                        >
                          <p className="text-sm font-bold">{template.title}</p>
                          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                            {template.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <textarea
                ref={textareaRef}
                value={postText}
                onChange={(event) => handleTextChange(event.target.value)}
                placeholder="Type or paste your LinkedIn post here. Select a word, sentence, or heading, then click a formatting style..."
                rows="14"
                className="linkedin-unicode-text w-full border border-[var(--border)] rounded-b-2xl rounded-t-none px-4 py-4 bg-white outline-none focus:border-[var(--primary)] resize-none leading-7"
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
                  onClick={() => handleCopyVariant("formatted")}
                  disabled={!postText.trim()}
                  className={`btn-primary inline-flex items-center justify-center gap-2 ${
                    !postText.trim() ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {copiedType === "formatted" ? <Check size={18} /> : <Copy size={18} />}
                  {copiedType === "formatted" ? "Copied" : "Copy"}
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
                    <h2 className="text-xl font-semibold">LinkedIn Preview</h2>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    A LinkedIn-style feed preview before copying.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePreviewImageChange}
                    className="hidden"
                    aria-label="Add optional preview image"
                  />

                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[#f8f4ff] transition"
                  >
                    <ImageIcon size={15} />
                    {previewImage ? "Change Image" : "Add Image"}
                  </button>

                  {previewImage ? (
                    <button
                      type="button"
                      onClick={handleRemovePreviewImage}
                      className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-white p-2 text-[var(--text-secondary)] hover:text-red-600 transition"
                      aria-label="Remove preview image"
                    >
                      <X size={15} />
                    </button>
                  ) : null}

                  <StatusPill status={limitStatus.status} label={limitStatus.label} />
                </div>
              </div>

              <LinkedInPreviewCard
                postText={postText}
                hookPreview={hookPreview}
                characterCount={characterCount}
                previewImage={previewImage}
                copied={copiedType === "formatted"}
                disabled={!postText.trim()}
                onCopy={() => handleCopyVariant("formatted")}
              />
            </div>

            {/* OPTIMIZER */}
            <div className="grid sm:grid-cols-2 gap-4">
              <ScoreCard
                title="Hook Score"
                value={`${hookScore.score}/100`}
                status={hookScore.status}
                helper={hookScore.summary}
              />

              <ScoreCard
                title="Style Density"
                value={`${styleDensity}%`}
                status={styleDensity <= 25 ? "good" : styleDensity <= 40 ? "warning" : "danger"}
                helper={
                  styleDensity <= 25
                    ? "Good. Styled text is not overused."
                    : styleDensity <= 40
                      ? "Use styles carefully for better readability."
                      : "Too much styled text may reduce accessibility."
                }
              />
            </div>


            {/* CHARACTER LIMIT */}
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Character Counter</h3>
              </div>

              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                <span>
                  {characterCount} / {activeMode.limit} characters
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
                Active mode: {activeMode.label}. Keep your content focused and
                easy to scan.
              </p>
            </div>

            {/* COPY OPTIONS */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Copy size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Copy Options</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <CopyButton
                  label="Copy Formatted"
                  icon={Copy}
                  active={copiedType === "formatted"}
                  disabled={!postText.trim()}
                  onClick={() => handleCopyVariant("formatted")}
                />
                <CopyButton
                  label="Copy Plain Text"
                  icon={FileText}
                  active={copiedType === "plain"}
                  disabled={!postText.trim()}
                  onClick={() => handleCopyVariant("plain")}
                />
                <CopyButton
                  label="Copy Hook Only"
                  icon={Sparkles}
                  active={copiedType === "hook"}
                  disabled={!postText.trim()}
                  onClick={() => handleCopyVariant("hook")}
                />
                <CopyButton
                  label="Copy Hashtags"
                  icon={Hash}
                  active={copiedType === "hashtags"}
                  disabled={!postText.trim() || hashtags.length === 0}
                  onClick={() => handleCopyVariant("hashtags")}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO CONTENT */}
      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">
            Format and Optimize LinkedIn Posts Online
          </h2>
        </div>

        <div className="text-[var(--text-secondary)] leading-7 space-y-4">
          <p>
            This LinkedIn Text Formatter helps you create copyable styled text
            for LinkedIn posts, comments, headlines, messages, and profile
            sections. You can make selected words bold, italic, underlined,
            strikethrough, monospace, fullwidth, or small caps using Unicode
            text styles.
          </p>

          <p>
            The tool also works as a LinkedIn post optimizer. You can check your
            hook score, preview the first part of the post, clean spacing, add
            bullets, clean hashtags, use post templates, save a browser draft,
            and copy formatted or plain text.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <InfoCard
            title="LinkedIn Bold Text Generator"
            text="Use bold Unicode text for hooks, headings, and important points."
          />

          <InfoCard
            title="LinkedIn Hook Score"
            text="Check whether your opening line is short, clear, specific, and engaging."
          />

          <InfoCard
            title="LinkedIn Character Counter"
            text="Track your content length and avoid writing posts that are too long."
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
            answer="Yes. Select a word, sentence, or heading in the text box, then click a style button. If nothing is selected, the style applies to the full text."
          />

          <FaqItem
            question="What does the hook score mean?"
            answer="The hook score checks simple writing signals such as first-line length, clarity, curiosity, question use, and weak opening phrases. It is a practical guide, not a guaranteed performance score."
          />

          <FaqItem
            question="Is this tool safe to use?"
            answer="Yes. It runs in your browser, does not need a paid API, and does not upload your text to a server. Saved drafts are stored only in your browser."
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

      <style>{`
        .linkedin-unicode-text {
          font-family: "Segoe UI", "Segoe UI Symbol", "Noto Sans Math", "Noto Sans Symbols 2", "Arial Unicode MS", Arial, sans-serif;
        }
      `}</style>

      <SuggestedTools currentToolId="linkedin-text-formatter" />
    </div>
  );
}

function LinkedInPreviewCard({
  postText,
  hookPreview,
  characterCount,
  previewImage,
  copied,
  disabled,
  onCopy,
}) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-5 bg-gray-50 min-h-[420px]">
      <div className="bg-white border border-[var(--border)] rounded-2xl p-5 min-h-[360px]">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-[#f4edff] flex items-center justify-center shrink-0">
            <Linkedin size={22} className="text-[var(--primary)]" />
          </div>

          <div>
            <p className="font-semibold leading-tight">Your Name</p>
            <p className="text-xs text-[var(--text-secondary)]">
              Your headline or professional title
            </p>
            <p className="text-xs text-[var(--text-secondary)]">Now • 🌐</p>
          </div>
        </div>

        {postText ? (
          <div className="whitespace-pre-wrap leading-7 text-sm sm:text-base">
            {hookPreview}
            {characterCount > SEE_MORE_PREVIEW_LIMIT ? (
              <span className="text-[var(--primary)] font-semibold">
                {" "}
                ...see more
              </span>
            ) : null}
          </div>
        ) : previewImage ? null : (
          <div className="min-h-[220px] flex items-center justify-center text-center">
            <div>
              <Linkedin size={54} className="mx-auto mb-3 text-gray-300" />
              <p className="text-[var(--text-secondary)]">
                Your LinkedIn-style preview will appear here.
              </p>
            </div>
          </div>
        )}

        {previewImage ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-gray-50">
            <img
              src={previewImage}
              alt="Optional LinkedIn post preview"
              className="w-full max-h-[360px] object-cover"
            />
          </div>
        ) : null}

        <div className="border-t border-[var(--border)] mt-5 pt-4">
          <div className="grid grid-cols-4 gap-2 text-xs text-[var(--text-secondary)]">
            <PreviewAction icon={ThumbsUp} label="Like" />
            <PreviewAction icon={MessageCircle} label="Comment" />
            <PreviewAction icon={Repeat2} label="Repost" />
            <PreviewAction icon={Send} label="Send" />
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={onCopy}
              disabled={disabled}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:text-[var(--primary)] ${
                disabled ? "opacity-40 cursor-not-allowed" : ""
              }`}
              aria-label="Copy formatted LinkedIn text"
              title={copied ? "Copied" : "Copy formatted text"}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewAction({ icon: Icon, label }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <Icon size={15} />
      <span>{label}</span>
    </div>
  );
}


function ToolbarIconButton({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
        active
          ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
          : "border-transparent bg-white text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[#f8f4ff] hover:text-[var(--primary)]"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      title={label}
      aria-label={label}
    >
      <Icon size={17} />

      <span className="pointer-events-none absolute left-1/2 top-full z-40 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#111827] px-2 py-1 text-[11px] font-semibold text-white shadow-lg group-hover:block">
        {label}
      </span>
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 h-7 w-px shrink-0 bg-[var(--border)]" />;
}

function getPostModeIcon(modeId) {
  const icons = {
    post: Linkedin,
    comment: MessageCircle,
    headline: Type,
    about: FileText,
    message: Send,
  };

  return icons[modeId] || FileText;
}


function ScoreCard({ title, value, status, helper }) {
  const statusClass =
    status === "good"
      ? "text-green-700 bg-green-50 border-green-100"
      : status === "warning"
        ? "text-yellow-700 bg-yellow-50 border-yellow-100"
        : "text-red-700 bg-red-50 border-red-100";

  return (
    <div className={`border rounded-2xl p-5 ${statusClass}`}>
      <p className="text-sm font-semibold mb-1">{title}</p>
      <p className="text-3xl font-bold mb-2">{value}</p>
      <p className="text-xs leading-5">{helper}</p>
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


function CopyButton({ label, icon: Icon, active, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-secondary inline-flex items-center justify-center gap-2 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {active ? <Check size={18} /> : <Icon size={18} />}
      {active ? "Copied" : label}
    </button>
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

const LINKEDIN_STYLE_MAPS = {
  bold: createCharacterMap({
    upper: "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙",
    lower: "𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳",
    digits: "𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗",
  }),
  italic: createCharacterMap({
    upper: "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍",
    lower: "𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧",
    digits: "0123456789",
  }),
  boldItalic: createCharacterMap({
    upper: "𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁",
    lower: "𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛",
    digits: "0123456789",
  }),
  monospace: createCharacterMap({
    upper: "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉",
    lower: "𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣",
    digits: "𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿",
  }),
};

function transformText(text, styleId) {
  const cleanText = convertStyledUnicodeToPlainText(text);

  if (styleId === "underline") {
    return addCombiningMark(cleanText, "\u0332");
  }

  if (styleId === "strikethrough") {
    return addCombiningMark(cleanText, "\u0336");
  }

  if (styleId === "smallCaps") {
    return toSmallCaps(cleanText);
  }

  if (styleId === "fullwidth") {
    return toFullwidth(cleanText);
  }

  const map = LINKEDIN_STYLE_MAPS[styleId];

  if (!map) return cleanText;

  return Array.from(cleanText)
    .map((char) => map.get(char) || char)
    .join("");
}

function createCharacterMap({ upper, lower, digits }) {
  const map = new Map();

  Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ").forEach((char, index) => {
    map.set(char, Array.from(upper)[index] || char);
  });

  Array.from("abcdefghijklmnopqrstuvwxyz").forEach((char, index) => {
    map.set(char, Array.from(lower)[index] || char);
  });

  Array.from("0123456789").forEach((char, index) => {
    map.set(char, Array.from(digits)[index] || char);
  });

  return map;
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

function addBulletsToLines(text, bulletSymbol = "•") {
  return String(text || "")
    .split(/\r\n|\r|\n/)
    .map((line) => {
      if (!line.trim()) return line;
      if (/^\s*(?:[•\-–—*→✓★]|🔥)\s+/.test(line)) return line;
      return `${bulletSymbol} ${line.trim()}`;
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

function cleanHashtags(text) {
  return String(text || "")
    .replace(/#([\p{L}\p{N}]+)(?:\s+)([\p{L}\p{N}]+)/gu, (_, first, second) => {
      return `#${toPascalCase(`${first} ${second}`)}`;
    })
    .replace(/#([\p{L}\p{N}]+(?:[\s_-]+[\p{L}\p{N}]+)+)/gu, (_, tag) => {
      return `#${toPascalCase(tag)}`;
    });
}

function toPascalCase(text) {
  return String(text || "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function addRandomCTA(text) {
  const cleanText = String(text || "").trim();
  const hasQuestion = /\?\s*$/.test(cleanText);

  if (hasQuestion) return cleanText;

  const randomIndex = Math.floor(Math.random() * CTA_OPTIONS.length);
  return `${cleanText}\n\n${CTA_OPTIONS[randomIndex]}`;
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

  Object.values(LINKEDIN_STYLE_MAPS).forEach((styleMap) => {
    styleMap.forEach((styled, plain) => {
      reverseMap.set(styled, plain);
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

function extractHashtags(text) {
  const matches = String(text || "").match(/#[\p{L}\p{N}_]+/gu);
  return matches ? [...new Set(matches)] : [];
}

function getFirstMeaningfulLine(text) {
  return String(text || "")
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .find(Boolean) || "";
}

function analyzeHook(text) {
  const firstLine = getFirstMeaningfulLine(text);

  if (!firstLine) {
    return {
      score: 0,
      status: "danger",
      summary: "Add a strong first line to start your post.",
    };
  }

  let score = 30;
  const plainHook = convertStyledUnicodeToPlainText(firstLine).trim();
  const hookLength = Array.from(plainHook).length;
  const lowerHook = plainHook.toLowerCase();

  if (hookLength <= 120) score += 20;
  else if (hookLength <= 180) score += 10;

  if (/[?]/.test(plainHook)) score += 12;
  if (/\b(lesson|mistake|learned|why|how|truth|simple|hard way|changed|growth|problem|secret)\b/i.test(plainHook)) {
    score += 18;
  }
  if (/\b(you|your|we|i)\b/i.test(plainHook)) score += 8;
  if (/\d/.test(plainHook)) score += 7;

  if (/^(i am excited|i'm excited|happy to announce|proud to announce)/i.test(lowerHook)) {
    score -= 15;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    status: score >= 75 ? "good" : score >= 50 ? "warning" : "danger",
    summary:
      score >= 75
        ? "Strong opening. It is short, clear, and engaging."
        : score >= 50
          ? "Good start. Make it more specific or curiosity-driven."
          : "Weak opening. Try a shorter, clearer, more specific first line.",
  };
}


function calculateStyledDensity(text) {
  const chars = Array.from(String(text || "")).filter((char) => !/\s/.test(char));

  if (!chars.length) return 0;

  const styledCount = chars.filter((char) => {
    const plain = convertStyledUnicodeToPlainText(char);
    return plain !== char || /[\u0332\u0336]/.test(char);
  }).length;

  return Math.round((styledCount / chars.length) * 100);
}

function getLongestParagraphLength(text) {
  const paragraphs = String(text || "")
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean);

  if (!paragraphs.length) return 0;

  return Math.max(...paragraphs.map((paragraph) => Array.from(paragraph).length));
}

function getCopyText(copyType, postText) {
  if (copyType === "plain") {
    return convertStyledUnicodeToPlainText(postText);
  }

  if (copyType === "hook") {
    return getFirstMeaningfulLine(postText);
  }

  if (copyType === "hashtags") {
    return extractHashtags(postText).join(" ");
  }

  return postText;
}

function getCopySuccessMessage(copyType) {
  if (copyType === "plain") return "Plain text copied successfully.";
  if (copyType === "hook") return "Hook copied successfully.";
  if (copyType === "hashtags") return "Hashtags copied successfully.";
  return "Formatted LinkedIn text copied successfully.";
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
