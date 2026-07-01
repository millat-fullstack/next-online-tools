import { useMemo } from "react";
import * as Icons from "lucide-react";
import { Helmet } from "react-helmet-async";

import tools from "../data/tools.json";
import Button from "../components/ui/Button";
import SmartLink from "../components/ui/SmartLink";

const SITE_URL = "https://nextonlinetools.com";
const HOME_IMAGE = `${SITE_URL}/images/home-page-banner.png`;

const PRIORITY_TOOL_KEYWORDS = [
  "photo editor",
  "image compressor",
  "image resizer",
  "passport",
  "google sheet link extractor",
  "merge pdf",
  "compress pdf",
  "pdf to jpg",
  "jpg to pdf",
  "phone number cleaner",
  "qr code",
  "linkedin text formatter",
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
    text: "Create, resize, format, and prepare social media content for posts, thumbnails, captions, and profiles.",
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

function HomeToolIcon({ icon }) {
  const IconComponent = Icons[icon] || Icons.Wrench;

  return (
    <div className="home-tool-icon" aria-hidden="true">
      <IconComponent size={26} strokeWidth={2.1} />
    </div>
  );
}

function ToolCard({ tool, compact = false }) {
  if (!tool) return null;

  return (
    <SmartLink
      to={`/tool/${tool.id}`}
      className="home-tool-card"
      aria-label={`Open ${tool.name}`}
    >
      <div className="home-tool-card-top">
        <HomeToolIcon icon={tool.icon} />

        {tool.trending && (
          <span className="home-trending-badge">
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

      {!compact && (
        <div className="home-tool-card-bottom">
          <span>{tool.category || "Online Tool"}</span>

          <div aria-hidden="true">
            <Icons.ArrowRight size={17} />
          </div>
        </div>
      )}
    </SmartLink>
  );
}

function getUniqueTools(list) {
  const seen = new Set();
  return list.filter((tool) => {
    if (!tool?.id || seen.has(tool.id)) return false;
    seen.add(tool.id);
    return true;
  });
}

function findToolsByKeywords(allTools, keywords, limit) {
  const matched = keywords
    .map((keyword) => {
      const query = keyword.toLowerCase();

      return allTools.find((tool) => {
        const haystack = `${tool.name || ""} ${tool.id || ""} ${
          tool.category || ""
        } ${tool.description || ""}`.toLowerCase();

        return haystack.includes(query);
      });
    })
    .filter(Boolean);

  const fallback = allTools.filter((tool) => !matched.some((item) => item.id === tool.id));

  return getUniqueTools([...matched, ...fallback]).slice(0, limit);
}

export default function Home() {
  const pageTitle =
    "Free Online Tools for PDF, Images, Text & SEO | Next Online Tools";
  const pageDescription =
    "Use free browser-based tools for PDF files, images, text, Google Sheets, SEO, social media, converters, calculators, and everyday digital work.";

  const categories = useMemo(() => {
    const existingCategories = [...new Set(tools.map((tool) => tool.category).filter(Boolean))];
    const ordered = CATEGORY_ORDER.filter((category) => existingCategories.includes(category));
    const remaining = existingCategories.filter((category) => !ordered.includes(category));

    return [...ordered, ...remaining];
  }, []);

  const popularTools = useMemo(() => {
    const trendingTools = tools.filter((tool) => tool.trending);
    const priorityTools = findToolsByKeywords(tools, PRIORITY_TOOL_KEYWORDS, 12);

    return getUniqueTools([...trendingTools, ...priorityTools]).slice(0, 6);
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
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
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
          "PDF tools",
          "image tools",
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
        "@id": `${SITE_URL}/#popular-tools`,
        name: "Popular Free Online Tools",
        itemListElement: popularTools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.name,
          url: `${SITE_URL}/tool/${tool.id}`,
        })),
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/#tool-categories`,
        name: "Online Tool Categories",
        itemListElement: categoryHighlights.map((category, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: category.name,
          url: `${SITE_URL}/tools?category=${encodeURIComponent(category.name)}`,
        })),
      },
    ],
  };

  return (
    <main className="home-page">
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
          content="free online tools, PDF tools, image tools, text tools, Google Sheet tools, SEO tools, online converters, productivity tools"
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
      <section className="home-hero">
        <h1>{tools.length}+ free online tools for PDFs, images, text, and everyday work</h1>

        <p>
          A simple collection of browser-based tools for editing, converting,
          organizing, and cleaning up everyday files and content.
        </p>

        <div className="home-hero-actions">
          <Button to="/tools" className="home-primary-btn">
            Browse all tools
          </Button>
        </div>
      </section>

      {/* POPULAR TOOLS */}
      <section className="home-section" id="popular-tools">
        <div className="home-section-head">
          <div>
            <span>Popular</span>
            <h2>Popular tools</h2>
          </div>
        </div>

        <div className="home-tools-grid popular">
          {popularTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* CATEGORY CONTENT */}
      <section className="home-section">
        <div className="home-section-head">
          <div>
            <span>Browse</span>
            <h2>Browse by category</h2>
          </div>
        </div>

        <div className="home-category-grid">
          {categoryHighlights.map((category) => (
            <SmartLink
              key={category.name}
              to={`/tools?category=${encodeURIComponent(category.name)}`}
              className="home-category-chip"
              aria-label={`Browse ${category.name}`}
            >
              {category.name}
            </SmartLink>
          ))}
        </div>
      </section>

    </main>
  );
}
