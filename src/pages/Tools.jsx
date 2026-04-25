import { Link, useLocation } from "react-router-dom";
import tools from "../data/tools.json";

export default function Tools() {
  const location = useLocation();

  // Get category from URL query
  const queryParams = new URLSearchParams(location.search);
  const selectedCategory = queryParams.get("category");

  // Unique categories
  const categories = [...new Set(tools.map((tool) => tool.category))];

  // Filter tools by category if selected
  const filteredTools = selectedCategory
    ? tools.filter((tool) => tool.category === selectedCategory)
    : tools;

  return (
    <div className="flex flex-col gap-8">

      {/* PAGE HEADER */}
      <section className="bg-white border rounded-2xl shadow-sm p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
          All Free Online Tools
        </h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Explore all our free online tools for text editing, image processing,
          design work, productivity, SEO, and daily tasks. No paid API, no login,
          and fully user-friendly.
        </p>
      </section>

      {/* CATEGORY FILTER */}
      <section className="bg-white border rounded-2xl shadow-sm p-5">
        <h2 className="text-lg font-semibold mb-4">
          Browse by Category
        </h2>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/tools"
            className={`px-4 py-2 rounded-xl text-sm font-medium border ${
              !selectedCategory
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            All Tools
          </Link>

          {categories.map((category) => (
            <Link
              key={category}
              to={`/tools?category=${encodeURIComponent(category)}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                selectedCategory === category
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      {/* TOOL COUNT */}
      <section>
        <p className="text-sm text-[var(--text-secondary)]">
          Showing {filteredTools.length} tool
          {filteredTools.length > 1 ? "s" : ""}
          {selectedCategory ? ` in "${selectedCategory}"` : ""}
        </p>
      </section>

      {/* TOOLS GRID */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTools.map((tool) => (
          <Link key={tool.id} to={`/tool/${tool.id}`}>
            <div className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md h-full">

              {/* ICON */}
              <div className="text-4xl mb-4">
                {tool.icon || "🛠️"}
              </div>

              {/* TITLE */}
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                {tool.name}
              </h2>

              {/* DESCRIPTION */}
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {tool.description || "Free and easy online tool for daily use."}
              </p>

              {/* CATEGORY */}
              <div className="mt-4">
                <span className="inline-block text-xs font-medium text-[var(--primary)] bg-blue-50 px-3 py-1 rounded-full">
                  {tool.category}
                </span>
              </div>

            </div>
          </Link>
        ))}
      </section>

      {/* EMPTY STATE */}
      {filteredTools.length === 0 && (
        <section className="bg-white border rounded-2xl shadow-sm p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">
            No tools found
          </h3>
          <p className="text-[var(--text-secondary)]">
            Please try another category.
          </p>
        </section>
      )}
    </div>
  );
}