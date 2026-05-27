import jwt from "jsonwebtoken";

export const createToken = (id: number, email: string) => {
  return jwt.sign(
    { id, email },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
};