import mongoose from "mongoose";
import { getMongoUri } from "./config.js";

export async function connectDb(uri = getMongoUri()): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  await mongoose.connect(uri);
}

export async function disconnectDb(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    return;
  }
  await mongoose.disconnect();
}
