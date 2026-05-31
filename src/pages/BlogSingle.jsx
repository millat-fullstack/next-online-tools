import React, { Suspense } from "react";
import { useParams } from "react-router-dom";
import { blogs } from "../data/Blogs";

const blogPages = import.meta.glob("./blogs/*.jsx");

export default function BlogSingle() {
  const { slug } = useParams();
  const pagePath = `./blogs/${slug}.jsx`;
  let loader = blogPages[pagePath];

  if (!loader) {
    const blog = blogs.find((item) => item.slug === slug);
    if (blog?.pageFile) {
      loader = blogPages[`./blogs/${blog.pageFile}.jsx`];
    }
  }

  if (!loader) {
    return <div>Blog not found</div>;
  }

  const BlogComponent = React.lazy(loader);

  return (
    <div className="max-w-3xl mx-auto">
      <Suspense fallback={<div>Loading...</div>}>
        <BlogComponent />
      </Suspense>
    </div>
  );
}