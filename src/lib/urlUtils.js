export function normalizePath(path = "/") {
  if (!path) return "/";

  if (
    path.startsWith("http") ||
    path.startsWith("#") ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:")
  ) {
    return path;
  }

  const [beforeHash, hash] = path.split("#");
  const [pathname, search] = beforeHash.split("?");

  const cleanPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");

  return `${cleanPath}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`;
}

export function toolUrl(toolId) {
  return normalizePath(`/tool/${toolId}`);
}

export function blogUrl(slug) {
  return normalizePath(`/blog/${slug}`);
}

export function searchUrl(query) {
  const cleanQuery = String(query || "").trim();

  if (!cleanQuery) return "/search";

  return `/search?q=${encodeURIComponent(cleanQuery)}`;
}

export function toolsCategoryUrl(category) {
  if (!category) return "/tools";

  return `/tools?category=${encodeURIComponent(category)}`;
}