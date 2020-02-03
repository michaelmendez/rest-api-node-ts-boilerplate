// import express from 'express';
// const esClient = require('./handleEs');

import esClient from './handleES';
// const router = express.Router()

// Define routes handling profile requests

// module.exports = router

// api/es/...

import { Request, Response, Router } from 'express';

// Assign router to the express.Router() instance
const router: Router = Router();

router.get('/health', (res: Response) => {
  // esClient.esHealth
  return esClient.esHealth(res);
});

router.get('/catIndicies', (res: Response) => {
  return esClient.esCatIndicies(res);
});
router.get('/createIndex/:word', (req: Request, res: Response) => {
  return esClient.esCreateIndex(req, res);
});
router.delete('/deleteIndex/:word', (req: Request, res: Response) => {
  return esClient.esDeleteIndex(req, res);
});

// word = value,
// date = new Date(),
// sentences = null
// https://medium.com/@siddharthac6/elasticsearch-node-js-b16ea8bec427
// https://www.compose.com/articles/getting-started-with-elasticsearch-and-node/
// https://github.com/elastic/elasticsearch-js
router.post('/addDoc', (req: Request, res: Response) => {
  return esClient.esAddDoc(req, res);
});

router.post('/create', () => {
  esClient.esCreate();
});

router.post('/search', (req: Request, res: Response) => {
  return esClient.esSearch(req, res);
});

router.post('/searchIndex', (req: Request, res: Response) => {
  return esClient.esSearchIndex(req, res);
});
router.post('/streamResults', (req: Request, res: Response) => {
  return esClient.esStreamResults(req, res);
});

export const ES: Router = router;
