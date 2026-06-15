// Client-side schedule parsing. Reads Excel / CSV / Word / PDF and produces
// normalized rows for the server importer. Heavy parsers are dynamically
// imported so they stay out of the main bundle.

import type { ScheduleRow } from './serverStore';

export interface ParseResult {
  rows: ScheduleRow[];
  note: string;
}

// Map a spreadsheet header cell to a known field.
function classifyHeader(h: string): keyof ScheduleRow | 'result' | null {
  const k = h.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!k) return null;
  if (/(scorea|ascore|homescore|score1|teamascore)/.test(k)) return 'scoreA';
  if (/(scoreb|bscore|awayscore|score2|teambscore)/.test(k)) return 'scoreB';
  if (/^(result|score|scoreline)$/.test(k)) return 'result';
  if (/(teama|teamone|team1|home|player1|side1|sidea)/.test(k)) return 'teamA';
  if (/(teamb|teamtwo|team2|away|player2|side2|sideb)/.test(k)) return 'teamB';
  if (/(group|pool|stage|round|category)/.test(k)) return 'group';
  if (/(date|day)/.test(k)) return 'date';
  if (/(time|kickoff|start)/.test(k)) return 'time';
  return null;
}

function splitResult(v: string): [number, number] | null {
  const m = String(v).match(/(\d{1,3})\s*[-–:to]+\s*(\d{1,3})/i);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10)];
}

// Turn an array of header-keyed objects into rows.
function rowsFromObjects(objs: Record<string, unknown>[]): ScheduleRow[] {
  if (objs.length === 0) return [];
  const headers = Object.keys(objs[0]);
  const map = new Map<string, keyof ScheduleRow | 'result'>();
  for (const h of headers) {
    const f = classifyHeader(h);
    if (f && !map.has(h)) map.set(h, f);
  }
  const rows: ScheduleRow[] = [];
  for (const o of objs) {
    const row: ScheduleRow = { teamA: '', teamB: '' };
    let result = '';
    for (const [h, field] of map) {
      const val = o[h] == null ? '' : String(o[h]).trim();
      if (field === 'result') result = val;
      else if (field === 'scoreA') row.scoreA = val === '' ? null : Number(val);
      else if (field === 'scoreB') row.scoreB = val === '' ? null : Number(val);
      else (row as unknown as Record<string, string>)[field] = val;
    }
    if (result && (row.scoreA == null || row.scoreB == null)) {
      const sc = splitResult(result);
      if (sc) { row.scoreA = sc[0]; row.scoreB = sc[1]; }
    }
    if (row.teamA && row.teamB) rows.push(row);
  }
  return rows;
}

// Best-effort parse of free text (Word / PDF), one match per line.
function rowsFromText(text: string): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const vsRe = /\s+(?:vs?\.?|versus)\s+/i;
  let currentGroup = '';
  for (const line of lines) {
    // A standalone heading like "Group A" / "Quarterfinals"
    const heading = line.match(/^(group\s*[a-d]|pool\s*\w+|quarter\s*finals?|qf\d*|semi\s*finals?|sf\d*|finals?)\b\s*:?\s*$/i);
    if (heading) { currentGroup = heading[1]; continue; }

    if (!vsRe.test(line)) continue;
    // Leading group token on the line itself
    let work = line;
    let group = currentGroup;
    const lead = work.match(/^(group\s*[a-d]|qf\d*|sf\d*|final)\b[:\-\s]*/i);
    if (lead) { group = lead[1]; work = work.slice(lead[0].length); }

    // Trailing score "25-12"
    let scoreA: number | null = null;
    let scoreB: number | null = null;
    const sc = work.match(/(\d{1,3})\s*[-–:]\s*(\d{1,3})\s*$/);
    if (sc) { scoreA = parseInt(sc[1], 10); scoreB = parseInt(sc[2], 10); work = work.slice(0, sc.index).trim(); }

    // Trailing date/time chunk (very rough): pull a date-like token
    let date = '';
    const dm = work.match(/((?:\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})|(?:\w{3,9}\s+\d{1,2},?\s*\d{2,4}))\s*(\d{1,2}:\d{2}\s*(?:am|pm)?)?\s*$/i);
    if (dm) { date = dm[0].trim(); work = work.slice(0, dm.index).trim(); }

    const [a, b] = work.split(vsRe);
    if (!a || !b) continue;
    rows.push({ group: group || undefined, teamA: a.trim(), teamB: b.trim(), date: date || undefined, scoreA, scoreB });
  }
  return rows;
}

async function parseSpreadsheet(file: File): Promise<ScheduleRow[]> {
  const XLSX = await import('xlsx');
  let wb;
  if (/\.csv$/i.test(file.name)) {
    wb = XLSX.read(await file.text(), { type: 'string' });
  } else {
    wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  }
  const ws = wb.Sheets[wb.SheetNames[0]];
  const objs = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false }) as Record<string, unknown>[];
  return rowsFromObjects(objs);
}

async function parseDocx(file: File): Promise<ScheduleRow[]> {
  const mammoth = await import('mammoth');
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return rowsFromText(value || '');
}

async function parsePdf(file: File): Promise<ScheduleRow[]> {
  const pdfjs = await import('pdfjs-dist');
  // Worker from a CDN that mirrors the exact installed version.
  (pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = '';
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Group items into lines by their vertical position.
    const byLine = new Map<number, string[]>();
    for (const it of content.items as { str: string; transform: number[] }[]) {
      const y = Math.round(it.transform[5]);
      if (!byLine.has(y)) byLine.set(y, []);
      byLine.get(y)!.push(it.str);
    }
    const ys = [...byLine.keys()].sort((a, b) => b - a);
    text += ys.map((y) => byLine.get(y)!.join(' ')).join('\n') + '\n';
  }
  return rowsFromText(text);
}

export async function parseScheduleFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  let rows: ScheduleRow[] = [];
  let note = '';
  if (/\.(xlsx|xls|csv)$/.test(name)) {
    rows = await parseSpreadsheet(file);
    note = 'Parsed as a spreadsheet.';
  } else if (/\.docx$/.test(name)) {
    rows = await parseDocx(file);
    note = 'Parsed Word text (best-effort).';
  } else if (/\.pdf$/.test(name)) {
    rows = await parsePdf(file);
    note = 'Parsed PDF text (best-effort).';
  } else if (/\.doc$/.test(name)) {
    throw new Error('Old .doc files are not supported — please save as .docx, or export to Excel/CSV.');
  } else {
    throw new Error('Unsupported file type. Use .xlsx, .csv, .docx or .pdf.');
  }
  return { rows, note };
}

// A ready-to-use CSV template for users to fill in.
export const CSV_TEMPLATE =
  'Group,Team A,Team B,Date,Time,Score A,Score B\n' +
  'A,Anbu Label,CSK Veriyan,2026-06-11,15:30,25,12\n' +
  'A,The Rebounders,Magizhchi,2026-06-11,18:30,,\n' +
  'B,Daddy Army,DD Returns,2026-06-12,10:00,,\n' +
  'QF,,,,2026-06-20,18:00,\n';
