import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import * as Icons from "lucide-react";
import { blogs } from "../data/Blogs";
import SmartLink from "../components/ui/SmartLink";
import "../styles/blog.css";

const SITE_URL = "https://nextonlinetools.com";
const BLOG_URL = `${SITE_URL}/blog`;
const TOOLS_URL = `${SITE_URL}/tools`;
const CONTACT_URL = `${SITE_URL}/contact`;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const FEATURED_CATEGORY_ORDER = [
  "Image Tools",
  "PDF Tools",
  "Text Tools",
  "SEO Tools",
  "Spreadsheet Tools",
  "Social Media Tools",
  "Productivity Tools",
  "Converter Tools",
];

const CATEGORY_ICONS = {
  "Image Tools": "Image",
  "PDF Tools": "FileText",
  "Text Tools": "Pilcrow",
  "SEO Tools": "SearchCheck",
  "Spreadsheet Tools": "Table2",
  "Social Media Tools": "Share2",
  "Productivity Tools": "Zap",
  "Converter Tools": "RefreshCw",
};

const READING_PATHS = [
  {
    title: "Optimize files",
    description: "Compress, resize, convert, and prepare images or PDFs for upload.",
    icon: "Sparkles",
  },
  {
    title: "Publish better",
    description: "Format content, create slugs, and prepare clean assets for websites.",
    icon: "Rocket",
  },
  {
    title: "Work faster",
    description: "Use quick tools for spreadsheets, text, social content, and daily tasks.",
    icon: "Clock3",
  },
];

const FAQ_ITEMS = [
  {
    question: "What is the Next Online Tools Blog about?",
    answer:
      "The blog shares practical guides about free online tools, image tools, PDF tools, text tools, SEO tools, converters, productivity tips, and everyday digital tasks.",
  },
  {
    question: "Who are these guides for?",
    answer:
      "The guides are written for students, creators, marketers, developers, office users, small business owners, and everyday internet users who want to finish digital work faster.",
  },
  {
    question: "Are the tools mentioned in the blog free?",
    answer:
      "Next Online Tools focuses on simple, free, browser-based tools for common digital tasks, so readers can follow the guides and try the related tools online.",
  },
];

function normalizeText(value) {
  return String(value || "").trim();
}

function getBlogDateTime(blog) {
  const dateValue = blog?.date || blog?.publishedAt || blog?.updatedAt;

  if (!dateValue) return 0;

  const time = new Date(dateValue).getTime();

  return Number.isNaN(time) ? 0 : time;
}

