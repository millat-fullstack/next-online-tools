import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import * as Icons from "lucide-react";

import tools from "../data/tools.json";
import SmartLink from "../components/ui/SmartLink";
import EmptyState from "../components/ui/EmptyState";

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

function getToolSearchText(tool) {
  return [
    tool.name,
    tool.description,
    tool.category,
    tool.id,
    tool.slug,
    tool.keywords,
    tool.tags,
  ]
    .filter(Boolean)
    .flat()
    .join(" ")
    .toLowerCase();
}

function ToolIcon({ icon }) {
  const IconComponent = Icons[icon] || Icons.Wrench;

  return (
    <div className="tools-pro-icon" aria-hidden="true">
      <IconComponent size={22} strokeWidth={2.1} />
    </div>
  );
}

function ToolCard({ tool }) {
  return (
    <SmartLink
      to={`/tool/${tool.id}`}
      className="tools-pro-card"
      aria-label={`Open ${tool.name}`}
    >
      <div className="tools-pro-card-top">
        <ToolIcon icon={tool.icon} />

        {tool.trending && (
          <span className="tools-pro-badge">
            <Icons.Flame size={13} />
            Popular
          </span>
        )}
      </div>

      <h3>{tool.name}</h3>

      <p>{tool.description || "Simple, fast, and free online tool."}</p>

      <div className="tools-pro-card-bottom">
        <span>{tool.category || "Online Tool"}</span>

        <div aria-hidden="true">
          <Icons.ArrowRight size={16} strokeWidth={2.2} />
        </div>
      </div>
    </SmartLink>
  );
}

