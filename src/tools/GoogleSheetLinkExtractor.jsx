import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Link2,
  Copy,
  RotateCcw,
  Check,
  ClipboardPaste,
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
  Clock3,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Google Sheet Link Extractor",
  path: "/google-sheet-link-extractor",
  category: "Spreadsheet Tools",
  description:
    "Extract hidden hyperlinks from copied Google Sheets cells and export them as CSV or Excel.",
  metaTitle:
    "Google Sheet Link Extractor - Extract Hidden Links from Cells | Next Online Tools",
  metaDescription:
    "Free Google Sheet link extractor tool to extract hidden hyperlinks from copied spreadsheet cells. Paste Google Sheets cells, extract links, copy them, or download CSV/Excel files.",
};

const MIN_PROCESSING_TIME_MS = 700;
const MAX_PROCESSING_TIME_MS = 9000;

const EMPTY_SOURCE = {
  html: "",
  text: "",
  domHtml: "",
  domText: "",
  rtf: "",
  uriList: "",
  extraText: "",
  xlsxMatrix: [],
  xlsxPreviewMatrix: [],
  fileName: "",
};

const EMPTY_RESULT = {
  matrix: [],
  detectedRows: 0,
  detectedColumns: 0,
};

export default function GoogleSheetLinkExtractor() {
  const pasteBoxRef = useRef(null);
  const spreadsheetInputRef = useRef(null);
  const pasteTimerRef = useRef(null);

  const [sourceData, setSourceData] = useState(EMPTY_SOURCE);
  const [parsedResult, setParsedResult] = useState(EMPTY_RESULT);

  const [copySuccess, setCopySuccess] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState(false);

  const [preserveLayout, setPreserveLayout] = useState(false);
  const [extractAllLinks, setExtractAllLinks] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [estimatedProcessingTimeMs, setEstimatedProcessingTimeMs] = useState(0);

  useEffect(() => {
    const hasData = hasSourceData(sourceData);

    if (!hasData) {
      setParsedResult(EMPTY_RESULT);
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingTimeMs(0);
      setEstimatedProcessingTimeMs(0);
      return undefined;
    }

    let cancelled = false;
    let finishTimer = null;
    const startTime = performance.now();
    const estimate = estimateProcessingTimeMs(sourceData);

    setIsProcessing(true);
    setProcessingProgress(8);
    setProcessingTimeMs(0);
    setEstimatedProcessingTimeMs(estimate);
    setParsedResult(EMPTY_RESULT);

    const progressTimer = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(92, Math.round((elapsed / estimate) * 92));
      setProcessingProgress(Math.max(8, progress));
    }, 80);

    const parseTimer = window.setTimeout(() => {
      const result = extractLinksFromSources(sourceData, extractAllLinks);
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, estimate - elapsed);

      finishTimer = window.setTimeout(() => {
        if (cancelled) return;

        const actualTime = Math.max(
          MIN_PROCESSING_TIME_MS,
          Math.round(performance.now() - startTime)
        );

        setParsedResult(result);
        setProcessingTimeMs(actualTime);
        setProcessingProgress(100);
        setIsProcessing(false);

        window.setTimeout(() => {
          if (!cancelled) setProcessingProgress(0);
        }, 700);
      }, remaining);
    }, 30);

    return () => {
      cancelled = true;
      window.clearInterval(progressTimer);
      window.clearTimeout(parseTimer);
      if (finishTimer) window.clearTimeout(finishTimer);
    };
  }, [sourceData, extractAllLinks]);

  useEffect(() => {
    return () => {
      if (pasteTimerRef.current) window.clearTimeout(pasteTimerRef.current);
    };
  }, []);

  const exportMatrix = useMemo(() => {
    if (!parsedResult.matrix.length) return [];

    if (preserveLayout) return parsedResult.matrix;

    return getAllLinksFromMatrix(parsedResult.matrix).map((link) => [link]);
  }, [parsedResult.matrix, preserveLayout]);

  const outputText = useMemo(() => {
    if (!exportMatrix.length) return "";

    if (preserveLayout) return matrixToClipboardText(exportMatrix);

    return exportMatrix.map((row) => row[0]).filter(Boolean).join("\n");
  }, [exportMatrix, preserveLayout]);

  const stats = useMemo(() => {
    const rows = parsedResult.detectedRows || parsedResult.matrix.length;
    const columns =
      parsedResult.detectedColumns ||
      parsedResult.matrix.reduce((max, row) => Math.max(max, row.length), 0);
    const linksFound = getAllLinksFromMatrix(parsedResult.matrix).length;

    return { rows, columns, linksFound };
  }, [parsedResult]);

  const hasOutput = Boolean(outputText) && !isProcessing;
  const hasPastedData = hasSourceData(sourceData);

  function resetActionStates() {
    setCopySuccess(false);
    setCsvSuccess(false);
    setExcelSuccess(false);
  }

  function handlePaste(event) {
    event.preventDefault();

    const clipboardData = event.clipboardData || window.clipboardData;
    const html = clipboardData?.getData("text/html") || "";
    const text = clipboardData?.getData("text/plain") || "";
    const rtf = clipboardData?.getData("text/rtf") || "";
    const uriList = clipboardData?.getData("text/uri-list") || "";
    const extraText = collectExtraClipboardText(clipboardData);

    resetActionStates();

    const previewMatrix = buildPastePreviewMatrix({ text, html });
    const previewHtml = matrixToPreviewHtml(previewMatrix);
    const previewText = matrixToClipboardText(previewMatrix);

    if (pasteTimerRef.current) window.clearTimeout(pasteTimerRef.current);

    if (pasteBoxRef.current) {
      pasteBoxRef.current.innerHTML = previewHtml;
    }

    setSourceData({
      html,
      text,
      domHtml: previewHtml,
      domText: previewText,
      rtf,
      uriList,
      extraText,
    });
  }

  async function handleSpreadsheetFileInputChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    resetActionStates();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, {
        type: "array",
        cellFormula: true,
        cellHTML: true,
        cellText: true,
        raw: false,
      });

      const xlsxMatrix = extractLinksFromWorkbook(workbook, extractAllLinks);
      const xlsxPreviewMatrix = workbookToVisiblePreviewMatrix(workbook);

      const previewHtml = matrixToPreviewHtml(xlsxPreviewMatrix);
      const previewText = matrixToClipboardText(xlsxPreviewMatrix);

      if (pasteBoxRef.current) {
        pasteBoxRef.current.innerHTML =
          previewHtml ||
          `<div style="color:#64748b;padding:16px;">Spreadsheet loaded: ${escapeHtml(file.name)}</div>`;
      }

      setSourceData({
        ...EMPTY_SOURCE,
        domHtml: previewHtml,
        domText: previewText,
        xlsxMatrix,
        xlsxPreviewMatrix,
        fileName: file.name,
      });
    } catch {
      if (pasteBoxRef.current) {
        pasteBoxRef.current.innerHTML =
          '<div style="color:#b91c1c;padding:16px;">Could not read this spreadsheet. Please try XLSX, XLS, or CSV.</div>';
      }
    } finally {
      event.target.value = "";
    }
  }


  async function copyToClipboard() {
    if (!hasOutput) return;

    try {
      await navigator.clipboard.writeText(outputText);
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      fallbackCopy(outputText);
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 2000);
    }
  }

  function downloadCsvFile() {
    if (!exportMatrix.length || isProcessing) return;

    downloadTextFile({
      content: matrixToCsv(exportMatrix),
      fileName: "extracted-google-sheet-links.csv",
      mimeType: "text/csv;charset=utf-8",
    });

    setCsvSuccess(true);
    window.setTimeout(() => setCsvSuccess(false), 2000);
  }

  function downloadExcelFile() {
    if (!exportMatrix.length || isProcessing) return;

    downloadTextFile({
      content: matrixToExcelHtml(exportMatrix),
      fileName: "extracted-google-sheet-links.xls",
      mimeType: "application/vnd.ms-excel;charset=utf-8",
    });

    setExcelSuccess(true);
    window.setTimeout(() => setExcelSuccess(false), 2000);
  }

  function resetTool() {
    if (pasteTimerRef.current) window.clearTimeout(pasteTimerRef.current);

    setSourceData(EMPTY_SOURCE);
    setParsedResult(EMPTY_RESULT);
    resetActionStates();
    setIsProcessing(false);
    setProcessingProgress(0);
    setProcessingTimeMs(0);
    setEstimatedProcessingTimeMs(0);

    if (pasteBoxRef.current) pasteBoxRef.current.innerHTML = "";
  }

  return (
    <div className="flex flex-col gap-8">
      <input
        ref={spreadsheetInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.tsv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/tab-separated-values"
        onChange={handleSpreadsheetFileInputChange}
        className="hidden"
      />
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Link2 size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Google Sheet Link Extractor</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Paste copied Google Sheets cells or upload an XLSX/CSV file to extract hidden hyperlinks into a clean list.
        </p>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Paste Google Sheets cells</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Paste copied cells, or upload XLSX for the most accurate hidden hyperlink extraction.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => spreadsheetInputRef.current?.click()}
                  className="btn-primary inline-flex items-center gap-2 px-3 py-2 text-sm"
                  title="Upload XLSX/CSV for highest accuracy"
                >
                  <Upload size={16} />
                  Upload XLSX
                </button>

                <button
                  type="button"
                  onClick={resetTool}
                  className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"
                >
                  <RotateCcw size={16} />
                  Clear
                </button>
              </div>
            </div>

            <div
              ref={pasteBoxRef}
              onPaste={handlePaste}
              contentEditable
              suppressContentEditableWarning
              className="sheet-paste-box w-full min-h-[420px] p-4 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white overflow-auto"
              data-placeholder="Copy cells from Google Sheets, then paste here..."
            />

            <p className="text-xs text-[var(--text-secondary)] leading-5">
              Most accurate method: File → Download → Microsoft Excel (.xlsx), then upload it here. Paste works when Google Sheets sends the link data to the browser clipboard, but XLSX upload can read real spreadsheet hyperlink metadata.
            </p>

          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Extracted links</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {isProcessing
                    ? "Reading pasted table and hidden hyperlinks..."
                    : `${stats.linksFound} link${stats.linksFound === 1 ? "" : "s"} found${stats.rows ? ` from ${stats.rows} row${stats.rows === 1 ? "" : "s"}` : ""}.`}
                </p>
              </div>

              <button
                type="button"
                onClick={copyToClipboard}
                disabled={!hasOutput}
                className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  hasOutput
                    ? copySuccess
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-white text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary)]/5"
                    : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
              >
                {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                {copySuccess ? "Copied" : "Copy"}
              </button>
            </div>

            {(isProcessing || processingTimeMs > 0) && (
              <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {isProcessing ? (
                      <Loader2 size={18} className="animate-spin text-[var(--primary)]" />
                    ) : (
                      <Clock3 size={18} className="text-[var(--primary)]" />
                    )}
                    <p className="font-semibold text-sm">
                      {isProcessing ? "Processing..." : "Processing completed"}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-[var(--primary)]">
                    {isProcessing
                      ? `Est. ${(estimatedProcessingTimeMs / 1000).toFixed(1)}s`
                      : `${(processingTimeMs / 1000).toFixed(1)}s`}
                  </span>
                </div>

                {isProcessing && (
                  <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary)] transition-all duration-200"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            <textarea
              value={isProcessing ? "" : outputText}
              readOnly
              rows="16"
              className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none bg-gray-50 resize-none font-mono text-sm"
              placeholder={
                isProcessing
                  ? "Processing pasted Google Sheets links..."
                  : "Extracted links will appear here..."
              }
            />

            {!hasPastedData && !isProcessing && (
              <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                <ClipboardPaste size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="text-[var(--text-secondary)]">
                  Paste copied Google Sheets cells to extract links.
                </p>
              </div>
            )}

            {hasOutput && (
              <div className="grid sm:grid-cols-3 gap-3">
                <button type="button" onClick={copyToClipboard} className="btn-primary">
                  {copySuccess ? (
                    <>
                      <Check size={18} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy Links
                    </>
                  )}
                </button>

                <button type="button" onClick={downloadCsvFile} className="btn-secondary">
                  {csvSuccess ? (
                    <>
                      <Check size={18} />
                      CSV Saved
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      CSV
                    </>
                  )}
                </button>

                <button type="button" onClick={downloadExcelFile} className="btn-secondary">
                  {excelSuccess ? (
                    <>
                      <Check size={18} />
                      Excel Saved
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet size={18} />
                      Excel
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`
        .sheet-paste-box:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
        .sheet-paste-box table {
          border-collapse: collapse;
          width: max-content;
          max-width: 100%;
          background: white;
        }
        .sheet-paste-box td,
        .sheet-paste-box th {
          border: 1px solid #e5e7eb;
          padding: 8px 10px;
          min-width: 130px;
          vertical-align: top;
        }
        .sheet-paste-box a {
          color: var(--primary);
          text-decoration: underline;
        }
      `}</style>

      <SuggestedTools currentToolId="google-sheet-link-extractor" />
    </div>
  );
}

function hasSourceData(sourceData) {
  return Boolean(
    sourceData.html ||
      sourceData.text ||
      sourceData.domHtml ||
      sourceData.domText ||
      sourceData.rtf ||
      sourceData.uriList ||
      sourceData.extraText ||
      sourceData.xlsxMatrix?.length
  );
}

function collectExtraClipboardText(clipboardData) {
  if (!clipboardData?.types) return "";

  return Array.from(clipboardData.types)
    .filter((type) => /^text\//i.test(type) && !["text/html", "text/plain"].includes(type))
    .map((type) => {
      try {
        return clipboardData.getData(type) || "";
      } catch {
        return "";
      }
    })
    .filter(Boolean)
    .join("\n");
}

function buildPastePreviewMatrix({ text, html }) {
  const textMatrix = textToMatrix(text);

  if (hasVisibleMatrixData(textMatrix)) {
    return textMatrix;
  }

  const htmlMatrix = htmlToVisibleTextMatrix(html);

  if (hasVisibleMatrixData(htmlMatrix)) {
    return htmlMatrix;
  }

  const fallbackText = stripHtmlToText(html || text || "").trim();

  return fallbackText ? [[fallbackText]] : [];
}

function hasVisibleMatrixData(matrix) {
  return Array.isArray(matrix) && matrix.some((row) =>
    Array.isArray(row) && row.some((cell) => String(cell || "").trim())
  );
}

function textToMatrix(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .filter((row, index, rows) => row.trim() || index < rows.length - 1)
    .map((row) => row.split("\t").map((cell) => String(cell || "").trim()));
}

function htmlToVisibleTextMatrix(html) {
  if (!html) return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(html), "text/html");
    const table = doc.querySelector("table");

    if (!table) {
      const text = doc.body?.innerText?.trim() || "";
      return text ? textToMatrix(text) : [];
    }

    return Array.from(table.querySelectorAll("tr")).map((tr) =>
      Array.from(tr.children)
        .filter((cell) => ["TD", "TH"].includes(cell.tagName))
        .map((cell) => String(cell.innerText || cell.textContent || "").trim())
    );
  } catch {
    return [];
  }
}

function matrixToPreviewHtml(matrix) {
  if (!matrix?.length) {
    return "";
  }

  const maxColumns = matrix.reduce((max, row) => Math.max(max, row.length), 0);

  const rows = matrix
    .map((row) => {
      const cells = Array.from({ length: maxColumns }).map((_, index) => {
        const value = row[index] || "";

        return `<td style="border:1px solid #eee;padding:9px 12px;min-width:220px;white-space:nowrap;">${escapeHtml(value)}</td>`;
      });

      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");

  return `<table style="border-collapse:collapse;width:max-content;min-width:100%;font-size:15px;line-height:1.45;">${rows}</table>`;
}

function stripHtmlToText(html) {
  if (!html) return "";

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(html), "text/html");
    return doc.body?.innerText || "";
  } catch {
    return String(html).replace(/<[^>]+>/g, " ");
  }
}

function extractLinksFromWorkbook(workbook, extractAllLinks) {
  const sheetName = workbook?.SheetNames?.[0];

  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rangeText = sheet?.["!ref"];

  if (!sheet || !rangeText) return [];

  const range = XLSX.utils.decode_range(rangeText);
  const matrix = [];

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const row = [];

    for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      const cell = sheet[address];
      const links = extractLinksFromWorkbookCell(cell);

      row.push(formatCellLinks(links, extractAllLinks));
    }

    matrix.push(row);
  }

  return normalizeMatrix(matrix);
}

function extractLinksFromWorkbookCell(cell) {
  if (!cell) return [];

  const candidates = [];

  if (cell.l?.Target) candidates.push(cell.l.Target);
  if (cell.l?.Tooltip) candidates.push(cell.l.Tooltip);
  if (cell.f) candidates.push(cell.f);
  if (cell.v !== undefined) candidates.push(String(cell.v));
  if (cell.w !== undefined) candidates.push(String(cell.w));
  if (cell.h !== undefined) candidates.push(String(cell.h));
  if (cell.r !== undefined) candidates.push(String(cell.r));

  try {
    candidates.push(JSON.stringify(cell));
  } catch {
    // Ignore circular workbook cell objects.
  }

  return uniqueLinks(
    candidates
      .flatMap((candidate) => extractLinksFromValue(candidate))
      .map(cleanUrl)
      .filter(Boolean)
  );
}

function workbookToVisiblePreviewMatrix(workbook) {
  const sheetName = workbook?.SheetNames?.[0];

  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rangeText = sheet?.["!ref"];

  if (!sheet || !rangeText) return [];

  const range = XLSX.utils.decode_range(rangeText);
  const matrix = [];

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const row = [];

    for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      const cell = sheet[address];

      row.push(getWorkbookCellDisplayValue(cell));
    }

    matrix.push(row);
  }

  return trimEmptyMatrix(matrix);
}

