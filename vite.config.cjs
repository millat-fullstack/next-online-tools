const fs = require("fs");
const path = require("path");
const react = require("@vitejs/plugin-react");
const vitePrerender = require("vite-plugin-prerender");
const { blogs } = require("./src/data/Blogs.js");

const tools = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "src/data/tools.json"), "utf-8"),
);

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

module.exports = {
  plugins: [
    react(),
    vitePrerender({
      staticDir: path.resolve(__dirname, "dist"),
      routes: prerenderRoutes,
      renderer: new vitePrerender.PuppeteerRenderer({
        renderAfterDocumentEvent: "prerender-ready",
      }),
      minify: {
        collapseWhitespace: true,
        keepClosingSlash: true,
        decodeEntities: true,
      },
    }),
  ],
  base: "/",
};