export default function Tools() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const selectedCategory = normalizeText(queryParams.get("category"));
  const initialSearchTerm = normalizeText(queryParams.get("search"));

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [sortBy, setSortBy] = useState("popular");

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        tools.map((tool) => normalizeText(tool.category)).filter(Boolean)
      ),
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

  const totalCategories = categories.length;
  const totalTools = tools.length;
  const popularToolsCount = tools.filter((tool) => tool.trending).length;

  const filteredTools = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const results = tools.filter((tool) => {
      const category = normalizeText(tool.category);

      const matchesCategory = selectedCategory
        ? category === selectedCategory
        : true;

      const matchesSearch = search
        ? getToolSearchText(tool).includes(search)
        : true;

      return matchesCategory && matchesSearch;
    });

    return [...results].sort((a, b) => {
      if (sortBy === "az") {
        return String(a.name || "").localeCompare(String(b.name || ""));
      }

      if (sortBy === "category") {
        return String(a.category || "").localeCompare(String(b.category || ""));
      }

      if (sortBy === "popular") {
        return Number(Boolean(b.trending)) - Number(Boolean(a.trending));
      }

      return 0;
    });
  }, [selectedCategory, searchTerm, sortBy]);

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
            name: selectedCategory
              ? `${selectedCategory} Tools`
              : "All Free Online Tools",
            numberOfItems: filteredTools.length,
            itemListElement: filteredTools.map((tool, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: tool.name,
              url: `${SITE_URL}/tool/${tool.id}`,
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

  function clearFilters() {
    setSearchTerm("");
  }

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

      <main className="tools-pro-page">
        <nav className="tools-pro-breadcrumb" aria-label="Breadcrumb">
          <SmartLink to="/">Home</SmartLink>
          <Icons.ChevronRight size={14} aria-hidden="true" />
          <SmartLink to="/tools">Tools</SmartLink>

          {selectedCategory && (
            <>
              <Icons.ChevronRight size={14} aria-hidden="true" />
              <span>{selectedCategory}</span>
            </>
          )}
        </nav>

        <section className="tools-pro-hero">
          <div className="tools-pro-hero-content">
            <span className="tools-pro-kicker">Free browser-based tools</span>

            <h1>
              {selectedCategory ? selectedCategory : "All Online Tools"}
            </h1>

            <p>
              {selectedCategory
                ? `Browse clean and simple ${selectedCategory.toLowerCase()} for everyday digital work.`
                : "A clean collection of practical tools for PDF, images, text, SEO, spreadsheets, converters, colors, and productivity."}
            </p>

            <div className="tools-pro-actions">
              <SmartLink to="/blog" className="tools-pro-secondary-btn">
                Read Guides
              </SmartLink>

              <SmartLink to="/contact" className="tools-pro-primary-btn">
                Request a Tool
              </SmartLink>
            </div>
          </div>

          <div className="tools-pro-stats" aria-label="Tools overview">
            <div>
              <strong>{totalTools}</strong>
              <span>Total tools</span>
            </div>

            <div>
              <strong>{totalCategories}</strong>
              <span>Categories</span>
            </div>

            <div>
              <strong>{popularToolsCount}</strong>
              <span>Popular tools</span>
            </div>
          </div>
        </section>

        <section className="tools-pro-panel" aria-label="Search and filter tools">
          <div className="tools-pro-search-row">
            <label className="tools-pro-search">
              <Icons.Search size={18} aria-hidden="true" />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tools like compress image, merge PDF, link extractor"
                aria-label="Search tools"
              />

              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm("")}>
                  Clear
                </button>
              )}
            </label>

            <label className="tools-pro-sort">
              <span>Sort</span>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort tools"
              >
                <option value="popular">Popular first</option>
                <option value="az">A to Z</option>
                <option value="category">Category</option>
              </select>
            </label>
          </div>

          <div className="tools-pro-categories" aria-label="Tool categories">
            <SmartLink
              to="/tools"
              className={!selectedCategory ? "active" : ""}
              aria-current={!selectedCategory ? "page" : undefined}
            >
              All
              <span>{totalTools}</span>
            </SmartLink>

            {categories.map((category) => (
              <SmartLink
                key={category}
                to={getCategoryPath(category)}
                className={selectedCategory === category ? "active" : ""}
                aria-current={
                  selectedCategory === category ? "page" : undefined
                }
              >
                {category.replace(" Tools", "")}
                <span>{categoryCounts[category] || 0}</span>
              </SmartLink>
            ))}
          </div>

          {(selectedCategory || searchTerm) && (
            <div className="tools-pro-active-filter">
              <p>
                Showing{" "}
                <strong>{filteredTools.length}</strong>{" "}
                {filteredTools.length === 1 ? "tool" : "tools"}
                {selectedCategory && (
                  <>
                    {" "}
                    in <strong>{selectedCategory}</strong>
                  </>
                )}
                {searchTerm && (
                  <>
                    {" "}
                    for <strong>“{searchTerm}”</strong>
                  </>
                )}
              </p>

              {searchTerm && (
                <button type="button" onClick={clearFilters}>
                  Reset search
                </button>
              )}
            </div>
          )}
        </section>

        <section className="tools-pro-results" aria-label="Tools collection">
          <div className="tools-pro-section-head">
            <div>
              <span>Tools collection</span>
              <h2>
                {selectedCategory ? selectedCategory : "Choose a tool to start"}
              </h2>
            </div>

            <p>
              {filteredTools.length}{" "}
              {filteredTools.length === 1 ? "result" : "results"}
            </p>
          </div>

          {filteredTools.length === 0 ? (
            <EmptyState
              title="No tools found"
              message="Try searching with another keyword or choose a different category."
              action={
                <button
                  type="button"
                  onClick={clearFilters}
                  className="tools-pro-primary-btn"
                >
                  Reset search
                </button>
              }
            />
          ) : (
            <div className="tools-pro-grid">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </section>

        <section className="tools-pro-support">
          <article>
            <Icons.Zap size={22} />
            <div>
              <h3>Fast and simple</h3>
              <p>Open a tool, complete your task, and get your output quickly.</p>
            </div>
          </article>

          <article>
            <Icons.ShieldCheck size={22} />
            <div>
              <h3>Browser-based workflow</h3>
              <p>Use practical tools without installing heavy software.</p>
            </div>
          </article>

          <article>
            <Icons.Layers size={22} />
            <div>
              <h3>Organized categories</h3>
              <p>Find tools faster with clean categories and search.</p>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}