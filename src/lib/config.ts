// Configuration management for different environments

export const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL || "file:./dev.db",
  },

  // Authentication
  auth: {
    secret: process.env.NEXTAUTH_SECRET || "dev-secret-key",
    url: process.env.NEXTAUTH_URL || "http://localhost:3000",
  },

  // Email
  email: {
    apiKey: process.env.EMAIL_API_KEY || "demo-key",
    fromEmail: process.env.FROM_EMAIL || "noreply@slu-alumni.edu",
  },

  // Payment
  stripe: {
    publicKey: process.env.STRIPE_PUBLIC_KEY || "",
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },

  // File Upload
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },

  // Analytics
  analytics: {
    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || "",
  },

  // External APIs
  apis: {
    googleMapsKey: process.env.GOOGLE_MAPS_API_KEY || "",
  },

  // Security
  security: {
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100"),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || "900000"), // 15 minutes
  },

  // Feature Flags
  features: {
    donations: process.env.ENABLE_DONATIONS === "true",
    mentorship: process.env.ENABLE_MENTORSHIP === "true",
    events: process.env.ENABLE_EVENTS === "true",
    adminDashboard: process.env.ENABLE_ADMIN_DASHBOARD === "true",
  },

  // Environment
  env: {
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
    isTest: process.env.NODE_ENV === "test",
    port: parseInt(process.env.PORT || "3000"),
  },
};

// Validation function to check required environment variables
export function validateConfig() {
  const requiredVars = [];

  if (config.env.isProduction) {
    // Required for production
    if (!process.env.DATABASE_URL) requiredVars.push("DATABASE_URL");
    if (!process.env.NEXTAUTH_SECRET) requiredVars.push("NEXTAUTH_SECRET");
    if (!process.env.EMAIL_API_KEY) requiredVars.push("EMAIL_API_KEY");
  }

  if (requiredVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${requiredVars.join(", ")}`
    );
  }
}

// Initialize configuration validation
if (typeof window === "undefined") {
  // Only run on server side
  try {
    validateConfig();
  } catch (error) {
    console.warn("Configuration validation warning:", error);
  }
}
