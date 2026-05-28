import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { searchAllGrouped } from "../lib/searchUtils";
import ToolCard from "../components/ui/ToolCard";

const SITE_URL = "https://nextonlinetools.com";

export default function SearchResults() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get("q") || "";
  const pageUrl = `${SITE_URL}${location.pathname}${location.search}`;
  const pageTitle = query
    ? `Search results for ${query} | Next Online Tools`
    : "Search | Next Online Tools";

  const { tools, blogs } = searchAllGrouped(query);
  const totalResults = tools.length + blogs.length;

  return (
    <div className="flex flex-col gap-8">
      <Helmet>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="Search Next Online Tools for tools and blog posts by keyword. Browse free online image, text, PDF, SEO, color, and productivity tools."
        />
        <meta name="robots" content="noindex, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta
          property="og:description"
          content="Search Next Online Tools for tools and blog posts by keyword. Browse free online image, text, PDF, SEO, color, and productivity tools."
        />
        <meta property="og:url" content={pageUrl} />
      </Helmet>
      <section className="card p-6 sm:p-8">
        <span className="badge mb-4 inline-block">Search Results</span>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Search Results for “{query}”
        </h1>

        <p className="text-[var(--text-secondary)]">
          Found {totalResults} result{totalResults !== 1 ? "s" : ""}.
        </p>
      </section>

      {totalResults > 0 ? (
        <>
          {tools.length > 0 && (
            <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </section>
          )}

          {blogs.length > 0 && (
            <section className="card p-6 sm:p-8">
              <h2 className="text-2xl font-bold mb-4">Related Blog Posts</h2>
              <div className="grid gap-4">
                {blogs.map((blog) => (
                  <Link
                    key={blog.slug}
                    to={`/blog/${blog.slug}`}
                    className="block rounded-3xl border border-slate-200 p-4 transition hover:border-[var(--primary)] hover:bg-slate-50"
                  >
                    <h3 className="text-xl font-semibold">{blog.title}</h3>
                    <p className="text-[var(--text-secondary)] mt-2">{blog.excerpt}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="card p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">No Results Found</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Try searching with another keyword like image, color, text, or
            converter.
          </p>

          <Link to="/tools" className="btn-primary">
            Browse All Tools
          </Link>
        </section>
      )}
    </div>
  );
}
