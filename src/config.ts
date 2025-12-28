import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  MONGODB_URI: z.string().min(1),
  PORT: z.string().transform((v) => Number(v)).default('8080'),
  GMAIL_SENDER_WHITELIST: z.string().default(''),
  DAYS_LOOKBACK: z.string().transform((v) => Number(v)).default('7'),
  PDF_PASSWORD: z.string().default(''),
  APPLY_GMAIL_LABELS: z.string().default('false'),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten());
  process.exit(1);
}

export const config = {
  mongodbUri: parsed.data.MONGODB_URI,
  port: parsed.data.PORT,
  senderWhitelist: parsed.data.GMAIL_SENDER_WHITELIST
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  daysLookback: parsed.data.DAYS_LOOKBACK,
  pdfPassword: parsed.data.PDF_PASSWORD,
  applyGmailLabels: parsed.data.APPLY_GMAIL_LABELS === 'true',
};
