import { GoogleGenAI } from '@google/genai';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { extractTransparency, deleteImageByPath as _deleteImageByPath } from './background-remover';

// Get a safe directory for generated assets
// In Electron, use userData; otherwise use local public folder
function getGeneratedAssetsDir(): string {
  if (process.env.ELECTRON_DB_PATH) {
    const userDataDir = path.dirname(process.env.ELECTRON_DB_PATH);
    return path.join(userDataDir, 'generated');
  }
  return path.resolve(process.cwd(), 'public/assets/generated');
}

// Get the public-facing path prefix for generated assets
function getGeneratedAssetsPathPrefix(): string {
  return '/assets/generated';
}

const GENERATED_ASSETS_DIR = getGeneratedAssetsDir();

export interface GenerateImageOptions {
  prompt: string;
  model?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
}

export interface EditImageOptions {
  sourceImagePath: string;
  editPrompt: string;
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

export async function generateImage(options: GenerateImageOptions & { apiKey?: string }): Promise<GeneratedImageResult> {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY || process.env.NANO_BANANAS_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY environment variable or configure in Settings.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = options.model ?? 'gemini-2.5-flash-image';
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
  const filePath = `${getGeneratedAssetsPathPrefix()}/${filename}`;

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
    let absolutePath: string;
    if (process.env.ELECTRON_DB_PATH) {
      // In Electron, assets are in userData directory
      const userDataDir = path.dirname(process.env.ELECTRON_DB_PATH);
      // filePath is like /assets/uploaded/xxx.png or /assets/generated/xxx.png
      // Extract just the filename
      const filename = path.basename(filePath);
      // Check both possible directories
      if (filePath.includes('/uploaded/') || filePath.includes('/generated/')) {
        absolutePath = path.join(userDataDir, filePath.includes('/uploaded/') ? 'uploads' : 'generated', filename);
      } else {
        absolutePath = path.join(userDataDir, 'generated', filename);
      }
    } else {
      // Development: use local public folder
      absolutePath = path.join(process.cwd(), 'public', filePath);
    }
    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    console.error('Failed to delete image file:', error);
    return false;
  }
}

export async function editImage(options: EditImageOptions & { apiKey?: string }): Promise<GeneratedImageResult> {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY || process.env.NANO_BANANAS_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY environment variable or configure in Settings.');
  }

  const ai = new GoogleGenAI({ apiKey });
  // Use gemini-2.5-flash-image for editing (supports image input/output)
  const model = options.model ?? 'gemini-2.5-flash-image';

  // Read source image and convert to base64
  let absoluteSourcePath: string;
  if (options.sourceImagePath.startsWith('/')) {
    if (process.env.ELECTRON_DB_PATH) {
      // In Electron, resolve to userData directory
      const userDataDir = path.dirname(process.env.ELECTRON_DB_PATH);
      const filename = path.basename(options.sourceImagePath);
      if (options.sourceImagePath.includes('/uploaded/')) {
        absoluteSourcePath = path.join(userDataDir, 'uploads', filename);
      } else {
        absoluteSourcePath = path.join(userDataDir, 'generated', filename);
      }
    } else {
      absoluteSourcePath = path.join(process.cwd(), 'public', options.sourceImagePath);
    }
  } else {
    absoluteSourcePath = options.sourceImagePath;
  }

  const imageBuffer = await fs.readFile(absoluteSourcePath);
  const base64Data = imageBuffer.toString('base64');

  // Determine mime type from file extension
  const ext = path.extname(absoluteSourcePath).toLowerCase();
  const sourceMimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

  // Build the prompt with aspect ratio hint if provided
  const promptWithAspect = options.aspectRatio
    ? `${options.editPrompt} (maintain aspect ratio: ${options.aspectRatio})`
    : options.editPrompt;

  // Generate the edited image using the correct API format from docs
  // contents is an array of parts directly, not wrapped in role object
  console.log('[editImage] Sending request with prompt:', promptWithAspect);
  console.log('[editImage] Using model:', model);

  const response = await ai.models.generateContent({
    model,
    contents: [
      { text: promptWithAspect },
      {
        inlineData: {
          mimeType: sourceMimeType,
          data: base64Data,
        },
      },
    ],
  });

  // Log response structure for debugging
  console.log('[editImage] Response candidates:', response.candidates?.length);
  console.log('[editImage] Response structure:', JSON.stringify({
    candidatesCount: response.candidates?.length,
    firstCandidate: response.candidates?.[0] ? {
      finishReason: response.candidates[0].finishReason,
      contentParts: response.candidates[0].content?.parts?.length,
      partTypes: response.candidates[0].content?.parts?.map(p =>
        p.text ? 'text' : p.inlineData ? `image:${p.inlineData.mimeType}` : 'unknown'
      ),
    } : null,
  }, null, 2));

  // Extract image from response
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    // Check if there's a text response with an error
    const textPart = response.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text);
    if (textPart && 'text' in textPart) {
      console.error('[editImage] API returned text instead of image:', textPart.text);
      throw new Error(`Image editing failed: ${textPart.text}`);
    }
    throw new Error('No response parts from image editing');
  }

  const imagePart = parts.find((part) => part.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart?.inlineData) {
    // Log what we got instead
    const textParts = parts.filter((p: { text?: string }) => p.text).map((p: { text?: string }) => p.text);
    if (textParts.length > 0) {
      console.error('[editImage] API returned text instead of image:', textParts.join('\n'));
      throw new Error(`Image editing returned text: ${textParts[0]?.slice(0, 200)}`);
    }
    throw new Error('No image data in response');
  }

  const { mimeType, data } = imagePart.inlineData;
  if (!data || !mimeType) {
    throw new Error('Invalid image data in response');
  }

  // Determine file extension
  const outputExt = mimeType === 'image/png' ? 'png' : mimeType === 'image/jpeg' ? 'jpg' : 'png';
  const id = uuid();
  const filename = `${id}.${outputExt}`;

  // Ensure directory exists and save file
  await ensureDirectory(GENERATED_ASSETS_DIR);
  const absolutePath = path.join(GENERATED_ASSETS_DIR, filename);
  const buffer = Buffer.from(data, 'base64');
  await fs.writeFile(absolutePath, buffer);

  // Return relative path for serving
  const filePath = `${getGeneratedAssetsPathPrefix()}/${filename}`;

  return {
    id,
    filePath,
    absolutePath,
    mimeType,
    prompt: options.editPrompt,
  };
}

