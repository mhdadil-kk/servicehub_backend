import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UnauthorizedError } from "./error";


export interface JwtPayload {
  id:   string;
  role: string;
}

export const generateTokens = (
  userId: string,
  role: string
): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign(
    { id: userId, role },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"] }
  );

  const refreshToken = jwt.sign(
    { id: userId, role },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"] }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JwtPayload => {

  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtPayload;
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }
};
