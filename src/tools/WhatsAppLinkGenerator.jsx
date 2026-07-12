// src/tools/WhatsAppLinkGenerator.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  Link2,
  MessageCircle,
  QrCode,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "WhatsApp Link Generator",
  path: "/tool/whatsapp-link-generator",
  category: "Social Media Tools",
  description:
    "Create a direct WhatsApp chat link with a phone number and prefilled message, then generate a QR code and website button HTML.",
  metaTitle: "Free WhatsApp Link Generator with QR Code & HTML Button",
  metaDescription:
    "Generate a WhatsApp wa.me link with a prefilled message, downloadable QR code, and ready-to-use website button HTML. Runs privately in your browser.",
};

const SITE_URL = "https://nextonlinetools.com";
const canonicalUrl = `${SITE_URL}${toolData.path}`;

const COUNTRIES = [
  { name: "Bangladesh", code: "BD", dial: "880", flag: "🇧🇩" },
  { name: "United States / Canada", code: "US", dial: "1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", dial: "44", flag: "🇬🇧" },
  { name: "India", code: "IN", dial: "91", flag: "🇮🇳" },
  { name: "Pakistan", code: "PK", dial: "92", flag: "🇵🇰" },
  { name: "United Arab Emirates", code: "AE", dial: "971", flag: "🇦🇪" },
  { name: "Saudi Arabia", code: "SA", dial: "966", flag: "🇸🇦" },
  { name: "Australia", code: "AU", dial: "61", flag: "🇦🇺" },
  { name: "New Zealand", code: "NZ", dial: "64", flag: "🇳🇿" },
  { name: "Singapore", code: "SG", dial: "65", flag: "🇸🇬" },
  { name: "Malaysia", code: "MY", dial: "60", flag: "🇲🇾" },
  { name: "Indonesia", code: "ID", dial: "62", flag: "🇮🇩" },
  { name: "Philippines", code: "PH", dial: "63", flag: "🇵🇭" },
  { name: "Japan", code: "JP", dial: "81", flag: "🇯🇵" },
  { name: "South Korea", code: "KR", dial: "82", flag: "🇰🇷" },
  { name: "China", code: "CN", dial: "86", flag: "🇨🇳" },
  { name: "Hong Kong", code: "HK", dial: "852", flag: "🇭🇰" },
  { name: "Sri Lanka", code: "LK", dial: "94", flag: "🇱🇰" },
  { name: "Nepal", code: "NP", dial: "977", flag: "🇳🇵" },
  { name: "Germany", code: "DE", dial: "49", flag: "🇩🇪" },
  { name: "France", code: "FR", dial: "33", flag: "🇫🇷" },
  { name: "Italy", code: "IT", dial: "39", flag: "🇮🇹" },
  { name: "Spain", code: "ES", dial: "34", flag: "🇪🇸" },
  { name: "Netherlands", code: "NL", dial: "31", flag: "🇳🇱" },
  { name: "Switzerland", code: "CH", dial: "41", flag: "🇨🇭" },
  { name: "Sweden", code: "SE", dial: "46", flag: "🇸🇪" },
  { name: "Norway", code: "NO", dial: "47", flag: "🇳🇴" },
  { name: "Denmark", code: "DK", dial: "45", flag: "🇩🇰" },
  { name: "Poland", code: "PL", dial: "48", flag: "🇵🇱" },
  { name: "Portugal", code: "PT", dial: "351", flag: "🇵🇹" },
  { name: "Ireland", code: "IE", dial: "353", flag: "🇮🇪" },
  { name: "Turkey", code: "TR", dial: "90", flag: "🇹🇷" },
  { name: "Brazil", code: "BR", dial: "55", flag: "🇧🇷" },
  { name: "Mexico", code: "MX", dial: "52", flag: "🇲🇽" },
  { name: "South Africa", code: "ZA", dial: "27", flag: "🇿🇦" },
  { name: "Nigeria", code: "NG", dial: "234", flag: "🇳🇬" },
  { name: "Kenya", code: "KE", dial: "254", flag: "🇰🇪" },
  { name: "Egypt", code: "EG", dial: "20", flag: "🇪🇬" },
  { name: "Qatar", code: "QA", dial: "974", flag: "🇶🇦" },
  { name: "Kuwait", code: "KW", dial: "965", flag: "🇰🇼" },
  { name: "Custom country code", code: "CUSTOM", dial: "", flag: "🌐" },
];

