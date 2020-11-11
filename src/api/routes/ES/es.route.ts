// import verifyToken from '../../helpers/verifyToken';
import { Router } from "express";

import * as controller from "./es.controller";

const router: Router = Router();

router.get("/health", controller.esHealth);
router.get("/catIndicies", controller.esCatIndicies);
router.delete("/deleteIndex/:word", controller.esDeleteIndex);
router.post("/addDoc", controller.esAddDoc);
router.post("/search", controller.esSearch);
router.post("/searchIndex", controller.esSearchIndex);
router.post("/streamImages", controller.esStreamImages);
router.get("/paginatedSearch", controller.esPaginatedSearch);

export default router;
