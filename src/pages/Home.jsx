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
          100% Free • No Paid API • Simple Online Tools
        </span>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold max-w-4xl mx-auto leading-tight text-[var(--text-primary)]">
          100+ Free Online Tools for Everyday Tasks
        </h1>

        <p className="text-[var(--text-secondary)] mt-5 max-w-2xl mx-auto text-base sm:text-lg">
          Find fast and user-friendly tools for text, images, colors, SEO,
          productivity, conversions, and daily online work — all in one place.
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
<section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#ffffff] via-[#fbf8ff] to-[#f3ecff] border border-[var(--border)] p-6 sm:p-8 shadow-[0_18px_50px_rgba(155,108,227,0.14)]">
  <div className="absolute -top-20 -right-20 w-64 h-64 bg-[var(--accent)]/20 rounded-full blur-3xl" />
  <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[var(--secondary)]/20 rounded-full blur-3xl" />

  <div className="relative">
    <span className="badge mb-4 inline-block">Why ToolNest?</span>

    <h2 className="text-2xl sm:text-3xl font-bold mb-3">
      Built for Fast, Free & Simple Online Work
    </h2>

    <p className="text-[var(--text-secondary)] max-w-2xl mb-7">
      No confusing steps. No paid API. Just clean tools that help users finish
      common online tasks quickly.
    </p>

    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {[
        {
          title: "Free to Use",
          text: "Use helpful tools without payment or complex setup.",
          number: "01",
        },
        {
          title: "No Paid API",
          text: "Browser-based and lightweight methods where possible.",
          number: "02",
        },
        {
          title: "User Friendly",
          text: "Clear layout, simple buttons, and beginner-friendly flow.",
          number: "03",
        },
        {
          title: "Fast Workflow",
          text: "Complete text, image, color, and daily tasks quickly.",
          number: "04",
        },
      ].map((item) => (
        <div
          key={item.title}
          className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-[var(--border)] shadow-sm hover:shadow-md hover:-translate-y-1"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#f4edff] text-[var(--primary)] flex items-center justify-center font-bold mb-4">
            {item.number}
          </div>

          <h3 className="font-semibold mb-2">{item.title}</h3>

          <p className="text-sm text-[var(--text-secondary)] leading-6">
            {item.text}
          </p>
        </div>
      ))}
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