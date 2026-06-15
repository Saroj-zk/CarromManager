import { Team, Match, GroupName, StandingRow, NewsItem, TournamentSettings, TournamentStats, MatchStatus, PointsConfig } from './types';

// Seeding Data Definition
export const SEED_TEAMS = [
  // Group A
  { name: "Anbu Label", code: "A1", group_name: "A" as GroupName },
  { name: "CSK Veriyan", code: "A2", group_name: "A" as GroupName },
  { name: "The Rebounders", code: "A3", group_name: "A" as GroupName },
  { name: "Magizhchi", code: "A4", group_name: "A" as GroupName },
  { name: "The Right Strikes", code: "A5", group_name: "A" as GroupName },
  { name: "Dholakpur Kuruku Sandhu", code: "A6", group_name: "A" as GroupName },
  // Group B
  { name: "Daddy Army", code: "B1", group_name: "B" as GroupName },
  { name: "DD Returns", code: "B2", group_name: "B" as GroupName },
  { name: "Pocket King's", code: "B3", group_name: "B" as GroupName },
  { name: "Nanga Rendu Peru", code: "B4", group_name: "B" as GroupName },
  { name: "The Boys", code: "B5", group_name: "B" as GroupName },
  { name: "Ladies Ranuva Pada 💃🏻", code: "B6", group_name: "B" as GroupName },
  // Group C
  { name: "Dosa Gang", code: "C1", group_name: "C" as GroupName },
  { name: "D Block Senthil", code: "C2", group_name: "C" as GroupName },
  { name: "Jackie Chan Army", code: "C3", group_name: "C" as GroupName },
  { name: "TVK Pullainga da!", code: "C4", group_name: "C" as GroupName },
  { name: "Adangapa Rendu Paaru", code: "C5", group_name: "C" as GroupName },
  { name: "Nan Than Pavazha Malli", code: "C6", group_name: "C" as GroupName },
  // Group D
  { name: "$BTC Boys", code: "D1", group_name: "D" as GroupName },
  { name: "Rendey Perukku Thaan Potiye", code: "D2", group_name: "D" as GroupName },
  { name: "Oreyyy Adiii", code: "D3", group_name: "D" as GroupName },
  { name: "Dholu Bolu", code: "D4", group_name: "D" as GroupName },
  { name: "Baley Aalu Nanga!", code: "D5", group_name: "D" as GroupName },
  { name: "Aattama - Thearottama", code: "D6", group_name: "D" as GroupName },
];

export const SEED_NEWS: NewsItem[] = [
  {
    id: "news-1",
    title: "Championship 2026 Kicks Off to a Flying Start",
    summary: "The highly anticipated Pocket Masters Carrom Championship 2026 has officially started, with high-intensity strikes and nail-biting finishes.",
    content: "The annual tournament gathered 24 of the local area's most competitive teams. The atmosphere was electric as defending champions Anbu Label set the standard in their opening match with a clean sweep. Tournament organizers promised a spectacular tournament with state-of-the-art dashboards, live score streaming, and visual bracket analysis. Fans can look forward to 60 group stage matches and intense knockout rounds in the weeks ahead.",
    image_url: "https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=800&auto=format&fit=crop&q=80",
    created_at: new Date('2026-06-10T09:00:00Z').toISOString()
  },
  {
    id: "news-2",
    title: "CSK Veriyan Stuns The Rebounders with White Slam",
    summary: "CSK Veriyan makes history with a rare 'White Slam' in Group A, sending warning signals to other contenders.",
    content: "In a stunning display of precision board-control, CSK Veriyan's lead striker cleared all white carrom men in a single turn, scoring a rare White Slam. The crowd erupted as they clinched the round 25-0 against The Rebounders. Analysts are already calling it the shot of the tournament, and it puts CSK Veriyan in a strong position in Group A standings.",
    image_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80",
    created_at: new Date('2026-06-11T12:00:00Z').toISOString()
  },
  {
    id: "news-3",
    title: "Ladies Ranuva Pada 💃🏻 Dominates Group B",
    summary: "Underdogs Ladies Ranuva Pada sweep their opening fixtures, leading Group B with maximum points.",
    content: "Ladies Ranuva Pada 💃🏻 has taken Group B by storm. In their first three fixtures, they displayed tactical defensive positioning and aggressive pocketing, securing consecutive victories over DD Returns and Daddy Army. Their board difference of +32 currently leads the group, making them a favorites to reach the Quarterfinals.",
    image_url: "https://images.unsplash.com/photo-1543536448-d209d2d13a1c?w=800&auto=format&fit=crop&q=80",
    created_at: new Date('2026-06-11T18:00:00Z').toISOString()
  }
];

