"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

interface ReportingPeriodBadgeProps {
  reportingPeriod: string;
}

export function ReportingPeriodBadge({
  reportingPeriod,
}: ReportingPeriodBadgeProps) {
  const t = useTranslations("cnCode.reportingPeriod");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="secondary"
          className="bg-accent text-accent-foreground absolute top-4 right-4 cursor-default gap-1.5 rounded-full"
        >
          {t("label", { period: reportingPeriod })}
          <Info className="size-3" />
        </Badge>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="bg-accent text-accent-foreground max-w-sm flex-col text-left"
        arrowClassName="fill-accent bg-accent"
      >
        <p>{t("tooltip")}</p>
      </TooltipContent>
    </Tooltip>
  );
}
