import { sql } from "drizzle-orm";
import { db } from "./index";
import * as schema from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Accept a Clerk user ID via CLI: pnpm db:seed -- user_xxxx
  // Or fall back to the first user already in the DB.
  const cliUserId = process.argv[2];

  let existingUser = await db.query.users.findFirst();

  if (!existingUser && cliUserId) {
    // Insert a placeholder user row so seeding can proceed.
    // The Clerk webhook will update it with the real email on first login.
    await db.insert(schema.users).values({
      id: cliUserId,
      email: `${cliUserId}@placeholder.local`,
      role: "admin",
    });
    existingUser = await db.query.users.findFirst();
  }

  if (!existingUser) {
    console.error(
      "❌ No user found. Pass your Clerk user ID as an argument:\n" +
        "   pnpm db:seed -- user_xxxxxxxxxxxxxxxxxxxx\n" +
        "   (Find it in the Clerk Dashboard → Users)",
    );
    return;
  }
  console.log(`Found user: ${existingUser.email} (${existingUser.id})`);

  // 2. Consultant
  await db.insert(schema.consultants).values({
    name: "Roman Haak",
    title: "CBAM Regulatory Specialist",
  });

  // 3. Operator
  const [operator] = await db
    .insert(schema.operators)
    .values({
      name: "Acme Industrial Steel",
      identifier: "VAT-GB-123456789",
      country: "GB",
    })
    .returning();
  if (!operator) throw new Error("❌ Operator creation failed.");

  await db
    .update(schema.users)
    .set({ operatorId: operator.id, role: "admin" })
    .where(sql`${schema.users.id} = ${existingUser.id}`);

  // 3. Installation
  const [installation] = await db
    .insert(schema.installations)
    .values({
      operatorId: operator.id,
      name: "Sheffield Primary Smelter",
      identifier: "EU-ETS-SHEF-001",
      address: "100 Steel Mill Lane, Sheffield",
    })
    .returning();
  if (!installation) throw new Error("❌ Installation creation failed.");

  const [installation2] = await db
    .insert(schema.installations)
    .values({
      operatorId: operator.id,
      name: "Manchester Aluminium Plant",
      identifier: "EU-ETS-MAN-002",
      address: "42 Foundry Road, Manchester",
    })
    .returning();
  if (!installation2) throw new Error("❌ Installation 2 creation failed.");

  // 4. Customers (EU importers)
  const [customerA] = await db
    .insert(schema.customers)
    .values({ operatorId: operator.id, name: "EuroImport GmbH", country: "DE" })
    .returning();

  const [customerB] = await db
    .insert(schema.customers)
    .values({ operatorId: operator.id, name: "Nordic Steel BV", country: "NL" })
    .returning();

  if (!customerA || !customerB) throw new Error("❌ Customer creation failed.");

  // 5. CN Code reference data
  await db.insert(schema.defdataCnCodes).values([
    {
      cnCode: "72011011",
      description:
        "Non-alloy pig iron containing by weight <= 0,5 % phosphorus",
      defaultData: {
        emissionFactor: 1.85,
        unit: "tCO2e/t",
        productionRoutes: [
          { value: "blast_furnace", label: "Blast Furnace" },
          { value: "direct_reduction", label: "Direct Reduction" },
        ],
      },
    },
    {
      cnCode: "73011000",
      description: "Sheet piling of iron or steel",
      defaultData: {
        emissionFactor: 2.1,
        unit: "tCO2e/t",
        productionRoutes: [
          { value: "electric_arc", label: "Electric Arc Furnace" },
          { value: "blast_furnace", label: "Blast Furnace" },
        ],
      },
    },
    {
      cnCode: "72083900",
      description:
        "Flat-rolled products of iron/non-alloy steel, width >= 600 mm, hot-rolled",
      defaultData: {
        emissionFactor: 1.95,
        unit: "tCO2e/t",
        productionRoutes: [{ value: "blast_furnace", label: "Blast Furnace" }],
      },
    },
  ]);

  // 6. Customer request from EuroImport GmbH — wants 2 CN codes for 2026-Q1
  const [requestA] = await db
    .insert(schema.requests)
    .values({
      customerId: customerA.id,
      installationId: installation.id,
      quarter: "2026-Q1",
      status: "pending",
    })
    .returning();
  if (!requestA) throw new Error("❌ Request A creation failed.");

  await db.insert(schema.requestCnCodes).values([
    { requestId: requestA.id, cnCode: "72011011" },
    { requestId: requestA.id, cnCode: "73011000" },
  ]);

  // 7. Customer request from Nordic Steel BV — wants the same 2 codes + 1 extra
  const [requestB] = await db
    .insert(schema.requests)
    .values({
      customerId: customerB.id,
      installationId: installation.id,
      quarter: "2026-Q1",
      status: "pending",
    })
    .returning();
  if (!requestB) throw new Error("❌ Request B creation failed.");

  await db.insert(schema.requestCnCodes).values([
    { requestId: requestB.id, cnCode: "72011011" },
    { requestId: requestB.id, cnCode: "72083900" },
  ]);

  // 8. Create installationCnCode entries for all requested codes (2026-Q1)
  //    72011011 is requested by both — one shared entry.
  await db.insert(schema.installationCnCodes).values([
    {
      installationId: installation.id,
      quarter: "2026-Q1",
      cnCode: "72011011",
      status: "pending",
    },
    {
      installationId: installation.id,
      quarter: "2026-Q1",
      cnCode: "73011000",
      status: "pending",
    },
    {
      installationId: installation.id,
      quarter: "2026-Q1",
      cnCode: "72083900",
      status: "pending",
    },
  ]);

  // 9. Audit log — request_created for both requests
  await db.insert(schema.auditLog).values([
    {
      userId: existingUser.id,
      event: "request_created",
      entityType: "request",
      entityId: requestA.id,
      metadata: {
        customerId: customerA.id,
        quarter: "2026-Q1",
        cnCodes: ["72011011", "73011000"],
      },
    },
    {
      userId: existingUser.id,
      event: "request_created",
      entityType: "request",
      entityId: requestB.id,
      metadata: {
        customerId: customerB.id,
        quarter: "2026-Q1",
        cnCodes: ["72011011", "72083900"],
      },
    },
  ]);

  console.log("✅ Seeding complete!");
  console.log(`   Consultant:    Roman Haak`);
  console.log(`   Operator:      ${operator.name}`);
  console.log(`   Installations: ${installation.name}, ${installation2.name}`);
  console.log(`   Customers:     ${customerA.name}, ${customerB.name}`);
  console.log(`   Requests:      2 (both for 2026-Q1)`);
  console.log(`   CN codes:      72011011, 73011000, 72083900`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
