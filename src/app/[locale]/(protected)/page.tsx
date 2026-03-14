"use client";

import { useRouter, useParams } from "next/navigation";
import { GettingStartedCard } from "@/components/getting-started";
import { CBAMLayout } from "@/components/shared/layout";
import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { useInstallation } from "@/contexts/installation-context";

// Rendered inside CBAMLayout so InstallationContext is available
function PageContent() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { selectedInstallationId, selectedQuarter } = useInstallation();

  const { data: operator } = api.operator.getMine.useQuery();
  const { data: customers = [] } = api.customer.getByOperator.useQuery(
    { operatorId: operator?.id ?? 0 },
    { enabled: !!operator?.id },
  );
  const { data: entries = [] } =
    api.installationCnCode.getByInstallationAndQuarter.useQuery(
      {
        installationId: selectedInstallationId ?? 0,
        quarter: selectedQuarter ?? "",
      },
      { enabled: !!selectedInstallationId && !!selectedQuarter },
    );

  function handleStart() {
    const first = entries[0];
    if (first && selectedInstallationId && selectedQuarter) {
      router.push(
        `/${locale}/cn/${selectedInstallationId}/${selectedQuarter}/${first.cnCode}`,
      );
    }
  }

  return <GettingStartedCard customers={customers} onStart={handleStart} />;
}

export default function CBAMEstimatorPage() {
  const t = useTranslations("sidebar");

  return (
    <CBAMLayout title={t("gettingStarted")}>
      <PageContent />
    </CBAMLayout>
  );
}
