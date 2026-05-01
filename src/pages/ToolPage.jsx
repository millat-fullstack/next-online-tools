import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { incrementToolUsage } from "../lib/tracking";

const toolModules = import.meta.glob("../tools/*.jsx", { eager: true });
const normalizeToolId = (toolPath) =>
  toolPath?.replace(/^\//, "").replace(/^tool\//, "").replace(/\/$/, "") || "";

const toolComponentMap = Object.entries(toolModules).reduce((map, [filePath, module]) => {
  let toolId = normalizeToolId(module.toolData?.path);
  if (!toolId) {
    const fileName = filePath.split('/').pop() || '';
    toolId = fileName.replace(/\.jsx$/, '');
  }
  if (toolId && module.default) {
    map[toolId] = module.default;
  }
  return map;
}, {});

export default function ToolPage() {
  const { slug } = useParams();

  useEffect(() => {
    if (slug) {
      incrementToolUsage(slug);
    }
  }, [slug]);

  const ToolComponent = toolComponentMap[slug];

  if (!ToolComponent) {
    return (
      <div className="max-w-3xl mx-auto card p-6">
        <h1 className="text-2xl font-bold mb-4">Tool not found</h1>
        <p className="text-[var(--text-secondary)] mb-4">
          We couldn’t find that tool. Try selecting another tool from the tools page.
        </p>
        <Link to="/tools" className="btn-primary">
          Back to Tools
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <ToolComponent />
    </div>
  );
}
