import pino from 'pino';
import { RecordModel } from '../models/Record.js';
import { extractPdfText, sha256 } from '../services/pdf.js';
import { parseFromText } from '../services/parser.js';

const logger = pino({ name: 'ingest' });

export interface AttachmentLike { filename: string; data: Buffer; }

export async function processAttachment(gmailMessageId: string, att: AttachmentLike, receivedAt: Date, pdfPassword?: string) {
  const attachmentHash = await sha256(att.data);

  // Try idempotent upsert: first check if exists
  const exists = await RecordModel.findOne({ gmailMessageId, attachmentHash }).select('_id').lean();
  if (exists) {
    logger.info({ gmailMessageId, attachment: att.filename }, 'duplicate skipped');
    return { status: 'skipped' as const };
  }

  const text = await extractPdfText(att.data, pdfPassword);
  const parsed = parseFromText(text);
  if (!parsed.amount || !parsed.type || !parsed.name) {
    logger.warn({ gmailMessageId, attachment: att.filename }, 'missing fields after parse');
  }
  await RecordModel.create({
    gmailMessageId,
    attachmentHash,
    attachmentFilename: att.filename,
    date: receivedAt,
    amount: parsed.amount ?? 0,
    type: parsed.type ?? 'received',
    name: parsed.name ?? 'Unknown',
    parsedAt: new Date(),
    rawTextSnippet: text.slice(0, 200),
  });
  logger.info({ gmailMessageId, attachment: att.filename }, 'stored record');
  return { status: 'stored' as const };
}
