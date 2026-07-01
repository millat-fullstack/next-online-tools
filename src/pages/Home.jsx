import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Helmet } from "react-helmet-async";

import tools from "../data/tools.json";
import Button from "../components/ui/Button";
import SmartLink from "../components/ui/SmartLink";

const SITE_URL = "https://nextonlinetools.com";
const HOME_IMAGE = `${SITE_URL}/images/home-page-banner.png`;

const PRIORITY_TOOL_KEYWORDS = [
  "image compressor",
  "image resizer",
  "photo editor",
  "passport",
  "heic to jpg",
  "webp to jpg",
  "merge pdf",
  "compress pdf",
  "pdf to jpg",
  "jpg to pdf",
  "google sheet link extractor",
  "phone number cleaner",
  "linkedin text formatter",
  "qr code",
  "youtube thumbnail",
];

const CATEGORY_ORDER = [
  "Image Tools",
  "PDF Tools",
  "Spreadsheet Tools",
  "Text Tools",
  "SEO Tools",
  "Social Media Tools",
  "Converter Tools",
  "Color Tools",
  "Calculator Tools",
  "Web Tools",
];

const CATEGORY_DETAILS = {
  "Image Tools": {
    icon: "Image",
    text: "Resize, compress, crop, convert, edit, and prepare images for websites, blogs, documents, and social media.",
  },
  "PDF Tools": {
    icon: "FileText",
    text: "Merge, compress, convert, organize, and manage PDF files directly from your browser.",
  },
  "Spreadsheet Tools": {
    icon: "Table2",
    text: "Extract links, clean phone numbers, format lead lists, and prepare spreadsheet data with less manual work.",
  },
  "Text Tools": {
    icon: "Pilcrow",
    text: "Clean, format, count, convert, and improve text for writing, content, forms, and productivity.",
  },
  "SEO Tools": {
    icon: "Search",
    text: "Create clean slugs, improve content formatting, and prepare SEO-friendly website content faster.",
  },
  "Social Media Tools": {
    icon: "Share2",
    text: "Resize posts, prepare captions, format LinkedIn content, create thumbnails, and speed up content publishing.",
  },
  "Converter Tools": {
    icon: "RefreshCw",
    text: "Convert images, files, text, units, and everyday formats quickly without installing extra apps.",
  },
  "Color Tools": {
    icon: "Palette",
    text: "Pick colors, copy color codes, build palettes, and make better visual design decisions.",
  },
  "Calculator Tools": {
    icon: "Calculator",
    text: "Use simple calculators for age, numbers, measurements, planning, and daily decision-making.",
  },
  "Web Tools": {
    icon: "Globe2",
    text: "Generate, check, clean, and prepare useful web assets for websites, creators, and digital work.",
  },
};

const WORKFLOWS = [
  {
    id: "image",
    icon: "Image",
    label: "Image workflow",
    title: "Prepare images for websites and social posts",
    description:
      "Resize, compress, convert, and lightly edit images before uploading them anywhere.",
    steps: [
      { label: "Resize", keywords: ["image resizer", "resize image"] },
      { label: "Compress", keywords: ["image compressor", "compress image"] },
      { label: "Convert", keywords: ["webp to jpg", "heic to jpg", "image converter"] },
      { label: "Edit", keywords: ["photo editor", "image editor", "quick photo editor"] },
    ],
  },
  {
    id: "pdf",
    icon: "FileText",
    label: "PDF workflow",
    title: "Turn documents and images into polished PDFs",
    description:
      "Convert images, merge files, reduce file size, and organize pages in one simple flow.",
    steps: [
      { label: "JPG to PDF", keywords: ["jpg to pdf", "image to pdf"] },
      { label: "Merge", keywords: ["merge pdf", "pdf merge"] },
      { label: "Compress", keywords: ["compress pdf", "pdf compressor"] },
      { label: "Add page numbers", keywords: ["page numbers", "add page numbers"] },
    ],
  },
  {
    id: "spreadsheet",
    icon: "Table2",
    label: "Spreadsheet workflow",
    title: "Clean lead lists and spreadsheet data faster",
    description:
      "Extract hidden links, clean phone numbers, and prepare spreadsheet data for outreach or reporting.",
    steps: [
      { label: "Extract links", keywords: ["google sheet link extractor", "extract links"] },
      { label: "Clean phone numbers", keywords: ["phone number cleaner", "phone cleaner"] },
      { label: "Format data", keywords: ["csv", "spreadsheet", "text cleaner"] },
      { label: "Export data", keywords: ["csv to xls", "converter"] },
    ],
  },
  {
    id: "social",
    icon: "Share2",
    label: "Social workflow",
    title: "Create better social content with less manual work",
    description:
      "Resize visuals, format LinkedIn posts, generate useful text, and prepare content for publishing.",
    steps: [
      { label: "Resize image", keywords: ["social media image", "image resizer"] },
      { label: "Format LinkedIn post", keywords: ["linkedin text formatter", "linkedin"] },
      { label: "Generate emojis", keywords: ["emoji", "text"] },
      { label: "Get thumbnail", keywords: ["youtube thumbnail", "thumbnail"] },
    ],
  },
];

