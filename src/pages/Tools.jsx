import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import * as Icons from "lucide-react";
import tools from "../data/tools.json";
import CategorySelector from "../components/CategorySelector";

const SITE_URL = "https://nextonlinetools.com";
const TOOLS_URL = `${SITE_URL}/tools`;
const CONTACT_URL = `${SITE_URL}/contact`;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

function ToolIcon({ icon }) {
  const IconComponent = Icons[icon] || Icons.Wrench;

  return (
    <div className="tools-icon">
      <IconComponent size={26} strokeWidth={2.1} />
    </div>
  );
}

function normalizeText(value) {
  return String(value || "").trim();
}

export default function Tools() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const selectedCategory = normalizeText(queryParams.get("category"));
  const initialSearchTerm = normalizeText(queryParams.get("search"));

  const [searchTerm] = useState(initialSearchTerm);

  const categories = useMemo(() => {
    return [...new Set(tools.map((tool) => tool.category).filter(Boolean))];
  }, []);

  const filteredTools = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return tools.filter((tool) => {
      const matchCategory = selectedCategory
        ? tool.category === selectedCategory
        : true;

      const searchableText = `${tool.name || ""} ${tool.description || ""} ${
        tool.category || ""
      }`.toLowerCase();

      const matchSearch = search ? searchableText.includes(search) : true;

      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchTerm]);

  const canonicalUrl = useMemo(() => {
    if (!selectedCategory) return TOOLS_URL;

    const params = new URLSearchParams();
    params.set("category", selectedCategory);

    return `${TOOLS_URL}?${params.toString()}`;
  }, [selectedCategory]);

  const isSearchResultPage = Boolean(initialSearchTerm);

  const robotsContent = isSearchResultPage
    ? "noindex, follow, max-image-preview:large"
    : "index, follow, max-image-preview:large";

  const seoTitle = selectedCategory
    ? `${selectedCategory} Tools Online Free | Next Online Tools`
    : "Free Online Tools | Image, Text, PDF, SEO, Converter & Utility Tools";

  const seoDescription = selectedCategory
    ? `Explore free ${selectedCategory.toLowerCase()} tools online at Next Online Tools. Use fast, simple, browser-based tools for daily digital tasks without complicated steps.`
    : "Explore free online tools for images, text, PDF, SEO, colors, converters, calculators, and daily productivity tasks. Fast browser-based tools from Next Online Tools.";

  const pageHeading = selectedCategory
    ? `${selectedCategory} Tools Online`
    : "All Free Online Tools";

  const pageIntro = selectedCategory
    ? `Browse useful ${selectedCategory.toLowerCase()} tools designed to help you complete everyday digital tasks faster. Choose a tool, open it in your browser, and finish your work with a clean and simple interface.`
    : "Browse all free online tools from Next Online Tools in one place. Find image tools, text tools, PDF tools, SEO tools, color tools, converters, calculators, and useful browser-based utilities.";

  const itemList = useMemo(() => {
    return filteredTools.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.name,
      url: `${SITE_URL}/tool/${tool.id}`,
      description: tool.description || "Simple, fast, and free online tool.",
    }));
  }, [filteredTools]);

  const structuredData = useMemo(() => {
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
        },
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "Next Online Tools",
          url: SITE_URL,
          logo: DEFAULT_OG_IMAGE,
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            areaServed: "Worldwide",
            availableLanguage: ["English"],
            url: CONTACT_URL,
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
          about: selectedCategory
            ? `${selectedCategory} online tools`
            : "Free online tools collection",
          inLanguage: "en",
          mainEntity: {
            "@type": "ItemList",
            name: selectedCategory
              ? `${selectedCategory} Tools`
              : "All Free Online Tools",
            numberOfItems: filteredTools.length,
            itemListOrder: "https://schema.org/ItemListOrderAscending",
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
        {
          "@type": "FAQPage",
          "@id": `${canonicalUrl}#faq`,
          mainEntity: [
            {
              "@type": "Question",
              name: "What tools are available on Next Online Tools?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Next Online Tools provides free browser-based tools for images, text, PDF tasks, SEO, colors, conversions, calculators, productivity, and other daily digital work.",
              },
            },
            {
              "@type": "Question",
              name: "Are these online tools free to use?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. The tools on Next Online Tools are designed to be simple and free to use directly from the browser.",
              },
            },
            {
              "@type": "Question",
              name: "Do I need to install software to use these tools?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "No. The tools are browser-based, so users can open a tool page and complete their task online without installing extra software.",
              },
            },
          ],
        },
      ],
    };
  }, [
    canonicalUrl,
    filteredTools.length,
    itemList,
    selectedCategory,
    seoDescription,
    seoTitle,
  ]);

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>

        <meta name="description" content={seoDescription} />
        <meta name="robots" content={robotsContent} />
        <meta name="googlebot" content={robotsContent} />
        <meta name="bingbot" content={robotsContent} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Next Online Tools" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:image:alt" content={pageHeading} />
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

          <h1>{pageHeading}</h1>

          <p>{pageIntro}</p>

          <div className="mt-5">
            <div className="tools-hero-badge mx-auto mb-4">
              <Icons.Grid3X3 size={16} />
              <span>Browse by Category</span>
            </div>

            <CategorySelector categories={categories} />
          </div>
        </section>

        {/* TOOLS */}
        <section className="tools-list-section">
          <div className="tools-section-head">
            <div>
              <span>Tools Collection</span>
              <h2>
                {selectedCategory
                  ? `${selectedCategory} Tools`
                  : "Available Tools"}
              </h2>
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
                  aria-label={`Open ${tool.name}`}
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

        {/* WHY USE */}
        <section className="tools-list-section">
          <div className="tools-section-head">
            <div>
              <span>Why Use Next Online Tools</span>
              <h2>Built for simple, fast, browser-based tasks</h2>
            </div>

            <p>Useful tools without unnecessary complexity.</p>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="tool-card">
              <div className="tool-card-top">
                <div className="tools-icon">
                  <Icons.Zap size={26} strokeWidth={2.1} />
                </div>
              </div>

              <h3>Fast Workflow</h3>

              <p>
                Open a tool, complete your task, and move forward without
                dealing with complicated menus or extra steps.
              </p>

              <div className="tool-card-bottom">
                <span>Speed</span>
                <div>
                  <Icons.Zap size={17} />
                </div>
              </div>
            </div>

            <div className="tool-card">
              <div className="tool-card-top">
                <div className="tools-icon">
                  <Icons.MousePointerClick size={26} strokeWidth={2.1} />
                </div>
              </div>

              <h3>Easy to Use</h3>

              <p>
                Each tool page is designed with clear inputs, simple actions,
                and helpful results for everyday users.
              </p>

              <div className="tool-card-bottom">
                <span>Simple</span>
                <div>
                  <Icons.MousePointerClick size={17} />
                </div>
              </div>
            </div>

            <div className="tool-card">
              <div className="tool-card-top">
                <div className="tools-icon">
                  <Icons.Layers size={26} strokeWidth={2.1} />
                </div>
              </div>

              <h3>Multiple Categories</h3>

              <p>
                Find image tools, text tools, PDF tools, SEO tools, color tools,
                converters, calculators, and productivity utilities.
              </p>

              <div className="tool-card-bottom">
                <span>Categories</span>
                <div>
                  <Icons.Layers size={17} />
                </div>
              </div>
            </div>

            <div className="tool-card">
              <div className="tool-card-top">
                <div className="tools-icon">
                  <Icons.Globe2 size={26} strokeWidth={2.1} />
                </div>
              </div>

              <h3>Browser-Based</h3>

              <p>
                Use the tools online from your browser, whether you are working
                on a computer, tablet, or phone.
              </p>

              <div className="tool-card-bottom">
                <span>Online</span>
                <div>
                  <Icons.Globe2 size={17} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="tools-list-section">
          <div className="tools-section-head">
            <div>
              <span>Quick Answers</span>
              <h2>Free Online Tools FAQ</h2>
            </div>

            <p>Helpful answers for new visitors.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-2">
                What tools are available?
              </h3>

              <p className="text-sm text-[var(--text-secondary)] leading-6">
                Next Online Tools includes free tools for images, text, PDF
                tasks, SEO, colors, conversions, calculators, productivity, and
                other daily digital work.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-2">Are these tools free?</h3>

              <p className="text-sm text-[var(--text-secondary)] leading-6">
                Yes. The tools are designed to be simple and free to use
                directly from your browser.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-2">
                Do I need to install anything?
              </h3>

              <p className="text-sm text-[var(--text-secondary)] leading-6">
                No. You can open a tool page and complete the task online
                without installing extra software.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}