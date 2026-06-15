'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/8 mt-auto bg-[#0a0a0e]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          <span className="font-display font-black text-sm tracking-tight text-white">
            POCKET<span className="text-accent">MASTERS</span>
          </span>
          <span className="text-faint text-xs font-semibold ml-2 hidden sm:inline" style={{ color: 'var(--faint)' }}>
            Carrom Championship
          </span>
        </div>

        <div className="flex items-center gap-5 text-[11px] font-semibold" style={{ color: 'var(--faint)' }}>
          <span>© 2026 Pocket Masters. Every Strike Counts.</span>
          <Link href="/news" className="hover:text-white transition-colors">News</Link>
          <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
