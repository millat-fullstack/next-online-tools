import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import * as Icons from "lucide-react";

import tools from "../data/tools.json";
import { blogs } from "../data/Blogs";
import SmartLink from "../components/ui/SmartLink";
import "../styles/tools.css";

const SITE_URL = "https://nextonlinetools.com";
const TOOLS_URL = `${SITE_URL}/tools`;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const CATEGORY_PRIORITY = [
  "Image Tools",
  "PDF Tools",
  "Text Tools",
  "Spreadsheet Tools",
  "SEO Tools",
  "Social Media Tools",
  "Converter Tools",
  "Color Tools",
  "Calculator Tools",
  "Web Tools",
  "Video Tools",
  "Productivity Tools",
];

const CATEGORY_META = {
  "Image Tools": {
    icon: "Image",
    intro:
      "Resize, compress, crop, convert, and edit images for websites, blogs, documents, and social media.",
    useCases: [
      "Prepare blog images, product photos, thumbnails, and social media visuals.",
      "Reduce image size before uploading to websites, forms, emails, and apps.",
      "Convert modern image formats like HEIC, WEBP, AVIF, JPG, and PNG.",
    ],
  },
  "PDF Tools": {
    icon: "FileText",
    intro:
      "Merge, compress, split, convert, reorder, and organize PDF files directly from your browser.",
    useCases: [
      "Combine multiple documents into one clean PDF file.",
      "Reduce PDF size before email, upload, or office sharing.",
      "Convert images and PDF pages into the format you need.",
    ],
  },
  "Text Tools": {
    icon: "Pilcrow",
    intro:
      "Clean, count, format, convert, and prepare text for writing, content, forms, and daily work.",
    useCases: [
      "Count words and characters for articles, captions, and assignments.",
      "Convert text case for titles, forms, documents, and website content.",
      "Clean copied text before using it in documents or websites.",
    ],
  },
  "Spreadsheet Tools": {
    icon: "Table2",
    intro:
      "Extract links, clean phone numbers, format lead lists, and prepare spreadsheet data faster.",
    useCases: [
      "Extract hidden links from Google Sheets and lead lists.",
      "Clean phone numbers before CRM, WhatsApp, or outreach work.",
      "Prepare spreadsheet data without manual copy-paste work.",
    ],
  },
  "SEO Tools": {
    icon: "Search",
    intro:
      "Create clean slugs, format content, and prepare SEO-friendly website assets in less time.",
    useCases: [
      "Create clean URL slugs for blog posts and landing pages.",
      "Prepare SEO-friendly content elements for websites.",
      "Speed up small SEO tasks for daily publishing work.",
    ],
  },
  "Social Media Tools": {
    icon: "Share2",
    intro:
      "Resize images, format posts, generate emojis, and prepare content for social platforms.",
    useCases: [
      "Prepare images and thumbnails for social media posts.",
      "Format LinkedIn posts with cleaner readable text.",
      "Create captions, emojis, and quick content assets.",
    ],
  },
  "Converter Tools": {
    icon: "RefreshCw",
    intro:
      "Convert everyday file types, image formats, text formats, and useful digital assets online.",
    useCases: [
      "Change files into more usable formats.",
      "Convert images and documents before upload or sharing.",
      "Finish quick format changes without installing apps.",
    ],
  },
  "Color Tools": {
    icon: "Palette",
    intro:
      "Pick colors, copy color codes, build palettes, and improve website or design visuals.",
    useCases: [
      "Find HEX, RGB, and HSL color values quickly.",
      "Prepare brand colors for websites and graphics.",
      "Create consistent palettes for design work.",
    ],
  },
  "Calculator Tools": {
    icon: "Calculator",
    intro:
      "Use simple calculators for age, numbers, planning, measurements, and everyday decisions.",
    useCases: [
      "Calculate age, numbers, dates, and quick daily values.",
      "Avoid manual calculation mistakes.",
      "Use simple tools from any device.",
    ],
  },
  "Web Tools": {
    icon: "Globe2",
    intro:
      "Generate, check, clean, and prepare useful assets for websites and digital projects.",
    useCases: [
      "Prepare website-friendly assets and small web utilities.",
      "Speed up repetitive tasks for developers and creators.",
      "Clean and generate useful web content quickly.",
    ],
  },
  "Video Tools": {
    icon: "Video",
    intro:
      "Handle quick video-related tasks such as thumbnails, content assets, and creator utilities.",
    useCases: [
      "Get YouTube thumbnails for content planning.",
      "Prepare visual assets for creators and editors.",
      "Speed up repeat video content workflows.",
    ],
  },
  "Productivity Tools": {
    icon: "Zap",
    intro:
      "Complete small daily tasks faster with focused tools for work, study, and content creation.",
    useCases: [
      "Handle daily digital tasks from one place.",
      "Save time on repetitive work.",
      "Use practical tools without a complicated setup.",
    ],
  },
};

