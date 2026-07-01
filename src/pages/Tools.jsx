import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import * as Icons from "lucide-react";

import tools from "../data/tools.json";
import { blogs } from "../data/Blogs";
import SmartLink from "../components/ui/SmartLink";

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
    workflow: ["Resize", "Compress", "Convert", "Edit"],
    useCases: [
      "Prepare product photos, blog images, and social media visuals.",
      "Reduce image size before uploading to websites, forms, and emails.",
      "Convert modern image formats like HEIC, WEBP, and AVIF.",
    ],
  },
  "PDF Tools": {
    icon: "FileText",
    intro:
      "Merge, compress, split, convert, reorder, and organize PDF files directly from your browser.",
    workflow: ["JPG to PDF", "Merge", "Compress", "Add Page Numbers"],
    useCases: [
      "Combine documents into one professional PDF.",
      "Reduce PDF size for email, upload forms, and office sharing.",
      "Convert images and PDF pages into the format you need.",
    ],
  },
  "Text Tools": {
    icon: "Pilcrow",
    intro:
      "Clean, count, format, convert, and prepare text for writing, content, forms, and daily work.",
    workflow: ["Paste Text", "Clean", "Format", "Copy"],
    useCases: [
      "Count words and characters for articles, captions, and assignments.",
      "Convert uppercase, lowercase, title case, and sentence case.",
      "Clean copied text before using it in documents or websites.",
    ],
  },
  "Spreadsheet Tools": {
    icon: "Table2",
    intro:
      "Extract links, clean phone numbers, format lead lists, and prepare spreadsheet data faster.",
    workflow: ["Extract Links", "Clean Phone Numbers", "Format Data", "Export"],
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
    workflow: ["Add Keyword", "Generate", "Review", "Publish"],
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
    workflow: ["Resize Image", "Format Post", "Generate Emojis", "Publish"],
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
    workflow: ["Upload", "Choose Format", "Convert", "Download"],
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
    workflow: ["Pick Color", "Copy Code", "Build Palette", "Use"],
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
    workflow: ["Enter Data", "Calculate", "Review", "Use Result"],
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
    workflow: ["Input", "Generate", "Check", "Copy"],
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
    workflow: ["Paste Link", "Preview", "Download", "Use"],
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
    workflow: ["Choose Task", "Input", "Process", "Finish"],
    useCases: [
      "Handle daily digital tasks from one place.",
      "Save time on repetitive work.",
      "Use practical tools without a complicated setup.",
    ],
  },
};

const FEATURED_WORKFLOWS = [
  {
    title: "Image workflow",
    icon: "Image",
    description:
      "Prepare images for websites, blogs, forms, and social posts without opening design software.",
    category: "Image Tools",
    steps: [
      { label: "Resize", keywords: ["image resizer", "resize image"] },
      { label: "Compress", keywords: ["image compressor", "compress image"] },
      { label: "Convert", keywords: ["webp", "heic", "jpg converter"] },
      { label: "Edit", keywords: ["photo editor", "image editor"] },
    ],
  },
  {
    title: "PDF workflow",
    icon: "FileText",
    description:
      "Turn images into PDFs, organize documents, reduce file size, and prepare clean final files.",
    category: "PDF Tools",
    steps: [
      { label: "JPG to PDF", keywords: ["jpg to pdf"] },
      { label: "Merge", keywords: ["merge pdf"] },
      { label: "Compress", keywords: ["compress pdf"] },
      { label: "Page Numbers", keywords: ["page number", "pdf page"] },
    ],
  },
  {
    title: "Spreadsheet workflow",
    icon: "Table2",
    description:
      "Clean messy sheet data, extract hidden links, and prepare lists for outreach or reporting.",
    category: "Spreadsheet Tools",
    steps: [
      { label: "Extract Links", keywords: ["google sheet link extractor", "link extractor"] },
      { label: "Clean Numbers", keywords: ["phone number cleaner", "phone"] },
      { label: "Format Data", keywords: ["csv", "spreadsheet"] },
      { label: "Export", keywords: ["export", "converter"] },
    ],
  },
  {
    title: "Social workflow",
    icon: "Share2",
    description:
      "Create better social content with image resizing, post formatting, emoji ideas, and thumbnails.",
    category: "Social Media Tools",
    steps: [
      { label: "Resize Image", keywords: ["social media image", "image resizer"] },
      { label: "Format LinkedIn", keywords: ["linkedin text formatter", "linkedin"] },
      { label: "Generate Emojis", keywords: ["emoji"] },
      { label: "Thumbnail", keywords: ["youtube thumbnail"] },
    ],
  },
];

