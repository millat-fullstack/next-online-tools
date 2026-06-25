import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Clock3,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  ReceiptText,
  RotateCcw,
  Trash2,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "PDF Invoice Generator",
  path: "/pdf-invoice-generator",
  category: "PDF Tools",
  description:
    "Create professional invoices with itemized billing, tax, discount, notes, and instant PDF download.",
  metaTitle: "PDF Invoice Generator - Create Professional Invoice Online",
  metaDescription:
    "Create a professional invoice online. Add business details, client details, invoice items, tax, discount, notes, and download as PDF instantly.",
};

const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "BDT", symbol: "৳" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "INR", symbol: "₹" },
  { code: "AUD", symbol: "A$" },
  { code: "CAD", symbol: "C$" },
];

const STATUS_OPTIONS = ["Unpaid", "Paid", "Partially Paid", "Draft"];
const MIN_PROCESSING_TIME_MS = 900;
const MAX_PROCESSING_TIME_MS = 9000;

function createDefaultInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `INV-${year}${month}-001`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function dueDateISO() {
  const date = new Date();
  date.setDate(date.getDate() + 15);

  return date.toISOString().slice(0, 10);
}

function createItem() {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    name: "Service",
    description: "",
    quantity: "1",
    rate: "100",
  };
}

export default function PdfInvoiceGenerator() {
  const logoInputRef = useRef(null);
  const outputUrlRef = useRef("");

  const [invoice, setInvoice] = useState({
    title: "INVOICE",
    invoiceNumber: createDefaultInvoiceNumber(),
    invoiceDate: todayISO(),
    dueDate: dueDateISO(),
    status: "Unpaid",
    currency: "USD",
    accentColor: "#111827",

    businessName: "Your Business Name",
    businessEmail: "business@example.com",
    businessPhone: "",
    businessAddress: "",

    clientName: "Client Name",
    clientEmail: "",
    clientAddress: "",

    taxLabel: "Tax",
    taxRate: "0",
    discountType: "percent",
    discountValue: "0",
    shipping: "0",
    amountPaid: "0",
    notes: "Thank you for your business.",
    paymentInstructions: "",
  });

  const [logoData, setLogoData] = useState(null);
  const [items, setItems] = useState([createItem()]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [outputUrl, setOutputUrl] = useState("");
  const [outputName, setOutputName] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const currency = CURRENCIES.find((item) => item.code === invoice.currency) || CURRENCIES[0];

  const totals = useMemo(() => calculateTotals(items, invoice), [invoice, items]);

  function updateInvoice(field, value) {
    setInvoice((current) => ({
      ...current,
      [field]: value,
    }));
    clearOutputOnly();
  }

  function updateItem(itemId, field, value) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
    clearOutputOnly();
  }

  function addItem() {
    setItems((current) => [...current, createItem()]);
    clearOutputOnly();
  }

  function removeItem(itemId) {
    setItems((current) => (current.length > 1 ? current.filter((item) => item.id !== itemId) : current));
    clearOutputOnly();
  }

  async function handleLogoUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    clearOutputOnly();

    if (!file.type.startsWith("image/")) {
      setError("Please upload a PNG or JPG logo.");
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const arrayBuffer = await file.arrayBuffer();

      setLogoData({
        name: file.name,
        type: file.type,
        dataUrl,
        bytes: arrayBuffer,
      });
    } catch {
      setError("Could not read this logo file.");
    } finally {
      event.target.value = "";
    }
  }

  async function createPdf() {
    if (!invoice.businessName.trim() || !invoice.clientName.trim()) {
      setError("Please add business name and client name.");
      return;
    }

    const cleanItems = items.filter((item) => item.name.trim() || Number(item.quantity) || Number(item.rate));

    if (!cleanItems.length) {
      setError("Please add at least one invoice item.");
      return;
    }

    setError("");
    setSuccess("");
    clearOutputOnly();
    setIsProcessing(true);
    setProgress(8);
    setProcessingTimeMs(0);

    const startedAt = performance.now();
    const estimatedMs = estimateProcessingTime(cleanItems.length);

    const progressTimer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      setProgress(Math.min(94, Math.max(8, Math.round((elapsed / estimatedMs) * 94))));
    }, 85);

    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();
      const fonts = {
        regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
        bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      };

      let embeddedLogo = null;

      if (logoData?.bytes) {
        try {
          if (logoData.type.includes("png")) {
            embeddedLogo = await pdfDoc.embedPng(logoData.bytes);
          } else if (logoData.type.includes("jpeg") || logoData.type.includes("jpg")) {
            embeddedLogo = await pdfDoc.embedJpg(logoData.bytes);
          }
        } catch {
          embeddedLogo = null;
        }
      }

      drawInvoicePdf({
        pdfDoc,
        fonts,
        invoice,
        items: cleanItems,
        totals,
        currency,
        logo: embeddedLogo,
        rgb,
      });

      await waitRemaining(startedAt, estimatedMs);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const name = `${sanitizeFileName(invoice.invoiceNumber || "invoice")}.pdf`;

      outputUrlRef.current = url;
      setOutputUrl(url);
      setOutputName(name);
      setProgress(100);
      setProcessingTimeMs(Math.max(1, Math.round(performance.now() - startedAt)));
      setSuccess("Invoice PDF created successfully.");
    } catch {
      setError("Could not create the invoice PDF. Please check your details and try again.");
    } finally {
      window.clearInterval(progressTimer);
      window.setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 500);
    }
  }

  function downloadPdf() {
    if (!outputUrl) return;

    const link = document.createElement("a");
    link.href = outputUrl;
    link.download = outputName || "invoice.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function resetTool() {
    clearOutputOnly();
    setInvoice({
      title: "INVOICE",
      invoiceNumber: createDefaultInvoiceNumber(),
      invoiceDate: todayISO(),
      dueDate: dueDateISO(),
      status: "Unpaid",
      currency: "USD",
      accentColor: "#111827",

      businessName: "Your Business Name",
      businessEmail: "business@example.com",
      businessPhone: "",
      businessAddress: "",

      clientName: "Client Name",
      clientEmail: "",
      clientAddress: "",

      taxLabel: "Tax",
      taxRate: "0",
      discountType: "percent",
      discountValue: "0",
      shipping: "0",
      amountPaid: "0",
      notes: "Thank you for your business.",
      paymentInstructions: "",
    });
    setLogoData(null);
    setItems([createItem()]);
    setIsProcessing(false);
    setProgress(0);
    setProcessingTimeMs(0);
    setSuccess("");
    setError("");
  }

  function clearOutputOnly() {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
    }

    outputUrlRef.current = "";
    setOutputUrl("");
    setOutputName("");
  }

  return (
    <div className="flex flex-col gap-8">
      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleLogoUpload}
        className="hidden"
      />

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <ReceiptText size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">PDF Invoice Generator</h1>

        <p className="text-[var(--text-secondary)] max-w-3xl">
          Create a professional invoice with itemized billing, automatic totals, tax,
          discount, notes, and instant PDF download.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="grid xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] gap-6">
          <div className="flex flex-col gap-4 min-w-0">
            <FormSection title="Invoice Details">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Invoice title">
                  <input
                    value={invoice.title}
                    onChange={(event) => updateInvoice("title", event.target.value)}
                    className="invoice-input"
                  />
                </Field>

                <Field label="Invoice number">
                  <input
                    value={invoice.invoiceNumber}
                    onChange={(event) => updateInvoice("invoiceNumber", event.target.value)}
                    className="invoice-input"
                  />
                </Field>

                <Field label="Invoice date">
                  <input
                    type="date"
                    value={invoice.invoiceDate}
                    onChange={(event) => updateInvoice("invoiceDate", event.target.value)}
                    className="invoice-input"
                  />
                </Field>

                <Field label="Due date">
                  <input
                    type="date"
                    value={invoice.dueDate}
                    onChange={(event) => updateInvoice("dueDate", event.target.value)}
                    className="invoice-input"
                  />
                </Field>

                <Field label="Currency">
                  <select
                    value={invoice.currency}
                    onChange={(event) => updateInvoice("currency", event.target.value)}
                    className="invoice-input"
                  >
                    {CURRENCIES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.code} ({item.symbol})
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Status">
                  <select
                    value={invoice.status}
                    onChange={(event) => updateInvoice("status", event.target.value)}
                    className="invoice-input"
                  >
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </FormSection>

            <FormSection title="Business Details">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Business name">
                  <input
                    value={invoice.businessName}
                    onChange={(event) => updateInvoice("businessName", event.target.value)}
                    className="invoice-input"
                  />
                </Field>

                <Field label="Email">
                  <input
                    value={invoice.businessEmail}
                    onChange={(event) => updateInvoice("businessEmail", event.target.value)}
                    className="invoice-input"
                  />
                </Field>

                <Field label="Phone">
                  <input
                    value={invoice.businessPhone}
                    onChange={(event) => updateInvoice("businessPhone", event.target.value)}
                    className="invoice-input"
                  />
                </Field>

                <Field label="Logo">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="invoice-input inline-flex items-center justify-center gap-2 text-left"
                  >
                    <ImageIcon size={17} />
                    {logoData?.name || "Upload logo"}
                  </button>
                </Field>

                <Field label="Address" className="md:col-span-2">
                  <textarea
                    value={invoice.businessAddress}
                    onChange={(event) => updateInvoice("businessAddress", event.target.value)}
                    rows={3}
                    className="invoice-textarea"
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Client Details">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Client name">
                  <input
                    value={invoice.clientName}
                    onChange={(event) => updateInvoice("clientName", event.target.value)}
                    className="invoice-input"
                  />
                </Field>

                <Field label="Client email">
                  <input
                    value={invoice.clientEmail}
                    onChange={(event) => updateInvoice("clientEmail", event.target.value)}
                    className="invoice-input"
                  />
                </Field>

                <Field label="Client address" className="md:col-span-2">
                  <textarea
                    value={invoice.clientAddress}
                    onChange={(event) => updateInvoice("clientAddress", event.target.value)}
                    rows={3}
                    className="invoice-textarea"
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection
              title="Invoice Items"
              action={
                <button
                  type="button"
                  onClick={addItem}
                  className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              }
            >
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[var(--border)] bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="font-bold text-sm">Item {index + 1}</p>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className={`h-9 w-9 rounded-xl border border-red-100 bg-red-50 text-red-600 inline-flex items-center justify-center ${
                          items.length === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-red-100"
                        }`}
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-[1.2fr_0.55fr_0.65fr_0.7fr] gap-3">
                      <Field label="Item / Service">
                        <input
                          value={item.name}
                          onChange={(event) => updateItem(item.id, "name", event.target.value)}
                          className="invoice-input"
                        />
                      </Field>

                      <Field label="Qty">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(event) => updateItem(item.id, "quantity", event.target.value)}
                          className="invoice-input"
                        />
                      </Field>

                      <Field label="Rate">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(event) => updateItem(item.id, "rate", event.target.value)}
                          className="invoice-input"
                        />
                      </Field>

                      <Field label="Amount">
                        <div className="invoice-input flex items-center font-bold bg-[#fbf9ff]">
                          {formatMoney(getItemAmount(item), currency)}
                        </div>
                      </Field>

                      <Field label="Description" className="md:col-span-4">
                        <input
                          value={item.description}
                          onChange={(event) => updateItem(item.id, "description", event.target.value)}
                          className="invoice-input"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>

            <FormSection title="Tax Discount Payment">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Tax label">
                  <input
                    value={invoice.taxLabel}
                    onChange={(event) => updateInvoice("taxLabel", event.target.value)}
                    className="invoice-input"
                  />
                </Field>

                <Field label="Tax rate (%)">
                  <input
                    type="number"
                    value={invoice.taxRate}
                    onChange={(event) => updateInvoice("taxRate", event.target.value)}
                    className="invoice-input"
                  />
                </Field>

                <Field label="Discount type">
                  <select
                    value={invoice.discountType}
                    onChange={(event) => updateInvoice("discountType", event.target.value)}
                    className="invoice-input"
                  >
                    <option value="percent">Percent</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </Field>

                <Field label="Discount">
                  <input
                    type="number"
                    value={invoice.discountValue}
                    onChange={(event) => updateInvoice("discountValue", event.target.value)}
                    className="invoice-input"
                  />
                </Field>

                <Field label="Shipping / Extra charge">
                  <input
                    type="number"
                    value={invoice.shipping}
                    onChange={(event) => updateInvoice("shipping", event.target.value)}
                    className="invoice-input"
                  />
                </Field>

                <Field label="Amount paid">
                  <input
                    type="number"
                    value={invoice.amountPaid}
                    onChange={(event) => updateInvoice("amountPaid", event.target.value)}
                    className="invoice-input"
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Notes">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Notes">
                  <textarea
                    value={invoice.notes}
                    onChange={(event) => updateInvoice("notes", event.target.value)}
                    rows={4}
                    className="invoice-textarea"
                  />
                </Field>

                <Field label="Payment instructions">
                  <textarea
                    value={invoice.paymentInstructions}
                    onChange={(event) => updateInvoice("paymentInstructions", event.target.value)}
                    rows={4}
                    className="invoice-textarea"
                  />
                </Field>
              </div>
            </FormSection>
          </div>

          <div className="flex flex-col gap-4 min-w-0">
            <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden sticky top-4">
              <div className="px-5 py-4 border-b border-[var(--border)] bg-gray-50 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-lg">Invoice Preview</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Clean two-column business invoice layout.
                  </p>
                </div>

                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{
                    background: `${invoice.accentColor}14`,
                    color: invoice.accentColor,
                  }}
                >
                  {invoice.status}
                </span>
              </div>

              <div className="p-5 bg-white">
                <InvoicePreview
                  invoice={invoice}
                  items={items}
                  totals={totals}
                  currency={currency}
                  logoData={logoData}
                />
              </div>
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
                      {isProcessing ? "Creating invoice PDF..." : "Processing completed"}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-[var(--primary)]">
                    {isProcessing ? `${progress}%` : `${(processingTimeMs / 1000).toFixed(1)}s`}
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

            {error && (
              <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {success && !error && (
              <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
                <Check size={18} className="shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            {outputUrl ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)] bg-gray-50 flex items-center gap-2">
                  <FileText size={18} className="text-[var(--primary)]" />
                  <p className="font-semibold">PDF Preview</p>
                </div>

                <iframe
                  src={outputUrl}
                  title="Invoice PDF preview"
                  className="w-full h-[520px] bg-white"
                />
              </div>
            ) : null}

            <div className="grid sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={createPdf}
                disabled={isProcessing}
                className={`btn-primary inline-flex items-center justify-center gap-2 ${
                  isProcessing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <ReceiptText size={18} />}
                {isProcessing ? "Working..." : "Create PDF"}
              </button>

              <button
                type="button"
                onClick={downloadPdf}
                disabled={!outputUrl}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  !outputUrl ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download
              </button>

              <button
                type="button"
                onClick={resetTool}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-5">
              This tool creates invoice PDFs only. Please verify tax and legal
              requirements for your country.
            </p>
          </div>
        </div>
      </section>

      <style>{`
        .invoice-input {
          width: 100%;
          min-height: 44px;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 0 0.9rem;
          background: white;
          outline: none;
          font-weight: 600;
        }
        .invoice-textarea {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 0.8rem 0.9rem;
          background: white;
          outline: none;
          resize: vertical;
          font-weight: 600;
        }
        .invoice-input:focus,
        .invoice-textarea:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(155, 108, 227, 0.16);
        }
      `}</style>

      <SuggestedTools currentToolId="pdf-invoice-generator" />
    </div>
  );
}

function FormSection({ title, action, children }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[#fbf9ff] p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {action}
      </div>

      {children}
    </div>
  );
}

function Field({ label, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-semibold mb-2">{label}</span>
      {children}
    </label>
  );
}

function InvoicePreview({ invoice, items, totals, currency, logoData }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[#111827] shadow-sm">
      <div className="flex items-start justify-between gap-6 border-b border-gray-200 pb-5">
        <div className="min-w-0">
          {logoData?.dataUrl ? (
            <img
              src={logoData.dataUrl}
              alt="Business logo"
              className="h-12 w-12 object-contain rounded-xl border border-gray-200 mb-3"
            />
          ) : null}

          <h3 className="text-lg font-bold break-words">{invoice.businessName}</h3>
          <p className="text-xs text-gray-500 break-words">{invoice.businessEmail}</p>
          {invoice.businessPhone ? (
            <p className="text-xs text-gray-500 break-words">{invoice.businessPhone}</p>
          ) : null}
          {invoice.businessAddress ? (
            <p className="text-xs text-gray-500 whitespace-pre-wrap mt-2">{invoice.businessAddress}</p>
          ) : null}
        </div>

        <div className="text-right shrink-0">
          <p className="text-2xl font-black" style={{ color: invoice.accentColor }}>
            {invoice.title}
          </p>
          <p className="text-xs text-gray-500 mt-1">{invoice.invoiceNumber}</p>
          <p className="text-xs font-bold mt-3">{invoice.status}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 py-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-bold mb-2">Bill To</p>
          <p className="font-bold">{invoice.clientName}</p>
          {invoice.clientEmail ? <p className="text-xs text-gray-500">{invoice.clientEmail}</p> : null}
          {invoice.clientAddress ? (
            <p className="text-xs text-gray-500 whitespace-pre-wrap mt-2">{invoice.clientAddress}</p>
          ) : null}
        </div>

        <div className="sm:text-right">
          <p className="text-xs text-gray-500">Invoice Date</p>
          <p className="font-bold">{invoice.invoiceDate || "-"}</p>
          <p className="text-xs text-gray-500 mt-2">Due Date</p>
          <p className="font-bold">{invoice.dueDate || "-"}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-left">
          <thead style={{ background: invoice.accentColor, color: "white" }}>
            <tr>
              <th className="px-3 py-2 text-xs">Item</th>
              <th className="px-3 py-2 text-xs text-right">Qty</th>
              <th className="px-3 py-2 text-xs text-right">Rate</th>
              <th className="px-3 py-2 text-xs text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <p className="font-semibold">{item.name || "-"}</p>
                  {item.description ? <p className="text-xs text-gray-500">{item.description}</p> : null}
                </td>
                <td className="px-3 py-2 text-right">{item.quantity || 0}</td>
                <td className="px-3 py-2 text-right">{formatMoney(toNumber(item.rate), currency)}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatMoney(getItemAmount(item), currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex justify-end">
        <div className="w-full max-w-[320px] space-y-2">
          <PreviewTotalRow label="Subtotal" value={formatMoney(totals.subtotal, currency)} />
          <PreviewTotalRow label="Discount" value={`-${formatMoney(totals.discount, currency)}`} />
          <PreviewTotalRow label={invoice.taxLabel || "Tax"} value={formatMoney(totals.tax, currency)} />
          <PreviewTotalRow label="Shipping / Extra" value={formatMoney(totals.shipping, currency)} />
          <div className="border-t border-gray-200 pt-2">
            <PreviewTotalRow label="Total" value={formatMoney(totals.total, currency)} strong />
            <PreviewTotalRow label="Paid" value={formatMoney(totals.amountPaid, currency)} />
            <PreviewTotalRow label="Balance Due" value={formatMoney(totals.balanceDue, currency)} strong />
          </div>
        </div>
      </div>

      {(invoice.notes || invoice.paymentInstructions) && (
        <div className="mt-6 border-t border-gray-200 pt-4 grid sm:grid-cols-2 gap-4 text-xs text-gray-600">
          {invoice.notes ? (
            <div>
              <p className="font-bold text-[#111827] mb-1">Notes</p>
              <p className="whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          ) : null}
          {invoice.paymentInstructions ? (
            <div>
              <p className="font-bold text-[#111827] mb-1">Payment</p>
              <p className="whitespace-pre-wrap">{invoice.paymentInstructions}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function PreviewTotalRow({ label, value, strong = false }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "font-black text-base" : "text-sm"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/* ---------------- PDF drawing ---------------- */

function drawInvoicePdf({ pdfDoc, fonts, invoice, items, totals, currency, logo, rgb }) {
  const pageSize = [595.28, 841.89];
  const margin = 42;
  const accent = hexToPdfRgb(invoice.accentColor, rgb);
  const black = rgb(0.07, 0.09, 0.13);
  const gray = rgb(0.37, 0.40, 0.45);
  const lightGray = rgb(0.94, 0.94, 0.95);

  let page = pdfDoc.addPage(pageSize);
  let y = 800;

  const ensureSpace = (heightNeeded) => {
    if (y - heightNeeded > 72) return;

    page = pdfDoc.addPage(pageSize);
    y = 800;
  };

  if (logo) {
    const logoScale = Math.min(52 / logo.width, 52 / logo.height);
    page.drawImage(logo, {
      x: margin,
      y: y - 42,
      width: logo.width * logoScale,
      height: logo.height * logoScale,
    });
  }

  drawTextLines({
    page,
    text: invoice.businessName,
    x: logo ? margin + 64 : margin,
    y,
    font: fonts.bold,
    size: 15,
    color: black,
    maxWidth: 260,
  });

  drawTextLines({
    page,
    text: [invoice.businessEmail, invoice.businessPhone, invoice.businessAddress]
      .filter(Boolean)
      .join("\n"),
    x: logo ? margin + 64 : margin,
    y: y - 20,
    font: fonts.regular,
    size: 9,
    color: gray,
    maxWidth: 260,
    lineHeight: 12,
  });

  page.drawText(invoice.title || "INVOICE", {
    x: 386,
    y,
    size: 30,
    font: fonts.bold,
    color: accent,
  });

  page.drawText(invoice.invoiceNumber || "", {
    x: 386,
    y: y - 22,
    size: 10,
    font: fonts.bold,
    color: black,
  });

  page.drawText(invoice.status || "", {
    x: 386,
    y: y - 40,
    size: 9,
    font: fonts.bold,
    color: accent,
  });

  y -= 92;

  drawSectionTitle(page, "Bill To", margin, y, fonts.bold, accent);
  drawTextLines({
    page,
    text: [invoice.clientName, invoice.clientEmail, invoice.clientAddress].filter(Boolean).join("\n"),
    x: margin,
    y: y - 18,
    font: fonts.regular,
    size: 10,
    color: black,
    maxWidth: 260,
    lineHeight: 13,
  });

  page.drawText("Invoice Date", {
    x: 386,
    y,
    size: 9,
    font: fonts.bold,
    color: gray,
  });
  page.drawText(invoice.invoiceDate || "-", {
    x: 386,
    y: y - 14,
    size: 10,
    font: fonts.bold,
    color: black,
  });
  page.drawText("Due Date", {
    x: 386,
    y: y - 36,
    size: 9,
    font: fonts.bold,
    color: gray,
  });
  page.drawText(invoice.dueDate || "-", {
    x: 386,
    y: y - 50,
    size: 10,
    font: fonts.bold,
    color: black,
  });

  y -= 102;

  drawTableHeader(page, margin, y, accent, fonts.bold, rgb);
  y -= 28;

  items.forEach((item) => {
    ensureSpace(58);

    const amount = getItemAmount(item);
    const itemLines = wrapText(item.name || "-", fonts.bold, 10, 220);
    const descriptionLines = item.description
      ? wrapText(item.description, fonts.regular, 8, 220)
      : [];
    const rowHeight = Math.max(38, 18 + (itemLines.length + descriptionLines.length) * 11);

    page.drawRectangle({
      x: margin,
      y: y - rowHeight + 8,
      width: 511,
      height: rowHeight,
      color: rgb(1, 1, 1),
      borderColor: lightGray,
      borderWidth: 0.5,
    });

    let textY = y;
    itemLines.forEach((line) => {
      page.drawText(line, {
        x: margin + 10,
        y: textY,
        size: 10,
        font: fonts.bold,
        color: black,
      });
      textY -= 11;
    });

    descriptionLines.forEach((line) => {
      page.drawText(line, {
        x: margin + 10,
        y: textY,
        size: 8,
        font: fonts.regular,
        color: gray,
      });
      textY -= 10;
    });

    drawRightAligned(page, String(toNumber(item.quantity)), 365, y, fonts.regular, 10, black);
    drawRightAligned(page, formatMoney(toNumber(item.rate), currency), 440, y, fonts.regular, 10, black);
    drawRightAligned(page, formatMoney(amount, currency), 545, y, fonts.bold, 10, black);

    y -= rowHeight;
  });

  y -= 16;
  ensureSpace(150);

  const totalsX = 340;
  drawTotalLine(page, "Subtotal", formatMoney(totals.subtotal, currency), totalsX, y, fonts, black, gray);
  y -= 18;
  drawTotalLine(page, "Discount", `-${formatMoney(totals.discount, currency)}`, totalsX, y, fonts, black, gray);
  y -= 18;
  drawTotalLine(page, invoice.taxLabel || "Tax", formatMoney(totals.tax, currency), totalsX, y, fonts, black, gray);
  y -= 18;
  drawTotalLine(page, "Shipping / Extra", formatMoney(totals.shipping, currency), totalsX, y, fonts, black, gray);
  y -= 22;

  page.drawLine({
    start: { x: totalsX, y },
    end: { x: 553, y },
    thickness: 0.8,
    color: lightGray,
  });

  y -= 18;
  drawTotalLine(page, "Total", formatMoney(totals.total, currency), totalsX, y, fonts, black, black, true);
  y -= 18;
  drawTotalLine(page, "Paid", formatMoney(totals.amountPaid, currency), totalsX, y, fonts, black, gray);
  y -= 18;
  drawTotalLine(page, "Balance Due", formatMoney(totals.balanceDue, currency), totalsX, y, fonts, accent, black, true);

  const notesY = Math.min(y - 30, 180);

  if (invoice.notes || invoice.paymentInstructions) {
    ensureSpace(110);

    const noteText = [
      invoice.notes ? `Notes:\n${invoice.notes}` : "",
      invoice.paymentInstructions ? `Payment:\n${invoice.paymentInstructions}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    drawTextLines({
      page,
      text: noteText,
      x: margin,
      y: Math.min(notesY, y - 30),
      font: fonts.regular,
      size: 9,
      color: gray,
      maxWidth: 480,
      lineHeight: 12,
    });
  }
}

