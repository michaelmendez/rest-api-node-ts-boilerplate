import { Request, Response, Router } from "express";

import * as esController from "../services/es.controller";
import { processDoc } from "../services/python" // "./services/../python/python";
import * as scrapeController from "../services/scrape.controller";
import {wordLookup} from "../services/scrapeHelpers"

const router: Router = Router();

// *********  Scrape ********* //

router.post("/scrape/Site", scrapeController.scrape);
router.post("/scrape/all", scrapeController.scrapeAll);
router.post("/scrape/storeAll", esController.esStoreAll);
router.post("/scrape/Store", async (req: Request, res: Response) => {
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
router.post("/scrape/StoreMultiplePages", esController.esStoreAll);
router.get("/scrape/synonyms/:word", wordLookup);

// *********  ES ********* //

// import * as controller from "./es.controller";

// const router: Router = Router();

router.get("/es/health", esController.esHealth);
router.get("/es/catIndicies", esController.esCatIndicies);
router.delete("/es/deleteIndex/:word", esController.esDeleteIndex);
router.post("/es/addDoc", esController.esAddDoc);

router.post("/es/addAutocomplete", esController.esAddAutocomplete);
// router.get("/autocomplete", controller.esAutocomplete);
router.post("/es/search", esController.esSearch);
router.post("/es/searchIndex", esController.esSearchIndex);
router.post("/es/streamImages", esController.esStreamImages);
router.get("/es/paginatedSearch", esController.esPaginatedSearch);



router.get("/", (req, res) => {
  res.send("<h1>Scraper API Up</h1>");
});





export default router;
