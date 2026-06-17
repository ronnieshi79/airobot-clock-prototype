import { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface PodcastEpisode {
  id: string;
  title: string;
  summary: string;
  type: 'story' | 'news' | 'knowledge';
  channelName: string;
  content: string;
  date: string;
  bgImage: string;
  progress?: number; // 0-100
  played?: boolean;
  favorite?: boolean;
  qnaHistory?: { question: string, answer: string }[];
}

export function usePodcast() {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [activeEpisode, setActiveEpisode] = useState<PodcastEpisode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendation, setRecommendation] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isPlaying && activeEpisode && (activeEpisode.progress || 0) < 100) {
      interval = setInterval(() => {
        setEpisodes(prev => {
          const updated = prev.map(ep => {
            if (ep.id === activeEpisode.id) {
              const nextProgress = Math.min((ep.progress || 0) + 0.5, 100);
              const isPlayed = nextProgress >= 95 || ep.played;
              return { ...ep, progress: nextProgress, played: isPlayed };
            }
            return ep;
          });
          // Only save to localStorage every 5 seconds to avoid spamming
          if (Math.floor((activeEpisode.progress || 0)) % 5 === 0) {
            localStorage.setItem('aether_podcast_history_v2', JSON.stringify(updated));
          }
          return updated;
        });
        
        setActiveEpisode(prev => {
          if (!prev) return prev;
          const nextProgress = Math.min((prev.progress || 0) + 0.5, 100);
          return { ...prev, progress: nextProgress, played: nextProgress >= 95 || prev.played };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeEpisode?.id]);

  useEffect(() => {
    const saved = localStorage.getItem('aether_podcast_history_v2');
    if (saved) {
      try {
        setEpisodes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse podcast history");
      }
    } else {
      // Initial data with 4 episodes (2 unplayed)
      const initial: PodcastEpisode[] = [
        {
          id: '1',
          title: '深海探秘：未知的深渊',
          summary: '跟随着深海潜水器的视角，探索地球上最深处的奇妙生物与地质奇观。',
          type: 'story',
          channelName: '睡前奇幻故事',
          content: '在地球表面的广阔海洋之下，存在着一个几乎完全黑暗的世界。这里有着无数我们从未见过的发光生物，以及如同外星景观般的海底热泉...',
          date: '2024-04-16',
          bgImage: 'https://picsum.photos/seed/ocean/1024/1024?blur=2',
          progress: 0,
          played: false,
          favorite: true,
          qnaHistory: []
        },
        {
          id: '2',
          title: '商业帝国的崛起：创新法则',
          summary: '深度剖析顶尖科技公司如何在几十年间保持持续创新，成长为全球最具价值的企业。',
          type: 'knowledge',
          channelName: '商业思维日课',
          content: '从最早的车库起家，到如今万亿市值，顶尖科技的成功不仅在于技术本身，更在于他们对人性、设计以及极简主义的深刻理解...',
          date: '2024-04-15',
          bgImage: 'https://picsum.photos/seed/business/1024/1024?blur=2',
          progress: 0,
          played: false,
          favorite: false,
          qnaHistory: []
        },
        {
          id: '3',
          title: '星际旅行的奥秘',
          summary: '探索宇宙深处的秘密，了解人类未来的星际航行技术。',
          type: 'knowledge',
          channelName: '宇宙探索指南',
          content: '在广袤无垠的宇宙中，星际旅行一直是人类最宏大的梦想之一...',
          date: '2024-03-28',
          bgImage: 'https://picsum.photos/seed/space/1024/1024?blur=4',
          progress: 100,
          played: true,
          favorite: true,
          qnaHistory: []
        },
        {
          id: '4',
          title: '今日全球科技速递',
          summary: '快速了解今日最重要的科技新闻，从AI突破到量子计算。',
          type: 'news',
          channelName: '每日科技速递',
          content: '今天，科技界迎来了一个重磅消息。某知名实验室宣布在室温超导领域取得了突破性进展...',
          date: '2024-03-29',
          bgImage: 'https://picsum.photos/seed/tech/1024/1024?blur=4',
          progress: 100,
          played: true,
          favorite: false,
          qnaHistory: [{ question: '什么是室温超导？', answer: '室温超导是指在接近室温的条件下，材料的电阻降为零的现象。' }]
        }
      ];
      setEpisodes(initial);
      localStorage.setItem('aether_podcast_history_v2', JSON.stringify(initial));
    }
  }, []);

  const updateEpisodeProgress = useCallback((id: string, progress: number) => {
    setEpisodes(prev => {
      const updated = prev.map(ep => 
        ep.id === id ? { ...ep, progress, played: progress >= 95 || ep.played } : ep
      );
      localStorage.setItem('aether_podcast_history_v2', JSON.stringify(updated));
      return updated;
    });
    
    setActiveEpisode(prev => prev?.id === id ? { ...prev, progress, played: progress >= 95 || prev.played } : prev);
  }, []);

  const addQnA = useCallback((id: string, question: string, answer: string) => {
    setEpisodes(prev => {
      const updated = prev.map(ep => 
        ep.id === id ? { ...ep, qnaHistory: [...(ep.qnaHistory || []), { question, answer }] } : ep
      );
      localStorage.setItem('aether_podcast_history_v2', JSON.stringify(updated));
      return updated;
    });
    
    setActiveEpisode(prev => prev?.id === id ? { ...prev, qnaHistory: [...(prev.qnaHistory || []), { question, answer }] } : prev);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setEpisodes(prev => {
      const updated = prev.map(ep => 
        ep.id === id ? { ...ep, favorite: !ep.favorite } : ep
      );
      localStorage.setItem('aether_podcast_history_v2', JSON.stringify(updated));
      return updated;
    });
    
    setActiveEpisode(prev => prev?.id === id ? { ...prev, favorite: !prev.favorite } : prev);
  }, []);

  useEffect(() => {
    // Generate recommendation based on history
    const generateRec = async () => {
      if (episodes.length === 0) {
        setRecommendation("今天想听个有趣的故事，还是了解一下最新的科技资讯？");
        return;
      }
      
      try {
        const lastTitle = episodes[0].title;
        const response = await genAI.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `基于用户最近听过的播客《${lastTitle}》，生成一条简短的推荐语（不超过30字），建议用户继续讨论该话题或开启新的灵感记录。`,
          config: {
            systemInstruction: "你是一个贴心的AI播客助手。请用亲切、自然的语气生成推荐语。",
          }
        });
        setRecommendation(response.text || "今天我们继续深入探讨，或者开启一段新的知识旅程？");
      } catch (error) {
        setRecommendation("今天我们继续深入探讨，或者开启一段新的知识旅程？");
      }
    };

    generateRec();
  }, [episodes]);

  const generateEpisode = useCallback(async (type: 'story' | 'news' | 'knowledge', topic?: string) => {
    setIsGenerating(true);
    try {
      const prompt = topic 
        ? `生成一期关于“${topic}”的${type === 'story' ? '故事' : type === 'news' ? '资讯' : '知识'}播客内容。要求：标题吸引人，内容详实且生动，适合5-10分钟的阅读/收听。`
        : `生成一期随机的${type === 'story' ? '故事' : type === 'news' ? '资讯' : '知识'}播客内容。要求：标题吸引人，内容详实且生动，适合5-10 minutes的阅读/收听。`;

      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "你是一个专业的播客内容创作者。请生成高质量的图文播客内容。输出格式为JSON：{ \"title\": \"...\", \"summary\": \"...\", \"content\": \"...\" }",
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text);
      const channelMap = {
        story: '睡前奇幻故事',
        news: '每日科技速递',
        knowledge: '宇宙探索指南'
      };
      const newEpisode: PodcastEpisode = {
        id: Date.now().toString(),
        title: data.title,
        summary: data.summary,
        type,
        channelName: channelMap[type] || '未分类栏目',
        content: data.content,
        date: new Date().toISOString().split('T')[0],
        bgImage: `https://picsum.photos/seed/${type}${Date.now()}/1920/1080?blur=4`
      };

      setEpisodes(prev => {
        const updated = [newEpisode, ...prev].slice(0, 20);
        localStorage.setItem('aether_podcast_history_v2', JSON.stringify(updated));
        return updated;
      });
      setActiveEpisode(newEpisode);
    } catch (error) {
      console.error("Failed to generate episode:", error);
      // Fallback for when API quota is exhausted
      const fallbackTitle = topic ? `关于${topic}的特别探索` : '随机发现新知';
      const channelMap = {
        story: '睡前奇幻故事',
        news: '每日科技速递',
        knowledge: '宇宙探索指南'
      };
      const newEpisode: PodcastEpisode = {
        id: Date.now().toString(),
        title: fallbackTitle,
        summary: `这是一期在 AI 生成受限时为您准备的预设 ${type === 'story' ? '故事' : type === 'news' ? '资讯' : '知识'} 播客节目。受限于 API 额度，当前显示为备用内容。`,
        type,
        channelName: channelMap[type] || '未分类栏目',
        content: `亲爱的听众，\n\n很抱歉，由于当前的 AI 调用额度已被耗尽（Error 429: Resource Exhausted），我们暂时无法为您动态生成全新的播客文章。\n\n但这并不妨碍我们为您播放来自电台的放松白噪音。当额度恢复后，您可以继续获得量身定制的私人播客内容。`,
        date: new Date().toISOString().split('T')[0],
        bgImage: `https://picsum.photos/seed/${type}fallback${Date.now()}/1920/1080?blur=4`
      };
      setEpisodes(prev => {
        const updated = [newEpisode, ...prev].slice(0, 20);
        localStorage.setItem('aether_podcast_history_v2', JSON.stringify(updated));
        return updated;
      });
      setActiveEpisode(newEpisode);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const closeEpisode = useCallback(() => {
    setActiveEpisode(null);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const addCustomEpisode = useCallback((title: string, summary: string, content: string, channelName: string, type: 'story' | 'news' | 'knowledge') => {
    const newEpisode: PodcastEpisode = {
      id: "diy_" + Date.now().toString(),
      title,
      summary,
      content,
      type,
      channelName,
      date: new Date().toISOString().split('T')[0],
      bgImage: `https://picsum.photos/seed/diy_${Date.now()}/1024/1024?blur=2`,
      progress: 0,
      played: false,
      favorite: false,
      qnaHistory: []
    };
    setEpisodes(prev => {
      const updated = [newEpisode, ...prev].slice(0, 20);
      localStorage.setItem('aether_podcast_history_v2', JSON.stringify(updated));
      return updated;
    });
    setActiveEpisode(newEpisode);
  }, []);

  return {
    episodes,
    activeEpisode,
    isGenerating,
    recommendation,
    isPlaying,
    generateEpisode,
    closeEpisode,
    setActiveEpisode,
    updateEpisodeProgress,
    addQnA,
    toggleFavorite,
    togglePlay,
    setIsPlaying,
    addCustomEpisode
  };
}
