import { Router } from "express";

import CONFIG from "../config/config";
// import { ES, Scrape, User } from './routes/router';

import ES from "./routes/ES/es.route";
import Scrape from "./routes/Scrape/scrape.route";
import Sql from "./routes/Sql/sql.route";

const router: Router = Router();

router.use("/scrape", Scrape);
router.use("/es", ES);
router.use("/user", Sql)
// router.use('/user', User);

router.get("/", (req, res) => {
  res.render("index");
});

// module.exports = {
//   path: '/api/',
//   handler: router
// }
export default router;
