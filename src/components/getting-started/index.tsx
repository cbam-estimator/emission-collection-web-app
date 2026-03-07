"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface Customer {
  id: number;
  name: string;
}

interface GettingStartedCardProps {
  customers?: Customer[];
  onStart?: () => void;
}

export function GettingStartedCard({
  customers = [],
  onStart,
}: GettingStartedCardProps) {
  const t = useTranslations("gettingStarted");

  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="flex flex-col items-center text-center">
        <Image
          src="/welcome.svg"
          alt="Welcome"
          width={192}
          height={128}
          loading="eager"
          className="mb-6"
        />

        {/* Heading */}
        <h1 className="mb-2 text-xl font-semibold text-balance">
          {t("title")}
        </h1>
        <h2 className="mb-4 text-lg font-medium">{t("subtitle")}</h2>

        {/* Description */}
        <p className="text-muted-foreground mb-6 max-w-lg text-sm text-pretty">
          {t("description")}
        </p>

        {/* Customers Section */}
        <p className="mb-3 text-sm font-medium">{t("customersLabel")}</p>
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {customers.map((customer) => (
            <Badge key={customer.id} variant="secondary">
              {customer.name}
            </Badge>
          ))}
        </div>

        {/* Start Button */}
        <Button onClick={onStart} className="w-48">
          {t("start")}
        </Button>
      </CardContent>
    </Card>
  );
}
