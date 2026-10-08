import { Router } from "express";
import multer from "multer";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  uploadAttachment,
  downloadAttachment,
} from "../controllers/todoController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.use(authMiddleware);

router.get("/", getTodos);
router.post("/", createTodo);
router.put("/:id", updateTodo);
router.delete("/:id", deleteTodo);
router.post("/:id/attachment", upload.single("file"), uploadAttachment);
router.get("/:id/attachment", downloadAttachment);

export default router;