const QUICK_SEARCHES = [
  "compress image",
  "PDF to JPG",
  "Google Sheet links",
  "LinkedIn formatter",
  "passport photo",
  "clean phone numbers",
];

const JOB_GROUPS = [
  {
    icon: "BriefcaseBusiness",
    title: "For office work",
    text: "Convert PDFs, clean files, prepare spreadsheets, and finish repetitive document tasks faster.",
    links: [
      { label: "PDF tools", category: "PDF Tools" },
      { label: "Spreadsheet tools", category: "Spreadsheet Tools" },
      { label: "Text tools", category: "Text Tools" },
    ],
  },
  {
    icon: "Megaphone",
    title: "For creators and marketers",
    text: "Resize images, format social posts, create thumbnails, and prepare content for publishing.",
    links: [
      { label: "Image tools", category: "Image Tools" },
      { label: "Social media tools", category: "Social Media Tools" },
      { label: "SEO tools", category: "SEO Tools" },
    ],
  },
  {
    icon: "Code2",
    title: "For web and SEO tasks",
    text: "Create clean slugs, compress assets, generate QR codes, and prepare website-friendly content.",
    links: [
      { label: "SEO tools", category: "SEO Tools" },
      { label: "Web tools", category: "Web Tools" },
      { label: "Converter tools", category: "Converter Tools" },
    ],
  },
];

function normalize(value = "") {
  return String(value).toLowerCase().replace(/[-_]+/g, " ").trim();
}

function getUniqueTools(list) {
  const seen = new Set();

  return list.filter((tool) => {
    if (!tool?.id || seen.has(tool.id)) return false;
    seen.add(tool.id);
    return true;
  });
}

function findToolByKeywords(allTools, keywords = []) {
  const normalizedKeywords = keywords.map(normalize).filter(Boolean);

  return allTools.find((tool) => {
    const haystack = normalize(
      `${tool.name || ""} ${tool.id || ""} ${tool.category || ""} ${
        tool.description || ""
      }`
    );

    return normalizedKeywords.some((keyword) => haystack.includes(keyword));
  });
}

function findToolsByKeywords(allTools, keywords, limit) {
  const matched = keywords
    .map((keyword) => findToolByKeywords(allTools, [keyword]))
    .filter(Boolean);

  const fallback = allTools.filter(
    (tool) => !matched.some((item) => item.id === tool.id)
  );

  return getUniqueTools([...matched, ...fallback]).slice(0, limit);
}

function getToolUrl(step) {
  const tool = findToolByKeywords(tools, step.keywords);
  const searchTerm = step.keywords?.[0] || step.label;

  return tool?.id
    ? `/tool/${tool.id}`
    : `/tools?search=${encodeURIComponent(searchTerm)}`;
}

function getCategoryUrl(category) {
  return `/tools?category=${encodeURIComponent(category)}`;
}

function HomeIcon({ icon, className = "" }) {
  const IconComponent = Icons[icon] || Icons.Wrench;

  return (
    <span className={className} aria-hidden="true">
      <IconComponent size={22} strokeWidth={2.1} />
    </span>
  );
}

function ToolCard({ tool }) {
  if (!tool) return null;

  return (
    <SmartLink
      to={`/tool/${tool.id}`}
      className="home-v2-tool-card"
      aria-label={`Open ${tool.name}`}
    >
      <div className="home-v2-tool-card-top">
        <HomeIcon icon={tool.icon} className="home-v2-tool-icon" />

        {tool.trending && (
          <span className="home-v2-trending-badge">
            <Icons.Flame size={13} />
            Trending
          </span>
        )}
      </div>

      <h3>{tool.name}</h3>

      <p>
        {tool.description ||
          "Open this free browser-based tool and finish your task faster."}
      </p>

      <div className="home-v2-tool-card-bottom">
        <span>{tool.category || "Online Tool"}</span>
        <Icons.ArrowRight size={17} aria-hidden="true" />
      </div>
    </SmartLink>
  );
}

