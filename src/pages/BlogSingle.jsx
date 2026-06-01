import React, { Suspense } from "react";
import { useParams } from "react-router-dom";
import { blogs } from "../data/Blogs";

const blogPages = import.meta.glob("./blogs/*.jsx");
const blogPageMap = Object.entries(blogPages).reduce((map, [filePath, loader]) => {
  const fileName = filePath.split("/").pop()?.replace(/\.jsx$/, "");
  if (fileName) {
    map[fileName] = loader;
  }
  return map;
}, {});

// Error Boundary for blog page rendering
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Blog component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Error loading blog: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

export default function BlogSingle() {
  const { slug } = useParams();
  const blog = blogs.find((item) => item.slug === slug);
  const loader = blog ? blogPageMap[blog.pageFile] : null;

  if (!blog || !loader) {
    return <div>Blog not found</div>;
  }

  const BlogComponent = React.lazy(() =>
    loader().then((module) => ({ default: module.default || module }))
  );

  return (
    <div className="max-w-3xl mx-auto">
      <ErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          <BlogComponent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}