'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTournament } from '@/context/TournamentContext';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import { pointsFromSettings } from '@/lib/store';
import { MatchStatus } from '@/lib/types';
import {
  Lock,
  Settings,
  Database,
  Edit3,
  Newspaper,
  RefreshCw,
  LogOut,
  Check,
  Save,
  Download,
  Upload,
  Users,
  Trash2,
  KeyRound,
  Calendar,
  GitMerge,
  Plus,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';

const INPUT =
  'w-full px-4 py-2.5 rounded-md bg-[#0f1015] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-accent/60 text-sm font-semibold transition-colors';
const LABEL = 'block text-[10px] font-black uppercase tracking-widest mb-1.5';
const labelStyle = { color: 'var(--faint)' } as const;

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Admin() {
  const {
    teams,
    matches,
    settings,
    news,
    isAdmin,
    login,
    logout,
    updateMatchScore,
    updateSettings,
    publishNews,
    deleteNews,
    updateTeam,
    resetTournamentData,
    resetEntireTournament,
    importData,
    importSchedule,
    generateBracket,
    setBracketTeams,
  } = useTournament();

  // Auth
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // Score editor
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('UPCOMING');
  const [matchDate, setMatchDate] = useState('');
  const [scoreMessage, setScoreMessage] = useState('');
  const [matchGroupFilter, setMatchGroupFilter] = useState<'ALL' | 'A' | 'B' | 'C' | 'D' | 'KO'>('ALL');
  const [matchStatusFilter, setMatchStatusFilter] = useState<'ALL' | 'UPCOMING' | 'LIVE' | 'COMPLETED'>('ALL');
  const [matchDateFilter, setMatchDateFilter] = useState<string>('ALL');

  // Team filter
  const [teamGroupFilter, setTeamGroupFilter] = useState<'ALL' | 'A' | 'B' | 'C' | 'D'>('ALL');

  // News
  const [newsTitle, setNewsTitle] = useState('');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImage, setNewsImage] = useState('');
  const [newsMessage, setNewsMessage] = useState('');

  // Team editor
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamPlayers, setTeamPlayers] = useState<string[]>([]);
  const [teamMessage, setTeamMessage] = useState('');

  // Scoring rules
  const [winPts, setWinPts] = useState<number>(2);
  const [drawPts, setDrawPts] = useState<number>(0);
  const [scoringMsg, setScoringMsg] = useState('');

  // Passcode
  const [newPasscode, setNewPasscode] = useState('');
  const [passMessage, setPassMessage] = useState('');

  // Keep the scoring inputs in sync with the saved settings.
  useEffect(() => {
    setWinPts(settings.points_per_win ?? 2);
    setDrawPts(settings.points_per_draw ?? (settings.draw_points_enabled ? 1 : 0));
  }, [settings.points_per_win, settings.points_per_draw, settings.draw_points_enabled]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState('');

  // Schedule import
  const scheduleInputRef = useRef<HTMLInputElement>(null);
  const [scheduleMsg, setScheduleMsg] = useState('');
  const [scheduleBusy, setScheduleBusy] = useState(false);

  // Bracket editor
  const [bracketSel, setBracketSel] = useState<Record<string, { a?: string; b?: string }>>({});
  const [bracketMsg, setBracketMsg] = useState('');

  const getTeamName = (id: string) => {
    if (id.startsWith('t-')) {
      if (id.includes('qf')) return 'Quarterfinalist';
      if (id.includes('sf')) return 'Semifinalist';
      if (id.includes('final')) return 'Finalist';
      return 'TBD';
    }
    return teams.find((t) => t.id === id)?.name || 'TBD';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    const ok = await login(passcode);
    setAuthBusy(false);
    if (ok) setPasscode('');
    else setAuthError('Invalid passcode. Access Denied.');
  };

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    const match = matches.find((m) => m.id === matchId);
    if (match) {
      setScoreA(match.team_a_score);
      setScoreB(match.team_b_score);
      setMatchStatus(match.status);
      setMatchDate(toLocalInput(match.match_date));
    }
  };

  const persistMatch = async (a: number, b: number, status: MatchStatus, msg: string) => {
    if (!selectedMatchId) return;
    const iso = matchDate ? new Date(matchDate).toISOString() : undefined;
    const result = await updateMatchScore(selectedMatchId, a, b, status === 'COMPLETED', status, iso);
    setScoreMessage(result.ok ? msg : result.error || 'Failed to save.');
    setTimeout(() => setScoreMessage(''), 3000);
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistMatch(scoreA, scoreB, matchStatus, 'Match updated successfully!');
  };

  // Bump a team's score with +/- buttons.
  const bump = (side: 'A' | 'B', delta: number) => {
    if (side === 'A') setScoreA((s) => Math.max(0, Math.min(99, s + delta)));
    else setScoreB((s) => Math.max(0, Math.min(99, s + delta)));
  };

  // One-click result. A clean win is recorded 2–0 (the winner takes the points);
  // a draw is 1–1. Marks the match completed and saves immediately.
  const quickResult = async (winner: 'A' | 'B' | 'DRAW') => {
    if (!selectedMatchId) return;
    const a = winner === 'A' ? 2 : winner === 'DRAW' ? 1 : 0;
    const b = winner === 'B' ? 2 : winner === 'DRAW' ? 1 : 0;
    setScoreA(a);
    setScoreB(b);
    setMatchStatus('COMPLETED');
    await persistMatch(a, b, 'COMPLETED', 'Result saved!');
  };

  const handleSelectTeam = (id: string) => {
    setSelectedTeamId(id);
    const team = teams.find((t) => t.id === id);
    if (team) {
      setTeamName(team.name);
      setTeamLogo(team.logo_url || '');
      setTeamPlayers(team.players && team.players.length ? [...team.players] : ['', '', '', '']);
    }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;
    const cleaned = teamPlayers.map((p) => p.trim()).filter(Boolean);
    const result = await updateTeam(selectedTeamId, teamName, teamLogo, cleaned);
    setTeamMessage(result.ok ? 'Team updated successfully!' : result.error || 'Failed.');
    setTimeout(() => setTeamMessage(''), 3000);
  };

  const handleSaveScoring = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateSettings({ points_per_win: winPts, points_per_draw: drawPts });
    setScoringMsg(result.ok ? 'Scoring rules updated.' : result.error || 'Failed.');
    setTimeout(() => setScoringMsg(''), 3000);
  };

  const handlePublishNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsSummary || !newsContent) {
      setNewsMessage('Please fill out all required fields.');
      return;
    }
    const result = await publishNews(newsTitle, newsSummary, newsContent, newsImage);
    if (result.ok) {
      setNewsTitle(''); setNewsSummary(''); setNewsContent(''); setNewsImage('');
      setNewsMessage('Announcement published successfully!');
    } else {
      setNewsMessage(result.error || 'Failed to publish.');
    }
    setTimeout(() => setNewsMessage(''), 3000);
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Delete this announcement permanently?')) return;
    await deleteNews(id);
  };

  const handleChangePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasscode.trim().length < 4) {
      setPassMessage('Passcode must be at least 4 characters.');
      setTimeout(() => setPassMessage(''), 3000);
      return;
    }
    const result = await updateSettings({ passcode: newPasscode.trim() });
    if (result.ok) { setNewPasscode(''); setPassMessage('Passcode updated. Applies to your next login.'); }
    else setPassMessage(result.error || 'Failed to update passcode.');
    setTimeout(() => setPassMessage(''), 4000);
  };

  const handleScheduleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScheduleBusy(true);
    setScheduleMsg('Reading file…');
    try {
      const { parseScheduleFile } = await import('@/lib/scheduleImport');
      const { rows, note } = await parseScheduleFile(file);
      if (rows.length === 0) {
        setScheduleMsg('No matches detected. Check the format — the CSV template works best.');
        return;
      }
      if (!confirm(`Found ${rows.length} matches. Replace the entire tournament with this schedule?`)) {
        return;
      }
      const result = await importSchedule(rows);
      setSelectedMatchId('');
      setSelectedTeamId('');
      setScheduleMsg(result.ok ? `Imported ${rows.length} matches successfully. ${note}` : result.error || 'Import failed.');
    } catch (err) {
      setScheduleMsg('Could not read file: ' + (err instanceof Error ? err.message : 'unknown error'));
    } finally {
      setScheduleBusy(false);
      if (scheduleInputRef.current) scheduleInputRef.current.value = '';
      setTimeout(() => setScheduleMsg(''), 9000);
    }
  };

  const downloadTemplate = async () => {
    const { CSV_TEMPLATE } = await import('@/lib/scheduleImport');
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pocket-masters-schedule-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFullReset = async () => {
    if (!confirm('DELETE the entire tournament and start over? This wipes ALL teams, fixtures, results and announcements back to the default seed. This cannot be undone.')) return;
    const result = await resetEntireTournament();
    setSelectedMatchId('');
    setSelectedTeamId('');
    alert(result.ok ? 'Tournament fully reset to defaults.' : result.error || 'Failed to reset.');
  };

  const handleReset = async () => {
    if (confirm('Reset all match scores and the bracket (teams are kept)? This cannot be undone.')) {
      await resetTournamentData();
      setSelectedMatchId('');
      alert('Match results have been reset.');
    }
  };

  const handleExportJSON = () => {
    const data = { teams, matches, settings, news };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `Pocket_Masters_Backup_${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!confirm('Replace current tournament data with this backup file?')) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const result = await importData(data);
      setImportMessage(result.ok ? 'Backup imported successfully!' : result.error || 'Import failed.');
    } catch {
      setImportMessage('Could not read that file — is it a valid backup JSON?');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setImportMessage(''), 4000);
    }
  };

  const handleGenerateBracket = async () => {
    if (!confirm('Generate the knockout bracket from current standings? This locks the top 2 of each group into the Quarterfinals.')) return;
    const result = await generateBracket();
    setBracketMsg(result.ok ? 'Bracket generated from standings.' : result.error || 'Failed.');
    setTimeout(() => setBracketMsg(''), 4000);
  };

  const koValue = (m: { id: string; team_a_id: string; team_b_id: string }, side: 'a' | 'b') => {
    const sel = bracketSel[m.id]?.[side];
    if (sel !== undefined) return sel;
    const id = side === 'a' ? m.team_a_id : m.team_b_id;
    return id.startsWith('t-') ? 'AUTO' : id;
  };

  const handleApplyBracket = async (matchId: string) => {
    const a = koValue(matches.find((m) => m.id === matchId)!, 'a');
    const b = koValue(matches.find((m) => m.id === matchId)!, 'b');
    const result = await setBracketTeams(matchId, a === 'AUTO' ? '' : a, b === 'AUTO' ? '' : b);
    setBracketSel((prev) => { const n = { ...prev }; delete n[matchId]; return n; });
    setBracketMsg(result.ok ? 'Matchup updated.' : result.error || 'Failed.');
    setTimeout(() => setBracketMsg(''), 3000);
  };

  const handleAutoBracket = async (matchId: string) => {
    await setBracketTeams(matchId, '', '');
    setBracketSel((prev) => { const n = { ...prev }; delete n[matchId]; return n; });
  };

  const koMatches = matches.filter((m) => m.stage !== 'LEAGUE');

  // ── Auth gate ────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md surface rounded-2xl p-8 shadow-2xl"
          >
            <div className="text-center mb-6 flex flex-col items-center">
              <div className="p-4 bg-accent/10 border border-accent/20 rounded-full mb-3">
                <Lock className="h-8 w-8 text-accent" />
              </div>
              <h2 className="font-display font-black text-2xl text-white uppercase tracking-wider">Admin Control Room</h2>
              <p className="text-gray-400 text-xs mt-1 font-semibold">Enter passcode to manage the tournament</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={LABEL} style={labelStyle}>Passcode</label>
                <input
                  type="password"
                  placeholder="Enter passcode…"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className={`${INPUT} text-center`}
                />
              </div>
              {authError && <p className="text-danger text-xs font-bold text-center">{authError}</p>}
              <button type="submit" disabled={authBusy} className="w-full py-3 rounded-md btn-gold font-display text-sm uppercase tracking-wider disabled:opacity-60">
                {authBusy ? 'Checking…' : 'Access Control Room'}
              </button>
            </form>
          </motion.div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  // Local day-key (YYYY-MM-DD) for grouping fixtures by date.
  const dayKey = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const matchDates = Array.from(new Set(matches.map((m) => dayKey(m.match_date)).filter(Boolean))).sort();
  const fmtDay = (key: string) =>
    new Date(key + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  // Filtered fixture list for the Match Editor dropdown.
  const filteredMatches = matches.filter((m) => {
    const groupOk =
      matchGroupFilter === 'ALL'
        ? true
        : matchGroupFilter === 'KO'
        ? m.stage !== 'LEAGUE'
        : m.stage === 'LEAGUE' && m.group_name === matchGroupFilter;
    const statusOk = matchStatusFilter === 'ALL' || m.status === matchStatusFilter;
    const dateOk = matchDateFilter === 'ALL' || dayKey(m.match_date) === matchDateFilter;
    return groupOk && statusOk && dateOk;
  });

  // Filtered team list for the Team Profiles dropdown.
  const filteredTeams = teams.filter((t) => teamGroupFilter === 'ALL' || t.group_name === teamGroupFilter);

  // Winner/loser highlight state for the quick-result buttons.
  const isCompleted = matchStatus === 'COMPLETED';
  const aWins = isCompleted && scoreA > scoreB;
  const bWins = isCompleted && scoreB > scoreA;
  const isDrawn = isCompleted && scoreA === scoreB;
  const winBtnClass = (winState: boolean, loseState: boolean) =>
    winState
      ? 'bg-success/25 text-success border-success/50'
      : loseState
      ? 'bg-danger/20 text-danger border-danger/50'
      : 'bg-[#1b1d24] text-gray-300 border-white/10 hover:bg-[#23252e]';

  // ── Dashboard ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/8 pb-6 mb-8">
          <div>
            <h1 className="font-display font-black text-3xl sm:text-5xl text-white uppercase tracking-tight flex items-center gap-3">
              <Settings className="h-8 w-8 text-accent animate-spin-slow" />
              Admin Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-medium">
              Live scoring, schedule, rules, team profiles, announcements and backups — every change is instantly visible to all visitors.
            </p>
          </div>
          <button
            onClick={logout}
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1b1d24] hover:bg-[#23252e] text-white font-display font-black text-xs uppercase tracking-wider rounded-md border border-white/10 hover:border-danger/50 transition-all"
          >
            <LogOut className="h-4 w-4 text-danger" /> Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columns 1 & 2 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match editor */}
            <section className="surface rounded-2xl p-6">
              <h3 className="font-display font-black text-sm tracking-wider uppercase text-white border-b border-white/8 pb-3.5 mb-5 flex items-center gap-2">
                <Edit3 className="h-4.5 w-4.5 text-accent" /> Match Editor
              </h3>
              <form onSubmit={handleSaveScore} className="space-y-5">
                {/* Filters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className={LABEL} style={labelStyle}>Filter · Group</label>
                    <select value={matchGroupFilter} onChange={(e) => setMatchGroupFilter(e.target.value as typeof matchGroupFilter)} className={INPUT}>
                      <option value="ALL">All Groups</option>
                      <option value="A">Group A</option>
                      <option value="B">Group B</option>
                      <option value="C">Group C</option>
                      <option value="D">Group D</option>
                      <option value="KO">Knockouts</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL} style={labelStyle}>Filter · Date</label>
                    <select value={matchDateFilter} onChange={(e) => setMatchDateFilter(e.target.value)} className={INPUT}>
                      <option value="ALL">All Dates</option>
                      {matchDates.map((d) => (
                        <option key={d} value={d}>{fmtDay(d)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className={LABEL} style={labelStyle}>Filter · Status</label>
                    <select value={matchStatusFilter} onChange={(e) => setMatchStatusFilter(e.target.value as typeof matchStatusFilter)} className={INPUT}>
                      <option value="ALL">All Statuses</option>
                      <option value="UPCOMING">Upcoming</option>
                      <option value="LIVE">Live</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={LABEL} style={labelStyle}>Select Fixture ({filteredMatches.length})</label>
                  <select value={selectedMatchId} onChange={(e) => handleSelectMatch(e.target.value)} className={INPUT}>
                    <option value="">-- Select a Match --</option>
                    {filteredMatches.map((m) => {
                      const stageLabel = m.stage === 'LEAGUE' ? `Group ${m.group_name}` : m.stage;
                      return (
                        <option key={m.id} value={m.id}>
                          [{stageLabel}] {getTeamName(m.team_a_id)} vs {getTeamName(m.team_b_id)} ({m.status})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedMatch && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-5 border-t border-white/8 pt-5">
                    {/* Winner picker — click a team to mark the winner (green); the other turns red */}
                    <div>
                      <label className={LABEL} style={labelStyle}>Pick the winner · saves instantly</label>
                      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch">
                        <button
                          type="button"
                          onClick={() => quickResult('A')}
                          className={`py-3 px-2 rounded-md border text-xs font-black uppercase tracking-wide transition-all truncate ${winBtnClass(aWins, bWins)}`}
                        >
                          {getTeamName(selectedMatch.team_a_id)}
                        </button>
                        <button
                          type="button"
                          onClick={() => quickResult('DRAW')}
                          className={`py-3 px-3 rounded-md border text-[11px] font-black uppercase tracking-wide transition-all ${
                            isDrawn ? 'bg-accent/20 text-accent border-accent/50' : 'bg-[#1b1d24] text-gray-400 border-white/10 hover:bg-[#23252e]'
                          }`}
                        >
                          Draw
                        </button>
                        <button
                          type="button"
                          onClick={() => quickResult('B')}
                          className={`py-3 px-2 rounded-md border text-xs font-black uppercase tracking-wide transition-all truncate ${winBtnClass(bWins, aWins)}`}
                        >
                          {getTeamName(selectedMatch.team_b_id)}
                        </button>
                      </div>
                      <p className="text-[10px] mt-1.5" style={labelStyle}>A win awards {pointsFromSettings(settings).win} points.</p>
                    </div>

                    {/* Optional exact board scores (affects Board Difference) */}
                    <details className="group">
                      <summary className="cursor-pointer text-[10px] font-black uppercase tracking-widest list-none flex items-center gap-1.5" style={labelStyle}>
                        <Plus className="h-3 w-3 group-open:rotate-45 transition-transform" /> Set exact board scores (optional)
                      </summary>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        {(['A', 'B'] as const).map((side) => {
                          const id = side === 'A' ? selectedMatch.team_a_id : selectedMatch.team_b_id;
                          const val = side === 'A' ? scoreA : scoreB;
                          return (
                            <div key={side} className="bg-[#0f1015] border border-white/8 rounded-xl p-3 text-center">
                              <div className="text-[10px] font-bold uppercase truncate mb-2" style={labelStyle}>{getTeamName(id)}</div>
                              <div className="flex items-center justify-center gap-3">
                                <button type="button" aria-label="decrease" onClick={() => bump(side, -1)} className="h-9 w-9 rounded-md bg-[#1b1d24] border border-white/10 text-white text-xl font-black leading-none hover:bg-[#23252e]">−</button>
                                <span className="font-mono font-black text-2xl text-white w-10">{val}</span>
                                <button type="button" aria-label="increase" onClick={() => bump(side, 1)} className="h-9 w-9 rounded-md bg-[#1b1d24] border border-white/10 text-white text-xl font-black leading-none hover:bg-[#23252e]">+</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>

                    {/* Status buttons */}
                    <div>
                      <label className={LABEL} style={labelStyle}>Status</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['UPCOMING', 'LIVE', 'COMPLETED'] as MatchStatus[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setMatchStatus(st)}
                            className={`py-2 rounded-md text-xs font-black uppercase tracking-wide border transition-all ${
                              matchStatus === st ? 'bg-accent text-[#15110a] border-accent' : 'bg-[#1b1d24] text-gray-400 border-white/10 hover:text-white'
                            }`}
                          >
                            {st === 'UPCOMING' ? 'Upcoming' : st === 'LIVE' ? 'Live' : 'Completed'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <label className={`${LABEL} flex items-center gap-1.5`} style={labelStyle}>
                        <Calendar className="h-3 w-3" /> Date &amp; Time
                      </label>
                      <input type="datetime-local" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className={INPUT} />
                    </div>

                    {scoreMessage && (
                      <p className="text-success text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <Check className="h-4 w-4" /> {scoreMessage}
                      </p>
                    )}
                    <button type="submit" className="w-full py-3 btn-gold rounded-md font-display text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                      <Save className="h-4 w-4" /> Save Match Details
                    </button>
                  </motion.div>
                )}
              </form>
            </section>

            {/* Bracket generator & editor */}
            <section className="surface rounded-2xl p-6">
              <h3 className="font-display font-black text-sm tracking-wider uppercase text-white border-b border-white/8 pb-3.5 mb-5 flex items-center gap-2">
                <GitMerge className="h-4.5 w-4.5 text-accent" /> Bracket Generator &amp; Editor
              </h3>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 bg-[#0f1015] border border-white/8 rounded-xl p-4">
                <div className="flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={labelStyle}>Generate Bracket</span>
                  <p className="text-gray-400 text-xs font-semibold leading-relaxed">Lock the current top 2 of each group into the Quarterfinals. Semis &amp; Final follow winners automatically.</p>
                </div>
                <button onClick={handleGenerateBracket} className="shrink-0 py-2.5 px-5 btn-gold rounded-md font-display text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                  <GitMerge className="h-4 w-4" /> Generate
                </button>
              </div>

              <span className="text-[10px] font-black uppercase tracking-widest block mb-3" style={labelStyle}>Edit Matchups (manual override)</span>
              <div className="space-y-2.5">
                {koMatches.map((m) => {
                  const label = m.id.replace('match-', '').toUpperCase();
                  const dirty = !!bracketSel[m.id];
                  return (
                    <div key={m.id} className="flex flex-wrap items-center gap-2 bg-[#0f1015] border border-white/8 rounded-lg p-2.5">
                      <span className="w-12 text-[11px] font-black uppercase text-accent shrink-0">{label}</span>
                      <select
                        value={koValue(m, 'a')}
                        onChange={(e) => setBracketSel((p) => ({ ...p, [m.id]: { ...p[m.id], a: e.target.value } }))}
                        className="flex-1 min-w-[120px] px-2 py-1.5 rounded bg-[#15161c] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-accent/60"
                      >
                        <option value="AUTO">— Auto —</option>
                        {teams.map((t) => <option key={t.id} value={t.id}>{t.code} · {t.name}</option>)}
                      </select>
                      <span className="text-[10px]" style={labelStyle}>vs</span>
                      <select
                        value={koValue(m, 'b')}
                        onChange={(e) => setBracketSel((p) => ({ ...p, [m.id]: { ...p[m.id], b: e.target.value } }))}
                        className="flex-1 min-w-[120px] px-2 py-1.5 rounded bg-[#15161c] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-accent/60"
                      >
                        <option value="AUTO">— Auto —</option>
                        {teams.map((t) => <option key={t.id} value={t.id}>{t.code} · {t.name}</option>)}
                      </select>
                      <button
                        onClick={() => handleApplyBracket(m.id)}
                        disabled={!dirty}
                        className="shrink-0 px-3 py-1.5 rounded bg-accent text-[#15110a] text-[10px] font-black uppercase tracking-wider disabled:opacity-40 transition-opacity"
                      >
                        Set
                      </button>
                      {m.locked && (
                        <button onClick={() => handleAutoBracket(m.id)} className="shrink-0 px-3 py-1.5 rounded bg-[#1b1d24] border border-white/10 text-gray-300 text-[10px] font-black uppercase tracking-wider hover:bg-[#23252e]">
                          Auto
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {bracketMsg && <p className="text-[11px] font-bold text-center text-accent mt-3">{bracketMsg}</p>}
            </section>

            {/* Import schedule */}
            <section className="surface rounded-2xl p-6">
              <h3 className="font-display font-black text-sm tracking-wider uppercase text-white border-b border-white/8 pb-3.5 mb-5 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-accent" /> Import Schedule
              </h3>
              <p className="text-gray-400 text-xs font-semibold leading-relaxed mb-4">
                Upload your schedule as <span className="text-white">Excel (.xlsx)</span>, <span className="text-white">CSV</span>,{' '}
                <span className="text-white">Word (.docx)</span> or <span className="text-white">PDF</span> and the system builds the whole
                tournament — teams, groups and fixtures — automatically. Spreadsheets give the most reliable results; use columns:
                <span className="text-white"> Group, Team A, Team B, Date, Time, Score A, Score B</span>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => scheduleInputRef.current?.click()}
                  disabled={scheduleBusy}
                  className="flex-1 py-2.5 px-4 btn-gold rounded-md font-display text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" /> {scheduleBusy ? 'Reading…' : 'Upload Schedule'}
                </button>
                <button
                  onClick={downloadTemplate}
                  className="flex-1 py-2.5 px-4 rounded-md bg-[#1b1d24] border border-white/10 hover:bg-[#23252e] text-white font-display font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" /> Download CSV Template
                </button>
                <input
                  ref={scheduleInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.docx,.pdf"
                  onChange={handleScheduleFile}
                  className="hidden"
                />
              </div>
              {scheduleMsg && (
                <p className={`text-xs font-bold text-center mt-3 ${scheduleMsg.includes('success') || scheduleMsg.includes('Imported') ? 'text-success' : 'text-accent'}`}>
                  {scheduleMsg}
                </p>
              )}
            </section>

            {/* Team editor */}
            <section className="surface rounded-2xl p-6">
              <h3 className="font-display font-black text-sm tracking-wider uppercase text-white border-b border-white/8 pb-3.5 mb-5 flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-accent" /> Team Profiles
              </h3>
              <form onSubmit={handleSaveTeam} className="space-y-5">
                <div className="grid grid-cols-[auto_1fr] gap-2 items-end">
                  <div>
                    <label className={LABEL} style={labelStyle}>Group</label>
                    <select value={teamGroupFilter} onChange={(e) => setTeamGroupFilter(e.target.value as typeof teamGroupFilter)} className={INPUT}>
                      <option value="ALL">All</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL} style={labelStyle}>Select Team ({filteredTeams.length})</label>
                    <select value={selectedTeamId} onChange={(e) => handleSelectTeam(e.target.value)} className={INPUT}>
                      <option value="">-- Select a Team --</option>
                      {filteredTeams.map((t) => (
                        <option key={t.id} value={t.id}>[{t.code}] {t.name} (Group {t.group_name})</option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedTeamId && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 border-t border-white/8 pt-5">
                    <div className="flex items-center gap-4">
                      {teamLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={teamLogo} alt="" className="h-14 w-14 rounded-full border border-white/10 bg-[#0f1015]" />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-[#23252e]" />
                      )}
                      <div className="flex-1">
                        <label className="block text-[9px] font-bold uppercase mb-1.5" style={labelStyle}>Team Name</label>
                        <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} className={INPUT} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase mb-1.5" style={labelStyle}>Logo URL</label>
                      <input type="url" value={teamLogo} onChange={(e) => setTeamLogo(e.target.value)} placeholder="https://…" className={INPUT} />
                    </div>

                    {/* Roster editor */}
                    <div>
                      <label className="block text-[9px] font-bold uppercase mb-1.5" style={labelStyle}>Roster / Players</label>
                      <div className="space-y-2">
                        {teamPlayers.map((p, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="flex items-center justify-center h-7 w-7 rounded-md bg-[#1b1d24] text-accent text-[10px] font-black shrink-0">{i + 1}</span>
                            <input
                              type="text"
                              value={p}
                              onChange={(e) => setTeamPlayers((arr) => arr.map((x, idx) => (idx === i ? e.target.value : x)))}
                              placeholder={`Player ${i + 1} name`}
                              className={`${INPUT} bg-[#15161c]`}
                            />
                            <button
                              type="button"
                              aria-label="Remove player"
                              onClick={() => setTeamPlayers((arr) => arr.filter((_, idx) => idx !== i))}
                              className="shrink-0 p-2 rounded-md bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setTeamPlayers((arr) => [...arr, ''])}
                        className="mt-2 inline-flex items-center gap-1.5 text-accent hover:text-[var(--gold-bright)] text-xs font-black uppercase tracking-wider"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Player
                      </button>
                    </div>

                    {teamMessage && (
                      <p className="text-success text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <Check className="h-4 w-4" /> {teamMessage}
                      </p>
                    )}
                    <button type="submit" className="w-full py-2.5 btn-gold rounded-md font-display text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                      <Save className="h-4 w-4" /> Save Team
                    </button>
                  </motion.div>
                )}
              </form>
            </section>

            {/* Settings & database */}
            <section className="surface rounded-2xl p-6">
              <h3 className="font-display font-black text-sm tracking-wider uppercase text-white border-b border-white/8 pb-3.5 mb-5 flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-accent" /> Tournament Settings &amp; Data
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Scoring rules */}
                <div className="bg-[#0f1015] border border-white/8 p-4 rounded-xl flex flex-col gap-2.5">
                  <span className="text-[10px] font-black uppercase tracking-widest block" style={labelStyle}>Scoring (points)</span>
                  <form onSubmit={handleSaveScoring} className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold uppercase mb-1" style={labelStyle}>Per Win</label>
                        <input type="number" min="0" max="20" value={winPts} onChange={(e) => setWinPts(parseInt(e.target.value) || 0)} className={`${INPUT} bg-[#15161c] text-center`} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase mb-1" style={labelStyle}>Per Draw</label>
                        <input type="number" min="0" max="20" value={drawPts} onChange={(e) => setDrawPts(parseInt(e.target.value) || 0)} className={`${INPUT} bg-[#15161c] text-center`} />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2 rounded-md bg-[#1b1d24] border border-white/10 hover:bg-[#23252e] text-white font-display font-black text-xs uppercase tracking-wider transition-all">
                      Update Scoring
                    </button>
                  </form>
                  {scoringMsg && <p className="text-[10px] font-bold text-center text-accent">{scoringMsg}</p>}
                </div>
                {/* Passcode */}
                <div className="bg-[#0f1015] border border-white/8 p-4 rounded-xl flex flex-col gap-2.5">
                  <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={labelStyle}>
                    <KeyRound className="h-3.5 w-3.5" /> Change Passcode
                  </span>
                  <form onSubmit={handleChangePasscode} className="flex flex-col gap-2">
                    <input type="text" value={newPasscode} onChange={(e) => setNewPasscode(e.target.value)} placeholder="New passcode…" className={`${INPUT} bg-[#15161c]`} />
                    <button type="submit" className="w-full py-2 rounded-md bg-[#1b1d24] border border-white/10 hover:bg-[#23252e] text-white font-display font-black text-xs uppercase tracking-wider transition-all">
                      Update Passcode
                    </button>
                  </form>
                  {passMessage && <p className="text-[10px] font-bold text-center text-accent">{passMessage}</p>}
                </div>
                {/* Backup / import / reset */}
                <div className="bg-[#0f1015] border border-white/8 p-4 rounded-xl flex flex-col gap-3 sm:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={labelStyle}>Backup &amp; Restore</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={handleExportJSON} className="w-full py-2.5 rounded-md bg-[#1b1d24] border border-white/10 hover:bg-[#23252e] text-white font-display font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                      <Download className="h-3.5 w-3.5" /> Export Backup
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-2.5 rounded-md bg-[#1b1d24] border border-white/10 hover:bg-[#23252e] text-white font-display font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                      <Upload className="h-3.5 w-3.5" /> Import Backup
                    </button>
                    <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
                  </div>
                  {importMessage && <p className="text-[10px] font-bold text-center text-accent">{importMessage}</p>}

                  <span className="text-[10px] font-black uppercase tracking-widest mt-2" style={labelStyle}>Danger Zone</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={handleReset} className="w-full py-2.5 rounded-md bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 font-display font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5" /> Reset Scores
                    </button>
                    <button onClick={handleFullReset} className="w-full py-2.5 rounded-md bg-danger/20 hover:bg-danger/30 text-danger border border-danger/50 font-display font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5" /> Reset Entire Tournament
                    </button>
                  </div>
                  <p className="text-[10px] leading-relaxed" style={labelStyle}>
                    <span className="text-danger font-bold">Reset Scores</span> clears match results but keeps teams.{' '}
                    <span className="text-danger font-bold">Reset Entire Tournament</span> wipes everything back to the default seed.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Column 3: News */}
          <div className="space-y-6">
            <section className="surface rounded-2xl p-6">
              <h3 className="font-display font-black text-sm tracking-wider uppercase text-white border-b border-white/8 pb-3.5 mb-5 flex items-center gap-2">
                <Newspaper className="h-4.5 w-4.5 text-accent" /> Announcements
              </h3>
              <form onSubmit={handlePublishNews} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>Title *</label>
                  <input type="text" required placeholder="Headline…" value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>Summary *</label>
                  <input type="text" required placeholder="Short description…" value={newsSummary} onChange={(e) => setNewsSummary(e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>Content *</label>
                  <textarea required rows={4} placeholder="Article content…" value={newsContent} onChange={(e) => setNewsContent(e.target.value)} className={`${INPUT} resize-none`} />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>Image URL (optional)</label>
                  <input type="url" placeholder="https://…" value={newsImage} onChange={(e) => setNewsImage(e.target.value)} className={INPUT} />
                </div>
                {newsMessage && (
                  <p className={`text-xs font-bold text-center ${newsMessage.includes('success') ? 'text-success' : 'text-danger'}`}>{newsMessage}</p>
                )}
                <button type="submit" className="w-full py-2.5 btn-gold rounded-md font-display text-xs uppercase tracking-wider">Publish Announcement</button>
              </form>

              {news.length > 0 && (
                <div className="mt-6 border-t border-white/8 pt-4">
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-3" style={labelStyle}>Published ({news.length})</span>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-none">
                    {news.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 bg-[#0f1015] border border-white/8 rounded-lg p-2.5">
                        <span className="text-xs text-white font-semibold truncate">{item.title}</span>
                        <button onClick={() => handleDeleteNews(item.id)} aria-label="Delete" className="flex-shrink-0 p-1.5 rounded-md bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
