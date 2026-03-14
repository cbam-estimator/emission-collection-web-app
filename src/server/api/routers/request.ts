import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  requests,
  requestCnCodes,
  installationCnCodes,
  installations,
  customers,
  users,
  auditLog,
  defdataCnCodes,
} from "@/server/db/schema";
import type { db as Db } from "@/server/db";

async function assertOperatorAccess(
  db: typeof Db,
  userId: string,
  operatorId: number,
) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (user?.role !== "admin" && user?.operatorId !== operatorId) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return user;
}

export const requestRouter = createTRPCRouter({
  // Returns all requests for an operator's installations, grouped with customer
  // and installation info + CN code fill status.
  getByOperator: protectedProcedure
    .input(z.object({ operatorId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertOperatorAccess(ctx.db, ctx.userId, input.operatorId);

      // Get all installations for this operator
      const operatorInstallations = await ctx.db.query.installations.findMany({
        where: eq(installations.operatorId, input.operatorId),
      });
      const installationIds = operatorInstallations.map((i) => i.id);
      if (installationIds.length === 0) return [];

      // Get all requests for those installations
      const allRequests = await ctx.db.query.requests.findMany({
        where: (r, { inArray }) => inArray(r.installationId, installationIds),
        with: {
          customer: true,
          installation: true,
          cnCodes: true,
        },
        orderBy: (r, { desc }) => [desc(r.createdAt)],
      });

      // Enrich each request with per-CN-code fill status
      const enriched = await Promise.all(
        allRequests.map(async (request) => {
          const cnCodesWithStatus = await Promise.all(
            request.cnCodes.map(async (rc) => {
              const entry = await ctx.db.query.installationCnCodes.findFirst({
                where: and(
                  eq(
                    installationCnCodes.installationId,
                    request.installationId,
                  ),
                  eq(installationCnCodes.quarter, request.quarter),
                  eq(installationCnCodes.cnCode, rc.cnCode),
                ),
              });
              const defData = await ctx.db.query.defdataCnCodes.findFirst({
                where: eq(defdataCnCodes.cnCode, rc.cnCode),
              });
              return {
                cnCode: rc.cnCode,
                description: defData?.description ?? null,
                status: entry?.status ?? "pending",
              };
            }),
          );
          return { ...request, cnCodes: cnCodesWithStatus };
        }),
      );

      return enriched;
    }),

  // Returns requests for a specific installation
  getByInstallation: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const installation = await ctx.db.query.installations.findFirst({
        where: eq(installations.id, input.installationId),
      });
      if (!installation) throw new TRPCError({ code: "NOT_FOUND" });

      await assertOperatorAccess(ctx.db, ctx.userId, installation.operatorId);

      return ctx.db.query.requests.findMany({
        where: eq(requests.installationId, input.installationId),
        with: {
          customer: true,
          cnCodes: true,
        },
        orderBy: (r, { desc }) => [desc(r.createdAt)],
      });
    }),

  // Creates a customer request with specific CN codes.
  // Also upserts installationCnCode entries (without overwriting already-filled ones).
  create: protectedProcedure
    .input(
      z.object({
        customerId: z.number(),
        installationId: z.number(),
        quarter: z.string().regex(/^\d{4}-Q[1-4]$/, "Format must be YYYY-Qn"),
        cnCodes: z.array(z.string()).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const installation = await ctx.db.query.installations.findFirst({
        where: eq(installations.id, input.installationId),
      });
      if (!installation) throw new TRPCError({ code: "NOT_FOUND" });

      await assertOperatorAccess(ctx.db, ctx.userId, installation.operatorId);

      const customer = await ctx.db.query.customers.findFirst({
        where: eq(customers.id, input.customerId),
      });
      if (!customer) throw new TRPCError({ code: "NOT_FOUND" });
      if (customer.operatorId !== installation.operatorId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Validate all CN codes exist in the reference data
      for (const code of input.cnCodes) {
        const exists = await ctx.db.query.defdataCnCodes.findFirst({
          where: eq(defdataCnCodes.cnCode, code),
        });
        if (!exists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `CN code "${code}" not found in reference data`,
          });
        }
      }

      // Create the request (unique per customer + installation + quarter)
      const [request] = await ctx.db
        .insert(requests)
        .values({
          customerId: input.customerId,
          installationId: input.installationId,
          quarter: input.quarter,
          status: "pending",
        })
        .returning();

      if (!request) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Create requestCnCode rows
      await ctx.db.insert(requestCnCodes).values(
        input.cnCodes.map((code) => ({
          requestId: request.id,
          cnCode: code,
        })),
      );

      // Upsert installationCnCode entries — only insert if not already present
      // (preserves any data already filled for this installation/quarter/cnCode)
      for (const code of input.cnCodes) {
        const existing = await ctx.db.query.installationCnCodes.findFirst({
          where: and(
            eq(installationCnCodes.installationId, input.installationId),
            eq(installationCnCodes.quarter, input.quarter),
            eq(installationCnCodes.cnCode, code),
          ),
        });
        if (!existing) {
          await ctx.db.insert(installationCnCodes).values({
            installationId: input.installationId,
            quarter: input.quarter,
            cnCode: code,
            status: "pending",
          });
        }
      }

      // Audit: request_created
      await ctx.db.insert(auditLog).values({
        userId: ctx.userId,
        event: "request_created",
        entityType: "request",
        entityId: request.id,
        metadata: {
          customerId: input.customerId,
          installationId: input.installationId,
          quarter: input.quarter,
          cnCodes: input.cnCodes,
        },
      });

      return request;
    }),

  // Logs a request_consulted audit event
  logConsulted: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.query.requests.findFirst({
        where: eq(requests.id, input.requestId),
        with: { installation: true },
      });
      if (!request) throw new TRPCError({ code: "NOT_FOUND" });

      await assertOperatorAccess(
        ctx.db,
        ctx.userId,
        request.installation.operatorId,
      );

      await ctx.db.insert(auditLog).values({
        userId: ctx.userId,
        event: "request_consulted",
        entityType: "request",
        entityId: input.requestId,
      });
    }),
});