function WorkflowCard({ workflow }) {
  return (
    <article className={`home-v2-workflow-card home-v2-workflow-${workflow.id}`}>
      <div className="home-v2-workflow-head">
        <HomeIcon icon={workflow.icon} className="home-v2-workflow-icon" />
        <span>{workflow.label}</span>
      </div>

      <h3>{workflow.title}</h3>
      <p>{workflow.description}</p>

      <div className="home-v2-workflow-steps" aria-label={`${workflow.label} steps`}>
        {workflow.steps.map((step, index) => (
          <SmartLink key={step.label} to={getToolUrl(step)} className="home-v2-step-pill">
            <span>{step.label}</span>
            {index < workflow.steps.length - 1 && (
              <Icons.ChevronRight size={15} aria-hidden="true" />
            )}
          </SmartLink>
        ))}
      </div>
    </article>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const pageTitle =
    "Free Online Tools for Images, PDFs, Text, SEO & Daily Work | Next Online Tools";
  const pageDescription =
    "Use free browser-based tools for images, PDFs, text, Google Sheets, SEO, social media, converters, calculators, and everyday digital work.";

  const categories = useMemo(() => {
    const existingCategories = [
      ...new Set(tools.map((tool) => tool.category).filter(Boolean)),
    ];
    const ordered = CATEGORY_ORDER.filter((category) =>
      existingCategories.includes(category)
    );
    const remaining = existingCategories.filter(
      (category) => !ordered.includes(category)
    );

    return [...ordered, ...remaining];
  }, []);

  const popularTools = useMemo(() => {
    const trendingTools = tools.filter((tool) => tool.trending);
    const priorityTools = findToolsByKeywords(tools, PRIORITY_TOOL_KEYWORDS, 12);

    return getUniqueTools([...trendingTools, ...priorityTools]).slice(0, 8);
  }, []);

  const categoryHighlights = useMemo(() => {
    return categories.slice(0, 8).map((category) => {
      const detail = CATEGORY_DETAILS[category];
      const count = tools.filter((tool) => tool.category === category).length;

      return {
        name: category,
        count,
        icon: detail?.icon || "FolderOpen",
        text:
          detail?.text ||
          `Explore free ${category.toLowerCase()} to complete everyday digital tasks faster.`,
      };
    });
  }, [categories]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const query = searchQuery.trim();
    const destination = query
      ? `/tools?search=${encodeURIComponent(query)}`
      : "/tools";

    window.location.href = destination;
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Next Online Tools",
        alternateName: ["NextOnlineTools", "nextonlinetools.com"],
        url: `${SITE_URL}/`,
        description: pageDescription,
        inLanguage: "en",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/tools?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Next Online Tools",
        url: `${SITE_URL}/`,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/android-chrome-512x512.png`,
        },
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: `${SITE_URL}/`,
        name: pageTitle,
        description: pageDescription,
        isPartOf: {
          "@id": `${SITE_URL}/#website`,
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: HOME_IMAGE,
        },
        about: [
          "free online tools",
          "image tools",
          "PDF tools",
          "text tools",
          "spreadsheet tools",
          "Google Sheet tools",
          "SEO tools",
          "social media tools",
          "converter tools",
          "productivity tools",
        ],
        inLanguage: "en",
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/#popular-workflows`,
        name: "Popular Online Tool Workflows",
        itemListElement: WORKFLOWS.map((workflow, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: workflow.label,
          description: workflow.description,
        })),
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/#popular-tools`,
        name: "Popular Free Online Tools",
        itemListElement: popularTools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.name,
          url: `${SITE_URL}/tool/${tool.id}`,
        })),
      },
    ],
  };

  return (
    <main className="home-v2-page">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`${SITE_URL}/`} />

        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
        <meta
          name="keywords"
          content="free online tools, image tools, PDF tools, text tools, Google Sheet tools, SEO tools, online converters, productivity tools"
        />

        <meta property="og:site_name" content="Next Online Tools" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:image" content={HOME_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="Next Online Tools homepage with free PDF, image, text, SEO, and productivity tools"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={HOME_IMAGE} />

        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      {/* HERO */}
      <section className="home-v2-hero">
        <div className="home-v2-hero-content">
          <span className="home-v2-kicker">
            <Icons.Sparkles size={15} aria-hidden="true" />
            Free browser-based tools
          </span>

          <h1>Free Online Tools for Images, PDFs, Text, SEO & Daily Work</h1>

          <p>
            Find the right tool by task. Compress images, convert PDFs, clean
            spreadsheet data, format social posts, and finish everyday digital
            work without installing software.
          </p>

          <form className="home-v2-search" onSubmit={handleSearchSubmit}>
            <Icons.Search size={21} aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tools: compress image, PDF to JPG, Google Sheet links..."
              aria-label="Search online tools"
            />
            <button type="submit">Search</button>
          </form>

          <div className="home-v2-quick-searches" aria-label="Popular searches">
            {QUICK_SEARCHES.map((item) => (
              <SmartLink
                key={item}
                to={`/tools?search=${encodeURIComponent(item)}`}
                className="home-v2-quick-chip"
              >
                {item}
              </SmartLink>
            ))}
          </div>

          <div className="home-v2-hero-actions">
            <Button to="/tools" className="home-v2-primary-btn">
              Browse all tools
            </Button>
            <SmartLink to="#popular-workflows" className="home-v2-secondary-btn">
              Explore workflows
            </SmartLink>
          </div>
        </div>

        <aside className="home-v2-hero-panel" aria-label="Website overview">
          <div className="home-v2-stat-card home-v2-stat-main">
            <strong>{tools.length}+</strong>
            <span>Free tools organized by real jobs</span>
          </div>
          <div className="home-v2-stat-card">
            <strong>{categories.length}+</strong>
            <span>Useful categories</span>
          </div>
          <div className="home-v2-stat-card">
            <strong>0</strong>
            <span>Installations needed</span>
          </div>
        </aside>
      </section>

      {/* POPULAR WORKFLOWS */}
      <section className="home-v2-section" id="popular-workflows">
        <div className="home-v2-section-head">
          <span>Start by job</span>
          <h2>Popular workflows</h2>
          <p>
            Instead of browsing a long tool list, choose what you want to finish
            and move step by step.
          </p>
        </div>

        <div className="home-v2-workflow-grid">
          {WORKFLOWS.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>
      </section>

      {/* JOB GROUPS */}
      <section className="home-v2-section home-v2-job-section">
        <div className="home-v2-section-head">
          <span>Choose your workspace</span>
          <h2>Tools grouped around your daily work</h2>
          <p>
            Next Online Tools is built for creators, students, office teams,
            marketers, SEO workers, and anyone who handles digital files.
          </p>
        </div>

        <div className="home-v2-job-grid">
          {JOB_GROUPS.map((group) => (
            <article key={group.title} className="home-v2-job-card">
              <HomeIcon icon={group.icon} className="home-v2-job-icon" />
              <h3>{group.title}</h3>
              <p>{group.text}</p>

              <div>
                {group.links.map((link) => (
                  <SmartLink key={link.label} to={getCategoryUrl(link.category)}>
                    {link.label}
                    <Icons.ArrowRight size={14} aria-hidden="true" />
                  </SmartLink>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* POPULAR TOOLS */}
      <section className="home-v2-section" id="popular-tools">
        <div className="home-v2-section-head-row">
          <div className="home-v2-section-head">
            <span>Most useful</span>
            <h2>Popular tools to try first</h2>
            <p>
              Quick access to high-value tools for images, PDFs, spreadsheets,
              social media, and everyday productivity.
            </p>
          </div>

          <SmartLink to="/tools" className="home-v2-view-all">
            View all tools
            <Icons.ArrowRight size={16} aria-hidden="true" />
          </SmartLink>
        </div>

        <div className="home-v2-tools-grid">
          {popularTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="home-v2-section">
        <div className="home-v2-section-head">
          <span>Browse by category</span>
          <h2>Find tools by type</h2>
          <p>
            Use categories when you already know the kind of tool you need.
          </p>
        </div>

        <div className="home-v2-category-grid">
          {categoryHighlights.map((category) => (
            <SmartLink
              key={category.name}
              to={getCategoryUrl(category.name)}
              className="home-v2-category-card"
              aria-label={`Browse ${category.name}`}
            >
              <div>
                <HomeIcon icon={category.icon} className="home-v2-category-icon" />
                <span>{category.count} tools</span>
              </div>

              <h3>{category.name}</h3>
              <p>{category.text}</p>
            </SmartLink>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="home-v2-benefits">
        <div>
          <span className="home-v2-kicker">Why Next Online Tools</span>
          <h2>One clean workspace for small digital tasks</h2>
          <p>
            Keep your workflow simple. Open a tool, finish the job, and move to
            the next task without downloading heavy apps or switching between
            too many websites.
          </p>
        </div>

        <div className="home-v2-benefit-grid">
          <article>
            <Icons.MousePointerClick size={24} aria-hidden="true" />
            <h3>Easy to start</h3>
            <p>Search by task, choose a workflow, or browse categories.</p>
          </article>

          <article>
            <Icons.Zap size={24} aria-hidden="true" />
            <h3>Fast daily work</h3>
            <p>Designed for quick actions like compressing, converting, cleaning, and formatting.</p>
          </article>

          <article>
            <Icons.Layers3 size={24} aria-hidden="true" />
            <h3>Connected workflows</h3>
            <p>Related tools guide users from one step to the next.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
