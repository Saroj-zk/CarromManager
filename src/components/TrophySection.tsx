'use client';

import React, { useEffect, useState } from 'react';
import { useTournament } from '@/context/TournamentContext';
import { Trophy, Star, Sparkles, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Team } from '@/lib/types';
import { motion } from 'framer-motion';

export default function TrophySection() {
  const { matches, teams } = useTournament();
  const [champion, setChampion] = useState<Team | null>(null);

  useEffect(() => {
    const finalMatch = matches.find((m) => m.id === 'match-final');
    if (finalMatch && finalMatch.is_completed && finalMatch.winner_id) {
      const champ = teams.find((t) => t.id === finalMatch.winner_id);
      if (champ) {
        setChampion(champ);
        // Trigger initial confetti explosion!
        fireConfetti();
      }
    } else {
      setChampion(null);
    }
  }, [matches, teams]);

  const fireConfetti = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // Confetti cannons on the left and right
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  return (
    <div className="w-full py-8">
      {champion ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-2xl mx-auto rounded-3xl p-8 text-center border-2 border-accent/30 bg-radial from-slate-900 via-slate-950 to-black overflow-hidden shadow-2xl"
        >
          {/* Sparkles background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(251,191,36,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(251,191,36,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          <div className="absolute top-4 left-4 text-accent/20"><Star className="h-8 w-8 animate-spin-slow" /></div>
          <div className="absolute bottom-4 right-4 text-accent/20"><Sparkles className="h-8 w-8 animate-pulse" /></div>

          {/* Golden Trophy Glow */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />
              <div className="relative p-6 rounded-full bg-accent/10 border border-accent/30 animate-float-trophy">
                <Trophy className="h-24 w-24 text-accent filter drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
              </div>
            </div>

            <span className="text-xs uppercase tracking-widest text-accent font-black bg-accent/10 border border-accent/20 px-3 py-1 rounded-full mb-3 inline-flex items-center gap-1.5 shadow-sm">
              <Award className="h-3.5 w-3.5" />
              Tournament Champion
            </span>

            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight mb-2 uppercase">
              {champion.name}
            </h2>
            
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              Congratulations to <span className="text-white font-semibold">{champion.name}</span> for pocketing their way to glory and winning the Pocket Masters Carrom Championship 2026!
            </p>

            {/* Champion details grid */}
            <div className="grid grid-cols-3 gap-4 bg-slate-900/60 border border-white/5 rounded-2xl p-4 w-full max-w-sm mb-6">
              <div>
                <span className="block text-[10px] text-gray-500 uppercase font-bold">Group</span>
                <span className="text-lg font-extrabold text-white">Group {champion.group_name}</span>
              </div>
              <div className="border-x border-white/5">
                <span className="block text-[10px] text-gray-500 uppercase font-bold">Team Code</span>
                <span className="text-lg font-extrabold text-white">{champion.code}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 uppercase font-bold">Status</span>
                <span className="text-lg font-extrabold text-accent uppercase">Undefeated</span>
              </div>
            </div>

            <button
              onClick={fireConfetti}
              className="px-6 py-2.5 rounded-full bg-accent text-slate-950 font-display font-black text-sm uppercase tracking-wider hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20 cursor-pointer"
            >
              Celebrate Win! 🎉
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="relative max-w-2xl mx-auto rounded-3xl p-8 text-center border border-white/5 bg-slate-950/40 overflow-hidden shadow-xl">
          <div className="flex flex-col items-center">
            <Trophy className="h-16 w-16 text-slate-600 mb-4 animate-pulse-slow" />
            <h3 className="font-display font-bold text-xl text-white mb-2">The Golden Striker Awaits</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              The championship trophy is polished and ready. Complete the league matches and knockouts to crown the first ever Pocket Masters Carrom Champion!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
