import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const components = sqliteTable('components', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  promptUsed: text('prompt_used'),
  ideaJson: text('idea_json'),
  sourceCode: text('source_code'),
  tags: text('tags'), // JSON array
  durationFrames: integer('duration_frames').default(150),
  fps: integer('fps').default(30),
  width: integer('width').default(1920),
  height: integer('height').default(1080),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  componentId: text('component_id').references(() => components.id),
  name: text('name').notNull(),
  type: text('type'), // 'generated' | 'uploaded'
  source: text('source'), // 'nano-bananas' | 'local'
  filePath: text('file_path'),
  promptUsed: text('prompt_used'),
  metadata: text('metadata'), // JSON
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const pendingIdeas = sqliteTable('pending_ideas', {
  id: text('id').primaryKey(),
  ideaJson: text('idea_json').notNull(), // JSON of AnimationIdea
  settingsJson: text('settings_json').notNull(), // JSON of GenerationSettings
  assetIds: text('asset_ids'), // JSON array of asset IDs
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const collections = sqliteTable('collections', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const collectionComponents = sqliteTable('collection_components', {
  collectionId: text('collection_id')
    .notNull()
    .references(() => collections.id),
  componentId: text('component_id')
    .notNull()
    .references(() => components.id),
  position: integer('position'),
});

export type Component = typeof components.$inferSelect;
export type NewComponent = typeof components.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type PendingIdea = typeof pendingIdeas.$inferSelect;
export type NewPendingIdea = typeof pendingIdeas.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
