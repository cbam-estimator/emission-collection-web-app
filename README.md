# Emission Collection

A web application for collecting and managing carbon emissions data under the EU's **Carbon Border Adjustment Mechanism (CBAM)** regulation. It enables industrial operators to report emissions for their production facilities and product categories, and allows administrators to manage users, operators, and expert consultants.

## What it does

- **Operators** log in and submit emissions data for their installations (production facilities), organized by CN (Combined Nomenclature) product codes
- **Admins** manage users, operators, installations, and assign expert consultants
- **Consultants** can be assigned to users to provide guidance during the reporting process
- Tracks reporting periods and submission status (pending / submitted / approved / rejected)
- Supports multiple installations per operator with progress tracking across CN codes
- Available in 6 languages: English, German, French, Spanish, Polish, Turkish

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| UI Components | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://radix-ui.com) |
| API | [tRPC](https://trpc.io) + [TanStack Query](https://tanstack.com/query) |
| Database | [Turso](https://turso.tech) (LibSQL / SQLite) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Auth | [Clerk](https://clerk.com) |
| Validation | [Zod](https://zod.dev) |
| i18n | [next-intl](https://next-intl-docs.vercel.app) |
| Package Manager | [pnpm](https://pnpm.io) |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A [Turso](https://turso.tech) database
- A [Clerk](https://clerk.com) application

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env` and fill in your environment variables:
   ```
   DATABASE_URL=
   DATABASE_AUTH_TOKEN=
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   CLERK_WEBHOOK_SECRET=
   ```

3. Push the database schema:
   ```bash
   pnpm db:push
   ```

4. (Optional) Seed the database:
   ```bash
   pnpm db:seed
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:migrate` | Run migrations |
