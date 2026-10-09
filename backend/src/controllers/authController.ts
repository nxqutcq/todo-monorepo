import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { getJwtSecret } from "../config.js";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email и пароль обязательны" });
      return;
    }

    const candidate = await User.findOne({
      email: String(email).toLowerCase(),
    });
    if (candidate) {
      res
        .status(400)
        .json({ message: "Пользователь с таким email уже существует" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await User.create({
      email,
      passwordHash,
    });

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

    const user = await User.findOne({
      email: String(email).toLowerCase(),
    });
    if (!user) {
      res.status(400).json({ message: "Неверный email или пароль" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: "Неверный email или пароль" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, getJwtSecret(), {
      expiresIn: "15m",
    });

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера при входе" });
  }
};
