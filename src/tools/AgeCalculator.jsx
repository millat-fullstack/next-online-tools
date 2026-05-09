import { useMemo, useState } from "react";
import {
  Calendar,
  Calculator,
  Clock,
  Cake,
  Copy,
  Download,
  RotateCcw,
  Zap,
  Check,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Age Calculator",
  path: "/age-calculator",
  category: "Date & Time Tools",
  description:
    "Calculate your exact age in years, months, and days. Also find total days, weeks, months, and next birthday countdown.",
  metaTitle: "Age Calculator | Calculate Exact Age Online Free",
  metaDescription:
    "Calculate your exact age online for free. Find age in years, months, days, total days, weeks, months, and next birthday countdown instantly.",
};

export default function AgeCalculator() {
  const [birthDate, setBirthDate] = useState("");
  const [calculateMode, setCalculateMode] = useState("today");
  const [customDate, setCustomDate] = useState(getTodayInputValue());
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const calculationDate = useMemo(() => {
    return calculateMode === "today" ? getTodayInputValue() : customDate;
  }, [calculateMode, customDate]);

  const handleCalculate = () => {
    setError("");
    setSuccess("");
    setCopied(false);

    if (!birthDate) {
      setResult(null);
      setError("Please select your date of birth.");
      return;
    }

    if (!calculationDate) {
      setResult(null);
      setError("Please select a calculation date.");
      return;
    }

    const dob = parseDateInput(birthDate);
    const targetDate = parseDateInput(calculationDate);

    if (!dob || !targetDate) {
      setResult(null);
      setError("Please select valid dates.");
      return;
    }

    if (dob > targetDate) {
      setResult(null);
      setError("Date of birth cannot be after the calculation date.");
      return;
    }

    const age = calculateExactAge(dob, targetDate);
    const totals = calculateTotals(dob, targetDate);
    const birthday = calculateNextBirthday(dob, targetDate);

    const finalResult = {
      dob,
      targetDate,
      age,
      totals,
      birthday,
      bornDay: formatDayName(dob),
      birthDateText: formatDateLong(dob),
      calculationDateText: formatDateLong(targetDate),
    };

    setResult(finalResult);
    setSuccess("Age calculated successfully.");
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(createResultText(result));
      setCopied(true);
      setError("");
      setSuccess("Age result copied successfully.");

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setError("Copy failed. Please copy the result manually.");
    }
  };

  const handleDownload = () => {
    if (!result) {
      setError("Please calculate age first.");
      return;
    }

    const blob = new Blob([createResultText(result)], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "age-calculator-result.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setBirthDate("");
    setCalculateMode("today");
    setCustomDate(getTodayInputValue());
    setResult(null);
    setCopied(false);
    setError("");
    setSuccess("");
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Calendar size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Age Calculator</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Calculate exact age in years, months, and days. Also check total days,
          weeks, months, hours, next birthday countdown, and the day you were
          born.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calculator size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Enter Details</h2>
              </div>

              <label className="block text-sm font-semibold mb-2">
                Date of Birth
              </label>

              <input
                type="date"
                value={birthDate}
                onChange={(e) => {
                  setBirthDate(e.target.value);
                  setResult(null);
                  setError("");
                  setSuccess("");
                  setCopied(false);
                }}
                className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
              />

              <div className="mt-5">
                <label className="block text-sm font-semibold mb-2">
                  Calculate Age On
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCalculateMode("today");
                      setResult(null);
                      setError("");
                      setSuccess("");
                    }}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                      calculateMode === "today"
                        ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                        : "border-[var(--border)] bg-white"
                    }`}
                  >
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCalculateMode("custom");
                      setResult(null);
                      setError("");
                      setSuccess("");
                    }}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                      calculateMode === "custom"
                        ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                        : "border-[var(--border)] bg-white"
                    }`}
                  >
                    Custom Date
                  </button>
                </div>
              </div>

              {calculateMode === "custom" && (
                <div className="mt-5">
                  <label className="block text-sm font-semibold mb-2">
                    Custom Calculation Date
                  </label>

                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setResult(null);
                      setError("");
                      setSuccess("");
                      setCopied(false);
                    }}
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  />
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCalculate}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                Calculate Age
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
                This calculator uses calendar-based age calculation, so it
                handles month length and leap years more accurately than simple
                day counting.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-start gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Cake size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-semibold">Age Result</h2>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Exact age and birthday details will appear here.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!result}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    result
                      ? copied
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-white text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary)]/5"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                  title="Copy age result"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              {result ? (
                <div className="border border-[var(--border)] rounded-2xl p-5 bg-gray-50">
                  <div className="bg-white border border-[var(--border)] rounded-2xl p-6 text-center">
                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                      Exact Age
                    </p>

                    <p className="text-3xl font-bold text-[var(--primary)]">
                      {result.age.years} years
                    </p>

                    <p className="text-xl font-semibold mt-2">
                      {result.age.months} months, {result.age.days} days
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <InfoCard label="Born On" value={result.bornDay} />
                    <InfoCard
                      label="Date of Birth"
                      value={result.birthDateText}
                    />
                    <InfoCard
                      label="Calculated On"
                      value={result.calculationDateText}
                    />
                    <InfoCard
                      label="Next Birthday"
                      value={
                        result.birthday.daysToBirthday === 0
                          ? "Today"
                          : `${result.birthday.daysToBirthday} days left`
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                  <Cake size={44} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-[var(--text-secondary)]">
                    Enter date of birth and click “Calculate Age”.
                  </p>
                </div>
              )}
            </div>

            {/* DOWNLOAD BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!result}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !result ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : "Copy Result"}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!result}
                className={`btn-secondary flex-1 inline-flex items-center justify-center gap-2 ${
                  !result ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download TXT
              </button>
            </div>

            {/* STATS */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Detailed Statistics</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Total Months"
                  value={result ? result.totals.totalMonths : "-"}
                />

                <StatCard
                  label="Total Weeks"
                  value={result ? result.totals.totalWeeks : "-"}
                />

                <StatCard
                  label="Total Days"
                  value={result ? result.totals.totalDays : "-"}
                />

                <StatCard
                  label="Total Hours"
                  value={result ? result.totals.totalHours : "-"}
                />

                <StatCard
                  label="Total Minutes"
                  value={result ? result.totals.totalMinutes : "-"}
                />

                <StatCard
                  label="Next Birthday Age"
                  value={result ? `${result.birthday.nextAge} years` : "-"}
                  green
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="age-calculator" />
    </div>
  );
}

function getTodayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateInput(value) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function calculateExactAge(dob, targetDate) {
  let years = targetDate.getFullYear() - dob.getFullYear();
  let months = targetDate.getMonth() - dob.getMonth();
  let days = targetDate.getDate() - dob.getDate();

  if (days < 0) {
    const previousMonthLastDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      0
    ).getDate();

    days += previousMonthLastDay;
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return {
    years,
    months,
    days,
  };
}

function calculateTotals(dob, targetDate) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = targetDate.getTime() - dob.getTime();
  const totalDays = Math.floor(diffMs / msPerDay);
  const totalWeeks = Math.floor(totalDays / 7);
  const exactAge = calculateExactAge(dob, targetDate);
  const totalMonths = exactAge.years * 12 + exactAge.months;

  return {
    totalDays,
    totalWeeks,
    totalMonths,
    totalHours: totalDays * 24,
    totalMinutes: totalDays * 24 * 60,
  };
}

function calculateNextBirthday(dob, targetDate) {
  const birthMonth = dob.getMonth();
  const birthDay = dob.getDate();

  let nextBirthday = getBirthdayDate(
    targetDate.getFullYear(),
    birthMonth,
    birthDay
  );

  if (nextBirthday < startOfDay(targetDate)) {
    nextBirthday = getBirthdayDate(
      targetDate.getFullYear() + 1,
      birthMonth,
      birthDay
    );
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysToBirthday = Math.round(
    (nextBirthday.getTime() - startOfDay(targetDate).getTime()) / msPerDay
  );

  return {
    date: nextBirthday,
    daysToBirthday,
    nextAge: nextBirthday.getFullYear() - dob.getFullYear(),
  };
}

function getBirthdayDate(year, birthMonth, birthDay) {
  if (birthMonth === 1 && birthDay === 29 && !isLeapYear(year)) {
    return new Date(year, 1, 28);
  }

  return new Date(year, birthMonth, birthDay);
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDayName(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(date);
}

function formatDateLong(date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function createResultText(result) {
  return `Age Calculator Result

Date of Birth: ${result.birthDateText}
Calculated On: ${result.calculationDateText}
Born On: ${result.bornDay}

Exact Age:
${result.age.years} years, ${result.age.months} months, ${result.age.days} days

Detailed Statistics:
Total Months: ${result.totals.totalMonths}
Total Weeks: ${result.totals.totalWeeks}
Total Days: ${result.totals.totalDays}
Total Hours: ${result.totals.totalHours}
Total Minutes: ${result.totals.totalMinutes}

Next Birthday:
${
  result.birthday.daysToBirthday === 0
    ? "Today"
    : `${result.birthday.daysToBirthday} days left`
}
Next Birthday Age: ${result.birthday.nextAge} years`;
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-xl p-4 text-center">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="text-base font-bold text-[var(--primary)] break-words">
        {value}
      </p>
    </div>
  );
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