import { Router } from "express";
import UserController from "../controllers/User";
import { authenticate } from "../middleware/auth";

const userController = new UserController();

const route = Router();

// Apply authentication middleware to all user routes
route.use(authenticate);

route.get("/", userController.getAll);
route.post("/", userController.createOne);
route.get("/:id", userController.getOne);

export default route;