function getWorkbookCellDisplayValue(cell) {
  if (!cell) return "";
  if (cell.w !== undefined) return String(cell.w);
  if (cell.v !== undefined) return String(cell.v);
  if (cell.f !== undefined) return String(cell.f);
  return "";
}

function trimEmptyMatrix(matrix) {
  const rows = (matrix || []).map((row) => row.map((cell) => String(cell || "")));
  const lastRowIndex = rows.reduce(
    (last, row, index) => row.some((cell) => cell.trim()) ? index : last,
    -1
  );

  if (lastRowIndex < 0) return [];

  const trimmedRows = rows.slice(0, lastRowIndex + 1);
  const lastColumnIndex = trimmedRows.reduce((last, row) => {
    const rowLast = row.reduce(
      (cellLast, cell, index) => cell.trim() ? index : cellLast,
      -1
    );

    return Math.max(last, rowLast);
  }, -1);

  return trimmedRows.map((row) => row.slice(0, lastColumnIndex + 1));
}

function matrixColumnCount(matrix) {
  return (matrix || []).reduce((max, row) => Math.max(max, row.length), 0);
}

function estimateProcessingTimeMs(sourceData) {
  const raw = Object.values(sourceData || {})
    .map((value) => Array.isArray(value) ? matrixToClipboardText(value) : value)
    .join("\n");
  const rows = Math.max(1, (sourceData.text || sourceData.domText || "").split(/\r?\n/).filter(Boolean).length);
  const possibleLinks = (raw.match(/https?:\/\/|www\.|mailto:|tel:|HYPERLINK\s*\(/gi) || []).length;
  const estimated = MIN_PROCESSING_TIME_MS + raw.length * 0.03 + rows * 10 + possibleLinks * 35;

  return clampNumber(Math.round(estimated), MIN_PROCESSING_TIME_MS, MAX_PROCESSING_TIME_MS);
}

function extractLinksFromSources(sourceData, extractAllLinks) {
  const matrices = [
    sourceData.xlsxMatrix?.length ? sourceData.xlsxMatrix : [],
    sourceData.html ? extractLinksFromHtml(sourceData.html, extractAllLinks) : [],
    sourceData.domHtml ? extractLinksFromHtml(sourceData.domHtml, extractAllLinks) : [],
    sourceData.text ? extractLinksFromPlainText(sourceData.text, extractAllLinks) : [],
    sourceData.domText ? extractLinksFromPlainText(sourceData.domText, extractAllLinks) : [],
    sourceData.rtf ? extractLinksFromRtf(sourceData.rtf, extractAllLinks) : [],
    sourceData.uriList ? extractLinksFromPlainText(sourceData.uriList, extractAllLinks) : [],
    sourceData.extraText ? extractLinksFromPlainText(sourceData.extraText, extractAllLinks) : [],
  ];

  const matrix = normalizeMatrix(mergeMatricesByCell(matrices, extractAllLinks));
  const detectedRows = Math.max(
    matrix.length,
    countRowsFromText(sourceData.text),
    countRowsFromText(sourceData.domText),
    sourceData.xlsxPreviewMatrix?.length || 0,
    sourceData.xlsxMatrix?.length || 0
  );
  const detectedColumns = Math.max(
    matrix.reduce((max, row) => Math.max(max, row.length), 0),
    countColumnsFromText(sourceData.text),
    countColumnsFromText(sourceData.domText),
    matrixColumnCount(sourceData.xlsxPreviewMatrix || []),
    matrixColumnCount(sourceData.xlsxMatrix || [])
  );

  return { matrix, detectedRows, detectedColumns };
}

function extractLinksFromHtml(html, extractAllLinks) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const tables = Array.from(doc.querySelectorAll("table"));

  if (!tables.length) {
    const links = extractLinksFromElement(doc.body, extractAllLinks);
    return links ? [[links]] : [];
  }

  const table = tables.sort((a, b) => b.querySelectorAll("td,th").length - a.querySelectorAll("td,th").length)[0];
  const rows = Array.from(table.querySelectorAll("tr"));
  const grid = [];

  rows.forEach((tr, rowIndex) => {
    if (!grid[rowIndex]) grid[rowIndex] = [];

    let colIndex = 0;
    const cells = Array.from(tr.children).filter((child) => ["TD", "TH"].includes(child.tagName));

    cells.forEach((cell) => {
      while (grid[rowIndex][colIndex] !== undefined) colIndex += 1;

      const value = extractLinksFromElement(cell, extractAllLinks);
      const colSpan = Number(cell.getAttribute("colspan")) || 1;
      const rowSpan = Number(cell.getAttribute("rowspan")) || 1;

      for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
        const targetRow = rowIndex + rowOffset;
        if (!grid[targetRow]) grid[targetRow] = [];

        for (let colOffset = 0; colOffset < colSpan; colOffset += 1) {
          grid[targetRow][colIndex + colOffset] = rowOffset === 0 && colOffset === 0 ? value : "";
        }
      }

      colIndex += colSpan;
    });
  });

  return grid;
}

