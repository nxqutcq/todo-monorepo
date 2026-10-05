import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_2026";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ message: "Доступ запрещен. Токен отсутствует или невалиден" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    req.user = { userId: decoded.userId };

    next();
  } catch (error) {
    res.status(401).json({ message: "Неверный или просроченный токен" });
  }
};
