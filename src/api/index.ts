import { Router } from "express";

import ES from "./routes/ES/es.route";
import Scrape from "./routes/Scrape/scrape.route";

const router: Router = Router();

router.use("/scrape", Scrape);
router.use("/es", ES);

router.get("/", (req, res) => {
  res.send("<h1>Scraper API Up</h1>");
});

// module.exports = {
//   path: '/api/',
//   handler: router
// }
export default router;
