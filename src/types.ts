export type MainCategory = 'time' | 'calendar' | 'podcast';
export type SubCategory = 'home' | 'clock' | 'timer' | 'focus' | 'today' | 'calendar-view' | 'weekly' | 'podcast-home' | 'podcast-library' | 'podcast-subscribe' | 'podcast-player' | 'alarm' | 'calendar-home' | 'calendar-flex' | 'calendar-list' | 'podcast-story' | 'podcast-news' | 'podcast-knowledge' | 'calendar-schedule' | 'calendar-todo';

export interface Message {
  role: 'user' | 'bot' | 'system';
  text: string;
  source?: string;
  isStreaming?: boolean;
}

export interface ScheduleItem {
  id: string;
  time: string;
  task: string;
  completed: boolean;
  dayOfWeek: number; // 0-6
  date?: string; // Optional absolute date (YYYY-MM-DD)
  category?: string;
  title?: string; // For backward compatibility with constants.ts
}

export interface TodoItem {
  id: string;
  task: string;
  status: 'open' | 'closed';
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  createdAt: number;
}

export interface WeatherInfo {
  temp: string;
  condition: string;
  icon: string;
  advice: string;
}

export interface CardState {
  type: 'knowledge' | 'story' | 'info';
  title: string;
  content: string;
  image: string | null;
}

export type ActiveCard = CardState;

export type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface AlarmItem {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  days: number[]; // 0-6
  type: 'workday' | 'everyday' | 'temporary';
  repeatCount: number; // 唤醒次数
  interval: number; // 间隔时间 (minutes)
  voiceMode: 'gentle' | 'standard' | 'urgent';
  requireName: boolean; // 是否需要叫名字关闭
}

export interface PresetItem {
  id: string;
  label: string;
  seconds: number;
  reminderInterval?: number; // in seconds
  bgMusic?: string; // music identifier or url
  musicEnabled?: boolean;
  mode?: 'timer' | 'focus';
}

export interface AlarmHistoryItem {
  id: string;
  label: string;
  time: string;
  triggerTime: number;
  insight?: string;
}

export interface TimerHistoryItem {
  id: string;
  label: string;
  duration: number;
  timestamp: number;
  insight?: string;
}

export interface FocusHistoryItem {
  id: string;
  task: string;
  duration: number;
  targetDuration?: number;
  startTime: number;
  insight?: string;
}
