import { sql } from "drizzle-orm";
import { db } from "./index"; // Adjust to your db connection path
import * as schema from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Get your existing user
  const existingUser = await db.query.users.findFirst();

  if (!existingUser) {
    console.error(
      "❌ No user found in database. Please create a user via Clerk/Webhook first.",
    );
    return;
  }

  console.log(`Found user: ${existingUser.email} (${existingUser.id})`);

  // 2. Create an Operator
  const [operator] = await db
    .insert(schema.operators)
    .values({
      name: "Acme Industrial Steel",
      identifier: "VAT-GB-123456789",
      country: "GB",
    })
    .returning();

  // Update the user to belong to this operator
  if (!operator) {
    throw new Error("❌ Operator was not created successfully.");
  }
  await db
    .update(schema.users)
    .set({ operatorId: operator.id, role: "admin" })
    .where(sql`${schema.users.id} = ${existingUser.id}`);

  // 3. Create an Installation
  const [installation] = await db
    .insert(schema.installations)
    .values({
      operatorId: operator.id,
      name: "Sheffield Primary Smelter",
      identifier: "EU-ETS-SHEF-001",
      address: "100 Steel Mill Lane, Sheffield",
    })
    .returning();

  // 4. Create a Customer (The EU Importer)
  await db.insert(schema.customers).values({
    operatorId: operator.id,
    name: "EuroImport GmbH",
    country: "DE",
  });

  // 5. Create CN Codes (Default Data)
  await db.insert(schema.defdataCnCodes).values([
    {
      cnCode: "72011011",
      description:
        "Non-alloy pig iron containing by weight <= 0,5 % phosphorus",
      defaultData: { emissionFactor: 1.85, unit: "tCO2e/t" },
    },
    {
      cnCode: "73011000",
      description: "Sheet piling of iron or steel",
      defaultData: { emissionFactor: 2.1, unit: "tCO2e/t" },
    },
  ]);

  // 6. Link CN Code to Installation
  if (!installation) {
    throw new Error("❌ Installation was not created successfully.");
  }
  await db.insert(schema.installationCnCodes).values({
    installationId: installation.id,
    cnCode: "72011011",
    resolved: true,
  });

  // 7. Create a Request
  await db.insert(schema.requests).values({
    installationId: installation.id,
    period: "2024-Q1",
    status: "pending",
    dueDate: new Date("2024-04-30"),
  });

  // 8. Add an Audit Log entry
  await db.insert(schema.auditLog).values({
    userId: existingUser.id,
    event: "login",
    entityType: "user",
    entityId: 1, // Reference to self or record
    metadata: { ip: "127.0.0.1", userAgent: "Mozilla/5.0" },
  });

  console.log("✅ Seeding complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
