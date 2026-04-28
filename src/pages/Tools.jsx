import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import tools from "../data/tools.json";

function ToolIcon({ icon }) {
  const IconComponent = Icons[icon] || Icons.Wrench;

  return (
    <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
      <IconComponent
        size={28}
        className="text-[var(--primary)]"
        strokeWidth={2}
      />
    </div>
  );
}

export default function Tools() {
  const allTools = tools;

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <span className="badge mb-4 inline-block">All Tools</span>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          All Free Online Tools
        </h1>

        <p className="text-[var(--text-secondary)] max-w-3xl leading-7">
          Explore our complete collection of free online tools for text, images, colors, SEO, productivity, conversions, and daily online work.
        </p>
      </section>

      {/* ALL TOOLS */}
      <section>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {allTools.map((tool, index) => (
            <Link key={tool.id || index} to={`/tool/${tool.id}`}>
              <div className="card card-hover p-5 h-full">
                <ToolIcon icon={tool.icon} />

                <h3 className="font-semibold mb-2">{tool.name}</h3>

                <p className="text-sm text-[var(--text-secondary)]">
                  {tool.description || "Simple, fast, and free online tool."}
                </p>

                <span className="badge mt-5 inline-block">{tool.category}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}