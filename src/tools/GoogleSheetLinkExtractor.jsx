import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link2,
  Copy,
  RotateCcw,
  Check,
  ClipboardPaste,
  Table,
  AlertCircle,
  Download,
  FileSpreadsheet,
  Clock3,
  Loader2,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

const MIN_PROCESSING_TIME_MS = 700;
const MAX_PROCESSING_TIME_MS = 9000;

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

export default function GoogleSheetLinkExtractor() {
  const pasteBoxRef = useRef(null);

  const [sourceData, setSourceData] = useState({ html: "", text: "" });
  const [copySuccess, setCopySuccess] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState(false);
  const [extractAllLinks, setExtractAllLinks] = useState(true);
  const [preserveLayout, setPreserveLayout] = useState(true);

  const [parsedResult, setParsedResult] = useState({
    matrix: [],
    diagnostics: { htmlLinks: 0, textLinks: 0, mergedLinks: 0 },
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [estimatedProcessingTimeMs, setEstimatedProcessingTimeMs] = useState(0);

  useEffect(() => {
    if (!sourceData.html && !sourceData.text) {
      setParsedResult({
        matrix: [],
        diagnostics: { htmlLinks: 0, textLinks: 0, mergedLinks: 0 },
      });
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
    setProcessingProgress(6);
    setProcessingTimeMs(0);
    setEstimatedProcessingTimeMs(estimate);
    setParsedResult({
      matrix: [],
      diagnostics: { htmlLinks: 0, textLinks: 0, mergedLinks: 0 },
    });

    const progressTimer = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(92, Math.round((elapsed / estimate) * 92));
      setProcessingProgress(Math.max(6, progress));
    }, 90);

    const parseTimer = window.setTimeout(() => {
      try {
        const result = extractLinksFromClipboard(
          sourceData.html,
          sourceData.text,
          extractAllLinks
        );

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
          }, 800);
        }, remaining);
      } catch {
        if (cancelled) return;

        setParsedResult({
          matrix: [],
          diagnostics: { htmlLinks: 0, textLinks: 0, mergedLinks: 0 },
        });
        setProcessingTimeMs(Math.round(performance.now() - startTime));
        setProcessingProgress(0);
        setIsProcessing(false);
      }
    }, 30);

    return () => {
      cancelled = true;
      window.clearInterval(progressTimer);
      window.clearTimeout(parseTimer);
      if (finishTimer) window.clearTimeout(finishTimer);
    };
  }, [sourceData.html, sourceData.text, extractAllLinks]);

  const exportMatrix = useMemo(() => {
    if (!parsedResult.matrix.length) return [];

    if (preserveLayout) {
      return parsedResult.matrix;
    }

    return getAllLinksFromMatrix(parsedResult.matrix).map((link) => [link]);
  }, [parsedResult.matrix, preserveLayout]);

  const outputText = useMemo(() => {
    if (!exportMatrix.length) return "";

    if (preserveLayout) {
      return matrixToClipboardText(exportMatrix);
    }

    return exportMatrix.map((row) => row[0]).filter(Boolean).join("\n");
  }, [exportMatrix, preserveLayout]);

  const stats = useMemo(() => {
    const rows = parsedResult.matrix.length;
    const columns = parsedResult.matrix.reduce(
      (max, row) => Math.max(max, row.length),
      0
    );
    const linksFound = getAllLinksFromMatrix(parsedResult.matrix).length;
    const cellsWithLinks = parsedResult.matrix
      .flat()
      .filter((cell) => getLinksFromCell(cell).length).length;

    return { rows, columns, linksFound, cellsWithLinks };
  }, [parsedResult.matrix]);

  const hasOutput = Boolean(outputText) && !isProcessing;
  const hasPastedData = Boolean(sourceData.html || sourceData.text);

  function handlePaste(event) {
    event.preventDefault();

    const clipboardData = event.clipboardData || window.clipboardData;
    const html = clipboardData.getData("text/html") || "";
    const text = clipboardData.getData("text/plain") || "";

    setSourceData({ html, text });
    setCopySuccess(false);
    setCsvSuccess(false);
    setExcelSuccess(false);
    setParsedResult({
      matrix: [],
      diagnostics: { htmlLinks: 0, textLinks: 0, mergedLinks: 0 },
    });
    setIsProcessing(false);
    setProcessingProgress(0);
    setProcessingTimeMs(0);
    setEstimatedProcessingTimeMs(0);

    if (pasteBoxRef.current) {
      pasteBoxRef.current.innerText =
        text || "Spreadsheet data pasted successfully.";
    }
  }

  async function copyToClipboard() {
    if (!outputText) return;

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
    if (!exportMatrix.length) return;

    const csv = matrixToCsv(exportMatrix);
    downloadTextFile({
      content: csv,
      fileName: "extracted-google-sheet-links.csv",
      mimeType: "text/csv;charset=utf-8",
    });

    setCsvSuccess(true);
    window.setTimeout(() => setCsvSuccess(false), 2000);
  }

  function downloadExcelFile() {
    if (!exportMatrix.length) return;

    const excelHtml = matrixToExcelHtml(exportMatrix);
    downloadTextFile({
      content: excelHtml,
      fileName: "extracted-google-sheet-links.xls",
      mimeType: "application/vnd.ms-excel;charset=utf-8",
    });

    setExcelSuccess(true);
    window.setTimeout(() => setExcelSuccess(false), 2000);
  }

  function resetTool() {
    setSourceData({ html: "", text: "" });
    setCopySuccess(false);
    setCsvSuccess(false);
    setExcelSuccess(false);
    setParsedResult({
      matrix: [],
      diagnostics: { htmlLinks: 0, textLinks: 0, mergedLinks: 0 },
    });
    setIsProcessing(false);
    setProcessingProgress(0);
    setProcessingTimeMs(0);
    setEstimatedProcessingTimeMs(0);

    if (pasteBoxRef.current) {
      pasteBoxRef.current.innerText = "";
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Link2 size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">
          Google Sheet Link Extractor
        </h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Copy cells from Google Sheets, paste them here, and extract hidden
          hyperlinks accurately. Copy the links back to Sheets or download them
          as CSV or Excel.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-center gap-3 mb-3">
                <h3 className="font-semibold text-lg">
                  Paste Google Sheets Cells
                </h3>

                <span className="text-xs text-[var(--text-secondary)]">
                  Rich paste supported
                </span>
              </div>

              <div
                ref={pasteBoxRef}
                onPaste={handlePaste}
                contentEditable
                suppressContentEditableWarning
                className="w-full min-h-[320px] p-4 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white overflow-auto"
                data-placeholder="Copy cells from Google Sheets and paste here..."
              />

              {!hasPastedData && (
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Tip: Copy directly from Google Sheets so hidden cell links stay
                  available in the rich pasted data.
                </p>
              )}
            </div>

            {/* OPTIONS */}
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-4 border border-[var(--border)] rounded-xl bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preserveLayout}
                  onChange={(event) => {
                    setPreserveLayout(event.target.checked);
                    setCopySuccess(false);
                    setCsvSuccess(false);
                    setExcelSuccess(false);
                  }}
                  className="mt-1 accent-[var(--primary)]"
                />

                <span>
                  <span className="block font-semibold text-sm">
                    Preserve sheet layout
                  </span>
                  <span className="block text-xs text-[var(--text-secondary)]">
                    Best when you want links in the same row and column format.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 p-4 border border-[var(--border)] rounded-xl bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={extractAllLinks}
                  onChange={(event) => {
                    setExtractAllLinks(event.target.checked);
                    setCopySuccess(false);
                    setCsvSuccess(false);
                    setExcelSuccess(false);
                  }}
                  className="mt-1 accent-[var(--primary)]"
                />

                <span>
                  <span className="block font-semibold text-sm">
                    Extract all links per cell
                  </span>
                  <span className="block text-xs text-[var(--text-secondary)]">
                    Recommended when one cell contains multiple links.
                  </span>
                </span>
              </label>
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
                      {isProcessing ? "Processing pasted data..." : "Processing completed"}
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

                {!isProcessing && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    Processed {stats.rows} row{stats.rows === 1 ? "" : "s"} and
                    detected {stats.linksFound} real link{stats.linksFound === 1 ? "" : "s"}.
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={resetTool} className="btn-secondary flex-1">
                <RotateCcw size={18} />
                Clear All
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50 flex gap-3">
              <AlertCircle
                size={20}
                className="text-blue-600 shrink-0 mt-0.5"
              />

              <p className="text-sm text-blue-800">
                This tool checks rich HTML, Google Sheets table cells, anchor tags,
                data attributes, HYPERLINK formulas, redirect links, pasted text,
                and embedded URLs. It runs only in your browser and does not use
                any Google API.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Extracted Links</h3>
                    <Table size={16} className="text-[var(--primary)]" />
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {stats.linksFound} real link{stats.linksFound === 1 ? "" : "s"} found
                    {stats.rows ? ` from ${stats.rows} row${stats.rows === 1 ? "" : "s"}` : ""}
                    {stats.columns ? ` and ${stats.columns} column${stats.columns === 1 ? "" : "s"}` : ""}.
                  </p>
                </div>

                <button
                  onClick={copyToClipboard}
                  disabled={!hasOutput || isProcessing}
                  className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    hasOutput && !isProcessing
                      ? copySuccess
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-white text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary)]/5"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                  title="Copy extracted links"
                >
                  {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                  {copySuccess ? "Copied" : "Copy"}
                </button>
              </div>

              <textarea
                value={isProcessing ? "" : outputText}
                readOnly
                rows="13"
                className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none bg-gray-50 resize-none font-mono text-sm"
                placeholder={
                  isProcessing
                    ? "Processing pasted Google Sheets links..."
                    : "Extracted links will appear here..."
                }
              />
            </div>

            {!hasOutput && !isProcessing && (
              <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                <ClipboardPaste size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="text-[var(--text-secondary)]">
                  Paste copied Google Sheets cells to extract hidden links.
                </p>
              </div>
            )}

            {hasOutput && !isProcessing && (
              <>
                <div className="grid sm:grid-cols-3 gap-3">
                  <button onClick={copyToClipboard} className="btn-primary">
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

                  <button onClick={downloadCsvFile} className="btn-secondary">
                    {csvSuccess ? (
                      <>
                        <Check size={18} />
                        CSV Saved
                      </>
                    ) : (
                      <>
                        <Download size={18} />
                        Download CSV
                      </>
                    )}
                  </button>

                  <button onClick={downloadExcelFile} className="btn-secondary">
                    {excelSuccess ? (
                      <>
                        <Check size={18} />
                        Excel Saved
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet size={18} />
                        Download Excel
                      </>
                    )}
                  </button>
                </div>

                <PreviewTable matrix={exportMatrix} />
              </>
            )}
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="google-sheet-link-extractor" />
    </div>
  );
}

