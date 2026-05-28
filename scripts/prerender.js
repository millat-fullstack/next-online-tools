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

const prerenderRoutes = [
  ...staticRoutes,
  ...tools.map((tool) => `/tool/${tool.id}`),
  ...blogs.map((blog) => `/blog/${blog.slug}`),
];

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

async function prerender() {
  const port = process.env.PRERENDER_PORT ? Number(process.env.PRERENDER_PORT) : 4173;
  const server = await startServer(port);
  console.log(`Prerender server started at http://localhost:${port}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    for (const route of prerenderRoutes) {
      const url = `http://localhost:${port}${route}`;
      console.log(`Rendering ${url}`);

      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
        await page.waitForSelector("#root > *", { timeout: 30000 });
      } catch (error) {
        console.warn(`Warning: route ${route} did not finish cleanly, saving page anyway.`, error.message);
      }

      const html = await page.content();
      const outputPath = getOutputPath(route);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, html, "utf8");
    }

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
