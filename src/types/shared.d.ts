import { NextFunction, request } from "express";

declare type DbType = "mysql" | "postgres" | "mssql";

declare type envData = {
  username?: string;
  password?: string;
  host?: string;
  port?: string;
  name?: string;
  type: DbType;
};

declare module "express" {
  export interface Request {
    user?: any;
  }
}
