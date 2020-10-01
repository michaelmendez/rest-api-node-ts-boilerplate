import { Router } from "express";

import * as controller from "./sql.controller";

const router: Router = Router();

router.get("/getAll", controller.isAuth, controller.getAll);

router.post("/getOneByEmail", controller.getOneByEmail);
router.post("/addOne", controller.addOne);
router.delete("/deleteOneByEmail", controller.deleteOneByEmail);

router.post("/login", controller.login)
router.post("/register", controller.register)
router.post("forgotPassword", controller.forgotPassword)

export default router;