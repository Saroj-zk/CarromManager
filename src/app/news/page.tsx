'use client';

import React, { useState } from 'react';
import { useTournament } from '@/context/TournamentContext';
import Navbar from '@/components/Navbar';
import PageHero from '@/components/PageHero';
import SiteFooter from '@/components/SiteFooter';
import { Calendar, ChevronDown, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function News() {
  const { news } = useTournament();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <PageHero
        title="News & Announcements"
        status="Latest"
        date="Jun–Jul"
        region="Pocket Masters 2026"
        subtitle="Official updates, match reports and headlines from the championship."
      />

      <main className="max-w-[1000px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        {news.length === 0 ? (
          <div className="text-center py-16 surface rounded-2xl">
            <Info className="h-10 w-10 mx-auto mb-4" style={{ color: 'var(--faint)' }} />
            <h3 className="text-white font-display font-bold text-lg">No announcements yet</h3>
            <p className="text-gray-500 text-sm mt-1">Tournament headlines will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((item, idx) => {
              const isExpanded = expandedId === item.id;
              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                  className="glass-card rounded-2xl overflow-hidden flex flex-col md:flex-row"
                >
                  {item.image_url && (
                    <div className="md:w-72 flex-shrink-0 h-48 md:h-auto relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-accent text-[#15110a] text-[10px] font-black uppercase tracking-widest">
                          Latest
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-6 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--faint)' }}>
                      <Calendar className="h-3.5 w-3.5 text-accent" />
                      {formatDate(item.created_at)}
                    </div>
                    <h2 className="font-display font-black text-xl text-white tracking-tight mb-2 leading-snug">{item.title}</h2>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed">{item.summary}</p>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="text-gray-300 text-sm font-medium leading-relaxed mt-4 pt-4 border-t border-white/8 whitespace-pre-line">
                            {item.content}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="mt-4 inline-flex items-center gap-1.5 text-accent hover:text-[var(--gold-bright)] text-xs font-black uppercase tracking-wider transition-colors"
                    >
                      {isExpanded ? 'Show less' : 'Read full story'}
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
