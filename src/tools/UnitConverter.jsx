import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Check,
  Copy,
  RotateCcw,
  Ruler,
  Search,
  Zap,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Unit Converter",
  path: "/unit-converter",
  category: "Utility Tools",
  description:
    "Convert length, weight, temperature, area, volume, speed, time, storage, pressure, energy, and power units instantly.",
  metaTitle: "Unit Converter - Convert Units Online Instantly",
  metaDescription:
    "Free online unit converter for length, weight, temperature, area, volume, speed, time, digital storage, pressure, energy, and power.",
};

const CATEGORY_DEFINITIONS = {
  length: {
    label: "Length",
    base: "meter",
    units: [
      unit("millimeter", "Millimeter", "mm", 0.001),
      unit("centimeter", "Centimeter", "cm", 0.01),
      unit("meter", "Meter", "m", 1),
      unit("kilometer", "Kilometer", "km", 1000),
      unit("inch", "Inch", "in", 0.0254),
      unit("foot", "Foot", "ft", 0.3048),
      unit("yard", "Yard", "yd", 0.9144),
      unit("mile", "Mile", "mi", 1609.344),
      unit("nautical-mile", "Nautical Mile", "nmi", 1852),
    ],
    popular: [
      ["centimeter", "inch"],
      ["meter", "foot"],
      ["kilometer", "mile"],
      ["inch", "centimeter"],
    ],
  },
  mass: {
    label: "Weight",
    base: "kilogram",
    units: [
      unit("milligram", "Milligram", "mg", 0.000001),
      unit("gram", "Gram", "g", 0.001),
      unit("kilogram", "Kilogram", "kg", 1),
      unit("metric-ton", "Metric Ton", "t", 1000),
      unit("ounce", "Ounce", "oz", 0.028349523125),
      unit("pound", "Pound", "lb", 0.45359237),
      unit("stone", "Stone", "st", 6.35029318),
      unit("us-ton", "US Ton", "US ton", 907.18474),
    ],
    popular: [
      ["kilogram", "pound"],
      ["pound", "kilogram"],
      ["gram", "ounce"],
      ["metric-ton", "kilogram"],
    ],
  },
  temperature: {
    label: "Temperature",
    units: [
      { id: "celsius", label: "Celsius", symbol: "°C" },
      { id: "fahrenheit", label: "Fahrenheit", symbol: "°F" },
      { id: "kelvin", label: "Kelvin", symbol: "K" },
    ],
    popular: [
      ["celsius", "fahrenheit"],
      ["fahrenheit", "celsius"],
      ["celsius", "kelvin"],
      ["kelvin", "celsius"],
    ],
  },
  area: {
    label: "Area",
    base: "square-meter",
    units: [
      unit("square-millimeter", "Square Millimeter", "mm²", 0.000001),
      unit("square-centimeter", "Square Centimeter", "cm²", 0.0001),
      unit("square-meter", "Square Meter", "m²", 1),
      unit("square-kilometer", "Square Kilometer", "km²", 1000000),
      unit("square-inch", "Square Inch", "in²", 0.00064516),
      unit("square-foot", "Square Foot", "ft²", 0.09290304),
      unit("square-yard", "Square Yard", "yd²", 0.83612736),
      unit("acre", "Acre", "ac", 4046.8564224),
      unit("hectare", "Hectare", "ha", 10000),
      unit("square-mile", "Square Mile", "mi²", 2589988.110336),
    ],
    popular: [
      ["square-meter", "square-foot"],
      ["square-foot", "square-meter"],
      ["acre", "hectare"],
      ["hectare", "acre"],
    ],
  },
  volume: {
    label: "Volume",
    base: "liter",
    units: [
      unit("milliliter", "Milliliter", "mL", 0.001),
      unit("liter", "Liter", "L", 1),
      unit("cubic-meter", "Cubic Meter", "m³", 1000),
      unit("teaspoon", "Teaspoon", "tsp", 0.00492892159375),
      unit("tablespoon", "Tablespoon", "tbsp", 0.01478676478125),
      unit("cup", "Cup", "cup", 0.2365882365),
      unit("fluid-ounce", "Fluid Ounce", "fl oz", 0.0295735295625),
      unit("pint", "Pint", "pt", 0.473176473),
      unit("quart", "Quart", "qt", 0.946352946),
      unit("gallon", "Gallon", "gal", 3.785411784),
    ],
    popular: [
      ["liter", "gallon"],
      ["gallon", "liter"],
      ["milliliter", "fluid-ounce"],
      ["cup", "milliliter"],
    ],
  },
  speed: {
    label: "Speed",
    base: "meter-per-second",
    units: [
      unit("meter-per-second", "Meter per second", "m/s", 1),
      unit("kilometer-per-hour", "Kilometer per hour", "km/h", 0.2777777777777778),
      unit("mile-per-hour", "Mile per hour", "mph", 0.44704),
      unit("knot", "Knot", "kn", 0.5144444444444445),
      unit("foot-per-second", "Foot per second", "ft/s", 0.3048),
    ],
    popular: [
      ["kilometer-per-hour", "mile-per-hour"],
      ["mile-per-hour", "kilometer-per-hour"],
      ["knot", "kilometer-per-hour"],
      ["meter-per-second", "kilometer-per-hour"],
    ],
  },
  time: {
    label: "Time",
    base: "second",
    units: [
      unit("millisecond", "Millisecond", "ms", 0.001),
      unit("second", "Second", "s", 1),
      unit("minute", "Minute", "min", 60),
      unit("hour", "Hour", "hr", 3600),
      unit("day", "Day", "day", 86400),
      unit("week", "Week", "wk", 604800),
      unit("month", "Month", "mo", 2629800),
      unit("year", "Year", "yr", 31557600),
    ],
    popular: [
      ["minute", "second"],
      ["hour", "minute"],
      ["day", "hour"],
      ["year", "day"],
    ],
  },
  storage: {
    label: "Digital Storage",
    base: "byte",
    units: [
      unit("bit", "Bit", "bit", 0.125),
      unit("byte", "Byte", "B", 1),
      unit("kilobyte", "Kilobyte", "KB", 1000),
      unit("megabyte", "Megabyte", "MB", 1000000),
      unit("gigabyte", "Gigabyte", "GB", 1000000000),
      unit("terabyte", "Terabyte", "TB", 1000000000000),
      unit("petabyte", "Petabyte", "PB", 1000000000000000),
    ],
    popular: [
      ["megabyte", "gigabyte"],
      ["gigabyte", "megabyte"],
      ["terabyte", "gigabyte"],
      ["byte", "bit"],
    ],
  },
  pressure: {
    label: "Pressure",
    base: "pascal",
    units: [
      unit("pascal", "Pascal", "Pa", 1),
      unit("kilopascal", "Kilopascal", "kPa", 1000),
      unit("bar", "Bar", "bar", 100000),
      unit("atmosphere", "Atmosphere", "atm", 101325),
      unit("psi", "Pound per square inch", "psi", 6894.757293168),
      unit("torr", "Torr", "Torr", 133.3223684211),
    ],
    popular: [
      ["bar", "psi"],
      ["psi", "bar"],
      ["atmosphere", "pascal"],
      ["kilopascal", "psi"],
    ],
  },
  energy: {
    label: "Energy",
    base: "joule",
    units: [
      unit("joule", "Joule", "J", 1),
      unit("kilojoule", "Kilojoule", "kJ", 1000),
      unit("calorie", "Calorie", "cal", 4.184),
      unit("kilocalorie", "Kilocalorie", "kcal", 4184),
      unit("watt-hour", "Watt-hour", "Wh", 3600),
      unit("kilowatt-hour", "Kilowatt-hour", "kWh", 3600000),
      unit("btu", "BTU", "BTU", 1055.05585262),
    ],
    popular: [
      ["kilojoule", "kilocalorie"],
      ["kilocalorie", "kilojoule"],
      ["kilowatt-hour", "joule"],
      ["btu", "kilowatt-hour"],
    ],
  },
  power: {
    label: "Power",
    base: "watt",
    units: [
      unit("watt", "Watt", "W", 1),
      unit("kilowatt", "Kilowatt", "kW", 1000),
      unit("megawatt", "Megawatt", "MW", 1000000),
      unit("horsepower", "Horsepower", "hp", 745.6998715823),
      unit("btu-per-hour", "BTU per hour", "BTU/h", 0.2930710701722222),
    ],
    popular: [
      ["kilowatt", "horsepower"],
      ["horsepower", "kilowatt"],
      ["watt", "btu-per-hour"],
      ["megawatt", "kilowatt"],
    ],
  },
};

