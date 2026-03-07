import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  installationCnCodes,
  installations,
  defdataCnCodes,
  users,
} from "@/server/db/schema";

export const installationCnCodeRouter = createTRPCRouter({
  // Returns all CN codes for an installation, joined with reference data
  getByInstallation: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify the user can access this installation
      const installation = await ctx.db.query.installations.findFirst({
        where: eq(installations.id, input.installationId),
      });

      if (!installation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
      });

      if (
        user?.role !== "admin" &&
        user?.operatorId !== installation.operatorId
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const rows = await ctx.db
        .select({
          id: installationCnCodes.id,
          installationId: installationCnCodes.installationId,
          cnCode: installationCnCodes.cnCode,
          resolved: installationCnCodes.resolved,
          description: defdataCnCodes.description,
          defaultData: defdataCnCodes.defaultData,
        })
        .from(installationCnCodes)
        .leftJoin(
          defdataCnCodes,
          eq(installationCnCodes.cnCode, defdataCnCodes.cnCode),
        )
        .where(eq(installationCnCodes.installationId, input.installationId));

      return rows;
    }),

  // Marks a CN code as resolved or unresolved for an installation
  setResolved: protectedProcedure
    .input(
      z.object({
        installationId: z.number(),
        cnCode: z.string(),
        resolved: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const installation = await ctx.db.query.installations.findFirst({
        where: eq(installations.id, input.installationId),
      });

      if (!installation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
      });

      if (
        user?.role !== "admin" &&
        user?.operatorId !== installation.operatorId
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db
        .update(installationCnCodes)
        .set({ resolved: input.resolved })
        .where(
          and(
            eq(installationCnCodes.installationId, input.installationId),
            eq(installationCnCodes.cnCode, input.cnCode),
          ),
        );
    }),
});
