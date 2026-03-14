import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  installationCnCodes,
  installations,
  defdataCnCodes,
  users,
  requests,
  requestCnCodes,
  customers,
  auditLog,
} from "@/server/db/schema";
import type { db as Db } from "@/server/db";

// Verify caller can access the installation and return the installation row
async function assertInstallationAccess(
  db: typeof Db,
  userId: string,
  installationId: number,
) {
  const installation = await db.query.installations.findFirst({
    where: eq(installations.id, installationId),
  });
  if (!installation) throw new TRPCError({ code: "NOT_FOUND" });

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (user?.role !== "admin" && user?.operatorId !== installation.operatorId) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return { installation, user };
}

export const installationCnCodeRouter = createTRPCRouter({
  // Returns the distinct quarters that have installationCnCode entries for an installation
  getQuarters: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertInstallationAccess(ctx.db, ctx.userId, input.installationId);

      const rows = await ctx.db
        .selectDistinct({ quarter: installationCnCodes.quarter })
        .from(installationCnCodes)
        .where(eq(installationCnCodes.installationId, input.installationId))
        .orderBy(installationCnCodes.quarter);

      return rows.map((r) => r.quarter);
    }),

  // Returns all CN code entries for a given installation + quarter, with
  // reference data and the names of customers waiting on each code.
  getByInstallationAndQuarter: protectedProcedure
    .input(z.object({ installationId: z.number(), quarter: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertInstallationAccess(ctx.db, ctx.userId, input.installationId);

      const rows = await ctx.db
        .select({
          id: installationCnCodes.id,
          installationId: installationCnCodes.installationId,
          quarter: installationCnCodes.quarter,
          cnCode: installationCnCodes.cnCode,
          status: installationCnCodes.status,
          emissionData: installationCnCodes.emissionData,
          filledBy: installationCnCodes.filledBy,
          filledAt: installationCnCodes.filledAt,
          description: defdataCnCodes.description,
          defaultData: defdataCnCodes.defaultData,
        })
        .from(installationCnCodes)
        .leftJoin(
          defdataCnCodes,
          eq(installationCnCodes.cnCode, defdataCnCodes.cnCode),
        )
        .where(
          and(
            eq(installationCnCodes.installationId, input.installationId),
            eq(installationCnCodes.quarter, input.quarter),
          ),
        );

      // For each CN code, find the customers whose requests include it
      const enriched = await Promise.all(
        rows.map(async (row) => {
          const requestingCustomers = await ctx.db
            .selectDistinct({ name: customers.name, id: customers.id })
            .from(requestCnCodes)
            .innerJoin(requests, eq(requestCnCodes.requestId, requests.id))
            .innerJoin(customers, eq(requests.customerId, customers.id))
            .where(
              and(
                eq(requests.installationId, input.installationId),
                eq(requests.quarter, input.quarter),
                eq(requestCnCodes.cnCode, row.cnCode),
              ),
            );

          return { ...row, requestingCustomers };
        }),
      );

      return enriched;
    }),

  // Fills in emission data for one installationCnCode entry.
  // Logs an audit event, then checks whether any linked requests are now complete.
  fill: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        emissionData: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.query.installationCnCodes.findFirst({
        where: eq(installationCnCodes.id, input.id),
      });
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });

      await assertInstallationAccess(ctx.db, ctx.userId, entry.installationId);

      // Fill the CN code entry
      await ctx.db
        .update(installationCnCodes)
        .set({
          emissionData: input.emissionData,
          status: "filled",
          filledBy: ctx.userId,
          filledAt: new Date(),
        })
        .where(eq(installationCnCodes.id, input.id));

      // Audit: cn_code_filled
      await ctx.db.insert(auditLog).values({
        userId: ctx.userId,
        event: "cn_code_filled",
        entityType: "installation_cn_code",
        entityId: input.id,
        metadata: {
          installationId: entry.installationId,
          quarter: entry.quarter,
          cnCode: entry.cnCode,
        },
      });

      // Find all requests that include this (installation, quarter, cnCode)
      const linkedRequests = await ctx.db
        .selectDistinct({ requestId: requestCnCodes.requestId })
        .from(requestCnCodes)
        .innerJoin(requests, eq(requestCnCodes.requestId, requests.id))
        .where(
          and(
            eq(requests.installationId, entry.installationId),
            eq(requests.quarter, entry.quarter),
            eq(requestCnCodes.cnCode, entry.cnCode),
          ),
        );

      // For each linked request, check whether all its CN codes are now filled
      for (const { requestId } of linkedRequests) {
        const allCodes = await ctx.db
          .select({ cnCode: requestCnCodes.cnCode })
          .from(requestCnCodes)
          .where(eq(requestCnCodes.requestId, requestId));

        const cnCodeList = allCodes.map((r) => r.cnCode);

        const filledCount = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(installationCnCodes)
          .where(
            and(
              eq(installationCnCodes.installationId, entry.installationId),
              eq(installationCnCodes.quarter, entry.quarter),
              inArray(installationCnCodes.cnCode, cnCodeList),
              eq(installationCnCodes.status, "filled"),
            ),
          );

        const filled = filledCount[0]?.count ?? 0;

        if (filled >= cnCodeList.length) {
          // All CN codes for this request are filled → complete it
          await ctx.db
            .update(requests)
            .set({ status: "completed" })
            .where(eq(requests.id, requestId));

          await ctx.db.insert(auditLog).values({
            userId: ctx.userId,
            event: "request_completed",
            entityType: "request",
            entityId: requestId,
            metadata: {
              installationId: entry.installationId,
              quarter: entry.quarter,
            },
          });
        } else {
          // At least one filled → mark in_progress if still pending
          await ctx.db
            .update(requests)
            .set({ status: "in_progress" })
            .where(
              and(eq(requests.id, requestId), eq(requests.status, "pending")),
            );
        }
      }
    }),
});
