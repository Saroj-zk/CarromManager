'use client';

import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { Team } from '@/lib/types';
import { useTournament } from '@/context/TournamentContext';
import { Trophy } from 'lucide-react';

// Feeder → destination connections (adjacent-pair seeding).
const CONNECTIONS: [string, string][] = [
  ['match-qf1', 'match-sf1'],
  ['match-qf2', 'match-sf1'],
  ['match-qf3', 'match-sf2'],
  ['match-qf4', 'match-sf2'],
  ['match-sf1', 'match-final'],
  ['match-sf2', 'match-final'],
  ['match-final', 'champion'],
];

const PLACEHOLDER_LABELS: Record<string, string> = {
  'qf1-a': 'Winner Group A', 'qf1-b': 'Runner-Up Group B',
  'qf2-a': 'Winner Group B', 'qf2-b': 'Runner-Up Group A',
  'qf3-a': 'Winner Group C', 'qf3-b': 'Runner-Up Group D',
  'qf4-a': 'Winner Group D', 'qf4-b': 'Runner-Up Group C',
  'sf1-a': 'Winner QF1', 'sf1-b': 'Winner QF2',
  'sf2-a': 'Winner QF3', 'sf2-b': 'Winner QF4',
  'final-a': 'Winner SF1', 'final-b': 'Winner SF2',
};

function placeholderLabel(id: string): string {
  for (const key of Object.keys(PLACEHOLDER_LABELS)) {
    if (id.includes(key)) return PLACEHOLDER_LABELS[key];
  }
  return 'TBD';
}

