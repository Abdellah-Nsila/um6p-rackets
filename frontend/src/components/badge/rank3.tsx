import { Trophy } from 'lucide-react';

export default function Rank3Badge() {
    return (
    <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-orange-40 text-brand-orange border-brand-orange/20 uppercase tracking-wider">
        <Trophy className="w-3 h-3" />
        <span>RANK #3</span>
    </div>
    );
}