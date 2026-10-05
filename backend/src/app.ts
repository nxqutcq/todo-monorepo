import express, { Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ type: ["application/json", "text/plain", "*/*"] }));

app.use("/auth", authRoutes);
app.use("/todos", todoRoutes);

app.get("/ping", (req: Request, res: Response) => {
  res.status(200).json({ message: "pong", timestamp: new Date() });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Маршрут не найден" });
});

export default app;
