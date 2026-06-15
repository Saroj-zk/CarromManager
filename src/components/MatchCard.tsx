'use client';

import React, { useState } from 'react';
import { Match, Team } from '@/lib/types';
import { useTournament } from '@/context/TournamentContext';
import { Share2, Check, Calendar, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  const { teams } = useTournament();
  const [copied, setCopied] = useState(false);

  const getTeam = (id: string): Team | undefined => {
    return teams.find((t) => t.id === id);
  };

  const teamA = getTeam(match.team_a_id);
  const teamB = getTeam(match.team_b_id);

  const isPlaceholderA = match.team_a_id.startsWith('t-');
  const isPlaceholderB = match.team_b_id.startsWith('t-');

  // Resolve placeholders for display
  const getPlaceholderName = (id: string): string => {
    if (id.includes('qf1-a')) return 'Winner Group A';
    if (id.includes('qf1-b')) return 'Runner-Up Group B';
    if (id.includes('qf2-a')) return 'Winner Group B';
    if (id.includes('qf2-b')) return 'Runner-Up Group A';
    if (id.includes('qf3-a')) return 'Winner Group C';
    if (id.includes('qf3-b')) return 'Runner-Up Group D';
    if (id.includes('qf4-a')) return 'Winner Group D';
    if (id.includes('qf4-b')) return 'Runner-Up Group C';
    if (id.includes('sf1-a')) return 'Winner QF1';
    if (id.includes('sf1-b')) return 'Winner QF2';
    if (id.includes('sf2-a')) return 'Winner QF3';
    if (id.includes('sf2-b')) return 'Winner QF4';
    if (id.includes('final-a')) return 'Winner SF1';
    if (id.includes('final-b')) return 'Winner SF2';
    return 'TBD';
  };

  const nameA = isPlaceholderA ? getPlaceholderName(match.team_a_id) : (teamA?.name || 'TBD');
  const nameB = isPlaceholderB ? getPlaceholderName(match.team_b_id) : (teamB?.name || 'TBD');
  const codeA = isPlaceholderA ? 'TBD' : (teamA?.code || 'TBD');
  const codeB = isPlaceholderB ? 'TBD' : (teamB?.code || 'TBD');

  const shareMatch = async () => {
    const scoreText = match.status !== 'UPCOMING' ? ` (${match.team_a_score} - ${match.team_b_score})` : ' (Upcoming)';
    const text = `🏆 Pocket Masters Carrom Championship 2026\n📍 Stage: ${match.stage}${match.group_name ? ` (Group ${match.group_name})` : ''}\n🔥 ${nameA} vs ${nameB}${scoreText}\n⚡ Status: ${match.status}\n\nEvery Strike Counts. #PocketMasters2026`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pocket Masters Carrom Championship 2026',
          text: text,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCardBorder = () => {
    if (match.status === 'LIVE') return 'border-danger/30 shadow-danger/5';
    if (match.is_completed && match.stage === 'FINAL') return 'border-accent/30 shadow-accent/5';
    return 'border-white/5';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-xl p-4 flex flex-col justify-between border ${getCardBorder()} relative overflow-hidden`}
    >
      {/* Background gradients for status */}
      {match.status === 'LIVE' && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-full blur-2xl -z-10" />
      )}
      {match.is_completed && match.stage === 'FINAL' && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl -z-10" />
      )}

      {/* Match Meta Headers */}
      <div className="flex items-center justify-between mb-3 text-xs border-b border-white/5 pb-2">
        <span className="font-bold tracking-wider text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded">
          {match.stage === 'LEAGUE' ? `Group ${match.group_name}` : match.stage}
        </span>

        <div className="flex items-center gap-2">
          {match.status === 'LIVE' && (
            <span className="flex items-center gap-1.5 text-danger font-bold uppercase bg-danger/10 px-2.5 py-0.5 rounded pulse-badge text-[10px]">
              LIVE
            </span>
          )}
          {match.status === 'COMPLETED' && (
            <span className="flex items-center gap-1 text-success font-semibold bg-success/10 px-2 py-0.5 rounded text-[10px]">
              COMPLETED
            </span>
          )}
          {match.status === 'UPCOMING' && (
            <span className="flex items-center gap-1 text-gray-400 bg-white/5 px-2 py-0.5 rounded text-[10px] uppercase font-semibold">
              UPCOMING
            </span>
          )}
        </div>
      </div>

      {/* Main Score Area */}
      <div className="flex flex-col gap-3 py-1">
        {/* Team 1 Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isPlaceholderA && teamA?.logo_url ? (
              <img src={teamA.logo_url} className="h-7 w-7 rounded-full border border-white/10" alt="" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-gray-400 text-xs">A</div>
            )}
            <div>
              <span className={`text-sm font-bold block ${match.is_completed && match.winner_id === match.team_a_id ? 'text-accent font-black' : 'text-white'}`}>
                {nameA}
              </span>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Code: {codeA}</span>
            </div>
          </div>
          {match.status !== 'UPCOMING' && (
            <span className={`text-lg font-mono font-bold px-2 py-0.5 rounded ${match.is_completed && match.winner_id === match.team_a_id ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-slate-900 text-gray-300'}`}>
              {match.team_a_score}
            </span>
          )}
        </div>

        {/* Versus Divider */}
        <div className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest my-0.5">VS</div>

        {/* Team 2 Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isPlaceholderB && teamB?.logo_url ? (
              <img src={teamB.logo_url} className="h-7 w-7 rounded-full border border-white/10" alt="" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-gray-400 text-xs">B</div>
            )}
            <div>
              <span className={`text-sm font-bold block ${match.is_completed && match.winner_id === match.team_b_id ? 'text-accent font-black' : 'text-white'}`}>
                {nameB}
              </span>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Code: {codeB}</span>
            </div>
          </div>
          {match.status !== 'UPCOMING' && (
            <span className={`text-lg font-mono font-bold px-2 py-0.5 rounded ${match.is_completed && match.winner_id === match.team_b_id ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-slate-900 text-gray-300'}`}>
              {match.team_b_score}
            </span>
          )}
        </div>
      </div>

      {/* Match Footer Info & Actions */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-secondary" />
          <span>
            {new Date(match.match_date).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <button
          onClick={shareMatch}
          className="flex items-center gap-1 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-secondary/20 transition-all font-semibold"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" />
              <span className="text-success text-[10px]">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5 text-gray-400 hover:text-white" />
              <span className="text-[10px]">Share</span>
            </>
          )}
        </button>
      </div>

      {/* Score Summary Box for Completed Matches */}
      {match.is_completed && (
        <div className="mt-2 bg-slate-900/60 border border-white/5 rounded p-2 text-center text-[10px] flex items-center justify-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-accent" />
          <span className="font-bold text-gray-300">
            {match.winner_id
              ? `${getTeam(match.winner_id)?.name} won by ${Math.abs(match.team_a_score - match.team_b_score)} points`
              : 'Match ended in a Draw!'}
          </span>
        </div>
      )}
    </motion.div>
  );
}
