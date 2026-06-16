// Server-side tournament data store.
//
// This module is the single source of truth for the whole site. State is held
// in memory and persisted to a JSON file under `.data/` so it survives server
// restarts. It must only ever be imported from Route Handlers (server code) —
// it uses the Node `fs` API and intentionally never runs in the browser.

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  Team,
  Match,
  NewsItem,
  TournamentSettings,
  MatchStatus,
  GroupName,
} from './types';
import {
  SEED_TEAMS,
  SEED_NEWS,
  generateLeagueFixtures,
  generateKnockoutPlaceholders,
  getResolvedKnockouts,
  pointsFromSettings,
} from './store';

export interface TournamentState {
  teams: Team[];
  matches: Match[];
  settings: TournamentSettings;
  news: NewsItem[];
}

// Where the JSON store lives. On a normal Node host this is the project's
// `.data/` (durable). On serverless platforms like Vercel the project dir is
// read-only, so fall back to the OS temp dir (writable but ephemeral). An
// explicit DATA_DIR env var always wins — point it at a mounted volume for
// durable hosting.
const DATA_DIR = process.env.DATA_DIR
  ? process.env.DATA_DIR
  : process.env.VERCEL || process.env.AWS_REGION
    ? path.join(os.tmpdir(), 'pocket-masters')
    : path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'tournament.json');

const DEFAULT_PASSCODE = 'PocketMasters2026';

// In-memory cache + a tiny write lock so concurrent admin saves don't race on
// the file. All mutations funnel through `mutate()`.
let cache: TournamentState | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

// Roster name pool — each team gets 4 players assigned deterministically.
const PLAYER_POOL = [
  'Arjun', 'Karthik', 'Vivek', 'Surya', 'Bala', 'Rahul', 'Deepak', 'Manoj',
  'Praveen', 'Naveen', 'Ashok', 'Kumar', 'Vimal', 'Hari', 'Gokul', 'Sanjay',
  'Ramesh', 'Dinesh', 'Mohan', 'Sathish', 'Vignesh', 'Aravind', 'Kiran', 'Ravi',
  'Saravanan', 'Prakash', 'Anand', 'Vijay', 'Senthil', 'Murugan', 'Ganesh', 'Raja',
  'Suresh', 'Mahesh', 'Logan', 'Yuvan', 'Aakash', 'Bharath', 'Charan', 'Dhanush',
  'Eswar', 'Farook', 'Giri', 'Harish', 'Inba', 'Jeeva', 'Kavin', 'Lokesh',
];

function rosterFor(index: number, code: string): string[] {
  return Array.from({ length: 4 }, (_, i) => {
    const name = PLAYER_POOL[(index * 4 + i) % PLAYER_POOL.length];
    return `${name} ${code}`;
  });
}

function buildSeedState(): TournamentState {
  const teams: Team[] = SEED_TEAMS.map((t, idx) => ({
    id: `team-${t.code.toLowerCase()}`,
    name: t.name,
    code: t.code,
    group_name: t.group_name,
    logo_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
      t.name
    )}`,
    players: rosterFor(idx, t.code),
  }));

  const league = generateLeagueFixtures(teams);
  const knockouts = generateKnockoutPlaceholders();

  const settings: TournamentSettings = {
    points_per_win: 2,
    points_per_draw: 0,
    draw_points_enabled: false,
    passcode: DEFAULT_PASSCODE,
    tournament_stage: 'LEAGUE',
  };

  return {
    teams,
    matches: [...league, ...knockouts],
    // Clone seed news so later mutations never touch the module constant.
    news: SEED_NEWS.map((n) => ({ ...n })),
    settings,
  };
}

// Optional durable, shared storage (Vercel KV / Upstash Redis REST). When these
// env vars are present (Vercel KV provisions them automatically), every server
// instance reads/writes the same record, so admin edits are visible to all
// visitors. Without them, the local file + in-memory store is used.
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const KV_KEY = 'pocket_masters_state';
const useKV = !!(KV_URL && KV_TOKEN);

// Coerce any parsed object into a valid, fully-defaulted TournamentState.
function normalizeState(parsed: Partial<TournamentState> | null | undefined): TournamentState | null {
  if (!parsed || !Array.isArray(parsed.teams) || !Array.isArray(parsed.matches) || !parsed.settings) {
    return null;
  }
  return {
    teams: parsed.teams,
    matches: parsed.matches,
    news: Array.isArray(parsed.news) ? parsed.news : [],
    settings: {
      draw_points_enabled: !!parsed.settings.draw_points_enabled,
      points_per_win: typeof parsed.settings.points_per_win === 'number' ? parsed.settings.points_per_win : 2,
      points_per_draw:
        typeof parsed.settings.points_per_draw === 'number'
          ? parsed.settings.points_per_draw
          : parsed.settings.draw_points_enabled
          ? 1
          : 0,
      passcode: parsed.settings.passcode || DEFAULT_PASSCODE,
      tournament_stage: parsed.settings.tournament_stage || 'LEAGUE',
    },
  };
}

async function kvGet(): Promise<TournamentState | null> {
  try {
    const res = await fetch(`${KV_URL}/get/${KV_KEY}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: string | null };
    if (!data || data.result == null) return null;
    return normalizeState(JSON.parse(data.result));
  } catch (err) {
    console.warn('[serverStore] KV read failed:', (err as Error).message);
    return null;
  }
}

