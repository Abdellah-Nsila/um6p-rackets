"use client";
import { Button } from "../ui/button";
import { useAuthPopupStore } from "@/store/auth_popup";

export function AuthButton({ title, className }: { title: string; className?: string }) {
  const open = useAuthPopupStore((s) => s.open);
  return (
    <Button className={className} onClick={() => open('login')}>
      {title}
    </Button>
  );
}
