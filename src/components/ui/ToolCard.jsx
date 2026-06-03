import * as Icons from "lucide-react";
import SmartLink from "../ui/SmartLink";

export default function ToolCard({ tool, compact = false }) {
  const IconComponent = Icons[tool.icon] || Icons.Wrench;

  return (
    <SmartLink
      to={`/tool/${tool.id}`}
      className="block h-full"
      aria-label={`Open ${tool.name}`}
    >
      <div className="card card-hover p-5 h-full">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <IconComponent
            size={compact ? 24 : 28}
            className="text-[var(--primary)]"
            strokeWidth={2}
          />
        </div>

        <h3 className="font-semibold text-[var(--text-primary)] mb-2">
          {tool.name}
        </h3>

        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {tool.description || "Free and easy online tool for daily use."}
        </p>

        {!compact && <span className="badge mt-5 inline-block">{tool.category}</span>}
      </div>
    </SmartLink>
  );
}