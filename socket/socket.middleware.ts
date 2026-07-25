import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
  role: string;
  email?: string;
  [key: string]: unknown;
}

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;

  if (!token) {
    return next(new Error("Authentication error: Token missing"));
  }

  try {
    const secret = process.env.ACCESS_TOKEN_SECRET || "default_jwt_secret";
    const decoded = jwt.verify(token as string, secret) as JwtPayload;
    socket.data.user = decoded;
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid token"));
  }
};
