"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

interface EmissionInputsProps {
  seeDirectValue: string;
  benchmarkValue: string;
  onSeeDirectChange: (value: string) => void;
  onBenchmarkChange: (value: string) => void;
}

export function EmissionInputs({
  seeDirectValue,
  benchmarkValue,
  onSeeDirectChange,
  onBenchmarkChange,
}: EmissionInputsProps) {
  const t = useTranslations("cnCode.emissionInputs");

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="see-direct">
          {t("seeDirect")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="see-direct"
          placeholder={t("placeholder")}
          value={seeDirectValue}
          onChange={(e) => onSeeDirectChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="benchmark">{t("benchmark")}</Label>
        <Input
          id="benchmark"
          placeholder={t("placeholder")}
          value={benchmarkValue}
          onChange={(e) => onBenchmarkChange(e.target.value)}
        />
      </div>
    </div>
  );
}
