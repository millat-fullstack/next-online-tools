import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  Copy,
  FileText,
  Gauge,
  Link2,
  ListChecks,
  Monitor,
  RotateCcw,
  Search,
  Smartphone,
  Type,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Meta Title & Description Preview",
  path: "/meta-title-description-preview",
  category: "SEO Tools",
  description:
    "Preview your meta title and description as a Google search result and check SEO length, keyword usage, and readability.",
  metaTitle: "Meta Title & Description Preview Online Free | SERP Preview Tool",
  metaDescription:
    "Preview your meta title and meta description online. Check Google snippet length, title and description limits, keyword usage, and copy SEO-friendly snippets.",
};

const DEFAULT_VALUES = {
  title: "Best Free PDF Tools for Students and Office Work",
  description:
    "Discover free PDF tools to merge, compress, convert, and organize PDF files online for school, office work, and everyday productivity.",
  url: "https://nextonlinetools.com/best-free-pdf-tools",
  keyword: "PDF tools",
  brandName: "NextOnlineTools",
  appendBrand: true,
};

const TITLE_LIMITS = { tooShort: 30, goodMax: 60, warningMax: 70, pixelMax: 580 };
const DESCRIPTION_LIMITS = { tooShort: 70, goodMin: 120, goodMax: 160, warningMax: 180, pixelMax: 920 };

