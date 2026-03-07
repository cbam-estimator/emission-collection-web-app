import { Webhook } from "svix";
import { headers } from "next/headers";
import { type WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { env } from "@/env";

export async function POST(req: Request) {
  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();

  let event: WebhookEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "user.created") {
    const { id, email_addresses } = event.data;
    const email = email_addresses[0]?.email_address;

    if (!email) {
      return new Response("No email on user", { status: 400 });
    }

    await db.insert(users).values({ id, email }).onConflictDoNothing();
  }

  if (event.type === "user.updated") {
    const { id, email_addresses } = event.data;
    const email = email_addresses[0]?.email_address;

    if (email) {
      await db
        .insert(users)
        .values({ id, email })
        .onConflictDoUpdate({ target: users.id, set: { email } });
    }
  }

  return new Response("OK", { status: 200 });
}
