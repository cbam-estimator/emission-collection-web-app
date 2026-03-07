import { eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import { consultants, installations, operators, users } from "@/server/db/schema";

export const adminRouter = createTRPCRouter({
  // ─── Users ──────────────────────────────────────────────────────────────────

  getAllUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.query.users.findMany({
      with: { consultant: true, operator: true },
    });
  }),

  setUserConsultant: adminProcedure
    .input(z.object({ userId: z.string(), consultantId: z.number().nullable() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({ consultantId: input.consultantId })
        .where(eq(users.id, input.userId));
    }),

  setUserOperator: adminProcedure
    .input(z.object({ userId: z.string(), operatorId: z.number().nullable() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({ operatorId: input.operatorId })
        .where(eq(users.id, input.userId));
    }),

  setUserRole: adminProcedure
    .input(z.object({ userId: z.string(), role: z.enum(["admin", "operator_user"]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));
    }),

  // ─── Consultants ────────────────────────────────────────────────────────────

  getConsultants: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.query.consultants.findMany();
  }),

  createConsultant: adminProcedure
    .input(z.object({ name: z.string().min(1), title: z.string().min(1), avatarUrl: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db.insert(consultants).values(input).returning();
      return created;
    }),

  deleteConsultant: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(users).set({ consultantId: null }).where(eq(users.consultantId, input.id));
      await ctx.db.delete(consultants).where(eq(consultants.id, input.id));
    }),

  // ─── Operators ──────────────────────────────────────────────────────────────

  getOperators: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.query.operators.findMany({ with: { installations: true } });
  }),

  createInstallation: adminProcedure
    .input(z.object({
      operatorId: z.number(),
      name: z.string().min(1),
      identifier: z.string().optional(),
      address: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db.insert(installations).values(input).returning();
      return created;
    }),

  deleteInstallation: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(installations).where(eq(installations.id, input.id));
    }),

  createOperator: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      identifier: z.string().min(1),
      country: z.string().length(2).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db.insert(operators).values(input).returning();
      return created;
    }),

  deleteOperator: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(users).set({ operatorId: null }).where(eq(users.operatorId, input.id));
      await ctx.db.delete(operators).where(eq(operators.id, input.id));
    }),
});
