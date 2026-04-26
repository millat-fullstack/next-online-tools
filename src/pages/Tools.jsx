import { Link } from "react-router-dom";

// List all available tools here
const tools = [
  { name: "Image Compressor", slug: "image-compressor", category: "Image Tools" },
  { name: "Color Picker", slug: "color-picker", category: "Design Tools" },
  { name: "Color Preview", slug: "color-preview", category: "Design Tools" },
  { name: "Text Case Converter", slug: "case-converter", category: "Text Tools" },
  { name: "Image Resizer", slug: "image-resizer", category: "Image Tools" },
  { name: "WEBP to JPG Converter", slug: "webp-to-jpg-converter", category: "Image Tools" },
  // Add more tools here as you add them
];

export default function Tools() {
  return (
    <div className="max-w-screen-xl mx-auto p-6">
      <section className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[var(--primary)] mb-4">All Tools</h1>
        <p className="text-lg text-[var(--text-secondary)] mb-6">
          Explore the best free and easy-to-use tools that help you finish digital tasks efficiently.
        </p>
      </section>

      {/* Tools Grid */}
      <section className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            to={`/tool/${tool.slug}`}
            className="card p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300"
          >
            <div className="text-center">
              {/* Tool Category Badge */}
              <span className="text-sm font-medium text-[var(--secondary)] bg-[var(--accent)] py-1 px-3 rounded-full mb-3">
                {tool.category}
              </span>
              <h2 className="text-2xl font-semibold text-[var(--primary)] mb-3">{tool.name}</h2>
              <p className="text-sm text-[var(--text-secondary)]">Explore and use this tool today.</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}