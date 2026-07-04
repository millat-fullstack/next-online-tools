import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileText,
  ListChecks,
  RotateCcw,
  Scissors,
  Search,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Name Splitter",
  path: "/name-splitter",
  category: "Text Tools",
  description:
    "Paste full names and split them into first name, middle name, last name, prefix, and suffix instantly.",
  metaTitle: "Name Splitter Online Free | Split Full Names Instantly",
  metaDescription:
    "Split full names into first name, middle name, last name, prefix, and suffix online for free. Clean messy name lists, copy results, and download CSV.",
};

const SAMPLE_NAMES = `Mr. John Michael Smith Jr.
Sarah Johnson
Dr. Ahmed Rahman Khan
Md. Yusuf Ali
Anna Maria Lopez
Prof. David Allen Brown PhD
Mst. Farhana Jannat
Yusuf
Mrs. Emily Rose Carter
Engr. Tanvir Hasan`;

const DEFAULT_SETTINGS = {
  detectPrefix: true,
  detectSuffix: true,
  treatMdAsPrefix: false,
  titleCase: true,
  removeExtraSpaces: true,
  removePunctuation: false,
  keepSingleAsFirstName: true,
};

const STANDARD_PREFIXES = [
  "mr",
  "mrs",
  "ms",
  "miss",
  "dr",
  "prof",
  "engr",
  "sir",
  "madam",
  "hon",
];

const BD_OPTIONAL_PREFIXES = ["md", "mst", "mohammad", "muhammad"];
const SUFFIXES = ["jr", "sr", "ii", "iii", "iv", "v", "phd", "mba", "md", "esq", "cpa", "dds", "dvm"];