function extractLinksFromElement(element, extractAllLinks) {
  if (!element) return "";

  const candidates = [];
  const anchors = Array.from(element.querySelectorAll("a[href]"));

  anchors.forEach((anchor) => {
    candidates.push(anchor.getAttribute("href") || "");
    candidates.push(anchor.getAttribute("data-href") || "");
    candidates.push(anchor.textContent || "");
    candidates.push(anchor.getAttribute("title") || "");
    candidates.push(anchor.getAttribute("aria-label") || "");
  });

  const nodes = [element, ...Array.from(element.querySelectorAll("*"))];

  nodes.forEach((node) => {
    Array.from(node.attributes || []).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value || "";

      if (
        name.includes("href") ||
        name.includes("url") ||
        name.includes("link") ||
        name.includes("formula") ||
        name.includes("data") ||
        name.includes("title") ||
        name.includes("aria") ||
        hasLinkSignal(value)
      ) {
        candidates.push(value);
      }
    });
  });

  try {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_COMMENT);
    let comment = walker.nextNode();
    while (comment) {
      candidates.push(comment.nodeValue || "");
      comment = walker.nextNode();
    }
  } catch {
    // Ignore comment scanning if unavailable.
  }

  candidates.push(element.textContent || "");

  return formatCellLinks(
    candidates.flatMap(extractLinksFromValue).map(cleanUrl).filter(Boolean),
    extractAllLinks
  );
}

