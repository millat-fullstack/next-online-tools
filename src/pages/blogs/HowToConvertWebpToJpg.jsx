// src/pages/blogs/HowToConvertWebpToJpg.jsx
import { Helmet } from "react-helmet-async";
import { Share2 } from "lucide-react";

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
            src="/images/webp-to-jpg.jpg" // Make sure to add a featured image for this blog
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
          WEBP is a modern image format that offers smaller file sizes without
          losing much quality. However, it is not supported everywhere. For
          example, many browsers, websites, and apps prefer JPG or PNG formats.
        </p>

        <h3 className="text-xl font-semibold mb-3">Why Convert to JPG?</h3>
        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          JPG is still one of the most widely supported formats on the web, which
          makes it ideal for web and social media usage. It's great for compressing
          images while retaining a decent level of quality.
        </p>

        <h3 className="text-xl font-semibold mb-3">Steps to Convert WEBP to JPG</h3>
        <ul className="list-decimal pl-6">
          <li>Upload the WEBP image.</li>
          <li>Wait for the conversion to finish.</li>
          <li>Download your JPG image.</li>
        </ul>

        <p className="text-sm text-[var(--text-secondary)] mt-5">Posted by: Admin</p>

        {/* Social Share */}
        <section className="flex gap-4 mt-8">
          <button className="btn-secondary">
            <Share2 size={18} className="mr-2" />
            Share this post
          </button>
        </section>
      </section>
    </>
  );
}