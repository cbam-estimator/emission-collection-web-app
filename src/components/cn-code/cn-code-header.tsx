"use client";

import { CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Info } from "lucide-react";
import { useTranslations } from "next-intl";

interface CNCodeHeaderProps {
  cnCode: string;
  productName: string;
  description: string;
  reportingPeriod?: string;
  requestingCustomers?: { id: number; name: string }[];
}

export function CNCodeHeader({
  cnCode,
  productName,
  description,
  reportingPeriod,
  requestingCustomers = [],
}: CNCodeHeaderProps) {
  const t = useTranslations("cnCode");

  return (
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex w-fit cursor-default items-center gap-2">
              <span className="text-foreground font-mono font-semibold">
                {cnCode}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{productName}</span>
              <HelpCircle className="text-muted-foreground size-4" />
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            align="start"
            className="bg-accent text-accent-foreground max-w-sm flex-col text-left"
            arrowClassName="fill-accent bg-accent"
          >
            <p className="font-mono font-semibold">{cnCode}</p>
            <p className="font-medium">{productName}</p>
            <p className="mt-1 text-sm opacity-80">{description}</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {requestingCustomers.map((c) => (
            <span
              key={c.id}
              className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium"
            >
              {c.name}
            </span>
          ))}

          {reportingPeriod && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="bg-accent text-accent-foreground cursor-default gap-1.5 rounded-full"
                >
                  {t("reportingPeriod.label", { period: reportingPeriod })}
                  <Info className="size-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-accent text-accent-foreground max-w-sm flex-col text-left"
                arrowClassName="fill-accent bg-accent"
              >
                <p>{t("reportingPeriod.tooltip")}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </CardHeader>
  );
}
