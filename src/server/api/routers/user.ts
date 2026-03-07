import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { users } from "@/server/db/schema";
import { currentUser } from "@clerk/nextjs/server";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
      with: { consultant: true },
    });
    return user ?? null;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        // email: z.email("Invalid email address"),
        phone: z
          .string()
          .regex(/^\+?[\d\s\-(). ]{7,20}$/, "Invalid phone number")
          .optional()
          .or(z.literal("")),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const clerkUser = await currentUser();
      const fallbackEmail = clerkUser?.emailAddresses[0]?.emailAddress;

      if (!fallbackEmail) {
        throw new Error("No email found for the user");
      }

      await ctx.db
        .insert(users)
        .values({
          id: ctx.userId,
          email: fallbackEmail,
          phone: input.phone || null,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            // email: input.email,
            phone: input.phone || null,
          },
        });
    }),
});
