import { Schema, model, models } from 'mongoose';

export interface RecordDoc {
  gmailMessageId: string;
  attachmentHash: string;
  attachmentFilename: string;
  date: Date;
  amount: number;
  type: 'withdrawn' | 'received';
  name: string;
  parsedAt: Date;
  rawTextSnippet?: string;
}

const RecordSchema = new Schema<RecordDoc>({
  gmailMessageId: { type: String, required: true },
  attachmentHash: { type: String, required: true },
  attachmentFilename: { type: String, required: true },
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['withdrawn', 'received'], required: true },
  name: { type: String, required: true },
  parsedAt: { type: Date, required: true },
  rawTextSnippet: { type: String },
}, { timestamps: true });

RecordSchema.index({ gmailMessageId: 1, attachmentHash: 1 }, { unique: true });

export const RecordModel = models.Record || model<RecordDoc>('Record', RecordSchema);
