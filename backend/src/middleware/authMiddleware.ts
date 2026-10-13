import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware: RequestHandler = (req, res, next) => {
  const authorization = req.headers.authorization;

  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : undefined;

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({
      message: "Server authentication is not configured",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, secret);

    if (
      typeof payload === "string" ||
      typeof payload.userId !== "string"
    ) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};