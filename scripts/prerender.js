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

    // Capture console messages for debugging
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error(`Browser console error: ${msg.text()}`);
      }
    });

    // Capture page errors
    page.on("error", (err) => {
      console.error(`Page error: ${err}`);
    });

    for (const route of prerenderRoutes) {
      const url = `http://localhost:${port}${route}`;
      console.log(`Rendering ${url}`);

      const isBlogRoute = route.startsWith("/blog/");
      const loadTimeout = isBlogRoute ? 90000 : 60000;
      const waitTimeout = isBlogRoute ? 60000 : 30000;

      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: loadTimeout });
        await page.waitForSelector("#root > *", { timeout: waitTimeout });
        
        // For blog routes, wait for actual blog content or give up after timeout
        if (isBlogRoute) {
          try {
            // Wait for either H1 (blog title) or specific blog class
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
          } catch (waitError) {
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
