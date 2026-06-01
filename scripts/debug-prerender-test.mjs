import puppeteer from "puppeteer";

const urls = [
  "http://localhost:4173/",
  "http://localhost:4173/tools",
  "http://localhost:4173/blog",
  "http://localhost:4173/about",
  "http://localhost:4173/contact",
];

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();

  page.on("console", (msg) => {
    console.log("PAGE CONSOLE", msg.type(), msg.text());
  });
  page.on("pageerror", (err) => {
    console.log("PAGE ERROR", err.message);
  });
  page.on("requestfailed", (req) => {
    console.log("REQUEST FAILED", req.url(), req.failure()?.errorText);
  });

  for (const url of urls) {
    console.log("\n---", url, "---");
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      const hasRoot = await page.evaluate(() => !!document.querySelector("#root"));
      const rootChildren = await page.evaluate(() => document.querySelector("#root")?.children.length ?? -1);
      const rootHTML = await page.evaluate(() => document.querySelector("#root")?.outerHTML || "NO_ROOT");
      console.log("hasRoot=", hasRoot, "childCount=", rootChildren);
      console.log("rootOuterHTML=", rootHTML.slice(0, 200));
      const fileContent = await page.evaluate(() => document.documentElement.outerHTML.slice(0, 400));
      console.log("documentHTML_PREFIX=", fileContent.replace(/\n/g, " "));
    } catch (err) {
      console.error("ERROR", err);
    }
  }

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
