import * as z from "zod/v4";

const DEFAULT_BASE_URL = "https://api.recruitcrm.io/v1";
const DEFAULT_TIMEOUT_MS = 10_000;
const envBooleanSchema = z
  .preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.union([z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0")]).optional(),
  )
  .transform((value) => value === "true" || value === "1");

const envSchema = z.object({
  RECRUITCRM_API_TOKEN: z.string().trim().min(1, "RECRUITCRM_API_TOKEN is required."),
  RECRUITCRM_BASE_URL: z.string().trim().url().optional(),
  RECRUITCRM_TIMEOUT_MS: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (value === undefined || value === "") {
        return DEFAULT_TIMEOUT_MS;
      }

      const parsed = Number(value);

      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error("RECRUITCRM_TIMEOUT_MS must be a positive integer.");
      }

      return Math.floor(parsed);
    }),
  RECRUITCRM_DEBUG_SCHEMA_ERRORS: envBooleanSchema,
});

export type AppConfig = {
  apiToken: string;
  baseUrl: string;
  timeoutMs: number;
  debugSchemaErrors: boolean;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid environment configuration.");
  }

  return {
    apiToken: parsed.data.RECRUITCRM_API_TOKEN,
    baseUrl: stripTrailingSlash(parsed.data.RECRUITCRM_BASE_URL ?? DEFAULT_BASE_URL),
    timeoutMs: parsed.data.RECRUITCRM_TIMEOUT_MS,
    debugSchemaErrors: parsed.data.RECRUITCRM_DEBUG_SCHEMA_ERRORS,
  };
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
