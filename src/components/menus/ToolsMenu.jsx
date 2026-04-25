import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import tools from "../../data/tools.json";

export default function ToolsMenu() {
  const categories = [...new Set(tools.map((tool) => tool.category))];

  return (
    <div className="card p-5">
      <h3 className="text-lg font-semibold mb-4">Tool Categories</h3>

      <div className="flex flex-col gap-2">
        <Link
          to="/tools"
          className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f7f1ff] text-sm font-medium"
        >
          <span>All Tools</span>
          <Icons.ArrowRight size={16} className="text-[var(--primary)]" />
        </Link>

        {categories.map((category) => (
          <Link
            key={category}
            to={`/tools?category=${encodeURIComponent(category)}`}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f7f1ff] text-sm font-medium"
          >
            <span>{category}</span>
            <Icons.ChevronRight size={16} className="text-[var(--text-secondary)]" />
          </Link>
        ))}
      </div>
    </div>
  );
}