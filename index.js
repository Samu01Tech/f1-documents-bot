const puppeteer = require("puppeteer");

(async () => {
  console.log("Starting browser...");
  const browser = await puppeteer.launch({ headless: false });
  console.log("Opening new page...");
  const page = await browser.newPage();
  await page.goto(
    "https://www.fia.com/documents/championships/fia-formula-one-world-championship-14/season/season-2022-2005",
    {
      waitUntil: "networkidle2",
    }
  );
  await page.pdf({ path: "hn.pdf", format: "a4" });

  //wait for 10 minutes then close browser
  setTimeout(async () => {
    await browser.close();
  }, 600000);
})();
