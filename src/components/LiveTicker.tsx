'use client';

import React, { useRef } from 'react';
import { useTournament } from '@/context/TournamentContext';
import { Match, Team } from '@/lib/types';
import { ChevronLeft, ChevronRight, Play, CheckCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function LiveTicker() {
  const { matches, teams } = useTournament();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter and sort matches: LIVE first, then UPCOMING, then recent COMPLETED matches
  const sortedTickerMatches = React.useMemo(() => {
    const live = matches.filter((m) => m.status === 'LIVE');
    const upcoming = matches.filter((m) => m.status === 'UPCOMING').slice(0, 10);
    const completed = matches
      .filter((m) => m.status === 'COMPLETED')
      .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
      .slice(0, 5);

    return [...live, ...upcoming, ...completed];
  }, [matches]);

  const getTeam = (id: string): Team | undefined => {
    return teams.find((t) => t.id === id);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 300 : scrollLeft + 300;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (sortedTickerMatches.length === 0) return null;

  return (
    <div className="relative border-b border-white/5 bg-slate-950/40 backdrop-blur-sm select-none py-2 px-1">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 p-1 rounded-full bg-slate-900 border border-white/10 hover:bg-secondary text-gray-300 hover:text-white transition-all shadow-md focus:outline-none"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Scrolling Area */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 scrollbar-none py-1.5 px-8 w-full select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {sortedTickerMatches.map((match) => {
            const teamA = getTeam(match.team_a_id);
            const teamB = getTeam(match.team_b_id);
            
            // Check if placeholder knockout
            const isPlaceholderA = match.team_a_id.startsWith('t-');
            const isPlaceholderB = match.team_b_id.startsWith('t-');

            const teamAName = isPlaceholderA ? getPlaceholderName(match.team_a_id) : (teamA?.name || 'TBD');
            const teamBName = isPlaceholderB ? getPlaceholderName(match.team_b_id) : (teamB?.name || 'TBD');
            const teamACode = isPlaceholderA ? 'TBD' : (teamA?.code || 'TBD');
            const teamBCode = isPlaceholderB ? 'TBD' : (teamB?.code || 'TBD');

            return (
              <div
                key={match.id}
                className="flex-shrink-0 w-[260px] glass-panel rounded-lg p-3 relative border border-white/5 shadow-md flex flex-col justify-between"
              >
                {/* Match Header info */}
                <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-gray-400 mb-2">
                  <span>
                    {match.stage === 'LEAGUE' ? `Group ${match.group_name}` : match.stage}
                  </span>
                  
                  {match.status === 'LIVE' && (
                    <span className="flex items-center gap-1 text-danger font-semibold bg-danger/10 px-1.5 py-0.5 rounded border border-danger/20 pulse-badge">
                      LIVE
                    </span>
                  )}
                  {match.status === 'COMPLETED' && (
                    <span className="flex items-center gap-1 text-success font-semibold bg-success/10 px-1.5 py-0.5 rounded border border-success/20">
                      RESULT
                    </span>
                  )}
                  {match.status === 'UPCOMING' && (
                    <span className="flex items-center gap-1 text-secondary font-semibold bg-secondary/10 px-1.5 py-0.5 rounded border border-secondary/20">
                      UPCOMING
                    </span>
                  )}
                </div>

                {/* Team Rows */}
                <div className="space-y-1">
                  {/* Team A */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      {!isPlaceholderA && teamA?.logo_url ? (
                        <img src={teamA.logo_url} className="h-4 w-4 rounded-full" alt="" />
                      ) : (
                        <div className="h-4 w-4 bg-gray-800 rounded-full flex items-center justify-center text-[8px] font-bold text-gray-500">C</div>
                      )}
                      <span className={`text-xs font-semibold truncate ${match.is_completed && match.winner_id === match.team_a_id ? 'text-accent font-bold' : 'text-white'}`}>
                        {teamACode}
                      </span>
                    </div>
                    {match.status !== 'UPCOMING' && (
                      <span className={`text-xs font-mono font-bold ${match.is_completed && match.winner_id === match.team_a_id ? 'text-accent' : 'text-gray-300'}`}>
                        {match.team_a_score}
                      </span>
                    )}
                  </div>

                  {/* Team B */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      {!isPlaceholderB && teamB?.logo_url ? (
                        <img src={teamB.logo_url} className="h-4 w-4 rounded-full" alt="" />
                      ) : (
                        <div className="h-4 w-4 bg-gray-800 rounded-full flex items-center justify-center text-[8px] font-bold text-gray-500">C</div>
                      )}
                      <span className={`text-xs font-semibold truncate ${match.is_completed && match.winner_id === match.team_b_id ? 'text-accent font-bold' : 'text-white'}`}>
                        {teamBCode}
                      </span>
                    </div>
                    {match.status !== 'UPCOMING' && (
                      <span className={`text-xs font-mono font-bold ${match.is_completed && match.winner_id === match.team_b_id ? 'text-accent' : 'text-gray-300'}`}>
                        {match.team_b_score}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Summary */}
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
                  <span className="truncate max-w-[150px]">
                    {match.status === 'LIVE' && 'Strikes in progress...'}
                    {match.status === 'COMPLETED' && `${match.winner_id ? `${getTeam(match.winner_id)?.name.split(' ')[0]} won` : 'Match Drawn'}`}
                    {match.status === 'UPCOMING' && new Date(match.match_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  <Link href="/fixtures" className="text-secondary hover:text-white font-semibold transition-colors">
                    Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 z-10 p-1 rounded-full bg-slate-900 border border-white/10 hover:bg-secondary text-gray-300 hover:text-white transition-all shadow-md focus:outline-none"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function getPlaceholderName(id: string): string {
  if (id.includes('qf1-a')) return 'Winner Group A';
  if (id.includes('qf1-b')) return 'Runner B';
  if (id.includes('qf2-a')) return 'Winner Group B';
  if (id.includes('qf2-b')) return 'Runner A';
  if (id.includes('qf3-a')) return 'Winner Group C';
  if (id.includes('qf3-b')) return 'Runner D';
  if (id.includes('qf4-a')) return 'Winner Group D';
  if (id.includes('qf4-b')) return 'Runner C';
  if (id.includes('sf1-a')) return 'Winner QF1';
  if (id.includes('sf1-b')) return 'Winner QF2';
  if (id.includes('sf2-a')) return 'Winner QF3';
  if (id.includes('sf2-b')) return 'Winner QF4';
  if (id.includes('final-a')) return 'Winner SF1';
  if (id.includes('final-b')) return 'Winner SF2';
  return 'TBD';
}
