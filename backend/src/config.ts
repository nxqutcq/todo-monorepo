export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET must be set in environment variables");
  }
  return secret;
}

export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI must be set in environment variables");
  }
  return uri;
}

export function useMemoryS3(): boolean {
  return process.env.S3_USE_MEMORY === "1";
}

export function getS3Bucket(): string {
  if (useMemoryS3()) {
    return process.env.S3_BUCKET_NAME || "test-bucket";
  }
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error("S3_BUCKET_NAME must be set in environment variables");
  }
  return bucket;
}

export function getAwsRegion(): string {
  return process.env.AWS_REGION || "eu-north-1";
}

export function getClientOrigins(): string[] | undefined {
  const raw = process.env.CLIENT_ORIGIN;
  if (!raw) {
    return undefined;
  }
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
