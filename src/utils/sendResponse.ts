import { Response } from "express";

export const sendResponse = <T>(
  res: Response,
  status: number,
  message: string,
  data: T | T[] = [],
  error: boolean
) => {
  const isEmpty = (value: T | T[]): boolean => {
    if (Array.isArray(value)) {
      return value.length === 0;
    } else if (typeof value === "object" && value !== null) {
      return Object.keys(value).length === 0;
    }
    return !value;
  };

  const response: any = {
    status,
    error,
  };

  if (!isEmpty(data)) {
    response.message = message;
    response.data = data;
  } else if (!isEmpty(data) && !error) {
    response.message = "No data found";
  } else {
    response.message = message;
  }

  return res.status(status).send(response);
};
