'use client';

import React from 'react';
import { useTournament } from '@/context/TournamentContext';
import Navbar from '@/components/Navbar';
import PageHero from '@/components/PageHero';
import SiteFooter from '@/components/SiteFooter';
import { BarChart3, Award, Percent, CheckCircle } from 'lucide-react';
import { calculateStandings, pointsFromSettings } from '@/lib/store';

export default function Stats() {
  const { teams, matches, settings, stats } = useTournament();

  const leagueMatches = matches.filter((m) => m.stage === 'LEAGUE');
  const standings = calculateStandings(teams, leagueMatches, pointsFromSettings(settings));
  const leaderboard = [...standings]
    .sort((a, b) => b.points - a.points || b.board_difference - a.board_difference)
    .slice(0, 10);

  const pctPlayed = stats.totalMatches ? Math.round((stats.matchesPlayed / stats.totalMatches) * 100) : 0;
  const probColor = (v: number) => (v >= 75 ? 'bg-success' : v >= 25 ? 'bg-accent' : 'bg-danger');

  const cards = [
    { label: 'Most Wins', value: stats.mostWinsTeam?.name, sub: stats.mostWinsTeam ? `${stats.mostWinsTeam.count} Wins` : '' },
    { label: 'Longest Win Streak', value: stats.longestWinStreak?.name, sub: stats.longestWinStreak ? `${stats.longestWinStreak.count} Games` : '' },
    {
      label: 'Highest Board Diff',
      value: stats.highestBoardDifference?.name,
      sub: stats.highestBoardDifference
        ? `${stats.highestBoardDifference.value > 0 ? '+' : ''}${stats.highestBoardDifference.value}`
        : '',
    },
    { label: 'Best Group', value: stats.bestGroup?.name, sub: stats.bestGroup ? `${stats.bestGroup.avgPoints} Pts/Team` : '' },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <PageHero
        title="Statistics"
        status="Live"
        date="Jun–Jul"
        region="Pocket Masters 2026"
        subtitle="Tournament leaderboards, win streaks, board-difference leaders and qualification projections."
      />

      <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        {/* Progress */}
        <div className="surface rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-center text-xs font-bold uppercase text-gray-400 mb-2.5">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-success" /> Tournament Progress</span>
            <span className="text-white">{stats.matchesPlayed} / {stats.totalMatches} ({pctPlayed}%)</span>
          </div>
          <div className="h-3 w-full bg-[#0a0a0e] border border-white/8 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-accent to-[var(--gold-bright)] rounded-full transition-all duration-500" style={{ width: `${pctPlayed}%` }} />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {cards.map((c) => (
            <div key={c.label} className="surface rounded-2xl p-5 min-h-[130px] flex flex-col justify-between">
              <span className="text-[10px] text-accent font-black uppercase tracking-widest">{c.label}</span>
              {c.value ? (
                <div>
                  <h3 className="text-base font-black text-white uppercase leading-tight">{c.value}</h3>
                  <p className="text-2xl font-black text-white mt-1">{c.sub}</p>
                </div>
              ) : (
                <span className="text-xs" style={{ color: 'var(--faint)' }}>TBD</span>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <section className="surface rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
              <Award className="h-4 w-4 text-accent" />
              <h3 className="font-display font-black text-sm tracking-wider uppercase text-white">Power Leaderboard</h3>
            </div>
            <div className="overflow-x-auto scrollbar-none">
              <table className="rank-table">
                <thead>
                  <tr>
                    <th className="w-10 text-center">#</th>
                    <th>Team</th>
                    <th className="text-center">P</th>
                    <th className="text-center">W</th>
                    <th className="text-center">BD</th>
                    <th className="text-center">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, i) => {
                    const team = teams.find((t) => t.id === row.team_id);
                    return (
                      <tr key={row.team_id}>
                        <td className="text-center font-display font-black" style={{ color: i < 3 ? 'var(--gold)' : 'var(--faint)' }}>{i + 1}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            {team?.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={team.logo_url} className="h-6 w-6 rounded-full" alt="" />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-[#23252e]" />
                            )}
                            <span className="font-semibold text-white truncate max-w-[150px]">{row.team_name}</span>
                            <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--faint)' }}>{team?.group_name}</span>
                          </div>
                        </td>
                        <td className="text-center font-mono text-gray-300">{row.played}</td>
                        <td className="text-center font-mono text-success">{row.won}</td>
                        <td className="text-center font-mono">
                          <span className={row.board_difference > 0 ? 'text-success' : row.board_difference < 0 ? 'text-danger' : 'text-gray-400'}>
                            {row.board_difference > 0 ? `+${row.board_difference}` : row.board_difference}
                          </span>
                        </td>
                        <td className="text-center font-mono font-black text-accent">{row.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Qualification probability */}
          <section className="surface rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
              <Percent className="h-4 w-4 text-accent" />
              <h3 className="font-display font-black text-sm tracking-wider uppercase text-white">Qualification Odds</h3>
            </div>
            <div className="p-4 space-y-3.5">
              {leaderboard.map((row) => {
                const team = teams.find((t) => t.id === row.team_id);
                if (!team) return null;
                const prob = stats.qualificationProbability[team.id] ?? 50;
                return (
                  <div key={team.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <div className="flex items-center gap-2 min-w-0">
                        {team.logo_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={team.logo_url} className="h-4.5 w-4.5 rounded-full" alt="" />
                        )}
                        <span className="text-white truncate max-w-[180px]">{team.name}</span>
                      </div>
                      <span className="text-accent">{prob}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#0a0a0e] border border-white/8 rounded-full overflow-hidden">
                      <div className={`h-full ${probColor(prob)}`} style={{ width: `${prob}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
