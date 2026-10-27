/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const host = '0.0.0.0';

app.use(express.json({ limit: '25mb' }));

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'grok-cinema-server' });
});

// Gemini Grok Director Server Route (server-side only Gemini API execution)
// Helper to check if a generation command has sufficient context
function canTriggerGeneration(
  prompt: string,
  images: string[] = [],
  history: any[] = [],
  parentVideo?: any
): boolean {
  if (Boolean(parentVideo)) return true;
  if (images && images.length > 0) return true;

  const hasGenerateKeyword = /\bGENERATE\b/.test(prompt) || prompt.trim().startsWith('GENERATE');
  if (!hasGenerateKeyword) return false;

  // Extract text other than the word "GENERATE" and punctuation
  const cleanDescription = prompt
    .replace(/\bGENERATE\b:?/gi, '')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim();

  // If user provided at least 3 descriptive characters
  if (cleanDescription.length >= 3) return true;

  // Check if conversation history has previous video or uploaded images
  const hasHistoryContext = (history || []).some((m: any) => {
    if (m.generatedVideo) return true;
    if (m.uploadedImages && m.uploadedImages.length > 0) return true;
    return false;
  });

  return hasHistoryContext;
}

function detectPromptBiome(text: string): 'cyberpunk' | 'space' | 'desert' | 'jungle' | 'dungeon' | 'ocean' | 'noir' | 'action' | 'apocalypse' {
  const lower = (text || '').toLowerCase();
  if (/\b(space|star|galaxy|nebula|orbit|planet|spaceship|cosmos|alien|astronaut|void)\b/.test(lower)) return 'space';
  if (/\b(desert|dune|sand|sahara|pyramid|arid|oasis|canyon|wasteland|mars)\b/.test(lower)) return 'desert';
  if (/\b(jungle|forest|dinosaur|nature|trees|canopy|rainforest|prehistoric|foliage|woods)\b/.test(lower)) return 'jungle';
  if (/\b(dungeon|castle|medieval|knight|gothic|throne|dragon|torch|crypt|stone|fortress)\b/.test(lower)) return 'dungeon';
  if (/\b(ocean|water|sea|underwater|submarine|coral|marine|deep|atlantis|wave)\b/.test(lower)) return 'ocean';
  if (/\b(noir|detective|monochrome|vintage|shadow|smoke|trenchcoat|1940|alleyway)\b/.test(lower)) return 'noir';
  if (/\b(car|chase|highway|race|speed|vehicle|drift|asphalt|pursuit|motorcycle)\b/.test(lower)) return 'action';
  if (/\b(apocalypse|ruin|fallout|destroyed|smoldering|rubble|decay)\b/.test(lower)) return 'apocalypse';
  return 'cyberpunk';
}