function extractLinksFromPlainText(text, extractAllLinks) {
  return String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((row) =>
      row.split("\t").map((cell) =>
        formatCellLinks(extractLinksFromValue(cell).map(cleanUrl).filter(Boolean), extractAllLinks)
      )
    );
}

function extractLinksFromRtf(rtf, extractAllLinks) {
  const text = String(rtf || "");
  const links = [];
  const fieldRegex = /HYPERLINK\s+"([^"]+)"/gi;
  let match = fieldRegex.exec(text);

  while (match) {
    links.push(match[1]);
    match = fieldRegex.exec(text);
  }

  links.push(...extractLinksFromValue(text));

  const formatted = formatCellLinks(links.map(cleanUrl).filter(Boolean), extractAllLinks);
  return formatted ? [[formatted]] : [];
}

function extractLinksFromValue(value) {
  if (!value) return [];

  const raw = String(value);
  const variants = uniqueLinks([
    raw,
    normalizeEscapedText(raw),
    decodeHtmlEntities(raw),
    decodeHtmlEntities(normalizeEscapedText(raw)),
    safeDecodeRepeated(raw),
    safeDecodeRepeated(decodeHtmlEntities(raw)),
    safeDecodeRepeated(normalizeEscapedText(raw)),
  ]);

  return uniqueLinks(
    variants.flatMap((variant) => [
      ...extractHyperlinkFormulaTargets(variant),
      ...extractStringsFromJsonLike(variant),
      ...findUrls(variant),
    ])
  );
}

