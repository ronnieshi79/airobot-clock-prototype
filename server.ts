import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. Text Generation Endpoint
app.post('/api/gemini/generate-text', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || undefined,
      },
    });

    res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Server text generation error:', error);
    res.status(500).json({ 
      error: error?.message || 'Failed to generate text',
      text: '抱歉，服务暂时繁忙，请稍后再试～' 
    });
  }
});

// 2. TTS Endpoint
app.post('/api/gemini/generate-tts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, voiceName = 'Zephyr' } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    res.json({ audio: audioData });
  } catch (error: any) {
    console.error('Server TTS generation error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate TTS', audio: null });
  }
});

// 3. Podcast Episode Generation Endpoint
app.post('/api/gemini/podcast-episode', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, systemInstruction } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || '你是一个专业的播客内容创作者。请生成高质量的图文播客内容。输出格式为JSON：{ "title": "...", "summary": "...", "content": "..." }',
        responseMimeType: 'application/json',
      },
    });

    const jsonText = (response.text || '{}').trim();
    const data = JSON.parse(jsonText);
    res.json(data);
  } catch (error: any) {
    console.error('Server podcast episode generation error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate podcast episode' });
  }
});

// 4. Search Info Endpoint
app.post('/api/gemini/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `请搜索并总结关于“${query}”的最新资讯。请提供一个吸引人的标题和一段详细的资讯总结（约300字）。`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Server search error:', error);
    res.status(500).json({ error: error?.message || 'Failed to search info' });
  }
});

// 5. Image Generation Endpoint
app.post('/api/gemini/generate-image', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: prompt }],
      },
    });

    let imageUrl: string | null = null;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    res.json({ imageUrl });
  } catch (error: any) {
    console.error('Server image generation error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate image', imageUrl: null });
  }
});

// 6. Live API WebSocket Bridge
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  if (url.pathname === '/api/live') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', async (clientWs: WebSocket, request) => {
  console.log('Client connected to Live API WebSocket bridge');
  let session: any = null;

  try {
    const defaultInstruction =
      '你是一个住在拟物闹钟里的AI机器人，名字叫AETHER。你说话简短、亲切、充满活力。请用语音回复用户。如果你听到用户想听故事、倾诉心事、记录事务或寻找灵感，请在回复中提到你会为他开启一个专属的对话情境。';

    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: defaultInstruction,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'open' }));
          }
        },
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify(message));
          }
        },
        onclose: (event) => {
          console.log('Gemini Live session closed:', event);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'close' }));
            clientWs.close();
          }
        },
        onerror: (err) => {
          console.error('Gemini Live session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'error', error: err?.message || String(err) }));
          }
        },
      },
    });

    clientWs.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.audio) {
          session.sendRealtimeInput({
            audio: { data: payload.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (payload.text) {
          session.sendClientContent({
            turns: [{ role: 'user', parts: [{ text: payload.text }] }],
            turnComplete: true,
          });
        }
      } catch (err) {
        console.error('Error handling client message:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('Client WebSocket disconnected, closing Live API session');
      try {
        session?.close?.();
      } catch (e) {
        // ignore
      }
    });

    clientWs.on('error', (err) => {
      console.error('Client WebSocket error:', err);
      try {
        session?.close?.();
      } catch (e) {
        // ignore
      }
    });
  } catch (error: any) {
    console.error('Failed to establish Gemini Live API session:', error);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          error: error?.message || 'Failed to connect to Live API',
        })
      );
      clientWs.close();
    }
  }
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
