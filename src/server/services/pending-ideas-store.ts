import { eq, desc } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { db } from '../db';
import { pendingIdeas } from '../db/schema';
import { getAsset } from './asset-store';

export interface AnimationIdea {
  title: string;
  description: string;
  style: string;
  colors: string[];
  motion: string;
  duration: string;
  elements: string[];
  suggestedAssets: string[];
}

export interface GenerationSettings {
  durationFrames: number;
  fps: number;
  width: number;
  height: number;
}

export interface PendingIdeaInput {
  idea: AnimationIdea;
  settings: GenerationSettings;
  assetIds?: string[];
}

export async function createPendingIdea(input: PendingIdeaInput) {
  const id = `pending-${uuid()}`;
  const now = new Date().toISOString();

  await db.insert(pendingIdeas).values({
    id,
    ideaJson: JSON.stringify(input.idea),
    settingsJson: JSON.stringify(input.settings),
    assetIds: JSON.stringify(input.assetIds || []),
    createdAt: now,
    updatedAt: now,
  });

  return getPendingIdea(id);
}

export async function getPendingIdea(id: string) {
  const result = await db.select().from(pendingIdeas).where(eq(pendingIdeas.id, id)).get();
  if (!result) return null;

  // Parse JSON fields and fetch assets
  const assetIds: string[] = result.assetIds ? JSON.parse(result.assetIds) : [];
  const assets = await Promise.all(
    assetIds.map(async (assetId) => {
      const asset = await getAsset(assetId);
      return asset;
    })
  );

  return {
    id: result.id,
    idea: JSON.parse(result.ideaJson) as AnimationIdea,
    settings: JSON.parse(result.settingsJson) as GenerationSettings,
    assets: assets.filter(Boolean),
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

export async function getAllPendingIdeas() {
  const results = await db
    .select()
    .from(pendingIdeas)
    .orderBy(desc(pendingIdeas.createdAt))
    .all();

  return Promise.all(
    results.map(async (result) => {
      const assetIds: string[] = result.assetIds ? JSON.parse(result.assetIds) : [];
      const assets = await Promise.all(
        assetIds.map(async (assetId) => {
          const asset = await getAsset(assetId);
          return asset;
        })
      );

      return {
        id: result.id,
        idea: JSON.parse(result.ideaJson) as AnimationIdea,
        settings: JSON.parse(result.settingsJson) as GenerationSettings,
        assets: assets.filter(Boolean),
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    })
  );
}

export async function updatePendingIdea(
  id: string,
  updates: {
    idea?: AnimationIdea;
    settings?: GenerationSettings;
    assetIds?: string[];
  }
) {
  const existing = await db.select().from(pendingIdeas).where(eq(pendingIdeas.id, id)).get();
  if (!existing) return null;

  const updateData: Record<string, string> = {
    updatedAt: new Date().toISOString(),
  };

  if (updates.idea) {
    updateData.ideaJson = JSON.stringify(updates.idea);
  }
  if (updates.settings) {
    updateData.settingsJson = JSON.stringify(updates.settings);
  }
  if (updates.assetIds !== undefined) {
    updateData.assetIds = JSON.stringify(updates.assetIds);
  }

  await db.update(pendingIdeas).set(updateData).where(eq(pendingIdeas.id, id));

  return getPendingIdea(id);
}

export async function addAssetToPendingIdea(pendingId: string, assetId: string) {
  const existing = await db.select().from(pendingIdeas).where(eq(pendingIdeas.id, pendingId)).get();
  if (!existing) return null;

  const assetIds: string[] = existing.assetIds ? JSON.parse(existing.assetIds) : [];
  if (!assetIds.includes(assetId)) {
    assetIds.unshift(assetId); // Add to beginning
  }

  await db
    .update(pendingIdeas)
    .set({
      assetIds: JSON.stringify(assetIds),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(pendingIdeas.id, pendingId));

  return getPendingIdea(pendingId);
}

export async function removeAssetFromPendingIdea(pendingId: string, assetId: string) {
  const existing = await db.select().from(pendingIdeas).where(eq(pendingIdeas.id, pendingId)).get();
  if (!existing) return null;

  const assetIds: string[] = existing.assetIds ? JSON.parse(existing.assetIds) : [];
  const filtered = assetIds.filter((id) => id !== assetId);

  await db
    .update(pendingIdeas)
    .set({
      assetIds: JSON.stringify(filtered),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(pendingIdeas.id, pendingId));

  return getPendingIdea(pendingId);
}

export async function deletePendingIdea(id: string) {
  const existing = await db.select().from(pendingIdeas).where(eq(pendingIdeas.id, id)).get();
  if (!existing) return false;

  await db.delete(pendingIdeas).where(eq(pendingIdeas.id, id));
  return true;
}