export default function NameSplitter() {
  const [inputText, setInputText] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detectPrefix, setDetectPrefix] = useState(DEFAULT_SETTINGS.detectPrefix);
  const [detectSuffix, setDetectSuffix] = useState(DEFAULT_SETTINGS.detectSuffix);
  const [treatMdAsPrefix, setTreatMdAsPrefix] = useState(DEFAULT_SETTINGS.treatMdAsPrefix);
  const [titleCase, setTitleCase] = useState(DEFAULT_SETTINGS.titleCase);
  const [removeExtraSpaces, setRemoveExtraSpaces] = useState(DEFAULT_SETTINGS.removeExtraSpaces);
  const [removePunctuation, setRemovePunctuation] = useState(DEFAULT_SETTINGS.removePunctuation);
  const [keepSingleAsFirstName, setKeepSingleAsFirstName] = useState(DEFAULT_SETTINGS.keepSingleAsFirstName);
  const [copied, setCopied] = useState("");

  const splitResult = useMemo(() => {
    return splitNames(inputText, {
      detectPrefix,
      detectSuffix,
      treatMdAsPrefix,
      titleCase,
      removeExtraSpaces,
      removePunctuation,
      keepSingleAsFirstName,
    });
  }, [inputText, detectPrefix, detectSuffix, treatMdAsPrefix, titleCase, removeExtraSpaces, removePunctuation, keepSingleAsFirstName]);

  const csvText = useMemo(() => {
    const rows = [
      ["Original", "Prefix", "First Name", "Middle Name", "Last Name", "Suffix"],
      ...splitResult.rows.map((row) => [row.original, row.prefix, row.firstName, row.middleName, row.lastName, row.suffix]),
    ];
    return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  }, [splitResult.rows]);

  const tableText = useMemo(() => {
    if (!splitResult.rows.length) return "";
    return splitResult.rows
      .map((row) => [row.original, row.prefix, row.firstName, row.middleName, row.lastName, row.suffix].join("\t"))
      .join("\n");
  }, [splitResult.rows]);

  const firstNamesText = useMemo(() => splitResult.rows.map((row) => row.firstName).filter(Boolean).join("\n"), [splitResult.rows]);
  const lastNamesText = useMemo(() => splitResult.rows.map((row) => row.lastName).filter(Boolean).join("\n"), [splitResult.rows]);

  async function copyValue(value, label) {
    if (!value) return;
    try {
      await copyToClipboard(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1400);
    } catch {
      setCopied("");
    }
  }

  async function downloadCsv() {
    if (!splitResult.rows.length) return;
    await saveTextFile(csvText, "split-names.csv", "text/csv;charset=utf-8");
  }

  async function downloadTxt() {
    if (!tableText) return;
    await saveTextFile(tableText, "split-names.txt", "text/plain;charset=utf-8");
  }

  function resetTool() {
    setInputText("");
    setSettingsOpen(false);
    setDetectPrefix(DEFAULT_SETTINGS.detectPrefix);
    setDetectSuffix(DEFAULT_SETTINGS.detectSuffix);
    setTreatMdAsPrefix(DEFAULT_SETTINGS.treatMdAsPrefix);
    setTitleCase(DEFAULT_SETTINGS.titleCase);
    setRemoveExtraSpaces(DEFAULT_SETTINGS.removeExtraSpaces);
    setRemovePunctuation(DEFAULT_SETTINGS.removePunctuation);
    setKeepSingleAsFirstName(DEFAULT_SETTINGS.keepSingleAsFirstName);
    setCopied("");
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <UserRound size={28} className="text-[var(--primary)]" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Name Splitter</h1>
        <p className="text-[var(--text-secondary)] max-w-2xl">
          Paste full names and split them into prefix, first name, middle name, last name, and suffix for CRM, lead lists, and spreadsheet cleanup.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="grid xl:grid-cols-[minmax(0,1fr)_470px] gap-5">
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-bold">Paste Full Names</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setInputText(SAMPLE_NAMES)} className="btn-secondary inline-flex items-center justify-center gap-2 text-sm">
                    <Search size={17} />
                    Sample
                  </button>
                  <button type="button" onClick={resetTool} className="btn-secondary inline-flex items-center justify-center gap-2 text-sm">
                    <RotateCcw size={17} />
                    Reset
                  </button>
                </div>
              </div>

              <textarea
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder="Paste one full name per line. Example: Dr. John Michael Smith Jr."
                rows={14}
                className="w-full rounded-2xl border border-[var(--border)] bg-[#fafafa] px-4 py-4 outline-none resize-y focus:border-[var(--primary)]"
              />

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-[var(--text-secondary)]">
                  {inputText.length} characters • {splitResult.stats.totalNames} name{splitResult.stats.totalNames === 1 ? "" : "s"}
                </p>
                <button type="button" onClick={() => setSettingsOpen((current) => !current)} className="btn-secondary inline-flex items-center justify-center gap-2 text-sm">
                  <Settings2 size={17} />
                  Split Settings
                  <ChevronDown size={16} className={`transition ${settingsOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {settingsOpen && (
                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[#fafafa] p-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <ToggleOption label="Detect prefix" checked={detectPrefix} onChange={setDetectPrefix} />
                    <ToggleOption label="Detect suffix" checked={detectSuffix} onChange={setDetectSuffix} />
                    <ToggleOption label="Treat Md/Mst as prefix" checked={treatMdAsPrefix} onChange={setTreatMdAsPrefix} />
                    <ToggleOption label="Title Case names" checked={titleCase} onChange={setTitleCase} />
                    <ToggleOption label="Remove extra spaces" checked={removeExtraSpaces} onChange={setRemoveExtraSpaces} />
                    <ToggleOption label="Remove punctuation" checked={removePunctuation} onChange={setRemovePunctuation} />
                    <ToggleOption label="Single word as first name" checked={keepSingleAsFirstName} onChange={setKeepSingleAsFirstName} />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-4">
                    Md. and Mst. are not treated as prefixes by default because they are often part of the first name.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-bold">Privacy Note</h2>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-6">
                Your names are processed in your browser. This tool does not use login, external APIs, database storage, identity guessing, or gender prediction.
              </p>
            </div>
          </div>

          <div className="xl:sticky xl:top-4 h-fit flex flex-col gap-5">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-bold">Summary</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total Names" value={splitResult.stats.totalNames} highlighted />
                <StatCard label="Single Word" value={splitResult.stats.singleWord} />
                <StatCard label="Two Words" value={splitResult.stats.twoWords} />
                <StatCard label="3+ Words" value={splitResult.stats.threePlusWords} />
                <StatCard label="With Prefix" value={splitResult.stats.withPrefix} />
                <StatCard label="With Suffix" value={splitResult.stats.withSuffix} />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
              <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Scissors size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-bold">Split Result</h2>
                </div>
                <button type="button" onClick={() => copyValue(tableText, "table")} disabled={!tableText} className="btn-primary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {copied === "table" ? <Check size={17} /> : <Copy size={17} />}
                  {copied === "table" ? "Copied" : "Copy Table"}
                </button>
              </div>

              <div className="p-4">
                {splitResult.rows.length ? (
                  <div className="max-h-[460px] overflow-auto rounded-2xl border border-[var(--border)]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-[#f8f4ff] text-left z-10">
                        <tr>
                          <TableHead>Original</TableHead>
                          <TableHead>Prefix</TableHead>
                          <TableHead>First</TableHead>
                          <TableHead>Middle</TableHead>
                          <TableHead>Last</TableHead>
                          <TableHead>Suffix</TableHead>
                        </tr>
                      </thead>
                      <tbody>
                        {splitResult.rows.map((row) => (
                          <tr key={row.id} className="border-t border-[var(--border)]">
                            <TableCell muted>{row.original}</TableCell>
                            <TableCell>{row.prefix}</TableCell>
                            <TableCell strong>{row.firstName}</TableCell>
                            <TableCell>{row.middleName}</TableCell>
                            <TableCell strong>{row.lastName}</TableCell>
                            <TableCell>{row.suffix}</TableCell>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="min-h-[280px] rounded-2xl border border-dashed border-[var(--border)] bg-[#fafafa] flex items-center justify-center text-center p-6">
                    <div>
                      <Users size={42} className="mx-auto mb-3 text-[var(--primary)]" />
                      <p className="font-semibold">No names split yet</p>
                      <p className="text-sm text-[var(--text-secondary)] mt-2">Paste full names on the left and results will appear here.</p>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  <ActionButton label="Copy First Names" copied={copied === "first"} disabled={!firstNamesText} onClick={() => copyValue(firstNamesText, "first")} />
                  <ActionButton label="Copy Last Names" copied={copied === "last"} disabled={!lastNamesText} onClick={() => copyValue(lastNamesText, "last")} />
                  <button type="button" onClick={downloadCsv} disabled={!splitResult.rows.length} className="btn-secondary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    <Download size={17} />
                    Download CSV
                  </button>
                  <button type="button" onClick={downloadTxt} disabled={!tableText} className="btn-secondary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    <Download size={17} />
                    Download TXT
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <BadgeCheck size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-bold">Best For</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-[var(--text-secondary)]">
                <p>CRM cleanup</p>
                <p>Lead sheets</p>
                <p>Email outreach</p>
                <p>HR lists</p>
                <p>Student lists</p>
                <p>Spreadsheet work</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="name-splitter" />
    </div>
  );
}

function ToggleOption({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-white px-3 py-3 cursor-pointer">
      <span className="text-sm font-semibold">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
    </label>
  );
}

function StatCard({ label, value, highlighted = false }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlighted ? "border-[var(--primary)] bg-[#f8f4ff]" : "border-[var(--border)] bg-[#fafafa]"}`}>
      <p className="text-xs text-[var(--text-secondary)] font-semibold">{label}</p>
      <p className={`text-3xl font-black mt-1 ${highlighted ? "text-[var(--primary)]" : ""}`}>{value}</p>
    </div>
  );
}

