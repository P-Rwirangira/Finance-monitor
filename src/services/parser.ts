export type Parsed = { amount?: number; type?: 'withdrawn' | 'received'; name?: string };

// Very simple heuristics; can be extended per sender template
export function parseFromText(text: string): Parsed {
  const normalized = text.replace(/\u00A0/g, ' ');

  // Amount: capture first currency-like number
  const amountMatch = normalized.match(/(?:USD|INR|EUR|GBP|\$|£|€)?\s*(-?\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/);
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : undefined;

  // Type: withdrawn/debited vs received/credited
  let type: 'withdrawn' | 'received' | undefined;
  if (/\b(withdrawn|withdrawal|debited|debit)\b/i.test(normalized)) type = 'withdrawn';
  if (/\b(received|credited|credit|deposit)\b/i.test(normalized)) type = 'received';

  // Name: look for common labels
  let name: string | undefined;
  const nameLabels = [/Name\s*:\s*([^\n\r]+)/i, /Account Holder\s*:\s*([^\n\r]+)/i, /Payee\s*:\s*([^\n\r]+)/i];
  for (const rx of nameLabels) {
    const m = normalized.match(rx);
    if (m) { name = m[1].trim(); break; }
  }
  // Fallback: first line with letters, not too short
  if (!name) {
    const firstLine = normalized.split(/\r?\n/).map(l => l.trim()).find(l => /^[A-Za-z ,.'-]{3,}$/.test(l));
    if (firstLine) name = firstLine;
  }

  return { amount, type, name };
}
