const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const rp = require("request-promise");
import { v4 as uuidv4 } from "uuid";
const MBTIregexTitles =
  /([E|I]+[N|S][T|F]+[P|J])|COMMENT|MBTI|MEYERS BRIGG|MEYERS-BRIGG+(?=\'?s|S)*/gim;

let browser = null;
let page = null;
// ai startup
// https://www.youtube.com/watch?v=NzmoPqte4V4
// https://www.youtube.com/watch?v=Ui1KbmutX0k

// import HttpProxyAgent = require("http-proxy-agent");

import { esIsAtagURLIndexed, esIsRootURLIndexed } from "./es.controller";

// const proxies = [];
import { Request, Response } from "express";
import {
  AllSections,
  Entity,
  Extraction,
  Section,
} from "../../models/interfaces";
import {
  cheerioScrape,
  dedupe,
  findMatches,
  findMBTISections,
  findTextSections,
  processATags,
} from "./scrapeHelpers";
import { io } from "..";
import { IAnalyzedSection } from "../api/models/analyzedSection";

export async function scrape(req: Request, res: Response): Promise<any> {
  const website = req.body.website;
  const word = req.body.word;

  const rootUrl = website.split("//")[1];
  try {
    browser = await puppeteer.launch();
    page = await browser.newPage();

    return page
      .goto(website, {
        waitLoad: true,
        waitNetworkIdle: true, // defaults to false
      })
      .then(async (hbody) => {
        const { body } = cheerioScrape(hbody, rootUrl);
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
): Promise<AllSections[] | any> {
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
      browser = await puppeteer.launch();
      page = await browser.newPage();

      return page
        .goto(website, {
          waitLoad: true,
          waitNetworkIdle: true, // defaults to false
          waitUntil: "networkidle2",
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
              const tAndS: Section[] = findMBTISections(
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

export const getResources = async (
  req: Request,
  res: Response
): Promise<any> => {
  let entity: Entity = req.body;

  try {
    browser = await puppeteer.launch();
    page = await browser.newPage();

    let searchResults = await googleSearch(entity.name);
    return res.status(200).send({
      success: true,
      data: searchResults,
    });
  } catch (e) {
    console.log(e);
  }
};

export const extract = async (req: Request, res: Response): Promise<any> => {
  const searchReq = req.body;
  try {
    browser = await puppeteer.launch();
    page = await browser.newPage();

    await extractInfo(
      searchReq, res
    );
  } catch (e) {
    console.log(e);
  }
};

const extractInfo = async (searchReq: {
  entity: Entity;
  url: string;
}, res): Promise<any> => {
  const website = searchReq.url;
  // let url = `https://www.google.com/search?q=${searchWord}`;


  // const options = {
  //   method: "POST",
  //   // uri: "http://192.168.1.166:5000/getTripples/doc",

  //   uri: "http://0.0.0.0:5000/scrape",
  //   body: searchReq,
  //   json: true, // Automatically stringifies the body to JSON
  // };
  //  rp(options)
  //   .then((resp: string) => {
  //     console.log(resp)
  //     return resp
  //   })
  //   .catch((err) => {
  //     // POST failed...
  //     console.error("fail");
  //     console.log(err);
  //   });




  await page.goto(website, {
    waitLoad: true,
    waitNetworkIdle: true, // defaults to false
  });
  const hbody = await page.content();
  if (hbody) {
    const { body, deDupedATags, allTitles, html} = cleanDoc(hbody);

    if (deDupedATags.length > 0) {
      processATags(website, deDupedATags);
    }
    const rootNode = true;
    let sections: Section[] = await findTextSections(
      allTitles,
      body,
      website,
      rootNode
    );
    let uuid = uuidv4();
    res.status(200).send({
      data: {
          uuid,
          url: website,
          data: sections,
          html
        },
    });
    // send to python
    if (sections) {
        while(sections.length){
          let section = Object.assign({}, sections[0])
          const options = {
            method: "POST",
            uri: "http://0.0.0.0:5000/sections",
            body: {sections: [section], uuid},
            json: true, // Automatically stringifies the body to JSON
          };

          await rp(options).then((parsedBody: IAnalyzedSection) => {
            io.emit(uuid, parsedBody);
            sections = sections.filter(s=> s.title !== section.title)
          })
          .catch((err) =>{
            io.emit(uuid, err);
            sections = sections.filter(s=> s.title !== section.title)
          })
        }
        console.log('done while loop')
        io.emit(uuid, 'done');

    }
  }
};

const cleanDoc = (
  hbody: any
): { body: string; deDupedATags: any[]; allTitles: any[], html: string} => {
  const $ = cheerio.load(hbody, {
    normalizeWhitespace: true,
    decodeEntities: false,
  });

  const htmlbody = $("body");
  const HTMLbody = htmlbody.html();
  // const scriptRemove = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/g
  const scriptRemove = new RegExp(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/,
    "g"
  );
  const htmlNoScript = HTMLbody.replace(scriptRemove, '')

  const allTitles = [];
  $("h1, h2, h3, h4, h5, h6").map((_, element) => {
    const txt = $(element).text();
    allTitles.push(txt);
  });


  const allATags = [];
  $("a").map((_, element) => {
    const elementAtag = $(element)
    // .attr('href')
    const txt = elementAtag.text();
    const href = elementAtag.attr('href')
    const text = txt;
    allATags.push({
      href,
      text,
    });
  });
  // remove duplicate urls
  const deDupedATags = dedupe(allATags, "href");
  // <[^>]*>
  // no script tags // no input tags // no style tags // no form tags // no footer tags
  const removeJS = new RegExp(
    /(<script\b[^>]*>([\s\S]*?)<\/script>)|(<(input.*?)>)|(\<style(.[^\<]*)\<\/style\>)|(\<form\b[^>]*>([\s\S]*?)<\/form\>)|(\<footer\b[^>]*>([\s\S]*?)<\/footer\>)/,
    "g"
  );
  const stripHTML = new RegExp(/<[^>]*>/, "g");
  if (!HTMLbody) {
    console.log("no HTMLbody");
  }
  let html = HTMLbody.replace(removeJS, " ")
  const body = html.replace(stripHTML, " ");
  return {
    html,
    body,
    deDupedATags,
    allTitles,
  };
};

const googleSearch = async (searchWord) => {
  const url = `https://www.google.com/search?q=${searchWord}`;
  await page.goto(url, {
    waitLoad: true,
    waitNetworkIdle: true, // defaults to false
  });
  await page.waitForSelector(".yuRUbf", { timeout: 10000 });
  const site = await page.content();
  const $ = cheerio.load(site, {
    normalizeWhitespace: true,
    decodeEntities: false,
  });
  let results = [];
  $(".yuRUbf").map((_, element) => {
    let anchor = $(element).find("a").attr("href");
    let heading = $(element).find("h3").text();
    results.push({ anchor, heading });
  });
  return results;
};
const duckduckgoSearch = async (site) => {
  let url = "https://duckduckgo.com/";
};

const ecosia = async (site) => {
  let url = "https://www.ecosia.org/?c=en";
};
