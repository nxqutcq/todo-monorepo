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
