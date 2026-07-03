import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import * as Icons from "lucide-react";

import tools from "../data/tools.json";
import SmartLink from "../components/ui/SmartLink";
import "../styles/tools.css";

const SITE_URL = "https://nextonlinetools.com";
const CONVERTER_URL = `${SITE_URL}/converter`;

function getConverterTools() {
  return tools
    .filter((tool) => {
      const haystack = [tool.name, tool.description, tool.id, tool.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes("converter") || haystack.includes("convert");
    })
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}

function getIcon(iconName, fallback = "Wrench") {
  return Icons[iconName] || Icons[fallback] || Icons.Wrench;
}

function ToolIcon({ icon, className = "tools-directory-tool-icon" }) {
  const IconComponent = getIcon(icon);

  return (
    <div className={className} aria-hidden="true">
      <IconComponent size={20} strokeWidth={2.1} />
    </div>
  );
}

function ToolCard({ tool }) {
  return (
    <SmartLink
      to={`/tool/${tool.id}`}
      className="tools-directory-card"
      aria-label={`Open ${tool.name}`}
    >
      <div className="tools-directory-card-top">
        <ToolIcon icon={tool.icon} />

        {tool.trending && (
          <span className="tools-directory-popular">
            <Icons.Flame size={12} aria-hidden="true" />
            Popular
          </span>
        )}
      </div>

      <h3>{tool.name}</h3>

      <p>
        {tool.description || "Open this free browser-based tool and complete your task faster."}
      </p>

      <div className="tools-directory-card-bottom">
        <span>{tool.category || "Online Tool"}</span>
        <Icons.ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
      </div>
    </SmartLink>
  );
}

export default function Converter() {
  const converterTools = useMemo(() => getConverterTools(), []);

  const seoTitle = "Converter Tools Online | Next Online Tools";
  const seoDescription =
    "Browse all free online converter tools for images, PDFs, files, text, units, and media in one simple place.";

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={CONVERTER_URL} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Next Online Tools" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={CONVERTER_URL} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
      </Helmet>

      <main className="tools-directory-page">
        <nav className="tools-directory-breadcrumb" aria-label="Breadcrumb">
          <SmartLink to="/">Home</SmartLink>
          <Icons.ChevronRight size={14} aria-hidden="true" />
          <span>Converter</span>
        </nav>

        <section className="tools-directory-header">
          <div className="tools-directory-header-copy">
            <span className="tools-directory-kicker">Converter tools</span>
            <h1>All converter tools in one place</h1>
            <p>
              Convert images, PDFs, documents, text, units, and media formats instantly with browser-based tools that work without installing software.
            </p>

            <div className="tools-directory-meta" aria-label="Converter summary">
              <span>{converterTools.length}+ tools</span>
              <span>Fast and secure</span>
              <span>No software needed</span>
            </div>
          </div>

          <div className="tools-directory-header-actions">
            <SmartLink to="/tools" className="tools-directory-secondary-btn">
              Browse all tools
            </SmartLink>
            <SmartLink to="/contact" className="tools-directory-primary-btn">
              Request a tool
            </SmartLink>
          </div>
        </section>

        <section className="tools-directory-grid">
          {converterTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </section>

        <section className="tools-directory-info-section">
          <div className="tools-directory-info-copy">
            <span>What you can convert</span>
            <h2>From images and PDFs to text and units</h2>
            <p>
              Use this page whenever you need a quick format change for a document, media file, or everyday digital task.
            </p>
          </div>

          <div className="tools-directory-use-case-list">
            <article>
              <Icons.Image size={18} aria-hidden="true" />
              <p>Convert photos and images between the most common formats.</p>
            </article>
            <article>
              <Icons.FileText size={18} aria-hidden="true" />
              <p>Turn documents and images into PDF files or extract them into other formats.</p>
            </article>
            <article>
              <Icons.Type size={18} aria-hidden="true" />
              <p>Change text case, format, and other content-based outputs instantly.</p>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}
