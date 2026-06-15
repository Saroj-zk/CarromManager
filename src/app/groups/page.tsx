'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTournament } from '@/context/TournamentContext';
import Navbar from '@/components/Navbar';
import PageHero from '@/components/PageHero';
import SectionTabs, { buildEventTabs } from '@/components/SectionTabs';
import SiteFooter from '@/components/SiteFooter';
import TeamDetailModal from '@/components/TeamDetailModal';
import { calculateStandings } from '@/lib/store';
import { GroupName, Team } from '@/lib/types';
import { Award, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Groups() {
  const { teams, matches, settings } = useTournament();
  const [activeGroup, setActiveGroup] = useState<GroupName>('A');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const leagueMatches = matches.filter((m) => m.stage === 'LEAGUE');
  const standings = calculateStandings(teams, leagueMatches, settings.draw_points_enabled);
  const groupStandings = standings.filter((row) => {
    const team = teams.find((t) => t.id === row.team_id);
    return team?.group_name === activeGroup;
  });
  const groups: GroupName[] = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <PageHero
        title="Group Stage"
        status="Live"
        date="Jun–Jul"
        region="Pocket Masters 2026"
        subtitle="Round-robin standings for the four league groups. Top 2 of each group qualify."
      />
      <SectionTabs tabs={buildEventTabs('Groups')} />

      <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        {/* Group selector */}
        <div className="flex gap-2 mb-6">
          {groups.map((group) => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`px-5 py-2.5 rounded-md font-display font-black uppercase text-sm tracking-wider transition-all ${
                activeGroup === group
                  ? 'bg-accent text-[#15110a]'
                  : 'bg-[#15161c] text-gray-400 hover:text-white border border-white/8'
              }`}
            >
              Group {group}
            </button>
          ))}
        </div>

        <motion.div
          key={activeGroup}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="surface rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto scrollbar-none">
            <table className="rank-table">
              <thead>
                <tr>
                  <th className="w-12 text-center">Pos</th>
                  <th>Team</th>
                  <th className="text-center">P</th>
                  <th className="text-center">W</th>
                  <th className="text-center">L</th>
                  <th className="text-center">BD</th>
                  <th className="text-center">Pts</th>
                  <th className="text-center hidden sm:table-cell">Form</th>
                  <th className="text-center w-32">Status</th>
                </tr>
              </thead>
              <tbody>
                {groupStandings.map((row) => {
                  const team = teams.find((t) => t.id === row.team_id);
                  const qualified = row.position <= 2;
                  return (
                    <tr
                      key={row.team_id}
                      onClick={() => team && setSelectedTeam(team)}
                      className="cursor-pointer"
                      style={{ borderLeft: `3px solid ${qualified ? 'var(--gold)' : 'transparent'}` }}
                    >
                      <td className="text-center">
                        <span className={`font-display font-black ${qualified ? 'text-accent' : ''}`} style={!qualified ? { color: 'var(--faint)' } : {}}>
                          {row.position}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          {team?.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={team.logo_url} className="h-7 w-7 rounded-full" alt="" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-[#23252e]" />
                          )}
                          <div>
                            <span className="block font-semibold text-white">{row.team_name}</span>
                            <span className="block text-[10px] uppercase font-bold" style={{ color: 'var(--faint)' }}>{row.team_code}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center font-mono text-gray-300">{row.played}</td>
                      <td className="text-center font-mono text-success">{row.won}</td>
                      <td className="text-center font-mono text-danger">{row.lost}</td>
                      <td className="text-center font-mono">
                        <span className={row.board_difference > 0 ? 'text-success' : row.board_difference < 0 ? 'text-danger' : 'text-gray-400'}>
                          {row.board_difference > 0 ? `+${row.board_difference}` : row.board_difference}
                        </span>
                      </td>
                      <td className="text-center font-mono font-black text-accent text-base">{row.points}</td>
                      <td className="hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-1">
                          {row.form.length > 0 ? (
                            row.form.slice(-5).map((f, i) => (
                              <span
                                key={i}
                                className={`inline-flex items-center justify-center h-5 w-5 rounded text-[9px] font-black ${
                                  f === 'W' ? 'bg-success/20 text-success' : f === 'L' ? 'bg-danger/20 text-danger' : 'bg-white/5 text-gray-400'
                                }`}
                              >
                                {f}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--faint)' }}>—</span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        {qualified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 text-accent text-[10px] uppercase font-black">
                            <Award className="h-3 w-3" /> Qualified
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--faint)' }}>In Play</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        <div className="mt-8 surface rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            The top 2 teams from each group advance to the Quarterfinals.
          </p>
          <Link
            href="/knockout"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#15161c] border border-white/10 hover:border-white/25 text-white font-display font-black text-xs uppercase tracking-wider transition-all"
          >
            View Bracket <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>

      <SiteFooter />

      <TeamDetailModal team={selectedTeam} teams={teams} matches={matches} onClose={() => setSelectedTeam(null)} />
    </div>
  );
}
