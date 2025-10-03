/**
 * Augment time to get end time
 * @param startingTime
 * @param minutesToAdd
 * @returns
 */
export const augmentTimestamp = (
  startingTime: string | Date,
  minutesToAdd: number
): Date | string => {
  const date = new Date(startingTime);
  // date.setHours(date.getHours() + 2); // change the time to GMT +2
  date.setMinutes(date.getMinutes() + minutesToAdd);
  return date;
};

/**
 * Get route time time interval
 * @param route
 * @param startingTime
 * @returns
 */

/**
 * Check the date passed is a valid date
 * @param date
 * @returns
 */
export const checkDateValidity = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};
/**
 * Check the date passed is a valid date
 * @param date
 * @returns
 */
export const getToday = (): Date => {
  const now = new Date();
  const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const dateToReturn = new Date(today);
  return dateToReturn;
};

export const getEndOfDay = (dateTime = new Date()): Date => {
  const date = new Date(dateTime);

  date.setHours(23, 59, 59, 999);
  return date;
};

export const databaseTimeStamp = () => {
  const time = new Date();
  return { createdAt: time, updatedAt: time };
};
