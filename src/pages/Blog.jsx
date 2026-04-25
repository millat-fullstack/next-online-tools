import { Link } from "react-router-dom";
import * as Icons from "lucide-react";

// Example Blog List
const blogList = [
  { title: "How to Convert WEBP to JPG Online", slug: "HowToConvertWebpToJpg" },
  { title: "Best Free Online Tools for Daily Work", slug: "BestFreeOnlineTools" },
  { title: "Why Image Compression is Important", slug: "WhyImageCompressionIsImportant" },
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
        {blogList.map((blog) => (
          <Link key={blog.slug} to={`/blog/${blog.slug}`} className="group">
            <div className="card p-5 group-hover:shadow-lg hover:shadow-xl transition-all">
              <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
                <img
                  src={`/images/${blog.slug.toLowerCase().replace(/ /g, "-")}.jpg`}  // Make sure to add image for each blog
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-[var(--primary)]">
                {blog.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">Read more...</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}