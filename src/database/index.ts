import { DataSource } from "typeorm";

import config, { env } from "../config/database";
import { Logger } from "../utils/logger";

export class DbConnection {
  private static _instance: DbConnection;
  private static dbConnection = new DataSource({
    type: config.type,
    logging: false,
    synchronize: env === "production" ? false : true,
    host: config.host,
    port: Number(config.port as string),
    username: config.username,
    password: config.password,
    database: config.name,
    migrations: env === "production" ? [__dirname + "/migrations/*.js"] : [__dirname + "/migrations/*.ts"],
    migrationsRun: env === "production" ? true : false,
    entities: env === "production" ? [__dirname + "/models/*.js"] : [__dirname + "/models/*.ts"],
  });

  private constructor() {}

  public static get instance(): DbConnection {
    if (!this._instance) this._instance = new DbConnection();

    return this._instance;
  }

  public static get connection(): DataSource {
    return this.dbConnection;
  }

  initializeDb = async () => {
    try {
      const connection = await DbConnection.dbConnection.initialize();
      Logger.instance.log("db-connection " + connection.options.database);
    } catch (error) {
      Logger.instance.error(`db-error: ${error}`);
    }
  };

  disconnectDb = async () => {
    try {
      await DbConnection.dbConnection.destroy();
    } catch (error) {
      const log = "db-disconnection-error" + error;
      Logger.instance.error(log);
    }
  };
}

const dbConnection = DbConnection.connection;

export default dbConnection;
