import express, { Express, Request, Response } from "express";
import morgan from "morgan";
import helmet from "helmet";
import { limiter } from "./utils/limitRequests";
import cors from "cors";
import { Logger, morganOptions } from "./utils/logger";
import { sendResponse } from "./utils/sendResponse";
import routes from "./routes";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app: Express = express();

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(limiter);

app.use(morgan(morganOptions, { stream: Logger.instance.logStream }));

// Swagger documentation
// @ts-ignore - swagger-ui-express types have conflicts
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    tryItOutEnabled: true,
    requestInterceptor: (req: any) => {
      return req;
    }
  }
}));

app.use("/api/v1", routes);
app.all("*", (_req: Request, res: Response) => {
  return sendResponse(res, 404, "No route found", {}, true);
});

export default app;
