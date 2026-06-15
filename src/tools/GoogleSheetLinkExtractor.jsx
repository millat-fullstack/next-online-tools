import { useMemo, useRef, useState } from "react";
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

export default function GoogleSheetLinkExtractor() {
  const pasteBoxRef = useRef(null);

  const [sourceData, setSourceData] = useState({ html: "", text: "" });
  const [copySuccess, setCopySuccess] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState(false);
  const [extractAllLinks, setExtractAllLinks] = useState(true);
  const [preserveLayout, setPreserveLayout] = useState(true);

  const parsedResult = useMemo(() => {
    return extractLinksFromClipboard(
      sourceData.html,
      sourceData.text,
      extractAllLinks
    );
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

  const hasOutput = Boolean(outputText);
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
                This tool checks rich HTML, hidden anchor links, pasted text,
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
                  disabled={!hasOutput}
                  className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    hasOutput
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
                value={outputText}
                readOnly
                rows="13"
                className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none bg-gray-50 resize-none font-mono text-sm"
                placeholder="Extracted links will appear here..."
              />
            </div>

            {!hasOutput && (
              <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                <ClipboardPaste size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="text-[var(--text-secondary)]">
                  Paste copied Google Sheets cells to extract hidden links.
                </p>
              </div>
            )}

            {hasOutput && (
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

function extractLinksFromClipboard(html, text, extractAllLinks) {
  const matrices = [];

  if (html) {
    const htmlMatrix = extractLinksFromHtmlTable(html, extractAllLinks);

    if (htmlMatrix.length) {
      matrices.push(htmlMatrix);
    }
  }

  if (text) {
    const textMatrix = extractLinksFromPlainText(text, extractAllLinks);

    if (textMatrix.length) {
      matrices.push(textMatrix);
    }
  }

  if (!matrices.length) {
    return { matrix: [] };
  }

  const bestMatrix = matrices.sort((a, b) => {
    const bLinks = getAllLinksFromMatrix(b).length;
    const aLinks = getAllLinksFromMatrix(a).length;

    if (bLinks !== aLinks) return bLinks - aLinks;

    return b.length - a.length;
  })[0];

  return {
    matrix: normalizeMatrix(bestMatrix),
  };
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
        name.includes("data") ||
        name.includes("title") ||
        name.includes("aria") ||
        value.includes("http") ||
        value.includes("www.") ||
        value.includes("mailto:") ||
        value.includes("tel:")
      ) {
        candidates.push(value);
      }
    });
  });

  candidates.push(element.textContent || "");

  const allLinks = uniqueLinks(
    candidates
      .flatMap((candidate) => extractLinksFromValue(candidate))
      .map(cleanUrl)
      .filter(Boolean)
  );

  if (!allLinks.length) return "";

  return extractAllLinks ? allLinks.join(" | ") : allLinks[0];
}

function extractLinksFromPlainText(text, extractAllLinks) {
  return String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((row) =>
      row.split("\t").map((cell) => {
        const links = uniqueLinks(
          extractLinksFromValue(cell).map(cleanUrl).filter(Boolean)
        );

        if (!links.length) return "";

        return extractAllLinks ? links.join(" | ") : links[0];
      })
    );
}

function extractLinksFromValue(value) {
  if (!value) return [];

  const valuesToCheck = uniqueLinks([
    String(value),
    decodeHtmlEntities(String(value)),
    safeDecodeURIComponent(String(value)),
    safeDecodeURIComponent(decodeHtmlEntities(String(value))),
  ]);

  return valuesToCheck.flatMap((item) => findUrls(item));
}

function findUrls(value) {
  if (!value) return [];

  const urlRegex =
    /(?:https?:\/\/|www\.)[^\s"'<>]+|(?:mailto:|tel:)[^\s"'<>]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s"'<>]*)?/gi;

  const matches = String(value).match(urlRegex) || [];

  return matches.filter((item) => {
    const lower = item.toLowerCase();

    if (lower.includes("@") && !lower.startsWith("mailto:")) return true;
    if (lower.startsWith("http")) return true;
    if (lower.startsWith("www.")) return true;
    if (lower.startsWith("mailto:")) return true;
    if (lower.startsWith("tel:")) return true;

    return /(?:^|\.)[a-z]{2,}(?:\/|$)/i.test(lower);
  });
}

function cleanUrl(url) {
  if (!url) return "";

  let clean = decodeHtmlEntities(String(url))
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[),.;\]]+$/g, "");

  clean = safeDecodeURIComponent(clean);

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

  clean = extractRedirectTarget(clean) || clean;

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
      parsed.searchParams.get("target");

    if (
      target &&
      (host.includes("google.") ||
        host.includes("facebook.") ||
        host.includes("linkedin.") ||
        host.includes("l.instagram."))
    ) {
      const cleanedTarget = cleanUrl(target);
      return cleanedTarget || "";
    }
  } catch {
    return "";
  }

  return "";
}

function isUsefulLink(value) {
  if (!value) return false;

  const lower = value.toLowerCase();

  if (lower.startsWith("http://") || lower.startsWith("https://")) return true;
  if (lower.startsWith("mailto:")) return true;
  if (lower.startsWith("tel:")) return true;

  return false;
}

function isBareDomain(value) {
  return /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/.*)?$/i.test(value);
}

function getLinksFromCell(cell) {
  if (!cell) return [];

  return uniqueLinks(
    String(cell)
      .split(" | ")
      .flatMap((part) => extractLinksFromValue(part))
      .map(cleanUrl)
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

function uniqueLinks(links) {
  return Array.from(new Set((links || []).filter(Boolean)));
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

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
