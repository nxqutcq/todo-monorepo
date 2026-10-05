import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Бэкенд успешно запущен на массивах (In-Memory Mock)!");
  console.log(`📡 Слушаем порт ${PORT}`);
});
