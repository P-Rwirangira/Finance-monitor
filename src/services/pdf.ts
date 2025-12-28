import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import pdf from 'pdf-parse';

export function sha256(buf: Buffer) {
  const h = crypto.createHash('sha256');
  h.update(buf);
  return h.digest('hex');
}

export async function extractPdfText(buffer: Buffer, password?: string): Promise<string> {
  // pdf-parse supports password via options as { password }
  const data = await pdf(buffer, { password });
  return data.text || '';
}

export async function loadFile(path: string): Promise<Buffer> {
  return fs.readFile(path);
}