const MESSAGE_TEMPLATES = [
  { label: "General inquiry", text: "Hello, I would like to know more about your services." },
  { label: "Product inquiry", text: "Hello, I am interested in this product. Could you please share more details?" },
  { label: "Request a quotation", text: "Hello, I would like to request a quotation. Please let me know what information you need." },
  { label: "Book an appointment", text: "Hello, I would like to book an appointment. Please share your available times." },
  { label: "Customer support", text: "Hello, I need help with my order. Please assist me." },
];

const RESULT_TABS = [
  { id: "link", label: "Link", icon: Link2 },
  { id: "qr", label: "QR Code", icon: QrCode },
  { id: "html", label: "Button HTML", icon: FileCode2 },
];

export default function WhatsAppLinkGenerator() {
  const countryPanelRef = useRef(null);
  const qrCanvasWrapRef = useRef(null);
  const qrSvgWrapRef = useRef(null);

  const [selectedCountryCode, setSelectedCountryCode] = useState("BD");
  const [customDialCode, setCustomDialCode] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [message, setMessage] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("link");

  const [buttonText, setButtonText] = useState("Chat on WhatsApp");
  const [buttonColor, setButtonColor] = useState("#25D366");
  const [buttonTextColor, setButtonTextColor] = useState("#FFFFFF");
  const [buttonRadius, setButtonRadius] = useState(12);
  const [buttonFullWidth, setButtonFullWidth] = useState(false);
  const [buttonNewTab, setButtonNewTab] = useState(true);
  const [qrSize, setQrSize] = useState(260);

  const [copiedType, setCopiedType] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const selectedCountry = useMemo(
    () => COUNTRIES.find((item) => item.code === selectedCountryCode) || COUNTRIES[0],
    [selectedCountryCode]
  );

  const activeDialCode = useMemo(
    () => selectedCountry.code === "CUSTOM" ? onlyDigits(customDialCode) : selectedCountry.dial,
    [selectedCountry, customDialCode]
  );

  const normalizedNumber = useMemo(
    () => normalizeWhatsAppNumber(phoneInput, activeDialCode),
    [phoneInput, activeDialCode]
  );

  const numberValidation = useMemo(
    () => validateWhatsAppNumber(normalizedNumber, activeDialCode, phoneInput),
    [normalizedNumber, activeDialCode, phoneInput]
  );

  const generatedLink = useMemo(() => {
    if (!numberValidation.valid) return "";
    const base = `https://wa.me/${normalizedNumber}`;
    return message.trim() ? `${base}?text=${encodeURIComponent(message.trim())}` : base;
  }, [normalizedNumber, message, numberValidation.valid]);

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return COUNTRIES;
    return COUNTRIES.filter((country) =>
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query) ||
      country.dial.includes(query.replace(/\D/g, ""))
    );
  }, [countrySearch]);

  const buttonHtml = useMemo(() => {
    if (!generatedLink) return "";
    const target = buttonNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    const width = buttonFullWidth ? "width:100%;" : "";
    return `<a href="${escapeHtmlAttribute(generatedLink)}"${target} aria-label="${escapeHtmlAttribute(
      buttonText || "Open WhatsApp chat"
    )}" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;${width}padding:12px 18px;border-radius:${buttonRadius}px;background:${buttonColor};color:${buttonTextColor};font-family:Arial,sans-serif;font-weight:700;text-decoration:none;box-sizing:border-box;">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M21 11.5a8.5 8.5 0 0 1-9 8.48 9.8 9.8 0 0 1-4.1-.98L3 20l1.25-4.28A8.5 8.5 0 1 1 21 11.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  ${escapeHtml(buttonText || "Chat on WhatsApp")}
</a>`;
  }, [generatedLink, buttonText, buttonColor, buttonTextColor, buttonRadius, buttonFullWidth, buttonNewTab]);

  useEffect(() => {
    function closeCountry(event) {
      if (!countryOpen || countryPanelRef.current?.contains(event.target)) return;
      setCountryOpen(false);
    }
    document.addEventListener("pointerdown", closeCountry);
    return () => document.removeEventListener("pointerdown", closeCountry);
  }, [countryOpen]);

  function clearFeedback() {
    setSuccess("");
    setError("");
    setCopiedType("");
  }

  async function copyValue(value, type, successText) {
    if (!value) {
      setError("Enter a valid phone number first.");
      setSuccess("");
      return;
    }
    try {
      await copyToClipboard(value);
      setCopiedType(type);
      setSuccess(successText);
      setError("");
      window.setTimeout(() => setCopiedType(""), 1600);
    } catch {
      setError("Copy failed. Please copy it manually.");
      setSuccess("");
    }
  }

  function openGeneratedLink() {
    if (!generatedLink) {
      setError("Enter a valid phone number first.");
      return;
    }
    window.open(generatedLink, "_blank", "noopener,noreferrer");
  }

  function downloadQrPng() {
    const canvas = qrCanvasWrapRef.current?.querySelector("canvas");
    if (!generatedLink || !canvas) {
      setError("Enter a valid phone number first.");
      return;
    }
    const link = document.createElement("a");
    link.download = `whatsapp-qr-${normalizedNumber}.png`;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccess("QR code downloaded as PNG.");
    setError("");
  }

  function downloadQrSvg() {
    const svg = qrSvgWrapRef.current?.querySelector("svg");
    if (!generatedLink || !svg) {
      setError("Enter a valid phone number first.");
      return;
    }
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `whatsapp-qr-${normalizedNumber}.svg`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccess("QR code downloaded as SVG.");
    setError("");
  }

  function resetTool() {
    setSelectedCountryCode("BD");
    setCustomDialCode("");
    setPhoneInput("");
    setMessage("");
    setCountryOpen(false);
    setCountrySearch("");
    setTemplatesOpen(false);
    setActiveTab("link");
    setButtonText("Chat on WhatsApp");
    setButtonColor("#25D366");
    setButtonTextColor("#FFFFFF");
    setButtonRadius(12);
    setButtonFullWidth(false);
    setButtonNewTab(true);
    setQrSize(260);
    setCopiedType("");
    setSuccess("");
    setError("");
  }

  return (
    <div className="flex flex-col gap-8">
      <Helmet>
        <title>{toolData.metaTitle}</title>
        <meta name="description" content={toolData.metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={toolData.metaTitle} />
        <meta property="og:description" content={toolData.metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: toolData.title,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          url: canonicalUrl,
          description: toolData.description,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        })}</script>
      </Helmet>

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <MessageCircle size={28} className="text-[var(--primary)]" />
        </div>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--primary)] font-bold mb-2">
          Link + QR + Website Button
        </p>
        <h1 className="text-3xl font-bold mb-3">WhatsApp Link Generator</h1>
        <p className="text-[var(--text-secondary)] max-w-3xl">
          Create a direct WhatsApp chat link with a phone number and prefilled message. Generate a QR code or copy ready-to-use website button HTML without uploading your information.
        </p>
      </section>

      <section className="card p-4 sm:p-6 lg:p-8">
        <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-6">
          <div className="min-w-0 flex flex-col gap-5">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-5">
                <MessageCircle size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-bold">WhatsApp Details</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-semibold block mb-2">Country code</label>
                  <div ref={countryPanelRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setCountryOpen((current) => !current)}
                      className={`w-full min-h-12 rounded-xl border bg-white px-4 py-3 text-left transition flex items-center justify-between gap-3 ${
                        countryOpen ? "border-[var(--primary)] ring-4 ring-[#f4edff]" : "border-[var(--border)] hover:border-[var(--primary)]"
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="text-xl">{selectedCountry.flag}</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold truncate">{selectedCountry.name}</span>
                          <span className="block text-xs text-[var(--text-secondary)]">
                            {selectedCountry.code === "CUSTOM" ? "Enter a custom international code" : `+${selectedCountry.dial}`}
                          </span>
                        </span>
                      </span>
                      <ChevronDown size={18} className={`shrink-0 transition-transform ${countryOpen ? "rotate-180" : ""}`} />
                    </button>

                    {countryOpen && (
                      <div className="absolute left-0 right-0 z-40 mt-2 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-2xl">
                        <div className="relative mb-3">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                          <input
                            type="search"
                            value={countrySearch}
                            onChange={(event) => setCountrySearch(event.target.value)}
                            placeholder="Search country or code"
                            className="w-full rounded-xl border border-[var(--border)] py-2.5 pl-9 pr-3 outline-none focus:border-[var(--primary)]"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-72 overflow-auto space-y-1 pr-1">
                          {filteredCountries.map((country) => (
                            <button
                              key={`${country.code}-${country.dial}`}
                              type="button"
                              onClick={() => {
                                setSelectedCountryCode(country.code);
                                setCountryOpen(false);
                                setCountrySearch("");
                                clearFeedback();
                              }}
                              className={`w-full rounded-xl px-3 py-2.5 text-left flex items-center justify-between gap-3 transition ${
                                selectedCountryCode === country.code ? "bg-[#f4edff] text-[var(--primary)]" : "hover:bg-[#f8f4ff]"
                              }`}
                            >
                              <span className="flex items-center gap-3 min-w-0">
                                <span className="text-lg">{country.flag}</span>
                                <span className="text-sm font-semibold truncate">{country.name}</span>
                              </span>
                              <span className="text-xs font-bold shrink-0">{country.code === "CUSTOM" ? "Custom" : `+${country.dial}`}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedCountry.code === "CUSTOM" && (
                  <div>
                    <label className="text-sm font-semibold block mb-2">Custom international code</label>
                    <div className="flex rounded-xl border border-[var(--border)] bg-white overflow-hidden focus-within:border-[var(--primary)] focus-within:ring-4 focus-within:ring-[#f4edff]">
                      <span className="px-4 flex items-center bg-gray-50 border-r border-[var(--border)] font-bold">+</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={customDialCode}
                        onChange={(event) => setCustomDialCode(onlyDigits(event.target.value).slice(0, 4))}
                        placeholder="Country code"
                        className="min-w-0 flex-1 px-4 py-3 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold block mb-2">Phone number</label>
                  <div className="flex rounded-xl border border-[var(--border)] bg-white overflow-hidden focus-within:border-[var(--primary)] focus-within:ring-4 focus-within:ring-[#f4edff]">
                    <span className="px-4 flex items-center bg-gray-50 border-r border-[var(--border)] font-bold">+{activeDialCode || "—"}</span>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(event) => {
                        setPhoneInput(event.target.value);
                        clearFeedback();
                      }}
                      placeholder="Phone number"
                      className="min-w-0 flex-1 px-4 py-3 outline-none"
                    />
                    {phoneInput && (
                      <button type="button" onClick={() => setPhoneInput("")} className="px-3 text-[var(--text-secondary)] hover:text-red-600" aria-label="Clear phone number">
                        <X size={17} />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 min-h-5">
                    {!phoneInput ? (
                      <p className="text-xs text-[var(--text-secondary)]">You may paste a local or complete international number.</p>
                    ) : numberValidation.valid ? (
                      <p className="text-xs text-green-700 inline-flex items-center gap-1.5"><CheckCircle size={14} />Ready: +{normalizedNumber}</p>
                    ) : (
                      <p className="text-xs text-red-600 inline-flex items-center gap-1.5"><AlertCircle size={14} />{numberValidation.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label className="text-sm font-semibold">Prefilled message</label>
                    <div className="relative">
                      <button type="button" onClick={() => setTemplatesOpen((current) => !current)} className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline">
                        <Sparkles size={14} />Templates
                      </button>
                      {templatesOpen && (
                        <div className="absolute right-0 top-full z-30 mt-2 w-[min(340px,calc(100vw-48px))] rounded-2xl border border-[var(--border)] bg-white p-3 shadow-2xl">
                          <div className="flex items-center justify-between gap-3 px-1 pb-2">
                            <p className="text-sm font-bold">Message templates</p>
                            <button type="button" onClick={() => setTemplatesOpen(false)} className="h-7 w-7 rounded-lg hover:bg-gray-100 inline-flex items-center justify-center" aria-label="Close templates"><X size={15} /></button>
                          </div>
                          <div className="space-y-1">
                            {MESSAGE_TEMPLATES.map((template) => (
                              <button key={template.label} type="button" onClick={() => {
                                setMessage(template.text);
                                setTemplatesOpen(false);
                                setSuccess(`${template.label} template added.`);
                              }} className="w-full rounded-xl p-3 text-left hover:bg-[#f8f4ff] transition">
                                <p className="text-sm font-bold">{template.label}</p>
                                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)] line-clamp-2">{template.text}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <textarea
                      value={message}
                      onChange={(event) => {
                        setMessage(event.target.value);
                        clearFeedback();
                      }}
                      rows={7}
                      maxLength={1000}
                      placeholder="Hello, I would like to know more about your service."
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 pr-11 outline-none resize-y leading-6 focus:border-[var(--primary)] focus:ring-4 focus:ring-[#f4edff]"
                    />
                    {message && (
                      <button type="button" onClick={() => setMessage("")} className="absolute right-3 top-3 h-8 w-8 rounded-lg inline-flex items-center justify-center text-[var(--text-secondary)] hover:bg-gray-100 hover:text-red-600" aria-label="Clear message"><Trash2 size={16} /></button>
                    )}
                  </div>
                  <div className="mt-2 flex justify-between gap-3 text-xs text-[var(--text-secondary)]"><span>Line breaks and emoji are supported.</span><span>{message.length} / 1000</span></div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-green-700" />
                <div>
                  <p className="text-sm font-bold text-green-900">Private browser processing</p>
                  <p className="mt-1 text-xs leading-5 text-green-800">The number, message, link, QR code, and HTML are generated in your browser. No backend or database is required.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 lg:sticky lg:top-5">
              <div className="flex items-center gap-2 mb-4"><Sparkles size={20} className="text-[var(--primary)]" /><h2 className="text-xl font-bold">Live Result</h2></div>
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#f8f4ff] p-1.5 mb-5">
                {RESULT_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`min-w-0 rounded-xl px-2 py-3 inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition ${activeTab === tab.id ? "bg-white text-[var(--primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--primary)]"}`}>
                      <Icon size={16} /><span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {!generatedLink ? (
                <div className="min-h-[430px] rounded-2xl border border-dashed border-[var(--border)] bg-gray-50 flex items-center justify-center p-8 text-center">
                  <div><MessageCircle size={58} className="mx-auto mb-4 text-gray-300" /><p className="font-bold">Enter a valid phone number</p><p className="mt-2 text-sm text-[var(--text-secondary)]">Your direct link, QR code, and button HTML will appear here automatically.</p></div>
                </div>
              ) : (
                <>
                  {activeTab === "link" && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)] mb-2">Generated wa.me link</p>
                        <div className="rounded-xl border border-[var(--border)] bg-white p-3"><code className="block break-all text-sm leading-6">{generatedLink}</code></div>
                        <div className="grid sm:grid-cols-2 gap-3 mt-4">
                          <button type="button" onClick={() => copyValue(generatedLink, "link", "WhatsApp link copied.")} className="btn-primary inline-flex items-center justify-center gap-2">{copiedType === "link" ? <Check size={18} /> : <Copy size={18} />}{copiedType === "link" ? "Copied" : "Copy Link"}</button>
                          <button type="button" onClick={openGeneratedLink} className="btn-secondary inline-flex items-center justify-center gap-2"><ExternalLink size={18} />Test Link</button>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
                        <div className="bg-[#075E54] p-4 text-white"><p className="text-xs opacity-80">WhatsApp-style preview</p><p className="font-bold mt-1">+{normalizedNumber}</p></div>
                        <div className="bg-[#efeae2] p-5 min-h-[230px]"><div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-[#d9fdd3] p-4 shadow-sm"><p className="whitespace-pre-wrap text-sm leading-6 text-gray-900">{message.trim() || "No prefilled message. The chat will open empty."}</p><p className="mt-2 text-[10px] text-right text-gray-500">Preview</p></div></div>
                      </div>
                    </div>
                  )}

                  {activeTab === "qr" && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-[var(--border)] bg-gray-50 p-5 text-center">
                        <div ref={qrCanvasWrapRef} className="inline-flex max-w-full rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm overflow-auto"><QRCodeCanvas value={generatedLink} size={qrSize} level="H" includeMargin bgColor="#FFFFFF" fgColor="#111827" /></div>
                        <div ref={qrSvgWrapRef} className="hidden"><QRCodeSVG value={generatedLink} size={qrSize} level="H" includeMargin bgColor="#FFFFFF" fgColor="#111827" /></div>
                        <p className="mt-4 text-sm font-bold">Scan to open the chat</p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">The QR code contains the generated link and prefilled message.</p>
                      </div>
                      <div className="rounded-2xl border border-[var(--border)] p-4"><div className="flex items-center justify-between gap-3 mb-2"><label className="text-sm font-bold">QR size</label><span className="text-xs font-bold text-[var(--primary)]">{qrSize}px</span></div><input type="range" min="180" max="420" step="20" value={qrSize} onChange={(event) => setQrSize(Number(event.target.value))} className="w-full accent-[var(--primary)]" /></div>
                      <div className="grid sm:grid-cols-2 gap-3"><button type="button" onClick={downloadQrPng} className="btn-primary inline-flex items-center justify-center gap-2"><Download size={18} />Download PNG</button><button type="button" onClick={downloadQrSvg} className="btn-secondary inline-flex items-center justify-center gap-2"><Download size={18} />Download SVG</button></div>
                    </div>
                  )}

                  {activeTab === "html" && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-[var(--border)] bg-gray-50 p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)] mb-4">Button preview</p><div className="min-h-[120px] flex items-center justify-center"><a href={generatedLink} target={buttonNewTab ? "_blank" : undefined} rel={buttonNewTab ? "noopener noreferrer" : undefined} style={{display:"inline-flex",width:buttonFullWidth?"100%":"auto",alignItems:"center",justifyContent:"center",gap:"8px",padding:"12px 18px",borderRadius:`${buttonRadius}px`,backgroundColor:buttonColor,color:buttonTextColor,fontFamily:"Arial, sans-serif",fontWeight:700,textDecoration:"none",boxSizing:"border-box"}}><MessageCircle size={18} />{buttonText || "Chat on WhatsApp"}</a></div></div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div><label className="text-xs font-bold block mb-2">Button text</label><input type="text" value={buttonText} onChange={(event) => setButtonText(event.target.value.slice(0,60))} className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 outline-none focus:border-[var(--primary)]" /></div>
                        <div><label className="text-xs font-bold block mb-2">Corner radius: {buttonRadius}px</label><input type="range" min="0" max="40" step="1" value={buttonRadius} onChange={(event) => setButtonRadius(Number(event.target.value))} className="w-full accent-[var(--primary)] mt-2" /></div>
                        <ColorField label="Button color" value={buttonColor} onChange={setButtonColor} />
                        <ColorField label="Text color" value={buttonTextColor} onChange={setButtonTextColor} />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3"><ToggleField label="Open in new tab" checked={buttonNewTab} onChange={setButtonNewTab} /><ToggleField label="Full-width button" checked={buttonFullWidth} onChange={setButtonFullWidth} /></div>
                      <div className="rounded-2xl border border-[var(--border)] bg-[#111827] p-4"><pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs leading-5 text-gray-100"><code>{buttonHtml}</code></pre></div>
                      <button type="button" onClick={() => copyValue(buttonHtml, "html", "Button HTML copied.")} className="btn-primary w-full inline-flex items-center justify-center gap-2">{copiedType === "html" ? <Check size={18} /> : <Copy size={18} />}{copiedType === "html" ? "Copied" : "Copy Button HTML"}</button>
                    </div>
                  )}
                </>
              )}

              {(error || success) && (
                <div className="mt-5">
                  {error && <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl"><AlertCircle size={18} className="shrink-0 mt-0.5" /><p>{error}</p></div>}
                  {success && <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl"><CheckCircle size={18} className="shrink-0 mt-0.5" /><p>{success}</p></div>}
                </div>
              )}
              <button type="button" onClick={resetTool} className="mt-5 btn-secondary w-full inline-flex items-center justify-center gap-2"><RotateCcw size={18} />Reset Tool</button>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-4">Create a WhatsApp Link, QR Code, and Website Button</h2>
        <div className="space-y-4 leading-7 text-[var(--text-secondary)]"><p>Enter a country code, phone number, and optional message. The tool creates a direct wa.me link that visitors can open to start a WhatsApp conversation.</p><p>You can also download a QR code for menus, packaging, signs, or business cards, and create a customizable HTML button for your website.</p></div>
        </section>

      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-4">Important notice</h2>
        <p className="text-sm leading-7 text-[var(--text-secondary)]">Use phone numbers you own or have permission to publish. Do not use generated links for spam, harassment, fraud, or unlawful activity. This independent tool is not affiliated with, sponsored by, or endorsed by WhatsApp LLC or Meta Platforms, Inc. WhatsApp is a trademark of WhatsApp LLC.</p>
      </section>

      <SuggestedTools currentToolId="whatsapp-link-generator" />
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return <label className="rounded-xl border border-[var(--border)] bg-white p-3 flex items-center justify-between gap-3"><span className="text-xs font-bold">{label}</span><span className="flex items-center gap-2"><code className="text-[11px]">{value.toUpperCase()}</code><input type="color" value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} className="h-9 w-10 rounded-lg border border-[var(--border)] bg-white" /></span></label>;
}

function ToggleField({ label, checked, onChange }) {
  return <label className="rounded-xl border border-[var(--border)] bg-white p-4 flex items-center justify-between gap-3 cursor-pointer"><span className="text-sm font-semibold">{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[var(--primary)]" /></label>;
}

function InfoCard({ title, text }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-white p-5"><h3 className="font-bold mb-2">{title}</h3><p className="text-sm leading-6 text-[var(--text-secondary)]">{text}</p></div>;
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeWhatsAppNumber(rawPhone, dialCode) {
  const digits = onlyDigits(rawPhone);
  const cleanDial = onlyDigits(dialCode);
  if (!digits || !cleanDial) return "";
  if (digits.startsWith(cleanDial)) return digits;
  return `${cleanDial}${digits.replace(/^0+/, "")}`;
}

function validateWhatsAppNumber(normalized, dialCode, rawPhone) {
  if (!onlyDigits(dialCode)) return { valid: false, message: "Choose or enter a country code." };
  if (!String(rawPhone || "").trim()) return { valid: false, message: "Enter a phone number." };
  if (normalized.length < 7) return { valid: false, message: "The phone number is too short." };
  if (normalized.length > 15) return { valid: false, message: "The phone number is too long." };
  return { valid: true, message: "Phone number is ready." };
}

function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function escapeHtmlAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const successful = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!successful) throw new Error("Copy failed.");
}
