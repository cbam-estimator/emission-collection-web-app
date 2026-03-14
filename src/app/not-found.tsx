import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NotFound() {
  const { userId } = await auth();

  if (userId) {
    redirect("/en");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <p className="text-lg font-semibold">CBAM Emission tracking</p>
      <p className="text-muted-foreground text-sm">
        Sign in to be redirected to your dashboard.
      </p>
      <Link
        href="/sign-in"
        className="text-primary text-sm underline underline-offset-4"
      >
        Sign in
      </Link>
    </div>
  );
}
