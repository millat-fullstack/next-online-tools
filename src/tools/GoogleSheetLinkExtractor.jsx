import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Clock3,
  Copy,
  Download,
  FileSpreadsheet,
  Link2,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Google Sheet Links Extractor",
  path: "/google-sheet-links-extractor",
  category: "Spreadsheet Tools",
  description:
    "Paste Google Sheets hyperlinked text and extract links into the same row order with Not found for cells without links.",
  metaTitle: "Google Sheet Links Extractor - Extract Google Sheets Hyperlinks",
  metaDescription:
    "Extract hyperlinks from Google Sheets cells. Paste hyperlinked text or upload XLSX, then copy a clean two-column TSV with Text and Link in the same row order.",
};

const MIN_PROCESSING_TIME_MS = 900;
const MAX_PROCESSING_TIME_MS = 12000;
const NOT_FOUND = "Not found";

const APPS_SCRIPT = `function extractSelectedLinksTwoColumns() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getActiveRange();
  const richTextValues = range.getRichTextValues();
  const displayValues = range.getDisplayValues();
  const output = [];

  for (let r = 0; r < displayValues.length; r++) {
    const text = displayValues[r][0] || (richTextValues[r][0] ? richTextValues[r][0].getText() : "");
    const richText = richTextValues[r][0];
    const links = [];

    if (richText) {
      const mainLink = richText.getLinkUrl();
      if (mainLink) links.push(mainLink);

      const runs = richText.getRuns();
      for (let i = 0; i < runs.length; i++) {
        const runLink = runs[i].getLinkUrl();
        if (runLink && links.indexOf(runLink) === -1) links.push(runLink);
      }
    }

    if (!String(text).trim() && !links.length) {
      output.push(["", ""]);
    } else {
      output.push([text, links.length ? links.join("\\n") : "Not found"]);
    }
  }

  const outputSheetName = "Extracted Links";
  let outputSheet = SpreadsheetApp.getActive().getSheetByName(outputSheetName);
  if (!outputSheet) outputSheet = SpreadsheetApp.getActive().insertSheet(outputSheetName);

  outputSheet.clear();
  outputSheet.getRange(1, 1, output.length, 2).setValues(output);
}`;

