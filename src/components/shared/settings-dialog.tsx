"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

type ProfileErrors = Partial<Record<"phone", string>>;

function ProfileFormSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-2">
      <div className="space-y-2">
        <div className="bg-muted h-4 w-10 rounded" />
        <div className="bg-muted h-9 w-full rounded-md" />
      </div>
      <div className="space-y-2">
        <div className="bg-muted h-4 w-14 rounded" />
        <div className="bg-muted h-9 w-full rounded-md" />
      </div>
      <div className="flex justify-end">
        <div className="bg-muted h-9 w-16 rounded-md" />
      </div>
    </div>
  );
}

function ProfileForm({ onSaved }: { onSaved: () => void }) {
  const t = useTranslations("settings");
  const [profile] = api.user.getProfile.useSuspenseQuery();
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [errors, setErrors] = useState<ProfileErrors>({});

  const utils = api.useUtils();
  const updateProfile = api.user.updateProfile.useMutation();

  const profileSchema = z.object({
    phone: z
      .string()
      .regex(/^\+?[\d\s\-(). ]{7,20}$/, t("invalidPhone"))
      .optional()
      .or(z.literal("")),
  });

  async function handleSave() {
    const result = profileSchema.safeParse({ phone });
    if (!result.success) {
      const fieldErrors: ProfileErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ProfileErrors;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await updateProfile.mutateAsync({ phone });
    await utils.user.getProfile.invalidate();
    toast.success(t("profileUpdated"));
    onSaved();
  }

  return (
    <>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <div className="px-px py-px">
            <Input
              id="email"
              type="email"
              value={profile?.email ?? ""}
              disabled
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("contact")}</Label>
          <div className="px-px py-px">
            <Input
              id="phone"
              type="tel"
              placeholder="+1 234 567 890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={!!errors.phone}
            />
          </div>
          {errors.phone && (
            <p className="text-destructive text-sm">{errors.phone}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateProfile.isPending}>
          {updateProfile.isPending ? t("saving") : t("save")}
        </Button>
      </div>
    </>
  );
}

export function SettingsDialog() {
  const t = useTranslations("settings");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Settings className="size-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-105">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              {t("title")}
            </DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <Suspense fallback={<ProfileFormSkeleton />}>
            <ProfileForm onSaved={() => setOpen(false)} />
          </Suspense>
        </DialogContent>
      </Dialog>
    </>
  );
}
