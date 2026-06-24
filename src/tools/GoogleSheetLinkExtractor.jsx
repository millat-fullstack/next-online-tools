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
  AlertCircle,
  ShieldCheck,
  Code2,
  ChevronDown,
  ChevronUp,
  Table2,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Google Sheet Link Extractor",
  path: "/google-sheet-link-extractor",
  category: "Spreadsheet Tools",
  description:
    "Paste Google Sheets cells or upload XLSX files to extract hidden hyperlinks and output a clean TSV with Not found for cells without links.",
  metaTitle: "Google Sheet Link Extractor - Extract Hidden Hyperlinks to TSV",
  metaDescription:
    "Extract hidden hyperlinks from Google Sheets. Paste cells, upload XLSX, or use Apps Script helper, then copy a serial TSV output with Not found for cells without links.",
};

const MIN_PROCESSING_TIME_MS = 900;
const MAX_PROCESSING_TIME_MS = 12000;

const EMPTY_STATS = {
  rows: 0,
  columns: 0,
  cells: 0,
  linksFound: 0,
  notFound: 0,
  source: "",
};

const APPS_SCRIPT = `function extractLinksAsTSVFromSelection() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getActiveRange();
  const richValues = range.getRichTextValues();
  const values = range.getDisplayValues();

  const output = [["Serial", "Row", "Column", "Cell", "Text", "Hyperlink"]];
  let serial = 1;

  for (let r = 0; r < values.length; r++) {
    for (let c = 0; c < values[r].length; c++) {
      const rich = richValues[r][c];
      const text = values[r][c] || (rich ? rich.getText() : "");
      const links = [];

      if (rich) {
        const mainLink = rich.getLinkUrl();
        if (mainLink) links.push(mainLink);

        const runs = rich.getRuns();
        for (let i = 0; i < runs.length; i++) {
          const runLink = runs[i].getLinkUrl();
          if (runLink && links.indexOf(runLink) === -1) links.push(runLink);
        }
      }

      if (links.length) {
        links.forEach(function(link) {
          output.push([
            serial++,
            range.getRow() + r,
            range.getColumn() + c,
            sheet.getRange(range.getRow() + r, range.getColumn() + c).getA1Notation(),
            text,
            link
          ]);
        });
      } else {
        output.push([
          serial++,
          range.getRow() + r,
          range.getColumn() + c,
          sheet.getRange(range.getRow() + r, range.getColumn() + c).getA1Notation(),
          text,
          "Not found"
        ]);
      }
    }
  }

  const outputSheetName = "Extracted Links TSV";
  let outputSheet = SpreadsheetApp.getActive().getSheetByName(outputSheetName);
  if (!outputSheet) outputSheet = SpreadsheetApp.getActive().insertSheet(outputSheetName);

  outputSheet.clear();
  outputSheet.getRange(1, 1, output.length, output[0].length).setValues(output);
}`;

