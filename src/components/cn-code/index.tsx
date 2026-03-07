"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type ProductionRoute } from "@/lib/types";
import { useTranslations } from "next-intl";
import { ReportingPeriodBadge } from "./reporting-period-badge";
import { CNCodeHeader } from "./cn-code-header";
import { EmissionInputs } from "./emission-inputs";
import { ProductionRoutes } from "./production-routes";
import { CannotProvideSection } from "./cannot-provide-section";

interface CNCodeFormProps {
  cnCode: string;
  productName: string;
  description: string;
  productionRoutes: ProductionRoute[];
  reportingPeriod?: string;
  onNext?: () => void;
  isLast?: boolean;
}

export function CNCodeForm({
  cnCode,
  productName,
  description,
  productionRoutes,
  reportingPeriod = "2026",
  onNext,
  isLast = false,
}: CNCodeFormProps) {
  const t = useTranslations("cnCode");
  const [cannotProvide, setCannotProvide] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [seeDirectValue, setSeeDirectValue] = useState("");
  const [benchmarkValue, setBenchmarkValue] = useState("");
  const [explanation, setExplanation] = useState("");

  const isNextEnabled =
    cannotProvide || (seeDirectValue.trim() !== "" && selectedRoute !== "");

  return (
    <Card className="relative flex w-full flex-col">
      <ReportingPeriodBadge reportingPeriod={reportingPeriod} />
      <CNCodeHeader
        cnCode={cnCode}
        productName={productName}
        description={description}
      />
      <CardContent className="space-y-6">
        <div className={cannotProvide ? "pointer-events-none opacity-50" : ""}>
          <EmissionInputs
            seeDirectValue={seeDirectValue}
            benchmarkValue={benchmarkValue}
            onSeeDirectChange={setSeeDirectValue}
            onBenchmarkChange={setBenchmarkValue}
          />
          <ProductionRoutes
            routes={productionRoutes}
            selectedRoute={selectedRoute}
            onRouteChange={setSelectedRoute}
          />
        </div>
        <CannotProvideSection
          cannotProvide={cannotProvide}
          explanation={explanation}
          onCannotProvideChange={setCannotProvide}
          onExplanationChange={setExplanation}
        />
      </CardContent>
      <CardFooter className="justify-end">
        <Button disabled={!isNextEnabled} onClick={onNext}>
          {isLast ? t("finish") : t("next")}
        </Button>
      </CardFooter>
    </Card>
  );
}