function normalizeText(value) {
  return String(value || "").trim();
}

function getCategoryPath(category, search = "") {
  const params = new URLSearchParams();

  if (category) params.set("category", category);
  if (search) params.set("search", search);

  const query = params.toString();
  return query ? `/tools?${query}` : "/tools";
}

function getIcon(iconName, fallback = "Wrench") {
  return Icons[iconName] || Icons[fallback] || Icons.Wrench;
}

function getCategoryMeta(category) {
  const normalized = normalizeText(category);

  return (
    CATEGORY_META[normalized] || {
      icon: "FolderOpen",
      intro: `Use simple ${normalized.toLowerCase()} to complete everyday digital tasks faster from your browser.`,
      useCases: [
        "Complete common digital tasks quickly.",
        "Use browser-based tools without extra installation.",
        "Save time with focused tools for everyday work.",
      ],
    }
  );
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

function scoreTool(tool) {
  const text = getToolSearchText(tool);
  let score = tool.trending ? 100 : 0;

  if (text.includes("image compressor")) score += 30;
  if (text.includes("image resizer")) score += 28;
  if (text.includes("google sheet link")) score += 28;
  if (text.includes("jpg to pdf")) score += 24;
  if (text.includes("pdf to jpg")) score += 24;
  if (text.includes("merge pdf")) score += 22;
  if (text.includes("phone number cleaner")) score += 22;
  if (text.includes("linkedin")) score += 20;
  if (text.includes("youtube thumbnail")) score += 18;
  if (text.includes("qr")) score += 16;

  return score;
}

function ToolIcon({ icon, className = "tools-directory-tool-icon" }) {
  const IconComponent = getIcon(icon);

  return (
    <div className={className} aria-hidden="true">
      <IconComponent size={20} strokeWidth={2.1} />
    </div>
  );
}

function ToolCard({ tool }) {
  return (
    <SmartLink
      to={`/tool/${tool.id}`}
      className="tools-directory-card"
      aria-label={`Open ${tool.name}`}
    >
      <div className="tools-directory-card-top">
        <ToolIcon icon={tool.icon} />

        {tool.trending && (
          <span className="tools-directory-popular">
            <Icons.Flame size={12} aria-hidden="true" />
            Popular
          </span>
        )}
      </div>

      <h3>{tool.name}</h3>

      <p>
        {tool.description ||
          "Open this free browser-based tool and complete your task faster."}
      </p>

      <div className="tools-directory-card-bottom">
        <span>{tool.category || "Online Tool"}</span>
        <Icons.ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
      </div>
    </SmartLink>
  );
}

function CategoryNavItem({ category, count, selectedCategory, searchTerm }) {
  const meta = getCategoryMeta(category);
  const IconComponent = getIcon(meta.icon, "FolderOpen");
  const isActive = selectedCategory === category;

  return (
    <SmartLink
      to={getCategoryPath(category, searchTerm)}
      className={`tools-directory-category-item${isActive ? " active" : ""}`}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="tools-directory-category-icon" aria-hidden="true">
        <IconComponent size={16} strokeWidth={2.2} />
      </span>
      <span className="tools-directory-category-name">
        {category.replace(" Tools", "")}
      </span>
      <span className="tools-directory-category-count">{count}</span>
    </SmartLink>
  );
}

export default function Tools() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const selectedCategory = normalizeText(queryParams.get("category"));
  const searchTerm = normalizeText(queryParams.get("search"));
  const [sortBy, setSortBy] = useState("recommended");

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

  const selectedCategoryMeta = selectedCategory ? getCategoryMeta(selectedCategory) : null;

  const filteredTools = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const results = tools.filter((tool) => {
      const category = normalizeText(tool.category);
      const matchesCategory = selectedCategory ? category === selectedCategory : true;
      const matchesSearch = search ? getToolSearchText(tool).includes(search) : true;

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

      return scoreTool(b) - scoreTool(a);
    });
  }, [selectedCategory, searchTerm, sortBy]);

  const categoryBlogs = useMemo(() => {
    if (!selectedCategory) return [];

    return blogs
      .filter((article) => normalizeText(article.category) === selectedCategory)
      .slice(0, 3);
  }, [selectedCategory]);

  const totalTools = tools.length;
  const totalCategories = categories.length;

  const canonicalUrl = selectedCategory
    ? `${TOOLS_URL}?category=${encodeURIComponent(selectedCategory)}`
    : TOOLS_URL;

  const seoTitle = selectedCategory
    ? `Free ${selectedCategory} Online | Next Online Tools`
    : "All Free Online Tools | Next Online Tools";

  const seoDescription = selectedCategory
    ? selectedCategoryMeta?.intro ||
      `Browse free ${selectedCategory.toLowerCase()} online. Use simple browser-based tools from Next Online Tools.`
    : "Browse all free online tools for images, PDFs, text, SEO, spreadsheets, social media, converters, colors, calculators, and everyday digital work.";

  const structuredData = useMemo(() => {
    const breadcrumbItems = [
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
    ];

    if (selectedCategory) {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 3,
        name: selectedCategory,
        item: canonicalUrl,
      });
    }

    const graph = [
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
          potentialAction: {
            "@type": "SearchAction",
            target: `${TOOLS_URL}?search={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
        inLanguage: "en",
        mainEntity: {
          "@type": "ItemList",
          name: selectedCategory ? `${selectedCategory} Collection` : "All Online Tools",
          numberOfItems: filteredTools.length,
          itemListElement: filteredTools.slice(0, 60).map((tool, index) => ({
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
        itemListElement: breadcrumbItems,
      },
    ];

    if (selectedCategory && selectedCategoryMeta) {
      graph.push({
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: `What can I do with ${selectedCategory}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: selectedCategoryMeta.intro,
            },
          },
          {
            "@type": "Question",
            name: "Do I need to install software?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. These tools are browser-based and built for quick everyday tasks.",
            },
          },
        ],
      });
    }

    return {
      "@context": "https://schema.org",
      "@graph": graph,
    };
  }, [
    canonicalUrl,
    filteredTools,
    selectedCategory,
    selectedCategoryMeta,
    seoDescription,
    seoTitle,
  ]);

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

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

      <main className="tools-directory-page">
        <nav className="tools-directory-breadcrumb" aria-label="Breadcrumb">
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

        <section className="tools-directory-header">
          <div className="tools-directory-header-copy">
            <span className="tools-directory-kicker">Tools directory</span>

            <h1>{selectedCategory || "All online tools"}</h1>

            <p>
              {selectedCategory
                ? selectedCategoryMeta?.intro
                : "A clean directory of practical browser-based tools for images, PDFs, text, SEO, spreadsheets, social media, converters, colors, calculators, and daily work."}
            </p>

            <div className="tools-directory-meta" aria-label="Directory summary">
              <span>{totalTools}+ tools</span>
              <span>{totalCategories} categories</span>
              <span>No software install</span>
            </div>
          </div>

          <div className="tools-directory-header-actions">
            <SmartLink to="/blog" className="tools-directory-secondary-btn">
              Read guides
            </SmartLink>
            <SmartLink to="/contact" className="tools-directory-primary-btn">
              Request a tool
            </SmartLink>
          </div>
        </section>

        <section className="tools-directory-layout" aria-label="Tools directory">
          <aside className="tools-directory-sidebar" aria-label="Tool categories">
            <div className="tools-directory-sidebar-head">
              <span>Categories</span>
              <strong>Browse tools</strong>
            </div>

            <div className="tools-directory-category-list">
              <SmartLink
                to={searchTerm ? `/tools?search=${encodeURIComponent(searchTerm)}` : "/tools"}
                className={`tools-directory-category-item${!selectedCategory ? " active" : ""}`}
                aria-current={!selectedCategory ? "page" : undefined}
              >
                <span className="tools-directory-category-icon" aria-hidden="true">
                  <Icons.LayoutGrid size={16} strokeWidth={2.2} />
                </span>
                <span className="tools-directory-category-name">All tools</span>
                <span className="tools-directory-category-count">{totalTools}</span>
              </SmartLink>

              {categories.map((category) => (
                <CategoryNavItem
                  key={category}
                  category={category}
                  count={categoryCounts[category] || 0}
                  selectedCategory={selectedCategory}
                  searchTerm={searchTerm}
                />
              ))}
            </div>
          </aside>

          <div className="tools-directory-main">
            <div className="tools-directory-toolbar">
              <div>
                <span>Results</span>
                <strong>
                  {filteredTools.length} {filteredTools.length === 1 ? "tool" : "tools"}
                </strong>
              </div>

              <label className="tools-directory-sort">
                <span>Sort by</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  aria-label="Sort tools"
                >
                  <option value="recommended">Recommended</option>
                  <option value="popular">Popular first</option>
                  <option value="az">A to Z</option>
                  <option value="category">Category</option>
                </select>
              </label>
            </div>

            {(selectedCategory || searchTerm) && (
              <div className="tools-directory-active-filter">
                <p>
                  Showing <strong>{filteredTools.length}</strong>{" "}
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

                <SmartLink to="/tools">Reset filters</SmartLink>
              </div>
            )}

            {filteredTools.length === 0 ? (
              <div className="tools-directory-empty">
                <Icons.SearchX size={34} aria-hidden="true" />
                <h2>No tools found</h2>
                <p>Try another keyword from the menu search or browse all categories.</p>
                <SmartLink to="/tools" className="tools-directory-primary-btn">
                  Browse all tools
                </SmartLink>
              </div>
            ) : (
              <div className="tools-directory-grid">
                {filteredTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </div>
        </section>

        {selectedCategory && selectedCategoryMeta && (
          <section className="tools-directory-info-section">
            <div className="tools-directory-info-copy">
              <span>Category details</span>
              <h2>About {selectedCategory}</h2>
              <p>{selectedCategoryMeta.intro}</p>
            </div>

            <div className="tools-directory-use-case-list">
              {selectedCategoryMeta.useCases.map((useCase) => (
                <article key={useCase}>
                  <Icons.CheckCircle2 size={18} aria-hidden="true" />
                  <p>{useCase}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {selectedCategory && categoryBlogs.length > 0 && (
          <section className="tools-directory-guides">
            <div className="tools-directory-section-head">
              <span>Related guides</span>
              <h2>Learn more about {selectedCategory}</h2>
            </div>

            <div className="tools-directory-guide-grid">
              {categoryBlogs.map((article) => (
                <SmartLink
                  key={article.slug}
                  to={`/blog/${article.slug}`}
                  className="tools-directory-guide-card"
                >
                  <span>{article.date}</span>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                </SmartLink>
              ))}
            </div>
          </section>
        )}

        {selectedCategory && selectedCategoryMeta && (
          <section className="tools-directory-faq">
            <div className="tools-directory-section-head">
              <span>FAQ</span>
              <h2>Common questions</h2>
            </div>

            <div className="tools-directory-faq-grid">
              <article>
                <h3>What can I do with {selectedCategory}?</h3>
                <p>{selectedCategoryMeta.intro}</p>
              </article>

              <article>
                <h3>Do I need to install software?</h3>
                <p>
                  No. These tools are browser-based and built for quick everyday tasks.
                </p>
              </article>
            </div>
          </section>
        )}

        <section className="tools-directory-cta">
          <div>
            <span>Need something specific?</span>
            <h2>Request a new tool for your workflow</h2>
            <p>
              Tell us what task you want to finish faster, and we can consider it for the Next Online Tools roadmap.
            </p>
          </div>

          <SmartLink to="/contact" className="tools-directory-primary-btn">
            Request a tool
          </SmartLink>
        </section>
      </main>
    </>
  );
}
