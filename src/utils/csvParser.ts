import Papa from 'papaparse';
import { SalesOrderRow, ParseResult } from '../types/sales';

export const REQUIRED_COLUMNS = [
  'quarter',
  'region',
  'channel',
  'product',
  'units',
  'discount_pct',
  'revenue',
];

// Helper to normalize column names: "discount_pct", "discount%", "Discount Pct", etc.
function normalizeHeader(h: string): string {
  const clean = h.trim().toLowerCase().replace(/[\s\-_]+/g, '');
  if (clean.includes('quarter') || clean === 'qtr') return 'quarter';
  if (clean.includes('region') || clean === 'territory') return 'region';
  if (clean.includes('channel')) return 'channel';
  if (clean.includes('product') || clean === 'item') return 'product';
  if (clean.includes('unit') || clean === 'qty' || clean === 'quantity') return 'units';
  if (clean.includes('discount')) return 'discount_pct';
  if (clean.includes('revenue') || clean.includes('sales') || clean.includes('amount')) return 'revenue';
  return clean;
}

// Normalize quarter values: "Q1", "2024-Q1", "Quarter 2", "q3", etc.
export function normalizeQuarter(q: string): string {
  const val = String(q || '').trim().toUpperCase();
  const match = val.match(/Q(?:UARTER)?\s*([1-4])/i) || val.match(/([1-4])Q/i);
  if (match) {
    return `Q${match[1]}`;
  }
  return val || 'Unknown';
}

// Clean numbers: strip $, commas, %, etc.
function parseCleanNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  let str = String(val).trim().replace(/[$,]/g, '');
  const hasPercent = str.includes('%');
  str = str.replace(/%/g, '');
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  // If it had a % symbol and is e.g. 15, convert to 0.15
  if (hasPercent) return num / 100;
  return num;
}

// Normalize discount_pct: if user entered 15 or 15%, or 0.15
function parseDiscountPct(val: any): number {
  const num = parseCleanNumber(val);
  // If user entered 15 (meaning 15%), convert to 0.15 if > 1
  if (num > 1 && num <= 100) {
    return num / 100;
  }
  return num;
}

export function parseSalesCsv(csvText: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const parsed = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header: string) => normalizeHeader(header),
  });

  if (parsed.errors && parsed.errors.length > 0) {
    parsed.errors.forEach((e) => {
      if (e.type === 'Delimiter') {
        warnings.push(`Parser notice: ${e.message}`);
      } else {
        errors.push(`Row ${e.row ?? '?'}: ${e.message}`);
      }
    });
  }

  const fields = parsed.meta.fields || [];
  const missing = REQUIRED_COLUMNS.filter((req) => !fields.includes(req));

  if (missing.length > 0) {
    errors.push(
      `Missing required column headers: ${missing.join(', ')}. Expected: quarter, region, channel, product, units, discount_pct, revenue.`
    );
    return { data: [], errors, warnings, rowCount: 0 };
  }

  const data: SalesOrderRow[] = [];

  parsed.data.forEach((row, idx) => {
    const rawQuarter = row['quarter'];
    const rawRegion = row['region'];
    const rawChannel = row['channel'];
    const rawProduct = row['product'];

    // Check if row is virtually empty
    if (!rawQuarter && !rawRegion && !rawProduct && !row['revenue']) {
      return;
    }

    const quarter = normalizeQuarter(rawQuarter);
    const region = String(rawRegion || 'Unknown').trim();
    const channel = String(rawChannel || 'General').trim();
    const product = String(rawProduct || 'General Product').trim();
    const units = Math.max(0, Math.round(parseCleanNumber(row['units'])));
    const discount_pct = Math.max(0, parseDiscountPct(row['discount_pct']));
    const revenue = parseCleanNumber(row['revenue']);

    if (!region || region === 'Unknown') {
      warnings.push(`Row ${idx + 2}: Region was empty or unspecified; set to 'Unknown'.`);
    }

    data.push({
      quarter,
      region,
      channel,
      product,
      units,
      discount_pct,
      revenue,
    });
  });

  if (data.length === 0 && errors.length === 0) {
    errors.push('No valid sales order rows could be found in the provided CSV file.');
  }

  return {
    data,
    errors,
    warnings,
    rowCount: data.length,
  };
}
