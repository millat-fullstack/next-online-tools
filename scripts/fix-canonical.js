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

function computeUrl(filePath) {
  // filePath is .../dist/.../index.html
  const rel = path.relative(DIST, filePath).split(path.sep).join('/');
  if (rel === 'index.html') return 'https://nextonlinetools.com/';
  const dir = path.dirname(rel); // e.g. 'tool/age-calculator'
  return `https://nextonlinetools.com/${dir}`;
}

const files = walk(DIST);
console.log(`Found ${files.length} index.html files in dist`);
let changed = 0;
for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const url = computeUrl(file);

  // Remove all existing canonical link tags
  const canonicalRegex = /<link[^>]*rel=(?:"canonical"|'canonical')[^>]*>/gi;
  const beforeCount = (html.match(canonicalRegex) || []).length;
  if (beforeCount === 0) {
    // Insert canonical before </head>
    html = html.replace(/<\/head>/i, `  <link rel="canonical" href="${url}">\n</head>`);
    fs.writeFileSync(file, html, 'utf8');
    changed++;
    console.log(`Inserted canonical for ${file} -> ${url}`);
    continue;
  }

  // Remove all canonical tags
  html = html.replace(canonicalRegex, '');

  // Ensure single canonical exists
  if (!html.includes('</head>')) {
    console.warn(`No </head> in ${file}, skipping`);
    continue;
  }

  // Insert canonical before </head>
  html = html.replace(/<\/head>/i, `  <link rel="canonical" href="${url}">\n</head>`);

  fs.writeFileSync(file, html, 'utf8');
  changed++;
  console.log(`Updated canonical for ${file} -> ${url} (removed ${beforeCount} duplicate(s))`);
}

console.log(`Done. Updated ${changed} files.`);
