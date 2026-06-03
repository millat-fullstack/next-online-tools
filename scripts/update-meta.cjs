const fs = require("fs");
const path = require("path");

const SITE_URL = "https://nextonlinetools.com";
const SITE_NAME = "Next Online Tools";
const DEFAULT_IMAGE = `${SITE_URL}/images/home-page-banner.png`;

const DIST = path.join(__dirname, "..", "dist");
const TOOLS_JSON = path.join(__dirname, "..", "src", "data", "tools.json");

const NOINDEX_PATHS = new Set([
  "/search",
  "/404",
]);

let tools = [];

try {
  if (fs.existsSync(TOOLS_JSON)) {
    tools = JSON.parse(fs.readFileSync(TOOLS_JSON, "utf8"));
  }
} catch (error) {
  console.warn("Could not load tools.json:", error.message);
}

const toolsById = new Map(
  tools
    .filter((tool) => tool && tool.id)
    .map((tool) => [String(tool.id), tool])
);

function walk(dir) {
  let results = [];

  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const dirent of list) {
    const full = path.join(dir, dirent.name);

    if (dirent.isDirectory()) {
      results = results.concat(walk(full));
    } else if (dirent.isFile() && dirent.name === "index.html") {
      results.push(full);
    }
  }

  return results;
}

