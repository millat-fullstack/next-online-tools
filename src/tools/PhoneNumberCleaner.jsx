import { useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  Copy,
  Check,
  Phone,
  FileText,
  Settings2,
  AlertCircle,
  CheckCircle,
  Table,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Phone Number Cleaner",
  path: "/phone-number-cleaner",
  category: "Productivity Tools",
  description:
    "Clean and format phone numbers in bulk for Google Sheets and Excel. Remove plus signs, formulas, spaces, dashes, and unwanted formatting while preserving spreadsheet rows and columns.",
  metaTitle: "Phone Number Cleaner | Format Numbers for Google Sheets",
  metaDescription:
    "Clean phone numbers online for free. Remove plus signs, formula symbols, spaces, dashes, and formatting problems before pasting into Google Sheets or Excel without losing row and column formatting.",
};

export default function PhoneNumberCleaner() {
  const fileInputRef = useRef(null);

  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [removeLeadingPlus, setRemoveLeadingPlus] = useState(true);
  const [removeLeadingEquals, setRemoveLeadingEquals] = useState(true);
  const [removeSpaces, setRemoveSpaces] = useState(true);
  const [removeDashes, setRemoveDashes] = useState(true);
  const [removeBrackets, setRemoveBrackets] = useState(true);
  const [keepOnlyDigits, setKeepOnlyDigits] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [makeSheetSafe, setMakeSheetSafe] = useState(true);
  const [skipInvalidLines, setSkipInvalidLines] = useState(true);

  const [lastStats, setLastStats] = useState({
    totalLines: 0,
    cleanedNumbers: 0,
    invalidLines: 0,
    duplicatesRemoved: 0,
    charactersRemoved: 0,
    reductionPercent: 0,
  });

  const parseCsvLine = (line) => {
    const cells = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && insideQuotes && nextChar === '"') {
        current += '"';
        i += 1;
        continue;
      }

      if (char === '"') {
        insideQuotes = !insideQuotes;
        continue;
      }

      if (char === "," && !insideQuotes) {
        cells.push(current);
        current = "";
        continue;
      }

      current += char;
    }

    cells.push(current);
    return cells;
  };

  const parseSheetGrid = (text) => {
    const normalizedText = String(text || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");

    if (!normalizedText) return [];

    const rows = normalizedText.split("\n");

    while (rows.length && rows[rows.length - 1] === "") {
      rows.pop();
    }

    return rows.map((row) => {
      if (row.includes("\t")) {
        return row.split("\t");
      }

      return parseCsvLine(row);
    });
  };

  const countFilledCells = (grid) => {
    return grid.flat().filter((cell) => String(cell || "").trim()).length;
  };

  const makeGoogleSheetsSafeValue = (value) => {
    if (!makeSheetSafe || !value) return value;

    const plainValue = String(value).replace(/^'/, "");

    return `'${plainValue}`;
  };

  const normalizePossibleFormulaPhone = (value) => {
    let number = String(value || "").trim();

    number = number
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .trim();

    if (
      (number.startsWith('"') && number.endsWith('"')) ||
      (number.startsWith("'") && number.endsWith("'"))
    ) {
      number = number.slice(1, -1).trim();
    }

    // Remove Google Sheets text marker.
    number = number.replace(/^'/, "").trim();

    // Handle formula-like phone values:
    // =01712345678
    // =+8801712345678
    // ="+8801712345678"
    // ='01712345678'
    if (removeLeadingEquals) {
      number = number.replace(/^=+\s*/, "").trim();

      if (
        (number.startsWith('"') && number.endsWith('"')) ||
        (number.startsWith("'") && number.endsWith("'"))
      ) {
        number = number.slice(1, -1).trim();
      }
    }

    return number;
  };

  const cleanSingleNumber = (value) => {
    const rawValue = String(value || "");
    let number = normalizePossibleFormulaPhone(rawValue);
    const originalLength = number.length;

    if (removeLeadingPlus) {
      number = number.replace(/^\++/, "");
    }

    if (removeSpaces) {
      number = number.replace(/\s+/g, "");
    }

    if (removeDashes) {
      number = number.replace(/[-–—]/g, "");
    }

    if (removeBrackets) {
      number = number.replace(/[(){}[\]]/g, "");
    }

    if (keepOnlyDigits) {
      number = number.replace(/\D/g, "");
    }

    const plainNumber = number.replace(/^'/, "");
    const isValid = plainNumber.length >= 6;

    const safeNumber = makeGoogleSheetsSafeValue(plainNumber);

    return {
      value: safeNumber,
      isValid,
      removedCharacters: Math.max(0, originalLength - plainNumber.length),
    };
  };

  const handleClean = () => {
    setError("");
    setSuccess("");
    setCopied(false);

    if (!inputText.trim()) {
      setOutputText("");
      setError("Please paste phone numbers first.");
      return;
    }

    const grid = parseSheetGrid(inputText);
    const totalCells = countFilledCells(grid);

    if (!grid.length || !totalCells) {
      setOutputText("");
      setError(
        "No phone numbers found. Please paste numbers from Google Sheets, Excel, TXT, or CSV."
      );
      return;
    }

    const seen = new Set();

    let cleanedNumbers = 0;
    let invalidLines = 0;
    let duplicatesRemoved = 0;
    let charactersRemoved = 0;

    const cleanedGrid = grid.map((row) => {
      return row.map((cell) => {
        const originalCell = String(cell || "");

        // Keep empty cells empty so spreadsheet layout does not shift.
        if (!originalCell.trim()) {
          return "";
        }

        const result = cleanSingleNumber(originalCell);
        charactersRemoved += result.removedCharacters;

        if (!result.value || !result.isValid) {
          invalidLines += 1;

          // Keep the cell position. Do not remove the cell.
          return skipInvalidLines ? "" : result.value;
        }

        const duplicateKey = result.value.replace(/^'/, "");

        if (removeDuplicates && seen.has(duplicateKey)) {
          duplicatesRemoved += 1;

          // Keep the grid shape by blanking duplicate cells instead of deleting rows/cells.
          return "";
        }

        seen.add(duplicateKey);
        cleanedNumbers += 1;

        return result.value;
      });
    });

    const resultText = cleanedGrid.map((row) => row.join("\t")).join("\n");
    const hasOutput = resultText.replace(/[\t\n]/g, "").trim();

    if (!hasOutput) {
      setOutputText("");
      setError("No valid phone numbers found after cleaning.");
      setLastStats({
        totalLines: totalCells,
        cleanedNumbers: 0,
        invalidLines,
        duplicatesRemoved,
        charactersRemoved,
        reductionPercent: 0,
      });
      return;
    }

    const reductionPercent =
      inputText.length > 0
        ? Math.max(0, Math.round((charactersRemoved / inputText.length) * 100))
        : 0;

    setOutputText(resultText);

    setLastStats({
      totalLines: totalCells,
      cleanedNumbers,
      invalidLines,
      duplicatesRemoved,
      charactersRemoved,
      reductionPercent,
    });

    setSuccess(
      "Phone numbers cleaned successfully. Row and column layout is preserved for Google Sheets."
    );
  };

  const handleCopy = async () => {
    if (!outputText) return;

    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setError("");
      setSuccess(
        "Cleaned numbers copied successfully. Paste directly into Google Sheets."
      );

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setError("Copy failed. Please copy the output manually.");
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    if (!outputText) {
      setError("Please clean phone numbers first.");
      return;
    }

    const blob = new Blob([outputText], {
      type: "text/plain;charset=utf-8",
    });

    downloadBlob(blob, "cleaned-phone-numbers.txt");
  };

  const csvEscape = (value) => {
    return `"${String(value || "").replace(/^'/, "").replace(/"/g, '""')}"`;
  };

  const handleDownloadCsv = () => {
    if (!outputText) {
      setError("Please clean phone numbers first.");
      return;
    }

    const csv = outputText
      .split(/\r?\n/)
      .map((row) => row.split("\t").map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    downloadBlob(blob, "cleaned-phone-numbers.csv");
  };

  const handleDownloadXlsx = async () => {
    if (!outputText) {
      setError("Please clean phone numbers first.");
      return;
    }

    try {
      const ExcelJSModule = await import("exceljs");
      const ExcelJS = ExcelJSModule.default || ExcelJSModule;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Cleaned Numbers");

      const rows = outputText.split(/\r?\n/).map((row) => {
        return row
          .split("\t")
          .map((cell) => String(cell || "").replace(/^'/, ""));
      });

      const maxColumns = Math.max(...rows.map((row) => row.length));

      for (let col = 1; col <= maxColumns; col += 1) {
        worksheet.getColumn(col).width = 24;
        worksheet.getColumn(col).numFmt = "@";
      }

      rows.forEach((row) => {
        const excelRow = worksheet.addRow(row);

        excelRow.eachCell((cell) => {
          cell.numFmt = "@";
          cell.value = String(cell.value || "");
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      downloadBlob(blob, "cleaned-phone-numbers.xlsx");
    } catch {
      setError("Excel download failed. Please make sure exceljs is installed.");
    }
  };

  const handleUploadTextFile = (e) => {
    const file = e.target.files?.[0];

    setError("");
    setSuccess("");
    setOutputText("");
    setCopied(false);

    if (!file) return;

    const isAllowed =
      file.type.includes("text") ||
      file.name.toLowerCase().endsWith(".txt") ||
      file.name.toLowerCase().endsWith(".csv");

    if (!isAllowed) {
      setError("Please upload a valid TXT or CSV file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setInputText(String(reader.result || ""));
      setSuccess("File uploaded successfully. Click Clean Numbers to process.");
    };

    reader.onerror = () => {
      setError("Failed to read the file. Please try another file.");
    };

    reader.readAsText(file);
  };

  const handleReset = () => {
    setInputText("");
    setOutputText("");
    setCopied(false);
    setError("");
    setSuccess("");

    setRemoveLeadingPlus(true);
    setRemoveLeadingEquals(true);
    setRemoveSpaces(true);
    setRemoveDashes(true);
    setRemoveBrackets(true);
    setKeepOnlyDigits(true);
    setRemoveDuplicates(false);
    setMakeSheetSafe(true);
    setSkipInvalidLines(true);

    setLastStats({
      totalLines: 0,
      cleanedNumbers: 0,
      invalidLines: 0,
      duplicatesRemoved: 0,
      charactersRemoved: 0,
      reductionPercent: 0,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const liveInputCount = useMemo(() => {
    return countFilledCells(parseSheetGrid(inputText));
  }, [inputText]);

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Phone size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Phone Number Cleaner</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Clean phone numbers in bulk before pasting into Google Sheets or
          Excel. Remove plus signs, formula symbols, spaces, dashes, brackets,
          and messy formatting while keeping the same spreadsheet row and column
          layout.
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
                  <FileText size={20} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-semibold">Paste Phone Numbers</h2>
                </div>

                <span className="text-xs text-[var(--text-secondary)]">
                  {liveInputCount} detected
                </span>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setOutputText("");
                  setCopied(false);
                  setError("");
                  setSuccess("");
                }}
                placeholder={`Paste from Google Sheets, Excel, TXT, or CSV:
+8801712345678
=01712345678
="+8801712345678"
01712-345-678
+88 01712 345678`}
                rows="14"
                className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              />
            </div>

            {/* SETTINGS */}
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Cleaning Settings</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <CheckOption
                  label="Remove leading +"
                  checked={removeLeadingPlus}
                  onChange={setRemoveLeadingPlus}
                />

                <CheckOption
                  label="Remove leading ="
                  checked={removeLeadingEquals}
                  onChange={setRemoveLeadingEquals}
                />

                <CheckOption
                  label="Remove spaces"
                  checked={removeSpaces}
                  onChange={setRemoveSpaces}
                />

                <CheckOption
                  label="Remove dashes"
                  checked={removeDashes}
                  onChange={setRemoveDashes}
                />

                <CheckOption
                  label="Remove brackets"
                  checked={removeBrackets}
                  onChange={setRemoveBrackets}
                />

                <CheckOption
                  label="Keep only digits"
                  checked={keepOnlyDigits}
                  onChange={setKeepOnlyDigits}
                />

                <CheckOption
                  label="Remove duplicates"
                  checked={removeDuplicates}
                  onChange={setRemoveDuplicates}
                />

                <CheckOption
                  label="Skip invalid cells"
                  checked={skipInvalidLines}
                  onChange={setSkipInvalidLines}
                />
              </div>

              <div className="mt-4 bg-white border border-[var(--border)] rounded-xl p-4">
                <CheckOption
                  label="Make safe for Google Sheets text format"
                  checked={makeSheetSafe}
                  onChange={setMakeSheetSafe}
                />

                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Recommended. This adds an apostrophe before each cleaned number
                  so Google Sheets and Excel keep phone numbers as text and do
                  not convert them into formulas or remove leading zeros.
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleClean}
                disabled={!inputText.trim()}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !inputText.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Zap size={18} />
                Clean Numbers
              </button>

              <label className="btn-secondary cursor-pointer inline-flex items-center justify-center gap-2">
                <Upload size={18} />
                Upload TXT/CSV
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,text/plain,text/csv"
                  onChange={handleUploadTextFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Reset
              </button>
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

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-sm text-yellow-800">
                Tip: You can paste directly from Google Sheets. This tool keeps
                the same row and column layout, so cleaned results paste back
                into Sheets without shifting cells.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-start gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Table size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-semibold">Cleaned Output</h2>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Ready to paste into Google Sheets or Excel with the same
                    layout.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!outputText}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    outputText
                      ? copied
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-white text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary)]/5"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                  title="Copy cleaned numbers"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <textarea
                value={outputText}
                readOnly
                placeholder="Cleaned phone numbers will appear here..."
                rows="14"
                className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none bg-gray-50 resize-none font-mono"
              />
            </div>

            {/* DOWNLOAD BUTTONS */}
            <div className="grid sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleDownloadTxt}
                disabled={!outputText}
                className={`btn-primary inline-flex items-center justify-center gap-2 ${
                  !outputText ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                TXT
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={!outputText}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  !outputText ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                CSV
              </button>

              <button
                type="button"
                onClick={handleDownloadXlsx}
                disabled={!outputText}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  !outputText ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                XLSX
              </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Detected Cells" value={lastStats.totalLines} />
              <StatCard label="Cleaned" value={lastStats.cleanedNumbers} />
              <StatCard label="Invalid Cells" value={lastStats.invalidLines} />
              <StatCard
                label="Duplicates Removed"
                value={lastStats.duplicatesRemoved}
              />
              <StatCard
                label="Characters Removed"
                value={lastStats.charactersRemoved}
              />
              <StatCard
                label="Cleanup Reduction"
                value={`${lastStats.reductionPercent}%`}
                green
              />
            </div>

            {!outputText && (
              <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                <Phone size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-[var(--text-secondary)]">
                  Paste numbers and click “Clean Numbers” to generate output.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="phone-number-cleaner" />
    </div>
  );
}

function CheckOption({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 text-sm font-medium cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-[var(--primary)]"
      />
      {label}
    </label>
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