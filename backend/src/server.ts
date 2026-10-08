import "dotenv/config";
import app from "./app.js";
import { getJwtSecret } from "./config.js";
import { connectDb } from "./db.js";

async function main(): Promise<void> {
  getJwtSecret();
  await connectDb();

  const PORT = Number(process.env.PORT) || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log("MongoDB connected");
    console.log(`Backend listening on ${PORT}`);
  });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