function stripTags(html = "") {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeAttr(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function truncate(str, len = 155) {
  const clean = stripTags(str);

  if (!clean) return "";
  if (clean.length <= len) return clean;

  return clean.slice(0, len - 1).replace(/\s+[^\s]*$/, "") + "…";
}

function titleCaseFromSlug(slug = "") {
  return String(slug)
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeCanonicalPath(file) {
  const rel = path.relative(DIST, file).split(path.sep).join("/");
  const dir = path.dirname(rel).replace(/\\/g, "/");

  if (rel === "index.html" || dir === ".") return "/";

  return `/${dir}`.replace(/\/+/g, "/");
}

function getPageUrl(canonicalPath) {
  if (canonicalPath === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${canonicalPath}`;
}

function getRouteInfo(canonicalPath) {
  const parts = canonicalPath.split("/").filter(Boolean);

  if (canonicalPath === "/") {
    return {
      type: "home",
      slug: "",
      section: "Home",
    };
  }

  if (parts[0] === "tool" && parts[1]) {
    return {
      type: "tool",
      slug: parts[1],
      section: "Tools",
    };
  }

  if (parts[0] === "blog" && parts[1]) {
    return {
      type: "blogPost",
      slug: parts[1],
      section: "Blog",
    };
  }

  if (parts[0] === "blog") {
    return {
      type: "blogList",
      slug: "blog",
      section: "Blog",
    };
  }

  if (parts[0] === "tools") {
    return {
      type: "toolsList",
      slug: "tools",
      section: "Tools",
    };
  }

  if (parts[0] === "search") {
    return {
      type: "search",
      slug: "search",
      section: "Search",
    };
  }

  return {
    type: "page",
    slug: parts[parts.length - 1] || "",
    section: titleCaseFromSlug(parts[0] || "Page"),
  };
}

function extractJsonLd(html) {
  const blocks = [];
  const jsonLdRegex =
    /<script[^>]+type=(?:"|')application\/ld\+json(?:"|')[^>]*>([\s\S]*?)<\/script>/gi;

  let match;

  while ((match = jsonLdRegex.exec(html))) {
    try {
      const raw = match[1].trim();
      if (!raw) continue;

      const data = JSON.parse(raw);

      if (Array.isArray(data)) {
        blocks.push(...data);
      } else if (data && Array.isArray(data["@graph"])) {
        blocks.push(...data["@graph"]);
      } else if (data) {
        blocks.push(data);
      }
    } catch {
      // Ignore invalid JSON-LD from existing pages.
    }
  }

  return blocks;
}

function extractMetaContent(html, nameOrProperty) {
  const escaped = nameOrProperty.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const regex = new RegExp(
    `<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`,
    "i"
  );

  const match = html.match(regex);
  return match ? stripTags(match[1]) : "";
}

function extractFirstH1(html) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? stripTags(match[1]) : "";
}

function extractFirstParagraphAfterH1(html) {
  const afterH1 = html.split(/<h1[^>]*>[\s\S]*?<\/h1>/i)[1] || html;
  const match = afterH1.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

  return match ? stripTags(match[1]) : "";
}

function extractTitleFromExistingHtml(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return title ? stripTags(title[1]).replace(/\s*\|\s*Next Online Tools\s*$/i, "") : "";
}

function buildPageMeta({ html, routeInfo, canonicalPath }) {
  const jsonLdBlocks = extractJsonLd(html);
  const pageUrl = getPageUrl(canonicalPath);

  let headline = "";
  let description = "";
  let image = DEFAULT_IMAGE;

  for (const item of jsonLdBlocks) {
    if (!headline && (item.headline || item.name)) {
      headline = item.headline || item.name;
    }

    if (!description && item.description) {
      description = item.description;
    }

    if (item.image && image === DEFAULT_IMAGE) {
      if (typeof item.image === "string") image = item.image;
      if (Array.isArray(item.image) && item.image[0]) image = item.image[0];
      if (typeof item.image === "object" && item.image.url) image = item.image.url;
    }
  }

  if (!headline) headline = extractFirstH1(html);
  if (!headline) headline = extractTitleFromExistingHtml(html);

  if (!description) description = extractMetaContent(html, "description");
  if (!description) description = extractFirstParagraphAfterH1(html);

  if (routeInfo.type === "home") {
    headline = "Next Online Tools: Free PDF, Image, Text & Web Tools";
    description =
      "Use free online tools for PDF, image, text, color, converters, calculators, SEO, and everyday digital tasks. Fast, simple, and privacy-friendly tools from Next Online Tools.";
  }

  if (routeInfo.type === "toolsList") {
    headline = "All Free Online Tools";
    description =
      "Browse all free online tools from Next Online Tools, including image tools, PDF tools, text tools, color tools, converters, calculators, SEO tools, and productivity tools.";
  }

  if (routeInfo.type === "blogList") {
    headline = "Helpful Online Tools Blog";
    description =
      "Read helpful guides, tips, and tutorials about image tools, PDF tools, text tools, converters, productivity, SEO, and everyday online tasks.";
  }

  if (routeInfo.type === "tool") {
    const tool = toolsById.get(routeInfo.slug);

    if (tool) {
      headline = tool.name || titleCaseFromSlug(routeInfo.slug);

      description =
        tool.description ||
        `Use the free ${headline} tool online. Fast, simple, and easy to use directly in your browser.`;

      if (tool.image) {
        image = tool.image.startsWith("http") ? tool.image : `${SITE_URL}${tool.image}`;
      }
    } else {
      headline = headline || `${titleCaseFromSlug(routeInfo.slug)} Tool`;
      description =
        description ||
        `Use the free ${headline} online on Next Online Tools. Fast, simple, and easy to use from your browser.`;
    }
  }

  if (routeInfo.type === "blogPost") {
    headline = headline || titleCaseFromSlug(routeInfo.slug);
    description =
      description ||
      `Read this helpful guide from Next Online Tools about ${headline.toLowerCase()}.`;
  }

  if (!headline) {
    headline = titleCaseFromSlug(routeInfo.slug || routeInfo.section || "Next Online Tools");
  }

  if (!description) {
    description =
      "Next Online Tools provides free browser-based tools for images, PDFs, text, colors, SEO, conversions, calculators, and everyday digital tasks.";
  }

  headline = stripTags(headline);
  description = truncate(description, 155);

  let title = headline;

  if (routeInfo.type === "tool") {
    title = `${headline} Online - Free Tool | ${SITE_NAME}`;
  } else if (routeInfo.type === "blogPost") {
    title = `${headline} | ${SITE_NAME}`;
  } else if (routeInfo.type === "home") {
    title = headline;
  } else {
    title = `${headline} | ${SITE_NAME}`;
  }

  title = truncate(title, 68);

  return {
    title,
    headline,
    description,
    image,
    pageUrl,
  };
}

function removeSeoTags(html) {
  const removePatterns = [
    /<title[\s\S]*?<\/title>/gi,

    /<meta[^>]+name=["']description["'][^>]*>/gi,
    /<meta[^>]+name=["']keywords["'][^>]*>/gi,
    /<meta[^>]+name=["']robots["'][^>]*>/gi,
    /<meta[^>]+name=["']googlebot["'][^>]*>/gi,

    /<link[^>]+rel=["']canonical["'][^>]*>/gi,

    /<meta[^>]+property=["']og:site_name["'][^>]*>/gi,
    /<meta[^>]+property=["']og:title["'][^>]*>/gi,
    /<meta[^>]+property=["']og:description["'][^>]*>/gi,
    /<meta[^>]+property=["']og:type["'][^>]*>/gi,
    /<meta[^>]+property=["']og:url["'][^>]*>/gi,
    /<meta[^>]+property=["']og:image["'][^>]*>/gi,
    /<meta[^>]+property=["']og:image:alt["'][^>]*>/gi,
    /<meta[^>]+property=["']og:locale["'][^>]*>/gi,

    /<meta[^>]+name=["']twitter:card["'][^>]*>/gi,
    /<meta[^>]+name=["']twitter:title["'][^>]*>/gi,
    /<meta[^>]+name=["']twitter:description["'][^>]*>/gi,
    /<meta[^>]+name=["']twitter:image["'][^>]*>/gi,
    /<meta[^>]+name=["']twitter:image:alt["'][^>]*>/gi,

    /<!-- SEO POSTBUILD START -->[\s\S]*?<!-- SEO POSTBUILD END -->/gi,
    /<script[^>]+id=["']seo-postbuild-jsonld["'][\s\S]*?<\/script>/gi,
  ];

  let cleaned = html;

  for (const pattern of removePatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  return cleaned;
}

function buildBreadcrumbSchema({ routeInfo, pageMeta }) {
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${SITE_URL}/`,
    },
  ];

  if (routeInfo.type === "tool") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: "Tools",
      item: `${SITE_URL}/tools`,
    });

    items.push({
      "@type": "ListItem",
      position: 3,
      name: pageMeta.headline,
      item: pageMeta.pageUrl,
    });
  } else if (routeInfo.type === "blogPost") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: "Blog",
      item: `${SITE_URL}/blog`,
    });

    items.push({
      "@type": "ListItem",
      position: 3,
      name: pageMeta.headline,
      item: pageMeta.pageUrl,
    });
  } else if (routeInfo.type !== "home") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: pageMeta.headline,
      item: pageMeta.pageUrl,
    });
  }

  return {
    "@type": "BreadcrumbList",
    "@id": `${pageMeta.pageUrl}#breadcrumb`,
    itemListElement: items,
  };
}

