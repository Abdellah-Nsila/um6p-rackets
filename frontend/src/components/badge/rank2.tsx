import { Trophy } from 'lucide-react';

export default function Rank2Badge() {
    return (
    <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-brand-teal border-slate-200 uppercase tracking-wider">
        <Trophy className="w-3 h-3" />
        <span>RANK #2</span>
    </div>
    );
}