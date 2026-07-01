import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
    map[toolId] = {
      component: module.default,
      toolData: module.toolData || null,
    };
  }
  return map;
}, {});

export default function ToolPage() {
  const { slug } = useParams();
  const toolEntry = toolComponentMap[slug];
  const ToolComponent = toolEntry?.component;
  const toolData = toolEntry?.toolData;

  useEffect(() => {
    if (slug) {
      incrementToolUsage(slug);
    }
  }, [slug]);

  const pageTitle = toolData?.metaTitle || `${toolData?.name || "Tool"} | Next Online Tools`;
  const pageDescription =
    toolData?.metaDescription ||
    toolData?.description ||
    `Use ${toolData?.name || "this tool"} online for free on Next Online Tools.`;

  if (!ToolComponent) {
    return (
      <>
        <Helmet>
          <title>Tool not found | Next Online Tools</title>
          <meta name="description" content="The requested tool could not be found. Browse our collection of free online tools instead." />
        </Helmet>
        <div className="max-w-3xl mx-auto card p-6">
          <h1 className="text-2xl font-bold mb-4">Tool not found</h1>
          <p className="text-[var(--text-secondary)] mb-4">
            We couldn’t find that tool. Try selecting another tool from the tools page.
          </p>
          <Link to="/tools/" className="btn-primary">
            Back to Tools
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>
      <ToolComponent />
    </div>
  );
}
