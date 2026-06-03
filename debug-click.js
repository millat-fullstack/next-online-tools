const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const dist = path.join(process.cwd(),'dist');
function serve(req,res){
  try{
    const url = new URL(req.url, 'http://localhost:4180');
    let p = url.pathname;
    if(p.endsWith('/')) p += 'index.html';
    const fp = path.join(dist, p.slice(1));
    const data = fs.readFileSync(fp);
    const ext = path.extname(fp);
    const types = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.wasm':'application/wasm'};
    res.writeHead(200, {'Content-Type': types[ext]||'text/html; charset=utf-8'});
    res.end(data);
  } catch(e){
    const html = fs.readFileSync(path.join(dist,'index.html'),'utf8');
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
    res.end(html);
  }
}

(async()=>{
  const server = http.createServer(serve);
  server.listen(4180);
  const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
  const page = await browser.newPage();
  await page.goto('http://localhost:4180/');
  await page.waitForSelector('aside');
  const allTools = await page.$('a[href="/tools"]');
  if(!allTools){ console.log('All Tools link not found'); await browser.close(); server.close(); return; }
  await page.evaluate(()=>{ window.logged=[]; document.addEventListener('click',e=>{ window.logged.push({type:'click',target:e.target.tagName, cls: e.target.className, time:Date.now()}); }, true); });
  console.log('Clicking All Tools once');
  await allTools.click({delay:100});
  await page.waitForTimeout(300);
  console.log('After 1 click, pathname=', await page.evaluate(()=>location.pathname));
  console.log('Clicking All Tools second time');
  await allTools.click({delay:100});
  await page.waitForTimeout(300);
  console.log('After 2 clicks, pathname=', await page.evaluate(()=>location.pathname));
  console.log('recent clicks', await page.evaluate(()=>window.logged.slice(-10)));
  const blogLink = await page.$('a[href="/blog"]');
  if(blogLink){ console.log('Clicking Blog once'); await blogLink.click({delay:100}); await page.waitForTimeout(300); console.log('pathname after blog 1 click', await page.evaluate(()=>location.pathname)); }
  await browser.close(); server.close();
})();
