const puppeteer = require("puppeteer");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const token = process.env.TELEGRAM_TOKEN;
let bot = new TelegramBot(token, { polling: true });

(async () => {
  const LAST_EVENT_SELECTOR = "ul.event-wrapper ";
  const EVENT_SELECTOR = LAST_EVENT_SELECTOR;
  const DOCUMENT_SELECTOR = ".document-row";

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(
    "https://www.fia.com/documents/championships/fia-formula-one-world-championship-14/season/season-2022-2005",
    {
      waitUntil: "networkidle2",
    }
  );
  while (true) {
    console.log("Checking for new documents...");
    const documentsArray = [];
    let oldDocumentsArray = [];

    if (fs.existsSync("documents.json")) {
      oldDocumentsArray = JSON.parse(fs.readFileSync("documents.json", "utf8"));
    }

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
      const documentName = documentNameTmp.replace(/\s+/g, " ").trim();

      //get document  download link
      const documentLink = await page.evaluate(
        (node) => node.firstChild.href,
        documentNode
      );

      const document = {
        name: documentName,
        // date: documentDate,
        link: documentLink,
      };

      documentsArray.push(document);
    }

    //compare old and new array
    const newDocumentsArray = documentsArray.filter((document) => {
      return !oldDocumentsArray.some((oldDocument) => {
        return oldDocument.name === document.name;
      });
    });
    console.log("Found " + newDocumentsArray.length + " new documents");

    let messageCounter = 0;
    //for each new document send a message to telegram
    newDocumentsArray.forEach((document) => {
      bot.sendMessage(
        process.env.TELEGRAM_CHAT_ID,
        document.name + " " + document.link
      );

      messageCounter++;
      //check if messageCounter is multiple of 10
      if (messageCounter % 10 === 0) {
        setTimeout(() => {}, 10000);
      }
    });

    // save the new documents to a file
    fs.writeFileSync("documents.json", JSON.stringify(documentsArray));

    //wait for 10 seconds
    await page.waitForTimeout(10000);
  }

  //wait for 0 minutes then close browser
  await browser.close();
})();
