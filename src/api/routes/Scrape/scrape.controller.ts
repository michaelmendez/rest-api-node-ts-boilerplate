// const URL = require('url').URL
// const URL = URL.URL
const cheerio = require('cheerio')
const rp = require('request-promise')
const puppeteer = require('puppeteer')
// import cheerio from 'cheerio'
// import puppeteer from 'puppeteer'
// import rp from 'request-promise'
import { URL } from 'url'
import { io } from '../../../index'
// const rp = util.promisify(requestp)
const MBTIregexTitles = /ISTJ|ISFJ|INFJ|INTJ|ISTP|ISFP|INFP|INTP|ESTP|ESFP|ENFP|ENTP|ESTJ|ESFJ|ENFJ|ENTJ|COMMENT|MBTI|MEYERS BRIGG|MEYERS-BRIGG+(?=\'?s|S)*/gim
const typeTitles = /ISTJ|ISFJ|INFJ|INTJ|ISTP|ISFP|INFP|INTP|ESTP|ESFP|ENFP|ENTP|ESTJ|ESFJ|ENFJ|ENTJ|COMMENT+(?=\'?s|S)*/gim

// const MBTIregexTitles2 = /[e|i][s|n][f|t][p|j] /, img
// ai startup
// https://www.youtube.com/watch?v=NzmoPqte4V4
// https://www.youtube.com/watch?v=Ui1KbmutX0k

// NLP FTW
// https://github.com/NaturalNode/natural
// import natural = require('natural')
// const wordnet = new natural.WordNet('C:/djRepo/nswg/nswg/wordNet/dict')
// // C: \djRepo\nswg\nswg\wordNet\dict\adj.exc
import HttpProxyAgent = require('http-proxy-agent')
// import sw = require('stopword')
// import esClient = require('../ES/es.controller')

import EsController from '../ES/es.controller'

const esController = new EsController();

const proxies = []

import { Request, Response } from 'express';
import { AllScrapings, Scraping } from '../../../../models/interfaces';

export default class ScrapeController {
  public scrape = async (req: Request, res: Response): Promise<any> => {
    const website = req.body.website
    const word = req.body.word
    try {
      const browser = await puppeteer.launch()
      // return rp(website)
      const page = await browser.newPage()

      return page
        .goto(website, {
          waitLoad: true,
          waitNetworkIdle: true // defaults to false
        })
        .then(async hbody => {
          const $ = cheerio.load(hbody, {
            normalizeWhitespace: true,
            decodeEntities: true
          })
          const htmlbody = $('body')
          const body = htmlbody.text()
          // const scrapedObj = new ScrapedObj(word)

          const scrapedObj = {
            word,
            body: {
              date: new Date(), // Date.getDate(), //Date.now(),
              url: website,
              sentences: findMatches(body, word)
            }
          }
          // sentencesWSynonyms  = await processSynonyms(scrapedObj.body.sentences)

          // let stems = getStems(await Promise.all(lems))
          // .then(newStems => {
          //   resolve(newStems)
          // })
          // let wordsWSyn = wordLookup(newStems)

          // resolve(scrapedObj)
          return res.status(200).send({
            success: true,
            data: scrapedObj
          });
        })
        .catch((err) => {
          // handle error
          console.error('cheerio error url: ' + website + '\n' + 'error: ' + err)
          return res.status(404).send({
            success: false,
            message: 'Users not found',
            data: err
          });
        })
    } catch (err) {
      res.status(500).send({
        success: false,
        message: err.toString(),
        data: null
      });
    }
  };

  public scrapeAll = async (req: Request, res: Response): Promise<AllScrapings[]> => {
    const website = req.body.website
    // const proxyWPort = proxies[Math.floor(Math.random() * proxies.length)].split(
    //     ':'
    //   )
    //   const proxy = {
    //     host: proxyWPort[0],
    //     port: proxyWPort[1]
    //   }

    //   const agent = new HttpProxyAgent(proxy)
    try {
      const browser = await puppeteer.launch()
      const page = await browser.newPage()

      return page
        .goto(website, {
          waitLoad: true,
          waitNetworkIdle: true // defaults to false
        })
        .then(async e => {
          const hbody = await page.content()

          // return redditScrape(hbody, website);

          if (hbody) {
            const { body, deDupedATags, allTitles } = cheerioScrape(hbody)
            if (deDupedATags.length > 0) {
              processATags(website, deDupedATags)
            }
            const rootNode = true
            const tAndS: Scraping[] = findSections(allTitles, body, website, rootNode)
            return res.send({
              url: website,
              data: tAndS
            })
          }
        })
    }
    catch (err) {
      console.trace('error 131 ' + err)
      res.status(500).send({
        success: false,
        message: err.toString(),
        data: null
      });
    }
  };
}

function findMatches(htmlBody, word) {
  // the last word next to the punctuation is getting stripped
  const rx3 = new RegExp('[^.!?/\n/]*' + word + "[^.!?'/\n/']*[.!?/\n/]", 'ig')

  const rawSentences3 = htmlBody.match(rx3)

  return rawSentences3
}

function cheerioScrape(hbody) {
  const $ = cheerio.load(hbody, {
    normalizeWhitespace: true,
    decodeEntities: false
  })
  const htmlbody = $('body')
  const HTMLbody = htmlbody.html()
  const allTitles = []
  $('h1, h2, h3, h4, h5, h6').map((_, element) => {
    const txt = $(element).text()
    if (MBTIregexTitles.test(txt)) {
      allTitles.push(txt)
      // $(element).parent().parent().parent().parent()
    }
  })
  const allATags = []
  $('a').map((_, element) => {
    const txt = $(element).text()
    if (MBTIregexTitles.test(txt)) {
      const href = element.attribs.href
      const text = txt
      allATags.push({
        href,
        text
      })
    }
  })
  // remove duplicate urls
  const deDupedATags = dedupe(allATags, 'href')

  // <[^>]*>
  // no script tags // no input tags // no style tags // no form tags // no footer tags
  const removeJS = new RegExp(
    /(<script\b[^>]*>([\s\S]*?)<\/script>)|(<(input.*?)>)|(\<style(.[^\<]*)\<\/style\>)|(\<form\b[^>]*>([\s\S]*?)<\/form\>)|(\<footer\b[^>]*>([\s\S]*?)<\/footer\>)/,
    'g'
  )
  const stripHTML = new RegExp(/<[^>]*>/, 'g')
  if (!HTMLbody) {
    console.log('no HTMLbody')
  }
  const body = HTMLbody.replace(removeJS, ' ').replace(stripHTML, ' ')
  return {
    body,
    deDupedATags,
    allTitles
  }
}

function findSections(titles, htmlBody, website, rootNode?): Scraping[] {
  // this is for the paragraph
  // (?s)((?:[^\n][\n]?)+)

  // var MBTIregex = /ISTJ|ISFJ|INFJ|INTJ|ISTP|ISFP|INFP|INTP|ESTP|ESFP|ENFP|ENTP|ESTJ|ESFJ|ENFJ|ENTJ|COMMENT+(?=\'?s)*/ig;
  const allSections = []
  if (!htmlBody) {
    console.log('no htmlbody')
  }
  // remove extra double spaces from html body
  htmlBody = htmlBody.replace(/\s\s+/g, ' ')
  const regexToRemove = new RegExp(/(?:\s*)\n\s*/, 'igm')
  let match
  let werd
  for (let i = 0; i < titles.length; i++) {
    if (!titles[i]) {
      console.log('no title start')
    }
    const filteredStart = titles[i].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
    const reg1 = new RegExp(filteredStart, 'ig')
    // let start = htmlBody.indexOf(titles[i])
    const start = htmlBody.search(reg1)
    // let ender = titles[i + 1]
    let section
    let end
    if (!titles[i + 1]) {
      console.log('no title end')
      section = htmlBody.slice(start)
    } else {
      const filteredEnd = titles[i + 1].replace(
        /[-[\]{}()*+?.,\\^$|#\s]/g,
        '\\$&'
      )
      const reg2 = new RegExp(filteredEnd, 'ig')
      // let end = htmlBody.indexOf(titles[i + 1], start)
      reg2.lastIndex = start
      end = htmlBody.search(reg2)
    }

    // if(titles.length === 1){

    // }
    if (!end || (end === -1 && i !== titles.length - 1 && titles.length > 1)) {
      // titles[i + 1]
      section = htmlBody.slice(start)
      const j = i + 1
      console.log('couldnt find end j: ' + titles[j])
    } else if (!start || start === -1) {
      console.log('couldnt find start: ' + titles[i])
    } else {
      section = htmlBody.slice(start, end)
    }
    // let section = htmlBody.match(titleSection)
    if (section) {
      if (!section) {
        console.log('no section')
      }
      section = section.replace(regexToRemove, ' ')
      // section[0] = section[0].replace(oRegexToRemove, ' ')
      section = section.replace(titles[i], '')

      werd = titles[i]
      if (!werd) {
        console.log('no werd ' + titles[i])
      }
      match = werd.match(MBTIregexTitles)
      // if no match, index under root url, ie comments
      // search rreturns index, exec returns match
      if (match === null || match === undefined) {
        match = website.match(MBTIregexTitles)
        if (match && match[0]) {
          match[0] = match[0] + ' Comments'
          // (((Regexr ){1})(((was ){1})))+(?:(((created ){1}))(((by ){1})))+
        } else {
          // match = ["Comments"]
          return
        }
      }
      const scraping = {
        title: titles[i],
        index: match[0],
        section,
        url: website,
        rootNode
      }
      allSections.push(scraping)
    }
  }
  return allSections
}

function processATags(rootURL, aTags): void {
  try {
    // var hostname = rootURL;
    const hostname = new URL(rootURL).hostname
    const websiteRegex = RegExp(
      /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi
    )
    let count = 0
    aTags.forEach(async e => {
      const isUrl = websiteRegex.test(e.href)
      let url: string
      const indexOfRoot = e.href.indexOf(hostname)
      if (indexOfRoot === -1 && isUrl === false) {
        url = 'http://' + hostname + e.href
        if (!url) {
          console.log('no url')
        }
        url = url.replace(/\\/g, '/')
      } else if (indexOfRoot !== -1) {
        url = e.href
      }
      // if is website and does not contian host
      else if (indexOfRoot === -1 && isUrl) {
        return
      }
      if (url) {
        const respod: boolean = await esController.esIsURLIndexed(url)
        if (respod !== true) {
          await rp(url)
            .then(async hbody => {
              if (count === 14) {
                console.log('we here')
              }
              const { body, allTitles } = cheerioScrape(hbody)
              // dont use the deDupedATags or it will be recurrsive
              const rootNode = false;
              const tAndS: Scraping[] = findSections(allTitles, body, rootURL, rootNode)
              io.emit('atag', {
                data: tAndS,
                url
              })
              count++
              console.log('got ' + count)
            })
            .catch(err => {
              console.error('error url: ' + url + '\n' + 'error: ' + err)
            })
        } else {
          console.log(url + ' already indexed')
        }
      } else {
        console.log('no url')
      }
    })
    
  } catch (e) {
    console.log('problem with : ' + e)
  }
}

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

//   const getLems = async filteredSent => {
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

//   function wordLookup(word) {
//     // return new Promise(resolve => {
//     return wordnet.lookup(word, results => {
//       // let results2 = results.map(result => {
//       console.log(word)
//       //   return {
//       //     rootWord: word,
//       //     synsetOffset: result.synsetOffset,
//       //     pos: result.pos,
//       //     lemma: result.lemma,
//       //     synonyms: result.synonyms,
//       //     gloss: result.gloss
//       //   }

//       //   // console.log(synsetOffset)
//       //   // console.log(result.pos)
//       //   // console.log(result.lemma)
//       //   // console.log(result.synonyms)
//       //   // console.log(result.pos)
//       //   // console.log(result.gloss)
//       // })
//       // return goodRes
//       // resolve(results)
//       return results
//     })
//     // })
//   }

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

function dedupe(arr, key) {
  return arr.reduce((acc, current) => {
    const x = acc.find(item => item[key] === current[key])
    if (!x) {
      return acc.concat([current])
    } else {
      return acc
    }
  }, [])
}

function getPost(page, website) {
  const $ = cheerio.load(page)
  const pageContent = []
  $('#siteTable > .thing').each((i, elm) => {
    const title = $(elm)
      .find('.title')
      .text()
      .trim()
    const url = website
    const content = $(elm)
      .find('div[class="usertext-body may-blank-within md-container "] > div')
      .text()
      .trim()
    const comments = $(elm)
      .find('div[class="entry unvoted"] > div')
      .text()
      .trim()
    pageContent.push({
      // title,
      // url,
      // content,
      // comments

      title,
      url,
      index: title.match(MBTIregexTitles)[0],
      section: content,
      rootNode: false
    })
  })
  return pageContent
}

function getList(page, website) {
  const $ = cheerio.load(page)
  const firstLetterSlash = RegExp(/\B[\/]/)
  const posts = []
  $('#siteTable > .thing').each((i, elm) => {
    const score = {
      upvotes: $(elm)
        .find('.score.unvoted')
        .text()
        .trim(),
      likes: $(elm)
        .find('.score.likes')
        .text()
        .trim(),
      dislikes: $(elm)
        .find('.score.dislikes')
        .text()
        .trim()
    }

    // let filteredEnd = titles[i + 1].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    // let getNumber = new RegExp(/\d+/, 'ig')
    const title = $(elm)
      .find('.title')
      .text()
      .trim()
    if (typeTitles.test(title)) {
      const comments = $(elm)
        .find('.comments')
        .text()
        .trim()
      const time = $(elm)
        .find('.tagline > time')
        .attr('title')
        .trim()
      const author = $(elm)
        .find('.tagline > .author')
        .text()
        .trim()
      let url = $(elm).find('.title > .title')[0].attribs.href
      const content = $(elm)
        .find('div[class="usertext-body may-blank-within md-container "] > div')
        .text()
        .trim()
      if (firstLetterSlash.test(url)) {
        // website
        // let hostname = new URL(website).hostname;
        url = 'http://' + website + url
      }
      // let hir  = url.href();
      // let scoo = url[0].attribs.href;
      // var regex = RegExp(/\B[\/]/, 'g');

      posts.push({
        title,
        url,
        index: title.match(MBTIregexTitles)[0],
        section: content,
        rootNode: false
      })

      // posts.push({
      //   title,
      //   comments,
      //   score,
      //   time,
      //   author,
      //   url,
      //   content
      // })
    }
  })
  return posts
}
// https://old.reddit.com/r/mbti/
// https://www.youtube.com/watch?v=o7MJ1-UhS50
function redditScrape(response, website) {
  const root = new URL(website).hostname
  // get all posts
  // test for mbti title go to page and scrape, add all comments
  const posts = getList(response, root)
  let results = []
  const promises = []
  // posts to go to
  io.emit('scrapeAllDone', {
    data: 'Finished Searching Results'
  })
  posts.forEach(post => {
    promises.push(
      rp(post.url).then(resp => {
        // processPost
        const newResults = getPost(resp, post.url)
        results = [...results, ...newResults]
        // io.emit('redditResults', newResults)
        io.emit('atag', {
          data: newResults,
          url: post.url
        })
        // debugger
      })
    )
  })
  return posts
}

  // getResults: async(nr => {
  //   let results = [];

  //   do {
  //     let new_results = await self.parseResults();

  //     results = [...results, ...new_results];

  //     if (results.length < nr) {
  //       let nextPageButton = await self.pageXOffset.$('span[class="next-button"]> a[rel="nofollow next"]')

  //       if (nextPageButton) {
  //         await nextPageButton.click();
  //         await self.pageXOffset.waitForNavigation({ waitUntil: "networkIdle0" })

  //       }
  //       else {
  //         break
  //       }

  //     }
  //   } while (results.length < nr)
  //   return results
  // })