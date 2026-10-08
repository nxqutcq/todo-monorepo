import { Response } from "express";
import mongoose from "mongoose";
import { Todo } from "../models/Todo.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { getFile, objectKeyForTodo, putFile } from "../storage.js";

function isOwnedBy(
  todoUserId: mongoose.Types.ObjectId,
  userId?: string,
): boolean {
  return Boolean(userId) && String(todoUserId) === userId;
}

export const getTodos = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userTodos = await Todo.find({ userId });

    res.status(200).json(userTodos);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении задач" });
  }
};

export const createTodo = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { title } = req.body;
    const userId = req.user?.userId;

    if (!title) {
      res.status(400).json({ message: "Текст задачи обязателен" });
      return;
    }

    const newTodo = await Todo.create({
      title,
      completed: false,
      userId,
    });

    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при создании задачи" });
  }
};

export const updateTodo = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;
    const userId = req.user?.userId;

    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    const todo = await Todo.findById(id);

    if (!todo) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    if (!isOwnedBy(todo.userId, userId)) {
      res.status(403).json({ message: "Нет доступа к чужой задаче" });
      return;
    }

    if (title !== undefined) todo.title = title;
    if (completed !== undefined) todo.completed = completed;

    await todo.save();
    res.status(200).json(todo);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при обновлении задачи" });
  }
};

export const deleteTodo = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    const todo = await Todo.findById(id);

    if (!todo) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    if (!isOwnedBy(todo.userId, userId)) {
      res.status(403).json({ message: "Нет доступа к чужой задаче" });
      return;
    }

    await todo.deleteOne();
    res.status(200).json({ message: "Задача успешно удалена" });
  } catch (error) {
    res.status(500).json({ message: "Ошибка при удалении задачи" });
  }
};

export const uploadAttachment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    const todo = await Todo.findById(id);
    if (!todo) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    if (!isOwnedBy(todo.userId, userId)) {
      res.status(403).json({ message: "Нет доступа к чужой задаче" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "Файл обязателен" });
      return;
    }

    const key = objectKeyForTodo(id, file.originalname);
    await putFile(key, file.buffer, file.mimetype || "application/octet-stream");

    todo.attachmentKey = key;
    await todo.save();

    res.status(200).json(todo);
  } catch (error) {
    console.error("Ошибка загрузки файла:", error);
    res.status(500).json({ message: "Ошибка при загрузке файла" });
  }
};

export const downloadAttachment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    const todo = await Todo.findById(id);
    if (!todo) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    if (!isOwnedBy(todo.userId, userId)) {
      res.status(403).json({ message: "Нет доступа к чужой задаче" });
      return;
    }

    if (!todo.attachmentKey) {
      res.status(404).json({ message: "Файл не найден" });
      return;
    }

    const stored = await getFile(todo.attachmentKey);
    if (!stored) {
      res.status(404).json({ message: "Файл не найден" });
      return;
    }

    const filename = todo.attachmentKey.split("/").pop() || "attachment";
    res.setHeader("Content-Type", stored.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`,
    );
    res.status(200).send(stored.body);
  } catch (error) {
    console.error("Ошибка скачивания файла:", error);
    res.status(500).json({ message: "Ошибка при скачивании файла" });
  }
};
