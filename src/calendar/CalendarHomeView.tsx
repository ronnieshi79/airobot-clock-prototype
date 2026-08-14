import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Sparkles, Clock, CheckSquare, Square, X, CalendarIcon, CloudSun, CalendarDays, Bot, Target, Brain, ChevronRight, Bell, Gift } from 'lucide-react';
import { ScheduleItem, TodoItem, MainCategory, SubCategory, ScheduleType } from '../types';
import { getTodayInfo } from './utils';
import { isScheduleOnDate } from './useSchedule';
import { RecommendationStrip } from '../components/RecommendationStrip';
import { SchedulePlannerOverlay } from './SchedulePlannerOverlay';

interface CalendarHomeViewProps {
  isDarkMode: boolean;
  todos: TodoItem[];
  schedules: ScheduleItem[];
  time: Date;
  onNavigate: (cat: MainCategory, sub: SubCategory) => void;
  onShowLogbook: () => void;
  onShowPlanner?: (item?: ScheduleItem | TodoItem, date?: Date) => void;
  onTriggerReminder?: (item: { type: 'schedule' | 'todo' | ScheduleType; item: ScheduleItem | TodoItem }) => void;
}

export const CalendarHomeView: React.FC<CalendarHomeViewProps> = ({
  isDarkMode,
  todos = [],
  schedules = [],
  time,
  onNavigate,
  onShowLogbook,
  onShowPlanner,
  onTriggerReminder
}) => {
  const [isPlanningOpen, setIsPlanningOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{id: string, type: 'schedule' | 'todo' | ScheduleType} | null>(null);
  
  const todayInfo = getTodayInfo(time);
  
  // Find all schedules matching today (including yearly festivals and birthdays)
  const todaySchedules = schedules.filter(s => isScheduleOnDate(s, time));

  const handleOpenPlanner = (id?: string, type?: 'schedule' | 'todo' | ScheduleType) => {
    let itemObj: ScheduleItem | TodoItem | undefined = undefined;
    if (id) {
      itemObj = schedules.find(s => s.id === id) || todos.find(t => t.id === id);
    }
    if (onShowPlanner) {
      onShowPlanner(itemObj, time);
    } else {
      if (id && type) {
        setSelectedItem({ id, type });
      } else {
        setSelectedItem(null);
      }
      setIsPlanningOpen(true);
    }
  };

  const renderTypeIcon = (type?: ScheduleType) => {
    switch (type) {
      case 'festival':
        return <Sparkles size={13} className="text-rose-500" />;
      case 'birthday':
        return <Gift size={13} className="text-pink-500" />;
      case 'todo':
        return <CheckSquare size={13} className="text-emerald-500" />;
      case 'regular':
      default:
        return <Clock size={13} className="text-amber-500" />;
    }
  };

  const getTypeBadgeLabel = (item: ScheduleItem) => {
    if (item.type === 'festival') return '节日';
    if (item.type === 'birthday') return '生日';
    if (item.type === 'todo') return '待办';
    return item.time || '日程';
  };

  return (
    <>
      <div className="w-full h-full flex flex-col gap-4 overflow-hidden relative">
        {/* 1. Header with slogan */}
        <div className="mb-4 flex-shrink-0 pr-12 flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                <Calendar size={20} />
              </div>
              <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                AI 日历
              </h2>
            </div>
            <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Aether 帮你规划日程安排，请直接语音指示
            </p>
          </div>
        </div>

        {/* 2. Main functional area (Left standalone card, Right content card) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row gap-5 pr-1 items-start pb-4">
          
         {/* Left Date Card (Standalone) */}
         <div className={`w-full md:w-[130px] shrink-0 rounded-[2.5rem] flex flex-col items-center justify-center py-8 text-white bg-gradient-to-b from-[#ff8c00] to-[#e55d00] shadow-xl relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <span className="text-xs font-black tracking-[0.2em] mb-2 opacity-90">
              {time.toLocaleDateString('zh-CN', { month: 'long' })}
            </span>
            <span className="text-6xl font-black tracking-tighter mb-4 leading-none">
              {time.getDate()}
            </span>
            <div className="w-8 h-1 bg-white/30 rounded-full mb-3"></div>
            <span className="text-sm font-black tracking-widest opacity-90">
              {time.toLocaleDateString('zh-CN', { weekday: 'long' })}
            </span>
         </div>

         {/* Right Info Area Card */}
         <div className={`flex-1 min-w-0 p-6 rounded-[2.5rem] flex flex-col ${isDarkMode ? 'bg-slate-800/60 border border-white/5' : 'bg-slate-50 border border-slate-100'} shadow-sm`}>
            {/* Weather & Date Tags row */}
            <div className="flex flex-wrap gap-3 items-center mb-6">
               <span className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-sm ${isDarkMode ? 'bg-gradient-to-br from-sky-500/20 to-sky-600/10 text-sky-400 border border-sky-500/20' : 'bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd]/50 text-sky-700 border border-[#bae6fd]'}`}>
                 <CloudSun size={15} />
                 {todayInfo.weather.condition} {todayInfo.weather.temp}
               </span>
               <span className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-sm ${isDarkMode ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/20' : 'bg-gradient-to-br from-amber-100 to-orange-50 text-amber-700 border border-amber-200'}`}>
                 {todayInfo.lunarDate}
               </span>
               <span className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-sm ${todayInfo.festival ? (isDarkMode ? 'bg-gradient-to-br from-rose-500/20 to-pink-500/10 text-rose-400 border border-rose-500/20' : 'bg-gradient-to-br from-rose-100 to-pink-50 text-rose-700 border border-rose-200') : (isDarkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-white shadow-sm text-slate-500 border border-slate-200')}`}>
                 {todayInfo.festival ? <Sparkles size={15} /> : <CalendarDays size={15} />}
                 {todayInfo.festival ? todayInfo.festival : '无节假日'}
               </span>
            </div>

            {/* Today's Affairs / Schedules */}
            <div className="flex items-center justify-between mb-4">
               <h4 className={`text-xs font-black tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>今日重要日程与待办</h4>
            </div>
            
            <div className="flex flex-col gap-3.5 h-[240px]">
              {todaySchedules.slice(0, 3).map((item, idx) => {
                const itemType = item.type || 'regular';
                const isItemClosed = item.status === 'closed' || item.completed;
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={`h-item-${item.id}`}
                    onClick={() => onTriggerReminder?.({ type: itemType, item })}
                    className={`flex items-center gap-4 p-4 rounded-[1.5rem] shrink-0 cursor-pointer transition-all ${
                      isDarkMode ? 'bg-slate-700/50 hover:bg-slate-600 border border-transparent' : 'bg-white shadow-md shadow-slate-200/50 border border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-black/5 dark:bg-white/10 shrink-0 ml-1">
                      {renderTypeIcon(itemType)}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className={`text-sm font-bold truncate ${isItemClosed ? 'line-through opacity-50' : ''} ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {item.task}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                          itemType === 'festival' || itemType === 'birthday' 
                            ? 'bg-rose-500/15 text-rose-500' 
                            : itemType === 'todo'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : 'bg-amber-500/15 text-amber-600'
                        }`}>
                          {getTypeBadgeLabel(item)}
                        </span>
                        {item.isAllDay && (
                          <span className="text-[9px] font-bold text-slate-400">全天</span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`p-1.5 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                        isDarkMode 
                          ? 'text-indigo-400 bg-indigo-500/10' 
                          : 'text-indigo-600 bg-indigo-50'
                      }`}
                      title="点击查看日程提醒卡"
                    >
                      <Bell size={13} />
                    </div>
                  </motion.div>
                );
              })}
              {todaySchedules.length === 0 && (
                <div className={`p-4 rounded-2xl border border-dashed ${isDarkMode ? 'border-white/10' : 'border-slate-200'} text-center`}>
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>今日无特定日程事务</span>
                </div>
              )}
              {todaySchedules.length > 3 && (
                 <button 
                   onClick={() => handleOpenPlanner()}
                   className={`mt-1 flex items-center justify-center font-bold py-2 rounded-[1.2rem] hover:opacity-80 transition-opacity cursor-pointer text-xs ${isDarkMode ? 'bg-slate-700/30 text-slate-400 hover:text-slate-300' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                 >
                   查看其余 {todaySchedules.length - 3} 项日程安排 <ChevronRight size={14} className="ml-1" />
                 </button>
              )}
            </div>

         </div>

        </div>

        {/* 3. Bottom Aether Reminders */}
        <RecommendationStrip
          isDarkMode={isDarkMode}
          time={time}
          schedules={schedules}
          todos={todos}
          todayInfo={todayInfo}
          onNavigate={(cat, sub) => {
            onNavigate(cat, sub);
          }}
          onAction={(actionId) => {
            if (actionId === 'planner') {
              handleOpenPlanner();
            } else if (actionId === 'logbook') {
              onShowLogbook();
            }
          }}
          isFocusRunning={false}
          isTimerRunning={false}
          alarmCount={0}
          module="calendar"
        />
      </div>

      {/* 4. Schedule Planning Skeuomorphic Modal (Overlay) */}
      <SchedulePlannerOverlay 
        isOpen={isPlanningOpen} 
        onClose={() => setIsPlanningOpen(false)} 
        isDarkMode={isDarkMode}
        schedules={schedules}
        todos={todos}
        initialItem={selectedItem || undefined}
        todayInfo={todayInfo}
        time={time}
      />
    </>
  );
};
