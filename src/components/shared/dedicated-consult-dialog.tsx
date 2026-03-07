"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Consultant } from "@/lib/types";
import { MessageCircleQuestion, User } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

interface DedicatedConsultDialogProps {
  consultant: Consultant;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DedicatedConsultDialog({
  consultant,
  open: controlledOpen,
  onOpenChange,
}: DedicatedConsultDialogProps) {
  const t = useTranslations("dedicatedConsultDialog");
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => undefined)) : setInternalOpen;

  return (
    <>
      {!isControlled && (
        <Button
          variant="ghost"
          size="icon"
          className="text-orange-500 hover:bg-orange-50 hover:text-orange-600"
          onClick={() => setOpen(true)}
        >
          <MessageCircleQuestion className="size-5" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-105">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image
                src="/icons/expert.svg"
                alt="Expert"
                width={20}
                height={20}
              />
              {t("title")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-4 py-2">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-100">
              {consultant.avatarUrl ? (
                <Image
                  src={consultant.avatarUrl}
                  alt={consultant.name}
                  width={56}
                  height={56}
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-7 text-orange-500" />
              )}
            </div>
            <div>
              <p className="font-semibold">{consultant.name}</p>
              <p className="text-muted-foreground text-sm">
                {consultant.title}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              {t("bookCall")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