function buildStructuredData({ routeInfo, pageMeta }) {
  const graph = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/android-chrome-512x512.png`,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: ["NextOnlineTools", "nextonlinetools.com"],
      url: `${SITE_URL}/`,
      inLanguage: "en",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type":
        routeInfo.type === "toolsList"
          ? "CollectionPage"
          : routeInfo.type === "blogList"
            ? "Blog"
            : "WebPage",
      "@id": `${pageMeta.pageUrl}#webpage`,
      url: pageMeta.pageUrl,
      name: pageMeta.headline,
      headline: pageMeta.headline,
      description: pageMeta.description,
      image: pageMeta.image,
      isPartOf: {
        "@id": `${SITE_URL}/#website`,
      },
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      breadcrumb: {
        "@id": `${pageMeta.pageUrl}#breadcrumb`,
      },
      inLanguage: "en",
    },
    buildBreadcrumbSchema({ routeInfo, pageMeta }),
  ];

  if (routeInfo.type === "tool") {
    graph.push({
      "@type": "WebApplication",
      "@id": `${pageMeta.pageUrl}#tool`,
      name: pageMeta.headline,
      url: pageMeta.pageUrl,
      description: pageMeta.description,
      image: pageMeta.image,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires a modern web browser",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    });
  }

  if (routeInfo.type === "blogPost") {
    graph.push({
      "@type": "BlogPosting",
      "@id": `${pageMeta.pageUrl}#article`,
      mainEntityOfPage: {
        "@id": `${pageMeta.pageUrl}#webpage`,
      },
      headline: pageMeta.headline,
      name: pageMeta.headline,
      description: pageMeta.description,
      image: pageMeta.image,
      url: pageMeta.pageUrl,
      author: {
        "@id": `${SITE_URL}/#organization`,
      },
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      inLanguage: "en",
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

function buildHeadInsert({ routeInfo, pageMeta, isNoIndex }) {
  const robots = isNoIndex
    ? "noindex, follow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  const ogType = routeInfo.type === "blogPost" ? "article" : "website";

  const structuredData = buildStructuredData({ routeInfo, pageMeta });

  return `
    <!-- SEO POSTBUILD START -->
    <title>${escapeAttr(pageMeta.title)}</title>
    <meta name="description" content="${escapeAttr(pageMeta.description)}">
    <link rel="canonical" href="${escapeAttr(pageMeta.pageUrl)}">

    <meta name="robots" content="${escapeAttr(robots)}">
    <meta name="googlebot" content="${escapeAttr(robots)}">

    <meta property="og:site_name" content="${escapeAttr(SITE_NAME)}">
    <meta property="og:title" content="${escapeAttr(pageMeta.headline)}">
    <meta property="og:description" content="${escapeAttr(pageMeta.description)}">
    <meta property="og:type" content="${escapeAttr(ogType)}">
    <meta property="og:url" content="${escapeAttr(pageMeta.pageUrl)}">
    <meta property="og:image" content="${escapeAttr(pageMeta.image)}">
    <meta property="og:image:alt" content="${escapeAttr(pageMeta.headline)}">
    <meta property="og:locale" content="en_US">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeAttr(pageMeta.headline)}">
    <meta name="twitter:description" content="${escapeAttr(pageMeta.description)}">
    <meta name="twitter:image" content="${escapeAttr(pageMeta.image)}">
    <meta name="twitter:image:alt" content="${escapeAttr(pageMeta.headline)}">

    <script id="seo-postbuild-jsonld" type="application/ld+json">${JSON.stringify(
      structuredData
    )}</script>
    <!-- SEO POSTBUILD END -->
`;
}

function xmlEscape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getPriority(routeInfo) {
  if (routeInfo.type === "home") return "1.0";
  if (routeInfo.type === "toolsList") return "0.9";
  if (routeInfo.type === "tool") return "0.8";
  if (routeInfo.type === "blogList") return "0.7";
  if (routeInfo.type === "blogPost") return "0.6";
  return "0.5";
}

function getChangeFreq(routeInfo) {
  if (routeInfo.type === "home") return "daily";
  if (routeInfo.type === "toolsList") return "weekly";
  if (routeInfo.type === "tool") return "monthly";
  if (routeInfo.type === "blogList") return "weekly";
  if (routeInfo.type === "blogPost") return "monthly";
  return "monthly";
}

function generateSitemap(sitemapItems) {
  const urls = sitemapItems
    .map((item) => {
      return `  <url>
    <loc>${xmlEscape(item.url)}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  fs.writeFileSync(path.join(DIST, "sitemap.xml"), xml, "utf8");
}

function generateRobotsTxt() {
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

  fs.writeFileSync(path.join(DIST, "robots.txt"), robotsTxt, "utf8");
}

function main() {
  const files = walk(DIST);

  console.log(`Found ${files.length} index.html files`);

  let updated = 0;
  const sitemapItems = [];

  for (const file of files) {
    let html = fs.readFileSync(file, "utf8");
    const original = html;

    const canonicalPath = normalizeCanonicalPath(file);
    const routeInfo = getRouteInfo(canonicalPath);
    const pageMeta = buildPageMeta({ html, routeInfo, canonicalPath });

    const isNoIndex = NOINDEX_PATHS.has(canonicalPath);

    html = removeSeoTags(html);

    const insert = buildHeadInsert({
      routeInfo,
      pageMeta,
      isNoIndex,
    });

    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `${insert}\n  </head>`);
    } else {
      console.warn(`No </head> found in ${file}`);
      continue;
    }

    if (html !== original) {
      fs.writeFileSync(file, html, "utf8");
      updated++;
      console.log(`Updated SEO meta: ${canonicalPath}`);
    }

    if (!isNoIndex) {
      const stat = fs.statSync(file);

      sitemapItems.push({
        url: pageMeta.pageUrl,
        lastmod: stat.mtime.toISOString().split("T")[0],
        changefreq: getChangeFreq(routeInfo),
        priority: getPriority(routeInfo),
      });
    }
  }

  sitemapItems.sort((a, b) => {
    if (a.url === `${SITE_URL}/`) return -1;
    if (b.url === `${SITE_URL}/`) return 1;
    return a.url.localeCompare(b.url);
  });

  generateSitemap(sitemapItems);
  generateRobotsTxt();

  console.log(`Done. Updated SEO meta in ${updated} files.`);
  console.log(`Generated sitemap.xml with ${sitemapItems.length} URLs.`);
  console.log("Generated robots.txt.");
}

main();