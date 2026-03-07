import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { customers, users } from "@/server/db/schema";

export const customerRouter = createTRPCRouter({
  getByOperator: protectedProcedure
    .input(z.object({ operatorId: z.number() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
      });

      // Operator users can only query their own operator's customers
      if (user?.role !== "admin" && user?.operatorId !== input.operatorId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.query.customers.findMany({
        where: eq(customers.operatorId, input.operatorId),
      });
    }),
});
