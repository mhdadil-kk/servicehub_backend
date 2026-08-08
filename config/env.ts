function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`[Config] Missing required environment variable: "${key}"`);
  }
  return value.trim();
}

function optionalEnv(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim() !== "" ? value.trim() : fallback;
}

export const env = {
  NODE_ENV:              optionalEnv("NODE_ENV", "development"),
  PORT:                  parseInt(optionalEnv("PORT", "5000"), 10),
  CLIENT_URL:            requireEnv("CLIENT_URL"),
  MONGO_URI:             requireEnv("MONGO_URI"),
  ACCESS_TOKEN_SECRET:   requireEnv("ACCESS_TOKEN_SECRET"),
  REFRESH_TOKEN_SECRET:  requireEnv("REFRESH_TOKEN_SECRET"),
  ACCESS_TOKEN_EXPIRY:   optionalEnv("ACCESS_TOKEN_EXPIRY", "15m"),
  REFRESH_TOKEN_EXPIRY:  optionalEnv("REFRESH_TOKEN_EXPIRY", "7d"),
  CLOUDINARY_CLOUD_NAME: requireEnv("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY:    requireEnv("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: requireEnv("CLOUDINARY_API_SECRET"),
  GOOGLE_CLIENT_ID:      requireEnv("GOOGLE_CLIENT_ID"),
  SMTP_USER:             requireEnv("SMTP_USER"),
  SMTP_PASS:             requireEnv("SMTP_PASS"),
  FRONTEND_URL:          optionalEnv("FRONTEND_URL", "http://localhost:5173"),
  STRIPE_SECRET_KEY:     requireEnv("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: requireEnv("STRIPE_WEBHOOK_SECRET"),
} as const;
