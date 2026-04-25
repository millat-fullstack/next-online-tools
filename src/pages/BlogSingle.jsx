import { Link, useParams } from "react-router-dom";
import { blogs } from "../data/Blogs";
import { Share2 } from "lucide-react";
import * as Icons from "lucide-react";

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
      {/* BLOG HEADER */}
      <section className="card p-6 sm:p-8 mb-6">
        <div className="relative w-full h-72 overflow-hidden rounded-xl">
          <img
            src={blog.image || "/default-image.jpg"}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-black/40 flex justify-center items-center">
            <h1 className="text-4xl text-white font-bold text-center">{blog.title}</h1>
          </div>
        </div>
        <div className="flex justify-between mt-4">
          <p className="text-sm text-[var(--text-secondary)]">By Admin</p>
          <p className="text-sm text-[var(--text-secondary)]">{blog.date}</p>
        </div>
      </section>

      {/* BLOG CONTENT */}
      <section className="card p-6 sm:p-8">
        <div className="prose max-w-none">
          {blog.content
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={index} className="text-[var(--text-secondary)] leading-8 mb-5">
                {paragraph}
              </p>
            ))}
        </div>
      </section>

      {/* SOCIAL SHARE */}
      <section className="flex gap-4 mt-8">
        <button className="btn-secondary">
          <Share2 size={18} className="mr-2" />
          Share this post
        </button>
      </section>

      {/* RELATED BLOGS */}
      <section className="mt-12">
        <h3 className="text-xl font-semibold mb-5">Related Blogs</h3>
        <div className="grid sm:grid-cols-2 gap-5">
          {blogs
            .filter((related) => related.category === blog.category && related.slug !== blog.slug)
            .slice(0, 3)
            .map((related) => (
              <Link key={related.id} to={`/blog/${related.slug}`} className="group">
                <div className="card p-5 group-hover:shadow-lg hover:shadow-xl transition-all">
                  <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
                    <img
                      src={related.image || "/default-image.jpg"}
                      alt={related.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="font-semibold text-lg group-hover:text-[var(--primary)]">
                    {related.title}
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">{related.excerpt}</p>
                </div>
              </Link>
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