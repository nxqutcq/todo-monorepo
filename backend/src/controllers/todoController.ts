import { Response } from "express";

import { todosDb } from "../models/mockDb.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

export const getTodos = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userTodos = todosDb.filter((todo) => todo.userId === userId);

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

    const newTodo = {
      id: Date.now().toString(),
      title,
      completed: false,
      userId: userId!,
    };

    todosDb.push(newTodo);
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

    const todo = todosDb.find((t) => t.id === id);

    if (!todo) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    if (todo.userId !== userId) {
      res.status(403).json({ message: "Нет доступа к чужой задаче" });
      return;
    }

    if (title !== undefined) todo.title = title;
    if (completed !== undefined) todo.completed = completed;

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

    const todoIndex = todosDb.findIndex((t) => t.id === id);

    if (todoIndex === -1) {
      res.status(404).json({ message: "Задача не найдена" });
      return;
    }

    if (todosDb[todoIndex].userId !== userId) {
      res.status(403).json({ message: "Нет доступа к чужой задаче" });
      return;
    }

    todosDb.splice(todoIndex, 1);
    res.status(200).json({ message: "Задача успешно удалена" });
  } catch (error) {
    res.status(500).json({ message: "Ошибка при удалении задачи" });
  }
};
