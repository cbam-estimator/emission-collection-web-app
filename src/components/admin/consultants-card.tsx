"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Users } from "lucide-react";

export function ConsultantsCard() {
  const t = useTranslations("admin");
  const utils = api.useUtils();

  const { data: consultants = [], isLoading: consultantsLoading } =
    api.admin.getConsultants.useQuery();

  const [cName, setCName] = useState("");
  const [cTitle, setCTitle] = useState("");

  const createConsultant = api.admin.createConsultant.useMutation({
    onSuccess: () => {
      utils.admin.getConsultants.invalidate();
      setCName("");
      setCTitle("");
    },
  });
  const deleteConsultant = api.admin.deleteConsultant.useMutation({
    onSuccess: () => {
      utils.admin.getConsultants.invalidate();
      utils.admin.getAllUsers.invalidate();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5" />
          {t("consultantsTitle")}
        </CardTitle>
        <CardDescription>{t("consultantsDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {consultantsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="divide-y">
            {consultants.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-muted-foreground text-xs">{c.title}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteConsultant.mutate({ id: c.id })}
                  disabled={deleteConsultant.isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {consultants.length === 0 && (
              <p className="text-muted-foreground py-2 text-sm">
                {t("noConsultants")}
              </p>
            )}
          </div>
        )}

        <div className="border-t pt-4">
          <p className="mb-3 text-sm font-medium">{t("addConsultant")}</p>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="c-name">{t("consultantName")}</Label>
              <Input
                id="c-name"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="c-title">{t("consultantTitle")}</Label>
              <Input
                id="c-title"
                value={cTitle}
                onChange={(e) => setCTitle(e.target.value)}
                placeholder="CBAM Regulatory Expert"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() =>
                  createConsultant.mutate({ name: cName, title: cTitle })
                }
                disabled={
                  !cName.trim() || !cTitle.trim() || createConsultant.isPending
                }
              >
                {t("add")}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
