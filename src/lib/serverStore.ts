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
} from './types';
import {
  SEED_TEAMS,
  SEED_NEWS,
  generateLeagueFixtures,
  generateKnockoutPlaceholders,
  getResolvedKnockouts,
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

async function persist(state: TournamentState): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    // Read-only / unavailable filesystem (e.g. serverless). Keep serving from
    // the in-memory cache instead of crashing — edits persist for the lifetime
    // of the running instance only.
    console.warn('[serverStore] persist skipped:', (err as Error).message);
  }
}

async function load(): Promise<TournamentState> {
  if (cache) return cache;

  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<TournamentState>;

    // Be defensive: fall back to a fresh seed if the file is malformed.
    if (
      parsed &&
      Array.isArray(parsed.teams) &&
      Array.isArray(parsed.matches) &&
      parsed.settings
    ) {
      cache = {
        teams: parsed.teams,
        matches: parsed.matches,
        news: Array.isArray(parsed.news) ? parsed.news : [],
        settings: {
          draw_points_enabled: !!parsed.settings.draw_points_enabled,
          passcode: parsed.settings.passcode || DEFAULT_PASSCODE,
          tournament_stage: parsed.settings.tournament_stage || 'LEAGUE',
        },
      };
      return cache;
    }
  } catch {
    // File doesn't exist yet (first run) — fall through to seeding.
  }

  cache = buildSeedState();
  await persist(cache);
  return cache;
}

/**
 * Serialize a mutation: read current state, apply `fn`, persist, update cache.
 * Returns the new state. All writes go through here so they can't interleave.
 */
async function mutate(
  fn: (state: TournamentState) => TournamentState | void
): Promise<TournamentState> {
  const run = async (): Promise<TournamentState> => {
    const current = await load();
    const draft: TournamentState = JSON.parse(JSON.stringify(current));
    const result = fn(draft) || draft;
    cache = result;
    await persist(result);
    return result;
  };

  // Chain onto the previous write so they run strictly in order.
  const next = writeChain.then(run, run);
  writeChain = next.catch(() => undefined);
  return next;
}

// ── Public read API ─────────────────────────────────────────────────────────

/** Full state for server use (includes the passcode). */
export async function getState(): Promise<TournamentState> {
  return load();
}

/** State safe to send to the browser — passcode stripped out. */
export async function getPublicState(): Promise<TournamentState> {
  const state = await load();
  return {
    ...state,
    settings: {
      draw_points_enabled: state.settings.draw_points_enabled,
      tournament_stage: state.settings.tournament_stage,
    },
  };
}

export async function checkPasscode(passcode: string): Promise<boolean> {
  const state = await load();
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
      state.settings.draw_points_enabled
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
    if (partial.tournament_stage) {
      state.settings.tournament_stage = partial.tournament_stage;
    }
    if (typeof partial.passcode === 'string' && partial.passcode.trim()) {
      state.settings.passcode = partial.passcode.trim();
    }

    // Draw rule affects standings → re-resolve the bracket.
    state.matches = getResolvedKnockouts(
      state.teams,
      state.matches,
      state.settings.draw_points_enabled
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
  logoUrl: string
): Promise<TournamentState> {
  return mutate((state) => {
    state.teams = state.teams.map((t) =>
      t.id === id
        ? {
            ...t,
            name: name.trim() || t.name,
            logo_url: logoUrl.trim() || t.logo_url,
          }
        : t
    );
  });
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
      state.settings.draw_points_enabled
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
    state.matches = getResolvedKnockouts(state.teams, state.matches, state.settings.draw_points_enabled);
  });
}

export async function resetTournament(): Promise<TournamentState> {
  return mutate((state) => {
    const league = generateLeagueFixtures(state.teams);
    const knockouts = generateKnockoutPlaceholders();
    state.matches = [...league, ...knockouts];
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
        // Never let an import silently overwrite the admin passcode.
        passcode: state.settings.passcode,
        tournament_stage: incoming.settings.tournament_stage || 'LEAGUE',
      };
    }
  });
}

function clampScore(n: unknown): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v) || v < 0) return 0;
  if (v > 99) return 99;
  return v;
}
