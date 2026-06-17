import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, CloudSun, Sparkles, Brain, Clock, ChevronDown, ChevronUp, Bot, CheckSquare, Square } from 'lucide-react';
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
  onToggleTodo
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [activePlannerItem, setActivePlannerItem] = useState<{ id: string, type: 'schedule' | 'todo' } | undefined>(undefined);

  const openPlanner = (item: { id: string, type: 'schedule' | 'todo' }) => {
    setActivePlannerItem(item);
    setPlannerOpen(true);
  };


  // Month grid logic
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Week grid logic (finding the start of the week for the selected date)
  const selectedDateDayOfWeek = selectedDate.getDay();
  const startOfWeekDate = new Date(selectedDate);
  startOfWeekDate.setDate(selectedDate.getDate() - selectedDateDayOfWeek);
  const weekDaysDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeekDate);
    d.setDate(startOfWeekDate.getDate() + i);
    return d;
  });

  const monthName = selectedDate.toLocaleString('zh-CN', { month: 'long' });
  const weekNumber = getWeekNumber(selectedDate);
  const dayInfo = getTodayInfo(selectedDate);
  const selectedDateStr = getLocalDateString(selectedDate);
  const diffDays = Math.round((new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime() - new Date(time.getFullYear(), time.getMonth(), time.getDate()).getTime()) / 86400000);
  let relativeTimeStr = '';
  if (diffDays === 0) relativeTimeStr = '今天';
  else if (diffDays === -1) relativeTimeStr = '昨天';
  else if (diffDays === 1) relativeTimeStr = '明天';
  else if (diffDays === 2) relativeTimeStr = '后天';
  else if (diffDays === -2) relativeTimeStr = '前天';
  else if (diffDays > 0) relativeTimeStr = `${diffDays}天后`;
  else relativeTimeStr = `${Math.abs(diffDays)}天前`;

  const selectedDateSchedules = schedules.filter(s => {
    if (s.date) return s.date === selectedDateStr;
    return s.dayOfWeek === selectedDate.getDay();
  });

  const selectedDateTodos = todos.filter(t => t.date === selectedDateStr);

  const filteredItems = [
    ...selectedDateTodos.map(t => ({ type: 'todo' as const, data: t })),
    ...selectedDateSchedules.map(s => ({ type: 'schedule' as const, data: s }))
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* 1. Header & Controls */}
      <div className="mb-4 flex-shrink-0 pr-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              AI 日历
            </h2>
          </div>
        </div>

        <button
          onClick={() => setViewMode(prev => prev === 'month' ? 'week' : 'month')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
            isDarkMode 
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {viewMode === 'month' ? (
            <>收起月历 <ChevronUp size={14} /></>
          ) : (
            <>展开月历 <ChevronDown size={14} /></>
          )}
        </button>
      </div>

      {/* Dynamic Grid */}
      <div className="flex-shrink-0 mb-4 px-2">
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            {selectedDate.getFullYear()}年
          </span>
          <span className="text-sm font-black text-indigo-500 tracking-widest">{monthName}</span>
          <span className={`text-[10px] py-1 px-2 ml-1 rounded-md font-black tracking-widest relative top-[-1px] ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
            第 {weekNumber} 周
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
            <span key={d} className={`text-[10px] font-black uppercase tracking-[0.1em] ${i === 0 || i === 6 ? 'text-indigo-400' : 'text-slate-400'}`}>{d}</span>
          ))}
        </div>

        <div className="overflow-hidden relative transition-all duration-300">
           <AnimatePresence mode="wait">
             {viewMode === 'month' ? (
                <motion.div 
                  key="month-grid"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="grid grid-cols-7 gap-1 justify-items-center"
                >
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="h-8 w-8" />)}
                  {monthDays.map(d => {
                    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d);
                    const isTodayLocal = getLocalDateString(date) === getLocalDateString(time);
                    const isSelected = getLocalDateString(date) === getLocalDateString(selectedDate);
                    const hasItems = schedules.some(s => (s.date === getLocalDateString(date)) || (!s.date && s.dayOfWeek === date.getDay()));

                    return (
                      <button 
                        key={`m-${d}`} 
                        onClick={() => setSelectedDate(date)}
                        className={`h-8 w-8 rounded-full flex flex-col items-center justify-center text-sm font-bold transition-all relative ${
                          isTodayLocal ? 'bg-indigo-500 text-white shadow-md' : 
                          isSelected ? (isDarkMode ? 'bg-white/20 text-white ring-1 ring-indigo-500' : 'bg-slate-200 text-slate-800 ring-1 ring-indigo-500') :
                          (isDarkMode ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100')
                        }`}
                      >
                        <span>{d}</span>
                        {hasItems && !isTodayLocal && <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-indigo-500' : 'bg-slate-400'}`} />}
                      </button>
                    );
                  })}
                </motion.div>
             ) : (
                <motion.div 
                  key="week-grid"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="grid grid-cols-7 gap-1 justify-items-center"
                >
                  {weekDaysDates.map(date => {
                    const d = date.getDate();
                    const isTodayLocal = getLocalDateString(date) === getLocalDateString(time);
                    const isSelected = getLocalDateString(date) === getLocalDateString(selectedDate);
                    const hasItems = schedules.some(s => (s.date === getLocalDateString(date)) || (!s.date && s.dayOfWeek === date.getDay()));

                    return (
                      <button 
                        key={`w-${d}`} 
                        onClick={() => setSelectedDate(date)}
                        className={`h-8 w-8 rounded-full flex flex-col items-center justify-center text-sm font-bold transition-all relative ${
                          isTodayLocal ? 'bg-indigo-500 text-white shadow-md' : 
                          isSelected ? (isDarkMode ? 'bg-white/20 text-white ring-1 ring-indigo-500' : 'bg-slate-200 text-slate-800 ring-1 ring-indigo-500') :
                          (isDarkMode ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100')
                        }`}
                      >
                        <span>{d}</span>
                        {hasItems && !isTodayLocal && <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-indigo-500' : 'bg-slate-400'}`} />}
                      </button>
                    );
                  })}
                </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Selected Date Details */}
      <div className="flex-1 overflow-hidden flex flex-col pt-2 pb-2 min-h-0">
         <div className="flex items-center gap-2 pl-1 mb-2 shrink-0">
            <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>当日安排</h4>
            <span className={`text-[10px] font-bold ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-500'} px-2 py-0.5 rounded-full`}>
              {relativeTimeStr} · {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
            </span>
         </div>
         
         <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 relative pr-1">
           <AnimatePresence>
             {filteredItems.length > 0 ? filteredItems.map(item => {
               if (item.type === 'todo') {
                 const todo = item.data;
                 return (
                   <motion.div
                     onClick={() => openPlanner({ id: todo.id, type: 'todo' })}
                     key={`todo-${todo.id}`}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                       isDarkMode ? 'bg-slate-800/60 border-white/5 hover:bg-slate-800' : 'bg-white border-slate-100 shadow-sm hover:bg-slate-50'
                     }`}
                   >
                     <button 
                       onClick={(e) => { e.stopPropagation(); onToggleTodo && onToggleTodo(todo.id); }}
                       className={`flex-shrink-0 mt-0.5 transition-colors ${
                         todo.status === 'closed' ? 'text-emerald-500' : (isDarkMode ? 'text-slate-500 hover:text-slate-400' : 'text-slate-300 hover:text-slate-400')
                       }`}
                     >
                       {todo.status === 'closed' ? <CheckSquare size={18} /> : <Square size={18} />}
                     </button>
                     
                     <div className="flex-1 min-w-0">
                       <h4 className={`text-xs font-black break-words mt-0.5 ${todo.status === 'closed' ? 'line-through opacity-50' : ''} ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                         {todo.task}
                       </h4>
                       <div className={`flex items-center gap-2 mt-1.5 text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                         <span className={`px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>待办</span>
                         {todo.time && (
                           <span className="flex items-center gap-1">
                             <Clock size={10} />
                             {todo.time}
                           </span>
                         )}
                       </div>
                     </div>
                   </motion.div>
                 );
               } else {
                 const schedule = item.data;
                 return (
                   <motion.div
                     onClick={() => openPlanner({ id: schedule.id, type: 'schedule' })}
                     key={`schedule-${schedule.id}`}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                       isDarkMode ? 'bg-slate-800/60 border-white/5 hover:bg-slate-800' : 'bg-white border-slate-100 shadow-sm hover:bg-slate-50'
                     }`}
                   >
                     <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-500'}`}>
                       <CalendarIcon size={10} />
                     </div>
                     
                     <div className="flex-1 min-w-0">
                       <h4 className={`text-xs font-black break-words mt-0.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                         {schedule.task}
                       </h4>
                       <div className={`flex items-center gap-2 mt-1.5 text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                         <span className={`px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>日程安排</span>
                         {schedule.time && (
                           <span className="flex items-center gap-1">
                             <Clock size={10} />
                             {schedule.time}
                           </span>
                         )}
                       </div>
                     </div>
                   </motion.div>
                 );
               }
             }) : (
               <div className="pl-2 py-4">
                 <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>这一天还没有事务与日程。</span>
               </div>
             )}
           </AnimatePresence>
         </div>
      </div>
      
      {/* Selected Date Lunar & Weather Widget */}
      <div className={`mt-2 p-4 rounded-3xl shrink-0 flex flex-row items-center justify-between gap-4 shadow-sm border ${isDarkMode ? 'bg-slate-800/60 border-white/5' : 'bg-white border-slate-100'}`}>
         {/* Lunar Calendar Part */}
         <div className="flex items-center gap-3">
           <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl border-2 ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
             <span className="text-[10px] font-black uppercase opacity-60 relative top-0.5">{selectedDate.getFullYear()}</span>
             <span className="text-[18px] font-black leading-none">{selectedDate.getDate()}</span>
           </div>
           <div className="flex flex-col gap-0.5">
             <span className={`text-sm font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
               农历 {dayInfo.lunarDate}
             </span>
             <div className="flex items-center gap-1.5 flex-wrap">
               {dayInfo.festival && (
                 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>
                   {dayInfo.festival}
                 </span>
               )}
               {dayInfo.solarTerm && (
                 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                   {dayInfo.solarTerm}
                 </span>
               )}
               {!dayInfo.festival && !dayInfo.solarTerm && (
                 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                   平日
                 </span>
               )}
             </div>
           </div>
         </div>

         <div className={`w-[1px] h-10 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>

         {/* Weather Part */}
         <div className="flex items-center gap-3 pr-2">
            <div className={`flex flex-col items-end gap-0.5`}>
              <span className={`text-sm font-black ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {dayInfo.weather.condition}
              </span>
              <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {dayInfo.weather.temp}
              </span>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-500'}`}>
              <CloudSun size={20} />
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
