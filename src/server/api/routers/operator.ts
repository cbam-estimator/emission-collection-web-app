import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { operators, users } from "@/server/db/schema";

export const operatorRouter = createTRPCRouter({
  // Returns the operator the current user belongs to
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
    });

    if (!user?.operatorId) return null;

    const operator = await ctx.db.query.operators.findFirst({
      where: eq(operators.id, user.operatorId),
    });

    return operator ?? null;
  }),

  // Admin only: returns all operators
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
    });

    if (user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return ctx.db.query.operators.findMany();
  }),
});
