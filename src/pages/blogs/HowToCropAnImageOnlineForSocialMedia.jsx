import SharePost from "../../components/ui/SharePost";

export const blogData = {
  title: "How to Crop an Image Online for Social Media",
  slug: "HowToCropAnImageOnlineForSocialMedia",
  date: "2026-06-03",
  category: "Image Tools",
  excerpt:
    "Learn how to crop an image online for Facebook, Instagram, LinkedIn, Pinterest, YouTube, TikTok, and other social media platforms.",
  image: "/images/crop-image-social-media.png",
};

export default function HowToCropAnImageOnlineForSocialMedia() {
  return (
    <article>
      {/* Blog Header */}
      <section className="card p-6 sm:p-8 mb-6">
        <div className="relative w-full h-72 overflow-hidden rounded-xl bg-[var(--bg-secondary)]">
          <img
            src={blogData.image}
            alt="Crop an image online for social media"
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mt-5 leading-tight">
          How to Crop an Image Online for Social Media
        </h1>

        <p className="text-sm text-[var(--text-secondary)] mt-2">
          {blogData.category} • June 3, 2026
        </p>
      </section>

      {/* Blog Content */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          Cropping an image correctly is important for social media. A wrong
          crop can cut off faces, text, products, or important design elements.
          With an online image cropper, you can quickly resize and crop your
          image for different platforms without installing editing software.
        </p>

        <h2 className="text-2xl font-semibold mb-4">
          Why Crop Images for Social Media?
        </h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          Each social media platform displays images in different shapes. A
          square image may work well for a feed post, while a vertical image is
          better for stories, reels, and mobile content. Cropping helps your
          photo look clean, balanced, and professional on every platform.
        </p>

        <h2 className="text-2xl font-semibold mb-4">
          Best Crop Sizes for Social Media
        </h2>

        <ul className="list-disc pl-6 text-[var(--text-secondary)] leading-8 mb-5 space-y-2">
          <li>
            <strong>1:1 Square:</strong> Good for Instagram posts, Facebook
            posts, and profile-style designs.
          </li>
          <li>
            <strong>4:5 Portrait:</strong> Great for vertical feed posts and
            mobile-friendly images.
          </li>
          <li>
            <strong>9:16 Vertical:</strong> Best for stories, reels, shorts, and
            TikTok-style content.
          </li>
          <li>
            <strong>16:9 Landscape:</strong> Useful for YouTube thumbnails, blog
            previews, and wide banners.
          </li>
          <li>
            <strong>2:3 Vertical:</strong> Commonly used for Pinterest-style pin
            images.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4">
          How to Crop an Image Online
        </h2>

        <ol className="list-decimal pl-6 text-[var(--text-secondary)] leading-8 mb-5 space-y-2">
          <li>
            <strong>Upload your image:</strong> Choose the photo or design from
            your device.
          </li>
          <li>
            <strong>Select a crop size:</strong> Pick the ratio you need, such
            as square, portrait, story, or landscape.
          </li>
          <li>
            <strong>Adjust the crop area:</strong> Move and resize the crop box
            until the important part is visible.
          </li>
          <li>
            <strong>Download the final image:</strong> Save the cropped image and
            use it on your social media platform.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold mb-4">
          Tips for a Better Crop
        </h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          Keep faces, products, and important text near the center of the image.
          Avoid placing key details too close to the edges because some apps may
          crop previews automatically. Always preview the image before posting to
          make sure it looks clean on mobile screens.
        </p>

        <div className="rounded-xl border border-[var(--border)] p-5 bg-[var(--bg-secondary)] my-7">
          <h3 className="text-xl font-semibold mb-2">
            Crop Your Image Online
          </h3>

          <p className="text-[var(--text-secondary)] leading-7 mb-4">
            Use our free online image cropper to prepare images for Facebook,
            Instagram, YouTube, Pinterest, TikTok, and more.
          </p>

          <a href="/tool/image-cropper" className="btn-primary inline-flex">
            Open Image Cropper
          </a>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Final Words</h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          Cropping your image before posting helps your content look sharp,
          clear, and professional. Whether you are creating a post, story,
          thumbnail, or banner, the right crop size can make your social media
          design much more effective.
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