import { Link, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import tools from "../../data/tools.json";

export default function LatestTools() {
  const latestTools = tools.slice(0, 5);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2">
      {latestTools.map((tool) => {
        const Icon = Icons[tool.icon] || Icons.Wrench;

        return (
          <a
            key={tool.id}
            href={`/tool/${tool.id}/`}
            onPointerDown={(e) => { e.preventDefault(); navigate(`/tool/${tool.id}/`); }}
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f7f1ff]"
          >
            <div className="w-9 h-9 rounded-xl bg-[#f4edff] flex items-center justify-center shrink-0">
              <Icon size={17} className="text-[var(--primary)]" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {tool.name}
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {tool.category}
              </p>
            </div>
          </a>
        );
      })}
    </div>
  );
}