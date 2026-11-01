'use client';

import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, Calendar, CheckCircle2, XCircle } from 'lucide-react';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import {
    useJoinRequests,
    useAcceptJoinRequest,
    useRejectJoinRequest,
} from '@/hooks/use-club-members';

interface AcceptJoinModalProps {
    clubSlug: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function AcceptJoinModal({ clubSlug, isOpen, onClose }: AcceptJoinModalProps) {
    const router = useRouter();

    const { data, isLoading } = useJoinRequests(clubSlug, isOpen);
    const accept = useAcceptJoinRequest(clubSlug);
    const reject = useRejectJoinRequest(clubSlug);

    const requests = data?.data ?? [];
    const busy = accept.isPending || reject.isPending;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col px-4 sm:px-6">
                <SheetHeader className="pb-4 border-b border-border/60">
                    <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-brand-orange" />
                        <SheetTitle>Pending Join Requests</SheetTitle>
                    </div>
                    <SheetDescription>
                        Approve or decline new member join requests.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-3 flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground text-sm font-medium">
                            No pending join requests found.
                        </div>
                    ) : (
                        requests.map((req) => {
                            const name =
                                [req.user?.first_name, req.user?.last_name]
                                    .filter(Boolean)
                                    .join(' ') ||
                                req.user?.login ||
                                'User';
                            const dept = req.user?.department || 'Sport Department';

                            // spinner only on the row being processed
                            const isAccepting =
                                accept.isPending && accept.variables === req.user_id;
                            const isRejecting = reject.isPending && reject.variables === req.id;

                            return (
                                <div
                                    key={req.id}
                                    className="p-4 rounded-2xl border border-border/70 bg-background flex items-center justify-between gap-4 shadow-2xs"
                                >
                                    <div
                                        onClick={() =>
                                            router.push(`/profile/${req.user_id}`)
                                        }
                                        className="space-y-1 cursor-pointer group flex-1"
                                    >
                                        <div className="text-xs font-bold text-brand-orange">
                                            {dept}
                                        </div>
                                        <div className="text-sm font-bold text-foreground group-hover:text-brand-orange transition-colors">
                                            {name}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Requested on{' '}
                                            {new Date(req.requested_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 w-28">
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => accept.mutate(req.user_id)}
                                            className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                                        >
                                            {isAccepting ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            )}
                                            Accept
                                        </button>

                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => reject.mutate(req.id)}
                                            className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                                        >
                                            {isRejecting ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <XCircle className="w-3.5 h-3.5" />
                                            )}
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
