const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const dirent of list) {
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      results = results.concat(walk(full));
    } else if (dirent.isFile() && dirent.name === 'index.html') {
      results.push(full);
    }
  }
  return results;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function truncate(str, len = 160) {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.slice(0, len - 1).replace(/\s+[^\s]*$/, '') + '…';
}

const files = walk(DIST);
console.log(`Found ${files.length} index.html files`);
let updated = 0;
for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const original = html;

  // Extract JSON-LD blocks
  const jsonLdRegex = /<script[^>]+type=(?:"|')application\/ld\+json(?:"|')[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let headline = null;
  let description = null;
  while ((match = jsonLdRegex.exec(html))) {
    try {
      const data = JSON.parse(match[1]);
      // handle arrays
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (!headline && (item.headline || item.name)) headline = item.headline || item.name;
        if (!description && item.description) description = item.description;
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  // If no JSON-LD headline, fall back to first <h1>
  if (!headline) {
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1) headline = stripTags(h1[1]);
  }

  // If no JSON-LD description, try first <p> after h1
  if (!description) {
    if (headline) {
      const afterH1 = html.split(/<h1[^>]*>[\s\S]*?<\/h1>/i)[1] || html;
      const p = afterH1.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      if (p) description = stripTags(p[1]);
    }
  }

  // As last fallback, find any meta description present in body (end of head duplicates often exist), or any paragraph in body
  if (!description) {
    const metaMatch = html.match(/<meta[^>]*name=(?:"|')description(?:"|')[^>]*content=(?:"|')([^"']*)(?:"|')[^>]*>/i);
    if (metaMatch) description = metaMatch[1];
  }

  // Prepare title and description values
  const safeHeadline = headline ? stripTags(headline) : 'Next Online Tools';
  const safeDescription = description ? stripTags(description) : 'Next Online Tools provides free browser-based tools for images, text, PDF, SEO, conversions, and more.';
  const titleText = `${safeHeadline} | Next Online Tools`;
  const descText = truncate(safeDescription, 160);

  // Remove existing <title> tags in head and insert one
  html = html.replace(/<title>[\s\S]*?<\/title>/gi, '');
  // Remove duplicate meta description tags in head
  html = html.replace(/<meta[^>]*name=(?:"|')description(?:"|')[^>]*>/gi, '');
  // Remove OG/Twitter title/description duplicates
  html = html.replace(/<meta[^>]*property=(?:"|')og:title(?:"|')[^>]*>/gi, '');
  html = html.replace(/<meta[^>]*property=(?:"|')og:description(?:"|')[^>]*>/gi, '');
  html = html.replace(/<meta[^>]*name=(?:"|')twitter:title(?:"|')[^>]*>/gi, '');
  html = html.replace(/<meta[^>]*name=(?:"|')twitter:description(?:"|')[^>]*>/gi, '');

  // Insert new tags before </head>
  const insert = [];
  insert.push(`    <title>${titleText}</title>`);
  insert.push(`    <meta name="description" content="${descText}">`);
  insert.push(`    <meta property="og:title" content="${safeHeadline}">`);
  insert.push(`    <meta property="og:description" content="${descText}">`);
  // preserve og:url if present or compute
  const rel = path.relative(DIST, file).split(path.sep).join('/');
  const pageUrl = rel === 'index.html' ? 'https://nextonlinetools.com/' : `https://nextonlinetools.com/${path.dirname(rel)}`;
  insert.push(`    <meta property="og:url" content="${pageUrl}">`);
  insert.push(`    <meta name="twitter:title" content="${safeHeadline}">`);
  insert.push(`    <meta name="twitter:description" content="${descText}">`);

  html = html.replace(/<\/head>/i, insert.join('\n') + '\n  </head>');

  if (html !== original) {
    fs.writeFileSync(file, html, 'utf8');
    updated++;
    console.log(`Updated meta for ${file}`);
  }
}
console.log(`Done. Updated meta in ${updated} files.`);
