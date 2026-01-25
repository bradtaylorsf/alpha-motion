import { v4 as uuid } from 'uuid';
import { db, schema } from '../db';
import { eq, desc } from 'drizzle-orm';
import type { AnimationIdea } from './anthropic';

export interface CreateComponentInput {
  name: string;
  description?: string;
  promptUsed?: string;
  idea?: AnimationIdea;
  sourceCode: string;
  tags?: string[];
  durationFrames?: number;
  fps?: number;
  width?: number;
  height?: number;
}

export interface UpdateComponentInput {
  name?: string;
  description?: string;
  tags?: string[];
  sourceCode?: string;
  durationFrames?: number;
  fps?: number;
  width?: number;
  height?: number;
}

export async function createComponent(input: CreateComponentInput): Promise<schema.Component> {
  const id = uuid();
  const now = new Date().toISOString();

  const component: schema.NewComponent = {
    id,
    name: input.name,
    description: input.description,
    promptUsed: input.promptUsed,
    ideaJson: input.idea ? JSON.stringify(input.idea) : undefined,
    sourceCode: input.sourceCode,
    tags: input.tags ? JSON.stringify(input.tags) : undefined,
    durationFrames: input.durationFrames ?? 150,
    fps: input.fps ?? 30,
    width: input.width ?? 1920,
    height: input.height ?? 1080,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.components).values(component);

  return getComponent(id) as Promise<schema.Component>;
}

export async function getComponent(id: string): Promise<schema.Component | null> {
  const results = await db.select().from(schema.components).where(eq(schema.components.id, id));
  return results[0] ?? null;
}

export async function getAllComponents(): Promise<schema.Component[]> {
  return db.select().from(schema.components).orderBy(desc(schema.components.createdAt));
}

export async function updateComponent(
  id: string,
  input: UpdateComponentInput
): Promise<schema.Component | null> {
  const existing = await getComponent(id);
  if (!existing) return null;

  const updates: Partial<schema.NewComponent> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.tags !== undefined) updates.tags = JSON.stringify(input.tags);
  if (input.sourceCode !== undefined) updates.sourceCode = input.sourceCode;
  if (input.durationFrames !== undefined) updates.durationFrames = input.durationFrames;
  if (input.fps !== undefined) updates.fps = input.fps;
  if (input.width !== undefined) updates.width = input.width;
  if (input.height !== undefined) updates.height = input.height;

  await db.update(schema.components).set(updates).where(eq(schema.components.id, id));

  return getComponent(id);
}

export async function deleteComponent(id: string): Promise<boolean> {
  const existing = await getComponent(id);
  if (!existing) return false;

  await db.delete(schema.components).where(eq(schema.components.id, id));
  return true;
}

export async function getComponentsByTags(tags: string[]): Promise<schema.Component[]> {
  const all = await getAllComponents();

  return all.filter((component) => {
    if (!component.tags) return false;
    const componentTags = JSON.parse(component.tags) as string[];
    return tags.some((tag) => componentTags.includes(tag));
  });
}
