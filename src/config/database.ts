import dotenv from "dotenv";
import { DbType, envData } from "../types/shared";
import { parseDbValues } from "../utils/parseEnv";
dotenv.config();

const {
  NODE_ENV,
  DEV_DATABASE_URL,
  DATABASE_URL,
  TEST_DATABASE_URL,
  STAGING_DATABASE_URL,
  DB_USER_DEV,
  DB_PASSWORD_DEV,
  DB_HOST_DEV,
  DB_PORT_DEV,
  DB_NAME_DEV,
  DB_TYPE_DEV,
  DB_USER_TEST,
  DB_PASSWORD_TEST,
  DB_HOST_TEST,
  DB_PORT_TEST,
  DB_NAME_TEST,
  DB_TYPE_TEST,
  DB_USER_PROD,
  DB_PASSWORD_PROD,
  DB_HOST_PROD,
  DB_PORT_PROD,
  DB_NAME_PROD,
  DB_TYPE_PROD,
  DB_USER_STAGING,
  DB_PASSWORD_STAGING,
  DB_HOST_STAGING,
  DB_PORT_STAGING,
  DB_NAME_STAGING,
  DB_TYPE_STAGING,
} = process.env;

export const env = NODE_ENV || "development";

const devUrl = DEV_DATABASE_URL;
const prodUrl = DATABASE_URL;
const testUrl = TEST_DATABASE_URL;
const stagingUrl = STAGING_DATABASE_URL;

const {
  username: devUsername,
  password: devPswd,
  host: devHost,
  port: devPort,
  name: devName,
  type: devType,
} = parseDbValues(devUrl) as envData;
const {
  username: testUsername,
  password: testPswd,
  host: testHost,
  port: testPort,
  name: testName,
  type: testType,
} = parseDbValues(testUrl) as envData;
const {
  username: prodUsername,
  password: prodPswd,
  host: prodHost,
  port: prodPort,
  name: prodName,
  type: prodType,
} = parseDbValues(prodUrl) as envData;
const {
  username: stagingUsername,
  password: stagingPswd,
  host: stagingHost,
  port: stagingPort,
  name: stagingName,
  type: stagingType,
} = parseDbValues(stagingUrl) as envData;

const development = {
  username: devUsername || DB_USER_DEV,
  password: devPswd || DB_PASSWORD_DEV,
  host: devHost || DB_HOST_DEV,
  port: devPort || DB_PORT_DEV,
  name: devName || DB_NAME_DEV,
  type: devType || (DB_TYPE_DEV as DbType) || "postgres",
};
const test = {
  username: testUsername || DB_USER_TEST,
  password: testPswd || DB_PASSWORD_TEST,
  host: testHost || DB_HOST_TEST,
  port: testPort || DB_PORT_TEST,
  name: testName || DB_NAME_TEST,
  type: testType || (DB_TYPE_TEST as DbType) || "postgres",
};
const production = {
  username: prodUsername || DB_USER_PROD,
  password: prodPswd || DB_PASSWORD_PROD,
  host: prodHost || DB_HOST_PROD,
  port: prodPort || DB_PORT_PROD,
  name: prodName || DB_NAME_PROD,
  type: prodType || (DB_TYPE_PROD as DbType) || "postgres",
};
const staging = {
  username: stagingUsername || DB_USER_STAGING,
  password: stagingPswd || DB_PASSWORD_STAGING,
  host: stagingHost || DB_HOST_STAGING,
  port: stagingPort || DB_PORT_STAGING,
  name: stagingName || DB_NAME_STAGING,
  type: stagingType || (DB_TYPE_STAGING as DbType) || "postgres",
};

const config: {
  [key: string]: envData;
} = {
  development,
  test,
  staging,
  production,
};

export default config[env];
