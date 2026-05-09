import { useMemo, useState } from "react";
import {
  QrCode as QrCodeIcon,
  Link,
  Type,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
  Contact,
  Download,
  RotateCcw,
  Zap,
  Copy,
  Check,
  Palette,
  Settings2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import QRCode from "qrcode";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "QR Code Generator",
  path: "/qr-code-generator",
  category: "Productivity Tools",
  description:
    "Create custom QR codes for URLs, text, email, SMS, WiFi, WhatsApp, vCard, and more. Customize colors, size, and download as PNG or SVG.",
  metaTitle: "QR Code Generator | Create QR Codes Online Free",
  metaDescription:
    "Generate custom QR codes online for free. Create QR codes for URLs, text, email, SMS, WiFi, WhatsApp, and vCard with custom colors and PNG or SVG download.",
};

const QR_TYPES = [
  { value: "url", label: "URL", icon: Link },
  { value: "text", label: "Text", icon: Type },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "sms", label: "SMS", icon: MessageSquare },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "wifi", label: "WiFi", icon: Wifi },
  { value: "vcard", label: "vCard", icon: Contact },
];

const ERROR_LEVELS = [
  { value: "L", label: "Low - L" },
  { value: "M", label: "Medium - M" },
  { value: "Q", label: "Quartile - Q" },
  { value: "H", label: "High - H" },
];

