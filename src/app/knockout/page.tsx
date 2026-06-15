'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import PageHero from '@/components/PageHero';
import SectionTabs, { buildEventTabs } from '@/components/SectionTabs';
import SiteFooter from '@/components/SiteFooter';
import BracketView from '@/components/BracketView';

export default function Knockout() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />

      <PageHero
        title="Knockout Stage"
        status="Live"
        date="Jun–Jul"
        region="Pocket Masters 2026"
        subtitle="Single-elimination bracket. Click any upcoming match to predict a winner and watch them advance."
      />

      <SectionTabs tabs={buildEventTabs('Knockouts')} />

      <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        <div className="overflow-x-auto pb-4 scrollbar-none">
          <div className="min-w-[1200px]">
            <BracketView />
          </div>
        </div>

        <p className="mt-10 text-center text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--faint)' }}>
          Seeding · Winner A vs Runner-Up B · Winner B vs Runner-Up A · Winner C vs Runner-Up D · Winner D vs Runner-Up C
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