export default function GoogleSheetLinkExtractor() {
  const pasteBoxRef = useRef(null);
  const fileInputRef = useRef(null);
  const timersRef = useRef([]);

  const [inputCells, setInputCells] = useState([]);
  const [serialRows, setSerialRows] = useState([]);
  const [inputSource, setInputSource] = useState("");

  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeCellAddress, setIncludeCellAddress] = useState(true);
  const [includeBlankCells, setIncludeBlankCells] = useState(false);
  const [pairAdjacentUrlCells, setPairAdjacentUrlCells] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTimeMs, setEstimatedTimeMs] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);

  const [copySuccess, setCopySuccess] = useState(false);
  const [tsvSuccess, setTsvSuccess] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);

  const [error, setError] = useState("");
  const [showScript, setShowScript] = useState(false);

  useEffect(() => {
    clearProcessingTimers();

    if (!inputCells.length) {
      setSerialRows([]);
      setIsProcessing(false);
      setProgress(0);
      setProcessingTimeMs(0);
      setEstimatedTimeMs(0);
      return undefined;
    }

    const startTime = performance.now();
    const estimate = estimateProcessingTime(inputCells);

    setIsProcessing(true);
    setProgress(8);
    setProcessingTimeMs(0);
    setEstimatedTimeMs(estimate);
    setSerialRows([]);

    const progressTimer = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      setProgress(Math.min(94, Math.max(8, Math.round((elapsed / estimate) * 94))));
    }, 80);

    const finishTimer = window.setTimeout(() => {
      try {
        const rows = buildSerialRows(inputCells, {
          includeBlankCells,
          pairAdjacentUrlCells,
        });
        setSerialRows(rows);
        setProcessingTimeMs(Math.max(1, Math.round(performance.now() - startTime)));
        setProgress(100);
      } catch {
        setError("Could not process this data. Clear and try again, or upload XLSX for highest accuracy.");
        setSerialRows([]);
      } finally {
        setIsProcessing(false);
        window.setTimeout(() => setProgress(0), 700);
      }
    }, estimate);

    timersRef.current = [progressTimer, finishTimer];
    return () => clearProcessingTimers();
  }, [inputCells, includeBlankCells, pairAdjacentUrlCells]);

  useEffect(() => {
    return () => clearProcessingTimers();
  }, []);

  const stats = useMemo(() => {
    const rows = inputCells.length;
    const columns = inputCells.reduce((max, row) => Math.max(max, row.length), 0);
    const cells = inputCells.reduce((total, row) => total + row.length, 0);
    const linksFound = serialRows.filter((row) => row.hyperlink !== "Not found").length;
    const notFound = serialRows.filter((row) => row.hyperlink === "Not found").length;

    return { rows, columns, cells, linksFound, notFound, source: inputSource };
  }, [inputCells, inputSource, serialRows]);

  const outputTsv = useMemo(
    () =>
      serialRowsToTsv(serialRows, {
        includeHeader,
        includeCellAddress,
      }),
    [serialRows, includeHeader, includeCellAddress]
  );

  const hasOutput = serialRows.length > 0 && !isProcessing;

  function clearProcessingTimers() {
    timersRef.current.forEach((timer) => {
      window.clearInterval(timer);
      window.clearTimeout(timer);
    });
    timersRef.current = [];
  }

  function resetActionStates() {
    setCopySuccess(false);
    setTsvSuccess(false);
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

      const htmlCells = html ? parseHtmlTableToCells(html) : [];
      const textCells = text ? parsePlainTextToCells(text) : [];
      const rtfLinks = rtf ? extractLinksFromValue(rtf) : [];
      const uriCells = uriList ? parsePlainTextToCells(uriList) : [];
      const extraCells = extraText ? parsePlainTextToCells(extraText) : [];

      let merged = mergeCellMatrices([htmlCells, textCells, uriCells, extraCells]);

      if (!merged.length && rtfLinks.length) {
        merged = [rtfLinks.map((link) => makeCell(link, [link], {}))];
      }

      if (rtfLinks.length && merged.length) merged = addSequentialLinksToMatrix(merged, rtfLinks);
      merged = addAdjacentUrlLinks(merged);

      if (!merged.length) {
        setError("No spreadsheet data found. Copy cells from Google Sheets and paste again.");
        return;
      }

      if (pasteBoxRef.current) pasteBoxRef.current.innerHTML = buildHtmlTable(merged, true);

      const clipboardTypes = Array.from(clipboard?.types || []).join(", ");
      setInputCells(merged);
      setInputSource(clipboardTypes ? `Smart paste: ${clipboardTypes}` : "Smart paste");
    } catch {
      setError("Paste failed. Clear and try again, or upload XLSX for highest accuracy.");
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
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

      const cells = workbookToCells(workbook);
      if (!cells.length) {
        setError("No spreadsheet rows found in this file.");
        return;
      }

      const enhancedCells = addAdjacentUrlLinks(cells);
      if (pasteBoxRef.current) pasteBoxRef.current.innerHTML = buildHtmlTable(enhancedCells, true);

      setInputCells(enhancedCells);
      setInputSource(file.name || "XLSX Upload");
    } catch {
      setError("Could not read this spreadsheet. Please try XLSX, XLS, CSV, or TSV.");
    } finally {
      event.target.value = "";
    }
  }

  async function copyTsvResult() {
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

  function downloadTsvFile() {
    if (!hasOutput) return;

    downloadTextFile({
      content: outputTsv,
      fileName: "google-sheet-links-output.tsv",
      mimeType: "text/tab-separated-values;charset=utf-8",
    });

    setTsvSuccess(true);
    window.setTimeout(() => setTsvSuccess(false), 2000);
  }

  function downloadExcelFile() {
    if (!hasOutput) return;

    const workbook = XLSX.utils.book_new();
    const sheet = serialRowsToXlsxSheet(serialRows, { includeCellAddress });
    XLSX.utils.book_append_sheet(workbook, sheet, "Extracted Links");
    XLSX.writeFile(workbook, "google-sheet-links-output.xlsx");

    setExcelSuccess(true);
    window.setTimeout(() => setExcelSuccess(false), 2000);
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
    clearProcessingTimers();
    setInputCells([]);
    setSerialRows([]);
    setInputSource("");
    setIsProcessing(false);
    setProgress(0);
    setEstimatedTimeMs(0);
    setProcessingTimeMs(0);
    setError("");
    resetActionStates();
    if (pasteBoxRef.current) pasteBoxRef.current.innerHTML = "";
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
        <h1 className="text-3xl font-bold mb-3">Google Sheet Link Extractor</h1>
        <p className="text-[var(--text-secondary)] max-w-3xl">
          Paste copied Google Sheets cells, upload XLSX, or use Apps Script to extract links serially. Cells without hyperlinks are marked as <strong>Not found</strong>, and the result is ready to paste into Google Sheets as TSV.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">1. Paste or upload sheet cells</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Paste is fast. XLSX or Apps Script gives the highest hidden-link accuracy.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-primary inline-flex items-center gap-2 px-3 py-2 text-sm">
                  <Upload size={16} /> Upload XLSX
                </button>
                <button type="button" onClick={resetTool} className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm">
                  <RotateCcw size={16} /> Clear
                </button>
              </div>
            </div>

            <div
              ref={pasteBoxRef}
              onPaste={handlePaste}
              contentEditable
              suppressContentEditableWarning
              className="sheet-paste-zone w-full min-h-[260px] p-4 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white overflow-auto"
              data-placeholder="Click here and press Ctrl + V to paste Google Sheets cells..."
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
                Paste mode extracts every link that Google Sheets sends to the browser clipboard. If Google Sheets hides some URLs, upload XLSX or use the Apps Script helper for real sheet-level hyperlink metadata.
              </p>
            </div>

            <div className="grid sm:grid-cols-4 gap-3">
              <StatCard label="Rows" value={stats.rows} />
              <StatCard label="Columns" value={stats.columns} />
              <StatCard label="Links" value={stats.linksFound} />
              <StatCard label="Not found" value={stats.notFound} />
            </div>

            <PreviewCard title="Input preview" cells={inputCells} emptyText="Paste cells or upload XLSX to preview the copied sheet." stats={stats} />
          </div>

          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">2. TSV output</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {isProcessing ? "Processing links serially..." : `${stats.linksFound} link${stats.linksFound === 1 ? "" : "s"} found, ${stats.notFound} Not found.`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold border border-[var(--border)] rounded-xl px-3 py-2 bg-white">
                  <input type="checkbox" checked={includeHeader} onChange={(event) => setIncludeHeader(event.target.checked)} className="accent-[var(--primary)]" /> Header
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold border border-[var(--border)] rounded-xl px-3 py-2 bg-white">
                  <input type="checkbox" checked={includeCellAddress} onChange={(event) => setIncludeCellAddress(event.target.checked)} className="accent-[var(--primary)]" /> Cell
                </label>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="inline-flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 cursor-pointer">
                <input type="checkbox" checked={pairAdjacentUrlCells} onChange={(event) => setPairAdjacentUrlCells(event.target.checked)} className="mt-1 accent-[var(--primary)]" />
                <span><span className="block text-sm font-semibold">Pair text + URL columns</span><span className="block text-xs text-[var(--text-secondary)] mt-1">If a name cell is beside a URL cell, output the name with that URL.</span></span>
              </label>
              <label className="inline-flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 cursor-pointer">
                <input type="checkbox" checked={includeBlankCells} onChange={(event) => setIncludeBlankCells(event.target.checked)} className="mt-1 accent-[var(--primary)]" />
                <span><span className="block text-sm font-semibold">Include blank cells</span><span className="block text-xs text-[var(--text-secondary)] mt-1">Blank cells will also appear as Not found in the serial TSV.</span></span>
              </label>
            </div>

            {(isProcessing || processingTimeMs > 0) && (
              <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {isProcessing ? <Loader2 size={18} className="animate-spin text-[var(--primary)]" /> : <Clock3 size={18} className="text-[var(--primary)]" />}
                    <p className="font-semibold text-sm">{isProcessing ? "Processing..." : "Processing completed"}</p>
                  </div>
                  <span className="text-xs font-bold text-[var(--primary)]">{isProcessing ? `Est. ${(estimatedTimeMs / 1000).toFixed(1)}s` : `${(processingTimeMs / 1000).toFixed(1)}s`}</span>
                </div>
                {isProcessing && (
                  <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                    <div className="h-full bg-[var(--primary)] transition-all duration-200" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
            )}

            <div className="border border-[var(--border)] rounded-2xl bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] bg-gray-50 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold flex items-center gap-2"><Table2 size={17} className="text-[var(--primary)]" /> Ready-to-paste TSV</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Copy this and paste directly into Google Sheets.</p>
                </div>
              </div>
              <textarea
                value={isProcessing ? "Processing links..." : outputTsv || "Serial TSV output will appear here."}
                readOnly
                rows={16}
                className="w-full min-h-[420px] p-4 font-mono text-sm bg-gray-50 outline-none resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <button type="button" onClick={copyTsvResult} disabled={!hasOutput} className={`btn-primary inline-flex items-center justify-center gap-2 ${!hasOutput ? "opacity-50 cursor-not-allowed" : ""}`}>
                {copySuccess ? <Check size={18} /> : <Copy size={18} />} {copySuccess ? "Copied" : "Copy TSV"}
              </button>
              <button type="button" onClick={downloadTsvFile} disabled={!hasOutput} className={`btn-secondary inline-flex items-center justify-center gap-2 ${!hasOutput ? "opacity-50 cursor-not-allowed" : ""}`}>
                {tsvSuccess ? <Check size={18} /> : <Download size={18} />} {tsvSuccess ? "Saved" : "TSV"}
              </button>
              <button type="button" onClick={downloadExcelFile} disabled={!hasOutput} className={`btn-secondary inline-flex items-center justify-center gap-2 ${!hasOutput ? "opacity-50 cursor-not-allowed" : ""}`}>
                {excelSuccess ? <Check size={18} /> : <FileSpreadsheet size={18} />} {excelSuccess ? "Saved" : "Excel"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-4 sm:p-6">
        <button type="button" onClick={() => setShowScript((current) => !current)} className="w-full flex items-center justify-between gap-3 text-left">
          <span className="flex items-center gap-2 font-bold"><Code2 size={20} className="text-[var(--primary)]" /> Apps Script helper for true live-sheet accuracy</span>
          {showScript ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showScript && (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <p className="text-sm text-[var(--text-secondary)] mb-4">When Google Sheets does not send hidden links to the browser clipboard, this Apps Script reads the selected cells directly and creates a TSV-ready output sheet with Not found for missing links.</p>
            <pre className="bg-[#111827] text-white rounded-2xl p-4 overflow-auto text-xs leading-6 max-h-[320px]">{APPS_SCRIPT}</pre>
            <button type="button" onClick={copyAppsScript} className="btn-secondary inline-flex items-center gap-2 mt-4">
              {scriptCopied ? <Check size={18} /> : <Copy size={18} />} {scriptCopied ? "Script copied" : "Copy Apps Script"}
            </button>
          </div>
        )}
      </section>

      <style>{`
        .sheet-paste-zone:empty::before { content: attr(data-placeholder); color: #9ca3af; }
        .sheet-preview-table { border-collapse: collapse; width: max-content; min-width: 100%; background: white; font-size: 14px; line-height: 1.45; }
        .sheet-preview-table td, .sheet-preview-table th { border: 1px solid #e5e7eb; padding: 8px 10px; min-width: 150px; max-width: 360px; vertical-align: top; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sheet-preview-table a { color: #2563eb; text-decoration: underline; }
        .sheet-paste-zone table { border-collapse: collapse; width: max-content; min-width: 100%; background: white; font-size: 14px; }
        .sheet-paste-zone td, .sheet-paste-zone th { border: 1px solid #e5e7eb; padding: 8px 10px; min-width: 150px; white-space: nowrap; }
        .sheet-paste-zone a { color: #2563eb; text-decoration: underline; }
      `}</style>

      <SuggestedTools currentToolId="google-sheet-link-extractor" />
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

function PreviewCard({ title, cells, emptyText, stats = EMPTY_STATS }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-[var(--text-secondary)]">{stats.rows || 0} rows • {stats.columns || 0} columns • {stats.linksFound || 0} links{stats.source ? ` • ${stats.source}` : ""}</p>
        </div>
      </div>
      <div className="min-h-[280px] max-h-[520px] overflow-auto p-4 bg-white">
        {cells?.length ? (
          <table className="sheet-preview-table"><tbody>{cells.map((row, rowIndex) => (<tr key={`row-${rowIndex}`}>{row.map((cell, colIndex) => (<td key={`cell-${rowIndex}-${colIndex}`} style={cell.style || undefined} title={cell.links?.[0] || cell.text}><CellContent cell={cell} /></td>))}</tr>))}</tbody></table>
        ) : (
          <div className="h-[240px] flex flex-col items-center justify-center text-center text-[var(--text-secondary)]"><ClipboardPaste size={38} className="mb-3 text-gray-300" /><p>{emptyText}</p></div>
        )}
      </div>
    </div>
  );
}

function CellContent({ cell }) {
  const text = cell?.text || cell?.links?.[0] || "";
  if (!cell?.links?.length) return <span>{text}</span>;
  if (cell.links.length === 1) return <a href={cell.links[0]} target="_blank" rel="noreferrer">{text || cell.links[0]}</a>;
  return <span className="inline-flex flex-col gap-1">{cell.links.map((link, index) => (<a key={`${link}-${index}`} href={link} target="_blank" rel="noreferrer">{index === 0 ? text || link : link}</a>))}</span>;
}

function buildSerialRows(cells, { includeBlankCells, pairAdjacentUrlCells }) {
  const output = [];
  let serial = 1;

  (cells || []).forEach((row, rowIndex) => {
    for (let colIndex = 0; colIndex < (row || []).length; colIndex += 1) {
      const cell = row[colIndex] || makeCell("", [], {});
      const nextCell = row[colIndex + 1] || null;
      const text = normalizeCellText(cell.text || "");
      const isBlank = !text && !cell.links?.length;

      if (isBlank && !includeBlankCells) continue;

      if (pairAdjacentUrlCells && !cell.links?.length && text && nextCell?.links?.length && isUrlLikeCell(nextCell)) {
        nextCell.links.forEach((link) => {
          output.push(makeSerialRow(serial, rowIndex, colIndex, text, link));
          serial += 1;
        });
        colIndex += 1;
        continue;
      }

      if (cell.links?.length) {
        cell.links.forEach((link) => {
          output.push(makeSerialRow(serial, rowIndex, colIndex, text || link, link));
          serial += 1;
        });
        continue;
      }

      output.push(makeSerialRow(serial, rowIndex, colIndex, text, "Not found"));
      serial += 1;
    }
  });

  return output;
}

function makeSerialRow(serial, rowIndex, colIndex, text, hyperlink) {
  return { serial, row: rowIndex + 1, column: colIndex + 1, cell: `${columnNumberToName(colIndex + 1)}${rowIndex + 1}`, text: normalizeCellText(text), hyperlink: hyperlink || "Not found" };
}

function serialRowsToTsv(rows, { includeHeader, includeCellAddress }) {
  const header = includeCellAddress ? ["Serial", "Row", "Column", "Cell", "Text", "Hyperlink"] : ["Serial", "Text", "Hyperlink"];
  const body = (rows || []).map((row) => includeCellAddress ? [row.serial, row.row, row.column, row.cell, row.text, row.hyperlink] : [row.serial, row.text, row.hyperlink]);
  const allRows = includeHeader ? [header, ...body] : body;
  return allRows.map((row) => row.map(escapeTsvCell).join("\t")).join("\n");
}

function serialRowsToXlsxSheet(rows, { includeCellAddress }) {
  const aoa = serialRowsToTsv(rows, { includeHeader: true, includeCellAddress }).split("\n").map((line) => line.split("\t"));
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  (rows || []).forEach((row, index) => {
    if (row.hyperlink === "Not found") return;
    const hyperlinkColumn = includeCellAddress ? 5 : 2;
    const address = XLSX.utils.encode_cell({ r: index + 1, c: hyperlinkColumn });
    if (sheet[address]) sheet[address].l = { Target: row.hyperlink, Tooltip: row.hyperlink };
  });
  sheet["!cols"] = includeCellAddress ? [{ wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 36 }, { wch: 58 }] : [{ wch: 10 }, { wch: 36 }, { wch: 58 }];
  return sheet;
}

function parseHtmlTableToCells(html) {
  if (!html) return [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(html), "text/html");
    const tables = safeQuerySelectorAll(doc, "table");
    if (!tables.length) {
      const body = doc.body;
      const text = normalizeCellText(body?.textContent || "");
      const links = extractLinksFromElement(body);
      return text || links.length ? [[makeCell(text, links, {}, body?.innerHTML || "")]] : [];
    }
    const table = tables.sort((a, b) => safeQuerySelectorAll(b, "td,th").length - safeQuerySelectorAll(a, "td,th").length)[0];
    const rows = safeQuerySelectorAll(table, "tr");
    const grid = [];
    rows.forEach((tr, rowIndex) => {
      if (!grid[rowIndex]) grid[rowIndex] = [];
      let colIndex = 0;
      const cells = Array.from(tr.children || []).filter((child) => ["TD", "TH"].includes(child.tagName));
      cells.forEach((node) => {
        while (grid[rowIndex][colIndex] !== undefined) colIndex += 1;
        const text = normalizeCellText(node.innerText || node.textContent || "");
        const links = extractLinksFromElement(node);
        const style = getSafeCellStyle(node);
        const htmlContent = node.innerHTML || "";
        grid[rowIndex][colIndex] = makeCell(text, links, style, htmlContent);
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
  return trimEmptyMatrix(String(text).replace(/\r/g, "").split("\n").map((row) => row.split("\t").map((value) => {
    const cleanText = normalizeCellText(value);
    return makeCell(cleanText, extractLinksFromValue(cleanText), {});
  })));
}

function workbookToCells(workbook) {
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
      row.push(workbookCellToCell(sheet[address]));
    }
    matrix.push(row);
  }
  return trimEmptyMatrix(matrix);
}

function workbookCellToCell(cell) {
  if (!cell) return makeCell("", [], {});
  const text = normalizeCellText(cell.w !== undefined ? String(cell.w) : cell.v !== undefined ? String(cell.v) : cell.f !== undefined ? String(cell.f) : "");
  const candidates = [];
  if (cell.l?.Target) candidates.push(cell.l.Target);
  if (cell.l?.Tooltip) candidates.push(cell.l.Tooltip);
  if (cell.f) candidates.push(cell.f);
  if (cell.v !== undefined) candidates.push(String(cell.v));
  if (cell.w !== undefined) candidates.push(String(cell.w));
  if (cell.h !== undefined) candidates.push(String(cell.h));
  if (cell.r !== undefined) candidates.push(String(cell.r));
  try { candidates.push(JSON.stringify(cell)); } catch { /* ignore */ }
  const links = uniqueStrings(candidates.flatMap(extractLinksFromValue).map(cleanUrl).filter(Boolean));
  return makeCell(text, links, {}, cell.h || "");
}

function makeCell(text = "", links = [], style = {}, html = "") {
  return { text: normalizeCellText(text), links: uniqueStrings((links || []).map(cleanUrl).filter(Boolean)), style: sanitizeStyle(style), html: String(html || "") };
}

function mergeCellMatrices(matrices) {
  const validMatrices = (matrices || []).filter((matrix) => matrix?.length);
  if (!validMatrices.length) return [];
  const maxRows = validMatrices.reduce((max, matrix) => Math.max(max, matrix.length), 0);
  const output = [];
  for (let rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
    const maxColumns = validMatrices.reduce((max, matrix) => Math.max(max, (matrix[rowIndex] || []).length), 0);
    const row = [];
    for (let colIndex = 0; colIndex < maxColumns; colIndex += 1) {
      const candidates = validMatrices.map((matrix) => (matrix[rowIndex] || [])[colIndex]).filter(Boolean);
      row.push(mergeCells(candidates));
    }
    output.push(row);
  }
  return trimEmptyMatrix(output);
}

function mergeCells(cells) {
  const textCell = cells.find((cell) => cell.text?.trim()) || cells[0] || makeCell("", [], {});
  const styleCell = cells.find((cell) => Object.keys(cell.style || {}).length) || textCell;
  const htmlCell = cells.find((cell) => cell.html?.trim()) || textCell;
  const links = uniqueStrings(cells.flatMap((cell) => cell.links || []));
  return makeCell(textCell.text || links[0] || "", links, styleCell.style || {}, htmlCell.html || "");
}

function addSequentialLinksToMatrix(matrix, links) {
  const cleanLinks = uniqueStrings((links || []).map(cleanUrl).filter(Boolean));
  if (!cleanLinks.length) return matrix;
  let linkIndex = 0;
  return (matrix || []).map((row) => (row || []).map((cell) => {
    if (cell.links?.length) return cell;
    if (!normalizeCellText(cell.text)) return cell;
    if (linkIndex >= cleanLinks.length) return cell;
    const nextCell = makeCell(cell.text, [cleanLinks[linkIndex]], cell.style, cell.html);
    linkIndex += 1;
    return nextCell;
  }));
}

function addAdjacentUrlLinks(matrix) {
  return (matrix || []).map((row) => (row || []).map((cell, index) => {
    if (cell?.links?.length) return cell;
    const next = row[index + 1];
    if (normalizeCellText(cell?.text || "") && next?.links?.length && isUrlLikeCell(next)) return makeCell(cell.text, next.links, cell.style, cell.html);
    return cell;
  }));
}

function trimEmptyMatrix(matrix) {
  const rows = (matrix || []).map((row) => row || []);
  const lastRowIndex = rows.reduce((last, row, index) => row.some((cell) => cell?.text?.trim() || cell?.links?.length) ? index : last, -1);
  if (lastRowIndex < 0) return [];
  const trimmedRows = rows.slice(0, lastRowIndex + 1);
  const lastColumnIndex = trimmedRows.reduce((last, row) => {
    const rowLast = row.reduce((cellLast, cell, index) => cell?.text?.trim() || cell?.links?.length ? index : cellLast, -1);
    return Math.max(last, rowLast);
  }, -1);
  return trimmedRows.map((row) => Array.from({ length: lastColumnIndex + 1 }).map((_, index) => row[index] || makeCell("", [], {})));
}

function isUrlLikeCell(cell) {
  const text = normalizeCellText(cell?.text || "");
  return cell?.links?.length && (!text || text === cell.links[0] || /https?:\/\/|www\.|mailto:|tel:/i.test(text));
}

function buildHtmlTable(cells, clickable = true) {
  if (!cells?.length) return "";
  const rows = cells.map((row) => `<tr>${row.map((cell) => `<td style="border:1px solid #e5e7eb;padding:8px 10px;white-space:nowrap;vertical-align:top;${styleObjectToInlineCss(cell.style)}">${formatCellHtml(cell, clickable)}</td>`).join("")}</tr>`).join("");
  return `<table style="border-collapse:collapse;background:white;font-size:14px;line-height:1.45;">${rows}</table>`;
}

function formatCellHtml(cell, clickable) {
  const text = cell?.text || cell?.links?.[0] || "";
  if (!cell?.links?.length || !clickable) return text ? escapeHtml(text) : "&nbsp;";
  if (cell.links.length === 1) return `<a href="${escapeHtml(cell.links[0])}" target="_blank" rel="noopener noreferrer">${escapeHtml(text || cell.links[0])}</a>`;
  return cell.links.map((link, index) => `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(index === 0 ? text || link : link)}</a>`).join("<br>");
}

function extractLinksFromElement(element) {
  if (!element) return [];
  const candidates = [];
  safeQuerySelectorAll(element, "a[href]").forEach((anchor) => {
    candidates.push(anchor.getAttribute("href") || "", anchor.href || "", anchor.getAttribute("data-href") || "", anchor.getAttribute("data-url") || "", anchor.getAttribute("data-sheets-hyperlink") || "", anchor.getAttribute("data-sheets-hyperlinkruns") || "", anchor.textContent || "", anchor.getAttribute("title") || "", anchor.getAttribute("aria-label") || "");
  });
  [element, ...safeQuerySelectorAll(element, "*")].forEach((node) => {
    Array.from(node.attributes || []).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value || "";
      if (name.includes("href") || name.includes("url") || name.includes("link") || name.includes("formula") || name.includes("data") || name.includes("title") || name.includes("aria") || name.includes("sheets") || hasLinkSignal(value)) candidates.push(value);
    });
  });
  try {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_COMMENT);
    let comment = walker.nextNode();
    while (comment) { candidates.push(comment.nodeValue || ""); comment = walker.nextNode(); }
  } catch { /* ignore */ }
  candidates.push(element.textContent || "");
  return uniqueStrings(candidates.flatMap(extractLinksFromValue).map(cleanUrl).filter(Boolean));
}

function extractLinksFromValue(value) {
  if (!value) return [];
  const raw = String(value);
  const variants = uniqueStrings([raw, normalizeEscapedText(raw), decodeHtmlEntities(raw), decodeHtmlEntities(normalizeEscapedText(raw)), safeDecodeRepeated(raw), safeDecodeRepeated(decodeHtmlEntities(raw)), safeDecodeRepeated(normalizeEscapedText(raw))]);
  return uniqueStrings(variants.flatMap((variant) => [...extractHyperlinkFormulaTargets(variant), ...extractStringsFromJsonLike(variant), ...findUrls(variant)]));
}

function extractHyperlinkFormulaTargets(value) {
  const text = String(value || "");
  const links = [];
  const hyperlinkRegex = /HYPERLINK\s*\(\s*(?:"((?:[^"]|"")*)"|'((?:[^']|'')*)'|([^,;)]+))/gi;
  let match = hyperlinkRegex.exec(text);
  while (match) {
    links.push((match[1] || match[2] || match[3] || "").replace(/""/g, '"').replace(/''/g, "'").trim());
    match = hyperlinkRegex.exec(text);
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
      if (typeof item === "string") { if (hasLinkSignal(item)) strings.push(item); return; }
      if (Array.isArray(item)) { item.forEach(walk); return; }
      if (item && typeof item === "object") Object.values(item).forEach(walk);
    }
    walk(parsed);
    return strings.flatMap(findUrls);
  } catch { return []; }
}

function findUrls(value) {
  if (!value) return [];
  const urlRegex = /(?:https?:\/\/|ftp:\/\/|www\.|mailto:|tel:)[^\s"'<>]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s"'<>]*)?/gi;
  const matches = String(value).match(urlRegex) || [];
  return matches.filter((item) => {
    const lower = item.toLowerCase();
    if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("ftp://") || lower.startsWith("www.") || lower.startsWith("mailto:") || lower.startsWith("tel:")) return true;
    if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(item)) return true;
    return isBareDomain(item);
  });
}