const CATEGORY_ORDER = [
  "length",
  "mass",
  "temperature",
  "area",
  "volume",
  "speed",
  "time",
  "storage",
  "pressure",
  "energy",
  "power",
];

const PRECISION_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "2", label: "2 decimals" },
  { value: "4", label: "4 decimals" },
  { value: "6", label: "6 decimals" },
];

export default function UnitConverter() {
  const [categoryId, setCategoryId] = useState("length");
  const [inputValue, setInputValue] = useState("100");
  const [fromUnit, setFromUnit] = useState("centimeter");
  const [toUnit, setToUnit] = useState("meter");
  const [precision, setPrecision] = useState("auto");
  const [copied, setCopied] = useState(false);

  const category = CATEGORY_DEFINITIONS[categoryId];
  const units = category.units;

  const result = useMemo(() => {
    return convertUnit({
      value: inputValue,
      fromUnit,
      toUnit,
      category,
      precision,
    });
  }, [category, fromUnit, inputValue, precision, toUnit]);

  const fromUnitData = units.find((item) => item.id === fromUnit) || units[0];
  const toUnitData = units.find((item) => item.id === toUnit) || units[1] || units[0];

  const resultText = useMemo(() => {
    if (!result.isValid) return "";

    return `${formatInputValue(inputValue)} ${fromUnitData.symbol} = ${result.display} ${toUnitData.symbol}`;
  }, [fromUnitData.symbol, inputValue, result, toUnitData.symbol]);

  function changeCategory(nextCategoryId) {
    const nextCategory = CATEGORY_DEFINITIONS[nextCategoryId];
    const popularPair = nextCategory.popular?.[0];

    setCategoryId(nextCategoryId);
    setFromUnit(popularPair?.[0] || nextCategory.units[0].id);
    setToUnit(popularPair?.[1] || nextCategory.units[1]?.id || nextCategory.units[0].id);
    setCopied(false);
  }

  function applyPopularPair(pair) {
    setFromUnit(pair[0]);
    setToUnit(pair[1]);
    setCopied(false);
  }

  function swapUnits() {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setCopied(false);
  }

  async function copyResult() {
    if (!resultText) return;

    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      fallbackCopy(resultText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  function resetTool() {
    setCategoryId("length");
    setInputValue("100");
    setFromUnit("centimeter");
    setToUnit("meter");
    setPrecision("auto");
    setCopied(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Ruler size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Unit Converter</h1>

        <p className="text-[var(--text-secondary)] max-w-3xl">
          Convert common units instantly with a clean and accurate online unit converter.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORY_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => changeCategory(id)}
                className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  categoryId === id
                    ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                    : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                }`}
              >
                {CATEGORY_DEFINITIONS[id].label}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4 items-end">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <label className="block text-sm font-bold mb-3">From</label>

              <input
                type="number"
                value={inputValue}
                onChange={(event) => {
                  setInputValue(event.target.value);
                  setCopied(false);
                }}
                placeholder="Enter value"
                className="unit-input text-2xl font-bold mb-3"
              />

              <UnitSelect
                label="From unit"
                units={units}
                value={fromUnit}
                onChange={(value) => {
                  setFromUnit(value);
                  setCopied(false);
                }}
              />
            </div>

            <button
              type="button"
              onClick={swapUnits}
              className="h-12 w-12 rounded-2xl border border-[var(--border)] bg-white inline-flex items-center justify-center hover:border-[var(--primary)] hover:text-[var(--primary)] transition lg:mb-10"
              title="Swap units"
              aria-label="Swap units"
            >
              <ArrowLeftRight size={20} />
            </button>

            <div className="rounded-2xl border border-[var(--border)] bg-[#fbf9ff] p-4">
              <label className="block text-sm font-bold mb-3">To</label>

              <div className="unit-result mb-3">
                {result.isValid ? result.display : "Enter a valid number"}
              </div>

              <UnitSelect
                label="To unit"
                units={units}
                value={toUnit}
                onChange={(value) => {
                  setToUnit(value);
                  setCopied(false);
                }}
              />
            </div>
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {category.popular?.map((pair) => {
                const from = units.find((item) => item.id === pair[0]);
                const to = units.find((item) => item.id === pair[1]);

                if (!from || !to) return null;

                const active = fromUnit === pair[0] && toUnit === pair[1];

                return (
                  <button
                    key={`${pair[0]}-${pair[1]}`}
                    type="button"
                    onClick={() => applyPopularPair(pair)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                        : "border-[var(--border)] bg-white hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    }`}
                  >
                    {from.symbol} to {to.symbol}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={precision}
                onChange={(event) => setPrecision(event.target.value)}
                className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-semibold outline-none focus:border-[var(--primary)]"
                aria-label="Decimal precision"
              >
                {PRECISION_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={copyResult}
                disabled={!result.isValid}
                className={`btn-primary inline-flex items-center justify-center gap-2 ${
                  !result.isValid ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : "Copy Result"}
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
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
              <Zap size={17} />
              Converted instantly
            </div>

            <p className="mt-2 text-lg font-semibold break-words">
              {result.isValid ? resultText : "Enter a valid number to convert units."}
            </p>
          </div>
        </div>
      </section>

      <style>{`
        .unit-input {
          width: 100%;
          height: 56px;
          border: 1px solid var(--border);
          border-radius: 0.9rem;
          padding: 0 1rem;
          background: white;
          outline: none;
        }
        .unit-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(155, 108, 227, 0.16);
        }
        .unit-result {
          width: 100%;
          min-height: 56px;
          border: 1px solid var(--border);
          border-radius: 0.9rem;
          padding: 0.85rem 1rem;
          background: white;
          font-size: 1.5rem;
          font-weight: 800;
          overflow-wrap: anywhere;
        }
      `}</style>

      <SuggestedTools currentToolId="unit-converter" />
    </div>
  );
}

function UnitSelect({ label, units, value, onChange }) {
  const [search, setSearch] = useState("");

  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return units;

    return units.filter((item) => {
      return (
        item.label.toLowerCase().includes(query) ||
        item.symbol.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
      );
    });
  }, [search, units]);

  return (
    <div>
      <label className="sr-only">{label}</label>

      <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-3">
          <Search size={16} className="text-[var(--text-secondary)] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search unit"
            className="h-10 w-full bg-transparent text-sm outline-none"
          />
        </div>

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full bg-white px-3 text-sm font-semibold outline-none"
          aria-label={label}
        >
          {filteredUnits.length ? (
            filteredUnits.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} ({item.symbol})
              </option>
            ))
          ) : (
            units.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} ({item.symbol})
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
}

function unit(id, label, symbol, factor) {
  return { id, label, symbol, factor };
}

function convertUnit({ value, fromUnit, toUnit, category, precision }) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return {
      isValid: false,
      value: null,
      display: "",
    };
  }

  const result =
    category.label === "Temperature"
      ? convertTemperature(number, fromUnit, toUnit)
      : convertLinear(number, fromUnit, toUnit, category.units);

  return {
    isValid: Number.isFinite(result),
    value: result,
    display: formatNumber(result, precision),
  };
}

function convertLinear(value, fromUnit, toUnit, units) {
  const from = units.find((item) => item.id === fromUnit);
  const to = units.find((item) => item.id === toUnit);

  if (!from || !to) return NaN;

  return (value * from.factor) / to.factor;
}

function convertTemperature(value, fromUnit, toUnit) {
  const celsius = toCelsius(value, fromUnit);
  return fromCelsius(celsius, toUnit);
}

function toCelsius(value, unitId) {
  if (unitId === "celsius") return value;
  if (unitId === "fahrenheit") return (value - 32) * (5 / 9);
  if (unitId === "kelvin") return value - 273.15;

  return value;
}

function fromCelsius(value, unitId) {
  if (unitId === "celsius") return value;
  if (unitId === "fahrenheit") return value * (9 / 5) + 32;
  if (unitId === "kelvin") return value + 273.15;

  return value;
}

function formatNumber(value, precision) {
  if (!Number.isFinite(value)) return "";

  if (precision !== "auto") {
    return trimTrailingZeros(value.toFixed(Number(precision)));
  }

  const absValue = Math.abs(value);

  if (absValue === 0) return "0";
  if (absValue >= 1e12 || absValue < 1e-8) {
    return value.toExponential(8).replace(/\.?0+e/, "e");
  }

  const decimals = absValue >= 1000 ? 4 : absValue >= 1 ? 8 : 10;
  return trimTrailingZeros(value.toFixed(decimals));
}

function trimTrailingZeros(value) {
  return String(value).replace(/(\.\d*?[1-9])0+$/u, "$1").replace(/\.0+$/u, "");
}

function formatInputValue(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return String(value || "");

  return trimTrailingZeros(String(value));
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
