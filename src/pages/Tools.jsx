import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import * as Icons from "lucide-react";
import tools from "../data/tools.json";
import CategorySelector from "../components/CategorySelector";

const SITE_URL = "https://nextonlinetools.com";
const TOOLS_URL = `${SITE_URL}/tools`;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

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

  const canonicalUrl = useMemo(() => {
    if (!selectedCategory) return TOOLS_URL;

    const params = new URLSearchParams();
    params.set("category", selectedCategory);

    return `${TOOLS_URL}?${params.toString()}`;
  }, [selectedCategory]);

  const seoTitle = selectedCategory
    ? `${selectedCategory} Tools Online Free | Next Online Tools`
    : "All Free Online Tools | Image, Text, PDF, SEO & Converter Tools";

  const seoDescription = selectedCategory
    ? `Use free ${selectedCategory.toLowerCase()} tools online with Next Online Tools. Fast, simple, browser-based tools for editing, converting, optimizing, and improving daily digital work.`
    : "Explore all free online tools in one place. Use fast browser-based image tools, text tools, PDF tools, SEO tools, color tools, converters, calculators, and productivity tools on Next Online Tools.";

  const seoKeywords = useMemo(() => {
    const baseKeywords = [
      "free online tools",
      "online tools",
      "browser based tools",
      "no signup tools",
      "image tools",
      "text tools",
      "pdf tools",
      "seo tools",
      "converter tools",
      "productivity tools",
      "free web tools",
      "next online tools",
    ];

    const categoryKeywords = selectedCategory
      ? [
          `${selectedCategory} tools`,
          `free ${selectedCategory} tools`,
          `${selectedCategory} tools online`,
          `online ${selectedCategory} converter`,
          `free online ${selectedCategory.toLowerCase()} tools`,
        ]
      : categories.flatMap((category) => [
          `${category} tools`,
          `free ${category} tools`,
        ]);

    const toolKeywords = filteredTools
      .slice(0, 20)
      .map((tool) => tool.name)
      .filter(Boolean);

    return [...new Set([...baseKeywords, ...categoryKeywords, ...toolKeywords])]
      .join(", ");
  }, [categories, filteredTools, selectedCategory]);

  const structuredData = useMemo(() => {
    const itemList = filteredTools.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.name,
      url: `${SITE_URL}/tool/${tool.id}`,
      description: tool.description || "Simple, fast, and free online tool.",
    }));

    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: "Next Online Tools",
          url: SITE_URL,
          description:
            "Free browser-based online tools for images, text, PDF, SEO, conversions, colors, productivity, and daily digital tasks.",
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/tools?search={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
        {
          "@type": "CollectionPage",
          "@id": `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: seoTitle,
          description: seoDescription,
          isPartOf: {
            "@id": `${SITE_URL}/#website`,
          },
          inLanguage: "en",
          about: selectedCategory
            ? `${selectedCategory} online tools`
            : "Free online tools collection",
          mainEntity: {
            "@type": "ItemList",
            name: selectedCategory
              ? `${selectedCategory} Tools`
              : "All Free Online Tools",
            numberOfItems: filteredTools.length,
            itemListElement: itemList,
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
                    name: `${selectedCategory} Tools`,
                    item: canonicalUrl,
                  },
                ]
              : []),
          ],
        },
      ],
    };
  }, [
    canonicalUrl,
    filteredTools,
    selectedCategory,
    seoDescription,
    seoTitle,
  ]);

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>

        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="googlebot" content="index, follow, max-image-preview:large" />
        <meta name="bingbot" content="index, follow, max-image-preview:large" />

        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Next Online Tools" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:image:alt" content="Next Online Tools" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />

        <meta name="author" content="Next Online Tools" />
        <meta name="publisher" content="Next Online Tools" />
        <meta name="application-name" content="Next Online Tools" />
        <meta name="theme-color" content="#9B6CE3" />

        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

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
          <u>  Browse by Category </u>
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
    </>
  );
}