function cleanUrl(url, depth = 0) {
  if (!url) return "";
  let clean = normalizeEscapedText(decodeHtmlEntities(String(url))).trim().replace(/^[<("'[\s]+/g, "").replace(/[>)"'\]\s]+$/g, "").replace(/[\u200B-\u200D\uFEFF]/g, "");
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
    const target = parsed.searchParams.get("q") || parsed.searchParams.get("url") || parsed.searchParams.get("u") || parsed.searchParams.get("target") || parsed.searchParams.get("redirect") || parsed.searchParams.get("to");
    if (target && (host.includes("google.") || host.includes("facebook.") || host.includes("linkedin.") || host.includes("instagram.") || host.includes("l.facebook.") || host.includes("lnkd.in"))) return target;
  } catch { return ""; }
  return "";
}

function hasLinkSignal(value) {
  const text = String(value || "");
  return /https?:\/\//i.test(text) || /https?:%2f%2f/i.test(text) || /www\./i.test(text) || /mailto:/i.test(text) || /tel:/i.test(text) || /HYPERLINK\s*\(/i.test(text) || /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
}

function isUsefulLink(value) {
  if (!value) return false;
  const lower = value.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("file:") || lower.startsWith("blob:") || lower.startsWith("chrome:")) return false;
  return lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("ftp://") || lower.startsWith("mailto:") || lower.startsWith("tel:");
}

function isBareDomain(value) {
  const text = String(value || "").trim();
  if (!/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/.*)?$/i.test(text)) return false;
  if (/^\d+\.\d+$/.test(text)) return false;
  if (text.includes("..")) return false;
  return true;
}

