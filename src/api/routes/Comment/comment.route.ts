import { Router } from "express";

import { isAuth } from "../sql/sql.controller";
import * as commentController from './comment.controller'

const router: Router = Router();

router.post("/add/:index/:id", isAuth, commentController.addComment);
router.get("/:commentId", isAuth, commentController.getComment);
router.post("/like/:commentId", isAuth, commentController.addCommentLike);

export default router;