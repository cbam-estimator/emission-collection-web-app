"use client";

import { CBAMLayout } from "@/components/shared/layout";
import { api } from "@/trpc/react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Circle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "secondary",
  in_progress: "default",
  completed: "outline",
};

function RequestsPageContent() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { data: operator } = api.operator.getMine.useQuery();
  const { data: requests = [], isLoading } = api.request.getByOperator.useQuery(
    { operatorId: operator?.id ?? 0 },
    { enabled: !!operator?.id },
  );

  const logConsulted = api.request.logConsulted.useMutation();

  function handleGoFill(
    installationId: number,
    quarter: string,
    cnCode: string,
    requestId: number,
  ) {
    logConsulted.mutate({ requestId });
    router.push(`/${locale}/cn/${installationId}/${quarter}/${cnCode}`);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">No requests yet.</p>
          <Button onClick={() => router.push(`/${locale}/requests/new`)}>
            <Plus className="mr-2 size-4" />
            Mock a request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {requests.length} request{requests.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/${locale}/requests/new`)}
        >
          <Plus className="mr-2 size-4" />
          Mock request
        </Button>
      </div>

      {requests.map((request) => (
        <Card key={request.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">
                  {request.customer.name}
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {request.installation.name} · {request.quarter}
                </p>
              </div>
              <Badge variant={STATUS_VARIANTS[request.status] ?? "secondary"}>
                {STATUS_LABELS[request.status] ?? request.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {request.cnCodes.map((code) => {
                const isFilled = code.status === "filled";
                return (
                  <div
                    key={code.cnCode}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full border-2",
                          isFilled
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30",
                        )}
                      >
                        {isFilled ? (
                          <Check className="size-3" />
                        ) : (
                          <Circle className="text-muted-foreground/30 size-3" />
                        )}
                      </div>
                      <div>
                        <span className="font-mono text-sm font-medium">
                          {code.cnCode}
                        </span>
                        {code.description && (
                          <p className="text-muted-foreground text-xs">
                            {code.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {!isFilled && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleGoFill(
                            request.installationId,
                            request.quarter,
                            code.cnCode,
                            request.id,
                          )
                        }
                      >
                        Fill in
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function RequestsPage() {
  return (
    <CBAMLayout title="Requests">
      <RequestsPageContent />
    </CBAMLayout>
  );
}
