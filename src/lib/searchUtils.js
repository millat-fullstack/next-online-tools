// src/lib/searchUtils.js
// Lightweight in-memory search used for GlobalSearch & SearchResults.
// No external deps.

import tools from "../data/tools.json"; // assume tools.json default export (array)
import { blogs } from "../data/Blogs";
import { articles } from "../data/Articles";

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
  // token match
  const tokens = Q.split(/\s+/).filter(Boolean);
  let score = 0;
  tokens.forEach((t) => {
    if (T.includes(t)) score += 10;
  });
  return score;
}

/** return results limited */
export function searchAll(query, limit = 10) {
  const q = String(query || "").trim();
  if (!q) return [];

  const results = [];

  // tools
  for (const t of tools) {
    const s = Math.max(scoreText(q, t.name), scoreText(q, t.description), scoreText(q, t.category));
    if (s > 0) {
      results.push({
        type: "Tool",
        id: t.id,
        title: t.name,
        score: s,
        url: `/tool/${t.id}`,
      });
    }
  }

  // blogs
  for (const b of blogs) {
    const s = Math.max(scoreText(q, b.title), scoreText(q, b.description || b.content || ""));
    if (s > 0) {
      results.push({
        type: "Blog",
        id: b.id,
        title: b.title,
        score: s,
        url: `/blogs/${b.slug}`,
      });
    }
  }

  // articles
  for (const a of articles) {
    const s = Math.max(scoreText(q, a.title), scoreText(q, a.description || a.content || ""));
    if (s > 0) {
      results.push({
        type: "Article",
        id: a.id,
        title: a.title,
        score: s,
        url: `/articles/${a.slug}`,
      });
    }
  }

  // sort by score desc and return top limit
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

/** full search for results page — grouped */
export function searchAllGrouped(query) {
  const q = String(query || "").trim();
  if (!q) return { tools: [], blogs: [], articles: [] };

  const toolsRes = [];
  const blogsRes = [];
  const articlesRes = [];

  for (const t of tools) {
    const s = Math.max(scoreText(q, t.name), scoreText(q, t.description), scoreText(q, t.category));
    if (s > 0) toolsRes.push({ item: t, score: s });
  }
  for (const b of blogs) {
    const s = Math.max(scoreText(q, b.title), scoreText(q, b.description || b.content || ""));
    if (s > 0) blogsRes.push({ item: b, score: s });
  }
  for (const a of articles) {
    const s = Math.max(scoreText(q, a.title), scoreText(q, a.description || a.content || ""));
    if (s > 0) articlesRes.push({ item: a, score: s });
  }

  toolsRes.sort((x, y) => y.score - x.score);
  blogsRes.sort((x, y) => y.score - x.score);
  articlesRes.sort((x, y) => y.score - x.score);

  return {
    tools: toolsRes.map(r => r.item),
    blogs: blogsRes.map(r => r.item),
    articles: articlesRes.map(r => r.item),
  };
}
