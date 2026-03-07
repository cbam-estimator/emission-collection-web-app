"use client";

import { useState } from "react";
import { MessageCircleQuestion, PhoneCall } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ConsultDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConsultDialog({ open: controlledOpen, onOpenChange }: ConsultDialogProps = {}) {
  const t = useTranslations("consultDialog");
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
              <PhoneCall className="size-5" />
              {t("title")}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {t("description")}
            </DialogDescription>
          </DialogHeader>

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
