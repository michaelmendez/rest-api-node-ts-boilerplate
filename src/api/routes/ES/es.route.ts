// import verifyToken from '../../helpers/verifyToken';
import { Router } from "express";

import { isAuth } from "../sql/sql.controller";
import * as controller from "./es.controller";

const router: Router = Router();

router.get("/health", isAuth, controller.esHealth);
router.get("/catIndicies", isAuth, controller.esCatIndicies);
router.delete("/deleteIndex/:word", isAuth, controller.esDeleteIndex);
router.post("/addDoc", isAuth, controller.esAddDoc);
router.post("/search", isAuth, controller.esSearch);
router.post("/searchIndex", isAuth, controller.esSearchIndex);
router.post("/streamImages", isAuth, controller.esStreamImages);
router.get("/paginatedSearch", isAuth, controller.esPaginatedSearch);

export default router;
