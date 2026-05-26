import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import tools from "../data/tools.json";
import { blogs } from "../data/Blogs";
import { Helmet } from "react-helmet-async";

function HomeToolIcon({ icon }) {
  const IconComponent = Icons[icon] || Icons.Wrench;

  return (
    <div className="home-tool-icon">
      <IconComponent size={26} strokeWidth={2.1} />
    </div>
  );
}

function ToolCard({ tool, compact = false }) {
  return (
    <Link to={`/tool/${tool.id}`} className="home-tool-card">
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
          <span>{tool.category}</span>
          <div>
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

  const featuredTools = useMemo(() => tools.slice(0, 8), []);
  const popularTools = useMemo(() => tools.slice(0, 6), []);

  const categories = useMemo(() => {
    return [...new Set(tools.map((tool) => tool.category).filter(Boolean))].slice(
      0,
      8
    );
  }, []);

  function handleSearch(e) {
    e.preventDefault();

    if (!search.trim()) return;

    navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  }

  const benefits = [
    {
      icon: "Zap",
      title: "Fast Solutions",
      text: "Complete small online tasks quickly without complicated steps.",
    },
    {
      icon: "MousePointerClick",
      title: "Easy to Use",
      text: "Simple interface with clear actions for every user.",
    },
    {
      icon: "Sparkles",
      title: "Free Tools",
      text: "Use helpful online tools freely for everyday digital work.",
    },
    {
      icon: "Layers",
      title: "Many Categories",
      text: "Find tools for image, text, color, SEO, and productivity tasks.",
    },
  ];

  return (
    <main className="home-page">
      <Helmet>
        <title>Next Online Tools | Free Tools for Quick Online Tasks</title>
        <meta
          name="description"
          content="Free online tools for text editing, image manipulation, file conversion, SEO, productivity, and more. Use them instantly without any cost."
        />
        <meta name="robots" content="index, follow" />
        <meta
          property="og:title"
          content="Next Online Tools | Free Tools for Quick Online Tasks"
        />
        <meta
          property="og:description"
          content="Access free tools for text editing, image manipulation, color schemes, SEO, conversions, productivity, and more — all in one place."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/images/home-page-banner.png" />
        <meta property="og:url" content="https://nextonlinetools.com" />
        <link rel="canonical" href="https://nextonlinetools.com" />
      </Helmet>

      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-badge">
          <Icons.Sparkles size={16} />
          <span>100% Free, Easy-to-Use Online Tools</span>
        </div>

        <h1>{tools.length}+ Free Tools for Fast Online Tasks</h1>

        <p>
          Access a wide range of fast, user-friendly tools for text editing,
          image manipulation, color schemes, SEO, conversions, productivity, and
          more — all in one place.
        </p>

        <div className="home-hero-actions">
          <Link to="/tools" className="home-primary-btn">
            Browse All Tools
          </Link>

          <Link to="/blog" className="home-secondary-btn">
            Helpful Blogs
          </Link>
        </div>
      </section>

      {/* POPULAR TOOLS */}
      <section className="home-section">
        <div className="home-section-head home-section-head-row">
          <div>
            <span>Popular</span>
            <h2>Popular Tools</h2>
            <p>Most useful tools to complete common online tasks quickly.</p>
          </div>

          <Link to="/tools" className="home-secondary-btn home-view-btn">
            View All
          </Link>
        </div>

        <div className="home-tools-grid popular">
          {popularTools.map((tool, index) => (
            <ToolCard key={tool.id || index} tool={tool} />
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="home-section">
        <div className="home-section-head">
          <div>
            <span>Categories</span>
            <h2>Browse by Category</h2>
            <p>Choose a category and start using tools instantly.</p>
          </div>
        </div>

        <div className="home-category-grid">
          <Link to="/tools" className="home-category-chip active">
            All Tools
          </Link>

          {categories.map((category) => (
            <Link
              key={category}
              to={`/tools?category=${encodeURIComponent(category)}`}
              className="home-category-chip"
            >
              {category}
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
            <p>Carefully selected tools for quick and simple work.</p>
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
            Next Online Tools helps you complete common online tasks quickly
            with simple, clean, and easy-to-use tools. Whether you need to work
            with text, images, colors, files, or productivity tasks, everything
            is designed to be quick and beginner-friendly.
          </p>

          <div className="home-benefit-grid">
            {benefits.map((item) => {
              const Icon = Icons[item.icon] || Icons.Wrench;

              return (
                <div key={item.title} className="home-benefit-card">
                  <div className="home-benefit-icon">
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
            <p>Learn how to use online tools better and finish tasks faster.</p>
          </div>

          <Link to="/blog" className="home-secondary-btn home-view-btn">
            View All Blogs
          </Link>
        </div>

        <div className="home-blog-grid">
          {blogs.slice(0, 3).map((blog, index) => (
            <Link
              key={blog.id || blog.slug || index}
              to={`/blog/${blog.slug}`}
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
    </main>
  );
}