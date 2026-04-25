import { useParams } from "react-router-dom";
import { Suspense } from "react";

// Dynamically import blog components based on slug
const BlogComponents = {
  HowToConvertWebpToJpg: () => import("./blogs/HowToConvertWebpToJpg"),
  BestFreeOnlineTools: () => import("./blogs/BestFreeOnlineTools"),
  WhyImageCompressionIsImportant: () => import("./blogs/WhyImageCompressionIsImportant"),
  // Add more blog components here as you add more
};

export default function BlogSingle() {
  const { slug } = useParams(); // Capture the slug from URL

  // Dynamic import of the blog component
  const BlogComponent = BlogComponents[slug];

  if (!BlogComponent) {
    return <div>Blog not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Suspense fallback={<div>Loading...</div>}>
        <BlogComponent />
      </Suspense>
    </div>
  );
}