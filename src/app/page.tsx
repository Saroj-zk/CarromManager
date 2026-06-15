'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import TrophySection from '@/components/TrophySection';
import { useTournament } from '@/context/TournamentContext';
import {
  LayoutGrid,
  Calendar,
  TrendingUp,
  GitMerge,
  ShieldAlert,
  BarChart3,
  Newspaper,
  Star,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const navCards = [
  { title: 'Groups', description: 'Live group standings and qualification tracker', icon: LayoutGrid, href: '/groups' },
  { title: 'Schedule', description: 'All matches, filters, and PDF export', icon: Calendar, href: '/fixtures' },
  { title: 'Standings', description: 'Points table with board difference and form', icon: TrendingUp, href: '/standings' },
  { title: 'Knockout', description: 'The interactive Quarterfinals → Final bracket', icon: GitMerge, href: '/knockout' },
  { title: 'Teams', description: 'All 24 team profiles and qualification odds', icon: ShieldAlert, href: '/teams' },
  { title: 'Statistics', description: 'Leaderboards, win streaks and analysis', icon: BarChart3, href: '/stats' },
  { title: 'News', description: 'Official announcements and match reports', icon: Newspaper, href: '/news' },
];

export default function Home() {
  const { stats, matches, news } = useTournament();

  const finalMatch = matches.find((m) => m.id === 'match-final');
  const hasChampion = !!(
    finalMatch &&
    finalMatch.is_completed &&
    finalMatch.winner_id &&
    !finalMatch.winner_id.startsWith('t-')
  );
  const latestNews = news.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />

      {/* Hero */}
      <section className="relative w-full overflow-hidden border-b border-white/8">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(80% 120% at 50% 0%, rgba(224,169,61,0.16), transparent 55%),' +
              'radial-gradient(70% 100% at 50% 100%, rgba(59,130,246,0.10), transparent 60%),' +
              'linear-gradient(180deg,#101117 0%,#0a0a0e 100%)',
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center py-20 sm:py-28">
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-accent/30 bg-accent/10 text-accent mb-6"
          >
            <Star className="h-3 w-3" /> Carrom Championship 2026
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display font-black text-5xl sm:text-8xl uppercase tracking-tight leading-none text-white mb-3"
          >
            Pocket Masters
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight leading-none mb-6"
            style={{
              background: 'linear-gradient(90deg,#f4c662 0%,#e0a93d 45%,#60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Every Strike Counts.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.26 }}
            className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto font-medium"
          >
            The official tournament hub — live standings, fixtures, an interactive knockout
            bracket and the road to the Pocket Masters crown.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34 }}
            className="mt-10 inline-flex flex-wrap justify-center gap-8"
          >
            {[
              { label: 'Teams', value: stats.totalTeams },
              { label: 'Matches', value: stats.totalMatches },
              { label: 'Groups', value: 4 },
              { label: 'Played', value: stats.matchesPlayed },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center">
                <span className="font-display font-black text-3xl text-white">{s.value}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--faint)' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {hasChampion && (
        <section className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12">
          <TrophySection />
        </section>
      )}

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <p className="text-[10px] font-black uppercase tracking-widest mb-5" style={{ color: 'var(--faint)' }}>
          Explore the Tournament
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {navCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
              >
                <Link href={card.href} className="group glass-card flex flex-col gap-3 p-5 rounded-2xl h-full">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 border border-accent/20 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-black text-sm text-white uppercase tracking-wide flex items-center gap-1.5">
                      {card.title}
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-accent" />
                    </h2>
                    <p className="text-gray-400 text-xs mt-0.5 font-medium leading-relaxed">{card.description}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {latestNews.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--faint)' }}>
                Latest Headlines
              </p>
              <Link href="/news" className="inline-flex items-center gap-1 text-accent hover:text-[var(--gold-bright)] text-xs font-black uppercase tracking-wider transition-colors">
                All News <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latestNews.map((item, idx) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: idx * 0.05 }}>
                  <Link href="/news" className="group glass-card flex flex-col h-full rounded-2xl overflow-hidden">
                    {item.image_url && (
                      <div className="h-36 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <div className="p-4 flex flex-col gap-1.5">
                      <h3 className="font-display font-black text-sm text-white leading-snug line-clamp-2">{item.title}</h3>
                      <p className="text-gray-400 text-xs font-medium leading-relaxed line-clamp-2">{item.summary}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
