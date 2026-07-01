import { useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "CSV to XLS Converter",
  path: "/csv-to-xls-converter",
  category: "Document Tools",
  description:
    "Convert CSV files to XLS or XLSX in seconds. Get clean, editable spreadsheet output for Microsoft Excel.",
  metaTitle: "CSV to XLS Converter | Convert CSV to Excel Online Free",
  metaDescription:
    "Convert CSV files to XLS or XLSX online for free. Fast, secure, browser-based CSV to Excel converter with preview and clean output.",
};

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const PREVIEW_ROW_LIMIT = 8;

export default function CsvToXlsConverter() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [outputFormat, setOutputFormat] = useState("xlsx");
  const [convertedUrl, setConvertedUrl] = useState("");
  const [convertedName, setConvertedName] = useState("");
  const [convertedSize, setConvertedSize] = useState(null);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  function clearOldOutput() {
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
    }

    setConvertedUrl("");
    setConvertedName("");
    setConvertedSize(null);
    setProcessingTimeMs(0);
    setSuccess("");
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function isValidCsvFile(selectedFile) {
    if (!selectedFile) return false;

    const fileName = selectedFile.name.toLowerCase();

    return (
      fileName.endsWith(".csv") ||
      selectedFile.type === "text/csv" ||
      selectedFile.type === "application/csv" ||
      selectedFile.type === "application/vnd.ms-excel" ||
      selectedFile.type === "text/plain"
    );
  }

  function handleFile(selectedFile) {
    setError("");
    setSuccess("");
    clearOldOutput();

    if (!selectedFile) return;

    if (!isValidCsvFile(selectedFile)) {
      setError("Please upload a valid CSV file.");
      resetFileInput();
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large. Please upload a CSV file under ${MAX_FILE_SIZE_MB} MB.`);
      resetFileInput();
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csvText = String(event.target?.result || "");

        if (!csvText.trim()) {
          setError("This CSV file seems empty.");
          return;
        }

        const parsedWorkbook = XLSX.read(csvText, {
          type: "string",
          raw: false,
          cellDates: true,
          dense: false,
        });

        const firstSheetName = parsedWorkbook.SheetNames[0];
        const firstSheet = parsedWorkbook.Sheets[firstSheetName];

        const parsedRows = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          defval: "",
          blankrows: false,
        });

        if (!parsedRows.length) {
          setError("This CSV file seems empty.");
          return;
        }

        const columnCount = parsedRows.reduce(
          (max, row) => Math.max(max, Array.isArray(row) ? row.length : 0),
          0
        );

        setFile(selectedFile);
        setRows(parsedRows);
        setPreviewRows(parsedRows.slice(0, PREVIEW_ROW_LIMIT));
        setStats({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          rows: parsedRows.length,
          columns: columnCount,
        });

        setSuccess("CSV file loaded successfully. Ready to convert.");
      } catch (err) {
        console.error("CSV read error:", err);
        setError("Could not read this CSV file. Please check the file format.");
      }
    };

    reader.onerror = () => {
      setError("Something went wrong while reading the file.");
    };

    reader.readAsText(selectedFile, "UTF-8");
  }

  function handleInputChange(event) {
    handleFile(event.target.files?.[0]);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  function handleConvert() {
    setError("");
    setSuccess("");

    if (!file || !rows.length) {
      setError("Please upload a CSV file first.");
      return;
    }

    setIsProcessing(true);
    const startTime = performance.now();

    try {
      const newWorkbook = XLSX.utils.book_new();
      const newSheet = XLSX.utils.aoa_to_sheet(rows);

      autoFitColumns(newSheet, rows);

      XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Sheet1");

      const outputData = XLSX.write(newWorkbook, {
        bookType: outputFormat,
        type: "array",
        cellStyles: true,
        compression: outputFormat === "xlsx",
      });

      const blob = new Blob([outputData], {
        type:
          outputFormat === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/vnd.ms-excel",
      });

      const url = URL.createObjectURL(blob);
      const name = `${getBaseName(file.name)}.${outputFormat}`;

      if (convertedUrl) {
        URL.revokeObjectURL(convertedUrl);
      }

      setConvertedUrl(url);
      setConvertedName(name);
      setConvertedSize(blob.size);
      setProcessingTimeMs(Math.max(1, Math.round(performance.now() - startTime)));
      setSuccess(`${outputFormat.toUpperCase()} file created successfully. Download is ready.`);
    } catch (err) {
      console.error("CSV to Excel conversion error:", err);
      setError(
        outputFormat === "xls"
          ? "XLS conversion failed. Make sure the xlsx package is installed, or try XLSX format."
          : "Conversion failed. Please try another CSV file."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDownload() {
    if (!convertedUrl) return;

    try {
      const link = document.createElement("a");
      link.href = convertedUrl;
      link.download = convertedName || `converted.${outputFormat}`;
      link.rel = "noopener";
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setError("Could not start the download. Please try again.");
    }
  }

  function handleReset() {
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
    }

    setFile(null);
    setRows([]);
    setPreviewRows([]);
    setStats(null);
    setOutputFormat("xlsx");
    setConvertedUrl("");
    setConvertedName("");
    setConvertedSize(null);
    setProcessingTimeMs(0);
    setError("");
    setSuccess("");
    setIsDragging(false);
    setIsProcessing(false);
    resetFileInput();
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-white border rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-7 h-7 text-[var(--primary)]" />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-3">CSV to XLS Converter</h1>
            <p className="text-[var(--text-secondary)]">
              Convert CSV files to XLS or XLSX in seconds. Preview your data,
              choose an output format, and download a clean Excel file.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white border rounded-2xl shadow-sm p-6">
        <div
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${
            isDragging
              ? "border-[var(--primary)] bg-[var(--primary)]/5"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-white border shadow-sm flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7 text-[var(--primary)]" />
          </div>

          <h2 className="text-xl font-semibold mb-2">Upload CSV File</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-5">
            Drag and drop your CSV file here, or click the button below. Max {MAX_FILE_SIZE_MB} MB.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleInputChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Choose CSV File
          </button>

          {file && (
            <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">
              Selected: {file.name}
            </p>
          )}
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5 mt-6">
          <div>
            <label className="block text-sm font-medium mb-2">Output Format</label>

            <select
              value={outputFormat}
              onChange={(event) => {
                setOutputFormat(event.target.value);
                clearOldOutput();
              }}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            >
              <option value="xlsx">XLSX - Recommended for modern Excel</option>
              <option value="xls">XLS - Older Excel format</option>
            </select>
          </div>

          <div className="bg-gray-50 border rounded-xl p-4">
            <h3 className="font-semibold mb-1">Conversion Quality</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              XLSX is best for modern Excel. XLS is older but supported through the xlsx library.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={handleConvert}
            disabled={!file || isProcessing}
            className={`btn-primary inline-flex items-center justify-center gap-2 ${
              !file || isProcessing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isProcessing ? "Converting..." : "Convert to Excel"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isProcessing}
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          {convertedUrl && (
            <button
              type="button"
              onClick={handleDownload}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download {outputFormat.toUpperCase()}
            </button>
          )}
        </div>
      </section>

      {stats && (
        <section className="bg-white border rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">File Details</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Rows" value={stats.rows} />
            <StatCard label="Columns" value={stats.columns} />
            <StatCard label="Original Size" value={formatBytes(stats.fileSize)} />
            <StatCard label="Converted Size" value={convertedSize ? formatBytes(convertedSize) : "-"} />
            <StatCard label="Processing" value={processingTimeMs ? `${(processingTimeMs / 1000).toFixed(1)}s` : "-"} />
          </div>
        </section>
      )}

      {previewRows.length > 0 && (
        <section className="bg-white border rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-2">CSV Preview</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Showing the first few rows before conversion.
          </p>

          <div className="overflow-auto border rounded-xl">
            <table className="w-full text-sm border-collapse">
              <tbody>
                {previewRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex === 0 ? "bg-gray-100" : "bg-white"}>
                    {(Array.isArray(row) ? row : []).map((cell, cellIndex) => (
                      <td key={cellIndex} className="border px-3 py-2 whitespace-nowrap">
                        {cell || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <SuggestedTools currentToolId="csv-to-xls-converter" />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-50 border rounded-xl p-4">
      <p className="text-sm text-[var(--text-secondary)]">{label}</p>
      <p className="text-2xl font-bold break-all">{value}</p>
    </div>
  );
}

function autoFitColumns(worksheet, rows) {
  const columnCount = rows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);

  worksheet["!cols"] = Array.from({ length: columnCount }, (_, colIndex) => {
    const maxLength = rows.reduce((max, row) => {
      const value = row?.[colIndex] === undefined || row?.[colIndex] === null ? "" : String(row[colIndex]);
      return Math.max(max, value.length);
    }, 10);

    return {
      wch: Math.min(Math.max(maxLength + 2, 10), 45),
    };
  });
}

function getBaseName(name) {
  return String(name || "converted").replace(/\.[^/.]+$/, "");
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);

  if (value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / Math.pow(1024, index);

  return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}
