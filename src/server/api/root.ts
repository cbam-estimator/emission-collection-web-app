import { userRouter } from "@/server/api/routers/user";
import { operatorRouter } from "@/server/api/routers/operator";
import { installationRouter } from "@/server/api/routers/installation";
import { customerRouter } from "@/server/api/routers/customer";
import { installationCnCodeRouter } from "@/server/api/routers/installationCnCode";
import { adminRouter } from "@/server/api/routers/admin";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  operator: operatorRouter,
  installation: installationRouter,
  customer: customerRouter,
  installationCnCode: installationCnCodeRouter,
  admin: adminRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