/* ---------------- Helper Components ---------------- */

function PreviewTable({ matrix }) {
  const previewRows = matrix.slice(0, 8);
  const maxColumns = Math.min(
    matrix.reduce((max, row) => Math.max(max, row.length), 0),
    5
  );

  if (!previewRows.length) return null;

  return (
    <div className="border border-[var(--border)] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-[var(--border)]">
        <h4 className="font-semibold text-sm">Preview</h4>
        <p className="text-xs text-[var(--text-secondary)]">
          Showing first 8 rows and 5 columns.
        </p>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <tbody>
            {previewRows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="border-b border-gray-100">
                {Array.from({ length: maxColumns }).map((_, colIndex) => (
                  <td
                    key={`cell-${rowIndex}-${colIndex}`}
                    className="p-3 border-r border-gray-100 max-w-[220px] truncate"
                    title={row[colIndex] || ""}
                  >
                    {row[colIndex] ? (
                      <span className="text-[var(--primary)]">
                        {row[colIndex]}
                      </span>
                    ) : (
                      <span className="text-gray-300">Empty</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Extractor Logic ---------------- */

function estimateProcessingTimeMs({ html, text }) {
  const raw = `${html || ""}\n${text || ""}`;
  const characters = raw.length;
  const rows = Math.max(1, (text || "").split(/\r?\n/).filter(Boolean).length);
  const possibleLinks =
    (raw.match(/https?:\/\/|www\.|mailto:|tel:|HYPERLINK\s*\(/gi) || []).length;

  const estimated =
    MIN_PROCESSING_TIME_MS +
    characters * 0.035 +
    rows * 12 +
    possibleLinks * 40;

  return clampNumber(
    Math.round(estimated),
    MIN_PROCESSING_TIME_MS,
    MAX_PROCESSING_TIME_MS
  );
}

function extractLinksFromClipboard(html, text, extractAllLinks) {
  const htmlMatrix = html ? extractLinksFromHtmlTable(html, extractAllLinks) : [];
  const textMatrix = text ? extractLinksFromPlainText(text, extractAllLinks) : [];

  const htmlLinks = getAllLinksFromMatrix(htmlMatrix).length;
  const textLinks = getAllLinksFromMatrix(textMatrix).length;

  const mergedMatrix = mergeMatricesByCell(
    htmlMatrix,
    textMatrix,
    extractAllLinks
  );
  const normalizedMatrix = normalizeMatrix(mergedMatrix);
  const mergedLinks = getAllLinksFromMatrix(normalizedMatrix).length;

  return {
    matrix: normalizedMatrix,
    diagnostics: {
      htmlLinks,
      textLinks,
      mergedLinks,
    },
  };
}

function mergeMatricesByCell(htmlMatrix, textMatrix, extractAllLinks) {
  if (!htmlMatrix.length && !textMatrix.length) return [];

  const maxRows = Math.max(htmlMatrix.length, textMatrix.length);
  const output = [];

  for (let rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
    const htmlRow = htmlMatrix[rowIndex] || [];
    const textRow = textMatrix[rowIndex] || [];
    const maxColumns = Math.max(htmlRow.length, textRow.length);
    const row = [];

    for (let colIndex = 0; colIndex < maxColumns; colIndex += 1) {
      const htmlLinks = getLinksFromCell(htmlRow[colIndex] || "");
      const textLinks = getLinksFromCell(textRow[colIndex] || "");
      const mergedLinks = uniqueLinks([...htmlLinks, ...textLinks]);

      row.push(formatCellLinks(mergedLinks, extractAllLinks));
    }

    output.push(row);
  }

  const totalLinks = getAllLinksFromMatrix(output).length;

  if (totalLinks > 0) return output;

  return htmlMatrix.length ? htmlMatrix : textMatrix;
}

function extractLinksFromHtmlTable(html, extractAllLinks) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const table = doc.querySelector("table");

  if (!table) {
    const links = extractLinksFromElement(doc.body, extractAllLinks);
    return links ? [[links]] : [];
  }

  const grid = [];
  const rows = Array.from(table.querySelectorAll("tr"));

  rows.forEach((tr, rowIndex) => {
    if (!grid[rowIndex]) grid[rowIndex] = [];

    let colIndex = 0;
    const cells = Array.from(tr.children).filter((child) =>
      ["TD", "TH"].includes(child.tagName)
    );

    cells.forEach((cell) => {
      while (grid[rowIndex][colIndex] !== undefined) {
        colIndex += 1;
      }

      const value = extractLinksFromElement(cell, extractAllLinks);
      const colSpan = Number(cell.getAttribute("colspan")) || 1;
      const rowSpan = Number(cell.getAttribute("rowspan")) || 1;

      for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
        const targetRow = rowIndex + rowOffset;
        if (!grid[targetRow]) grid[targetRow] = [];

        for (let colOffset = 0; colOffset < colSpan; colOffset += 1) {
          grid[targetRow][colIndex + colOffset] =
            rowOffset === 0 && colOffset === 0 ? value : "";
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

  if (typeof document !== "undefined" && typeof NodeFilter !== "undefined") {
    try {
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_COMMENT
      );

      let comment = walker.nextNode();

      while (comment) {
        candidates.push(comment.nodeValue || "");
        comment = walker.nextNode();
      }
    } catch {
      // Browser may not allow comment scanning in pasted fragments.
    }
  }

  candidates.push(element.textContent || "");

  const allLinks = uniqueLinks(
    candidates
      .flatMap((candidate) => extractLinksFromValue(candidate))
      .map((item) => cleanUrl(item))
      .filter(Boolean)
  );

  return formatCellLinks(allLinks, extractAllLinks);
}

function extractLinksFromPlainText(text, extractAllLinks) {
  return String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((row) =>
      row.split("\t").map((cell) => {
        const links = uniqueLinks(
          extractLinksFromValue(cell)
            .map((item) => cleanUrl(item))
            .filter(Boolean)
        );

        return formatCellLinks(links, extractAllLinks);
      })
    );
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

  const collected = [];

  variants.forEach((variant) => {
    collected.push(...extractHyperlinkFormulaTargets(variant));
    collected.push(...extractStringsFromJsonLike(variant));
    collected.push(...findUrls(variant));
  });

  return uniqueLinks(collected);
}

function extractHyperlinkFormulaTargets(value) {
  const text = String(value || "");
  const links = [];

  const hyperlinkRegex =
    /HYPERLINK\s*\(\s*(?:"([^"]+)"|'([^']+)'|([^,;)]+))/gi;

  let match = hyperlinkRegex.exec(text);

  while (match) {
    const target = match[1] || match[2] || match[3] || "";
    links.push(target.trim());
    match = hyperlinkRegex.exec(text);
  }

  return links;
}

function extractStringsFromJsonLike(value) {
  const text = String(value || "").trim();

  if (!text || (!text.startsWith("{") && !text.startsWith("["))) {
    return [];
  }

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

    return strings.flatMap((item) => findUrls(item));
  } catch {
    return [];
  }
}

function findUrls(value) {
  if (!value) return [];

  const text = String(value);

  const urlRegex =
    /(?:https?:\/\/|ftp:\/\/|www\.|mailto:|tel:)[^\s"'<>]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s"'<>]*)?/gi;

  const matches = text.match(urlRegex) || [];

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

  if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(clean)) {
    clean = `mailto:${clean}`;
  }

  if (clean.startsWith("//")) {
    clean = `https:${clean}`;
  }

  if (clean.startsWith("www.")) {
    clean = `https://${clean}`;
  }

  if (isBareDomain(clean)) {
    clean = `https://${clean}`;
  }

  if (depth < 2) {
    const redirectTarget = extractRedirectTarget(clean);

    if (redirectTarget && redirectTarget !== clean) {
      clean = cleanUrl(redirectTarget, depth + 1);
    }
  }

  if (!isUsefulLink(clean)) return "";

  return clean;
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

  if (lower.startsWith("http://")) return true;
  if (lower.startsWith("https://")) return true;
  if (lower.startsWith("ftp://")) return true;
  if (lower.startsWith("mailto:")) return true;
  if (lower.startsWith("tel:")) return true;

  return false;
}

function isBareDomain(value) {
  const text = String(value || "").trim();

  if (!/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/.*)?$/i.test(text)) {
    return false;
  }

  if (/^\d+\.\d+$/.test(text)) return false;
  if (text.includes("..")) return false;

  return true;
}

function getLinksFromCell(cell) {
  if (!cell) return [];

  return uniqueLinks(
    String(cell)
      .split(" | ")
      .flatMap((part) => extractLinksFromValue(part))
      .map((item) => cleanUrl(item))
      .filter(Boolean)
  );
}

function getAllLinksFromMatrix(matrix) {
  return uniqueLinks(
    (matrix || [])
      .flat()
      .flatMap((cell) => getLinksFromCell(cell))
      .filter(Boolean)
  );
}

function formatCellLinks(links, extractAllLinks) {
  const cleanLinks = uniqueLinks(
    (links || []).map((item) => cleanUrl(item)).filter(Boolean)
  );

  if (!cleanLinks.length) return "";

  return extractAllLinks ? cleanLinks.join(" | ") : cleanLinks[0];
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

function normalizeMatrix(matrix) {
  if (!matrix.length) return [];

  const maxColumns = matrix.reduce((max, row) => Math.max(max, row.length), 0);

  return matrix.map((row) => {
    const normalizedRow = [...row];

    while (normalizedRow.length < maxColumns) {
      normalizedRow.push("");
    }

    return normalizedRow;
  });
}

function matrixToClipboardText(matrix) {
  return matrix
    .map((row) =>
      row
        .map((cell) =>
          String(cell || "")
            .replace(/\t/g, " ")
            .replace(/\r?\n/g, " ")
            .trim()
        )
        .join("\t")
    )
    .join("\n");
}

function matrixToCsv(matrix) {
  return matrix
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\r\n");
}

function escapeCsvCell(value) {
  const text = String(value || "").replace(/\r?\n/g, " ");
  return `"${text.replace(/"/g, '""')}"`;
}

function matrixToExcelHtml(matrix) {
  const rows = matrix
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${escapeHtml(cell)}</td>`)
          .join("")}</tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
td { mso-number-format:"\\@"; }
</style>
</head>
<body>
<table>${rows}</table>
</body>
</html>`;
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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
