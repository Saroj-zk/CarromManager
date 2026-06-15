import Link from 'next/link';
import { Trophy, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen text-center px-6"
      style={{ background: 'var(--background)' }}
    >
      <Trophy className="h-16 w-16 text-accent animate-float-trophy mb-6" />
      <p className="font-display font-black text-6xl sm:text-8xl text-white tracking-tight">
        404
      </p>
      <h1 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-wide mt-2">
        Off the board
      </h1>
      <p className="text-gray-400 text-sm font-medium max-w-sm mt-3">
        That page missed the pocket. Let&apos;s get you back to the tournament.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-slate-950 font-display font-black text-sm uppercase tracking-wider hover:bg-white transition-all shadow-lg cursor-pointer"
      >
        <Home className="h-4 w-4" />
        Back to Home
      </Link>
    </div>
  );
}