function drawSectionTitle(page, title, x, y, font, color) {
  page.drawText(title, {
    x,
    y,
    size: 9,
    font,
    color,
  });
}

function drawTableHeader(page, x, y, color, font, rgb) {
  page.drawRectangle({
    x,
    y: y - 18,
    width: 511,
    height: 24,
    color,
  });

  page.drawText("Item", { x: x + 10, y: y - 10, size: 9, font, color: rgb(1, 1, 1) });
  page.drawText("Qty", { x: x + 310, y: y - 10, size: 9, font, color: rgb(1, 1, 1) });
  page.drawText("Rate", { x: x + 385, y: y - 10, size: 9, font, color: rgb(1, 1, 1) });
  page.drawText("Amount", { x: x + 470, y: y - 10, size: 9, font, color: rgb(1, 1, 1) });
}

function drawTotalLine(page, label, value, x, y, fonts, labelColor, valueColor, strong = false) {
  const font = strong ? fonts.bold : fonts.regular;
  page.drawText(label, {
    x,
    y,
    size: strong ? 11 : 9,
    font,
    color: labelColor,
  });
  drawRightAligned(page, value, 553, y, strong ? fonts.bold : fonts.regular, strong ? 11 : 9, valueColor);
}

function drawRightAligned(page, text, rightX, y, font, size, color) {
  const width = font.widthOfTextAtSize(String(text), size);
  page.drawText(String(text), {
    x: rightX - width,
    y,
    size,
    font,
    color,
  });
}

