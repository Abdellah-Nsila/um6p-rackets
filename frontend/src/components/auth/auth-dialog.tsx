'use client';
import { AlertDialog, AlertDialogContent } from '@/components/ui/alert-dialog';
import { AuthTabs } from './tabs';
import { useAuthPopupStore } from '@/store/auth_popup';

export function AuthDialog() {
  const isOpen = useAuthPopupStore((s) => s.isOpen);
  const { open, close } = useAuthPopupStore.getState();

  return (
    <AlertDialog open={isOpen} onOpenChange={(v) => (v ? open() : close())}>
      <AlertDialogContent className="w-fit h-fit max-w-fit" size="lg">
        <AuthTabs />
      </AlertDialogContent>
    </AlertDialog>
  );
}