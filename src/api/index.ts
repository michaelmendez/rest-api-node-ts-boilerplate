import { Router } from "express";

import comment from "./routes/Comment/comment.route";
import ES from "./routes/ES/es.route";
import question from "./routes/Question/question.route";
import Scrape from "./routes/Scrape/scrape.route";
import Sql from "./routes/Sql/sql.route";

const router: Router = Router();

router.use("/scrape", Scrape);
router.use("/es", ES);
router.use("/user", Sql)
router.use("/question", question)
router.use("/comment", comment)

router.get("/", (req, res) => {
  res.send("<h1>Scraper API Up</h1>");
});

// module.exports = {
//   path: '/api/',
//   handler: router
// }
export default router;