const QUICK_SEARCHES = [
  "compress image",
  "PDF to JPG",
  "JPG to PDF",
  "Google Sheet links",
  "phone number cleaner",
  "LinkedIn text",
];

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
      workflow: ["Choose", "Upload", "Process", "Download"],
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

function findToolByKeywords(allTools, keywords = []) {
  const normalizedKeywords = keywords.map((keyword) => String(keyword).toLowerCase());

  return allTools.find((tool) => {
    const haystack = getToolSearchText(tool);
    return normalizedKeywords.some((keyword) => haystack.includes(keyword));
  });
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

function ToolIcon({ icon, className = "tools-v2-card-icon" }) {
  const IconComponent = getIcon(icon);

  return (
    <div className={className} aria-hidden="true">
      <IconComponent size={22} strokeWidth={2.1} />
    </div>
  );
}

function ToolCard({ tool }) {
  return (
    <SmartLink
      to={`/tool/${tool.id}`}
      className="tools-v2-tool-card"
      aria-label={`Open ${tool.name}`}
    >
      <div className="tools-v2-tool-card-top">
        <ToolIcon icon={tool.icon} />

        {tool.trending && (
          <span className="tools-v2-popular-badge">
            <Icons.Flame size={12} />
            Popular
          </span>
        )}
      </div>

      <h3>{tool.name}</h3>

      <p>
        {tool.description ||
          "Open this free browser-based tool and complete your task faster."}
      </p>

      <div className="tools-v2-tool-card-bottom">
        <span>{tool.category || "Online Tool"}</span>
        <div aria-hidden="true">
          <Icons.ArrowRight size={16} strokeWidth={2.2} />
        </div>
      </div>
    </SmartLink>
  );
}

function WorkflowCard({ workflow }) {
  const IconComponent = getIcon(workflow.icon);

  return (
    <article className="tools-v2-workflow-card">
      <div className="tools-v2-workflow-head">
        <div className="tools-v2-workflow-icon" aria-hidden="true">
          <IconComponent size={23} strokeWidth={2.1} />
        </div>

        <div>
          <span>{workflow.category}</span>
          <h3>{workflow.title}</h3>
        </div>
      </div>

      <p>{workflow.description}</p>

      <div className="tools-v2-workflow-steps">
        {workflow.steps.map((step) => {
          const targetTool = findToolByKeywords(tools, step.keywords);
          const fallbackSearch = step.keywords[0] || step.label;
          const href = targetTool
            ? `/tool/${targetTool.id}`
            : `/tools?search=${encodeURIComponent(fallbackSearch)}`;

          return (
            <SmartLink key={step.label} to={href} className="tools-v2-step-pill">
              {step.label}
              <Icons.ArrowRight size={13} />
            </SmartLink>
          );
        })}
      </div>
    </article>
  );
}

function CategoryCard({ category, count, searchTerm }) {
  const meta = getCategoryMeta(category);
  const IconComponent = getIcon(meta.icon, "FolderOpen");

  return (
    <SmartLink
      to={getCategoryPath(category, searchTerm)}
      className="tools-v2-category-card"
      aria-label={`Browse ${category}`}
    >
      <div className="tools-v2-category-card-top">
        <div className="tools-v2-category-icon" aria-hidden="true">
          <IconComponent size={23} strokeWidth={2.1} />
        </div>
        <span>{count} tools</span>
      </div>

      <h3>{category}</h3>
      <p>{meta.intro}</p>

      <div className="tools-v2-mini-workflow" aria-label={`${category} workflow`}>
        {meta.workflow.slice(0, 4).map((step) => (
          <span key={step}>{step}</span>
        ))}
      </div>
    </SmartLink>
  );
}

export default function Tools() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const selectedCategory = normalizeText(queryParams.get("category"));
  const urlSearchTerm = normalizeText(queryParams.get("search"));

  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  const [sortBy, setSortBy] = useState("recommended");

  useEffect(() => {
    setSearchTerm(urlSearchTerm);
  }, [urlSearchTerm]);

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

      return scoreTool(b) - scoreTool(a);
    });
  }, [selectedCategory, searchTerm, sortBy]);

  const totalTools = tools.length;
  const totalCategories = categories.length;
  const popularToolsCount = tools.filter((tool) => tool.trending).length;
  const selectedCategoryMeta = selectedCategory ? getCategoryMeta(selectedCategory) : null;

  const categoryBlogs = useMemo(() => {
    if (!selectedCategory) return [];

    return blogs
      .filter((article) => normalizeText(article.category) === selectedCategory)
      .slice(0, 3);
  }, [selectedCategory]);

  const topCategories = useMemo(() => {
    return categories
      .map((category) => ({
        name: category,
        count: categoryCounts[category] || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [categories, categoryCounts]);

  const canonicalUrl = selectedCategory
    ? `${TOOLS_URL}?category=${encodeURIComponent(selectedCategory)}`
    : TOOLS_URL;

  const seoTitle = selectedCategory
    ? `Free ${selectedCategory} Online | Next Online Tools`
    : "Free Online Tools for Images, PDFs, Text, SEO & Daily Work | Next Online Tools";

  const seoDescription = selectedCategory
    ? selectedCategoryMeta?.intro ||
      `Browse free ${selectedCategory.toLowerCase()} online. Use simple browser-based tools from Next Online Tools.`
    : "Browse free online tools for images, PDFs, text, SEO, spreadsheets, social media, converters, colors, calculators, and everyday digital work.";

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

  function handleSearchSubmit(event) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (selectedCategory) params.set("category", selectedCategory);
    if (searchTerm.trim()) params.set("search", searchTerm.trim());

    const query = params.toString();
    navigate(query ? `/tools?${query}` : "/tools");
  }

  function clearSearch() {
    setSearchTerm("");
    navigate(selectedCategory ? getCategoryPath(selectedCategory) : "/tools");
  }

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

      <main className="tools-v2-page">
        <nav className="tools-v2-breadcrumb" aria-label="Breadcrumb">
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

        <section className="tools-v2-hero">
          <div className="tools-v2-hero-content">
            <span className="tools-v2-kicker">
              <Icons.Sparkles size={15} />
              Free browser-based tools
            </span>

            <h1>
              {selectedCategory
                ? `Free ${selectedCategory} Online`
                : "Find the right online tool for your next task"}
            </h1>

            <p>
              {selectedCategory
                ? selectedCategoryMeta?.intro
                : "Browse practical tools for images, PDFs, text, SEO, spreadsheets, social media, converters, colors, calculators, and everyday digital work."}
            </p>

            <form className="tools-v2-search-form" onSubmit={handleSearchSubmit}>
              <Icons.Search size={20} aria-hidden="true" />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tools: compress image, PDF to JPG, Google Sheet links..."
                aria-label="Search tools"
              />

              {searchTerm && (
                <button
                  type="button"
                  className="tools-v2-search-clear"
                  onClick={clearSearch}
                >
                  Clear
                </button>
              )}

              <button type="submit">Search</button>
            </form>

            <div className="tools-v2-quick-searches" aria-label="Quick searches">
              {QUICK_SEARCHES.map((query) => (
                <button
                  type="button"
                  key={query}
                  className="tools-v2-quick-chip"
                  onClick={() => {
                    setSearchTerm(query);
                    navigate(`/tools?search=${encodeURIComponent(query)}`);
                  }}
                >
                  {query}
                </button>
              ))}
            </div>

            <div className="tools-v2-hero-actions">
              <SmartLink to="/tools" className="tools-v2-primary-btn">
                Browse all tools
              </SmartLink>
              <SmartLink to="/blog" className="tools-v2-secondary-btn">
                Read guides
              </SmartLink>
            </div>
          </div>

          <aside className="tools-v2-hero-panel" aria-label="Tools summary">
            <div className="tools-v2-stat-card tools-v2-stat-main">
              <strong>{totalTools}+</strong>
              <span>Free tools for everyday work</span>
            </div>
            <div className="tools-v2-stat-card">
              <strong>{totalCategories}</strong>
              <span>Organized categories</span>
            </div>
            <div className="tools-v2-stat-card">
              <strong>{popularToolsCount || "Top"}</strong>
              <span>Popular tools highlighted</span>
            </div>
          </aside>
        </section>

        {!selectedCategory && (
          <section className="tools-v2-section">
            <div className="tools-v2-section-head">
              <span>Popular workflows</span>
              <h2>Start with the job you want to finish</h2>
              <p>
                Instead of searching one tool at a time, choose a workflow and move from step to step.
              </p>
            </div>

            <div className="tools-v2-workflow-grid">
              {FEATURED_WORKFLOWS.map((workflow) => (
                <WorkflowCard key={workflow.title} workflow={workflow} />
              ))}
            </div>
          </section>
        )}

        {!selectedCategory && (
          <section className="tools-v2-section">
            <div className="tools-v2-section-head-row">
              <div className="tools-v2-section-head">
                <span>Browse by category</span>
                <h2>Choose tools by work type</h2>
                <p>
                  Each category works like a mini landing page with related tools, workflows, and use cases.
                </p>
              </div>
            </div>

            <div className="tools-v2-category-grid">
              {topCategories.map((category) => (
                <CategoryCard
                  key={category.name}
                  category={category.name}
                  count={category.count}
                  searchTerm=""
                />
              ))}
            </div>
          </section>
        )}

        <section className="tools-v2-filter-panel" aria-label="Search and filter tools">
          <div className="tools-v2-filter-top">
            <div>
              <span>Filter tools</span>
              <strong>
                {filteredTools.length} {filteredTools.length === 1 ? "result" : "results"}
              </strong>
            </div>

            <label className="tools-v2-sort">
              <span>Sort</span>
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

          <div className="tools-v2-category-bar" aria-label="Tool categories">
            <SmartLink
              to={searchTerm ? `/tools?search=${encodeURIComponent(searchTerm)}` : "/tools"}
              className={!selectedCategory ? "active" : ""}
              aria-current={!selectedCategory ? "page" : undefined}
            >
              All
              <span>{totalTools}</span>
            </SmartLink>

            {categories.map((category) => (
              <SmartLink
                key={category}
                to={getCategoryPath(category, searchTerm)}
                className={selectedCategory === category ? "active" : ""}
                aria-current={selectedCategory === category ? "page" : undefined}
              >
                {category.replace(" Tools", "")}
                <span>{categoryCounts[category] || 0}</span>
              </SmartLink>
            ))}
          </div>

          {(selectedCategory || searchTerm) && (
            <div className="tools-v2-active-filter">
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

              <SmartLink to="/tools">Reset all</SmartLink>
            </div>
          )}
        </section>

        <section className="tools-v2-results" aria-label="Tools collection">
          <div className="tools-v2-section-head-row">
            <div className="tools-v2-section-head">
              <span>Tools collection</span>
              <h2>{selectedCategory || "All online tools"}</h2>
              <p>
                Open any tool and finish your task quickly without installing extra software.
              </p>
            </div>
          </div>

          {filteredTools.length === 0 ? (
            <div className="tools-v2-empty">
              <Icons.SearchX size={34} aria-hidden="true" />
              <h3>No tools found</h3>
              <p>Try a different search keyword or browse all categories.</p>
              <SmartLink to="/tools" className="tools-v2-primary-btn">
                Reset filters
              </SmartLink>
            </div>
          ) : (
            <div className="tools-v2-tools-grid">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </section>

        {selectedCategory && selectedCategoryMeta && (
          <>
            <section className="tools-v2-section">
              <div className="tools-v2-section-head">
                <span>Best workflow</span>
                <h2>{selectedCategory} workflow</h2>
                <p>
                  Follow this simple flow to finish common {selectedCategory.toLowerCase()} tasks faster.
                </p>
              </div>

              <div className="tools-v2-category-workflow">
                {selectedCategoryMeta.workflow.map((step, index) => (
                  <article key={step}>
                    <strong>{String(index + 1).padStart(2, "0")}</strong>
                    <h3>{step}</h3>
                  </article>
                ))}
              </div>
            </section>

            <section className="tools-v2-section">
              <div className="tools-v2-section-head">
                <span>Use cases</span>
                <h2>What you can do with {selectedCategory}</h2>
              </div>

              <div className="tools-v2-use-case-grid">
                {selectedCategoryMeta.useCases.map((useCase) => (
                  <article key={useCase}>
                    <Icons.CheckCircle2 size={18} aria-hidden="true" />
                    <p>{useCase}</p>
                  </article>
                ))}
              </div>
            </section>

            {categoryBlogs.length > 0 && (
              <section className="tools-v2-section">
                <div className="tools-v2-section-head">
                  <span>Related guides</span>
                  <h2>Learn more about {selectedCategory}</h2>
                </div>

                <div className="tools-v2-blog-grid">
                  {categoryBlogs.map((article) => (
                    <SmartLink
                      key={article.slug}
                      to={`/blog/${article.slug}`}
                      className="tools-v2-blog-card"
                    >
                      <span>{article.date}</span>
                      <h3>{article.title}</h3>
                      <p>{article.excerpt}</p>
                    </SmartLink>
                  ))}
                </div>
              </section>
            )}

            <section className="tools-v2-section">
              <div className="tools-v2-section-head">
                <span>FAQ</span>
                <h2>Common questions</h2>
              </div>

              <div className="tools-v2-faq-grid">
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
          </>
        )}

        <section className="tools-v2-support">
          <article>
            <Icons.Zap size={22} aria-hidden="true" />
            <div>
              <h3>Fast and focused</h3>
              <p>Open a tool, complete the task, and move to the next step.</p>
            </div>
          </article>

          <article>
            <Icons.ShieldCheck size={22} aria-hidden="true" />
            <div>
              <h3>Browser-based workflow</h3>
              <p>Use practical tools without installing heavy software.</p>
            </div>
          </article>

          <article>
            <Icons.LayoutGrid size={22} aria-hidden="true" />
            <div>
              <h3>Easy to discover</h3>
              <p>Search, filter, sort, and browse by category in one clean page.</p>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}
