'use client';

import React, { useState, useMemo } from 'react';
import { useTournament } from '@/context/TournamentContext';
import Navbar from '@/components/Navbar';
import PageHero from '@/components/PageHero';
import SectionTabs, { buildEventTabs } from '@/components/SectionTabs';
import SiteFooter from '@/components/SiteFooter';
import { Match } from '@/lib/types';
import { Search, Download, Info } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function Fixtures() {
  const { matches, teams } = useTournament();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'COMPLETED' | 'UPCOMING'>('ALL');
  const [groupFilter, setGroupFilter] = useState<'ALL' | 'A' | 'B' | 'C' | 'D' | 'KNOCKOUT'>('ALL');

  const getTeamName = (id: string) => {
    if (id.startsWith('t-')) {
      if (id.includes('qf')) return 'Quarterfinalist';
      if (id.includes('sf')) return 'Semifinalist';
      if (id.includes('final')) return 'Finalist';
      return 'TBD';
    }
    return teams.find((t) => t.id === id)?.name || 'TBD';
  };
  const getLogo = (id: string) => (id.startsWith('t-') ? undefined : teams.find((t) => t.id === id)?.logo_url);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const nameA = getTeamName(match.team_a_id).toLowerCase();
      const nameB = getTeamName(match.team_b_id).toLowerCase();
      const term = searchTerm.toLowerCase();
      const matchesSearch = nameA.includes(term) || nameB.includes(term);
      const matchesStatus = statusFilter === 'ALL' || match.status === statusFilter;
      let matchesGroup = false;
      if (groupFilter === 'ALL') matchesGroup = true;
      else if (groupFilter === 'KNOCKOUT') matchesGroup = match.stage !== 'LEAGUE';
      else matchesGroup = match.stage === 'LEAGUE' && match.group_name === groupFilter;
      return matchesSearch && matchesStatus && matchesGroup;
    });
  }, [matches, teams, searchTerm, statusFilter, groupFilter]);

  // Group by calendar day.
  const grouped = useMemo(() => {
    const sorted = [...filteredMatches].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    );
    const map = new Map<string, Match[]>();
    for (const m of sorted) {
      const key = new Date(m.match_date).toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [filteredMatches]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('POCKET MASTERS CARROM CHAMPIONSHIP 2026', 14, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Fixtures & Results — generated ${new Date().toLocaleString()}`, 14, 27);
    let y = 40;
    const ph = doc.internal.pageSize.height;
    filteredMatches.forEach((m, idx) => {
      if (y > ph - 20) { doc.addPage(); y = 20; }
      const tA = getTeamName(m.team_a_id);
      const tB = getTeamName(m.team_b_id);
      const grp = m.stage === 'LEAGUE' ? `Group ${m.group_name}` : m.stage;
      const score = m.status !== 'UPCOMING' ? `${m.team_a_score} - ${m.team_b_score}` : 'vs';
      doc.setTextColor(20, 20, 20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. [${grp}] ${tA}  ${score}  ${tB}`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(8);
      doc.text(`${new Date(m.match_date).toLocaleString()}  |  ${m.status}`, 14, y + 4.5);
      doc.setFontSize(10);
      y += 12;
    });
    doc.save('Pocket_Masters_Fixtures_2026.pdf');
  };

  const TeamSide = ({ id, align, win }: { id: string; align: 'left' | 'right'; win: boolean }) => {
    const logo = getLogo(id);
    const name = getTeamName(id);
    return (
      <div className={`flex items-center gap-3 min-w-0 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} className="h-7 w-7 rounded-full shrink-0" alt="" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-[#23252e] shrink-0" />
        )}
        <span className={`truncate text-sm font-semibold ${win ? 'text-white' : 'text-gray-400'}`}>{name}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <PageHero
        title="Schedule"
        status="Live"
        date="Jun–Jul"
        region="Pocket Masters 2026"
        subtitle="Every match across the league and knockout stages — times, live games and final results."
      />
      <SectionTabs tabs={buildEventTabs('Fixtures')} />

      <main className="max-w-[1000px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--faint)' }} />
            <input
              type="text"
              placeholder="Search teams…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-md bg-[#15161c] border border-white/8 text-white placeholder-gray-500 focus:outline-none focus:border-white/25 text-sm font-semibold"
            />
          </div>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value as typeof groupFilter)}
            className="w-full px-4 py-2.5 rounded-md bg-[#15161c] border border-white/8 text-white text-sm font-semibold focus:outline-none focus:border-white/25"
          >
            <option value="ALL">All Groups</option>
            <option value="A">Group A</option>
            <option value="B">Group B</option>
            <option value="C">Group C</option>
            <option value="D">Group D</option>
            <option value="KNOCKOUT">Knockouts</option>
          </select>
          <div className="flex bg-[#15161c] border border-white/8 p-1 rounded-md">
            {[
              { id: 'ALL', name: 'All' },
              { id: 'LIVE', name: 'Live' },
              { id: 'COMPLETED', name: 'Results' },
              { id: 'UPCOMING', name: 'Upcoming' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setStatusFilter(t.id as typeof statusFilter)}
                className={`flex-1 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all ${
                  statusFilter === t.id ? 'bg-accent text-[#15110a]' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <button
            onClick={downloadPDF}
            disabled={filteredMatches.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 btn-gold rounded-md font-display text-xs uppercase tracking-wider disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>

        {grouped.length === 0 ? (
          <div className="text-center py-16 surface rounded-2xl">
            <Info className="h-10 w-10 mx-auto mb-4" style={{ color: 'var(--faint)' }} />
            <h3 className="text-white font-display font-bold text-lg">No matches found</h3>
            <p className="text-gray-500 text-sm mt-1">Adjust your filters to see results.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([day, dayMatches]) => (
              <div key={day}>
                <div className="day-label mb-3">{day}</div>
                <div className="space-y-2">
                  {dayMatches.map((m) => {
                    const time = new Date(m.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const grp = m.stage === 'LEAGUE' ? `Group ${m.group_name}` : m.stage;
                    const typeLabel =
                      m.stage === 'LEAGUE'
                        ? 'Group Stage'
                        : m.stage === 'QF'
                        ? 'Quarterfinal'
                        : m.stage === 'SF'
                        ? 'Semifinal'
                        : 'Final';
                    const winA = m.is_completed && m.winner_id === m.team_a_id;
                    const winB = m.is_completed && m.winner_id === m.team_b_id;
                    return (
                      <div key={m.id} className="sched-row">
                        <div className="hidden sm:flex flex-col items-center w-16 shrink-0">
                          <span className="font-mono text-sm text-white">{time}</span>
                          <span className="text-[9px] uppercase font-bold tracking-wide" style={{ color: 'var(--faint)' }}>{grp}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <TeamSide id={m.team_a_id} align="right" win={winA} />
                        </div>

                        <div className="shrink-0 px-3">
                          {m.status === 'UPCOMING' ? (
                            <span className="text-xs font-black uppercase" style={{ color: 'var(--faint)' }}>VS</span>
                          ) : (
                            <div className="flex items-center gap-1.5 font-display font-black text-base">
                              <span className={winA ? 'text-accent' : 'text-gray-400'}>{m.team_a_score}</span>
                              <span style={{ color: 'var(--faint)' }}>–</span>
                              <span className={winB ? 'text-accent' : 'text-gray-400'}>{m.team_b_score}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <TeamSide id={m.team_b_id} align="left" win={winB} />
                        </div>

                        <div className="hidden sm:flex items-center justify-end gap-2 w-28 shrink-0">
                          {m.status === 'LIVE' && (
                            <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
                          )}
                          <span
                            className="text-[10px] font-black uppercase tracking-wide"
                            style={{ color: m.status === 'LIVE' ? 'var(--color-danger)' : 'var(--faint)' }}
                          >
                            {typeLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
