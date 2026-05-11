import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
import tools from "../data/tools.json";
import CategorySelector from "../components/CategorySelector";

function ToolIcon({ icon }) {
  const IconComponent = Icons[icon] || Icons.Wrench;

  return (
    <div className="tools-icon">
      <IconComponent size={26} strokeWidth={2.1} />
    </div>
  );
}

export default function Tools() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedCategory = queryParams.get("category");

  const [searchTerm, setSearchTerm] = useState("");

  const categories = useMemo(() => {
    return [...new Set(tools.map((tool) => tool.category).filter(Boolean))];
  }, []);

  const filteredTools = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return tools.filter((tool) => {
      const matchCategory = selectedCategory
        ? tool.category === selectedCategory
        : true;

      const matchSearch = search
        ? `${tool.name || ""} ${tool.description || ""} ${tool.category || ""}`
            .toLowerCase()
            .includes(search)
        : true;

      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchTerm]);

  return (
    <main className="tools-page">
      {/* HERO */}
      <section className="tools-hero">
        <div className="tools-hero-badge">
          <Icons.Sparkles size={16} />
          <span>{selectedCategory || "All Tools"}</span>
        </div>

        <h1>
          {selectedCategory
            ? `${selectedCategory} Tools`
            : "All Free Online Tools"}
        </h1>

        <p>
          Explore fast, simple, and free browser-based tools for text, images,
          colors, SEO, productivity, conversions, and daily online work.
        </p>

        <h2>
        <u>  Choose a Category </u>
        </h2>
        <CategorySelector categories={categories} />

      </section>

      {/* TOOLS */}
      <section className="tools-list-section">
        <div className="tools-section-head">
          <div>
            <span>Tools Collection</span>
            <h2>{selectedCategory || "Available"} Tools</h2>
          </div>

          <p>
            {filteredTools.length} tool
            {filteredTools.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {filteredTools.length === 0 ? (
          <div className="tools-empty">
            <Icons.SearchX size={38} />
            <h3>No tools found</h3>
            <p>Try another keyword or select another category.</p>
          </div>
        ) : (
          <div className="tools-grid">
            {filteredTools.map((tool, index) => (
              <Link
                key={tool.id || index}
                to={`/tool/${tool.id}`}
                className="tool-card"
              >
                <div className="tool-card-top">
                  <ToolIcon icon={tool.icon} />

                  {tool.trending && (
                    <span className="tool-trending">
                      <Icons.Flame size={13} />
                      Trending
                    </span>
                  )}
                </div>

                <h3>{tool.name}</h3>

                <p>
                  {tool.description || "Simple, fast, and free online tool."}
                </p>

                <div className="tool-card-bottom">
                  <span>{tool.category}</span>

                  <div>
                    <Icons.ArrowRight size={17} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}