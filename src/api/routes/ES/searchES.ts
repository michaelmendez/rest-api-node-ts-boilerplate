// @ts-nocheck
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
// const chromeLauncher = require('chrome-launcher')
// import { Cluster } from ('pupCluster')
// const cluster = require('./pupCluster')
// const { Cluster } = require('puppeteer-cluster')
import { Cluster } from "puppeteer-cluster";

// import socket from '../../'
import { io } from "../../../index";

// import Cluster from 'puppeteer-cluster'

// import cluster from './index.js'

// module.exports = function launchChrome(website, word) {
//   chromeLauncher
//     .launch({
//       startingUrl: 'https://google.com',
//       port: 9222,
//       chromeFlags: ['--headless', '--disable-gpu']
//     })
//     .then(chrome => {
//       console.log(`Chrome debugging port running on ${chrome.port}`)
//     })
// }

// const cluster = Cluster.launch({
//   //   concurrency: Cluster.CONCURRENCY_CONTEXT,
//   maxConcurrency: 10
// })

// https://github.com/checkly/puppeteer-examples/blob/master/5.%20parallel-pages/screenshots_parallel.js

export const singleSearch = async (ESresponse: any, werd: any) => {
  // https://github.com/thomasdondorf/puppeteer-cluster#clusterqueuedata--taskfunction
  // if (cluster === null) {
  //   module.exports = cluster = startPuppet()
  // }
  try {
    // filter for unique urls
    ESresponse = uniq(ESresponse);
    const puppeteer = require("puppeteer");
    const browser = await puppeteer.launch();

    const page = await browser.newPage();
    const finished = ESresponse.map(async (es: any) => {
      // ESresponse.forEach(async (result) => {
      await page.goto(es._source.url, {
        waitLoad: true,
        waitNetworkIdle: true, // defaults to false
      }); // , { waitUntil: 'load' }
      // let werd = ESresponse[i]
      await page.evaluate(() => {
        window.find(werd); // ._index
      }, werd);
      // let screennshot = await puppetExecute(ESresponse[i]._source.url, werd)
      // cluster.queue({ url: ESresponse[i]._source.url, word: werd })
      const screenshot = await page.screenshot(); // { path: './screenshots/'+ werd + i +'.jpg', type: 'jpeg' }
      const packet = {
        url: es._source.url,
        word: werd,
        screenshot,
      };
      console.log("emitting screenshot");
      io.emit("screenshot", packet);
    });
    await Promise.all(finished);
    // if(finished){
    io.emit("searchingDone", {
      data: "Finished Searching Results",
    });

    // await browser.close()
    console.log("server done");
    return {
      response: "recieved Elastic Search response",
    };
  } catch (err) {
    // handle error
    console.log("cherrio error" + err);
  }
};
function uniq(a: any) {
  const seen = {};
  return a.filter((item: any) => {
    return seen.hasOwnProperty(item._source.url)
      ? false
      : (seen[item._source.url] = true);
  });
}

export const clusterSearch = async (
  ESresponse: any,
  werd: any
): Promise<any> => {
  // export function clusterSearch(ESresponse:any, werd:any) {
  // https://github.com/thomasdondorf/puppeteer-cluster#clusterqueuedata--taskfunction
  ESresponse = uniq(ESresponse);
  try {
    const fun = (async () => {
      const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 10,
      });

      const getSentence = async ({ page, data }) => {
        const { url, wordInSentence } = data;
        // url = url.replace(/\//g,"\\")
        console.log("going to url: " + url);
        try {
          await page.goto(url, {
            waitLoad: true,
            waitNetworkIdle: true, // defaults to false
          });
          if (wordInSentence) {
            await page.evaluate((wordInSentence1) => {
              window.scrollBy(0, Math.floor(Math.random() * 500));
              const found = window.find(wordInSentence1); // ._index
              if (!found) {
                window.scrollBy(0, Math.floor(Math.random() * 500));
                window.find(wordInSentence1);
              }
            }, wordInSentence);
          }
          const screenshot = await page.screenshot();
          const packet = {
            url,
            word: wordInSentence,
            screenshot,
          };
          console.log("streaming results: " + url);
          io.emit("screenshot", packet);
        } catch (e) {
          console.log("cluster page error: " + e);
        }
      };

      cluster.task(getSentence);

      // let rx3 = new RegExp('[^.!?/\n/]*' + werd + "[^.!?'/\n/']*[.!?/\n/]", 'igm')
      const rx3 = new RegExp("([^./\n/\r]*" + werd + "[^./\r/\n]*.)", "ig");
      const finished: any[] = [];
      ESresponse.forEach(async (es: any) => {
        const page = es._source.url;
        const url = es._source.url;
        let wordInSentence = "";
        if (es._source.sentences) {
          es._source.sentences.every((sentence) => {
            if (sentence.sentence.match(rx3)) {
              wordInSentence = sentence.sentence;
              return false;
            } else {
              return true;
            }
          });
        } else if (es._source.section && es._source.section.trim()) {
          if (typeof es._source.section === "string") {
            const match = es._source.section.match(rx3);
            wordInSentence = match ? match[0].trim() : es._source.section;
          } else {
            wordInSentence = es._source.section[0];
          }
        } else {
          wordInSentence = werd;
        }
        // let rx3 = new RegExp('[^.!?/\n/]*' + word + "[^.!?'/\n/']*[.!?/\n/]", 'igm')
        // let rawSentences3 = htmlBody.match(rx3)
        finished.push(
          await cluster.queue(
            {
              url,
              wordInSentence,
            },
            getSentence
          )
        );
        //   cluster.queue(async ({ page, data: url }) => {
        //     await page.goto(url)
        //     await page.evaluate(wordInSentence => {
        //       window.find(wordInSentence) // ._index
        //     }, wordInSentence)
        //     let screenshot = await page.screenshot()
        //     let packet = {
        //       url: url,
        //       word: word,
        //       screenshot: screenshot
        //     }
        //     io.emit('screenshot', packet)
        //   });
        // }
      });
      await Promise.all(finished);
      // if(finished){
      io.emit("searchingDone", {
        data: "Finished Searching Results",
      });

      await cluster.idle();
      await cluster.close();
    })();
    return "Streaming Results for " + werd;
  } catch (err) {
    // handle error
    console.log("cherrio error" + err);
    return "problem with streaming Results";
  }
};

// const promises = []
//     for (let j = 0; j < parallel; j++) {
//       let elem = i + j
//       // only proceed if there is an element
//       if (colleges[elem] != undefined) {
//         // Promise to take Screenshots
//         // promises push
//         console.log('🖖 I promise to screenshot: ' + colleges[elem].name)
//         promises.push(browser.newPage().then(async page => {
//           await page.setViewport({ width: 1280, height: 800 })
//           try {
//             // Only create screenshot if page.goto get's no error
//             await page.goto(colleges[elem].url)
//             await page.screenshot({ path: elem + ' ' + colleges[elem].name +'.png' }).then(console.log('🤞 I have kept my promise to screenshot ' + colleges[elem].name))
//           } catch (err) {
//             console.log('❌ Sorry! I couldn\'t keep my promise to screenshot ' + colleges[elem].name)
//           }
//         }))
//       }
//     }

//     // await promise all and close browser
//     await Promise.all(promises)
