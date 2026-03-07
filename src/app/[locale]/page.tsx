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
  const { selectedInstallationId } = useInstallation();

  const { data: operator } = api.operator.getMine.useQuery();
  const { data: customers = [] } = api.customer.getByOperator.useQuery(
    { operatorId: operator?.id ?? 0 },
    { enabled: !!operator?.id },
  );
  const { data: cnCodes = [] } =
    api.installationCnCode.getByInstallation.useQuery(
      { installationId: selectedInstallationId ?? 0 },
      { enabled: !!selectedInstallationId },
    );

  function handleStart() {
    const firstCode = cnCodes[0]?.cnCode;
    if (firstCode) {
      router.push(`/${locale}/cn/${firstCode}`);
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
