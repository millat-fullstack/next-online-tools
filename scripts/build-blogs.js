/* eslint-env node */
/* global process */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOGS_DIR = path.join(__dirname, "..", "src", "pages", "blogs");
const OUTPUT_FILE = path.join(__dirname, "..", "src", "data", "Blogs.js");

function parseBlogData(content, filePath) {
  const match = content.match(/export\s+const\s+blogData\s*=\s*({[\s\S]*?})\s*;/);
  if (!match) {
    console.warn(`No blogData export found in ${filePath}`);
    return null;
  }

  const rawObject = match[1];
  const sanitized = rawObject
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .trim();

  try {
    return new Function(`return ${sanitized}`)();
  } catch (error) {
    console.error(`Failed to parse blogData in ${filePath}:`, error.message);
    return null;
  }
}

function buildBlogsData() {
  const files = fs.readdirSync(BLOGS_DIR).filter((f) => f.endsWith(".jsx"));
  const blogs = [];

  for (const file of files) {
    const filePath = path.join(BLOGS_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");
    const blogData = parseBlogData(content, filePath);

    if (blogData) {
      if (!blogData.slug) {
        blogData.slug = file.replace(/\.jsx$/, "");
      }
      blogs.push(blogData);
    }
  }

  blogs.sort((a, b) => new Date(b.date) - new Date(a.date));

  const output = `export const blogs = ${JSON.stringify(blogs, null, 2)};\n`;
  fs.writeFileSync(OUTPUT_FILE, output, "utf8");
  console.log(`✅ Generated Blogs.js with ${blogs.length} entries.`);
}

buildBlogsData();
