import { useMemo } from "react";
import * as Icons from "lucide-react";
import { Helmet } from "react-helmet-async";

import tools from "../data/tools.json";
import { blogs } from "../data/Blogs";
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

const WORKFLOWS = [
  {
    icon: "ImagePlus",
    title: "Edit & optimize images",
    text: "Compress, resize, crop, convert, geotag, and prepare clean images for blogs, products, and social media.",
    to: "/tools?category=Image%20Tools",
  },
  {
    icon: "Files",
    title: "Work faster with PDF files",
    text: "Convert, merge, compress, organize, and manage PDF files online without heavy desktop software.",
    to: "/tools?category=PDF%20Tools",
  },
  {
    icon: "Sheet",
    title: "Clean sheets & lead data",
    text: "Extract hidden links, clean phone numbers, and format spreadsheet data so it is easier to copy and reuse.",
    to: "/tools?category=Spreadsheet%20Tools",
  },
  {
    icon: "PenLine",
    title: "Write, format & publish",
    text: "Use text, SEO, slug, and formatting helpers to prepare cleaner content for websites and social platforms.",
    to: "/tools?category=Text%20Tools",
  },
];

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

function InfoCard({ icon, title, text, to, label = "Explore" }) {
  const content = (
    <>
      <div className="home-tool-card-top">
        <HomeToolIcon icon={icon} />
      </div>

      <h3>{title}</h3>
      <p>{text}</p>

      <div className="home-tool-card-bottom">
        <span>{label}</span>

        <div aria-hidden="true">
          <Icons.ArrowRight size={17} />
        </div>
      </div>
    </>
  );

  if (!to) {
    return <article className="home-tool-card">{content}</article>;
  }

  return (
    <SmartLink to={to} className="home-tool-card" aria-label={title}>
      {content}
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

  const featuredTools = useMemo(() => {
    return findToolsByKeywords(tools, PRIORITY_TOOL_KEYWORDS, 8);
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

  const latestBlogs = useMemo(() => blogs.slice(0, 3), []);

  const trustPoints = [
    {
      icon: "BadgeCheck",
      title: "Free to start",
      text: "Open the tools you need and finish common digital tasks without complex setup.",
    },
    {
      icon: "MonitorSmartphone",
      title: "Browser-based",
      text: "Use tools from a modern desktop or mobile browser without installing heavy software.",
    },
    {
      icon: "ClipboardCheck",
      title: "Clean output",
      text: "Designed for practical copying, downloading, formatting, and reusing in real workflows.",
    },
    {
      icon: "Layers3",
      title: "Many categories",
      text: "Find tools for images, PDFs, text, sheets, SEO, colors, conversion, and productivity.",
    },
  ];

  const faqItems = [
    {
      question: "What is Next Online Tools?",
      answer:
        "Next Online Tools is a free online tools website for everyday digital tasks such as PDF work, image editing, text formatting, sheet data cleaning, SEO helpers, and file conversion.",
    },
    {
      question: "Are the tools free to use?",
      answer:
        "Yes. The tools are built to be free, simple, and easy to use for students, creators, marketers, freelancers, and daily office work.",
    },
    {
      question: "Do I need to install software?",
      answer:
        "No. Next Online Tools works in your browser, so you can complete many tasks without installing extra desktop software.",
    },
    {
      question: "Which tools are available on Next Online Tools?",
      answer:
        "You can find tools for images, PDFs, text, Google Sheets, SEO, colors, calculators, converters, social media, and other productivity tasks.",
    },
    {
      question: "Can I use these tools for work and business?",
      answer:
        "Yes. The tools are useful for small businesses, content creators, students, data entry work, lead generation, ecommerce images, blogs, and office productivity.",
    },
  ];

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
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
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
        <div className="home-hero-badge">
          <Icons.Sparkles size={16} />
          <span>Free browser-based tools for daily digital work</span>
        </div>

        <h1>
          {tools.length}+ Free Online Tools for PDF, Images, Text, SEO & Daily
          Work
        </h1>

        <p>
          Complete quick tasks in one place: edit images, compress files, convert
          PDFs, extract Google Sheet links, clean text, resize social media
          content, create QR codes, and prepare better website content.
        </p>

        <div className="home-hero-actions">
          <Button to="/tools" className="home-primary-btn">
            Browse All Tools
          </Button>

          <Button to="/tools?category=Image%20Tools" variant="secondary" className="home-secondary-btn">
            Start with Image Tools
          </Button>
        </div>

        <div className="home-hero-stats" aria-label="Next Online Tools summary">
          <div>
            <strong>{tools.length}+</strong>
            <span>Free tools</span>
          </div>
          <div>
            <strong>{categories.length}+</strong>
            <span>Categories</span>
          </div>
          <div>
            <strong>{blogs.length}+</strong>
            <span>Helpful guides</span>
          </div>
        </div>
      </section>

      {/* POPULAR TOOLS */}
      <section className="home-section" id="popular-tools">
        <div className="home-section-head home-section-head-row">
          <div>
            <span>Popular</span>
            <h2>Popular Free Online Tools</h2>
            <p>
              Start with the most useful tools for images, PDFs, spreadsheet
              cleanup, text formatting, QR codes, and daily productivity.
            </p>
          </div>

          <SmartLink to="/tools" className="home-secondary-btn home-view-btn">
            View All Tools
          </SmartLink>
        </div>

        <div className="home-tools-grid popular">
          {popularTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* WORKFLOWS */}
      <section className="home-section">
        <div className="home-section-head">
          <div>
            <span>Work by Task</span>
            <h2>What Do You Want to Do Today?</h2>
            <p>
              Choose a practical workflow and jump directly to the right group
              of tools instead of searching manually.
            </p>
          </div>
        </div>

        <div className="home-tools-grid featured">
          {WORKFLOWS.map((workflow) => (
            <InfoCard
              key={workflow.title}
              icon={workflow.icon}
              title={workflow.title}
              text={workflow.text}
              to={workflow.to}
              label="Open workflow"
            />
          ))}
        </div>
      </section>

      {/* CATEGORY CONTENT */}
      <section className="home-section">
        <div className="home-section-head">
          <div>
            <span>Browse Faster</span>
            <h2>Explore Tools by Category</h2>
            <p>
              Every category is organized around a real task, so users can find
              the right tool quickly and finish their work with fewer steps.
            </p>
          </div>
        </div>

        <div className="home-tools-grid featured">
          {categoryHighlights.map((category) => (
            <SmartLink
              key={category.name}
              to={`/tools?category=${encodeURIComponent(category.name)}`}
              className="home-tool-card"
              aria-label={`Browse ${category.name}`}
            >
              <div className="home-tool-card-top">
                <HomeToolIcon icon={category.icon} />

                {category.count > 0 && (
                  <span className="home-trending-badge">
                    {category.count} tools
                  </span>
                )}
              </div>

              <h3>{category.name}</h3>
              <p>{category.text}</p>

              <div className="home-tool-card-bottom">
                <span>Browse category</span>

                <div aria-hidden="true">
                  <Icons.ArrowRight size={17} />
                </div>
              </div>
            </SmartLink>
          ))}
        </div>
      </section>

      {/* FEATURED TOOLS */}
      <section className="home-section">
        <div className="home-section-head home-section-head-row">
          <div>
            <span>Featured</span>
            <h2>Featured Tools for Daily Work</h2>
            <p>
              A hand-picked set of high-value tools for common online tasks,
              content creation, business work, and productivity.
            </p>
          </div>

          <SmartLink to="/tools" className="home-secondary-btn home-view-btn">
            Discover More
          </SmartLink>
        </div>

        <div className="home-tools-grid featured">
          {featuredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} compact />
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="home-benefits">
        <div className="home-benefits-content">
          <div className="home-hero-badge">
            <Icons.HeartHandshake size={16} />
            <span>Why Next Online Tools?</span>
          </div>

          <h2>Simple Online Tools That Save Time in Real Workflows</h2>

          <p>
            Next Online Tools is built for people who need fast, clean, and
            practical solutions without complex software. Whether you are
            editing an image, preparing a PDF, cleaning spreadsheet data,
            writing content, creating social posts, or building a website, the
            goal is to help you finish small digital tasks with less confusion.
          </p>

          <div className="home-benefit-grid">
            {trustPoints.map((item) => {
              const Icon = Icons[item.icon] || Icons.Wrench;

              return (
                <div key={item.title} className="home-benefit-card">
                  <div className="home-benefit-icon" aria-hidden="true">
                    <Icon size={25} strokeWidth={2.2} />
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="home-section">
        <div className="home-section-head">
          <div>
            <span>Use Cases</span>
            <h2>Built for Students, Creators, Freelancers & Small Teams</h2>
            <p>
              Use Next Online Tools whenever you need a quick result without
              opening multiple websites or installing separate apps.
            </p>
          </div>
        </div>

        <div className="home-tools-grid featured">
          <InfoCard
            icon="GraduationCap"
            title="For students"
            text="Convert files, clean text, prepare images, create QR codes, and finish daily academic tasks faster."
            to="/tools"
            label="Find student tools"
          />
          <InfoCard
            icon="BriefcaseBusiness"
            title="For office work"
            text="Clean spreadsheet data, extract links, format text, manage PDFs, and prepare professional files."
            to="/tools?category=Spreadsheet%20Tools"
            label="Find office tools"
          />
          <InfoCard
            icon="Megaphone"
            title="For creators"
            text="Resize social images, edit photos, create thumbnails, format captions, and prepare content quickly."
            to="/tools?category=Social%20Media%20Tools"
            label="Find creator tools"
          />
          <InfoCard
            icon="ShoppingBag"
            title="For small business"
            text="Prepare product images, clean leads, format content, create website assets, and handle basic PDF work."
            to="/tools?category=Image%20Tools"
            label="Find business tools"
          />
        </div>
      </section>

      {/* BLOGS */}
      <section className="home-blog-section">
        <div className="home-section-head home-section-head-row">
          <div>
            <span>Guides & Tips</span>
            <h2>Latest Helpful Blogs</h2>
            <p>
              Learn how to use online tools better, avoid common mistakes, and
              finish digital tasks faster.
            </p>
          </div>

          <SmartLink to="/blog" className="home-secondary-btn home-view-btn">
            View All Blogs
          </SmartLink>
        </div>

        <div className="home-blog-grid">
          {latestBlogs.map((blog, index) => (
            <SmartLink
              key={blog.id || blog.slug || index}
              to={`/blog/${blog.slug}`}
              className="home-blog-card"
              aria-label={`Read ${blog.title}`}
            >
              <div className="home-blog-card-top">
                <span>{blog.category || "Guide"}</span>
                {blog.date && <small>{blog.date}</small>}
              </div>

              <h3>{blog.title}</h3>

              <p>
                {blog.excerpt ||
                  "Read this helpful guide and improve your online workflow."}
              </p>

              <strong>Read guide →</strong>
            </SmartLink>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="home-section">
        <div className="home-section-head">
          <div>
            <span>FAQ</span>
            <h2>Frequently Asked Questions</h2>
            <p>
              Quick answers about using Next Online Tools for everyday digital
              tasks.
            </p>
          </div>
        </div>

        <div className="home-tools-grid featured">
          {faqItems.map((item) => (
            <article key={item.question} className="home-tool-card">
              <div className="home-tool-card-top">
                <HomeToolIcon icon="CircleHelp" />
              </div>

              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
