import { Router } from "express";
import { exempleRouter } from "./exemple.js";

export const apiRouter = Router();

apiRouter.use("/exemple", exempleRouter);
