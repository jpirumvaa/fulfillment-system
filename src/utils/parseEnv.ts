import { DbType, envData } from "../types/shared";

export const parseDbValues = (
  connectionString: string | undefined
): envData | {} => {
  if (!connectionString) return {};
  const db = connectionString?.split("://")[0];
  const username = connectionString?.split("://")[1]?.split(":")[0];
  const password = connectionString
    ?.split("//")[1]
    ?.split(":")[1]
    ?.split("@")[0];
  const host = connectionString?.split("@")[1]?.split(":")[0];
  const port = connectionString?.split("@")[1]?.split(":")[1]?.split("/")[0];
  const name = connectionString?.split("@")[1]?.split(":")[1]?.split("/")[1];

  return {
    type: db as DbType,
    username,
    password,
    host,
    port,
    name,
  };
};
