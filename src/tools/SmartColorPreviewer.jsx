import { useMemo, useState } from "react";
import {
  Check,
  Clipboard,
  Copy,
  Droplet,
  Eye,
  Palette,
  RefreshCcw,
  Shuffle,
  Sparkles,
  SwatchBook,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Smart Color Previewer",
  path: "/color-preview",
  category: "Design Tools",
  description:
    "Preview any HEX color, copy HEX RGB and HSL values, check contrast, and create quick shades.",
  metaTitle: "Smart Color Previewer Online | HEX RGB HSL Color Checker",
  metaDescription:
    "Preview colors online using HEX codes. Convert HEX to RGB and HSL, copy color values, check contrast, and generate quick shades for design work.",
};

const DEFAULT_COLOR = "#0a66c2";
const SAMPLE_COLORS = [
  "#0a66c2",
  "#9b6ce3",
  "#111827",
  "#22c55e",
  "#ef4444",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
];

export default function ColorPreview() {
  const [inputColor, setInputColor] = useState(DEFAULT_COLOR);
  const [copiedLabel, setCopiedLabel] = useState("");

  const colorData = useMemo(() => parseColor(inputColor), [inputColor]);
  const activeHex = colorData.isValid ? colorData.hex : DEFAULT_COLOR;
  const rgb = colorData.isValid ? colorData.rgb : hexToRgb(DEFAULT_COLOR);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const contrast = useMemo(() => {
    return {
      onWhite: getContrastRatio(rgb, { r: 255, g: 255, b: 255 }),
      onBlack: getContrastRatio(rgb, { r: 0, g: 0, b: 0 }),
      textColor: getReadableTextColor(rgb),
    };
  }, [rgb]);

  const shades = useMemo(() => generateShades(activeHex), [activeHex]);
  const harmonies = useMemo(() => generateHarmonies(activeHex), [activeHex]);

  function handleInputChange(value) {
    setInputColor(value);
    setCopiedLabel("");
  }

  function randomColor() {
    setInputColor(generateRandomHex());
    setCopiedLabel("");
  }

  function resetColor() {
    setInputColor(DEFAULT_COLOR);
    setCopiedLabel("");
  }

  async function copyValue(value, label) {
    if (!value) return;

    try {
      await copyToClipboard(value);
      setCopiedLabel(label);
      window.setTimeout(() => setCopiedLabel(""), 1400);
    } catch {
      setCopiedLabel("");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Palette size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Smart Color Previewer</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Enter a HEX color, preview it instantly, copy useful color values, check
          readability, and create quick shades for your design.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_420px] gap-5">
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Droplet size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Color Input</h2>
              </div>

              <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                <label className="block">
                  <span className="block text-sm font-semibold mb-2">
                    HEX Color Code
                  </span>

                  <input
                    type="text"
                    value={inputColor}
                    onChange={(event) => handleInputChange(event.target.value)}
                    placeholder="#0a66c2"
                    className={`w-full h-12 border rounded-xl px-4 outline-none transition ${
                      colorData.isValid
                        ? "border-[var(--border)] focus:border-[var(--primary)]"
                        : "border-red-300 focus:border-red-500 bg-red-50"
                    }`}
                  />
                </label>

                <label className="block">
                  <span className="block text-sm font-semibold mb-2">Picker</span>

                  <input
                    type="color"
                    value={activeHex}
                    onChange={(event) => handleInputChange(event.target.value)}
                    className="w-full sm:w-20 h-12 rounded-xl border border-[var(--border)] bg-white p-1 cursor-pointer"
                    aria-label="Pick color"
                  />
                </label>
              </div>

              {!colorData.isValid && (
                <p className="mt-3 text-sm text-red-600">
                  Enter a valid HEX color like <strong>#0a66c2</strong> or{" "}
                  <strong>#abc</strong>.
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  onClick={randomColor}
                  className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                >
                  <Shuffle size={17} />
                  Random
                </button>

                <button
                  type="button"
                  onClick={resetColor}
                  className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCcw size={17} />
                  Reset
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clipboard size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Copy Color Values</h2>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <CopyCard
                  label="HEX"
                  value={activeHex}
                  copied={copiedLabel === "HEX"}
                  onCopy={() => copyValue(activeHex, "HEX")}
                />

                <CopyCard
                  label="RGB"
                  value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
                  copied={copiedLabel === "RGB"}
                  onCopy={() => copyValue(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, "RGB")}
                />

                <CopyCard
                  label="HSL"
                  value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
                  copied={copiedLabel === "HSL"}
                  onCopy={() => copyValue(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, "HSL")}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <SwatchBook size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Shades</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {shades.map((shade) => (
                  <Swatch
                    key={shade}
                    color={shade}
                    copied={copiedLabel === shade}
                    onCopy={() => copyValue(shade, shade)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Matching Colors</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {harmonies.map((item) => (
                  <HarmonyCard
                    key={item.label}
                    label={item.label}
                    color={item.color}
                    copied={copiedLabel === item.color}
                    onCopy={() => copyValue(item.color, item.color)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-4 h-fit flex flex-col gap-5">
            <div
              className="rounded-3xl border border-[var(--border)] p-6 min-h-[420px] flex flex-col justify-between shadow-sm"
              style={{ backgroundColor: activeHex, color: contrast.textColor }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm opacity-80">Preview</p>
                  <h2 className="text-3xl font-black mt-1">{activeHex}</h2>
                </div>

                <button
                  type="button"
                  onClick={() => copyValue(activeHex, "Preview HEX")}
                  className="h-11 w-11 rounded-2xl bg-white/20 border border-white/30 inline-flex items-center justify-center backdrop-blur hover:bg-white/30 transition"
                  title="Copy HEX"
                  aria-label="Copy HEX"
                >
                  {copiedLabel === "Preview HEX" ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>

              <div>
                <div className="rounded-2xl bg-white/16 border border-white/20 p-4 backdrop-blur">
                  <p className="text-xl font-bold">Design Preview</p>
                  <p className="text-sm opacity-85 mt-2">
                    This shows how text may look on your selected color.
                  </p>

                  <button
                    type="button"
                    className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-bold"
                    style={{ color: activeHex }}
                  >
                    Sample Button
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Readability</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ContrastCard
                  label="White Text"
                  ratio={contrast.onWhite}
                  good={contrast.onWhite >= 4.5}
                />

                <ContrastCard
                  label="Black Text"
                  ratio={contrast.onBlack}
                  good={contrast.onBlack >= 4.5}
                />
              </div>

              <p className="text-xs text-[var(--text-secondary)] mt-3">
                A ratio of 4.5 or higher is usually easier to read for normal text.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <p className="font-semibold mb-3">Quick colors</p>

              <div className="grid grid-cols-4 gap-2">
                {SAMPLE_COLORS.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setInputColor(sample)}
                    className="h-12 rounded-xl border border-[var(--border)] transition hover:scale-[1.03]"
                    style={{ backgroundColor: sample }}
                    title={sample}
                    aria-label={`Use ${sample}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="color-preview" />
    </div>
  );
}

function CopyCard({ label, value, copied, onCopy }) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className="rounded-2xl border border-[var(--border)] bg-[#fafafa] p-4 text-left hover:bg-[#f8f4ff] hover:border-[var(--primary)] transition"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-[var(--text-secondary)]">{label}</span>
        {copied ? <Check size={17} className="text-green-600" /> : <Copy size={17} className="text-[var(--primary)]" />}
      </div>

      <p className="font-bold break-all">{value}</p>
    </button>
  );
}

function Swatch({ color, copied, onCopy }) {
  const rgb = hexToRgb(color);
  const textColor = getReadableTextColor(rgb);

  return (
    <button
      type="button"
      onClick={onCopy}
      className="rounded-2xl border border-[var(--border)] overflow-hidden text-left hover:scale-[1.02] transition"
      title={`Copy ${color}`}
    >
      <div
        className="h-20 flex items-center justify-center"
        style={{ backgroundColor: color, color: textColor }}
      >
        {copied ? <Check size={20} /> : <Copy size={18} />}
      </div>

      <div className="bg-white px-3 py-2">
        <p className="text-xs font-bold">{color}</p>
      </div>
    </button>
  );
}

function HarmonyCard({ label, color, copied, onCopy }) {
  const rgb = hexToRgb(color);
  const textColor = getReadableTextColor(rgb);

  return (
    <button
      type="button"
      onClick={onCopy}
      className="rounded-2xl border border-[var(--border)] overflow-hidden hover:scale-[1.02] transition"
      title={`Copy ${color}`}
    >
      <div
        className="h-20 flex items-center justify-center"
        style={{ backgroundColor: color, color: textColor }}
      >
        {copied ? <Check size={20} /> : <Copy size={18} />}
      </div>

      <div className="bg-white px-3 py-2 text-left">
        <p className="text-xs font-bold">{label}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{color}</p>
      </div>
    </button>
  );
}

function ContrastCard({ label, ratio, good }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        good
          ? "border-green-100 bg-green-50 text-green-800"
          : "border-yellow-100 bg-yellow-50 text-yellow-800"
      }`}
    >
      <p className="text-sm font-bold">{label}</p>
      <p className="text-2xl font-black mt-1">{ratio.toFixed(2)}</p>
      <p className="text-xs mt-1">{good ? "Good" : "Low"}</p>
    </div>
  );
}

function parseColor(value) {
  const clean = String(value || "").trim();

  if (!clean) {
    return {
      isValid: false,
      hex: "",
      rgb: { r: 0, g: 0, b: 0 },
    };
  }

  const withHash = clean.startsWith("#") ? clean : `#${clean}`;

  if (/^#[0-9a-f]{3}$/i.test(withHash)) {
    const expanded = `#${withHash
      .slice(1)
      .split("")
      .map((char) => char + char)
      .join("")}`.toLowerCase();

    return {
      isValid: true,
      hex: expanded,
      rgb: hexToRgb(expanded),
    };
  }

  if (/^#[0-9a-f]{6}$/i.test(withHash)) {
    return {
      isValid: true,
      hex: withHash.toLowerCase(),
      rgb: hexToRgb(withHash),
    };
  }

  return {
    isValid: false,
    hex: "",
    rgb: { r: 0, g: 0, b: 0 },
  };
}

function hexToRgb(hex) {
  const parsed = String(hex || "#000000").replace("#", "");
  const value = parsed.length === 3
    ? parsed
        .split("")
        .map((char) => char + char)
        .join("")
    : parsed.padEnd(6, "0").slice(0, 6);

  const number = Number.parseInt(value, 16);

  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((value) => clampNumber(value, 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToHsl(r, g, b) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case red:
        h = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        h = (blue - red) / delta + 2;
        break;
      default:
        h = (red - green) / delta + 4;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h, s, l) {
  const hue = (((h % 360) + 360) % 360) / 360;
  const saturation = clampNumber(s, 0, 100) / 100;
  const lightness = clampNumber(l, 0, 100) / 100;

  if (saturation === 0) {
    const gray = Math.round(lightness * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hueToRgb = (p, q, tValue) => {
    let t = tValue;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    r: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hue) * 255),
    b: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  };
}

function generateShades(hex) {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  return [88, 72, 56, hsl.l, 36, 24, 14]
    .filter((lightness, index, array) => array.indexOf(lightness) === index)
    .map((lightness) => {
      const shadeRgb = hslToRgb(hsl.h, hsl.s, lightness);
      return rgbToHex(shadeRgb.r, shadeRgb.g, shadeRgb.b);
    });
}

function generateHarmonies(hex) {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const values = [
    { label: "Original", h: hsl.h },
    { label: "Complement", h: hsl.h + 180 },
    { label: "Triad 1", h: hsl.h + 120 },
    { label: "Triad 2", h: hsl.h + 240 },
  ];

  return values.map((item) => {
    const itemRgb = hslToRgb(item.h, hsl.s, hsl.l);
    return {
      label: item.label,
      color: rgbToHex(itemRgb.r, itemRgb.g, itemRgb.b),
    };
  });
}

function getContrastRatio(foreground, background) {
  const foregroundLum = getRelativeLuminance(foreground);
  const backgroundLum = getRelativeLuminance(background);
  const lighter = Math.max(foregroundLum, backgroundLum);
  const darker = Math.min(foregroundLum, backgroundLum);

  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance({ r, g, b }) {
  const channels = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function getReadableTextColor(rgb) {
  const whiteRatio = getContrastRatio(rgb, { r: 255, g: 255, b: 255 });
  const blackRatio = getContrastRatio(rgb, { r: 0, g: 0, b: 0 });

  return whiteRatio >= blackRatio ? "#ffffff" : "#111827";
}

function generateRandomHex() {
  const value = Math.floor(Math.random() * 0xffffff);
  return `#${value.toString(16).padStart(6, "0")}`;
}

function clampNumber(value, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) return min;

  return Math.min(max, Math.max(min, number));
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
  textarea.style.left = "-9999px";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const successful = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!successful) {
    throw new Error("Copy failed.");
  }
}
