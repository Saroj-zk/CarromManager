'use client';

import React from 'react';
import { Team, Match } from '@/lib/types';
import { X, Users, CalendarClock, History, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  team: Team | null;
  teams: Team[];
  matches: Match[];
  onClose: () => void;
}

export default function TeamDetailModal({ team, teams, matches, onClose }: Props) {
  const nameOf = (id: string) => {
    if (id.startsWith('t-')) return 'TBD';
    return teams.find((t) => t.id === id)?.name || 'TBD';
  };
  const logoOf = (id: string) => (id.startsWith('t-') ? undefined : teams.find((t) => t.id === id)?.logo_url);

  const teamMatches = team
    ? matches.filter((m) => m.team_a_id === team.id || m.team_b_id === team.id)
    : [];
  const upcoming = teamMatches
    .filter((m) => m.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
  const recent = teamMatches
    .filter((m) => m.is_completed)
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

  const stageLabel = (m: Match) => (m.stage === 'LEAGUE' ? `Group ${m.group_name}` : m.stage);

  return (
    <AnimatePresence>
      {team && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-none surface rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-white/8" style={{ background: 'linear-gradient(180deg,#1b1d24,#15161c)' }}>
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-4">
                {team.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={team.logo_url} alt="" className="h-14 w-14 rounded-full border border-white/10" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-[#23252e]" />
                )}
                <div>
                  <h2 className="font-display font-black text-2xl text-white tracking-tight">{team.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] uppercase font-black">
                      Group {team.group_name}
                    </span>
                    <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--faint)' }}>
                      Code {team.code}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Roster */}
              <section>
                <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--faint)' }}>
                  <Users className="h-3.5 w-3.5" /> Roster
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(team.players && team.players.length ? team.players : ['Player roster TBA']).map((p, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-[#0f1015] border border-white/8 rounded-lg px-3 py-2.5">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-accent/15 text-accent text-[10px] font-black shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold text-white truncate">{p}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Upcoming */}
              <section>
                <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--faint)' }}>
                  <CalendarClock className="h-3.5 w-3.5" /> Upcoming Matches
                </h3>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-gray-500">No upcoming matches.</p>
                ) : (
                  <div className="space-y-2">
                    {upcoming.slice(0, 6).map((m) => {
                      const oppId = m.team_a_id === team.id ? m.team_b_id : m.team_a_id;
                      const oppLogo = logoOf(oppId);
                      return (
                        <div key={m.id} className="flex items-center gap-3 bg-[#0f1015] border border-white/8 rounded-lg px-3 py-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wide w-24 shrink-0" style={{ color: 'var(--faint)' }}>
                            {stageLabel(m)}
                          </span>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs text-gray-400">vs</span>
                            {oppLogo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={oppLogo} alt="" className="h-5 w-5 rounded-full" />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-[#23252e]" />
                            )}
                            <span className="text-sm font-semibold text-white truncate">{nameOf(oppId)}</span>
                          </div>
                          <span className="text-[11px] font-mono shrink-0" style={{ color: 'var(--faint)' }}>
                            {new Date(m.match_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Recent */}
              {recent.length > 0 && (
                <section>
                  <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--faint)' }}>
                    <History className="h-3.5 w-3.5" /> Recent Results
                  </h3>
                  <div className="space-y-2">
                    {recent.slice(0, 6).map((m) => {
                      const isA = m.team_a_id === team.id;
                      const oppId = isA ? m.team_b_id : m.team_a_id;
                      const myScore = isA ? m.team_a_score : m.team_b_score;
                      const oppScore = isA ? m.team_b_score : m.team_a_score;
                      const won = m.winner_id === team.id;
                      const draw = !m.winner_id;
                      return (
                        <div key={m.id} className="flex items-center gap-3 bg-[#0f1015] border border-white/8 rounded-lg px-3 py-2.5">
                          <span className={`flex items-center justify-center h-6 w-6 rounded text-[10px] font-black shrink-0 ${
                            won ? 'bg-success/20 text-success' : draw ? 'bg-white/10 text-gray-400' : 'bg-danger/20 text-danger'
                          }`}>
                            {won ? 'W' : draw ? 'D' : 'L'}
                          </span>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {logoOf(oppId) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={logoOf(oppId)} alt="" className="h-5 w-5 rounded-full" />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-[#23252e]" />
                            )}
                            <span className="text-sm font-semibold text-white truncate">{nameOf(oppId)}</span>
                          </div>
                          <span className="font-display font-black text-sm shrink-0">
                            <span className={won ? 'text-accent' : 'text-gray-400'}>{myScore}</span>
                            <span style={{ color: 'var(--faint)' }}> – </span>
                            <span className="text-gray-400">{oppScore}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
