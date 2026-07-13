import { Router } from "express";

import { showHomePage } from "../controllers/home.controller.js";

const router = Router();

router.get("/", showHomePage);

export default router;