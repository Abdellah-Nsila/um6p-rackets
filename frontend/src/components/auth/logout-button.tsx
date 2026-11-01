'use client';

import { Button } from '../ui/button';
import { useLogout } from '@/hooks/use-logout';

export function LogoutButton({ className }: { className?: string }) {
    const performLogout = useLogout();

    return (
        <Button 
            onClick={performLogout} 
            variant="destructive"
            className={className}
        >
            Logout
        </Button>
    );
}