export default function BracketView() {
  const { matches, teams } = useTournament();
  const [activeTab, setActiveTab] = useState<'QF' | 'SF' | 'FINAL'>('QF');
  const [predictions, setPredictions] = useState<{ [matchId: string]: string }>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = useState<string[]>([]);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const getTeam = (id: string): Team | undefined => teams.find((t) => t.id === id);

  // Resolve a slot, honouring real results first, then user predictions.
  const getResolvedTeamId = (matchId: string, slot: 'A' | 'B'): string => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return '';
    const initialId = slot === 'A' ? match.team_a_id : match.team_b_id;
    if (!initialId.startsWith('t-')) return initialId;

    const parentMap: Record<string, [string, string]> = {
      'match-sf1': ['match-qf1', 'match-qf2'],
      'match-sf2': ['match-qf3', 'match-qf4'],
      'match-final': ['match-sf1', 'match-sf2'],
    };
    if (parentMap[matchId]) {
      const parentId = slot === 'A' ? parentMap[matchId][0] : parentMap[matchId][1];
      const parent = matches.find((m) => m.id === parentId);
      if (parent?.is_completed && parent.winner_id) return parent.winner_id;
      if (predictions[parentId]) return predictions[parentId];
    }
    return initialId;
  };

  const getWinner = (matchId: string): string | null => {
    const m = matches.find((match) => match.id === matchId);
    if (!m) return null;
    if (m.is_completed) return m.winner_id || null;
    return predictions[matchId] || null;
  };

  const handlePredict = (matchId: string, teamId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match || match.is_completed) return;
    if (teamId.startsWith('t-')) return;
    setPredictions((prev) => {
      const next = { ...prev };
      if (next[matchId] === teamId) delete next[matchId];
      else next[matchId] = teamId;
      return next;
    });
  };

  // Measure card positions and draw elbow connectors as SVG paths.
  const recompute = useCallback(() => {
    const cont = containerRef.current;
    if (!cont) return;
    const cr = cont.getBoundingClientRect();
    setDims({ w: cont.clientWidth, h: cont.clientHeight });
    const next: string[] = [];
    for (const [from, to] of CONNECTIONS) {
      const a = cardRefs.current[from];
      const b = cardRefs.current[to];
      if (!a || !b) continue;
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const sx = ar.right - cr.left;
      const sy = ar.top + ar.height / 2 - cr.top;
      const tx = br.left - cr.left;
      const ty = br.top + br.height / 2 - cr.top;
      const mx = sx + (tx - sx) / 2;
      next.push(`M ${sx} ${sy} H ${mx} V ${ty} H ${tx}`);
    }
    setPaths(next);
  }, []);

  useLayoutEffect(() => {
    recompute();
    const ro = new ResizeObserver(recompute);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, [recompute, matches, predictions]);

  const championId = getWinner('match-final');
  const championTeam = championId && !championId.startsWith('t-') ? getTeam(championId) : null;

  // ── A single matchup card ───────────────────────────────────────────────
  const renderMatch = (matchId: string, withRef = false) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return null;

    const idA = getResolvedTeamId(matchId, 'A');
    const idB = getResolvedTeamId(matchId, 'B');
    const tA = getTeam(idA);
    const tB = getTeam(idB);
    const phA = idA.startsWith('t-');
    const phB = idB.startsWith('t-');
    const nameA = phA ? placeholderLabel(idA) : tA?.name || 'TBD';
    const nameB = phB ? placeholderLabel(idB) : tB?.name || 'TBD';
    const winner = getWinner(matchId);
    const showScore = match.status !== 'UPCOMING';
    const canPredict = !match.is_completed && !phA && !phB;

    const teamRow = (id: string, name: string, ph: boolean, team: Team | undefined, score: number) => {
      const isWin = match.is_completed && match.winner_id === id;
      const isPred = !match.is_completed && winner === id;
      return (
        <div
          onClick={() => handlePredict(matchId, id)}
          className={`match-team ${isWin ? 'is-winner' : ''} ${isPred ? 'is-predicted' : ''} ${
            canPredict ? 'is-clickable' : ''
          }`}
        >
          {!ph && team?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={team.logo_url} alt="" className="h-5 w-5 rounded-full shrink-0" />
          ) : (
            <div className="h-5 w-5 rounded-full bg-[#23252e] shrink-0" />
          )}
          <span className="match-team__name">{name}</span>
          {showScore && <span className="match-team__score">{score}</span>}
        </div>
      );
    };

    return (
      <div
        ref={withRef ? (el) => { cardRefs.current[matchId] = el; } : undefined}
        className="match-card bracket-matchup__card"
      >
        {teamRow(idA, nameA, phA, tA, match.team_a_score)}
        {teamRow(idB, nameB, phB, tB, match.team_b_score)}
      </div>
    );
  };

  const Column = ({ title, ids }: { title: string; ids: string[] }) => (
    <div className="bracket-col">
      <div className="bracket-col__title">
        <span className="round-header">{title}</span>
      </div>
      <div className="bracket-col__body">
        {ids.map((id) => (
          <div key={id} className="bracket-matchup">
            {renderMatch(id, true)}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* Desktop bracket with connectors */}
      <div ref={containerRef} className="relative hidden md:block">
        <svg
          className="absolute inset-0 pointer-events-none"
          width={dims.w}
          height={dims.h}
          aria-hidden
        >
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={2} />
          ))}
        </svg>

        <div className="bracket relative z-10">
          <Column title="Quarterfinals" ids={['match-qf1', 'match-qf2', 'match-qf3', 'match-qf4']} />
          <Column title="Semifinals" ids={['match-sf1', 'match-sf2']} />
          <Column title="Finals" ids={['match-final']} />

          {/* Champion column, connected to the Final card */}
          <div className="bracket-col">
            <div className="bracket-col__title">
              <span className="round-header">Champion</span>
            </div>
            <div className="bracket-col__body">
              <div className="bracket-matchup">
                <div
                  ref={(el) => { cardRefs.current['champion'] = el; }}
                  className={`w-full rounded-[10px] border p-4 flex items-center gap-3 ${
                    championTeam ? 'border-accent/50 bg-accent/5' : 'border-dashed border-white/15 bg-[#15161c]'
                  }`}
                >
                  <Trophy className={`h-7 w-7 shrink-0 ${championTeam ? 'text-accent' : 'text-[#3a3d46]'}`} />
                  {championTeam ? (
                    <div className="flex items-center gap-2 min-w-0">
                      {championTeam.logo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={championTeam.logo_url} alt="" className="h-6 w-6 rounded-full shrink-0" />
                      )}
                      <span className="font-display font-black text-white truncate">{championTeam.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold" style={{ color: 'var(--faint)' }}>
                      Awaiting champion
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: tabbed columns */}
      <div className="md:hidden">
        <div className="flex bg-[#15161c] p-1 rounded-xl border border-white/8 mb-6">
          {(['QF', 'SF', 'FINAL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg font-display text-xs font-bold uppercase transition-all ${
                activeTab === tab ? 'bg-accent text-[#15110a]' : 'text-gray-400'
              }`}
            >
              {tab === 'FINAL' ? 'Final' : tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {activeTab === 'QF' &&
            ['match-qf1', 'match-qf2', 'match-qf3', 'match-qf4'].map((id) => (
              <div key={id}>{renderMatch(id)}</div>
            ))}
          {activeTab === 'SF' &&
            ['match-sf1', 'match-sf2'].map((id) => <div key={id}>{renderMatch(id)}</div>)}
          {activeTab === 'FINAL' && (
            <div className="space-y-6">
              {renderMatch('match-final')}
              {championTeam && (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-accent/30 bg-accent/5 p-5 text-center">
                  <Trophy className="h-9 w-9 text-accent" />
                  <span className="text-[10px] text-accent font-black uppercase tracking-widest">Champion</span>
                  <span className="font-display font-black text-white">{championTeam.name}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
