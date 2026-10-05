import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { usersDb } from "../models/mockDb.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_2026";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email и пароль обязательны" });
      return;
    }

    const candidate = usersDb.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (candidate) {
      res
        .status(400)
        .json({ message: "Пользователь с таким email уже существует" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      id: Date.now().toString(),
      email,
      passwordHash,
    };
    usersDb.push(newUser);

    res.status(201).json({ message: "Пользователь успешно зарегистрирован" });
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    res.status(500).json({ message: "Ошибка сервера при регистрации" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email и пароль обязательны" });
      return;
    }

    const user = usersDb.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (!user) {
      res.status(400).json({ message: "Неверный email или пароль" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: "Неверный email или пароль" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера при входе" });
  }
};
