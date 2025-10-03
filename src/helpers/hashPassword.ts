import bcrypt from "bcrypt";

/**
 * HashPassword
 * @param password
 * @returns
 */
export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

/**
 * comparePassword
 * @param password
 * @param hash
 * @returns
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
