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
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Google Sheet Link Extractor",
  path: "/google-sheet-link-extractor",
  category: "Spreadsheet Tools",
  description:
    "Extract hidden hyperlinks from copied Google Sheets cells and copy them back with the same row and column format.",
  metaTitle:
    "Google Sheet Link Extractor - Extract Hidden Links from Cells | Next Online Tools",
  metaDescription:
    "Free Google Sheet link extractor tool to extract hidden hyperlinks from copied spreadsheet cells. Paste Google Sheets cells, extract links, and copy them back accurately in the same row and column format.",
};

export default function GoogleSheetLinkExtractor() {
  const pasteBoxRef = useRef(null);

  const [sourceData, setSourceData] = useState({
    html: "",
    text: "",
  });

  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [extractAllLinks, setExtractAllLinks] = useState(false);
  const [preserveLayout, setPreserveLayout] = useState(true);

  const parsedResult = useMemo(() => {
    return extractLinksFromClipboard(
      sourceData.html,
      sourceData.text,
      extractAllLinks
    );
  }, [sourceData.html, sourceData.text, extractAllLinks]);

  const outputText = useMemo(() => {
    if (!parsedResult.matrix.length) return "";

    if (preserveLayout) {
      return matrixToTsv(parsedResult.matrix);
    }

    return parsedResult.matrix
      .flat()
      .map((item) => item.trim())
      .filter(Boolean)
      .join("\n");
  }, [parsedResult.matrix, preserveLayout]);

  const stats = useMemo(() => {
    const rows = parsedResult.matrix.length;
    const columns = parsedResult.matrix.reduce(
      (max, row) => Math.max(max, row.length),
      0
    );

    const totalCells = parsedResult.matrix.reduce(
      (total, row) => total + row.length,
      0
    );

    const linksFound = parsedResult.matrix
      .flat()
      .filter((cell) => cell && cell.trim()).length;

    const emptyCells = Math.max(totalCells - linksFound, 0);

    return {
      rows,
      columns,
      totalCells,
      linksFound,
      emptyCells,
    };
  }, [parsedResult.matrix]);

  const handlePaste = (event) => {
    event.preventDefault();

    const clipboardData = event.clipboardData || window.clipboardData;
    const html = clipboardData.getData("text/html") || "";
    const text = clipboardData.getData("text/plain") || "";

    setSourceData({ html, text });
    setCopySuccess(false);
    setDownloadSuccess(false);

    if (pasteBoxRef.current) {
      pasteBoxRef.current.innerText =
        text || "Spreadsheet data pasted successfully.";
    }
  };

  const copyToClipboard = async () => {
    if (!outputText) return;

    try {
      await navigator.clipboard.writeText(outputText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      fallbackCopy(outputText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const downloadTsvFile = () => {
    if (!outputText) return;

    const blob = new Blob([outputText], {
      type: "text/tab-separated-values;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "extracted-google-sheet-links.tsv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  const resetTool = () => {
    setSourceData({ html: "", text: "" });
    setCopySuccess(false);
    setDownloadSuccess(false);

    if (pasteBoxRef.current) {
      pasteBoxRef.current.innerText = "";
    }
  };

  const hasOutput = Boolean(outputText);

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
          hyperlinks in the same row and column format. Then copy the result and
          paste it back into Google Sheets with Ctrl + V.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
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
                className="w-full min-h-[300px] p-4 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white overflow-auto"
                data-placeholder="Copy cells from Google Sheets and paste here..."
              />

              {!sourceData.text && !sourceData.html && (
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Tip: Copy directly from Google Sheets so the hidden links stay
                  available in the pasted data.
                </p>
              )}
            </div>

            {/* OPTIONS */}
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-4 border border-[var(--border)] rounded-xl bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preserveLayout}
                  onChange={(e) => {
                    setPreserveLayout(e.target.checked);
                    setCopySuccess(false);
                  }}
                  className="mt-1 accent-[var(--primary)]"
                />

                <span>
                  <span className="block font-semibold text-sm">
                    Preserve sheet layout
                  </span>
                  <span className="block text-xs text-[var(--text-secondary)]">
                    Best for pasting links back into the same cells.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 p-4 border border-[var(--border)] rounded-xl bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={extractAllLinks}
                  onChange={(e) => {
                    setExtractAllLinks(e.target.checked);
                    setCopySuccess(false);
                  }}
                  className="mt-1 accent-[var(--primary)]"
                />

                <span>
                  <span className="block font-semibold text-sm">
                    Extract all links per cell
                  </span>
                  <span className="block text-xs text-[var(--text-secondary)]">
                    Useful when one cell contains multiple links.
                  </span>
                </span>
              </label>
            </div>

            {/* INPUT STATS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Rows" value={stats.rows} />
              <StatCard label="Columns" value={stats.columns} />
              <StatCard label="Cells" value={stats.totalCells} />
              <StatCard label="Links" value={stats.linksFound} />
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
                This tool works best when you copy cells directly from Google
                Sheets. It runs only in your browser and does not use any Google
                API.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-start gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Extracted Links</h3>
                    <Table size={16} className="text-[var(--primary)]" />
                  </div>

                  <p className="text-xs text-[var(--text-secondary)]">
                    Mode:{" "}
                    <span className="font-medium text-[var(--primary)]">
                      {preserveLayout
                        ? "Spreadsheet-ready format"
                        : "One link per line"}
                    </span>
                  </p>
                </div>

                <button
                  onClick={copyToClipboard}
                  disabled={!hasOutput}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
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
                rows="12"
                className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none bg-gray-50 resize-none font-mono text-sm"
                placeholder="Extracted links will appear here..."
              />
            </div>

            {/* OUTPUT STATS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Links Found" value={stats.linksFound} />
              <StatCard label="Empty Cells" value={stats.emptyCells} />
              <StatCard label="Output Rows" value={outputText ? outputText.split("\n").length : 0} />
              <StatCard label="Characters" value={outputText.length} />
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
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={copyToClipboard} className="btn-primary flex-1">
                    {copySuccess ? (
                      <>
                        <Check size={18} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copy Links
                      </>
                    )}
                  </button>

                  <button onClick={downloadTsvFile} className="btn-secondary flex-1">
                    {downloadSuccess ? (
                      <>
                        <Check size={18} />
                        Downloaded
                      </>
                    ) : (
                      <>
                        <Download size={18} />
                        Download TSV
                      </>
                    )}
                  </button>
                </div>

                <PreviewTable matrix={parsedResult.matrix} />
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

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-50 border border-[var(--border)] p-4 rounded-xl text-center">
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="text-xl font-bold text-[var(--primary)]">{value}</p>
    </div>
  );
}

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
                    className="p-3 border-r border-gray-100 max-w-[180px] truncate"
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
  let matrix = [];

  if (html) {
    const htmlMatrix = extractLinksFromHtmlTable(html, extractAllLinks);

    if (htmlMatrix.length) {
      matrix = htmlMatrix;
    }
  }

  const hasLinks = matrix.flat().some((cell) => cell && cell.trim());

  if ((!matrix.length || !hasLinks) && text) {
    matrix = extractLinksFromPlainText(text, extractAllLinks);
  }

  return {
    matrix: normalizeMatrix(matrix),
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

  const rows = Array.from(table.querySelectorAll("tr"));

  return rows.map((tr) => {
    const cells = Array.from(tr.children).filter((child) =>
      ["TD", "TH"].includes(child.tagName)
    );

    const row = [];

    cells.forEach((cell) => {
      const value = extractLinksFromElement(cell, extractAllLinks);
      const colSpan = Number(cell.getAttribute("colspan")) || 1;

      row.push(value);

      for (let index = 1; index < colSpan; index += 1) {
        row.push("");
      }
    });

    return row;
  });
}

function extractLinksFromElement(element, extractAllLinks) {
  const anchorLinks = Array.from(element.querySelectorAll("a[href]"))
    .map((anchor) => cleanUrl(anchor.getAttribute("href")))
    .filter(Boolean);

  const attributeLinks = Array.from(element.attributes || [])
    .flatMap((attribute) => findUrls(attribute.value))
    .map(cleanUrl)
    .filter(Boolean);

  const textLinks = findUrls(element.textContent || "")
    .map(cleanUrl)
    .filter(Boolean);

  const allLinks = uniqueLinks([
    ...anchorLinks,
    ...attributeLinks,
    ...textLinks,
  ]);

  if (!allLinks.length) return "";

  if (extractAllLinks) {
    return allLinks.join(" | ");
  }

  return allLinks[0];
}

function extractLinksFromPlainText(text, extractAllLinks) {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((row) =>
      row.split("\t").map((cell) => {
        const links = uniqueLinks(findUrls(cell).map(cleanUrl).filter(Boolean));

        if (!links.length) return "";

        return extractAllLinks ? links.join(" | ") : links[0];
      })
    );
}

function findUrls(value) {
  if (!value) return [];

  const urlRegex =
    /((?:https?:\/\/|www\.|mailto:|tel:)[^\s"'<>]+)|([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s"'<>]*)?)/gi;

  const matches = value.match(urlRegex) || [];

  return matches.filter((item) => {
    const lower = item.toLowerCase();

    return (
      lower.startsWith("http") ||
      lower.startsWith("www.") ||
      lower.startsWith("mailto:") ||
      lower.startsWith("tel:") ||
      lower.includes("linkedin.") ||
      lower.includes("facebook.") ||
      lower.includes("instagram.") ||
      lower.includes("youtube.") ||
      lower.includes("x.com") ||
      lower.includes("twitter.") ||
      lower.includes(".com") ||
      lower.includes(".net") ||
      lower.includes(".org") ||
      lower.includes(".io") ||
      lower.includes(".co")
    );
  });
}

function cleanUrl(url) {
  if (!url) return "";

  return url
    .trim()
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[),.;\]]+$/g, "");
}

function uniqueLinks(links) {
  return Array.from(new Set(links.filter(Boolean)));
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

function matrixToTsv(matrix) {
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