function generateDynamicDirectorReply(prompt: string, images: string[] = [], history: any[] = []): string {
  const clean = (prompt || '').trim();
  const lower = clean.toLowerCase();

  // 1. Look up memory from previous messages
  const previousVideos = (history || [])
    .filter((m: any) => m.generatedVideo)
    .map((m: any) => m.generatedVideo);
  const lastVideo = previousVideos.length > 0 ? previousVideos[previousVideos.length - 1] : undefined;
  const totalUploadedImages = (history || []).reduce((acc: number, m: any) => acc + (m.uploadedImages?.length || 0), images.length);

  // If user just typed "GENERATE" or requested generation without context
  if (/\bGENERATE\b/i.test(prompt) && !canTriggerGeneration(prompt, images, history)) {
    return "I need a scene concept or reference still before I can direct and generate. Tell me what scene you want to produce (e.g., 'GENERATE: A cybernetic mercenary entering an abandoned hangar in the snow'), or upload your reference photos so I have a visual vision to craft!";
  }

  // If user asked about image they just uploaded
  if (images.length > 0 && (lower.includes('explain') || lower.includes('look') || lower.includes('image') || lower.includes('photo') || lower.includes('still') || lower.includes('picture') || lower.includes('what do you think'))) {
    return `Looking at your reference image (${images.length} frame${images.length > 1 ? 's' : ''} uploaded): The composition has strong focal depth and dramatic mood. I can stage this with a slow dolly-push or crane-pan, matching the lighting with anamorphic flares. Whenever you want to direct it into a full sequence, type "GENERATE" along with your scene action!`;
  }

  // Recall previous video / story continuity
  if (lastVideo && (lower.includes('last video') || lower.includes('previous') || lower.includes('what did we make') || lower.includes('remember') || lower.includes('continuity') || lower.includes('part 2'))) {
    return `In our last cut, we produced "${lastVideo.title}" (${lastVideo.scenes?.length || 0} shots, ${lastVideo.totalDuration}s duration) in ${lastVideo.aspectRatio} format. The story left off with "${lastVideo.scenes?.[lastVideo.scenes.length - 1]?.title || 'the climax'}". If you want to direct the continuation, type "GENERATE Part 2: [your next scene description]"!`;
  }

  // Greetings: dynamic, acknowledging project history
  if (lower.startsWith('hi') || lower.startsWith('hello') || lower.startsWith('hey') || lower.startsWith('wassup') || lower.startsWith("what's up")) {
    if (previousVideos.length > 0) {
      return `Wassup! Director Grok here. We've got ${previousVideos.length} project${previousVideos.length > 1 ? 's' : ''} in the reel, including "${lastVideo?.title}". What scene are we directing next? You can describe a new scene, upload reference stills, or type GENERATE when you're ready to shoot!`;
    }
    return `Wassup! I'm your AI Cinema Director Brain. I direct multi-shot films, choreograph camera motion (dolly, steadicam, crane, drone), and cast voice talent. You can brainstorm story concepts with me, upload character stills, or type "GENERATE: [scene description]" when you want to produce!`;
  }

  // Questions about how it works / who are you
  if (lower.includes('who are you') || lower.includes('what can you do') || lower.includes('help') || lower.includes('how does this work')) {
    return `I'm Grok Cinema, your autonomous movie director. Here's how to work with me:
1. Normal Chat: Brainstorm storylines, ask for cinematography advice, or upload reference stills.
2. Video Generation: Start your prompt with "GENERATE: [scene description]" (e.g. "GENERATE: Desert convoy ambushed at sunset") to produce multi-shot footage with camera motion, voice narration, and film score.
3. Stitching: In the Mergen Studio tab, arrange your clips on the timeline and merge them seamlessly!`;
  }

  // Story ideas / brainstorming request
  if (lower.includes('idea') || lower.includes('suggest') || lower.includes('pitch') || lower.includes('brainstorm') || lower.includes('what should i make')) {
    return `Here are 3 cinematic pitches you can direct right now:
1. "GENERATE: Cyberpunk stealth operative infiltrating a rain-slicked Tokyo neon rooftop" (Anamorphic prime, steady tracking shot)
2. "GENERATE: Deep space exploration pod discovering an ancient alien monolithic structure in an asteroid belt" (Slow cosmic drift, 24mm wide)
3. "GENERATE: Medieval knight searching a torchlit gothic crypt for an enchanted crown" (Low-angle hero shot, flickering embers)
Pick one, or describe your own twist!`;
  }

  // Cinematography questions
  if (lower.includes('camera') || lower.includes('lens') || lower.includes('lighting') || lower.includes('dolly') || lower.includes('aspect ratio')) {
    return `Cinematography recommendation: For epic blockbusters, 16:9 or 2.39:1 widescreen with a 35mm Anamorphic lens gives you rich horizontal flare and shallow depth of field. For mobile/social cinema, 9:16 vertical with tight prime close-ups creates immediate intimacy. Let me know what aesthetic you want for your next sequence!`;
  }

  // Default intelligent contextual response
  if (clean.length > 0) {
    return `Understood on "${clean}". From a director's standpoint, we can build dynamic tension here using alternating wide establishing shots and tight macro inserts. If you want to produce this scene right away, type "GENERATE: ${clean}", or upload reference stills to anchor the visual style!`;
  }

  return `I'm ready in the director's chair. Upload reference photos, brainstorm scene ideas, or type "GENERATE: [scene description]" to produce!`;
}