export default function MetaTitleDescriptionPreview() {
  const [title, setTitle] = useState(DEFAULT_VALUES.title);
  const [description, setDescription] = useState(DEFAULT_VALUES.description);
  const [url, setUrl] = useState(DEFAULT_VALUES.url);
  const [keyword, setKeyword] = useState(DEFAULT_VALUES.keyword);
  const [brandName, setBrandName] = useState(DEFAULT_VALUES.brandName);
  const [appendBrand, setAppendBrand] = useState(DEFAULT_VALUES.appendBrand);
  const [previewMode, setPreviewMode] = useState("desktop");
  const [copied, setCopied] = useState("");

  const previewData = useMemo(() => {
    return buildPreviewData({ title, description, url, keyword, brandName, appendBrand });
  }, [title, description, url, keyword, brandName, appendBrand]);

  async function handleCopy(value, label) {
    if (!value) return;

    try {
      await copyToClipboard(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1400);
    } catch {
      setCopied("");
    }
  }

  function resetTool() {
    setTitle(DEFAULT_VALUES.title);
    setDescription(DEFAULT_VALUES.description);
    setUrl(DEFAULT_VALUES.url);
    setKeyword(DEFAULT_VALUES.keyword);
    setBrandName(DEFAULT_VALUES.brandName);
    setAppendBrand(DEFAULT_VALUES.appendBrand);
    setPreviewMode("desktop");
    setCopied("");
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Search size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Meta Title & Description Preview</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Preview your SEO title and meta description as a Google-style result,
          check length, keyword usage, and copy a clean snippet.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="grid xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] gap-5">
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-5">
                <Type size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-bold">Snippet Details</h2>
              </div>

              <div className="space-y-4">
                <TextInput label="Meta Title" value={title} onChange={setTitle} placeholder="Write your SEO title..." helper={`${title.length} characters`} />

                <TextAreaInput label="Meta Description" value={description} onChange={setDescription} placeholder="Write your meta description..." helper={`${description.length} characters`} />

                <TextInput label="Page URL or Slug" value={url} onChange={setUrl} placeholder="https://example.com/page-url or page-url" helper="Use a full URL or only a page slug" icon={<Link2 size={17} />} />

                <div className="grid sm:grid-cols-2 gap-4">
                  <TextInput label="Main Keyword" value={keyword} onChange={setKeyword} placeholder="Example: PDF tools" helper="Optional" />

                  <TextInput label="Brand Name" value={brandName} onChange={setBrandName} placeholder="Example: NextOnlineTools" helper="Optional" />
                </div>

                <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={appendBrand} onChange={(event) => setAppendBrand(event.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
                  <span className="text-sm font-semibold">Add brand name to title preview</span>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Copy size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-bold">Copy</h2>
                </div>

                <button type="button" onClick={resetTool} className="btn-secondary inline-flex items-center justify-center gap-2 text-sm">
                  <RotateCcw size={17} />
                  Reset
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <CopyButton label="Copy Title" copied={copied === "title"} onClick={() => handleCopy(previewData.title, "title")} />
                <CopyButton label="Copy Description" copied={copied === "description"} onClick={() => handleCopy(description, "description")} />
                <CopyButton label="Copy URL" copied={copied === "url"} onClick={() => handleCopy(previewData.fullUrl, "url")} />
                <CopyButton label="Copy Full Snippet" copied={copied === "snippet"} onClick={() => handleCopy(previewData.fullSnippet, "snippet")} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Gauge size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-bold">SEO Preview Score</h2>
                </div>

                <div className={`rounded-full px-4 py-2 text-sm font-black ${getScoreClass(previewData.score)}`}>
                  {previewData.score}/100
                </div>
              </div>

              <div className="h-3 w-full rounded-full bg-[#f1e9ff] overflow-hidden border border-[var(--border)]">
                <div className="h-full rounded-full bg-[var(--primary)] transition-all duration-300" style={{ width: `${previewData.score}%` }} />
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <LengthCard label="Title" count={previewData.titleLength} status={previewData.titleStatus} note={previewData.titleNote} pixelWidth={previewData.titlePixelWidth} pixelMax={TITLE_LIMITS.pixelMax} />
                <LengthCard label="Description" count={previewData.descriptionLength} status={previewData.descriptionStatus} note={previewData.descriptionNote} pixelWidth={previewData.descriptionPixelWidth} pixelMax={DESCRIPTION_LIMITS.pixelMax} />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
              <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Search size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-bold">Google-style Preview</h2>
                </div>

                <div className="inline-flex rounded-xl border border-[var(--border)] bg-[#fafafa] p-1">
                  <button type="button" onClick={() => setPreviewMode("desktop")} className={`h-9 px-3 rounded-lg text-sm font-bold inline-flex items-center gap-2 ${previewMode === "desktop" ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--text-secondary)]"}`}>
                    <Monitor size={16} />
                    Desktop
                  </button>

                  <button type="button" onClick={() => setPreviewMode("mobile")} className={`h-9 px-3 rounded-lg text-sm font-bold inline-flex items-center gap-2 ${previewMode === "mobile" ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--text-secondary)]"}`}>
                    <Smartphone size={16} />
                    Mobile
                  </button>
                </div>
              </div>

              <div className="bg-[#f8f4ff] p-4 sm:p-6">
                <SerpPreview data={previewData} mode={previewMode} />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-bold">SEO Checks</h2>
              </div>

              <div className="space-y-3">
                {previewData.checks.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </div>

              <p className="text-xs text-[var(--text-secondary)] mt-4">
                Preview is an estimate. Google may rewrite titles and descriptions depending on the search query.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="meta-title-description-preview" />
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, helper, icon = null }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3 mb-2">
        <span className="text-sm font-semibold inline-flex items-center gap-2">
          {icon}
          {label}
        </span>
        {helper && <span className="text-xs text-[var(--text-secondary)]">{helper}</span>}
      </span>

      <input type="text" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full h-12 rounded-xl border border-[var(--border)] bg-white px-4 outline-none focus:border-[var(--primary)]" />
    </label>
  );
}

function TextAreaInput({ label, value, onChange, placeholder, helper }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3 mb-2">
        <span className="text-sm font-semibold inline-flex items-center gap-2">
          <FileText size={17} />
          {label}
        </span>
        {helper && <span className="text-xs text-[var(--text-secondary)]">{helper}</span>}
      </span>

      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={5} className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 outline-none resize-none focus:border-[var(--primary)]" />
    </label>
  );
}

function CopyButton({ label, copied, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`h-11 rounded-xl border px-4 text-sm font-bold inline-flex items-center justify-center gap-2 transition ${copied ? "border-green-200 bg-green-50 text-green-700" : "border-[var(--border)] bg-white hover:bg-[#f8f4ff] hover:text-[var(--primary)]"}`}>
      {copied ? <Check size={17} /> : <Copy size={17} />}
      {copied ? "Copied" : label}
    </button>
  );
}

