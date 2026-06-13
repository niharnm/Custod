import { z } from "zod";

export const browserTabSchema = z.object({
  id: z.number().int().optional(),
  title: z.string().trim().max(300).default(""),
  url: z.string().trim().max(2048).default(""),
  active: z.boolean().default(false),
  favIconUrl: z.string().trim().max(2048).optional(),
});

export const moodCheckInValueSchema = z.enum([
  "calm",
  "stressed",
  "overwhelmed",
  "numb",
  "skip",
]);

export const analyzeBurnoutRequestSchema = z.object({
  tabs: z.array(browserTabSchema).max(200),
  goal: z.string().trim().max(240).optional(),
  moodCheckIn: moodCheckInValueSchema.optional(),
  timeRemaining: z.string().trim().max(80).optional(),
  deviceId: z.string().trim().max(120).optional(),
});

export const registerDeviceRequestSchema = z.object({
  deviceId: z.string().trim().max(120).optional(),
  platform: z.enum(["chrome", "web", "ios", "macos"]),
  label: z.string().trim().max(80).optional(),
});

export const reflectionRequestSchema = z.object({
  text: z.string().trim().max(500).optional(),
  accuracy: z.enum(["accurate", "partly", "off"]).optional(),
  helpfulAction: z.string().trim().max(160).optional(),
});

export const resetCompleteRequestSchema = z.object({
  completedSteps: z.array(z.string().trim().max(120)).max(10).optional(),
});

export const privacySettingsPatchSchema = z
  .object({
    storeRawTabs: z.boolean().optional(),
    retentionDays: z.number().int().min(1).max(365).optional(),
    syncEnabled: z.boolean().optional(),
    shareDefaultsIncludeRaw: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one privacy setting is required.",
  });

export const shareRequestSchema = z.object({
  scanId: z.string().trim().min(1).max(120),
  includeRawTabs: z.boolean().optional(),
  expiresInHours: z.number().int().min(1).max(24 * 30).optional(),
});

export const deleteDataRequestSchema = z.object({
  confirm: z.literal(true),
});

export function zodErrorMessage(error: z.ZodError): string {
  const first = error.issues[0];
  return first ? `${first.path.join(".") || "request"}: ${first.message}` : "Invalid request.";
}
