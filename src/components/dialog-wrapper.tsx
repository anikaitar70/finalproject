"use client";

import { useRouter } from "next/navigation";

import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";

interface DialogWrapperProps {
  children: React.ReactNode;
  title?: string;
}

export function DialogWrapper({ children, title }: DialogWrapperProps) {
  const router = useRouter();

  return (
    <Dialog defaultOpen onOpenChange={() => router.back()}>
      <DialogContent>
        <DialogTitle className="sr-only">{title ?? "Authentication"}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
