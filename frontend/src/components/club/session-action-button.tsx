'use client';

import { Button } from '../ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import type { SessionView } from '@/types/contracts/club';

interface ActionButtonProps {
    session: SessionView;
    onJoin: (session: SessionView) => void;
    onCancel: (sessionId: number) => void;
    isJoining: boolean;
    isCancelling: boolean;
    }

    export default function SessionActionButton({
    session,
    onJoin,
    onCancel,
    isJoining,
    isCancelling,
    }: ActionButtonProps) {
    const baseClass = "w-full rounded-xl font-semibold text-sm h-9 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm";

    if (session.state === 'past') {
        if (session.is_joined) {
        return (
            <Button disabled variant="outline" className={`${baseClass} border-accent/40 text-accent opacity-75 shadow-none`}>
            <Check className="w-4 h-4" /> Joined
            </Button>
        );
        }
        return <Button disabled variant="outline" className={`${baseClass} opacity-60 text-muted-foreground shadow-none`}>Past</Button>;
    }

    if (session.state === 'cancelled') {
        return <Button disabled variant="outline" className={`${baseClass} opacity-60 text-destructive border-destructive/30 shadow-none`}>Cancelled</Button>;
    }

    if (session.is_joined) {
        return (
        <Button
            disabled={isCancelling}
            variant="outline"
            onClick={() => onCancel(session.id)}
            className={`${baseClass} border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive group shadow-none`}
        >
            {isCancelling ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Cancelling...</span></>
            ) : (
            <>
                <X className="w-4 h-4" />
                <span>Cancel</span>
            </>
            )}
        </Button>
        );
    }

    switch (session.state) {
        case 'full':
        return <Button disabled variant="outline" className={`${baseClass} opacity-60 shadow-none`}>Full</Button>;
        case 'ongoing':
        return <Button disabled className={`${baseClass} bg-amber-500 text-white hover:bg-amber-600`}>Ongoing</Button>;
        case 'open':
        default:
        return (
            <Button
            disabled={isJoining}
            onClick={() => onJoin(session)}
            className={`${baseClass} bg-brand-orange text-white hover:bg-brand-orange/90`}
            >
            {isJoining ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Joining...</span></> : 'Join'}
            </Button>
        );
    }
}
