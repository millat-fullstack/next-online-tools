import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import * as Icons from "lucide-react";
import { blogs } from "../data/Blogs";

const SITE_URL = "https://nextonlinetools.com";
const BLOG_URL = `${SITE_URL}/blog`;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export default function Blog() {
  const categories = useMemo(() => {
    return [...new Set(blogs.map((blog) => blog.category).filter(Boolean))];
  }, []);

  const seoTitle =
    "Online Tools Blog | Free Web Tools Guides, SEO, Image, PDF & Productivity Tips";

  const seoDescription =
    "Read helpful guides from Next Online Tools. Learn how to use free online tools for images, PDF, text, SEO, converters, productivity, and everyday digital tasks faster and easier.";

  const seoKeywords = useMemo(() => {
    const baseKeywords = [
      "online tools blog",
      "free online tools blog",
      "online tools guide",
      "free web tools guide",
      "image tools guide",
      "pdf tools guide",
      "seo tools guide",
      "text tools guide",
      "converter tools guide",
      "productivity tools guide",
      "browser based tools",
      "digital tools tips",
      "next online tools blog",
      "how to use online tools",
      "free tools for daily work",
    ];

    const categoryKeywords = categories.flatMap((category) => [
      `${category} blog`,
      `${category} guide`,
      `${category} tools guide`,
      `free ${category} tools`,
    ]);

    const blogTitleKeywords = blogs
      .map((blog) => blog.title)
      .filter(Boolean);

    return [...new Set([...baseKeywords, ...categoryKeywords, ...blogTitleKeywords])].join(
      ", "
    );
  }, [categories]);

  const structuredData = useMemo(() => {
    const blogItems = blogs.map((blog, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: blog.title,
      url: `${SITE_URL}/blog/${blog.slug}`,
      description:
        blog.excerpt ||
        "Helpful guide from Next Online Tools for using free online tools better.",
    }));

    const blogPosts = blogs.map((blog) => ({
      "@type": "BlogPosting",
      headline: blog.title,
      description:
        blog.excerpt ||
        "Helpful guide from Next Online Tools for using free online tools better.",
      url: `${SITE_URL}/blog/${blog.slug}`,
      mainEntityOfPage: `${SITE_URL}/blog/${blog.slug}`,
      author: {
        "@type": "Organization",
        name: "Next Online Tools",
      },
      publisher: {
        "@type": "Organization",
        name: "Next Online Tools",
        url: SITE_URL,
      },
      articleSection: blog.category || "Online Tools",
      inLanguage: "en",
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
          "@type": "Blog",
          "@id": `${BLOG_URL}#blog`,
          name: "Next Online Tools Blog",
          url: BLOG_URL,
          description: seoDescription,
          publisher: {
            "@type": "Organization",
            name: "Next Online Tools",
            url: SITE_URL,
          },
          blogPost: blogPosts,
        },
        {
          "@type": "CollectionPage",
          "@id": `${BLOG_URL}#webpage`,
          url: BLOG_URL,
          name: seoTitle,
          description: seoDescription,
          isPartOf: {
            "@id": `${SITE_URL}/#website`,
          },
          inLanguage: "en",
          about: "Online tools guides, tutorials, SEO tips, image tools, PDF tools, and productivity tools",
          mainEntity: {
            "@type": "ItemList",
            name: "Next Online Tools Blog Posts",
            numberOfItems: blogs.length,
            itemListElement: blogItems,
          },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${BLOG_URL}#breadcrumb`,
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
              name: "Blog",
              item: BLOG_URL,
            },
          ],
        },
      ],
    };
  }, [seoDescription, seoTitle]);

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>

        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="googlebot" content="index, follow, max-image-preview:large" />
        <meta name="bingbot" content="index, follow, max-image-preview:large" />

        <link rel="canonical" href={BLOG_URL} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Next Online Tools" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={BLOG_URL} />
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

      <main className="tools-page">
        {/* HERO */}
        <section className="tools-hero">
          <div className="tools-hero-badge">
            <Icons.BookOpen size={16} />
            <span>Helpful Guides</span>
          </div>

          <h1>Online Tools Blog</h1>

          <p>
            Learn how to use free online tools better for images, PDF, text,
            SEO, converters, productivity, and daily digital work.
          </p>
        </section>

        {/* BLOGS */}
        <section className="tools-list-section">
          <div className="tools-section-head">
            <div>
              <span>Latest Guides</span>
              <h2>Helpful Blog Articles</h2>
            </div>

            <p>
              {blogs.length} article
              {blogs.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="tools-grid">
            {blogs.map((blog) => (
              <Link
                key={blog.slug}
                to={`/blog/${blog.slug}`}
                className="tool-card"
              >
                <div className="tool-card-top">
                  <div className="tools-icon">
                    <Icons.FileText size={26} strokeWidth={2.1} />
                  </div>

                  {blog.category && (
                    <span className="tool-trending">
                      <Icons.Sparkles size={13} />
                      {blog.category}
                    </span>
                  )}
                </div>

                <h3>{blog.title}</h3>

                <p>
                  {blog.excerpt ||
                    "Read this helpful guide from Next Online Tools."}
                </p>

                <div className="tool-card-bottom">
                  <span>{blog.category || "Guide"}</span>

                  <div>
                    <Icons.ArrowRight size={17} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}