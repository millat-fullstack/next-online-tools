import { Link, useParams } from "react-router-dom";
import { blogs } from "../data/Blogs";

export default function BlogSingle() {
  const { slug } = useParams();

  const blog = blogs.find((item) => item.slug === slug);

  if (!blog) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-2xl font-bold mb-3">Blog Not Found</h1>
        <p className="text-[var(--text-secondary)] mb-5">
          The blog post you are looking for does not exist.
        </p>
        <Link to="/blog" className="btn-primary">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      <section className="card p-6 sm:p-8 mb-6">
        <span className="badge mb-4 inline-block">
          {blog.category}
        </span>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          {blog.title}
        </h1>

        <p className="text-sm text-[var(--text-secondary)]">
          Published on {blog.date}
        </p>
      </section>

      <section className="card p-6 sm:p-8">
        <div className="prose max-w-none">
          {blog.content
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((paragraph, index) => (
              <p
                key={index}
                className="text-[var(--text-secondary)] leading-8 mb-5"
              >
                {paragraph}
              </p>
            ))}
        </div>
      </section>

      <div className="mt-6">
        <Link to="/blog" className="btn-secondary">
          ← Back to Blog
        </Link>
      </div>
    </article>
  );
}