function LengthCard({ label, count, status, note, pixelWidth, pixelMax }) {
  const percent = Math.min(100, Math.round((pixelWidth / Math.max(1, pixelMax)) * 100));

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[#fafafa] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${getStatusBadgeClass(status)}`}>
          {status}
        </span>
      </div>

      <p className="text-3xl font-black text-[var(--primary)] mt-2">{count}</p>
      <p className="text-xs text-[var(--text-secondary)] mt-1">{note}</p>

      <div className="mt-3 h-2 rounded-full bg-white border border-[var(--border)] overflow-hidden">
        <div className={`h-full rounded-full ${status === "Good" ? "bg-green-500" : status === "Warning" ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${percent}%` }} />
      </div>

      <p className="text-[11px] text-[var(--text-secondary)] mt-2">
        Approx. width: {Math.round(pixelWidth)}px
      </p>
    </div>
  );
}

function SerpPreview({ data, mode }) {
  const isMobile = mode === "mobile";

  return (
    <div className={`mx-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm ${isMobile ? "max-w-[390px] p-4" : "max-w-3xl p-6"}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#f4edff] flex items-center justify-center shrink-0">
          <Search size={16} className="text-[var(--primary)]" />
        </div>

        <div className="min-w-0">
          <p className="text-sm text-[#202124] leading-5 truncate">{data.siteName}</p>
          <p className="text-xs text-[#4d5156] truncate">{data.breadcrumbUrl}</p>
        </div>
      </div>

      <h3 className={`mt-3 text-[#1a0dab] font-normal leading-snug ${isMobile ? "text-[18px] line-clamp-2" : "text-[20px] line-clamp-1"}`}>
        {data.displayTitle}
      </h3>

      <p className={`mt-1 text-[#4d5156] leading-[1.45] ${isMobile ? "text-[14px] line-clamp-3" : "text-[14px] line-clamp-2"}`}>
        {data.displayDescription}
      </p>
    </div>
  );
}

function CheckRow({ check }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[#fafafa] p-3">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${check.status === "good" ? "bg-green-50 text-green-700" : check.status === "warning" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
        {check.status === "good" ? <BadgeCheck size={17} /> : <ListChecks size={17} />}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold">{check.label}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">{check.message}</p>
      </div>
    </div>
  );
}

function buildPreviewData({ title, description, url, keyword, brandName, appendBrand }) {
  const cleanTitle = cleanSpaces(title);
  const cleanDescription = cleanSpaces(description);
  const cleanBrand = cleanSpaces(brandName);
  const cleanKeyword = cleanSpaces(keyword);

  const titleWithBrand = appendBrand && cleanBrand && !includesText(cleanTitle, cleanBrand)
    ? `${cleanTitle}${cleanTitle ? " | " : ""}${cleanBrand}`
    : cleanTitle;

  const parsedUrl = parsePreviewUrl(url);
  const titleLength = titleWithBrand.length;
  const descriptionLength = cleanDescription.length;

  const titlePixelWidth = measureTextWidth(titleWithBrand, "20px Arial", 9.4);
  const descriptionPixelWidth = measureTextWidth(cleanDescription, "14px Arial", 6.7);

  const titleStatusData = getTitleStatus(titleLength, titlePixelWidth);
  const descriptionStatusData = getDescriptionStatus(descriptionLength, descriptionPixelWidth);

  const checks = buildSeoChecks({
    title: titleWithBrand,
    description: cleanDescription,
    urlData: parsedUrl,
    keyword: cleanKeyword,
    titleStatus: titleStatusData.status,
    descriptionStatus: descriptionStatusData.status,
  });

  const score = calculateScore(checks);
  const displayTitle = titleWithBrand || "Your meta title will appear here";
  const displayDescription = cleanDescription || "Your meta description preview will appear here after you write it.";

  return {
    title: titleWithBrand,
    displayTitle,
    description: cleanDescription,
    displayDescription,
    fullUrl: parsedUrl.fullUrl,
    siteName: parsedUrl.siteName,
    breadcrumbUrl: parsedUrl.breadcrumbUrl,
    titleLength,
    descriptionLength,
    titlePixelWidth,
    descriptionPixelWidth,
    titleStatus: titleStatusData.status,
    titleNote: titleStatusData.note,
    descriptionStatus: descriptionStatusData.status,
    descriptionNote: descriptionStatusData.note,
    checks,
    score,
    fullSnippet: `${displayTitle}\n${parsedUrl.breadcrumbUrl}\n${displayDescription}`,
  };
}

function getTitleStatus(length, pixelWidth) {
  if (!length) return { status: "Missing", note: "Add a meta title." };
  if (length < TITLE_LIMITS.tooShort) return { status: "Too short", note: "Aim for 30 to 60 characters." };
  if (length <= TITLE_LIMITS.goodMax && pixelWidth <= TITLE_LIMITS.pixelMax) return { status: "Good", note: "Good title length." };
  if (length <= TITLE_LIMITS.warningMax || pixelWidth <= TITLE_LIMITS.pixelMax * 1.15) return { status: "Warning", note: "May be truncated in search results." };
  return { status: "Too long", note: "Shorten the title for cleaner display." };
}

function getDescriptionStatus(length, pixelWidth) {
  if (!length) return { status: "Missing", note: "Add a meta description." };
  if (length < DESCRIPTION_LIMITS.tooShort) return { status: "Too short", note: "Add more value and context." };
  if (length >= DESCRIPTION_LIMITS.goodMin && length <= DESCRIPTION_LIMITS.goodMax && pixelWidth <= DESCRIPTION_LIMITS.pixelMax) return { status: "Good", note: "Good description length." };
  if (length <= DESCRIPTION_LIMITS.warningMax || pixelWidth <= DESCRIPTION_LIMITS.pixelMax * 1.15) return { status: "Warning", note: "May be shortened by Google." };
  return { status: "Too long", note: "Reduce length for a cleaner snippet." };
}

function buildSeoChecks({ title, description, urlData, keyword, titleStatus, descriptionStatus }) {
  const checks = [];

  checks.push({
    id: "title-length",
    label: "Title length",
    status: titleStatus === "Good" ? "good" : titleStatus === "Warning" ? "warning" : "bad",
    message: titleStatus === "Good" ? "Your title length is in a good range." : "Adjust the title length for better preview.",
  });

  checks.push({
    id: "description-length",
    label: "Description length",
    status: descriptionStatus === "Good" ? "good" : descriptionStatus === "Warning" ? "warning" : "bad",
    message: descriptionStatus === "Good" ? "Your description length is in a good range." : "Improve the description length for better preview.",
  });

  if (keyword) {
    checks.push({
      id: "keyword-title",
      label: "Keyword in title",
      status: includesText(title, keyword) ? "good" : "warning",
      message: includesText(title, keyword) ? "Main keyword is included in the title." : "Consider adding the main keyword to the title.",
    });

    checks.push({
      id: "keyword-description",
      label: "Keyword in description",
      status: includesText(description, keyword) ? "good" : "warning",
      message: includesText(description, keyword) ? "Main keyword is included in the description." : "Consider adding the main keyword to the description.",
    });
  }

  checks.push({
    id: "readable-url",
    label: "Readable URL",
    status: urlData.isReadable ? "good" : "warning",
    message: urlData.isReadable ? "The URL looks clean and readable." : "Use a short, readable slug with hyphens.",
  });

  checks.push({
    id: "no-all-caps",
    label: "Natural capitalization",
    status: hasTooMuchUppercase(title) ? "warning" : "good",
    message: hasTooMuchUppercase(title) ? "Avoid writing the full title in uppercase." : "Capitalization looks natural.",
  });

  checks.push({
    id: "unique-text",
    label: "Title and description are different",
    status: cleanSpaces(title).toLowerCase() !== cleanSpaces(description).toLowerCase() ? "good" : "bad",
    message: "Use a unique title and description for a stronger snippet.",
  });

  return checks;
}

function calculateScore(checks) {
  if (!checks.length) return 0;
  const points = checks.reduce((sum, check) => {
    if (check.status === "good") return sum + 1;
    if (check.status === "warning") return sum + 0.5;
    return sum;
  }, 0);

  return Math.round((points / checks.length) * 100);
}

function parsePreviewUrl(value) {
  const raw = cleanSpaces(value);
  const fallback = {
    fullUrl: "https://example.com/your-page-url",
    siteName: "example.com",
    breadcrumbUrl: "example.com › your page url",
    isReadable: true,
  };

  if (!raw) return fallback;

  const hasProtocol = /^https?:\/\//i.test(raw);
  const isLikelyDomain = /[a-z0-9-]+\.[a-z]{2,}/i.test(raw.split("/")[0]);
  const fullUrl = hasProtocol ? raw : isLikelyDomain ? `https://${raw}` : `https://example.com/${raw.replace(/^\/+/, "")}`;

  try {
    const parsed = new URL(fullUrl);
    const siteName = parsed.hostname.replace(/^www\./i, "");
    const pathParts = parsed.pathname
      .split("/")
      .filter(Boolean)
      .map((part) => decodeURIComponent(part).replace(/-/g, " "));

    const breadcrumb = pathParts.length ? `${siteName} › ${pathParts.slice(-2).join(" › ")}` : siteName;
    const slug = parsed.pathname.split("/").filter(Boolean).join("-");
    const isReadable = !parsed.pathname || (/^[a-z0-9/-]+$/i.test(parsed.pathname) && !parsed.pathname.includes("_") && slug.length <= 90);

    return { fullUrl, siteName, breadcrumbUrl: breadcrumb, isReadable };
  } catch {
    return { ...fallback, fullUrl: raw, breadcrumbUrl: raw, isReadable: false };
  }
}

function cleanSpaces(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function includesText(source, needle) {
  if (!needle) return false;
  return cleanSpaces(source).toLowerCase().includes(cleanSpaces(needle).toLowerCase());
}

function hasTooMuchUppercase(value) {
  const letters = cleanSpaces(value).replace(/[^a-z]/gi, "");
  if (letters.length < 8) return false;
  const uppercaseLetters = letters.replace(/[^A-Z]/g, "");
  return uppercaseLetters.length / letters.length > 0.72;
}

function measureTextWidth(value, font, fallbackAverage) {
  const text = String(value || "");
  if (typeof document === "undefined" || !text) return text.length * fallbackAverage;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return text.length * fallbackAverage;
  context.font = font;
  return context.measureText(text).width;
}

function getStatusBadgeClass(status) {
  if (status === "Good") return "bg-green-50 text-green-700 border border-green-100";
  if (status === "Warning") return "bg-yellow-50 text-yellow-700 border border-yellow-100";
  return "bg-red-50 text-red-700 border border-red-100";
}

function getScoreClass(score) {
  if (score >= 80) return "bg-green-50 text-green-700 border border-green-100";
  if (score >= 55) return "bg-yellow-50 text-yellow-700 border border-yellow-100";
  return "bg-red-50 text-red-700 border border-red-100";
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

  if (!successful) throw new Error("Copy failed.");
}
