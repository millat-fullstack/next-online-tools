import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Copy,
  RotateCcw,
  ArrowRight,
  Calculator,
  Clock3,
  Briefcase,
  CalendarPlus,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Count Days",
  path: "/count-days",
  category: "Date & Time Tools",
  description:
    "Count days between two dates, calculate business days, weekends, weeks, and add or subtract days from a date.",
  metaTitle: "Count Days Online Free | Days Between Dates Calculator",
  metaDescription:
    "Count days between dates online. Calculate calendar days, business days, weekends, weeks, and add or subtract days from any date.",
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default function CountDays() {
  const today = getTodayInputValue();

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDaysInputValue(today, 30));
  const [includeEndDate, setIncludeEndDate] = useState(false);
  const [copied, setCopied] = useState("");

  const [baseDate, setBaseDate] = useState(today);
  const [daysToAdd, setDaysToAdd] = useState(7);
  const [operation, setOperation] = useState("add");

  const countResult = useMemo(() => {
    return calculateDateCount(startDate, endDate, includeEndDate);
  }, [startDate, endDate, includeEndDate]);

  const addSubtractResult = useMemo(() => {
    const parsedBaseDate = parseInputDate(baseDate);

    if (!parsedBaseDate) return null;

    const amount = Math.max(0, Number(daysToAdd || 0));
    const signedAmount = operation === "subtract" ? -amount : amount;
    const resultDate = addDays(parsedBaseDate, signedAmount);

    return {
      date: resultDate,
      input: formatInputDate(resultDate),
      label: formatDisplayDate(resultDate),
    };
  }, [baseDate, daysToAdd, operation]);

  async function copyText(text, label) {
    try {
      await copyToClipboard(text);
      setCopied(label);

      window.setTimeout(() => {
        setCopied("");
      }, 1400);
    } catch {
      setCopied("");
    }
  }

  function resetCounter() {
    setStartDate(today);
    setEndDate(addDaysInputValue(today, 30));
    setIncludeEndDate(false);
    setCopied("");
  }

  function resetAddSubtract() {
    setBaseDate(today);
    setDaysToAdd(7);
    setOperation("add");
    setCopied("");
  }

  const summaryText = countResult
    ? `${formatDisplayDate(countResult.earlierDate)} to ${formatDisplayDate(countResult.laterDate)} = ${countResult.calendarDays} calendar days, ${countResult.businessDays} business days, ${countResult.weekendDays} weekend days.`
    : "";

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <CalendarDays size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Count Days</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Count days between two dates, check business days and weekends, or add
          and subtract days from a date.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_420px] gap-5">
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-5">
                <Calculator size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-bold">Days Between Dates</h2>
              </div>

              <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                <DateInput
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                />

                <div className="hidden sm:flex h-12 items-center justify-center text-[var(--primary)]">
                  <ArrowRight size={22} />
                </div>

                <DateInput
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeEndDate}
                    onChange={(event) => setIncludeEndDate(event.target.checked)}
                    className="h-5 w-5 accent-[var(--primary)]"
                  />
                  <span className="text-sm font-semibold">
                    Include end date in count
                  </span>
                </label>

                <button
                  type="button"
                  onClick={resetCounter}
                  className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                >
                  <RotateCcw size={17} />
                  Reset
                </button>
              </div>
            </div>

            {countResult && (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock3 size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-bold">Result</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyText(summaryText, "summary")}
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                  >
                    {copied === "summary" ? <Check size={17} /> : <Copy size={17} />}
                    {copied === "summary" ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <ResultCard
                    label="Calendar Days"
                    value={countResult.calendarDays}
                    description={includeEndDate ? "Including end date" : "Excluding end date"}
                    highlighted
                  />

                  <ResultCard
                    label="Business Days"
                    value={countResult.businessDays}
                    description="Monday to Friday"
                  />

                  <ResultCard
                    label="Weekend Days"
                    value={countResult.weekendDays}
                    description="Saturday and Sunday"
                  />

                  <ResultCard
                    label="Full Weeks"
                    value={countResult.fullWeeks}
                    description={`${countResult.remainingDays} extra day${countResult.remainingDays === 1 ? "" : "s"}`}
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[#fafafa] p-4">
                  <p className="text-sm text-[var(--text-secondary)]">
                    From <strong>{formatDisplayDate(countResult.earlierDate)}</strong> to{" "}
                    <strong>{formatDisplayDate(countResult.laterDate)}</strong>
                    {countResult.wasReversed ? " after reversing the date order" : ""}.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-5">
                <CalendarPlus size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-bold">Add or Subtract Days</h2>
              </div>

              <div className="grid sm:grid-cols-[1fr_150px_160px] gap-4 items-end">
                <DateInput
                  label="Base Date"
                  value={baseDate}
                  onChange={setBaseDate}
                />

                <label className="block">
                  <span className="block text-sm font-semibold mb-2">
                    Days
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={daysToAdd}
                    onChange={(event) => setDaysToAdd(event.target.value)}
                    className="w-full h-12 rounded-xl border border-[var(--border)] bg-white px-4 outline-none focus:border-[var(--primary)]"
                  />
                </label>

                <label className="block">
                  <span className="block text-sm font-semibold mb-2">
                    Operation
                  </span>
                  <select
                    value={operation}
                    onChange={(event) => setOperation(event.target.value)}
                    className="w-full h-12 rounded-xl border border-[var(--border)] bg-white px-4 outline-none focus:border-[var(--primary)]"
                  >
                    <option value="add">Add days</option>
                    <option value="subtract">Subtract days</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={resetAddSubtract}
                  className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                >
                  <RotateCcw size={17} />
                  Reset
                </button>
              </div>

              {addSubtractResult && (
                <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Final Date
                    </p>
                    <p className="text-2xl font-black text-[var(--primary)] mt-1">
                      {addSubtractResult.label}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyText(addSubtractResult.input, "final-date")}
                    className="btn-primary inline-flex items-center justify-center gap-2"
                  >
                    {copied === "final-date" ? <Check size={18} /> : <Copy size={18} />}
                    {copied === "final-date" ? "Copied" : "Copy Date"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-4 h-fit flex flex-col gap-5">
            <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-bold">Quick Summary</h2>
              </div>

              {countResult ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#f8f4ff] border border-[var(--border)] p-5 text-center">
                    <p className="text-sm text-[var(--text-secondary)]">
                      Total Calendar Days
                    </p>
                    <p className="text-5xl font-black text-[var(--primary)] mt-2">
                      {countResult.calendarDays}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label="Business" value={countResult.businessDays} />
                    <MiniStat label="Weekends" value={countResult.weekendDays} />
                    <MiniStat label="Weeks" value={countResult.fullWeeks} />
                    <MiniStat label="Extra Days" value={countResult.remainingDays} />
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-6">
                    {summaryText}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  Choose dates to see the summary.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <h3 className="font-bold mb-3">How it counts</h3>

              <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                <p>
                  <strong>Calendar days</strong> counts every day between the two
                  selected dates.
                </p>
                <p>
                  <strong>Business days</strong> counts Monday to Friday only.
                </p>
                <p>
                  Turn on <strong>Include end date</strong> when the final day
                  should be included in the total.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="count-days" />
    </div>
  );
}

function DateInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-2">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-12 rounded-xl border border-[var(--border)] bg-white px-4 outline-none focus:border-[var(--primary)]"
      />
    </label>
  );
}

function ResultCard({ label, value, description, highlighted = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlighted
          ? "border-[var(--primary)] bg-[#f8f4ff]"
          : "border-[var(--border)] bg-[#fafafa]"
      }`}
    >
      <p className="text-xs font-bold text-[var(--text-secondary)]">{label}</p>
      <p className={`text-3xl font-black mt-2 ${highlighted ? "text-[var(--primary)]" : ""}`}>
        {value}
      </p>
      <p className="text-xs text-[var(--text-secondary)] mt-1">{description}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[#fafafa] p-4 text-center">
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="text-2xl font-black text-[var(--primary)] mt-1">{value}</p>
    </div>
  );
}

function calculateDateCount(startDateValue, endDateValue, includeEndDate) {
  const firstDate = parseInputDate(startDateValue);
  const secondDate = parseInputDate(endDateValue);

  if (!firstDate || !secondDate) return null;

  const wasReversed = firstDate.getTime() > secondDate.getTime();
  const earlierDate = wasReversed ? secondDate : firstDate;
  const laterDate = wasReversed ? firstDate : secondDate;

  const rawDiff = Math.round((stripTime(laterDate).getTime() - stripTime(earlierDate).getTime()) / MS_PER_DAY);
  const calendarDays = Math.max(0, rawDiff + (includeEndDate ? 1 : 0));
  const businessDays = countBusinessDays(earlierDate, laterDate, includeEndDate);
  const weekendDays = Math.max(0, calendarDays - businessDays);

  return {
    calendarDays,
    businessDays,
    weekendDays,
    fullWeeks: Math.floor(calendarDays / 7),
    remainingDays: calendarDays % 7,
    earlierDate,
    laterDate,
    wasReversed,
  };
}

function countBusinessDays(startDate, endDate, includeEndDate) {
  let count = 0;
  const current = stripTime(startDate);
  const last = stripTime(endDate);
  const endTime = last.getTime() + (includeEndDate ? 0 : -MS_PER_DAY);

  while (current.getTime() <= endTime) {
    const day = current.getDay();

    if (day !== 0 && day !== 6) {
      count += 1;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

function parseInputDate(value) {
  if (!value) return null;

  const parts = String(value).split("-").map(Number);

  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function getTodayInputValue() {
  return formatInputDate(new Date());
}

function addDaysInputValue(inputDateValue, amount) {
  const parsed = parseInputDate(inputDateValue) || new Date();
  return formatInputDate(addDays(parsed, amount));
}

function addDays(date, amount) {
  const nextDate = stripTime(date);
  nextDate.setDate(nextDate.getDate() + Number(amount || 0));
  return nextDate;
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatInputDate(date) {
  const cleanDate = stripTime(date);
  const year = cleanDate.getFullYear();
  const month = String(cleanDate.getMonth() + 1).padStart(2, "0");
  const day = String(cleanDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
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