export default function GoogleSheetLinksExtractor() {
  const pasteBoxRef = useRef(null);
  const fileInputRef = useRef(null);
  const timersRef = useRef([]);

  const [inputCells, setInputCells] = useState([]);
  const [inputSource, setInputSource] = useState("");
  const [outputRows, setOutputRows] = useState([]);

  const [pairNameUrlColumns, setPairNameUrlColumns] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [showScript, setShowScript] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [estimatedTimeMs, setEstimatedTimeMs] = useState(0);
  const [progress, setProgress] = useState(0);

  const [error, setError] = useState("");

  useEffect(() => {
    clearTimers();

    if (!inputCells.length) {
      setOutputRows([]);
      setIsProcessing(false);
      setProcessingTimeMs(0);
      setEstimatedTimeMs(0);
      setProgress(0);
      return undefined;
    }

    const startTime = performance.now();
    const estimate = estimateProcessingTime(inputCells);

    setIsProcessing(true);
    setProgress(8);
    setProcessingTimeMs(0);
    setEstimatedTimeMs(estimate);
    setOutputRows([]);

    const progressTimer = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const nextProgress = Math.min(94, Math.round((elapsed / estimate) * 94));
      setProgress(Math.max(8, nextProgress));
    }, 80);

    const finishTimer = window.setTimeout(() => {
      try {
        const rows = buildTwoColumnOutputRows(inputCells, {
          pairNameUrlColumns,
        });

        setOutputRows(rows);
        setProcessingTimeMs(Math.max(1, Math.round(performance.now() - startTime)));
        setProgress(100);
      } catch {
        setError("Could not process this data. Clear and try again, or upload XLSX.");
        setOutputRows([]);
      } finally {
        setIsProcessing(false);
        window.setTimeout(() => setProgress(0), 650);
      }
    }, estimate);

    timersRef.current = [progressTimer, finishTimer];

    return () => clearTimers();
  }, [inputCells, pairNameUrlColumns]);

  useEffect(() => () => clearTimers(), []);

  const stats = useMemo(() => {
    const rows = inputCells.length;
    const columns = inputCells.reduce((max, row) => Math.max(max, row.length), 0);
    const inputFilled = inputCells
      .flat()
      .filter((cell) => cell?.text || cell?.links?.length).length;
    const linksFound = outputRows.filter((row) => row.link && row.link !== NOT_FOUND).length;
    const notFound = outputRows.filter((row) => row.text && row.link === NOT_FOUND).length;
    const blankRows = outputRows.filter((row) => !row.text && !row.link).length;

    return {
      rows,
      columns,
      inputFilled,
      linksFound,
      notFound,
      blankRows,
      source: inputSource,
    };
  }, [inputCells, inputSource, outputRows]);

  const outputTsv = useMemo(() => rowsToTwoColumnTsv(outputRows), [outputRows]);
  const hasOutput = outputRows.length > 0 && !isProcessing;

  function clearTimers() {
    timersRef.current.forEach((timer) => {
      window.clearInterval(timer);
      window.clearTimeout(timer);
    });
    timersRef.current = [];
  }

  function resetActionStates() {
    setCopySuccess(false);
    setDownloadSuccess(false);
    setExcelSuccess(false);
    setScriptCopied(false);
  }

  function handlePaste(event) {
    event.preventDefault();
    setError("");
    resetActionStates();

    try {
      const clipboard = event.clipboardData || window.clipboardData;
      const html = clipboard?.getData("text/html") || "";
      const text = clipboard?.getData("text/plain") || "";
      const rtf = clipboard?.getData("text/rtf") || "";
      const uriList = clipboard?.getData("text/uri-list") || "";
      const extraText = collectExtraClipboardText(clipboard);

      const htmlCells = html ? parseHtmlToCells(html) : [];
      const textCells = text ? parsePlainTextToCells(text) : [];
      const uriCells = uriList ? parsePlainTextToCells(uriList) : [];
      const extraCells = extraText ? parsePlainTextToCells(extraText) : [];
      const rtfLinks = rtf ? extractLinksFromValue(rtf) : [];

      let mergedCells = mergeCellMatrices([htmlCells, textCells, uriCells, extraCells]);

      if (!mergedCells.length && rtfLinks.length) {
        mergedCells = [rtfLinks.map((link) => makeCell(link, [link], {}))];
      }

      if (rtfLinks.length && mergedCells.length) {
        mergedCells = applySequentialLinksToTextCells(mergedCells, rtfLinks);
      }

      mergedCells = addAdjacentUrlLinks(mergedCells);

      if (!mergedCells.length) {
        setError("No spreadsheet cells found. Copy cells from Google Sheets and paste again.");
        return;
      }

      if (pasteBoxRef.current) {
        pasteBoxRef.current.innerHTML = buildPreviewTableHtml(mergedCells);
      }

      const sourceTypes = Array.from(clipboard?.types || []).join(", ");
      setInputCells(mergedCells);
      setInputSource(sourceTypes ? `Smart paste: ${sourceTypes}` : "Smart paste");
    } catch {
      setError("Paste failed. Please clear and try again, or upload XLSX.");
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    resetActionStates();

    try {
      const fileName = file.name.toLowerCase();
      let cells = [];

      if (fileName.endsWith(".csv") || fileName.endsWith(".tsv")) {
        const text = await file.text();
        cells = parsePlainTextToCells(text);
      } else {
        cells = await readSpreadsheetWithExcelJs(file);
      }

      cells = addAdjacentUrlLinks(cells);

      if (!cells.length) {
        setError("No cells found in this file.");
        return;
      }

      if (pasteBoxRef.current) {
        pasteBoxRef.current.innerHTML = buildPreviewTableHtml(cells);
      }

      setInputCells(cells);
      setInputSource(file.name || "Uploaded spreadsheet");
    } catch {
      setError("Could not read this file. Please upload XLSX, XLS, CSV, or TSV.");
    } finally {
      event.target.value = "";
    }
  }

  async function copyResult() {
    if (!hasOutput) return;

    try {
      await navigator.clipboard.writeText(outputTsv);
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      fallbackCopy(outputTsv);
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 2000);
    }
  }

  function downloadTsv() {
    if (!hasOutput) return;

    downloadTextFile({
      content: outputTsv,
      fileName: "google-sheet-links-two-column-output.tsv",
      mimeType: "text/tab-separated-values;charset=utf-8",
    });

    setDownloadSuccess(true);
    window.setTimeout(() => setDownloadSuccess(false), 2000);
  }

  async function downloadExcel() {
    if (!hasOutput) return;

    try {
      const ExcelJS = await getExcelJs();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Extracted Links");

      outputRows.forEach((row) => {
        const excelRow = worksheet.addRow([row.text || "", row.link || ""]);
        const linkCell = excelRow.getCell(2);

        if (row.link && row.link !== NOT_FOUND) {
          linkCell.value = {
            text: row.link,
            hyperlink: row.link.split("\n")[0],
          };
          linkCell.font = {
            color: { argb: "FF2563EB" },
            underline: true,
          };
        }
      });

      worksheet.columns = [{ width: 36 }, { width: 68 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      downloadBlob(blob, "google-sheet-links-two-column-output.xlsx");

      setExcelSuccess(true);
      window.setTimeout(() => setExcelSuccess(false), 2000);
    } catch {
      setError("Could not create Excel file. Please use Copy Result or Download TSV.");
    }
  }

  async function copyAppsScript() {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT);
      setScriptCopied(true);
      window.setTimeout(() => setScriptCopied(false), 2000);
    } catch {
      fallbackCopy(APPS_SCRIPT);
      setScriptCopied(true);
      window.setTimeout(() => setScriptCopied(false), 2000);
    }
  }

  function resetTool() {
    clearTimers();
    setInputCells([]);
    setInputSource("");
    setOutputRows([]);
    setError("");
    setIsProcessing(false);
    setProcessingTimeMs(0);
    setEstimatedTimeMs(0);
    setProgress(0);
    resetActionStates();

    if (pasteBoxRef.current) {
      pasteBoxRef.current.innerHTML = "";
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.tsv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/tab-separated-values"
        onChange={handleFileUpload}
        className="hidden"
      />

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Link2 size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Google Sheet Links Extractor</h1>

        <p className="text-[var(--text-secondary)] max-w-3xl">
          Paste copied Google Sheets cells and get a clean two-column output:
          original text on the left and extracted link on the right. Empty input
          rows stay empty, and text without a link becomes <strong>Not found</strong>.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Paste Google Sheets cells</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Copy cells from Google Sheets, click below, and press Ctrl + V.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary inline-flex items-center gap-2 px-3 py-2 text-sm"
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
              className="sheet-paste-zone min-h-[320px] w-full overflow-auto rounded-2xl border border-[var(--border)] bg-white p-4 outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
              data-placeholder="Paste Google Sheets cells here..."
            />

            {error && (
              <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex gap-3">
              <ShieldCheck size={18} className="text-blue-700 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-5">
                Paste mode extracts every link that Google Sheets sends to the browser clipboard.
                If Google Sheets hides URLs, upload XLSX or use the Apps Script helper.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Input rows" value={stats.rows} />
              <StatCard label="Input cells" value={stats.inputFilled} />
              <StatCard label="Links" value={stats.linksFound} />
              <StatCard label="Not found" value={stats.notFound} />
            </div>

            <PreviewCard cells={inputCells} source={stats.source} />
          </div>

          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Two-column result</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Same row order as input. Copy and paste directly into Google Sheets.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
              <input
                type="checkbox"
                checked={pairNameUrlColumns}
                onChange={(event) => setPairNameUrlColumns(event.target.checked)}
                className="mt-1 accent-[var(--primary)]"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Pair adjacent URL column
                </span>
                <span className="block text-xs text-[var(--text-secondary)] mt-1">
                  If a name is beside a URL cell, output the name with that URL.
                </span>
              </span>
            </label>

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
                      {isProcessing ? "Processing links..." : "Processing completed"}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-[var(--primary)]">
                    {isProcessing
                      ? `Est. ${(estimatedTimeMs / 1000).toFixed(1)}s`
                      : `${(processingTimeMs / 1000).toFixed(1)}s`}
                  </span>
                </div>

                {isProcessing && (
                  <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary)] transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            <OutputPreview rows={outputRows} isProcessing={isProcessing} />

            <textarea
              value={isProcessing ? "Processing links..." : outputTsv || "Vito Garofalo\tNot found"}
              readOnly
              rows={10}
              className="min-h-[220px] w-full rounded-2xl border border-[var(--border)] bg-gray-50 p-4 font-mono text-sm outline-none resize-none"
            />

            <div className="grid sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={copyResult}
                disabled={!hasOutput}
                className={`btn-primary inline-flex items-center justify-center gap-2 ${
                  !hasOutput ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                {copySuccess ? "Copied" : "Copy Result"}
              </button>

              <button
                type="button"
                onClick={downloadTsv}
                disabled={!hasOutput}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  !hasOutput ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {downloadSuccess ? <Check size={18} /> : <Download size={18} />}
                {downloadSuccess ? "Saved" : "TSV"}
              </button>

              <button
                type="button"
                onClick={downloadExcel}
                disabled={!hasOutput}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  !hasOutput ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {excelSuccess ? <Check size={18} /> : <FileSpreadsheet size={18} />}
                {excelSuccess ? "Saved" : "Excel"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-4 sm:p-6">
        <button
          type="button"
          onClick={() => setShowScript((current) => !current)}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <span className="font-bold">Apps Script helper for maximum accuracy</span>
          {showScript ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showScript && (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Use this when paste mode cannot access hidden links. It reads the selected
              Google Sheets cells directly and creates a two-column output sheet.
            </p>

            <pre className="bg-[#111827] text-white rounded-2xl p-4 overflow-auto text-xs leading-6 max-h-[320px]">
              {APPS_SCRIPT}
            </pre>

            <button
              type="button"
              onClick={copyAppsScript}
              className="btn-secondary inline-flex items-center gap-2 mt-4"
            >
              {scriptCopied ? <Check size={18} /> : <Copy size={18} />}
              {scriptCopied ? "Script copied" : "Copy Apps Script"}
            </button>
          </div>
        )}
      </section>

      <style>{`
        .sheet-paste-zone:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
        .sheet-preview-table,
        .sheet-paste-zone table,
        .sheet-output-table {
          border-collapse: collapse;
          width: max-content;
          min-width: 100%;
          background: white;
          font-size: 14px;
          line-height: 1.45;
        }
        .sheet-preview-table td,
        .sheet-preview-table th,
        .sheet-paste-zone td,
        .sheet-paste-zone th,
        .sheet-output-table td,
        .sheet-output-table th {
          border: 1px solid #e5e7eb;
          padding: 8px 10px;
          min-width: 180px;
          max-width: 460px;
          vertical-align: top;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sheet-preview-table a,
        .sheet-paste-zone a,
        .sheet-output-table a {
          color: #2563eb;
          text-decoration: underline;
        }
      `}</style>

      <SuggestedTools currentToolId="google-sheet-links-extractor" />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="text-xl font-bold text-[var(--primary)] mt-1">{value}</p>
    </div>
  );
}

function PreviewCard({ cells, source }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-gray-50">
        <h3 className="font-semibold">Input preview</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {source || "Waiting for pasted or uploaded cells"}
        </p>
      </div>

      <div className="min-h-[260px] max-h-[520px] overflow-auto p-4 bg-white">
        {cells?.length ? (
          <table className="sheet-preview-table">
            <tbody>
              {cells.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, colIndex) => (
                    <td key={`cell-${rowIndex}-${colIndex}`} title={cell.links?.[0] || cell.text}>
                      <CellContent cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-[220px] flex flex-col items-center justify-center text-center text-[var(--text-secondary)]">
            <ClipboardPaste size={38} className="mb-3 text-gray-300" />
            <p>Paste Google Sheets cells to preview them here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OutputPreview({ rows, isProcessing }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-gray-50">
        <h3 className="font-semibold">Ready-to-paste result</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Two columns only: text and extracted link.
        </p>
      </div>

      <div className="min-h-[280px] max-h-[520px] overflow-auto p-4 bg-white">
        {isProcessing ? (
          <div className="h-[240px] flex items-center justify-center text-[var(--text-secondary)]">
            Processing links...
          </div>
        ) : rows?.length ? (
          <table className="sheet-output-table">
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`output-${rowIndex}`}>
                  <td title={row.text}>{row.text || ""}</td>
                  <td title={row.link}>
                    {row.link && row.link !== NOT_FOUND ? (
                      <a href={row.link.split("\n")[0]} target="_blank" rel="noreferrer">
                        {row.link}
                      </a>
                    ) : (
                      row.link || ""
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-[240px] flex items-center justify-center text-center text-[var(--text-secondary)]">
            Result will appear here after paste or upload.
          </div>
        )}
      </div>
    </div>
  );
}

function CellContent({ cell }) {
  const text = cell?.text || cell?.links?.[0] || "";

  if (!cell?.links?.length) return <span>{text}</span>;

  return (
    <a href={cell.links[0]} target="_blank" rel="noreferrer">
      {text || cell.links[0]}
    </a>
  );
}

/* ---------------- Two-column output ---------------- */

function buildTwoColumnOutputRows(cells, { pairNameUrlColumns }) {
  return (cells || []).map((row) => buildTwoColumnRow(row || [], { pairNameUrlColumns }));
}

function buildTwoColumnRow(row, { pairNameUrlColumns }) {
  const cells = row || [];
  const nonEmptyCells = cells.filter((cell) => cell?.text || cell?.links?.length);

  if (!nonEmptyCells.length) {
    return { text: "", link: "" };
  }

  if (pairNameUrlColumns) {
    for (let index = 0; index < cells.length; index += 1) {
      const cell = cells[index] || makeCell("", [], {});
      const nextCell = cells[index + 1] || null;

      if (cell.text && !cell.links?.length && nextCell?.links?.length && isUrlLikeCell(nextCell)) {
        return {
          text: normalizeCellText(cell.text),
          link: nextCell.links.join("\n"),
        };
      }
    }
  }

  const linkedCell = nonEmptyCells.find((cell) => cell.links?.length);

  if (linkedCell) {
    return {
      text: normalizeCellText(linkedCell.text || linkedCell.links[0]),
      link: linkedCell.links.join("\n"),
    };
  }

  const firstTextCell = nonEmptyCells.find((cell) => cell.text) || nonEmptyCells[0];

  return {
    text: normalizeCellText(firstTextCell?.text || ""),
    link: NOT_FOUND,
  };
}

function rowsToTwoColumnTsv(rows) {
  return (rows || [])
    .map((row) => [row.text || "", row.link || ""].map(escapeTsvCell).join("\t"))
    .join("\n");
}

/* ---------------- Paste parsing ---------------- */

function parseHtmlToCells(html) {
  if (!html) return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(html), "text/html");
    const tables = safeQuerySelectorAll(doc, "table");

    if (!tables.length) {
      const text = normalizeCellText(doc.body?.textContent || "");
      const links = extractLinksFromElement(doc.body);
      return text || links.length ? [[makeCell(text, links, {})]] : [];
    }

    const table = tables.sort(
      (a, b) => safeQuerySelectorAll(b, "td,th").length - safeQuerySelectorAll(a, "td,th").length
    )[0];

    const grid = [];
    const rows = safeQuerySelectorAll(table, "tr");

    rows.forEach((tr, rowIndex) => {
      if (!grid[rowIndex]) grid[rowIndex] = [];

      let colIndex = 0;
      const cells = Array.from(tr.children || []).filter((child) =>
        ["TD", "TH"].includes(child.tagName)
      );

      cells.forEach((node) => {
        while (grid[rowIndex][colIndex] !== undefined) colIndex += 1;

        const text = normalizeCellText(node.innerText || node.textContent || "");
        const links = extractLinksFromElement(node);
        const style = getSafeCellStyle(node);

        grid[rowIndex][colIndex] = makeCell(text, links, style);

        const colSpan = Number(node.getAttribute("colspan")) || 1;
        const rowSpan = Number(node.getAttribute("rowspan")) || 1;

        for (let r = 0; r < rowSpan; r += 1) {
          const targetRow = rowIndex + r;
          if (!grid[targetRow]) grid[targetRow] = [];

          for (let c = 0; c < colSpan; c += 1) {
            if (r !== 0 || c !== 0) grid[targetRow][colIndex + c] = makeCell("", [], {});
          }
        }

        colIndex += colSpan;
      });
    });

    return trimEmptyMatrix(grid);
  } catch {
    return [];
  }
}

function parsePlainTextToCells(text) {
  if (!text) return [];

  return trimEmptyMatrix(
    String(text)
      .replace(/\r/g, "")
      .split("\n")
      .map((row) =>
        row.split("\t").map((value) => {
          const cleanText = normalizeCellText(value);
          return makeCell(cleanText, extractLinksFromValue(cleanText), {});
        })
      )
  );
}

async function readSpreadsheetWithExcelJs(file) {
  const ExcelJS = await getExcelJs();
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const maxRow = worksheet.actualRowCount || worksheet.rowCount || 0;
  const maxCol = worksheet.actualColumnCount || worksheet.columnCount || 0;
  const matrix = [];

  for (let rowIndex = 1; rowIndex <= maxRow; rowIndex += 1) {
    const row = [];

    for (let colIndex = 1; colIndex <= maxCol; colIndex += 1) {
      const cell = worksheet.getCell(rowIndex, colIndex);
      row.push(excelJsCellToCell(cell));
    }

    matrix.push(row);
  }

  return trimEmptyMatrix(matrix);
}

function excelJsCellToCell(cell) {
  const rawValue = cell?.value;
  const candidates = [];
  let text = "";

  if (typeof rawValue === "string" || typeof rawValue === "number") {
    text = String(rawValue);
    candidates.push(String(rawValue));
  } else if (rawValue && typeof rawValue === "object") {
    if (rawValue.text) text = String(rawValue.text);
    if (rawValue.result) text = String(rawValue.result);
    if (rawValue.hyperlink) candidates.push(String(rawValue.hyperlink));
    if (rawValue.formula) candidates.push(String(rawValue.formula));
    if (rawValue.text) candidates.push(String(rawValue.text));
    if (rawValue.result) candidates.push(String(rawValue.result));

    try {
      candidates.push(JSON.stringify(rawValue));
    } catch {
      // ignore
    }
  }

  if (cell?.text) {
    text = text || String(cell.text);
    candidates.push(String(cell.text));
  }

  if (cell?.hyperlink) candidates.push(String(cell.hyperlink));
  if (cell?.formula) candidates.push(String(cell.formula));
  if (cell?.note) candidates.push(String(cell.note));

  const links = uniqueStrings(candidates.flatMap(extractLinksFromValue).map(cleanUrl).filter(Boolean));
  return makeCell(text, links, {});
}

async function getExcelJs() {
  const module = await import("exceljs");
  return module.default || module;
}

/* ---------------- Matrix helpers ---------------- */

function makeCell(text = "", links = [], style = {}) {
  return {
    text: normalizeCellText(text),
    links: uniqueStrings((links || []).map(cleanUrl).filter(Boolean)),
    style: sanitizeStyle(style),
  };
}

function mergeCellMatrices(matrices) {
  const valid = (matrices || []).filter((matrix) => matrix?.length);
  if (!valid.length) return [];

  const rowCount = valid.reduce((max, matrix) => Math.max(max, matrix.length), 0);
  const result = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const colCount = valid.reduce(
      (max, matrix) => Math.max(max, (matrix[rowIndex] || []).length),
      0
    );

    const row = [];

    for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
      const candidates = valid
        .map((matrix) => matrix[rowIndex]?.[colIndex])
        .filter(Boolean);

      row.push(mergeCells(candidates));
    }

    result.push(row);
  }

  return trimEmptyMatrix(result);
}

function mergeCells(cells) {
  const textCell = cells.find((cell) => cell.text) || cells[0] || makeCell("", [], {});
  const styleCell = cells.find((cell) => Object.keys(cell.style || {}).length) || textCell;
  const links = uniqueStrings(cells.flatMap((cell) => cell.links || []));

  return makeCell(textCell.text || links[0] || "", links, styleCell.style || {});
}

function applySequentialLinksToTextCells(matrix, links) {
  const cleanLinks = uniqueStrings(links.map(cleanUrl).filter(Boolean));
  let linkIndex = 0;

  return (matrix || []).map((row) =>
    (row || []).map((cell) => {
      if (cell.links?.length) return cell;
      if (!cell.text) return cell;
      if (linkIndex >= cleanLinks.length) return cell;

      const nextCell = makeCell(cell.text, [cleanLinks[linkIndex]], cell.style);
      linkIndex += 1;
      return nextCell;
    })
  );
}

function addAdjacentUrlLinks(matrix) {
  return (matrix || []).map((row) =>
    (row || []).map((cell, index) => {
      if (cell.links?.length) return cell;

      const next = row[index + 1];

      if (cell.text && next?.links?.length && isUrlLikeCell(next)) {
        return makeCell(cell.text, next.links, cell.style);
      }

      return cell;
    })
  );
}

function isUrlLikeCell(cell) {
  const text = normalizeCellText(cell?.text || "");
  return cell?.links?.length && (!text || text === cell.links[0] || hasLinkSignal(text));
}

function trimEmptyMatrix(matrix) {
  const rows = (matrix || []).map((row) => row || []);
  const lastRow = rows.reduce(
    (last, row, index) => (row.some((cell) => cell.text || cell.links?.length) ? index : last),
    -1
  );

  if (lastRow < 0) return [];

  const trimmedRows = rows.slice(0, lastRow + 1);
  const lastCol = trimmedRows.reduce((last, row) => {
    const rowLast = row.reduce(
      (cellLast, cell, index) => (cell.text || cell.links?.length ? index : cellLast),
      -1
    );
    return Math.max(last, rowLast);
  }, -1);

  return trimmedRows.map((row) =>
    Array.from({ length: lastCol + 1 }).map((_, index) => row[index] || makeCell("", [], {}))
  );
}

/* ---------------- Link extraction ---------------- */

function extractLinksFromElement(element) {
  if (!element) return [];

  const candidates = [];

  safeQuerySelectorAll(element, "a[href]").forEach((anchor) => {
    candidates.push(anchor.getAttribute("href") || "");
    candidates.push(anchor.href || "");
    candidates.push(anchor.getAttribute("data-href") || "");
    candidates.push(anchor.getAttribute("data-url") || "");
    candidates.push(anchor.getAttribute("data-sheets-hyperlink") || "");
    candidates.push(anchor.getAttribute("data-sheets-hyperlinkruns") || "");
    candidates.push(anchor.getAttribute("title") || "");
    candidates.push(anchor.getAttribute("aria-label") || "");
    candidates.push(anchor.textContent || "");
  });

  [element, ...safeQuerySelectorAll(element, "*")].forEach((node) => {
    Array.from(node.attributes || []).forEach((attribute) => {
      const name = String(attribute.name || "").toLowerCase();
      const value = attribute.value || "";

      if (
        name.includes("href") ||
        name.includes("url") ||
        name.includes("link") ||
        name.includes("formula") ||
        name.includes("data") ||
        name.includes("sheets") ||
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
    // ignore
  }

  candidates.push(element.textContent || "");

  return uniqueStrings(candidates.flatMap(extractLinksFromValue).map(cleanUrl).filter(Boolean));
}

function extractLinksFromValue(value) {
  if (!value) return [];

  const raw = String(value);
  const variants = uniqueStrings([
    raw,
    normalizeEscapedText(raw),
    decodeHtmlEntities(raw),
    decodeHtmlEntities(normalizeEscapedText(raw)),
    safeDecodeRepeated(raw),
    safeDecodeRepeated(decodeHtmlEntities(raw)),
    safeDecodeRepeated(normalizeEscapedText(raw)),
  ]);

  return uniqueStrings(
    variants.flatMap((variant) => [
      ...extractHyperlinkFormulaTargets(variant),
      ...extractJsonStringLinks(variant),
      ...findUrls(variant),
    ])
  );
}

function extractHyperlinkFormulaTargets(value) {
  const links = [];
  const regex = /HYPERLINK\s*\(\s*(?:"((?:[^"]|"")*)"|'((?:[^']|'')*)'|([^,;)]+))/gi;
  let match = regex.exec(String(value || ""));

  while (match) {
    links.push(
      (match[1] || match[2] || match[3] || "")
        .replace(/""/g, '"')
        .replace(/''/g, "'")
        .trim()
    );
    match = regex.exec(String(value || ""));
  }

  return links;
}

function extractJsonStringLinks(value) {
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

      if (item && typeof item === "object") {
        Object.values(item).forEach(walk);
      }
    }

    walk(parsed);
    return strings.flatMap(findUrls);
  } catch {
    return [];
  }
}

function findUrls(value) {
  const regex =
    /(?:https?:\/\/|ftp:\/\/|www\.|mailto:|tel:)[^\s"'<>]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s"'<>]*)?/gi;

  return (String(value || "").match(regex) || []).filter((item) => {
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

  if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(clean)) {
    clean = `mailto:${clean}`;
  }

  if (clean.startsWith("//")) clean = `https:${clean}`;
  if (clean.startsWith("www.")) clean = `https://${clean}`;
  if (isBareDomain(clean)) clean = `https://${clean}`;

  if (depth < 2) {
    const redirectTarget = extractRedirectTarget(clean);
    if (redirectTarget && redirectTarget !== clean) {
      clean = cleanUrl(redirectTarget, depth + 1);
    }
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
  const lower = String(value || "").toLowerCase();

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

/* ---------------- Preview and utilities ---------------- */

function buildPreviewTableHtml(cells) {
  if (!cells?.length) return "";

  const rows = cells
    .map((row) => {
      const tds = row
        .map((cell) => {
          const style = styleObjectToInlineCss(cell.style);
          const content = formatCellHtml(cell);

          return `<td style="border:1px solid #e5e7eb;padding:8px 10px;white-space:nowrap;vertical-align:top;${style}">${content}</td>`;
        })
        .join("");

      return `<tr>${tds}</tr>`;
    })
    .join("");

  return `<table>${rows}</table>`;
}

function formatCellHtml(cell) {
  const text = cell?.text || cell?.links?.[0] || "";

  if (!cell?.links?.length) return text ? escapeHtml(text) : "&nbsp;";

  return `<a href="${escapeHtml(cell.links[0])}" target="_blank" rel="noopener noreferrer">${escapeHtml(
    text || cell.links[0]
  )}</a>`;
}

function getSafeCellStyle(node) {
  const raw = String(node?.getAttribute?.("style") || "");
  const style = {};

  raw.split(";").forEach((part) => {
    const [property, ...valueParts] = part.split(":");
    const key = String(property || "").trim().toLowerCase();
    const value = valueParts.join(":").trim();

    if (!value) return;

    if (key === "background-color") style.backgroundColor = sanitizeColor(value);
    if (key === "color") style.color = sanitizeColor(value);
    if (key === "font-weight") style.fontWeight = sanitizeFontWeight(value);
    if (key === "font-style" && value === "italic") style.fontStyle = "italic";
    if (key === "text-align" && ["left", "center", "right"].includes(value)) {
      style.textAlign = value;
    }
  });

  return sanitizeStyle(style);
}

function sanitizeStyle(style = {}) {
  const output = {};

  if (style.backgroundColor) output.backgroundColor = sanitizeColor(style.backgroundColor);
  if (style.color) output.color = sanitizeColor(style.color);
  if (style.fontWeight) output.fontWeight = sanitizeFontWeight(style.fontWeight);
  if (style.fontStyle === "italic") output.fontStyle = "italic";
  if (["left", "center", "right"].includes(style.textAlign)) output.textAlign = style.textAlign;

  Object.keys(output).forEach((key) => {
    if (!output[key]) delete output[key];
  });

  return output;
}

function sanitizeColor(value) {
  const text = String(value || "").trim();
  if (/^#[0-9a-f]{3,8}$/i.test(text)) return text;
  if (/^rgb(a)?\([0-9.,\s%]+\)$/i.test(text)) return text;
  return "";
}

function sanitizeFontWeight(value) {
  const text = String(value || "").trim();
  if (/^[1-9]00$/.test(text)) return text;
  if (["normal", "bold", "bolder", "lighter"].includes(text)) return text;
  return "";
}

function styleObjectToInlineCss(style = {}) {
  const parts = [];

  if (style.backgroundColor) parts.push(`background-color:${style.backgroundColor};`);
  if (style.color) parts.push(`color:${style.color};`);
  if (style.fontWeight) parts.push(`font-weight:${style.fontWeight};`);
  if (style.fontStyle) parts.push(`font-style:${style.fontStyle};`);
  if (style.textAlign) parts.push(`text-align:${style.textAlign};`);

  return parts.join("");
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

function safeQuerySelectorAll(root, selector) {
  try {
    return Array.from(root?.querySelectorAll?.(selector) || []);
  } catch {
    return [];
  }
}

function normalizeCellText(value) {
  return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
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

  return String(value).replace(
    /&(amp|quot|lt|gt|nbsp);|&#39;|&#x27;/g,
    (match) => map[match] || match
  );
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

function uniqueStrings(items) {
  const seen = new Set();
  const output = [];

  (items || []).forEach((item) => {
    const value = String(item || "").trim();

    if (!value) return;

    const key = value.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    output.push(value);
  });

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

function escapeTsvCell(value) {
  return String(value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\t/g, " ")
    .trim();
}

function estimateProcessingTime(cells) {
  const rawLength = (cells || [])
    .flat()
    .map((cell) => `${cell.text || ""} ${(cell.links || []).join(" ")}`)
    .join("\n").length;
  const links = (cells || []).flat().reduce((total, cell) => total + (cell?.links?.length || 0), 0);
  const rows = cells.length;

  return clampNumber(
    Math.round(MIN_PROCESSING_TIME_MS + rawLength * 0.025 + rows * 12 + links * 42),
    MIN_PROCESSING_TIME_MS,
    MAX_PROCESSING_TIME_MS
  );
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (Number.isNaN(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function downloadTextFile({ content, fileName, mimeType }) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, fileName);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
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
