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
    <div
      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5f0ff] text-[var(--primary)]"
      aria-hidden="true"
    >
      <IconComponent size={20} strokeWidth={2.1} />
    </div>
  );
}

function ToolCard({ tool }) {
  return (
    <SmartLink
      to={`/tool/${tool.id}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md"
      aria-label={`Open ${tool.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <ToolIcon icon={tool.icon} />

        {tool.trending && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
            <Icons.Flame size={12} />
            Popular
          </span>
        )}
      </div>

      <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
        {tool.name}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {tool.description || "Simple, fast, and free online tool."}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <span className="text-[var(--text-secondary)]">
          {tool.category || "Online Tool"}
        </span>

        <span className="text-[var(--primary)] transition-transform duration-200 group-hover:translate-x-0.5">
          <Icons.ArrowRight size={16} strokeWidth={2.2} />
        </span>
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

      <main className="space-y-6">
        <nav
          className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]"
          aria-label="Breadcrumb"
        >
          <SmartLink to="/" className="transition-colors hover:text-[var(--primary)]">
            Home
          </SmartLink>
          <Icons.ChevronRight size={14} aria-hidden="true" />
          <SmartLink to="/tools" className="transition-colors hover:text-[var(--primary)]">
            Tools
          </SmartLink>

          {selectedCategory && (
            <>
              <Icons.ChevronRight size={14} aria-hidden="true" />
              <span className="text-[var(--text-primary)]">{selectedCategory}</span>
            </>
          )}
        </nav>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full border border-[#efe7ff] bg-[#f7f3ff] px-3 py-1 text-sm font-medium text-[var(--primary)]">
                Free browser-based tools
              </span>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                {selectedCategory ? selectedCategory : "All Online Tools"}
              </h1>

              <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
                {selectedCategory
                  ? `Browse clean and simple ${selectedCategory.toLowerCase()} for everyday digital work.`
                  : "A clean collection of practical tools for PDF, images, text, SEO, spreadsheets, converters, colors, and productivity."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <SmartLink
                  to="/blog"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  Read Guides
                </SmartLink>

                <SmartLink
                  to="/contact"
                  className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Request a Tool
                </SmartLink>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[320px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <strong className="block text-xl font-semibold text-[var(--text-primary)]">
                  {totalTools}
                </strong>
                <span className="text-sm text-[var(--text-secondary)]">Total tools</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <strong className="block text-xl font-semibold text-[var(--text-primary)]">
                  {totalCategories}
                </strong>
                <span className="text-sm text-[var(--text-secondary)]">Categories</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <strong className="block text-xl font-semibold text-[var(--text-primary)]">
                  {popularToolsCount}
                </strong>
                <span className="text-sm text-[var(--text-secondary)]">Popular</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Search and filter tools">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <Icons.Search size={18} className="text-[var(--text-secondary)]" aria-hidden="true" />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tools like compress image, merge PDF, link extractor"
                aria-label="Search tools"
                className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />

              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm("")} className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)]">
                  Clear
                </button>
              )}
            </label>

            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <span className="text-sm text-[var(--text-secondary)]">Sort</span>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort tools"
                className="bg-transparent text-sm outline-none"
              >
                <option value="popular">Popular first</option>
                <option value="az">A to Z</option>
                <option value="category">Category</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="Tool categories">
            <SmartLink
              to="/tools"
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                !selectedCategory
                  ? "bg-[var(--primary)] text-white"
                  : "border border-slate-200 bg-white text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              }`}
              aria-current={!selectedCategory ? "page" : undefined}
            >
              All
              <span className="ml-2 opacity-80">{totalTools}</span>
            </SmartLink>

            {categories.map((category) => (
              <SmartLink
                key={category}
                to={getCategoryPath(category)}
                className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-[var(--primary)] text-white"
                    : "border border-slate-200 bg-white text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                }`}
                aria-current={selectedCategory === category ? "page" : undefined}
              >
                {category.replace(" Tools", "")}
                <span className="ml-2 opacity-80">{categoryCounts[category] || 0}</span>
              </SmartLink>
            ))}
          </div>

          {(selectedCategory || searchTerm) && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[var(--text-secondary)]">
              <p>
                Showing <strong className="text-[var(--text-primary)]">{filteredTools.length}</strong>{" "}
                {filteredTools.length === 1 ? "tool" : "tools"}
                {selectedCategory && (
                  <>
                    {" "}
                    in <strong className="text-[var(--text-primary)]">{selectedCategory}</strong>
                  </>
                )}
                {searchTerm && (
                  <>
                    {" "}
                    for <strong className="text-[var(--text-primary)]">“{searchTerm}”</strong>
                  </>
                )}
              </p>

              {searchTerm && (
                <button type="button" onClick={clearFilters} className="font-medium text-[var(--primary)] hover:opacity-80">
                  Reset search
                </button>
              )}
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-label="Tools collection">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                Tools collection
              </span>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                {selectedCategory ? selectedCategory : "Choose a tool to start"}
              </h2>
            </div>

            <p className="text-sm text-[var(--text-secondary)]">
              {filteredTools.length}{" "}
              {filteredTools.length === 1 ? "result" : "results"}
            </p>
          </div>

          {filteredTools.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No tools found"
                message="Try searching with another keyword or choose a different category."
                action={
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white"
                  >
                    Reset search
                  </button>
                }
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f5f0ff] text-[var(--primary)]">
              <Icons.Zap size={20} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">Fast and simple</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Open a tool, complete your task, and get your output quickly.
            </p>
          </article>

          <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f5f0ff] text-[var(--primary)]">
              <Icons.ShieldCheck size={20} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">Browser-based workflow</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Use practical tools without installing heavy software.
            </p>
          </article>

          <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f5f0ff] text-[var(--primary)]">
              <Icons.Layers size={20} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">Organized categories</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Find tools faster with simple categories and search.
            </p>
          </article>
        </section>
      </main>
    </>
  );
}