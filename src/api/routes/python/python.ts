import { IAnalyzedSection } from "../../models/analyzedSection";
import { ISingleDoc, IStoreAllReq } from "../../models/singleDoc";

const rp = require("request-promise");
import { client } from "../../elasticsearch";
import * as esController from "../ES/es.controller";

export const processDoc = (request: ISingleDoc, origReq?: IStoreAllReq) => {
  console.log("processDoc");
  const options = {
    method: "POST",
    // uri: "http://192.168.1.166:5000/getTripples/doc",

    uri: "http://0.0.0.0:5000/getTripples/doc",
    body: origReq,
    json: true, // Automatically stringifies the body to JSON
  };

  return rp(options)
    .then((parsedBody: IAnalyzedSection) => {
      return addAnalyzedSection(parsedBody);
    })
    .catch((err) => {
      // POST failed...
      console.error("fail");
      console.log(err);
    });
};

export const addAnalyzedSection = (parsedBody: IAnalyzedSection) => {
  return client.index({
    index: `analyzed-${parsedBody.index}`,
    type: "_doc",
    body: parsedBody,
  });
};
