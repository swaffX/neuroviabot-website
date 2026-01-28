/**
 * Environment variable validation and type-safe access
 * This ensures all required environment variables are present at runtime
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_APP_URL',
] as const

const optionalEnvVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_API_TIMEOUT',
  'NEXT_PUBLIC_DISCORD_CLIENT_ID',
  'NEXT_PUBLIC_GA_ID',
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_ANALYTICS_ENDPOINT',
  'NEXT_PUBLIC_ENABLE_ANALYTICS',
  'NEXT_PUBLIC_ENABLE_ERROR_TRACKING',
  'NEXT_PUBLIC_ENABLE_MAINTENANCE_MODE',
] as const

type RequiredEnvVars = (typeof requiredEnvVars)[number]
type OptionalEnvVars = (typeof optionalEnvVars)[number]
type AllEnvVars = RequiredEnvVars | OptionalEnvVars

// Validate required environment variables
function validateEnv() {
  const missing: string[] = []

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\nPlease check your .env file.`
    )
  }
}

// Type-safe environment variable getter
function getEnv(key: RequiredEnvVars): string
function getEnv(key: OptionalEnvVars): string | undefined
function getEnv(key: AllEnvVars): string | undefined {
  return process.env[key]
}

// Get boolean environment variable
function getEnvBoolean(key: OptionalEnvVars, defaultValue: boolean = false): boolean {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  return value === 'true' || value === '1'
}

// Get number environment variable
function getEnvNumber(key: OptionalEnvVars, defaultValue: number = 0): number {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

// Run validation in non-production environments
if (process.env.NODE_ENV !== 'production') {
  try {
    validateEnv()
  } catch (error) {
    console.error('Environment validation failed:', error)
    // Don't throw in development to allow app to start
    // but log the error clearly
  }
}

// Export type-safe environment variables
export const env = {
  // App
  appName: getEnv('NEXT_PUBLIC_APP_NAME'),
  appUrl: getEnv('NEXT_PUBLIC_APP_URL'),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // API
  apiUrl: getEnv('NEXT_PUBLIC_API_URL') || 'https://neuroviabot.xyz/api',
  apiTimeout: getEnvNumber('NEXT_PUBLIC_API_TIMEOUT', 30000),

  // Discord
  discordClientId: getEnv('NEXT_PUBLIC_DISCORD_CLIENT_ID'),

  // Analytics
  gaId: getEnv('NEXT_PUBLIC_GA_ID'),
  analyticsEndpoint: getEnv('NEXT_PUBLIC_ANALYTICS_ENDPOINT'),
  enableAnalytics: getEnvBoolean('NEXT_PUBLIC_ENABLE_ANALYTICS', true),

  // Error Tracking
  sentryDsn: getEnv('NEXT_PUBLIC_SENTRY_DSN'),
  enableErrorTracking: getEnvBoolean('NEXT_PUBLIC_ENABLE_ERROR_TRACKING', true),

  // Feature Flags
  enableMaintenanceMode: getEnvBoolean('NEXT_PUBLIC_ENABLE_MAINTENANCE_MODE', false),
} as const

// Export validation function for use in other places
export { validateEnv }

// Type for environment configuration
export type Env = typeof env
