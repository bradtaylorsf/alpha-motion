import { v4 as uuid } from 'uuid';
import { db, schema } from '../db';
import { eq, desc, isNull, inArray } from 'drizzle-orm';
import { deleteImageFile } from './nano-bananas';

export interface CreateAssetInput {
  name: string;
  componentId?: string;
  type: 'generated' | 'uploaded';
  source: 'nano-bananas' | 'local';
  filePath: string;
  promptUsed?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateAssetInput {
  name?: string;
  componentId?: string | null;
}

export async function createAsset(input: CreateAssetInput): Promise<schema.Asset> {
  const id = uuid();
  const now = new Date().toISOString();

  const asset: schema.NewAsset = {
    id,
    name: input.name,
    componentId: input.componentId,
    type: input.type,
    source: input.source,
    filePath: input.filePath,
    promptUsed: input.promptUsed,
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    createdAt: now,
  };

  await db.insert(schema.assets).values(asset);

  return getAsset(id) as Promise<schema.Asset>;
}

export async function getAsset(id: string): Promise<schema.Asset | null> {
  const results = await db.select().from(schema.assets).where(eq(schema.assets.id, id));
  return results[0] ?? null;
}

/**
 * Batch fetch multiple assets by IDs in a single query.
 * Returns a Map for O(1) lookup by ID.
 */
export async function getAssetsByIds(ids: string[]): Promise<Map<string, schema.Asset>> {
  if (ids.length === 0) {
    return new Map();
  }

  const results = await db
    .select()
    .from(schema.assets)
    .where(inArray(schema.assets.id, ids));

  const assetMap = new Map<string, schema.Asset>();
  for (const asset of results) {
    assetMap.set(asset.id, asset);
  }
  return assetMap;
}

export async function getAllAssets(): Promise<schema.Asset[]> {
  return db.select().from(schema.assets).orderBy(desc(schema.assets.createdAt));
}

export async function getAssetsByComponent(componentId: string): Promise<schema.Asset[]> {
  return db
    .select()
    .from(schema.assets)
    .where(eq(schema.assets.componentId, componentId))
    .orderBy(desc(schema.assets.createdAt));
}

export async function getUnlinkedAssets(): Promise<schema.Asset[]> {
  return db
    .select()
    .from(schema.assets)
    .where(isNull(schema.assets.componentId))
    .orderBy(desc(schema.assets.createdAt));
}

export async function updateAsset(
  id: string,
  input: UpdateAssetInput
): Promise<schema.Asset | null> {
  const existing = await getAsset(id);
  if (!existing) return null;

  const updates: Partial<schema.NewAsset> = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.componentId !== undefined) updates.componentId = input.componentId ?? undefined;

  if (Object.keys(updates).length > 0) {
    await db.update(schema.assets).set(updates).where(eq(schema.assets.id, id));
  }

  return getAsset(id);
}

export async function linkAssetToComponent(
  assetId: string,
  componentId: string | null
): Promise<schema.Asset | null> {
  return updateAsset(assetId, { componentId });
}

export async function deleteAsset(id: string): Promise<boolean> {
  const existing = await getAsset(id);
  if (!existing) return false;

  // Delete the file if it exists
  if (existing.filePath) {
    await deleteImageFile(existing.filePath);
  }

  // Delete the database record
  await db.delete(schema.assets).where(eq(schema.assets.id, id));
  return true;
}