export default function QrCodeGenerator() {
  const [qrType, setQrType] = useState("url");

  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  const [email, setEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsNumber, setSmsNumber] = useState("");
  const [smsMessage, setSmsMessage] = useState("");

  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");

  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiSecurity, setWifiSecurity] = useState("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);

  const [vcardName, setVcardName] = useState("");
  const [vcardPhone, setVcardPhone] = useState("");
  const [vcardEmail, setVcardEmail] = useState("");
  const [vcardCompany, setVcardCompany] = useState("");
  const [vcardWebsite, setVcardWebsite] = useState("");
  const [vcardAddress, setVcardAddress] = useState("");

  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(2);
  const [foregroundColor, setForegroundColor] = useState("#333333");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [errorCorrection, setErrorCorrection] = useState("M");

  const [qrContent, setQrContent] = useState("");
  const [pngDataUrl, setPngDataUrl] = useState("");
  const [svgText, setSvgText] = useState("");

  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedType = QR_TYPES.find((item) => item.value === qrType);

  const qrOptions = useMemo(
    () => ({
      width: Number(size),
      margin: Number(margin),
      errorCorrectionLevel: errorCorrection,
      color: {
        dark: foregroundColor,
        light: backgroundColor,
      },
    }),
    [size, margin, errorCorrection, foregroundColor, backgroundColor]
  );

  const clearOutput = () => {
    setQrContent("");
    setPngDataUrl("");
    setSvgText("");
    setCopied(false);
  };

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  const handleTypeChange = (value) => {
    setQrType(value);
    clearOutput();
    clearFeedback();
  };

  const generateQrPayload = () => {
    if (qrType === "url") {
      const cleanUrl = url.trim();

      if (!cleanUrl) {
        throw new Error("Please enter a URL.");
      }

      if (!/^https?:\/\//i.test(cleanUrl)) {
        return `https://${cleanUrl}`;
      }

      return cleanUrl;
    }

    if (qrType === "text") {
      const cleanText = text.trim();

      if (!cleanText) {
        throw new Error("Please enter text.");
      }

      return cleanText;
    }

    if (qrType === "email") {
      const cleanEmail = email.trim();

      if (!cleanEmail) {
        throw new Error("Please enter an email address.");
      }

      const params = new URLSearchParams();

      if (emailSubject.trim()) {
        params.set("subject", emailSubject.trim());
      }

      if (emailBody.trim()) {
        params.set("body", emailBody.trim());
      }

      const query = params.toString();

      return query ? `mailto:${cleanEmail}?${query}` : `mailto:${cleanEmail}`;
    }

    if (qrType === "phone") {
      const cleanPhone = phoneNumber.trim();

      if (!cleanPhone) {
        throw new Error("Please enter a phone number.");
      }

      return `tel:${cleanPhone}`;
    }

    if (qrType === "sms") {
      const cleanSmsNumber = smsNumber.trim();

      if (!cleanSmsNumber) {
        throw new Error("Please enter an SMS phone number.");
      }

      if (smsMessage.trim()) {
        return `sms:${cleanSmsNumber}?body=${encodeURIComponent(
          smsMessage.trim()
        )}`;
      }

      return `sms:${cleanSmsNumber}`;
    }

    if (qrType === "whatsapp") {
      const cleanNumber = whatsappNumber.replace(/\D/g, "");

      if (!cleanNumber) {
        throw new Error("Please enter a WhatsApp phone number with country code.");
      }

      if (whatsappMessage.trim()) {
        return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
          whatsappMessage.trim()
        )}`;
      }

      return `https://wa.me/${cleanNumber}`;
    }

    if (qrType === "wifi") {
      const cleanWifiName = wifiName.trim();

      if (!cleanWifiName) {
        throw new Error("Please enter the WiFi network name.");
      }

      const security = wifiSecurity === "nopass" ? "nopass" : wifiSecurity;
      const passwordPart =
        security === "nopass" ? "" : `P:${escapeWifiValue(wifiPassword)};`;

      return `WIFI:T:${security};S:${escapeWifiValue(
        cleanWifiName
      )};${passwordPart}H:${wifiHidden ? "true" : "false"};;`;
    }

    if (qrType === "vcard") {
      const cleanName = vcardName.trim();

      if (!cleanName) {
        throw new Error("Please enter a contact name.");
      }

      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${escapeVcardValue(cleanName)}`,
        vcardPhone.trim() ? `TEL:${escapeVcardValue(vcardPhone.trim())}` : "",
        vcardEmail.trim() ? `EMAIL:${escapeVcardValue(vcardEmail.trim())}` : "",
        vcardCompany.trim()
          ? `ORG:${escapeVcardValue(vcardCompany.trim())}`
          : "",
        vcardWebsite.trim() ? `URL:${escapeVcardValue(vcardWebsite.trim())}` : "",
        vcardAddress.trim()
          ? `ADR:${escapeVcardValue(vcardAddress.trim())}`
          : "",
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\n");
    }

    throw new Error("Please select a valid QR code type.");
  };

  const handleGenerate = async () => {
    clearFeedback();
    setCopied(false);
    setIsGenerating(true);

    try {
      const payload = generateQrPayload();

      const png = await QRCode.toDataURL(payload, qrOptions);
      const svg = await QRCode.toString(payload, {
        ...qrOptions,
        type: "svg",
      });

      setQrContent(payload);
      setPngDataUrl(png);
      setSvgText(svg);
      setSuccess("QR code generated successfully.");
    } catch (err) {
      setQrContent("");
      setPngDataUrl("");
      setSvgText("");
      setError(err.message || "Could not generate QR code. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyContent = async () => {
    if (!qrContent) return;

    try {
      await navigator.clipboard.writeText(qrContent);
      setCopied(true);
      setError("");
      setSuccess("QR content copied successfully.");

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setError("Copy failed. Please copy the QR content manually.");
    }
  };

  const handleDownloadPng = () => {
    if (!pngDataUrl) {
      setError("Please generate a QR code first.");
      return;
    }

    const link = document.createElement("a");
    link.href = pngDataUrl;
    link.download = `qr-code-${qrType}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSvg = () => {
    if (!svgText) {
      setError("Please generate a QR code first.");
      return;
    }

    const blob = new Blob([svgText], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `qr-code-${qrType}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setQrType("url");

    setUrl("");
    setText("");

    setEmail("");
    setEmailSubject("");
    setEmailBody("");

    setPhoneNumber("");
    setSmsNumber("");
    setSmsMessage("");

    setWhatsappNumber("");
    setWhatsappMessage("");

    setWifiName("");
    setWifiPassword("");
    setWifiSecurity("WPA");
    setWifiHidden(false);

    setVcardName("");
    setVcardPhone("");
    setVcardEmail("");
    setVcardCompany("");
    setVcardWebsite("");
    setVcardAddress("");

    setSize(512);
    setMargin(2);
    setForegroundColor("#333333");
    setBackgroundColor("#ffffff");
    setErrorCorrection("M");

    setQrContent("");
    setPngDataUrl("");
    setSvgText("");

    setCopied(false);
    setIsGenerating(false);
    setError("");
    setSuccess("");
  };

  const stats = useMemo(() => {
    const contentLength = qrContent.length;
    const svgSize = svgText ? new Blob([svgText]).size : 0;
    const pngApproxSize = pngDataUrl
      ? Math.round((pngDataUrl.length * 3) / 4)
      : 0;

    return {
      type: selectedType?.label || "-",
      contentLength,
      svgSize,
      pngApproxSize,
      size,
      errorCorrection,
    };
  }, [qrContent, svgText, pngDataUrl, size, errorCorrection, selectedType]);

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <QrCodeIcon size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">QR Code Generator</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Create custom QR codes for URLs, text, email, phone, SMS, WhatsApp,
          WiFi, and vCard contact details. Customize colors, size, error
          correction, and download as PNG or SVG.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* TYPE SELECTOR */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <QrCodeIcon size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">QR Code Type</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {QR_TYPES.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleTypeChange(item.value)}
                      className={`rounded-xl border p-3 text-sm font-semibold transition ${
                        qrType === item.value
                          ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                          : "border-[var(--border)] bg-white text-[var(--text-primary)]"
                      }`}
                    >
                      <Icon size={18} className="mx-auto mb-1" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DYNAMIC INPUTS */}
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                {selectedType?.icon ? (
                  <selectedType.icon size={20} className="text-[var(--primary)]" />
                ) : (
                  <QrCodeIcon size={20} className="text-[var(--primary)]" />
                )}
                <h3 className="font-semibold">{selectedType?.label} Details</h3>
              </div>

              {qrType === "url" && (
                <InputField
                  label="Website URL"
                  value={url}
                  onChange={setUrl}
                  placeholder="https://example.com"
                />
              )}

              {qrType === "text" && (
                <TextAreaField
                  label="Text Content"
                  value={text}
                  onChange={setText}
                  placeholder="Enter any text to generate QR code..."
                />
              )}

              {qrType === "email" && (
                <div className="flex flex-col gap-4">
                  <InputField
                    label="Email Address"
                    value={email}
                    onChange={setEmail}
                    placeholder="name@example.com"
                  />

                  <InputField
                    label="Subject"
                    value={emailSubject}
                    onChange={setEmailSubject}
                    placeholder="Email subject"
                  />

                  <TextAreaField
                    label="Message"
                    value={emailBody}
                    onChange={setEmailBody}
                    placeholder="Email message..."
                    rows={4}
                  />
                </div>
              )}

              {qrType === "phone" && (
                <InputField
                  label="Phone Number"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  placeholder="+8801712345678"
                />
              )}

              {qrType === "sms" && (
                <div className="flex flex-col gap-4">
                  <InputField
                    label="Phone Number"
                    value={smsNumber}
                    onChange={setSmsNumber}
                    placeholder="+8801712345678"
                  />

                  <TextAreaField
                    label="SMS Message"
                    value={smsMessage}
                    onChange={setSmsMessage}
                    placeholder="Type your SMS message..."
                    rows={4}
                  />
                </div>
              )}

              {qrType === "whatsapp" && (
                <div className="flex flex-col gap-4">
                  <InputField
                    label="WhatsApp Number With Country Code"
                    value={whatsappNumber}
                    onChange={setWhatsappNumber}
                    placeholder="8801712345678"
                  />

                  <TextAreaField
                    label="WhatsApp Message"
                    value={whatsappMessage}
                    onChange={setWhatsappMessage}
                    placeholder="Type your WhatsApp message..."
                    rows={4}
                  />
                </div>
              )}

              {qrType === "wifi" && (
                <div className="flex flex-col gap-4">
                  <InputField
                    label="Network Name / SSID"
                    value={wifiName}
                    onChange={setWifiName}
                    placeholder="My WiFi Network"
                  />

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Security Type
                    </label>

                    <select
                      value={wifiSecurity}
                      onChange={(e) => {
                        setWifiSecurity(e.target.value);
                        clearOutput();
                      }}
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                    >
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">No Password</option>
                    </select>
                  </div>

                  {wifiSecurity !== "nopass" && (
                    <InputField
                      label="WiFi Password"
                      value={wifiPassword}
                      onChange={setWifiPassword}
                      placeholder="WiFi password"
                    />
                  )}

                  <label className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wifiHidden}
                      onChange={(e) => {
                        setWifiHidden(e.target.checked);
                        clearOutput();
                      }}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                    Hidden network
                  </label>
                </div>
              )}

              {qrType === "vcard" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <InputField
                    label="Full Name"
                    value={vcardName}
                    onChange={setVcardName}
                    placeholder="John Doe"
                  />

                  <InputField
                    label="Phone"
                    value={vcardPhone}
                    onChange={setVcardPhone}
                    placeholder="+8801712345678"
                  />

                  <InputField
                    label="Email"
                    value={vcardEmail}
                    onChange={setVcardEmail}
                    placeholder="name@example.com"
                  />

                  <InputField
                    label="Company"
                    value={vcardCompany}
                    onChange={setVcardCompany}
                    placeholder="Company name"
                  />

                  <InputField
                    label="Website"
                    value={vcardWebsite}
                    onChange={setVcardWebsite}
                    placeholder="https://example.com"
                  />

                  <InputField
                    label="Address"
                    value={vcardAddress}
                    onChange={setVcardAddress}
                    placeholder="Address"
                  />
                </div>
              )}
            </div>

            {/* CUSTOMIZATION */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">QR Customization</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Size: {size}px
                  </label>

                  <input
                    type="range"
                    min="128"
                    max="1024"
                    step="32"
                    value={size}
                    onChange={(e) => {
                      setSize(Number(e.target.value));
                      clearOutput();
                    }}
                    className="w-full accent-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Margin: {margin}
                  </label>

                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="1"
                    value={margin}
                    onChange={(e) => {
                      setMargin(Number(e.target.value));
                      clearOutput();
                    }}
                    className="w-full accent-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Error Correction
                  </label>

                  <select
                    value={errorCorrection}
                    onChange={(e) => {
                      setErrorCorrection(e.target.value);
                      clearOutput();
                    }}
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  >
                    {ERROR_LEVELS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-xs text-yellow-800">
                    High error correction is better if you plan to add a logo
                    later or print the QR code.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Palette size={18} className="text-[var(--primary)]" />
                    <label className="text-sm font-semibold">
                      QR Color
                    </label>
                  </div>

                  <input
                    type="color"
                    value={foregroundColor}
                    onChange={(e) => {
                      setForegroundColor(e.target.value);
                      clearOutput();
                    }}
                    className="w-full h-12 border rounded-xl p-1 bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Palette size={18} className="text-[var(--primary)]" />
                    <label className="text-sm font-semibold">
                      Background Color
                    </label>
                  </div>

                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => {
                      setBackgroundColor(e.target.value);
                      clearOutput();
                    }}
                    className="w-full h-12 border rounded-xl p-1 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  isGenerating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Zap size={18} />
                {isGenerating ? "Generating..." : "Generate QR Code"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>

            {/* FEEDBACK */}
            {error && (
              <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-sm text-yellow-800">
                For best scanning results, use strong contrast. Dark QR color on
                a light background usually works best.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* PREVIEW */}
            <div>
              <div className="flex justify-between items-start gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <QrCodeIcon size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-semibold">QR Preview</h2>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Preview your generated QR code before downloading.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyContent}
                  disabled={!qrContent}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    qrContent
                      ? copied
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-white text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary)]/5"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                  title="Copy QR content"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-6 bg-gray-50 min-h-[420px] flex items-center justify-center">
                {pngDataUrl ? (
                  <div className="text-center">
                    <div className="inline-block bg-white rounded-2xl border border-[var(--border)] p-4 shadow-sm">
                      <img
                        src={pngDataUrl}
                        alt="Generated QR Code"
                        className="max-w-full h-auto"
                        style={{ width: Math.min(size, 320) }}
                      />
                    </div>

                    <p className="text-sm text-[var(--text-secondary)] mt-4">
                      Scan test before printing or sharing.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <QrCodeIcon size={54} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-[var(--text-secondary)]">
                      Generated QR code will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* DOWNLOAD BUTTONS */}
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={!pngDataUrl}
                className={`btn-primary inline-flex items-center justify-center gap-2 ${
                  !pngDataUrl ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download PNG
              </button>

              <button
                type="button"
                onClick={handleDownloadSvg}
                disabled={!svgText}
                className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                  !svgText ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download SVG
              </button>
            </div>

            {/* QR CONTENT */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileTextIcon />
                <h3 className="font-semibold">QR Content</h3>
              </div>

              <textarea
                value={qrContent}
                readOnly
                placeholder="QR encoded content will appear here..."
                rows="8"
                className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none bg-gray-50 resize-none font-mono text-sm"
              />
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="QR Type" value={stats.type} />
              <StatCard label="QR Size" value={`${stats.size}px`} />
              <StatCard
                label="Data Length"
                value={qrContent ? stats.contentLength : "-"}
              />
              <StatCard label="Error Level" value={stats.errorCorrection} />
              <StatCard
                label="PNG Size"
                value={pngDataUrl ? formatBytes(stats.pngApproxSize) : "-"}
              />
              <StatCard
                label="SVG Size"
                value={svgText ? formatBytes(stats.svgSize) : "-"}
                green
              />
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="qr-code-generator" />
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 5 }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)] resize-none"
      />
    </div>
  );
}

function escapeWifiValue(value) {
  return String(value || "").replace(/([\\;,":])/g, "\\$1");
}

function escapeVcardValue(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  if (!bytes) return "0 B";

  const sizes = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes.length - 1
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${sizes[index]}`;
}

function FileTextIcon() {
  return <QrCodeIcon size={20} className="text-[var(--primary)]" />;
}

function StatCard({ label, value, green = false }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-4 text-center">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p
        className={`text-xl font-bold break-all ${
          green ? "text-green-600" : "text-[var(--primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}