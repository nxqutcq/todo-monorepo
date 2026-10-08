import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getAwsRegion, getS3Bucket, useMemoryS3 } from "./config.js";

const memoryStore = new Map<
  string,
  { body: Buffer; contentType: string }
>();

function s3(): S3Client {
  return new S3Client({ region: getAwsRegion() });
}

export async function putFile(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  if (useMemoryS3()) {
    memoryStore.set(key, { body, contentType });
    return;
  }

  await s3().send(
    new PutObjectCommand({
      Bucket: getS3Bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getFile(
  key: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  if (useMemoryS3()) {
    return memoryStore.get(key) ?? null;
  }

  const result = await s3().send(
    new GetObjectCommand({
      Bucket: getS3Bucket(),
      Key: key,
    }),
  );

  if (!result.Body) {
    return null;
  }

  const body = Buffer.from(await result.Body.transformToByteArray());
  return {
    body,
    contentType: result.ContentType || "application/octet-stream",
  };
}

export function objectKeyForTodo(todoId: string, originalName: string): string {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `todos/${todoId}/${safeName}`;
}
