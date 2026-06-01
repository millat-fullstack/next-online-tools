import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const distDir = path.resolve('./dist');

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wasm': 'application/wasm',
  }[ext] || 'application/octet-stream';
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(distDir, pathname.slice(1));
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(data);
  } catch (err) {
    try {
      const html = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err2) {
      res.writeHead(500);
      res.end('Server error');
    }
  }
}

async function startServer(port) {
  const server = http.createServer(serveStatic);
  return new Promise((resolve, reject) => {
    server.listen(port, () => resolve(server));
    server.on('error', reject);
  });
}

async function run() {
  const port = 4175;
  const server = await startServer(port);
  console.log('static server listening on', port);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    const args = msg.args();
    Promise.all(args.map((arg) => arg.jsonValue())).then((vals) => {
      console.log('PAGE CONSOLE', msg.type(), ...vals);
    }).catch(() => {
      console.log('PAGE CONSOLE', msg.type(), msg.text());
    });
  });
  page.on('pageerror', (err) => {
    console.log('PAGE ERROR', err.message);
    console.log(err.stack);
  });
  page.on('requestfailed', (req) => {
    console.log('REQUEST FAILED', req.url(), req.failure()?.errorText);
  });

  const urls = [
    `http://localhost:${port}/`,
    `http://localhost:${port}/blog/how-to-compress-images-without-losing-quality`,
    `http://localhost:${port}/blog/how-to-convert-heic-to-jpg-on-windows`,
  ];

  for (const url of urls) {
    console.log('going to', url);
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      const rootInfo = await page.evaluate(() => {
        const root = document.querySelector('#root');
        return {
          hasRoot: !!root,
          childCount: root?.children.length ?? -1,
          html: root?.outerHTML?.slice(0, 200) ?? null,
        };
      });
      console.log('rootInfo', rootInfo);
    } catch (err) {
      console.error('goto error', err);
    }
  }

  await browser.close();
  server.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
