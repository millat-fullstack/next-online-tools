import React, { Suspense } from "react";
import { useParams } from "react-router-dom";

const blogPages = import.meta.glob("./blogs/*.jsx");

export default function BlogSingle() {
  const { slug } = useParams();
  const pagePath = `./blogs/${slug}.jsx`;
  const loader = blogPages[pagePath];

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