function extractHyperlinkFormulaTargets(value) {
  const links = [];
  const regex = /HYPERLINK\s*\(\s*(?:"([^"]+)"|'([^']+)'|([^,;)]+))/gi;
  let match = regex.exec(String(value || ""));

  while (match) {
    links.push((match[1] || match[2] || match[3] || "").trim());
    match = regex.exec(String(value || ""));
  }

  return links;
}

function extractStringsFromJsonLike(value) {
  const text = String(value || "").trim();
  if (!text || (!text.startsWith("{") && !text.startsWith("["))) return [];

  try {
    const parsed = JSON.parse(text);
    const strings = [];

    function walk(item) {
      if (typeof item === "string") {
        if (hasLinkSignal(item)) strings.push(item);
        return;
      }

      if (Array.isArray(item)) {
        item.forEach(walk);
        return;
      }

      if (item && typeof item === "object") Object.values(item).forEach(walk);
    }

    walk(parsed);
    return strings.flatMap(findUrls);
  } catch {
    return [];
  }
}

function findUrls(value) {
  if (!value) return [];

  const urlRegex =
    /(?:https?:\/\/|ftp:\/\/|www\.|mailto:|tel:)[^\s"'<>]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s"'<>]*)?/gi;

  const matches = String(value).match(urlRegex) || [];

  return matches.filter((item) => {
    const lower = item.toLowerCase();
    if (lower.startsWith("http://")) return true;
    if (lower.startsWith("https://")) return true;
    if (lower.startsWith("ftp://")) return true;
    if (lower.startsWith("www.")) return true;
    if (lower.startsWith("mailto:")) return true;
    if (lower.startsWith("tel:")) return true;
    if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(item)) return true;
    return isBareDomain(item);
  });
}

