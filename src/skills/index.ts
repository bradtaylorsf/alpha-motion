import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import example code
import { typewriterExample } from './examples/typewriter';
import { barChartExample } from './examples/bar-chart';
import { textRotationExample } from './examples/text-rotation';
import { counterExample } from './examples/counter';
import { logoRevealExample } from './examples/logo-reveal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Skill {
  id: string;
  name: string;
  type: 'guidance' | 'example';
  content: string;
  tags: string[];
}

export interface Example {
  id: string;
  name: string;
  description: string;
  category: string;
  code: string;
  durationInFrames: number;
  fps: number;
  width?: number;
  height?: number;
}

// Helper to read guidance files
function readGuidanceFile(filename: string): string {
  try {
    const filePath = path.join(__dirname, 'guidance', filename);
    return fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    console.warn(`Could not read guidance file: ${filename}`);
    return '';
  }
}

// Guidance skills - patterns and best practices (lazy loaded)
const guidanceSkillsConfig: Record<string, { filename: string; tags: string[] }> = {
  typography: {
    filename: 'typography.md',
    tags: ['text', 'typewriter', 'kinetic', 'reveal', 'word-by-word'],
  },
  charts: {
    filename: 'charts.md',
    tags: ['bar-chart', 'line-chart', 'pie-chart', 'data-viz', 'histogram'],
  },
  transitions: {
    filename: 'transitions.md',
    tags: ['fade', 'slide', 'wipe', 'zoom', 'transition', 'scene'],
  },
  'spring-physics': {
    filename: 'spring-physics.md',
    tags: ['spring', 'bounce', 'elastic', 'physics', 'natural-motion'],
  },
  sequencing: {
    filename: 'sequencing.md',
    tags: ['sequence', 'timeline', 'orchestration', 'timing', 'composition'],
  },
  'social-media': {
    filename: 'social-media.md',
    tags: ['instagram', 'tiktok', 'reels', 'stories', 'shorts', 'vertical'],
  },
};

// Cache for loaded guidance content
const guidanceCache = new Map<string, string>();

function getGuidanceContent(skillId: string): string | null {
  const config = guidanceSkillsConfig[skillId];
  if (!config) return null;

  if (!guidanceCache.has(skillId)) {
    const content = readGuidanceFile(config.filename);
    guidanceCache.set(skillId, content);
  }

  return guidanceCache.get(skillId) || null;
}

// Example skills - working code references
const exampleSkills: Record<string, Example> = {
  'example-typewriter': typewriterExample,
  'example-bar-chart': barChartExample,
  'example-text-rotation': textRotationExample,
  'example-counter': counterExample,
  'example-logo-reveal': logoRevealExample,
};

export function getSkillContent(skillId: string): string | null {
  if (skillId.startsWith('example-')) {
    const example = exampleSkills[skillId];
    if (example) {
      return `# Example: ${example.name}\n\n${example.description}\n\n\`\`\`tsx\n${example.code}\n\`\`\``;
    }
    return null;
  }

  return getGuidanceContent(skillId);
}

export function getCombinedSkillContent(skillIds: string[]): string {
  return skillIds
    .map((id) => getSkillContent(id))
    .filter(Boolean)
    .join('\n\n---\n\n');
}

export function getAllSkills(): Skill[] {
  const skills: Skill[] = [];

  for (const [id, config] of Object.entries(guidanceSkillsConfig)) {
    const content = getGuidanceContent(id);
    skills.push({
      id,
      name: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      type: 'guidance',
      content: content || '',
      tags: config.tags,
    });
  }

  for (const [id, example] of Object.entries(exampleSkills)) {
    skills.push({
      id,
      name: example.name,
      type: 'example',
      content: example.code,
      tags: [example.category.toLowerCase()],
    });
  }

  return skills;
}

export function getSkillsByTags(tags: string[]): Skill[] {
  const allSkills = getAllSkills();
  return allSkills.filter((skill) =>
    tags.some((tag) => skill.tags.includes(tag.toLowerCase()))
  );
}

export function detectSkillsFromPrompt(prompt: string): string[] {
  const promptLower = prompt.toLowerCase();
  const detected: string[] = [];

  // Detection rules
  const rules: [string[], string][] = [
    [['text', 'word', 'type', 'letter', 'font', 'kinetic'], 'typography'],
    [['chart', 'graph', 'data', 'bar', 'pie', 'line', 'histogram'], 'charts'],
    [['transition', 'fade', 'slide', 'wipe', 'scene'], 'transitions'],
    [['bounce', 'spring', 'elastic', 'physics'], 'spring-physics'],
    [['sequence', 'timeline', 'orchestr'], 'sequencing'],
    [['instagram', 'tiktok', 'reel', 'story', 'short', 'vertical'], 'social-media'],
  ];

  for (const [keywords, skillId] of rules) {
    if (keywords.some((kw) => promptLower.includes(kw))) {
      detected.push(skillId);
    }
  }

  // Add relevant examples
  if (promptLower.includes('typewriter')) detected.push('example-typewriter');
  if (promptLower.includes('bar chart')) detected.push('example-bar-chart');
  if (promptLower.includes('rotat')) detected.push('example-text-rotation');
  if (promptLower.includes('counter') || promptLower.includes('number'))
    detected.push('example-counter');
  if (promptLower.includes('logo')) detected.push('example-logo-reveal');

  return [...new Set(detected)];
}

export { exampleSkills };