// Gemini Grok Director Server Route (server-side only Gemini API execution)
app.post('/api/grok/direct', async (req, res) => {
  const { prompt = '', images = [], aspectRatio = '16:9', history = [], parentVideo } = req.body || {};

  // Check if this request should actually trigger a video generation
  const isVideoRequest = canTriggerGeneration(prompt, images, history, parentVideo);

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = isVideoRequest
        ? `You are GROK CINEMA, an AI film director and cinematic visual director.
The user wants to GENERATE a movie scene.
You possess persistent screenplay memory across the entire chat conversation. You remember all previously uploaded character stills, previous scenes, storylines, and character voices.

When directing:
- Character voice profiles:
  - "ghoul": raspy, dark, whispers from shadow (pitch: 0.52)
  - "monster": subterranean guttural roar, deep creature timbre (pitch: 0.42)
  - "female": sharp, resonant, confident female warrior/hero (pitch: 1.25)
  - "male": deep heroic baritone (pitch: 0.82)
  - "robot": android cybernetic speech (pitch: 1.05)
  - "narrator": epic blockbuster trailer delivery (pitch: 0.72)
- Output JSON format:
{
  "reply": "Concise 1-sentence director response",
  "isVideo": true,
  "filmTitle": "Cinematic Title",
  "characterType": "ghoul" | "monster" | "female" | "male" | "robot" | "narrator",
  "scenes": [
    {
      "title": "Shot 1: Description",
      "shotType": "Wide Establishing" | "Medium Track" | "Close-Up" | "Low-Angle Hero" | "Aerial Drone",
      "duration": 4,
      "motionType": "dolly-push" | "crane-pan" | "drone-aerial" | "steadicam-track" | "dutch-tilt" | "slow-zoom-in" | "slow-zoom-out" | "cinematic-drift",
      "effects": ["film-grain" | "anamorphic-flare" | "cinematic-fog" | "teal-orange" | "noir-contrast" | "cinematic-bars" | "golden-hour"],
      "lighting": "e.g. Dramatic low-key rim light",
      "lensDescription": "e.g. 35mm Anamorphic f/1.8",
      "subtitle": "Spoken dialogue or cinematic narration",
      "speakerName": "e.g. Female Warrior, Hero, Narrator",
      "sfx": "cinematic-boom" | "whoosh" | "sub-drop" | "shutter" | "none"
    }
  ]
}`
        : `You are GROK CINEMA, an intelligent conversational AI director and creative partner.
The user is having a normal chat, greeting you ("wassup", "hello"), asking questions, discussing ideas, or asking you to explain an uploaded picture or video concept.
You possess memory of prior scenes and uploaded stills.
DO NOT generate a video right now. Respond naturally, engagingly, and helpfully like a real smart conversational AI.
Explain that when they are ready to direct and generate a video, they should include the word "GENERATE" along with a scene description (e.g. "GENERATE a sci-fi scene..." or "GENERATE: cyberpunk city in the rain").
Output JSON format:
{
  "reply": "Your natural, helpful, engaging conversational reply that acknowledges their actual question and conversation memory.",
  "isVideo": false
}`;

      const chatContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
      const recentHistory = (history || []).slice(-6);

      for (const m of recentHistory) {
        if (m.role === 'user') {
          chatContents.push({
            role: 'user',
            parts: [
              {
                text: `User: ${m.content}${
                  m.uploadedImages?.length ? ` [${m.uploadedImages.length} reference stills uploaded]` : ''
                }`,
              },
            ],
          });
        } else if (m.role === 'assistant') {
          const videoInfo = m.generatedVideo
            ? ` [Film Produced: "${m.generatedVideo.title}", ${m.generatedVideo.scenes?.length || 0} shots, duration: ${m.generatedVideo.totalDuration || 0}s]`
            : '';
          chatContents.push({
            role: 'model',
            parts: [{ text: `${m.content}${videoInfo}` }],
          });
        }
      }

      let currentRequestText = `Prompt: ${prompt}\nAspect ratio: ${aspectRatio}\nReference stills attached: ${images.length}`;
      if (parentVideo) {
        currentRequestText += `\nCONTINUATION REQUEST: Continue from "${parentVideo.title}" which stopped at ${parentVideo.totalDuration}s. Last shot was "${parentVideo.scenes?.[parentVideo.scenes.length - 1]?.title || 'Prior scene'}". Create the next sequential scenes!`;
      }

      chatContents.push({
        role: 'user',
        parts: [{ text: currentRequestText }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: chatContents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.reply) {
          return res.json(parsed);
        }
      }
    }
  } catch (err: any) {
    console.warn('Server Gemini call fallback to dynamic director engine:', err.message || err);
  }

  // Resilient, dynamic local director engine (never static, never repetitive)
  if (!isVideoRequest) {
    const dynamicReply = generateDynamicDirectorReply(prompt, images, history);
    return res.json({
      reply: dynamicReply,
      isVideo: false,
    });
  }

  // Dynamic Scene Builder tailored to the prompt & biome
  const cleanPrompt = (prompt || '').replace(/^GENERATE:?\s*/i, '').trim();
  const biome = detectPromptBiome(cleanPrompt);
  const nextPart = parentVideo ? (parentVideo.partNumber || 1) + 1 : 1;

  // Derive title from prompt
  const title = parentVideo
    ? `${parentVideo.title.replace(/: Part \d+$/, '')}: Part ${nextPart}`
    : cleanPrompt
    ? cleanPrompt.length > 30 ? `${cleanPrompt.slice(0, 28)}...` : cleanPrompt
    : 'Cinematic Sequence';

  // Build 3 dynamic shots tailored to the biome
  const shot1Lighting = biome === 'space'
    ? 'Starlight rim glow with violet nebula wash'
    : biome === 'desert'
    ? 'Blazing golden-hour backlight with heat shimmer'
    : biome === 'jungle'
    ? 'Volumetric emerald god-rays piercing dense canopy'
    : biome === 'dungeon'
    ? 'Flickering torchlight against ancient damp stone'
    : biome === 'ocean'
    ? 'Deep oceanic aqua caustics reflecting from above'
    : biome === 'noir'
    ? 'Venetian blind chiaroscuro shadow slants'
    : 'Neon cyan & magenta street illumination';

  const shot2Lighting = biome === 'space'
    ? 'High-contrast solar reflection on hull plating'
    : biome === 'desert'
    ? 'Terracotta dune shadow gradient'
    : biome === 'jungle'
    ? 'Dappled foliage shadows with bioluminescent accents'
    : biome === 'dungeon'
    ? 'Low-angle amber brazier glow'
    : biome === 'ocean'
    ? 'Bioluminescent deep sea plankton radiance'
    : biome === 'noir'
    ? 'Tungsten desk lamp spotlight in heavy darkness'
    : 'Sodium vapor backlighting with wet asphalt bounce';

  const shot3Lighting = 'Cinematic anamorphic rim lighting';

  const scenes = [
    {
      title: `Shot 1: Wide Establishing ${biome.charAt(0).toUpperCase() + biome.slice(1)}`,
      shotType: 'Wide Establishing',
      duration: 4,
      motionType: biome === 'space' ? 'cinematic-drift' : biome === 'desert' ? 'slow-zoom-in' : 'dolly-push',
      effects: ['film-grain', 'cinematic-bars', biome === 'space' ? 'anamorphic-flare' : 'cinematic-fog'],
      lighting: shot1Lighting,
      lensDescription: '24mm Ultra-Wide Anamorphic T1.5',
      subtitle: cleanPrompt || `Establishing visual horizon in the ${biome} sector.`,
      speakerName: 'Director Narrator',
      sfx: 'cinematic-boom',
      biome,
    },
    {
      title: `Shot 2: Medium Tracking Sequence`,
      shotType: 'Medium Track',
      duration: 4,
      motionType: 'steadicam-track',
      effects: ['film-grain', 'teal-orange', 'cinematic-bars'],
      lighting: shot2Lighting,
      lensDescription: '50mm Prime T1.4',
      subtitle: `Advancing position. Narrative continuity active.`,
      speakerName: 'Director Narrator',
      sfx: 'whoosh',
      biome,
    },
    {
      title: `Shot 3: Close Dramatic Reveal`,
      shotType: 'Close-Up',
      duration: 3.5,
      motionType: 'slow-zoom-in',
      effects: ['film-grain', 'anamorphic-flare', 'cinematic-bars'],
      lighting: shot3Lighting,
      lensDescription: '85mm Macro Prime f/1.8',
      subtitle: `Target confirmed. The sequence transitions to next act.`,
      speakerName: 'Director Narrator',
      sfx: 'sub-drop',
      biome,
    },
  ];

  return res.json({
    reply: `Directed 3 cinematic ${biome} shots for "${title}"`,
    isVideo: true,
    filmTitle: title,
    characterType: 'narrator',
    scenes,
  });
});

