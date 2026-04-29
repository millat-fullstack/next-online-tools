import { Link } from "react-router-dom";

// List all available tools here
const tools = [
  { name: "Case Converter", slug: "case-converter" },
  { name: "Color Picker", slug: "color-picker" },
  { name: "Color Preview", slug: "color-preview" },
  { name: "Image Compressor", slug: "image-compressor" },
  { name: "Image Resizer", slug: "image-resizer" },
  { name: "WEBP to JPG Converter", slug: "webp-to-jpg-converter" },
  { name: "PDF to JPG Converter", slug: "pdf-to-jpg-converter" },
  // Add more tools here as you add them
];

export default function Tools() {
  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <span className="badge mb-4 inline-block">Featured Tools</span>

        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Tools</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Explore all the free and easy-to-use tools that can help you with your daily digital tasks.
        </p>
      </section>

      <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {tools.map((tool) => (
          <Link key={tool.slug} to={`/tool/${tool.slug}`}>
            <article className="card card-hover p-5 h-full">
              <h2 className="text-xl font-semibold mb-3">{tool.name}</h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                A quick and easy way to use {tool.name} for your daily tasks.
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Learn More</p>
            </article>
          </Link>
        ))}
      </section>
    </div>
  );
}