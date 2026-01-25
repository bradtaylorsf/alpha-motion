import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

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

const ANIMATION_CATEGORIES = [
  'kinetic-typography',
  'data-visualization',
  'logo-animation',
  'social-media-content',
  'explainer-graphics',
  'abstract-motion',
  'ui-animation',
  'particle-effects',
];

const RANDOM_IDEA_PROMPT = `You are an expert motion graphics designer specializing in Remotion animations.

Generate a creative, specific animation concept. Be detailed and visual.

Consider these styles:
- Kinetic typography (animated text, word reveals)
- Data visualization (charts, graphs, infographics)
- Logo animations (reveals, transformations)
- Social media content (Instagram stories, TikTok, YouTube shorts)
- Abstract motion (geometric shapes, particles, gradients)
- UI animations (button states, loading indicators, transitions)

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "title": "Short, catchy name (2-5 words)",
  "description": "2-3 sentence description of the animation, what it shows and how it moves",
  "style": "Visual style (e.g., 'minimalist', 'retro', 'neon', 'corporate', 'playful')",
  "colors": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "motion": "Primary motion type (e.g., 'elastic bounce', 'smooth fade', 'particle burst', 'morphing')",
  "duration": "Suggested duration (e.g., '3 seconds', '5 seconds')",
  "elements": ["List", "of", "visual", "elements", "involved"],
  "suggestedAssets": ["descriptions of any images/icons that could enhance this"]
}

Be creative and specific. Avoid generic concepts. Focus on animations that would look impressive and professional.`;

const EXPAND_IDEA_PROMPT = `You are an expert motion graphics designer specializing in Remotion animations.

The user has a rough animation idea. Your job is to expand it into a detailed, implementable concept.

Take their basic idea and flesh it out with:
- Specific visual details
- Color palette
- Motion style and timing
- Elements and composition
- Technical considerations for Remotion implementation

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "title": "Short, catchy name based on their idea",
  "description": "Expanded 2-3 sentence description",
  "style": "Recommended visual style",
  "colors": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "motion": "Recommended motion approach",
  "duration": "Suggested duration",
  "elements": ["List", "of", "visual", "elements"],
  "suggestedAssets": ["descriptions of assets that would help"]
}

User's idea:`;

export async function generateRandomIdea(category?: string): Promise<AnimationIdea> {
  const selectedCategory = category || ANIMATION_CATEGORIES[Math.floor(Math.random() * ANIMATION_CATEGORIES.length)];

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `${RANDOM_IDEA_PROMPT}\n\nFocus on: ${selectedCategory}`,
      },
    ],
  });

  const content = message.content[0];
  if (!content || content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    return JSON.parse(content.text) as AnimationIdea;
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AnimationIdea;
    }
    throw new Error('Failed to parse AI response as JSON');
  }
}

export async function expandIdea(userIdea: string): Promise<AnimationIdea> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `${EXPAND_IDEA_PROMPT}\n\n"${userIdea}"`,
      },
    ],
  });

  const content = message.content[0];
  if (!content || content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    return JSON.parse(content.text) as AnimationIdea;
  } catch {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AnimationIdea;
    }
    throw new Error('Failed to parse AI response as JSON');
  }
}