function getSafeCellStyle(node) {
  const raw = String(node?.getAttribute?.("style") || "");
  const style = {};
  const allowed = new Set(["background-color", "color", "font-weight", "font-style", "text-align"]);
  raw.split(";").forEach((part) => {
    const [property, ...valueParts] = part.split(":");
    const key = String(property || "").trim().toLowerCase();
    const value = valueParts.join(":").trim();
    if (!allowed.has(key) || !value) return;
    if (key === "background-color") style.backgroundColor = sanitizeColor(value);
    if (key === "color") style.color = sanitizeColor(value);
    if (key === "font-weight") style.fontWeight = sanitizeFontWeight(value);
    if (key === "font-style") style.fontStyle = value === "italic" ? "italic" : undefined;
    if (key === "text-align" && ["left", "center", "right"].includes(value)) style.textAlign = value;
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
  Object.keys(output).forEach((key) => { if (!output[key]) delete output[key]; });
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
  return Array.from(clipboardData.types).filter((type) => /^text\//i.test(type) && !["text/html", "text/plain"].includes(type)).map((type) => {
    try { return clipboardData.getData(type) || ""; } catch { return ""; }
  }).filter(Boolean).join("\n");
}

function safeQuerySelectorAll(root, selector) {
  try { return Array.from(root?.querySelectorAll?.(selector) || []); } catch { return []; }
}

function normalizeCellText(value) {
  return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeEscapedText(value) {
  return String(value || "").replace(/\\u0026/gi, "&").replace(/\\u003d/gi, "=").replace(/\\u003c/gi, "<").replace(/\\u003e/gi, ">").replace(/\\\//g, "/").replace(/&amp;/g, "&");
}

function fixEncodedProtocol(value) {
  return String(value || "").replace(/^https:%2f%2f/i, "https://").replace(/^http:%2f%2f/i, "http://").replace(/^ftp:%2f%2f/i, "ftp://");
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
  const map = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&#x27;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " " };
  return String(value).replace(/&(amp|quot|lt|gt|nbsp);|&#39;|&#x27;/g, (match) => map[match] || match);
}

function safeDecodeRepeated(value) {
  let output = String(value || "");
  for (let index = 0; index < 2; index += 1) {
    try { const decoded = decodeURIComponent(output); if (decoded === output) break; output = decoded; } catch { break; }
  }
  return output;
}

function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeTsvCell(value) {
  return String(value ?? "").replace(/\r?\n/g, " ").replace(/\t/g, " ").trim();
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

function estimateProcessingTime(cells) {
  const rawLength = (cells || []).flat().map((cell) => `${cell.text || ""} ${(cell.links || []).join(" ")}`).join("\n").length;
  const links = (cells || []).flat().reduce((total, cell) => total + (cell?.links?.length || 0), 0);
  const rows = cells.length;
  const estimated = MIN_PROCESSING_TIME_MS + rawLength * 0.025 + rows * 12 + links * 40;
  return clampNumber(Math.round(estimated), MIN_PROCESSING_TIME_MS, MAX_PROCESSING_TIME_MS);
}

function columnNumberToName(number) {
  let result = "";
  let current = number;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }
  return result || "A";
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (Number.isNaN(number)) return min;
  return Math.min(max, Math.max(min, number));
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
