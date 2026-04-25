import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import tools from "../../data/tools.json";

export default function SuggestedTools({ currentToolId }) {
  const suggestions = tools
    .filter((tool) => tool.id !== currentToolId)
    .slice(0, 6);

  return (
    <div className="card p-5">
      <h3 className="text-lg font-semibold mb-4">Suggested Tools</h3>

      <div className="flex flex-col gap-2">
        {suggestions.map((tool) => {
          const Icon = Icons[tool.icon] || Icons.Wrench;

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
    </div>
  );
}