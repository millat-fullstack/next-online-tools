import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import * as Icons from "lucide-react";
import tools from "../data/tools.json";
import { blogs } from "../data/Blogs";

function ToolIcon({ icon }) {
  const IconComponent = Icons[icon] || Icons.Wrench;

  return (
    <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
      <IconComponent
        size={28}
        className="text-[var(--primary)]"
        strokeWidth={2}
      />
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const featuredTools = tools.slice(0, 8);
  const popularTools = tools.slice(0, 6);
  const categories = [...new Set(tools.map((tool) => tool.category))].slice(0, 8);

  function handleSearch(e) {
    e.preventDefault();

    if (!search.trim()) return;

    navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <div className="flex flex-col gap-10">
      {/* HERO */}
      <section className="text-center py-10 sm:py-14">
        <span className="badge mb-5 inline-block">
          100% Free, Easy-to-Use Online Tools
        </span>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold max-w-4xl mx-auto leading-tight text-[var(--text-primary)]">
          100+ Free Tools for Fast Online Tasks
        </h1>

        <p className="text-[var(--text-secondary)] mt-5 max-w-2xl mx-auto text-base sm:text-lg">
          Access a wide range of fast, user-friendly tools for text editing, image manipulation, color schemes, SEO, conversions,
           productivity, and more — all in one place.
        </p>

        <form
          onSubmit={handleSearch}
          className="card max-w-3xl mx-auto mt-8 p-4 sm:p-5"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools... example: case converter, image compressor"
              className="input"
            />

            <button type="submit" className="btn-primary whitespace-nowrap">
              Search Tools
            </button>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-3 mt-5">
          <Link to="/tools" className="btn-secondary">
            Browse All Tools
          </Link>

          <Link to="/blog" className="btn-secondary">
            Helpful Blogs
          </Link>
        </div>
      </section>

      {/* CATEGORIES */}
      <section>
        <div className="mb-5">
          <h2 className="text-2xl font-bold">Browse by Category</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Choose a category and start using tools instantly.
          </p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          <Link to="/tools" className="btn-primary whitespace-nowrap">
            All Tools
          </Link>

          {categories.map((category) => (
            <Link
              key={category}
              to={`/tools?category=${encodeURIComponent(category)}`}
              className="btn-secondary whitespace-nowrap"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      {/* POPULAR TOOLS */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold">Popular Tools</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Most useful tools to complete common online tasks quickly.
            </p>
          </div>

          <Link to="/tools" className="btn-secondary hidden sm:inline-flex">
            View All
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {popularTools.map((tool, index) => (
            <Link key={tool.id || index} to={`/tool/${tool.id}`}>
              <div className="card card-hover p-5 h-full">
                <ToolIcon icon={tool.icon} />

                <h3 className="text-lg font-semibold mb-2">{tool.name}</h3>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {tool.description || "Free and easy online tool for daily use."}
                </p>

                <span className="badge mt-5 inline-block">{tool.category}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED TOOLS */}
      <section>
        <div className="mb-5">
          <h2 className="text-2xl font-bold">Featured Free Tools</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Carefully selected tools for quick and simple work.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {featuredTools.map((tool, index) => (
            <Link key={tool.id || index} to={`/tool/${tool.id}`}>
              <div className="card card-hover p-5 h-full">
                <ToolIcon icon={tool.icon} />

                <h3 className="font-semibold mb-2">{tool.name}</h3>

                <p className="text-sm text-[var(--text-secondary)]">
                  {tool.description || "Simple, fast, and free online tool."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
<section className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-gradient-to-br from-white via-[#faf7ff] to-[#f2eaff] p-6 sm:p-10">
  <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--primary)]/10 blur-3xl rounded-full" />
  <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--secondary)]/10 blur-3xl rounded-full" />

  <div className="relative">
    <span className="badge mb-4 inline-block">Why Next Online Tools?</span>

    <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
      Free, Fast & User-Friendly Tools for Daily Digital Tasks
    </h2>

    <p className="text-[var(--text-secondary)] leading-7 mb-8 max-w-3xl">
      Next Online Tools helps you complete common online tasks quickly with
      simple, clean, and easy-to-use tools. Whether you need to work with text,
      images, colors, files, or productivity tasks, everything is designed to be
      quick and beginner-friendly.
    </p>

    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {[
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
      ].map((item) => {
        const Icon = Icons[item.icon] || Icons.Wrench;

        return (
          <div
            key={item.title}
            className="rounded-2xl bg-white border border-[var(--border)] p-6 hover:shadow-lg hover:-translate-y-1"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#f4edff] text-[var(--primary)] flex items-center justify-center mb-5">
              <Icon size={26} strokeWidth={2.2} />
            </div>

            <h3 className="font-semibold text-lg mb-2">{item.title}</h3>

            <p className="text-sm text-[var(--text-secondary)] leading-6">
              {item.text}
            </p>
          </div>
        );
      })}
    </div>
  </div>
</section>

{/* BLOGS */}
<section className="rounded-[28px] bg-white border border-[var(--border)] p-6 sm:p-8 shadow-[0_18px_50px_rgba(155,108,227,0.10)]">
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
    <div>
      <span className="badge mb-4 inline-block">Guides & Tips</span>

      <h2 className="text-2xl sm:text-3xl font-bold">
        Latest Helpful Blogs
      </h2>

      <p className="text-sm text-[var(--text-secondary)] mt-2">
        Learn how to use online tools better and finish tasks faster.
      </p>
    </div>

    <Link to="/blog" className="btn-secondary w-fit">
      View All Blogs
    </Link>
  </div>

  <div className="grid lg:grid-cols-3 gap-5">
    {blogs.slice(0, 3).map((blog, index) => (
      <Link key={blog.id || blog.slug || index} to={`/blog/${blog.slug}`}>
        <article className="group h-full rounded-2xl border border-[var(--border)] bg-gradient-to-br from-white to-[#fbf8ff] p-5 hover:-translate-y-1 hover:shadow-[0_14px_35px_rgba(155,108,227,0.14)]">
          <div className="flex items-center justify-between mb-5">
            <span className="badge">{blog.category || "Blog"}</span>

            <span className="text-xs text-[var(--text-secondary)]">
              {blog.date}
            </span>
          </div>

          <h3 className="font-bold text-lg leading-snug group-hover:text-[var(--primary)]">
            {blog.title}
          </h3>

          <p className="text-sm text-[var(--text-secondary)] mt-3 leading-6">
            {blog.excerpt || "Read this helpful guide for better online workflow."}
          </p>

          <div className="mt-5 text-sm font-semibold text-[var(--primary)]">
            Read guide →
          </div>
        </article>
      </Link>
    ))}
  </div>
</section>
    </div>
  );
}