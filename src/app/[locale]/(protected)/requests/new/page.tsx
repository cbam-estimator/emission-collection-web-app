"use client";

import { CBAMLayout } from "@/components/shared/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import { X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const QUARTERS = [
  "2025-Q1",
  "2025-Q2",
  "2025-Q3",
  "2025-Q4",
  "2026-Q1",
  "2026-Q2",
  "2026-Q3",
  "2026-Q4",
];

function NewRequestContent() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [installationId, setInstallationId] = useState<number | null>(null);
  const [quarter, setQuarter] = useState("");
  const [cnCodeInput, setCnCodeInput] = useState("");
  const [cnCodes, setCnCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: operator } = api.operator.getMine.useQuery();

  const { data: installations = [] } = api.installation.getByOperator.useQuery(
    { operatorId: operator?.id ?? 0 },
    { enabled: !!operator?.id },
  );

  const { data: customers = [] } = api.customer.getByOperator.useQuery(
    { operatorId: operator?.id ?? 0 },
    { enabled: !!operator?.id },
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: allCnCodes = [] } = api.installationCnCode.getQuarters.useQuery(
    { installationId: installationId ?? 0 },
    { enabled: false }, // just used to borrow the auth; we fetch defdata separately
  );

  // Fetch all known CN codes from defdata for suggestions
  const createMutation = api.request.create.useMutation({
    onSuccess: () => {
      router.push(`/${locale}/requests`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  function addCnCode() {
    const code = cnCodeInput.trim();
    if (!code) return;
    if (cnCodes.includes(code)) {
      setError(`CN code "${code}" already added`);
      return;
    }
    setCnCodes((prev) => [...prev, code]);
    setCnCodeInput("");
    setError(null);
  }

  function removeCnCode(code: string) {
    setCnCodes((prev) => prev.filter((c) => c !== code));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerId) return setError("Select a customer");
    if (!installationId) return setError("Select an installation");
    if (!quarter) return setError("Select a quarter");
    if (cnCodes.length === 0) return setError("Add at least one CN code");

    createMutation.mutate({
      customerId,
      installationId,
      quarter,
      cnCodes,
    });
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Mock Customer Request</CardTitle>
          <p className="text-muted-foreground text-sm">
            Simulate a customer requesting CN code emission data from one of
            your installations.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Customer */}
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select
                value={customerId?.toString() ?? ""}
                onValueChange={(v) => setCustomerId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer…" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                      {c.country ? ` (${c.country})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Installation */}
            <div className="space-y-1.5">
              <Label>Installation</Label>
              <Select
                value={installationId?.toString() ?? ""}
                onValueChange={(v) => setInstallationId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select installation…" />
                </SelectTrigger>
                <SelectContent>
                  {installations.map((i) => (
                    <SelectItem key={i.id} value={i.id.toString()}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quarter */}
            <div className="space-y-1.5">
              <Label>Quarter</Label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quarter…" />
                </SelectTrigger>
                <SelectContent>
                  {QUARTERS.map((q) => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CN Codes */}
            <div className="space-y-1.5">
              <Label>CN Codes</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. 72011011"
                  value={cnCodeInput}
                  onChange={(e) => setCnCodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCnCode();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addCnCode}>
                  Add
                </Button>
              </div>
              {cnCodes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {cnCodes.map((code) => (
                    <Badge
                      key={code}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <span className="font-mono">{code}</span>
                      <button
                        type="button"
                        onClick={() => removeCnCode(code)}
                        className="hover:text-destructive ml-1"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/${locale}/requests`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating…" : "Create Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <CBAMLayout title="New Request">
      <NewRequestContent />
    </CBAMLayout>
  );
}
