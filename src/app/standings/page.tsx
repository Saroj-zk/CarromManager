'use client';

import React, { useState } from 'react';
import { useTournament } from '@/context/TournamentContext';
import Navbar from '@/components/Navbar';
import PageHero from '@/components/PageHero';
import SectionTabs, { buildEventTabs } from '@/components/SectionTabs';
import SiteFooter from '@/components/SiteFooter';
import { calculateStandings } from '@/lib/store';
import { GroupName } from '@/lib/types';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function Standings() {
  const { teams, matches, settings } = useTournament();
  const [exporting, setExporting] = useState(false);

  const leagueMatches = matches.filter((m) => m.stage === 'LEAGUE');
  const standings = calculateStandings(teams, leagueMatches, settings.draw_points_enabled);
  const groups: GroupName[] = ['A', 'B', 'C', 'D'];

  const exportAsImage = async () => {
    const element = document.getElementById('standings-capture');
    if (!element) return;
    try {
      setExporting(true);
      await new Promise((r) => setTimeout(r, 250));
      const canvas = await html2canvas(element, {
        backgroundColor: '#0a0a0e',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = 'Pocket_Masters_Standings_2026.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setExporting(false);
    }
  };

  const renderGroupTable = (group: GroupName) => {
    const rows = standings.filter((row) => {
      const t = teams.find((t) => t.id === row.team_id);
      return t?.group_name === group;
    });

    return (
      <div key={group} className="surface rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <h3 className="font-display font-black text-base text-white uppercase tracking-wider">
            Group {group}
          </h3>
          <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--faint)' }}>
            League
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-none">
          <table className="rank-table">
            <thead>
              <tr>
                <th className="w-10 text-center">#</th>
                <th>Team</th>
                <th className="text-center">P</th>
                <th className="text-center">W</th>
                <th className="text-center">L</th>
                <th className="text-center">BD</th>
                <th className="text-center">Pts</th>
                <th className="text-center hidden md:table-cell">Form</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const team = teams.find((t) => t.id === row.team_id);
                const top2 = row.position <= 2;
                return (
                  <tr key={row.team_id} style={{ borderLeft: `3px solid ${top2 ? 'var(--gold)' : 'transparent'}` }}>
                    <td className="text-center">
                      <span className={`font-display font-black text-sm ${top2 ? 'text-accent' : ''}`} style={!top2 ? { color: 'var(--faint)' } : {}}>
                        {row.position}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {team?.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={team.logo_url} className="h-6 w-6 rounded-full" alt="" />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-[#23252e]" />
                        )}
                        <div className="min-w-0">
                          <span className="block font-semibold text-white truncate max-w-[160px]">{row.team_name}</span>
                          <span className="block text-[10px] uppercase font-bold" style={{ color: 'var(--faint)' }}>{row.team_code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-center font-mono text-gray-300">{row.played}</td>
                    <td className="text-center font-mono text-success">{row.won}</td>
                    <td className="text-center font-mono text-danger">{row.lost}</td>
                    <td className="text-center font-mono">
                      <span className={row.board_difference > 0 ? 'text-success' : row.board_difference < 0 ? 'text-danger' : 'text-gray-400'}>
                        {row.board_difference > 0 ? `+${row.board_difference}` : row.board_difference}
                      </span>
                    </td>
                    <td className="text-center font-mono font-black text-accent text-base">{row.points}</td>
                    <td className="hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {row.form.length > 0 ? (
                          row.form.slice(-5).map((f, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center justify-center h-5 w-5 rounded text-[9px] font-black ${
                                f === 'W' ? 'bg-success/20 text-success' : f === 'L' ? 'bg-danger/20 text-danger' : 'bg-white/5 text-gray-400'
                              }`}
                            >
                              {f}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--faint)' }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <PageHero
        title="Standings"
        status="Live"
        date="Jun–Jul"
        region="Pocket Masters 2026"
        subtitle="League points table. Top 2 of each group (gold) advance to the knockout stage."
      />
      <SectionTabs tabs={buildEventTabs('Standings')} />

      <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        <div className="flex justify-end mb-6">
          <button
            onClick={exportAsImage}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-5 py-2.5 btn-gold rounded-md font-display text-xs uppercase tracking-wider disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export as Image'}
          </button>
        </div>

        <div id="standings-capture" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groups.map((g) => renderGroupTable(g))}
        </div>

        <div className="mt-8 text-center text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--faint)' }}>
          P = Played · W = Won · L = Lost · BD = Board Difference · Pts = Points
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
