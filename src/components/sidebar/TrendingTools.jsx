import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import tools from "../../data/tools.json";
import { getTrendingTools } from "../../lib/tracking";

export default function TrendingTools() {
  const trendingTools = getTrendingTools(tools, 5);

  return (
    <div className="flex flex-col gap-2">
      {trendingTools.map((tool) => {
        const Icon = Icons[tool.icon] || Icons.Sparkles;

        return (
          <Link
            key={tool.id}
            to={`/tool/${tool.id}`}
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
          </Link>
        );
      })}
    </div>
  );
}