async function kvSet(state: TournamentState): Promise<void> {
  try {
    await fetch(`${KV_URL}/set/${KV_KEY}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'text/plain' },
      body: JSON.stringify(state),
    });
  } catch (err) {
    console.warn('[serverStore] KV write failed:', (err as Error).message);
  }
}

async function persistFile(state: TournamentState): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[serverStore] file persist skipped:', (err as Error).message);
  }
}

async function loadFile(): Promise<TournamentState> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const norm = normalizeState(JSON.parse(raw));
    if (norm) {
      cache = norm;
      return cache;
    }
  } catch {
    // File doesn't exist yet — seed below.
  }
  cache = buildSeedState();
  await persistFile(cache);
  return cache;
}

/** Read the canonical state from whichever backend is configured. */
async function readState(): Promise<TournamentState> {
  if (useKV) {
    const kv = await kvGet();
    if (kv) return kv;
    const seeded = buildSeedState();
    await kvSet(seeded);
    return seeded;
  }
  return loadFile();
}

/** Write the canonical state to whichever backend is configured. */
async function writeState(state: TournamentState): Promise<void> {
  if (useKV) {
    await kvSet(state);
    return;
  }
  cache = state;
  await persistFile(state);
}

/**
 * Serialize a mutation: read current state, apply `fn`, persist. Returns the new
 * state. Writes within an instance are chained so they can't interleave.
 */
async function mutate(
  fn: (state: TournamentState) => TournamentState | void
): Promise<TournamentState> {
  const run = async (): Promise<TournamentState> => {
    const current = await readState();
    const draft: TournamentState = JSON.parse(JSON.stringify(current));
    const result = fn(draft) || draft;
    await writeState(result);
    return result;
  };

  const next = writeChain.then(run, run);
  writeChain = next.catch(() => undefined);
  return next;
}

// ── Public read API ─────────────────────────────────────────────────────────

/** Full state for server use (includes the passcode). */
export async function getState(): Promise<TournamentState> {
  return readState();
}

/** State safe to send to the browser — passcode stripped out. */
export async function getPublicState(): Promise<TournamentState> {
  const state = await readState();
  return {
    ...state,
    settings: {
      draw_points_enabled: state.settings.draw_points_enabled,
      points_per_win: state.settings.points_per_win,
      points_per_draw: state.settings.points_per_draw,
      tournament_stage: state.settings.tournament_stage,
    },
  };
}

export async function checkPasscode(passcode: string): Promise<boolean> {
  const state = await readState();
  return !!passcode && passcode === state.settings.passcode;
}

// ── Public mutation API ─────────────────────────────────────────────────────

export async function updateMatchScore(
  matchId: string,
  scoreA: number,
  scoreB: number,
  status: MatchStatus,
  matchDate?: string
): Promise<TournamentState> {
  return mutate((state) => {
    const a = clampScore(scoreA);
    const b = clampScore(scoreB);
    const isCompleted = status === 'COMPLETED';
    const validDate = matchDate && !Number.isNaN(Date.parse(matchDate)) ? matchDate : undefined;

    state.matches = state.matches.map((m) => {
      if (m.id !== matchId) return m;
      let winnerId: string | null = null;
      if (isCompleted) {
        if (a > b) winnerId = m.team_a_id;
        else if (b > a) winnerId = m.team_b_id;
      }
      return {
        ...m,
        team_a_score: a,
        team_b_score: b,
        winner_id: winnerId,
        is_completed: isCompleted,
        status,
        match_date: validDate || m.match_date,
      };
    });

    // Re-resolve the knockout bracket from the latest standings.
    state.matches = getResolvedKnockouts(
      state.teams,
      state.matches,
      pointsFromSettings(state.settings)
    );
  });
}

export async function updateSettings(
  partial: Partial<TournamentSettings>
): Promise<TournamentState> {
  return mutate((state) => {
    if (typeof partial.draw_points_enabled === 'boolean') {
      state.settings.draw_points_enabled = partial.draw_points_enabled;
    }
    if (typeof partial.points_per_win === 'number' && partial.points_per_win >= 0) {
      state.settings.points_per_win = Math.round(partial.points_per_win);
    }
    if (typeof partial.points_per_draw === 'number' && partial.points_per_draw >= 0) {
      state.settings.points_per_draw = Math.round(partial.points_per_draw);
    }
    if (partial.tournament_stage) {
      state.settings.tournament_stage = partial.tournament_stage;
    }
    if (typeof partial.passcode === 'string' && partial.passcode.trim()) {
      state.settings.passcode = partial.passcode.trim();
    }

    // Scoring affects standings → re-resolve the bracket.
    state.matches = getResolvedKnockouts(
      state.teams,
      state.matches,
      pointsFromSettings(state.settings)
    );
  });
}

export async function addNews(
  title: string,
  summary: string,
  content: string,
  imageUrl?: string
): Promise<TournamentState> {
  return mutate((state) => {
    const item: NewsItem = {
      id: `news-${Date.now()}`,
      title,
      summary,
      content,
      image_url:
        imageUrl?.trim() ||
        'https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=800&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    };
    state.news = [item, ...state.news];
  });
}

export async function deleteNews(id: string): Promise<TournamentState> {
  return mutate((state) => {
    state.news = state.news.filter((n) => n.id !== id);
  });
}

export async function updateTeam(
  id: string,
  name: string,
  logoUrl: string,
  players?: string[],
  group?: GroupName
): Promise<TournamentState> {
  return mutate((state) => {
    const validGroup = group && (['A', 'B', 'C', 'D'] as string[]).includes(group) ? group : undefined;
    state.teams = state.teams.map((t) =>
      t.id === id
        ? {
            ...t,
            name: name.trim() || t.name,
            logo_url: logoUrl.trim() || t.logo_url,
            players: Array.isArray(players)
              ? players.map((p) => String(p).trim()).filter(Boolean)
              : t.players,
            group_name: validGroup || t.group_name,
          }
        : t
    );
  });
}

/** Start a brand-new, empty tournament (no teams, fixtures or news). */
export async function newTournament(): Promise<TournamentState> {
  return mutate((state) => ({
    teams: [],
    matches: [],
    news: [],
    settings: { ...state.settings },
  }));
}

// Placeholder slot ids for a knockout match, e.g. match-qf1 → t-qf1-a / t-qf1-b.
function placeholderSlots(matchId: string): { a: string; b: string } {
  const short = matchId.replace('match-', '');
  return { a: `t-${short}-a`, b: `t-${short}-b` };
}

/**
 * Generate the knockout bracket from the current group standings: lock the top
 * two of each group into the quarter-finals. Semi-finals and the final continue
 * to resolve automatically from the QF winners.
 */
export async function generateBracket(): Promise<TournamentState> {
  const { calculateStandings } = await import('./store');
  return mutate((state) => {
    const standings = calculateStandings(
      state.teams,
      state.matches.filter((m) => m.stage === 'LEAGUE'),
      pointsFromSettings(state.settings)
    );
    const winners = (group: string, slot: 0 | 1) => {
      const rows = standings.filter((s) => {
        const t = state.teams.find((tm) => tm.id === s.team_id);
        return t?.group_name === group;
      });
      return rows[slot]?.team_id;
    };
    // QF pairing: A1 v B2, B1 v A2, C1 v D2, D1 v C2.
    const qf: Record<string, [string | undefined, string | undefined]> = {
      'match-qf1': [winners('A', 0), winners('B', 1)],
      'match-qf2': [winners('B', 0), winners('A', 1)],
      'match-qf3': [winners('C', 0), winners('D', 1)],
      'match-qf4': [winners('D', 0), winners('C', 1)],
    };
    state.matches = state.matches.map((m) => {
      const pair = qf[m.id];
      if (!pair || !pair[0] || !pair[1]) return m;
      return {
        ...m,
        team_a_id: pair[0]!,
        team_b_id: pair[1]!,
        team_a_score: 0,
        team_b_score: 0,
        winner_id: null,
        is_completed: false,
        status: 'UPCOMING',
        locked: true,
      };
    });
  });
}

/**
 * Manually set (or clear) the two teams of a knockout match. Passing empty
 * ids reverts the slot to automatic resolution.
 */
export async function setBracketTeams(
  matchId: string,
  teamAId: string,
  teamBId: string
): Promise<TournamentState> {
  return mutate((state) => {
    const match = state.matches.find((m) => m.id === matchId);
    if (!match || match.stage === 'LEAGUE') return;
    const clear = !teamAId || !teamBId;
    const ph = placeholderSlots(matchId);
    state.matches = state.matches.map((m) => {
      if (m.id !== matchId) return m;
      return {
        ...m,
        team_a_id: clear ? ph.a : teamAId,
        team_b_id: clear ? ph.b : teamBId,
        team_a_score: 0,
        team_b_score: 0,
        winner_id: null,
        is_completed: false,
        status: 'UPCOMING',
        locked: !clear,
      };
    });
    // Re-resolve so downstream (auto) slots reflect the change.
    state.matches = getResolvedKnockouts(state.teams, state.matches, pointsFromSettings(state.settings));
  });
}

export async function resetTournament(): Promise<TournamentState> {
  return mutate((state) => {
    const league = generateLeagueFixtures(state.teams);
    const knockouts = generateKnockoutPlaceholders();
    state.matches = [...league, ...knockouts];
  });
}

/**
 * Wipe the entire tournament back to the default Pocket Masters seed — teams,
 * fixtures, news and settings — keeping only the current admin passcode.
 */
export async function fullReset(): Promise<TournamentState> {
  return mutate((state) => {
    const fresh = buildSeedState();
    fresh.settings.passcode = state.settings.passcode; // don't lock the admin out
    return fresh;
  });
}

export async function importState(
  incoming: Partial<TournamentState>
): Promise<TournamentState> {
  return mutate((state) => {
    if (Array.isArray(incoming.teams) && incoming.teams.length) {
      state.teams = incoming.teams;
    }
    if (Array.isArray(incoming.matches) && incoming.matches.length) {
      state.matches = incoming.matches;
    }
    if (Array.isArray(incoming.news)) {
      state.news = incoming.news;
    }
    if (incoming.settings) {
      state.settings = {
        draw_points_enabled: !!incoming.settings.draw_points_enabled,
        points_per_win:
          typeof incoming.settings.points_per_win === 'number' ? incoming.settings.points_per_win : 2,
        points_per_draw:
          typeof incoming.settings.points_per_draw === 'number'
            ? incoming.settings.points_per_draw
            : incoming.settings.draw_points_enabled
            ? 1
            : 0,
        // Never let an import silently overwrite the admin passcode.
        passcode: state.settings.passcode,
        tournament_stage: incoming.settings.tournament_stage || 'LEAGUE',
      };
    }
  });
}

// ── Schedule import ─────────────────────────────────────────────────────────

export interface ScheduleRow {
  group?: string; // "A" / "Group A" / "QF" / "Semifinal" / "Final" …
  teamA: string;
  teamB: string;
  date?: string;
  time?: string;
  scoreA?: number | null;
  scoreB?: number | null;
}

const GROUPS: GroupName[] = ['A', 'B', 'C', 'D'];

function normalizeStage(raw?: string): { kind: 'LEAGUE' | 'QF' | 'SF' | 'FINAL'; groupRaw: string } {
  const s = (raw || '').toLowerCase().trim();
  if (/\b(qf|quarter)/.test(s)) return { kind: 'QF', groupRaw: '' };
  if (/\b(sf|semi)/.test(s)) return { kind: 'SF', groupRaw: '' };
  if (/final/.test(s)) return { kind: 'FINAL', groupRaw: '' };
  return { kind: 'LEAGUE', groupRaw: (raw || '').trim() };
}

function parseWhen(date?: string, time?: string, fallbackIdx = 0): string {
  const base = [date, time].filter(Boolean).join(' ').trim();
  const ts = base ? Date.parse(base) : NaN;
  if (!Number.isNaN(ts)) return new Date(ts).toISOString();
  return new Date(Date.parse('2026-06-11T10:00:00Z') + fallbackIdx * 3 * 3600 * 1000).toISOString();
}

/**
 * Build a complete tournament (teams, league fixtures, knockout bracket) from a
 * list of parsed schedule rows, then replace the current state with it. Distinct
 * league groups are mapped to A–D in order of first appearance.
 */
export async function importScheduleRows(rows: ScheduleRow[]): Promise<TournamentState> {
  return mutate((state) => {
    const leagueRows: { groupRaw: string; teamA: string; teamB: string; date?: string; time?: string; scoreA?: number | null; scoreB?: number | null }[] = [];
    const koRows: { kind: 'QF' | 'SF' | 'FINAL'; date?: string; time?: string }[] = [];

    for (const r of rows) {
      if (!r || !r.teamA || !r.teamB) continue;
      const st = normalizeStage(r.group);
      if (st.kind === 'LEAGUE') {
        leagueRows.push({ groupRaw: st.groupRaw, teamA: String(r.teamA).trim(), teamB: String(r.teamB).trim(), date: r.date, time: r.time, scoreA: r.scoreA, scoreB: r.scoreB });
      } else {
        koRows.push({ kind: st.kind, date: r.date, time: r.time });
      }
    }

    // Map distinct league group labels → A..D.
    const groupMap = new Map<string, GroupName>();
    const keyOf = (raw?: string) => (raw || 'A').toUpperCase().replace(/^GROUP\s*/, '').replace(/^POOL\s*/, '').trim() || 'A';
    for (const r of leagueRows) {
      const k = keyOf(r.groupRaw);
      if (!groupMap.has(k) && groupMap.size < 4) groupMap.set(k, GROUPS[groupMap.size]);
    }
    if (groupMap.size === 0) groupMap.set('A', 'A');
    const groupOf = (raw?: string): GroupName => groupMap.get(keyOf(raw)) || GROUPS[0];

    // Collect teams (name → group), league rows first.
    const teamGroup = new Map<string, GroupName>();
    for (const r of leagueRows) {
      const g = groupOf(r.groupRaw);
      for (const n of [r.teamA, r.teamB]) if (n && !teamGroup.has(n)) teamGroup.set(n, g);
    }
    if (teamGroup.size === 0) return; // nothing usable

    // Build team records with codes/ids.
    const counts: Record<string, number> = {};
    const nameToId = new Map<string, string>();
    const teams: Team[] = [];
    for (const [name, g] of teamGroup) {
      counts[g] = (counts[g] || 0) + 1;
      const code = `${g}${counts[g]}`;
      const id = `team-${code.toLowerCase()}`;
      nameToId.set(name, id);
      teams.push({
        id,
        name,
        code,
        group_name: g,
        logo_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
        players: [],
      });
    }

    // League matches.
    const league: Match[] = [];
    let li = 0;
    for (const r of leagueRows) {
      const aId = nameToId.get(r.teamA);
      const bId = nameToId.get(r.teamB);
      if (!aId || !bId || aId === bId) continue;
      li++;
      const hasScore =
        r.scoreA !== undefined && r.scoreA !== null && r.scoreB !== undefined && r.scoreB !== null &&
        !Number.isNaN(Number(r.scoreA)) && !Number.isNaN(Number(r.scoreB));
      const sA = hasScore ? clampScore(r.scoreA) : 0;
      const sB = hasScore ? clampScore(r.scoreB) : 0;
      const winner = hasScore ? (sA > sB ? aId : sB > sA ? bId : null) : null;
      league.push({
        id: `match-league-${li}`,
        group_name: groupOf(r.groupRaw),
        team_a_id: aId,
        team_b_id: bId,
        team_a_score: sA,
        team_b_score: sB,
        winner_id: winner,
        is_completed: hasScore,
        stage: 'LEAGUE',
        status: hasScore ? 'COMPLETED' : 'UPCOMING',
        match_date: parseWhen(r.date, r.time, li - 1),
      });
    }

    // Standard knockout bracket; borrow dates from any KO rows provided.
    const ko = generateKnockoutPlaceholders();
    const byStage: Record<'QF' | 'SF' | 'FINAL', typeof koRows> = { QF: [], SF: [], FINAL: [] };
    for (const r of koRows) byStage[r.kind].push(r);
    let qi = 0;
    let si = 0;
    for (const m of ko) {
      if (m.stage === 'QF' && byStage.QF[qi]) m.match_date = parseWhen(byStage.QF[qi].date, byStage.QF[qi++].time);
      else if (m.stage === 'SF' && byStage.SF[si]) m.match_date = parseWhen(byStage.SF[si].date, byStage.SF[si++].time);
      else if (m.stage === 'FINAL' && byStage.FINAL[0]) m.match_date = parseWhen(byStage.FINAL[0].date, byStage.FINAL[0].time);
    }

    state.teams = teams;
    state.matches = getResolvedKnockouts(teams, [...league, ...ko], pointsFromSettings(state.settings));
  });
}

function clampScore(n: unknown): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v) || v < 0) return 0;
  if (v > 99) return 99;
  return v;
}
