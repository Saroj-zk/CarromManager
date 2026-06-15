'use client';

import React from 'react';
import { Calendar, Globe, Trophy } from 'lucide-react';

interface PageHeroProps {
  title: string;
  status?: string;
  date?: string;
  region?: string;
  subtitle?: string;
}

/**
 * Wide hero banner used at the top of section pages — title overlaid on a
 * gradient banner with status / date / region pills, à la lolesports.
 */
export default function PageHero({ title, status, date, region, subtitle }: PageHeroProps) {
  return (
    <section className="relative w-full overflow-hidden border-b border-white/8">
      {/* Layered gradient banner */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 150% at 82% 18%, rgba(224,169,61,0.30), transparent 52%),' +
            'radial-gradient(90% 130% at 62% 0%, rgba(59,130,246,0.14), transparent 60%),' +
            'linear-gradient(180deg, #15161c 0%, #0a0a0e 100%)',
        }}
      />
      {/* Decorative oversized emblem */}
      <Trophy className="absolute right-6 sm:right-16 top-1/2 -translate-y-1/2 h-48 w-48 text-accent/15 hidden sm:block" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#0a0a0e_10%,transparent_70%)]" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h1 className="font-display font-black text-4xl sm:text-6xl tracking-tight text-white">
          {title}
        </h1>

        {(status || date || region) && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {status && <span className="status-pill">{status}</span>}
            {date && (
              <span className="meta-pill">
                <Calendar className="h-4 w-4" />
                {date}
              </span>
            )}
            {region && (
              <span className="meta-pill">
                <Globe className="h-4 w-4" />
                {region}
              </span>
            )}
          </div>
        )}

        {subtitle && (
          <p className="mt-4 max-w-2xl text-gray-400 text-sm sm:text-base font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
