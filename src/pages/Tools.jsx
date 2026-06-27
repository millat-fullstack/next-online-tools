import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import * as Icons from "lucide-react";

import tools from "../data/tools.json";

const SITE_URL = "https://nextonlinetools.com";
const TOOLS_URL = `${SITE_URL}/tools`;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const CATEGORY_PRIORITY = [
  "Image Tools",
  "PDF Tools",
  "Text Tools",
  "Spreadsheet Tools",
  "SEO Tools",
  "Converter Tools",
  "Color Tools",
  "Calculator Tools",
  "Social Media Tools",
];

function normalizeText(value) {
  return String(value || "").trim();
}

function getCategoryPath(category) {
  if (!category) return "/tools";
  return `/tools?category=${encodeURIComponent(category)}`;
}

function ToolIcon({ icon }) {
  const IconComponent = Icons[icon] || Icons.Wrench;

  return (
    <div className="tool-clean-icon" aria-hidden="true">
      <IconComponent size={22} strokeWidth={2} />
    </div>
  );
}

function ToolCard({ tool }) {
  return (
    <Link
      to={`/tool/${tool.id}/`}
      className="tool-clean-card"
      aria-label={`Open ${tool.name}`}
    >
      <div className="tool-clean-card-head">
        <ToolIcon icon={tool.icon} />
        {tool.trending && <span className="tool-clean-badge">Popular</span>}
      </div>

      <h2>{tool.name}</h2>

      <p>{tool.description || "Simple, fast, and free online tool."}</p>

      <div className="tool-clean-card-foot">
        <span>{tool.category || "Online Tool"}</span>
        <Icons.ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
      </div>
    </Link>
  );
}

export default function Tools() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const selectedCategory = normalizeText(queryParams.get("category"));
  const initialSearchTerm = normalizeText(queryParams.get("search"));
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(tools.map((tool) => normalizeText(tool.category)).filter(Boolean)),
    ];

    return uniqueCategories.sort((a, b) => {
      const aIndex = CATEGORY_PRIORITY.indexOf(a);
      const bIndex = CATEGORY_PRIORITY.indexOf(b);

      if (aIndex !== -1 || bIndex !== -1) {
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      }

      return a.localeCompare(b);
    });
  }, []);

  const categoryCounts = useMemo(() => {
    return tools.reduce((counts, tool) => {
      const category = normalizeText(tool.category);
      if (!category) return counts;
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});
  }, []);

  const filteredTools = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return tools.filter((tool) => {
      const category = normalizeText(tool.category);
      const matchCategory = selectedCategory ? category === selectedCategory : true;

      const searchableText = [tool.name, tool.description, tool.category, tool.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch = search ? searchableText.includes(search) : true;

      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchTerm]);

  const canonicalUrl = selectedCategory
    ? `${TOOLS_URL}?category=${encodeURIComponent(selectedCategory)}`
    : TOOLS_URL;

  const seoTitle = selectedCategory
    ? `${selectedCategory} Online Free | Next Online Tools`
    : "Free Online Tools | Next Online Tools";

  const seoDescription = selectedCategory
    ? `Browse free ${selectedCategory.toLowerCase()} online. Simple browser-based tools from Next Online Tools.`
    : "Browse free online tools for PDF, images, text, SEO, converters, colors, calculators, spreadsheets, and daily digital work.";

  const structuredData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: seoTitle,
          description: seoDescription,
          isPartOf: {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: "Next Online Tools",
            url: SITE_URL,
          },
          inLanguage: "en",
          mainEntity: {
            "@type": "ItemList",
            name: selectedCategory ? `${selectedCategory} Tools` : "All Free Online Tools",
            numberOfItems: filteredTools.length,
            itemListElement: filteredTools.map((tool, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: tool.name,
              url: `${SITE_URL}/tool/${tool.id}/`,
            })),
          },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${canonicalUrl}#breadcrumb`,
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: SITE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Tools",
              item: TOOLS_URL,
            },
            ...(selectedCategory
              ? [
                  {
                    "@type": "ListItem",
                    position: 3,
                    name: selectedCategory,
                    item: canonicalUrl,
                  },
                ]
              : []),
          ],
        },
      ],
    };
  }, [canonicalUrl, filteredTools, selectedCategory, seoDescription, seoTitle]);

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow, max-image-preview:large" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Next Online Tools" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />

        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <main className="tools-clean-page">
        <nav className="tools-clean-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <Icons.ChevronRight size={14} aria-hidden="true" />
          <Link to="/tools">Tools</Link>
          {selectedCategory && (
            <>
              <Icons.ChevronRight size={14} aria-hidden="true" />
              <span>{selectedCategory}</span>
            </>
          )}
        </nav>

        <header className="tools-clean-header">
          <div>
            <span className="tools-clean-label">Next Online Tools</span>
            <h1>{selectedCategory ? selectedCategory : "All Online Tools"}</h1>
            <p>
              {selectedCategory
                ? `Browse ${selectedCategory.toLowerCase()} with a clean and simple interface.`
                : "Find simple browser-based tools for PDF, images, text, SEO, spreadsheets, converters, and daily work."}
            </p>
          </div>

          <div className="tools-clean-total">
            <strong>{filteredTools.length}</strong>
            <span>{filteredTools.length === 1 ? "tool" : "tools"}</span>
          </div>
        </header>

        <section className="tools-clean-filter" aria-label="Tool filters">
          <label className="tools-clean-search">
            <Icons.Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search tools, e.g. compress image, merge PDF, link extractor"
              aria-label="Search tools"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm("")}>Clear</button>
            )}
          </label>

          <div className="tools-clean-categories" aria-label="Tool categories">
            <Link
              to="/tools"
              className={!selectedCategory ? "active" : ""}
              aria-current={!selectedCategory ? "page" : undefined}
            >
              All <span>{tools.length}</span>
            </Link>

            {categories.map((category) => (
              <Link
                key={category}
                to={getCategoryPath(category)}
                className={selectedCategory === category ? "active" : ""}
                aria-current={selectedCategory === category ? "page" : undefined}
              >
                {category.replace(" Tools", "")}
                <span>{categoryCounts[category] || 0}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="tools-clean-results" aria-label="Tools list">
          <div className="tools-clean-results-head">
            <h2>{selectedCategory ? `${selectedCategory}` : "Tools Collection"}</h2>
            <p>
              {searchTerm
                ? `Showing results for “${searchTerm}”`
                : "Choose a tool and start working."}
            </p>
          </div>

          {filteredTools.length === 0 ? (
            <div className="tools-clean-empty">
              <Icons.SearchX size={34} aria-hidden="true" />
              <h2>No tools found</h2>
              <p>Try a different keyword or choose another category.</p>
              <button type="button" onClick={() => setSearchTerm("")}>Reset search</button>
            </div>
          ) : (
            <div className="tools-clean-grid">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
