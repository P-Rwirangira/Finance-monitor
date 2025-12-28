import pino from 'pino';
import { config } from '../config.js';
import { listMessagesWithPdfs, fetchPdfAttachments, getAuthorizedClient, getMessageReceivedAt } from '../services/gmail.js';
import { processAttachment } from './ingest.js';

const logger = pino({ name: 'ingest_gmail' });

export async function runGmailIngestion() {
  const auth = await getAuthorizedClient();
  const messages = await listMessagesWithPdfs(auth, {
    senders: config.senderWhitelist,
    daysLookback: config.daysLookback,
  });
  logger.info({ count: messages.length }, 'messages to process');

  for (const msg of messages) {
    try {
      const receivedAt = await getMessageReceivedAt(auth, msg.id);
      const atts = await fetchPdfAttachments(auth, msg.id);
      for (const att of atts) {
        try {
          await processAttachment(msg.id, att, receivedAt, config.pdfPassword);
        } catch (e) {
          logger.error({ messageId: msg.id, attachment: att.filename, err: e }, 'attachment processing failed');
        }
      }
    } catch (e) {
      logger.error({ messageId: msg.id, err: e }, 'message processing failed');
    }
  }
}
