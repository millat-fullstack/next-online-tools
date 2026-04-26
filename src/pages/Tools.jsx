import { Link } from "react-router-dom";

// List all available tools
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
        <h1 className="text-5xl font-bold text-[var(--primary)] mb-4">All Tools</h1>
        <p className="text-lg text-[var(--text-secondary)] mb-6">
          Explore the best free and easy-to-use tools that help you finish digital tasks efficiently and creatively.
        </p>
      </section>

      {/* Tools Grid */}
      <section className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            to={`/tool/${tool.slug}`}
            className="group transform hover:scale-105 transition duration-300 ease-in-out"
          >
            <div className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl">
              {/* Tool Category Badge */}
              <span className="text-sm font-semibold text-white bg-[var(--primary)] py-1 px-3 rounded-full mb-4 inline-block">
                {tool.category}
              </span>

              {/* Tool Name */}
              <h2 className="text-2xl font-semibold text-[var(--primary)] mb-3">{tool.name}</h2>

              {/* Tool Description */}
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Discover and use this tool today to boost your productivity.
              </p>

              {/* Tool Icon Placeholder */}
              <div className="flex justify-center items-center h-32 bg-gray-100 rounded-md mb-4">
                <span className="text-5xl text-[var(--primary)]">🔧</span> {/* Replace with tool-specific icons */}
              </div>

              {/* Learn More Button */}
              <p className="text-xs text-[var(--primary)] hover:underline">Explore &gt;</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}