function TableHead({ children }) {
  return <th className="px-3 py-3 text-xs font-black text-[var(--text-secondary)] whitespace-nowrap">{children}</th>;
}

function TableCell({ children, strong = false, muted = false }) {
  return (
    <td className={`px-3 py-3 align-top min-w-[120px] ${strong ? "font-bold" : ""} ${muted ? "text-[var(--text-secondary)]" : ""}`}>
      <span className="break-words">{children || "-"}</span>
    </td>
  );
}

function ActionButton({ label, copied, disabled, onClick }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`btn-secondary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${copied ? "text-green-700 bg-green-50 border-green-100" : ""}`}>
      {copied ? <Check size={17} /> : <Copy size={17} />}
      {copied ? "Copied" : label}
    </button>
  );
}

function splitNames(text, settings) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = lines.map((line) => parseNameLine(line, settings));

  const stats = rows.reduce(
    (summary, row) => {
      summary.totalNames += 1;
      if (row.wordCount === 1) summary.singleWord += 1;
      if (row.wordCount === 2) summary.twoWords += 1;
      if (row.wordCount >= 3) summary.threePlusWords += 1;
      if (row.prefix) summary.withPrefix += 1;
      if (row.suffix) summary.withSuffix += 1;
      return summary;
    },
    { totalNames: 0, singleWord: 0, twoWords: 0, threePlusWords: 0, withPrefix: 0, withSuffix: 0 }
  );

  return { rows, stats };
}

