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
  date: { 
    type: Date, 
    required: true,
    validate: [
      {
        validator: (v: any) => v instanceof Date && !Number.isNaN(v.getTime()),
        message: 'date must be a valid Date',
      },
      {
        validator: (v: Date) => v.getTime() <= Date.now(),
        message: 'date cannot be in the future',
      },
    ],
  },
  amount: { 
    type: Number, 
    required: true, 
    min: [0, 'amount must be non-negative'],
    validate: {
      validator: (v: number) => Number.isFinite(v),
      message: 'amount must be a finite number',
    }
  },
  type: { type: String, enum: ['withdrawn', 'received'], required: true },
  name: { type: String, required: true },
  parsedAt: { type: Date, required: true },
  rawTextSnippet: { type: String },
}, { timestamps: true });

RecordSchema.index({ gmailMessageId: 1, attachmentHash: 1 }, { unique: true });

export const RecordModel = models.Record || model<RecordDoc>('Record', RecordSchema);
