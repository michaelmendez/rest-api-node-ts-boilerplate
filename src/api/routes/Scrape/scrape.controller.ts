
const puppeteer = require("puppeteer");
const MBTIregexTitles =
  /([E|I]+[N|S][T|F]+[P|J])|COMMENT|MBTI|MEYERS BRIGG|MEYERS-BRIGG+(?=\'?s|S)*/gim;

// ai startup
// https://www.youtube.com/watch?v=NzmoPqte4V4
// https://www.youtube.com/watch?v=Ui1KbmutX0k

// import HttpProxyAgent = require("http-proxy-agent");

import {esIsAtagURLIndexed, esIsRootURLIndexed } from "../ES/es.controller";

// const proxies = [];
import { Request, Response } from "express";
import { AllScrapings, Scraping } from "../../../../models/interfaces";
import { cheerioScrape, findMatches, findSections, processATags } from "./scrapeHelpers";

export async function scrape(req: Request, res: Response): Promise<any> {
  const website = req.body.website;
  const word = req.body.word;

  const rootUrl = website.split("//")[1];
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    return page
      .goto(website, {
        waitLoad: true,
        waitNetworkIdle: true, // defaults to false
      })
      .then(async (hbody) => {
        const { body } = cheerioScrape(
          hbody,
          rootUrl
        );
        // const scrapedObj = new ScrapedObj(word)
        const scrapedObj = {
          word,
          body: {
            date: new Date(), // Date.getDate(), //Date.now(),
            url: website,
            sentences: findMatches(body, word),
          },
        };
        // sentencesWSynonyms  = await processSynonyms(scrapedObj.body.sentences)
        // let stems = getStems(await Promise.all(lems))
        // .then(newStems => {
        //   resolve(newStems)
        // })
        // let wordsWSyn = wordLookup(newStems)
        // resolve(scrapedObj)
        return res.status(200).send({
          success: true,
          data: scrapedObj,
        });
      })
      .catch((err) => {
        // handle error
        console.error("cheerio error url: " + website + "\n" + "error: " + err);
        return res.status(404).send({
          success: false,
          message: "Users not found",
          data: err,
        });
      });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.toString(),
      data: null,
    });
  }
}

export async function scrapeAll(
  req: Request,
  res: Response
): Promise<AllScrapings[] | any> {
  const website = req.body.website;
  const rootUrl = website.split("//")[1];
  // const proxyWPort = proxies[Math.floor(Math.random() * proxies.length)].split(
  //     ':'
  //   )
  //   const proxy = {
  //     host: proxyWPort[0],
  //     port: proxyWPort[1]
  //   }

  //   const agent = new HttpProxyAgent(proxy)
  try {
    const rootIndexed: boolean = await esIsRootURLIndexed(rootUrl);
    if (!rootIndexed) {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      return page
        .goto(website, {
          waitLoad: true,
          waitNetworkIdle: true, // defaults to false
        })
        .then(async (e) => {
          const hbody = await page.content();

          // return redditScrape(hbody, website);

          if (hbody) {
            const { body, deDupedATags, allTitles } = cheerioScrape(
              hbody,
              rootUrl
            );
            if (deDupedATags.length > 0) {
              processATags(website, deDupedATags);
            }
            const rootNode = true;
            const alreadyScrapped: boolean = await esIsAtagURLIndexed(rootUrl);
            if (!alreadyScrapped) {
              const tAndS: Scraping[] = findSections(
                allTitles,
                body,
                website,
                rootNode
              );
              return res.send({
                url: website,
                data: tAndS,
              });
            } else {
              return res.json({
                err: "Url Already Indexed, but looking for A tags",
              });
            }
          }
        });
    } else {
      return res.json({
        err: "Root Url Already Indexed",
      });
    }
  } catch (err) {
    console.trace("error 131 " + err);
    res.status(500).send({
      success: false,
      message: err.toString(),
      data: null,
    });
  }
}
