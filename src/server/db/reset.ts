/**
 * Drops all emission_collection_* tables so you can run db:push fresh.
 * Dev only — never run against production.
 */
import { db } from "./index";
import { sql } from "drizzle-orm";

async function reset() {
  console.log("🗑️  Dropping all emission_collection_* tables...");

  // Drop in reverse dependency order to avoid FK constraint errors
  const tables = [
    "emission_collection_audit_log",
    "emission_collection_request_cn_code",
    "emission_collection_installation_cn_code",
    "emission_collection_request",
    "emission_collection_customer",
    "emission_collection_installation",
    "emission_collection_user",
    "emission_collection_operator",
    "emission_collection_consultant",
    "emission_collection_defdata_cn_code",
  ];

  for (const table of tables) {
    await db.run(sql.raw(`DROP TABLE IF EXISTS "${table}"`));
    console.log(`   Dropped ${table}`);
  }

  console.log("✅ Reset complete. Run db:push then db:seed.");
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
