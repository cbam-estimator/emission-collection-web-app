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
import { Trash2, Building2, ChevronDown, ChevronRight, Plus } from "lucide-react";

type Operator = {
  id: number;
  name: string;
  identifier: string;
  country: string | null;
  installations: { id: number; name: string; identifier: string | null; address: string | null }[];
};

function InstallationRow({
  operatorId,
  installation,
}: {
  operatorId: number;
  installation: Operator["installations"][number];
}) {
  const utils = api.useUtils();
  const deleteInstallation = api.admin.deleteInstallation.useMutation({
    onSuccess: () => {
      utils.admin.getOperators.invalidate();
      utils.installation.getByOperator.invalidate({ operatorId });
    },
  });

  return (
    <div className="flex items-center justify-between gap-2 py-1.5 pl-4">
      <div>
        <p className="text-sm">{installation.name}</p>
        {(installation.identifier ?? installation.address) && (
          <p className="text-muted-foreground text-xs">
            {[installation.identifier, installation.address].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive size-7"
        onClick={() => deleteInstallation.mutate({ id: installation.id })}
        disabled={deleteInstallation.isPending}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

function AddInstallationForm({ operatorId, onDone }: { operatorId: number; onDone: () => void }) {
  const t = useTranslations("admin");
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [address, setAddress] = useState("");

  const createInstallation = api.admin.createInstallation.useMutation({
    onSuccess: () => {
      utils.admin.getOperators.invalidate();
      utils.installation.getByOperator.invalidate({ operatorId });
      setName("");
      setIdentifier("");
      setAddress("");
      onDone();
    },
  });

  return (
    <div className="mt-2 space-y-2 rounded-md border p-3">
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">{t("installationName")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Plant Berlin"
            className="h-8 text-sm"
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs">{t("installationIdentifier")}</Label>
          <Input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="DE-ETS-12345"
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("installationAddress")}</Label>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Musterstraße 1, Berlin"
          className="h-8 text-sm"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() =>
            createInstallation.mutate({
              operatorId,
              name,
              identifier: identifier || undefined,
              address: address || undefined,
            })
          }
          disabled={!name.trim() || createInstallation.isPending}
        >
          {t("add")}
        </Button>
      </div>
    </div>
  );
}

function OperatorRow({ operator }: { operator: Operator }) {
  const t = useTranslations("admin");
  const utils = api.useUtils();
  const [expanded, setExpanded] = useState(false);
  const [addingInstallation, setAddingInstallation] = useState(false);

  const deleteOperator = api.admin.deleteOperator.useMutation({
    onSuccess: () => {
      utils.admin.getOperators.invalidate();
      utils.admin.getAllUsers.invalidate();
    },
  });

  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-4">
        <button
          className="flex flex-1 items-center gap-2 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <ChevronDown className="text-muted-foreground size-4 shrink-0" />
          ) : (
            <ChevronRight className="text-muted-foreground size-4 shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium">{operator.name}</p>
            <p className="text-muted-foreground text-xs">
              {operator.identifier}
              {operator.country ? ` · ${operator.country.toUpperCase()}` : ""}
              {` · ${operator.installations.length} installation${operator.installations.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => deleteOperator.mutate({ id: operator.id })}
          disabled={deleteOperator.isPending}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {expanded && (
        <div className="mt-1 ml-6 border-l pl-2">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground py-1 text-xs font-medium uppercase tracking-wide">
              {t("installationsTitle")}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 text-xs"
              onClick={() => setAddingInstallation((v) => !v)}
            >
              <Plus className="size-3" />
              {t("addInstallation")}
            </Button>
          </div>
          {operator.installations.length === 0 && !addingInstallation && (
            <p className="text-muted-foreground py-1 text-xs">{t("noInstallations")}</p>
          )}
          {operator.installations.map((inst) => (
            <InstallationRow key={inst.id} operatorId={operator.id} installation={inst} />
          ))}
          {addingInstallation && (
            <AddInstallationForm
              operatorId={operator.id}
              onDone={() => setAddingInstallation(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function OperatorsCard() {
  const t = useTranslations("admin");
  const utils = api.useUtils();

  const { data: operators = [], isLoading: operatorsLoading } =
    api.admin.getOperators.useQuery();

  const [oName, setOName] = useState("");
  const [oIdentifier, setOIdentifier] = useState("");
  const [oCountry, setOCountry] = useState("");

  const createOperator = api.admin.createOperator.useMutation({
    onSuccess: () => {
      utils.admin.getOperators.invalidate();
      setOName("");
      setOIdentifier("");
      setOCountry("");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-5" />
          {t("operatorsTitle")}
        </CardTitle>
        <CardDescription>{t("operatorsDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {operatorsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="divide-y">
            {operators.map((o) => (
              <OperatorRow key={o.id} operator={o} />
            ))}
            {operators.length === 0 && (
              <p className="text-muted-foreground py-2 text-sm">
                {t("noOperators")}
              </p>
            )}
          </div>
        )}

        <div className="border-t pt-4">
          <p className="mb-3 text-sm font-medium">{t("addOperator")}</p>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="o-name">{t("operatorName")}</Label>
              <Input
                id="o-name"
                value={oName}
                onChange={(e) => setOName(e.target.value)}
                placeholder="Acme Steel GmbH"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="o-id">{t("operatorIdentifier")}</Label>
              <Input
                id="o-id"
                value={oIdentifier}
                onChange={(e) => setOIdentifier(e.target.value)}
                placeholder="DE123456789"
              />
            </div>
            <div className="w-24 space-y-1">
              <Label htmlFor="o-country">{t("operatorCountry")}</Label>
              <Input
                id="o-country"
                value={oCountry}
                onChange={(e) => setOCountry(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="DE"
                maxLength={2}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() =>
                  createOperator.mutate({
                    name: oName,
                    identifier: oIdentifier,
                    country: oCountry || undefined,
                  })
                }
                disabled={
                  !oName.trim() ||
                  !oIdentifier.trim() ||
                  createOperator.isPending
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
