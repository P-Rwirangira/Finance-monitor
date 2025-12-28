import express from 'express';
import { RecordModel } from './models/Record.js';

export function createServer() {
  const app = express();

  app.get('/healthz', (_req, res) => res.json({ ok: true }));

  app.get('/records', async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const docs = await RecordModel.find({}).sort({ parsedAt: -1 }).limit(limit).lean();
    res.json(docs);
  });

  return app;
}
