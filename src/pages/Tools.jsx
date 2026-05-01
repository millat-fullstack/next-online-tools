import { Link, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
import tools from "../data/tools.json";
import CategorySelector from "../components/CategorySelector";

function ToolIcon({ icon }) {
  const IconComponent = Icons[icon] || Icons.Wrench;

  return (
    <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
      <IconComponent
        size={28}
        className="text-[var(--primary)]"
        strokeWidth={2}
      />
    </div>
  );
}

export default function Tools() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedCategory = queryParams.get("category");

  const categories = [...new Set(tools.map((tool) => tool.category))];
  const filteredTools = selectedCategory
    ? tools.filter((tool) => tool.category === selectedCategory)
    : tools;

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <span className="badge mb-4 inline-block">
          {selectedCategory ? `${selectedCategory}` : "All Tools"}
        </span>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          {selectedCategory
            ? `${selectedCategory} Tools`
            : "All Free Online Tools"}
        </h1>

        <p className="text-[var(--text-secondary)] max-w-3xl leading-7">
          Explore our complete collection of free online tools for text, images, colors, SEO, productivity, conversions, and daily online work.
        </p>
      </section>

      <section className="card p-6 sm:p-8">
        <CategorySelector categories={categories} />
      </section>

      {/* ALL TOOLS */}
      <section>
        {selectedCategory && filteredTools.length === 0 ? (
          <div className="card p-6 text-center text-[var(--text-secondary)]">
            No tools found for "{selectedCategory}".
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {filteredTools.map((tool, index) => (
              <Link key={tool.id || index} to={`/tool/${tool.id}`}>
                <div className="card card-hover p-5 h-full">
                  <ToolIcon icon={tool.icon} />

                  <h3 className="font-semibold mb-2">{tool.name}</h3>

                  <p className="text-sm text-[var(--text-secondary)]">
                    {tool.description || "Simple, fast, and free online tool."}
                  </p>

                  <span className="badge mt-5 inline-block">{tool.category}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}