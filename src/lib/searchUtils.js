import tools from "../data/tools.json";
import { blogs } from "../data/Blogs";

const SEARCH_SYNONYMS = {
  jpg: ["jpeg", "image", "photo", "picture"],
  jpeg: ["jpg", "image", "photo", "picture"],
  image: ["photo", "picture", "jpg", "jpeg", "png", "webp"],
  photo: ["image", "picture", "passport"],
  pdf: ["document", "file"],
  compress: ["reduce", "resize", "minify", "smaller"],
  resize: ["size", "dimension", "scale"],
  convert: ["converter", "change", "transform"],
  remove: ["delete", "erase", "page remover", "remover"],
  merge: ["combine", "join"],
  split: ["separate", "divide"],
  text: ["word", "character", "paragraph", "sentence"],
  slug: ["url", "seo", "permalink"],
};

function normalizeText(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTokens(value = "") {
  const normalized = normalizeText(value);

  if (!normalized) return [];

  const baseTokens = normalized.split(" ").filter(Boolean);
  const expandedTokens = [];

  baseTokens.forEach((token) => {
    expandedTokens.push(token);

    if (SEARCH_SYNONYMS[token]) {
      expandedTokens.push(...SEARCH_SYNONYMS[token]);
    }
  });

  return [...new Set(expandedTokens)];
}

function textFromParts(parts = []) {
  return normalizeText(
    parts
      .filter(Boolean)
      .map((part) => {
        if (Array.isArray(part)) return part.join(" ");
        return String(part);
      })
      .join(" ")
  );
}

function scoreText(query, text) {
  const q = normalizeText(query);
  const t = normalizeText(text);

  if (!q || !t) return 0;

  let score = 0;

  if (t === q) score += 500;
  if (t.startsWith(q)) score += 350;
  if (t.includes(q)) score += 250;

  const queryTokens = getTokens(q);
  const textTokens = getTokens(t);

  queryTokens.forEach((token) => {
    if (!token) return;

    if (textTokens.includes(token)) {
      score += 80;
    } else if (t.includes(token)) {
      score += 40;
    }
  });

  const originalTokens = q.split(" ").filter(Boolean);
  const matchedOriginalTokens = originalTokens.filter((token) =>
    t.includes(token)
  );

  if (originalTokens.length > 0) {
    score += Math.round(
      (matchedOriginalTokens.length / originalTokens.length) * 100
    );
  }

  return score;
}

function getToolSearchText(tool) {
  return textFromParts([
    tool.name,
    tool.id,
    tool.slug,
    tool.description,
    tool.category,
    tool.type,
    tool.group,
    tool.shortDescription,
    tool.longDescription,
    tool.metaTitle,
    tool.metaDescription,
    tool.keywords,
    tool.tags,
  ]);
}

function getBlogSearchText(blog) {
  return textFromParts([
    blog.title,
    blog.slug,
    blog.excerpt,
    blog.category,
    blog.description,
    blog.metaTitle,
    blog.metaDescription,
    blog.keywords,
    blog.tags,
  ]);
}

function createToolResult(tool, score) {
  return {
    type: "Tool",
    id: tool.id,
    title: tool.name,
    subtitle: tool.category || "Online Tool",
    score,
    url: `/tool/${tool.id}`,
  };
}

function createBlogResult(blog, score) {
  return {
    type: "Blog",
    id: blog.slug,
    title: blog.title,
    subtitle: blog.category || "Blog",
    score,
    url: `/blog/${blog.slug}`,
  };
}

export function searchAll(query, limit = 10) {
  const q = String(query || "").trim();

  if (!q) return [];

  const results = [];

  for (const tool of tools) {
    const score = scoreText(q, getToolSearchText(tool));

    if (score > 0) {
      results.push(createToolResult(tool, score));
    }
  }

  for (const blog of blogs) {
    const score = scoreText(q, getBlogSearchText(blog));

    if (score > 0) {
      results.push(createBlogResult(blog, score));
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function searchAllGrouped(query) {
  const q = String(query || "").trim();

  if (!q) {
    return {
      tools: [],
      blogs: [],
    };
  }

  const toolResults = [];
  const blogResults = [];

  for (const tool of tools) {
    const score = scoreText(q, getToolSearchText(tool));

    if (score > 0) {
      toolResults.push({ item: tool, score });
    }
  }

  for (const blog of blogs) {
    const score = scoreText(q, getBlogSearchText(blog));

    if (score > 0) {
      blogResults.push({ item: blog, score });
    }
  }

  toolResults.sort((a, b) => b.score - a.score);
  blogResults.sort((a, b) => b.score - a.score);

  return {
    tools: toolResults.map((result) => result.item),
    blogs: blogResults.map((result) => result.item),
  };
}