"use client";

import { api } from "@/trpc/react";
import { CBAMLayout } from "@/components/shared/layout";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { UsersCard } from "@/components/admin/users-card";
import { OperatorsCard } from "@/components/admin/operators-card";
import { ConsultantsCard } from "@/components/admin/consultants-card";

function AdminPageContent() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const { data: profile } = api.user.getProfile.useQuery();

  if (profile && profile.role !== "admin") {
    router.replace(`/${locale}`);
    return null;
  }

  return (
    <div className="space-y-8">
      <UsersCard />
      <OperatorsCard />
      <ConsultantsCard />
    </div>
  );
}

export default function AdminPage() {
  const t = useTranslations("admin");
  return (
    <CBAMLayout title={t("pageTitle")}>
      <AdminPageContent />
    </CBAMLayout>
  );
}
