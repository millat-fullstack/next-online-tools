import { Link } from "react-router-dom";

// List all available blog slugs here
const blogs = [
  { title: "How to Convert WEBP to JPG", slug: "HowToConvertWebpToJpg" },
  { title: "Best Free Online Tools for Daily Work", slug: "BestFreeOnlineTools" },
  { title: "Why Image Compression is Important", slug: "WhyImageCompressionIsImportant" },
  // Add more blogs here
];

export default function Blog() {
  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <span className="badge mb-4 inline-block">Helpful Guides</span>

        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Blog</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Learn how to use online tools better and finish tasks faster.
        </p>
      </section>

      <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {blogs.map((blog) => (
          <Link key={blog.slug} to={`/blog/${blog.slug}`}>
            <article className="card card-hover p-5 h-full">
              <span className="badge mb-4 inline-block">{blog.slug}</span>
              <h2 className="text-xl font-semibold mb-3">{blog.title}</h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                A brief introduction to the blog content...
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Read more...</p>
            </article>
          </Link>
        ))}
      </section>
    </div>
  );
}