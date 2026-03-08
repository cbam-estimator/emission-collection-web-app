"use client";

import { api } from "@/trpc/react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCog, ShieldCheck, ShieldOff } from "lucide-react";

export function UsersCard() {
  const t = useTranslations("admin");
  const utils = api.useUtils();

  const { data: allUsers = [], isLoading: usersLoading } =
    api.admin.getAllUsers.useQuery();
  const { data: consultants = [], isLoading: consultantsLoading } =
    api.admin.getConsultants.useQuery();
  const { data: operators = [], isLoading: operatorsLoading } =
    api.admin.getOperators.useQuery();

  const invalidateUsers = () => utils.admin.getAllUsers.invalidate();

  const setConsultant = api.admin.setUserConsultant.useMutation({
    onSuccess: () => {
      invalidateUsers();
      utils.user.getProfile.invalidate();
    },
  });
  const setOperator = api.admin.setUserOperator.useMutation({
    onSuccess: invalidateUsers,
  });
  const setRole = api.admin.setUserRole.useMutation({
    onSuccess: invalidateUsers,
  });

  const isLoading = usersLoading || consultantsLoading || operatorsLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="size-5" />
          {t("usersTitle")}
        </CardTitle>
        <CardDescription>{t("usersDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_14rem_9rem_13rem] items-center gap-3"
              >
                <Skeleton className="h-5" />
                <Skeleton className="h-9" />
                <Skeleton className="h-9" />
                <Skeleton className="h-9" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="text-muted-foreground mb-1 grid grid-cols-[1fr_14rem_9rem_13rem] items-center gap-3 px-1 text-xs font-medium tracking-wide uppercase">
              <span>{t("colUser")}</span>
              <span>{t("colOperator")}</span>
              <span className="text-center">{t("colRole")}</span>
              <span>{t("colConsultant")}</span>
            </div>

            <div className="divide-y">
              {allUsers.map((user) => {
                const isAdmin = user.role === "admin";
                return (
                  <div
                    key={user.id}
                    className="grid grid-cols-[1fr_14rem_9rem_13rem] items-center gap-3 py-3"
                  >
                    <p className="min-w-0 truncate text-sm font-medium">
                      {user.email}
                    </p>

                    <Select
                      value={user.operatorId?.toString() ?? "none"}
                      onValueChange={(val) =>
                        setOperator.mutate({
                          userId: user.id,
                          operatorId: val === "none" ? null : Number(val),
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("noOperator")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          — {t("noOperator")} —
                        </SelectItem>
                        {operators.map((o) => (
                          <SelectItem key={o.id} value={o.id.toString()}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className={
                          isAdmin
                            ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                            : "text-muted-foreground hover:text-foreground"
                        }
                        disabled={setRole.isPending}
                        onClick={() =>
                          setRole.mutate({
                            userId: user.id,
                            role: isAdmin ? "operator_user" : "admin",
                          })
                        }
                      >
                        {isAdmin ? (
                          <>
                            <ShieldOff className="mr-1 size-3" />
                            {t("removeAdmin")}
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="mr-1 size-3" />
                            {t("makeAdmin")}
                          </>
                        )}
                      </Button>
                    </div>

                    <Select
                      value={user.consultantId?.toString() ?? "none"}
                      onValueChange={(val) =>
                        setConsultant.mutate({
                          userId: user.id,
                          consultantId: val === "none" ? null : Number(val),
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("noConsultant")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          — {t("noConsultant")} —
                        </SelectItem>
                        {consultants.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
              {allUsers.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  {t("noUsers")}
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
