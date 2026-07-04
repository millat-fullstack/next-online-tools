import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileText,
  Filter,
  Mail,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Email Extractor from Text",
  path: "/email-extractor-from-text",
  category: "Text Tools",
  description:
    "Paste messy text and extract clean email addresses instantly. Remove duplicates, copy results, and download emails as TXT or CSV.",
  metaTitle: "Email Extractor from Text Online Free | Extract Emails Instantly",
  metaDescription:
    "Extract email addresses from messy text online for free. Paste text, remove duplicate emails, copy results, and download extracted emails as TXT or CSV.",
};

const SAMPLE_TEXT = `Contact us at hello@example.com or sales@example.com.
CEO: john.doe@company.com
Support - support@brand.co.uk
Marketing: leads+uk@agency.io
Duplicate: HELLO@example.com
Obfuscated: partnership [at] nextonlinetools [dot] com
Invalid: test@@gmail..com`;

export default function EmailExtractorFromText() {
  const [inputText, setInputText] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [convertLowercase, setConvertLowercase] = useState(true);
  const [sortAlphabetically, setSortAlphabetically] = useState(true);
  const [includeObfuscated, setIncludeObfuscated] = useState(true);
  const [includeSourceLine, setIncludeSourceLine] = useState(false);
  const [includeDomains, setIncludeDomains] = useState("");
  const [excludeDomains, setExcludeDomains] = useState("");
  const [copied, setCopied] = useState("");

  const extraction = useMemo(() => {
    return extractEmailsFromText(inputText, {
      removeDuplicates,
      convertLowercase,
      sortAlphabetically,
      includeObfuscated,
      includeSourceLine,
      includeDomains,
      excludeDomains,
    });
  }, [
    inputText,
    removeDuplicates,
    convertLowercase,
    sortAlphabetically,
    includeObfuscated,
    includeSourceLine,
    includeDomains,
    excludeDomains,
  ]);

  const outputText = useMemo(() => {
    if (!extraction.emails.length) return "";

    if (includeSourceLine) {
      return extraction.emails
        .map((item) => `${item.email}${item.line ? `  |  line ${item.line}` : ""}`)
        .join("\n");
    }

    return extraction.emails.map((item) => item.email).join("\n");
  }, [extraction.emails, includeSourceLine]);

  const csvText = useMemo(() => {
    const rows = [["Email", "Domain", "Line"]];

    extraction.emails.forEach((item) => {
      rows.push([item.email, item.domain, item.line || ""]);
    });

    return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  }, [extraction.emails]);

  async function copyValue(value, label) {
    if (!value) return;

    try {
      await copyToClipboard(value);
      setCopied(label);

      window.setTimeout(() => {
        setCopied("");
      }, 1400);
    } catch {
      setCopied("");
    }
  }

  async function downloadTxt() {
    if (!outputText) return;
    await saveTextFile(outputText, "extracted-emails.txt", "text/plain;charset=utf-8");
  }

  async function downloadCsv() {
    if (!extraction.emails.length) return;
    await saveTextFile(csvText, "extracted-emails.csv", "text/csv;charset=utf-8");
  }

  function resetTool() {
    setInputText("");
    setSettingsOpen(false);
    setRemoveDuplicates(true);
    setConvertLowercase(true);
    setSortAlphabetically(true);
    setIncludeObfuscated(true);
    setIncludeSourceLine(false);
    setIncludeDomains("");
    setExcludeDomains("");
    setCopied("");
  }

  function loadSample() {
    setInputText(SAMPLE_TEXT);
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Mail size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Email Extractor from Text</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Paste messy text, website copy, lead notes, or CRM data and extract clean email addresses instantly.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="grid xl:grid-cols-[minmax(0,1fr)_430px] gap-5">
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-bold">Paste Text</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={loadSample}
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <Search size={17} />
                    Sample
                  </button>

                  <button
                    type="button"
                    onClick={resetTool}
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <RotateCcw size={17} />
                    Reset
                  </button>
                </div>
              </div>

              <textarea
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder="Paste messy text here. Example: Contact sales@example.com, support@brand.com..."
                rows={14}
                className="w-full rounded-2xl border border-[var(--border)] bg-[#fafafa] px-4 py-4 outline-none resize-y focus:border-[var(--primary)]"
              />

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-[var(--text-secondary)]">
                  {inputText.length} characters • {countLines(inputText)} line{countLines(inputText) === 1 ? "" : "s"}
                </p>

                <button
                  type="button"
                  onClick={() => setSettingsOpen((current) => !current)}
                  className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                >
                  <Settings2 size={17} />
                  Extraction Settings
                  <ChevronDown size={16} className={`transition ${settingsOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {settingsOpen && (
                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[#fafafa] p-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <ToggleOption
                      label="Remove duplicates"
                      checked={removeDuplicates}
                      onChange={setRemoveDuplicates}
                    />

                    <ToggleOption
                      label="Convert to lowercase"
                      checked={convertLowercase}
                      onChange={setConvertLowercase}
                    />

                    <ToggleOption
                      label="Sort alphabetically"
                      checked={sortAlphabetically}
                      onChange={setSortAlphabetically}
                    />

                    <ToggleOption
                      label="Detect [at] and [dot]"
                      checked={includeObfuscated}
                      onChange={setIncludeObfuscated}
                    />

                    <ToggleOption
                      label="Show source line"
                      checked={includeSourceLine}
                      onChange={setIncludeSourceLine}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <TextInput
                      label="Only include domains"
                      value={includeDomains}
                      onChange={setIncludeDomains}
                      placeholder="gmail.com, company.com"
                    />

                    <TextInput
                      label="Exclude domains"
                      value={excludeDomains}
                      onChange={setExcludeDomains}
                      placeholder="example.com, test.com"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-bold">Privacy Note</h2>
              </div>

              <p className="text-sm text-[var(--text-secondary)] leading-6">
                Your text is processed in your browser. This tool does not need login, API access, email verification, or server-side storage.
              </p>
            </div>
          </div>

          <div className="xl:sticky xl:top-4 h-fit flex flex-col gap-5">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Filter size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-bold">Extraction Summary</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Emails Found" value={extraction.stats.outputCount} highlighted />
                <StatCard label="Raw Matches" value={extraction.stats.rawCount} />
                <StatCard label="Duplicates" value={extraction.stats.duplicatesRemoved} />
                <StatCard label="Domains" value={extraction.stats.domainCount} />
              </div>

              {extraction.stats.filteredOut > 0 && (
                <div className="mt-3 rounded-xl border border-yellow-100 bg-yellow-50 p-3 text-sm text-yellow-800 flex items-start gap-2">
                  <AlertCircle size={17} className="shrink-0 mt-0.5" />
                  <p>{extraction.stats.filteredOut} email{extraction.stats.filteredOut === 1 ? "" : "s"} filtered by domain settings.</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
              <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Mail size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-bold">Extracted Emails</h2>
                </div>

                <button
                  type="button"
                  onClick={() => copyValue(outputText, "all")}
                  disabled={!outputText}
                  className="btn-primary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {copied === "all" ? <Check size={17} /> : <Copy size={17} />}
                  {copied === "all" ? "Copied" : "Copy All"}
                </button>
              </div>

              <div className="p-4">
                {extraction.emails.length ? (
                  <div className="max-h-[420px] overflow-auto rounded-2xl border border-[var(--border)] bg-[#fafafa] p-3">
                    <div className="space-y-2">
                      {extraction.emails.map((item, index) => (
                        <EmailRow
                          key={`${item.email}-${index}`}
                          item={item}
                          showLine={includeSourceLine}
                          onCopy={() => copyValue(item.email, item.email)}
                          copied={copied === item.email}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[260px] rounded-2xl border border-dashed border-[var(--border)] bg-[#fafafa] flex items-center justify-center text-center p-6">
                    <div>
                      <Mail size={42} className="mx-auto mb-3 text-[var(--primary)]" />
                      <p className="font-semibold">No emails extracted yet</p>
                      <p className="text-sm text-[var(--text-secondary)] mt-2">
                        Paste text on the left and extracted emails will appear here.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={downloadTxt}
                    disabled={!outputText}
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={17} />
                    Download TXT
                  </button>

                  <button
                    type="button"
                    onClick={downloadCsv}
                    disabled={!extraction.emails.length}
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={17} />
                    Download CSV
                  </button>
                </div>
              </div>
            </div>

            {extraction.domainGroups.length > 0 && (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <h2 className="text-xl font-bold mb-4">Domains Found</h2>

                <div className="space-y-2 max-h-[260px] overflow-auto">
                  {extraction.domainGroups.map((group) => (
                    <div
                      key={group.domain}
                      className="rounded-xl border border-[var(--border)] bg-[#fafafa] px-3 py-2 flex items-center justify-between gap-3"
                    >
                      <span className="text-sm font-semibold truncate">{group.domain}</span>
                      <span className="text-xs font-bold text-[var(--primary)] bg-[#f4edff] rounded-full px-2 py-1">
                        {group.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="email-extractor-from-text" />
    </div>
  );
}

function ToggleOption({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-white px-3 py-3 cursor-pointer">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[var(--primary)]"
      />
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-2">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full h-11 rounded-xl border border-[var(--border)] bg-white px-3 outline-none focus:border-[var(--primary)]"
      />
    </label>
  );
}

function StatCard({ label, value, highlighted = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlighted
          ? "border-[var(--primary)] bg-[#f8f4ff]"
          : "border-[var(--border)] bg-[#fafafa]"
      }`}
    >
      <p className="text-xs text-[var(--text-secondary)] font-semibold">{label}</p>
      <p className={`text-3xl font-black mt-1 ${highlighted ? "text-[var(--primary)]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function EmailRow({ item, showLine, onCopy, copied }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-bold break-all">{item.email}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {item.domain}
          {showLine && item.line ? ` • line ${item.line}` : ""}
        </p>
      </div>

      <button
        type="button"
        onClick={onCopy}
        className={`h-9 w-9 rounded-xl border inline-flex items-center justify-center shrink-0 ${
          copied
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-[var(--border)] bg-white hover:bg-[#f8f4ff] hover:text-[var(--primary)]"
        }`}
        title="Copy email"
        aria-label="Copy email"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}

function extractEmailsFromText(text, options) {
  const sourceText = String(text || "");
  const normalizedText = options.includeObfuscated
    ? normalizeObfuscatedEmails(sourceText)
    : sourceText;

  const includeDomainList = parseDomainList(options.includeDomains);
  const excludeDomainList = parseDomainList(options.excludeDomains);
  const emailRegex = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/g;

  const lines = normalizedText.split(/\r?\n/);
  const rawMatches = [];

  lines.forEach((line, lineIndex) => {
    const matches = line.match(emailRegex) || [];

    matches.forEach((match) => {
      const cleanedEmail = cleanEmail(match, options.convertLowercase);

      if (!isValidEmail(cleanedEmail)) return;

      rawMatches.push({
        email: cleanedEmail,
        domain: cleanedEmail.split("@")[1] || "",
        line: lineIndex + 1,
      });
    });
  });

  let filteredMatches = rawMatches.filter((item) => {
    if (includeDomainList.length && !domainMatches(item.domain, includeDomainList)) return false;
    if (excludeDomainList.length && domainMatches(item.domain, excludeDomainList)) return false;

    return true;
  });

  const filteredOut = rawMatches.length - filteredMatches.length;
  const beforeUniqueCount = filteredMatches.length;

  if (options.removeDuplicates) {
    const seen = new Set();

    filteredMatches = filteredMatches.filter((item) => {
      const key = item.email.toLowerCase();

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
  }

  if (options.sortAlphabetically) {
    filteredMatches = [...filteredMatches].sort((a, b) => a.email.localeCompare(b.email));
  }

  const domainCounts = new Map();

  filteredMatches.forEach((item) => {
    domainCounts.set(item.domain, (domainCounts.get(item.domain) || 0) + 1);
  });

  const domainGroups = Array.from(domainCounts.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));

  return {
    emails: filteredMatches,
    domainGroups,
    stats: {
      rawCount: rawMatches.length,
      outputCount: filteredMatches.length,
      duplicatesRemoved: options.removeDuplicates ? Math.max(0, beforeUniqueCount - filteredMatches.length) : 0,
      filteredOut,
      domainCount: domainGroups.length,
    },
  };
}

function normalizeObfuscatedEmails(text) {
  return String(text || "")
    .replace(/\s*(?:\[|\(|\{)?\s*at\s*(?:\]|\)|\})?\s*/gi, (match) => {
      const trimmed = match.trim().toLowerCase();

      if (/^(?:\[|\(|\{)?\s*at\s*(?:\]|\)|\})?$/.test(trimmed)) {
        return "@";
      }

      return match;
    })
    .replace(/\s*(?:\[|\(|\{)?\s*dot\s*(?:\]|\)|\})?\s*/gi, (match) => {
      const trimmed = match.trim().toLowerCase();

      if (/^(?:\[|\(|\{)?\s*dot\s*(?:\]|\)|\})?$/.test(trimmed)) {
        return ".";
      }

      return match;
    });
}

function cleanEmail(email, lowercase) {
  let cleaned = String(email || "")
    .replace(/^[^\w]+/, "")
    .replace(/[^\w.+=!#$%&'*+/=?^_`{|}~-]+$/g, "")
    .trim();

  if (lowercase) cleaned = cleaned.toLowerCase();

  return cleaned;
}

function isValidEmail(email) {
  if (!email || email.length > 254) return false;
  if ((email.match(/@/g) || []).length !== 1) return false;

  const [local, domain] = email.split("@");

  if (!local || !domain) return false;
  if (local.length > 64) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  if (domain.includes("..")) return false;
  if (!domain.includes(".")) return false;
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false;
  if (!/^[a-z0-9.-]+$/i.test(domain)) return false;

  return domain.split(".").every((part) => {
    return part.length > 0 && part.length <= 63 && !part.startsWith("-") && !part.endsWith("-");
  });
}

function parseDomainList(value) {
  return String(value || "")
    .split(/[,\n]/)
    .map((item) => item.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

function domainMatches(domain, domainList) {
  const cleanDomain = String(domain || "").toLowerCase();

  return domainList.some((item) => cleanDomain === item || cleanDomain.endsWith(`.${item}`));
}

function countLines(value) {
  if (!value) return 0;

  return String(value).split(/\r?\n/).length;
}

function escapeCsvCell(value) {
  const text = String(value || "");

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
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

async function saveTextFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const safeName = sanitizeDownloadFileName(filename);
  const file = new File([blob], safeName, { type: mimeType });

  const canShareFile =
    isIosLikeDevice() &&
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function" &&
    navigator.canShare({ files: [file] });

  if (canShareFile) {
    await navigator.share({
      files: [file],
      title: safeName,
    });
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = safeName;
  link.rel = "noopener";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function isIosLikeDevice() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";

  return (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1)
  );
}

function sanitizeDownloadFileName(fileName) {
  const cleanName = String(fileName || "download")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  return cleanName || "download";
}
