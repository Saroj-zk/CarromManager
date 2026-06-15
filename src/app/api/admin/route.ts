import { NextRequest, NextResponse } from 'next/server';
import {
  checkPasscode,
  getPublicState,
  updateMatchScore,
  updateSettings,
  addNews,
  deleteNews,
  updateTeam,
  resetTournament,
  importState,
  generateBracket,
  setBracketTeams,
} from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * Single authenticated admin endpoint. Body shape: `{ action, payload }`.
 * Every action except `login` requires a valid `x-admin-passcode` header.
 */
export async function POST(request: NextRequest) {
  let body: { action?: string; payload?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const { action, payload = {} } = body;

  // `login` validates credentials and does not require a prior header.
  if (action === 'login') {
    const ok = await checkPasscode(String(payload.passcode ?? ''));
    return ok
      ? json({ ok: true })
      : json({ ok: false, error: 'Invalid passcode.' }, 401);
  }

  // All other actions are gated on the passcode header.
  const passcode = request.headers.get('x-admin-passcode') ?? '';
  if (!(await checkPasscode(passcode))) {
    return json({ error: 'Unauthorized.' }, 401);
  }

  switch (action) {
    case 'score': {
      const { matchId, scoreA, scoreB, status, matchDate } = payload as {
        matchId: string;
        scoreA: number;
        scoreB: number;
        status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
        matchDate?: string;
      };
      if (!matchId) return json({ error: 'matchId is required.' }, 400);
      await updateMatchScore(matchId, Number(scoreA), Number(scoreB), status, matchDate);
      break;
    }

    case 'settings': {
      await updateSettings(payload);
      break;
    }

    case 'news:create': {
      const { title, summary, content, imageUrl } = payload as {
        title: string;
        summary: string;
        content: string;
        imageUrl?: string;
      };
      if (!title || !summary || !content) {
        return json({ error: 'title, summary and content are required.' }, 400);
      }
      await addNews(title, summary, content, imageUrl);
      break;
    }

    case 'news:delete': {
      const { id } = payload as { id: string };
      if (!id) return json({ error: 'id is required.' }, 400);
      await deleteNews(id);
      break;
    }

    case 'team': {
      const { id, name, logoUrl, players } = payload as {
        id: string;
        name: string;
        logoUrl: string;
        players?: string[];
      };
      if (!id) return json({ error: 'id is required.' }, 400);
      await updateTeam(
        id,
        String(name ?? ''),
        String(logoUrl ?? ''),
        Array.isArray(players) ? players : undefined
      );
      break;
    }

    case 'reset': {
      await resetTournament();
      break;
    }

    case 'bracket:generate': {
      await generateBracket();
      break;
    }

    case 'bracket:set': {
      const { matchId, teamAId, teamBId } = payload as {
        matchId: string;
        teamAId: string;
        teamBId: string;
      };
      if (!matchId) return json({ error: 'matchId is required.' }, 400);
      await setBracketTeams(matchId, String(teamAId ?? ''), String(teamBId ?? ''));
      break;
    }

    case 'import': {
      await importState(payload);
      break;
    }

    default:
      return json({ error: `Unknown action: ${action}` }, 400);
  }

  // Return the fresh public state so the client updates immediately.
  return json(await getPublicState());
}
