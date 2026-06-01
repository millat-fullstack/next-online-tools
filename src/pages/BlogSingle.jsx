import React, { Suspense } from "react";
import { useParams } from "react-router-dom";
import { blogs } from "../data/Blogs";

const blogPages = import.meta.glob("./blogs/*.jsx");

// Error Boundary for lazy-loaded components
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

  // Wrap loader to ensure React.lazy gets the correct function
  const BlogComponent = React.lazy(() => 
    loader().then(module => ({ default: module.default || module }))
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