function cleanUrl(url, depth = 0) {
  if (!url) return "";

  let clean = normalizeEscapedText(decodeHtmlEntities(String(url)))
    .trim()
    .replace(/^[<("'[\s]+/g, "")
    .replace(/[>)"'\]\s]+$/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");

  clean = fixEncodedProtocol(clean);
  clean = safeDecodeRepeated(clean);
  clean = trimTrailingUrlPunctuation(clean);

  if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(clean)) clean = `mailto:${clean}`;
  if (clean.startsWith("//")) clean = `https:${clean}`;
  if (clean.startsWith("www.")) clean = `https://${clean}`;
  if (isBareDomain(clean)) clean = `https://${clean}`;

  if (depth < 2) {
    const redirectTarget = extractRedirectTarget(clean);
    if (redirectTarget && redirectTarget !== clean) clean = cleanUrl(redirectTarget, depth + 1);
  }

  return isUsefulLink(clean) ? clean : "";
}

function extractRedirectTarget(url) {
  try {
    if (!/^https?:\/\//i.test(url)) return "";

    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const target =
      parsed.searchParams.get("q") ||
      parsed.searchParams.get("url") ||
      parsed.searchParams.get("u") ||
      parsed.searchParams.get("target") ||
      parsed.searchParams.get("redirect") ||
      parsed.searchParams.get("to");

    if (
      target &&
      (host.includes("google.") ||
        host.includes("facebook.") ||
        host.includes("linkedin.") ||
        host.includes("instagram.") ||
        host.includes("l.facebook.") ||
        host.includes("lnkd.in"))
    ) {
      return target;
    }
  } catch {
    return "";
  }

  return "";
}

function mergeMatricesByCell(matrices, extractAllLinks) {
  const validMatrices = matrices.filter((matrix) => matrix?.length);
  if (!validMatrices.length) return [];

  const maxRows = validMatrices.reduce((max, matrix) => Math.max(max, matrix.length), 0);
  const output = [];

  for (let rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
    const maxColumns = validMatrices.reduce((max, matrix) => Math.max(max, (matrix[rowIndex] || []).length), 0);
    const row = [];

    for (let colIndex = 0; colIndex < maxColumns; colIndex += 1) {
      const mergedLinks = uniqueLinks(
        validMatrices.flatMap((matrix) => getLinksFromCell((matrix[rowIndex] || [])[colIndex] || ""))
      );

      row.push(formatCellLinks(mergedLinks, extractAllLinks));
    }

    output.push(row);
  }

  return getAllLinksFromMatrix(output).length ? output : validMatrices[0];
}

function getLinksFromCell(cell) {
  if (!cell) return [];

  return uniqueLinks(
    String(cell)
      .split(" | ")
      .flatMap(extractLinksFromValue)
      .map(cleanUrl)
      .filter(Boolean)
  );
}

function getAllLinksFromMatrix(matrix) {
  return uniqueLinks((matrix || []).flat().flatMap(getLinksFromCell).filter(Boolean));
}

function formatCellLinks(links, extractAllLinks) {
  const cleanLinks = uniqueLinks((links || []).map(cleanUrl).filter(Boolean));
  if (!cleanLinks.length) return "";
  return extractAllLinks ? cleanLinks.join(" | ") : cleanLinks[0];
}

function hasLinkSignal(value) {
  const text = String(value || "");
  return (
    /https?:\/\//i.test(text) ||
    /https?:%2f%2f/i.test(text) ||
    /www\./i.test(text) ||
    /mailto:/i.test(text) ||
    /tel:/i.test(text) ||
    /HYPERLINK\s*\(/i.test(text) ||
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)
  );
}

function isUsefulLink(value) {
  if (!value) return false;
  const lower = value.toLowerCase();

  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:") ||
    lower.startsWith("blob:") ||
    lower.startsWith("chrome:")
  ) {
    return false;
  }

  return (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("ftp://") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:")
  );
}

function isBareDomain(value) {
  const text = String(value || "").trim();
  if (!/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/.*)?$/i.test(text)) return false;
  if (/^\d+\.\d+$/.test(text)) return false;
  if (text.includes("..")) return false;
  return true;
}

function normalizeMatrix(matrix) {
  if (!matrix.length) return [];
  const maxColumns = matrix.reduce((max, row) => Math.max(max, row.length), 0);
  return matrix.map((row) => {
    const normalizedRow = [...row];
    while (normalizedRow.length < maxColumns) normalizedRow.push("");
    return normalizedRow;
  });
}

function matrixToClipboardText(matrix) {
  return matrix
    .map((row) =>
      row
        .map((cell) => String(cell || "").replace(/\t/g, " ").replace(/\r?\n/g, " ").trim())
        .join("\t")
    )
    .join("\n");
}

function matrixToCsv(matrix) {
  return matrix.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

function escapeCsvCell(value) {
  const text = String(value || "").replace(/\r?\n/g, " ");
  return `"${text.replace(/"/g, '""')}"`;
}

function matrixToExcelHtml(matrix) {
  const rows = matrix
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8" /><style>td { mso-number-format:"\\@"; }</style></head><body><table>${rows}</table></body></html>`;
}

function downloadTextFile({ content, fileName, mimeType }) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function normalizeEscapedText(value) {
  return String(value || "")
    .replace(/\\u0026/gi, "&")
    .replace(/\\u003d/gi, "=")
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&");
}

function fixEncodedProtocol(value) {
  return String(value || "")
    .replace(/^https:%2f%2f/i, "https://")
    .replace(/^http:%2f%2f/i, "http://")
    .replace(/^ftp:%2f%2f/i, "ftp://");
}

function trimTrailingUrlPunctuation(value) {
  let output = String(value || "");
  while (/[),.;\]}]$/.test(output)) {
    const last = output.slice(-1);
    if (last === ")" && countCharacter(output, "(") >= countCharacter(output, ")")) break;
    if (last === "]" && countCharacter(output, "[") >= countCharacter(output, "]")) break;
    if (last === "}" && countCharacter(output, "{") >= countCharacter(output, "}")) break;
    output = output.slice(0, -1);
  }
  return output;
}

function countCharacter(value, character) {
  return String(value || "").split(character).length - 1;
}

function decodeHtmlEntities(value) {
  if (!value) return "";
  const map = {
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&#x27;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
  };
  return String(value).replace(/&(amp|quot|lt|gt|nbsp);|&#39;|&#x27;/g, (match) => map[match] || match);
}

function safeDecodeRepeated(value) {
  let output = String(value || "");
  for (let index = 0; index < 2; index += 1) {
    try {
      const decoded = decodeURIComponent(output);
      if (decoded === output) break;
      output = decoded;
    } catch {
      break;
    }
  }
  return output;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function uniqueLinks(links) {
  const seen = new Set();
  const output = [];

  (links || []).forEach((link) => {
    const value = String(link || "").trim();
    if (!value) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    output.push(value);
  });

  return output;
}

function countRowsFromText(text) {
  return String(text || "").split(/\r?\n/).filter((row) => row.trim()).length;
}

function countColumnsFromText(text) {
  return String(text || "")
    .split(/\r?\n/)
    .reduce((max, row) => Math.max(max, row.split("\t").length), 0);
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (Number.isNaN(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
