'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Trophy, ChevronDown, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EVENT_LINKS = [
  { name: 'Groups', path: '/groups' },
  { name: 'Fixtures', path: '/fixtures' },
  { name: 'Standings', path: '/standings' },
  { name: 'Knockout', path: '/knockout' },
  { name: 'Stats', path: '/stats' },
];

const PRIMARY_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'News', path: '/news' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);

  const isEventsActive = EVENT_LINKS.some((l) => l.path === pathname);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/8 bg-[#0a0a0e]/95 backdrop-blur">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Trophy className="h-6 w-6 text-accent" />
            <span className="font-display font-black text-lg tracking-tight text-white">
              POCKET<span className="text-accent">MASTERS</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 ml-8 flex-1">
            <NavItem href="/" label="Home" active={pathname === '/'} />

            {/* Events & Standings dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setEventsOpen(true)}
              onMouseLeave={() => setEventsOpen(false)}
            >
              <button
                onClick={() => setEventsOpen((v) => !v)}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-md text-[13px] font-bold uppercase tracking-wide transition-colors ${
                  isEventsActive ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Events &amp; Standings
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${eventsOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {eventsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full pt-2"
                  >
                    <div className="min-w-[200px] rounded-xl border border-white/10 bg-[#15161c] p-1.5 shadow-2xl">
                      {EVENT_LINKS.map((l) => {
                        const active = pathname === l.path;
                        return (
                          <Link
                            key={l.path}
                            href={l.path}
                            onClick={() => setEventsOpen(false)}
                            className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                              active ? 'bg-white/5 text-accent' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {l.name}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <NavItem href="/teams" label="Teams" active={pathname === '/teams'} />
            <NavItem href="/news" label="News" active={pathname === '/news'} />
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              aria-label="Language"
              className="hidden sm:flex p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Globe className="h-5 w-5" />
            </button>

            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center px-5 py-2 rounded-md bg-accent text-[#15110a] font-display font-black text-xs uppercase tracking-wider hover:bg-[var(--gold-bright)] transition-colors"
            >
              Login
            </Link>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/5"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-white/8 bg-[#0a0a0e] overflow-hidden"
          >
            <div className="px-3 py-3 space-y-1">
              {[...PRIMARY_LINKS.slice(0, 1), ...EVENT_LINKS, { name: 'Teams', path: '/teams' }, ...PRIMARY_LINKS.slice(1)].map((l) => {
                const active = pathname === l.path;
                return (
                  <Link
                    key={l.path}
                    href={l.path}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2.5 rounded-md text-base font-semibold transition-colors ${
                      active ? 'text-accent bg-white/5' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {l.name}
                  </Link>
                );
              })}
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="block mt-2 px-3 py-2.5 rounded-md text-center bg-accent text-[#15110a] font-display font-black text-sm uppercase tracking-wider"
              >
                Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3.5 py-2 rounded-md text-[13px] font-bold uppercase tracking-wide transition-colors ${
        active ? 'text-white' : 'text-gray-400 hover:text-white'
      }`}
    >
      {label}
    </Link>
  );
}