function drawTextLines({ page, text, x, y, font, size, color, maxWidth, lineHeight = 13 }) {
  const lines = String(text || "")
    .split("\n")
    .flatMap((line) => wrapText(line, font, size, maxWidth));

  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - index * lineHeight,
      size,
      font,
      color,
    });
  });
}

function wrapText(text, font, size, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, size);

    if (width <= maxWidth) {
      line = testLine;
      return;
    }

    if (line) lines.push(line);
    line = word;
  });

  if (line) lines.push(line);

  return lines.length ? lines : [""];
}

/* ---------------- Calculations and utilities ---------------- */

function calculateTotals(items, invoice) {
  const subtotal = items.reduce((sum, item) => sum + getItemAmount(item), 0);
  const discountValue = toNumber(invoice.discountValue);
  const discount =
    invoice.discountType === "percent"
      ? subtotal * (discountValue / 100)
      : discountValue;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * (toNumber(invoice.taxRate) / 100);
  const shipping = toNumber(invoice.shipping);
  const total = taxableAmount + tax + shipping;
  const amountPaid = toNumber(invoice.amountPaid);
  const balanceDue = total - amountPaid;

  return {
    subtotal,
    discount,
    tax,
    shipping,
    total,
    amountPaid,
    balanceDue,
  };
}

function getItemAmount(item) {
  return toNumber(item.quantity) * toNumber(item.rate);
}

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value, currency) {
  const number = Number(value || 0);
  const sign = number < 0 ? "-" : "";

  return `${sign}${currency.symbol}${Math.abs(number).toFixed(2)}`;
}

function hexToPdfRgb(hex, rgb) {
  const clean = String(hex || "#111827").replace("#", "");
  const parsed = /^[0-9a-f]{6}$/i.test(clean) ? clean : "111827";
  const number = parseInt(parsed, 16);

  return rgb(
    ((number >> 16) & 255) / 255,
    ((number >> 8) & 255) / 255,
    (number & 255) / 255
  );
}

function estimateProcessingTime(itemCount) {
  return Math.min(
    MAX_PROCESSING_TIME_MS,
    Math.max(MIN_PROCESSING_TIME_MS, MIN_PROCESSING_TIME_MS + itemCount * 110)
  );
}

function waitRemaining(startedAt, minimumMs) {
  const elapsed = performance.now() - startedAt;
  const remaining = Math.max(0, minimumMs - elapsed);

  return new Promise((resolve) => window.setTimeout(resolve, remaining));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function sanitizeFileName(value) {
  return String(value || "invoice")
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
