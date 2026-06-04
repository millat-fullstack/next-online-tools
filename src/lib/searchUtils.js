import tools from "../data/tools.json";
import { blogs } from "../data/Blogs";

function norm(value = "") {
  return String(value || "").toLowerCase().trim();
}

function textFromParts(parts = []) {
  return parts.filter(Boolean).join(" ");
}

function scoreText(query, text) {
  const q = norm(query);
  const t = norm(text);

  if (!q || !t) return 0;

  if (t === q) return 300;
  if (t.startsWith(q)) return 220;
  if (t.includes(q)) return 150 - Math.min(t.indexOf(q), 100);

  const tokens = q.split(/\s+/).filter(Boolean);

  let score = 0;

  tokens.forEach((token) => {
    if (t.includes(token)) {
      score += 20;
    }
  });

  return score;
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
    const searchableText = textFromParts([
      tool.name,
      tool.id,
      tool.slug,
      tool.description,
      tool.category,
      Array.isArray(tool.keywords) ? tool.keywords.join(" ") : tool.keywords,
      Array.isArray(tool.tags) ? tool.tags.join(" ") : tool.tags,
    ]);

    const score = scoreText(q, searchableText);

    if (score > 0) {
      results.push(createToolResult(tool, score));
    }
  }

  for (const blog of blogs) {
    const searchableText = textFromParts([
      blog.title,
      blog.slug,
      blog.excerpt,
      blog.category,
      Array.isArray(blog.keywords) ? blog.keywords.join(" ") : blog.keywords,
      Array.isArray(blog.tags) ? blog.tags.join(" ") : blog.tags,
    ]);

    const score = scoreText(q, searchableText);

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
    const searchableText = textFromParts([
      tool.name,
      tool.id,
      tool.slug,
      tool.description,
      tool.category,
      Array.isArray(tool.keywords) ? tool.keywords.join(" ") : tool.keywords,
      Array.isArray(tool.tags) ? tool.tags.join(" ") : tool.tags,
    ]);

    const score = scoreText(q, searchableText);

    if (score > 0) {
      toolResults.push({ item: tool, score });
    }
  }

  for (const blog of blogs) {
    const searchableText = textFromParts([
      blog.title,
      blog.slug,
      blog.excerpt,
      blog.category,
      Array.isArray(blog.keywords) ? blog.keywords.join(" ") : blog.keywords,
      Array.isArray(blog.tags) ? blog.tags.join(" ") : blog.tags,
    ]);

    const score = scoreText(q, searchableText);

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