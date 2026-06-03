import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import tools from "../data/tools.json";
import { blogs } from "../data/Blogs";
import { Helmet } from "react-helmet-async";
import Button from "../components/ui/Button";

const SITE_URL = "https://nextonlinetools.com";

function HomeToolIcon({ icon }) {
  const IconComponent = Icons[icon] || Icons.Wrench;

  return (
    <div className="home-tool-icon" aria-hidden="true">
      <IconComponent size={26} strokeWidth={2.1} />
    </div>
  );
}

function ToolCard({ tool, compact = false }) {
  return (
    <Link
      to={`/tool/${tool.id}/`}
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
        {tool.description || "Simple, fast, and free online tool for daily use."}
      </p>

      {!compact && (
        <div className="home-tool-card-bottom">
          <span>{tool.category || "Online Tool"}</span>
          <div aria-hidden="true">
            <Icons.ArrowRight size={17} />
          </div>
        </div>
      )}
    </Link>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const pageTitle = "Next Online Tools: Free PDF, Image, Text & Web Tools";
  const pageDescription =
    "Use free online tools for PDF, image, text, color, converters, calculators, SEO, and everyday digital tasks. Fast, simple, and privacy-friendly tools from Next Online Tools.";

  const featuredTools = useMemo(() => tools.slice(0, 8), []);
  const popularTools = useMemo(() => tools.slice(0, 6), []);

  const categories = useMemo(() => {
    return [...new Set(tools.map((tool) => tool.category).filter(Boolean))].slice(
      0,
      8
    );
  }, []);

  const categoryHighlights = useMemo(() => {
    const descriptions = {
      "Image Tools":
        "Resize, compress, convert, crop, and edit images online for websites, social media, and daily work.",
      "PDF Tools":
        "Convert, compress, edit, merge, and manage PDF files directly from your browser.",
      "Text Tools":
        "Format, clean, count, edit, and improve text for writing, social media, and productivity.",
      "Color Tools":
        "Pick colors, generate palettes, copy color codes, and create better visual designs.",
      "SEO Tools":
        "Use simple SEO helpers for content, keywords, formatting, and website optimization.",
      "Converter Tools":
        "Convert files, units, text, images, and other digital content quickly online.",
    };

    return categories.map((category) => ({
      name: category,
      text:
        descriptions[category] ||
        `Explore free ${category.toLowerCase()} to complete everyday digital tasks faster.`,
    }));
  }, [categories]);

  const benefits = [
    {
      icon: "Zap",
      title: "Fast Online Solutions",
      text: "Complete common online tasks quickly without installing heavy software.",
    },
    {
      icon: "MousePointerClick",
      title: "Simple User Experience",
      text: "Clean layouts, clear actions, and beginner-friendly tools for everyone.",
    },
    {
      icon: "ShieldCheck",
      title: "Privacy-Friendly Tools",
      text: "Tools are designed to be simple, safe, and practical for everyday use.",
    },
    {
      icon: "Layers",
      title: "Many Useful Categories",
      text: "Find tools for images, PDFs, text, color, SEO, converters, and productivity.",
    },
  ];

  const faqItems = [
    {
      question: "What is Next Online Tools?",
      answer:
        "Next Online Tools is a free online tools website that helps users complete everyday digital tasks such as image editing, PDF work, text formatting, color picking, file conversion, and productivity tasks.",
    },
    {
      question: "Are the tools free to use?",
      answer:
        "Yes. Next Online Tools is built to provide free, fast, and easy-to-use online tools for daily digital work.",
    },
    {
      question: "Do I need to install any software?",
      answer:
        "No. The tools run online in your browser, so you can use them without installing extra software.",
    },
    {
      question: "What type of tools can I find here?",
      answer:
        "You can find image tools, PDF tools, text tools, color tools, converter tools, SEO tools, calculators, and other useful web tools.",
    },
  ];

  function handleSearch(e) {
    e.preventDefault();

    if (!search.trim()) return;

    navigate(`/search/?q=${encodeURIComponent(search.trim())}`);
  }

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
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/search/?q={search_term_string}`,
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
        about: [
          "free online tools",
          "PDF tools",
          "image tools",
          "text tools",
          "color tools",
          "converter tools",
          "SEO tools",
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
          url: `${SITE_URL}/tool/${tool.id}/`,
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

        <meta property="og:site_name" content="Next Online Tools" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta
          property="og:image"
          content={`${SITE_URL}/images/home-page-banner.png`}
        />
        <meta
          property="og:image:alt"
          content="Next Online Tools free online tools homepage"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta
          name="twitter:image"
          content={`${SITE_URL}/images/home-page-banner.png`}
        />

        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-badge">
          <Icons.Sparkles size={16} />
          <span>100% Free, Fast & Easy Online Tools</span>
        </div>

        <h1>{tools.length}+ Free Online Tools for Everyday Digital Tasks</h1>

        <p>
          Next Online Tools helps you complete quick digital tasks with free
          tools for PDF files, images, text formatting, colors, converters,
          calculators, SEO, productivity, and more — all in one simple place.
        </p>

        <div className="home-hero-actions">
          <Button to="/tools/" className="home-primary-btn">
            Browse All Tools
          </Button>

          <Button to="/blog/" variant="secondary" className="home-secondary-btn">
            Helpful Blogs
          </Button>
        </div>
      </section>

      {/* POPULAR TOOLS */}
      <section className="home-section">
        <div className="home-section-head home-section-head-row">
          <div>
            <span>Popular</span>
            <h2>Popular Free Online Tools</h2>
            <p>Most useful tools to complete common online tasks quickly.</p>
          </div>

          <Link to="/tools/" className="home-secondary-btn home-view-btn">
            View All Tools
          </Link>
        </div>

        <div className="home-tools-grid popular">
          {popularTools.map((tool, index) => (
            <ToolCard key={tool.id || index} tool={tool} />
          ))}
        </div>
      </section>

      {/* CATEGORY CONTENT */}
      <section className="home-section">
        <div className="home-section-head">
          <div>
            <span>Browse Faster</span>
            <h2>Choose the Right Tool for Your Task</h2>
            <p>
              Every category is organized to help users find the right tool
              quickly and complete their work with fewer steps.
            </p>
          </div>
        </div>

        <div className="home-tools-grid featured">
          {categoryHighlights.slice(0, 6).map((category) => (
            <Link
              key={category.name}
              to={`/tools/?category=${encodeURIComponent(category.name)}`}
              className="home-tool-card"
            >
              <div className="home-tool-card-top">
                <HomeToolIcon icon="FolderOpen" />
              </div>

              <h3>{category.name}</h3>
              <p>{category.text}</p>

              <div className="home-tool-card-bottom">
                <span>Browse category</span>
                <div aria-hidden="true">
                  <Icons.ArrowRight size={17} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED TOOLS */}
      <section className="home-section">
        <div className="home-section-head">
          <div>
            <span>Featured</span>
            <h2>Featured Free Tools</h2>
            <p>
              Carefully selected free tools for quick, simple, and practical
              online work.
            </p>
          </div>
        </div>

        <div className="home-tools-grid featured">
          {featuredTools.map((tool, index) => (
            <ToolCard key={tool.id || index} tool={tool} compact />
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

          <h2>Free, Fast & User-Friendly Tools for Daily Digital Tasks</h2>

          <p>
            Next Online Tools is built for people who need quick online
            solutions without complex software. Whether you want to resize an
            image, convert a file, format text, pick colors, calculate values,
            or improve your workflow, the website gives you simple tools that
            are easy to access from any modern browser.
          </p>

          <div className="home-benefit-grid">
            {benefits.map((item) => {
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

      {/* BLOGS */}
      <section className="home-blog-section">
        <div className="home-section-head home-section-head-row">
          <div>
            <span>Guides & Tips</span>
            <h2>Latest Helpful Blogs</h2>
            <p>
              Learn how to use online tools better and finish digital tasks
              faster.
            </p>
          </div>

          <Link to="/blog/" className="home-secondary-btn home-view-btn">
            View All Blogs
          </Link>
        </div>

        <div className="home-blog-grid">
          {blogs.slice(0, 3).map((blog, index) => (
            <Link
              key={blog.id || blog.slug || index}
              to={`/blog/${blog.slug}/`}
              className="home-blog-card"
            >
              <div className="home-blog-card-top">
                <span>{blog.category || "Blog"}</span>
                <small>{blog.date}</small>
              </div>

              <h3>{blog.title}</h3>

              <p>
                {blog.excerpt ||
                  "Read this helpful guide for better online workflow."}
              </p>

              <strong>Read guide →</strong>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ - using existing card/grid classes from index.css */}
      <section className="home-section">
        <div className="home-section-head">
          <div>
            <span>FAQ</span>
            <h2>Frequently Asked Questions</h2>
            <p>
              Quick answers about using Next Online Tools for daily online
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