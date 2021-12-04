const cheerio = require("cheerio");
const rp = require("request-promise");
import { io } from "../../../index";
import * as esController from "../ES/es.controller";
import { Section } from "../../../../models/interfaces";
import { Request, Response } from "express";
const MBTIregexTitles =
  /([E|I]+[N|S][T|F]+[P|J])|COMMENT|MBTI|MEYERS BRIGG|MEYERS-BRIGG+(?=\'?s|S)*/gim;

export function findMatches(htmlBody, word) {
  // the last word next to the punctuation is getting stripped
  const rx3 = new RegExp("[^.!?/\n/]*" + word + "[^.!?'/\n/']*[.!?/\n/]", "ig");
  const rawSentences3 = htmlBody.match(rx3);
  return rawSentences3;
}

export function cheerioScrape(hbody, rootUrl) {
  const $ = cheerio.load(hbody, {
    normalizeWhitespace: true,
    decodeEntities: false,
  });
  const htmlbody = $("body");
  const HTMLbody = htmlbody.html();
  const allTitles = [];
  $("h1, h2, h3, h4, h5, h6").map((_, element) => {
    const txt = $(element).text();
    if (MBTIregexTitles.test(txt)) {
      allTitles.push(txt);
      // $(element).parent().parent().parent().parent()
    }
  });
  const allATags = [];
  $("a").map((_, element) => {
    const txt = $(element).text();
    let aRootUrl = txt.split("//")[1];
    if (MBTIregexTitles.test(txt) && rootUrl !== aRootUrl) {
      const href = element.attribs.href;
      const text = txt;
      allATags.push({
        href,
        text,
      });
    }
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
  const body = HTMLbody.replace(removeJS, " ").replace(stripHTML, " ");
  return {
    body,
    deDupedATags,
    allTitles,
  };
}

export function findSections(titles, htmlBody, website, rootNode?): Section[] {
  // this is for the paragraph
  // (?s)((?:[^\n][\n]?)+)

  // var MBTIregex = /ISTJ|ISFJ|INFJ|INTJ|ISTP|ISFP|INFP|INTP|ESTP|ESFP|ENFP|ENTP|ESTJ|ESFJ|ENFJ|ENTJ|COMMENT+(?=\'?s)*/ig;
  const allSections = [];
  if (!htmlBody) {
    console.log("no htmlbody");
  }
  // remove extra double spaces from html body
  htmlBody = htmlBody.replace(/\s\s+/g, " ");
  const regexToRemove = new RegExp(/(?:\s*)\n\s*/, "igm");
  let match;
  let werd;
  for (let i = 0; i < titles.length; i++) {
    if (!titles[i]) {
      console.log("no title start");
    }
    const filteredStart = titles[i].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const reg1 = new RegExp(filteredStart, "ig");
    // let start = htmlBody.indexOf(titles[i])
    const start = htmlBody.search(reg1);
    // let ender = titles[i + 1]
    let section;
    let end;
    if (!titles[i + 1]) {
      console.log("no title end");
      section = htmlBody.slice(start);
    } else {
      const filteredEnd = titles[i + 1].replace(
        /[-[\]{}()*+?.,\\^$|#\s]/g,
        "\\$&"
      );
      const reg2 = new RegExp(filteredEnd, "ig");
      // let end = htmlBody.indexOf(titles[i + 1], start)
      reg2.lastIndex = start;
      end = htmlBody.search(reg2);
    }

    // if(titles.length === 1){

    // }
    if (!end || (end === -1 && i !== titles.length - 1 && titles.length > 1)) {
      // titles[i + 1]
      section = htmlBody.slice(start);
      const j = i + 1;
      console.log("couldnt find end j: " + titles[j]);
    } else if (!start || start === -1) {
      console.log("couldnt find start: " + titles[i]);
    } else {
      section = htmlBody.slice(start, end);
    }
    // let section = htmlBody.match(titleSection)
    if (section) {
      if (!section) {
        console.log("no section");
      }
      section = section.replace(regexToRemove, " ");
      // section[0] = section[0].replace(oRegexToRemove, ' ')
      section = section.replace(titles[i], "");

      werd = titles[i];
      if (!werd) {
        console.log("no werd " + titles[i]);
      }
      match = werd.match(MBTIregexTitles);
      // if no match, index under root url, ie comments
      // search rreturns index, exec returns match
      if (match === null || match === undefined) {
        match = website.match(MBTIregexTitles);
        if (match && match[0]) {
          match[0] = match[0] + " Comments";
          // (((Regexr ){1})(((was ){1})))+(?:(((created ){1}))(((by ){1})))+
        } else {
          // match = ["Comments"]
          return;
        }
      }
      const aSection = {
        title: titles[i],
        index: match[0],
        section,
        url: website,
        rootNode,
      };
      allSections.push(aSection);
    }
  }
  return allSections;
}

export async function processATags(rootURL, aTags) {
  try {
    // var hostname = rootURL;
    const hostname = new URL(rootURL).hostname;
    const websiteRegex = RegExp(
      /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi
    );
    let count = 0;
    aTags.forEach(async (e) => {
      const isUrl = websiteRegex.test(e.href);
      let url: string;
      if (!e.href) {
        debugger;
      }
      const indexOfRoot = e.href.indexOf(hostname);
      if (indexOfRoot === -1 && isUrl === false) {
        url = "http://" + hostname + e.href;
        if (!url) {
          console.log("no url");
        }
        url = url.replace(/\\/g, "/");
      } else if (indexOfRoot !== -1) {
        url = e.href;
      }
      // if is website and does not contian host
      else if (indexOfRoot === -1 && isUrl) {
        return;
      }
      if (url) {
        const partialUrl = url.split("//")[1];
        const respod: boolean = await esController.esIsAtagURLIndexed(
          partialUrl
        );
        if (respod !== true) {
          await rp(url)
            .then(async (hbody) => {
              let aRootUrl = url.split("//")[1];

              const { body, allTitles } = cheerioScrape(hbody, aRootUrl);
              // dont use the deDupedATags or it will be recurrsive
              const rootNode = false;
              const tAndS: Section[] = findSections(
                allTitles,
                body,
                rootURL,
                rootNode
              );
              io.emit("atag", {
                data: tAndS,
                url,
              });
              count++;
              console.log("got " + count);
            })
            .catch((err) => {
              console.error("error url: " + url + "\n" + "error: " + err);
            });
        } else {
          console.log(url + " already indexed");
        }
      } else {
        console.log("no url");
      }
    });
  } catch (e) {
    console.log("problem with : " + e);
  }
}

export function dedupe(arr, key) {
  return arr.reduce((acc, current) => {
    const x = acc.find((item) => item[key] === current[key]);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);
}

// *********** OLD NLP CODE **********************

// NLP FTW
// https://github.com/NaturalNode/natural
import natural = require('natural')
const wordnet = new natural.WordNet(process.env.WORDNET)
// C:\Users\djway\Desktop\Repos\djRepo\nswg\nswg
// // C: \djRepo\nswg\nswg\wordNet\dict\adj.exc
import sw = require('stopword')

//   function removeStopWords(sentences) {
//     // returns array of arrays
//     const cleanR = new RegExp('[^a-z-A-Z-. ]', 'igm')
//     const cleanS = sentences.map(sentence => {
//       if (!sentence) {
//         console.log('no sentence')
//       }
//       const removedSChar = sentence.replace(cleanR, '')
//       const cleanPass = sw.removeStopwords(removedSChar.split(' '))
//       return cleanPass.filter(w => {
//         if (w.length > 1) {
//           return w
//         }
//       })
//     })
//     return cleanS
//     // let fullC = cleanS.map(s => {
//     //   return s.filter(w => {
//     //     if (w.length > 1) {
//     //       return w
//     //     }
//     //   })
//     // })
//     // return fullC
//     // .filter(w=> {
//     //   if(w.length !== 1 ||
//     // })
//   }

//   const getLems filteredSent => {
//     return await Promise.all(
//       filteredSent.map(async sentence => {
//         const sent = await Promise.all(
//           sentence.map(async word => {
//             return new Promise(async res => {
//               const newStem = natural.PorterStemmer.stem(word)
//               wordnet.lookup(newStem, async function(results) {
//                 // let results2 = results.map(result => {
//                 console.log(word)
//                 // let newStem = natural.PorterStemmer.stem(word)
//                 // results.word = word
//                 // results.stem = newStem
//                 res({
//                   word,
//                   stem: newStem,
//                   children: {
//                     results
//                   }
//                 })
//               })
//             })
//           })
//         )
//         return {
//           sentence: sentence.join(' '),
//           words: sent
//         }
//       })
//     )
//   }

export async function wordLookup(req: Request, res: Response) {
    let word = req.params.word
    // return new Promise(resolve => {
    return wordnet.lookup(word, results => {
      console.log(word)
      const formattedResults = results.map(result => {
        return {
          rootWord: word,
          synsetOffset: result.synsetOffset,
          pos: result.pos,
          lemma: result.lemma,
          synonyms: result.synonyms,
          gloss: result.gloss
        }

      //   // console.log(synsetOffset)
      //   // console.log(result.pos)
      //   // console.log(result.lemma)
      //   // console.log(result.synonyms)
      //   // console.log(result.pos)
      //   // console.log(result.gloss)
      })
      // return goodRes
      // resolve(results)
      // return formattedResults
      res.json(formattedResults)
    })
    // })
  }

// BERT https://www.youtube.com/watch?v=u91645MFytY

// https://github.com/NaturalNode/natural
// NLP PROCESS
// Tokenizing
// natural.PorterStemmer.stem('words')
// Stemming
// Classifiers
// Bayesian and logistic regression
// var natural = require('natural');
// var classifier = new natural.BayesClassifier();
// classifier.addDocument('i am long qqqq', 'buy');
// classifier.addDocument('buy the q\'s', 'buy');
// classifier.addDocument('short gold', 'sell');
// classifier.addDocument('sell gold', 'sell');
// classifier.train();

// console.log(classifier.classify('i am short silver'));

// Sentiment Analysis
// var Analyzer = require('natural').SentimentAnalyzer;
// var stemmer = require('natural').PorterStemmer;
// var analyzer = new Analyzer("English", stemmer, "afinn");
// // getSentiment expects an array of strings
// console.log(analyzer.getSentiment(["I", "like", "cherries"]));
// // 0.6666666666666666
