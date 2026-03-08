"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/nextjs";
import { Check, Database, LogOut, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect } from "react";
import { ConsultDialog } from "./consult-dialog";
import { DedicatedConsultDialog } from "./dedicated-consult-dialog";
import { SettingsDialog } from "./settings-dialog";
import { api } from "@/trpc/react";
import { useInstallation } from "@/contexts/installation-context";
import { Skeleton } from "@/components/ui/skeleton";

export function CBAMSidebar() {
  const t = useTranslations("sidebar");
  const params = useParams();
  const locale = params.locale as string;
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { selectedInstallationId, setSelectedInstallationId } =
    useInstallation();

  const { data: profile } = api.user.getProfile.useQuery();
  const isAdmin = profile?.role === "admin";
  const consultant = profile?.consultant ?? null;

  const { data: operator } = api.operator.getMine.useQuery();
  const { data: installations = [], isLoading: installationsLoading } =
    api.installation.getByOperator.useQuery(
      { operatorId: operator?.id ?? 0 },
      { enabled: !!operator?.id },
    );
  const { data: entries = [], isLoading: entriesLoading } =
    api.installationCnCode.getByInstallation.useQuery(
      { installationId: selectedInstallationId ?? 0 },
      { enabled: !!selectedInstallationId },
    );

  // Auto-select first installation when data loads
  useEffect(() => {
    if (!selectedInstallationId && installations.length > 0) {
      setSelectedInstallationId(installations[0]!.id);
    }
  }, [installations, selectedInstallationId, setSelectedInstallationId]);

  const resolvedCount = entries.filter((e) => e.resolved).length;
  const totalCount = entries.length;

  const isGettingStarted =
    pathname === `/${locale}` || pathname === `/${locale}/`;

  return (
    <aside className="bg-background flex h-screen w-72 min-w-72 flex-col border-r">
      {/* Logo - centered */}
      <div className="flex items-center justify-center gap-2 border-b px-6 py-4">
        <Image
          src="/favicon.png"
          alt="logo"
          width={20}
          height={20}
          style={{ width: 20, height: "auto" }}
        />
        <span className="font-semibold">CBAM-Estimator</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto p-4">
        {/* Getting Started Link */}
        <Link
          href={`/${locale}`}
          className={cn(
            "mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isGettingStarted
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              fill="none"
              d="M9.75 3h-4c-.698 0-1.047 0-1.33.086A2 2 0 0 0 3.085 4.42C3 4.703 3 5.052 3 5.75s0 1.047.086 1.33A2 2 0 0 0 4.42 8.415c.284.086.633.086 1.331.086h4c.698 0 1.047 0 1.33-.086a2 2 0 0 0 1.334-1.333c.086-.284.086-.633.086-1.331s0-1.047-.086-1.33a2 2 0 0 0-1.333-1.334C10.797 3 10.448 3 9.75 3ZM21 9.75v-4c0-.698 0-1.047-.086-1.33a2 2 0 0 0-1.333-1.334C19.297 3 18.948 3 18.25 3s-1.047 0-1.33.086a2 2 0 0 0-1.334 1.333c-.086.284-.086.633-.086 1.331v4c0 .698 0 1.047.086 1.33a2 2 0 0 0 1.333 1.334c.284.086.633.086 1.331.086s1.047 0 1.33-.086a2 2 0 0 0 1.334-1.333C21 10.797 21 10.448 21 9.75Zm-4.08 11.164c.283.086.632.086 1.33.086s1.047 0 1.33-.086a2 2 0 0 0 1.334-1.333c.086-.284.086-.633.086-1.331s0-1.047-.086-1.33a2 2 0 0 0-1.333-1.334c-.284-.086-.633-.086-1.331-.086s-1.047 0-1.33.086a2 2 0 0 0-1.334 1.333c-.086.284-.086.633-.086 1.331s0 1.047.086 1.33a2 2 0 0 0 1.333 1.334ZM8.5 11.5H7c-1.886 0-2.828 0-3.414.586S3 13.614 3 15.5V17c0 1.886 0 2.828.586 3.414S5.114 21 7 21h1.5c1.886 0 2.828 0 3.414-.586S12.5 18.886 12.5 17v-1.5c0-1.886 0-2.828-.586-3.414S10.386 11.5 8.5 11.5Z"
            />
          </svg>
          {t("gettingStarted")}
        </Link>

        {/* Admin Link — visible to admins only */}
        {isAdmin && (
          <Link
            href={`/${locale}/admin`}
            className={cn(
              "mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(`/${locale}/admin`)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <ShieldCheck className="size-4" />
            {t("adminDashboard")}
          </Link>
        )}

        {/* CN Entry List */}
        <div className="space-y-2">
          {entriesLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="size-6 rounded-full" />
                </div>
              ))
            : entries.map((entry) => {
                const href = `/${locale}/cn/${entry.cnCode}`;
                const isActive = pathname === href;
                return (
                  <Link
                    key={entry.cnCode}
                    href={href}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2 transition-colors",
                      isActive
                        ? "border-primary bg-primary/10"
                        : entry.resolved
                          ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                          : "border-border bg-background hover:bg-muted/50",
                    )}
                  >
                    <span className="font-mono text-sm font-medium">
                      {entry.cnCode}
                    </span>
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full border-2",
                        entry.resolved
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30",
                      )}
                    >
                      {entry.resolved && <Check className="size-4" />}
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        {/* Progress */}
        <div className="text-muted-foreground mb-3 flex items-center justify-center gap-2 text-sm">
          <Database className="size-4" />
          <span>
            {t("entriesResolved", {
              resolved: resolvedCount,
              total: totalCount,
            })}
          </span>
        </div>

        {/* Submit Button */}
        <Button
          className="mb-4 w-full"
          variant="outline"
          disabled={resolvedCount < totalCount}
        >
          {t("submitData")}
        </Button>

        {/* Installation Selector */}
        {installationsLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <Select
            value={selectedInstallationId?.toString() ?? ""}
            onValueChange={(val) => setSelectedInstallationId(Number(val))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("selectInstallation")} />
            </SelectTrigger>
            <SelectContent>
              {installations.map((installation) => (
                <SelectItem
                  key={installation.id}
                  value={installation.id.toString()}
                >
                  {installation.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Action Icons */}
        <div className="mt-4 flex items-center justify-center gap-4">
          {consultant ? (
            <DedicatedConsultDialog consultant={consultant} />
          ) : (
            <ConsultDialog />
          )}
          <SettingsDialog />
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => signOut({ redirectUrl: `/${locale}` })}
          >
            <LogOut className="size-5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
