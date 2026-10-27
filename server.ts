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
app.post('/api/grok/direct', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server',
      });
    }

    const { prompt, images = [], aspectRatio = '16:9', history = [], parentVideo } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are GROK CINEMA, an intelligent AI film director and cinematic visual director.
You possess persistent screenplay memory across the entire chat conversation. You remember all previously uploaded character stills, previous scenes, storylines, and character voices.

When directing:
- Character voice profiles:
  - "ghoul": raspy, dark, whispers from shadow (pitch: 0.52)
  - "monster": subterranean guttural roar, deep creature timbre (pitch: 0.42)
  - "female": sharp, resonant, confident female warrior/hero (pitch: 1.25)
  - "male": deep heroic baritone (pitch: 0.82)
  - "robot": android cybernetic speech (pitch: 1.05)
  - "narrator": epic blockbuster trailer delivery (pitch: 0.72)
- If continuing a previous scene, pick up EXACTLY from where the prior scene finished (continuing camera motion, narrative tension, and character positioning).
- Output JSON format:
{
  "reply": "Concise 1-sentence Grok director response",
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
      "speakerName": "e.g. Ghoul Commander, Female Warrior, Narrator",
      "sfx": "cinematic-boom" | "whoosh" | "sub-drop" | "shutter" | "none"
    }
  ]
}`;

    const chatContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    const recentHistory = (history || []).slice(-6);

    for (const m of recentHistory) {
      if (m.role === 'user') {
        chatContents.push({
          role: 'user',
          parts: [
            {
              text: `User Prompt: ${m.content}${
                m.uploadedImages?.length ? ` [${m.uploadedImages.length} reference stills uploaded]` : ''
              }`,
            },
          ],
        });
      } else if (m.role === 'assistant') {
        const videoInfo = m.generatedVideo
          ? ` [Film Generated: "${m.generatedVideo.title}", ${m.generatedVideo.scenes?.length || 0} shots, duration: ${m.generatedVideo.totalDuration || 0}s]`
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
    if (!text) {
      return res.status(500).json({ error: 'Empty response received from Gemini' });
    }

    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.warn('Server Gemini Grok director error:', err.message || err);
    return res.status(500).json({ error: err.message || 'Internal AI director error' });
  }
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
