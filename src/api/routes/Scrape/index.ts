// import express from 'express'
// import express from 'express';
import { Request, Response, Router } from 'express';
import esClient from '../ES/handleEs';
import scraper from './scrape';
// const router = express.Router();

// Define routes handling profile requests

// module.exports = router

// /api/scrape/...


// Assign router to the express.Router() instance
const router: Router = Router();


router.post('/Site', async (req: Request, res: Response) => {
  console.log('got to scrape request');
  const result = await scraper.scrape(req.body.website, req.body.word);

  res.json({
    error: null,
    result,
  });
});

router.post('/all', async (req: Request, res: Response) => {
  console.log('got to scrape request');
  const indexedTitles = await esClient.esIsURLIndexed(req.body.website);
  if (!indexedTitles) {
    const result = await scraper.scrapeAll(req.body.website);
    res.json({
      error: null,
      result,
    });
  } else {
    res.json({
      error: null,
      message: 'url already indexed',
    });
  }
});
router.post('/storeAll', async (req: Request, res: Response) => {
  const response = await esClient.esStoreAll(req);
  res.json(response);
  console.log('got to All store request');
});

router.post('/Store', async (req: Request, res: Response) => {
  console.log('got to store request');
  console.log('req.body.word: ' + req.body.word);
  const result = null;
  try {
    // console.log('cat index: ' + req.body.word + '?')
    const doesIt = await esClient.esDoesIndexExist(req.body.word);
    if (doesIt) {
      // console.log(req.body.word + ' index exists')
      const resp = await esClient.esAddSentences(req);
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
      const created = await esClient.esCreateIndex(req.body.word, res);
      if (created) {
        // console.log(req.body.word + ' index exists')
        const docAdded = await esClient.esAddSentences(req);
        if (docAdded) {
          res.json(docAdded);
        } else {
          res.json({
            err: docAdded,
          });
        }
      } else {
        console.log('failed to create gotta problem creating doc ');
        res.json({
          err: created,
        });
      }
    }
  } catch (e) {
    console.log('error storing sentences ' + e);
    try {
      const createdIndex = await esClient.esCreateIndex(req.body.word, res);
    } catch (e) {
      console.log('failed to create index ' + e);
    }
  }
});

router.post('/StoreMultiplePages', async (req: Request, res: Response) => {
  // req.docs.forEach(doc =>{
  //   let response = storeAll(req)
  //   res.json(response)
  // })
  const response = await esClient.esStoreAll(req);
  res.json(response);
  // tslint:disable-next-line: no-console
  console.log('got to All store request');
});

export const Scrape: Router = router;
