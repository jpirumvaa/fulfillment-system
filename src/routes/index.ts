import { Router, Request, Response } from "express";
import { sendResponse } from "../utils/sendResponse";
import userRoutes from "./user";
import fulfillmentRoutes from "./fulfillment";
import authRoutes from "./auth";

const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/user", userRoutes);
routes.use("/fulfillment", fulfillmentRoutes);

routes.get("/", (_req: Request, res: Response) => {
  return sendResponse(
    res,
    200,
    "Welcome to Zipline Fulfillment System",
    {},
    false
  );
});

export default routes;
