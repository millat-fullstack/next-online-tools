import { SearchX } from "lucide-react";

export default function EmptyState({
  icon: Icon = SearchX,
  title = "No results found",
  message = "Try changing your search or selecting another option.",
  action = null,
  className = "",
}) {
  return (
    <div
      className={`w-full rounded-3xl border border-[var(--border)] bg-white p-8 text-center shadow-sm ${className}`}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4edff] text-[var(--primary)]">
        <Icon size={28} strokeWidth={2.2} />
      </div>

      <h3 className="mb-2 text-xl font-bold text-[var(--text-primary)]">
        {title}
      </h3>

      <p className="mx-auto max-w-md text-sm leading-6 text-[var(--text-secondary)]">
        {message}
      </p>

      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}