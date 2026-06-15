'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Team,
  Match,
  NewsItem,
  TournamentSettings,
  TournamentStats,
  MatchStatus,
} from '../lib/types';
import { calculateStats } from '../lib/store';

interface MutationResult {
  ok: boolean;
  error?: string;
}

interface TournamentState {
  teams: Team[];
  matches: Match[];
  settings: TournamentSettings;
  news: NewsItem[];
}

interface TournamentContextType {
  teams: Team[];
  matches: Match[];
  settings: TournamentSettings;
  news: NewsItem[];
  stats: TournamentStats;
  isLoading: boolean;
  isAdmin: boolean;
  login: (passcode: string) => Promise<boolean>;
  logout: () => void;
  updateMatchScore: (
    matchId: string,
    scoreA: number,
    scoreB: number,
    isCompleted: boolean,
    status: MatchStatus,
    matchDate?: string
  ) => Promise<MutationResult>;
  updateSettings: (
    newSettings: Partial<TournamentSettings>
  ) => Promise<MutationResult>;
  publishNews: (
    title: string,
    summary: string,
    content: string,
    imageUrl?: string
  ) => Promise<MutationResult>;
  deleteNews: (id: string) => Promise<MutationResult>;
  updateTeam: (
    id: string,
    name: string,
    logoUrl: string
  ) => Promise<MutationResult>;
  resetTournamentData: () => Promise<MutationResult>;
  importData: (data: Partial<TournamentState>) => Promise<MutationResult>;
  generateBracket: () => Promise<MutationResult>;
  setBracketTeams: (matchId: string, teamAId: string, teamBId: string) => Promise<MutationResult>;
  refreshData: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(
  undefined
);

const PASS_KEY = 'pocket_masters_admin_pass';
const POLL_INTERVAL = 5000;

const EMPTY_SETTINGS: TournamentSettings = {
  draw_points_enabled: false,
  tournament_stage: 'LEAGUE',
};

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [settings, setSettings] = useState<TournamentSettings>(EMPTY_SETTINGS);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Passcode used to authenticate admin writes (kept out of React state so it
  // never lands in a serialized payload).
  const passcodeRef = useRef<string>('');
  // Snapshot of the last fetched state so polling only re-renders on change.
  const lastSnapshotRef = useRef<string>('');

  const applyState = useCallback((state: TournamentState) => {
    const snapshot = JSON.stringify(state);
    if (snapshot === lastSnapshotRef.current) return;
    lastSnapshotRef.current = snapshot;
    setTeams(state.teams || []);
    setMatches(state.matches || []);
    setNews(state.news || []);
    setSettings(state.settings || EMPTY_SETTINGS);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      if (!res.ok) return;
      const state = (await res.json()) as TournamentState;
      applyState(state);
    } catch {
      // Network blip — keep showing the last known good state.
    }
  }, [applyState]);

  // Initial load + restore admin session.
  useEffect(() => {
    // The site uses a single, dark visual theme.
    document.documentElement.className = 'dark';

    const savedPass = sessionStorage.getItem(PASS_KEY);
    if (savedPass) {
      passcodeRef.current = savedPass;
      setIsAdmin(true);
    }

    refreshData().finally(() => setIsLoading(false));
  }, [refreshData]);

  // Live polling so every visitor sees score updates without a manual refresh.
  useEffect(() => {
    const id = setInterval(refreshData, POLL_INTERVAL);
    const onFocus = () => refreshData();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshData]);

  // ── Admin auth ─────────────────────────────────────────────────────────────

  const login = useCallback(async (passcode: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', payload: { passcode } }),
      });
      if (!res.ok) return false;
      passcodeRef.current = passcode;
      sessionStorage.setItem(PASS_KEY, passcode);
      setIsAdmin(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    passcodeRef.current = '';
    sessionStorage.removeItem(PASS_KEY);
    setIsAdmin(false);
  }, []);

  // Shared helper for every authenticated mutation.
  const adminPost = useCallback(
    async (
      action: string,
      payload: Record<string, unknown> = {}
    ): Promise<MutationResult> => {
      try {
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-passcode': passcodeRef.current,
          },
          body: JSON.stringify({ action, payload }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          // Session no longer valid — drop admin state.
          logout();
          return { ok: false, error: data.error || 'Session expired.' };
        }
        if (!res.ok) {
          return { ok: false, error: data.error || 'Request failed.' };
        }
        applyState(data as TournamentState);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error.' };
      }
    },
    [applyState, logout]
  );

  // ── Mutations ──────────────────────────────────────────────────────────────

  const updateMatchScore = useCallback(
    (
      matchId: string,
      scoreA: number,
      scoreB: number,
      _isCompleted: boolean,
      status: MatchStatus,
      matchDate?: string
    ) => adminPost('score', { matchId, scoreA, scoreB, status, matchDate }),
    [adminPost]
  );

  const updateSettings = useCallback(
    (newSettings: Partial<TournamentSettings>) =>
      adminPost('settings', newSettings),
    [adminPost]
  );

  const publishNews = useCallback(
    (title: string, summary: string, content: string, imageUrl?: string) =>
      adminPost('news:create', { title, summary, content, imageUrl }),
    [adminPost]
  );

  const deleteNews = useCallback(
    (id: string) => adminPost('news:delete', { id }),
    [adminPost]
  );

  const updateTeam = useCallback(
    (id: string, name: string, logoUrl: string) =>
      adminPost('team', { id, name, logoUrl }),
    [adminPost]
  );

  const resetTournamentData = useCallback(
    () => adminPost('reset'),
    [adminPost]
  );

  const importData = useCallback(
    (data: Partial<TournamentState>) => adminPost('import', data),
    [adminPost]
  );

  const generateBracket = useCallback(() => adminPost('bracket:generate'), [adminPost]);

  const setBracketTeams = useCallback(
    (matchId: string, teamAId: string, teamBId: string) =>
      adminPost('bracket:set', { matchId, teamAId, teamBId }),
    [adminPost]
  );

  // Stats derive from the current state.
  const stats = calculateStats(teams, matches, settings.draw_points_enabled);

  return (
    <TournamentContext.Provider
      value={{
        teams,
        matches,
        settings,
        news,
        stats,
        isLoading,
        isAdmin,
        login,
        logout,
        updateMatchScore,
        updateSettings,
        publishNews,
        deleteNews,
        updateTeam,
        resetTournamentData,
        importData,
        generateBracket,
        setBracketTeams,
        refreshData,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
}
