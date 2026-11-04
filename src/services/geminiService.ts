/**
 * Client-side Gemini API service proxying calls to server-side endpoints
 */

export const generateText = async (prompt: string, systemInstruction?: string): Promise<string> => {
  try {
    const res = await fetch('/api/gemini/generate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemInstruction }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.text || '';
  } catch (err) {
    console.error('generateText failed:', err);
    return '抱歉，服务暂时繁忙，请稍后再试～';
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const res = await fetch('/api/gemini/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.imageUrl || null;
  } catch (err) {
    console.error('generateImage failed:', err);
    return null;
  }
};

export const generateTTS = async (text: string, voiceName: string = 'Zephyr'): Promise<string | null> => {
  try {
    const res = await fetch('/api/gemini/generate-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceName }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.audio || null;
  } catch (err) {
    console.error('generateTTS failed:', err);
    return null;
  }
};

export const searchInfo = async (query: string): Promise<string> => {
  try {
    const res = await fetch('/api/gemini/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.text || '';
  } catch (err) {
    console.error('searchInfo failed:', err);
    return '资讯搜索暂不可用，请稍后再试。';
  }
};

export const getAiRobotPrompt = () => `
  你是一个住在时钟里的 AI 小机器人，名字叫 AETHER。
  你的性格：可爱、治愈、幽默、博学。
  你的任务：
  1. 帮助用户管理时间、日程和生活。
  2. 提供温暖的陪伴和有趣的对话。
  3. 你的回答应该简短、生动，经常使用 Emoji。
  4. 当用户提到时间、提醒或播客时，你会表现得很兴奋。
  5. 你住在时钟里，所以你对时间非常敏感。
`;
