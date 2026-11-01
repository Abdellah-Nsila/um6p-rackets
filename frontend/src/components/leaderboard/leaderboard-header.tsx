import { BarChart2 } from 'lucide-react';

export default function LeaderboardHeader({ slug }: { slug: string }) {
  return (
    <div className="w-full max-w-6xl mb-8 sm:mb-12 flex flex-col items-start">
      <div className="flex items-center gap-2 text-brand-ink mb-4">
        <BarChart2 className="w-8 h-8" strokeWidth={3} />
        <h1 className="text-2xl font-black italic sm:text-4xl uppercase tracking-tight">
          <span className="text-brand-ink">
            {slug}
          </span>
          <span className="text-brand-orange"> LEADERBOARD</span>
        </h1>
      </div>
      <div className="max-w-full w-48 sm:w-72 h-1.5 bg-brand-ink rounded-full"></div>
    </div>
  );
}