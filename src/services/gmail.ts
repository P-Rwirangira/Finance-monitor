import { google } from 'googleapis';
import fs from 'node:fs/promises';
import path from 'node:path';

const TOKEN_DIR = path.join(process.cwd(), '.tokens');
const TOKEN_PATH = path.join(TOKEN_DIR, 'gmail_device_token.json');

const SCOPES = (process.env.APPLY_GMAIL_LABELS === 'true')
  ? ['https://www.googleapis.com/auth/gmail.modify']
  : ['https://www.googleapis.com/auth/gmail.readonly'];

export async function getAuthorizedClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET');
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob');
  try {
    const tokenRaw = await fs.readFile(TOKEN_PATH, 'utf8');
    const tokens = JSON.parse(tokenRaw);
    oauth2Client.setCredentials(tokens);
    oauth2Client.on('tokens', async (t) => {
      const merged = { ...tokens, ...t, refresh_token: t.refresh_token || tokens.refresh_token };
      await fs.mkdir(TOKEN_DIR, { recursive: true });
      await fs.writeFile(TOKEN_PATH, JSON.stringify(merged, null, 2), 'utf8');
    });
    return oauth2Client;
  } catch {
    await fs.mkdir(TOKEN_DIR, { recursive: true });
    const authUrl = oauth2Client.generateAuthUrl({ scope: SCOPES, access_type: 'offline', prompt: 'consent' });
    // eslint-disable-next-line no-console
    console.log('Authorize this app by visiting:', authUrl);
    const authCode = process.env.GOOGLE_AUTH_CODE;
    if (!authCode) {
      throw new Error('Missing token. Visit the URL above and set GOOGLE_AUTH_CODE env to the code you receive.');
    }
    const { tokens } = await oauth2Client.getToken(authCode);
    oauth2Client.setCredentials(tokens);
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf8');
    oauth2Client.on('tokens', async (t) => {
      const merged = { ...tokens, ...t, refresh_token: t.refresh_token || tokens.refresh_token };
      await fs.writeFile(TOKEN_PATH, JSON.stringify(merged, null, 2), 'utf8');
    });
    return oauth2Client;
  }
}

export async function listMessagesWithPdfs(auth: any, opts: { senders: string[]; daysLookback: number; maxMessages?: number; pageSize?: number; }) {
  const gmail = google.gmail({ version: 'v1', auth });
  const queryParts: string[] = ['has:attachment', 'filename:pdf'];
  if (opts.senders.length > 0) {
    const senderQuery = opts.senders.map((s) => `from:${s}`).join(' OR ');
    queryParts.push(`(${senderQuery})`);
  }
  if (opts.daysLookback) queryParts.push(`newer_than:${opts.daysLookback}d`);
  const q = queryParts.join(' ');
  const pageSize = opts.pageSize && opts.pageSize > 0 ? Math.min(opts.pageSize, 500) : 100;
  let pageToken: string | undefined = undefined;
  const all: any[] = [];
  do {
    const res = await gmail.users.messages.list({ userId: 'me', q, maxResults: pageSize, pageToken });
    const msgs = res.data.messages || [];
    all.push(...msgs);
    pageToken = res.data.nextPageToken || undefined;
    if (opts.maxMessages && all.length >= opts.maxMessages) {
      return all.slice(0, opts.maxMessages);
    }
  } while (pageToken);
  return all;
}

export async function fetchPdfAttachments(auth: any, messageId: string) {
  const gmail = google.gmail({ version: 'v1', auth });
  const msg = await gmail.users.messages.get({ userId: 'me', id: messageId });
  const parts = (msg.data.payload?.parts || []).flatMap((p) => (p.parts ? p.parts : [p]));
  const atts: { filename: string; data: Buffer }[] = [];
  for (const part of parts) {
    if (!part?.filename || !part.body?.attachmentId) continue;
    if (!/\.pdf$/i.test(part.filename)) continue;
    const att = await gmail.users.messages.attachments.get({ userId: 'me', messageId, id: part.body.attachmentId });
    const dataStr = att.data.data || '';
    const buf = Buffer.from(dataStr, 'base64');
    atts.push({ filename: part.filename, data: buf });
  }
  return atts;
}

export async function getMessageReceivedAt(auth: any, messageId: string): Promise<Date> {
  const gmail = google.gmail({ version: 'v1', auth });
  const msg = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'metadata', metadataHeaders: ['Date'] });
  const headers = msg.data.payload?.headers || [];
  const dateHeader = headers.find((h) => h.name?.toLowerCase() === 'date')?.value;
  if (dateHeader) {
    const d = new Date(dateHeader);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}
