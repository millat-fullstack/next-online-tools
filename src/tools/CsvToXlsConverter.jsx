import { useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "CSV to XLS Converter",
  path: "/csv-to-xls-converter",
  category: "Document Tools",
  description:
    "Convert CSV files to Excel format in seconds. Get clean, editable spreadsheet output for Microsoft Excel.",
  metaTitle: "CSV to XLS Converter | Convert CSV to Excel Online Free",
  metaDescription:
    "Convert CSV files to XLS or XLSX online for free. Fast, secure, browser-based CSV to Excel converter with preview and clean output.",
};

export default function CsvToXlsConverter() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [outputFormat, setOutputFormat] = useState("xlsx");
  const [convertedUrl, setConvertedUrl] = useState("");
  const [convertedName, setConvertedName] = useState("");
  const [convertedSize, setConvertedSize] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "0 B";

    const sizes = ["B", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${sizes[index]}`;
  };

  const getBaseName = (name) => {
    return name.replace(/\.[^/.]+$/, "");
  };

  const isValidCsvFile = (selectedFile) => {
    const fileName = selectedFile.name.toLowerCase();

    return (
      fileName.endsWith(".csv") ||
      selectedFile.type === "text/csv" ||
      selectedFile.type === "application/vnd.ms-excel"
    );
  };

  const clearOldOutput = () => {
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
    }

    setConvertedUrl("");
    setConvertedName("");
    setConvertedSize(null);
    setSuccess("");
  };

  const handleFile = (selectedFile) => {
    setError("");
    setSuccess("");
    clearOldOutput();

    if (!selectedFile) return;

    if (!isValidCsvFile(selectedFile)) {
      setError("Please upload a valid CSV file.");
      return;
    }

    const maxSize = 20 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("File is too large. Please upload a CSV file under 20MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csvText = event.target.result;

        const parsedWorkbook = XLSX.read(csvText, {
          type: "string",
          raw: false,
          cellDates: true,
        });

        const firstSheetName = parsedWorkbook.SheetNames[0];
        const firstSheet = parsedWorkbook.Sheets[firstSheetName];

        const rows = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          defval: "",
          blankrows: false,
        });

        if (!rows.length) {
          setError("This CSV file seems empty.");
          return;
        }

        const columnCount = rows.reduce(
          (max, row) => Math.max(max, row.length),
          0
        );

        setFile(selectedFile);
        setWorkbook(parsedWorkbook);
        setPreviewRows(rows.slice(0, 8));
        setStats({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          rows: rows.length,
          columns: columnCount,
        });

        setSuccess("CSV file loaded successfully. Ready to convert.");
      } catch (err) {
        setError("Could not read this CSV file. Please check the file format.");
      }
    };

    reader.onerror = () => {
      setError("Something went wrong while reading the file.");
    };

    reader.readAsText(selectedFile, "UTF-8");
  };

  const handleInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    handleFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const selectedFile = e.dataTransfer.files?.[0];
    handleFile(selectedFile);
  };

  const autoFitColumns = (worksheet, rows) => {
    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);

    const columnWidths = Array.from({ length: columnCount }, (_, colIndex) => {
      const maxLength = rows.reduce((max, row) => {
        const value = row[colIndex] ? String(row[colIndex]) : "";
        return Math.max(max, value.length);
      }, 10);

      return {
        wch: Math.min(Math.max(maxLength + 2, 10), 45),
      };
    });

    worksheet["!cols"] = columnWidths;
  };

  const handleConvert = () => {
    setError("");
    setSuccess("");

    if (!file || !workbook) {
      setError("Please upload a CSV file first.");
      return;
    }

    try {
      const firstSheetName = workbook.SheetNames[0];
      const originalSheet = workbook.Sheets[firstSheetName];

      const rows = XLSX.utils.sheet_to_json(originalSheet, {
        header: 1,
        defval: "",
        blankrows: false,
      });

      const newWorkbook = XLSX.utils.book_new();
      const newSheet = XLSX.utils.aoa_to_sheet(rows);

      autoFitColumns(newSheet, rows);

      XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Sheet1");

      const outputData = XLSX.write(newWorkbook, {
        bookType: outputFormat,
        type: "array",
        cellStyles: true,
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
      setSuccess("Conversion completed successfully. Your Excel file is ready.");
    } catch (err) {
      setError("Conversion failed. Please try another CSV file.");
    }
  };

  const handleDownload = () => {
    if (!convertedUrl) return;

    const link = document.createElement("a");
    link.href = convertedUrl;
    link.download = convertedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
    }

    setFile(null);
    setWorkbook(null);
    setPreviewRows([]);
    setStats(null);
    setOutputFormat("xlsx");
    setConvertedUrl("");
    setConvertedName("");
    setConvertedSize(null);
    setError("");
    setSuccess("");
    setIsDragging(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* TOOL HEADER */}
      <section className="bg-white border rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-7 h-7 text-[var(--primary)]" />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-3">CSV to XLS Converter</h1>
            <p className="text-[var(--text-secondary)]">
              Convert CSV files to Excel format in seconds. Preview your data,
              choose XLS or XLSX, and download a clean spreadsheet file.
            </p>
          </div>
        </div>
      </section>

      {/* TOOL BODY */}
      <section className="bg-white border rounded-2xl shadow-sm p-6">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
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
            Drag and drop your CSV file here, or click the button below.
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

        {/* FEEDBACK */}
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

        {/* SETTINGS */}
        <div className="grid md:grid-cols-2 gap-5 mt-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Output Format
            </label>

            <select
              value={outputFormat}
              onChange={(e) => {
                setOutputFormat(e.target.value);
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
              The output keeps your rows and columns editable in Excel. XLSX is
              recommended for the best compatibility with modern Microsoft
              Office.
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={handleConvert}
            disabled={!file}
            className={`btn-primary inline-flex items-center justify-center gap-2 ${
              !file ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Zap className="w-4 h-4" />
            Convert to Excel
          </button>

          <button
            type="button"
            onClick={handleReset}
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

      {/* STATS */}
      {stats && (
        <section className="bg-white border rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">File Details</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">Rows</p>
              <p className="text-2xl font-bold">{stats.rows}</p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">Columns</p>
              <p className="text-2xl font-bold">{stats.columns}</p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Original Size
              </p>
              <p className="text-2xl font-bold">{formatBytes(stats.fileSize)}</p>
            </div>

            <div className="bg-gray-50 border rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Converted Size
              </p>
              <p className="text-2xl font-bold">
                {convertedSize ? formatBytes(convertedSize) : "-"}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* PREVIEW */}
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
                  <tr
                    key={rowIndex}
                    className={rowIndex === 0 ? "bg-gray-100" : "bg-white"}
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="border px-3 py-2 whitespace-nowrap"
                      >
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

      {/* SUGGESTED TOOLS */}
      <SuggestedTools currentToolId="csv-to-xls-converter" />
    </div>
  );
}