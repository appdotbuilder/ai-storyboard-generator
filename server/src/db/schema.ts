
import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enum for storyboard status
export const storyboardStatusEnum = pgEnum('storyboard_status', ['draft', 'generating', 'completed', 'exported']);

// Characters table
export const charactersTable = pgTable('characters', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Locations table  
export const locationsTable = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Storyboards table
export const storyboardsTable = pgTable('storyboards', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  initial_prompt: text('initial_prompt'),
  script_content: text('script_content'),
  status: storyboardStatusEnum('status').notNull().default('draft'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Scenes table
export const scenesTable = pgTable('scenes', {
  id: serial('id').primaryKey(),
  storyboard_id: integer('storyboard_id').notNull().references(() => storyboardsTable.id),
  sequence_number: integer('sequence_number').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  location_id: integer('location_id').references(() => locationsTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Scene characters junction table
export const sceneCharactersTable = pgTable('scene_characters', {
  id: serial('id').primaryKey(),
  scene_id: integer('scene_id').notNull().references(() => scenesTable.id),
  character_id: integer('character_id').notNull().references(() => charactersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const storyboardsRelations = relations(storyboardsTable, ({ many }) => ({
  scenes: many(scenesTable),
}));

export const scenesRelations = relations(scenesTable, ({ one, many }) => ({
  storyboard: one(storyboardsTable, {
    fields: [scenesTable.storyboard_id],
    references: [storyboardsTable.id],
  }),
  location: one(locationsTable, {
    fields: [scenesTable.location_id],
    references: [locationsTable.id],
  }),
  sceneCharacters: many(sceneCharactersTable),
}));

export const charactersRelations = relations(charactersTable, ({ many }) => ({
  sceneCharacters: many(sceneCharactersTable),
}));

export const locationsRelations = relations(locationsTable, ({ many }) => ({
  scenes: many(scenesTable),
}));

export const sceneCharactersRelations = relations(sceneCharactersTable, ({ one }) => ({
  scene: one(scenesTable, {
    fields: [sceneCharactersTable.scene_id],
    references: [scenesTable.id],
  }),
  character: one(charactersTable, {
    fields: [sceneCharactersTable.character_id],
    references: [charactersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Character = typeof charactersTable.$inferSelect;
export type NewCharacter = typeof charactersTable.$inferInsert;

export type Location = typeof locationsTable.$inferSelect;
export type NewLocation = typeof locationsTable.$inferInsert;

export type Storyboard = typeof storyboardsTable.$inferSelect;
export type NewStoryboard = typeof storyboardsTable.$inferInsert;

export type Scene = typeof scenesTable.$inferSelect;
export type NewScene = typeof scenesTable.$inferInsert;

export type SceneCharacter = typeof sceneCharactersTable.$inferSelect;
export type NewSceneCharacter = typeof sceneCharactersTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  characters: charactersTable,
  locations: locationsTable,
  storyboards: storyboardsTable,
  scenes: scenesTable,
  sceneCharacters: sceneCharactersTable,
};
