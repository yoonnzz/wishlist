import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  store: text("store").notNull(),
  brand: text("brand").notNull(),
  name: text("name").notNull(),
  modelKey: text("model_key").notNull(),
  color: text("color").notNull().default(""),
  url: text("url").notNull(),
  note: text("note").notNull().default(""),
  reuseAllowed: integer("reuse_allowed", { mode: "boolean" }).notNull().default(false),
  usedInPostId: text("used_in_post_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_products_owner_created").on(table.ownerId, table.createdAt),
  index("idx_products_owner_model").on(table.ownerId, table.modelKey),
]);

export const tasteExamples = sqliteTable("taste_examples", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  store: text("store").notNull(),
  brand: text("brand").notNull(),
  name: text("name").notNull(),
  model: text("model").notNull(),
  color: text("color").notNull().default(""),
  url: text("url").notNull(),
  productUrl: text("product_url").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  note: text("note").notNull().default(""),
  firstUsedInPostId: text("first_used_in_post_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_taste_examples_owner_created").on(table.ownerId, table.createdAt)]);

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  store: text("store").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("draft"),
  productIds: text("product_ids").notNull().default("[]"),
  tasteExampleIds: text("taste_example_ids").notNull().default("[]"),
  tasteBasis: text("taste_basis").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_posts_owner_created").on(table.ownerId, table.createdAt)]);

export const trendLetters = sqliteTable("trend_letters", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  kicker: text("kicker").notNull().default("TREND NOTE"),
  summary: text("summary").notNull(),
  body: text("body").notNull(),
  sourceUrls: text("source_urls").notNull().default("[]"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_letters_owner_created").on(table.ownerId, table.createdAt)]);

export const preferences = sqliteTable("preferences", {
  ownerId: text("owner_id").primaryKey(),
  styleNotes: text("style_notes").notNull().default(""),
  favoriteNotes: text("favorite_notes").notNull().default(""),
  avoidedNotes: text("avoided_notes").notNull().default(""),
});

export const usedModels = sqliteTable("used_models", {
  ownerId: text("owner_id").notNull(),
  modelKey: text("model_key").notNull(),
  postId: text("post_id").notNull(),
}, (table) => [primaryKey({ columns: [table.ownerId, table.modelKey] })]);
