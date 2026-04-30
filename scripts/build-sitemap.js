/* eslint-env node */
/* global process */
import fs from "fs";
import path from "path";

const BASE_URL = "https://nextonlinetools.com";
const OUTPUT_FILE = path.join(process.cwd(), "public", "sitemap.xml");
const TOOLS_FILE = path.join(process.cwd(), "src", "data", "tools.json");
const BLOGS_FILE = new URL("../src/data/Blogs.js", import.meta.url);

const toolsData = JSON.parse(fs.readFileSync(TOOLS_FILE, "utf8"));
const { blogs } = await import(BLOGS_FILE.href);

const urls = [
  "/",
  "/#/tools",
  "/#/blog",
  "/#/about",
  "/#/contact",
  "/#/privacy-policy",
  "/#/terms-of-service",
];

for (const tool of toolsData) {
  if (tool.id) {
    urls.push(`/#/tool/${tool.id}`);
  }
}

for (const blog of blogs) {
  if (blog.slug) {
    urls.push(`/#/blog/${blog.slug}`);
  }
}

const uniqueUrls = Array.from(new Set(urls)).sort();

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueUrls
  .map((url) => `  <url>\n    <loc>${BASE_URL}${url}</loc>\n  </url>`)
  .join("\n")}\n</urlset>\n`;

fs.writeFileSync(OUTPUT_FILE, xml, "utf8");
console.log(`✅ Generated sitemap with ${uniqueUrls.length} URLs: ${OUTPUT_FILE}`);
