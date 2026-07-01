import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import { blogs } from "../src/data/Blogs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "..", "dist");
const toolsFile = path.resolve(__dirname, "..", "src", "data", "tools.json");

const tools = JSON.parse(await fs.readFile(toolsFile, "utf8"));

const staticRoutes = [
  "/",
  "/tools",
  "/blog",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
];

const useFullPrerender = process.env.PRERENDER_ALL === "true" || process.argv.includes("--full");
const coreToolIds = new Set([
  "image-compressor",
  "case-converter",
  "color-picker",
  "csv-to-xls-converter",
  "pdf-to-jpg-converter",
  "merge-pdf",
  "smart-photo-editor",
]);
const coreBlogSlugs = new Set([
  "best-free-online-tools",
  "how-to-compress-images-without-losing-quality",
  "how-to-convert-heic-to-jpg-on-windows",
]);

const toolRoutes = (useFullPrerender
  ? tools
  : tools.filter((tool) => coreToolIds.has(tool.id))
).map((tool) => `/tool/${tool.id}`);

const blogRoutes = (useFullPrerender
  ? blogs
  : blogs.filter((blog) => coreBlogSlugs.has(blog.slug))
).map((blog) => `/blog/${blog.slug}`);

const prerenderRoutes = [...staticRoutes, ...toolRoutes, ...blogRoutes];

if (!useFullPrerender) {
  console.log(`Prerendering ${prerenderRoutes.length} core routes. Set PRERENDER_ALL=true to prerender every tool and blog page.`);
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "font/otf",
};

function getContentType(filePath) {
  return mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }

  const filePath = path.join(distDir, pathname.slice(1));

  try {
    const data = await fs.readFile(filePath);
    response.writeHead(200, { "Content-Type": getContentType(filePath) });
    response.end(data);
  } catch (error) {
    const indexPath = path.join(distDir, "index.html");
    const html = await fs.readFile(indexPath, "utf8");
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(html);
  }
}

async function startServer(port) {
  const server = http.createServer(serveStatic);
  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, () => resolve(server));
  });
}

function getOutputPath(route) {
  if (route === "/") {
    return path.join(distDir, "index.html");
  }

  return path.join(distDir, route.slice(1), "index.html");
}

async function renderRoute(page, route, port) {
  const url = `http://localhost:${port}${route}`;
  console.log(`Rendering ${url}`);

  const isBlogRoute = route.startsWith("/blog/");
  const loadTimeout = isBlogRoute ? 120000 : 60000;
  const waitTimeout = isBlogRoute ? 20000 : 10000;

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: loadTimeout });
    await page.waitForSelector("#root > *", { timeout: waitTimeout });

    if (isBlogRoute) {
      try {
        await page.waitForFunction(
          () => {
            const hasH1 = document.querySelector("h1");
            const hasCard = document.querySelector("[class*='card']");
            const hasContent = document.body.innerText.length > 2000;
            const noLoading = !document.body.innerText.includes("Loading...");
            return (hasH1 || hasCard) && hasContent && noLoading;
          },
          { timeout: waitTimeout }
        );
      } catch {
        console.warn(`Blog content wait timeout for ${route}. Will save partial content.`);
      }
    }
  } catch (error) {
    console.warn(`Warning: route ${route} did not finish cleanly, saving page anyway.`, error.message);
  }

  const html = await page.content();
  const outputPath = getOutputPath(route);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, html, "utf8");
}

async function prerender() {
  const port = process.env.PRERENDER_PORT ? Number(process.env.PRERENDER_PORT) : 4173;
  const concurrency = Math.max(1, Math.min(4, Number(process.env.PRERENDER_CONCURRENCY) || 2));
  const server = await startServer(port);
  console.log(`Prerender server started at http://localhost:${port}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const pages = await Promise.all(
      Array.from({ length: concurrency }, () => browser.newPage())
    );

    await Promise.all(
      pages.map((page) => page.setViewport({ width: 1280, height: 800 }))
    );

    pages.forEach((page) => {
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          console.error(`Browser console error: ${msg.text()}`);
        }
      });

      page.on("error", (err) => {
        console.error(`Page error: ${err}`);
      });
    });

    const routes = [...prerenderRoutes];

    await Promise.all(
      pages.map((page) =>
        (async () => {
          while (routes.length) {
            const route = routes.shift();
            if (!route) break;
            await renderRoute(page, route, port);
          }
        })()
      )
    );

    console.log("Prerender complete.");
  } finally {
    await browser.close();
    server.close();
  }
}

prerender().catch((error) => {
  console.error("Prerender failed:", error);
  process.exit(1);
});
