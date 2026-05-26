import { Router } from "express";
import {
	deleteOne,
	getOne,
	patchOne,
	postOne,
} from "../controllers/exempleController.js";

export const exempleRouter = Router();

exempleRouter.get("/", getOne);
exempleRouter.post("/", postOne);
exempleRouter.patch("/", patchOne);
exempleRouter.delete("/", deleteOne);
