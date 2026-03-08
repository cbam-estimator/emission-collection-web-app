"use client";

import { ConsultDialog } from "@/components/shared/consult-dialog";
import { DedicatedConsultDialog } from "@/components/shared/dedicated-consult-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { ArrowRight, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ChangeEvent } from "react";
import { useState } from "react";

interface CannotProvideSectionProps {
  cannotProvide: boolean;
  explanation: string;
  onCannotProvideChange: (checked: boolean) => void;
  onExplanationChange: (value: string) => void;
}

export function CannotProvideSection({
  cannotProvide,
  explanation,
  onCannotProvideChange,
  onExplanationChange,
}: CannotProvideSectionProps) {
  const t = useTranslations("cnCode.cannotProvide");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: profile } = api.user.getProfile.useQuery();
  const consultant = profile?.consultant ?? null;

  return (
    <>
      <div className="flex items-start gap-2">
        <Checkbox
          id="cannot-provide"
          checked={cannotProvide}
          onCheckedChange={(checked: boolean) => onCannotProvideChange(checked)}
        />
        <Label htmlFor="cannot-provide" className="cursor-pointer font-normal">
          {t("label")}
        </Label>
      </div>

      {cannotProvide && (
        <>
          <Textarea
            placeholder={t("explanationPlaceholder")}
            value={explanation}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              onExplanationChange(e.target.value)
            }
            className="min-h-20"
          />
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 text-sm transition-colors"
          >
            <Info className="size-4" />
            {t("contactExpert")}
            <ArrowRight className="size-4" />
          </button>

          {consultant ? (
            <DedicatedConsultDialog
              consultant={consultant}
              open={dialogOpen}
              onOpenChange={setDialogOpen}
            />
          ) : (
            <ConsultDialog open={dialogOpen} onOpenChange={setDialogOpen} />
          )}
        </>
      )}
    </>
  );
}
