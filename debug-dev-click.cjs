const puppeteer = require('puppeteer');
(async()=>{
  const browser = await puppeteer.launch({headless:true, args:['--no-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width:1280, height:900});
  try{
    const url = 'http://localhost:5174/';
    console.log('goto', url);
    await page.goto(url, {waitUntil:'networkidle2', timeout:90000});
    await page.waitForSelector('aside');
      // inspect overlay at /tools link
    const allTools = await page.$('a[href="/tools"]');
    if(!allTools){ console.log('All Tools link not found'); await browser.close(); return; }
    await page.evaluate(el=>el.scrollIntoView({block:'center'}), allTools);
      // check header and nav bounding boxes
      const boxes = await page.evaluate(()=>{
        const header = document.querySelector('header');
        const navLinks = Array.from(document.querySelectorAll('aside nav a')).slice(0,5);
        return {
          header: header ? header.getBoundingClientRect().toJSON() : null,
          links: navLinks.map(a=>({href:a.getAttribute('href'), rect: a.getBoundingClientRect().toJSON(), z: window.getComputedStyle(a).zIndex }))
        };
      });
      console.log('boxes', boxes);
    await page.evaluate(()=>{ window.logged=[]; document.addEventListener('click', e=>{ window.logged.push({t:e.target.tagName, cls:e.target.className}); }, true); });

    // test All Tools
    console.log('Clicking All Tools once');
    try{ await allTools.click({delay:100}); } catch(e){ console.log('click failed:', e.message); }
    await new Promise(r=>setTimeout(r,300));
    console.log('After 1 click path:', await page.evaluate(()=>location.pathname));

    console.log('Clicking All Tools second time');
    try{ await allTools.click({delay:100}); } catch(e){ console.log('click failed2:', e.message); }
    await new Promise(r=>setTimeout(r,300));
    console.log('After 2 clicks path:', await page.evaluate(()=>location.pathname));
    console.log('recent clicks', await page.evaluate(()=>window.logged.slice(-10)));

    // test blog
    const blogLink = await page.$('a[href="/blog"]');
    if(blogLink){ console.log('Clicking Blog once'); await blogLink.click({delay:100}); await new Promise(r=>setTimeout(r,300)); console.log('path after blog click', await page.evaluate(()=>location.pathname)); }

  }catch(err){ console.error('test error', err); }
  await browser.close();
})();
