import { Request, Response } from "express";

import { EsIndex } from "../../../../models/interfaces";
import { client } from "../../elasticsearch";
import { ISingleDoc, IStoreAllReq } from "../../models/singleDoc";
import { processDoc } from "../python/python";
import search from "./searchES";

export async function esHealth(req: Request, res: Response): Promise<any> {
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
}

export async function esCatIndicies(req: Request, res: Response): Promise<any> {
  client.cat
    .indices({
      format: "json",
      v: true,
    })
    .then((resp: EsIndex[]) => {
      res.json(resp);
    });
}

export async function esDeleteIndex(req: Request, res: Response): Promise<any> {
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
}

export async function esAddDoc(req: Request, res: Response): Promise<any> {
  const respo = await esDoesIndexExist(req.body.word);
  if (!respo) {
    const mappingSuccess = await initMapping(req.body.word);
    if (mappingSuccess) {
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
    }
  }
}

export async function esSearch(req: Request, res: Response): Promise<any> {
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
}

export async function esSearchIndex(req: Request, res: Response): Promise<any> {
  return client.search(req.body).then((resp: any) => {
    if (resp) {
      console.log("--- Response ---");
      res.json(resp.hits.hits);
    }
  });
}

export async function esStreamImages(
  req: Request,
  res: Response
): Promise<any> {
  const response: any = await client.search(req.body);
  // .then((response: any) => {
  if (response) {
    console.log("--- Response ---");
    // console.log(response)
    const word = req.body.body.query.bool.must.query_string.query;
    console.log("--- Hits ---");
    search.clusterSearch(response.hits.hits, word);
    // launchChrome()
    res.json(response.hits.hits);
  }
  // })
}

export async function esPaginatedSearch(req: Request, res: Response) {
  console.log(req.query.index);
  return client
    .search({
      from: req.query.from,
      size: 10,
      index: req.query.index,
    })
    .then((resp) => {
      console.log("Successful query!");
      // console.log(JSON.stringify(resp));
      res.json({
        response: resp.hits.hits,
      });
    })
    .catch((err) => {
      console.trace(err.message);
    });
}

/// ///////////////////////////// helper functions /////////////////////

export async function esAddSentences(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const docAddedResponse = await client.index({
      index: req.body.word,
      type: "_doc",
      body: req.body.body,
    });
    if (docAddedResponse.result === "created") {
      console.log("doc inserted ");
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
}

export async function esStoreAll(req: Request, res: Response): Promise<any> {
  try {
    const respo = await esDoesIndexExist(req.body.index);
    if (!respo) {
      const mappingSuccess = await initMapping(req.body.index);
    }
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
    return addSection(request, req.body)
      .then((sectionAdded) => {
        console.log("finished");
        if (sectionAdded) {
          return res.send(sectionAdded);
        } else {
          return res.send("problem adding doc");
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
}

export async function esIsURLIndexed(website: string): Promise<boolean> {
  // const website = req.body.website
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
}

export async function esDoesIndexExist(word: string): Promise<any> {
  try {
    const doesIt = await client.indices.exists({
      index: word,
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
}

export async function initMapping(indexName: string) {
  const payload = {
    settings: {
      analysis: {
        analyzer: {
          std_english: {
            type: "standard",
            stopwords: "_english_",
          },
        },
      },
    },
    mappings: {
      properties: {
        section: {
          type: "text",
          analyzer: "std_english",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        date: {
          type: "date",
        },
        rootNode: {
          type: "boolean",
        },
        title: {
          type: "text",
          analyzer: "std_english",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        url: {
          type: "keyword",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
      },
    },
  };

  return client.indices
    .create({
      index: indexName,
      body: payload,
      // include_type_name: true
    })
}

async function addSection(
  request: ISingleDoc,
  origReq?: IStoreAllReq
): Promise<any> {
  try {
    const docAddedResponse = await client.index({
      index: request.word,
      type: "_doc",
      body: request.body,
    });
    if (docAddedResponse.result === "created") {
      console.log("doc inserted ");
      processDoc(request, origReq);
      return {
        result: docAddedResponse,
        message: "Doc added",
      };
    } else {
      console.log("error");
      return {
        error: docAddedResponse,
      };
    }
  } catch (e) {
    console.log("failed to insert Section doc " + e);
    return {
      error: e,
      result: "failed to insert Section doc",
    };
  }
}
