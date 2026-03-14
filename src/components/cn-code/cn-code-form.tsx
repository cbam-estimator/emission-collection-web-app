"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type ProductionRoute } from "@/lib/types";
import { useTranslations } from "next-intl";
import { CNCodeHeader } from "./cn-code-header";
import { EmissionInputs } from "./emission-inputs";
import { ProductionRoutes } from "./production-routes";
import { CannotProvideSection } from "./cannot-provide-section";

interface ExistingEmissionData {
  seeDirectValue?: string;
  benchmarkValue?: string;
  selectedRoute?: string;
  cannotProvide?: boolean;
  explanation?: string;
}

interface CNCodeFormProps {
  cnCode: string;
  productName: string;
  description: string;
  productionRoutes: ProductionRoute[];
  reportingPeriod?: string;
  existingData?: ExistingEmissionData | null;
  isSaving?: boolean;
  onSave?: (data: ExistingEmissionData) => void;
  onNext?: () => void;
  isLast?: boolean;
  requestingCustomers?: { id: number; name: string }[];
}

export function CNCodeForm({
  cnCode,
  productName,
  description,
  productionRoutes,
  reportingPeriod = "2026",
  existingData,
  isSaving = false,
  onSave,
  onNext,
  isLast = false,
  requestingCustomers = [],
}: CNCodeFormProps) {
  const t = useTranslations("cnCode");
  const [cannotProvide, setCannotProvide] = useState(
    existingData?.cannotProvide ?? false,
  );
  const [selectedRoute, setSelectedRoute] = useState(
    existingData?.selectedRoute ?? "",
  );
  const [seeDirectValue, setSeeDirectValue] = useState(
    existingData?.seeDirectValue ?? "",
  );
  const [benchmarkValue, setBenchmarkValue] = useState(
    existingData?.benchmarkValue ?? "",
  );
  const [explanation, setExplanation] = useState(
    existingData?.explanation ?? "",
  );

  const isFormValid =
    cannotProvide || (seeDirectValue.trim() !== "" && selectedRoute !== "");

  function getFormData() {
    return {
      seeDirectValue,
      benchmarkValue,
      selectedRoute,
      cannotProvide,
      explanation,
    };
  }

  function handleSave() {
    if (!isFormValid) return;
    onSave?.(getFormData());
  }

  function handleNext() {
    if (!isFormValid) return;
    onSave?.(getFormData());
    onNext?.();
  }

  return (
    <Card className="flex w-full flex-col">
      <CNCodeHeader
        cnCode={cnCode}
        productName={productName}
        description={description}
        reportingPeriod={reportingPeriod}
        requestingCustomers={requestingCustomers}
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
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          disabled={!isFormValid || isSaving}
          onClick={handleSave}
        >
          {isSaving ? t("saving") : t("save")}
        </Button>
        <Button disabled={!isFormValid || isSaving} onClick={handleNext}>
          {isSaving ? t("saving") : isLast ? t("finish") : t("next")}
        </Button>
      </CardFooter>
    </Card>
  );
}
