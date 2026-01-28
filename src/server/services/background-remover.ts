import sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

// Get a safe directory for generated assets
function getGeneratedAssetsDir(): string {
  if (process.env.ELECTRON_DB_PATH) {
    const userDataDir = path.dirname(process.env.ELECTRON_DB_PATH);
    return path.join(userDataDir, 'generated');
  }
  return path.resolve(process.cwd(), 'public/assets/generated');
}

const GENERATED_ASSETS_DIR = getGeneratedAssetsDir();

async function ensureDirectory(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Extract transparency using difference matting technique.
 *
 * This algorithm works by comparing the same image rendered on white and black backgrounds.
 * The difference between the two reveals the alpha channel.
 *
 * For each pixel:
 * - If the pixel is the same on both backgrounds, it's fully opaque (alpha = 1)
 * - If it's pure white on white bg and pure black on black bg, it's fully transparent (alpha = 0)
 * - Values in between represent partial transparency
 *
 * The formula: alpha = 1 - (whitePixel - blackPixel)
 * Foreground color: rgb = blackPixel / alpha (when alpha > 0)
 */
export async function extractTransparency(
  whiteBackgroundPath: string,
  blackBackgroundPath: string,
  outputId?: string
): Promise<{ id: string; filePath: string; absolutePath: string }> {
  // Convert relative paths to absolute if needed
  function resolveImagePath(relativePath: string): string {
    if (!relativePath.startsWith('/')) {
      return relativePath;
    }
    if (process.env.ELECTRON_DB_PATH) {
      const userDataDir = path.dirname(process.env.ELECTRON_DB_PATH);
      const filename = path.basename(relativePath);
      if (relativePath.includes('/uploaded/')) {
        return path.join(userDataDir, 'uploads', filename);
      }
      return path.join(userDataDir, 'generated', filename);
    }
    return path.join(process.cwd(), 'public', relativePath);
  }

  const absoluteWhitePath = resolveImagePath(whiteBackgroundPath);
  const absoluteBlackPath = resolveImagePath(blackBackgroundPath);

  // Load both images
  const [whiteImage, blackImage] = await Promise.all([
    sharp(absoluteWhitePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(absoluteBlackPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);

  const { width, height, channels } = whiteImage.info;
  const whiteData = whiteImage.data;
  const blackData = blackImage.data;

  // Verify dimensions match
  if (whiteImage.info.width !== blackImage.info.width || whiteImage.info.height !== blackImage.info.height) {
    throw new Error('White and black background images must have the same dimensions');
  }

  // Create output buffer with RGBA
  const outputData = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * channels;
    const dstIdx = i * 4;

    // Get pixel values (0-255)
    const whiteR = whiteData[srcIdx];
    const whiteG = whiteData[srcIdx + 1];
    const whiteB = whiteData[srcIdx + 2];

    const blackR = blackData[srcIdx];
    const blackG = blackData[srcIdx + 1];
    const blackB = blackData[srcIdx + 2];

    // Calculate alpha using difference matting
    // On white background: pixel = fg * alpha + white * (1 - alpha) = fg * alpha + 255 * (1 - alpha)
    // On black background: pixel = fg * alpha + black * (1 - alpha) = fg * alpha + 0 * (1 - alpha) = fg * alpha
    //
    // white - black = fg * alpha + 255 * (1 - alpha) - fg * alpha = 255 * (1 - alpha)
    // Therefore: 1 - alpha = (white - black) / 255
    //            alpha = 1 - (white - black) / 255

    // Calculate per-channel alpha and average
    const alphaR = 1 - (whiteR - blackR) / 255;
    const alphaG = 1 - (whiteG - blackG) / 255;
    const alphaB = 1 - (whiteB - blackB) / 255;

    // Use the average alpha, clamped to [0, 1]
    let alpha = (alphaR + alphaG + alphaB) / 3;
    alpha = Math.max(0, Math.min(1, alpha));

    // Recover foreground color from black background image
    // black = fg * alpha, so fg = black / alpha
    let r = 0, g = 0, b = 0;

    if (alpha > 0.001) {
      r = Math.min(255, Math.round(blackR / alpha));
      g = Math.min(255, Math.round(blackG / alpha));
      b = Math.min(255, Math.round(blackB / alpha));
    }

    outputData[dstIdx] = r;
    outputData[dstIdx + 1] = g;
    outputData[dstIdx + 2] = b;
    outputData[dstIdx + 3] = Math.round(alpha * 255);
  }

  // Create output image
  const id = outputId || uuid();
  const filename = `${id}.png`;

  await ensureDirectory(GENERATED_ASSETS_DIR);
  const absolutePath = path.join(GENERATED_ASSETS_DIR, filename);

  await sharp(outputData, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png()
    .toFile(absolutePath);

  const filePath = `/assets/generated/${filename}`;

  return {
    id,
    filePath,
    absolutePath,
  };
}

/**
 * Delete an image file by its relative path
 */
export async function deleteImageByPath(filePath: string): Promise<boolean> {
  try {
    let absolutePath: string;
    if (process.env.ELECTRON_DB_PATH) {
      const userDataDir = path.dirname(process.env.ELECTRON_DB_PATH);
      const filename = path.basename(filePath);
      if (filePath.includes('/uploaded/')) {
        absolutePath = path.join(userDataDir, 'uploads', filename);
      } else {
        absolutePath = path.join(userDataDir, 'generated', filename);
      }
    } else {
      absolutePath = path.join(process.cwd(), 'public', filePath);
    }
    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    console.error('Failed to delete image file:', error);
    return false;
  }
}
