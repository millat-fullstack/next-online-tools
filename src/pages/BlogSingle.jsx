import { useParams } from "react-router-dom";
import { blogs } from "../data/Blogs";  // Assuming you have blog data or load from an API

export default function BlogSingle() {
  const { slug } = useParams();  // Get slug from URL
  const blog = blogs.find((item) => item.slug === slug);  // Find the blog based on slug

  if (!blog) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-2xl font-bold mb-3">Blog Not Found</h1>
        <p className="text-[var(--text-secondary)] mb-5">
          The blog post you are looking for does not exist.
        </p>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      {/* Blog Header */}
      <section className="card p-6 sm:p-8 mb-6">
        <div className="relative w-full h-72 overflow-hidden rounded-xl">
          <img
            src={blog.image || "/default-image.jpg"}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-4xl font-bold mt-4">{blog.title}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{blog.date}</p>
      </section>

      {/* Blog Content */}
      <section className="card p-6 sm:p-8">
        <div className="prose max-w-none">
          {blog.content.split("\n").map((paragraph, index) => (
            <p key={index} className="text-[var(--text-secondary)] leading-8 mb-5">
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