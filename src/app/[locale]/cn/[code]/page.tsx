"use client";

import { useRouter } from "next/navigation";
import { CNCodeForm } from "@/components/cn-code";
import { CBAMLayout } from "@/components/shared/layout";
import { useTranslations } from "next-intl";
import { use } from "react";
import { api } from "@/trpc/react";
import { useInstallation } from "@/contexts/installation-context";
import { type ProductionRoute } from "@/lib/types";

interface DefaultData {
  productName?: string;
  productionRoutes?: ProductionRoute[];
}

// Rendered inside CBAMLayout so InstallationContext is available
function PageContent({ code, locale }: { code: string; locale: string }) {
  const t = useTranslations("cnCode");
  const router = useRouter();
  const { selectedInstallationId } = useInstallation();

  const { data: cnCodes = [] } =
    api.installationCnCode.getByInstallation.useQuery(
      { installationId: selectedInstallationId ?? 0 },
      { enabled: !!selectedInstallationId },
    );

  const currentIndex = cnCodes.findIndex((e) => e.cnCode === code);
  const entry = cnCodes[currentIndex];
  const nextEntry = cnCodes[currentIndex + 1];
  const isLast = !nextEntry;

  const defaultData = entry?.defaultData as DefaultData | null;

  function handleNext() {
    if (nextEntry) {
      router.push(`/${locale}/cn/${nextEntry.cnCode}`);
    } else {
      router.push(`/${locale}`);
    }
  }

  if (!selectedInstallationId) {
    return <p className="text-muted-foreground">{t("notFound")}</p>;
  }

  return (
    <div className="flex w-full items-start justify-center">
      {entry ? (
        <CNCodeForm
          cnCode={entry.cnCode}
          productName={defaultData?.productName ?? entry.cnCode}
          description={entry.description ?? ""}
          productionRoutes={defaultData?.productionRoutes ?? []}
          onNext={handleNext}
          isLast={isLast}
        />
      ) : (
        <p className="text-muted-foreground">{t("notFound")}</p>
      )}
    </div>
  );
}

export default function CNCodePage({
  params,
}: {
  params: Promise<{ code: string; locale: string }>;
}) {
  const t = useTranslations("cnCode");
  const { code, locale } = use(params);

  return (
    <CBAMLayout title={t("pageTitle")}>
      <PageContent code={code} locale={locale} />
    </CBAMLayout>
  );
}
