import SharePost from "../../components/ui/SharePost";

export const blogData = {
  title: "Social Media Image Size Guide",
  slug: "SocialMediaImageSizeGuide",
  date: "2026-06-03",
  category: "Image Tools",
  excerpt:
    "A simple social media image size guide for Facebook, Instagram, LinkedIn, Pinterest, TikTok, YouTube, and X.",
  image: "/images/social-media-image-size-guide.png",
};

export default function SocialMediaImageSizeGuide() {
  return (
    <article>
      {/* Blog Header */}
      <section className="card p-6 sm:p-8 mb-6">
        <div className="relative w-full h-72 overflow-hidden rounded-xl bg-[var(--bg-secondary)]">
          <img
            src={blogData.image}
            alt="Social media image size guide"
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mt-5 leading-tight">
          Social Media Image Size Guide
        </h1>

        <p className="text-sm text-[var(--text-secondary)] mt-2">
          {blogData.category} • June 3, 2026
        </p>
      </section>

      {/* Blog Content */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          Using the right image size is important for clean and professional
          social media posts. If your image is too small, it may look blurry. If
          the ratio is wrong, important parts of your design may get cropped.
          This guide gives you simple image sizes for popular social media
          platforms.
        </p>

        <h2 className="text-2xl font-semibold mb-4">
          Quick Social Media Image Size Chart
        </h2>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left border border-[var(--border)] rounded-xl overflow-hidden">
            <thead className="bg-[var(--bg-secondary)]">
              <tr>
                <th className="p-3 font-semibold">Platform</th>
                <th className="p-3 font-semibold">Best Size</th>
                <th className="p-3 font-semibold">Use Case</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-secondary)]">
              <tr className="border-t border-[var(--border)]">
                <td className="p-3">Instagram Post</td>
                <td className="p-3">1080 × 1080 px</td>
                <td className="p-3">Square feed post</td>
              </tr>
              <tr className="border-t border-[var(--border)]">
                <td className="p-3">Instagram Portrait</td>
                <td className="p-3">1080 × 1350 px</td>
                <td className="p-3">Vertical feed post</td>
              </tr>
              <tr className="border-t border-[var(--border)]">
                <td className="p-3">Story / Reel</td>
                <td className="p-3">1080 × 1920 px</td>
                <td className="p-3">Full-screen vertical content</td>
              </tr>
              <tr className="border-t border-[var(--border)]">
                <td className="p-3">Facebook Feed</td>
                <td className="p-3">1080 × 1080 px</td>
                <td className="p-3">Post or ad creative</td>
              </tr>
              <tr className="border-t border-[var(--border)]">
                <td className="p-3">LinkedIn Post</td>
                <td className="p-3">1200 × 628 px</td>
                <td className="p-3">Landscape professional post</td>
              </tr>
              <tr className="border-t border-[var(--border)]">
                <td className="p-3">Pinterest Pin</td>
                <td className="p-3">1000 × 1500 px</td>
                <td className="p-3">Vertical pin design</td>
              </tr>
              <tr className="border-t border-[var(--border)]">
                <td className="p-3">YouTube Thumbnail</td>
                <td className="p-3">1280 × 720 px</td>
                <td className="p-3">Video thumbnail</td>
              </tr>
              <tr className="border-t border-[var(--border)]">
                <td className="p-3">X / Twitter Post</td>
                <td className="p-3">1600 × 900 px</td>
                <td className="p-3">Landscape post image</td>
              </tr>
              <tr className="border-t border-[var(--border)]">
                <td className="p-3">TikTok Video Cover</td>
                <td className="p-3">1080 × 1920 px</td>
                <td className="p-3">Vertical mobile content</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-semibold mb-4">
          Which Size Should You Use Most?
        </h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          For most social media content, <strong>1080 × 1080 px</strong> is a
          safe square size. For mobile-first content like stories, reels, and
          short videos, use <strong>1080 × 1920 px</strong>. For blog previews,
          link posts, and thumbnails, landscape sizes like{" "}
          <strong>1200 × 628 px</strong> or <strong>1280 × 720 px</strong> work
          better.
        </p>

        <h2 className="text-2xl font-semibold mb-4">
          Tips for Better Social Media Images
        </h2>

        <ul className="list-disc pl-6 text-[var(--text-secondary)] leading-8 mb-5 space-y-2">
          <li>Keep important text and faces near the center of the image.</li>
          <li>Use high-quality images to avoid blur after upload.</li>
          <li>Choose vertical sizes for mobile platforms like Instagram and TikTok.</li>
          <li>Keep text short, clear, and easy to read on small screens.</li>
          <li>Export images in JPG or PNG for better compatibility.</li>
        </ul>

        <div className="rounded-xl border border-[var(--border)] p-5 bg-[var(--bg-secondary)] my-7">
          <h3 className="text-xl font-semibold mb-2">
            Resize Your Image Online
          </h3>

          <p className="text-[var(--text-secondary)] leading-7 mb-4">
            Need a perfect size for Facebook, Instagram, YouTube, or Pinterest?
            Use our free online tools to resize, crop, and prepare your image
            for social media.
          </p>

          <a href="/tools" className="btn-primary inline-flex">
            Explore Image Tools
          </a>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Final Words</h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          A good image size helps your content look sharp, clean, and
          professional. Before posting, choose the correct ratio for the platform
          and preview your design to make sure nothing important is cropped.
        </p>

        <p className="text-sm text-[var(--text-secondary)] mt-5">
          Posted by: Admin
        </p>

        {/* Social Share */}
        <section className="flex gap-4 mt-8">
          <SharePost title={blogData.title} />
        </section>
      </section>
    </article>
  );
}