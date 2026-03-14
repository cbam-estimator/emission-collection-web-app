"use client";

import { useRouter } from "next/navigation";
import { CNCodeForm } from "@/components/cn-code/cn-code-form";
import { CBAMLayout } from "@/components/shared/layout";
import { useTranslations } from "next-intl";
import { use, useEffect } from "react";
import { api } from "@/trpc/react";
import { useInstallation } from "@/contexts/installation-context";
import { type ProductionRoute } from "@/lib/types";

interface DefaultData {
  productName?: string;
  productionRoutes?: ProductionRoute[];
}

function PageContent({
  installationId,
  quarter,
  code,
  locale,
}: {
  installationId: number;
  quarter: string;
  code: string;
  locale: string;
}) {
  const router = useRouter();
  const { setSelectedInstallationId, setSelectedQuarter } = useInstallation();
  const utils = api.useUtils();

  // Keep sidebar in sync with the URL
  useEffect(() => {
    setSelectedInstallationId(installationId);
    setSelectedQuarter(quarter);
  }, [installationId, quarter, setSelectedInstallationId, setSelectedQuarter]);

  const queryInput = { installationId, quarter };

  const { data: entries = [] } =
    api.installationCnCode.getByInstallationAndQuarter.useQuery(queryInput);

  const fillMutation = api.installationCnCode.fill.useMutation({
    onMutate: async ({ id, emissionData }) => {
      await utils.installationCnCode.getByInstallationAndQuarter.cancel(
        queryInput,
      );
      const previous =
        utils.installationCnCode.getByInstallationAndQuarter.getData(
          queryInput,
        );
      utils.installationCnCode.getByInstallationAndQuarter.setData(
        queryInput,
        (old) =>
          old?.map((e) =>
            e.id === id ? { ...e, status: "filled" as const, emissionData } : e,
          ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        utils.installationCnCode.getByInstallationAndQuarter.setData(
          queryInput,
          context.previous,
        );
      }
    },
    onSettled: () => {
      void utils.installationCnCode.getByInstallationAndQuarter.invalidate(
        queryInput,
      );
    },
  });

  const currentIndex = entries.findIndex((e) => e.cnCode === code);
  const entry = entries[currentIndex];
  const nextEntry = entries[currentIndex + 1];
  const isLast = !nextEntry;

  const defaultData = entry?.defaultData as DefaultData | null;

  const existingData = entry?.emissionData as {
    seeDirectValue?: string;
    benchmarkValue?: string;
    selectedRoute?: string;
    cannotProvide?: boolean;
    explanation?: string;
  } | null;

  function handleSave(data: typeof existingData) {
    if (!entry) return;
    fillMutation.mutate({ id: entry.id, emissionData: data ?? {} });
  }

  function handleNext() {
    if (nextEntry) {
      router.push(
        `/${locale}/cn/${installationId}/${quarter}/${nextEntry.cnCode}`,
      );
    } else {
      router.push(`/${locale}`);
    }
  }

  // Entry not found — redirect to getting started
  if (entries.length > 0 && !entry) {
    router.replace(`/${locale}`);
    return null;
  }

  return (
    <div className="flex w-full items-start justify-center">
      {entry ? (
        <CNCodeForm
          key={entry.id}
          cnCode={entry.cnCode}
          productName={defaultData?.productName ?? entry.cnCode}
          description={entry.description ?? ""}
          productionRoutes={defaultData?.productionRoutes ?? []}
          reportingPeriod={quarter}
          existingData={existingData}
          isSaving={fillMutation.isPending}
          onSave={handleSave}
          onNext={handleNext}
          isLast={isLast}
          requestingCustomers={entry.requestingCustomers}
        />
      ) : null}
    </div>
  );
}

export default function CNCodePage({
  params,
}: {
  params: Promise<{
    installationId: string;
    quarter: string;
    code: string;
    locale: string;
  }>;
}) {
  const t = useTranslations("cnCode");
  const {
    installationId: installationIdStr,
    quarter,
    code,
    locale,
  } = use(params);

  return (
    <CBAMLayout title={t("pageTitle")}>
      <PageContent
        installationId={Number(installationIdStr)}
        quarter={quarter}
        code={code}
        locale={locale}
      />
    </CBAMLayout>
  );
}
