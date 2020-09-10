import { Request, Response } from "express";

// const client = require('../../elasticsearch')
// const clusterSearch = require('./searchES')

import { client } from "../../elasticsearch";
import { processDoc } from "../python/python";
import search from "./searchES";

// ************************DEPRECIATED*************************

export default {
  esHealth(res: Response) {
    return client.cluster.health({}).then((resp: any) => {
      if (resp) {
        return res.json({
          response: resp,
        });
      } else {
        return res.json({
          err: "error getting client health",
        });
      }
    });
  },

  esCatIndicies(res: Response) {
    client.cat
      .indices({
        format: "json",
        v: true,
      })
      .then((resp: any) => {
        // console.log('-- Client Health --', resp)
        res.json({
          response: resp,
        });
      });
  },

  esCreateIndex(req: Request, res: Response) {
    return this.createESIndex(req.params.word).then((resp) => {
      if (resp) {
        return res.json({
          response: resp,
        });
      } else {
        return res.json({
          err: "error creating index",
        });
      }
    });
  },

  esDeleteIndex(req: Request, res: Response) {
    client.indices
      .delete({
        index: req.params.word,
      })
      .then((err: any, resp: any) => {
        if (err) {
          console.log(err);
          res.json({
            err,
          });
        } else {
          console.log("create", resp);
          res.json({
            response: resp,
          });
        }
      });
  },

  async esAddDoc(req: Request, res: Response) {
    client
      .index({
        index: req.body.word,
        // id: '1',
        type: "_doc",
        body: req.body.body,
      })
      .then((resp: any) => {
        if (resp) {
          return res.json({
            response: resp,
          });
        } else {
          return res.json({
            err: "error adding doc",
          });
        }
      });
  },

  initMapping(indexName: string) {
    const payload = {
      properties: {
        section: {
          type: "text",
        },
        title: {
          type: "text",
          fields: {
            keyword: {
              type: "text",
              ignore_above: 256,
            },
          },
        },
        url: {
          type: "text",
          fields: {
            raw: {
              type: "keyword",
            },
          },
        },
        date: {
          type: "date",
          format: "yyyy-MM-dd",
        },
        rootNode: {
          type: "boolean",
        },
      },
    };

    return client.indices
      .putMapping({
        index: indexName,
        type: "_doc",
        body: payload,
      })
      .then((resp: any) => {
        resp.status(200);
        return resp.json(resp);
      })
      .then((err: any) => {
        err.status(500);
        return err.json(err);
      });
  },

  esSearch(req: Request, res: Response) {
    return client.search(req.body).then(async (response: any) => {
      if (response) {
        console.log("--- Response ---");
        // console.log(response)
        const word = req.body.body.query.bool.must.query_string.query;
        console.log("--- Hits ---");
        const message = await search.clusterSearch(response.hits.hits, word);
        res.json({
          response: message,
        });
      }
    });
  },

  esSearchIndex(req: Request, res: Response) {
    return client.search(req.body).then((resp: any) => {
      if (resp) {
        console.log("--- Response ---");
        res.json({
          response: resp.hits.hits,
        });
      }
    });
  },

  esStreamResults(req: Request, res: Response) {
    return client.search(req.body).then((response: any) => {
      if (response) {
        console.log("--- Response ---");
        // console.log(response)
        const word = req.body.body.query.bool.must.query_string.query;
        console.log("--- Hits ---");
        search.clusterSearch(response.hits.hits, word);
        // launchChrome()
        res.json({
          response: response.hits.hits,
        });
      }
    });
  },

  /// ///////////////////////////// helper functions /////////////////////

  async esAddSentences(req: any) {
    try {
      const docAddedResponse = await client.index({
        index: req.body.word,
        type: "_doc",
        body: req.body.body,
      });
      if (docAddedResponse.result === "created") {
        console.log("handle doc inserted ");
        return {
          result: docAddedResponse,
          message: "Doc added",
        };
      } else {
        console.log("eeeeerrr");
        return {
          error: docAddedResponse,
        };
      }
    } catch (e) {
      console.log("failed to insert Sentences doc " + e);
      return {
        error: e,
        result: "failed to inset doc",
      };
    }
  },

  async addSection(request: any) {
    try {
      const docAddedResponse = await client.index({
        index: request.word,
        type: "_doc",
        body: request.body,
      });
      if (docAddedResponse.result === "created") {
        console.log("handle doc inserted ");
        processDoc(request);
        return {
          result: docAddedResponse,
          message: "Doc added",
        };
      } else {
        console.log("eeeeerrr");
        return {
          error: docAddedResponse,
        };
      }
      processDoc(request);
    } catch (e) {
      console.log("failed to insert Section doc " + e);
      return {
        error: e,
        result: "failed to insert Section doc",
      };
    }
  },

  async esDoesIndexExist(word: string) {
    try {
      const doesIt = await client.cat.indices({
        index: word,
        format: "json",
      });
      if (doesIt) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.log("failed to check if index exists " + e);
      return false;
    }
  },

  async createESIndex(word: string) {
    try {
      const createdIndex = await client.index({
        index: word,
      });
      if (createdIndex.acknowledged === true) {
        const mapping = await this.initMapping(word);
        if (mapping) {
          // let resp = await addDoc(req)
          return true;
        }
      } else {
        console.log("failed to create index");
        return false;
      }
    } catch (e) {
      console.log("failed to create index");
      return e;
    }
  },

  esStoreAll(req: any) {
    try {
      const request = {
        word: req.body.index,
        body: {
          section: req.body.section,
          title: req.body.title,
          url: req.body.url,
          date: new Date(),
          rootNode: req.body.rootNode,
        },
      };
      return this.esDoesIndexExist(request.word)
        .then((doesIt) => {
          if (doesIt) {
            return this.addSection(request);
          } else {
            console.log("create index 655");
            return this.createESIndex(request.word)
              .then(() => {
                return this.addSection(request);
              })
              .catch((e: any) => {
                return e;
                // 'gotta problem creating index 661'
                console.log("gotta problem creating index 661");
              });
          }
        })
        .then((sectionAdded) => {
          if (sectionAdded) {
            return sectionAdded;
          } else {
            return "problem adding doc";
            console.log("problem adding doc");
          }
        })
        .catch((e) => {
          console.log("failed to create gotta problem creating doc");
          return {
            err: e,
          };
        });
    } catch (e) {
      return e;
      console.log("failed to create gotta problem creating doc");
    }
  },

  esIsURLIndexed(website: string) {
    const website2 = website.replace(/\\/g, "\\\\");

    const searchRequest = {
      index: "_all",
      body: {
        query: {
          bool: {
            must: [
              {
                match_phrase: {
                  url: website2,
                },
              },
              {
                match_phrase: {
                  rootNode: true,
                },
              },
            ],
          },
        },
      },
    };
    return client
      .search(searchRequest)
      .then((response: any) => {
        if (response && response.hits.total.value === 0) {
          console.log("url not scrapped");
          return false;
        } else {
          console.log("url already scrapped");
          return true;
        }
      })
      .catch((e: any) => {
        console.log("error seeing if url exists " + e);
      });
  },
};
// module.exports = {
//   esHealth: esHealth,
//   esCatIndicies: esCatIndicies,
//   esCreateIndex: esCreateIndex,
//   esDeleteIndex: esDeleteIndex,
//   esSearchIndex: esSearchIndex,
//   esStreamResults: esStreamResults,
//   esAddDoc: esAddDoc,
//   esCreate: esCreate,
//   esSearch: esSearch,

//   esStoreAll: esStoreAll,
//   esAddSentences: esAddSentences,
//   esDoesIndexExist: esDoesIndexExist,
//   esIsURLIndexed: esIsURLIndexed
// }
