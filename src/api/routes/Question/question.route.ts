import { Router } from "express";

import { isAuth } from "../sql/sql.controller";
import * as questionsController from './question.controller'

const router: Router = Router();

router.get("/typeAhead/:text", isAuth, questionsController.getTypeAhead);
router.get("/add/:question", isAuth, questionsController.addQuestion);
router.get("/all", isAuth, questionsController.getAllPaginated);

router.post("/like/:questionId", isAuth, questionsController.addQuestionLike);

export default router;