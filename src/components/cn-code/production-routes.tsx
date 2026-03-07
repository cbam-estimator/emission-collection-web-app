"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { type ProductionRoute } from "@/lib/types";
import { useTranslations } from "next-intl";

interface ProductionRoutesProps {
  routes: ProductionRoute[];
  selectedRoute: string;
  onRouteChange: (value: string) => void;
}

export function ProductionRoutes({
  routes,
  selectedRoute,
  onRouteChange,
}: ProductionRoutesProps) {
  const t = useTranslations("cnCode.productionRoutes");

  return (
    <div className="mt-6 space-y-3">
      <Label className="text-sm font-medium">{t("label")}</Label>
      <RadioGroup value={selectedRoute} onValueChange={onRouteChange}>
        {routes.map((route) => (
          <div key={route.value} className="flex items-center gap-2">
            <RadioGroupItem value={route.value} id={route.value} />
            <Label htmlFor={route.value} className="cursor-pointer font-normal">
              {route.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
