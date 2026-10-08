import express, { Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";
import { getClientOrigins } from "./config.js";

const app = express();

const clientOrigins = getClientOrigins();
app.use(
  clientOrigins
    ? cors({ origin: clientOrigins, credentials: true })
    : cors(),
);
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/todos", todoRoutes);

app.get("/ping", (req: Request, res: Response) => {
  res.status(200).json({ message: "pong", timestamp: new Date() });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Маршрут не найден" });
});

export default app;
