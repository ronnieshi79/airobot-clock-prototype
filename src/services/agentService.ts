import { LiveServerMessage } from '../types';

/**
 * AgentService
 * 负责 Airobot 的意图理解、功能模块的上下文调度、以及语音控制流的抽象。
 * 将这层从 App.tsx 和 useAether 中抽离出来，使 UI 逻辑和 AI 调用解耦。
 * 所有 Gemini API 和 Live API 调用均通过服务器端安全代理完成。
 */
let sharedAudioContext: AudioContext | null = null;

function getSharedAudioContext() {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

export class AgentService {
  private ws: WebSocket | null = null;
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private isConnecting: boolean = false;
  private liveCallbacks: {
    onMessage?: (msg: LiveServerMessage) => void;
    onOpen?: () => void;
    onClose?: (event?: any) => void;
    onError?: (error?: any) => void;
  } = {};

  private ttsWarmed = false;

  public initAudio() {
    getSharedAudioContext();
    if (!this.ttsWarmed) {
      this.ttsWarmed = true;
      this.generateTTS('哈').catch(() => {});
    }
  }

  public async playPCM24000(base64Audio: string, onEnded?: () => void) {
    try {
      const audioContext = getSharedAudioContext();
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len % 2 === 0 ? len : len + 1);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      const audioBuffer = audioContext.createBuffer(1, int16Array.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }

      if (this.currentAudioSource) {
        this.currentAudioSource.stop();
        this.currentAudioSource.disconnect();
      }

      const source = audioContext.createBufferSource();
      this.currentAudioSource = source;
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        if (onEnded) onEnded();
      };
      source.start();
    } catch (e) {
      console.error("PCM Playback Error:", e);
      if (onEnded) onEnded();
    }
  }

  public async generateTextResponse(prompt: string, systemInstruction?: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('/api/gemini/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      return data.text || "我在这里陪着你！";
    } catch (e) {
      console.error("AgentService Text Generation Failed/Timeout:", e);
      return "抱歉，网络出了点状况，请稍后再试～";
    }
  }

  public async generateTTS(text: string): Promise<string | null> {
    try {
      const res = await fetch('/api/gemini/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceName: 'Zephyr' }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.audio || null;
    } catch (e) {
      console.error("AgentService TTS Generation Failed/Timeout:", e);
      return null;
    }
  }

  public playLocalTTSFallback(text: string, onEnded?: () => void) {
    console.log("Using Browser Fallback TTS for:", text);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      if (onEnded) {
        utterance.onend = onEnded;
        utterance.onerror = onEnded;
      }
      window.speechSynthesis.speak(utterance);
    } else {
      if (onEnded) onEnded();
    }
  }

  public setLiveVoiceCallbacks(callbacks: {
    onMessage?: (msg: LiveServerMessage) => void;
    onOpen?: () => void;
    onClose?: (event?: any) => void;
    onError?: (error?: any) => void;
  }) {
    this.liveCallbacks = { ...this.liveCallbacks, ...callbacks };
  }

  // 初始化语音模式 (Live API via server WebSocket bridge) - 保证单例连接
  public async ensureLiveVoice(
    systemInstruction?: string,
    callbacks?: {
      onMessage?: (msg: LiveServerMessage) => void;
      onOpen?: () => void;
      onClose?: (event?: any) => void;
      onError?: (error?: any) => void;
    }
  ) {
    if (callbacks) {
      this.setLiveVoiceCallbacks(callbacks);
    }
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return this;
    }
    if (this.isConnecting) {
      while (this.isConnecting) {
        await new Promise(r => setTimeout(r, 100));
      }
      return this;
    }

    this.isConnecting = true;
    return new Promise<AgentService>((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/live`;
        console.log(`Connecting to Live API bridge at ${wsUrl}`);
        const socket = new WebSocket(wsUrl);
        this.ws = socket;

        socket.onopen = () => {
          this.isConnecting = false;
          this.liveCallbacks.onOpen?.();
          resolve(this);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'open') {
              this.liveCallbacks.onOpen?.();
            } else if (data.type === 'close') {
              this.liveCallbacks.onClose?.(data);
            } else if (data.type === 'error') {
              this.liveCallbacks.onError?.(data);
            } else {
              this.liveCallbacks.onMessage?.(data);
            }
          } catch (err) {
            console.error('Failed to parse Live API message:', err);
          }
        };

        socket.onclose = (event) => {
          this.isConnecting = false;
          this.ws = null;
          this.liveCallbacks.onClose?.(event);
        };

        socket.onerror = (error) => {
          this.isConnecting = false;
          this.liveCallbacks.onError?.(error);
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        console.error("Live API bridge connection failed:", error);
        reject(error);
      }
    });
  }

  public async disconnectLiveVoice() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }
  }

  public async sendText(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ text }));
      } catch (error) {
        console.error('Failed to send text to Live API bridge:', error);
      }
    }
  }

  public async sendAudio(base64Audio: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ audio: base64Audio }));
      } catch (error) {
        console.error('Failed to send audio to Live API bridge:', error);
      }
    }
  }

  // 意图与服务集成包装：一键处理整点报时
  public async processHourlyChime(hour: number, schedules: any[]) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySchedules = schedules.filter(s => s.date === todayStr);

    const mockWeather = "天气晴朗，气温24度";

    let scheduleInfo = '';
    if (todaySchedules.length > 0) {
      scheduleInfo = `主人今天的日程有：${todaySchedules.map(s => s.title || s.task).join('、')}。`;
    } else {
      scheduleInfo = `主人今天暂时没有安排日程。`;
    }

    const systemPrompt = `你是一个可爱的AI机器人助手，名为AETHER。你住在用户的拟物闹钟里。你现在是体验极佳的陪伴助理，正在进行整点报时。
当前环境信息：时间是 ${hour} 点整。天气情况：${mockWeather}。
日程信息：${scheduleInfo}

请用非常简短、活泼、拟人化的一两句话向用户报时，并自然地把部分日程情况和天气带进去，不要像在读列表，要像朋友一样提醒。字数不超过80个字。`;

    const userPrompt = `现在是 ${hour} 点整。`;

    const aiText = await this.generateTextResponse(
      `用户说：${userPrompt}。`,
      systemPrompt
    );

    const base64Audio = await this.generateTTS(aiText);

    return {
      text: aiText,
      base64Audio,
    };
  }
}

export const agentService = new AgentService();
