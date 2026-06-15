'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useTournament } from '@/context/TournamentContext';
import { Match, Team } from '@/lib/types';
import { ChevronLeft, ChevronRight, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Display = 'LIVE' | 'RESULT' | 'UPCOMING';

// Derive the badge from the clock: an uncompleted match flips to LIVE the
// moment its scheduled start time passes (or when the admin marks it LIVE).
function displayStatus(m: Match, now: number): Display {
  if (m.is_completed) return 'RESULT';
  if (m.status === 'LIVE') return 'LIVE';
  if (now >= new Date(m.match_date).getTime()) return 'LIVE';
  return 'UPCOMING';
}

const PLACEHOLDER: Record<string, string> = {
  qf: 'Quarterfinalist', sf: 'Semifinalist', final: 'Finalist',
};

export default function MatchCarousel() {
  const { matches, teams } = useTournament();
  const [now, setNow] = useState(() => Date.now());
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Tick the clock so LIVE badges turn on at the scheduled time.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const teamOf = (id: string): Team | undefined => teams.find((t) => t.id === id);
  const nameOf = (id: string) => {
    if (id.startsWith('t-')) {
      const key = Object.keys(PLACEHOLDER).find((k) => id.includes(k));
      return key ? PLACEHOLDER[key] : 'TBD';
    }
    return teamOf(id)?.name || 'TBD';
  };

  const slides = useMemo(() => {
    const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
    const today0 = startOfDay(now);
    const tom0 = today0 + 86400000;
    const dayAfter = tom0 + 86400000;
    const ts = (m: Match) => new Date(m.match_date).getTime();

    const recent = matches.filter((m) => m.is_completed).sort((a, b) => ts(b) - ts(a)).slice(0, 12);
    const today = matches.filter((m) => ts(m) >= today0 && ts(m) < tom0).sort((a, b) => ts(a) - ts(b));
    const tomorrow = matches.filter((m) => ts(m) >= tom0 && ts(m) < dayAfter).sort((a, b) => ts(a) - ts(b));
    const upcoming = matches.filter((m) => !m.is_completed && ts(m) >= now).sort((a, b) => ts(a) - ts(b)).slice(0, 12);

    const out: { key: string; label: string; sub: string; matches: Match[] }[] = [];
    if (recent.length) out.push({ key: 'recent', label: 'Recent Results', sub: 'Latest completed matches', matches: recent });
    if (today.length) out.push({ key: 'today', label: "Today's Matches", sub: 'Live & scheduled today', matches: today });
    if (tomorrow.length) out.push({ key: 'tomorrow', label: 'Tomorrow', sub: 'Coming up next', matches: tomorrow });
    if (!today.length && !tomorrow.length && upcoming.length) {
      out.push({ key: 'upcoming', label: 'Upcoming Matches', sub: 'Next on the schedule', matches: upcoming });
    }
    return out;
  }, [matches, now]);

  // Keep the active index valid as slides change.
  useEffect(() => {
    if (active >= slides.length) setActive(0);
  }, [slides.length, active]);

  // Auto-advance.
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  if (slides.length === 0) return null;
  const current = slides[Math.min(active, slides.length - 1)];

  const StatusBadge = ({ s }: { s: Display }) => {
    if (s === 'LIVE') return <span className="inline-flex items-center gap-1.5 text-danger text-[10px] font-black uppercase tracking-wider"><span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" /> Live</span>;
    if (s === 'RESULT') return <span className="text-accent text-[10px] font-black uppercase tracking-wider">Final</span>;
    return <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--faint)' }}>Upcoming</span>;
  };

  const TeamRow = ({ id, score, win, show }: { id: string; score: number; win: boolean; show: boolean }) => {
    const t = teamOf(id);
    const logo = id.startsWith('t-') ? undefined : t?.logo_url;
    return (
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-5 w-5 rounded-full shrink-0" />
          ) : (
            <div className="h-5 w-5 rounded-full bg-[#23252e] shrink-0" />
          )}
          <span className={`text-sm font-semibold truncate ${win ? 'text-white' : 'text-gray-400'}`}>{nameOf(id)}</span>
        </div>
        {show && <span className={`font-mono font-black text-sm shrink-0 ${win ? 'text-accent' : 'text-gray-500'}`}>{score}</span>}
      </div>
    );
  };

  const Card = ({ m }: { m: Match }) => {
    const s = displayStatus(m, now);
    const stage = m.stage === 'LEAGUE' ? `Group ${m.group_name}` : m.stage;
    const showScore = s !== 'UPCOMING';
    const winA = m.is_completed && m.winner_id === m.team_a_id;
    const winB = m.is_completed && m.winner_id === m.team_b_id;
    return (
      <div className="surface rounded-xl p-4 w-[260px] shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--faint)' }}>{stage}</span>
          <StatusBadge s={s} />
        </div>
        <div className="space-y-2">
          <TeamRow id={m.team_a_id} score={m.team_a_score} win={winA} show={showScore} />
          <TeamRow id={m.team_b_id} score={m.team_b_score} win={winB} show={showScore} />
        </div>
        <div className="pt-2 border-t border-white/8 flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--faint)' }}>
          <Calendar className="h-3 w-3" />
          {new Date(m.match_date).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    );
  };

  return (
    <section
      className="border-b border-white/8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-black text-lg text-white uppercase tracking-wide">{current.label}</h2>
            <p className="text-xs" style={{ color: 'var(--faint)' }}>{current.sub}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Dots */}
            <div className="hidden sm:flex items-center gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.key}
                  aria-label={s.label}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-accent' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                aria-label="Previous"
                onClick={() => setActive((i) => (i - 1 + slides.length) % slides.length)}
                className="p-1.5 rounded-md bg-[#15161c] border border-white/10 text-gray-300 hover:text-white hover:bg-[#1b1d24] transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                aria-label="Next"
                onClick={() => setActive((i) => (i + 1) % slides.length)}
                className="p-1.5 rounded-md bg-[#15161c] border border-white/10 text-gray-300 hover:text-white hover:bg-[#1b1d24] transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
            className="flex gap-4 overflow-x-auto scrollbar-none pb-1"
          >
            {current.matches.map((m) => (
              <Card key={m.id} m={m} />
            ))}
            <Link
              href="/fixtures"
              className="surface rounded-xl w-[150px] shrink-0 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
            >
              <ArrowRight className="h-5 w-5 text-accent" />
              <span className="text-xs font-black uppercase tracking-wider">Full Schedule</span>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
