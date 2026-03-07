import { relations, sql } from "drizzle-orm";
import { index, sqliteTableCreator } from "drizzle-orm/sqlite-core";

export const createTable = sqliteTableCreator(
  (name) => `emission_collection_${name}`,
);

// Expert consultants that can be assigned to users.
export const consultants = createTable("consultant", (d) => ({
  id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  name: d.text().notNull(),
  title: d.text().notNull(),
  avatarUrl: d.text(),
  createdAt: d
    .integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
}));

// Mirrors Clerk users. Created via webhook on user.created event.
export const users = createTable(
  "user",
  (d) => ({
    id: d.text().primaryKey(), // Clerk userId (e.g. "user_xxx")
    email: d.text().notNull().unique(),
    role: d
      .text({ enum: ["admin", "operator_user"] })
      .notNull()
      .default("operator_user"),
    operatorId: d
      .integer({ mode: "number" })
      .references(() => operators.id, { onDelete: "set null" }),
    consultantId: d
      .integer({ mode: "number" })
      .references(() => consultants.id, { onDelete: "set null" }),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    phone: d.text(),
    lastLoginAt: d.integer({ mode: "timestamp" }),
  }),
  (t) => [index("user_email_idx").on(t.email)],
);

export const usersRelations = relations(users, ({ one }) => ({
  consultant: one(consultants, {
    fields: [users.consultantId],
    references: [consultants.id],
  }),
  operator: one(operators, {
    fields: [users.operatorId],
    references: [operators.id],
  }),
}));

export const consultantsRelations = relations(consultants, ({ many }) => ({
  users: many(users),
}));

// Legal entities that must report emissions. One operator → many users, many installations.
export const operators = createTable("operator", (d) => ({
  id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  name: d.text().notNull(),
  // Official registration / identifier (e.g. VAT number, permit holder ID)
  identifier: d.text().notNull().unique(),
  country: d.text({ length: 2 }), // ISO 3166-1 alpha-2
  createdAt: d
    .integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
}));

// Production plants / facilities belonging to an operator.
export const installations = createTable(
  "installation",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    operatorId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => operators.id, { onDelete: "cascade" }),
    name: d.text().notNull(),
    address: d.text(),
    // Official installation identifier (e.g. EU ETS permit number)
    identifier: d.text().unique(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("installation_operator_idx").on(t.operatorId)],
);

// Emission reporting requests scoped to an installation and a reporting period.
export const requests = createTable(
  "request",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    installationId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => installations.id, { onDelete: "cascade" }),
    status: d
      .text({ enum: ["pending", "submitted", "approved", "rejected"] })
      .notNull()
      .default("pending"),
    // Reporting period, e.g. "2024" or "2024-Q1"
    period: d.text().notNull(),
    dueDate: d.integer({ mode: "timestamp" }),
    submittedAt: d.integer({ mode: "timestamp" }),
    submittedBy: d.text().references(() => users.id, { onDelete: "set null" }),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("request_installation_idx").on(t.installationId),
    index("request_status_idx").on(t.status),
  ],
);

export const auditLog = createTable(
  "audit_log",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: d.text().references(() => users.id, { onDelete: "set null" }),
    event: d
      .text({
        enum: [
          "login",
          "invitation_sent",
          "request_consulted",
          "request_submitted",
          "request_approved",
          "request_rejected",
        ],
      })
      .notNull(),
    // Polymorphic reference to the affected entity
    entityType: d.text({
      enum: ["request", "installation", "operator", "user"],
    }),
    entityId: d.integer({ mode: "number" }),
    // Any extra structured context (IP, user agent, diff, etc.)
    metadata: d.text({ mode: "json" }),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [
    index("audit_log_user_idx").on(t.userId),
    index("audit_log_event_idx").on(t.event),
  ],
);

// EU importer companies that request CBAM emission data from an operator.
export const customers = createTable(
  "customer",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    operatorId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => operators.id, { onDelete: "cascade" }),
    name: d.text().notNull(),
    country: d.text({ length: 2 }),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("customer_operator_idx").on(t.operatorId)],
);

export const operatorsRelations = relations(operators, ({ many }) => ({
  users: many(users),
  installations: many(installations),
  customers: many(customers),
}));

export const installationsRelations = relations(installations, ({ one }) => ({
  operator: one(operators, {
    fields: [installations.operatorId],
    references: [operators.id],
  }),
}));

// CN codes that are fixed for a given installation (the goods it produces).
export const installationCnCodes = createTable(
  "installation_cn_code",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    installationId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => installations.id, { onDelete: "cascade" }),
    cnCode: d
      .text()
      .notNull()
      .references(() => defdataCnCodes.cnCode),
    resolved: d.integer({ mode: "boolean" }).notNull().default(false),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("installation_cn_code_installation_idx").on(t.installationId)],
);

// Combined Nomenclature codes with descriptions and optional default emission data.
// Could later be populated from an external source.
export const defdataCnCodes = createTable(
  "defdata_cn_code",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    cnCode: d.text().notNull().unique(),
    description: d.text(),
    // Structured default values (emission factors, thresholds, etc.)
    defaultData: d.text({ mode: "json" }),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("defdata_cn_code_idx").on(t.cnCode)],
);
