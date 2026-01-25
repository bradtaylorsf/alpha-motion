import { GoogleGenAI } from '@google/genai';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

const GENERATED_ASSETS_DIR = path.resolve(process.cwd(), 'public/assets/generated');

export interface GenerateImageOptions {
  prompt: string;
  model?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
}

export interface GeneratedImageResult {
  id: string;
  filePath: string;
  absolutePath: string;
  mimeType: string;
  prompt: string;
}

async function ensureDirectory(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function generateImage(options: GenerateImageOptions): Promise<GeneratedImageResult> {
  const apiKey = process.env.NANO_BANANAS_API_KEY;
  if (!apiKey) {
    throw new Error('NANO_BANANAS_API_KEY environment variable is not set');
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = options.model ?? 'gemini-2.0-flash-exp-image-generation';
  const aspectRatio = options.aspectRatio ?? '16:9';

  // Build the prompt with aspect ratio hint
  const promptWithAspect = `${options.prompt} (aspect ratio: ${aspectRatio})`;

  // Generate the image
  const response = await ai.models.generateContent({
    model,
    contents: promptWithAspect,
    config: {
      responseModalities: ['image', 'text'],
    },
  });

  // Extract image from response
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error('No response parts from image generation');
  }

  const imagePart = parts.find((part) => part.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart?.inlineData) {
    throw new Error('No image data in response');
  }

  const { mimeType, data } = imagePart.inlineData;
  if (!data || !mimeType) {
    throw new Error('Invalid image data in response');
  }

  // Determine file extension
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/jpeg' ? 'jpg' : 'png';
  const id = uuid();
  const filename = `${id}.${ext}`;

  // Ensure directory exists and save file
  await ensureDirectory(GENERATED_ASSETS_DIR);
  const absolutePath = path.join(GENERATED_ASSETS_DIR, filename);
  const buffer = Buffer.from(data, 'base64');
  await fs.writeFile(absolutePath, buffer);

  // Return relative path for serving
  const filePath = `/assets/generated/${filename}`;

  return {
    id,
    filePath,
    absolutePath,
    mimeType,
    prompt: options.prompt,
  };
}

export async function deleteImageFile(filePath: string): Promise<boolean> {
  try {
    // Convert relative path to absolute
    const absolutePath = path.join(process.cwd(), 'public', filePath);
    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    console.error('Failed to delete image file:', error);
    return false;
  }
}
