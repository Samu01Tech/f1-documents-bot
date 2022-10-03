const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const LAST_EVENT_SELECTOR = "ul.event-wrapper:nth-child(1) ";
  const EVENT_SELECTOR = LAST_EVENT_SELECTOR;
  const DOCUMENT_SELECTOR = ".document-row";
  const documentsArray = [];

  fs.rmSync("documents.json", { force: true });
  fs.rmSync("documents.csv", { force: true });

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

  //get reference of all nodes with selector ".document-row"
  const documentNodes = await page.$$(EVENT_SELECTOR + DOCUMENT_SELECTOR);
  console.log("Found " + documentNodes.length + " documents");

  //loop through the nodes and get the innerText and href
  for (let i = 0; i < documentNodes.length; i++) {
    const documentNode = documentNodes[i];
    const documentNameTmp = await page.evaluate(
      (node) => node.innerText,
      documentNode
    );

    //clean innerText
    // const documentName = documentNameTmp.replace(/\s+/g, " ").trim();
    const documentName = documentNameTmp.split("\t\n")[0];
    const documentDate = documentNameTmp.split("\t\n")[1];

    //get document  download link
    const documentLink = await page.evaluate(
      (node) => node.firstChild.href,
      documentNode
    );

    const document = {
      name: documentName,
      date: documentDate,
      link: documentLink,
    };

    //write the data to a file
    fs.appendFileSync(
      "documents.csv",
      `${documentName}, ${documentDate}, ${documentLink}\n`
    );

    documentsArray.push(document);
  }
  
  fs.appendFileSync("documents.json", JSON.stringify(documentsArray));
  console.log("Done!");

  // const read = fs.readFileSync("documents.json", { encoding: "utf8" });
  // console.log(JSON.parse(read)[0]);

  //wait for 0 minutes then close browser
  setTimeout(async () => {
    await browser.close();
  }, 0);
})();
