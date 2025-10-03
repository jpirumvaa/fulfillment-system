import { rateLimit } from "express-rate-limit";
import { config } from "dotenv";

config();

export const limiter = rateLimit({
  max: process.env.NODE_ENV === 'test' ? 1000 : (+process.env.RATEMAXCOUNT! || 20),
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    error: true,
    message: "Too many requests, please try again after one minute.",
  },
});
