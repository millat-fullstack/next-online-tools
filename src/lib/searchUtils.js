// src/lib/searchUtils.js
// Lightweight in-memory search used for GlobalSearch & SearchResults.
// No external deps.

import tools from "../data/tools.json";
import { blogs } from "../data/Blogs";

/** normalize string */
function norm(s = "") {
  return String(s || "").toLowerCase();
}

/** simple score for substring matches */
function scoreText(q, text) {
  const Q = norm(q);
  const T = norm(text || "");
  if (!Q || !T) return 0;
  if (T.includes(Q)) return 100 - T.indexOf(Q);
  const tokens = Q.split(/\s+/).filter(Boolean);
  let score = 0;
  tokens.forEach((t) => {
    if (T.includes(t)) score += 10;
  });
  return score;
}

function createToolResult(tool, score) {
  return {
    type: "Tool",
    id: tool.id,
    title: tool.name,
    subtitle: tool.category,
    score,
    url: `/tool/${tool.id}`,
  };
}

function createBlogResult(blog, score) {
  return {
    type: "Blog",
    id: blog.slug,
    title: blog.title,
    subtitle: blog.category,
    score,
    url: `/blog/${blog.slug}`,
  };
}

export function searchAll(query, limit = 10) {
  const q = String(query || "").trim();
  if (!q) return [];

  const results = [];

  for (const tool of tools) {
    const s = Math.max(
      scoreText(q, tool.name),
      scoreText(q, tool.description),
      scoreText(q, tool.category)
    );
    if (s > 0) {
      results.push(createToolResult(tool, s));
    }
  }

  for (const blog of blogs) {
    const s = Math.max(
      scoreText(q, blog.title),
      scoreText(q, blog.excerpt),
      scoreText(q, blog.category)
    );
    if (s > 0) {
      results.push(createBlogResult(blog, s));
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

export function searchAllGrouped(query) {
  const q = String(query || "").trim();
  if (!q) return { tools: [], blogs: [] };

  const toolsRes = [];
  const blogsRes = [];

  for (const tool of tools) {
    const s = Math.max(
      scoreText(q, tool.name),
      scoreText(q, tool.description),
      scoreText(q, tool.category)
    );
    if (s > 0) toolsRes.push({ item: tool, score: s });
  }

  for (const blog of blogs) {
    const s = Math.max(
      scoreText(q, blog.title),
      scoreText(q, blog.excerpt),
      scoreText(q, blog.category)
    );
    if (s > 0) blogsRes.push({ item: blog, score: s });
  }

  toolsRes.sort((a, b) => b.score - a.score);
  blogsRes.sort((a, b) => b.score - a.score);

  return {
    tools: toolsRes.map((r) => r.item),
    blogs: blogsRes.map((r) => r.item),
  };
}
