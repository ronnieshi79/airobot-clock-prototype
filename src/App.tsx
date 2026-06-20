import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Timer, 
  Brain, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  MessageSquare,
  Volume2,
  VolumeX,
  Bot,
  Mic,
  MicOff,
  Activity,
  Sun,
  Moon,
  X,
  Battery,
  Wifi,
  Square,
  Calendar,
  ListTodo,
  MessageCircle,
  BookOpen,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Plus,
  Check,
  Search,
  Newspaper,
  Image as ImageIcon,
  Music,
  ArrowLeft,
  Loader2,
  ExternalLink,
  ChevronDown,
  Headphones,
  Bell
} from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { HomeMenu } from './components/HomeMenu';
import { AlarmView, TimeView, useClock, TimeOverlay, AlarmOverlay, LogbookOverlay } from './clock';
import { AetherRobot, useAether } from './airobot';
import { useSchedule, TodayView, CalendarView, ScheduleView, CalendarHomeView, CalendarFlexView, CalendarListView } from './schedule';
import { usePodcast, PodcastHomeView, PodcastPlayerView, PodcastLibraryView, PodcastSubscribeView, PodcastOverlay } from './podcast';
import { MainCategory, SubCategory, ScheduleItem, Message, AlarmItem, ActiveCard } from './types';
import { SkeuomorphicDial } from './components/SkeuomorphicDial';
import { FunctionalModulePlate } from './components/FunctionalModulePlate';
import { agentService } from './services/agentService';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [mainCategory, setMainCategory] = useState<MainCategory>('time');
  const [subCategory, setSubCategory] = useState<SubCategory>('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<'focus' | 'timer' | 'alarm' | 'podcast' | 'logbook' | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  
  const [lastRingingAlarmId, setLastRingingAlarmId] = useState<string | null>(null);
  
  // AI Robot Module
  const {
    isChatOpen,
    setIsChatOpen,
    conversationState,
    setConversationState,
    messages,
    setMessages,
    isVoiceActive,
    setIsVoiceActive,
    isSpeaking,
    setIsSpeaking,
    isBlinking,
    robotState,
    addBotMessage,
    handleRobotChat: baseHandleRobotChat,
    invokeHourlyChime
  } = useAether();

  // Schedule Module
  const {
    selectedDate,
    setSelectedDate,
    selectedScheduleDay,
    setSelectedScheduleDay,
    schedules,
    isAddingSchedule,
    setIsAddingSchedule,
    newTask,
    setNewTask,
    newTime,
    setNewTime,
    addSchedule,
    toggleSchedule,
    deleteSchedule,
    todos,
    toggleTodo,
    addTodo
  } = useSchedule();

  // Clock Module
  const {
    time,
    timerSeconds,
    setTimerSeconds,
    isTimerRunning,
    setIsTimerRunning,
    focusTime,
    setFocusTime,
    isFocusRunning,
    setIsFocusRunning,
    timerPresets,
    focusPresets,
    timerHistory,
    focusHistory,
    alarmHistory,
    toggleAlarm,
    updateAlarm,
    updateTimerPreset,
    updateFocusPreset,
    ringingAlarmId,
    setRingingAlarmId,
    nextAlarmMinutes,
    totalTimerSeconds,
    setTotalTimerSeconds,
    totalFocusSeconds,
    setTotalFocusSeconds,
    alarms
  } = useClock(
    (msg, type) => {
      handleRobotChat(msg, type, `你是AETHER，当前用户设置的${type === 'focus' ? '专注' : '倒计时'}刚刚结束。请用拟人化、活泼的语气提醒用户，并简短地给予肯定或建议，不超过两句话。`);
    },
    (hour) => {
      // Hourly chime trigger
      invokeHourlyChime(hour, schedules);
    }
  );

  // AI Podcast Module
  const {
    episodes,
    activeEpisode,
    isGenerating,
    recommendation,
    isPlaying,
    generateEpisode,
    closeEpisode,
    setActiveEpisode,
    updateEpisodeProgress,
    togglePlay,
    addCustomEpisode
  } = usePodcast();

  // Live API Refs (Restored)
  const sessionRef = useRef<any>(null);
  const shouldCloseRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueue = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const wakeWordRecognitionRef = useRef<any>(null);
  const startVoiceModeRef = useRef<(() => void) | null>(null);

  // Chat Features State (Remaining)
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [interimUserText, setInterimUserText] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  // Info & Card State
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const conversationStateRef = useRef(conversationState);
  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);

  // 提前初始化语音服务，提升首次点击的速度
  useEffect(() => {
    const systemInstruction = "你是一个住在拟物闹钟里的AI机器人，名字叫AETHER。你说话简短、亲切、充满活力。请用语音回复用户。如果你听到用户想听故事、倾诉心事、记录事务或寻找灵感，请在回复中提到你会为他开启一个专属的对话情境。";
    agentService.ensureLiveVoice(systemInstruction, {
      onClose: () => { console.log('Live Voice connection naturally closed.'); },
      onError: (err) => { console.log('Live Voice connection naturally error.', err); }
    }).catch(err => {
      console.log("Init live voice failed", err);
    });
  }, []);

  const alarmCallCountRef = useRef(0);
  const fallbackAlarmAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (ringingAlarmId) {
      setLastRingingAlarmId(ringingAlarmId);
    }
  }, [ringingAlarmId]);

  // Auto show alarm overlay when ringing
  useEffect(() => {
    if (isChatOpen) {
      setLastInteractionTime(Date.now());
    }
  }, [isChatOpen]);

  useEffect(() => {
    let initialTimeout: NodeJS.Timeout | null = null;

    if (ringingAlarmId) {
      setActiveOverlay('alarm');
      setIsChatOpen(true);
      setLastInteractionTime(Date.now());
      
      const ringAlarm = alarms.find(a => a.id === ringingAlarmId);
      alarmCallCountRef.current = 0;
      
      // Play a standard alarm tone in background first
      if (typeof window !== 'undefined') {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
        audio.loop = true;
        audio.volume = 0.3;
        audio.play().catch(() => console.log("Audio play blocked by browser"));
        fallbackAlarmAudioRef.current = audio;
      }
      
      const sayAlarm = () => {
        // If the user started talking, we don't interrupt
        if (conversationStateRef.current !== 'idle' && alarmCallCountRef.current > 0) {
          // If user is talking, we consider they are 'awake' and don't interrupt, but we reschedule
          const intervalMs = ringAlarm ? Math.max(ringAlarm.interval * 60 * 1000, 30000) : 60000;
          initialTimeout = setTimeout(sayAlarm, intervalMs);
          return;
        }
        
        const maxCount = ringAlarm ? ringAlarm.repeatCount : 3;

        // Auto-close the alarm if user didn't respond after max calls
        if (alarmCallCountRef.current >= maxCount) {
           setRingingAlarmId(null);
           setIsChatOpen(false);
           setConversationState('idle');
           setIsVoiceActive(false);
           return;
        }
        
        let urgency = '第一声唤醒。请用活泼拟人化的语气叫醒/提醒用户，简短一两句话。';
        const currentCount = alarmCallCountRef.current;
        if (currentCount === maxCount - 1 && maxCount > 1) urgency = '最后警告！语气非常焦急和崩溃，大声警告用户再不关就要生气了。简短一两句！';
        else if (currentCount > 0) urgency = '用户还没关闹钟，语气开始有些不满和调皮，督促他们快点起床或完成事务。';

        setIsChatOpen(true);
        setLastInteractionTime(Date.now()); // Reset closing timer
        if (ringAlarm) {
          baseHandleRobotChat(`闹钟响铃中：${ringAlarm.label}`, 'alarm', `你是AETHER，当前用户的闹钟正在响铃，名字叫“${ringAlarm.label}”，时间是 ${ringAlarm.time}。\n${urgency}`);
        }
        alarmCallCountRef.current++;

        // Schedule next call after interval + 30 seconds (to wait for failure)
        const baseIntervalMs = ringAlarm ? Math.max(ringAlarm.interval * 60 * 1000, 30000) : 60000;
        const nextCallDelay = baseIntervalMs + 30000; // Adding 30s to account for the chat timeout window
        initialTimeout = setTimeout(sayAlarm, nextCallDelay);
      };

      initialTimeout = setTimeout(sayAlarm, 3000); // 3 seconds after standard ring starts
    } else {
      if (fallbackAlarmAudioRef.current) {
        fallbackAlarmAudioRef.current.pause();
        fallbackAlarmAudioRef.current = null;
      }
      alarmCallCountRef.current = 0;
    }

    return () => {
      // Clean up previous alarm
      if (initialTimeout) clearTimeout(initialTimeout);
      if (fallbackAlarmAudioRef.current) {
        fallbackAlarmAudioRef.current.pause();
      }
    };
  }, [ringingAlarmId, alarms, baseHandleRobotChat, setIsChatOpen, setRingingAlarmId]);

  // Auto show focus overlay when focus ends
  useEffect(() => {
    if (focusTime === 0 && !isFocusRunning && totalFocusSeconds > 0) {
      setActiveOverlay('focus');
    }
  }, [focusTime, isFocusRunning, totalFocusSeconds]);

  // Auto show timer overlay when timer ends
  useEffect(() => {
    if (timerSeconds === 0 && !isTimerRunning && totalTimerSeconds > 0) {
      setActiveOverlay('timer');
    }
  }, [timerSeconds, isTimerRunning, totalTimerSeconds]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, conversationState]);

  const handleRobotChat = async (prompt: string, type: 'general' | 'knowledge' | 'story' | 'news' | 'timer' | 'focus' | 'alarm' = 'general', systemInstruction?: string) => {
    // Intent detection for Chat scenarios and other modules
    if (type === 'knowledge' || type === 'story' || type === 'news') {
      const mappedType = type === 'story' ? 'video' : type === 'news' ? 'text' : 'audio';
      generateEpisode(mappedType, prompt);
      setActiveOverlay('podcast');
      return;
    }
    
    // Fallback to text chat pipeline, which already has intent processing
    await handleUserMessage(prompt, systemInstruction);
  };
  const playNextChunk = useCallback(() => {
    if (audioQueue.current.length === 0 || isPlayingRef.current || !audioContextRef.current) {
      if (!isPlayingRef.current && audioQueue.current.length === 0 && shouldCloseRef.current) {
        stopVoiceMode();
      }
      setIsSpeaking(false);
      return;
    }
    isPlayingRef.current = true;
    setIsSpeaking(true);
    const chunk = audioQueue.current.shift()!;
    const audioBuffer = audioContextRef.current.createBuffer(1, chunk.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < chunk.length; i++) channelData[i] = chunk[i] / 32768.0;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => {
      isPlayingRef.current = false;
      if (audioQueue.current.length === 0 && shouldCloseRef.current) {
        stopVoiceMode();
      } else {
        playNextChunk();
      }
    };
    source.start();
  }, []);

  // Automatically close conversation if no interaction for 30 seconds
  useEffect(() => {
    if (!isVoiceActive && !isChatOpen) return;
    
    const intervalId = setInterval(() => {
      if (conversationStateRef.current === 'thinking' || conversationStateRef.current === 'speaking') {
        // Reset timer while bot is active
        setLastInteractionTime(Date.now());
        return;
      }
      
      if (Date.now() - lastInteractionTime > 30000) {
        console.log("No interaction for 30 seconds, automatically closing conversation.");
        setIsVoiceActive(false); 
        setIsListening(false); 
        setIsSpeaking(false);
        setIsChatOpen(false);
        setConversationState('idle');
        agentService.disconnectLiveVoice();
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isVoiceActive, isChatOpen, lastInteractionTime, activeOverlay]);

  useEffect(() => {
    startVoiceModeRef.current = startVoiceMode;
  });

  const startVoiceMode = async () => {
    if (isVoiceActive) { stopVoiceMode(); return; }
    
    // Create audio context synchronously on user interaction
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    try {
      shouldCloseRef.current = false;
      setIsVoiceActive(true);
      setIsListening(true);
      setIsChatOpen(true);
      setConversationState('listening');
      setLastInteractionTime(Date.now());
      
      const systemInstruction = "你是一个住在拟物闹钟里的AI机器人，名字叫AETHER。你说话简短、亲切、充满活力。请用语音回复用户。如果你听到用户想听故事、倾诉心事、记录事务或寻找灵感，请在回复中提到你会为他开启一个专属的对话情境。";
      
      const session = await agentService.ensureLiveVoice(
        systemInstruction,
        {
          onOpen: () => {},
          onMessage: async (message: LiveServerMessage) => {
            if (!sessionRef.current) return; // Prevent processing stray messages if voice mode is off
            
            console.log("Live API Message received:", message);
            setLastInteractionTime(Date.now());
            
            if (message.serverContent?.outputTranscription?.text) {
              setMessages(prev => {
                const text = message.serverContent!.outputTranscription!.text;
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === 'bot' && lastMsg.isStreaming) {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...lastMsg, text: lastMsg.text + text };
                  return updated;
                } else {
                  return [...prev, { role: 'bot', text, isStreaming: true }].slice(-20);
                }
              });
            }
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  setConversationState('speaking');
                  const base64Audio = part.inlineData.data;
                  const binaryString = window.atob(base64Audio);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                  audioQueue.current.push(new Int16Array(bytes.buffer));
                  playNextChunk();
                }
                if (part.text) {
                  setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && lastMsg.role === 'bot' && lastMsg.isStreaming) {
                      const updated = [...prev];
                      updated[updated.length - 1] = { ...lastMsg, text: lastMsg.text + part.text };
                      return updated;
                    } else {
                      return [...prev, { role: 'bot', text: part.text, isStreaming: true }].slice(-20);
                    }
                  });
                }
              }
            }
            if (message.serverContent?.turnComplete) {
              setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === 'bot') {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...lastMsg, isStreaming: false };
                  return updated;
                }
                return prev;
              });

              if (shouldCloseRef.current && !isPlayingRef.current && audioQueue.current.length === 0) {
                stopVoiceMode();
                return;
              }

              // Back to listening after speaking (continuous dialog)
              setTimeout(() => {
                setConversationState('listening');
              }, 1500);
            }
          },
          onClose: (event) => { 
            console.log("Live API connection closed", event); 
            if (isVoiceActive) stopVoiceMode(); 
          },
          onError: (error: any) => { 
            if (error?.message === 'Network error') {
                console.log("Live API connection error (safe to ignore in preview):", error);
            } else {
                console.error("Live API connection error", error); 
            }
            if (isVoiceActive) {
                setMessages(prev => {
                  const newMessages = [...prev, { role: 'bot', text: 'AETHER暂时不在线或服务已掉线，请稍后再试。' }];
                  return newMessages.slice(-20);
                });
                stopVoiceMode(); 
            }
          }
        }
      );
      sessionRef.current = session;
    } catch (err) { 
      console.error("Live Voice Connection Error:", err);
      setIsVoiceActive(false); 
      setConversationState('idle');
      setMessages(prev => {
        const newMessages = [...prev, { role: 'bot', text: 'AETHER暂时不在线或服务已掉线，请稍后再试。' }];
        return newMessages.slice(-20);
      });
    }
  };

  const stopVoiceMode = () => {
    setIsVoiceActive(false); 
    setIsListening(false); 
    setIsSpeaking(false);
    setIsChatOpen(false);
    setConversationState('idle');
    // DO NOT disconnect globally, just suspend UI
    sessionRef.current = null;
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.suspend(); }
  };

  // ASR logic explicitly only for in-conversation low-latency UI feedback
  useEffect(() => {
    if (!isVoiceActive || conversationState !== 'listening') {
      if (wakeWordRecognitionRef.current) {
        wakeWordRecognitionRef.current.onend = null;
        try { wakeWordRecognitionRef.current.stop(); } catch(e) {}
        wakeWordRecognitionRef.current = null;
        console.log("ASR explicitly stopped, airobot is not listening.");
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let recognition: any;
    try {
      recognition = new SpeechRecognition();
      // Use this instance strictly for active listening state
      recognition.continuous = true;
      recognition.interimResults = true; // Use interim for low-latency text render
      recognition.lang = 'zh-CN';

      recognition.onresult = (event: any) => {
        setLastInteractionTime(Date.now());
        let finalStr = '';
        let interimStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalStr += event.results[i][0].transcript;
          else interimStr += event.results[i][0].transcript;
        }
        if (finalStr || interimStr) {
          console.log("Google ASR Voice Recognized:", finalStr || interimStr);
          setInterimUserText(finalStr || interimStr);
        }
        if (finalStr) {
           console.log("Submitting final STT to Live API via sendText");
           const intent = processFunctionalIntent(finalStr);
           if (intent.isClosing) {
             shouldCloseRef.current = true;
           }

           setConversationState('thinking');
           setInterimUserText('');
           setMessages(prev => {
             const newMessages = [...prev, { role: 'user', text: finalStr }];
             return newMessages.slice(-20);
           });
           
           agentService.sendText(finalStr);
        }
      };

      let asrErrorType = '';
      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          if (e.error === 'network') {
            console.log("ASR network error (safe to ignore in preview):", e.error);
          } else {
            console.error("ASR error:", e.error);
          }
        }
        asrErrorType = e.error;
      };

      recognition.onend = () => {
        // Auto-restart if we are still meant to be listening
        if (isVoiceActive && conversationState === 'listening' && wakeWordRecognitionRef.current) {
           if (asrErrorType === 'network') {
               setTimeout(() => {
                  if (isVoiceActive && conversationState === 'listening' && wakeWordRecognitionRef.current) {
                      try { wakeWordRecognitionRef.current.start(); } catch (e) {}
                  }
               }, 2000);
           } else {
               try { wakeWordRecognitionRef.current.start(); } catch (e) {}
           }
        }
      };

      recognition.start();
      console.log("Google ASR explicitly started, airobot is listening.");
      wakeWordRecognitionRef.current = recognition;
    } catch (e) {
      console.error("Failed to start ASR recognition:", e);
    }

    return () => {
      if (wakeWordRecognitionRef.current) {
         wakeWordRecognitionRef.current.onend = null;
         try { wakeWordRecognitionRef.current.stop(); } catch (e) {}
         wakeWordRecognitionRef.current = null;
      }
    };
  }, [isVoiceActive, conversationState]);

  useEffect(() => {
    setSuggestions(getAiPromptSuggestions());
  }, [mainCategory, subCategory, activeOverlay]);

  const processFunctionalIntent = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Intent detection for closing
    const isClosingIntent = ['好的', '知道了', '拜拜', '再见', '退出', '关闭', '没事了', '直到了', '停止', '休息吧'].some(k => lowerText.includes(k));
    
    if (isClosingIntent) {
      if (activeOverlay === 'timer') {
        setIsTimerRunning(false);
        setTimerSeconds(totalTimerSeconds);
        setActiveOverlay(null);
      } else if (activeOverlay === 'focus') {
        setIsFocusRunning(false);
        setFocusTime(totalFocusSeconds);
        setActiveOverlay(null);
      } else if (activeOverlay === 'alarm') {
        setRingingAlarmId(null);
        setActiveOverlay(null);
      }
      return { isClosing: true, handled: true };
    }

    if (lowerText.includes("暂停")) {
      if (activeOverlay === 'timer') setIsTimerRunning(false);
      else if (activeOverlay === 'focus') setIsFocusRunning(false);
      return { isClosing: false, handled: true };
    } else if (lowerText.includes("继续") || lowerText.includes("开始计时") || lowerText.includes("开始专注")) {
      if (activeOverlay === 'timer') setIsTimerRunning(true);
      else if (activeOverlay === 'focus') setIsFocusRunning(true);
      return { isClosing: false, handled: true };
    } else if (lowerText.includes("闹钟") || lowerText.includes("叫醒")) {
      setMainCategory('time');
      setSubCategory('alarm');
      return { isClosing: false, handled: true };
    } else if (lowerText.includes("计时") || lowerText.includes("倒计时") || lowerText.includes("秒表")) {
      setMainCategory('time');
      setSubCategory('timer');
      return { isClosing: false, handled: true };
    } else if (lowerText.includes("专注") || lowerText.includes("番茄钟")) {
      setMainCategory('time');
      setSubCategory('timer');
      return { isClosing: false, handled: true };
    } else if (lowerText.includes("日程") || lowerText.includes("安排") || lowerText.includes("待办")) {
      setMainCategory('calendar');
      setSubCategory('today');
      return { isClosing: false, handled: true };
    }

    if (lowerText.includes("故事") || lowerText.includes("讲一个") || lowerText.includes("听个")) {
      generateEpisode('video', lowerText);
      setActiveOverlay('podcast');
      return { isClosing: false, handled: true };
    } else if (lowerText.includes("资讯") || lowerText.includes("新闻") || lowerText.includes("最近发生")) {
      generateEpisode('text', lowerText);
      setActiveOverlay('podcast');
      return { isClosing: false, handled: true };
    } else if (lowerText.includes("知识") || lowerText.includes("科普") || lowerText.includes("学习")) {
      generateEpisode('audio', lowerText);
      setActiveOverlay('podcast');
      return { isClosing: false, handled: true };
    }

    return { isClosing: false, handled: false };
  };

  const handleUserMessage = async (text: string, systemInstruction?: string) => {
    setLastInteractionTime(Date.now());
    agentService.initAudio(); // Explicitly init audio context on user interaction
    
    const intent = processFunctionalIntent(text);

    setMessages(prev => {
      const newMessages = [...prev, { role: 'user', text }];
      return newMessages.slice(-20);
    });
    
    // If not a closing intent, but we handled a functional overlay/view, we should still let AI reply? 
    // And if it's closing intent, we also let AI say goodbye.
    
    setConversationState('thinking');
    
    try {
      const defaultInstruction = "你是一个AI机器人AETHER。请简短回复用户，语气亲切幽默。";
      const aiText = await agentService.generateTextResponse(
        text,
        systemInstruction || defaultInstruction
      );

      setConversationState('speaking');
      setMessages(prev => {
        const newMessages = [...prev, { role: 'bot', text: aiText }];
        return newMessages.slice(-20);
      });
      
      try {
        const base64TTS = await agentService.generateTTS(aiText);
        const onSpeechEnd = () => {
          if (intent.isClosing) {
            setIsChatOpen(false);
            setConversationState('idle');
            setIsVoiceActive(false);
          } else {
            setConversationState('listening');
            if (intent.handled) {
              // If we opened a module, maybe hide chat to show the module?
            }
          }
        };

        if (base64TTS) {
          agentService.playPCM24000(base64TTS, onSpeechEnd);
        } else {
          agentService.playLocalTTSFallback(aiText, onSpeechEnd);
        }
        return; // Skip the setTimeout down below
      } catch (e) {
        console.error("TTS Error in handleUserMessage:", e);
      }
      
      if (intent.isClosing) {
        setTimeout(() => {
          setIsChatOpen(false);
          setConversationState('idle');
          setIsVoiceActive(false);
        }, 1500);
      } else {
        setTimeout(() => {
          setConversationState('listening');
        }, 3000);
      }
    } catch (error) {
      console.error("AI Error:", error);
      
      setMessages(prev => {
        const newMessages = [...prev, { role: 'bot', text: 'AETHER暂时不在线或服务已掉线，请稍后再试。' }];
        return newMessages.slice(-20);
      });
      
      if (intent.isClosing) {
        setTimeout(() => {
          setIsChatOpen(false);
          setConversationState('idle');
          setIsVoiceActive(false);
        }, 1500);
      } else {
        setTimeout(() => {
          setConversationState('listening');
        }, 3000);
      }
    }
  };

  const formatSeconds = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustTime = (amount: number) => {
    if (subCategory === 'timer' && !isTimerRunning) {
      setTimerSeconds(prev => {
        const newVal = Math.max(60, prev + amount);
        setTotalTimerSeconds(newVal);
        return newVal;
      });
    } else if (subCategory === 'focus' && !isFocusRunning) {
      setFocusTime(prev => {
        const newVal = Math.max(60, prev + amount);
        setTotalFocusSeconds(newVal);
        return newVal;
      });
    }
  };

  const setTime = (seconds: number) => {
    if (subCategory === 'timer' && !isTimerRunning) {
      setTimerSeconds(seconds);
      setTotalTimerSeconds(seconds);
    } else if (subCategory === 'focus' && !isFocusRunning) {
      setFocusTime(seconds);
      setTotalFocusSeconds(seconds);
    }
  };

  useEffect(() => {
    if (mainCategory === 'podcast' && subCategory === 'podcast-player' && !activeEpisode && episodes.length > 0) {
      const unplayed = episodes.find(e => !e.played);
      setActiveEpisode(unplayed || episodes[0]);
    }
  }, [mainCategory, subCategory, activeEpisode, episodes, setActiveEpisode]);

  const handleIntelligentSubCategorySwitch = () => {
    if (mainCategory === 'time') {
      const order: SubCategory[] = ['home', 'alarm', 'timer'];
      const currentIndex = order.indexOf(subCategory);
      setSubCategory(order[(currentIndex + 1) % order.length]);
    } else if (mainCategory === 'calendar') {
      const order: SubCategory[] = ['calendar-home', 'calendar-flex', 'calendar-list'];
      const currentIndex = order.indexOf(subCategory);
      setSubCategory(order[(currentIndex + 1) % order.length]);
    } else if (mainCategory === 'podcast') {
      const order: SubCategory[] = ['podcast-home', 'podcast-library', 'podcast-subscribe'];
      const currentIndex = order.indexOf(subCategory);
      setSubCategory(order[(currentIndex + 1) % order.length]);
    }
  };

  const getAiPromptSuggestions = () => {
    if (activeOverlay === 'logbook') {
      return ['总结我这周的专注情况', '查看最新的 AI 报告', '最近有哪些重要日程？'];
    }
    if (activeOverlay === 'podcast') {
       return ['播放下一集', '这个播客讲了什么？', '推荐一些人文类播客'];
    }

    switch (mainCategory) {
      case 'time':
        if (subCategory === 'timer') return ['定一个5分钟的泡茶倒计时', '开启一个25分钟番茄钟', '开启深度专注模式', '计时开始'];
        if (subCategory === 'alarm') return ['明早7点叫醒我', '帮我规划完美的晨间作息', '今天有什么提醒？'];
        return ['总结我今天的专注情况', '帮我建立一个番茄钟', '查看记事本'];
      case 'calendar':
        if (subCategory === 'calendar-list') return ['今天有哪些待办？', '将未完成任务移到明天', '高优任务是什么？'];
        if (subCategory === 'calendar-flex') return ['帮我安排这周的运动', '找出明天的空闲时间', '这周我想读两本书'];
        return ['明天上午10点开会', '这周末有哪些安排？', '添加一个购物清单'];
      case 'podcast':
        if (subCategory === 'podcast-library') return ['播放我喜欢的', '有什么新推播客？', '随机播放一集'];
        if (subCategory === 'podcast-subscribe') return ['订阅《科技前沿》', '推荐历史类播客', '退订最近没听的播客'];
        return ['播放每日新闻', '我想听点轻松的神话故事', '昨天播客的重点是什么？'];
      default:
        return ['你好呀', '你能做什么？', '今天天气如何？'];
    }
  };

  const renderSubCategoryContent = () => {
    switch (mainCategory) {
      case 'time':
        if (subCategory === 'home') {
          return (
            <FunctionalModulePlate isDarkMode={isDarkMode}>
              <HomeMenu 
                isDarkMode={isDarkMode} 
                time={time} 
                schedules={schedules} 
                focusTime={focusTime}
                isFocusRunning={isFocusRunning}
                timerSeconds={timerSeconds}
                isTimerRunning={isTimerRunning}
                alarms={alarms}
                alarmHistory={alarmHistory}
                focusHistory={focusHistory}
                timerHistory={timerHistory}
                onNavigate={(cat, sub) => { setMainCategory(cat); setSubCategory(sub); }}
                onAction={(id) => {
                  if (id === 'popup-focus') setActiveOverlay('focus');
                  else if (id === 'popup-timer') setActiveOverlay('timer');
                  else if (id === 'popup-alarm') setActiveOverlay('alarm');
                  else if (id === 'logbook') setActiveOverlay('logbook');
                }}
                onFocusClick={() => setActiveOverlay('focus')}
                onTimerClick={() => setActiveOverlay('timer')}
                onAlarmClick={() => setActiveOverlay('alarm')}
              />
            </FunctionalModulePlate>
          );
        }
        return (
          <FunctionalModulePlate isDarkMode={isDarkMode}>
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              {subCategory === 'alarm' ? (
                <AlarmView
                  isDarkMode={isDarkMode}
                  alarms={alarms}
                  alarmHistory={alarmHistory}
                  onToggleAlarm={toggleAlarm}
                  onUpdateAlarm={updateAlarm}
                  ringingAlarmId={ringingAlarmId}
                  nextAlarmMinutes={nextAlarmMinutes}
                  onShowOverlay={(id) => {
                    if (id) setActivePresetId(id);
                    setActiveOverlay('alarm');
                  }}
                  onShowLogbook={() => setActiveOverlay('logbook')}
                />
              ) : (
                <TimeView
                  subCategory={'timer'}
                  time={time}
                  timerSeconds={timerSeconds}
                  isTimerRunning={isTimerRunning}
                  presets={timerPresets}
                  timerHistory={timerHistory}
                  focusHistory={focusHistory}
                  onTimerStart={() => setIsTimerRunning(true)}
                  onTimerPause={() => setIsTimerRunning(false)}
                  onTimerReset={() => setTimerSeconds(0)}
                  onTimerAdjust={adjustTime}
                  onTimerSet={(seconds) => {
                    const preset = timerPresets.find(p => p.seconds === seconds);
                    if (preset?.mode === 'focus') {
                      setFocusTime(seconds);
                      setTotalFocusSeconds(seconds);
                    } else {
                      setTimerSeconds(seconds);
                      setTotalTimerSeconds(seconds);
                    }
                  }}
                  onUpdatePreset={updateTimerPreset}
                  isDarkMode={isDarkMode}
                  onShowOverlay={(presetId) => {
                    if (presetId) {
                      setActivePresetId(presetId);
                      const preset = timerPresets.find(p => p.id === presetId);
                      if (preset) {
                        if (preset.mode === 'focus') {
                          setFocusTime(preset.seconds);
                          setTotalFocusSeconds(preset.seconds);
                          setActiveOverlay('focus');
                        } else {
                          setTimerSeconds(preset.seconds);
                          setTotalTimerSeconds(preset.seconds);
                          setActiveOverlay('timer');
                        }
                      }
                    } else {
                      setActiveOverlay('timer');
                    }
                  }}
                  onShowLogbook={() => setActiveOverlay('logbook')}
                />
              )}
            </div>
          </FunctionalModulePlate>
        );
      case 'calendar':
        return (
          <FunctionalModulePlate isDarkMode={isDarkMode} className="flex flex-col">
            <div className="relative z-10 w-full h-full flex flex-col">
              {subCategory === 'calendar-home' && (
                <CalendarHomeView 
                  isDarkMode={isDarkMode} 
                  todos={todos}
                  schedules={schedules}
                  time={time}
                  onNavigate={(cat, sub) => { setMainCategory(cat); setSubCategory(sub); }}
                  onShowLogbook={() => setActiveOverlay('logbook')}
                />
              )}
              {subCategory === 'calendar-flex' && (
                <CalendarFlexView
                  isDarkMode={isDarkMode}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  todos={todos}
                  schedules={schedules}
                  time={time}
                  onNavigate={(cat, sub) => { setMainCategory(cat); setSubCategory(sub); }}
                  onToggleTodo={toggleTodo}
                />
              )}
              {subCategory === 'calendar-list' && (
                <CalendarListView
                  isDarkMode={isDarkMode}
                  todos={todos}
                  schedules={schedules}
                  time={time}
                  onNavigate={(cat, sub) => { setMainCategory(cat); setSubCategory(sub); }}
                  onToggleTodo={toggleTodo}
                  onAddTodo={addTodo}
                  onToggleSchedule={toggleSchedule}
                />
              )}
            </div>
          </FunctionalModulePlate>
        );
      case 'podcast':
        return (
          <FunctionalModulePlate isDarkMode={isDarkMode}>
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              {subCategory === 'podcast-library' ? (
                <PodcastLibraryView 
                  isDarkMode={isDarkMode}
                  episodes={episodes}
                  onSelectEpisode={(ep) => {
                    setActiveEpisode(ep);
                    setActiveOverlay('podcast');
                  }}
                  onGenerate={(type) => {
                    generateEpisode(type);
                    setActiveOverlay('podcast');
                  }}
                  time={time}
                  schedules={schedules}
                  onNavigate={(cat, sub) => { setMainCategory(cat); setSubCategory(sub); }}
                  onAddCustomEpisode={addCustomEpisode}
                />
              ) : subCategory === 'podcast-subscribe' ? (
                <PodcastSubscribeView
                  isDarkMode={isDarkMode}
                  time={time}
                  schedules={schedules}
                  onNavigate={(cat, sub) => { setMainCategory(cat); setSubCategory(sub); }}
                  onAddCustomEpisode={addCustomEpisode}
                />
              ) : (
                <PodcastHomeView 
                  isDarkMode={isDarkMode}
                  episodes={episodes}
                  recommendation={recommendation}
                  onSelectEpisode={(ep) => {
                    setActiveEpisode(ep);
                    setActiveOverlay('podcast');
                  }}
                  onGenerate={(type) => {
                    generateEpisode(type);
                    setActiveOverlay('podcast');
                  }}
                  time={time}
                  schedules={schedules}
                  onNavigate={(cat, sub) => { setMainCategory(cat); setSubCategory(sub); }}
                  activeEpisode={activeEpisode}
                  isPlaying={isPlaying}
                  onTogglePlay={togglePlay}
                  progress={activeEpisode?.progress || 0}
                  onOpenPlayer={() => setActiveOverlay('podcast')}
                  onShowLogbook={() => setActiveOverlay('logbook')}
                />
              )}
            </div>
          </FunctionalModulePlate>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500 overflow-hidden ${isDarkMode ? 'bg-dark' : 'bg-light'}`}>
      
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-20 -left-20 w-96 h-96 rounded-full blur-[100px] opacity-20 ${isDarkMode ? 'bg-indigo-900' : 'bg-indigo-200'}`}></div>
        <div className={`absolute bottom-0 -right-20 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
        <div className={`absolute top-1/2 left-1/4 w-20 h-20 rounded-full blur-[40px] opacity-30 ${isDarkMode ? 'bg-slate-600' : 'bg-white'}`}></div>
      </div>

      {/* Header Info */}
      <div className="fixed top-8 left-12 flex items-center gap-4 z-10">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isDarkMode ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'}`}>
          <Activity size={20} />
        </div>
        <span className={`text-xl font-black tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>AETHER</span>
      </div>

      <div className="fixed top-8 right-12 flex items-center gap-6 text-xs font-bold text-slate-400 z-10">
        <div className="flex items-center gap-2"><Battery size={16} /> 85%</div>
        <div className="flex items-center gap-2"><Wifi size={16} /> ONLINE</div>
        <div className={`text-lg font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          {time.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="fixed inset-0 grid grid-cols-[1fr_640px_1fr] items-center z-10 pointer-events-none">
        
        {/* Left Column: Main Categories (Centered in left blank space) */}
        <div className="hidden lg:flex justify-center items-center h-full pointer-events-auto">
          <SkeuomorphicDial 
            activeCategory={mainCategory} 
            onChange={(cat) => {
              setMainCategory(cat);
              if (cat === 'time') setSubCategory('home');
              else if (cat === 'calendar') setSubCategory('calendar-home');
              else if (cat === 'podcast') setSubCategory('podcast-home');
            }} 
            onCenterClick={handleIntelligentSubCategorySwitch}
            subCategory={subCategory}
            isDark={isDarkMode} 
          />
        </div>

        {/* Center Column: Main Content Area */}
        <div className="flex flex-col items-center justify-center h-full pointer-events-auto">
          <div className="w-full flex flex-col items-center justify-center relative">
            {renderSubCategoryContent()}

            {/* Local Overlays (Covering only the functional card) */}
            <TimeOverlay
              show={activeOverlay === 'focus' || activeOverlay === 'timer'}
              subCategory={activeOverlay === 'focus' ? 'focus' : 'timer'}
              timerSeconds={activeOverlay === 'focus' ? focusTime : timerSeconds}
              totalSeconds={activeOverlay === 'focus' ? totalFocusSeconds : totalTimerSeconds}
              isTimerRunning={activeOverlay === 'focus' ? isFocusRunning : isTimerRunning}
              onTimerStart={() => activeOverlay === 'focus' ? setIsFocusRunning(true) : setIsTimerRunning(true)}
              onTimerPause={() => activeOverlay === 'focus' ? setIsFocusRunning(false) : setIsTimerRunning(false)}
              onTimerReset={() => activeOverlay === 'focus' ? setFocusTime(totalFocusSeconds) : setTimerSeconds(totalTimerSeconds)}
              onClose={() => setActiveOverlay(null)}
              isDarkMode={isDarkMode}
              activePreset={activePresetId ? timerPresets.find(p => p.id === activePresetId) : undefined}
            />

            <AlarmOverlay
              show={activeOverlay === 'alarm'}
              isDarkMode={isDarkMode}
              currentAlarm={alarms.find(a => a.id === (ringingAlarmId || lastRingingAlarmId || activePresetId)) || alarms[0]}
              isRinging={!!ringingAlarmId}
              onToggleAlarm={toggleAlarm}
              onStopRinging={() => setRingingAlarmId(null)}
              onClose={() => setActiveOverlay(null)}
            />

            <LogbookOverlay
              show={activeOverlay === 'logbook'}
              onClose={() => setActiveOverlay(null)}
              isDarkMode={isDarkMode}
              timerHistory={timerHistory}
              focusHistory={focusHistory}
              alarmHistory={alarmHistory}
              episodes={episodes}
              schedules={schedules}
              todos={todos}
            />

            <PodcastOverlay
              show={activeOverlay === 'podcast'}
              isDarkMode={isDarkMode}
              episode={activeEpisode}
              isPlaying={isPlaying}
              progress={activeEpisode?.progress || 0}
              onTogglePlay={togglePlay}
              onClose={() => setActiveOverlay(null)}
              onAskAether={(topic) => {
                setIsChatOpen(true);
                handleRobotChat(`关于《${topic}》，我想了解更多...`);
              }}
            />
          </div>
        </div>

        {/* Right Column: Robot & Chat (Positioned in right bottom corner) */}
        <div className={`hidden lg:flex justify-end ${isChatOpen ? 'items-center pt-24' : 'items-end pb-[20vh]'} h-full pointer-events-auto px-12`}>
          <div className="flex flex-col items-center gap-8 w-[395px]">
            <AnimatePresence mode="wait">
              {isChatOpen && (
                <div className="flex flex-col items-center gap-6 w-full">
                  <motion.div 
                    key="chat-panel"
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 40 }}
                    className={`relative w-[320px] rounded-[3rem] shadow-2xl overflow-visible flex flex-col ${isDarkMode ? 'bg-slate-900/95 border border-white/10' : 'bg-white/95 border border-black/5'}`}
                  >
                    {/* Header Info */}
                    <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b border-white/5 relative">
                      {/* Avatar Robot moved into header */}
                      <div className="absolute -top-12 -left-2 scale-50 origin-bottom-left">
                         <AetherRobot 
                           isSpeaking={isSpeaking}
                           isBlinking={isBlinking}
                           isChatOpen={isChatOpen}
                           robotState={robotState}
                           layoutId="aether-main-avatar"
                           onClick={() => {}}
                         />
                      </div>
                      
                      <div className="flex flex-col ml-14">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                            {mainCategory === 'time' && <Timer size={14} className="text-orange-500" />}
                            {mainCategory === 'podcast' && <Headphones size={14} className="text-orange-500" />}
                            {mainCategory === 'calendar' && <Calendar size={14} className="text-orange-500" />}
                          </div>
                          <span className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                            {mainCategory === 'time' ? '专注时钟' : 
                             mainCategory === 'podcast' ? 'AI 播客' : '日程助手'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <motion.div 
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-2 h-2 rounded-full bg-cyan-400"
                          />
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {conversationState === 'listening' ? 'AETHER LISTENING' : 
                             conversationState === 'thinking' ? 'AETHER THINKING' : 
                             conversationState === 'speaking' ? 'AETHER SPEAKING' : 'AETHER IDLE'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setIsChatOpen(false); setConversationState('idle'); setIsVoiceActive(false); }} 
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 border ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10' : 'bg-slate-50 border-black/5 text-slate-400 hover:bg-slate-100'}`}
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Messages Area */}
                    <div 
                      ref={chatScrollRef}
                      className="px-6 pb-8 flex flex-col gap-4 h-[400px] overflow-y-auto scroll-smooth scrollbar-hide"
                    >
                      <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : (msg.role === 'bot' ? -20 : 0), y: 10 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : (msg.role === 'bot' ? 'justify-start' : 'justify-center w-full my-2')}`}
                          >
                            {msg.role === 'system' ? (
                              <div className="flex flex-col items-center gap-1.5 opacity-80 max-w-[85%]">
                                {msg.source && <span className="text-[10px] text-orange-600/80 font-bold bg-orange-100/50 px-2.5 py-0.5 rounded-full tracking-wider">{msg.source}</span>}
                                <div className="text-orange-900/80 text-center text-[11px] font-medium tracking-wide bg-orange-50/50 px-4 py-1.5 rounded-full border border-orange-100/60 leading-relaxed shadow-sm">
                                  {msg.text}
                                </div>
                              </div>
                            ) : (
                              <div className={`max-w-[90%] p-4 rounded-[2rem] text-[13px] leading-relaxed font-bold shadow-sm ${
                                msg.role === 'user' 
                                  ? 'bg-orange-50 text-orange-900 rounded-tr-none border border-orange-100' 
                                  : (isDarkMode ? 'bg-white/5 text-slate-200 rounded-tl-none border border-white/10' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-md')
                              }`}>
                                {msg.text}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {interimUserText && (
                        <motion.div 
                          initial={{ opacity: 0, x: 20, y: 10 }}
                          animate={{ opacity: 0.8, x: 0, y: 0 }}
                          className="flex justify-end"
                        >
                          <div className="max-w-[90%] p-4 rounded-[2rem] text-[13px] leading-relaxed font-bold shadow-sm bg-orange-50 text-orange-900/60 rounded-tr-none border border-orange-100">
                            {interimUserText}
                          </div>
                        </motion.div>
                      )}

                      {conversationState === 'thinking' && (
                        <div className="flex justify-start">
                          <div className="flex gap-1 p-3">
                            {[0, 1, 2].map(i => (
                              <motion.div 
                                key={i}
                                animate={{ y: [0, -4, 0] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                                className="w-1 h-1 rounded-full bg-orange-400"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Separated Voice Controls */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-4 w-full mt-4"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUserMessage("比特森林在哪？")}
                      className={`w-[245px] h-16 rounded-full flex items-center justify-center gap-5 cursor-pointer transition-all ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-black/5 shadow-xl'}`}
                    >
                      <div className="flex gap-1.5 items-center">
                        {[1, 2, 3, 4, 5].map(i => (
                          <motion.div 
                            key={i}
                            animate={conversationState === 'listening' ? { 
                              height: [10, i === 3 ? 32 : (i === 2 || i === 4 ? 24 : 16), 10],
                            } : { height: 8 }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                            className="w-2 rounded-full bg-orange-500"
                          />
                        ))}
                      </div>
                      <span className="text-base font-black text-orange-500 tracking-widest">请说话...</span>
                    </motion.div>

                    {/* Suggestion Tags */}
                    <div className="flex flex-wrap justify-center gap-2 max-w-[282px]">
                      {suggestions.slice(0, 3).map((tag, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.05, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                          onClick={() => handleUserMessage(tag)}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-all border ${
                            isDarkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-black/5 text-slate-500'
                          }`}
                        >
                          {tag}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className={`flex flex-col items-center relative z-10 pb-0`}>
              <AnimatePresence>
                {!isChatOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative flex flex-col items-center z-20"
                  >
                    <AetherRobot 
                      isSpeaking={isSpeaking}
                      isBlinking={isBlinking}
                      isChatOpen={isChatOpen}
                      robotState={robotState}
                      layoutId="aether-main-avatar"
                      onClick={() => {
                        const newIsOpen = !isChatOpen;
                        setIsChatOpen(newIsOpen);
                        if (newIsOpen) {
                          setLastInteractionTime(Date.now());
                          if (startVoiceModeRef.current) {
                            startVoiceModeRef.current();
                          }
                        } else {
                          setConversationState('idle');
                          setIsVoiceActive(false);
                          agentService.disconnectLiveVoice();
                        }
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`flex flex-col items-center gap-0 mt-1 transition-all duration-300 ${isChatOpen ? 'opacity-0 pointer-events-none absolute' : 'opacity-100 relative z-10'}`}>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isVoiceActive ? stopVoiceMode : startVoiceMode}
                  className="flex flex-col items-center gap-0 cursor-pointer group"
                >
                  <div className="flex gap-2 items-center justify-center h-12">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.div 
                        key={i}
                        animate={isVoiceActive ? { 
                          height: [8, i === 3 ? 32 : (i === 2 || i === 4 ? 24 : 16), 8],
                          opacity: 1
                        } : { 
                          height: [4, 6, 4],
                          opacity: 0.6
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: isVoiceActive ? 0.6 : 3, 
                          delay: i * 0.12,
                          ease: "easeInOut"
                        }}
                        className={`w-1.5 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.4)] ${isVoiceActive ? 'bg-cyan-400' : 'bg-cyan-400/40'}`}
                      />
                    ))}
                  </div>
                  <span className={`text-[10px] font-black tracking-[0.3em] pl-[0.3em] uppercase ${isDarkMode ? 'text-cyan-400/60' : 'text-cyan-500/60'}`}>
                    叫名字对话
                  </span>
                </motion.button>
              </div>
          </div>
        </div>
      </div>
    </div>

      {/* Theme Toggle */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed bottom-8 left-8 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-90 z-20 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}
      >
        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ${!isDarkMode ? '.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); }' : ''}
      `}</style>
    </div>
  );
}



