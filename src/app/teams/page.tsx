'use client';

import React, { useState, useMemo } from 'react';
import { useTournament } from '@/context/TournamentContext';
import Navbar from '@/components/Navbar';
import PageHero from '@/components/PageHero';
import SiteFooter from '@/components/SiteFooter';
import TeamDetailModal from '@/components/TeamDetailModal';
import { Search } from 'lucide-react';
import { Team } from '@/lib/types';
import { motion } from 'framer-motion';

export default function Teams() {
  const { teams, matches, settings, stats } = useTournament();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const getTeamMatches = (teamId: string) =>
    matches.filter((m) => (m.team_a_id === teamId || m.team_b_id === teamId) && m.is_completed);

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const term = searchTerm.toLowerCase();
      return (
        t.name.toLowerCase().includes(term) ||
        t.code.toLowerCase().includes(term) ||
        `group ${t.group_name}`.toLowerCase().includes(term)
      );
    });
  }, [teams, searchTerm]);

  const probColor = (v: number) => (v >= 75 ? 'bg-success' : v >= 25 ? 'bg-accent' : 'bg-danger');

  const renderTeamCard = (team: Team) => {
    const teamMatches = getTeamMatches(team.id);
    let won = 0, lost = 0, points = 0;
    const form: ('W' | 'L' | 'D')[] = [];
    teamMatches.forEach((m) => {
      if (m.winner_id === team.id) { won++; points += 2; form.push('W'); }
      else if (m.winner_id === null) { points += settings.draw_points_enabled ? 1 : 0; form.push('D'); }
      else { lost++; form.push('L'); }
    });
    const prob = stats.qualificationProbability[team.id] ?? 50;

    return (
      <motion.div
        key={team.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setSelectedTeam(team)}
        className="glass-card rounded-2xl p-5 flex flex-col cursor-pointer"
      >
        <div className="flex items-center justify-between border-b border-white/8 pb-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {team.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={team.logo_url} className="h-10 w-10 rounded-full" alt="" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-[#23252e]" />
            )}
            <div className="min-w-0">
              <h3 className="font-display font-black text-sm text-white uppercase tracking-tight truncate">{team.name}</h3>
              <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--faint)' }}>Code {team.code}</span>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-[9px] uppercase font-black shrink-0">
            Group {team.group_name}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center bg-[#0f1015] border border-white/8 rounded-xl p-2.5 mb-4">
          <Stat label="Played" value={teamMatches.length} />
          <Stat label="Wins" value={won} tone="text-success" />
          <Stat label="Losses" value={lost} tone="text-danger" />
          <Stat label="Points" value={points} tone="text-accent" />
        </div>

        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-[9px] font-bold uppercase text-gray-400">
            <span>QF Qualification Chance</span>
            <span className="text-white">{prob}%</span>
          </div>
          <div className="h-2 w-full bg-[#0a0a0e] border border-white/8 rounded-full overflow-hidden">
            <div className={`h-full ${probColor(prob)}`} style={{ width: `${prob}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-auto">
          <span className="font-bold uppercase">Recent Form</span>
          <div className="flex items-center gap-1">
            {form.length > 0 ? (
              form.slice(-5).map((o, i) => (
                <span key={i} className={`inline-flex items-center justify-center h-5 w-5 rounded text-[8px] font-black ${
                  o === 'W' ? 'bg-success/20 text-success' : o === 'L' ? 'bg-danger/20 text-danger' : 'bg-white/5 text-gray-400'
                }`}>{o}</span>
              ))
            ) : (
              <span className="text-[9px] uppercase font-semibold" style={{ color: 'var(--faint)' }}>No matches</span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <PageHero
        title="Teams"
        status="24 Teams"
        date="Jun–Jul"
        region="Pocket Masters 2026"
        subtitle="Profiles, group placements, qualification odds and recent form for every team."
      />

      <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--faint)' }} />
          <input
            type="text"
            placeholder="Search by name, code, or group…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-md bg-[#15161c] border border-white/8 text-white placeholder-gray-500 focus:outline-none focus:border-white/25 text-sm font-semibold"
          />
        </div>

        {filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTeams.map((t) => renderTeamCard(t))}
          </div>
        ) : (
          <div className="text-center py-16 surface rounded-2xl">
            <h3 className="text-white font-display font-bold text-lg">No teams found</h3>
            <p className="text-gray-500 text-sm mt-1">Try a different search.</p>
          </div>
        )}
      </main>

      <SiteFooter />

      <TeamDetailModal team={selectedTeam} teams={teams} matches={matches} onClose={() => setSelectedTeam(null)} />
    </div>
  );
}

function Stat({ label, value, tone = 'text-white' }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <span className="block text-[8px] uppercase font-black" style={{ color: 'var(--faint)' }}>{label}</span>
      <span className={`text-sm font-black ${tone}`}>{value}</span>
    </div>
  );
}
