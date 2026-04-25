import { Link, useLocation } from "react-router-dom";
import tools from "../data/tools.json";
import ToolCard from "../components/ui/ToolCard";

export default function SearchResults() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get("q") || "";

  const filteredTools = tools.filter((tool) => {
    const searchText = `${tool.name} ${tool.category} ${tool.description}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <span className="badge mb-4 inline-block">Search Results</span>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Search Results for “{query}”
        </h1>

        <p className="text-[var(--text-secondary)]">
          Found {filteredTools.length} tool
          {filteredTools.length !== 1 ? "s" : ""}.
        </p>
      </section>

      {filteredTools.length > 0 ? (
        <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </section>
      ) : (
        <section className="card p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">No Tools Found</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Try searching with another keyword like image, color, text, or
            converter.
          </p>

          <Link to="/tools" className="btn-primary">
            Browse All Tools
          </Link>
        </section>
      )}
    </div>
  );
}