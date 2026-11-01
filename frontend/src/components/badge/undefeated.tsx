import { Flame } from 'lucide-react';

export default function UndefeatedBadge() {
  return (
    <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200 uppercase tracking-wider">
      <Flame className="w-3 h-3" />
      <span>UNDEFEATED</span>
    </div>
  );
}