// Helper to generate league fixtures
export function generateLeagueFixtures(teams: Team[]): Match[] {
  const matches: Match[] = [];
  const groups: GroupName[] = ['A', 'B', 'C', 'D'];
  let matchId = 1;
  const startDate = new Date('2026-06-11T10:00:00Z');
  
  groups.forEach((groupName) => {
    const groupTeams = teams.filter(t => t.group_name === groupName);
    
    // Berger tables / Round robin pairing
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        const teamA = groupTeams[i];
        const teamB = groupTeams[j];
        
        // Stagger match dates: 1 match every 3 hours
        const matchDate = new Date(startDate.getTime() + (matchId - 1) * 3 * 60 * 60 * 1000);
        
        matches.push({
          id: `match-league-${matchId}`,
          group_name: groupName,
          team_a_id: teamA.id,
          team_b_id: teamB.id,
          team_a_score: 0,
          team_b_score: 0,
          winner_id: null,
          is_completed: false,
          stage: 'LEAGUE',
          status: 'UPCOMING',
          match_date: matchDate.toISOString(),
          round_number: i + 1,
        });
        matchId++;
      }
    }
  });
  
  return matches;
}

// Generate knockout placeholders
export function generateKnockoutPlaceholders(): Match[] {
  const koMatches: Match[] = [];
  const startDate = new Date('2026-06-20T12:00:00Z');
  
  // Quarter Finals
  const qfPairings = [
    { id: 'match-qf1', label: 'QF1' },
    { id: 'match-qf2', label: 'QF2' },
    { id: 'match-qf3', label: 'QF3' },
    { id: 'match-qf4', label: 'QF4' }
  ];
  
  qfPairings.forEach((qf, idx) => {
    koMatches.push({
      id: qf.id,
      group_name: null,
      team_a_id: `t-qf${idx + 1}-a`, // Placeholders
      team_b_id: `t-qf${idx + 1}-b`,
      team_a_score: 0,
      team_b_score: 0,
      winner_id: null,
      is_completed: false,
      stage: 'QF',
      status: 'UPCOMING',
      match_date: new Date(startDate.getTime() + idx * 4 * 60 * 60 * 1000).toISOString(),
    });
  });

  // Semi Finals
  koMatches.push({
    id: 'match-sf1',
    group_name: null,
    team_a_id: 't-sf1-a',
    team_b_id: 't-sf1-b',
    team_a_score: 0,
    team_b_score: 0,
    winner_id: null,
    is_completed: false,
    stage: 'SF',
    status: 'UPCOMING',
    match_date: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  });

  koMatches.push({
    id: 'match-sf2',
    group_name: null,
    team_a_id: 't-sf2-a',
    team_b_id: 't-sf2-b',
    team_a_score: 0,
    team_b_score: 0,
    winner_id: null,
    is_completed: false,
    stage: 'SF',
    status: 'UPCOMING',
    match_date: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
  });

  // Final
  koMatches.push({
    id: 'match-final',
    group_name: null,
    team_a_id: 't-final-a',
    team_b_id: 't-final-b',
    team_a_score: 0,
    team_b_score: 0,
    winner_id: null,
    is_completed: false,
    stage: 'FINAL',
    status: 'UPCOMING',
    match_date: new Date(startDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return koMatches;
}

// All matches start fresh – UPCOMING, 0-0. No pre-seeded scores.
export function seedScores(_teams: Team[], matches: Match[]): Match[] {
  return matches; // Return as-is: all UPCOMING, scores 0-0
}

// Resolve the effective scoring from tournament settings.
export function pointsFromSettings(s: {
  points_per_win?: number;
  points_per_draw?: number;
  draw_points_enabled?: boolean;
}): PointsConfig {
  return {
    win: typeof s.points_per_win === 'number' ? s.points_per_win : 2,
    draw:
      typeof s.points_per_draw === 'number'
        ? s.points_per_draw
        : s.draw_points_enabled
        ? 1
        : 0,
  };
}

// Calculate Standings Row for a specific group
export function calculateStandings(teams: Team[], matches: Match[], points: PointsConfig): StandingRow[] {
  const standingsMap: { [teamId: string]: StandingRow } = {};
  
  // Initialize
  teams.forEach((team) => {
    standingsMap[team.id] = {
      position: 1,
      team_id: team.id,
      team_name: team.name,
      team_code: team.code,
      played: 0,
      won: 0,
      lost: 0,
      drawn: 0,
      points: 0,
      board_difference: 0,
      form: [],
      qualified: false,
    };
  });
  
  // Filter only league matches that are completed
  const completedLeagueMatches = matches.filter(m => m.stage === 'LEAGUE' && m.is_completed);
  
  // Sort matches by date to calculate form chronologically
  const sortedMatches = [...completedLeagueMatches].sort(
    (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
  );
  
  sortedMatches.forEach((match) => {
    const tA = standingsMap[match.team_a_id];
    const tB = standingsMap[match.team_b_id];
    
    if (!tA || !tB) return;
    
    tA.played += 1;
    tB.played += 1;
    
    const diff = match.team_a_score - match.team_b_score;
    tA.board_difference += diff;
    tB.board_difference -= diff;
    
    if (diff > 0) {
      // Team A won
      tA.won += 1;
      tA.points += points.win;
      tA.form.push('W');

      tB.lost += 1;
      tB.form.push('L');
    } else if (diff < 0) {
      // Team B won
      tB.won += 1;
      tB.points += points.win;
      tB.form.push('W');

      tA.lost += 1;
      tA.form.push('L');
    } else {
      // Draw
      tA.drawn += 1;
      tB.drawn += 1;
      tA.form.push('D');
      tB.form.push('D');
      tA.points += points.draw;
      tB.points += points.draw;
    }
  });
  
  // Convert map to array
  const standings = Object.values(standingsMap);
  
  // Sort standings: Group first, then Points desc, then Board Difference desc, then Won desc, then Alphabetical
  standings.sort((a, b) => {
    const teamA = teams.find(t => t.id === a.team_id)!;
    const teamB = teams.find(t => t.id === b.team_id)!;
    
    if (teamA.group_name !== teamB.group_name) {
      return teamA.group_name.localeCompare(teamB.group_name);
    }
    
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    
    if (b.board_difference !== a.board_difference) {
      return b.board_difference - a.board_difference;
    }
    
    if (b.won !== a.won) {
      return b.won - a.won;
    }
    
    return a.team_name.localeCompare(b.team_name);
  });
  
  // Assign positions and qualification status per group
  const groupCounts: { [group: string]: number } = { A: 0, B: 0, C: 0, D: 0 };
  
  standings.forEach((row) => {
    const team = teams.find(t => t.id === row.team_id)!;
    groupCounts[team.group_name] += 1;
    row.position = groupCounts[team.group_name];
    
    // Top 2 qualify
    if (row.position <= 2) {
      row.qualified = true;
    }
  });
  
  return standings;
}

// Resolve Knockout matches from live standings and completed results.
//
// This is idempotent: each knockout slot is re-derived from scratch every call,
// so the bracket tracks live results instead of freezing on the first edit. A
// quarter-final slot only locks to a real team once that group's league stage
// is fully played; until then it keeps its `t-…` placeholder so the UI shows
// "Winner Group A" etc. Semi-final and final slots lock only once the feeding
// match is completed.
//
// Returns ALL matches (league + resolved knockouts) so callers can safely
// replace their match list with the result.
export function getResolvedKnockouts(teams: Team[], matches: Match[], points: PointsConfig): Match[] {
  const leagueMatches = matches.filter(m => m.stage === 'LEAGUE');
  const koMatches = matches.filter(m => m.stage !== 'LEAGUE');

  const standings = calculateStandings(teams, leagueMatches, points);

  // A group is "decided" once every one of its league fixtures is completed.
  const isGroupComplete = (group: GroupName): boolean => {
    const groupGames = leagueMatches.filter(m => m.group_name === group);
    return groupGames.length > 0 && groupGames.every(m => m.is_completed);
  };

  const getGroupWinners = (group: GroupName) => {
    const groupStandings = standings.filter(s => {
      const t = teams.find(team => team.id === s.team_id);
      return t?.group_name === group;
    });
    return {
      winner: groupStandings[0]?.team_id || null,
      runnerUp: groupStandings[1]?.team_id || null,
    };
  };

  // A group winner/runner-up only feeds the bracket once the group is decided.
  const qfTeam = (group: GroupName, slot: 'winner' | 'runnerUp', placeholder: string) => {
    if (!isGroupComplete(group)) return placeholder;
    const g = getGroupWinners(group);
    return g[slot] || placeholder;
  };

  // Winner of a completed knockout match, else the placeholder.
  const koWinner = (matchId: string, placeholder: string) => {
    const m = koMatches.find(x => x.id === matchId);
    if (m && m.is_completed && m.winner_id && !m.winner_id.startsWith('t-')) {
      return m.winner_id;
    }
    return placeholder;
  };

  const slots: Record<string, { a: string; b: string }> = {
    'match-qf1': { a: qfTeam('A', 'winner', 't-qf1-a'), b: qfTeam('B', 'runnerUp', 't-qf1-b') },
    'match-qf2': { a: qfTeam('B', 'winner', 't-qf2-a'), b: qfTeam('A', 'runnerUp', 't-qf2-b') },
    'match-qf3': { a: qfTeam('C', 'winner', 't-qf3-a'), b: qfTeam('D', 'runnerUp', 't-qf3-b') },
    'match-qf4': { a: qfTeam('D', 'winner', 't-qf4-a'), b: qfTeam('C', 'runnerUp', 't-qf4-b') },
    'match-sf1': { a: koWinner('match-qf1', 't-sf1-a'), b: koWinner('match-qf2', 't-sf1-b') },
    'match-sf2': { a: koWinner('match-qf3', 't-sf2-a'), b: koWinner('match-qf4', 't-sf2-b') },
    'match-final': { a: koWinner('match-sf1', 't-final-a'), b: koWinner('match-sf2', 't-final-b') },
  };

  const resolvedKoMatches = koMatches.map(m => {
    // Manually locked matches keep their admin-assigned teams.
    if (m.locked) return m;
    const slot = slots[m.id];
    if (!slot) return m;
    return { ...m, team_a_id: slot.a, team_b_id: slot.b };
  });

  return [...leagueMatches, ...resolvedKoMatches];
}

// Generate tournament statistics
export function calculateStats(teams: Team[], matches: Match[], points: PointsConfig): TournamentStats {
  const standings = calculateStandings(teams, matches.filter(m => m.stage === 'LEAGUE'), points);
  
  const totalMatches = matches.length;
  const matchesPlayed = matches.filter(m => m.is_completed).length;
  const totalTeams = teams.length;
  
  // Find team with most wins (league + knockouts)
  const winCounts: { [teamId: string]: number } = {};
  teams.forEach(t => { winCounts[t.id] = 0; });
  matches.forEach(m => {
    if (m.is_completed && m.winner_id) {
      winCounts[m.winner_id] = (winCounts[m.winner_id] || 0) + 1;
    }
  });
  
  let mostWinsTeamId: string | null = null;
  let maxWins = -1;
  Object.entries(winCounts).forEach(([tid, count]) => {
    if (count > maxWins) {
      maxWins = count;
      mostWinsTeamId = tid;
    }
  });
  const mostWinsTeam = mostWinsTeamId ? {
    name: teams.find(t => t.id === mostWinsTeamId)?.name || 'Unknown',
    count: maxWins
  } : null;
  
  // Find longest win streak
  // We sort all completed matches chronologically and trace streaks
  const completedMatchesSorted = [...matches]
    .filter(m => m.is_completed)
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
    
  const streaks: { [teamId: string]: number } = {};
  const maxStreaks: { [teamId: string]: number } = {};
  teams.forEach(t => {
    streaks[t.id] = 0;
    maxStreaks[t.id] = 0;
  });
  
  completedMatchesSorted.forEach(m => {
    const w = m.winner_id;
    const l = m.winner_id === m.team_a_id ? m.team_b_id : m.team_a_id;
    
    if (w) {
      streaks[w] += 1;
      if (streaks[w] > maxStreaks[w]) {
        maxStreaks[w] = streaks[w];
      }
      streaks[l] = 0; // Reset streak of loser
    } else {
      // Draw resets streak for both
      streaks[m.team_a_id] = 0;
      streaks[m.team_b_id] = 0;
    }
  });
  
  let bestStreakTeamId: string | null = null;
  let maxStreak = -1;
  Object.entries(maxStreaks).forEach(([tid, streak]) => {
    if (streak > maxStreak) {
      maxStreak = streak;
      bestStreakTeamId = tid;
    }
  });
  const longestWinStreak = bestStreakTeamId ? {
    name: teams.find(t => t.id === bestStreakTeamId)?.name || 'Unknown',
    count: maxStreak
  } : null;
  
  // Highest board difference
  let highestBdRow = standings.length > 0 ? standings.reduce((max, row) => row.board_difference > max.board_difference ? row : max, standings[0]) : null;
  const highestBoardDifference = highestBdRow ? {
    name: highestBdRow.team_name,
    value: highestBdRow.board_difference
  } : null;
  
  // Best group (highest average points per team)
  const groupPoints: { [group: string]: number } = { A: 0, B: 0, C: 0, D: 0 };
  standings.forEach(row => {
    const t = teams.find(team => team.id === row.team_id)!;
    groupPoints[t.group_name] += row.points;
  });
  let bestGroupName = 'A';
  let maxAvgPoints = -1;
  Object.entries(groupPoints).forEach(([g, pts]) => {
    const avg = pts / 6; // 6 teams per group
    if (avg > maxAvgPoints) {
      maxAvgPoints = avg;
      bestGroupName = g;
    }
  });
  const bestGroup = {
    name: `Group ${bestGroupName}`,
    avgPoints: parseFloat(maxAvgPoints.toFixed(2))
  };
  
  // Qualification Probability: Rough math based on current points and remaining matches
  const qualificationProbability: { [teamId: string]: number } = {};
  teams.forEach(t => {
    const row = standings.find(s => s.team_id === t.id);
    if (!row) {
      qualificationProbability[t.id] = 0;
      return;
    }
    
    // If they played all 5 matches, probability is either 100% (if top 2) or 0%
    if (row.played === 5) {
      qualificationProbability[t.id] = row.qualified ? 100 : 0;
    } else {
      // Estimated probability:
      // A simple formula based on current points and position
      const groupStandings = standings.filter(s => {
        const team = teams.find(x => x.id === s.team_id);
        return team?.group_name === t.group_name;
      });
      const index = groupStandings.findIndex(s => s.team_id === t.id);
      
      let prob = 50;
      if (index === 0) prob = 95;
      else if (index === 1) prob = 80;
      else if (index === 2) prob = 60;
      else if (index === 3) prob = 40;
      else if (index === 4) prob = 15;
      else prob = 5;
      
      // Adjust based on remaining games and points
      const remainingGames = 5 - row.played;
      const potentialMaxPoints = row.points + remainingGames * 2;
      
      // If even with max points they can't catch the 2nd place team's current points, they are out (0%)
      const secondPlacePoints = groupStandings[1]?.points || 0;
      if (potentialMaxPoints < secondPlacePoints) {
        prob = 0;
      }
      
      qualificationProbability[t.id] = prob;
    }
  });
  
  return {
    totalMatches,
    matchesPlayed,
    totalTeams,
    mostWinsTeam,
    longestWinStreak,
    highestBoardDifference,
    bestGroup,
    qualificationProbability
  };
}

// DB version – bump this string whenever seed data changes to force a fresh reseed
const DB_VERSION = 'v2-fresh-start';

// Local Database State Operations
export const LocalDB = {
  _checkVersion() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('pocket_masters_db_version');
    if (saved !== DB_VERSION) {
      // Wipe all old cached data so fresh seed runs
      localStorage.removeItem('pocket_masters_teams');
      localStorage.removeItem('pocket_masters_matches');
      localStorage.removeItem('pocket_masters_settings');
      localStorage.removeItem('pocket_masters_news');
      localStorage.setItem('pocket_masters_db_version', DB_VERSION);
    }
  },

  getTeams(): Team[] {
    if (typeof window === 'undefined') return [];
    this._checkVersion();
    const stored = localStorage.getItem('pocket_masters_teams');
    if (!stored) {
      const seeded = SEED_TEAMS.map((t) => ({
        id: `team-${t.code.toLowerCase()}`,
        name: t.name,
        code: t.code,
        group_name: t.group_name,
        logo_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(t.name)}`,
      }));
      localStorage.setItem('pocket_masters_teams', JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(stored);
  },

  getMatches(teams: Team[]): Match[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('pocket_masters_matches');
    if (!stored) {
      const league = generateLeagueFixtures(teams);
      const withScores = seedScores(teams, league); // now returns all UPCOMING 0-0
      const knockouts = generateKnockoutPlaceholders();
      const allMatches = [...withScores, ...knockouts];
      localStorage.setItem('pocket_masters_matches', JSON.stringify(allMatches));
      return allMatches;
    }
    return JSON.parse(stored);
  },
  
  getSettings(): TournamentSettings {
    if (typeof window === 'undefined') return { draw_points_enabled: false, passcode: 'PocketMasters2026', tournament_stage: 'LEAGUE' };
    const stored = localStorage.getItem('pocket_masters_settings');
    if (!stored) {
      const defaultSettings: TournamentSettings = {
        draw_points_enabled: false,
        passcode: 'PocketMasters2026',
        tournament_stage: 'LEAGUE'
      };
      localStorage.setItem('pocket_masters_settings', JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    return JSON.parse(stored);
  },

  getNews(): NewsItem[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('pocket_masters_news');
    if (!stored) {
      localStorage.setItem('pocket_masters_news', JSON.stringify(SEED_NEWS));
      return SEED_NEWS;
    }
    return JSON.parse(stored);
  },
  
  saveMatches(matches: Match[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('pocket_masters_matches', JSON.stringify(matches));
  },
  
  saveSettings(settings: TournamentSettings) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('pocket_masters_settings', JSON.stringify(settings));
  },

  saveNews(news: NewsItem[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('pocket_masters_news', JSON.stringify(news));
  },

  resetTournament(teams: Team[]) {
    if (typeof window === 'undefined') return;
    const league = generateLeagueFixtures(teams);
    const knockouts = generateKnockoutPlaceholders();
    const allMatches = [...league, ...knockouts];
    
    localStorage.setItem('pocket_masters_matches', JSON.stringify(allMatches));
    return allMatches;
  }
};
