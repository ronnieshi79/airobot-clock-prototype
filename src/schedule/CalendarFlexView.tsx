import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, CloudSun, Sparkles, Brain, Clock, ChevronDown, ChevronUp, Bot, CheckSquare, Square, Sun, Cloud, CloudRain, Wind } from 'lucide-react';
import { ScheduleItem, TodoItem, MainCategory, SubCategory } from '../types';
import { getTodayInfo } from './utils';
import { SchedulePlannerOverlay } from './SchedulePlannerOverlay';

interface CalendarFlexViewProps {
  isDarkMode: boolean;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  todos?: TodoItem[];
  schedules: ScheduleItem[];
  time: Date;
  onNavigate: (cat: MainCategory, sub: SubCategory) => void;
  onToggleTodo?: (id: string) => void;
  onShowPlanner?: (item?: ScheduleItem | TodoItem) => void;
}

const getLocalDateString = (d: Date) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getWeekNumber = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export const CalendarFlexView: React.FC<CalendarFlexViewProps> = ({ 
  isDarkMode, 
  selectedDate,
  setSelectedDate,
  todos = [],
  schedules, 
  time,
  onNavigate,
  onToggleTodo,
  onShowPlanner
}) => {
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [activePlannerItem, setActivePlannerItem] = useState<{ id: string, type: 'schedule' | 'todo' } | undefined>(undefined);

  const openPlanner = (item?: { id: string, type: 'schedule' | 'todo' }) => {
    let itemObj: ScheduleItem | TodoItem | undefined = undefined;
    if (item) {
      if (item.type === 'todo') itemObj = todos.find(t => t.id === item.id);
      else itemObj = schedules.find(s => s.id === item.id);
    }
    if (onShowPlanner) {
      onShowPlanner(itemObj);
    } else {
      setActivePlannerItem(item);
      setPlannerOpen(true);
    }
  };

  // Month grid logic
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthName = selectedDate.toLocaleString('zh-CN', { month: 'long' });
  const weekNumber = getWeekNumber(selectedDate);

  const dayInfo = getTodayInfo(selectedDate);

  const getWeatherIcon = (condition: string) => {
    if (condition.includes('晴')) return <Sun size={10} />;
    if (condition.includes('云')) return <Cloud size={10} />;
    if (condition.includes('雨')) return <CloudRain size={10} />;
    return <Wind size={10} />;
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      {/* 1. Header & Controls */}
      <div className="mb-2 flex-shrink-0 pr-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              AI 月历
            </h2>
          </div>
        </div>
      </div>

      {/* Dynamic Grid */}
      <div className="flex-1 px-1 flex flex-col mt-2 h-full">
        <div className="flex items-baseline gap-2 mb-4 pl-2">
          <span className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            {selectedDate.getFullYear()}年
          </span>
          <span className="text-xl font-black text-indigo-500 tracking-widest">{monthName}</span>
          <span className={`text-xs py-1 px-2 ml-1 rounded-md font-black tracking-widest relative top-[-2px] ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
            第 {weekNumber} 周
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
            <span key={d} className={`text-xs font-black uppercase tracking-[0.1em] ${i === 0 || i === 6 ? 'text-indigo-400' : 'text-slate-400'}`}>{d}</span>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 gap-2 auto-rows-fr pb-2 h-full min-h-[350px]">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="rounded-2xl" />)}
          {monthDays.map(d => {
            const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d);
            const isTodayLocal = getLocalDateString(date) === getLocalDateString(time);
            const isSelected = getLocalDateString(date) === getLocalDateString(selectedDate);
            const hasItems = schedules.some(s => (s.date === getLocalDateString(date)) || (!s.date && s.dayOfWeek === date.getDay()));
            
            const cellInfo = getTodayInfo(date);
            const displayLunar = cellInfo.festival || cellInfo.solarTerm || cellInfo.lunarDate.replace(/农历.*月/, '');

            return (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                key={`m-${d}`} 
                onClick={() => {
                  setSelectedDate(date);
                  openPlanner();
                }}
                className={`p-1.5 rounded-2xl flex flex-col items-center justify-start transition-all relative overflow-hidden ${
                  isTodayLocal 
                    ? (isDarkMode ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-900/50' : 'bg-indigo-500 text-white shadow-md shadow-indigo-200')
                    : isSelected 
                      ? (isDarkMode ? 'bg-slate-700 ring-2 ring-indigo-500 text-white' : 'bg-white ring-2 ring-indigo-500 text-slate-800 shadow-sm')
                      : (isDarkMode ? 'bg-slate-800/40 text-slate-300 hover:bg-slate-700' : 'bg-white/60 border border-slate-100 hover:bg-white hover:shadow-sm text-slate-600')
                }`}
              >
                <div className="flex w-full justify-between items-start mb-0.5 px-0.5">
                  <span className={`text-lg font-black leading-none ${isTodayLocal ? 'text-white' : (isDarkMode ? 'text-slate-200' : 'text-slate-700')}`}>
                    {d}
                  </span>
                  {hasItems && (
                    <div className={`w-1.5 h-1.5 mt-1 rounded-full ${isTodayLocal ? 'bg-white' : 'bg-indigo-500'}`} />
                  )}
                </div>

                <div className={`text-[9px] font-bold leading-tight mt-auto text-center truncate w-full ${
                  cellInfo.festival 
                    ? (isTodayLocal ? 'text-indigo-100' : 'text-rose-500') 
                    : cellInfo.solarTerm
                      ? (isTodayLocal ? 'text-indigo-100' : 'text-emerald-500')
                      : (isTodayLocal ? 'text-indigo-200' : (isDarkMode ? 'text-slate-500' : 'text-slate-400'))
                }`}>
                  {displayLunar}
                </div>

                {/* Always show weather icon + temp */}
                <div className={`flex items-center justify-center gap-0.5 mt-0.5 text-[9px] font-bold ${
                  isTodayLocal ? 'text-white/80' : (isDarkMode ? 'text-sky-400/80' : 'text-sky-600/80')
                }`}>
                  {getWeatherIcon(cellInfo.weather.condition)}
                  <span className="scale-90 origin-left">{cellInfo.weather.temp}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Bottom Aether Prompt */}
      <div className="absolute bottom-0 left-2 right-8 flex-shrink-0 z-20">
        <div className={`px-5 py-3.5 rounded-[2rem] border flex items-start gap-3 transition-all shadow-xl backdrop-blur-xl ${
          isDarkMode ? 'bg-indigo-900/60 border-indigo-500/30' : 'bg-indigo-50/90 border-indigo-200'
        }`}>
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex flex-shrink-0 items-center justify-center mt-0.5 relative">
            <Bot size={16} className="text-indigo-500" />
            <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
          </div>
          <div className="flex flex-col gap-1 mt-0.5">
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>AETHER 提示</p>
            <p className={`text-xs font-bold leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {(() => {
                const monthSchedulesCount = schedules.filter(s => {
                  if (s.date) {
                    const sDate = new Date(s.date);
                    return sDate.getFullYear() === selectedDate.getFullYear() && sDate.getMonth() === selectedDate.getMonth();
                  }
                  return true; 
                }).length;

                const monthFestivals = monthDays.map(d => getTodayInfo(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d)).festival).filter(Boolean);
                const uniqueFestivals = Array.from(new Set(monthFestivals)).slice(0, 2);

                return `主人，本月是${monthName}，您有 ${monthSchedulesCount} 项日程安排。${uniqueFestivals.length > 0 ? `本月包含 ${uniqueFestivals.join(' 和 ')} 等重要节日。` : ''}季节更替，请注意实时天气变化！`;
              })()}
            </p>
          </div>
        </div>
      </div>
      
      <SchedulePlannerOverlay 
        isOpen={plannerOpen} 
        onClose={() => setPlannerOpen(false)} 
        isDarkMode={isDarkMode}
        schedules={schedules}
        todos={todos}
        initialItem={activePlannerItem}
        todayInfo={dayInfo}
        time={time}
      />
    </div>
  );
};