function parseNameLine(line, settings) {
  const original = line;
  let cleaned = String(line || "").trim();
  if (settings.removeExtraSpaces) cleaned = cleaned.replace(/\s+/g, " ");
  cleaned = cleaned.replace(/\s*,\s*/g, " ");
  if (settings.removePunctuation) cleaned = cleaned.replace(/[^\p{L}\p{N}\s.'-]/gu, "");

  let parts = cleaned.split(/\s+/).filter(Boolean);
  let prefix = "";
  let suffix = "";

  if (settings.detectPrefix && parts.length > 1) {
    const prefixKey = normalizeToken(parts[0]);
    const allowedPrefixes = settings.treatMdAsPrefix ? [...STANDARD_PREFIXES, ...BD_OPTIONAL_PREFIXES] : STANDARD_PREFIXES;
    if (allowedPrefixes.includes(prefixKey)) prefix = normalizeNamePart(parts.shift(), settings);
  }

  if (settings.detectSuffix && parts.length > 1) {
    const suffixKey = normalizeToken(parts[parts.length - 1]);
    if (SUFFIXES.includes(suffixKey)) suffix = normalizeNamePart(parts.pop(), settings);
  }

  const wordCount = parts.length;
  let firstName = "";
  let middleName = "";
  let lastName = "";

  if (parts.length === 1) {
    if (settings.keepSingleAsFirstName) firstName = parts[0];
    else lastName = parts[0];
  } else if (parts.length === 2) {
    firstName = parts[0];
    lastName = parts[1];
  } else if (parts.length > 2) {
    firstName = parts[0];
    middleName = parts.slice(1, -1).join(" ");
    lastName = parts[parts.length - 1];
  }

  return {
    id: createId(),
    original,
    prefix,
    firstName: normalizeNamePart(firstName, settings),
    middleName: normalizeNamePart(middleName, settings),
    lastName: normalizeNamePart(lastName, settings),
    suffix,
    wordCount,
  };
}

function normalizeToken(value) {
  return String(value || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function normalizeNamePart(value, settings) {
  let text = String(value || "").trim();
  if (settings.removePunctuation) text = text.replace(/[^\p{L}\p{N}\s'-]/gu, "");
  if (settings.removeExtraSpaces) text = text.replace(/\s+/g, " ");
  if (settings.titleCase) text = toTitleCase(text);
  return text;
}

function toTitleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/(^|[\s'-])(\p{L})/gu, (match, separator, letter) => `${separator}${letter.toUpperCase()}`)
    .replace(/\bMd\b/g, "Md")
    .replace(/\bMst\b/g, "Mst")
    .replace(/\bIi\b/g, "II")
    .replace(/\bIii\b/g, "III")
    .replace(/\bIv\b/g, "IV")
    .replace(/\bPhd\b/g, "PhD")
    .replace(/\bMba\b/g, "MBA");
}

function escapeCsvCell(value) {
  const text = String(value || "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
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
  if (!successful) throw new Error("Copy failed.");
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
    await navigator.share({ files: [file], title: safeName });
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
  return /iPad|iPhone|iPod/i.test(userAgent) || (platform === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1);
}

function sanitizeDownloadFileName(fileName) {
  const cleanName = String(fileName || "download")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return cleanName || "download";
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
