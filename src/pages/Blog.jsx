import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import * as Icons from "lucide-react";
import { blogs } from "../data/Blogs";

const SITE_URL = "https://nextonlinetools.com";
const BLOG_URL = `${SITE_URL}/blog`;
const TOOLS_URL = `${SITE_URL}/tools`;
const CONTACT_URL = `${SITE_URL}/contact`;
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export default function Blog() {
  const categories = useMemo(() => {
    return [...new Set(blogs.map((blog) => blog.category).filter(Boolean))];
  }, []);

  const latestBlogs = useMemo(() => {
    return [...blogs];
  }, []);

  const seoTitle =
    "Online Tools Blog | Free Web Tools Guides, SEO, Image, PDF & Productivity Tips";

  const seoDescription =
    "Read helpful guides from Next Online Tools about free online tools, image tools, PDF tools, text tools, SEO tools, converters, productivity tips, and everyday digital tasks.";

  const blogItems = useMemo(() => {
    return latestBlogs.map((blog, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: blog.title,
      url: `${SITE_URL}/blog/${blog.slug}`,
      description:
        blog.excerpt ||
        "Helpful guide from Next Online Tools for using free online tools better.",
    }));
  }, [latestBlogs]);

  const blogPosts = useMemo(() => {
    return latestBlogs.map((blog) => ({
      "@type": "BlogPosting",
      headline: blog.title,
      description:
        blog.excerpt ||
        "Helpful guide from Next Online Tools for using free online tools better.",
      url: `${SITE_URL}/blog/${blog.slug}`,
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
  }, [latestBlogs]);

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
          "@type": "Blog",
          "@id": `${BLOG_URL}#blog`,
          name: "Next Online Tools Blog",
          url: BLOG_URL,
          description: seoDescription,
          publisher: {
            "@id": `${SITE_URL}/#organization`,
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
          about:
            "Online tools guides, tutorials, SEO tips, image tools, PDF tools, text tools, converters, and productivity tips",
          inLanguage: "en",
          mainEntity: {
            "@type": "ItemList",
            name: "Next Online Tools Blog Articles",
            numberOfItems: latestBlogs.length,
            itemListOrder: "https://schema.org/ItemListOrderDescending",
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
        {
          "@type": "FAQPage",
          "@id": `${BLOG_URL}#faq`,
          mainEntity: [
            {
              "@type": "Question",
              name: "What is the Next Online Tools Blog about?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "The Next Online Tools Blog shares helpful guides about free online tools, image tools, PDF tools, text tools, SEO tools, converters, productivity tips, and everyday digital tasks.",
              },
            },
            {
              "@type": "Question",
              name: "Who can use these blog guides?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "These guides are useful for students, creators, marketers, developers, office users, small business owners, and everyday internet users who want to complete digital tasks faster.",
              },
            },
            {
              "@type": "Question",
              name: "Are the tools mentioned in the blog free?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Next Online Tools focuses on simple, free, browser-based tools for common digital tasks.",
              },
            },
          ],
        },
      ],
    };
  }, [blogItems, blogPosts, latestBlogs.length, seoDescription, seoTitle]);

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>

        <meta name="description" content={seoDescription} />
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
            SEO, converters, productivity, and everyday digital work.
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
              {latestBlogs.length} article
              {latestBlogs.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {latestBlogs.map((blog) => (
              <Link
                key={blog.slug}
                to={`/blog/${blog.slug}`}
                className="tool-card"
                aria-label={`Read ${blog.title}`}
              >
                <div className="tool-card-top">
                  <div className="tools-icon">
                    <Icons.FileText size={26} strokeWidth={2.1} />
                  </div>
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

        {/* WHY READ */}
        <section className="tools-list-section">
          <div className="tools-section-head">
            <div>
              <span>Why Read Our Blog</span>
              <h2>Guides for faster online work</h2>
            </div>

            <p>Simple tips for common digital tasks.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="tool-card">
              <div className="tool-card-top">
                <div className="tools-icon">
                  <Icons.Lightbulb size={26} strokeWidth={2.1} />
                </div>
              </div>

              <h3>Practical Guides</h3>

              <p>
                Learn how to complete everyday tasks with simple online tools
                instead of complicated software.
              </p>

              <div className="tool-card-bottom">
                <span>Helpful Tips</span>
                <div>
                  <Icons.Lightbulb size={17} />
                </div>
              </div>
            </div>

            <div className="tool-card">
              <div className="tool-card-top">
                <div className="tools-icon">
                  <Icons.Zap size={26} strokeWidth={2.1} />
                </div>
              </div>

              <h3>Faster Workflow</h3>

              <p>
                Discover easier ways to handle image, PDF, text, SEO,
                conversion, and productivity tasks online.
              </p>

              <div className="tool-card-bottom">
                <span>Productivity</span>
                <div>
                  <Icons.Zap size={17} />
                </div>
              </div>
            </div>

            <div className="tool-card">
              <div className="tool-card-top">
                <div className="tools-icon">
                  <Icons.Globe2 size={26} strokeWidth={2.1} />
                </div>
              </div>

              <h3>Browser-Based Learning</h3>

              <p>
                Read guides focused on tools that work directly in your browser
                for quick and easy digital work.
              </p>

              <div className="tool-card-bottom">
                <span>Online Tools</span>
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
              <h2>Online Tools Blog FAQ</h2>
            </div>

            <p>Helpful answers for blog readers.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-2">
                What is this blog about?
              </h3>

              <p className="text-sm text-[var(--text-secondary)] leading-6">
                This blog shares helpful guides about free online tools, image
                tools, PDF tools, text tools, SEO tools, converters,
                productivity tips, and everyday digital tasks.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-2">
                Who are these guides for?
              </h3>

              <p className="text-sm text-[var(--text-secondary)] leading-6">
                The guides are useful for students, creators, marketers,
                developers, office users, small business owners, and everyday
                internet users.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-2">
                Are the tools free?
              </h3>

              <p className="text-sm text-[var(--text-secondary)] leading-6">
                Next Online Tools focuses on simple, free, browser-based tools
                for common digital tasks.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}