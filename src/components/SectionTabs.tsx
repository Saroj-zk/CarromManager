'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

export interface SectionTab {
  label: string; // small grey label, e.g. "BRACKET"
  value: string; // bold value, e.g. "Knockouts"
  href: string;
  active?: boolean;
  done?: boolean; // shows a check mark
}

/** Shared selector row used across the event/standings pages. */
export function buildEventTabs(active: string): SectionTab[] {
  return [
    { label: 'SEASON, EVENT & TEAMS', value: 'Overview', href: '/overview' },
    { label: 'STAGE', value: 'Groups', href: '/groups' },
    { label: 'STAGE', value: 'Standings', href: '/standings' },
    { label: 'STAGE', value: 'Fixtures', href: '/fixtures' },
    { label: 'STAGE', value: 'Knockouts', href: '/knockout' },
  ].map((t) => ({ ...t, active: t.value === active }));
}

/**
 * Row of selector cards used under the hero (Overview / Groups / Knockouts …),
 * mirroring the lolesports bracket selector.
 */
export default function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-10">
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
        {tabs.map((tab) => (
          <Link
            key={tab.href + tab.value}
            href={tab.href}
            className={`section-card shrink-0 ${tab.active ? 'is-active' : ''}`}
          >
            <span className="section-card__label">{tab.label}</span>
            <span className="section-card__value">
              {tab.value}
              {tab.done && <Check className="h-4 w-4 text-success" />}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