export interface GenerateTransparentImageOptions {
  prompt: string;
  model?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
}

export interface TransparentImageResult {
  id: string;
  filePath: string;
  absolutePath: string;
  mimeType: string;
  prompt: string;
}

/**
 * Generate an image with transparent background using difference matting.
 *
 * This process:
 * 1. Generates the image with a white background
 * 2. Edits it to have a black background
 * 3. Uses difference matting to extract the alpha channel
 * 4. Cleans up intermediate images
 */
export async function generateTransparentImage(
  options: GenerateTransparentImageOptions
): Promise<TransparentImageResult> {
  const basePrompt = options.prompt;

  // Step 1: Generate with white background
  const whitePrompt = `${basePrompt}. IMPORTANT: The subject must be on a PURE WHITE background (#FFFFFF). No shadows, no gradients, just pure white.`;
  const whiteResult = await generateImage({
    prompt: whitePrompt,
    model: options.model,
    aspectRatio: options.aspectRatio,
  });

  try {
    // Step 2: Edit to black background
    const blackPrompt = `Change the background to PURE BLACK (#000000). Keep the subject exactly the same, only change the white background to pure black. No shadows, no gradients, just pure black.`;
    const blackResult = await editImage({
      sourceImagePath: whiteResult.filePath,
      editPrompt: blackPrompt,
      model: options.model,
      aspectRatio: options.aspectRatio,
    });

    try {
      // Step 3: Apply difference matting
      const transparentResult = await extractTransparency(
        whiteResult.filePath,
        blackResult.filePath
      );

      // Step 4: Clean up intermediate images
      await Promise.all([
        deleteImageFile(whiteResult.filePath),
        deleteImageFile(blackResult.filePath),
      ]);

      return {
        id: transparentResult.id,
        filePath: transparentResult.filePath,
        absolutePath: transparentResult.absolutePath,
        mimeType: 'image/png',
        prompt: options.prompt,
      };
    } catch (mattingError) {
      // Clean up black image on matting failure
      await deleteImageFile(blackResult.filePath);
      throw mattingError;
    }
  } catch (error) {
    // Clean up white image on any failure
    await deleteImageFile(whiteResult.filePath);
    throw error;
  }
}

/**
 * Remove background from an existing image using difference matting.
 *
 * This takes an existing image and:
 * 1. Regenerates it with white background
 * 2. Edits it to black background
 * 3. Applies difference matting
 * 4. Cleans up intermediate images
 */
export async function removeBackground(
  sourceImagePath: string,
  originalPrompt: string,
  options?: { model?: string; aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4' }
): Promise<TransparentImageResult> {
  // Step 1: Edit to white background
  const whitePrompt = `Change the background to PURE WHITE (#FFFFFF). Keep the subject exactly the same. No shadows, no gradients, just pure white.`;
  const whiteResult = await editImage({
    sourceImagePath,
    editPrompt: whitePrompt,
    model: options?.model,
    aspectRatio: options?.aspectRatio,
  });

  try {
    // Step 2: Edit to black background
    const blackPrompt = `Change the background to PURE BLACK (#000000). Keep the subject exactly the same, only change the white background to pure black. No shadows, no gradients, just pure black.`;
    const blackResult = await editImage({
      sourceImagePath: whiteResult.filePath,
      editPrompt: blackPrompt,
      model: options?.model,
      aspectRatio: options?.aspectRatio,
    });

    try {
      // Step 3: Apply difference matting
      const transparentResult = await extractTransparency(
        whiteResult.filePath,
        blackResult.filePath
      );

      // Step 4: Clean up intermediate images
      await Promise.all([
        deleteImageFile(whiteResult.filePath),
        deleteImageFile(blackResult.filePath),
      ]);

      return {
        id: transparentResult.id,
        filePath: transparentResult.filePath,
        absolutePath: transparentResult.absolutePath,
        mimeType: 'image/png',
        prompt: originalPrompt,
      };
    } catch (mattingError) {
      // Clean up black image on matting failure
      await deleteImageFile(blackResult.filePath);
      throw mattingError;
    }
  } catch (error) {
    // Clean up white image on any failure
    await deleteImageFile(whiteResult.filePath);
    throw error;
  }
}
