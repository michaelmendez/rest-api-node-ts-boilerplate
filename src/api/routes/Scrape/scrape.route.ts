// import verifyToken from '../../helpers/verifyToken';
import { Request, Response, Router } from "express";

import * as esController from "../ES/es.controller";
import { processDoc } from "../python/python";
import * as scrapeController from "./scrape.controller";

const router: Router = Router();

router.post("/Site", scrapeController.scrape);

router.post("/all", scrapeController.scrapeAll);

router.post("/storeAll", esController.esStoreAll);

router.post("/Store", async (req: Request, res: Response) => {
  console.log("got to store request");
  try {
    // console.log('cat index: ' + req.body.word + '?')
    const doesIt = await esController.esDoesIndexExist(req.body.word);
    if (doesIt) {
      // console.log(req.body.word + ' index exists')
      const resp = await esController.esAddSentences(req, res);
      if (resp.error) {
        res.json({
          err: resp,
        });
      } else {
        res.json(resp);
      }
    }
    // index does not exist so create the index and add the doc
    else {
      const docAdded = await esController.esAddSentences(req, res);
      if (docAdded) {
        res.json(docAdded);
      } else {
        res.json({
          err: docAdded,
        });
      }
    }
    processDoc(req.body);
  } catch (e) {
    console.log("failed to create index " + e);
  }
});

router.post("/StoreMultiplePages", esController.esStoreAll);

export default router;