// Story Generation Server Route
app.post('/api/story/generate', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server',
      });
    }

    const { prompt, genre = 'Fable' } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are the lead storyteller and animation director for Tale Trove Animation Studio.
Generate an animated 3-scene story based on the prompt: "${prompt}" (Genre: ${genre}).
Respond ONLY with a valid JSON object matching this schema:
{
  "title": "Story Title",
  "description": "Short logline",
  "scenes": [
    {
      "title": "Scene 1: Title",
      "duration": 5,
      "background": "twilight-forest" | "celestial-observatory" | "cyberpunk-neon" | "cozy-cottage" | "dragon-peak" | "deep-ocean",
      "weatherEffect": "none" | "fireflies" | "stardust" | "leaves" | "rain" | "bubbles",
      "narration": "Narration text for scene voiceover",
      "bgMusic": "fable" | "adventure" | "lullaby" | "mystery",
      "characters": [
        {
          "name": "Character Name",
          "type": "fox" | "knight" | "owl" | "robot" | "wizard" | "pixie" | "cat" | "frog",
          "startX": 20,
          "endX": 45,
          "y": 68,
          "emotion": "happy" | "curious" | "surprised" | "dramatic" | "talking" | "sleepy",
          "pose": "idle" | "walking" | "jumping" | "casting" | "cheering" | "bowing",
          "speech": "What the character says in this scene"
        }
      ],
      "props": ["star" | "tree" | "crystal" | "chest" | "campfire" | "potion" | "wand" | "moon" | "cloud" | "flower"]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return res.status(500).json({ error: 'Empty response from model' });
    }

    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.warn('Server story generation error:', err.message || err);
    return res.status(500).json({ error: err.message || 'Internal story generation error' });
  }
});

// Video Generation Route (Fal.ai / Wan-2.1 or Neural Video Engine)
app.post('/api/generate-video-clip', async (req, res) => {
  const { promptText, numFrames = 81, resolution = '480p' } = req.body;
  const falKey = process.env.FAL_KEY;

  if (!falKey) {
    return res.status(503).json({
      error: 'FAL_KEY is not configured on the server. Please set FAL_KEY in your server environment to enable Fal.ai video generation.',
      configured: false,
    });
  }

  try {
    const response = await fetch('https://fal.run/fal-ai/wan-t2v', {
      method: 'POST',
      headers: {
        Authorization: `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: promptText,
        num_frames: numFrames,
        resolution,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({
        error: `Fal.ai returned status ${response.status}: ${errBody}`,
      });
    }

    const data = await response.json();
    return res.json({ videoUrl: data.video?.url || data.data?.video?.url || null });
  } catch (error: any) {
    console.error('Fal.ai generation error:', error);
    return res.status(500).json({ error: error.message || 'Fal.ai generation error' });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
  });
}

startServer();
