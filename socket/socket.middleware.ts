import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface JwtPayload {
  id:    string;
  role:  string;
  email?: string;
}

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void): void => {
  const token = socket.handshake.auth?.token ?? socket.handshake.query?.token;
  if (!token || typeof token !== "string") {
    return next(new Error("Authentication error: Token missing"));
  }
  try {
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as JwtPayload;
    socket.data.user = decoded;
    next();
  } catch {
    next(new Error("Authentication error: Invalid or expired token"));
  }
};
