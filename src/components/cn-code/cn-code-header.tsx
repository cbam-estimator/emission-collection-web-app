import { CardHeader } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface CNCodeHeaderProps {
  cnCode: string;
  productName: string;
  description: string;
}

export function CNCodeHeader({
  cnCode,
  productName,
  description,
}: CNCodeHeaderProps) {
  return (
    <CardHeader className="pb-4">
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
    </CardHeader>
  );
}
