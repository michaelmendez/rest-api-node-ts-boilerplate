import { io } from "..";

const cheerio = require("cheerio");
const MBTIregexTitles =
  /([E|I]+[N|S][T|F]+[P|J])|COMMENT|MBTI|MEYERS BRIGG|MEYERS-BRIGG+(?=\'?s|S)*/gim;

const typeTitles = /([E|I]+[N|S][T|F]+[P|J])|COMMENT+(?=\'?s|S)*/gim;
const rp = require("request-promise");

function getPost(page, website) {
  const $ = cheerio.load(page);
  const pageContent = [];
  $("#siteTable > .thing").each((i, elm) => {
    const title = $(elm).find(".title").text().trim();
    const url = website;
    const content = $(elm)
      .find('div[class="usertext-body may-blank-within md-container "] > div')
      .text()
      .trim();
    const comments = $(elm)
      .find('div[class="entry unvoted"] > div')
      .text()
      .trim();
    pageContent.push({
      title,
      url,
      index: title.match(MBTIregexTitles)[0],
      section: content,
      rootNode: false,
    });
  });
  return pageContent;
}

function getList(page, website) {
  const $ = cheerio.load(page);
  const firstLetterSlash = RegExp(/\B[\/]/);
  const posts = [];
  $("#siteTable > .thing").each((i, elm) => {
    const score = {
      upvotes: $(elm).find(".score.unvoted").text().trim(),
      likes: $(elm).find(".score.likes").text().trim(),
      dislikes: $(elm).find(".score.dislikes").text().trim(),
    };

    // let filteredEnd = titles[i + 1].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    // let getNumber = new RegExp(/\d+/, 'ig')
    const title = $(elm).find(".title").text().trim();
    if (typeTitles.test(title)) {
      const comments = $(elm).find(".comments").text().trim();
      const time = $(elm).find(".tagline > time").attr("title").trim();
      const author = $(elm).find(".tagline > .author").text().trim();
      let url = $(elm).find(".title > .title")[0].attribs.href;
      const content = $(elm)
        .find('div[class="usertext-body may-blank-within md-container "] > div')
        .text()
        .trim();
      if (firstLetterSlash.test(url)) {
        // website
        // let hostname = new URL(website).hostname;
        url = "http://" + website + url;
      }
      // let hir  = url.href();
      // let scoo = url[0].attribs.href;
      // var regex = RegExp(/\B[\/]/, 'g');

      posts.push({
        title,
        url,
        index: title.match(MBTIregexTitles)[0],
        section: content,
        rootNode: false,
      });

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
  });
  return posts;
}
// https://old.reddit.com/r/mbti/
// https://www.youtube.com/watch?v=o7MJ1-UhS50
function redditScrape(response, website) {
  const root = new URL(website).hostname;
  // get all posts
  // test for mbti title go to page and scrape, add all comments
  const posts = getList(response, root);
  let results = [];
  const promises = [];
  // posts to go to
  io.emit("scrapeAllDone", {
    data: "Finished Searching Results",
  });
  posts.forEach((post) => {
    promises.push(
      rp(post.url).then((resp) => {
        // processPost
        const newResults = getPost(resp, post.url);
        results = [...results, ...newResults];
        // io.emit('redditResults', newResults)
        io.emit("atag", {
          data: newResults,
          url: post.url,
        });
        // debugger
      })
    );
  });
  return posts;
}
