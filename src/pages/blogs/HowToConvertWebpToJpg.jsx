import { Helmet } from "react-helmet-async";

export default function HowToConvertWebpToJpg() {
  return (
    <>
      <Helmet>
        <title>How to Convert WEBP to JPG Online</title>
        <meta
          name="description"
          content="Learn how to convert WEBP images to JPG format online easily and quickly."
        />
      </Helmet>

      {/* Blog Header */}
      <section className="card p-6 sm:p-8 mb-6">
        <div className="relative w-full h-72 overflow-hidden rounded-xl">
          <img
            src="/images/webp-to-jpg.jpg"  // Make sure you have a fallback image in /public/images
            alt="WEBP to JPG"
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-4xl font-bold mt-4">How to Convert WEBP to JPG Online</h1>
        <p className="text-sm text-[var(--text-secondary)]">April 24, 2026</p>
      </section>

      {/* Blog Content */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          WEBP is a modern image format that offers smaller file sizes without losing
          much quality. However, it is not supported everywhere. For example, many
          browsers, websites, and apps prefer JPG or PNG formats.
        </p>
        {/* Add more blog content */}
      </section>
    </>
  );
}