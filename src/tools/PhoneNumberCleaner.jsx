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
  Info,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Phone Number Cleaner",
  path: "/phone-number-cleaner",
  category: "Productivity Tools",
  description:
    "Clean and format phone numbers in bulk for Google Sheets and Excel. Remove plus signs, formula symbols, spaces, dashes, brackets, and unwanted formatting while preserving spreadsheet rows and columns.",
  metaTitle: "Phone Number Cleaner | Format Numbers for Google Sheets",
  metaDescription:
    "Clean phone numbers online for free. Fix Google Sheets phone numbers, #ERROR formula phone values, spaces, dashes, plus signs, and leading zero issues before pasting into Sheets or Excel.",
};

export default function PhoneNumberCleaner() {
  const fileInputRef = useRef(null);
  const inputAreaRef = useRef(null);

  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recoveredFormulaCount, setRecoveredFormulaCount] = useState(0);

  const [removeLeadingPlus, setRemoveLeadingPlus] = useState(true);
  const [removeLeadingEquals, setRemoveLeadingEquals] = useState(true);
  const [removeSpaces, setRemoveSpaces] = useState(true);
  const [removeDashes, setRemoveDashes] = useState(true);
  const [removeBrackets, setRemoveBrackets] = useState(true);
  const [keepOnlyDigits, setKeepOnlyDigits] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [copyAsSheetText, setCopyAsSheetText] = useState(true);
  const [skipInvalidCells, setSkipInvalidCells] = useState(true);

  const [lastStats, setLastStats] = useState({
    detectedCells: 0,
    cleanedNumbers: 0,
    invalidCells: 0,
    duplicatesRemoved: 0,
    charactersRemoved: 0,
    formulaPhones: 0,
  });

  const normalizeNewLines = (text) => {
    return String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  };

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
    const normalized = normalizeNewLines(text);

    if (!normalized) return [];

    const rows = normalized.split("\n");

    while (rows.length && rows[rows.length - 1] === "") {
      rows.pop();
    }

    return rows.map((row) => {
      if (row.includes("\t")) return row.split("\t");
      if (row.includes(",")) return parseCsvLine(row);
      return [row];
    });
  };

  const gridToText = (grid) => {
    return grid.map((row) => row.join("\t")).join("\n");
  };

  const countFilledCells = (grid) => {
    return grid.flat().filter((cell) => String(cell || "").trim()).length;
  };

  const isSpreadsheetError = (value) => {
    const text = String(value || "").trim().toUpperCase();

    return [
      "#ERROR!",
      "#VALUE!",
      "#REF!",
      "#DIV/0!",
      "#N/A",
      "#NAME?",
      "#NUM!",
      "#NULL!",
    ].includes(text);
  };

  const removeWrappingQuotes = (value) => {
    let text = String(value || "").trim();
    let changed = true;

    while (changed && text.length >= 2) {
      changed = false;

      const first = text[0];
      const last = text[text.length - 1];

      if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        text = text.slice(1, -1).trim();
        changed = true;
      }
    }

    return text;
  };

  const formulaHasPhoneNumber = (formula) => {
    const text = String(formula || "");
    const digitCount = (text.match(/\d/g) || []).length;
    return digitCount >= 6;
  };

  const ensureFormulaPrefix = (formula) => {
    const text = String(formula || "").trim();
    if (!text) return "";
    return text.startsWith("=") ? text : `=${text}`;
  };

  const getVisibleTextFromHtmlCell = (cell) => {
    return String(cell.textContent || "").replace(/\u00a0/g, " ").trim();
  };

  const extractGridFromClipboardHtml = (html) => {
    if (!html || !html.includes("<table")) return null;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const table = doc.querySelector("table");

      if (!table) return null;

      const rows = Array.from(table.querySelectorAll("tr"));
      let recoveredFormulas = 0;

      const grid = rows.map((row) => {
        const cells = Array.from(row.querySelectorAll("th, td"));

        return cells.map((cell) => {
          const visibleText = getVisibleTextFromHtmlCell(cell);

          const formula =
            cell.getAttribute("data-sheets-formula") ||
            cell.getAttribute("data-formula") ||
            "";

          if (formula && formulaHasPhoneNumber(formula)) {
            recoveredFormulas += 1;
            return ensureFormulaPrefix(formula);
          }

          return visibleText;
        });
      });

      if (!grid.length) return null;

      return {
        grid,
        recoveredFormulas,
      };
    } catch {
      return null;
    }
  };

  const insertTextAtCursor = (text, target) => {
    const start = target.selectionStart ?? inputText.length;
    const end = target.selectionEnd ?? inputText.length;

    const nextText = `${inputText.slice(0, start)}${text}${inputText.slice(end)}`;

    setInputText(nextText);
    setOutputText("");
    setCopied(false);

    window.requestAnimationFrame(() => {
      if (inputAreaRef.current) {
        const cursorPosition = start + text.length;
        inputAreaRef.current.selectionStart = cursorPosition;
        inputAreaRef.current.selectionEnd = cursorPosition;
      }
    });
  };

  const handlePaste = (event) => {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const html = clipboardData.getData("text/html");
    const plainText = clipboardData.getData("text/plain");
    const htmlResult = extractGridFromClipboardHtml(html);

    event.preventDefault();

    setError("");
    setSuccess("");
    setOutputText("");
    setCopied(false);

    if (htmlResult?.grid?.length) {
      const recovered = htmlResult.recoveredFormulas || 0;

      insertTextAtCursor(gridToText(htmlResult.grid), event.currentTarget);
      setRecoveredFormulaCount(recovered);

      if (recovered > 0) {
        setSuccess(
          `${recovered} formula phone number(s) were recovered from the Google Sheets clipboard.`
        );
      }

      return;
    }

    insertTextAtCursor(normalizeNewLines(plainText), event.currentTarget);
    setRecoveredFormulaCount(0);
  };

  const normalizePossibleFormulaPhone = (value) => {
    let number = String(value || "")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .trim();

    number = removeWrappingQuotes(number);

    // Remove Google Sheets text marker if pasted as '080123456.
    number = number.replace(/^'/, "").trim();

    // Convert formula-style phone values:
    // =+30 012 987 1234
    // =01712345678
    // ="+8801712345678"
    // ='01712345678'
    if (removeLeadingEquals) {
      number = number.replace(/^=+\s*/, "").trim();
      number = removeWrappingQuotes(number);
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

    const digitCount = (number.match(/\d/g) || []).length;
    const isValid = digitCount >= 6;

    return {
      value: number,
      isValid,
      removedCharacters: Math.max(0, originalLength - number.length),
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
    const detectedCells = countFilledCells(grid);

    if (!grid.length || !detectedCells) {
      setOutputText("");
      setError("No phone numbers found.");
      return;
    }

    const seen = new Set();

    let cleanedNumbers = 0;
    let invalidCells = 0;
    let duplicatesRemoved = 0;
    let charactersRemoved = 0;
    let spreadsheetErrorCells = 0;
    let formulaPhones = 0;

    const cleanedGrid = grid.map((row) => {
      return row.map((cell) => {
        const originalCell = String(cell || "");
        const trimmedCell = originalCell.trim();

        if (!trimmedCell) return "";

        if (isSpreadsheetError(trimmedCell)) {
          invalidCells += 1;
          spreadsheetErrorCells += 1;
          return skipInvalidCells ? "" : trimmedCell;
        }

        const result = cleanSingleNumber(trimmedCell);
        charactersRemoved += result.removedCharacters;

        if (!result.value || !result.isValid) {
          invalidCells += 1;
          return skipInvalidCells ? "" : result.value;
        }

        if (trimmedCell.startsWith("=")) {
          formulaPhones += 1;
        }

        const duplicateKey = result.value;

        if (removeDuplicates && seen.has(duplicateKey)) {
          duplicatesRemoved += 1;
          return "";
        }

        seen.add(duplicateKey);
        cleanedNumbers += 1;

        return result.value;
      });
    });

    const resultText = gridToText(cleanedGrid);
    const hasOutput = resultText.replace(/[\t\n]/g, "").trim();

    const finalFormulaPhones = Math.max(formulaPhones, recoveredFormulaCount);

    if (!hasOutput) {
      setOutputText("");

      setLastStats({
        detectedCells,
        cleanedNumbers: 0,
        invalidCells,
        duplicatesRemoved,
        charactersRemoved,
        formulaPhones: finalFormulaPhones,
      });

      setError(
        spreadsheetErrorCells > 0
          ? "Only #ERROR! values were pasted. Normal copy-paste from Google Sheets may only copy the visible error, not the hidden formula. For bulk recovery, download the sheet as XLSX and upload it here."
          : "No valid phone numbers found after cleaning."
      );

      return;
    }

    setOutputText(resultText);

    setLastStats({
      detectedCells,
      cleanedNumbers,
      invalidCells,
      duplicatesRemoved,
      charactersRemoved,
      formulaPhones: finalFormulaPhones,
    });

    if (spreadsheetErrorCells > 0) {
      setSuccess(
        `Cleaned successfully. ${spreadsheetErrorCells} #ERROR! cell(s) could not be recovered from normal paste. Use XLSX upload for bulk formula recovery.`
      );
      return;
    }

    setSuccess("Phone numbers cleaned successfully. Output is ready to copy.");
  };

  const createSheetSafeCopyText = (text) => {
    const grid = parseSheetGrid(text);

    return grid
      .map((row) => {
        return row
          .map((cell) => {
            const value = String(cell || "");
            if (!value.trim()) return "";

            // Hidden text marker for Google Sheets/Excel.
            // This is not shown in the output box.
            return `'${value.replace(/^'/, "")}`;
          })
          .join("\t");
      })
      .join("\n");
  };

  const escapeHtml = (value) => {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  const buildClipboardHtmlTable = (text) => {
    const grid = parseSheetGrid(text);

    const rows = grid
      .map((row) => {
        const cells = row
          .map((cell) => {
            const value = String(cell || "");
            const dataSheetsValue = JSON.stringify({
              1: 2,
              2: value,
            });

            return `<td style="mso-number-format:'\\@'; white-space:pre;" data-sheets-value="${escapeHtml(
              dataSheetsValue
            )}">${escapeHtml(value)}</td>`;
          })
          .join("");

        return `<tr>${cells}</tr>`;
      })
      .join("");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><table>${rows}</table></body></html>`;
  };

  const copyTextToClipboard = async (plainText, htmlText = "") => {
    if (
      htmlText &&
      navigator.clipboard?.write &&
      typeof ClipboardItem !== "undefined"
    ) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([plainText], {
            type: "text/plain",
          }),
          "text/html": new Blob([htmlText], {
            type: "text/html",
          }),
        }),
      ]);

      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(plainText);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = plainText;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const copiedSuccessfully = document.execCommand("copy");

    document.body.removeChild(textarea);

    if (!copiedSuccessfully) {
      throw new Error("Copy failed");
    }
  };

  const handleCopy = async () => {
    if (!outputText) return;

    try {
      const plainTextToCopy = copyAsSheetText
        ? createSheetSafeCopyText(outputText)
        : outputText;

      const htmlTextToCopy = copyAsSheetText
        ? buildClipboardHtmlTable(outputText)
        : "";

      await copyTextToClipboard(plainTextToCopy, htmlTextToCopy);

      setCopied(true);
      setError("");
      setSuccess(
        copyAsSheetText
          ? "Copied successfully. Paste into Google Sheets; leading zeros should stay preserved without visible apostrophes."
          : "Copied successfully."
      );

      window.setTimeout(() => {
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
    return `"${String(value || "").replace(/"/g, '""')}"`;
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
        return row.split("\t").map((cell) => String(cell || ""));
      });

      const maxColumns = Math.max(1, ...rows.map((row) => row.length));

      for (let col = 1; col <= maxColumns; col += 1) {
        worksheet.getColumn(col).width = 24;
        worksheet.getColumn(col).numFmt = "@";
      }

      rows.forEach((row) => {
        const excelRow = worksheet.addRow(row);

        excelRow.eachCell({ includeEmpty: true }, (cell) => {
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

  const getXlsxCellInfo = (cell) => {
    if (!cell) {
      return {
        text: "",
        recoveredFormula: false,
      };
    }

    const value = cell.value;

    if (value && typeof value === "object") {
      if (value.formula) {
        const formulaText = ensureFormulaPrefix(value.formula);

        return {
          text: formulaText,
          recoveredFormula: formulaHasPhoneNumber(formulaText),
        };
      }

      if (value.sharedFormula) {
        const formulaText = ensureFormulaPrefix(value.sharedFormula);

        return {
          text: formulaText,
          recoveredFormula: formulaHasPhoneNumber(formulaText),
        };
      }

      if (value.error) {
        return {
          text: String(value.error || ""),
          recoveredFormula: false,
        };
      }

      if (Array.isArray(value.richText)) {
        return {
          text: value.richText.map((part) => part.text || "").join(""),
          recoveredFormula: false,
        };
      }

      if (value.text) {
        return {
          text: String(value.text || ""),
          recoveredFormula: false,
        };
      }

      if (value.result !== undefined && value.result !== null) {
        return {
          text: String(value.result || ""),
          recoveredFormula: false,
        };
      }
    }

    if (cell.formula) {
      const formulaText = ensureFormulaPrefix(cell.formula);

      return {
        text: formulaText,
        recoveredFormula: formulaHasPhoneNumber(formulaText),
      };
    }

    return {
      text: String(cell.text || value || ""),
      recoveredFormula: false,
    };
  };

  const readXlsxFile = async (file) => {
    const ExcelJSModule = await import("exceljs");
    const ExcelJS = ExcelJSModule.default || ExcelJSModule;

    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer);

    const worksheet =
      workbook.worksheets.find((sheet) => sheet.actualRowCount > 0) ||
      workbook.worksheets[0];

    if (!worksheet) {
      throw new Error("No worksheet found.");
    }

    let maxRow = 0;
    let maxCol = 0;

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const hasValue =
          cell.value !== null &&
          cell.value !== undefined &&
          String(cell.text || cell.value || "").trim() !== "";

        if (hasValue) {
          maxRow = Math.max(maxRow, rowNumber);
          maxCol = Math.max(maxCol, colNumber);
        }
      });
    });

    if (!maxRow || !maxCol) {
      return {
        grid: [],
        recoveredFormulas: 0,
      };
    }

    let recoveredFormulas = 0;
    const grid = [];

    for (let rowNumber = 1; rowNumber <= maxRow; rowNumber += 1) {
      const row = [];

      for (let colNumber = 1; colNumber <= maxCol; colNumber += 1) {
        const cell = worksheet.getCell(rowNumber, colNumber);
        const cellInfo = getXlsxCellInfo(cell);

        if (cellInfo.recoveredFormula) {
          recoveredFormulas += 1;
        }

        row.push(cellInfo.text);
      }

      grid.push(row);
    }

    return {
      grid,
      recoveredFormulas,
    };
  };

  const handleUploadFile = async (event) => {
    const file = event.target.files?.[0];

    setError("");
    setSuccess("");
    setOutputText("");
    setCopied(false);
    setRecoveredFormulaCount(0);

    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isTxt = fileName.endsWith(".txt") || file.type.includes("text/plain");
    const isCsv = fileName.endsWith(".csv") || file.type.includes("text/csv");
    const isXlsx =
      fileName.endsWith(".xlsx") ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (!isTxt && !isCsv && !isXlsx) {
      setError("Please upload a valid TXT, CSV, or XLSX file.");
      return;
    }

    try {
      if (isXlsx) {
        const result = await readXlsxFile(file);

        if (!result.grid.length) {
          setError("No readable data found in this XLSX file.");
          return;
        }

        setInputText(gridToText(result.grid));
        setRecoveredFormulaCount(result.recoveredFormulas);

        setSuccess(
          result.recoveredFormulas > 0
            ? `XLSX uploaded successfully. ${result.recoveredFormulas} formula phone number(s) were extracted. Click Clean Numbers to process.`
            : "XLSX uploaded successfully. Click Clean Numbers to process."
        );

        return;
      }

      const text = await file.text();

      setInputText(normalizeNewLines(text));
      setSuccess("File uploaded successfully. Click Clean Numbers to process.");
    } catch {
      setError(
        "Failed to read the file. For Google Sheets #ERROR! formula phones, download as Microsoft Excel (.xlsx) and upload that file."
      );
    }
  };

  const handleReset = () => {
    setInputText("");
    setOutputText("");
    setCopied(false);
    setError("");
    setSuccess("");
    setRecoveredFormulaCount(0);

    setRemoveLeadingPlus(true);
    setRemoveLeadingEquals(true);
    setRemoveSpaces(true);
    setRemoveDashes(true);
    setRemoveBrackets(true);
    setKeepOnlyDigits(true);
    setRemoveDuplicates(false);
    setCopyAsSheetText(true);
    setSkipInvalidCells(true);

    setLastStats({
      detectedCells: 0,
      cleanedNumbers: 0,
      invalidCells: 0,
      duplicatesRemoved: 0,
      charactersRemoved: 0,
      formulaPhones: 0,
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
          Clean phone numbers in bulk before pasting into Google Sheets or Excel.
          Fix plus signs, equal signs, spaces, dashes, brackets, tel: text,
          formula-style phone numbers, and leading-zero issues while keeping the
          spreadsheet layout.
        </p>
      </section>

      {/* GUIDE */}
      <section className="card p-6 sm:p-8">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#f4edff] flex items-center justify-center shrink-0">
            <Info size={20} className="text-[var(--primary)]" />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              How to use this tool correctly
            </h2>

            <p className="text-[var(--text-secondary)]">
              Normal phone numbers can be pasted directly. If Google Sheets
              shows <strong>#ERROR!</strong> but the formula bar contains a phone
              number like <strong>=+39 080 937 1243</strong>, normal copy-paste
              may only paste the visible error. For bulk recovery, download the
              sheet as <strong>Microsoft Excel (.xlsx)</strong> and upload it
              here.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <GuideCard
            title="1. Normal paste"
            text="Copy phone numbers from Google Sheets, Excel, TXT, or CSV and paste them into the input box."
          />

          <GuideCard
            title="2. Formula bar paste"
            text="For one or two #ERROR! cells, double-click the cell or copy from the formula bar, then paste the formula text here."
          />

          <GuideCard
            title="3. XLSX upload"
            text="For many #ERROR! formula-phone cells, download your Google Sheet as .xlsx and upload it here."
          />
        </div>
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
                ref={inputAreaRef}
                value={inputText}
                onPaste={handlePaste}
                onChange={(event) => {
                  setInputText(event.target.value);
                  setOutputText("");
                  setCopied(false);
                  setError("");
                  setSuccess("");
                  setRecoveredFormulaCount(0);
                }}
                placeholder={`Paste from Google Sheets, Excel, TXT, CSV, or formula bar:
+8801712345678
=+37 1901 123 1243
=01712345678
="+8801712345678"
080 777104
tel:0444478176
339 783 1690`}
                rows={14}
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
                  checked={skipInvalidCells}
                  onChange={setSkipInvalidCells}
                />
              </div>

              <div className="mt-4 bg-white border border-[var(--border)] rounded-xl p-4">
                <CheckOption
                  label="Copy as Google Sheets text"
                  checked={copyAsSheetText}
                  onChange={setCopyAsSheetText}
                />

                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Recommended. The output box stays clean without visible
                  apostrophes. When you click Copy, the tool tries to preserve
                  leading zeros when pasted into Google Sheets or Excel.
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
                Upload TXT/CSV/XLSX
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.xlsx,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleUploadFile}
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
                Important: CSV export usually keeps the visible #ERROR! value,
                not the hidden formula. For Google Sheets formula-phone errors,
                use XLSX upload.
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
                    Clean output without visible apostrophes.
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
                rows={14}
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
              <StatCard label="Detected Cells" value={lastStats.detectedCells} />
              <StatCard label="Cleaned" value={lastStats.cleanedNumbers} />
              <StatCard label="Invalid Cells" value={lastStats.invalidCells} />
              <StatCard
                label="Duplicates Removed"
                value={lastStats.duplicatesRemoved}
              />
              <StatCard
                label="Characters Removed"
                value={lastStats.charactersRemoved}
              />
              <StatCard
                label="Formula Phones"
                value={lastStats.formulaPhones}
                green
              />
            </div>

            {!outputText && (
              <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                <Phone size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-[var(--text-secondary)]">
                  Paste numbers or upload a file, then click “Clean Numbers”.
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
        onChange={(event) => onChange(event.target.checked)}
        className="w-4 h-4 accent-[var(--primary)]"
      />
      {label}
    </label>
  );
}

function GuideCard({ title, text }) {
  return (
    <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)]">{text}</p>
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