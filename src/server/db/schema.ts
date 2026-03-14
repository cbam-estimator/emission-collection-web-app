import { relations, sql } from "drizzle-orm";
import { index, sqliteTableCreator, unique } from "drizzle-orm/sqlite-core";

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

// A customer's request for CN code emission data from an installation for a specific quarter.
// One request per (customer, installation, quarter).
export const requests = createTable(
  "request",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    customerId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    installationId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => installations.id, { onDelete: "cascade" }),
    // Reporting quarter, e.g. "2026-Q1"
    quarter: d.text().notNull(),
    // pending  → request received, nothing filled yet
    // in_progress → at least one CN code has been filled
    // completed   → all requested CN codes have been filled
    status: d
      .text({ enum: ["pending", "in_progress", "completed"] })
      .notNull()
      .default("pending"),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    unique("request_customer_installation_quarter_uniq").on(
      t.customerId,
      t.installationId,
      t.quarter,
    ),
    index("request_installation_idx").on(t.installationId),
    index("request_customer_idx").on(t.customerId),
    index("request_status_idx").on(t.status),
  ],
);

// Individual CN codes requested within a customer request.
// Multiple customers may request the same CN code from the same installation for the same quarter.
export const requestCnCodes = createTable(
  "request_cn_code",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    requestId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    cnCode: d
      .text()
      .notNull()
      .references(() => defdataCnCodes.cnCode),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [
    unique("request_cn_code_uniq").on(t.requestId, t.cnCode),
    index("request_cn_code_request_idx").on(t.requestId),
  ],
);

// Emission data filled in by the operator, once per (installation, quarter, cnCode).
// Shared across all customer requests that reference the same combination.
export const installationCnCodes = createTable(
  "installation_cn_code",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    installationId: d
      .integer({ mode: "number" })
      .notNull()
      .references(() => installations.id, { onDelete: "cascade" }),
    quarter: d.text().notNull(),
    cnCode: d
      .text()
      .notNull()
      .references(() => defdataCnCodes.cnCode),
    // Structured emission values filled in by the operator
    emissionData: d.text({ mode: "json" }),
    status: d
      .text({ enum: ["pending", "filled"] })
      .notNull()
      .default("pending"),
    filledBy: d.text().references(() => users.id, { onDelete: "set null" }),
    filledAt: d.integer({ mode: "timestamp" }),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    unique("installation_cn_code_uniq").on(
      t.installationId,
      t.quarter,
      t.cnCode,
    ),
    index("installation_cn_code_installation_idx").on(t.installationId),
  ],
);

// Combined Nomenclature codes with descriptions and optional default emission data.
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

export const auditLog = createTable(
  "audit_log",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: d.text().references(() => users.id, { onDelete: "set null" }),
    event: d
      .text({
        enum: [
          // A customer request was received
          "request_created",
          // An operator user viewed a request
          "request_consulted",
          // An operator filled in CN code emission data
          "cn_code_filled",
          // All CN codes in a request have been filled
          "request_completed",
        ],
      })
      .notNull(),
    entityType: d.text({
      enum: ["request", "installation_cn_code"],
    }),
    entityId: d.integer({ mode: "number" }),
    // Any extra structured context (e.g. which cnCode was filled, customerId, quarter)
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

// ─── Relations ────────────────────────────────────────────────────────────────

export const operatorsRelations = relations(operators, ({ many }) => ({
  users: many(users),
  installations: many(installations),
  customers: many(customers),
}));

export const installationsRelations = relations(
  installations,
  ({ one, many }) => ({
    operator: one(operators, {
      fields: [installations.operatorId],
      references: [operators.id],
    }),
    requests: many(requests),
    installationCnCodes: many(installationCnCodes),
  }),
);

export const customersRelations = relations(customers, ({ one, many }) => ({
  operator: one(operators, {
    fields: [customers.operatorId],
    references: [operators.id],
  }),
  requests: many(requests),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  customer: one(customers, {
    fields: [requests.customerId],
    references: [customers.id],
  }),
  installation: one(installations, {
    fields: [requests.installationId],
    references: [installations.id],
  }),
  cnCodes: many(requestCnCodes),
}));

export const requestCnCodesRelations = relations(requestCnCodes, ({ one }) => ({
  request: one(requests, {
    fields: [requestCnCodes.requestId],
    references: [requests.id],
  }),
  defdataCnCode: one(defdataCnCodes, {
    fields: [requestCnCodes.cnCode],
    references: [defdataCnCodes.cnCode],
  }),
}));

export const installationCnCodesRelations = relations(
  installationCnCodes,
  ({ one }) => ({
    installation: one(installations, {
      fields: [installationCnCodes.installationId],
      references: [installations.id],
    }),
    defdataCnCode: one(defdataCnCodes, {
      fields: [installationCnCodes.cnCode],
      references: [defdataCnCodes.cnCode],
    }),
    filledByUser: one(users, {
      fields: [installationCnCodes.filledBy],
      references: [users.id],
    }),
  }),
);

export const defdataCnCodesRelations = relations(
  defdataCnCodes,
  ({ many }) => ({
    requestCnCodes: many(requestCnCodes),
    installationCnCodes: many(installationCnCodes),
  }),
);
