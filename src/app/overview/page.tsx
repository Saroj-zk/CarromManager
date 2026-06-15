'use client';

import React from 'react';
import { useTournament } from '@/context/TournamentContext';
import Navbar from '@/components/Navbar';
import PageHero from '@/components/PageHero';
import SectionTabs, { buildEventTabs } from '@/components/SectionTabs';
import SiteFooter from '@/components/SiteFooter';
import { pointsFromSettings } from '@/lib/store';
import {
  Users,
  CalendarDays,
  LayoutGrid,
  GitMerge,
  Trophy,
  ListChecks,
  Award,
  Scale,
} from 'lucide-react';

export default function Overview() {
  const { teams, matches, settings, stats } = useTournament();

  const finalMatch = matches.find((m) => m.id === 'match-final');
  const champion =
    finalMatch && finalMatch.is_completed && finalMatch.winner_id && !finalMatch.winner_id.startsWith('t-')
      ? teams.find((t) => t.id === finalMatch.winner_id)
      : null;

  const pts = pointsFromSettings(settings);

  const details = [
    { icon: Users, label: 'Teams', value: stats.totalTeams },
    { icon: LayoutGrid, label: 'Groups', value: 4 },
    { icon: CalendarDays, label: 'Total Matches', value: stats.totalMatches },
    { icon: ListChecks, label: 'Matches Played', value: stats.matchesPlayed },
  ];

  const rules: { icon: React.ElementType; title: string; body: string }[] = [
    {
      icon: LayoutGrid,
      title: 'League Format',
      body: '24 teams split into 4 groups of 6. Every team plays a single round-robin within its group (5 matches each).',
    },
    {
      icon: Award,
      title: 'Points System',
      body: `${pts.win} point${pts.win === 1 ? '' : 's'} for a win, ${pts.draw} for a draw, and 0 for a loss.`,
    },
    {
      icon: Scale,
      title: 'Tie-Breakers',
      body: 'Ranking ties are resolved by: Points → Board Difference (BD) → Matches Won → Team name (alphabetical).',
    },
    {
      icon: GitMerge,
      title: 'Qualification',
      body: 'The top 2 teams from each group advance to the Quarterfinals — 8 teams in total.',
    },
    {
      icon: Trophy,
      title: 'Knockout Stage',
      body: 'Single elimination: Quarterfinals → Semifinals → Final. Winner A vs Runner-Up B, and so on across the bracket.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <PageHero
        title="Pocket Masters 2026"
        status="Live"
        date="Jun–Jul"
        region="Global"
        subtitle="The official Pocket Masters Carrom Championship — 24 teams, four groups, one crown."
      />
      <SectionTabs tabs={buildEventTabs('Overview')} />

      <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex-grow space-y-10">
        {/* Champion banner (once decided) */}
        {champion && (
          <div className="surface rounded-2xl p-6 flex items-center gap-5 border-accent/30" style={{ borderColor: 'rgba(224,169,61,0.3)' }}>
            <div className="p-4 rounded-full bg-accent/10 border border-accent/30">
              <Trophy className="h-8 w-8 text-accent" />
            </div>
            <div className="flex items-center gap-3 min-w-0">
              {champion.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={champion.logo_url} alt="" className="h-10 w-10 rounded-full" />
              )}
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-accent">Tournament Champion</span>
                <span className="font-display font-black text-2xl text-white">{champion.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Details */}
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: 'var(--faint)' }}>
            Tournament Details
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {details.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.label} className="surface rounded-2xl p-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 border border-accent/20 text-accent mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-display font-black text-3xl text-white leading-none">{d.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mt-1.5" style={{ color: 'var(--faint)' }}>
                    {d.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {[
              { label: 'Format', value: 'League + Knockout' },
              { label: 'Schedule', value: 'June – July 2026' },
              { label: 'Points (W / D / L)', value: `${pts.win} / ${pts.draw} / 0` },
            ].map((d) => (
              <div key={d.label} className="surface rounded-2xl px-5 py-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--faint)' }}>{d.label}</span>
                <span className="font-display font-black text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Rules */}
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: 'var(--faint)' }}>
            Rules &amp; Format
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.title} className="surface rounded-2xl p-5 flex gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-accent/10 border border-accent/20 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-white uppercase tracking-wide text-sm mb-1">{r.title}</h3>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed">{r.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
