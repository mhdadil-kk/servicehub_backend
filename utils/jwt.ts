import jwt from "jsonwebtoken";
import { AppError } from "./error";

const getSecrets = () => {
  const access = process.env.ACCESS_TOKEN_SECRET;
  const refresh = process.env.REFRESH_TOKEN_SECRET;
  if (!access || !refresh) {
    throw new AppError("JWT secrets are not defined in environment variables", 500);
  }
  return { access, refresh };
};

export const generateTokens = (userId: string, role: string) => {
  const { access, refresh } = getSecrets();
  const accessToken = jwt.sign({ id: userId, role }, access, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ id: userId, role }, refresh, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string) => {
  const { access } = getSecrets();
  try {
    return jwt.verify(token, access) as { id: string; role: string };
  } catch (_error) {
    throw new AppError("Invalid or expired access token", 401);
  }
};

export const verifyRefreshToken = (token: string) => {
  const { refresh } = getSecrets();
  try {
    return jwt.verify(token, refresh) as { id: string; role: string };
  } catch (_error) {
    throw new AppError("Invalid or expired refresh token", 401);
  }
};