function formatDate(blog) {
  const dateValue = blog?.date || blog?.publishedAt;

  if (!dateValue) return "Guide";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getBlogPath({ category = "", page = 1 } = {}) {
  const params = new URLSearchParams();

  if (category) params.set("category", category);
  if (page > 1) params.set("page", page);

  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}

function getIcon(iconName, fallback = "FileText") {
  return Icons[iconName] || Icons[fallback] || Icons.FileText;
}

function CategoryIcon({ category }) {
  const IconComponent = getIcon(CATEGORY_ICONS[category], "FolderOpen");

  return <IconComponent size={15} strokeWidth={2.2} aria-hidden="true" />;
}

function BlogCard({ blog, variant = "default" }) {
  const isSpotlight = variant === "spotlight";

  return (
    <SmartLink
      to={`/blog/${blog.slug}`}
      className={isSpotlight ? "blog-card blog-card-spotlight" : "blog-card"}
      aria-label={`Read ${blog.title}`}
    >
      <div className="blog-card-meta-row">
        <span className="blog-card-category">
          <CategoryIcon category={blog.category} />
          {blog.category || "Guide"}
        </span>
        <time>{formatDate(blog)}</time>
      </div>

      <div className="blog-card-body">
        <div className="blog-card-icon" aria-hidden="true">
          <Icons.FileText size={isSpotlight ? 26 : 22} strokeWidth={2.15} />
        </div>

        <div>
          <h3>{blog.title}</h3>
          <p>{blog.excerpt || "Read this helpful guide from Next Online Tools."}</p>
        </div>
      </div>

      <div className="blog-card-footer">
        <span>{isSpotlight ? "Read featured guide" : "Read guide"}</span>
        <Icons.ArrowRight size={16} strokeWidth={2.3} aria-hidden="true" />
      </div>
    </SmartLink>
  );
}

export default function Blog() {
  const location = useLocation();

  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const selectedCategory = normalizeText(queryParams.get("category"));

  const latestBlogs = useMemo(() => {
    return [...blogs].sort((a, b) => {
      const dateDifference = getBlogDateTime(b) - getBlogDateTime(a);

      if (dateDifference !== 0) {
        return dateDifference;
      }

      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        latestBlogs.map((blog) => normalizeText(blog.category)).filter(Boolean)
      ),
    ];

    return uniqueCategories.sort((a, b) => {
      const aIndex = FEATURED_CATEGORY_ORDER.indexOf(a);
      const bIndex = FEATURED_CATEGORY_ORDER.indexOf(b);

      if (aIndex !== -1 || bIndex !== -1) {
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      }

      return a.localeCompare(b);
    });
  }, [latestBlogs]);

  const categoryCounts = useMemo(() => {
    return latestBlogs.reduce((counts, blog) => {
      const category = normalizeText(blog.category);

      if (!category) return counts;

      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});
  }, [latestBlogs]);

  const filteredBlogs = useMemo(() => {
    if (!selectedCategory) return latestBlogs;

    return latestBlogs.filter(
      (blog) => normalizeText(blog.category) === selectedCategory
    );
  }, [latestBlogs, selectedCategory]);

  const pageSize = 9;

  const pageNumber = useMemo(() => {
    const page = Number.parseInt(queryParams.get("page"), 10);

    if (Number.isNaN(page) || page < 1) {
      return 1;
    }

    return page;
  }, [queryParams]);

  const pageCount = Math.max(1, Math.ceil(filteredBlogs.length / pageSize));
  const currentPage = Math.min(pageNumber, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBlogs = filteredBlogs.slice(startIndex, startIndex + pageSize);
  const pageStart = filteredBlogs.length > 0 ? startIndex + 1 : 0;
  const pageEnd = Math.min(filteredBlogs.length, startIndex + pageSize);
  const spotlightBlog = currentPage === 1 ? paginatedBlogs[0] : null;
  const gridBlogs = spotlightBlog
    ? paginatedBlogs.filter((blog) => blog.slug !== spotlightBlog.slug)
    : paginatedBlogs;

  const canonicalUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (selectedCategory) params.set("category", selectedCategory);
    if (currentPage > 1) params.set("page", currentPage);

    return `${BLOG_URL}${params.toString() ? `?${params.toString()}` : ""}`;
  }, [currentPage, selectedCategory]);

  const seoTitle = selectedCategory
    ? `${selectedCategory} Guides | Next Online Tools Blog`
    : "Online Tools Blog | SEO, Image, PDF & Productivity Guides";

  const seoDescription = selectedCategory
    ? `Read helpful ${selectedCategory.toLowerCase()} guides from Next Online Tools and learn how to complete everyday digital tasks faster.`
    : "Read helpful guides from Next Online Tools about free online tools, image tools, PDF tools, text tools, SEO tools, converters, productivity tips, and everyday digital tasks.";

  const blogItems = useMemo(() => {
    return filteredBlogs.map((blog, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: blog.title,
      url: `${SITE_URL}/blog/${blog.slug}`,
      description:
        blog.excerpt ||
        "Helpful guide from Next Online Tools for using free online tools better.",
    }));
  }, [filteredBlogs]);

  const blogPosts = useMemo(() => {
    return filteredBlogs.map((blog) => ({
      "@type": "BlogPosting",
      headline: blog.title,
      description:
        blog.excerpt ||
        "Helpful guide from Next Online Tools for using free online tools better.",
      url: `${SITE_URL}/blog/${blog.slug}`,
      datePublished: blog.date || blog.publishedAt,
      dateModified: blog.updatedAt || blog.date || blog.publishedAt,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${SITE_URL}/blog/${blog.slug}`,
      },
      author: {
        "@type": "Organization",
        name: "Next Online Tools",
        url: SITE_URL,
      },
      publisher: {
        "@type": "Organization",
        name: "Next Online Tools",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: DEFAULT_OG_IMAGE,
        },
      },
      articleSection: blog.category || "Online Tools",
      inLanguage: "en",
    }));
  }, [filteredBlogs]);

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
        name: "Blog",
        item: BLOG_URL,
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
            target: `${TOOLS_URL}?search={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "Next Online Tools",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: DEFAULT_OG_IMAGE,
          },
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            areaServed: "Worldwide",
            availableLanguage: ["English"],
            url: CONTACT_URL,
          },
        },
        {
          "@type": "Blog",
          "@id": `${canonicalUrl}#blog`,
          name: selectedCategory
            ? `${selectedCategory} Guides | Next Online Tools Blog`
            : "Next Online Tools Blog",
          url: canonicalUrl,
          description: seoDescription,
          publisher: {
            "@id": `${SITE_URL}/#organization`,
          },
          blogPost: blogPosts,
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
          about:
            selectedCategory ||
            "Online tools guides, tutorials, SEO tips, image tools, PDF tools, text tools, converters, and productivity tips",
          inLanguage: "en",
          mainEntity: {
            "@type": "ItemList",
            name: selectedCategory
              ? `${selectedCategory} Blog Articles`
              : "Next Online Tools Blog Articles",
            numberOfItems: filteredBlogs.length,
            itemListOrder: "https://schema.org/ItemListOrderDescending",
            itemListElement: blogItems,
          },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${canonicalUrl}#breadcrumb`,
          itemListElement: breadcrumbItems,
        },
        {
          "@type": "FAQPage",
          "@id": `${canonicalUrl}#faq`,
          mainEntity: FAQ_ITEMS.map((item) => ({
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
  }, [blogItems, blogPosts, canonicalUrl, filteredBlogs.length, selectedCategory, seoDescription, seoTitle]);

  const totalArticleLabel = `${filteredBlogs.length} article${filteredBlogs.length === 1 ? "" : "s"}`;
  const heroTitle = selectedCategory
    ? `${selectedCategory} guides for faster digital work`
    : "Smart guides for faster online work";
  const heroDescription = selectedCategory
    ? `Explore focused ${selectedCategory.toLowerCase()} tutorials, practical tips, and tool workflows from Next Online Tools.`
    : "Learn how to compress, convert, format, publish, and clean up daily work with simple browser-based tools.";

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>

        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <meta name="bingbot" content="index, follow, max-image-preview:large, max-snippet:-1" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Next Online Tools" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:image:alt" content="Next Online Tools Blog" />
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

      <main className="blog-page">
        <nav className="blog-breadcrumb" aria-label="Breadcrumb">
          <SmartLink to="/">Home</SmartLink>
          <Icons.ChevronRight size={14} aria-hidden="true" />
          <SmartLink to="/blog">Blog</SmartLink>
          {selectedCategory && (
            <>
              <Icons.ChevronRight size={14} aria-hidden="true" />
              <span>{selectedCategory}</span>
            </>
          )}
        </nav>

        <section className="blog-hero">
          <div className="blog-hero-content">
            <div className="blog-kicker">
              <Icons.BookOpen size={16} aria-hidden="true" />
              <span>Next Online Tools Journal</span>
            </div>

            <h1>{heroTitle}</h1>
            <p>{heroDescription}</p>

            <div className="blog-hero-actions">
              <a href="#latest-guides" className="blog-primary-btn">
                Read latest guides
                <Icons.ArrowDown size={16} />
              </a>
              <SmartLink to="/tools" className="blog-secondary-btn">
                Browse free tools
              </SmartLink>
            </div>
          </div>

          <aside className="blog-hero-panel" aria-label="Blog highlights">
            <div className="blog-hero-panel-top">
              <Icons.Sparkles size={22} aria-hidden="true" />
              <span>{totalArticleLabel}</span>
            </div>

            <strong>Practical, clean, workflow-first tutorials.</strong>
            <p>
              Every guide is written to help readers choose a tool, understand
              the task, and finish digital work faster.
            </p>

            {spotlightBlog && (
              <SmartLink to={`/blog/${spotlightBlog.slug}`} className="blog-hero-latest">
                <span>Latest guide</span>
                <strong>{spotlightBlog.title}</strong>
              </SmartLink>
            )}
          </aside>
        </section>

        <section className="blog-layout">
          <aside className="blog-sidebar" aria-label="Blog navigation">
            <div className="blog-sidebar-card">
              <div className="blog-sidebar-head">
                <span>Topics</span>
                <strong>Guide categories</strong>
              </div>

              <div className="blog-category-list">
                <SmartLink
                  to="/blog"
                  className={!selectedCategory ? "active" : ""}
                  aria-current={!selectedCategory ? "page" : undefined}
                >
                  <span>
                    <Icons.LayoutGrid size={15} aria-hidden="true" />
                    All guides
                  </span>
                  <small>{latestBlogs.length}</small>
                </SmartLink>

                {categories.map((category) => (
                  <SmartLink
                    key={category}
                    to={getBlogPath({ category })}
                    className={selectedCategory === category ? "active" : ""}
                    aria-current={selectedCategory === category ? "page" : undefined}
                  >
                    <span>
                      <CategoryIcon category={category} />
                      {category.replace(" Tools", "")}
                    </span>
                    <small>{categoryCounts[category] || 0}</small>
                  </SmartLink>
                ))}
              </div>
            </div>

            <div className="blog-sidebar-card blog-reading-paths">
              <div className="blog-sidebar-head">
                <span>Paths</span>
                <strong>Quick reading flows</strong>
              </div>

              {READING_PATHS.map((path) => {
                const IconComponent = getIcon(path.icon, "Sparkles");

                return (
                  <article key={path.title}>
                    <IconComponent size={18} aria-hidden="true" />
                    <div>
                      <h3>{path.title}</h3>
                      <p>{path.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </aside>

          <div className="blog-content">
            {spotlightBlog && (
              <section className="blog-spotlight-section">
                <div className="blog-section-head">
                  <div>
                    <span>{selectedCategory ? "Featured topic" : "Featured guide"}</span>
                    <h2>{selectedCategory || "Editor’s pick"}</h2>
                  </div>
                </div>

                <BlogCard blog={spotlightBlog} variant="spotlight" />
              </section>
            )}

            <section className="blog-list-section" id="latest-guides">
              <div className="blog-section-head blog-results-head">
                <div>
                  <span>Latest articles</span>
                  <h2>{selectedCategory || "Helpful blog articles"}</h2>
                </div>

                <p>
                  Showing {pageStart}-{pageEnd} of {filteredBlogs.length} article
                  {filteredBlogs.length !== 1 ? "s" : ""}
                </p>
              </div>

              {filteredBlogs.length === 0 ? (
                <div className="blog-empty">
                  <Icons.SearchX size={32} aria-hidden="true" />
                  <h3>No articles found</h3>
                  <p>Try another category or browse all blog guides.</p>
                  <SmartLink to="/blog" className="blog-primary-btn">
                    View all guides
                  </SmartLink>
                </div>
              ) : (
                <div className="blog-grid">
                  {gridBlogs.map((blog) => (
                    <BlogCard key={blog.slug} blog={blog} />
                  ))}
                </div>
              )}

              <div className="blog-pagination">
                <p>
                  Page <strong>{currentPage}</strong> of <strong>{pageCount}</strong>
                </p>

                <div>
                  {currentPage > 1 && (
                    <SmartLink
                      to={getBlogPath({
                        category: selectedCategory,
                        page: currentPage - 1,
                      })}
                      className="blog-secondary-btn"
                    >
                      <Icons.ChevronLeft size={16} />
                      Previous
                    </SmartLink>
                  )}

                  {currentPage < pageCount && (
                    <SmartLink
                      to={getBlogPath({
                        category: selectedCategory,
                        page: currentPage + 1,
                      })}
                      className="blog-primary-btn"
                    >
                      Next
                      <Icons.ChevronRight size={16} />
                    </SmartLink>
                  )}
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="blog-cta-section">
          <div>
            <span>Need a tool?</span>
            <h2>Read the guide, then use the tool.</h2>
            <p>
              Next Online Tools connects practical articles with free browser-based
              tools, so visitors can learn the task and complete it from one place.
            </p>
          </div>

          <SmartLink to="/tools" className="blog-primary-btn">
            Browse tools
            <Icons.ArrowRight size={16} />
          </SmartLink>
        </section>

        <section className="blog-faq-section">
          <div className="blog-section-head">
            <div>
              <span>Quick answers</span>
              <h2>Online Tools Blog FAQ</h2>
            </div>
          </div>

          <div className="blog-faq-grid">
            {FAQ_ITEMS.map((item) => (
              <article key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
